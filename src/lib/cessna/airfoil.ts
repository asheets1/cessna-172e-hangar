import * as THREE from "three";

/** NACA 4-digit section. x is chord fraction 0..1. Returns (x,y) in inches. */
export function naca4(
  chord: number,
  m = 0.02,
  p = 0.4,
  t = 0.12,
  n = 36,
): THREE.Vector2[] {
  const upper: THREE.Vector2[] = [];
  const lower: THREE.Vector2[] = [];
  for (let i = 0; i <= n; i++) {
    const x = 0.5 * (1 - Math.cos((Math.PI * i) / n));
    const yt =
      5 *
      t *
      chord *
      (0.2969 * Math.sqrt(x) -
        0.126 * x -
        0.3516 * x * x +
        0.2843 * x * x * x -
        0.1036 * x * x * x * x);
    let yc: number;
    let dyc: number;
    if (x < p) {
      yc = (m * chord * (2 * p * x - x * x)) / (p * p);
      dyc = (2 * m * (p - x)) / (p * p);
    } else {
      const dp = 1 - p;
      yc = (m * chord * (1 - 2 * p + 2 * p * x - x * x)) / (dp * dp);
      dyc = (2 * m * (p - x)) / (dp * dp);
    }
    const th = Math.atan(dyc);
    upper.push(
      new THREE.Vector2(x * chord - yt * Math.sin(th), yc + yt * Math.cos(th)),
    );
    lower.push(
      new THREE.Vector2(x * chord + yt * Math.sin(th), yc - yt * Math.cos(th)),
    );
  }
  const closed = [...upper, ...lower.slice().reverse().slice(1, -1)];
  return closed;
}

export function naca2412(chord: number, n = 36): THREE.Vector2[] {
  return naca4(chord, 0.02, 0.4, 0.12, n);
}

export function naca0012(chord: number, n = 28): THREE.Vector2[] {
  return naca4(chord, 0, 0.4, 0.12, n);
}
