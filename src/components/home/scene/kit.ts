import * as THREE from 'three';

export type Vec3 = [number, number, number];
export type BuiltRoom = {
  root: THREE.Group;
  camera: { position: Vec3; target: Vec3 };
  name: string;
};

/** Offline modeling helpers. These builders are not included in the browser bundle. */
export class SceneKit {
  root = new THREE.Group();

  group(name: string, position: Vec3 = [0, 0, 0], rotation: Vec3 = [0, 0, 0], parent: THREE.Object3D = this.root) {
    const group = new THREE.Group();
    group.name = name;
    group.position.set(...position);
    group.rotation.set(...rotation);
    parent.add(group);
    return group;
  }

  mesh(color: THREE.ColorRepresentation, geometry: THREE.BufferGeometry, position: Vec3 = [0, 0, 0], scale: Vec3 = [1, 1, 1], rotation: Vec3 = [0, 0, 0], parent: THREE.Object3D = this.root) {
    const material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    mesh.rotation.set(...rotation);
    parent.add(mesh);
    return mesh;
  }

  box(color: THREE.ColorRepresentation, size: Vec3, position: Vec3, rotation: Vec3 = [0, 0, 0], parent: THREE.Object3D = this.root) {
    return this.mesh(color, new THREE.BoxGeometry(...size), position, [1, 1, 1], rotation, parent);
  }

  cylinder(color: THREE.ColorRepresentation, top: number, bottom: number, height: number, position: Vec3, rotation: Vec3 = [0, 0, 0], segments = 12, parent: THREE.Object3D = this.root) {
    return this.mesh(color, new THREE.CylinderGeometry(top, bottom, height, segments), position, [1, 1, 1], rotation, parent);
  }

  sphere(color: THREE.ColorRepresentation, scale: Vec3, position: Vec3, parent: THREE.Object3D = this.root) {
    return this.mesh(color, new THREE.IcosahedronGeometry(1, 1), position, scale, [0, 0, 0], parent);
  }

  beam(color: THREE.ColorRepresentation, a: Vec3, b: Vec3, width = 0.1, parent: THREE.Object3D = this.root) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const delta = end.clone().sub(start);
    const mesh = this.box(color, [width, delta.length(), width], start.clone().add(end).multiplyScalar(0.5).toArray() as Vec3, [0, 0, 0], parent);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    return mesh;
  }

  torus(color: THREE.ColorRepresentation, radius: number, tube: number, position: Vec3, rotation: Vec3 = [0, 0, 0], arc = Math.PI * 2, parent: THREE.Object3D = this.root) {
    return this.mesh(color, new THREE.TorusGeometry(radius, tube, 6, 64, arc), position, [1, 1, 1], rotation, parent);
  }

  patch(color: THREE.ColorRepresentation, points: Vec3[], parent: THREE.Object3D = this.root) {
    const vertices = points.map(point => new THREE.Vector3(...point));
    const normal = new THREE.Vector3().crossVectors(vertices[1].clone().sub(vertices[0]), vertices[2].clone().sub(vertices[0])).normalize();
    const dominant = [Math.abs(normal.x), Math.abs(normal.y), Math.abs(normal.z)];
    const axis = dominant.indexOf(Math.max(...dominant));
    const projected = vertices.map(p => axis === 0 ? new THREE.Vector2(p.y, p.z) : axis === 1 ? new THREE.Vector2(p.x, p.z) : new THREE.Vector2(p.x, p.y));
    const triangles = THREE.ShapeUtils.triangulateShape(projected, []);
    const positions: number[] = [];
    for (const triangle of triangles) for (const index of triangle) positions.push(...vertices[index].toArray());
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    return this.mesh(color, geometry, [0, 0, 0], [1, 1, 1], [0, 0, 0], parent);
  }

  picture(texture: THREE.Texture, size: [number, number], position: Vec3, rotation: Vec3 = [0, 0, 0], parent: THREE.Object3D = this.root) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 2;
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true, alphaTest: 0.03, depthWrite: true });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...size), material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    parent.add(mesh);
    return mesh;
  }

  label(text: string, color: string, background: string, width: number, height: number, position: Vec3, rotation: Vec3 = [0, 0, 0], parent: THREE.Object3D = this.root) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = Math.max(64, Math.round(512 * height / width));
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `500 ${Math.min(canvas.height * 0.48, canvas.width / (text.length * 0.68))}px monospace`;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    return this.picture(new THREE.CanvasTexture(canvas), [width, height], position, rotation, parent);
  }

  /** Preserve authored surfaces; scripts/bake-rooms.mjs lights and batches them offline. */
  finish() {
    this.root.updateMatrixWorld(true);
    return this.root;
  }

}

export function disposeRoom(root: THREE.Object3D) {
  const textures = new Set<THREE.Texture>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach(material => {
      if (material instanceof THREE.MeshBasicMaterial && material.map) textures.add(material.map);
      material.dispose();
    });
  });
  const bitmaps = new Set<ImageBitmap>();
  textures.forEach(texture => {
    const image = texture.image;
    if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) bitmaps.add(image);
    texture.dispose();
  });
  // GLTFLoader decodes embedded images to ImageBitmaps. Release those CPU-side
  // images as well as their GPU textures when visitors switch between rooms.
  bitmaps.forEach(bitmap => bitmap.close());
  root.clear();
}
