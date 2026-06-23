const { extract } = require('./extract-recipes');
const { COOKING_RECIPES, RECIPE_ORDER } = extract();

// Expected ingredient ratios for the 12 witch slots, in display order.
const EXPECTED = [
  { meat: 1  }, { meat: 3  }, { meat: 5  },
  { meat: 2, veg: 1 }, { meat: 3, veg: 2 }, { meat: 4, veg: 2 },
  { meat: 6, veg: 3 }, { meat: 8, veg: 4 }, { meat: 10, veg: 6 },
  { meat: 5, veg: 2, spice: 1 }, { meat: 8, veg: 5, spice: 3 }, { meat: 20, veg: 10, spice: 5 },
];

let failures = 0;
const fail = (msg) => { console.error('FAIL: ' + msg); failures++; };

const witchIds = RECIPE_ORDER.filter((id) => {
  const r = COOKING_RECIPES[id];
  return r.witchMeat > 0 || r.witchVegetable > 0 || r.witchSpice > 0;
});

if (witchIds.length !== 12) fail(`expected 12 witch recipes, got ${witchIds.length}`);

witchIds.forEach((id, i) => {
  const r = COOKING_RECIPES[id];
  const e = EXPECTED[i] || {};
  if (r.witchMeat !== (e.meat || 0) || r.witchVegetable !== (e.veg || 0) || r.witchSpice !== (e.spice || 0)) {
    fail(`witch slot ${i} (${id}) ratio mismatch: expected ${JSON.stringify(e)}, got ` +
      `{meat:${r.witchMeat}, veg:${r.witchVegetable}, spice:${r.witchSpice}}`);
  }
});

if (failures) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log(`OK: 12 witch recipes present with correct slot ratios`);
