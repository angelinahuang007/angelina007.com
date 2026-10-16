/**
 * Offline authoring pipeline. Rebuild with `npm run bake:rooms` after modeling changes.
 * No ray tracing, lights, or scene construction runs on visitors' devices.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { createCanvas, CanvasElement } from '@napi-rs/canvas';
import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, meshopt, prune } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import { bakePlanarLightmaps } from './room-lightmaps.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public/rooms');
await fs.mkdir(path.join(root, '.cache/rooms'), { recursive: true });
await fs.mkdir(out, { recursive: true });

globalThis.HTMLCanvasElement = CanvasElement;
globalThis.document = {
  createElement(tag) {
    if (tag !== 'canvas') throw new Error(`Unsupported offline element: ${tag}`);
    const canvas = createCanvas(1, 1);
    // napi's data() method must not be mistaken for a Three DataTexture buffer.
    Object.defineProperty(canvas, 'data', { value: undefined });
    return canvas;
  },
};
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(value => { this.result = value; this.onloadend?.(); });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then(value => {
      this.result = `data:${blob.type};base64,${Buffer.from(value).toString('base64')}`;
      this.onloadend?.();
    });
  }
};

const bundle = path.join(root, '.cache/rooms/authoring.mjs');
await build({
  stdin: {
    contents: `export { buildStudio } from './src/components/home/scene/studio'; export { buildLab } from './src/components/home/scene/lab';`,
    resolveDir: root, loader: 'ts',
  },
  outfile: bundle, bundle: true, platform: 'node', format: 'esm', packages: 'external',
});
const authoring = await import(`${bundle}?v=${Date.now()}`);

function inherited(object, key) {
  for (let current = object; current; current = current.parent) {
    if (current.userData[key] !== undefined) return current.userData[key];
  }
  return undefined;
}

/** Subdivide large surfaces so the baked shadows resolve between furniture legs. */
function tessellate(source, edge) {
  const geometry = source.index ? source.toNonIndexed() : source.clone();
  const p = geometry.attributes.position, n = geometry.attributes.normal, uv = geometry.attributes.uv;
  const positions = [], normals = [], uvs = [];
  function vertex(i) {
    return [p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i), uv?.getX(i) || 0, uv?.getY(i) || 0];
  }
  const distance2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  function split(a, b, c, depth = 0) {
    const ab = distance2(a, b), bc = distance2(b, c), ca = distance2(c, a);
    // Long, thin decorative strips don't need dense triangles along their length.
    const areaSquared = Math.max(0, (2 * ab * bc + 2 * bc * ca + 2 * ca * ab - ab * ab - bc * bc - ca * ca) / 16);
    if (Math.max(ab, bc, ca) > edge * edge && areaSquared > edge ** 4 * .014 && depth < 13) {
      if (bc > ab && bc >= ca) return split(b, c, a, depth);
      if (ca > ab && ca > bc) return split(c, a, b, depth);
      const m = a.map((v, i) => (v + b[i]) * .5);
      const length = Math.hypot(m[3], m[4], m[5]) || 1;
      for (let i = 3; i < 6; i++) m[i] /= length;
      split(a, m, c, depth + 1); split(m, b, c, depth + 1);
    } else {
      for (const v of [a, b, c]) {
        positions.push(v[0], v[1], v[2]); normals.push(v[3], v[4], v[5]); uvs.push(v[6], v[7]);
      }
    }
  }
  for (let i = 0; i < p.count; i += 3) split(vertex(i), vertex(i + 1), vertex(i + 2));
  geometry.dispose();
  const result = new THREE.BufferGeometry();
  result.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  result.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  if (uv) result.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  return result;
}

const configs = {
  studio: {
    edge: .36, aoDistance: .9, aoStrength: .52, ambient: [.43, .42, .39], sky: [.09, .12, .16],
    lights: [
      { pos: [-4.1, 7.65, -2.9], color: [1, .86, .66], power: 1.28, radius: .8, reach: 9, samples: 6 },
      { pos: [0, 3.8, -6.9], color: [.73, .85, 1], power: .65, radius: 1.2, reach: 6, samples: 4 },
      { pos: [-7.0, 2.28, -4.3], color: [1, .84, .59], power: .44, radius: .08, reach: 1.6, samples: 2,
        direction: [-.29, -.956, .064], innerAngle: 25, outerAngle: 55 },
    ],
    sun: { dir: [-.48, .80, -.36], color: [1, .88, .69], power: 1.55 },
  },
  lab: {
    edge: .48, aoDistance: 1.25, aoStrength: .66, ambient: [.25, .30, .42], sky: [.07, .10, .16],
    lights: [
      ...Array.from({ length: 8 }, (_, i) => ({
        pos: [-.5 + Math.cos(i * Math.PI / 4) * 3.9, 6.92, -4.6 + Math.sin(i * Math.PI / 4) * 3.9],
        color: [.72, .88, 1], power: .90, radius: .13, reach: 6.6, samples: 1,
        direction: [0, -1, 0], innerAngle: 28, outerAngle: 59,
      })),
      // Hooded gantry lamps form local pools and cast shadows from the railings.
      ...[-5.8, 5.6].map(x => ({
        pos: [x, 6.06, -9.1], color: [1, .87, .63], power: 2.35, radius: .28, reach: 6.4, samples: 3,
        direction: [0, -1, .38], innerAngle: 18, outerAngle: 37,
      })),
      ...[.3, 3.4, 6.6].map(z => ({
        pos: [-8.1, 2.78, z], color: [.48, .79, 1], power: 2.35, radius: .16, reach: 3.7, samples: 3,
        direction: [.25, -1, 0], innerAngle: 22, outerAngle: 46,
      })),
      { pos: [8.9, 6.5, -3], color: [.23, .43, 1], power: .9, radius: 1.5, reach: 7, samples: 3 },
      { pos: [4.2, .65, -5], color: [1, .82, .46], power: 1.25, radius: .2, reach: 2.2, samples: 2 },
      { pos: [-4.2, .9, -5.5], color: [1, .86, .56], power: .75, radius: .2, reach: 2.4, samples: 2 },
      { pos: [-7.5, 4.5, 2], color: [.72, .86, 1], power: .5, radius: .6, reach: 5, samples: 2 },
      ...[-.95, .95].map(dx => ({
        pos: [1.8 + dx, 5.55, 8.85], color: [.68, .86, 1], power: 2.05, radius: .12, reach: 5.8, samples: 3,
        direction: [0, -1, -.25], innerAngle: 22, outerAngle: 44,
      })),
      // Broad indirect fill from the illuminated service floor, not a new fixture.
      // The canopy is behind the chassis face, so direct power alone cannot light it.
      { pos: [1.8, 2.3, 6.9], color: [.55, .73, 1], power: .3, radius: .8, reach: 3.5, samples: 4 },
      { pos: [-6.95, 4.5, 10.3], color: [.86, .91, 1], power: 1.0, radius: .3, reach: 3, samples: 2 },
      // The two short inserts on the open stair wash its approach, offline only.
      ...[.97, 2.28].map(s => ({
        pos: [-4.72, (3.53 / 4.2) * s - .165, 8.425 - s],
        color: [.4, .76, 1], power: .65, radius: .025, reach: 2.6, samples: 2,
        direction: [.55, -1, 0], innerAngle: 24, outerAngle: 58,
      })),
      { pos: [7.65, 4.88, 2.6], color: [.48, .78, 1], power: 3.4, radius: .18, reach: 5.6, samples: 3,
        direction: [-.16, -1, 0], innerAngle: 23, outerAngle: 47 },
      { pos: [8.06, 2.67, -.94], color: [.12, .47, 1], power: 2.0, radius: .1, reach: 3.5, samples: 3,
        direction: [-.995, -.1, 0], innerAngle: 20, outerAngle: 65 },
    ],
  },
};

function makeLighting(bvh, config, eye) {
  const ray = new THREE.Ray();
  const position = new THREE.Vector3(), normal = new THREE.Vector3();
  const tangent = new THREE.Vector3(), bitangent = new THREE.Vector3(), direction = new THREE.Vector3();
  const cache = new Map();
  const eyePosition = new THREE.Vector3(...eye), view = new THREE.Vector3(), half = new THREE.Vector3();
  const finishes = { paint: [.2, 48], metal: [.36, 85], rubber: [.015, 8], wood: [.055, 18], cloth: [.008, 5], plaster: [0, 1] };
  const samples = 18;
  const hemisphere = Array.from({ length: samples }, (_, i) => {
    const t = (i + .5) / samples, r = Math.sqrt(t), a = i * 2.399963229728653;
    return [r * Math.cos(a), r * Math.sin(a), Math.sqrt(1 - t)];
  });
  const sources = config.lights.flatMap(light => Array.from({ length: light.samples }, (_, i) => {
    const a = i * 2.39996, r = light.radius * Math.sqrt((i + .5) / light.samples);
    return {
      ...light,
      pos: new THREE.Vector3(light.pos[0] + Math.cos(a) * r, light.pos[1], light.pos[2] + Math.sin(a) * r),
      power: light.power / light.samples,
      axis: light.direction ? new THREE.Vector3(...light.direction).normalize() : null,
      innerCos: Math.cos((light.innerAngle ?? 30) * Math.PI / 180),
      outerCos: Math.cos((light.outerAngle ?? 50) * Math.PI / 180),
    };
  }));
  const sunDir = config.sun ? new THREE.Vector3(...config.sun.dir).normalize() : null;
  let rayCount = 0, sampleCount = 0;
  function hit(dir, far) {
    ray.direction.copy(dir); rayCount++;
    return bvh.raycastFirst(ray, THREE.DoubleSide, .006, far);
  }
  function shade(x, y, z, nx, ny, nz, surface = 'plaster') {
    const key = `${Math.round(x * 1600)},${Math.round(y * 1600)},${Math.round(z * 1600)},${Math.round(nx * 100)},${Math.round(ny * 100)},${Math.round(nz * 100)}:${surface}`;
    if (cache.has(key)) return cache.get(key);
    sampleCount++;
    position.set(x, y, z); normal.set(nx, ny, nz).normalize();
    view.copy(eyePosition).sub(position).normalize();
    const [shine, exponent] = finishes[surface] || finishes.plaster;
    const specular = [0, 0, 0];
    ray.origin.copy(position).addScaledVector(normal, .018);
    tangent.set(Math.abs(normal.y) > .9 ? 1 : 0, Math.abs(normal.y) > .9 ? 0 : 1, 0).cross(normal).normalize();
    bitangent.crossVectors(normal, tangent);
    let occlusion = 0;
    for (const [hx, hy, hz] of hemisphere) {
      direction.copy(tangent).multiplyScalar(hx).addScaledVector(bitangent, hy).addScaledVector(normal, hz);
      const obstruction = hit(direction, config.aoDistance);
      if (obstruction) occlusion += 1 - Math.min(1, obstruction.distance / config.aoDistance) ** .65;
    }
    const ao = 1 - config.aoStrength * occlusion / samples;
    const skyFactor = .4 + .6 * Math.max(normal.y, 0);
    const illumination = config.ambient.map((value, i) => (value + config.sky[i] * skyFactor) * ao);
    // Low-frequency diffuse bounce from the floor. This is calculated once offline.
    if (normal.y < .7) {
      const bounce = Math.max(0, 1 - y / 5) * .075 * ao;
      illumination[0] += bounce; illumination[1] += bounce * .77; illumination[2] += bounce * .5;
    }
    for (const light of sources) {
      direction.copy(light.pos).sub(position);
      const distance = direction.length(); direction.divideScalar(distance || 1);
      const cosine = Math.max(0, normal.dot(direction));
      if (cosine < .012) continue;
      // A shaped emitter is evaluated only during baking. Its soft edge and
      // occlusion become pixels in the existing atlas, with no runtime lights.
      const coneT = light.axis ? THREE.MathUtils.clamp((-direction.dot(light.axis) - light.outerCos) / (light.innerCos - light.outerCos), 0, 1) : 1;
      const cone = coneT * coneT * (3 - 2 * coneT);
      const falloff = cone / (1 + (distance / light.reach) ** 2.5);
      if (cosine * falloff * light.power < .006) continue;
      if (hit(direction, Math.max(.01, distance - .07))) continue;
      const intensity = cosine * falloff * light.power;
      // The viewer rotates from one stationary point: its static surface response
      // can be baked too, with no per-frame specular shader or reflection pass.
      half.copy(direction).add(view).normalize();
      const sheen = shine * Math.pow(Math.max(0, normal.dot(half)), exponent) * falloff * light.power;
      for (let i = 0; i < 3; i++) {
        illumination[i] += light.color[i] * intensity;
        specular[i] += light.color[i] * sheen;
      }
    }
    if (sunDir) {
      const cosine = Math.max(0, normal.dot(sunDir));
      if (cosine > 0 && !hit(sunDir, 40)) {
        for (let i = 0; i < 3; i++) illumination[i] += config.sun.color[i] * config.sun.power * cosine;
      }
    }
    const result = [...illumination, ...specular];
    // Texture texels are mostly unique; keep the cache bounded during atlas baking.
    if (cache.size < 250000) cache.set(key, result);
    return result;
  }
  return { shade, stats: () => ({ samples: sampleCount, rays: rayCount }) };
}

async function bake(mode) {
  const start = performance.now();
  const config = configs[mode];
  const room = mode === 'studio' ? authoring.buildStudio() : authoring.buildLab();
  room.root.updateMatrixWorld(true);
  const parts = [], blockers = [];
  room.root.traverse(mesh => {
    if (!(mesh instanceof THREE.Mesh)) return;
    if (!(mesh.material instanceof THREE.MeshBasicMaterial)) throw new Error('Use unlit material for authored surfaces');
    const unlit = inherited(mesh, 'bakeUnlit') === true;
    const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    // Authored planar panels are double-sided. Bake the side visible from the
    // fixed room viewpoint, including roof panels whose winding faces outward.
    if (mesh.material.side === THREE.DoubleSide) {
      const normals = geometry.attributes.normal;
      const first = new THREE.Vector3().fromBufferAttribute(normals, 0);
      let planar = true;
      for (let i = 1; i < normals.count && planar; i++) planar = first.dot(new THREE.Vector3().fromBufferAttribute(normals, i)) > .999;
      if (planar) {
        geometry.computeBoundingBox();
        const center = geometry.boundingBox.getCenter(new THREE.Vector3());
        if (first.dot(new THREE.Vector3(...room.camera.position).sub(center)) < 0) {
          for (let i = 0; i < normals.count; i++) normals.setXYZ(i, -normals.getX(i), -normals.getY(i), -normals.getZ(i));
        }
      }
    }
    if (!unlit && inherited(mesh, 'bakeNoOcclude') !== true && !mesh.material.transparent) {
      const blocker = geometry.index ? geometry.toNonIndexed() : geometry.clone();
      for (const key of Object.keys(blocker.attributes)) if (key !== 'position') blocker.deleteAttribute(key);
      blockers.push(blocker);
    }
    const hex = mesh.material.color.getHexString();
    const surface = inherited(mesh, 'surface') || (mode === 'lab' && ['164caf', '2a60bd', '14356f', 'd2cfb9'].includes(hex) ? 'paint' : hex === '9aabb7' ? 'metal' : 'plaster');
    parts.push({ geometry, material: mesh.material, unlit, surface, closedBox: mesh.geometry.type === 'BoxGeometry', name: mesh.name || mesh.parent?.name });
  });
  const occluders = mergeGeometries(blockers, false);
  const bvh = new MeshBVH(occluders, { maxLeafSize: 8 });
  const lighting = makeLighting(bvh, config, room.camera.position);
  if (process.env.BAKE_REPORT && config.sun) {
    for (const x of [-3, -2, -1, 0, 1, 2]) {
      const ray = new THREE.Ray(new THREE.Vector3(x, .075, -2), new THREE.Vector3(...config.sun.dir).normalize());
      const obstruction = bvh.raycastFirst(ray, THREE.DoubleSide, .006, 40);
      console.log('sun probe', x, obstruction?.point.toArray() || 'sky', lighting.shade(x, .055, -2, 0, 1, 0));
    }
  }
  const groups = new Map();
  console.log(`${mode}: ${parts.length} surfaces, ${occluders.attributes.position.count / 3} occluder triangles. Baking…`);
  const mapped = bakePlanarLightmaps(parts, lighting, new THREE.Vector3(...room.camera.position));
  let done = 0;
  for (const part of mapped.parts) {
    const { material, unlit } = part;
    const geometry = unlit ? part.geometry.clone() : tessellate(part.geometry, config.edge);
    const p = geometry.attributes.position, n = geometry.attributes.normal;
    const colors = new Uint8Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const light = unlit ? [1, 1, 1, 0, 0, 0] : lighting.shade(p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i), part.surface);
      for (let channel = 0; channel < 3; channel++) {
        const base = [material.color.r, material.color.g, material.color.b][channel];
        // Texture reflectance is multiplied later on the GPU. Preserve lighting
        // above 1 instead of clipping sunlight before the texture is sampled.
        const lightScale = material.map && !part.lightmapped ? 2.5 : 1;
        colors[i * 3 + channel] = Math.round(255 * Math.min(1, (base * light[channel] + light[channel + 3]) / lightScale));
      }
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3, true));
    geometry.deleteAttribute('normal'); // KHR_materials_unlit doesn't need normals on the web.
    if (!material.map) geometry.deleteAttribute('uv');
    // Spatial batches trade a few draw calls for useful room-level frustum culling.
    // Whole-room material merging forced every surface through the GPU at every heading.
    geometry.computeBoundingBox();
    const center = geometry.boundingBox.getCenter(new THREE.Vector3());
    const sector = Math.floor((Math.atan2(center.z - room.camera.position[2], center.x - room.camera.position[0]) + Math.PI) / (Math.PI / 4)) % 8;
    const key = `${material.map?.uuid || 'paint'}:${material.transparent}:${material.alphaTest}:${sector}`;
    if (!groups.has(key)) groups.set(key, { material, geometries: [] });
    groups.get(key).geometries.push(geometry.index ? geometry.toNonIndexed() : geometry);
    if (++done % 500 === 0) console.log(`  ${done}/${mapped.parts.length}, ${lighting.stats().samples} light samples`);
  }
  const scene = new THREE.Group(); scene.name = room.name;
  let triangles = 0, vertices = 0;
  for (const { material: source, geometries } of groups.values()) {
    const merged = mergeGeometries(geometries, false);
    const indexed = mergeVertices(merged, .00001);
    triangles += indexed.index.count / 3; vertices += indexed.attributes.position.count;
    const material = source.clone(); material.color.set(0xffffff); material.vertexColors = true;
    if (source.map && !source.userData.prebakedAtlas) material.userData.bakedLightScale = 2.5;
    // Artwork is solid or cutout, so it needs neither alpha sorting nor a double draw.
    if (source.alphaTest > 0) material.transparent = false;
    const mesh = new THREE.Mesh(indexed, material);
    mesh.name = source.userData.prebakedAtlas ? 'Lightmapped architecture sector' : source.map ? 'Baked artwork and textiles sector' : 'Baked objects sector';
    indexed.computeBoundingBox(); indexed.computeBoundingSphere();
    scene.add(mesh);
  }
  const raw = await new GLTFExporter().parseAsync(scene, { binary: true, onlyVisible: true, maxTextureSize: 2048 });
  await MeshoptEncoder.ready; await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
  const document = await io.readBinary(new Uint8Array(raw));
  await document.transform(dedup(), prune(), meshopt({ encoder: MeshoptEncoder, level: 'high', quantizePosition: 16, quantizeColor: 8, quantizeTexcoord: 14 }));
  const glb = await io.writeBinary(document);
  await fs.writeFile(path.join(out, `${mode}.glb`), Buffer.from(glb));
  const metadata = {
    name: room.name, camera: room.camera, version: createHash('sha256').update(Buffer.from(glb)).digest('hex').slice(0, 12),
    stats: { triangles, vertices, maxDrawCalls: groups.size, bytes: glb.byteLength, ...mapped.stats, ...lighting.stats() },
  };
  await fs.writeFile(path.join(out, `${mode}.json`), JSON.stringify(metadata, null, 2) + '\n');
  console.log(`${mode}: ${(glb.byteLength / 1024 / 1024).toFixed(2)} MB, ${triangles} triangles, ${groups.size} materials, ${((performance.now() - start) / 1000).toFixed(1)}s`);
  blockers.forEach(g => g.dispose()); occluders.dispose();
}

const requested = process.argv.slice(2);
for (const mode of requested.length ? requested : ['studio', 'lab']) {
  if (!configs[mode]) throw new Error(`Unknown room: ${mode}`);
  await bake(mode);
}
