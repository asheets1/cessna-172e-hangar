import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, Grid, Html, OrbitControls } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { buildAircraft } from "@/lib/cessna/build";
import { resolvePart } from "@/lib/cessna/catalog";
import { applyAppearance, makeStandard } from "@/lib/cessna/materials";
import { SPEC } from "@/lib/cessna/specs";
import { useHangar } from "@/lib/cessna/store";
import type { Visual } from "@/lib/cessna/types";

const CLIP = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0.4);

function PartMesh({ visual }: { visual: Visual }) {
  const mat = useMemo(() => makeStandard(), []);
  const explode = useHangar((s) => s.explode);
  const viewMode = useHangar((s) => s.viewMode);
  const colorMode = useHangar((s) => s.colorMode);
  const selectedId = useHangar((s) => s.selectedId);
  const hoveredId = useHangar((s) => s.hoveredId);
  const showFairings = useHangar((s) => s.showFairings);
  const flaps = useHangar((s) => s.flaps);
  const hiddenSystems = useHangar((s) => s.hiddenSystems);
  const select = useHangar((s) => s.select);
  const hover = useHangar((s) => s.hover);
  const part = useMemo(() => resolvePart(visual.id), [visual.id]);

  const e = explode * explode * (3 - 2 * explode);
  const pos: [number, number, number] = [
    visual.position[0] + visual.explode[0] * e,
    visual.position[1] + visual.explode[1] * e,
    visual.position[2] + visual.explode[2] * e,
  ];

  useEffect(() => {
    applyAppearance(mat, {
      materialKey: visual.materialKey,
      colorMode,
      viewMode,
      part,
      selected: selectedId === visual.id,
      hovered: hoveredId === visual.id,
      role: visual.role,
      explode,
    });
    mat.clippingPlanes = viewMode === "cutaway" ? [CLIP] : [];
    mat.clipShadows = viewMode === "cutaway";
  }, [mat, colorMode, viewMode, part, selectedId, hoveredId, visual, explode]);

  const hidden =
    hiddenSystems.includes(part.system) ||
    (!showFairings && visual.id.includes("FAIRING")) ||
    (viewMode === "solid" && explode < 0.1 && visual.role === "structure") ||
    (viewMode === "solid" && explode < 0.1 && visual.id.includes("SKIN-LOWER"));

  const rot: [number, number, number] = visual.rotation
    ? [visual.rotation[0], visual.rotation[1], visual.rotation[2]]
    : [0, 0, 0];
  if (visual.id.includes("-FLAP") && flaps > 0) {
    rot[0] += THREE.MathUtils.degToRad(flaps);
  }

  return (
    <mesh
      geometry={visual.geometry}
      material={mat}
      position={pos}
      scale={visual.scale}
      visible={!hidden}
      castShadow
      receiveShadow
      {...(visual.quaternion ? { quaternion: visual.quaternion } : { rotation: rot })}
      onClick={(ev) => {
        ev.stopPropagation();
        select(visual.id);
      }}
      onPointerOver={(ev) => {
        ev.stopPropagation();
        hover(visual.id);
      }}
      onPointerOut={() => hover(null)}
    />
  );
}

function Aircraft() {
  const visuals = useMemo(() => buildAircraft(), []);
  useEffect(() => {
    return () => {
      const seen = new Set<THREE.BufferGeometry>();
      for (const vis of visuals) {
        if (!seen.has(vis.geometry)) {
          seen.add(vis.geometry);
          vis.geometry.dispose();
        }
      }
    };
  }, [visuals]);
  return (
    <group>
      {visuals.map((vis) => (
        <PartMesh key={vis.id} visual={vis} />
      ))}
      <SelectedCallout visuals={visuals} />
    </group>
  );
}

function SelectedCallout({ visuals }: { visuals: Visual[] }) {
  const selectedId = useHangar((s) => s.selectedId);
  const explode = useHangar((s) => s.explode);
  const showLabels = useHangar((s) => s.showLabels);
  if (!selectedId && !showLabels) return null;
  const vis = visuals.find((x) => x.id === selectedId);
  if (!vis) return null;
  const e = explode * explode * (3 - 2 * explode);
  const pos: [number, number, number] = [
    vis.position[0] + vis.explode[0] * e,
    vis.position[1] + vis.explode[1] * e + 8,
    vis.position[2] + vis.explode[2] * e,
  ];
  const part = resolvePart(vis.id);
  return (
    <Html position={pos} center distanceFactor={180} zIndexRange={[10, 0]}>
      <div className="pointer-events-none whitespace-nowrap rounded-[var(--radius-sm)] bg-bg/90 px-2 py-1 font-mono text-[11px] text-fg shadow-[var(--shadow-border)]">
        {part.id} · {part.name}
      </div>
    </Html>
  );
}

function Dimensions() {
  const show = useHangar((s) => s.showDimensions);
  if (!show) return null;
  const y = 2;
  return (
    <group>
      <Html position={[0, y, SPEC.stations.spinnerTip - 6]} center>
        <span className="font-mono text-[10px] text-muted">SPIN</span>
      </Html>
      <Html position={[SPEC.wing.semiSpan, WING_LABEL_Y, SPEC.stations.wingLE + 29]} center>
        <span className="font-mono text-[10px] text-muted">{SPEC.span / 12}' span</span>
      </Html>
      <Html position={[0, SPEC.height + 4, 220]} center>
        <span className="font-mono text-[10px] text-muted">{(SPEC.height / 12).toFixed(1)}' ht</span>
      </Html>
      <Html position={[0, y, SPEC.stations.rudderTE + 8]} center>
        <span className="font-mono text-[10px] text-muted">{(SPEC.length / 12).toFixed(1)}' OAL</span>
      </Html>
    </group>
  );
}

const WING_LABEL_Y = 78;

function Lights() {
  return (
    <>
      <hemisphereLight args={["#d9dde4", "#2a2c32", 0.55]} />
      <directionalLight
        position={[180, 240, 120]}
        intensity={1.35}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={10}
        shadow-camera-far={800}
        shadow-camera-left={-260}
        shadow-camera-right={260}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />
      <directionalLight position={[-160, 80, -80]} intensity={0.35} color="#9aa7b8" />
      <directionalLight position={[40, 40, 200]} intensity={0.25} color="#e8e6e1" />
    </>
  );
}

function ClipEnable() {
  const gl = useThree((s) => s.gl);
  const viewMode = useHangar((s) => s.viewMode);
  useEffect(() => {
    gl.localClippingEnabled = viewMode === "cutaway";
  }, [gl, viewMode]);
  return null;
}

function Background() {
  const viewMode = useHangar((s) => s.viewMode);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const col = viewMode === "blueprint" ? "#0a0c10" : "#0c0d10";
    scene.background = new THREE.Color(col);
    scene.fog = new THREE.Fog(col, 420, 1400);
  }, [scene, viewMode]);
  return null;
}

export function HangarCanvas() {
  const select = useHangar((s) => s.select);
  return (
    <Canvas
      className="absolute inset-0 touch-none"
      shadows
      dpr={[1, 2]}
      camera={{ position: [240, 120, 300], fov: 38, near: 2, far: 2400 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      onPointerMissed={() => select(null)}
    >
      <Background />
      <ClipEnable />
      <Lights />
      <Aircraft />
      <Dimensions />
      <Grid
        args={[1200, 1200]}
        cellSize={12}
        cellThickness={0.4}
        cellColor="#1c1f26"
        sectionSize={60}
        sectionThickness={0.9}
        sectionColor="#2a3038"
        fadeDistance={900}
        fadeStrength={1.2}
        position={[0, 0.02, 40]}
      />
      <ContactShadows position={[0, 0.04, 40]} opacity={0.45} scale={700} blur={2.4} far={80} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={70}
        maxDistance={900}
        maxPolarAngle={Math.PI / 2 - 0.04}
        target={[0, 38, 40]}
      />
    </Canvas>
  );
}
