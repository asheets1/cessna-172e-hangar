export const SYSTEM_IDS = [
  "fuselage",
  "wing",
  "empennage",
  "landing-gear",
  "powerplant",
  "propeller",
  "flight-controls",
  "fuel",
  "electrical",
  "instruments",
  "interior",
  "cowling",
] as const;

export type SystemId = (typeof SYSTEM_IDS)[number];

export const SYSTEM_META: Record<
  SystemId,
  { label: string; chapter: string; color: string; short: string }
> = {
  fuselage: { label: "Fuselage", chapter: "Ch. 01", color: "#c5ccd4", short: "FUS" },
  wing: { label: "Wings & struts", chapter: "Ch. 02", color: "#9aa7b5", short: "WING" },
  empennage: { label: "Empennage", chapter: "Ch. 03", color: "#b7c0aa", short: "EMP" },
  "landing-gear": { label: "Landing gear", chapter: "Ch. 05", color: "#8a9098", short: "GEAR" },
  powerplant: { label: "Powerplant", chapter: "Ch. 12", color: "#6d7178", short: "ENG" },
  propeller: { label: "Propeller", chapter: "Ch. 13", color: "#d7d2c8", short: "PROP" },
  "flight-controls": { label: "Flight controls", chapter: "Ch. 06", color: "#c4b581", short: "CTL" },
  fuel: { label: "Fuel system", chapter: "Ch. 07", color: "#a33c48", short: "FUEL" },
  electrical: { label: "Electrical", chapter: "Ch. 08", color: "#c4845a", short: "ELE" },
  instruments: { label: "Instruments", chapter: "Ch. 09", color: "#7a9bb0", short: "INS" },
  interior: { label: "Cabin interior", chapter: "Ch. 04", color: "#7a3d42", short: "INT" },
  cowling: { label: "Cowling & fairings", chapter: "Ch. 11", color: "#d8d3c6", short: "CWL" },
};

export type PartRole = "skin" | "structure" | "system" | "glass" | "interior" | "fairing";

export type Fastener =
  | "AN bolt"
  | "NAS bolt"
  | "MS rivet"
  | "clevis pin"
  | "hinge"
  | "Lord mount"
  | "cable"
  | "hose"
  | "clamp"
  | "weld"
  | "screw"
  | "bearing"
  | "pushrod"
  | "fitting"
  | "turnbuckle";

export interface Connection {
  to: string;
  via: Fastener;
  spec: string;
  note?: string;
}

export interface Part {
  id: string;
  name: string;
  system: SystemId;
  role: PartRole;
  qty: number;
  material: string;
  spec?: string;
  finish?: string;
  weightLb?: number;
  notes: string;
  connections: Connection[];
  source: string;
}

export type ViewMode = "solid" | "structure" | "cutaway" | "blueprint";
export type ColorMode = "livery" | "system" | "material";
export type PanelId = "parts" | "scad" | "legend" | "about";

export interface Visual {
  id: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  quaternion?: [number, number, number, number];
  scale?: [number, number, number];
  explode: [number, number, number];
  geometry: import("three").BufferGeometry;
  materialKey: string;
  role: PartRole;
  doubleSide?: boolean;
}
