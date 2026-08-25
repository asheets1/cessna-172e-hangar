import * as THREE from "three";
import { naca0012, naca2412 } from "./airfoil";
import { loftBody, loftSections, cylinderBetween, quatToTuple, shapeExtrude } from "./loft";
import { SPEC } from "./specs";
import type { PartRole, Visual } from "./types";

const WING_Y = 66.2;
const ROOT_X = 22;
const CABIN_CY = 41;

function v(
  id: string,
  geometry: THREE.BufferGeometry,
  position: [number, number, number],
  explode: [number, number, number],
  materialKey: string,
  role: PartRole,
  extra: Partial<Visual> = {},
): Visual {
  return { id, geometry, position, explode, materialKey, role, ...extra };
}

function tube(
  id: string,
  a: THREE.Vector3,
  b: THREE.Vector3,
  r: number,
  explode: [number, number, number],
  materialKey: string,
  role: PartRole,
  extra: Partial<Visual> = {},
): Visual {
  const c = cylinderBetween(a, b, r);
  return v(id, c.geometry, c.position.toArray() as [number, number, number], explode, materialKey, role, {
    quaternion: quatToTuple(c.quaternion),
    ...extra,
  });
}

function ribShape(): THREE.BufferGeometry {
  const pts = naca2412(SPEC.wing.chord, 22);
  const shape = new THREE.Shape(pts);
  const h1 = new THREE.Path();
  h1.absellipse(18, 0.35, 5.5, 1.45, 0, Math.PI * 2, true);
  const h2 = new THREE.Path();
  h2.absellipse(38, 0.15, 4.6, 1.15, 0, Math.PI * 2, true);
  shape.holes.push(h1, h2);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: false, curveSegments: 8 });
  geo.rotateY(-Math.PI / 2);
  return geo;
}

function wingSections(side: 1 | -1): THREE.Vector3[][] {
  const { chord, semiSpan, dihedralDeg, incidenceRootDeg, washoutDeg } = SPEC.wing;
  const foil = naca2412(chord, 28);
  const dih = (dihedralDeg * Math.PI) / 180;
  const stations = 8;
  const sections: THREE.Vector3[][] = [];
  for (let i = 0; i <= stations; i++) {
    const t = i / stations;
    const xLocal = ROOT_X + t * (semiSpan - ROOT_X);
    const inc = ((incidenceRootDeg - washoutDeg * t) * Math.PI) / 180;
    const sec = foil.map((p) => {
      const y2 = p.y * Math.cos(inc) - p.x * Math.sin(inc);
      const z2 = p.y * Math.sin(inc) + p.x * Math.cos(inc);
      const x = xLocal * side;
      const y = WING_Y + y2 + (xLocal - ROOT_X) * Math.tan(dih);
      const z = SPEC.stations.wingLE + z2;
      return new THREE.Vector3(x, y, z);
    });
    sections.push(sec);
  }
  return sections;
}

function controlSurface(
  side: 1 | -1,
  x0: number,
  x1: number,
  chordStart: number,
  chordLen: number,
): THREE.BufferGeometry {
  const foil = naca2412(SPEC.wing.chord, 16);
  const te = foil.filter((p) => p.x >= chordStart);
  const local = te.map((p) => new THREE.Vector2(p.x - chordStart, p.y * 0.92));
  if (local[0] && local[local.length - 1]) {
    local.push(new THREE.Vector2(0, local[local.length - 1]!.y));
  }
  const depth = Math.abs(x1 - x0);
  const geo = shapeExtrude(local, depth);
  geo.rotateY(-Math.PI / 2);
  if (side < 0) geo.scale(-1, 1, 1);
  return geo;
}

function buildWing(side: 1 | -1, out: Visual[]) {
  const L = side < 0 ? "L" : "R";
  const sx = side;
  const ex = 92 * sx;
  const ey = 36;
  const sections = wingSections(side);
  out.push(
    v(`WING-${L}-SKIN-UPPER`, loftSections(sections), [0, 0, 0], [ex, ey, 0], "paint", "skin", {
      doubleSide: true,
    }),
  );
  const lowerPlate = new THREE.BoxGeometry(SPEC.wing.semiSpan - ROOT_X - 8, 0.25, SPEC.wing.chord - 4);
  out.push(
    v(
      `WING-${L}-SKIN-LOWER`,
      lowerPlate,
      [((ROOT_X + SPEC.wing.semiSpan) / 2) * sx, WING_Y - 2.6, SPEC.stations.wingLE + SPEC.wing.chord / 2],
      [ex, ey - 10, 6],
      "paint",
      "skin",
    ),
  );

  const sparLen = SPEC.wing.semiSpan - ROOT_X - 6;
  const sparX = (ROOT_X + sparLen / 2) * sx;
  const sparY = WING_Y + 1.2 + 8 * Math.tan((SPEC.wing.dihedralDeg * Math.PI) / 180);
  out.push(
    v(
      `WING-${L}-SPAR-MAIN`,
      new THREE.BoxGeometry(sparLen, 6.4, 1.35),
      [sparX, sparY, SPEC.stations.mainSpar],
      [ex * 0.55, ey * 0.4, 0],
      "aluminum",
      "structure",
    ),
  );
  out.push(
    v(
      `WING-${L}-SPAR-REAR`,
      new THREE.BoxGeometry(sparLen * 0.98, 3.6, 0.9),
      [sparX, WING_Y + 0.4, SPEC.stations.rearSpar],
      [ex * 0.6, ey * 0.35, 8],
      "aluminum",
      "structure",
    ),
  );

  const ribGeo = ribShape();
  for (let i = 0; i < SPEC.wing.ribCount; i++) {
    const t = i / (SPEC.wing.ribCount - 1);
    const xLocal = ROOT_X + 4 + t * (SPEC.wing.semiSpan - ROOT_X - 10);
    const n = String(i + 1).padStart(2, "0");
    const y = WING_Y + (xLocal - ROOT_X) * Math.tan((SPEC.wing.dihedralDeg * Math.PI) / 180);
    out.push(
      v(
        `WING-${L}-RIB-${n}`,
        ribGeo,
        [xLocal * sx, y, SPEC.stations.wingLE],
        [ex * (0.7 + t * 0.35), ey * 0.5, t * 6],
        "alclad",
        "structure",
      ),
    );
  }

  const flapGeo = controlSurface(side, 0, SPEC.wing.flapSpan, SPEC.wing.chord - SPEC.wing.flapChord, SPEC.wing.flapChord);
  const flapX = (ROOT_X + 8 + SPEC.wing.flapSpan / 2) * sx;
  out.push(
    v(
      `WING-${L}-FLAP`,
      flapGeo,
      [flapX - (SPEC.wing.flapSpan / 2) * sx, WING_Y - 0.2, SPEC.stations.wingLE + SPEC.wing.chord - SPEC.wing.flapChord],
      [ex, ey * 0.2, 28],
      "paint",
      "skin",
      { doubleSide: true },
    ),
  );

  const ailGeo = controlSurface(side, 0, SPEC.wing.aileronSpan, SPEC.wing.chord - SPEC.wing.aileronChord, SPEC.wing.aileronChord);
  const ailX0 = ROOT_X + 8 + SPEC.wing.flapSpan + 8;
  out.push(
    v(
      `WING-${L}-AILERON`,
      ailGeo,
      [ailX0 * sx, WING_Y - 0.15, SPEC.stations.wingLE + SPEC.wing.chord - SPEC.wing.aileronChord],
      [ex * 1.15, ey * 0.15, 24],
      "paint",
      "skin",
      { doubleSide: true },
    ),
  );

  const tip = new THREE.SphereGeometry(4.6, 12, 10, 0, Math.PI);
  tip.rotateY(side < 0 ? Math.PI : 0);
  tip.scale(1.1, 0.72, 2.4);
  out.push(
    v(
      `WING-${L}-TIP`,
      tip,
      [(SPEC.wing.semiSpan - 2) * sx, WING_Y + 1.2 + 14, SPEC.stations.wingLE + SPEC.wing.chord * 0.45],
      [ex * 1.3, ey, 0],
      "paint",
      "fairing",
    ),
  );

  const strutLow = new THREE.Vector3(21 * sx, 21.5, 46);
  const strutHigh = new THREE.Vector3(SPEC.wing.strutAttachX * sx, WING_Y + 0.6, SPEC.stations.mainSpar);
  out.push(tube(`WING-${L}-STRUT`, strutLow, strutHigh, 1.15, [ex * 0.45, -28, 10], "aluminum", "structure"));

  const juryA = strutLow.clone().lerp(strutHigh, 0.42);
  const juryB = new THREE.Vector3(SPEC.wing.juryAttachX * sx, WING_Y + 0.2, SPEC.stations.mainSpar - 8);
  out.push(tube(`WING-${L}-JURY`, juryA, juryB, 0.55, [ex * 0.4, -18, 6], "aluminum", "structure"));

  out.push(
    v(
      `WING-${L}-FAIRING-ROOT`,
      new THREE.BoxGeometry(8, 5, 36),
      [18 * sx, WING_Y - 1, SPEC.stations.wingLE + 28],
      [12 * sx, 10, 0],
      "paint",
      "fairing",
    ),
  );

  out.push(
    v(
      `FUEL-TANK-${L}`,
      new THREE.BoxGeometry(48, 5.2, 22),
      [(ROOT_X + 28) * sx, WING_Y + 0.8, SPEC.stations.wingLE + 16],
      [ex * 0.3, 48, -6],
      "fuel",
      "system",
    ),
  );
  out.push(
    v(
      `FUEL-CAP-${L}`,
      new THREE.CylinderGeometry(1.6, 1.6, 0.7, 16),
      [(ROOT_X + 30) * sx, WING_Y + 4.2, SPEC.stations.wingLE + 10],
      [ex * 0.3, 56, -6],
      "chrome",
      "system",
    ),
  );
}

function buildEngine(out: Visual[]) {
  const ez = -64;
  const ey = 8;
  const cg: [number, number, number] = [0, 33, -22];

  out.push(v("ENG-CRANKCASE", new THREE.BoxGeometry(11, 10.5, 22), cg, [0, ey, ez], "crankcase", "structure"));
  out.push(
    v("ENG-SUMP", new THREE.BoxGeometry(8.5, 4.2, 16), [0, 26.2, -20], [0, ey - 10, ez], "crankcase", "system"),
  );

  const zCyls = [-31.5, -22, -12.5];
  const ids = [
    ["ENG-CYL-1", "ENG-CYL-3", "ENG-CYL-5"],
    ["ENG-CYL-2", "ENG-CYL-4", "ENG-CYL-6"],
  ];
  zCyls.forEach((z, i) => {
    for (const side of [1, -1] as const) {
      const id = ids[side < 0 ? 1 : 0]![i]!;
      const barrel = new THREE.CylinderGeometry(2.35, 2.5, 8.2, 14);
      barrel.rotateZ(Math.PI / 2);
      out.push(
        v(id, barrel, [7.4 * side, 34.2, z], [18 * side, ey, ez - 6], "cylinder", "structure"),
      );
    }
  });

  out.push(
    v("ENG-CARB", new THREE.BoxGeometry(5.2, 4.4, 5.6), [0, 23.2, -18], [0, ey - 18, ez], "carb", "system"),
  );
  out.push(
    v("ENG-MAG-L", new THREE.CylinderGeometry(1.7, 1.7, 4.2, 10), [-4.2, 31, -8], [-16, ey, ez + 8], "blacksteel", "system", {
      rotation: [Math.PI / 2, 0, 0],
    }),
  );
  out.push(
    v("ENG-MAG-R", new THREE.CylinderGeometry(1.7, 1.7, 4.2, 10), [4.2, 31, -8], [16, ey, ez + 8], "blacksteel", "system", {
      rotation: [Math.PI / 2, 0, 0],
    }),
  );
  out.push(
    v("ENG-STARTER", new THREE.CylinderGeometry(2.3, 2.3, 6, 12), [-6.5, 29.5, -7], [-22, ey - 4, ez + 10], "blacksteel", "system", {
      rotation: [0, 0, Math.PI / 2],
    }),
  );
  out.push(
    v("ENG-GENERATOR", new THREE.CylinderGeometry(2.1, 2.1, 5.4, 12), [6.5, 29.5, -7], [22, ey - 4, ez + 10], "blacksteel", "system", {
      rotation: [0, 0, Math.PI / 2],
    }),
  );
  out.push(
    v("ENG-OIL-COOLER", new THREE.BoxGeometry(9, 5, 1.6), [0, 36, -9], [0, 16, ez + 12], "aluminum", "system"),
  );

  const muff = new THREE.CylinderGeometry(2.2, 2.2, 14, 10);
  muff.rotateZ(Math.PI / 2);
  out.push(v("ENG-HEAT-MUFF", muff, [0, 22.5, -8], [0, -22, ez], "exhaust", "system", { rotation: [0, Math.PI / 2, 0] }));
  out.push(
    tube(
      "ENG-EXHAUST-L",
      new THREE.Vector3(-8, 30, -14),
      new THREE.Vector3(-5, 22.5, -8),
      0.7,
      [-12, -18, ez],
      "exhaust",
      "system",
    ),
  );
  out.push(
    tube(
      "ENG-EXHAUST-R",
      new THREE.Vector3(8, 30, -14),
      new THREE.Vector3(5, 22.5, -8),
      0.7,
      [12, -18, ez],
      "exhaust",
      "system",
    ),
  );

  // tubular mount
  const fw = new THREE.Vector3(0, 32, 0);
  [
    new THREE.Vector3(-6, 38, -14),
    new THREE.Vector3(6, 38, -14),
    new THREE.Vector3(-6, 27, -14),
    new THREE.Vector3(6, 27, -14),
  ].forEach((pt, i) => {
    out.push(tube(`ENG-MOUNT-${i}`, fw.clone().add(new THREE.Vector3(pt.x * 1.6, pt.y - 32, 0)), pt, 0.45, [0, 6, ez + 18], "steel", "structure"));
  });
  out.push(v("ENG-MOUNT", new THREE.BoxGeometry(16, 1, 1), [0, 32, -0.4], [0, 6, ez + 20], "steel", "structure"));
  out.push(v("ENG-BAFFLE", new THREE.BoxGeometry(22, 0.3, 18), [0, 40.5, -20], [0, 22, ez], "aluminum", "system"));
}

function buildProp(out: Visual[]) {
  const ez = -92;
  const hubZ = -44;
  out.push(v("PROP-HUB", new THREE.CylinderGeometry(2.4, 2.4, 3.4, 16), [0, 33.5, hubZ], [0, 0, ez], "chrome", "structure", {
    rotation: [Math.PI / 2, 0, 0],
  }));

  const blade = new THREE.BoxGeometry(1.05, 36, 7.2);
  out.push(v("PROP-BLADE-1", blade, [0, 33.5 + 18, hubZ], [0, 22, ez], "prop", "skin", {
    rotation: [0.18, 0.4, 0],
  }));
  out.push(
    v("PROP-BLADE-2", blade.clone(), [0, 33.5 - 18, hubZ], [0, -22, ez], "prop", "skin", {
      rotation: [0.18, 0.4, Math.PI],
    }),
  );

  const spinPts = Array.from({ length: 14 }, (_, i) => {
    const t = i / 13;
    const r = 5.4 * Math.sqrt(Math.max(0, 1 - (t * 0.96) ** 2));
    return new THREE.Vector2(Math.max(0.2, r), t * 13);
  });
  const spinner = new THREE.LatheGeometry(spinPts, 28);
  spinner.rotateX(Math.PI / 2);
  out.push(v("PROP-SPINNER", spinner, [0, 33.5, hubZ - 2], [0, 0, ez - 10], "chrome", "fairing"));
}

function buildGear(out: Visual[]) {
  const dy = -38;
  for (const side of [-1, 1] as const) {
    const L = side < 0 ? "L" : "R";
    const axleX = SPEC.gear.track / 2 * side;
    const z = SPEC.gear.mainZ;
    const spring = cylinderBetween(new THREE.Vector3(16 * side, 19, z), new THREE.Vector3(axleX, SPEC.gear.mainRadius, z), 1.05, 1.55, 8);
    out.push(
      v(`GEAR-MAIN-${L}-SPRING`, spring.geometry, spring.position.toArray() as [number, number, number], [8 * side, dy, 0], "steel", "structure", {
        quaternion: quatToTuple(spring.quaternion),
      }),
    );
    out.push(
      v(`GEAR-MAIN-${L}-AXLE`, new THREE.CylinderGeometry(1.3, 1.3, 3.2, 10), [axleX, SPEC.gear.mainRadius, z], [10 * side, dy, 0], "blacksteel", "system", {
        rotation: [0, 0, Math.PI / 2],
      }),
    );
    const tire = new THREE.TorusGeometry(SPEC.gear.mainRadius - 2.1, 2.1, 10, 22);
    tire.rotateY(Math.PI / 2);
    out.push(v(`GEAR-MAIN-${L}-WHEEL`, tire, [axleX, SPEC.gear.mainRadius, z], [10 * side, dy - 4, 0], "rubber", "system"));
    out.push(
      v(
        `GEAR-MAIN-${L}-FAIRING`,
        new THREE.SphereGeometry(7.4, 12, 10),
        [axleX, SPEC.gear.mainRadius + 0.4, z],
        [14 * side, dy - 2, 0],
        "paint",
        "fairing",
      ),
    );
    const fair = out[out.length - 1]!;
    fair.geometry.scale(0.55, 0.85, 1.55);

    out.push(
      v(`FUS-STEP-${L}`, new THREE.BoxGeometry(4.5, 0.5, 2.2), [(axleX + 16 * side) * 0.5, 13, z + 4], [6 * side, dy + 8, 4], "steel", "fairing"),
    );
  }

  out.push(
    v("GEAR-NOSE-STRUT", new THREE.CylinderGeometry(1.15, 1.4, 22, 10), [0, 20, SPEC.gear.noseZ], [0, dy, -16], "steel", "structure"),
  );
  out.push(
    v("GEAR-NOSE-FORK", new THREE.BoxGeometry(2.2, 7, 5.5), [0, 11, SPEC.gear.noseZ], [0, dy - 4, -16], "aluminum", "structure"),
  );
  const noseTire = new THREE.TorusGeometry(SPEC.gear.noseRadius - 1.8, 1.8, 10, 20);
  noseTire.rotateY(Math.PI / 2);
  out.push(v("GEAR-NOSE-WHEEL", noseTire, [0, SPEC.gear.noseRadius, SPEC.gear.noseZ], [0, dy - 6, -18], "rubber", "system"));
  const nf = new THREE.SphereGeometry(6.2, 12, 10);
  nf.scale(0.5, 0.85, 1.5);
  out.push(v("GEAR-NOSE-FAIRING", nf, [0, SPEC.gear.noseRadius + 0.3, SPEC.gear.noseZ], [0, dy - 2, -20], "paint", "fairing"));
}

function sweptFin(rootChord: number, tipChord: number, height: number, sweepDeg: number, thick: number) {
  const sweep = Math.tan((sweepDeg * Math.PI) / 180) * height;
  const sh = new THREE.Shape();
  sh.moveTo(0, 0);
  sh.lineTo(sweep * 0.82, height);
  sh.lineTo(sweep * 0.82 + tipChord, height);
  sh.lineTo(rootChord, 0);
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: false });
  g.rotateY(-Math.PI / 2);
  g.translate(thick / 2, 0, 0);
  return g;
}

function buildEmpennage(out: Visual[]) {
  const ez = 70;
  const vs = sweptFin(SPEC.tail.vsRootChord, SPEC.tail.vsTipChord, SPEC.tail.vsHeight, SPEC.tail.sweepLEDeg, 1.35);
  out.push(v("EMP-VS-SKIN", vs, [0, 44, 208], [0, 18, ez], "paint", "skin", { doubleSide: true }));
  out.push(
    v("EMP-VS-SPAR", new THREE.BoxGeometry(0.7, SPEC.tail.vsHeight - 8, 2.2), [0, 68, 218], [0, 12, ez - 8], "aluminum", "structure"),
  );
  const rudder = sweptFin(SPEC.tail.rudderChord + 4, SPEC.tail.rudderChord, SPEC.tail.vsHeight - 6, 8, 1.05);
  out.push(v("EMP-RUDDER", rudder, [0, 46, 248], [0, 8, ez + 22], "paint", "skin", { doubleSide: true }));
  out.push(
    v("EMP-RUDDER-TAB", new THREE.BoxGeometry(0.4, 10, 3.2), [0, 58, 262], [0, 6, ez + 30], "paint", "skin"),
  );

  const dorsal = sweptFin(28, 8, 16, 38, 0.95);
  out.push(v("EMP-DORSAL", dorsal, [0, 50, 168], [0, 14, ez - 20], "paint", "skin", { doubleSide: true }));

  const hs = naca0012(SPEC.tail.hsChord, 16);
  const hsGeo = shapeExtrude(hs, SPEC.tail.hsSpan);
  hsGeo.rotateY(Math.PI / 2);
  hsGeo.translate(0, 0, -SPEC.tail.hsSpan / 2);
  out.push(v("EMP-HS-SKIN", hsGeo, [0, 42, 216], [0, 8, ez], "paint", "skin", { doubleSide: true }));
  out.push(
    v("EMP-HS-SPAR", new THREE.BoxGeometry(SPEC.tail.hsSpan - 8, 2.4, 1.2), [0, 42.2, 224], [0, 4, ez - 6], "aluminum", "structure"),
  );
  out.push(
    v("EMP-ELEV-L", new THREE.BoxGeometry(SPEC.tail.hsSpan / 2 - 2, 1.05, SPEC.tail.elevatorChord), [-SPEC.tail.hsSpan / 4, 41.6, 244], [-8, 4, ez + 16], "paint", "skin"),
  );
  out.push(
    v("EMP-ELEV-R", new THREE.BoxGeometry(SPEC.tail.hsSpan / 2 - 2, 1.05, SPEC.tail.elevatorChord), [SPEC.tail.hsSpan / 4, 41.6, 244], [8, 4, ez + 16], "paint", "skin"),
  );
  out.push(
    v("EMP-TRIM-TAB", new THREE.BoxGeometry(SPEC.tail.trimTabSpan, 0.5, 4), [28, 41.6, 252], [10, 6, ez + 24], "paint", "skin"),
  );
}

function buildFuselage(out: Visual[]) {
  const cabin: Parameters<typeof loftBody>[0] = [
    { z: 0, rx: 20, ry: 18.5, cy: 34.5, p: 1.05 },
    { z: 12, rx: 21.5, ry: 23, cy: 38, p: 0.92 },
    { z: 28, rx: 23.5, ry: 25.5, cy: CABIN_CY, p: 0.82 },
    { z: 52, rx: 24, ry: 26, cy: CABIN_CY, p: 0.8 },
    { z: 78, rx: 22.5, ry: 24.5, cy: 40.5, p: 0.82 },
    { z: 100, rx: 19, ry: 20, cy: 38, p: 0.9 },
    { z: 118, rx: 15.5, ry: 15.5, cy: 35.5, p: 1.0 },
  ];
  out.push(v("FUS-SKIN-CABIN", loftBody(cabin, 40), [0, 0, 0], [0, 22, 0], "paint", "skin", { doubleSide: true }));

  const aft: Parameters<typeof loftBody>[0] = [
    { z: 118, rx: 15.5, ry: 15.5, cy: 35.5, p: 1.0 },
    { z: 145, rx: 11, ry: 12, cy: 34, p: 1.05 },
    { z: 175, rx: 7.2, ry: 9.2, cy: 34.5, p: 1.1 },
    { z: 205, rx: 4.6, ry: 7.2, cy: 36.5, p: 1.15 },
    { z: 235, rx: 3.2, ry: 5.6, cy: 38.5, p: 1.2 },
    { z: 258, rx: 2.2, ry: 4.2, cy: 39.5, p: 1.2 },
  ];
  out.push(v("FUS-SKIN-AFT", loftBody(aft, 32), [0, 0, 0], [0, 8, 48], "paint", "skin", { doubleSide: true }));

  out.push(v("FUS-FIREWALL", new THREE.BoxGeometry(40, 38, 0.5), [0, 34, 0], [0, 6, -18], "firewall", "structure"));
  out.push(v("FUS-BULKHEAD-FS48", new THREE.BoxGeometry(44, 40, 0.4), [0, 38, 48], [0, 10, 8], "alclad", "structure"));
  out.push(v("FUS-BULKHEAD-FS90", new THREE.BoxGeometry(40, 36, 0.4), [0, 38, 90], [0, 10, 16], "alclad", "structure"));
  out.push(v("FUS-BULKHEAD-FS110", new THREE.BoxGeometry(32, 28, 0.4), [0, 36, 110], [0, 10, 22], "alclad", "structure"));
  out.push(v("FUS-CARRY-MAIN", new THREE.BoxGeometry(42, 3.2, 4.5), [0, 64.5, SPEC.stations.mainSpar], [0, 28, 0], "aluminum", "structure"));
  out.push(v("FUS-FLOOR", new THREE.BoxGeometry(40, 0.6, 92), [0, SPEC.fuselage.floorY + 0.4, 54], [0, -16, 0], "interior", "structure"));

  for (const [id, x, y] of [
    ["FUS-LONGERON-L-UP", -20, 58],
    ["FUS-LONGERON-R-UP", 20, 58],
    ["FUS-LONGERON-L-LO", -18, 18],
    ["FUS-LONGERON-R-LO", 18, 18],
  ] as const) {
    out.push(v(id, new THREE.BoxGeometry(1.1, 1.1, 118), [x, y, 58], [x * 0.8, y > 40 ? 18 : -12, 0], "aluminum", "structure"));
  }

  // windshield — raked slab with slight curve
  const ws = new THREE.BoxGeometry(38, 22, 0.6);
  out.push(v("FUS-WINDSHIELD", ws, [0, 54, 14], [0, 26, -12], "glass", "glass", {
    rotation: [0.52, 0, 0],
    doubleSide: true,
  }));

  const glass = (id: string, pos: [number, number, number], size: [number, number, number], exp: [number, number, number], rot?: [number, number, number]) => {
    out.push(v(id, new THREE.BoxGeometry(...size), pos, exp, "glass", "glass", { rotation: rot, doubleSide: true }));
  };
  glass("FUS-WIN-L-FRONT", [-24.4, 46, 40], [0.5, 16, 18], [-36, 10, 0]);
  glass("FUS-WIN-R-FRONT", [24.4, 46, 40], [0.5, 16, 18], [36, 10, 0]);
  glass("FUS-WIN-L-REAR", [-21.5, 46, 78], [0.5, 14, 16], [-32, 10, 10]);
  glass("FUS-WIN-R-REAR", [21.5, 46, 78], [0.5, 14, 16], [32, 10, 10]);
  glass("FUS-WIN-OMNI", [0, 48, 116], [28, 12, 0.6], [0, 22, 28], [0.15, 0, 0]);

  out.push(v("FUS-DOOR-L", new THREE.BoxGeometry(1.1, 34, 28), [-24.6, 36, 42], [-42, 4, 0], "paint", "skin"));
  out.push(v("FUS-DOOR-R", new THREE.BoxGeometry(1.1, 34, 28), [24.6, 36, 42], [42, 4, 0], "paint", "skin"));
  out.push(v("FUS-BAGGAGE-DOOR", new THREE.BoxGeometry(0.8, 14, 16), [-19, 32, 108], [-30, 2, 18], "paint", "skin"));
}

function buildCowling(out: Visual[]) {
  const ez = -48;
  const cowl: Parameters<typeof loftBody>[0] = [
    { z: -40, rx: 15.5, ry: 11.5, cy: 32.5, p: 1.2 },
    { z: -28, rx: 17.5, ry: 13.5, cy: 32.8, p: 1.15 },
    { z: -14, rx: 18.8, ry: 16, cy: 33.5, p: 1.1 },
    { z: 0, rx: 20, ry: 18.5, cy: 34.5, p: 1.05 },
  ];
  out.push(
    v("CWL-LEFT", loftBody(cowl, 20, [Math.PI / 2, (3 * Math.PI) / 2]), [0, 0, 0], [-38, 6, ez], "paint", "fairing", {
      doubleSide: true,
    }),
  );
  out.push(
    v("CWL-RIGHT", loftBody(cowl, 20, [-Math.PI / 2, Math.PI / 2]), [0, 0, 0], [38, 6, ez], "paint", "fairing", {
      doubleSide: true,
    }),
  );
  const bowlPts = Array.from({ length: 10 }, (_, i) => {
    const t = i / 9;
    return new THREE.Vector2(9 + 7 * t, t * 6);
  });
  const bowl = new THREE.LatheGeometry(bowlPts, 24);
  bowl.rotateX(Math.PI / 2);
  out.push(v("CWL-NOSE", bowl, [0, 33, -40], [0, 4, ez - 8], "paint", "fairing"));
  out.push(v("CWL-ANTIGLARE", new THREE.BoxGeometry(16, 0.3, 28), [0, 47.2, -16], [0, 18, ez], "antiglare", "fairing"));
}

function buildInterior(out: Visual[]) {
  const dy = -24;
  const seat = (id: string, x: number, z: number, exp: [number, number, number]) => {
    out.push(v(id, new THREE.BoxGeometry(16, 4, 16), [x, 20, z], exp, "vinyl", "interior"));
    out.push(
      v(`${id}-BACK`, new THREE.BoxGeometry(16, 16, 3), [x, 28, z + 8], exp, "vinyl", "interior"),
    );
  };
  seat("INT-SEAT-FL", -9, 36, [-18, dy, 8]);
  seat("INT-SEAT-FR", 9, 36, [18, dy, 8]);
  out.push(v("INT-SEAT-REAR", new THREE.BoxGeometry(36, 4, 16), [0, 20, 78], [0, dy, 16], "vinyl", "interior"));
  out.push(v("INT-SEAT-REAR-BACK", new THREE.BoxGeometry(36, 14, 3), [0, 27, 87], [0, dy, 18], "vinyl", "interior"));
  out.push(v("INT-GLARESHIELD", new THREE.BoxGeometry(38, 1.2, 8), [0, 51, 22], [0, 20, -8], "vinyl", "interior"));
  out.push(v("INT-HAT-SHELF", new THREE.BoxGeometry(28, 0.5, 12), [0, 42, 104], [0, 18, 22], "vinyl", "interior"));
  out.push(v("INT-YOKES-BOOT", new THREE.BoxGeometry(8, 3, 4), [0, 32, 24], [0, 12, -6], "vinyl", "interior"));
}

function buildPanel(out: Visual[]) {
  out.push(v("INS-PANEL", new THREE.BoxGeometry(38, 14, 1.2), [0, 40, 20.5], [0, 16, -20], "panel", "structure"));
  const gauges: [string, number, number][] = [
    ["INS-ASI", -12, 43],
    ["INS-AI", -6, 43],
    ["INS-ALT", 0, 43],
    ["INS-TC", -12, 37.5],
    ["INS-HI", -6, 37.5],
    ["INS-VSI", 0, 37.5],
  ];
  gauges.forEach(([id, x, y]) => {
    out.push(v(id, new THREE.CylinderGeometry(1.55, 1.55, 0.7, 18), [x, y, 21.3], [0, 18, -26], "gauge", "system", {
      rotation: [Math.PI / 2, 0, 0],
    }));
  });
  out.push(v("INS-TACH", new THREE.CylinderGeometry(1.4, 1.4, 0.6, 16), [8, 43, 21.3], [8, 18, -26], "gauge", "system", { rotation: [Math.PI / 2, 0, 0] }));
  out.push(v("INS-OIL", new THREE.CylinderGeometry(1.1, 1.1, 0.5, 14), [12, 43, 21.3], [10, 18, -26], "gauge", "system", { rotation: [Math.PI / 2, 0, 0] }));
  out.push(v("INS-AMMETER", new THREE.CylinderGeometry(1.0, 1.0, 0.5, 14), [8, 37.8, 21.3], [8, 16, -26], "gauge", "system", { rotation: [Math.PI / 2, 0, 0] }));
  out.push(v("INS-FUEL-G", new THREE.CylinderGeometry(1.0, 1.0, 0.5, 14), [12, 37.8, 21.3], [10, 16, -26], "gauge", "system", { rotation: [Math.PI / 2, 0, 0] }));
  out.push(v("INS-SUCTION", new THREE.CylinderGeometry(0.9, 0.9, 0.45, 14), [16, 40.5, 21.3], [12, 16, -26], "gauge", "system", { rotation: [Math.PI / 2, 0, 0] }));
  out.push(v("INS-NAVCOM", new THREE.BoxGeometry(8.5, 5.5, 4), [3, 40, 18], [0, 14, -22], "blacksteel", "system"));
  out.push(v("INS-CLOCK", new THREE.CylinderGeometry(0.8, 0.8, 0.4, 14), [-16, 44.2, 21.3], [-8, 18, -26], "gauge", "system", { rotation: [Math.PI / 2, 0, 0] }));
  out.push(v("INS-COMPASS", new THREE.BoxGeometry(3.2, 2.4, 2.2), [0, 53.5, 18], [0, 24, -16], "blacksteel", "system"));
  out.push(v("ELE-BREAKERS", new THREE.BoxGeometry(10, 2.2, 0.4), [10, 34.4, 21], [8, 10, -22], "breaker", "system"));
  out.push(v("ELE-MASTER", new THREE.BoxGeometry(3.2, 1.4, 0.5), [-14, 34.6, 21], [-10, 10, -22], "breaker", "system"));
  out.push(v("ELE-BATTERY", new THREE.BoxGeometry(8, 6, 10), [-8, 22, 8], [-16, -12, -10], "blacksteel", "system"));

  out.push(v("CTL-YOKE-L", new THREE.TorusGeometry(3.3, 0.35, 8, 18, Math.PI * 1.4), [-8.5, 35, 28], [-14, 8, -12], "chrome", "system"));
  out.push(v("CTL-YOKE-R", new THREE.TorusGeometry(3.3, 0.35, 8, 18, Math.PI * 1.4), [8.5, 35, 28], [14, 8, -12], "chrome", "system"));
  out.push(v("CTL-COLUMN", new THREE.BoxGeometry(18, 1.1, 1.1), [0, 32, 26], [0, 6, -10], "steel", "structure"));
  out.push(v("CTL-PEDAL-L", new THREE.BoxGeometry(6, 0.5, 4), [-8, 17.2, 24], [-8, -14, -6], "blacksteel", "system"));
  out.push(v("CTL-PEDAL-R", new THREE.BoxGeometry(6, 0.5, 4), [8, 17.2, 24], [8, -14, -6], "blacksteel", "system"));
  out.push(v("CTL-FLAP-LEVER", new THREE.BoxGeometry(0.7, 11, 0.7), [0, 24, 48], [0, -10, 8], "steel", "system", { rotation: [0.4, 0, 0] }));
  out.push(v("CTL-FLAP-JACKSCREW", new THREE.CylinderGeometry(0.45, 0.45, 16, 8), [0, 18.5, 70], [0, -12, 12], "steel", "structure", { rotation: [Math.PI / 2, 0, 0] }));
  out.push(v("CTL-TRIM-WHEEL", new THREE.CylinderGeometry(2.2, 2.2, 0.5, 16), [8, 24, 32], [12, -8, 0], "aluminum", "system", { rotation: [0, 0, Math.PI / 2] }));
  out.push(v("CTL-TRIM-JACK", new THREE.BoxGeometry(1.2, 1.2, 6), [28, 42, 254], [12, 8, 80], "steel", "system"));
  out.push(v("CTL-THROTTLE", new THREE.CylinderGeometry(0.45, 0.45, 4.5, 8), [-4, 35.5, 23], [0, 10, -18], "blacksteel", "system", { rotation: [Math.PI / 2, 0, 0] }));
  out.push(v("CTL-MIXTURE", new THREE.CylinderGeometry(0.45, 0.45, 4.5, 8), [-2.2, 35.5, 23], [0, 10, -18], "stripe", "system", { rotation: [Math.PI / 2, 0, 0] }));
  out.push(v("CTL-CARBHEAT", new THREE.CylinderGeometry(0.4, 0.4, 4.2, 8), [-0.4, 35.5, 23], [0, 10, -18], "aluminum", "system", { rotation: [Math.PI / 2, 0, 0] }));

  // cables as thin tubes through the cabin
  out.push(tube("CTL-CABLE-AIL", new THREE.Vector3(0, 62, 30), new THREE.Vector3(-40, 64, 48), 0.2, [0, 36, 0], "cable", "system"));
  out.push(tube("CTL-CABLE-ELEV", new THREE.Vector3(0, 18, 30), new THREE.Vector3(0, 20, 230), 0.2, [0, -20, 40], "cable", "system"));
  out.push(tube("CTL-CABLE-RUD", new THREE.Vector3(-4, 17.5, 26), new THREE.Vector3(0, 38, 248), 0.2, [6, -18, 40], "cable", "system"));
  out.push(v("CTL-BELLCRANK-AIL-L", new THREE.BoxGeometry(4, 0.4, 6), [-70, WING_Y - 2, SPEC.stations.rearSpar], [-80, 20, 16], "aluminum", "system"));
  out.push(v("CTL-BELLCRANK-AIL-R", new THREE.BoxGeometry(4, 0.4, 6), [70, WING_Y - 2, SPEC.stations.rearSpar], [80, 20, 16], "aluminum", "system"));
}

function buildSystems(out: Visual[]) {
  out.push(v("FUEL-SELECTOR", new THREE.CylinderGeometry(2.2, 2.2, 1.4, 12), [0, 17.4, 50], [0, -18, 6], "fuel", "system"));
  out.push(v("FUEL-STRAINER", new THREE.CylinderGeometry(1.3, 1.3, 3.2, 10), [6, 24, 2], [10, -8, -12], "aluminum", "system"));
  out.push(v("FUEL-PRIMER", new THREE.CylinderGeometry(0.4, 0.4, 3.6, 8), [6, 35.5, 23], [8, 10, -18], "chrome", "system", { rotation: [Math.PI / 2, 0, 0] }));
  out.push(tube("FUEL-VENT", new THREE.Vector3(-40, WING_Y - 3, 38), new THREE.Vector3(-52, WING_Y - 6, 34), 0.25, [-70, 40, -8], "aluminum", "system"));

  out.push(v("ELE-NAV-L", new THREE.SphereGeometry(1.1, 10, 8), [-(SPEC.wing.semiSpan - 1), WING_Y + 1, SPEC.stations.wingLE + 26], [-110, 36, 0], "navred", "system"));
  out.push(v("ELE-NAV-R", new THREE.SphereGeometry(1.1, 10, 8), [SPEC.wing.semiSpan - 1, WING_Y + 1, SPEC.stations.wingLE + 26], [110, 36, 0], "navgreen", "system"));
  out.push(v("ELE-NAV-TAIL", new THREE.SphereGeometry(0.9, 10, 8), [0, 58, 256], [0, 10, 92], "paint", "system"));
  out.push(v("ELE-LANDING", new THREE.CylinderGeometry(1.6, 1.6, 1.2, 12), [-40, WING_Y + 0.4, SPEC.stations.wingLE + 1], [-70, 40, -16], "chrome", "system", { rotation: [Math.PI / 2, 0, 0] }));
  out.push(v("ELE-BEACON", new THREE.CylinderGeometry(1.1, 1.4, 2.4, 10), [0, 66 + SPEC.tail.vsHeight - 10, 228], [0, 28, 70], "navred", "system"));
  out.push(v("ELE-STALL", new THREE.BoxGeometry(2.4, 0.6, 1.2), [-36, WING_Y + 0.2, SPEC.stations.wingLE - 0.2], [-60, 38, -14], "blacksteel", "system"));
  out.push(v("ELE-PITOT", new THREE.CylinderGeometry(0.28, 0.22, 6, 8), [-48, WING_Y - 3.5, SPEC.stations.wingLE + 8], [-70, 24, -10], "chrome", "system", { rotation: [0.4, 0, 0] }));
}

export function buildAircraft(): Visual[] {
  const out: Visual[] = [];
  buildFuselage(out);
  buildCowling(out);
  buildWing(-1, out);
  buildWing(1, out);
  buildEmpennage(out);
  buildGear(out);
  buildEngine(out);
  buildProp(out);
  buildInterior(out);
  buildPanel(out);
  buildSystems(out);
  return out;
}
