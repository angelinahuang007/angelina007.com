import { SceneKit, Vec3 } from './kit';
import { createLabDetails } from './lab-detail';

/** Open steel flight: the upper tread meets the control landing at z=4.225. */
export function buildControlStair(k: SceneKit, detail: ReturnType<typeof createLabDetails>) {
  const root = k.group('Open control stair');
  const steel = '#535d72', dark = '#202b3d', blue = '#164caf', gold = '#e2a233';
  const centerX = -5.55, frontZ = 8.425, count = 12;
  const run = .35, rise = 3.53 / count, thickness = .105;
  const upper = (s: number) => rise / run * s - thickness;
  const block = (color: string, size: Vec3, position: Vec3, name: string) => {
    const mesh = k.box(color, size, position, undefined, root);
    mesh.name = name;
    mesh.userData.surface = 'metal';
    return mesh;
  };

  for (let i = 0; i < count; i++) {
    const top = rise * (i + 1), z = frontZ - (i + .5) * run;
    block(steel, [1.5, thickness, run], [centerX, top - thickness / 2, z], 'Open steel tread');
    block(gold, [1.36, .018, .045], [centerX, top + .011, z + .14], 'Safety nosing');
    for (const dz of [-.095, .005]) {
      block(dark, [1.2, .008, .018], [centerX, top + .005, z + dz], 'Tread grip strip');
    }
  }

  // These plates follow the underside of the tread backs and stop at the floor.
  // The old full-height blocks filled the entire side silhouette with solid grey.
  for (const x of [centerX - .69, centerX + .69]) {
    const stringer = k.group('Sloping steel stringer', [x, 0, frontZ], [0, Math.PI / 2, 0], root);
    const start = thickness * run / rise;
    detail.profile(steel, [[start, 0], [4.2, upper(4.2)], [4.2, upper(4.2) - .24], [(.24 + thickness) * run / rise, 0]], .10, stringer, 0);
    block(dark, [.26, .035, .46], [x, .0175, frontZ - .28], 'Stringer floor shoe');
    // Triangular tread brackets give the thin plates a full bearing surface.
    const supports = k.group('Tread support angles', [x + (x < centerX ? .08 : -.08), 0, frontZ], [0, Math.PI / 2, 0], root);
    for (let i = 0; i < count; i++) {
      const a = Math.max(i * run + .04, start + .015), b = (i + 1) * run;
      const top = rise * (i + 1) - thickness;
      detail.profile(dark, [[a, top], [b, top], [a, upper(a)]], .075, supports, 0);
    }
  }

  // Three short cheek plates establish a broken diagonal rhythm. Their faces
  // stand clear of the tread ends; the two small ties attach each to its stringer.
  for (const [start, end] of [[.56, 1.38], [1.81, 2.74], [3.16, 4.12]]) {
    const cheek = k.group('Blue stringer cover', [-4.77, 0, frontZ], [0, Math.PI / 2, 0], root);
    detail.profile(blue, [
      [start, upper(start) - .15], [start + .075, upper(start + .075) + .045],
      [end, upper(end) + .045], [end, upper(end) - .15],
      [end - .075, upper(end - .075) - .205], [start, upper(start) - .205],
    ], .028, cheek, .005);
    for (const s of [start + .14, end - .12]) {
      block(dark, [.045, .075, .075], [-4.7975, upper(s) - .075, frontZ - s], 'Cheek attachment');
      detail.fastener([s, upper(s) - .075, .014], .022, cheek);
    }
  }

  // Restrained cyan inserts, with matching offline light sources in the bake.
  for (const s of [.97, 2.28]) {
    const a: Vec3 = [-4.747, upper(s - .19) - .06, frontZ - s + .19];
    const b: Vec3 = [-4.747, upper(s + .19) - .06, frontZ - s - .19];
    detail.unlit(k.beam('#91d6e8', a, b, .019, root));
  }

  for (const x of [centerX - .68, centerX + .68]) {
    for (const i of [0, 4, 8, 11]) {
      const y = rise * (i + 1), z = frontZ - (i + .5) * run;
      block(dark, [.15, .04, .18], [x, y + .02, z], 'Handrail base');
      k.beam(gold, [x, y + .04, z], [x, y + .8, z], .045, root);
    }
    for (const height of [.41, .8]) {
      k.beam(gold, [x, rise + height, frontZ - run / 2], [x, 3.53 + height, 4.4], .045, root);
    }
  }
  // The outside rail continues round the landing; the loft-side entry stays open.
  for (const height of [.41, .8]) k.beam(gold, [-4.87, 3.53 + height, 4.4], [-4.87, 3.53 + height, 3.275], .045, root);
  return root;
}
