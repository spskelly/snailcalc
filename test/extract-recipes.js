const fs = require('fs');
const vm = require('vm');
const path = require('path');

// Evaluate the real cooking-data.js in an isolated context and return its globals.
// The trailing expression is in the same lexical scope as the file's top-level
// `const` declarations, so it can read them even though const does not attach to
// the vm context object.
function extract() {
  const code = fs.readFileSync(path.join(__dirname, '..', 'cooking-data.js'), 'utf8');
  const sandbox = {};
  vm.createContext(sandbox);
  // typeof guard so this works before RECIPE_TIERS exists (Task 1 sanity run).
  const wrapped = code +
    "\n;({ COOKING_RECIPES, RECIPE_ORDER, RECIPE_TIERS: typeof RECIPE_TIERS !== 'undefined' ? RECIPE_TIERS : null });";
  return vm.runInContext(wrapped, sandbox, { filename: 'cooking-data.js' });
}

module.exports = { extract };
