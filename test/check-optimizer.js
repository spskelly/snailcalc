// Regression test for the phase-based production optimizer.
// Loads cooking-data.js + cooking.js together under Node and extracts the pure
// function calculatePhaseBasedSequence. A Proxy global resolves any browser-only
// identifier (document, window, Chart, ...) to a harmless stub so the file's
// top-level code runs; const/function declarations live in the script's lexical
// scope, so the trailing expression hands back exactly what we need.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function loadOptimizer() {
  const data = fs.readFileSync(path.join(__dirname, '..', 'cooking-data.js'), 'utf8');
  const cook = fs.readFileSync(path.join(__dirname, '..', 'cooking.js'), 'utf8');
  const stub = new Proxy(function () {}, {
    get: () => stub, apply: () => stub, construct: () => ({}), set: () => true,
  });
  const builtins = {
    console, Math, Object, Array, JSON, Number, String, Boolean,
    isNaN, parseInt, parseFloat, Date, RegExp, Error,
  };
  const store = {};
  const sandbox = new Proxy(store, {
    has: () => true,
    get: (t, k) => (k in t ? t[k] : (k in builtins ? builtins[k] : stub)),
    set: (t, k, v) => { t[k] = v; return true; },
  });
  vm.createContext(sandbox);
  const src = data + '\n' + cook + '\n;({ calculatePhaseBasedSequence, COOKING_RECIPES });';
  return vm.runInContext(src, sandbox, { filename: 'cooking-bundle.js' });
}

const { calculatePhaseBasedSequence, COOKING_RECIPES } = loadOptimizer();

const ZERO = {
  clownMeat: 0, clownVegetable: 0, clownSpice: 0,
  miracMeat: 0, miracVegetable: 0, miracSpice: 0,
  beastMeat: 0, beastVegetable: 0, beastSpice: 0,
  witchMeat: 0, witchVegetable: 0, witchSpice: 0,
};

let failures = 0;
const fail = (msg) => { console.error('FAIL: ' + msg); failures++; };

// A witch meat+veg recipe, with veg available, must be produced (Phase 1).
const wt = COOKING_RECIPES['worm_with_truffle']; // witchMeat 2, witchVegetable 1
const dish = { name: wt.name, recipe: wt, state: { price: 320 }, goldPerOrder: 100 };
const ingredients = { ...ZERO, witchMeat: 100, witchVegetable: 50 };
const res = calculatePhaseBasedSequence(ingredients, [dish]);
const produced = res.sequence.some((s) => s.name === wt.name && s.quantity > 0);
if (!produced) {
  fail('witch meat+veg recipe was not produced by the optimizer ' +
    '(Phase 1 vegetable filter must include witchVegetable)');
}

if (failures) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log('OK: witch vegetable recipes are produced by the optimizer');
