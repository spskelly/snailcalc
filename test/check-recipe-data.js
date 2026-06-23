const fs = require('fs');
const path = require('path');
const { extract } = require('./extract-recipes');

const golden = JSON.parse(fs.readFileSync(path.join(__dirname, 'recipe-data.golden.json'), 'utf8'));
const { COOKING_RECIPES, RECIPE_ORDER } = extract();

let failures = 0;
const fail = (msg) => { console.error('FAIL: ' + msg); failures++; };

// 1. Every golden recipe reproduced byte-identically.
for (const [id, recipe] of Object.entries(golden.recipes)) {
  if (COOKING_RECIPES[id] === undefined) { fail(`missing recipe: ${id}`); continue; }
  const a = JSON.stringify(COOKING_RECIPES[id]);
  const b = JSON.stringify(recipe);
  if (a !== b) fail(`recipe mismatch: ${id}\n  golden: ${b}\n  actual: ${a}`);
}

// 2. Completeness: every existing recipe is still displayed, no duplicates,
//    and RECIPE_ORDER stays in sync with COOKING_RECIPES.
//    (Exact sequence is NOT asserted here — see check-order.js for the
//    "strictly increasing slot order" invariant. The old hand-maintained
//    RECIPE_ORDER had ordering slips we intentionally normalize.)
for (const id of Object.keys(golden.recipes)) {
  if (!RECIPE_ORDER.includes(id)) fail(`existing recipe dropped from RECIPE_ORDER: ${id}`);
}
const seen = new Set();
for (const id of RECIPE_ORDER) {
  if (seen.has(id)) fail(`duplicate id in RECIPE_ORDER: ${id}`);
  seen.add(id);
}
if (RECIPE_ORDER.length !== Object.keys(COOKING_RECIPES).length) {
  fail(`RECIPE_ORDER length ${RECIPE_ORDER.length} != recipe count ${Object.keys(COOKING_RECIPES).length}`);
}

if (failures) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log(`OK: ${Object.keys(golden.recipes).length} recipes match golden; all displayed, no dups`);
