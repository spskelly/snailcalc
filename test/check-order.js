// Verifies the display-order invariant: within each vendor, recipes appear in
// strictly increasing template-slot order (category-grouped, ascending amounts).
// This is the property the old hand-maintained RECIPE_ORDER violated; deriving
// order from slot position makes it structural.
const { extract } = require('./extract-recipes');
const { COOKING_RECIPES, RECIPE_ORDER, RECIPE_TIERS } = extract();

if (!RECIPE_TIERS) { console.error('FAIL: RECIPE_TIERS not defined'); process.exit(1); }

const VENDORS = ['clown', 'mirac', 'beast', 'witch'];
let failures = 0;
const fail = (msg) => { console.error('FAIL: ' + msg); failures++; };

const vendorOf = (r) => VENDORS.find((p) => r[p + 'Meat'] || r[p + 'Vegetable'] || r[p + 'Spice']) || null;
const slotOf = (r, p) => RECIPE_TIERS.findIndex((t) =>
  (t.meat || 0) === r[p + 'Meat'] && (t.veg || 0) === r[p + 'Vegetable'] && (t.spice || 0) === r[p + 'Spice']);

const lastSlot = {};
for (const id of RECIPE_ORDER) {
  const r = COOKING_RECIPES[id];
  const p = vendorOf(r);
  if (!p) { fail(`${id}: no vendor ingredients`); continue; }
  const slot = slotOf(r, p);
  if (slot < 0) { fail(`${id}: ratio matches no RECIPE_TIERS slot`); continue; }
  if (p in lastSlot && slot <= lastSlot[p]) {
    fail(`${id}: ${p} slot ${slot} not increasing (after slot ${lastSlot[p]})`);
  }
  lastSlot[p] = slot;
}

if (failures) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log('OK: every vendor in strictly increasing slot order');
