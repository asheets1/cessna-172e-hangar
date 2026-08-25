import { create } from "zustand";
import type { ColorMode, PanelId, SystemId, ViewMode } from "./types";

interface HangarState {
  selectedId: string | null;
  hoveredId: string | null;
  explode: number;
  viewMode: ViewMode;
  colorMode: ColorMode;
  hiddenSystems: SystemId[];
  showLabels: boolean;
  showDimensions: boolean;
  showFairings: boolean;
  flaps: number;
  panel: PanelId;
  search: string;
  intro: boolean;
  mobileSheet: boolean;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  setExplode: (v: number) => void;
  setViewMode: (v: ViewMode) => void;
  setColorMode: (v: ColorMode) => void;
  toggleSystem: (s: SystemId) => void;
  isolateSystem: (s: SystemId | null) => void;
  setFlaps: (v: number) => void;
  setPanel: (v: PanelId) => void;
  setSearch: (v: string) => void;
  setIntro: (v: boolean) => void;
  setMobileSheet: (v: boolean) => void;
  toggle: (k: "showLabels" | "showDimensions" | "showFairings") => void;
  resetViewFlags: () => void;
}

export const useHangar = create<HangarState>((set, get) => ({
  selectedId: null,
  hoveredId: null,
  explode: 0,
  viewMode: "solid",
  colorMode: "livery",
  hiddenSystems: [],
  showLabels: false,
  showDimensions: true,
  showFairings: true,
  flaps: 0,
  panel: "parts",
  search: "",
  intro: true,
  mobileSheet: false,
  select: (id) => set({ selectedId: id, intro: false }),
  hover: (id) => set({ hoveredId: id }),
  setExplode: (explode) => set({ explode }),
  setViewMode: (viewMode) => set({ viewMode }),
  setColorMode: (colorMode) => set({ colorMode }),
  toggleSystem: (s) => {
    const cur = get().hiddenSystems;
    set({
      hiddenSystems: cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s],
    });
  },
  isolateSystem: (s) => {
    if (!s) {
      set({ hiddenSystems: [] });
      return;
    }
    const all: SystemId[] = [
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
    ];
    set({ hiddenSystems: all.filter((x) => x !== s) });
  },
  setFlaps: (flaps) => set({ flaps }),
  setPanel: (panel) => set({ panel }),
  setSearch: (search) => set({ search }),
  setIntro: (intro) => set({ intro }),
  setMobileSheet: (mobileSheet) => set({ mobileSheet }),
  toggle: (k) => set({ [k]: !get()[k] }),
  resetViewFlags: () =>
    set({
      explode: 0,
      viewMode: "solid",
      colorMode: "livery",
      hiddenSystems: [],
      flaps: 0,
      selectedId: null,
    }),
}));
