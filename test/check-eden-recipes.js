const { extract } = require('./extract-recipes');
const { COOKING_RECIPES, RECIPE_ORDER } = extract();

// Expected ingredient ratios for the 12 eden slots, in display order.
const EXPECTED = [
  { meat: 1  }, { meat: 3  }, { meat: 5  },
  { meat: 2, veg: 1 }, { meat: 3, veg: 2 }, { meat: 4, veg: 2 },
  { meat: 6, veg: 3 }, { meat: 8, veg: 4 }, { meat: 10, veg: 6 },
  { meat: 5, veg: 2, spice: 1 }, { meat: 8, veg: 5, spice: 3 }, { meat: 20, veg: 10, spice: 5 },
];

let failures = 0;
const fail = (msg) => { console.error('FAIL: ' + msg); failures++; };

const edenIds = RECIPE_ORDER.filter((id) => {
  const r = COOKING_RECIPES[id];
  return r.edenMeat > 0 || r.edenVegetable > 0 || r.edenSpice > 0;
});

if (edenIds.length !== 12) fail(`expected 12 eden recipes, got ${edenIds.length}`);

edenIds.forEach((id, i) => {
  const r = COOKING_RECIPES[id];
  const e = EXPECTED[i] || {};
  if (r.edenMeat !== (e.meat || 0) || r.edenVegetable !== (e.veg || 0) || r.edenSpice !== (e.spice || 0)) {
    fail(`eden slot ${i} (${id}) ratio mismatch: expected ${JSON.stringify(e)}, got ` +
      `{meat:${r.edenMeat}, veg:${r.edenVegetable}, spice:${r.edenSpice}}`);
  }
});

if (failures) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log(`OK: 12 eden recipes present with correct slot ratios`);
