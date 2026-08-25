import {
  BoxSelect,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Layers,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PARTS, PART_COUNT, resolvePart } from "@/lib/cessna/catalog";
import { generateOpenSCAD, generatePartsCSV } from "@/lib/cessna/openscad";
import { DISCLAIMER, SOURCES, SPEC } from "@/lib/cessna/specs";
import { useHangar } from "@/lib/cessna/store";
import {
  SYSTEM_IDS,
  SYSTEM_META,
  type ColorMode,
  type PanelId,
  type SystemId,
  type ViewMode,
} from "@/lib/cessna/types";
import { cn } from "@/lib/utils";
import { HangarCanvas } from "./scene";

function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const VIEWS: { id: ViewMode; label: string }[] = [
  { id: "solid", label: "Solid" },
  { id: "structure", label: "Structure" },
  { id: "cutaway", label: "Cutaway" },
  { id: "blueprint", label: "Blueprint" },
];

const COLORS: { id: ColorMode; label: string }[] = [
  { id: "livery", label: "Livery" },
  { id: "system", label: "System" },
  { id: "material", label: "Material" },
];

const PANELS: { id: PanelId; label: string }[] = [
  { id: "parts", label: "Parts" },
  { id: "legend", label: "Legend" },
  { id: "scad", label: "OpenSCAD" },
  { id: "about", label: "Sources" },
];

export function HangarApp() {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <HangarCanvas />
      <Header />
      <LeftDock />
      <RightDock />
      <BottomBar />
      <Intro />
      <MobileParts />
    </div>
  );
}

function Header() {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-3 md:p-5">
      <div className="pointer-events-auto max-w-[16rem] rounded-[var(--radius-lg)] bg-bg/80 px-4 py-3 shadow-[var(--shadow-border)] backdrop-blur-sm md:max-w-none">
        <p className="font-mono text-[10px] tracking-[0.22em] text-muted uppercase">
          Cessna · Wichita · 1964
        </p>
        <h1 className="mt-1 text-xl font-medium tracking-tight text-fg md:text-2xl">
          172E Skyhawk
        </h1>
        <p className="mt-0.5 font-mono text-[11px] text-subtle">
          Continental O-300-D · 145 hp · exploded assembly
        </p>
      </div>
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        <a
          href="/download"
          className="inline-flex h-11 items-center rounded-[var(--radius-md)] bg-accent px-4 text-sm font-medium text-accent-fg"
        >
          Download files
        </a>
        <div className="hidden rounded-[var(--radius-md)] bg-bg/80 px-3 py-2 font-mono text-[11px] text-muted shadow-[var(--shadow-border)] backdrop-blur-sm sm:block">
          {PART_COUNT} parts · 1 in = 1 unit · TCDS 3A12
        </div>
      </div>
    </header>
  );
}

function LeftDock() {
  const panel = useHangar((s) => s.panel);
  const setPanel = useHangar((s) => s.setPanel);
  return (
    <aside className="pointer-events-none absolute bottom-24 left-0 top-28 z-20 hidden w-[20.5rem] flex-col p-4 md:flex">
      <div className="pointer-events-auto flex min-h-0 flex-1 flex-col rounded-[var(--radius-xl)] bg-surface/90 p-2 shadow-[var(--shadow-border)] backdrop-blur-sm">
        <div className="flex gap-1 p-1">
          {PANELS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPanel(p.id)}
              className={cn(
                "h-9 flex-1 rounded-[var(--radius-sm)] font-mono text-[10px] tracking-wide uppercase transition-colors duration-150",
                panel === p.id ? "bg-elevated text-fg" : "text-muted hover:text-fg",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {panel === "parts" && <PartsTree />}
          {panel === "legend" && <Legend />}
          {panel === "scad" && <ScadPanel />}
          {panel === "about" && <AboutPanel />}
        </div>
      </div>
    </aside>
  );
}

function PartsTree() {
  const search = useHangar((s) => s.search);
  const setSearch = useHangar((s) => s.setSearch);
  const selectedId = useHangar((s) => s.selectedId);
  const select = useHangar((s) => s.select);
  const hidden = useHangar((s) => s.hiddenSystems);
  const toggleSystem = useHangar((s) => s.toggleSystem);
  const isolateSystem = useHangar((s) => s.isolateSystem);
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SYSTEM_IDS.map((s) => [s, s === "fuselage" || s === "powerplant"])),
  );

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const g: Record<SystemId, typeof PARTS> = {
      fuselage: [],
      wing: [],
      empennage: [],
      "landing-gear": [],
      powerplant: [],
      propeller: [],
      "flight-controls": [],
      fuel: [],
      electrical: [],
      instruments: [],
      interior: [],
      cowling: [],
    };
    for (const part of PARTS) {
      if (q && !`${part.id} ${part.name} ${part.material}`.toLowerCase().includes(q)) continue;
      g[part.system].push(part);
    }
    return g;
  }, [search]);

  return (
    <div>
      <label className="relative mb-3 block">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search parts"
          className="h-10 w-full rounded-[var(--radius-sm)] bg-elevated pl-8 pr-3 font-mono text-xs text-fg placeholder:text-subtle shadow-[var(--shadow-border)] outline-none focus:shadow-[var(--shadow-border-hover)]"
        />
      </label>
      <ul className="space-y-1">
        {SYSTEM_IDS.map((sys) => {
          const meta = SYSTEM_META[sys];
          const items = grouped[sys];
          if (search && items.length === 0) return null;
          const isOpen = search ? true : open[sys];
          const vis = !hidden.includes(sys);
          return (
            <li key={sys}>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setOpen((o) => ({ ...o, [sys]: !o[sys] }))}
                  className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-sm)] px-1.5 text-left hover:bg-elevated"
                >
                  <ChevronRight className={cn("size-3.5 text-subtle transition-transform", isOpen && "rotate-90")} />
                  <span className="size-2 shrink-0 rounded-full" style={{ background: meta.color }} />
                  <span className="truncate text-sm">{meta.label}</span>
                  <span className="ml-auto font-mono text-[10px] text-subtle">{items.length}</span>
                </button>
                <button
                  type="button"
                  aria-label={vis ? `Hide ${meta.label}` : `Show ${meta.label}`}
                  onClick={() => toggleSystem(sys)}
                  className="grid size-9 place-items-center text-subtle hover:text-fg"
                >
                  {vis ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                </button>
              </div>
              {isOpen && (
                <ul className="mb-2 ml-4 border-l border-border pl-2">
                  {items.map((part) => (
                    <li key={part.id}>
                      <button
                        type="button"
                        onClick={() => select(part.id)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-[var(--radius-xs)] px-2 py-1.5 text-left font-mono text-[11px]",
                          selectedId === part.id ? "bg-elevated text-fg" : "text-muted hover:text-fg",
                        )}
                      >
                        <span className="truncate">{part.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => isolateSystem(null)}
        className="mt-2 h-9 w-full rounded-[var(--radius-sm)] font-mono text-[11px] text-muted hover:bg-elevated hover:text-fg"
      >
        Show all systems
      </button>
    </div>
  );
}

function Legend() {
  const isolateSystem = useHangar((s) => s.isolateSystem);
  const setColorMode = useHangar((s) => s.setColorMode);
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">
        Color by system to read the airframe the way a 100-series manual is chaptered. Tap a row to isolate it.
      </p>
      <ul className="space-y-1">
        {SYSTEM_IDS.map((sys) => {
          const m = SYSTEM_META[sys];
          return (
            <li key={sys}>
              <button
                type="button"
                onClick={() => {
                  setColorMode("system");
                  isolateSystem(sys);
                }}
                className="flex h-10 w-full items-center gap-3 rounded-[var(--radius-sm)] px-2 hover:bg-elevated"
              >
                <span className="size-3 rounded-full" style={{ background: m.color }} />
                <span className="text-sm">{m.label}</span>
                <span className="ml-auto font-mono text-[10px] text-subtle">{m.chapter}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ScadPanel() {
  const explode = useHangar((s) => s.explode);
  const src = useMemo(() => generateOpenSCAD(explode), [explode]);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-relaxed text-muted">
        Same stations and NACA 2412 sections as the hangar, compiled to CSG. Open in OpenSCAD; <span className="font-mono text-fg">explode</span> is a live parameter.
      </p>
      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={() => downloadText("cessna-172e.scad", src, "text/plain")}>
          <Download className="size-3.5" />
          .scad
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadText("cessna-172e-parts.csv", generatePartsCSV(), "text/csv")}
        >
          CSV legend
        </Button>
      </div>
      <pre className="max-h-80 overflow-auto rounded-[var(--radius-sm)] bg-bg p-3 font-mono text-[10px] leading-relaxed text-muted">
        {src.slice(0, 2800)}
        {"\n…"}
      </pre>
    </div>
  );
}

function AboutPanel() {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-muted">
      <p className="text-fg">{SPEC.model} {SPEC.marketing}, {SPEC.year}.</p>
      <p>{DISCLAIMER}</p>
      <ul className="space-y-2">
        {SOURCES.map((s) => (
          <li key={s.id} className="rounded-[var(--radius-sm)] bg-elevated px-3 py-2">
            <p className="font-mono text-[10px] text-subtle">{s.id}</p>
            <p className="text-fg">{s.title}</p>
            <p className="text-xs">{s.use}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RightDock() {
  const selectedId = useHangar((s) => s.selectedId);
  const select = useHangar((s) => s.select);
  const isolateSystem = useHangar((s) => s.isolateSystem);
  if (!selectedId) {
    return (
      <aside className="pointer-events-none absolute bottom-24 right-0 top-28 z-20 hidden w-[22rem] p-4 lg:block">
        <div className="pointer-events-auto rounded-[var(--radius-xl)] bg-surface/90 p-5 shadow-[var(--shadow-border)] backdrop-blur-sm">
          <p className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">Inspect</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Click any solid. Drag to orbit, scroll to dolly. Explode pulls every joint apart along its service axis.
          </p>
        </div>
      </aside>
    );
  }
  const part = resolvePart(selectedId);
  const meta = SYSTEM_META[part.system];
  return (
    <aside className="pointer-events-none absolute bottom-24 right-0 top-28 z-20 hidden w-[22rem] p-4 lg:block">
      <div className="pointer-events-auto flex max-h-full flex-col rounded-[var(--radius-xl)] bg-surface/90 p-4 shadow-[var(--shadow-border)] backdrop-blur-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">
              {meta.chapter} · {meta.short}
            </p>
            <h2 className="mt-1 text-lg font-medium tracking-tight">{part.name}</h2>
          </div>
          <Button size="icon" variant="ghost" onClick={() => select(null)} aria-label="Clear selection">
            <X className="size-4" />
          </Button>
        </div>
        <p className="mt-1 font-mono text-[11px] text-muted">{part.id}</p>
        <dl className="mt-3 grid grid-cols-2 gap-2 font-mono text-[11px]">
          <div className="rounded-[var(--radius-sm)] bg-elevated px-2 py-2">
            <dt className="text-subtle">Material</dt>
            <dd className="mt-0.5 text-fg">{part.material}</dd>
          </div>
          <div className="rounded-[var(--radius-sm)] bg-elevated px-2 py-2">
            <dt className="text-subtle">Qty / wt</dt>
            <dd className="mt-0.5 text-fg">
              {part.qty}
              {part.weightLb != null ? ` · ${part.weightLb} lb` : ""}
            </dd>
          </div>
        </dl>
        {part.finish && <p className="mt-2 text-xs text-muted">Finish: {part.finish}</p>}
        <p className="mt-3 text-sm leading-relaxed text-muted">{part.notes}</p>
        {part.connections.length > 0 && (
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
            <p className="font-mono text-[10px] tracking-wide text-subtle uppercase">Connections</p>
            <ul className="mt-2 space-y-2">
              {part.connections.map((c, i) => (
                <li key={`${c.to}-${i}`}>
                  <button
                    type="button"
                    onClick={() => select(c.to)}
                    className="w-full rounded-[var(--radius-sm)] bg-elevated px-3 py-2 text-left hover:bg-bg"
                  >
                    <p className="font-mono text-[11px] text-fg">{c.to}</p>
                    <p className="text-xs text-muted">
                      {c.via} · {c.spec}
                    </p>
                    {c.note && <p className="text-xs text-subtle">{c.note}</p>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-3 font-mono text-[10px] text-subtle">{part.source}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => isolateSystem(part.system)}>
          Isolate {meta.label}
        </Button>
      </div>
    </aside>
  );
}

function BottomBar() {
  const explode = useHangar((s) => s.explode);
  const setExplode = useHangar((s) => s.setExplode);
  const viewMode = useHangar((s) => s.viewMode);
  const setViewMode = useHangar((s) => s.setViewMode);
  const colorMode = useHangar((s) => s.colorMode);
  const setColorMode = useHangar((s) => s.setColorMode);
  const flaps = useHangar((s) => s.flaps);
  const setFlaps = useHangar((s) => s.setFlaps);
  const reset = useHangar((s) => s.resetViewFlags);
  const setMobileSheet = useHangar((s) => s.setMobileSheet);
  const toggle = useHangar((s) => s.toggle);
  const showFairings = useHangar((s) => s.showFairings);
  const showDimensions = useHangar((s) => s.showDimensions);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3 md:p-4">
      <div className="pointer-events-auto mx-auto flex max-w-5xl flex-col gap-3 rounded-[var(--radius-xl)] bg-surface/90 px-3 py-3 shadow-[var(--shadow-border)] backdrop-blur-sm md:px-5">
        <div className="flex flex-wrap items-center gap-2">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setViewMode(v.id)}
              className={cn(
                "h-9 rounded-[var(--radius-sm)] px-3 font-mono text-[11px]",
                viewMode === v.id ? "bg-accent text-accent-fg" : "text-muted hover:bg-elevated hover:text-fg",
              )}
            >
              {v.label}
            </button>
          ))}
          <span className="hidden h-5 w-px bg-border md:block" />
          {COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setColorMode(c.id)}
              className={cn(
                "hidden h-9 rounded-[var(--radius-sm)] px-3 font-mono text-[11px] sm:inline-flex sm:items-center",
                colorMode === c.id ? "bg-elevated text-fg" : "text-muted hover:text-fg",
              )}
            >
              {c.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              aria-label="Parts catalog"
              className="md:hidden"
              onClick={() => setMobileSheet(true)}
            >
              <Layers className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Toggle dimensions"
              onClick={() => toggle("showDimensions")}
            >
              <BoxSelect className={cn("size-4", showDimensions ? "text-fg" : "text-subtle")} />
            </Button>
            <Button size="icon" variant="ghost" aria-label="Reset" onClick={reset}>
              <RotateCcw className="size-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
          <label className="flex items-center gap-3">
            <span className="w-16 shrink-0 font-mono text-[10px] tracking-wide text-subtle uppercase">Explode</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={explode}
              onChange={(e) => setExplode(Number(e.target.value))}
              className="h-11 w-full accent-accent"
            />
            <span className="w-8 font-mono text-[11px] text-muted tabular-nums">{Math.round(explode * 100)}</span>
          </label>
          <div className="grid grid-cols-2 gap-2 sm:contents">
          <label className="flex items-center gap-2 sm:gap-3">
            <span className="w-12 shrink-0 font-mono text-[10px] tracking-wide text-subtle uppercase sm:w-16">Flaps</span>
            <input
              type="range"
              min={0}
              max={40}
              step={1}
              value={flaps}
              onChange={(e) => setFlaps(Number(e.target.value))}
              className="h-11 w-full accent-accent"
            />
            <span className="w-8 font-mono text-[11px] text-muted tabular-nums">{flaps}°</span>
          </label>
          <label className="flex h-11 items-center gap-2 font-mono text-[11px] text-muted">
            <input
              type="checkbox"
              checked={showFairings}
              onChange={() => toggle("showFairings")}
              className="size-4 accent-accent"
            />
            Fairings
          </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function Intro() {
  const intro = useHangar((s) => s.intro);
  const setIntro = useHangar((s) => s.setIntro);
  const setExplode = useHangar((s) => s.setExplode);
  if (!intro) return null;
  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-bg/40 p-4 pb-36 md:items-center md:pb-4">
      <div className="w-full max-w-lg rounded-[var(--radius-xl)] bg-surface p-6 shadow-[var(--shadow-border)]">
        <p className="font-mono text-[10px] tracking-[0.2em] text-subtle uppercase">Illustrated parts — 172E</p>
        <h2 className="mt-2 text-2xl font-medium tracking-tight">Omni-Vision Skyhawk, pulled apart.</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          A 1964 Cessna 172E at one-inch scale: NACA 2412 wings, O-300-D, bladder tanks, manual flaps, generator,
          and the joints that hold them. Not a Cessna IPC — an original reconstruction from TCDS 3A12 and the 100-series manuals.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="primary" size="md" onClick={() => setIntro(false)}>
            Enter hangar
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              setIntro(false);
              setExplode(0.72);
            }}
          >
            Explode first
          </Button>
          <a
            href="/download"
            className="inline-flex h-11 items-center rounded-[var(--radius-md)] bg-elevated px-4 text-sm font-medium text-fg"
          >
            Download source zip
          </a>
        </div>
      </div>
    </div>
  );
}

function MobileParts() {
  const open = useHangar((s) => s.mobileSheet);
  const setOpen = useHangar((s) => s.setMobileSheet);
  const selectedId = useHangar((s) => s.selectedId);
  if (!open && !selectedId) return null;
  if (!open) {
    const part = resolvePart(selectedId!);
    return (
      <div className="absolute inset-x-3 bottom-36 z-20 rounded-[var(--radius-lg)] bg-surface/95 p-4 shadow-[var(--shadow-border)] backdrop-blur-sm lg:hidden">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] text-subtle">{part.id}</p>
            <p className="text-sm font-medium">{part.name}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={() => useHangar.getState().select(null)} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>
        <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-muted">{part.notes}</p>
      </div>
    );
  }
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 max-h-[70vh] overflow-y-auto rounded-t-[var(--radius-xl)] bg-surface p-4 shadow-[var(--shadow-border)] md:hidden">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-medium">Parts catalog</p>
        <Button size="icon" variant="ghost" onClick={() => setOpen(false)} aria-label="Close catalog">
          <X className="size-4" />
        </Button>
      </div>
      <PartsTree />
    </div>
  );
}
