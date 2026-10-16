import * as THREE from 'three';
import { SceneKit, Vec3 } from './kit';

const P = {
  oak: '#bd935f', edge: '#ddbc83', recess: '#b49a74', darkOak: '#927345',
  blue: '#456985', bluePanel: '#6f92a8', blueLight: '#a9bec7', ink: '#314965',
  cream: '#eee4cf', paper: '#f5eddb', brass: '#c7a265', taupe: '#b9ac94',
};

/** An integrated book wall, with a real arched leaf inside the timber opening. */
export function buildLibraryPortal(k: SceneKit, wood: THREE.Texture, parent: THREE.Object3D): void {
  const wall = k.group('Layered arch library', undefined, undefined, parent);
  const center = 2.3, spring = 2.35, outerRadius = 1.23, openingRadius = 1.065;
  const front = .43, back = -.30, shelfDepth = front - back;

  function timber(mesh: THREE.Mesh) {
    const material = mesh.material as THREE.MeshBasicMaterial;
    material.map = wood;
    material.needsUpdate = true;
    mesh.userData.surface = 'wood';
    return mesh;
  }

  function box(color: string, size: Vec3, position: Vec3, owner = wall) {
    return k.box(color, size, position, undefined, owner);
  }

  function plank(x1: number, x2: number, y: number, thickness = .10) {
    return timber(box(P.edge, [x2 - x1, thickness, shelfDepth], [(x1 + x2) / 2, y, (front + back) / 2]));
  }

  function upright(x: number, bottom: number, top: number, width = .12) {
    return timber(box(P.oak, [width, top - bottom, shelfDepth], [x, (bottom + top) / 2, (front + back) / 2]));
  }

  function arch(radius: number, bottom: number) {
    const shape = new THREE.Shape();
    shape.moveTo(-radius, bottom);
    shape.lineTo(radius, bottom);
    shape.lineTo(radius, spring);
    shape.absarc(0, spring, radius, 0, Math.PI, false);
    shape.lineTo(-radius, bottom);
    shape.closePath();
    return shape;
  }

  function extrude(color: string, shape: THREE.Shape, depth: number, position: Vec3, bevel = 0) {
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth, steps: 1, curveSegments: 32, bevelEnabled: bevel > 0,
      bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1,
    });
    const mesh = k.mesh(color, geometry, position, undefined, undefined, wall);
    mesh.userData.surface = 'paint';
    return mesh;
  }

  function bandShape(inner: number, outer: number, start: number, end: number) {
    const points: THREE.Vector2[] = [];
    const steps = 32;
    for (let i = 0; i <= steps; i++) {
      const a = THREE.MathUtils.degToRad(start + (end - start) * i / steps);
      points.push(new THREE.Vector2(center + outer * Math.cos(a), spring + outer * Math.sin(a)));
    }
    for (let i = steps; i >= 0; i--) {
      const a = THREE.MathUtils.degToRad(start + (end - start) * i / steps);
      points.push(new THREE.Vector2(center + inner * Math.cos(a), spring + inner * Math.sin(a)));
    }
    return new THREE.Shape(points);
  }

  function curvedTimber(shape: THREE.Shape, name: string) {
    const body = timber(extrude(P.edge, shape, shelfDepth, [0, 0, back]));
    body.name = name;
    const skin = timber(k.mesh(P.edge, new THREE.ShapeGeometry(shape), [0, 0, front + .002], undefined, undefined, wall));
    skin.name = `${name} planar face`;
    return body;
  }

  function radialFin(degrees: number, inner: number, outer: number) {
    const angle = THREE.MathUtils.degToRad(degrees);
    const radius = (inner + outer) / 2;
    // Recess the divider faces behind the door surround as well as both shelf
    // lips; the old z=.405 face projected .005 beyond the surround at its foot.
    const fin = timber(box(P.oak, [.055, outer - inner, .68], [center + radius * Math.cos(angle), spring + radius * Math.sin(angle), .055]));
    fin.rotation.z = angle - Math.PI / 2;
    fin.name = 'Radial timber book stop';
  }

  // Two useful shelf bands share the door's spring. The outer one stops short
  // on the left and sweeps down into a lower right wing, rather than closing
  // into a mechanically repeated ring or a rectangular cabinet silhouette.
  curvedTimber(bandShape(1.86, 1.98, 0, 180), 'Middle oak shelf arch');
  curvedTimber(bandShape(2.48, 2.60, 12, 160), 'Open outer oak shelf arch');
  for (const angle of [28, 74, 110, 155]) radialFin(angle, outerRadius, 1.86);
  for (const angle of [26, 77, 122, 158]) radialFin(angle, 1.98, 2.48);

  const startAngle = THREE.MathUtils.degToRad(12);
  const tailStart = new THREE.Vector2(center + 2.54 * Math.cos(startAngle), spring + 2.54 * Math.sin(startAngle));
  const tailTangent = new THREE.Vector2(Math.sin(startAngle), -Math.cos(startAngle));
  const tailCurve = new THREE.CubicBezierCurve(tailStart, tailStart.clone().addScaledVector(tailTangent, .57), new THREE.Vector2(5.40, 2.30), new THREE.Vector2(5.91, 2.30));
  const tailEdges: THREE.Vector2[][] = [[], []];
  for (let i = 0; i <= 26; i++) {
    const t = i / 26, p = tailCurve.getPoint(t), tangent = tailCurve.getTangent(t);
    const normal = (i === 0 ? new THREE.Vector2(Math.cos(startAngle), Math.sin(startAngle)) : new THREE.Vector2(-tangent.y, tangent.x)).multiplyScalar(.06);
    tailEdges[0].push(p.clone().add(normal));
    tailEdges[1].push(p.clone().sub(normal));
  }
  curvedTimber(new THREE.Shape([...tailEdges[0], ...tailEdges[1].slice().reverse()]), 'Descending right shelf sweep');

  // Straight working shelves are concentrated low down, so books can be taken
  // out normally; their unequal spans give the curved upper part room to breathe.
  upright(.38, .24, spring);
  upright(4.22, .24, spring);
  upright(-.14, .24, 2.23, .10);
  // The last post is scribed to the sampled underside of the descending shelf.
  // A rectangular post through this curve left a visible dark wedge at the joint.
  const tailBottomAt = (x: number) => {
    const lower = tailEdges[1];
    for (let i = 1; i < lower.length; i++) {
      if (x <= lower[i].x) {
        const previous = lower[i - 1], next = lower[i];
        return THREE.MathUtils.lerp(previous.y, next.y, (x - previous.x) / (next.x - previous.x));
      }
    }
    return lower[lower.length - 1].y;
  };
  const postTop = [new THREE.Vector2(5.79, tailBottomAt(5.79)), ...tailEdges[1].filter(p => p.x > 5.79 && p.x < 5.91), new THREE.Vector2(5.91, tailBottomAt(5.91))];
  const postOutline = [new THREE.Vector2(5.79, .24), new THREE.Vector2(5.91, .24), ...postTop.reverse()];
  const postShape = new THREE.Shape(postOutline);
  timber(extrude(P.oak, postShape, shelfDepth, [0, 0, back]));
  timber(k.mesh(P.oak, new THREE.ShapeGeometry(postShape), [0, 0, front + .002], undefined, undefined, wall)).name = 'Scribed post planar face';
  for (const [x1, x2] of [[-.19, 1.07], [3.53, 5.94]]) {
    timber(box(P.darkOak, [x2 - x1, .12, .61], [(x1 + x2) / 2, .06, .015]));
    plank(x1, x2, .18, .12);
  }
  // Butt joins terminate at the post faces. Overlapping full-width boards and
  // posts made coincident front surfaces, even though every book fitted its bay.
  plank(-.09, .32, 1.20);
  plank(.44, 1.07, 1.20);
  plank(-.19, .32, 2.28);
  plank(.44, 1.07, 1.92);
  plank(3.53, 4.16, .96);
  plank(3.53, 4.16, 1.73);
  plank(4.28, 5.79, 1.08);
  plank(4.28, 5.79, 1.80);

  // The door surround also carries the inner run of radial books.
  const frameWidth = outerRadius - openingRadius;
  for (const side of [-1, 1]) {
    timber(box(P.edge, [frameWidth, spring, .70], [center + side * (openingRadius + frameWidth / 2), spring / 2, .05]));
  }
  const archFrame = new THREE.Shape();
  archFrame.moveTo(-outerRadius, spring);
  archFrame.absarc(0, spring, outerRadius, Math.PI, 0, true);
  archFrame.lineTo(openingRadius, spring);
  archFrame.absarc(0, spring, openingRadius, 0, Math.PI, false);
  archFrame.closePath();
  timber(extrude(P.edge, archFrame, .70, [center, 0, back]));
  timber(box(P.darkOak, [openingRadius * 2, .045, .65], [center, .0225, .025]));

  // The blue leaf, its upper recessed panel, and its shadow reveal all share
  // the same circular spring. There is no rectangular slab behind a fake arch.
  extrude(P.ink, arch(openingRadius, .035), .028, [center, 0, -.265]);
  const door = extrude(P.blue, arch(1.035, .058), .12, [center, 0, -.215], .009);
  door.name = 'Blue arched door leaf';
  // Keep the broad cap planar so the offline atlas resolves its shadows instead
  // of interpolating AO across the extruded shape's long fan triangles.
  // The body's foremost bevel is z=-.086; this matching skin clears it by .002.
  const doorSkin = k.mesh(P.blue, new THREE.ShapeGeometry(arch(1.035, .058), 32), [center, 0, -.084], undefined, undefined, wall);
  doorSkin.name = 'Arched door planar front skin';
  doorSkin.userData.surface = 'paint';
  const upperPanel = extrude(P.bluePanel, arch(.82, 1.51), .024, [center, 0, -.087], .012);
  upperPanel.name = 'Arched upper door panel';
  const lowerPanel = box(P.bluePanel, [1.64, 1.04, .038], [center, .82, -.068]);
  lowerPanel.userData.surface = 'paint';
  // Slim raised panel rails create real grazing-light edges without rounding
  // the entire door into a toy-like object.
  for (const y of [.29, 1.35]) box(P.blueLight, [1.676, .026, .018], [center, y, -.043]).userData.surface = 'paint';
  for (const x of [center - .826, center + .826]) box(P.blueLight, [.024, 1.034, .018], [x, .82, -.043]).userData.surface = 'paint';
  for (const y of [.51, 1.88]) {
    const hinge = k.cylinder(P.brass, .023, .023, .17, [center - 1.032, y, -.058], undefined, 10, wall);
    hinge.userData.surface = 'metal';
  }
  box(P.brass, [.065, .23, .024], [center + .78, 1.26, -.043]).userData.surface = 'metal';
  k.cylinder(P.brass, .045, .045, .10, [center + .78, 1.30, .014], [Math.PI / 2, 0, 0], 14, wall).userData.surface = 'metal';
  box(P.brass, [.17, .035, .038], [center + .72, 1.30, .068]).userData.surface = 'metal';

  const colors = [P.cream, P.blue, P.blueLight, P.taupe, P.ink, '#cfb786', P.paper];
  let volumeIndex = 0;

  function bookCaseGeometry(width: number, height: number, depth: number) {
    const halfW = width / 2, halfD = depth / 2, side = .013, spine = .024;
    // One U-shaped shell replaces three intersecting boxes. In particular, its
    // spine has only one visible face, including the two cover/spine corners.
    const outline = [
      [-halfW, -halfD], [-halfW, halfD], [halfW, halfD], [halfW, -halfD],
      [halfW - side, -halfD], [halfW - side, halfD - spine],
      [-halfW + side, halfD - spine], [-halfW + side, -halfD],
    ];
    const shape = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, -z)));
    return new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, steps: 1 }).rotateX(-Math.PI / 2);
  }

  function boundVolume(group: THREE.Group, width: number, height: number, depth: number, seed: number) {
    group.userData.surface = 'cloth';
    const color = colors[seed % colors.length];
    box(P.paper, [width - .030, height - .028, depth - .038], [0, height / 2, -.007], group);
    k.mesh(color, bookCaseGeometry(width, height, depth), undefined, undefined, undefined, group).name = 'Continuous book cover and spine';
    if (seed % 3 !== 2) {
      for (const y of [height * .17, height * .81]) box(seed % 2 ? P.paper : P.ink, [width * .69, .012, .006], [0, y, depth / 2 + .003], group);
    }
    if (seed % 4 === 0) box(P.paper, [width * .56, .055, .007], [0, height * .54, depth / 2 + .004], group);
  }

  function radialBooks(start: number, end: number, radius: number, ceiling: number, seed: number) {
    let cursor = THREE.MathUtils.degToRad(start);
    const stop = THREE.MathUtils.degToRad(end);
    for (let i = 0; i < 16; i++) {
      const width = .083 + ((seed + i * 5) % 6) * .011;
      const height = Math.min(ceiling - radius - .055, .35 + ((seed + i * 3) % 7) * .022);
      const halfAngle = Math.atan2(width / 2, radius);
      if (cursor + halfAngle * 2 > stop) break;
      const angle = cursor + halfAngle;
      const group = k.group(`Radial library volume ${volumeIndex++}`, [center + radius * Math.cos(angle), spring + radius * Math.sin(angle), .15 + (i % 3) * .008], [0, 0, angle - Math.PI / 2], wall);
      boundVolume(group, width, height, .29 + (i % 3) * .018, seed + i);
      cursor += halfAngle * 2 + .024 / radius;
    }
  }

  function uprightBooks(x1: number, x2: number, floor: number, ceiling: number, seed: number, maxCount = 20) {
    let cursor = x1;
    for (let i = 0; i < maxCount; i++) {
      const width = .075 + ((i * 5 + seed * 3) % 7) * .011;
      const height = Math.min(ceiling - floor - .025, .34 + ((i * 7 + seed) % 9) * .026);
      const lean = i === 3 && seed % 3 === 1 ? .075 : i === 6 && seed % 2 === 0 ? -.06 : 0;
      const c = Math.cos(lean), s = Math.sin(lean);
      const footprint = width * c + height * Math.abs(s);
      const projectedHeight = height * c + width * Math.abs(s);
      if (cursor + footprint > x2 || projectedHeight > ceiling - floor) break;
      const depth = .29 + ((seed + i * 3) % 4) * .018;
      const originX = cursor + width * c / 2 + Math.max(0, height * s);
      const group = k.group('Library bound volume', [originX, floor + width * Math.abs(s) / 2, .16 + (i % 3) * .009], [0, 0, lean], wall);
      group.name += ` ${volumeIndex++}`;
      boundVolume(group, width, height, depth, seed + i);
      cursor += footprint + .018;
    }
  }

  function stackedBooks(x: number, floor: number, width: number, count: number, seed: number) {
    let bottom = floor;
    for (let i = 0; i < count; i++) {
      const height = .075 + (i % 2) * .012;
      const w = width - (i % 3) * .055;
      const offset = (i % 2 ? .025 : -.018);
      const group = k.group('Library horizontal folio', [x + offset, bottom, .16], undefined, wall);
      group.userData.surface = 'cloth';
      const color = colors[(i + seed) % colors.length];
      box(P.paper, [w - .028, height - .030, .302], [0, height / 2, -.007], group);
      const cover = bookCaseGeometry(height, w, .34).rotateZ(Math.PI / 2).translate(w / 2, height / 2, 0);
      k.mesh(color, cover, undefined, undefined, undefined, group).name = 'Continuous horizontal book case';
      box(P.paper, [.12, .012, .006], [w * .25, height / 2, .176], group);
      bottom += height;
    }
  }

  function archiveBox(x: number, floor: number, width: number, color: string) {
    const g = k.group('Linen archive box', [x, floor, .105], undefined, wall);
    g.userData.surface = 'cloth';
    box(color, [width, .29, .43], [0, .145, 0], g);
    box(P.cream, [width + .018, .035, .45], [0, .291, 0], g);
    box(P.brass, [.17, .07, .010], [0, .18, .221], g).userData.surface = 'metal';
    box(P.paper, [.134, .038, .008], [0, .18, .229], g);
  }

  // Each cluster sits on a real curved bearing surface and has a radial book
  // stop. Open wedges between groups break up the rhythm without fake cubbies.
  radialBooks(31, 66, 1.236, 1.86, 2);
  radialBooks(80, 106, 1.236, 1.86, 5);
  radialBooks(119, 151, 1.236, 1.86, 0);
  radialBooks(30, 67, 1.986, 2.48, 3);
  radialBooks(83, 118, 1.986, 2.48, 6);
  radialBooks(132, 154, 1.986, 2.48, 1);

  uprightBooks(-.06, .27, .243, 1.13, 2);
  archiveBox(.74, .243, .48, P.blueLight);
  stackedBooks(.10, 1.255, .29, 3, 3);
  uprightBooks(.49, 1.00, 1.255, 1.85, 4);
  uprightBooks(.49, 1.00, 1.975, 2.31, 6);
  uprightBooks(3.61, 4.10, .243, .89, 3);
  stackedBooks(3.87, 1.015, .45, 3, 1);
  uprightBooks(3.61, 4.10, 1.785, 2.30, 5);
  uprightBooks(4.35, 5.10, .243, 1.01, 6);
  archiveBox(5.49, .243, .49, P.cream);
  stackedBooks(4.75, 1.135, .72, 3, 4);
  uprightBooks(5.22, 5.76, 1.135, 1.73, 0);
  uprightBooks(4.35, 5.13, 1.855, 2.20, 4);
  stackedBooks(5.51, 1.855, .45, 2, 2);
}
