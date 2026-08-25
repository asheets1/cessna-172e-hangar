import * as THREE from "three";

export type Station = { z: number; rx: number; ry: number; cy: number; p?: number };

/** Superellipse loft (p=1 ellipse-ish, p<1 boxier cabin). */
export function loftBody(
  stations: Station[],
  radial = 36,
  az: [number, number] = [0, Math.PI * 2],
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const rings = stations.length;
  const cols = radial + 1;
  const [a0, a1] = az;
  for (let i = 0; i < rings; i++) {
    const s = stations[i]!;
    const p = s.p ?? 1.15;
    for (let j = 0; j <= radial; j++) {
      const t = j / radial;
      const a = a0 + t * (a1 - a0);
      const c = Math.cos(a);
      const sn = Math.sin(a);
      const x = Math.sign(c) * s.rx * Math.abs(c) ** p;
      const y = Math.sign(sn) * s.ry * Math.abs(sn) ** p + s.cy;
      positions.push(x, y, s.z);
      uvs.push(t, i / (rings - 1));
    }
  }
  const indices: number[] = [];
  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * cols + j;
      const b = a + cols;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function loftSections(sections: THREE.Vector3[][]): THREE.BufferGeometry {
  const n = sections[0]!.length;
  const rings = sections.length;
  const positions: number[] = [];
  const uvs: number[] = [];
  for (let i = 0; i < rings; i++) {
    const sec = sections[i]!;
    for (let j = 0; j < n; j++) {
      const p = sec[j]!;
      positions.push(p.x, p.y, p.z);
      uvs.push(j / (n - 1), i / (rings - 1));
    }
  }
  const indices: number[] = [];
  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < n - 1; j++) {
      const a = i * n + j;
      const b = a + n;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function cylinderBetween(
  a: THREE.Vector3,
  b: THREE.Vector3,
  rTop: number,
  rBot = rTop,
  segs = 12,
): { geometry: THREE.BufferGeometry; position: THREE.Vector3; quaternion: THREE.Quaternion } {
  const dir = b.clone().sub(a);
  const len = Math.max(dir.length(), 0.01);
  const geometry = new THREE.CylinderGeometry(rTop, rBot, len, segs, 1, false);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.normalize(),
  );
  const position = a.clone().add(b).multiplyScalar(0.5);
  return { geometry, position, quaternion };
}

export function quatToTuple(q: THREE.Quaternion): [number, number, number, number] {
  return [q.x, q.y, q.z, q.w];
}

export function shapeExtrude(points: THREE.Vector2[], depth: number): THREE.BufferGeometry {
  const shape = new THREE.Shape(points);
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 8,
  });
}
