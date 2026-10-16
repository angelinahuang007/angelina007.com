import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { createLookControls } from './controls';
import { disposeRoom, type BuiltRoom } from './kit';

export type RoomMode = 'studio' | 'lab';
export type RoomViewer = Awaited<ReturnType<typeof createRoomViewer>>;

/** Decoded buffer bytes, counting shared/interleaved attribute ranges only once. */
function geometryBytes(root: THREE.Object3D) {
  const ranges = new Map<ArrayBufferLike, Array<[number, number]>>();
  const geometries = new Set<THREE.BufferGeometry>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh) || geometries.has(object.geometry)) return;
    const geometry = object.geometry;
    geometries.add(geometry);
    const attributes = [
      ...Object.values(geometry.attributes),
      ...Object.values(geometry.morphAttributes).flat(),
      ...(geometry.index ? [geometry.index] : []),
    ];
    for (const attribute of attributes) {
      const array = attribute instanceof THREE.InterleavedBufferAttribute ? attribute.data.array : attribute.array;
      const spans = ranges.get(array.buffer) || [];
      spans.push([array.byteOffset, array.byteOffset + array.byteLength]);
      ranges.set(array.buffer, spans);
    }
  });
  let total = 0;
  for (const spans of ranges.values()) {
    spans.sort((a, b) => a[0] - b[0]);
    let start = spans[0][0], end = spans[0][1];
    for (let i = 1; i < spans.length; i++) {
      if (spans[i][0] <= end) end = Math.max(end, spans[i][1]);
      else { total += end - start; [start, end] = spans[i]; }
    }
    total += end - start;
  }
  return total;
}

/** GPU storage estimate; excludes driver overhead and decoded image/CPU copies. */
function textureBytes(root: THREE.Object3D) {
  const textures = new Set<THREE.Texture>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  let total = 0;
  for (const texture of textures) {
    if (texture instanceof THREE.CompressedTexture) {
      total += texture.mipmaps.reduce((sum, mip) => sum + mip.data.byteLength, 0);
      continue;
    }
    // GLB image textures use RGBA8. Float formats are included for future baked maps.
    const bytesPerPixel = texture.type === THREE.FloatType ? 16 : texture.type === THREE.HalfFloatType ? 8 : 4;
    const images = Array.isArray(texture.image) ? texture.image : [texture.image];
    for (const image of images) {
      let width = Math.floor(Number(image?.width || image?.naturalWidth) || 0);
      let height = Math.floor(Number(image?.height || image?.naturalHeight) || 0);
      const depth = Math.max(1, Number(image?.depth) || 1);
      if (width <= 0 || height <= 0) continue;
      total += width * height * depth * bytesPerPixel;
      if (texture.generateMipmaps) {
        while (width > 1 || height > 1) {
          width = Math.max(1, Math.floor(width / 2)); height = Math.max(1, Math.floor(height / 2));
          total += width * height * depth * bytesPerPixel;
        }
      }
    }
  }
  return total;
}

type GpuTimerExtension = { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number };

export async function createRoomViewer(canvas: HTMLCanvasElement, mode: RoomMode, options: {
  onHeading?: (heading: number) => void;
  onTap?: () => void;
  onError: () => void;
}) {
  const response = await fetch(`/rooms/${mode}.json`, { cache: 'no-cache' });
  if (!response.ok) throw new Error('The room metadata could not load');
  const metadata: { camera: BuiltRoom['camera']; name: string; version: string } = await response.json();
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(`/rooms/${mode}.glb?v=${metadata.version}`);
  const scene = new THREE.Scene();
  const desktopFov = 70;
  const camera = new THREE.PerspectiveCamera(desktopFov, 1, 0.06, 100);
  let renderer: THREE.WebGLRenderer | undefined;
  let room: BuiltRoom | undefined = { root: gltf.scene, name: metadata.name, camera: metadata.camera };
  let controls: ReturnType<typeof createLookControls> | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let intersection: IntersectionObserver | undefined;
  let disposed = false, frame = 0, previousTime = 0, inView = true, contextLost = false;
  let renderCount = 0;
  const drawingBuffer = new THREE.Vector2();
  const resolutionSteps = [1, .85, .72];
  let resolutionStep = 0, lastResolutionChange = -Infinity;
  let wasMoving = false, consecutiveFrames = 0, timingRun = 0;
  let slowSamples = 0, slowDuration = 0;
  let timerGl: WebGL2RenderingContext | undefined, timerExtension: GpuTimerExtension | null = null;
  let activeQuery: WebGLQuery | null = null;
  const queries: Array<{ query: WebGLQuery; run: number; interval: number }> = [];

  function resetTiming() {
    wasMoving = false; consecutiveFrames = 0; timingRun++;
    slowSamples = 0; slowDuration = 0;
    delete canvas.dataset.interactionFrameIntervalMs;
  }

  function clearQueries() {
    if (!timerGl) return;
    if (activeQuery) {
      try { if (timerExtension) timerGl.endQuery(timerExtension.TIME_ELAPSED_EXT); } catch { /* Context may be lost. */ }
      timerGl.deleteQuery(activeQuery); activeQuery = null;
    }
    for (const { query } of queries) timerGl.deleteQuery(query);
    queries.length = 0;
  }

  function disableGpuTimer() {
    try { clearQueries(); } catch { /* Diagnostics must not prevent rendering. */ }
    timerExtension = null;
    canvas.dataset.gpuTimer = 'unavailable';
    delete canvas.dataset.gpuDrawMs;
    slowSamples = 0; slowDuration = 0;
  }

  function collectGpuSamples(now: number) {
    if (!timerGl || !timerExtension) return;
    try {
      if (timerGl.getParameter(timerExtension.GPU_DISJOINT_EXT)) {
        clearQueries(); resetTiming();
        canvas.dataset.gpuTimer = 'disjoint'; delete canvas.dataset.gpuDrawMs;
        return;
      }
      while (queries.length && timerGl.getQueryParameter(queries[0].query, timerGl.QUERY_RESULT_AVAILABLE)) {
        const sample = queries.shift()!;
        const elapsed = Number(timerGl.getQueryParameter(sample.query, timerGl.QUERY_RESULT)) / 1_000_000;
        timerGl.deleteQuery(sample.query);
        if (sample.run !== timingRun || !Number.isFinite(elapsed) || elapsed <= 0) continue;
        canvas.dataset.gpuTimer = 'available';
        canvas.dataset.gpuDrawMs = elapsed.toFixed(2);
        // rAF spacing alone cannot distinguish GPU load from a 30 Hz/30 fps cap.
        // Require measured GPU work above 30 ms AND sustained spacing above 40 ms.
        if (elapsed > 30 && sample.interval > 40) {
          slowSamples++; slowDuration += sample.interval;
        } else { slowSamples = 0; slowDuration = 0; }
        if (slowSamples >= 45 && slowDuration >= 2000 && now - lastResolutionChange > 8000
          && resolutionStep < resolutionSteps.length - 1) {
          resolutionStep++; lastResolutionChange = now;
          resize();
          break;
        }
      }
    } catch { disableGpuTimer(); }
  }

  function recordRenderStats() {
    if (!renderer) return;
    renderer.getDrawingBufferSize(drawingBuffer);
    canvas.dataset.drawingBufferWidth = String(drawingBuffer.x);
    canvas.dataset.drawingBufferHeight = String(drawingBuffer.y);
    canvas.dataset.pixelRatio = renderer.getPixelRatio().toFixed(3);
    canvas.dataset.resolutionScale = String(resolutionSteps[resolutionStep]);
    canvas.dataset.drawCalls = String(renderer.info.render.calls);
    canvas.dataset.triangles = String(renderer.info.render.triangles);
    // Submitted triangles after frustum/object culling, not a count of unoccluded pixels.
    canvas.dataset.visibleTriangles = String(renderer.info.render.triangles);
    canvas.dataset.frames = String(++renderCount);
  }

  function invalidate() {
    if (!disposed && !frame && inView && !document.hidden && !contextLost) frame = requestAnimationFrame(render);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    frame = 0;
    // The same rollback handles partial initialization, context loss and normal unmount.
    // Release our listeners before losing the context, which can dispatch another event.
    const cleanup = [
      () => controls?.dispose(),
      clearQueries,
      () => resizeObserver?.disconnect(),
      () => intersection?.disconnect(),
      () => document.removeEventListener('visibilitychange', visibility),
      () => canvas.removeEventListener('webglcontextlost', lost),
      () => { if (room) disposeRoom(room.root); },
      () => renderer?.dispose(),
      () => renderer?.forceContextLoss(),
    ];
    for (const release of cleanup) {
      try { release(); } catch { /* Continue releasing the remaining resources. */ }
    }
  }

  function render(now: number) {
    frame = 0;
    if (disposed || !inView || document.hidden || contextLost || !renderer || !controls) return;
    try {
      const interval = previousTime ? now - previousTime : 0;
      if (!wasMoving || interval <= 0 || interval > 180) resetTiming();
      else consecutiveFrames++;
      const moving = controls.update(Math.min((now - (previousTime || now)) / 1000, 0.05));
      previousTime = now;
      if (!moving) resetTiming();
      const canSample = moving && consecutiveFrames >= 8;
      if (canSample) canvas.dataset.interactionFrameIntervalMs = interval.toFixed(2);
      collectGpuSamples(now);
      let sampleQuery: WebGLQuery | null = null;
      if (canSample && consecutiveFrames >= 8 && timerGl && timerExtension && queries.length < 4) {
        try {
          sampleQuery = timerGl.createQuery();
          if (sampleQuery) { activeQuery = sampleQuery; timerGl.beginQuery(timerExtension.TIME_ELAPSED_EXT, sampleQuery); }
        } catch { disableGpuTimer(); sampleQuery = null; }
      }
      renderer.render(scene, camera);
      if (sampleQuery && timerGl && timerExtension) {
        try {
          timerGl.endQuery(timerExtension.TIME_ELAPSED_EXT); activeQuery = null;
          queries.push({ query: sampleQuery, run: timingRun, interval });
        } catch { disableGpuTimer(); }
      }
      recordRenderStats();
      wasMoving = moving;
      if (moving) invalidate();
    } catch {
      dispose();
      options.onError();
    }
  }

  function resize() {
    if (disposed || !renderer) return;
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return;
    const maxDpr = width < 700 ? 1.25 : 1.5;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr, Math.sqrt(2_100_000 / (width * height))) * resolutionSteps[resolutionStep];
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = width < 700 ? 77 : desktopFov;
    camera.updateProjectionMatrix();
    resetTiming();
    invalidate();
  }

  function visibility() {
    resetTiming();
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else { previousTime = 0; invalidate(); }
  }

  function lost(event: Event) {
    if (disposed) return;
    event.preventDefault();
    contextLost = true;
    dispose();
    options.onError();
  }

  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    const context = renderer.getContext();
    if ('createQuery' in context) {
      timerGl = context as WebGL2RenderingContext;
      try { timerExtension = timerGl.getExtension('EXT_disjoint_timer_query_webgl2') as GpuTimerExtension | null; }
      catch { timerExtension = null; }
    }
    canvas.dataset.gpuTimer = timerExtension ? 'available' : 'unavailable';
    scene.background = new THREE.Color(mode === 'studio' ? '#dad3bf' : '#141e30');
    const anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    const preparedMaterials = new Set<THREE.Material>();
    room.root.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (preparedMaterials.has(material)) continue;
        preparedMaterials.add(material);
        if (material instanceof THREE.MeshBasicMaterial && material.map) {
          material.map.anisotropy = anisotropy;
          // Restore the range used to encode bright baked light in 8-bit colors.
          material.color.multiplyScalar(Number(material.userData.bakedLightScale) || 1);
        }
      }
    });
    scene.add(room.root);
    canvas.dataset.geometryBytes = String(geometryBytes(room.root));
    canvas.dataset.textureBytesEstimate = String(textureBytes(room.root));
    camera.position.set(...room.camera.position);
    camera.lookAt(new THREE.Vector3(...room.camera.target));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    controls = createLookControls(canvas, camera, { reducedMotion, onHeading: options.onHeading, onTap: options.onTap, onChange: invalidate });
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    intersection = new IntersectionObserver(entries => {
      if (disposed || !entries[0]) return;
      resetTiming();
      inView = entries[0].isIntersecting;
      if (inView) { previousTime = 0; invalidate(); }
      else { cancelAnimationFrame(frame); frame = 0; }
    }, { threshold: 0 });
    intersection.observe(canvas);
    document.addEventListener('visibilitychange', visibility);
    canvas.addEventListener('webglcontextlost', lost);
    resize();
    renderer.render(scene, camera);
    recordRenderStats();
    return {
      reset: controls.reset, turn: controls.turn, face: controls.face,
      enableMotion: controls.enableMotion, disableMotion: controls.disableMotion,
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
