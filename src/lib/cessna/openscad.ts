import { PARTS } from "./catalog";
import { DISCLAIMER, SPEC } from "./specs";

/** Parametric OpenSCAD reconstruction — inches, explode [0,1]. */
export function generateOpenSCAD(explode = 0): string {
  const e = explode.toFixed(3);
  const W = SPEC.wing;
  return `// =============================================================================
// Cessna 172E Skyhawk (1964) — educational OpenSCAD reconstruction
// Units: inches. Parameter explode = 0 (assembled) .. 1 (poster explode).
// ${DISCLAIMER}
// Sources: TCDS 3A12, 172E Owner's Manual, 100-series service practice,
// Continental O-300 overhaul notes, NACA 2412 (Report 460), AC 43.13-1B.
// Schematic identifiers — not official Cessna IPC numbers.
// =============================================================================

explode = ${e}; // [0:0.01:1]
$fn = 24;

span = ${SPEC.span};
length = ${SPEC.length};
height = ${SPEC.height};
chord = ${W.chord};
semi = ${W.semiSpan};
dihedral = ${W.dihedralDeg};
inc_root = ${W.incidenceRootDeg};
washout = ${W.washoutDeg};
wing_y = 66.2;
root_x = 22;
wing_le = ${SPEC.stations.wingLE};
main_spar_z = ${SPEC.stations.mainSpar};
rear_spar_z = ${SPEC.stations.rearSpar};

module naca2412(c=chord, n=24) {
  function yt(x) = 5*0.12*c*(0.2969*sqrt(x) - 0.1260*x - 0.3516*x*x + 0.2843*x*x*x - 0.1036*x*x*x*x);
  function yc(x) = (x<0.4)
    ? 0.02*c*(2*0.4*x - x*x)/(0.4*0.4)
    : 0.02*c*(1-2*0.4 + 2*0.4*x - x*x)/((1-0.4)*(1-0.4));
  pts = [for (i=[0:n]) let(x=0.5*(1-cos(180*i/n))) [x*c, yc(x)+yt(x)]];
  pts_l = [for (i=[n:-1:0]) let(x=0.5*(1-cos(180*i/n))) [x*c, yc(x)-yt(x)]];
  polygon(concat(pts, pts_l));
}

module loft_station(z, rx, ry, cy) {
  translate([0, cy, z]) scale([rx, ry, 1]) cylinder(h=0.4, r=1, center=true);
}

module fuselage_cabin() {
  color("WhiteSmoke")
  hull() {
    loft_station(0, 20, 18.5, 34.5);
    loft_station(12, 21.5, 23, 38);
    loft_station(28, 23.5, 25.5, 41);
    loft_station(52, 24, 26, 41);
    loft_station(78, 22.5, 24.5, 40.5);
    loft_station(100, 19, 20, 38);
    loft_station(118, 15.5, 15.5, 35.5);
  }
}

module fuselage_aft() {
  color("WhiteSmoke")
  hull() {
    loft_station(118, 15.5, 15.5, 35.5);
    loft_station(145, 11, 12, 34);
    loft_station(175, 7.2, 9.2, 34.5);
    loft_station(205, 4.6, 7.2, 36.5);
    loft_station(235, 3.2, 5.6, 38.5);
    loft_station(258, 2.2, 4.2, 39.5);
  }
}

module firewall() {
  color("Gainsboro") translate([0, 34, 0]) cube([40, 38, 0.5], center=true);
}

module bulkhead(z, w, h, cy=38) {
  color("Silver") translate([0, cy, z]) cube([w, h, 0.4], center=true);
}

module longeron(x, y, len=118, z=58) {
  color("Silver") translate([x, y, z]) cube([1.1, 1.1, len], center=true);
}

module windshield() {
  color([0.55, 0.72, 0.8, 0.35])
    translate([0, 54, 14]) rotate([30, 0, 0]) cube([38, 22, 0.6], center=true);
}

module cabin_door(side=1) {
  color("WhiteSmoke") translate([24.6*side, 36, 42]) cube([1.1, 34, 28], center=true);
}

module wing_skin(side=1) {
  color("WhiteSmoke")
  translate([0, 0, 0])
  for (t=[0:0.125:1]) {
    x = (root_x + t*(semi-root_x))*side;
    inc = inc_root - washout*t;
    y = wing_y + (abs(x)-root_x)*tan(dihedral);
    translate([x, y, wing_le])
      rotate([90, 0, 90])
        rotate([inc, 0, 0])
          linear_extrude(height=0.8, center=true) naca2412();
  }
}

module wing_spar_main(side=1) {
  len = semi - root_x - 6;
  color("Silver")
    translate([(root_x + len/2)*side, wing_y+1.2, main_spar_z])
      cube([len, 6.4, 1.35], center=true);
}

module wing_spar_rear(side=1) {
  len = semi - root_x - 8;
  color("Silver")
    translate([(root_x + len/2)*side, wing_y+0.4, rear_spar_z])
      cube([len, 3.6, 0.9], center=true);
}

module wing_ribs(side=1) {
  color("Gainsboro")
  for (i=[0:13]) {
    t = i/13;
    x = (root_x + 4 + t*(semi-root_x-10))*side;
    y = wing_y + (abs(x)-root_x)*tan(dihedral);
    translate([x, y, wing_le])
      rotate([90, 0, 90])
        linear_extrude(height=0.5, center=true)
          difference() {
            naca2412();
            translate([18, 0.3]) scale([5.5, 1.45]) circle(1);
            translate([38, 0.15]) scale([4.6, 1.15]) circle(1);
          }
  }
}

module flap(side=1) {
  color("WhiteSmoke")
    translate([(root_x + 8 + ${W.flapSpan}/2)*side, wing_y-0.2, wing_le + chord - ${W.flapChord}])
      cube([${W.flapSpan}, 1.6, ${W.flapChord}], center=true);
}

module aileron(side=1) {
  color("WhiteSmoke")
    translate([(root_x + 8 + ${W.flapSpan} + 8 + ${W.aileronSpan}/2)*side, wing_y-0.15, wing_le + chord - ${W.aileronChord}])
      cube([${W.aileronSpan}, 1.4, ${W.aileronChord}], center=true);
}

module strut(side=1) {
  color("Silver")
    hull() {
      translate([21*side, 21.5, 46]) sphere(1.15);
      translate([${W.strutAttachX}*side, wing_y+0.6, main_spar_z]) sphere(1.15);
    }
}

module jury(side=1) {
  color("Silver")
    hull() {
      translate([
        (21*side)*0.58 + (${W.juryAttachX}*side)*0.42,
        21.5*0.58 + (wing_y)*0.42,
        46*0.58 + (main_spar_z-8)*0.42
      ]) sphere(0.55);
      translate([${W.juryAttachX}*side, wing_y+0.2, main_spar_z-8]) sphere(0.55);
    }
}

module fuel_tank(side=1) {
  color([0.55, 0.18, 0.25])
    translate([(root_x+28)*side, wing_y+0.8, wing_le+16]) cube([48, 5.2, 22], center=true);
}

module swept_fin(root_c, tip_c, h, sweep, thick) {
  s = tan(sweep)*h;
  linear_extrude(height=thick, center=true)
    polygon([[0,0],[s*0.82,h],[s*0.82+tip_c,h],[root_c,0]]);
}

module empennage() {
  color("WhiteSmoke") {
    translate([0, 44, 208]) rotate([90, 0, 90])
      swept_fin(${SPEC.tail.vsRootChord}, ${SPEC.tail.vsTipChord}, ${SPEC.tail.vsHeight}, ${SPEC.tail.sweepLEDeg}, 1.35);
    translate([0, 46, 248]) rotate([90, 0, 90])
      swept_fin(${SPEC.tail.rudderChord}+4, ${SPEC.tail.rudderChord}, ${SPEC.tail.vsHeight}-6, 8, 1.05);
    translate([0, 50, 168]) rotate([90, 0, 90])
      swept_fin(28, 8, 16, 38, 0.95);
    translate([0, 42, 232]) cube([${SPEC.tail.hsSpan}, 1.6, ${SPEC.tail.hsChord}], center=true);
    translate([-${SPEC.tail.hsSpan}/4, 41.6, 244]) cube([${SPEC.tail.hsSpan}/2-2, 1.05, ${SPEC.tail.elevatorChord}], center=true);
    translate([ ${SPEC.tail.hsSpan}/4, 41.6, 244]) cube([${SPEC.tail.hsSpan}/2-2, 1.05, ${SPEC.tail.elevatorChord}], center=true);
  }
}

module main_gear(side=1) {
  color("DimGray") {
    hull() {
      translate([16*side, 19, 46]) sphere(1.2);
      translate([${SPEC.gear.track}/2*side, ${SPEC.gear.mainRadius}, 46]) sphere(1.5);
    }
    translate([${SPEC.gear.track}/2*side, ${SPEC.gear.mainRadius}, 46])
      rotate([0, 90, 0]) rotate_extrude() translate([${SPEC.gear.mainRadius}-2.1, 0]) circle(2.1);
  }
}

module nose_gear() {
  color("DimGray") {
    translate([0, 20, ${SPEC.gear.noseZ}]) cylinder(h=22, r=1.25, center=true);
    translate([0, ${SPEC.gear.noseRadius}, ${SPEC.gear.noseZ}])
      rotate([0, 90, 0]) rotate_extrude() translate([${SPEC.gear.noseRadius}-1.8, 0]) circle(1.8);
  }
}

module o300() {
  color("Silver") translate([0, 33, -22]) cube([11, 10.5, 22], center=true);
  color("Gray") translate([0, 26.2, -20]) cube([8.5, 4.2, 16], center=true);
  color("SlateGray")
  for (z=[-31.5, -22, -12.5]) for (s=[-1, 1])
    translate([7.4*s, 34.2, z]) rotate([0, 0, 90]) cylinder(h=8.2, r=2.4, center=true);
  color("Tan") translate([0, 23.2, -18]) cube([5.2, 4.4, 5.6], center=true);
}

module propeller() {
  color("Gainsboro") {
    translate([0, 33.5, -44]) rotate([90, 0, 0]) cylinder(h=3.4, r=2.4, center=true);
    translate([0, 33.5+18, -44]) rotate([10, 22, 0]) cube([1.05, 36, 7.2], center=true);
    translate([0, 33.5-18, -44]) rotate([10, 22, 180]) cube([1.05, 36, 7.2], center=true);
    translate([0, 33.5, -46]) rotate([90, 0, 0])
      scale([1, 1, 1.4]) sphere(5.2);
  }
}

module cowling() {
  color("WhiteSmoke")
  hull() {
    loft_station(-40, 15.5, 11.5, 32.5);
    loft_station(-28, 17.5, 13.5, 32.8);
    loft_station(-14, 18.8, 16, 33.5);
    loft_station(0, 20, 18.5, 34.5);
  }
}

module interior() {
  color([0.42, 0.2, 0.22]) {
    translate([-9, 20, 36]) cube([16, 4, 16], center=true);
    translate([ 9, 20, 36]) cube([16, 4, 16], center=true);
    translate([0, 20, 78]) cube([36, 4, 16], center=true);
    translate([0, 40, 20.5]) cube([38, 14, 1.2], center=true);
  }
}

module E(off) { translate(off * explode) children(); }

module wing_assembly(side=1) {
  ex = 92*side; ey = 36;
  E([ex, ey, 0]) wing_skin(side);
  E([ex*0.55, ey*0.4, 0]) wing_spar_main(side);
  E([ex*0.6, ey*0.35, 8]) wing_spar_rear(side);
  E([ex*0.85, ey*0.5, 4]) wing_ribs(side);
  E([ex, ey*0.2, 28]) flap(side);
  E([ex*1.15, ey*0.15, 24]) aileron(side);
  E([ex*0.45, -28, 10]) strut(side);
  E([ex*0.4, -18, 6]) jury(side);
  E([ex*0.3, 48, -6]) fuel_tank(side);
}

module cessna_172e() {
  E([0, 22, 0]) fuselage_cabin();
  E([0, 8, 48]) fuselage_aft();
  E([0, 6, -18]) firewall();
  E([0, 10, 8]) bulkhead(48, 44, 40);
  E([0, 10, 16]) bulkhead(90, 40, 36);
  E([0, 10, 22]) bulkhead(110, 32, 28, 36);
  E([0, 26, -12]) windshield();
  E([-42, 4, 0]) cabin_door(-1);
  E([ 42, 4, 0]) cabin_door( 1);
  wing_assembly(-1);
  wing_assembly( 1);
  E([0, 12, 70]) empennage();
  E([-8, -38, 0]) main_gear(-1);
  E([ 8, -38, 0]) main_gear( 1);
  E([0, -38, -16]) nose_gear();
  E([0, 8, -64]) o300();
  E([0, 0, -92]) propeller();
  E([0, 6, -48]) cowling();
  E([0, -24, 0]) interior();
}

cessna_172e();

// --- legend (2D, compiled when drawing a projection) ---
echo("172E Skyhawk 1964 — span ", span, " length ", length, " height ", height);
echo("Engine Continental O-300-D 145 hp / McCauley 76 in fixed-pitch");
echo("Fuel 42 US gal bladder (39 usable). Manual flaps 0-40. Generator 12 V.");
`;
}

export function generatePartsCSV(): string {
  const header = "id,name,system,role,qty,material,weight_lb,notes";
  const rows = PARTS.map((p) =>
    [p.id, csv(p.name), p.system, p.role, p.qty, csv(p.material), p.weightLb ?? "", csv(p.notes)].join(","),
  );
  return [header, ...rows].join("\n");
}

function csv(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
