// Tests for the amulet slot -> quantity migration (issue #41).
// Run: node tests/migration.test.js
// No dependencies. Loads the real data.js and extracts the amulet helper
// block (including migrateAmuletSlots) from script.js, with a stubbed
// localStorage, so the tested code is the shipped code.
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

const dataSrc = fs.readFileSync(path.join(ROOT, "data.js"), "utf8");
const scriptSrc = fs.readFileSync(path.join(ROOT, "script.js"), "utf8");

function extract(src, startMarker, endMarker) {
  const s = src.indexOf(startMarker);
  const e = src.indexOf(endMarker, s);
  if (s === -1 || e === -1) throw new Error("marker not found: " + startMarker);
  return src.slice(s, e);
}

const cumulativeFn = extract(scriptSrc, "function calculateAmuletCumulativeCost", "// Helper function to calculate cumulative costs for snail gear");
const amuletBlock = extract(scriptSrc, "// ===== Amulet quantities =====", "migrateAmuletSlots(\"snailGearSettings\"");

const store = new Map();
const localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
};

const sandbox = `${dataSrc}\n${cumulativeFn}\n${amuletBlock}\n
module.exports = { amuletLabelToCostKey, normalizeAmuletQuantity, getDefaultAmuletQuantityMap,
  readAmuletQuantities, writeAmuletQuantities, calculateAmuletQuantityTotals, migrateAmuletSlots,
  calculateAmuletCumulativeCost, WILL_AMULET_INCREMENTAL, DEMON_GOD_AMULET_INCREMENTAL,
  SNAIL_AMULET_OPTIONS, MINION_AMULET_OPTIONS };`;

const mod = { exports: {} };
new Function("module", "exports", "localStorage", sandbox)(mod, mod.exports, localStorage);
const F = mod.exports;

let pass = 0, fail = 0;
function assertEq(actual, expected, msg) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { pass++; }
  else { fail++; console.log(`FAIL: ${msg}\n  expected ${e}\n  actual   ${a}`); }
}
function reset() { store.clear(); }

// --- 1. Live snail slots: amulets move to quantities, slots become None, gear untouched
reset();
store.set("snailGearSettings", JSON.stringify({ 1: "+3", 2: "Amulet +2", 3: "Amulet +2", 4: "Amulet (Red)", 5: "None" }));
F.migrateAmuletSlots("snailGearSettings", "snailAmuletQuantities", F.SNAIL_AMULET_OPTIONS);
let slots = JSON.parse(store.get("snailGearSettings"));
assertEq(slots, { 1: "+3", 2: "None", 3: "None", 4: "None", 5: "None" }, "snail slots cleared of amulets, gear kept");
let q = F.readAmuletQuantities("snailAmuletQuantities", F.SNAIL_AMULET_OPTIONS);
assertEq(q["Amulet +2"], 2, "two +2 slot amulets became quantity 2");
assertEq(q["Amulet (Red)"], 1, "one Red slot amulet became quantity 1");
assertEq(q["Amulet +8"], 0, "untouched amulet stays 0");

// --- 2. Accumulates onto existing quantities instead of overwriting
reset();
store.set("snailGearSettings", JSON.stringify({ 1: "Amulet +1" }));
F.writeAmuletQuantities("snailAmuletQuantities", { "Amulet +1": 2 });
F.migrateAmuletSlots("snailGearSettings", "snailAmuletQuantities", F.SNAIL_AMULET_OPTIONS);
q = F.readAmuletQuantities("snailAmuletQuantities", F.SNAIL_AMULET_OPTIONS);
assertEq(q["Amulet +1"], 3, "slot amulet adds to existing quantity (2+1)");

// --- 3. Idempotent: second run changes nothing
F.migrateAmuletSlots("snailGearSettings", "snailAmuletQuantities", F.SNAIL_AMULET_OPTIONS);
q = F.readAmuletQuantities("snailAmuletQuantities", F.SNAIL_AMULET_OPTIONS);
assertEq(q["Amulet +1"], 3, "second migration run is a no-op");

// --- 4. Missing key: no-op, nothing created
reset();
F.migrateAmuletSlots("snailGearSettings", "snailAmuletQuantities", F.SNAIL_AMULET_OPTIONS);
assertEq(store.has("snailAmuletQuantities"), false, "no records created when nothing to migrate");

// --- 5. Malformed slot record: no throw, no changes
reset();
store.set("snailGearSettings", "{not json");
F.migrateAmuletSlots("snailGearSettings", "snailAmuletQuantities", F.SNAIL_AMULET_OPTIONS);
assertEq(store.get("snailGearSettings"), "{not json", "malformed record left as-is");
assertEq(store.has("snailAmuletQuantities"), false, "malformed record creates no quantities");
reset();
store.set("snailGearSettings", "null");
F.migrateAmuletSlots("snailGearSettings", "snailAmuletQuantities", F.SNAIL_AMULET_OPTIONS);
assertEq(store.has("snailAmuletQuantities"), false, "'null' record is a no-op");

// --- 6. All-gear record: untouched, no quantity record written
reset();
store.set("snailGearSettings", JSON.stringify({ 1: "+9", 2: "Time Wanderer", 3: "None" }));
F.migrateAmuletSlots("snailGearSettings", "snailAmuletQuantities", F.SNAIL_AMULET_OPTIONS);
assertEq(JSON.parse(store.get("snailGearSettings")), { 1: "+9", 2: "Time Wanderer", 3: "None" }, "gear-only record unchanged");
assertEq(store.has("snailAmuletQuantities"), false, "gear-only record writes no quantities");

// --- 7. Minion variant with minion options
reset();
store.set("minionGearSettings", JSON.stringify({ 1: "Amulet +4", 2: "+5", 3: "Amulet (Red)" }));
F.migrateAmuletSlots("minionGearSettings", "minionAmuletQuantities", F.MINION_AMULET_OPTIONS);
assertEq(JSON.parse(store.get("minionGearSettings")), { 1: "None", 2: "+5", 3: "None" }, "minion slots migrate");
q = F.readAmuletQuantities("minionAmuletQuantities", F.MINION_AMULET_OPTIONS);
assertEq(q["Amulet +4"], 1, "minion +4 migrated");
assertEq(q["Amulet (Red)"], 1, "minion Red migrated");

// --- 8. Presets migrate via the same function with preset keys
reset();
store.set("snailPreset2", JSON.stringify({ 1: "Amulet +5", 2: "Red" }));
F.migrateAmuletSlots("snailPreset2", "snailAmuletPreset2", F.SNAIL_AMULET_OPTIONS);
assertEq(JSON.parse(store.get("snailPreset2")), { 1: "None", 2: "Red" }, "preset slots migrate");
q = F.readAmuletQuantities("snailAmuletPreset2", F.SNAIL_AMULET_OPTIONS);
assertEq(q["Amulet +5"], 1, "preset amulet became preset quantity");

// --- 9. Cost equivalence: migrated quantity 1 costs exactly what the slot did
// (slot cost logic on old main: calculateAmuletCumulativeCost of the label's key)
F.SNAIL_AMULET_OPTIONS.forEach(label => {
  const key = label === "Amulet (Red)" ? "Red" : "+" + label.split("+")[1];
  const slotCost = F.calculateAmuletCumulativeCost(key, F.WILL_AMULET_INCREMENTAL);
  const qm = F.getDefaultAmuletQuantityMap(F.SNAIL_AMULET_OPTIONS);
  qm[label] = 1;
  const qt = F.calculateAmuletQuantityTotals(qm, F.WILL_AMULET_INCREMENTAL);
  ["eoh", "orange", "abyss", "heaven", "glue", "b_tad", "will_crystal"].forEach(k => {
    if ((slotCost[k] || 0) !== qt[k]) { fail++; console.log(`FAIL: equivalence ${label} ${k}`); }
    else pass++;
  });
});
F.MINION_AMULET_OPTIONS.forEach(label => {
  const key = label === "Amulet (Red)" ? "Red" : "+" + label.split("+")[1];
  const slotCost = F.calculateAmuletCumulativeCost(key, F.DEMON_GOD_AMULET_INCREMENTAL);
  const qm = F.getDefaultAmuletQuantityMap(F.MINION_AMULET_OPTIONS);
  qm[label] = 1;
  const qt = F.calculateAmuletQuantityTotals(qm, F.DEMON_GOD_AMULET_INCREMENTAL);
  ["eye", "orange", "abyss", "heaven", "glue", "b_tad", "dg_crystal"].forEach(k => {
    if ((slotCost[k] || 0) !== qt[k]) { fail++; console.log(`FAIL: equivalence ${label} ${k}`); }
    else pass++;
  });
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
