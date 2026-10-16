import * as THREE from 'three';
import { SceneKit } from './kit';

type V3 = [number, number, number];
type Color = THREE.ColorRepresentation;
type Palette = Record<'wall' | 'panel' | 'trim' | 'ceiling' | 'floor' | 'floorDark' | 'ink' | 'dark' | 'blue' | 'blueLight' | 'blueDark' | 'cream' | 'white' | 'cyan' | 'screen' | 'gold' | 'coral' | 'silver' | 'window', string>;

/** Purpose-built hard-surface assets for the assembly courtyard, in metre units. */
export function createLabDetails(k: SceneKit, C: Palette) {
  const surface = <T extends THREE.Object3D>(object: T, color: Color): T => {
    object.userData.surface = color === C.silver ? 'metal' : color === C.ink ? 'rubber' : 'paint';
    return object;
  };
  const box = (color: Color, size: V3, pos: V3, parent: THREE.Object3D = k.root, rot?: V3) => surface(k.box(color, size, pos, rot, parent), color);
  const group = (name: string, pos: V3 = [0, 0, 0], rot: V3 = [0, 0, 0], parent: THREE.Object3D = k.root) => k.group(name, pos, rot, parent);
  const cyl = (color: Color, r: number, h: number, pos: V3, parent: THREE.Object3D, rot: V3 = [Math.PI / 2, 0, 0], segments = 20) => surface(k.cylinder(color, r, r, h, pos, rot, segments, parent), color === C.trim ? C.silver : color);
  const unlit = <T extends THREE.Object3D>(object: T): T => { object.userData.bakeUnlit = true; return object; };

  function shell(color: Color, size: V3, pos: V3, parent: THREE.Object3D = k.root, cut = 0.08, rotation?: V3) {
    const [width, height, depth] = size;
    const bevel = Math.min(0.035, width * 0.055, height * 0.055, depth * 0.16);
    const w = width - bevel * 2, h = height - bevel * 2;
    const c = Math.min(cut, w * 0.24, h * 0.24);
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2 + c, -h / 2);
    shape.lineTo(w / 2 - c, -h / 2);
    shape.lineTo(w / 2, -h / 2 + c);
    shape.lineTo(w / 2, h / 2 - c);
    shape.lineTo(w / 2 - c, h / 2);
    shape.lineTo(-w / 2 + c, h / 2);
    shape.lineTo(-w / 2, h / 2 - c);
    shape.lineTo(-w / 2, -h / 2 + c);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: depth - bevel * 2, steps: 1, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1, curveSegments: 1 });
    geometry.translate(0, 0, -depth / 2 + bevel);
    return surface(k.mesh(color, geometry, pos, undefined, rotation, parent), color);
  }

  function profile(color: Color, outline: [number, number][], depth: number, parent: THREE.Object3D, bevel = 0.018) {
    const shape = new THREE.Shape();
    outline.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: depth - bevel * 2, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, steps: 1, curveSegments: 1 });
    geometry.translate(0, 0, -depth / 2 + bevel);
    return surface(k.mesh(color, geometry, undefined, undefined, undefined, parent), color);
  }

  function tube(points: V3[], radius: number, parent: THREE.Object3D, color: Color = C.ink, subdivisions = 22) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    return surface(k.mesh(color, new THREE.TubeGeometry(curve, subdivisions, radius, 7, false), undefined, undefined, undefined, parent), color);
  }

  function roundRod(color: Color, start: V3, end: V3, radius: number, parent: THREE.Object3D, segments = 12) {
    const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
    const delta = b.clone().sub(a), midpoint = a.add(b).multiplyScalar(0.5);
    const result = k.cylinder(color, radius, radius, delta.length(), midpoint.toArray() as V3, undefined, segments, parent);
    result.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    return surface(result, color);
  }

  function fastener(position: V3, r: number, parent: THREE.Object3D, color: Color = C.silver, rotation: V3 = [Math.PI / 2, 0, 0]) {
    const g = group('hex fastener', position, [0, 0, 0], parent);
    if (r >= .023) cyl(C.ink, r * 1.28, r * 0.25, [0, 0, 0], g, rotation, 10);
    cyl(color, r, r * 0.52, [0, 0, 0.004], g, rotation, 6);
    return g;
  }

  function hydraulic(a: V3, b: V3, parent: THREE.Object3D, radius = 0.065) {
    const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b);
    const mid = av.clone().lerp(bv, 0.59);
    roundRod(C.dark, a, mid.toArray() as V3, radius * 1.5, parent);
    roundRod(C.silver, mid.toArray() as V3, b, radius * 0.72, parent);
    for (const t of [0.04, 0.53]) {
      const p0 = av.clone().lerp(bv, t), p1 = av.clone().lerp(bv, t + 0.055);
      roundRod(C.trim, p0.toArray() as V3, p1.toArray() as V3, radius * 1.7, parent);
    }
    for (const p of [a, b]) cyl(C.ink, radius * 1.7, radius * 2.6, p, parent, [Math.PI / 2, 0, 0], 12);
  }

  function joint(pos: V3, radius: number, depth: number, parent: THREE.Object3D, rotation: V3 = [0, 0, 0]) {
    const g = group('coaxial servo gearbox', pos, rotation, parent);
    const segments = radius > .3 ? 24 : radius > .12 ? 16 : 12;
    cyl(C.ink, radius * 0.82, depth + 0.13, [0, 0, 0], g);
    cyl(C.blue, radius, depth, [0, 0, 0], g, undefined, segments);
    for (const side of [-1, 1]) {
      const front = side * depth / 2;
      cyl(C.ink, radius * 0.84, 0.035, [0, 0, front + side * 0.025], g, undefined, segments);
      cyl(C.trim, radius * 0.73, 0.046, [0, 0, front + side * 0.049], g, undefined, segments);
      cyl(C.dark, radius * 0.62, 0.052, [0, 0, front + side * 0.077], g, undefined, segments);
      cyl(C.ink, radius * 0.18, 0.056, [0, 0, front + side * 0.107], g, undefined, 12);
      const boltCount = radius > .3 ? 8 : radius > .12 ? 4 : 0;
      for (let i = 0; i < boltCount; i++) {
        const a = i * Math.PI * 2 / boltCount;
        fastener([Math.cos(a) * radius * 0.9, Math.sin(a) * radius * 0.9, front + side * 0.027], radius * 0.055, g, C.ink);
      }
      box(C.gold, [radius * 0.2, radius * 0.06, 0.012], [0, radius * 0.75, front + side * 0.064], g);
    }
    return g;
  }

  function link(a: V3, b: V3, width: number, depth: number, parent: THREE.Object3D, face = C.blue) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const delta = end.clone().sub(start), length = delta.length();
    const g = group('tapered structural link', start.add(end).multiplyScalar(0.5).toArray() as V3, undefined, parent);
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    const h = length * 0.5;
    profile(C.dark, [[-width * .31, -h], [width * .31, -h], [width * .48, -h * .68], [width * .42, h * .72], [width * .28, h], [-width * .28, h], [-width * .49, h * .67], [-width * .49, -h * .7]], depth, g);
    const inner = group('formed armor', [0, 0, 0.015], undefined, g);
    profile(face, [[-width * .33, -h * .84], [width * .3, -h * .84], [width * .43, -h * .6], [width * .35, h * .72], [width * .2, h * .86], [-width * .25, h * .86], [-width * .43, h * .5]], depth * 1.02, inner);
    for (const side of [-1, 1]) {
      const faceGroup = group('inset arm panel', [0, 0, side * (depth * .52 + .018)], undefined, g);
      profile(C.cream, [[-width * .23, -h * .61], [width * .17, -h * .61], [width * .23, h * .45], [width * .11, h * .66], [-width * .19, h * .56]], .025, faceGroup, .005);
      for (const y of [-h * .55, h * .54]) fastener([-width * .14, y, side * (depth * .52 + .046)], .023, g, C.dark);
      shell(C.dark, [width * .2, length * .24, .022], [width * .29, -h * .18, side * (depth * .52 + .025)], g, .015);
      for (let j = 0; j < 4; j++) box(C.trim, [width * .14, .016, .018], [width * .29, -h * .35 + j * .065, side * (depth * .52 + .04)], g);
    }
    return g;
  }

  function arm(pos: V3, scale: number, yaw = 0, parent: THREE.Object3D = k.root) {
    const g = group('heavy blue six-axis manipulator', pos, [0, yaw, 0], parent);
    g.scale.setScalar(scale);
    shell(C.ink, [1.22, .13, 1.06], [0, .065, 0], g, .11);
    shell(C.blueDark, [1.13, .22, .96], [0, .22, 0], g, .13);
    for (const x of [-.45, .45]) for (const z of [-.37, .37]) fastener([x, .345, z], .055, g, C.silver, [0, 0, 0]);
    cyl(C.ink, .43, .14, [0, .4, 0], g, [0, 0, 0], 32);
    cyl(C.blue, .4, .13, [0, .52, 0], g, [0, 0, 0], 32);
    shell(C.blue, [.82, .62, .77], [0, .79, 0], g, .16);
    shell(C.cream, [.48, .22, .025], [0, .72, .411], g, .04);
    const a: V3 = [0, 1.0, 0], b: V3 = [-.83, 2.35, -.03], c: V3 = [-2.05, 1.47, .015];
    link(a, b, .8, .64, g);
    link(b, c, .59, .59, g);
    joint(a, .46, .81, g);
    joint(b, .43, .79, g);
    joint(c, .29, .68, g);
    hydraulic([.22, .91, -.49], [-.52, 2.17, -.48], g, .069);
    hydraulic([-.88, 2.12, -.44], [-1.87, 1.45, -.43], g, .05);
    for (let i = 0; i < 3; i++) {
      const z = -.47 - i * .061;
      tube([[.21, .58, z], [.28, 1.33, z], [-.32, 2.45, z], [-.88, 2.62, z], [-1.6, 2.07, z], [-2.07, 1.65, z]], .027, g, i === 1 ? C.dark : C.ink);
    }
    for (const [x, y] of [[-.4, 2.29], [-1.47, 2.13]]) shell(C.trim, [.17, .075, .22], [x, y, -.53], g, .018, [0, 0, -.58]);
    const wrist = group('tool wrist and parallel gripper', [-2.05, 1.19, .015], undefined, g);
    shell(C.ink, [.48, .31, .49], [0, 0, 0], wrist, .08);
    cyl(C.trim, .21, .08, [0, -.2, 0], wrist, [0, 0, 0], 24);
    cyl(C.blue, .185, .12, [0, -.29, 0], wrist, [0, 0, 0], 24);
    shell(C.gold, [.42, .12, .29], [0, -.37, 0], wrist, .04);
    for (const side of [-1, 1]) {
      const finger = group('articulated yellow jaw', [side * .17, -.4, 0], [0, 0, side * -.1], wrist);
      profile(C.gold, [[-.06, .08], [.08, .08], [.14, -.16], [.08, -.34], [-.04, -.34], [-.1, -.17]], .16, finger, .014);
      cyl(C.ink, .055, .21, [0, -.04, 0], finger, undefined, 12);
      cyl(C.silver, .022, .225, [0, -.04, 0], finger, undefined, 10);
      shell(C.dark, [.1, .12, .16], [-side * .045, -.3, .005], finger, .02);
      fastener([.03, -.17, .103], .021, finger);
    }
    for (const side of [-1, 1]) shell(C.gold, [.13, .15, .04], [side * .42, .78, .39], g, .02);
    return g;
  }

  /** The main arm has its own castings and cross-sections, not a scaled service arm. */
  function heroArm(pos: V3, scale: number, yaw = 0, parent: THREE.Object3D = k.root) {
    const g = group('hero manipulator / asymmetric castings', pos, [0, yaw, 0], parent);
    g.scale.setScalar(scale);

    function casting(a: V3, b: V3, sections: [number, number, number, number, number][], color: Color) {
      const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
      const delta = end.clone().sub(start), length = delta.length();
      const part = group('variable-section cast housing', start.add(end).multiplyScalar(.5).toArray() as V3, undefined, g);
      part.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
      const rings = sections.map(([t, w, d, dx, dz]) => {
        const cut = Math.min(w, d) * .18;
        return [[-w / 2 + cut, -d / 2], [w / 2 - cut, -d / 2], [w / 2, -d / 2 + cut], [w / 2, d / 2 - cut], [w / 2 - cut, d / 2], [-w / 2 + cut, d / 2], [-w / 2, d / 2 - cut], [-w / 2, -d / 2 + cut]].map(([x, z]) => [x + dx, (t - .5) * length, z + dz] as V3);
      });
      const positions: number[] = [];
      const tri = (a: V3, b: V3, c: V3) => positions.push(...a, ...c, ...b);
      for (let r = 0; r < rings.length - 1; r++) for (let i = 0; i < 8; i++) {
        const j = (i + 1) % 8;
        tri(rings[r][i], rings[r][j], rings[r + 1][j]);
        tri(rings[r][i], rings[r + 1][j], rings[r + 1][i]);
      }
      for (const end of [0, rings.length - 1]) {
        const section = sections[end];
        const center: V3 = [section[3], (section[0] - .5) * length, section[4]];
        for (let i = 0; i < 8; i++) {
          const j = (i + 1) % 8;
          if (end === 0) tri(center, rings[end][j], rings[end][i]);
          else tri(center, rings[end][i], rings[end][j]);
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.computeVertexNormals();
      surface(k.mesh(color, geometry, undefined, undefined, undefined, part), color);
      return { part, length };
    }

    // A seated turret, fork and rear drive housing give the shoulder a manufactured structure.
    shell(C.dark, [1.25, .15, 1.16], [0, .075, 0], g, .12);
    shell(C.blueDark, [1.13, .16, 1.05], [0, .23, 0], g, .1);
    cyl(C.silver, .46, .055, [0, .342, 0], g, [0, 0, 0], 32);
    cyl(C.dark, .44, .12, [0, .425, 0], g, [0, 0, 0], 32);
    cyl(C.blue, .42, .14, [0, .55, 0], g, [0, 0, 0], 32);
    for (const z of [-.4, .4]) {
      const cheek = group('shoulder fork cheek', [0, 0, z], undefined, g);
      profile(C.blue, [[-.41, .56], [.35, .56], [.39, 1.1], [.2, 1.43], [-.17, 1.5], [-.48, 1.23], [-.45, .76]], .16, cheek, .025);
      shell(C.blueDark, [.27, .33, .025], [.15, .88, Math.sign(z) * .1], cheek, .045, [0, 0, .15]);
    }
    shell(C.blueDark, [.61, .49, .35], [.34, .93, -.48], g, .12);
    shell(C.dark, [.47, .27, .09], [.34, .94, -.705], g, .065);
    for (let i = 0; i < 4; i++) box(C.trim, [.34, .018, .018], [.34, .86 + i * .052, -.759], g);
    for (const x of [-.49, .49]) for (const z of [-.43, .43]) fastener([x, .319, z], .038, g, C.silver, [0, 0, 0]);

    const shoulder: V3 = [0, 1.2, 0];
    const elbow: V3 = [-.9, 1.98, -.19];
    const wrist: V3 = [-2.43, 1.02, .31];
    const upper = casting(shoulder, elbow, [[0, .57, .61, 0, 0], [.18, .81, .75, .025, -.02], [.48, .73, .69, -.02, -.035], [.8, .56, .55, -.035, -.01], [1, .48, .5, 0, 0]], C.blue);
    const frontShoulder = group('upper arm front relief', [0, 0, .38], undefined, upper.part);
    profile(C.blueDark, [[-.21, -.36], [.2, -.33], [.22, .22], [.11, .4], [-.14, .35], [-.23, .08]], .025, frontShoulder, .006);
    profile(C.blue, [[-.155, -.29], [.14, -.27], [.16, .18], [.08, .31], [-.09, .27], [-.17, .05]], .033, frontShoulder, .008);
    shell(C.cream, [.14, .19, .025], [-.12, -.21, .413], upper.part, .025, [0, 0, -.15]);
    const backSpine = group('upper arm rear structural spine', [0, 0, -.4], undefined, upper.part);
    profile(C.dark, [[-.11, -.45], [.16, -.42], [.11, .42], [-.08, .43], [-.17, .12]], .14, backSpine, .015);
    shell(C.trim, [.12, .38, .035], [.02, -.03, -.487], upper.part, .025);

    // The long forearm is a thick cream blade over a dark spine, with an offset rear gearbox.
    const forearm = casting(elbow, wrist, [[0, .52, .56, 0, 0], [.15, .66, .67, -.02, .035], [.52, .54, .56, -.025, .045], [.84, .38, .43, .035, .02], [1, .33, .36, .03, 0]], C.blueDark);
    const blade = group('long cream forearm armor', [0, 0, .325], undefined, forearm.part);
    profile(C.cream, [[-.21, -.6], [.11, -.62], [.21, -.43], [.24, .46], [.11, .67], [-.16, .62], [-.245, .35]], .09, blade, .025);
    const blueRim = group('forearm cobalt leading edge', [0, 0, .3], undefined, forearm.part);
    profile(C.blue, [[-.29, -.63], [-.22, -.66], [-.25, .4], [-.15, .68], [-.23, .62], [-.34, .31]], .13, blueRim, .018);
    shell(C.dark, [.12, .33, .04], [.1, .15, .397], forearm.part, .025, [0, 0, .02]);
    shell(C.coral, [.12, .1, .035], [-.025, -.39, .389], forearm.part, .012, [0, 0, -.08]);
    shell(C.blue, [.45, .21, .12], [.01, -.59, .24], forearm.part, .045);
    const rearPanel = group('exposed forearm rear drive', [.02, 0, -.32], undefined, forearm.part);
    profile(C.dark, [[-.13, -.62], [.16, -.55], [.19, .36], [.02, .62], [-.14, .46]], .16, rearPanel, .02);
    shell(C.silver, [.13, .69, .055], [.02, .02, -.43], forearm.part, .025);
    for (const y of [-.45, .43]) fastener([-.11, y, .397], .027, forearm.part, C.dark);

    joint(shoulder, .43, .86, g);
    joint(elbow, .36, .77, g, [.04, -.12, 0]);
    joint(wrist, .245, .48, g, [0, -.1, 0]);
    hydraulic([.17, .82, -.58], [-.67, 1.81, -.67], g, .067);
    hydraulic([-.95, 1.69, -.5], [-2.15, 1.03, -.18], g, .049);
    for (let i = 0; i < 3; i++) tube([[.22, .68, -.56 - i * .052], [.18, 1.36, -.6 - i * .052], [-.54, 2.22, -.63 - i * .052], [-1.1, 2.13, -.58 - i * .052], [-1.95, 1.6, -.24 - i * .052], [-2.43, 1.17, .12 - i * .052]], .027, g, i === 1 ? C.dark : C.ink);
    shell(C.trim, [.18, .09, .23], [-.53, 2.17, -.67], g, .018, [0, 0, -.55]);
    shell(C.trim, [.17, .08, .22], [-1.83, 1.67, -.36], g, .018, [0, 0, -.59]);

    const tool = group('offset wrist / compact gripper', [wrist[0] - .02, wrist[1] - .12, wrist[2]], [0, -.06, -.12], g);
    shell(C.dark, [.41, .23, .38], [0, 0, 0], tool, .075);
    cyl(C.silver, .16, .06, [0, -.15, 0], tool, [0, 0, 0], 24);
    cyl(C.blue, .145, .095, [0, -.225, 0], tool, [0, 0, 0], 24);
    shell(C.gold, [.39, .1, .26], [0, -.3, 0], tool, .035);
    for (const side of [-1, 1]) {
      const finger = group('compact articulated jaw', [side * .15, -.32, 0], [0, 0, -side * .12], tool);
      profile(C.gold, [[-.055, .04], [.07, .04], [.1, -.11], [.055, -.22], [-.04, -.22], [-.08, -.1]], .15, finger, .012);
      cyl(C.ink, .045, .19, [0, -.04, 0], finger, undefined, 12);
      cyl(C.silver, .02, .205, [0, -.04, 0], finger, undefined, 10);
      shell(C.ink, [.07, .09, .15], [-side * .035, -.2, 0], finger, .018);
    }
    return g;
  }

  function dog(pos: V3, scale = 1, yaw = 0, parent: THREE.Object3D = k.root, stance = 0) {
    const g = group('quadruped with exposed actuator spine', pos, [0, yaw, 0], parent);
    g.scale.setScalar(scale);
    // A narrow, ribbed torso suspended between independent shoulder and hip drives.
    shell(C.ink, [.53, .39, 1.46], [0, 1.44, -.05], g, .11);
    shell(C.blue, [.57, .28, .83], [0, 1.68, -.1], g, .12);
    shell(C.dark, [.48, .16, 1.16], [0, 1.23, -.06], g, .055);
    for (const z of [-.6, .58]) {
      shell(C.cream, [.72, .4, .29], [0, 1.57, z], g, .12);
      shell(C.blueDark, [.8, .21, .2], [0, 1.4, z], g, .055);
      for (const x of [-.23, .23]) shell(C.ink, [.08, .19, .055], [x, 1.59, z + .157], g, .025);
    }
    // Raised side cages, separated battery covers and a small sensor mast avoid a toy-car silhouette.
    for (const x of [-1, 1]) {
      tube([[x * .3, 1.52, -.73], [x * .34, 1.85, -.39], [x * .33, 1.84, .39], [x * .29, 1.55, .76]], .035, g, C.cream, 16);
      for (let i = 0; i < 5; i++) box(C.trim, [.022, .09, .045], [x * .281, 1.46, -.32 + i * .12], g);
    }
    shell(C.blue, [.34, .085, .29], [0, 1.87, -.27], g, .035);
    shell(C.blueDark, [.3, .075, .22], [0, 1.86, .11], g, .025);
    for (const z of [-.35, -.2, .04, .18]) fastener([.1, 1.913, z], .018, g, C.dark, [0, 0, 0]);
    shell(C.cream, [.46, .39, .21], [0, 1.56, .805], g, .13);
    shell(C.ink, [.19, .16, .055], [0, 1.65, .936], g, .045);
    cyl(C.dark, .063, .035, [0, 1.66, .977], g, undefined, 16);
    unlit(cyl(C.cyan, .027, .041, [0, 1.66, .99], g, undefined, 16));
    for (const x of [-.15, .15]) cyl(C.ink, .029, .032, [x, 1.49, .924], g, undefined, 12);
    cyl(C.dark, .085, .08, [0, 1.94, -.46], g, [0, 0, 0], 16);
    cyl(C.trim, .077, .033, [0, 2.0, -.46], g, [0, 0, 0], 16);
    for (const side of [-1, 1]) for (const end of [-1, 1]) {
      const a: V3 = [side * .48, 1.51, end * .62];
      const stagger = side * end * stance;
      const b: V3 = [side * .62, .82, end * .62 - .34 + stagger * .4];
      const c: V3 = [side * .64, .16, end * .62 + .075 + stagger];
      joint(a, .215, .26, g, [0, Math.PI / 2, 0]);
      const thigh = group('sculpted upper leg', [0, 0, 0], undefined, g);
      link(a, b, .3, .23, thigh, C.cream);
      joint(b, .145, .28, g, [0, Math.PI / 2, 0]);
      link(b, c, .18, .16, g, C.blue);
      roundRod(C.silver, [side * .66, .72, b[2] + .05], [side * .68, .25, c[2] - .055], .025, g, 10);
      tube([[side * .35, 1.55, end * .62], [side * .66, 1.36, end * .62 - .04], [side * .72, .99, b[2] + .11], [side * .66, .82, b[2]]], .021, g, C.ink, 14);
      joint(c, .08, .19, g, [0, Math.PI / 2, 0]);
      shell(C.ink, [.25, .14, .36], [c[0], .07, c[2] + .07], g, .055);
      // Keep every sole at local y=0, including dogs placed on an inclined parent.
      shell(C.dark, [.19, .045, .27], [c[0], .0225, c[2] + .07], g, .04);
      for (const z of [-.035, .04, .115]) box(C.trim, [.2, .012, .014], [c[0], .145, c[2] + z], g);
      shell(C.gold, [.04, .13, .1], [side * .63, 1.56, end * .62 + .06], g, .014);
    }
    return g;
  }

  function cabinet(pos: V3, size: V3, yaw = 0, color: Color = C.blue, drawers = 4, parent: THREE.Object3D = k.root) {
    const g = group('framed service cabinet', pos, [0, yaw, 0], parent);
    const [w, h, d] = size;
    const foot = Math.min(.075, h * .07);
    for (const x of [-1, 1]) for (const z of [-1, 1]) box(C.ink, [.13, foot, .12], [x * (w / 2 - .11), foot / 2, z * (d / 2 - .1)], g);
    // The coloured skins own the exterior side faces. A full-width carcass put
    // its dark triangles on those same planes, causing blue/black z-fighting.
    // Recess the carcass 8cm on each side; its 2cm overlap with each 10cm skin
    // stays inside the cabinet instead of on a visible surface.
    shell(C.dark, [w - .16, h - foot, d], [0, (h + foot) / 2, 0], g, .045);
    shell(color, [.1, h - .1, d + .015], [-w / 2 + .05, h / 2 + .02, 0], g, .025);
    shell(color, [.1, h - .1, d + .015], [w / 2 - .05, h / 2 + .02, 0], g, .025);
    box(C.ink, [w - .18, h - .19, .04], [0, h / 2, d / 2 + .015], g);
    for (let i = 0; i < drawers; i++) {
      const dh = (h - .23) / drawers, y = foot + .06 + dh * (i + .5);
      shell(color, [w - .23, dh - .026, .075], [0, y, d / 2 + .04], g, .012);
      box(C.ink, [w * .37, .05, .02], [w * .06, y + dh * .25, d / 2 + .087], g);
      box(C.silver, [w * .31, .018, .033], [w * .06, y + dh * .27, d / 2 + .108], g);
      box(C.gold, [.07, .025, .008], [-w * .3, y + dh * .25, d / 2 + .0815], g);
      if (i % 2 === 0) box(C.cream, [.11, .033, .008], [w * .29, y - dh * .17, d / 2 + .0815], g);
    }
    shell(C.trim, [w + .05, .07, d + .055], [0, h + .02, 0], g, .025);
    // Keep the supported top at h + .0735 while seating the mat into the cap.
    box(C.dark, [w - .12, .02, d - .1], [0, h + .0635, 0], g);
    for (const x of [-w / 2 + .05, w / 2 - .05]) for (const y of [.16, h - .11]) fastener([x, y, d / 2 + .006], .017, g);
    // Slot inserts penetrate the blue skin by 2mm; their fronts stay distinct.
    for (const side of [-1, 1]) for (let i = 0; i < 5; i++) box(C.ink, [.015, .028, d * .41], [side * (w / 2 + .0055), h * .27 + i * .056, 0], g);
    return g;
  }

  let dogTexture: THREE.CanvasTexture | undefined;
  let dataTexture: THREE.CanvasTexture | undefined;
  function displayTexture(type: string) {
    const existing = type === 'dog' ? dogTexture : dataTexture;
    if (existing) return existing;
    const canvas = document.createElement('canvas');
    canvas.width = 768; canvas.height = 480;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#80bcd0'; ctx.fillRect(0, 0, 768, 480);
    ctx.fillStyle = '#173c59'; ctx.fillRect(8, 8, 752, 42);
    ctx.font = '18px monospace'; ctx.fillStyle = '#c7e7e9'; ctx.fillText(type === 'dog' ? 'QUADRUPED // ASSEMBLY DIAGNOSTICS' : 'MOTION SYSTEM // CONTROL', 26, 36);
    ctx.strokeStyle = '#568caa'; ctx.lineWidth = 1;
    for (let x = 166; x < 748; x += 24) { ctx.beginPath(); ctx.moveTo(x, 68); ctx.lineTo(x, 430); ctx.stroke(); }
    for (let y = 72; y < 432; y += 24) { ctx.beginPath(); ctx.moveTo(164, y); ctx.lineTo(749, y); ctx.stroke(); }
    ctx.fillStyle = '#1c4a65';
    for (let i = 0; i < 9; i++) { ctx.fillRect(22, 75 + i * 35, 116, 25); ctx.fillStyle = '#c4e4e6'; ctx.font = '12px monospace'; ctx.fillText(['ACTUATOR 01', 'ACTUATOR 02', 'HIP LINK', 'KNEE SERVO', 'TORQUE', 'ENCODER', 'CURRENT', 'TEMP 31.2', 'STATUS READY'][i], 29, 92 + i * 35); ctx.fillStyle = '#1c4a65'; }
    if (type === 'dog') {
      ctx.strokeStyle = '#103950'; ctx.lineWidth = 11; ctx.lineJoin = 'round';
      const line = (pts: [number, number][]) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); };
      line([[300, 205], [340, 164], [548, 173], [578, 218], [532, 242], [328, 233], [300, 205]]);
      line([[332, 215], [301, 293], [337, 373], [369, 373]]); line([[372, 229], [383, 306], [359, 377]]);
      line([[528, 215], [567, 298], [540, 375], [571, 375]]); line([[491, 232], [476, 309], [500, 374]]);
      ctx.lineWidth = 3; ctx.strokeStyle = '#d0edf0';
      for (const [x, y] of [[331, 219], [372, 229], [528, 215], [491, 232], [301, 293], [567, 298]]) { ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.stroke(); }
      ctx.lineWidth = 2; line([[270, 150], [272, 382]]); line([[269, 389], [590, 389]]);
      ctx.fillStyle = '#153c55'; ctx.font = '14px monospace'; ctx.fillText('kinematics / 12 DOF', 385, 119);
    } else {
      const chart = (top: number, color: string, shift: number) => { ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i < 90; i++) { const x = 185 + i * 6, y = top + Math.sin(i * .15 + shift) * 27 + Math.cos(i * .37) * 8; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); };
      chart(149, '#164969', 0); chart(245, '#dcf0d8', 1.2); chart(343, '#22576e', 2.1);
    }
    ctx.fillStyle = '#173c59'; ctx.fillRect(8, 442, 752, 30); ctx.fillStyle = '#cae7e6'; ctx.font = '13px monospace'; ctx.fillText('SYSTEM ONLINE       SYNC 120 Hz       CALIBRATION 03', 23, 462);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    if (type === 'dog') dogTexture = texture; else dataTexture = texture;
    return texture;
  }

  function screen(pos: V3, width: number, yaw = 0, parent: THREE.Object3D = k.root, type = 'dog') {
    const g = group('calibrated robotics monitor', pos, [0, yaw, 0], parent);
    shell(C.dark, [width * .4, .055, width * .32], [0, -width * .44, -.04], g, .025);
    shell(C.trim, [.065, width * .33, .11], [0, -width * .29, -.08], g, .015);
    const display = group('monitor head', [0, 0, 0], [-.09, 0, 0], g);
    shell(C.ink, [width, width * .67, .12], [0, 0, 0], display, .035);
    shell(C.trim, [width * .96, width * .62, .018], [0, .008, .069], display, .025);
    unlit(k.picture(displayTexture(type), [width * .91, width * .57], [0, .011, .083], undefined, display));
    unlit(box(C.cyan, [.024, .012, .012], [width * .42, -width * .29, .083], display));
    for (let i = 0; i < 8; i++) box(C.dark, [.028, width * .25, .013], [-width * .25 + i * width * .07, .05, -.069], display);
    tube([[0, -width * .12, -.1], [.06, -width * .26, -.17], [.04, -width * .45, -.23]], .012, g, C.ink, 12);
    return g;
  }

  return { shell, profile, tube, roundRod, fastener, hydraulic, joint, link, arm, heroArm, dog, cabinet, screen, unlit };
}
