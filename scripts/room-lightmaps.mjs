/** Small offline lightmap atlas for large planar surfaces. Colors include baked light. */
import * as THREE from 'three';
import { createCanvas } from '@napi-rs/canvas';

const SIZE = 2048;
const PAD = 8;
const DENSITY = 28;
const camera = new THREE.Vector3();
const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

function planarCharts(part, eye) {
  const geometry = part.geometry;
  const p = geometry.attributes.position, normals = geometry.attributes.normal;
  if (part.unlit || (part.material.map && part.surface !== 'wood') || part.material.transparent || p.count > 72) return null;
  geometry.computeBoundingBox();
  const size = geometry.boundingBox.getSize(new THREE.Vector3());
  if (Math.max(size.x, size.y, size.z) < 1.8) return null;
  const charts = new Map();
  const index = geometry.index;
  for (let i = 0; i < (index?.count || p.count); i += 3) {
    const ids = [0, 1, 2].map(j => index ? index.getX(i + j) : i + j);
    const normal = new THREE.Vector3().fromBufferAttribute(normals, ids[0]).normalize();
    if (ids.some(j => normal.dot(new THREE.Vector3().fromBufferAttribute(normals, j).normalize()) < .9999)) return null;
    a.fromBufferAttribute(p, ids[0]); b.fromBufferAttribute(p, ids[1]); c.fromBufferAttribute(p, ids[2]);
    if (b.clone().sub(a).cross(c.clone().sub(a)).lengthSq() < 1e-10) continue;
    // A closed box's outward faces behind the stationary eye cannot be visible.
    // They still remain in the occluder BVH used to compute the lighting.
    if (part.closedBox && normal.dot(camera.copy(eye).sub(a)) <= 0) continue;
    const key = normal.toArray().map(v => Math.round(v * 10000)).join(',') + ':' + Math.round(normal.dot(a) * 10000);
    if (!charts.has(key)) {
      const tangent = new THREE.Vector3(Math.abs(normal.y) > .9 ? 1 : 0, Math.abs(normal.y) > .9 ? 0 : 1, 0).cross(normal).normalize();
      charts.set(key, { part, normal, tangent, bitangent: normal.clone().cross(tangent), distance: normal.dot(a), triangles: [], minU: Infinity, minV: Infinity, maxU: -Infinity, maxV: -Infinity });
    }
    const chart = charts.get(key);
    const triangle = [a, b, c].map((v, corner) => {
      const u = v.dot(chart.tangent), w = v.dot(chart.bitangent);
      chart.minU = Math.min(chart.minU, u); chart.maxU = Math.max(chart.maxU, u);
      chart.minV = Math.min(chart.minV, w); chart.maxV = Math.max(chart.maxV, w);
      const uv = geometry.attributes.uv;
      return { p: v.toArray(), u, v: w, tex: uv ? [uv.getX(ids[corner]), uv.getY(ids[corner])] : [0, 0] };
    });
    chart.triangles.push(triangle);
  }
  if (!charts.size) return null;
  const density = part.surface === 'wood' ? 48 : DENSITY;
  for (const chart of charts.values()) {
    chart.width = Math.max(2, Math.min(850, Math.ceil((chart.maxU - chart.minU) * density) + 1));
    chart.height = Math.max(2, Math.min(850, Math.ceil((chart.maxV - chart.minV) * density) + 1));
  }
  return [...charts.values()];
}

const srgb = value => {
  value = Math.max(0, Math.min(1, value));
  return Math.round(255 * (value <= .0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - .055));
};

// Detect discontinuities in illumination, never in the source wood grain. The
// slope check rejects a smooth light/AO ramp even when it has a large gradient.
function lightingEdgeMask(light, coverage, width, height) {
  const edges = new Uint8Array(width * height);
  const valid = (x, y) => x >= 0 && x < width && y >= 0 && y < height && coverage[(y * width + x) * 4 + 3] !== 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (!valid(x, y)) continue;
    const index = y * width + x;
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
      if (!valid(x + dx, y + dy)) continue;
      const next = (y + dy) * width + x + dx;
      const before = valid(x - dx, y - dy) ? ((y - dy) * width + x - dx) * 6 : -1;
      const after = valid(x + dx * 2, y + dy * 2) ? ((y + dy * 2) * width + x + dx * 2) * 6 : -1;
      for (let channel = 0; channel < 6; channel++) {
        const first = light[index * 6 + channel], second = light[next * 6 + channel];
        const delta = second - first;
        const threshold = .045 + .04 * Math.max(Math.abs(first), Math.abs(second));
        if (Math.abs(delta) <= threshold) continue;
        const bend = Math.max(before < 0 ? 0 : Math.abs(delta - (first - light[before + channel])),
          after < 0 ? 0 : Math.abs(light[after + channel] - second - delta));
        // Two isolated neighbours cannot distinguish a ramp from a step. Other
        // directions still catch edges on wider chart interiors without treating
        // an entire two-texel-wide beam as a shadow boundary.
        if (bend > threshold * .6) {
          edges[index] = 1; edges[next] = 1;
          break;
        }
      }
    }
  }
  return edges;
}

/** MaxRects keeps gaps below short charts usable instead of reserving a full shelf. */
function reserveRectangle(freeRects, used) {
  const remaining = [];
  for (const rect of freeRects) {
    if (used.x >= rect.x + rect.width || used.x + used.width <= rect.x
      || used.y >= rect.y + rect.height || used.y + used.height <= rect.y) {
      remaining.push(rect);
      continue;
    }
    if (used.x > rect.x) remaining.push({ ...rect, width: used.x - rect.x });
    if (used.x + used.width < rect.x + rect.width) remaining.push({ ...rect, x: used.x + used.width, width: rect.x + rect.width - used.x - used.width });
    if (used.y > rect.y) remaining.push({ ...rect, height: used.y - rect.y });
    if (used.y + used.height < rect.y + rect.height) remaining.push({ ...rect, y: used.y + used.height, height: rect.y + rect.height - used.y - used.height });
  }
  // Free rectangles may overlap each other, so subtract each placement from ALL
  // of them. Remove contained rectangles, retaining one of any identical pair.
  return remaining.filter((rect, i) => !remaining.some((other, j) => i !== j
    && other.x <= rect.x && other.y <= rect.y
    && other.x + other.width >= rect.x + rect.width && other.y + other.height >= rect.y + rect.height
    && (j < i || other.x !== rect.x || other.y !== rect.y || other.width !== rect.width || other.height !== rect.height)));
}

/** Keeps complex/curved surfaces in the vertex bake, unwrapping only flat architecture. */
export function bakePlanarLightmaps(parts, lighting, eye) {
  const charted = new Set();
  const charts = parts.flatMap(part => {
    const result = planarCharts(part, eye);
    if (result) charted.add(part);
    return result || [];
  }).sort((a, b) => b.height - a.height || b.width - a.width);
  const atlases = [];
  for (const chart of charts) {
    const w = chart.width + PAD * 2, h = chart.height + PAD * 2;
    if (w > SIZE || h > SIZE) throw new Error('Lightmap chart exceeds atlas bounds');
    let placement;
    for (const candidate of atlases) {
      for (const rect of candidate.freeRects) {
        if (rect.width < w || rect.height < h) continue;
        const short = Math.min(rect.width - w, rect.height - h);
        const long = Math.max(rect.width - w, rect.height - h);
        if (!placement || short < placement.short || (short === placement.short && long < placement.long)) {
          placement = { atlas: candidate, x: rect.x, y: rect.y, short, long };
        }
      }
    }
    if (!placement) {
      const canvas = createCanvas(SIZE, SIZE);
      Object.defineProperty(canvas, 'data', { value: undefined });
      const context = canvas.getContext('2d');
      const atlas = { canvas, context, pixels: context.createImageData(SIZE, SIZE), freeRects: [{ x: 0, y: 0, width: SIZE, height: SIZE }] };
      atlases.push(atlas);
      placement = { atlas, x: 0, y: 0 };
    }
    const { atlas, x, y } = placement;
    chart.x = x + PAD; chart.y = y + PAD; chart.atlas = atlas;
    atlas.freeRects = reserveRectangle(atlas.freeRects, { x, y, width: w, height: h });
  }
  const point = new THREE.Vector3(), texUv = new THREE.Vector2();
  const textures = new Map();
  const linear = value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  function texel(texture, u, v, lod) {
    if (!textures.has(texture)) {
      texture.updateMatrix();
      const image = texture.image;
      const bytes = image.getContext('2d').getImageData(0, 0, image.width, image.height).data;
      let width = image.width, height = image.height;
      let data = new Float32Array(width * height * 3);
      for (let i = 0; i < width * height; i++) for (let channel = 0; channel < 3; channel++) data[i * 3 + channel] = linear(bytes[i * 4 + channel] / 255);
      const levels = [{ data, width, height }];
      while (width > 1 || height > 1) {
        const w = Math.max(1, width >> 1), h = Math.max(1, height >> 1), next = new Float32Array(w * h * 3);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let channel = 0; channel < 3; channel++) {
          for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) next[(y * w + x) * 3 + channel] += data[(Math.min(height - 1, y * 2 + dy) * width + Math.min(width - 1, x * 2 + dx)) * 3 + channel] * .25;
        }
        data = next; width = w; height = h; levels.push({ data, width, height });
      }
      textures.set(texture, levels);
    }
    const levels = textures.get(texture);
    const { data, width, height } = levels[Math.min(levels.length - 1, lod)];
    texture.transformUv(texUv.set(u, v));
    const x = texUv.x * (width - 1), y = texUv.y * (height - 1);
    const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(width - 1, x0 + 1), y1 = Math.min(height - 1, y0 + 1);
    const fx = x - x0, fy = y - y0;
    return [0, 1, 2].map(channel => {
      const read = (px, py) => data[(py * width + px) * 3 + channel];
      return (read(x0, y0) * (1 - fx) + read(x1, y0) * fx) * (1 - fy) + (read(x0, y1) * (1 - fx) + read(x1, y1) * fx) * fy;
    });
  }
  let texels = 0, antialiasedTexels = 0, extraLightSamples = 0;
  let chartCount = 0;
  for (const chart of charts) {
    if (++chartCount % 100 === 0) console.log(`  lightmaps ${chartCount}/${charts.length} charts`);
    const { normal, tangent, bitangent, part, width, height, atlas } = chart;
    const local = new Uint8Array(width * height * 4);
    const linearLight = new Float32Array(width * height * 6);
    const reflectance = part.material.map ? new Float32Array(width * height * 3) : null;
    const sampleTriangles = [];
    const rangeU = Math.max(1e-8, chart.maxU - chart.minU), rangeV = Math.max(1e-8, chart.maxV - chart.minV);
    const base = part.material.color.toArray();
    for (const triangle of chart.triangles) {
      const pts = triangle.map(v => [(v.u - chart.minU) / rangeU * (width - 1), (v.v - chart.minV) / rangeV * (height - 1)]);
      const [p0, p1, p2] = pts;
      const denom = (p1[1] - p2[1]) * (p0[0] - p2[0]) + (p2[0] - p1[0]) * (p0[1] - p2[1]);
      if (Math.abs(denom) < 1e-8) continue;
      sampleTriangles.push({ p0, p1, p2, denom });
      // Filter source grain to the atlas texel footprint; point sampling dense
      // wood lines into narrow beams would turn them into visible moiré patterns.
      let lod = 0;
      if (part.material.map) {
        const du1 = triangle[1].tex[0] - triangle[0].tex[0], du2 = triangle[2].tex[0] - triangle[0].tex[0];
        const dv1 = triangle[1].tex[1] - triangle[0].tex[1], dv2 = triangle[2].tex[1] - triangle[0].tex[1];
        const dx1 = p1[0] - p0[0], dx2 = p2[0] - p0[0], dy1 = p1[1] - p0[1], dy2 = p2[1] - p0[1];
        const determinant = dx1 * dy2 - dx2 * dy1;
        const tw = part.material.map.image.width * part.material.map.repeat.x, th = part.material.map.image.height * part.material.map.repeat.y;
        const footprint = Math.max(Math.hypot((du1 * dy2 - du2 * dy1) * tw, (dv1 * dy2 - dv2 * dy1) * th), Math.hypot((du2 * dx1 - du1 * dx2) * tw, (dv2 * dx1 - dv1 * dx2) * th)) / Math.abs(determinant);
        lod = Math.max(0, Math.ceil(Math.log2(Math.max(1, footprint))));
      }
      const loX = Math.max(0, Math.floor(Math.min(...pts.map(p => p[0])))), hiX = Math.min(width - 1, Math.ceil(Math.max(...pts.map(p => p[0]))));
      const loY = Math.max(0, Math.floor(Math.min(...pts.map(p => p[1])))), hiY = Math.min(height - 1, Math.ceil(Math.max(...pts.map(p => p[1]))));
      for (let y = loY; y <= hiY; y++) for (let x = loX; x <= hiX; x++) {
        const idx = (y * width + x) * 4;
        if (local[idx + 3]) continue;
        const s = ((p1[1] - p2[1]) * (x - p2[0]) + (p2[0] - p1[0]) * (y - p2[1])) / denom;
        const t = ((p2[1] - p0[1]) * (x - p2[0]) + (p0[0] - p2[0]) * (y - p2[1])) / denom;
        if (s < -.002 || t < -.002 || s + t > 1.002) continue;
        point.copy(normal).multiplyScalar(chart.distance).addScaledVector(tangent, chart.minU + x / (width - 1) * rangeU).addScaledVector(bitangent, chart.minV + y / (height - 1) * rangeV);
        const light = lighting.shade(point.x, point.y, point.z, normal.x, normal.y, normal.z, part.surface);
        const textureColor = part.material.map ? texel(part.material.map,
          s * triangle[0].tex[0] + t * triangle[1].tex[0] + (1 - s - t) * triangle[2].tex[0],
          s * triangle[0].tex[1] + t * triangle[1].tex[1] + (1 - s - t) * triangle[2].tex[1], lod) : [1, 1, 1];
        linearLight.set(light, (y * width + x) * 6);
        if (reflectance) reflectance.set(textureColor, (y * width + x) * 3);
        for (let channel = 0; channel < 3; channel++) local[idx + channel] = srgb(base[channel] * textureColor[channel] * light[channel] + light[channel + 3]);
        local[idx + 3] = 255; texels++;
      }
    }
    const edges = lightingEdgeMask(linearLight, local, width, height);
    const insideChart = (x, y) => {
      // Test the union, not just the triangle that supplied the centre sample:
      // adjacent floor triangles must not acquire a diagonal AA seam.
      for (const { p0, p1, p2, denom } of sampleTriangles) {
        const s = ((p1[1] - p2[1]) * (x - p2[0]) + (p2[0] - p1[0]) * (y - p2[1])) / denom;
        const t = ((p2[1] - p0[1]) * (x - p2[0]) + (p0[0] - p2[0]) * (y - p2[1])) / denom;
        if (s >= -1e-6 && t >= -1e-6 && s + t <= 1.000001) return true;
      }
      return false;
    };
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const pixel = y * width + x;
      if (!edges[pixel]) continue;
      const sum = [0, 0, 0, 0, 0, 0];
      let count = 0, closestToCenter = Infinity;
      // Integer x/y already denote texel centres. A 4x4 grid integrates just
      // this footprint; it does not blur neighboring texels or surface textures.
      for (const dy of [-.375, -.125, .125, .375]) for (const dx of [-.375, -.125, .125, .375]) {
        const sx = x + dx, sy = y + dy;
        if (!insideChart(sx, sy)) continue;
        point.copy(normal).multiplyScalar(chart.distance)
          .addScaledVector(tangent, chart.minU + sx / (width - 1) * rangeU)
          .addScaledVector(bitangent, chart.minV + sy / (height - 1) * rangeV);
        const sample = lighting.shade(point.x, point.y, point.z, normal.x, normal.y, normal.z, part.surface);
        let difference = 0;
        for (let channel = 0; channel < 6; channel++) {
          sum[channel] += sample[channel];
          const center = linearLight[pixel * 6 + channel];
          difference = Math.max(difference, Math.abs(sample[channel] - center) / (.045 + .04 * Math.max(Math.abs(sample[channel]), Math.abs(center))));
        }
        closestToCenter = Math.min(closestToCenter, difference);
        count++; extraLightSamples++;
      }
      if (!count) continue;
      // A very thin frame shadow may hit the known centre but miss all sixteen
      // strata. Retain that evidence with one sample, rather than erasing it.
      if (closestToCenter > 1 && insideChart(x, y)) {
        for (let channel = 0; channel < 6; channel++) sum[channel] += linearLight[pixel * 6 + channel];
        count++;
      }
      for (let channel = 0; channel < 3; channel++) {
        const color = base[channel] * (reflectance ? reflectance[pixel * 3 + channel] : 1);
        local[pixel * 4 + channel] = srgb((color * sum[channel] + sum[channel + 3]) / count);
      }
      antialiasedTexels++;
    }
    // Dilate charts for bilinear/mip filtering without leaking a neighboring panel.
    for (let pass = 0; pass < PAD; pass++) {
      const previous = local.slice();
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (previous[idx + 3]) continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const source = (ny * width + nx) * 4;
          if (previous[source + 3]) { local.set(previous.subarray(source, source + 4), idx); break; }
        }
      }
    }
    for (let y = -PAD; y < height + PAD; y++) for (let x = -PAD; x < width + PAD; x++) {
      const src = (Math.max(0, Math.min(height - 1, y)) * width + Math.max(0, Math.min(width - 1, x))) * 4;
      const dest = ((chart.y + y) * SIZE + chart.x + x) * 4;
      atlas.pixels.data.set(local.subarray(src, src + 4), dest);
    }
  }
  for (const atlas of atlases) {
    atlas.context.putImageData(atlas.pixels, 0, 0);
    const texture = new THREE.CanvasTexture(atlas.canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.name = 'Offline architecture lighting';
    atlas.material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    atlas.material.userData.prebakedAtlas = true;
  }
  const mappedParts = charts.map(chart => {
    const positions = [], uvs = [], normals = [];
    for (const triangle of chart.triangles) for (const v of triangle) {
      positions.push(...v.p); normals.push(...chart.normal.toArray());
      uvs.push((chart.x + .5 + (v.u - chart.minU) / Math.max(1e-8, chart.maxU - chart.minU) * (chart.width - 1)) / SIZE,
        1 - (chart.y + .5 + (v.v - chart.minV) / Math.max(1e-8, chart.maxV - chart.minV) * (chart.height - 1)) / SIZE);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    return { ...chart.part, geometry, material: chart.atlas.material, unlit: true, lightmapped: true };
  });
  console.log(`  ${charts.length} planar lightmap charts, ${atlases.length} × ${SIZE}px atlases, ${texels} lit texels`);
  console.log(`  shadow edge AA: ${antialiasedTexels} texels, ${extraLightSamples} extra light samples (${(100 * extraLightSamples / Math.max(1, texels)).toFixed(1)}% of the centre pass)`);
  return { parts: [...parts.filter(part => !charted.has(part)), ...mappedParts], stats: { atlases: atlases.length, lightmapTexels: texels, lightmapCharts: charts.length } };
}
