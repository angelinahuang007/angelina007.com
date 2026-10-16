import * as THREE from 'three';
import { SceneKit } from './kit';
import { createLabDetails } from './lab-detail';
import { buildControlStair } from './lab-stair';

type V3 = [number, number, number];
type Color = THREE.ColorRepresentation;

/** LAB 03: a recessed assembly court, surrounded by four useful work elevations. */
export function buildLab(): {
  root: THREE.Group;
  camera: { position: V3; target: V3 };
  name: string;
} {
  const k = new SceneKit();
  const C = {
    wall: '#262c3b', panel: '#32394b', trim: '#535d72', ceiling: '#202634',
    floor: '#41495b', floorDark: '#2c3447', ink: '#111925', dark: '#202b3d',
    blue: '#164caf', blueLight: '#2a60bd', blueDark: '#14356f',
    cream: '#d2cfb9', white: '#eef4ff', cyan: '#91d6e8', screen: '#254d67',
    gold: '#e2a233', coral: '#e4543d', silver: '#9aabb7', window: '#142752',
  };
  const box = (color: Color, size: V3, pos: V3, parent: THREE.Object3D = k.root, rot?: V3) => {
    const mesh = k.box(color, size, pos, rot, parent);
    mesh.userData.surface = color === C.silver ? 'metal' : color === C.ink ? 'rubber' : [C.wall, C.floor, C.floorDark, C.ceiling].includes(String(color)) ? 'plaster' : 'paint';
    if (color === C.white || color === C.cyan || color === C.window || color === C.coral) mesh.userData.bakeUnlit = true;
    return mesh;
  };
  const cyl = (color: Color, radius: number, height: number, pos: V3, parent: THREE.Object3D = k.root, rot?: V3, segments = 12) => {
    const mesh = k.cylinder(color, radius, radius, height, pos, rot, segments, parent);
    mesh.userData.surface = color === C.silver || color === C.trim ? 'metal' : color === C.ink ? 'rubber' : 'paint';
    if (color === C.cyan || color === C.white) mesh.userData.bakeUnlit = true;
    return mesh;
  };
  const group = (name: string, pos: V3 = [0, 0, 0], rot: V3 = [0, 0, 0], parent: THREE.Object3D = k.root) =>
    k.group(name, pos, rot, parent);

  const detail = createLabDetails(k, C);
  const { shell, cabinet, screen, arm, heroArm, dog, unlit } = detail;
  // Screen positions describe their centre; derive that centre from a real support.
  const seatedScreen = (x: number, z: number, top: number, width: number, yaw = 0, type = 'dog') =>
    screen([x, top + width * .44 + .0275, z], width, yaw, k.root, type);

  function bone(color: Color, a: V3, b: V3, width: number, depth: number, parent: THREE.Object3D) {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const delta = end.clone().sub(start);
    const center = start.add(end).multiplyScalar(0.5);
    const mesh = shell(color, [width, delta.length(), depth], [center.x, center.y, center.z], parent, width * 0.22);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    return mesh;
  }

  function cable(points: V3[], radius = 0.045, color: Color = C.ink, parent: THREE.Object3D = k.root) {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
    k.mesh(color, new THREE.TubeGeometry(curve, 14, radius, 5, false), undefined, undefined, undefined, parent);
  }

  function rail(a: V3, b: V3, height = 0.85, parent: THREE.Object3D = k.root) {
    const length = new THREE.Vector3(...a).distanceTo(new THREE.Vector3(...b));
    const count = Math.ceil(length / 1.35);
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const p: V3 = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
      box(C.dark, [.18, .035, .18], [p[0], p[1] + .017, p[2]], parent);
      k.beam(C.gold, p, [p[0], p[1] + height, p[2]], 0.055, parent);
    }
    for (const y of [height * 0.44, height]) {
      k.beam(C.gold, [a[0], a[1] + y, a[2]], [b[0], b[1] + y, b[2]], 0.055, parent);
    }
  }

  // Continuous room shell. The assembly courtyard deliberately has no floor at y = 0.
  box(C.floor, [20, 0.36, 13.8], [0, -0.18, 4.1]);
  box(C.floor, [5.6, 0.36, 5.9], [-7.2, -0.18, -5.75]);
  box(C.floor, [5.6, 0.36, 5.9], [7.2, -0.18, -5.75]);
  box(C.floor, [20, 0.36, 2.3], [0, -0.18, -9.85]);
  box(C.floorDark, [8.8, 0.3, 5.9], [0, -1.5, -5.75]);
  // Extra headroom belongs to the architecture, not to scaled-up equipment.
  // Keep the working galleries and windows at their original human-scale levels.
  const ceilingY = 10.25;
  const wallBottom = -1.5;
  const wallTop = ceilingY + .25;
  const wallHeight = wallTop - wallBottom;
  const wallCenter = (wallTop + wallBottom) / 2;
  box(C.wall, [20.4, wallHeight, 0.35], [0, wallCenter, -11.05]);
  box(C.wall, [20.4, wallHeight, 0.35], [0, wallCenter, 11.05]);
  box(C.wall, [0.35, wallHeight, 22.5], [-10.15, wallCenter, 0]);
  box(C.wall, [0.35, wallHeight, 22.5], [10.15, wallCenter, 0]);
  box(C.ceiling, [20.6, 0.4, 22.6], [0, ceilingY + .2, 0]);

  // Oversize architecture establishes the large / medium / small rhythm.
  for (const x of [-8.8, -4.7, 0, 4.7, 8.8]) {
    box(C.panel, [0.42, ceilingY, 0.55], [x, ceilingY / 2, -10.72]);
    box(C.trim, [0.64, 0.32, 0.7], [x, 4.85, -10.62]);
    if (x !== 0) box(C.white, [0.09, 0.88, 0.035], [x, 4.0, -10.4]);
  }
  for (const z of [-9, -4.8, 0, 4.8, 9.5]) for (const side of [-1, 1]) {
    box(C.panel, [0.6, ceilingY, 0.4], [side * 9.8, ceilingY / 2, z]);
    box(C.trim, [0.72, 0.26, 0.62], [side * 9.7, 4.8, z]);
    box(C.white, [0.03, 0.85, 0.13], [side * 9.47, 3.2, z + 0.03]);
    box(C.coral, [0.035, 0.16, 0.16], [side * 9.45, 4.35, z]);
  }
  for (const z of [-8, -3, 2, 7]) {
    box(C.panel, [20, 0.38, 0.36], [0, ceilingY - .17, z]);
    for (const x of [-5, 5]) box(C.dark, [0.22, 0.5, 0.7], [x, ceilingY - .4, z]);
  }
  for (const x of [-6, 5.9]) box(C.ink, [0.16, 0.18, 21], [x, ceilingY - .27, 0]);

  // Clerestory city windows are constructed flat color silhouettes, not image backdrops.
  for (const side of [-1, 1]) {
    box(C.window, [0.05, 2.55, 13.8], [side * 9.91, 6.7, -1.6]);
    for (let i = 0; i < 10; i++) {
      const z = -7.8 + i * 1.34;
      const height = 0.7 + ((i * 7 + (side + 1)) % 5) * 0.21;
      unlit(box(C.ink, [0.035, height, 0.66 + (i % 2) * 0.2], [side * 9.865, 5.43 + height / 2, z]));
      for (let j = 0; j < 3; j++) {
        if ((i + j) % 3 !== 0) unlit(box(C.gold, [0.025, 0.08, 0.06], [side * 9.83, 5.68 + j * 0.25, z - 0.1]));
      }
      if (i % 3 === 0) unlit(box(C.coral, [0.025, 0.055, 0.055], [side * 9.83, 5.47 + height, z]));
    }
    for (const z of [-8.5, -5, -1.5, 2, 5.5]) box(C.dark, [0.15, 2.7, 0.13], [side * 9.8, 6.7, z]);
    for (const y of [5.35, 8.05]) box(C.trim, [0.28, 0.18, 14.1], [side * 9.78, y, -1.5]);
  }

  // The large ring is a ceiling landmark shared by all four directions.
  const ringCenter: V3 = [-0.5, 7.1, -4.6];
  const ringRadius = 4.0;
  const annulus = (outer: number, inner: number) => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outer, 0, Math.PI * 2, false);
    const hole = new THREE.Path(); hole.absarc(0, 0, inner, 0, Math.PI * 2, true); shape.holes.push(hole);
    return shape;
  };
  const ringBody = new THREE.ExtrudeGeometry(annulus(ringRadius + .23, ringRadius - .23), { depth: .24, steps: 1, bevelEnabled: true, bevelSize: .025, bevelThickness: .025, bevelSegments: 1, curveSegments: 40 });
  ringBody.translate(0, 0, -.12);
  k.mesh(C.dark, ringBody, ringCenter, undefined, [Math.PI / 2, 0, 0]);
  unlit(k.mesh(C.white, new THREE.ShapeGeometry(annulus(ringRadius + .18, ringRadius - .18), 40), [ringCenter[0], ringCenter[1] - .15, ringCenter[2]], undefined, [Math.PI / 2, 0, 0]));
  k.torus(C.trim, ringRadius + .24, .025, ringCenter, [Math.PI / 2, 0, 0]);
  for (const angle of [0.35, 2.4, 4.5]) {
    const x = ringCenter[0] + Math.cos(angle) * ringRadius;
    const z = ringCenter[2] + Math.sin(angle) * ringRadius;
    k.beam(C.ink, [x, ringCenter[1] + 0.1, z], [x, ceilingY + .02, z], 0.07);
    shell(C.panel, [0.2, 0.48, 0.2], [x, ceilingY - 1.05, z]);
  }

  // NORTH: descending assembly court, asymmetrically bracketed by a large arm and hoist.
  box(C.dark, [8.6, 1.5, 0.2], [0, -0.7, -8.63]);
  box(C.dark, [0.2, 1.5, 5.9], [-4.4, -0.7, -5.75]);
  box(C.dark, [0.2, 1.5, 5.9], [4.4, -0.7, -5.75]);
  for (let i = 0; i < 4; i++) {
    const step = i + 1;
    const top = -i * .3, height = 1.35 + top;
    shell(C.panel, [2.5, height, .54], [-3.05, -1.35 + height / 2, -3.05 - i * .52], k.root, .035);
    box(C.trim, [2.51, .035, .53], [-3.05, top + .018, -3.05 - i * .52]);
    for (let line = 0; line < 3; line++) box(C.dark, [2.1, .009, .018], [-3.05, top + .04, -2.89 - i * .52 - line * .07]);
    box(C.gold, [0.08, 0.018, 0.5], [-4.15, -i * 0.3 + 0.012, -3.05 - i * 0.52]);
    box(C.floorDark, [1.4, step * 0.29, 0.58], [3.55, -1.35 + step * 0.145, -5.0 - i * 0.58]);
  }
  box(C.gold, [8.8, 0.018, 0.14], [0, 0.014, -2.82]);
  box(C.gold, [0.13, 0.018, 5.9], [4.47, 0.014, -5.7]);
  box(C.gold, [0.13, 0.018, 3.6], [-4.47, 0.014, -6.85]);
  // The turned quadruped needs a full deck beneath its forward foot, not empty pit.
  shell(C.blueDark, [3.4, 0.7, 3.35], [0, -1.0, -5.1], k.root, 0.22);
  box(C.gold, [2.7, 0.018, 0.12], [0, -.64, -3.5]);
  for (const x of [-1.7, 1.7]) {
    shell(C.blue, [0.5, 1.56, 1.6], [x, -0.57, -5.4], k.root, 0.08);
    box(C.gold, [0.12, 0.65, 0.035], [x, -0.65, -4.58]);
  }
  dog([-.05, -.65, -5.35], 1.38, -.64, k.root, .13);
  // Solid terraces carry the cabinets; the long right bench genuinely bridges the pit.
  shell(C.floorDark, [2.1, 1.08, 2.8], [-3.55, -.81, -6.35], k.root, .045);
  box(C.trim, [2.12, .07, 2.83], [-3.55, -.235, -6.35]);
  const workbench = group('heavy structural assembly workbench', [4.55, 0, -5.9]);
  shell(C.dark, [4.8, .38, 2.0], [0, 1.03, 0], workbench, .13);
  shell(C.blue, [4.7, .32, 2.04], [0, 1.28, 0], workbench, .14);
  box(C.dark, [3.45, .035, 1.68], [-.1, 1.46, -.07], workbench);
  for (const x of [-2.04, 2.04]) {
    const bottom = x < 0 ? -1.35 : 0;
    shell(C.dark, [.55, 1.07 - bottom, 1.72], [x, (1.07 + bottom) / 2, 0], workbench, .07);
    shell(C.cream, [.56, .65, 2.07], [x, 1.15, .02], workbench, .12);
    box(C.blueDark, [.3, .12, .04], [x, .94, 1.075], workbench);
    for (const z of [-.6, .6]) detail.fastener([x, 1.49, z], .035, workbench, C.dark, [0, 0, 0]);
  }
  shell(C.dark, [2.5, .12, .42], [-.3, .74, .48], workbench, .03);
  unlit(box('#fff1cd', [1.95, .035, .29], [-.3, .67, .48], workbench));
  cabinet([1.34, 0, .09], [1.13, .81, 1.1], 0, C.blueDark, 3, workbench);
  heroArm([3.78, 1.48, -6.12], 1.73, -.075);
  cabinet([-3.5, -.2, -6.3], [1.65, 1.45, 1.35], 0, C.blue, 5);
  cabinet([-5.38, 0, -6.3], [1.85, 1.25, 1.35], 0, C.blue, 5);
  shell(C.blue, [3.85, .21, 1.72], [-4.48, 1.36, -6.35], k.root, .1);
  for (const x of [-6.11, -2.85]) shell(C.cream, [.44, .24, 1.76], [x, 1.41, -6.35], k.root, .085);
  arm([-5.29, 1.465, -6.63], .65, Math.PI - .19);
  seatedScreen(-3.51, -6.16, 1.465, 1.18, .08);
  seatedScreen(6.1, -6.02, 1.4775, 1.27, -.12);
  seatedScreen(3.0, -5.52, 1.4775, .53, -.08, 'bars');

  // A tall offset lifting rail gives the north elevation a second, slender silhouette.
  shell(C.dark, [0.5, 6.8, 0.55], [-3.6, 3.4, -8.4], k.root, 0.07);
  box(C.blue, [0.3, 5.85, 0.12], [-3.6, 3.5, -8.05]);
  box(C.cyan, [0.055, 0.82, 0.03], [-3.6, 5.75, -7.96]);
  shell(C.blue, [0.9, 0.72, 0.65], [-3.6, 5.1, -8.0], k.root, 0.09);
  cyl(C.cyan, 0.19, 0.03, [-3.6, 5.1, -7.65], k.root, [Math.PI / 2, 0, 0], 16);
  k.beam(C.ink, [-3.6, 4.8, -7.95], [-3.6, 3.45, -7.95], 0.06);
  shell(C.gold, [0.3, 0.36, 0.3], [-3.6, 3.3, -7.95], k.root, 0.06);
  cable([[-3.35, 6.4, -8.3], [-2.8, 4.1, -8.3], [-1.9, 4.0, -8.3], [-1.65, ceilingY + .02, -8.3]], 0.075);

  // Raised north bridge and a left service stair echo the concept's terraced silhouettes.
  box(C.trim, [18.6, 0.3, 1.65], [0, 3.36, -9.6]);
  rail([-9, 3.51, -8.8], [8.7, 3.51, -8.8]);
  for (const x of [-8.3, -1.6, 7.8]) box(C.panel, [0.22, 3.3, 0.35], [x, 1.65, -9.0]);
  for (let i = 0; i < 10; i++) {
    box(C.trim, [1.7, (i + 1) * 0.35, 0.45], [-7.85, (i + 1) * 0.175, -4.1 - i * 0.45]);
    box(C.gold, [0.075, 0.015, 0.39], [-8.59, (i + 1) * 0.35 + 0.01, -4.1 - i * 0.45]);
  }
  rail([-8.65, 0.35, -3.88], [-8.65, 3.5, -8.4], 0.86);
  k.label('ASSEMBLY / 03', C.cream, C.wall, 2.4, 0.38, [1.1, 4.6, -10.79]);

  // EAST: a folded obstacle ribbon, two dogs, and a tall calibration pylon.
  const east = group('quadruped test course', [7.5, 0, 2.8], [0, -Math.PI / 2, 0]);
  shell(C.dark, [5.2, 0.25, 2.7], [0, 0.13, 0], east, 0.12);
  const riseStart = -2.5, ridgeX = -.28, riseY = .3, ridgeY = 1.25, landingX = 1.35, landingY = .975;
  const rampSlope = (ridgeY - riseY) / (ridgeX - riseStart);
  const rampHeight = (x: number) => riseY + (x - riseStart) * rampSlope;
  // Vertical end cuts meet at one ridge and one landing edge, so no tilted slab
  // projects through the side of the neighbouring platform.
  detail.profile(C.blue, [[riseStart, riseY - .14], [ridgeX, ridgeY - .14], [ridgeX, ridgeY], [riseStart, riseY]], 1.9, east, 0);
  detail.profile(C.cream, [[ridgeX, ridgeY - .14], [landingX, landingY - .14], [landingX, landingY], [ridgeX, ridgeY]], 1.9, east, 0);
  box(C.blueDark, [1.25, .73, 1.9], [1.975, .61, 0], east);
  k.beam(C.gold, [-2.45, rampHeight(-2.45) + .018, .68], [-.33, rampHeight(-.33) + .018, .68], .025, east);
  for (const x of [-1.85, -.66]) {
    const top = rampHeight(x) - .14;
    for (const z of [-.75, .75]) box(C.dark, [.12, top - .25, .12], [x, (top + .25) / 2, z], east);
  }
  for (let i = 0; i < 4; i++) box(C.trim, [0.53, 0.14 + i * 0.1, 0.8], [-1.5 + i * 0.63, 0.25 + i * 0.05, -1.23], east);
  const slopeDog = group('quadruped aligned to test ramp', [-1.43, rampHeight(-1.43), 0], [0, 0, Math.atan(rampSlope)], east);
  dog([0, 0, 0], .85, Math.PI / 2, slopeDog);
  dog([1.975, landingY, .05], .62, -Math.PI / 2, east);
  const pylonY = .1 + 2.45 * Math.cos(.1) + .38 * Math.sin(.1);
  const pylon = group('calibration pylon with aligned luminous inset', [8.6, pylonY, -.9], [0, 0, .1]);
  shell(C.trim, [.95, .1, 1.0], [8.84, .05, -.9], k.root, .055);
  shell(C.cream, [.76, 4.9, .85], [0, 0, 0], pylon, .14);
  box(C.dark, [.07, 3.9, .3], [-.405, .15, 0], pylon);
  box(C.cyan, [.018, 2.5, .12], [-.45, .15, -.04], pylon);
  box(C.gold, [.018, .45, .13], [-.45, 1.75, -.04], pylon);
  // The east work light is attached to the wall, clear of the clerestory glazing.
  shell(C.panel, [.16, .42, .4], [9.9, 5.2, 2.6], k.root, .025);
  k.beam(C.trim, [9.88, 5.2, 2.6], [7.65, 5.2, 2.6], .09);
  k.beam(C.dark, [7.65, 5.2, 2.6], [7.65, 5.08, 2.6], .12);
  shell(C.dark, [.85, .18, .6], [7.65, 5.055, 2.6], k.root, .05);
  box(C.white, [.67, .02, .43], [7.65, 4.958, 2.6]);
  cabinet([7.6, 0, 6.35], [2.65, 1.1, 1.15], -Math.PI / 2, C.blue, 3);
  seatedScreen(7.35, 6.35, 1.1735, 1.22, -Math.PI / 2);
  seatedScreen(7.35, 5.2, 1.1735, .68, -Math.PI / 2, 'bars');
  box(C.gold, [0.1, 0.02, 5.9], [5.7, 0.016, 2.7]);
  for (let i = 0; i < 5; i++) box(C.gold, [0.36, 0.02, 0.1], [5.84, 0.018, 0.3 + i * 1.1]);

  // SOUTH: upright service chassis held in a tall asymmetric repair dock.
  const dock = group('upright chassis service dock', [1.8, 0, 8.75], [0, Math.PI, 0]);
  shell(C.blueDark, [3.7, 0.42, 2.2], [0, 0.21, 0], dock, 0.18);
  for (const x of [-1.45, 1.45]) {
    shell(C.dark, [0.45, 5.9, 0.56], [x, 3.1, -0.5], dock, 0.07);
    box(C.silver, [0.09, 5.2, 0.08], [x, 3.1, -0.17], dock);
    box(C.gold, [0.18, 0.6, 0.04], [x, 5.65, -0.11], dock);
  }
  shell(C.trim, [4.25, 0.5, 0.8], [0, 6.04, -0.38], dock, 0.12);
  shell(C.dark, [2.95, .14, .44], [0, 5.73, -.1], dock, .035);
  box(C.white, [2.8, .04, .25], [0, 5.645, -.1], dock);
  shell(C.dark, [.76, 1.2, .61], [0, 3.84, .025], dock, .12);
  const chest = group('split pectoral castings', [0, 0, .34], undefined, dock);
  detail.profile(C.blue, [[-.68, 4.23], [-.48, 4.43], [-.08, 4.34], [-.07, 3.55], [-.34, 3.5], [-.61, 3.74]], .24, chest, .035);
  detail.profile(C.blue, [[.68, 4.23], [.48, 4.43], [.08, 4.34], [.07, 3.55], [.34, 3.5], [.61, 3.74]], .24, chest, .035);
  shell(C.cream, [1.05, .17, .22], [0, 4.36, .26], dock, .05);
  shell(C.blueDark, [.25, .43, .09], [0, 3.97, .51], dock, .045);
  box(C.cyan, [.045, .15, .012], [0, 4.0, .563], dock);
  for (const y of [3.19, 3.36]) shell(C.dark, [.66, .12, .48], [0, y, .04], dock, .055);
  shell(C.dark, [.74, .28, .64], [0, 2.92, .05], dock, .075);
  const pelvis = group('split pelvis armor', [0, 0, .3], undefined, dock);
  detail.profile(C.blue, [[-.33, 3.12], [.33, 3.12], [.27, 2.79], [.09, 2.68], [-.09, 2.68], [-.27, 2.79]], .18, pelvis, .025);
  for (const side of [-1, 1]) shell(C.cream, [.28, .34, .48], [side * .45, 3.0, .03], dock, .08, [0, 0, side * -.13]);
  shell(C.trim, [.19, 1.23, .18], [0, 3.8, -.42], dock, .035);

  // A neck gimbal and asymmetric sensor head make this a complete service chassis.
  cyl(C.dark, .16, .17, [0, 4.54, .04], dock, undefined, 16);
  cyl(C.silver, .12, .08, [0, 4.66, .04], dock, undefined, 16);
  const head = group('calibration sensor head', [.03, 4.94, .07], [0, -.16, -.035], dock);
  shell(C.blueDark, [.58, .52, .53], [0, 0, 0], head, .11);
  shell(C.cream, [.6, .17, .5], [0, .18, .025], head, .06);
  shell(C.ink, [.48, .16, .06], [0, .035, .294], head, .045);
  cyl(C.dark, .064, .035, [.105, .035, .34], head, [Math.PI / 2, 0, 0], 16);
  cyl(C.cyan, .027, .041, [.105, .035, .357], head, [Math.PI / 2, 0, 0], 12);
  box(C.cyan, [.11, .02, .012], [-.095, .035, .332], head);
  shell(C.trim, [.15, .22, .3], [.335, -.04, -.03], head, .05);
  for (const y of [-.07, .01, .09]) box(C.ink, [.018, .023, .16], [-.3, y, -.015], head);
  for (const side of [-1, 1]) {
    cyl(C.gold, 0.13, 0.22, [side * 0.66, 4.7, 0.01], dock, undefined, 8);
    k.beam(C.ink, [side * 0.65, 4.8, 0.03], [side * 0.65, 5.78, -0.25], 0.05, dock);
    bone(C.cream, [side * 0.87, 4.25, 0.08], [side * 1.0, 3.25, 0.15], 0.31, 0.38, dock);
    bone(C.blue, [side * 1.0, 3.25, 0.15], [side * 0.83, 2.55, 0.32], 0.25, 0.33, dock);
    bone(C.cream, [side * 0.43, 2.83, 0.08], [side * 0.5, 1.8, 0.0], 0.37, 0.48, dock);
    const shin = bone(C.blue, [side * 0.5, 1.8, 0], [side * 0.56, 0.77, 0.24], 0.29, 0.35, dock);
    detail.joint([side * .87, 4.25, .08], .25, .42, dock);
    detail.joint([side * .5, 1.8, .1], .21, .42, dock);
    detail.joint([side * 1.0, 3.25, .15], .17, .35, dock);
    shell(C.blue, [.45, .26, .43], [side * .88, 4.43, .02], dock, .085, [0, 0, side * .2]);
    const shinFront = new THREE.Vector3(0, 0, 1).applyQuaternion(shin.quaternion).z >= 0 ? 1 : -1;
    shell(C.cream, [.22, .54, .032], [0, 0, shinFront * .193], shin, .035);
    cyl(C.silver, .095, .24, [side * .56, .7, .25], dock, [Math.PI / 2, 0, 0], 12);
    shell(C.dark, [0.48, 0.2, 0.85], [side * 0.56, .5425, 0.43], dock, 0.09);
    shell(C.ink, [.44, .045, .78], [side * .56, .4425, .43], dock, .06);

    const hand = group('articulated service hand', [side * .83, 2.36, .37], [0, side * -.12, side * .05], dock);
    cyl(C.silver, .085, .18, [0, .16, 0], hand, undefined, 12);
    shell(C.blue, [.28, .25, .18], [0, 0, 0], hand, .045);
    shell(C.cream, [.19, .15, .025], [0, .025, .106], hand, .03);
    for (let finger = 0; finger < 3; finger++) {
      const x = -.085 + finger * .085;
      const length = finger === 1 ? .2 : .165;
      cyl(C.dark, .028, .075, [x, -.13, .015], hand, [Math.PI / 2, 0, 0], 8);
      shell(C.trim, [.06, length, .065], [x, -.14 - length / 2, .025], hand, .012);
      shell(C.dark, [.058, .085, .065], [x, -.18 - length, .055], hand, .013, [.27, 0, 0]);
    }
    shell(C.trim, [.065, .17, .07], [-side * .17, -.06, .09], hand, .014, [0, 0, side * -.45]);
    shell(C.dark, [.065, .085, .065], [-side * .19, -.15, .11], hand, .014, [.2, 0, 0]);
  }
  cable([[-1.5, 6.0, -0.5], [-2.2, 4.45, -0.5], [-2.8, 4.8, -0.5], [-2.75, ceilingY + .02, -0.5]], 0.055, C.ink, dock);
  cabinet([5.1, 0, 9.35], [1.9, 1.12, 1.2], Math.PI, C.blue, 4);
  arm([5.1, 1.1935, 9.35], 0.72, -0.3);
  dog([6.9, 0.35, 9.1], 0.7, Math.PI);
  shell(C.trim, [2.6, 0.35, 1.85], [6.7, 0.175, 9.1]);
  k.label('SERVICE / 04', C.cream, C.wall, 2.3, 0.36, [3.0, 7.25, 10.84], [0, Math.PI, 0]);
  seatedScreen(7.95, 9.65, 2.0, 1.48, Math.PI);
  box(C.panel, [0.16, 2.0, 0.18], [7.95, 1, 9.7]);

  // One composed wall service system balances the tall dock, with generous gaps around it.
  const serviceWall = group('staggered wall maintenance system', [-6.25, 0, 10.72], [0, Math.PI, 0]);
  shell(C.panel, [1.35, 3.15, .16], [-1.45, 2.7, 0], serviceWall, .05);
  shell(C.dark, [1.08, 2.66, .12], [-1.45, 2.7, .135], serviceWall, .065);
  shell(C.blueDark, [.86, 2.31, .08], [-1.45, 2.75, .235], serviceWall, .085);
  box(C.cream, [.085, 1.5, .035], [-1.78, 2.91, .3], serviceWall);
  shell(C.gold, [.08, .35, .08], [-1.13, 2.63, .32], serviceWall, .015);
  for (const [y, width] of [[3.88, 2.45], [2.15, 2.15]]) {
    shell(C.panel, [width, 1.2, .12], [.71, y, 0], serviceWall, .045);
    shell(C.dark, [width - .24, .92, .13], [.71, y, .13], serviceWall, .06);
    const cover = group('broad access hatch', [.71, y, .23], undefined, serviceWall);
    detail.profile(C.trim, [[-width * .38, -.33], [width * .32, -.33], [width * .39, -.16], [width * .39, .3], [-width * .33, .3], [-width * .39, .14]], .065, cover, .02);
    box(C.blueDark, [width * .46, .055, .02], [0, .17, .05], cover);
    shell(C.dark, [.3, .08, .055], [width * .23, -.13, .07], cover, .02);
  }
  box(C.trim, [4.65, .12, .12], [-.2, 1.23, .02], serviceWall);
  box(C.dark, [.14, 4.85, .15], [2.38, 2.75, -.02], serviceWall);
  box(C.trim, [4.35, .085, .12], [.26, 5.16, -.02], serviceWall);
  shell(C.dark, [1.65, .16, .25], [.7, 4.65, -.055], serviceWall, .025);
  box(C.white, [1.48, .065, .04], [.7, 4.65, .06], serviceWall);
  for (const y of [1.3, 3.25, 5.13]) shell(C.panel, [.28, .15, .24], [2.38, y, -.02], serviceWall, .025);

  // WEST: two stacked control/repair workspaces. Desks face the open central court.
  box(C.blueDark, [3.2, 0.36, 7.6], [-8.0, 3.35, 3.3]);
  box(C.blue, [0.16, 0.35, 7.5], [-6.34, 3.36, 3.3]);
  for (const z of [0, 3.8, 6.8]) box(C.panel, [0.34, 3.2, 0.34], [-6.75, 1.6, z]);
  rail([-6.36, 3.53, -.4], [-6.36, 3.53, 3.2], .8);
  rail([-6.36, 3.53, 4.35], [-6.36, 3.53, 6.9], .8);
  // One continuous worktop supports all three control displays, including the centre one.
  shell(C.trim, [1.3, .08, 5.7], [-8.12, 4.49, 2.75], k.root, .025);
  for (const z of [0.9, 4.6]) {
    cabinet([-8.15, 3.53, z], [1.75, 0.9, 1.15], Math.PI / 2, C.blue, 3);
    seatedScreen(-7.7, z, 4.53, 1.3, Math.PI / 2);
  }
  seatedScreen(-7.75, 2.4, 4.53, .75, Math.PI / 2, 'bars');
  for (const z of [0.6, 4.3]) {
    cabinet([-8.35, 0, z], [1.65, 1.1, 1.1], Math.PI / 2, C.blue, 4);
    seatedScreen(-7.9, z, 1.1735, .83, Math.PI / 2, z > 2 ? 'bars' : 'dog');
  }
  cabinet([-8.25, 0, 6.65], [1.05, 2.55, 0.96], Math.PI / 2, C.ink, 8);
  cabinet([-8.6, 3.53, 6.25], [0.9, 2.15, 0.8], Math.PI / 2, C.cream, 6);
  buildControlStair(k, detail);
  shell(C.blueDark, [1.95, .15, .95], [-5.775, 3.455, 3.75], k.root, .035);
  bone(C.trim, [-6.75, 2.35, 3.8], [-5.05, 3.38, 3.8], .16, .16, k.root);
  rail([-6.36, 3.53, 3.275], [-4.85, 3.53, 3.275], .8);
  k.label('CONTROL / 02', C.cyan, C.wall, 2.0, 0.35, [-9.82, 6.1, 3.8], [0, Math.PI / 2, 0]);

  // Small functional clusters; broad empty circulation zones stay deliberately quiet.
  for (const z of [-0.5, 2.0]) {
    box(C.dark, [1.05, 0.07, 0.65], [-7.25, 1.18, z]);
    for (const x of [-7.62, -6.89]) box(C.trim, [0.045, 1.14, 0.045], [x, 0.57, z]);
    box(C.blueLight, [0.26, 0.18, 0.26], [-7.25, 1.31, z]);
  }
  for (const z of [-7.6, -7.0, -6.4]) box(C.trim, [0.36, 0.018, 0.05], [-0.9, -1.33, z]);
  // Butt-joined L marking stops before the chassis platform rather than under it.
  box(C.gold, [4.4475, 0.018, 0.095], [0.32375, 0.016, 6.4]);
  box(C.gold, [0.095, 0.018, 1.1025], [2.5, 0.016, 6.99875]);
  box(C.panel, [3.8, 0.012, 0.06], [-0.9, 0.008, 1.2]);
  box(C.panel, [0.06, 0.012, 4.5], [-3.35, 0.008, 1.2]);
  for (const x of [-6.3, 6.3]) {
    box(C.ink, [0.8, 0.03, 0.45], [x, 0.018, -1.1]);
    for (let i = 0; i < 6; i++) box(C.trim, [0.055, 0.02, 0.33], [x - 0.28 + i * 0.11, 0.037, -1.1]);
  }

  // The architecture has real layered construction: pilaster feet, recessed infill,
  // bridge flanges and steel deck seams rather than one uninterrupted grey box.
  const architecture = group('layered industrial architecture');
  for (const side of [-1, 1]) for (const z of [-9, -4.8, 0, 4.8, 9.5]) {
    shell(C.trim, [.73, .32, .69], [side * 9.65, .16, z], architecture, .07);
    box(C.dark, [.025, 3.8, .12], [side * 9.45, 2.4, z - .09], architecture);
    shell(C.panel, [.2, 1.9, .44], [side * 9.4, 1.22, z], architecture, .06);
    box(C.dark, [.035, .99, .22], [side * 9.25, 3.2, z], architecture);
    box(C.white, [.038, .84, .13], [side * 9.225, 3.2, z], architecture);
    for (const y of [.29, 1.9]) for (const dz of [-.18, .18]) {
      detail.fastener([side * 9.27, y, z + dz], .024, architecture, C.silver, [0, 0, Math.PI / 2]);
    }
  }
  for (const x of [-6.75, -2.35, 2.35, 6.75]) {
    for (const y of [1.5, 5.5, 7.7]) {
      shell(y === 5.5 ? C.panel : C.wall, [3.75, 1.7, .075], [x, y, -10.81], architecture, .035);
      box(C.dark, [3.58, .025, .025], [x, y - .7, -10.75], architecture);
    }
    box(C.trim, [3.85, .085, .18], [x, 4.7, -10.72], architecture);
  }
  for (const side of [-1, 1]) for (const z of [-6.85, -2.35, 2.4, 7.1]) {
    shell(C.panel, [.08, 2.8, 3.8], [side * 9.88, 1.8, z], architecture, .025);
    box(C.dark, [.12, .11, 3.7], [side * 9.8, .23, z], architecture);
    box(C.trim, [.15, .07, 3.7], [side * 9.78, .37, z], architecture);
  }
  const bridge = group('high north gantry walkway');
  shell(C.panel, [18.3, .32, 1.35], [0, 6.6, -9.3], bridge, .055);
  box(C.trim, [18.5, .085, .16], [0, 6.45, -8.6], bridge);
  rail([-8.95, 6.76, -8.65], [8.95, 6.76, -8.65], .83, bridge);
  for (let x = -8.5; x <= 8.5; x += .9) box(C.dark, [.13, .25, 1.2], [x, 6.37, -9.28], bridge);
  for (const x of [-7.8, -4.7, 4.7, 7.8]) {
    box(C.panel, [.25, 6.44, .34], [x, 3.22, -9.8], bridge);
    bone(C.trim, [x, 5.75, -9.8], [x, 6.42, -8.8], .14, .17, bridge);
  }
  for (const x of [-5.8, 5.6]) {
    // Cross-ribs end at 6.245; the housing hangs from them and the diffuser is below.
    box(C.dark, [2.35, .11, .55], [x, 6.19, -9.1], bridge);
    unlit(box('#fff0cf', [1.97, .025, .26], [x, 6.125, -9.1], bridge));
  }
  // Stepped northern work platforms carry doors, cables, sockets, jigs and inspection strips.
  const pit = group('recessed assembly infrastructure');
  for (const x of [-4.28, 4.28]) {
    for (let i = 0; i < 5; i++) {
      shell(C.panel, [.075, .94, 1.03], [x, -.7, -3.65 - i * 1.05], pit, .02);
      box(C.ink, [.11, .08, .83], [x, -.28, -3.65 - i * 1.05], pit);
    }
  }
  for (const x of [-2.8, .1, 2.8]) {
    shell(C.panel, [2.5, 1.0, .085], [x, -.76, -8.48], pit, .03);
    for (const dx of [-1.06, 1.06]) detail.fastener([x + dx, -.37, -8.423], .027, pit);
  }
  for (const x of [-1.7, 1.7]) {
    shell(C.blue, [.52, .55, 1.65], [x, -.02, -5.4], pit, .065);
    shell(C.cream, [.37, .16, 1.32], [x, .325, -5.4], pit, .04);
    box(C.gold, [.11, .9, .025], [x, -.18, -4.555], pit);
    for (const z of [-5.9, -4.9]) {
      detail.roundRod(C.ink, [x, -1.08, z], [x, .17, z], .055, pit);
      detail.roundRod(C.silver, [x, -.09, z], [x, .3, z], .032, pit);
    }
    for (const y of [-.9, .1]) detail.fastener([x + .17, y, -4.548], .026, pit, C.silver);
  }
  for (const z of [-5.95, -4.75]) {
    box(C.dark, [3.05, .09, .14], [0, -1.08, z], pit);
    box(C.silver, [2.63, .022, .045], [0, -1.021, z], pit);
  }
  for (const x of [-.92, .92]) for (const z of [-6.14, -4.54]) {
    shell(C.trim, [.29, .055, .36], [x, -1.06, z], pit, .025);
    detail.fastener([x, -1.02, z], .027, pit, C.ink, [0, 0, 0]);
  }
  cable([[-3.1, -.2, -7.55], [-2.1, -.62, -7.9], [-.8, -1.25, -7.45], [.5, -1.3, -7.8]], .048, C.ink, pit);
  for (const x of [-3.2, 2.8]) {
    box(C.dark, [1.1, .16, .17], [x, -.72, -8.33], pit);
    unlit(box('#fff1cd', [.85, .07, .02], [x, -.71, -8.225], pit));
  }
  // Metal step nosings, exposed stringers and ties are designed at human scale.
  for (let i = 0; i < 10; i++) {
    const y = (i + 1) * .35, z = -4.1 - i * .45;
    box(C.silver, [1.66, .025, .075], [-7.85, y + .016, z + .19], architecture);
    for (let j = 0; j < 3; j++) box(C.dark, [1.35, .009, .018], [-7.85, y + .033, z + .08 - j * .065], architecture);
    detail.fastener([-8.55, y - .11, z + .24], .025, architecture, C.silver);
  }
  bone(C.panel, [-8.72, .1, -3.87], [-8.72, 3.3, -8.51], .23, .17, architecture);
  // Control loft: open steel underside, task lights, pegboards, keyboard trays and cables.
  const loft = group('control loft structural detail');
  for (const [z, columnZ] of [[.3, 0], [3.4, 3.8], [6.6, 6.8]]) {
    // Brace the front of the beam from its actual column, clear of the lamp body.
    bone(C.trim, [-6.75, 2.2, columnZ], [-7.1, 3.15, z], .18, .17, loft);
    box(C.dark, [2.6, .15, .19], [-8, 3.05, z], loft);
    // Each beam carries one complete lamp below its underside; no crossed bare strips.
    shell(C.dark, [1.85, .115, .34], [-8.1, 2.925, z], loft, .025);
    box(C.white, [1.55, .026, .22], [-8.1, 2.858, z], loft);
  }
  for (const z of [.6, 4.3]) {
    shell(C.dark, [.12, 1.25, 1.62], [-9.3, 2.02, z], loft, .025);
    box(C.trim, [.03, .035, 1.42], [-9.21, 2.33, z], loft);
    for (let i = 0; i < 6; i++) {
      const y = 1.6 + (i % 3) * .22;
      box(i % 3 ? C.silver : C.gold, [.06, .24, .045], [-9.16, y, z - .58 + i * .22], loft, [i % 2 ? .13 : -.1, 0, 0]);
    }
    shell(C.dark, [.4, .045, .68], [-7.47, 1.2, z], loft, .02);
    for (const dz of [-.24, .24]) bone(C.trim, [-7.86, 1.02, z + dz], [-7.45, 1.18, z + dz], .04, .04, loft);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 7; col++) box(C.trim, [.048, .01, .055], [-7.6 + row * .075, 1.233, z - .25 + col * .076], loft);
    cable([[-8.7, 1.2, z], [-8.9, .4, z], [-8.8, .08, z + .5], [-9.3, .08, z + .5]], .025, C.ink, loft);
  }
  // Joint service details belong to the repair dock itself.
  for (const side of [-1, 1]) {
    const x = side * .43;
    detail.joint([x, 2.82, .1], .26, .61, dock);
    detail.hydraulic([side * .61, 2.76, -.36], [side * .67, 1.87, -.32], dock, .048);
    detail.hydraulic([side * .59, 1.7, -.28], [side * .65, .8, -.15], dock, .038);
    detail.tube([[side * .56, 4.24, -.4], [side * .9, 4.6, -.42], [side * 1.2, 3.9, -.43], [side * 1.03, 3.33, -.24]], .035, dock);
    detail.fastener([side * .49, 4.16, .47], .032, dock, C.ink);
  }
  shell(C.cream, [.62, .32, .09], [0, 3.46, .49], dock, .065);
  shell(C.ink, [.45, .075, .035], [0, 4.33, .49], dock, .02);
  box(C.gold, [.1, .16, .055], [-.48, 3.85, .5], dock);
  for (const x of [-.26, -.16, .16, .26]) box(C.ink, [.065, .21, .012], [x, 3.91, .4675], dock);
  // A low wall-side charging station replaces the disconnected stair and empty
  // landing. The centre stays open; the west stair still reaches its control loft.
  const chargingStation = group('Wall-side battery and tool station');
  cabinet([-7.0, 0, 10.1], [2.3, 1.0, .92], Math.PI, C.blueDark, 3, chargingStation);
  cabinet([-4.95, 0, 10.1], [1.55, .92, .92], Math.PI, C.blue, 2, chargingStation);
  const cradle = group('Three-bay battery charger', [-7.0, 1.0735, 9.98], [0, Math.PI, 0], chargingStation);
  shell(C.dark, [1.96, .12, .66], [0, .06, 0], cradle, .035);
  for (const [index, x] of [-.61, 0, .61].entries()) {
    shell(C.blueDark, [.43, .10, .45], [x, .17, 0], cradle, .018);
    box(C.cyan, [.09, .018, .016], [x, .175, .233], cradle);
    // An empty socket gives the three bays a useful, asymmetric rhythm.
    if (index === 1) {
      box(C.ink, [.29, .014, .31], [x, .227, 0], cradle);
      for (const dx of [-.07, .07]) box(C.gold, [.045, .02, .04], [x + dx, .244, 0], cradle);
    } else {
      shell(index === 0 ? C.cream : C.blue, [.31, .39, .34], [x, .415, 0], cradle, .035);
      box(C.ink, [.19, .036, .015], [x, .48, .1775], cradle);
      box(C.silver, [.17, .028, .10], [x, .625, 0], cradle);
    }
  }
  const toolCase = group('Closed field-service tool case', [-4.95, .9935, 9.98], [0, Math.PI, 0], chargingStation);
  shell(C.dark, [.88, .23, .55], [0, .115, 0], toolCase, .04);
  shell(C.blueDark, [.88, .075, .55], [0, .2675, 0], toolCase, .025);
  for (const x of [-.28, .28]) box(C.silver, [.065, .105, .025], [x, .185, .284], toolCase);
  box(C.ink, [.28, .05, .07], [0, .33, 0], toolCase);
  // Inlaid floor joints and controlled paint bands keep broad resting areas, without clutter.
  for (const z of [-1.2, 3.1, 7.0]) {
    box(C.dark, [19.4, .008, .022], [0, .006, z], architecture);
    box(C.trim, [19.4, .008, .011], [0, .006, z + .025], architecture);
  }
  // Break longitudinal paint strips at the transverse inlays instead of sharing
  // their top plane at crossings (the lightmaps otherwise fight at those pixels).
  const seamSegments: [number, number][] = [[-2.5, -1.213], [-1.1675, 3.087], [3.1325, 6.987], [7.0325, 10.7]];
  for (const x of [-5.0, -1.9, 2.0, 5.4]) for (const [a, b] of seamSegments)
    box(C.dark, [.022, .008, b - a], [x, .006, (a + b) / 2], architecture);
  for (const x of [-4.63, 4.63]) for (let i = 0; i < 4; i++) {
    box(C.dark, [.25, .02, .12], [x, .028, -3.3 - i * .48], architecture, [0, -.7, 0]);
  }

  k.finish();
  return {
    root: k.root,
    name: '阶庭试验场',
    camera: { position: [-.5, 2.9, 3.4], target: [.3, 2.3, -5.8] },
  };
}
