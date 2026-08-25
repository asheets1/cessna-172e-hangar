import * as THREE from "three";
import { SYSTEM_META, type ColorMode, type Part, type ViewMode } from "./types";

const KEY_COLOR: Record<string, number> = {
  paint: 0xe6e1d4,
  stripe: 0x8b2e3a,
  aluminum: 0xc7ccd1,
  alclad: 0xd5d9de,
  steel: 0x7a7f86,
  blacksteel: 0x2a2c2e,
  crankcase: 0x9aa0a6,
  cylinder: 0x6e7380,
  fin: 0x8a9098,
  carb: 0xb7a48a,
  exhaust: 0x4a433c,
  chrome: 0xe8eaee,
  prop: 0xd8d4cc,
  rubber: 0x1a1b1d,
  glass: 0x9ec4d4,
  vinyl: 0x6a3338,
  interior: 0x5c4036,
  panel: 0x2c3036,
  gauge: 0x1c1e22,
  breaker: 0x3a3f46,
  firewall: 0xc2c0b4,
  fuel: 0x8a3040,
  cable: 0xc4b581,
  antiglare: 0x1a1a1a,
  navred: 0xa33c3c,
  navgreen: 0x3c8a5a,
};

const MAT_COLOR: Record<string, number> = {
  "2024-T3 Alclad": 0xd0d5da,
  "2024-T3 Alclad, 0.016–0.025": 0xd0d5da,
  "2024-T3 Alclad, formed": 0xd0d5da,
  "301 stainless, 0.016–0.020": 0xc8c6bc,
  "4130 welded tube": 0x6a6e74,
  "6150 / 5160 spring steel": 0x5c6168,
  "Lead-acid, ~12 V 25–35 Ah": 0x2a2c2e,
};

export function colorFor(
  materialKey: string,
  colorMode: ColorMode,
  part: Part | undefined,
): number {
  if (colorMode === "system" && part) {
    return new THREE.Color(SYSTEM_META[part.system].color).getHex();
  }
  if (colorMode === "material" && part) {
    return MAT_COLOR[part.material] ?? KEY_COLOR[materialKey] ?? 0xb0b4ba;
  }
  return KEY_COLOR[materialKey] ?? 0xc5ccd4;
}

export function applyAppearance(
  mat: THREE.MeshStandardMaterial,
  opts: {
    materialKey: string;
    colorMode: ColorMode;
    viewMode: ViewMode;
    part: Part | undefined;
    selected: boolean;
    hovered: boolean;
    role: string;
    explode: number;
  },
) {
  const { materialKey, colorMode, viewMode, part, selected, hovered, role, explode } = opts;
  const hex = colorFor(materialKey, colorMode, part);
  mat.color.setHex(hex);
  mat.metalness =
    materialKey === "glass"
      ? 0.1
      : materialKey === "chrome"
        ? 0.95
        : materialKey === "paint" || materialKey === "vinyl"
          ? 0.08
          : 0.55;
  mat.roughness =
    materialKey === "glass"
      ? 0.06
      : materialKey === "chrome"
        ? 0.18
        : materialKey === "rubber"
          ? 0.92
          : materialKey === "paint"
            ? 0.48
            : 0.42;

  const isGlass = materialKey === "glass" || role === "glass";
  const isStructure = role === "structure" || role === "system";
  const hideSkin = viewMode === "structure" && (role === "skin" || role === "fairing");
  const hideStruct = viewMode === "solid" && explode < 0.12 && isStructure && !isGlass;

  mat.transparent = isGlass || hideSkin || viewMode === "blueprint";
  mat.opacity = hideSkin ? 0.07 : hideStruct ? 0.0 : isGlass ? 0.32 : viewMode === "blueprint" ? 0.04 : 1;
  mat.depthWrite = !isGlass && mat.opacity > 0.2;
  mat.wireframe = viewMode === "blueprint";
  mat.emissive.setHex(selected ? 0x3a4550 : hovered ? 0x1c242c : 0x000000);
  mat.emissiveIntensity = selected ? 0.55 : hovered ? 0.3 : 0;
  mat.side = THREE.DoubleSide;
}

export function makeStandard(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xc5ccd4,
    metalness: 0.4,
    roughness: 0.5,
    envMapIntensity: 0.6,
  });
}
