const fs = require('fs');
const path = require('path');
const { extract } = require('./extract-recipes');

const { COOKING_RECIPES, RECIPE_ORDER } = extract();
const golden = { recipes: COOKING_RECIPES, order: RECIPE_ORDER };
fs.writeFileSync(
  path.join(__dirname, 'recipe-data.golden.json'),
  JSON.stringify(golden, null, 2) + '\n'
);
console.log(`Captured ${Object.keys(COOKING_RECIPES).length} recipes; order length ${RECIPE_ORDER.length}`);
