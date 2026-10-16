import * as THREE from 'three';
import { SceneKit } from './kit';

type V3 = [number, number, number];
type V2 = [number, number];

/** A shallow, faceted working bay that gives the west wall a readable silhouette. */
export function buildPaintingAlcove(k: SceneKit, wood: THREE.Texture, art: THREE.Texture, patterns: THREE.Texture): void {
  const C = {
    plaster: '#e7deca', plasterLight: '#eee5d4', oak: '#bd935f', oakLight: '#ddbc83',
    oakDark: '#927345', blue: '#3c6086', blueLight: '#7195b3', ink: '#314965',
    cream: '#f3e8d2', linen: '#ddd5bf', mustard: '#ddb45d', metal: '#60646a',
  };
  // Local X runs along the wall; local +Z faces into the room, towards world +X.
  const bay = k.group('Faceted painting alcove', [-7.95, 0, 2], [0, Math.PI / 2, 0]);
  const floor = .16;
  const timberColors = new Set([C.oak, C.oakLight, C.oakDark]);
  const surface = (mesh: THREE.Mesh, color: string) => {
    if (timberColors.has(color)) {
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.map = wood;
      material.needsUpdate = true;
      mesh.userData.surface = 'wood';
    } else {
      mesh.userData.surface = color === C.metal ? 'metal' : color === C.plaster || color === C.plasterLight ? 'plaster' : 'paint';
    }
    return mesh;
  };
  const box = (color: string, size: V3, position: V3, parent: THREE.Object3D = bay, rotation?: V3) =>
    surface(k.box(color, size, position, rotation, parent), color);
  const beam = (color: string, a: V3, b: V3, width: number, parent: THREE.Object3D = bay) =>
    surface(k.beam(color, a, b, width, parent), color);
  const cylinder = (color: string, radius: number, height: number, position: V3, parent: THREE.Object3D = bay, rotation?: V3, segments = 16) =>
    surface(k.cylinder(color, radius, radius, height, position, rotation, segments, parent), color);

  function prism(color: string, outline: V2[], bottom: number, heights: number[], parent: THREE.Object3D = bay) {
    const vertices: number[] = [], uv: number[] = [];
    const at = (index: number, upper: boolean): V3 => [outline[index][0], upper ? heights[index] : bottom, outline[index][1]];
    const triangle = (a: V3, b: V3, c: V3) => {
      for (const p of [a, b, c]) { vertices.push(...p); uv.push(p[0] * .25, (p[1] + p[2]) * .25); }
    };
    const faces = THREE.ShapeUtils.triangulateShape(outline.map(p => new THREE.Vector2(...p)), []);
    for (const [a, b, c] of faces) {
      triangle(at(c, true), at(b, true), at(a, true));
      triangle(at(a, false), at(b, false), at(c, false));
    }
    for (let i = 0; i < outline.length; i++) {
      const j = (i + 1) % outline.length;
      triangle(at(i, false), at(j, true), at(j, false));
      triangle(at(i, false), at(i, true), at(j, true));
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geometry.computeVertexNormals();
    return surface(k.mesh(color, geometry, undefined, undefined, undefined, parent), color);
  }

  function chamferPanel(color: string, width: number, height: number, depth: number, position: V3, parent: THREE.Object3D, cut = .035) {
    const w = width / 2, h = height / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-w + cut, -h); shape.lineTo(w - cut, -h); shape.lineTo(w, -h + cut);
    shape.lineTo(w, h - cut); shape.lineTo(w - cut, h); shape.lineTo(-w + cut, h);
    shape.lineTo(-w, h - cut); shape.lineTo(-w, -h + cut); shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1 });
    geometry.translate(0, 0, -depth / 2);
    return surface(k.mesh(color, geometry, position, undefined, undefined, parent), color);
  }

  // A single shallow step and two unequal folded returns make this an architectural
  // alcove, not another furniture row against the existing rectangular room shell.
  const dais: V2[] = [[-3.7, -.25], [3.65, -.25], [3.65, 1.25], [3.05, 1.93], [-2.7, 2.28], [-3.7, 1.55]];
  prism(C.oak, dais, .006, dais.map(() => floor));
  // The front nosing follows the angled footprint rather than drawing a rectangle.
  for (let i = 1; i < dais.length - 1; i++) {
    beam(C.oakLight, [dais[i][0], floor - .022, dais[i][1]], [dais[i + 1][0], floor - .022, dais[i + 1][1]], .043);
  }
  prism(C.plasterLight, [[-2.25, -.25], [2.15, -.25], [2.15, .085], [-2.25, .085]], floor, [3.88, 3.88, 3.88, 3.88]);
  prism(C.plaster, [[2.15, -.25], [3.56, -.25], [3.56, 1.03], [2.15, .085]], floor, [3.88, 3.22, 3.22, 3.88]);
  prism(C.plaster, [[-3.6, -.25], [-2.25, -.25], [-2.25, .085], [-3.6, .96]], floor, [2.56, 3.02, 3.02, 2.56]);
  beam(C.oakLight, [-2.25, 3.88, .11], [2.15, 3.88, .11], .075);
  beam(C.oakLight, [2.15, 3.88, .11], [3.56, 3.22, 1.05], .075);
  beam(C.oakLight, [-3.6, 2.56, .99], [-2.25, 3.02, .11], .075);
  beam(C.oak, [-2.2, .29, .13], [2.1, .29, .13], .10);

  // Large inspiration surface: a clear field with one pattern study and two
  // overlapping colour/composition sheets, rather than repeated framed artwork.
  const board = k.group('Wide working inspiration board', [.63, 2.63, .17], undefined, bay);
  chamferPanel(C.oak, 2.93, 1.76, .11, [0, 0, 0], board, .055);
  box('#b6a184', [2.77, 1.60, .025], [0, 0, .065], board);
  k.picture(patterns, [1.09, .82], [-.7, .16, .085], [0, 0, .035], board);
  const colorStudy = k.group('Colour study sheet', [.52, .04, .098], [0, 0, -.045], board);
  box(C.cream, [1.02, 1.17, .012], [0, 0, 0], colorStudy);
  k.patch(C.blue, [[-.41, -.43, .009], [-.41, .34, .009], [.13, .34, .009], [.13, .02, .009], [.39, -.19, .009], [.39, -.43, .009]], colorStudy);
  k.patch(C.mustard, [[-.18, -.36, .012], [-.18, .02, .012], [.31, .29, .012], [.31, -.36, .012]], colorStudy);
  box(C.linen, [.52, .1, .012], [-.05, .45, .015], colorStudy);
  const strips = [C.blue, C.blueLight, C.linen, C.mustard];
  strips.forEach((color, i) => box(color, [.3, .21, .016], [-.99 + i * .36, -.61, .095], board));
  for (const x of [-1.12, .28, .77]) box(C.oakLight, [.17, .05, .012], [x, .73, .095], board, [0, 0, x * .05]);
  box(C.oakLight, [3.03, .075, .23], [.63, 1.69, .22]);

  // The broad flat-file cabinet is continuous with the right angled return.
  const bench = k.group('Oak flat-file workbench', [.78, floor, .71], undefined, bay);
  box(C.oakDark, [2.75, .13, .92], [0, .065, -.035], bench);
  for (const x of [-1.34, 1.34]) box(C.oak, [.11, .94, 1.05], [x, .5, 0], bench);
  box(C.oakDark, [2.65, .82, .11], [0, .51, -.46], bench);
  for (let row = 0; row < 4; row++) {
    const y = .205 + row * .205;
    chamferPanel(row === 3 ? C.blueLight : C.blue, 2.55, .18, .07, [0, y, .52], bench, .02);
    box(C.ink, [2.32, .026, .012], [0, y + .048, .56], bench);
    for (const x of [-.81, .81]) box(C.oakLight, [.31, .055, .09], [x, y + .01, .602], bench);
  }
  box(C.oakLight, [2.94, .13, 1.15], [0, 1.015, .02], bench);
  box(C.oakDark, [2.94, .035, .025], [0, .97, .595], bench);
  box(C.cream, [.86, .025, .56], [.18, 1.095, .02], bench, [0, -.09, 0]);
  box(C.blueLight, [.54, .009, .36], [.22, 1.112, .02], bench, [0, -.09, 0]);
  // A substantial divided tool caddy; only a few readable tools, no scatter clutter.
  const caddy = k.group('Joinery brush caddy', [-.94, 1.085, -.06], [0, .07, 0], bench);
  for (const x of [-.18, .18]) box(C.oak, [.045, .27, .4], [x, .135, 0], caddy);
  for (const z of [-.18, .18]) box(C.oak, [.4, .27, .045], [0, .135, z], caddy);
  box(C.oakDark, [.4, .035, .4], [0, .017, 0], caddy);
  box(C.oak, [.035, .23, .38], [0, .13, 0], caddy);
  for (const [x, z, height, tilt] of [[-.09, -.07, .51, -.12], [.09, -.08, .59, .08], [.10, .07, .43, -.04]]) {
    const brush = k.group('Flat painting brush', [x, .035, z], [0, 0, tilt], caddy);
    box(C.oakLight, [.026, height, .026], [0, height / 2, 0], brush);
    box(C.metal, [.066, .08, .032], [0, height - .02, 0], brush);
    box(C.cream, [.067, .09, .035], [0, height + .06, 0], brush);
  }

  // A real H-frame easel: braced feet, a rear leg, sliding canvas tray and top clamp.
  // The only mountain artwork in this corner is the canvas currently being painted.
  const easel = k.group('H-frame painting easel', [-1.48, floor, 1.44], [0, -.10, 0], bay);
  for (const x of [-.51, .51]) {
    box(C.oakDark, [.17, .09, .9], [x, .045, .015], easel);
    beam(C.oak, [x, .06, .29], [x, 2.87, -.06], .105, easel);
  }
  box(C.oak, [1.16, .13, .13], [0, .27, .24], easel);
  box(C.oak, [1.16, .11, .12], [0, 1.14, .11], easel);
  beam(C.oakDark, [0, .055, -.74], [0, 2.44, -.04], .10, easel);
  beam(C.oak, [-.45, .38, .22], [0, .38, -.62], .055, easel);
  beam(C.oak, [.45, .38, .22], [0, .38, -.62], .055, easel);
  beam(C.oakLight, [0, .39, .25], [0, 3.12, -.10], .10, easel);
  // The tilted canvas rests physically on the ledge, revealing its stretcher edge.
  const canvas = k.group('Single working canvas', [0, 2.006, .035], [-.12, 0, 0], easel);
  box(C.oak, [1.36, 1.65, .07], [0, 0, 0], canvas);
  box(C.cream, [1.42, 1.71, .042], [0, 0, .05], canvas);
  k.picture(art, [1.37, 1.66], [0, 0, .074], undefined, canvas);
  box(C.oakLight, [1.58, .105, .3], [0, 1.105, .19], easel);
  box(C.oak, [1.58, .08, .045], [0, 1.18, .325], easel);
  box(C.oakLight, [.38, .105, .2], [0, 2.9175, -.025], easel);
  cylinder(C.metal, .062, .065, [0, 1.04, .225], easel, [Math.PI / 2, 0, 0], 12);
  cylinder(C.oakDark, .065, .065, [0, 2.9175, .1], easel, [Math.PI / 2, 0, 0], 12);

  // Lower storage wing follows the oblique wall; wide slots carry whole canvases.
  // Match the folded wall's axis, with clearance behind the stored canvases.
  const rack = k.group('Diagonal canvas drying rack', [-2.94, floor, 1.30], [0, .575, 0], bay);
  box(C.oakDark, [.86, .10, 1.16], [0, .05, 0], rack);
  for (const x of [-.4, .4]) {
    box(C.oak, [.065, 1.4, .08], [x, .73, -.5], rack);
    box(C.oak, [.065, .63, .08], [x, .365, .5], rack);
  }
  box(C.oakLight, [.89, .08, .09], [0, 1.4, -.5], rack);
  for (const x of [-.25, 0, .25]) {
    box(C.oak, [.035, .065, 1.1], [x, .13, 0], rack);
    beam(C.oakLight, [x, .15, .47], [x, 1.3, -.48], .028, rack);
  }
  for (const [x, h, depth, color] of [[-.27, 1.76, .78, C.cream], [-.03, 1.35, .94, C.blueLight], [.23, 1.58, .75, C.linen]] as [number, number, number, string][]) {
    const restingHeight = .1625 + Math.sin(.08) * depth / 2 + Math.sin(.045) * .063 / 2 + .002;
    const stored = k.group('Stored stretched canvas', [x, restingHeight, -.02], [-.08, 0, -.045], rack);
    box(C.oakDark, [.063, h, depth], [0, h / 2, 0], stored);
    box(color, [.019, h - .035, depth - .025], [.043, h / 2, 0], stored);
    for (const y of [.09, h - .09]) box(C.oak, [.06, .06, depth - .06], [-.04, y, 0], stored);
  }
  // Large rolled paper lives in one low bin at the upper return, grounded on the dais.
  const rolls = k.group('Large paper roll bin', [2.75, floor, 1.30], [0, -.26, 0], bay);
  // Separate walls and a low interior base leave a real opening around the rolls.
  box(C.blue, [.63, .055, .65], [0, .0275, 0], rolls);
  for (const x of [-.2925, .2925]) box(C.blue, [.045, .49, .65], [x, .245, 0], rolls);
  for (const z of [-.3025, .3025]) box(C.blue, [.54, .49, .045], [0, .245, z], rolls);
  for (const x of [-.2925, .2925]) box(C.ink, [.055, .035, .67], [x, .49, 0], rolls);
  for (const z of [-.3025, .3025]) box(C.ink, [.53, .035, .055], [0, .49, z], rolls);
  for (const [x, z, h, r] of [[-.15, -.13, 1.45, .085], [.12, -.10, 1.23, .105], [.09, .14, 1.64, .075]]) {
    cylinder(C.cream, r, h, [x, h / 2 + .057, z], rolls, undefined, 20);
    cylinder(C.oakDark, r * .47, .009, [x, h + .064, z], rolls, undefined, 16);
    cylinder(C.oak, r * .24, .011, [x, h + .070, z], rolls, undefined, 12);
  }
}
