/**
 * 1964 Cessna 172E Skyhawk — dimensional reconstruction.
 * Units: inches unless noted. Compiled from TCDS 3A12, 172E owner's manual,
 * 100-series service practice, NACA 2412, and published three-views.
 * Educational — not a substitute for Cessna or Continental manuals.
 */

export const SPEC = {
  model: "172E",
  marketing: "Skyhawk",
  year: 1964,
  serialNote: "17251000 through 17253322 (typical 172E range)",
  manufacturer: "Cessna Aircraft Company, Wichita, Kansas",
  certification: "CAR 3 / TCDS 3A12",

  // Published / reconstructed overall
  length: 323, // 26 ft 11 in — O-300 cowling + pointed spinner
  span: 433, // 36 ft 1 in
  height: 107, // 8 ft 11 in
  wingAreaSqFt: 174,
  aspectRatio: 7.32,
  emptyLb: 1330,
  grossLb: 2300,
  fuelGal: 42,
  fuelUsableGal: 39,
  oilQt: 8,

  engine: {
    make: "Continental Motors",
    model: "O-300-D",
    type: "Six-cylinder, horizontally opposed, air-cooled, carbureted",
    hp: 145,
    rpm: 2700,
    displacementCi: 301.4,
    bore: 4.0625,
    stroke: 3.875,
    dryLb: 268,
    cylinders: 6,
  },

  propeller: {
    make: "McCauley",
    model: "1A170 / DM7658 class (76 in fixed-pitch)",
    blades: 2,
    diameter: 76,
    pitch: 58,
  },

  wing: {
    airfoil: "NACA 2412 (modified)",
    chord: 58, // ~1.473 m, essentially constant-chord
    semiSpan: 216.5,
    dihedralDeg: 1.73,
    incidenceRootDeg: 1.5,
    washoutDeg: 3.0,
    mainSparChord: 0.25,
    rearSparChord: 0.68,
    flapSpan: 92,
    aileronSpan: 78,
    flapChord: 15.5,
    aileronChord: 13.5,
    ribCount: 14,
    strutAttachX: 104,
    juryAttachX: 78,
  },

  fuselage: {
    maxWidth: 48,
    cabinInteriorWidth: 40,
    cabinHeight: 48,
    floorY: 16,
    firewallZ: 0,
  },

  tail: {
    hsSpan: 123,
    hsChord: 32,
    vsHeight: 58,
    vsRootChord: 42,
    vsTipChord: 22,
    sweepLEDeg: 32,
    dorsalLen: 62,
    elevatorChord: 13,
    rudderChord: 14,
    trimTabSpan: 18,
  },

  gear: {
    track: 100.5,
    wheelbase: 65,
    mainTire: "6.00-6",
    noseTire: "5.00-5",
    mainRadius: 11,
    noseRadius: 9,
    mainZ: 46,
    noseZ: -19,
  },

  stations: {
    spinnerTip: -52,
    prop: -44,
    engineCg: -22,
    firewall: 0,
    windshield: 14,
    wingLE: 30,
    mainSpar: 44.5,
    rearSpar: 69.4,
    cabinMax: 48,
    rearSeat: 86,
    baggage: 108,
    omniVision: 118,
    vsLE: 208,
    rudderHinge: 248,
    rudderTE: 270,
  },
} as const;

export const SOURCES = [
  {
    id: "TCDS-3A12",
    title: "Type Certificate Data Sheet 3A12",
    use: "Type design, engine/prop limits, airspeeds, approved equipment",
  },
  {
    id: "POH-172E",
    title: "Cessna 172 / Skyhawk Owner's Manual (1964 model year)",
    use: "Weights, fuel, speeds, systems description, three-view notes",
  },
  {
    id: "SM-100",
    title: "Cessna 100 Series Service Manual (early-1960s chapters)",
    use: "Airframe construction, control rigging, landing gear, fuel, electrical",
  },
  {
    id: "O300-OH",
    title: "Continental O-300 Series Overhaul Manual (X-300 family)",
    use: "Crankcase, cylinders, accessory case, carburetor, magnetos, limits",
  },
  {
    id: "O300-IPC",
    title: "Continental O-300 Illustrated Parts Catalog",
    use: "Engine breakdown order and accessory locations",
  },
  {
    id: "NACA-460",
    title: "NACA Report 460 — The Characteristics of 78 Related Airfoil Sections",
    use: "NACA 2412 thickness and camber equations",
  },
  {
    id: "AC43-13",
    title: "FAA AC 43.13-1B Acceptable Methods, Techniques, and Practices",
    use: "AN/MS hardware practice, cable terminals, rivet conventions",
  },
  {
    id: "MCAULEY",
    title: "McCauley fixed-pitch metal propeller service data",
    use: "76 in two-blade hub, spinner, and blade geometry class",
  },
] as const;

export const DISCLAIMER =
  "Educational reconstruction of 1964 Cessna 172E architecture. Identifiers are schematic (not official Cessna IPC numbers). Dimensions follow published specs and typical 100-series construction — not a maintenance document. Do not use for inspection, rigging, or flight.";
