import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { SceneKit } from './kit';
import { buildPaintingAlcove } from './studio-painting';
import { buildLibraryPortal } from './studio-portal';

type V3 = [number, number, number];

const C = {
  plaster: '#eee5d4', ceiling: '#f6eddd', floor: '#d1af83', floorLight: '#dfc196',
  oak: '#bd935f', oakLight: '#ddbc83', oakDark: '#927345', ink: '#314965',
  blue: '#3c6086', blueLight: '#7195b3', bluePale: '#b9c9ce', cream: '#f3e8d2',
  linen: '#ddd5bf', mustard: '#ddb45d', metal: '#60646a', charcoal: '#333b46',
  sky: '#a9d8ec', sun: '#f8d99a', brown: '#6e514b', white: '#fff5dd',
};

function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  const resolution = Math.min(1, 1024 / Math.max(width, height));
  canvas.width = Math.round(width * resolution);
  canvas.height = Math.round(height * resolution);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Studio artwork needs a canvas context');
  ctx.scale(resolution, resolution);
  draw(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function ellipse(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, rx: number, ry: number, angle = 0) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
  ctx.fill();
}

function polygon(ctx: CanvasRenderingContext2D, color: string, points: number[][]) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fill();
}

function makeArt() {
  return canvasTexture(720, 960, ctx => {
    ctx.fillStyle = C.cream;
    ctx.fillRect(0, 0, 720, 960);
    ctx.fillStyle = C.blue;
    ctx.fillRect(36, 36, 648, 888);
    ellipse(ctx, C.white, 570, 195, 155, 160);
    polygon(ctx, C.blueLight, [[36, 590], [160, 470], [280, 540], [460, 410], [684, 580], [684, 924], [36, 924]]);
    polygon(ctx, C.mustard, [[36, 760], [170, 615], [310, 685], [420, 580], [580, 730], [684, 690], [684, 924], [36, 924]]);
    polygon(ctx, C.cream, [[36, 810], [160, 790], [330, 864], [530, 765], [684, 830], [684, 924], [36, 924]]);
  });
}

function makeRug() {
  return canvasTexture(1536, 1024, ctx => {
    ctx.fillStyle = '#e9d6ad';
    ctx.fillRect(0, 0, 1536, 1024);
    ctx.fillStyle = '#91a8b8';
    ctx.fillRect(35, 35, 1466, 954);
    polygon(ctx, '#d9b262', [[62, 62], [620, 62], [1040, 380], [320, 962], [62, 962]]);
    polygon(ctx, '#e8d9b9', [[840, 62], [1474, 62], [1474, 962], [1100, 962], [680, 600]]);
    // The plush silhouette and contrasting points are drawn into the textile itself.
    ellipse(ctx, '#6a514c', 718, 594, 570, 275, -.12);
    ellipse(ctx, '#f6ead1', 729, 479, 491, 278, -.15);
    ellipse(ctx, '#ead9bd', 521, 503, 275, 215, -.1);
    ellipse(ctx, '#f6ead1', 560, 467, 248, 198, -.1);
    polygon(ctx, '#6a514c', [[1002, 303], [1042, 104], [1206, 262]]);
    polygon(ctx, '#f6ead1', [[980, 310], [1017, 162], [1132, 287]]);
    polygon(ctx, '#6a514c', [[1228, 307], [1398, 154], [1404, 377]]);
    polygon(ctx, '#f6ead1', [[1254, 321], [1372, 212], [1372, 374]]);
    ellipse(ctx, '#f8ecd7', 1176, 401, 262, 202, .1);
    ellipse(ctx, '#6a514c', 1191, 408, 193, 133, .04);
    ellipse(ctx, '#6a514c', 744, 679, 119, 76, -.1);
    ellipse(ctx, '#6a514c', 1190, 686, 118, 78, .1);
    ellipse(ctx, '#6a514c', 1384, 633, 95, 72, -.2);
    ellipse(ctx, '#8fc6ef', 1110, 387, 48, 31, -.1);
    ellipse(ctx, '#8fc6ef', 1288, 398, 48, 31, .1);
    ellipse(ctx, '#293343', 1121, 383, 15, 26);
    ellipse(ctx, '#293343', 1278, 394, 15, 26);
    ellipse(ctx, C.white, 1125, 375, 6, 7);
    ellipse(ctx, C.white, 1282, 386, 6, 7);
    polygon(ctx, '#473c3d', [[1170, 443], [1220, 446], [1196, 466]]);
    ctx.strokeStyle = '#473c3d';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(1196, 462); ctx.lineTo(1195, 483); ctx.quadraticCurveTo(1178, 497, 1162, 481); ctx.moveTo(1195, 483); ctx.quadraticCurveTo(1213, 499, 1230, 483); ctx.stroke();
    ctx.strokeStyle = '#e9d9ba';
    ctx.lineWidth = 5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(1084, 449 + i * 16); ctx.lineTo(943, 432 + i * 30); ctx.moveTo(1306, 457 + i * 16); ctx.lineTo(1437, 444 + i * 30); ctx.stroke();
    }
    ctx.strokeStyle = '#f8ecd2'; ctx.lineWidth = 6; ctx.setLineDash([9, 10]); ctx.strokeRect(19, 19, 1498, 986);
    ctx.setLineDash([]);
    ctx.globalAlpha = .12;
    for (let y = 0; y < 1024; y += 4) { ctx.strokeStyle = y % 8 ? '#fff6de' : '#584431'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1536, y); ctx.stroke(); }
    for (let x = 0; x < 1536; x += 5) { ctx.strokeStyle = x % 10 ? '#fff6de' : '#66533e'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1024); ctx.stroke(); }
    ctx.globalAlpha = 1;
  });
}

function makeSkyline() {
  return canvasTexture(1600, 800, ctx => {
    ctx.fillStyle = '#acd8eb'; ctx.fillRect(0, 0, 1600, 800);
    for (const [x, y, scale] of [[160, 145, 1], [720, 102, .65], [1330, 230, .85]]) {
      ellipse(ctx, '#f4f4e9', x, y, 185 * scale, 24 * scale);
      ellipse(ctx, '#faf8ed', x - 35 * scale, y - 28 * scale, 62 * scale, 53 * scale);
      ellipse(ctx, '#faf8ed', x + 40 * scale, y - 21 * scale, 83 * scale, 42 * scale);
    }
    polygon(ctx, '#a1bacb', [[0, 540], [170, 393], [356, 471], [530, 340], [820, 486], [1105, 345], [1400, 463], [1600, 390], [1600, 800], [0, 800]]);
    polygon(ctx, '#9cb1b5', [[0, 585], [255, 464], [580, 559], [890, 440], [1190, 510], [1470, 466], [1600, 540], [1600, 800], [0, 800]]);
    // Church spires and irregular roof silhouettes give the view a believable distant scale.
    for (const [x, h, w] of [[590, 295, 35], [756, 242, 54], [833, 319, 33], [1070, 385, 38]]) {
      ctx.fillStyle = '#789db8'; ctx.fillRect(x, h, w, 420);
      polygon(ctx, '#628dab', [[x - 8, h], [x + w * .52, h - 86], [x + w + 8, h]]);
      ctx.fillStyle = '#a5bed0'; ctx.fillRect(x + 5, h + 14, w * .25, 65);
      ctx.fillStyle = '#587e9e'; ctx.fillRect(x + w * .67, h + 32, 5, 22);
    }
    for (let i = 0; i < 26; i++) {
      const x = i * 65 - 30; const top = 490 + Math.sin(i * 2.7) * 54; const w = 61;
      ctx.fillStyle = i % 3 ? '#d8c59a' : '#e8dcc0'; ctx.fillRect(x, top, w, 300);
      polygon(ctx, i % 2 ? '#7b99b0' : '#b1a17e', [[x - 4, top], [x + 28, top - 45], [x + 65, top]]);
      ctx.fillStyle = '#7f98a6'; for (let j = 0; j < 2; j++) ctx.fillRect(x + 13 + j * 28, top + 23, 9, 19);
    }
    const frontHouses = [[-65, 525, 158, 95], [110, 566, 118, 72], [270, 528, 130, 112], [430, 582, 112, 80], [590, 557, 150, 105], [778, 526, 129, 115], [960, 559, 153, 85], [1178, 528, 130, 99], [1370, 570, 165, 99], [1530, 510, 130, 85]];
    frontHouses.forEach(([x, y, w, roof], i) => {
      const facade = ['#e9ce9e', '#f4e6c7', '#d7b77a', '#f0dcad'][i % 4];
      ctx.fillStyle = facade; ctx.fillRect(x, y, w, 285);
      polygon(ctx, '#bda777', [[x + w, y], [x + w + 24, y - 12], [x + w + 24, 800], [x + w, 800]]);
      polygon(ctx, i % 3 ? '#7897ad' : '#a68b64', [[x - 8, y], [x + w * .49, y - roof], [x + w + 8, y]]);
      polygon(ctx, i % 3 ? '#698a9f' : '#8c7557', [[x + w * .49, y - roof], [x + w * .49 + 25, y - roof - 8], [x + w + 28, y - 13], [x + w + 8, y]]);
      ctx.fillStyle = '#e9d6ad'; ctx.fillRect(x + w * .73, y - roof * .72, 13, roof * .56);
      ctx.fillStyle = '#607d91'; ctx.fillRect(x + w * .73 - 3, y - roof * .72, 19, 5);
      for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
        const wx = x + 17 + col * (w - 30) / 3; const wy = y + 22 + row * 54;
        ctx.fillStyle = '#e8dfc0'; ctx.fillRect(wx - 3, wy - 4, 20, 32);
        ctx.fillStyle = row === 1 && col === 1 ? '#d4b16a' : '#68899e'; ctx.fillRect(wx, wy, 14, 23);
        ctx.fillStyle = '#b4c7c6'; ctx.fillRect(wx + 6, wy, 2, 23); ctx.fillRect(wx, wy + 10, 14, 2);
      }
      polygon(ctx, '#54788f', [[x + w * .45, y - 38], [x + w * .5, y - 58], [x + w * .55, y - 38]]);
    });
    const tree = (x: number, y: number, scale: number, color: string) => {
      ctx.strokeStyle = '#7e8865'; ctx.lineWidth = 6 * scale; ctx.beginPath(); ctx.moveTo(x, y + 115 * scale); ctx.lineTo(x + 5 * scale, y - 40 * scale); ctx.moveTo(x, y + 40 * scale); ctx.lineTo(x - 45 * scale, y - 15 * scale); ctx.moveTo(x + 3, y + 7 * scale); ctx.lineTo(x + 49 * scale, y - 31 * scale); ctx.stroke();
      for (let j = 0; j < 13; j++) { const angle = j * 2.399; const r = 20 + (j % 5) * 12; ellipse(ctx, j % 3 ? color : '#b7bc80', x + Math.cos(angle) * r * scale, y + Math.sin(angle) * r * scale - 18 * scale, (25 + j % 4 * 7) * scale, (34 + j % 3 * 9) * scale, angle * .2); }
    };
    tree(46, 592, 1.7, '#8ea27b'); tree(252, 728, 1.3, '#99aa7a'); tree(555, 779, 1.0, '#a6b17b'); tree(1027, 788, 1.2, '#8caa85'); tree(1345, 688, 1.4, '#94a478'); tree(1585, 595, 1.9, '#859e7b');
  });
}

function makeScreen() {
  return canvasTexture(1024, 640, ctx => {
    ctx.fillStyle = '#343e4f'; ctx.fillRect(0, 0, 1024, 640);
    ctx.fillStyle = '#222c3c'; ctx.fillRect(0, 0, 1024, 34); ctx.fillRect(0, 34, 70, 606); ctx.fillRect(835, 34, 189, 606);
    ctx.fillStyle = '#8294ab';
    for (let i = 0; i < 8; i++) ctx.fillRect(90 + i * 73, 14, 48, 6);
    for (let i = 0; i < 13; i++) { ctx.fillRect(850, 55 + i * 27, 115 - (i % 3) * 16, 6); ctx.fillRect(18, 60 + i * 35, 22, 10); }
    ctx.strokeStyle = '#49586e'; ctx.lineWidth = 1;
    for (let i = 0; i < 13; i++) { ctx.beginPath(); ctx.moveTo(74, 290 + i * 24); ctx.lineTo(834, 290 + i * 24); ctx.stroke(); ctx.beginPath(); ctx.moveTo(450, 275); ctx.lineTo(80 + i * 62, 640); ctx.stroke(); }
    polygon(ctx, '#d6d7c8', [[305, 392], [360, 289], [560, 286], [633, 370], [566, 449], [374, 457]]);
    polygon(ctx, '#eef0dd', [[360, 289], [450, 267], [560, 286], [496, 352], [350, 351]]);
    polygon(ctx, '#aebac1', [[496, 352], [560, 286], [633, 370], [566, 449], [489, 426]]);
    polygon(ctx, '#f0ecdb', [[316, 306], [299, 216], [335, 162], [388, 217], [388, 317], [356, 362]]);
    polygon(ctx, '#e0e4d5', [[299, 216], [304, 125], [335, 162], [350, 146], [388, 110], [388, 217]]);
    polygon(ctx, '#abb8be', [[356, 362], [388, 317], [388, 217], [372, 239], [362, 293]]);
    polygon(ctx, '#d4d9ce', [[338, 431], [378, 443], [372, 551], [330, 551]]);
    polygon(ctx, '#b3bfc2', [[543, 435], [582, 421], [600, 536], [559, 546]]);
    polygon(ctx, '#c6d0cb', [[595, 336], [684, 317], [724, 371], [705, 447], [681, 438], [692, 374], [653, 355], [619, 369]]);
    ellipse(ctx, '#526a7a', 321, 245, 6, 8); ellipse(ctx, '#526a7a', 362, 242, 6, 8);
    ctx.fillStyle = '#80a5c2'; ctx.fillRect(850, 474, 147, 93); ctx.fillStyle = '#bbd2d9'; ctx.fillRect(864, 488, 51, 51);
  });
}

function makePatterns() {
  return canvasTexture(800, 600, ctx => {
    ctx.fillStyle = '#bb9b70'; ctx.fillRect(0, 0, 800, 600);
    const sheets = [[50, 50, 255, 350], [340, 70, 190, 255], [560, 240, 190, 300]];
    sheets.forEach(([x, y, w, h], i) => {
      ctx.fillStyle = '#efe6ce'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#8b8577'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x + w * .36, y + 45); ctx.lineTo(x + w * .22, y + 75); ctx.lineTo(x + w * .14, y + 140); ctx.lineTo(x + w * .27, y + 145); ctx.lineTo(x + w * .3, y + 100); ctx.lineTo(x + w * .34, y + 150); ctx.lineTo(x + w * .2, y + h - 25); ctx.lineTo(x + w * .8, y + h - 25); ctx.lineTo(x + w * .65, y + 150); ctx.lineTo(x + w * .7, y + 100); ctx.lineTo(x + w * .73, y + 145); ctx.lineTo(x + w * .86, y + 140); ctx.lineTo(x + w * .78, y + 75); ctx.lineTo(x + w * .64, y + 45); ctx.quadraticCurveTo(x + w * .5, y + 70, x + w * .36, y + 45); ctx.stroke();
      ellipse(ctx, C.ink, x + w / 2, y + 9, 6, 6);
      ctx.fillStyle = i % 2 ? C.bluePale : C.blue; ctx.fillRect(x + w - 45, y + h - 70, 27, 44);
    });
    ctx.fillStyle = C.blue; ctx.fillRect(47, 450, 100, 110); ctx.fillStyle = C.cream; ctx.fillRect(170, 450, 100, 110); ctx.fillStyle = C.mustard; ctx.fillRect(340, 383, 155, 170);
  });
}

function makeWoodGrain() {
  return canvasTexture(512, 512, ctx => {
    ctx.fillStyle = '#f6f1e5'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 140; i++) {
      const y = i * 3.8; ctx.strokeStyle = i % 4 ? 'rgba(126,99,57,.08)' : 'rgba(119,87,43,.2)'; ctx.lineWidth = i % 4 ? .7 : 1.7;
      ctx.beginPath(); ctx.moveTo(0, y);
      for (let x = 0; x <= 512; x += 16) ctx.lineTo(x, y + Math.sin(x * .009 + i * .6) * 5 + Math.sin(x * .023 + i) * 1.5);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(102,78,42,.14)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(342, 197, 18 + i * 9, 3 + i * 2.4, .04, 0, Math.PI * 2); ctx.stroke(); }
  });
}

function makeWeave() {
  return canvasTexture(256, 256, ctx => {
    ctx.fillStyle = '#f5f2e9'; ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 128; i++) {
      ctx.strokeStyle = i % 2 ? 'rgba(102,94,82,.08)' : 'rgba(255,255,255,.45)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(i * 2, 0); ctx.lineTo(i * 2, 256); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * 2); ctx.lineTo(256, i * 2); ctx.stroke();
    }
  });
}

function mapped(mesh: THREE.Mesh, texture: THREE.Texture) {
  const material = mesh.material as THREE.MeshBasicMaterial;
  material.map = texture; material.needsUpdate = true;
  if (texture.userData.surface) mesh.userData.surface = texture.userData.surface;
  return mesh;
}

/** Two sewn fabric panels: the edge is shared, the filling bulges between them. */
function tailoredPillow(width: number, height: number, depth: number, variant: number) {
  const columns = 28, rows = 24;
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  const point = (u: number, v: number, side: number) => {
    const corner = Math.pow(Math.abs(u * v), 6);
    const x = u * width * .5 * (1 - .055 * Math.pow(Math.abs(v), 10));
    // Compression at the lower edge, one slumped upper corner, and a gently bowed seam.
    const y = v * height * .5 * (1 - .04 * Math.pow(Math.abs(u), 8))
      - .028 * height * Math.sin((u + 1) * Math.PI * .5) * Math.pow(Math.max(v, 0), 3)
      + .022 * height * Math.sin((u + 1) * Math.PI) * (variant % 2 ? 1 : -1) * Math.max(v, 0);
    const pressure = Math.max(0, (1 - u * u) * (1 - v * v));
    let puff = depth * .5 * Math.pow(pressure, .48);
    const direction = variant % 2 ? -1 : 1;
    const foldLine = Math.abs(u) - (.9 - (v + 1) * .23);
    const lowerFold = Math.exp(-Math.pow(foldLine / .055, 2) - Math.pow((v + .62) / .35, 2));
    const shoulderFold = Math.exp(-Math.pow((u - direction * (.83 - (1 - v) * .35)) / .07, 2) - Math.pow((v - .65) / .28, 2));
    puff -= depth * (.15 * lowerFold + .10 * shoulderFold) * Math.pow(pressure, .25);
    const edgeTwist = .015 * Math.sin(u * Math.PI + variant * .8) * corner;
    return new THREE.Vector3(x, y, side * Math.max(0, puff) + edgeTwist);
  };
  for (let side = 0; side < 2; side++) {
    for (let row = 0; row <= rows; row++) for (let col = 0; col <= columns; col++) {
      const u = col / columns * 2 - 1, v = row / rows * 2 - 1;
      positions.push(...point(u, v, side ? -1 : 1).toArray());
      uv.push(col / columns, row / rows);
    }
    const start = side * (columns + 1) * (rows + 1);
    for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
      const a = start + row * (columns + 1) + col, b = a + 1, d = a + columns + 1, c = d + 1;
      if (side) indices.push(a, d, b, b, d, c); else indices.push(a, b, d, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const edge: THREE.Vector3[] = [];
  for (let i = 0; i < 24; i++) edge.push(point(-1 + i / 24 * 2, -1, 1));
  for (let i = 0; i < 24; i++) edge.push(point(1, -1 + i / 24 * 2, 1));
  for (let i = 0; i < 24; i++) edge.push(point(1 - i / 24 * 2, 1, 1));
  for (let i = 0; i < 24; i++) edge.push(point(-1, 1 - i / 24 * 2, 1));
  return { geometry, edge };
}

function tailoredSeat(width: number, depth: number, height: number, variant: number) {
  const nx = 28, nz = 16;
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  const point = (u: number, v: number, top: boolean) => {
    const rim = Math.max(Math.pow(Math.abs(u), 8), Math.pow(Math.abs(v), 8));
    const x = u * width / 2 * (1 - .026 * Math.pow(Math.abs(v), 10));
    const z = v * depth / 2 * (1 - .045 * Math.pow(Math.abs(u), 10));
    const depression = .023 * Math.exp(-Math.pow((u - (variant % 2 ? -.3 : .23)) / .5, 2) - Math.pow((v + .12) / .56, 2));
    return new THREE.Vector3(x, top ? height / 2 - rim * .035 - depression : -height / 2 + rim * .025, z);
  };
  for (let top = 0; top < 2; top++) {
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      positions.push(...point(i / nx * 2 - 1, j / nz * 2 - 1, top === 0).toArray());
      uv.push(i / nx * width / .85, j / nz * depth / .85);
    }
    const offset = top * (nx + 1) * (nz + 1);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a = offset + j * (nx + 1) + i, b = a + 1, d = a + nx + 1, c = d + 1;
      if (top === 0) indices.push(a, d, b, b, d, c); else indices.push(a, b, d, b, c, d);
    }
  }
  const outline: [number, number][] = [];
  for (let i = 0; i <= nx; i++) outline.push([i / nx * 2 - 1, -1]);
  for (let j = 1; j <= nz; j++) outline.push([1, j / nz * 2 - 1]);
  for (let i = nx - 1; i >= 0; i--) outline.push([i / nx * 2 - 1, 1]);
  for (let j = nz - 1; j > 0; j--) outline.push([-1, j / nz * 2 - 1]);
  const seam: THREE.Vector3[] = [];
  outline.forEach(([u, v], i) => {
    const upper = point(u, v, true), lower = point(u, v, false); const base = positions.length / 3;
    const next = outline[(i + 1) % outline.length]; const nextUpper = point(...next, true), nextLower = point(...next, false);
    positions.push(...upper.toArray(), ...lower.toArray(), ...nextUpper.toArray(), ...nextLower.toArray());
    uv.push(i / 6, .2, i / 6, 0, (i + 1) / 6, .2, (i + 1) / 6, 0);
    indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    seam.push(new THREE.Vector3(upper.x * 1.002, upper.y - .018, upper.z * 1.002));
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return { geometry, seam };
}

function fabricGeometry(width: number, height: number, depth: number) {
  const geometry = new THREE.SphereGeometry(1, 28, 18);
  const p = geometry.getAttribute('position');
  const power = (n: number, e: number) => Math.sign(n) * Math.pow(Math.abs(n), e);
  for (let i = 0; i < p.count; i++) {
    const x = power(p.getX(i), .34); const y = power(p.getY(i), .34); const z = power(p.getZ(i), .48);
    const fold = Math.sin(x * 25 + y * 14) * .018 * Math.pow(Math.max(Math.abs(x), Math.abs(y)), 5);
    p.setXYZ(i, x * width / 2, y * height / 2, z * depth / 2 + fold);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function clothGeometry(width: number, height: number, folds: number, topSpread = 1, bottomSpread = 1) {
  const geometry = new THREE.PlaneGeometry(width, height, 48, 28);
  const p = geometry.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const t = .5 - p.getY(i) / height; const u = p.getX(i) / width + .5;
    const gather = (1 - t) * topSpread + t * bottomSpread;
    p.setXYZ(i, p.getX(i) * gather, p.getY(i) + Math.sin(u * Math.PI * folds * 2) * .025 * t, Math.sin(u * Math.PI * folds * 2) * (.045 + t * .055) + Math.sin(t * Math.PI) * .05);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function buildStudio(): { root: THREE.Group; camera: { position: V3; target: V3 }; name: string } {
  const k = new SceneKit();
  k.root.name = 'Sunlit atelier';
  const art = makeArt(); const sky = makeSkyline(); const rug = makeRug(); const screen = makeScreen(); const patterns = makePatterns();
  const wood = makeWoodGrain(); const weave = makeWeave();
  wood.userData.surface = 'wood'; weave.userData.surface = 'cloth';
  weave.wrapS = weave.wrapT = THREE.RepeatWrapping;
  const cloudLinen = canvasTexture(512, 512, ctx => {
    ctx.fillStyle = '#eee5d0'; ctx.fillRect(0, 0, 512, 512);
    polygon(ctx, '#d8b165', [[245, 512], [512, 210], [512, 512]]);
    ellipse(ctx, '#466587', 213, 282, 113, 110);
    ellipse(ctx, '#466587', 138, 314, 99, 79);
    ellipse(ctx, '#466587', 240, 198, 75, 88);
    polygon(ctx, '#466587', [[40, 310], [290, 275], [348, 428], [48, 428]]);
    ctx.globalAlpha = .10;
    for (let i = 0; i < 256; i++) { ctx.strokeStyle = i % 2 ? '#fff8e8' : '#726a5e'; ctx.beginPath(); ctx.moveTo(i * 2, 0); ctx.lineTo(i * 2, 512); ctx.moveTo(0, i * 2); ctx.lineTo(512, i * 2); ctx.stroke(); }
    ctx.globalAlpha = 1;
  });
  cloudLinen.userData.surface = 'cloth';
  const woodColors = new Set([C.oak, C.oakLight, C.oakDark, C.floor, C.floorLight]);

  const cuboid = (color: string, size: V3, position: V3, parent?: THREE.Object3D, rotation?: V3) => {
    const bevel = Math.min(...size) > .055 && Math.max(...size) < 5.5;
    const geometry = bevel ? new RoundedBoxGeometry(...size, 2, Math.min(.055, Math.min(...size) * .17)) : new THREE.BoxGeometry(...size);
    const mesh = k.mesh(color, geometry, position, [1, 1, 1], rotation, parent);
    if (woodColors.has(color)) mapped(mesh, wood);
    return mesh;
  };
  const beam = (color: string, a: V3, b: V3, width: number, parent?: THREE.Object3D) => {
    const mesh = k.beam(color, a, b, width, parent);
    if (woodColors.has(color)) mapped(mesh, wood);
    return mesh;
  };
  const panel = (color: string, points: V3[], parent?: THREE.Object3D) => {
    const mesh = k.patch(color, points, parent);
    if (!parent) {
      const position = mesh.geometry.getAttribute('position');
      const center = points.reduce((sum, p) => sum.add(new THREE.Vector3(...p)), new THREE.Vector3()).divideScalar(points.length);
      const normal = new THREE.Vector3().fromBufferAttribute(mesh.geometry.getAttribute('normal'), 0);
      if (normal.dot(new THREE.Vector3(0, 2.4, 0).sub(center)) < 0) {
        for (let i = 0; i < position.count; i += 3) {
          const b = new THREE.Vector3().fromBufferAttribute(position, i + 1); const c = new THREE.Vector3().fromBufferAttribute(position, i + 2);
          position.setXYZ(i + 1, c.x, c.y, c.z); position.setXYZ(i + 2, b.x, b.y, b.z);
        }
        mesh.geometry.computeVertexNormals();
      }
    }
    return mesh;
  };

  function cabinet(width: number, height: number, depth: number, position: V3, parent?: THREE.Object3D, drawers = 2, countertop = true) {
    const g = k.group('Blue oak cabinet', position, undefined, parent);
    cuboid(C.oakDark, [width - .1, height - .06, depth - .14], [0, height / 2, -.06], g);
    for (const side of [-1, 1]) cuboid(C.oak, [.1, height, depth], [side * (width - .1) / 2, height / 2, 0], g);
    cuboid(C.oak, [width, .12, depth], [0, .06, 0], g);
    if (countertop) cuboid(C.oakLight, [width + .08, .12, depth + .07], [0, height + .035, 0], g);
    cuboid(C.oakDark, [width - .1, .08, depth - .08], [0, .04, 0], g);
    for (let i = 0; i < drawers; i++) {
      const h = (height - .18) / drawers;
      const divisions = drawers === 1 && width > 2 ? 2 : 1;
      for (let d = 0; d < divisions; d++) {
        const dw = (width - .13) / divisions; const dx = divisions === 1 ? 0 : (d ? 1 : -1) * dw / 2;
        cuboid(i % 2 ? C.blue : C.ink, [dw - .03, h - .035, .075], [dx, .1 + h * (i + .5), depth / 2 + .014], g);
        cuboid(C.blue, [dw - .17, h - .16, .018], [dx, .1 + h * (i + .5), depth / 2 + .058], g);
        cuboid(C.oakLight, [Math.min(.48, dw * .35), .075, .10], [dx, .1 + h * (i + .5) + h * .15, depth / 2 + .115], g);
      }
    }
    return g;
  }

  function books(x: number, y: number, z: number, width: number, parent: THREE.Object3D, count = 8) {
    const colors = [C.cream, C.blue, C.oakLight, C.bluePale, C.ink, '#c5b48d'];
    const spacing = width / count;
    for (let i = 0; i < count; i++) {
      const h = .34 + .22 * ((i * 7 % 9) / 9); const w = spacing * .77;
      const tilt = i === count - 1 ? -.10 : i === 1 ? .04 : 0;
      const restingHeight = h * Math.cos(tilt) / 2 + w * Math.abs(Math.sin(tilt)) / 2;
      const book = k.group('Cloth-bound volume', [x - width / 2 + spacing * (i + .5), y + restingHeight, z], [0, 0, tilt], parent);
      cuboid(colors[i % colors.length], [w, h, .33], [0, 0, 0], book);
      cuboid(C.cream, [w * .79, h - .035, .26], [0, 0, .025], book);
      cuboid(colors[i % colors.length], [w, h, .035], [0, 0, .17], book);
      for (const sy of [-.32, .32]) cuboid(i % 2 ? C.cream : C.ink, [w * .6, .018, .008], [0, h * sy, .192], book);
    }
  }

  function shelf(position: V3, width: number, height: number, rows: number, parent?: THREE.Object3D) {
    const g = k.group('Open book tower', position, undefined, parent);
    cuboid(C.oakDark, [width, height, .14], [0, height / 2, -.27], g);
    cuboid(C.oak, [.12, height, .64], [-width / 2, height / 2, 0], g);
    cuboid(C.oak, [.12, height, .64], [width / 2, height / 2, 0], g);
    for (let i = 0; i <= rows; i++) {
      const y = .08 + (height - .14) * i / rows;
      cuboid(C.oakLight, [width, .1, .66], [0, y, 0], g);
      if (i < rows && i % 3 !== 1) books(i % 2 ? width * -.08 : width * .06, y + .055, .04, width * .72, g, Math.max(4, Math.floor(width * 5)));
      if (i < rows && i % 3 === 1) {
        for (let j = 0; j < 3; j++) cuboid([C.cream, C.bluePale, C.cream][j], [width * .65, .095, .4], [-width * .08 + j * .025, y + .1 + j * .11, .07], g, [0, (j - 1) * .04, 0]);
        cuboid(C.oakLight, [width * .2, .28, .35], [width * .32, y + .2, .07], g);
      }
    }
    return g;
  }

  function frame(texture: THREE.Texture, width: number, height: number, position: V3, rotation: V3 = [0, 0, 0], parent?: THREE.Object3D) {
    const g = k.group('Framed artwork', position, rotation, parent);
    cuboid(C.oakLight, [width + .14, height + .14, .08], [0, 0, 0], g);
    cuboid(C.cream, [width + .07, height + .07, .035], [0, 0, .05], g);
    k.picture(texture, [width, height], [0, 0, .072], undefined, g);
    return g;
  }

  function cushion(position: V3, size: V3, color: string, parent: THREE.Object3D, lean = 0) {
    const g = k.group('Linen cushion', position, [lean, 0, .04], parent);
    g.userData.surface = 'cloth';
    mapped(k.mesh(color, fabricGeometry(...size), [0, 0, 0], [1, 1, 1], undefined, g), weave);
    const seamPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 48; i++) { const a = i / 48 * Math.PI * 2; seamPoints.push(new THREE.Vector3(Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), .28) * size[0] * .47, Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), .28) * size[1] * .47, size[2] * .18)); }
    k.mesh(color === C.cream ? C.linen : C.blueLight, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seamPoints, true), 48, .009, 4, true), undefined, undefined, undefined, g);
    return g;
  }

  function windowPillow(position: V3, size: V3, color: string, parent: THREE.Object3D, lean: number, roll: number, variant: number, graphic = false) {
    const group = k.group('Tailored window pillow', position, [lean, variant % 2 ? -.06 : .04, roll], parent);
    group.userData.surface = 'cloth';
    const { geometry, edge } = tailoredPillow(...size, variant);
    mapped(k.mesh(graphic ? '#ffffff' : color, geometry, undefined, undefined, undefined, group), graphic ? cloudLinen : weave);
    // The piping lies on the joined panels, instead of inside a generic inflated sphere.
    const piping = new THREE.CatmullRomCurve3(edge.map(p => new THREE.Vector3(p.x * 1.004, p.y * 1.004, p.z)), true, 'centripetal');
    k.mesh(color === C.blue ? '#526d88' : '#d2c7af', new THREE.TubeGeometry(piping, 96, .008, 5, true), undefined, undefined, undefined, group);
    return group;
  }

  function windowSeat(position: V3, width: number, parent: THREE.Object3D, variant: number) {
    const group = k.group('Tailored boxed seat pad', position, undefined, parent);
    group.userData.surface = 'cloth';
    const { geometry, seam } = tailoredSeat(width, 1.13, .25, variant);
    mapped(k.mesh(C.cream, geometry, undefined, undefined, undefined, group), weave);
    k.mesh('#d9ceb7', new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seam, true, 'centripetal'), 88, .008, 5, true), undefined, undefined, undefined, group);
  }

  function curtain(parent: THREE.Object3D, x: number, top: number, z: number, height: number, width: number) {
    const geometry = new THREE.PlaneGeometry(width, height, 48, 40);
    const p = geometry.getAttribute('position');
    const smooth = (t: number) => { const v = THREE.MathUtils.clamp(t, 0, 1); return v * v * (3 - 2 * v); };
    for (let i = 0; i < p.count; i++) {
      const t = .5 - p.getY(i) / height; const u = p.getX(i) / width * 2;
      const pulled = smooth(t / .64), skirt = smooth((t - .64) / .36);
      const spread = 1.65 * (1 - pulled) + .28 * pulled + .56 * skirt;
      const center = width * .5 + .9 * pulled - .1 * skirt;
      const fold = Math.sin((u + 1) * Math.PI * 7.5 + .17 * Math.sin(t * Math.PI)) * (.06 - .041 * pulled + .045 * skirt);
      p.setXYZ(i, x + center + u * width * .5 * spread, top - t * height + .025 * Math.cos(u * Math.PI * 5) * skirt, z + fold + .15 * Math.sin(t * Math.PI));
    }
    geometry.computeVertexNormals();
    mapped(k.mesh(C.cream, geometry, undefined, undefined, undefined, parent), weave);
    beam(C.oakLight, [x - .58, top + .08, z], [x + width + .68, top + .08, z], .055, parent);
    for (let i = 0; i < 10; i++) k.mesh(C.oakLight, new THREE.TorusGeometry(.047, .009, 5, 14), [x - .46 + i * width * 1.65 / 9, top + .035, z], undefined, [0, Math.PI / 2, 0], parent);
    const tieX = x + width * .5 + .9, tieY = top - height * .64;
    const tie = new THREE.CatmullRomCurve3([[tieX - .25, tieY + .015, z + .12], [tieX - .12, tieY - .045, z + .22], [tieX + .12, tieY - .045, z + .22], [tieX + .25, tieY + .015, z + .1]].map(p => new THREE.Vector3(...p as V3)));
    k.mesh(C.oakLight, new THREE.TubeGeometry(tie, 16, .025, 6, false), undefined, undefined, undefined, parent);
  }

  // Keep furniture at its authored scale inside a taller, wider attic shell.
  const halfWidth = 8.2, halfDepth = 7.8, eave = 5.4, ridge = 8.35;
  const roofY = (x: number) => ridge - Math.abs(x) * (ridge - eave) / halfWidth;
  cuboid(C.floor, [halfWidth * 2 + .5, .18, halfDepth * 2 + .5], [0, -.12, 0]);
  for (let row = 0; row < 32; row++) {
    const z = -halfDepth + row * .5;
    for (let col = -1; col < 6; col++) {
      const start = -halfWidth + col * 3.1 + (row % 2) * 1.55;
      const left = Math.max(-halfWidth, start), right = Math.min(halfWidth, start + 3.06);
      if (right > left) mapped(cuboid((row + col) % 4 === 0 ? '#dec49e' : (row + col) % 4 === 1 ? '#d4b68d' : '#cfae83', [right - left, .025, .478], [(left + right) / 2, -.012, z]), wood);
    }
  }
  for (const side of [-1, 1]) cuboid(C.plaster, [.22, eave + .08, halfDepth * 2 + .1], [side * (halfWidth + .08), eave / 2, 0]);
  cuboid(C.plaster, [halfWidth * 2 + .3, eave + .08, .22], [0, eave / 2, halfDepth + .08]);
  cuboid(C.plaster, [halfWidth * 2 + .3, 1.3, .22], [0, .6, -halfDepth - .08]);
  for (const side of [-1, 1]) cuboid(C.plaster, [3.4, eave + .08, .22], [side * 6.6, eave / 2, -halfDepth - .08]);
  cuboid(C.plaster, [10, .29, .22], [0, eave - .02, -halfDepth - .08]);
  panel(C.ceiling, [[-halfWidth, eave, -halfDepth], [0, ridge, -halfDepth], [halfWidth, eave, -halfDepth]]);
  panel(C.ceiling, [[halfWidth, eave, halfDepth], [0, ridge, halfDepth], [-halfWidth, eave, halfDepth]]);
  panel(C.ceiling, [[0, ridge, -7.9], [8.3, roofY(8.3), -7.9], [8.3, roofY(8.3), 7.9], [0, ridge, 7.9]]);
  const roofQuad = (x1: number, x2: number, z1: number, z2: number) => panel(C.ceiling, [[x1, roofY(x1), z1], [x2, roofY(x2), z1], [x2, roofY(x2), z2], [x1, roofY(x1), z2]]);
  const skylightNorth = -5.1, skylightSouth = -.65;
  roofQuad(-8.3, 0, -7.9, skylightNorth); roofQuad(-8.3, 0, skylightSouth, 7.9);
  roofQuad(-8.3, -5.8, skylightNorth, skylightSouth); roofQuad(-2.4, 0, skylightNorth, skylightSouth);
  // A real roof opening, with an open sash and the blue sky beyond it.
  const aperture: V3[] = [[-5.8, roofY(-5.8), skylightNorth], [-2.4, roofY(-2.4), skylightNorth], [-2.4, roofY(-2.4), skylightSouth], [-5.8, roofY(-5.8), skylightSouth]];
  for (let i = 0; i < 4; i++) beam(C.oakLight, aperture[i], aperture[(i + 1) % 4], .22);
  panel(C.sky, [[-13, 10.2, -15], [9, 10.2, -15], [9, 10.2, 11], [-13, 10.2, 11]]).userData.bakeUnlit = true;
  k.sphere(C.white, [1.12, .045, .42], [-4.9, 10.13, -4.9]).userData.bakeUnlit = true;
  k.sphere(C.white, [.66, .05, .43], [-4.2, 10.12, -5.15]).userData.bakeUnlit = true;
  const sashNorth = skylightNorth + .1, sashSouth = skylightSouth - .15;
  const sash: V3[] = [[-5.7, roofY(-5.7) + .07, sashNorth], [-2.5, roofY(-2.5) + .07, sashNorth], [-2.5, roofY(-2.5) + 1.07, sashSouth], [-5.7, roofY(-5.7) + 1.07, sashSouth]];
  for (let i = 0; i < 4; i++) beam(C.ink, sash[i], sash[(i + 1) % 4], .12).name = 'Open skylight sash';
  beam(C.ink, [-4.1, roofY(-4.1) + .07, sashNorth], [-4.1, roofY(-4.1) + 1.07, sashSouth], .085).name = 'Open skylight mullion';
  beam(C.oakLight, [-5.73, roofY(-5.73) + .08, sashSouth - .35], [-5.73, roofY(-5.73) + 1.04, sashSouth - .1], .045);
  for (const x of [-5.25, -2.95]) beam(C.metal, [x - .14, roofY(x - .14) + .07, sashNorth], [x + .14, roofY(x + .14) + .07, sashNorth], .065);
  for (const z of [-7.45, -.3, 7.45]) {
    beam(C.oak, [-halfWidth, eave - .14, z], [0, ridge - .14, z], .34);
    beam(C.oak, [0, ridge - .14, z], [halfWidth, eave - .14, z], .34);
    // Short collar ties sit high in the roof instead of crossing the room at eye level.
    if (z !== -.3) beam(C.oak, [-4.1, roofY(4.1) - .14, z], [4.1, roofY(4.1) - .14, z], .24);
    for (const side of [-1, 1]) {
      beam(C.oakLight, [side * 8.05, 4.15, z], [side * 6.5, roofY(6.5) - .14, z], .24);
      for (const by of [4.23, 4.4]) k.cylinder(C.oakDark, .035, .035, .024, [side * 7.89, by, z + .135], [Math.PI / 2, 0, 0], 12);
    }
  }
  beam(C.oak, [0, ridge - .18, -halfDepth], [0, ridge - .18, halfDepth], .25);
  beam(C.oak, [-8.1, eave - .1, -halfDepth], [-8.1, eave - .1, halfDepth], .24);
  cuboid(C.oak, [.13, .24, halfDepth * 2], [-8.1, .12, 0]);
  cuboid(C.oak, [.13, .24, halfDepth + 4.1], [8.1, .12, (4.1 - halfDepth) / 2]);
  // Oversized northern window and its slightly faceted seat.
  k.picture(sky, [11.2, 6.2], [0, 3.4, -8.3]).userData.bakeUnlit = true;
  for (const x of [-5.05, 5.05]) cuboid(C.oakLight, [.21, 4.3, .36], [x, 3.295, -7.62]);
  cuboid(C.oakLight, [10.3, .2, .36], [0, 5.48, -7.61]);
  for (const x of [-4.9, -2.45, 0, 2.45, 4.9]) cuboid(C.ink, [.13, 4.14, .18], [x, 3.305, -7.77]);
  for (const y of [1.28, 2.28, 5.34]) cuboid(C.ink, [9.93, .12, .18], [0, y, -7.77]);
  for (const x of [-4.9, -2.45, 0, 2.45, 4.9]) cuboid(C.blueLight, [.023, 4.01, .023], [x + .057, 3.315, -7.67]);
  for (const x of [-2.45, 2.45]) {
    cuboid(C.oakLight, [.035, .25, .05], [x + .14, 2.2, -7.64]);
    cuboid(C.oakLight, [.14, .035, .07], [x + .19, 2.1, -7.61]);
  }
  cuboid(C.oakLight, [10.02, .16, .43], [0, 1.23, -7.62]);
  const north = k.group('Window bay', [0, 0, -6.75]);
  const seatSections: [number, number, number, number][] = [[-3.9, .18, 2.05, -.16], [-1.55, -.04, 2.5, 0], [1.15, -.04, 2.65, 0], [3.75, .18, 2.2, .16]];
  seatSections.forEach(([x, z, w, angle], index) => {
    const section = k.group('Stepped window seat', [x, 0, z], [0, angle, 0], north);
    cabinet(w, .83, 1.25, [0, 0, 0], section, 1);
    windowSeat([0, 1.05, .01], w - .08, section, index);
    windowPillow([0, 1.39, -.43], [w - .12, .57, .24], C.linen, section, -.15, -.008 + index * .005, index + 4);
    if (index === 0 || index === 3) {
      windowPillow([index ? .48 : -.38, index ? 1.74 : 1.72, -.1], [1.02, 1.06, .36], C.blue, section, -.22, index ? -.1 : .11, index);
      windowPillow([index ? -.32 : .48, 1.57, .12], [.78, .78, .31], index ? C.cream : C.mustard, section, -.28, index ? .13 : -.16, index + 1);
    }
    if (index === 1) windowPillow([-.76, 1.58, .14], [.84, .83, .32], C.cream, section, -.23, -.075, 6, true);
  });
  curtain(north, 3.0, 5.45, -.59, 4.38, 1.55);
  // Sleeping cat: a separate small sculpted companion, distinct from the rug graphic.
  const cat = k.group('Sleeping cat', [2.1, 1.22, -6.52], [0, -.28, 0]);
  const softCat = (color: string, scale: V3, position: V3) => k.mesh(color, new THREE.SphereGeometry(1, 22, 14), position, scale, undefined, cat);
  softCat('#c6a070', [.62, .245, .34], [0, .08, 0]);
  softCat(C.cream, [.37, .16, .29], [-.31, .08, .07]);
  softCat('#c6a070', [.25, .23, .24], [-.43, .24, .08]);
  softCat(C.white, [.20, .13, .13], [-.44, .16, .25]);
  softCat(C.cream, [.16, .075, .12], [-.6, -.005, .26]);
  softCat(C.cream, [.16, .075, .12], [-.31, -.005, .28]);
  for (const x of [-.59, -.29]) {
    const ear = new THREE.Shape(); ear.moveTo(-.13, 0); ear.quadraticCurveTo(-.1, .16, -.04, .26); ear.quadraticCurveTo(.09, .15, .14, 0); ear.closePath();
    k.mesh('#c6a070', new THREE.ExtrudeGeometry(ear, { depth: .08, bevelEnabled: true, bevelSegments: 2, bevelSize: .02, bevelThickness: .015, curveSegments: 6 }), [x, .37, .03], [1, 1, 1], [0, 0, x < -.4 ? .18 : -.18], cat);
    k.mesh('#d4b3a1', new THREE.ShapeGeometry(ear, 6), [x, .4, .132], [.5, .65, 1], [0, 0, x < -.4 ? .18 : -.18], cat);
  }
  const catTail = new THREE.CatmullRomCurve3([[.38, .12, -.12], [.55, .08, .19], [.33, .015, .4], [-.02, .01, .4], [-.18, .05, .3]].map(p => new THREE.Vector3(...p as V3)));
  k.mesh('#ad875f', new THREE.TubeGeometry(catTail, 24, .085, 8, false), undefined, undefined, undefined, cat);
  for (const x of [-.54, -.34]) {
    const eyelid = new THREE.CatmullRomCurve3([[x - .045, .245, .285], [x, .223, .308], [x + .045, .246, .29]].map(p => new THREE.Vector3(...p as V3)));
    k.mesh(C.brown, new THREE.TubeGeometry(eyelid, 6, .008, 4, false), undefined, undefined, undefined, cat);
  }
  softCat('#9e7970', [.027, .02, .012], [-.44, .178, .373]);
  for (let i = 0; i < 2; i++) { beam(C.white, [-.52, .15 + i * .027, .355], [-.78, .14 + i * .07, .32], .005, cat); beam(C.white, [-.36, .15 + i * .027, .355], [-.12, .14 + i * .07, .32], .005, cat); }
  // Sunlight and contact shading are baked onto the actual geometry during export.
  mapped(cuboid(C.cream, [5.43, .04, 3.28], [0, .02, -3.45]), weave);
  k.picture(rug, [5.4, 3.25], [0, .045, -3.45], [-Math.PI / 2, 0, 0]);
  for (let i = 0; i < 29; i++) for (const side of [-1, 1]) cuboid(C.cream, [.075, .018, .2], [-2.6 + i * (5.2 / 28), .045, -3.45 + side * 1.7]);

  // EAST: a sewing and garment-making station, scaled around a floor-standing form.
  const sewing = k.group('Sewing alcove', [5.9, 0, -4.85], [0, -.24, 0]);
  cuboid(C.oakLight, [3.5, .16, 1.25], [0, 1.46, 0], sewing);
  cabinet(1.05, 1.38, 1.1, [-1.18, 0, -.03], sewing, 4);
  for (const z of [-.48, .48]) cuboid(C.oak, [.14, 1.42, .14], [1.48, .71, z], sewing);
  // The open throat, floating arm, needle and handwheel make the machine identifiable.
  const machine = k.group('Sewing machine', [.33, 1.54, -.05], undefined, sewing);
  k.mesh(C.cream, new RoundedBoxGeometry(1.3, .14, .63, 3, .055), [0, .07, 0], undefined, undefined, machine);
  k.mesh(C.cream, new RoundedBoxGeometry(.45, .83, .52, 4, .085), [.43, .47, -.02], undefined, undefined, machine);
  k.mesh(C.cream, new RoundedBoxGeometry(1.03, .29, .47, 4, .10), [.02, .87, -.03], undefined, undefined, machine);
  k.mesh(C.cream, new RoundedBoxGeometry(.27, .44, .36, 3, .065), [-.44, .64, -.02], undefined, undefined, machine);
  cuboid(C.bluePale, [.45, .13, .018], [.37, .59, .25], machine);
  cuboid(C.metal, [.33, .016, .3], [-.4, .152, .03], machine);
  beam(C.metal, [-.43, .45, .03], [-.43, .18, .03], .021, machine);
  cuboid(C.metal, [.13, .025, .17], [-.43, .18, .04], machine);
  k.cylinder(C.linen, .19, .19, .13, [.72, .75, -.03], [0, 0, Math.PI / 2], 14, machine);
  k.cylinder(C.oakLight, .07, .07, .04, [.47, .62, .28], [Math.PI / 2, 0, 0], 12, machine);
  k.cylinder(C.blue, .07, .07, .16, [.2, 1.11, -.08], undefined, 12, machine);
  beam(C.metal, [.2, .99, -.08], [.2, 1.26, -.08], .018, machine);
  beam(C.bluePale, [.2, 1.24, -.08], [-.44, .98, .08], .008, machine);
  const machineCloth = new THREE.PlaneGeometry(.72, 1.3, 26, 32);
  const machineClothPosition = machineCloth.getAttribute('position');
  for (let i = 0; i < machineClothPosition.count; i++) {
    const x = machineClothPosition.getX(i); const t = .5 - machineClothPosition.getY(i) / 1.3;
    const fold = Math.sin((x + .36) * 42) * .025;
    machineClothPosition.setXYZ(i, x - .62, t < .4 ? .17 + fold * .2 : .17 - (t - .4) * 1.55, t < .4 ? .12 + t * 1.65 : .78 + fold + Math.sin(t * Math.PI) * .06);
  }
  machineCloth.computeVertexNormals();
  mapped(k.mesh(C.blueLight, machineCloth, undefined, undefined, undefined, machine), weave);
  cuboid(C.linen, [.78, .035, .035], [.01, .735, .223], machine);
  for (let i = 0; i < 5; i++) k.cylinder(C.metal, .012, .012, .008, [.25 + i * .055, .57, .264], [Math.PI / 2, 0, 0], 8, machine);
  for (let i = 0; i < 6; i++) cuboid(C.metal, [.023, .006, .055], [-.55 + i * .05, .169, .10], machine);
  for (let i = 0; i < 5; i++) k.torus(C.bluePale, .071, .004, [.2, 1.05 + i * .025, -.08], [Math.PI / 2, 0, 0], Math.PI * 2, machine);
  cuboid(C.charcoal, [.3, .08, .39], [.35, .07, .7], sewing, [-.1, 0, 0]);
  beam(C.charcoal, [.35, .08, .57], [1.1, .15, .03], .018, sewing);
  const chair = k.group('Wood sewing chair', [-.3, 0, 1.28], [0, -.23, 0], sewing);
  cuboid(C.oak, [.83, .1, .77], [0, .78, 0], chair);
  cushion([0, .88, 0], [.77, .16, .68], C.blue, chair);
  for (const x of [-.33, .33]) for (const z of [-.29, .29]) beam(C.oak, [x, .8, z], [x * 1.22, .04, z * 1.2], .09, chair);
  for (const x of [-.33, .33]) beam(C.oak, [x, .75, .31], [x, 1.65, .4], .09, chair);
  cuboid(C.oakLight, [.83, .43, .11], [0, 1.43, .36], chair, [.1, 0, 0]);
  frame(patterns, 2.7, 2.02, [8.06, 2.88, -4.9], [0, -Math.PI / 2, 0]);
  k.cylinder(C.blue, .105, .105, .26, [-1.27, 1.67, .24], undefined, 12, sewing);
  for (let i = 0; i < 5; i++) beam(i % 2 ? C.oakLight : C.charcoal, [-1.35 + i * .04, 1.72, .24], [-1.4 + i * .06, 2.06, .23], .023, sewing);
  for (const x of [1.13, 1.37]) k.cylinder(x === 1.13 ? C.blue : C.cream, .065, .065, .19, [x, 1.63, -.25], undefined, 10, sewing);
  // Dressmaker's mannequin is mounted to its own floor tripod, with full height and cloth.
  const dress = k.group('Floor-standing dress form', [3.6, 0, -5.02], [0, -.2, 0]);
  for (let i = 0; i < 3; i++) {
    const angle = i * Math.PI * 2 / 3;
    beam(C.oakDark, [0, .36, 0], [Math.sin(angle) * .46, .055, Math.cos(angle) * .46], .08, dress);
    k.cylinder(C.oakDark, .065, .065, .025, [Math.sin(angle) * .46, .013, Math.cos(angle) * .46], undefined, 10, dress);
  }
  k.cylinder(C.oakDark, .035, .035, 1.3, [0, .74, 0], undefined, 10, dress);
  const profile = [[.22, 0], [.31, .2], [.25, .5], [.2, .7], [.3, .94], [.33, 1.16], [.15, 1.31], [.105, 1.38], [.105, 1.55]].map(([r, y]) => new THREE.Vector2(r, y));
  mapped(k.mesh(C.cream, new THREE.LatheGeometry(new THREE.SplineCurve(profile).getPoints(40), 32), [0, 1.1, 0], [1, 1, .67], undefined, dress), weave);
  for (const side of [-1, 1]) k.cylinder(C.linen, .105, .105, .04, [side * .31, 2.25, -.01], [0, 0, Math.PI / 2], 20, dress);
  k.sphere(C.oakDark, [.075, .09, .075], [0, 2.74, 0], dress);
  beam(C.oakLight, [-.14, 2.53, .12], [-.21, 1.24, .16], .028, dress);
  beam(C.oakLight, [.14, 2.53, .12], [.25, 1.24, .16], .028, dress);
  mapped(k.mesh(C.white, clothGeometry(.52, 1.85, 5, .6, 1.15), [.02, 1.6, .24], undefined, [0, 0, -.1], dress), weave);
  for (let i = 0; i < 12; i++) beam(C.ink, [-.19, 1.25 + i * .09, .182], [-.15, 1.25 + i * .09, .184], .009, dress);
  k.mesh(C.linen, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(profile.slice(0, 7).map(p => new THREE.Vector3(0, p.y + 1.1, p.x * .68 + .005))), 28, .009, 4, false), undefined, undefined, undefined, dress);
  // The southeast wall cuts across the corner, giving the textile wing its own axis.
  panel(C.plaster, [[8.2, 0, 4.1], [6.3, 0, 7.8], [6.3, roofY(6.3), 7.8], [8.2, eave, 4.1]]);
  beam(C.oak, [8.2, .12, 4.1], [6.3, .12, 7.8], .24);
  // One mitered fascia follows both wall segments and seals against the roof plane.
  // Separate square-ended beams left a bright slit and protruding corner caps.
  const fasciaShape = new THREE.Shape();
  const fasciaPlan = [[8.2, -halfDepth], [8.2, 4.1], [6.3, 7.8], [6.1221, 7.7086], [8.0, 4.0516], [8.0, -halfDepth]];
  fasciaPlan.forEach(([x, z], i) => i ? fasciaShape.lineTo(x, -z) : fasciaShape.moveTo(x, -z));
  fasciaShape.closePath();
  const fasciaGeometry = new THREE.ExtrudeGeometry(fasciaShape, { depth: .24, bevelEnabled: false }).rotateX(-Math.PI / 2);
  const fasciaPositions = fasciaGeometry.getAttribute('position');
  for (let i = 0; i < fasciaPositions.count; i++) fasciaPositions.setY(i, fasciaPositions.getY(i) + roofY(fasciaPositions.getX(i)) - .22);
  fasciaGeometry.computeVertexNormals();
  mapped(k.mesh(C.oak, fasciaGeometry), wood).name = 'Continuous east roof fascia';

  // A peninsula turns the cutting station into an L instead of lining up every desk.
  const cutting = k.group('Pattern cutting workshop', [7.15, .14, .65], [0, -Math.PI / 2, 0]);
  const platformShape = new THREE.Shape();
  const platformPlan = [[-2.55, -1.0], [3.0, -1.0], [3.0, .8], [2.2, 2.3], [.75, 2.3], [.25, 1.0], [-2.55, 1.0]];
  platformPlan.forEach(([x, z], i) => i ? platformShape.lineTo(x, -z) : platformShape.moveTo(x, -z));
  platformShape.closePath();
  mapped(k.mesh(C.floorLight, new THREE.ExtrudeGeometry(platformShape, {depth: .14, bevelEnabled: false}), [0, -.14, 0], undefined, [-Math.PI / 2, 0, 0], cutting), wood);
  // Recessed-looking panel and slim returns frame a single broad material board.
  k.box('#ded8c8', [4.55, 3.85, .12], [-.15, 1.925, -.93], undefined, cutting).userData.surface = 'plaster';
  for (const x of [-2.48, 2.18]) cuboid(C.oak, [.10, 3.85, .43], [x, 1.925, -.78], cutting);
  cuboid(C.oakLight, [4.76, .12, .48], [-.15, 3.88, -.77], cutting);
  // A single slab removes the doubled top surface where the two arms meet.
  const worktopShape = new THREE.Shape();
  [[-2.245, -.7], [2.005, -.7], [2.005, 1.45], [1.68, 1.88], [.8, 1.88], [.8, .7], [-2.245, .7]].forEach(([x, z], i) => i ? worktopShape.lineTo(x, -z) : worktopShape.moveTo(x, -z));
  worktopShape.closePath();
  mapped(k.mesh(C.oakLight, new THREE.ExtrudeGeometry(worktopShape, {depth: .15, bevelEnabled: false}), [0, 1.245, 0], undefined, [-Math.PI / 2, 0, 0], cutting), wood).name = 'Continuous L cutting worktop';
  cabinet(1.05, 1.245, 1.22, [-1.58, 0, -.04], cutting, 4, false);
  cabinet(.85, 1.245, 1.22, [1.46, 0, -.04], cutting, 2, false);
  cabinet(.94, 1.245, .77, [1.3, 0, 1.32], cutting, 3, false);
  mapped(cuboid(C.bluePale, [1.55, .018, .89], [-.4, 1.407, .08], cutting), weave);
  cuboid(C.cream, [1.14, .014, .62], [-.35, 1.425, .1], cutting, [0, -.06, 0]);
  // A few clear pattern contours read at room scale, rather than scattered tiny props.
  const paperOutline = [[-.72, .17], [-.78, -.09], [-.51, -.17], [-.45, -.04], [-.18, -.04], [-.12, -.17], [.1, -.08], [.04, .19]];
  for (let i = 0; i < paperOutline.length - 1; i++) beam(C.blue, [paperOutline[i][0], 1.436, paperOutline[i][1]], [paperOutline[i + 1][0], 1.436, paperOutline[i + 1][1]], .009, cutting);
  cuboid(C.oakLight, [.055, .025, .8], [.5, 1.4085, .05], cutting, [0, -.23, 0]);
  for (let i = 0; i < 9; i++) cuboid(C.ink, [.025, .006, .008], [.5 + Math.sin(-.23) * (i * .08 - .32), 1.424, .05 + Math.cos(-.23) * (i * .08 - .32)], cutting);
  mapped(cuboid(C.linen, [.77, .12, .49], [1.37, 1.456, 1.16], cutting), weave);
  mapped(cuboid(C.blue, [.68, .09, .44], [1.4, 1.562, 1.15], cutting), weave);
  frame(patterns, 1.65, 1.22, [-1.05, 2.83, -.83], [0, 0, .025], cutting);
  // Three large swatches and an offset upper shelf establish a quiet vertical rhythm.
  beam(C.oak, [.17, 3.54, -.62], [1.87, 3.54, -.62], .055, cutting);
  for (let i = 0; i < 3; i++) {
    const h = [1.0, 1.3, .84][i], x = .43 + i * .55;
    mapped(k.mesh([C.cream, C.bluePale, C.mustard][i], clothGeometry(.45, h, 2), [x, 3.47 - h / 2, -.59], undefined, undefined, cutting), weave);
    for (const dx of [-.14, .14]) cuboid(C.charcoal, [.055, .09, .035], [x + dx, 3.49, -.52], cutting);
  }
  cuboid(C.oakLight, [2.0, .1, .38], [.97, 1.94, -.6], cutting);
  for (let i = 0; i < 2; i++) mapped(cuboid(i ? C.cream : C.blue, [.65, .10, .31], [.40 + i * .01, 2.05 + i * .11, -.55], cutting), weave);
  cuboid(C.oak, [.55, .27, .29], [1.54, 2.13, -.56], cutting);

  // The fabric storage follows the new diagonal wall, visibly turning the corner.
  const textile = k.group('Diagonal fabric library', [6.86, 0, 5.55], [0, -2.045, 0]);
  cabinet(2.65, .83, .77, [0, 0, 0], textile, 2);
  k.box('#e3d9c4', [2.7, 2.14, .1], [0, 1.97, -.4], undefined, textile).userData.surface = 'plaster';
  for (const x of [-1.36, 1.36]) cuboid(C.oak, [.11, 2.32, .83], [x, 2.03, -.04], textile);
  cuboid(C.oakLight, [2.84, .11, .87], [0, 3.21, -.04], textile);
  // Separate upright rolls from folded textiles instead of repeating one cabinet pattern.
  cuboid(C.oak, [.08, 2.24, .76], [.4, 2.0, -.04], textile);
  for (let i = 0; i < 6; i++) {
    const h = 1.25 + (i % 3) * .22, x = -1.12 + i * .25;
    k.cylinder([C.cream, C.blue, C.bluePale, C.linen, C.mustard, C.blueLight][i], .105, .105, h, [x, .92 + h / 2, .02], undefined, 12, textile);
    k.cylinder(C.oakDark, .035, .035, .018, [x, .93 + h, .02], undefined, 10, textile);
  }
  for (const y of [1.55, 2.24]) {
    cuboid(C.oakLight, [.85, .08, .77], [.88, y, -.025], textile);
    for (let i = 0; i < 3; i++) mapped(cuboid([C.linen, C.bluePale, C.cream][i], [.65 - i * .05, .1, .43], [.84 + i * .02, y + .10 + i * .11, .02], textile), weave);
  }

  // WEST: digital creation, electronics and traditional drawing have one unified desk.
  const digital = k.group('Digital design desk', [-5.4, 0, -4.50], [0, .22, 0]);
  cuboid(C.oakLight, [4.55, .15, 1.42], [0, 1.42, 0], digital);
  cabinet(1.13, 1.34, 1.22, [-1.61, 0, -.025], digital, 3);
  for (const z of [-.53, .53]) cuboid(C.oak, [.14, 1.39, .14], [1.95, .69, z], digital);
  cuboid(C.ink, [.69, .055, .45], [-.48, 1.53, -.25], digital);
  cuboid(C.charcoal, [.14, .52, .12], [-.48, 1.78, -.36], digital);
  cuboid(C.charcoal, [1.93, 1.22, .12], [-.48, 2.32, -.36], digital);
  k.picture(screen, [1.8, 1.1], [-.48, 2.32, -.29], undefined, digital).userData.bakeUnlit = true;
  k.sphere(C.blueLight, [.015, .015, .015], [.35, 1.75, -.28], digital);
  const pen = k.group('Pen display', [1.13, 1.825, .26], [-.51, 0, 0], digital);
  cuboid(C.charcoal, [1.1, .71, .065], [0, 0, 0], pen);
  k.picture(art, [.96, .59], [0, 0, .037], undefined, pen).userData.bakeUnlit = true;
  beam(C.charcoal, [.58, -.12, .1], [.74, .27, .09], .035, pen);
  cuboid(C.ink, [.95, .045, .33], [-.43, 1.5175, .48], digital);
  for (let row = 0; row < 4; row++) for (let col = 0; col < 12; col++) cuboid(C.bluePale, [.05, .009, .045], [-.81 + col * .07, 1.5445, .37 + row * .055], digital);
  k.sphere(C.cream, [.11, .045, .16], [.25, 1.56, .45], digital);
  // Clearly modeled circuit board and its components, under an articulated desk lamp.
  cuboid('#527e70', [.65, .035, .39], [-1.66, 1.5125, .25], digital);
  for (let i = 0; i < 4; i++) {
    cuboid(C.charcoal, [.09, .05, .13], [-1.86 + i * .13, 1.555, .26], digital);
    beam(C.mustard, [-1.86 + i * .13, 1.534, .1], [-1.86 + i * .13, 1.534, .42], .008, digital);
  }
  k.cylinder(C.metal, .035, .035, .13, [-1.43, 1.595, .12], undefined, 8, digital);
  cuboid(C.metal, [.16, .09, .12], [-1.9, 1.575, .11], digital);
  k.cylinder(C.ink, .17, .17, .06, [-1.96, 1.56, -.39], undefined, 12, digital);
  beam(C.blue, [-1.96, 1.59, -.39], [-2.13, 2.16, -.3], .065, digital);
  beam(C.blue, [-2.13, 2.16, -.3], [-1.69, 2.57, -.18], .065, digital);
  for (const p of [[-1.96, 1.59, -.39], [-2.13, 2.16, -.3], [-1.69, 2.57, -.18]] as V3[]) k.sphere(C.oakLight, [.065, .065, .065], p, digital);
  k.cylinder(C.blue, .06, .2, .28, [-1.64, 2.48, -.15], [0, 0, -.3], 12, digital);
  k.cylinder(C.sun, .175, .175, .012, [-1.60, 2.35, -.15], [0, 0, -.3], 12, digital).userData.bakeUnlit = true;
  frame(art, 1.3, 1.66, [-8.05, 2.98, -4.1], [0, Math.PI / 2, -.025]);
  const office = k.group('Studio swivel chair', [.55, 0, 1.48], [0, .32, 0], digital);
  k.cylinder(C.charcoal, .055, .055, .65, [0, .4, 0], undefined, 12, office);
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    beam(C.charcoal, [0, .2, 0], [Math.sin(a) * .55, .12, Math.cos(a) * .55], .065, office);
    k.sphere(C.charcoal, [.09, .09, .09], [Math.sin(a) * .55, .09, Math.cos(a) * .55], office);
  }
  cushion([0, .86, 0], [1.02, .22, .9], C.blue, office);
  cuboid(C.ink, [.15, .75, .1], [0, 1.16, .35], office, [.08, 0, 0]);
  cushion([0, 1.43, .4], [.98, .87, .24], C.blue, office, .11);
  for (const side of [-1, 1]) {
    beam(C.charcoal, [side * .45, .85, -.18], [side * .45, 1.16, -.18], .045, office);
    cuboid(C.ink, [.085, .07, .48], [side * .45, 1.18, .03], office);
  }
  shelf([-7.07, 0, -7.16], 1.23, 3.79, 5);
  shelf([7.13, 0, -7.12], 1.18, 3.55, 5);
  buildPaintingAlcove(k, wood, art, patterns);

  // SOUTH: one continuous library wraps an arched door beside the reading niche.
  const south = k.group('Book arch reading wall', [0, 0, 7.32], [0, Math.PI, 0]);
  buildLibraryPortal(k, wood, south);
  shelf([-5.28, 0, -.1], 1.28, 3.58, 5, south);
  const reading = k.group('Reading alcove', [-2.65, 0, .02], undefined, south);
  cabinet(3.7, .78, 1.17, [0, 0, 0], reading, 1);
  cushion([0, .99, .03], [3.58, .25, 1.06], C.cream, reading);
  cushion([0, 1.31, -.44], [3.6, .59, .27], C.linen, reading);
  cushion([-1.24, 1.46, -.15], [.87, .87, .29], C.blue, reading, -.17);
  cushion([1.15, 1.4, -.17], [.8, .76, .27], C.cream, reading, -.13);
  cushion([.53, 1.29, .01], [.8, .49, .26], C.mustard, reading, -.22);
  k.picture(art, [2.65, 1.75], [-2.65, 2.69, -.37], undefined, south);
  beam(C.oakLight, [-4.07, 3.62, -.35], [-1.24, 3.62, -.35], .06, south);
  for (let i = 0; i < 22; i++) beam(C.cream, [-3.93 + i * .12, 1.82, -.35], [-3.93 + i * .12, 1.7 - (i % 3) * .025, -.35], .025, south);
  // A few broad soft textile gestures, with no plant clutter or random micro-props.
  const throwProfile = new THREE.CatmullRomCurve3([
    [1.22, 1.168, -6.16], [1.25, 1.17, -5.75], [1.30, 1.155, -5.47],
    [1.33, 1.137, -5.41], [1.35, 1.04, -5.33], [1.39, .94, -5.12], [1.49, .58, -5.03], [1.57, .25, -5.02],
  ].map(p => new THREE.Vector3(...p as V3)), false, 'centripetal');
  const throwPoint = (u: number, t: number, offset = 0) => {
    const p = throwProfile.getPointAt(t), tangent = throwProfile.getTangentAt(t);
    p.z -= .8; // Move the entire drape with the deeper window bay.
    const normal = new THREE.Vector3(0, tangent.z, -tangent.y).normalize();
    const hanging = THREE.MathUtils.smoothstep(t, .35, .72);
    const wideFold = Math.sin(u * Math.PI * 3.2 + .3) * .045 + Math.sin(u * Math.PI * 5.3 - .6) * .018;
    const fold = wideFold * (.18 + hanging * .82) * (.72 + .28 * Math.cos(u));
    p.x += u * (.75 - .07 * t) + Math.sin(u * Math.PI) * .025 * Math.sin(t * Math.PI);
    p.addScaledVector(normal, fold + offset);
    p.y += Math.sin(u * 4 + .2) * .027 * Math.pow(t, 5);
    return p;
  };
  const throwSurface = (tStart: number, tEnd: number, rows: number, offset = 0) => {
    const positions: number[] = [], uv: number[] = [], indices: number[] = []; const columns = 42;
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= columns; i++) {
      const t = tStart + (tEnd - tStart) * j / rows;
      positions.push(...throwPoint(i / columns * 2 - 1, t, offset).toArray());
      uv.push(i / columns * 1.8, t * 2.6);
    }
    for (let j = 0; j < rows; j++) for (let i = 0; i < columns; i++) {
      const a = j * (columns + 1) + i, b = a + 1, d = a + columns + 1, c = d + 1;
      indices.push(a, d, b, b, d, c);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
    return geometry;
  };
  mapped(k.mesh(C.cream, throwSurface(0, 1, 52)), weave);
  for (const t of [.84, .875, .91]) mapped(k.mesh(C.blueLight, throwSurface(t, t + .01, 2, .004)), weave);
  for (const side of [-1, 1]) {
    const hem = new THREE.CatmullRomCurve3(Array.from({ length: 35 }, (_, i) => throwPoint(side, i / 34, .003)));
    k.mesh('#d8cdb4', new THREE.TubeGeometry(hem, 46, .008, 5, false)).userData.surface = 'cloth';
  }
  for (let i = 0; i < 30; i++) {
    const start = throwPoint(-.97 + i * 1.94 / 29, 1, .002);
    const mid = start.clone().add(new THREE.Vector3(.009 * Math.sin(i), -.07, .007));
    const end = start.clone().add(new THREE.Vector3(.017 * Math.sin(i * .7), -.15 - (i % 4) * .009, .012));
    k.mesh(C.cream, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([start, mid, end]), 5, .010, 4, false)).userData.surface = 'cloth';
  }
  k.finish();
  return { root: k.root, name: 'Sunlit Atelier', camera: { position: [0, 2.45, 2.2], target: [0, 2.65, -6.6] } };
}
