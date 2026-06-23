// Loads cooking-data.js + cooking.js under Node (browser globals stubbed) and
// exercises the pure Unicorn Express helpers against a seeded cookingState.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function load() {
  const data = fs.readFileSync(path.join(__dirname, '..', 'cooking-data.js'), 'utf8');
  const cook = fs.readFileSync(path.join(__dirname, '..', 'cooking.js'), 'utf8');
  const stub = new Proxy(function () {}, {
    get: () => stub, apply: () => stub, construct: () => ({}), set: () => true,
  });
  const builtins = { console, Math, Object, Array, JSON, Number, String, Boolean, isNaN, parseInt, parseFloat, Date, RegExp, Error };
  const store = {};
  const sandbox = new Proxy(store, {
    has: () => true,
    get: (t, k) => (k in t ? t[k] : (k in builtins ? builtins[k] : stub)),
    set: (t, k, v) => { t[k] = v; return true; },
  });
  vm.createContext(sandbox);
  const src = data + '\n' + cook +
    '\n;({ applyUnicornLevel, deriveUnicornLevel, unicornUnlockCounts, UNICORN_MAX_LEVEL, cookingState });';
  return vm.runInContext(src, sandbox, { filename: 'cooking-bundle.js' });
}

const api = load();
let failures = 0;
const fail = (m) => { console.error('FAIL: ' + m); failures++; };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };

const seed = () => { api.cookingState.vendors = { clown: {}, miraculand: {}, beast: {}, witch: {} }; };
const rates = (k) => { const v = api.cookingState.vendors[k]; return [v.meatRate || 0, v.vegetableRate || 0, v.spiceRate || 0]; };

// unlock counts
eq(api.unicornUnlockCounts(5), { clown: 3, miraculand: 2, beast: 0, witch: 0 }, 'counts@5');
eq(api.unicornUnlockCounts(99), { clown: 3, miraculand: 3, beast: 3, witch: 3 }, 'counts saturate@99');

// level -> rates
seed(); api.applyUnicornLevel(1);
eq(rates('clown'), [1, 0, 0], 'L1 clown meat-only');
seed(); api.applyUnicornLevel(3);
eq(rates('clown'), [0.65, 0.25, 0.10], 'L3 clown all-three');
eq(rates('miraculand'), [0, 0, 0], 'L3 mirac locked');
seed(); api.applyUnicornLevel(5);
eq(rates('clown'), [0.65, 0.25, 0.10], 'L5 clown all-three');
eq(rates('miraculand'), [0.7222, 0.2778, 0], 'L5 mirac meat+veg');
eq(rates('beast'), [0, 0, 0], 'L5 beast locked');
seed(); api.applyUnicornLevel(12);
['clown', 'miraculand', 'beast', 'witch'].forEach((k) => eq(rates(k), [0.65, 0.25, 0.10], `L12 ${k} all-three`));
seed(); api.applyUnicornLevel(99);
eq(rates('witch'), [0.65, 0.25, 0.10], 'L99 saturates to all-three');

// round-trip derive
for (let L = 1; L <= api.UNICORN_MAX_LEVEL; L++) {
  seed(); api.applyUnicornLevel(L);
  const d = api.deriveUnicornLevel();
  if (d !== L) fail(`round-trip L${L}: derived ${d}`);
}

// legacy migration: clown all-three + mirac meat-only, no level field
seed();
Object.assign(api.cookingState.vendors.clown, { meatRate: 0.65, vegetableRate: 0.25, spiceRate: 0.10, meatEnabled: true });
Object.assign(api.cookingState.vendors.miraculand, { meatRate: 1.0, vegetableRate: 0, spiceRate: 0, meatEnabled: true });
const legacyLevel = api.deriveUnicornLevel();
if (legacyLevel !== 4) fail(`legacy derive: expected 4, got ${legacyLevel}`);

if (failures) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log('OK: Unicorn Express helpers correct (levels, rates, derive round-trip, legacy migration)');
