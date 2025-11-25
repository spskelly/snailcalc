/**
 * Cooking Calculator Module
 * Handles recipe optimization, vendor calculations, and UI updates
 */

let cookingState = {
  recipes: {},      // user's recipe configurations
  vendors: {},      // vendor configurations  
  shop: {},         // shop purchase configurations
  results: [],      // calculated results
  filters: {        // recipe filters
    clown: { meat: false, veggie: false, spice: false },
    miraculand: { meat: false, veggie: false, spice: false }
  }
};

// ============== INITIALIZATION ==============

function initCookingCalculator() {
  const root = document.getElementById('cookingCalculator');
  if (!root) return;
  if (root.dataset.initialized) return;
  root.dataset.initialized = "true";

  // initialize state with defaults
  loadCookingDefaults();
  
  // build UI components
  buildVendorConfig(root);
  buildShopConfig(root);
  buildRecipeManager(root);
  buildResultsDashboard(root);
  
  // set up event listeners
  setupCookingEventListeners(root);
  
  // load saved state if exists (must be before initial sync)
  loadCookingFromStorage();
  
  // sync vendor rates with radio button selections
  updateVendorState(root);
  updateShopState(root);
  
  // initial calculation
  recalculateCooking();
}

function loadCookingDefaults() {
  // initialize recipes from defaults
  cookingState.recipes = {};
  for (const [id, recipe] of Object.entries(COOKING_RECIPES)) {
    cookingState.recipes[id] = {
      enabled: false,
      stars: recipe.defaultStars,
      price: recipe.defaultPrice
    };
  }
  
  // copy vendor defaults
  cookingState.vendors = JSON.parse(JSON.stringify(DEFAULT_VENDORS));
  
  // copy shop defaults
  cookingState.shop = JSON.parse(JSON.stringify(DEFAULT_SHOP));
}

// ============== UI BUILDERS ==============

function buildVendorConfig(root) {
  const container = root.querySelector('#cooking-vendor-config');
  if (!container) return;
  
  let html = '<div class="vendor-grid">';
  
  // clown vendor
  html += `
    <div class="vendor-card">
      <h4>Clown Vendor</h4>
      <div class="vendor-preset">
        <label style="display: block; margin-bottom: 8px;">
          <input type="radio" name="clown-preset" value="meat-only"> Meat Only (100%)
        </label>
        <label style="display: block; margin-bottom: 8px;">
          <input type="radio" name="clown-preset" value="meat-veggie"> Meat + Veggie (72% / 28%)
        </label>
        <label style="display: block; margin-bottom: 8px;">
          <input type="radio" name="clown-preset" value="all-three" checked> All 3 (65% / 25% / 10%)
        </label>
      </div>
    </div>
  `;
  
  // miraculand vendor
  html += `
    <div class="vendor-card">
      <h4>Miraculand Vendor</h4>
      <div class="vendor-preset">
        <label style="display: block; margin-bottom: 8px;">
          <input type="radio" name="mirac-preset" value="meat-only" checked> Meat Only (100%)
        </label>
        <label style="display: block; margin-bottom: 8px;">
          <input type="radio" name="mirac-preset" value="meat-veggie"> Meat + Veggie (72% / 28%)
        </label>
        <label style="display: block; margin-bottom: 8px;">
          <input type="radio" name="mirac-preset" value="all-three"> All 3 (65% / 25% / 10%)
        </label>
      </div>
    </div>
  `;
  
  html += '</div>';
  
  // supply orders per hour
  html += `
    <div class="voucher-config">
      <label>Supply Orders per Hour: 
        <input type="number" id="supply-orders-per-hour" value="30" min="1" max="999" class="small-input">
      </label>
    </div>
  `;
  
  container.innerHTML = html;
}

function buildShopConfig(root) {
  const container = root.querySelector('#cooking-shop-config');
  if (!container) return;
  
  const shop = cookingState.shop;
  
  let html = '<div class="shop-grid">';
  
  // supply deals
  html += `
    <div class="shop-item">
      <label>
        <input type="checkbox" id="shop-supply-enabled" ${shop.supplyDeals.enabled ? 'checked' : ''}>
        <strong>Supply Deals</strong>
      </label>
      <div class="shop-details">
        <label>Qty: <input type="number" id="shop-supply-qty" value="${shop.supplyDeals.quantity}" min="0" max="99" class="tiny-input"></label>
        <label>@ <span class="fixed-price">100g</span> each</label>
      </div>
      <div class="shop-result" id="shop-supply-result"></div>
    </div>
  `;
  
  // veggie purchase
  html += `
    <div class="shop-item">
      <label>
        <input type="checkbox" id="shop-veggie-enabled" ${shop.veggiePurchase.enabled ? 'checked' : ''}>
        <strong>Buy Veggies</strong>
      </label>
      <div class="shop-details">
        <label>Qty: <input type="number" id="shop-veggie-qty" value="${shop.veggiePurchase.quantity}" min="0" max="99" class="tiny-input"></label>
        <label>@ <span class="fixed-price">220g</span> each</label>
      </div>
      <div class="shop-result" id="shop-veggie-result"></div>
    </div>
  `;
  
  // spice purchase
  html += `
    <div class="shop-item">
      <label>
        <input type="checkbox" id="shop-spice-enabled" ${shop.spicePurchase.enabled ? 'checked' : ''}>
        <strong>Buy Spice</strong>
      </label>
      <div class="shop-details">
        <label>Qty: <input type="number" id="shop-spice-qty" value="${shop.spicePurchase.quantity}" min="0" max="99" class="tiny-input"></label>
        <label>@ <span class="fixed-price">360g</span> each</label>
      </div>
      <div class="shop-result" id="shop-spice-result"></div>
    </div>
  `;
  
  html += '</div>';
  container.innerHTML = html;
}

function buildRecipeManager(root) {
  const container = root.querySelector('#cooking-recipe-manager');
  if (!container) return;
  
  // separate recipes by vendor
  const clownRecipes = [];
  const miracRecipes = [];
  
  for (const id of RECIPE_ORDER) {
    const recipe = COOKING_RECIPES[id];
    const usesMirac = recipe.miracMeat > 0 || recipe.miracVeggie > 0 || recipe.miracSpice > 0;
    if (usesMirac) {
      miracRecipes.push(id);
    } else {
      clownRecipes.push(id);
    }
  }
  
  let html = '<div class="recipe-sections">';
  
  // Clown recipes section
  html += `
    <div class="recipe-section collapsed">
      <div class="recipe-section-header" onclick="this.parentElement.classList.toggle('collapsed')">
        <span class="section-toggle">▼</span>
        <h3>🤡 Clown Vendor Recipes (${clownRecipes.length})</h3>
      </div>
      <div class="recipe-section-content">
        <div class="ingredient-filters">
          <label><input type="checkbox" class="filter-ingredient" data-vendor="clown" data-ingredient="meat"> Meat</label>
          <label><input type="checkbox" class="filter-ingredient" data-vendor="clown" data-ingredient="veggie"> Veggie</label>
          <label><input type="checkbox" class="filter-ingredient" data-vendor="clown" data-ingredient="spice"> Spice</label>
        </div>
        <div class="recipe-grid clown-recipes">
          ${buildRecipeCards(clownRecipes, false)}
        </div>
      </div>
    </div>
  `;
  
  // Miraculand recipes section
  html += `
    <div class="recipe-section collapsed">
      <div class="recipe-section-header" onclick="this.parentElement.classList.toggle('collapsed')">
        <span class="section-toggle">▼</span>
        <h3>🎪 Miraculand Vendor Recipes (${miracRecipes.length})</h3>
      </div>
      <div class="recipe-section-content">
        <div class="ingredient-filters">
          <label><input type="checkbox" class="filter-ingredient" data-vendor="miraculand" data-ingredient="meat"> Meat</label>
          <label><input type="checkbox" class="filter-ingredient" data-vendor="miraculand" data-ingredient="veggie"> Veggie</label>
          <label><input type="checkbox" class="filter-ingredient" data-vendor="miraculand" data-ingredient="spice"> Spice</label>
        </div>
        <div class="recipe-grid mirac-recipes">
          ${buildRecipeCards(miracRecipes, true)}
        </div>
      </div>
    </div>
  `;
  
  html += '</div>';
  container.innerHTML = html;
}

function buildRecipeCards(recipeIds, isMirac) {
  let html = '';
  
  for (const id of recipeIds) {
    const recipe = COOKING_RECIPES[id];
    const state = cookingState.recipes[id];
    
    // build ingredient display
    let ingredients = [];
    if (recipe.clownMeat > 0) ingredients.push(`${recipe.clownMeat}M`);
    if (recipe.clownVeggie > 0) ingredients.push(`${recipe.clownVeggie}V`);
    if (recipe.clownSpice > 0) ingredients.push(`${recipe.clownSpice}S`);
    if (recipe.miracMeat > 0) ingredients.push(`${recipe.miracMeat}mM`);
    if (recipe.miracVeggie > 0) ingredients.push(`${recipe.miracVeggie}mV`);
    if (recipe.miracSpice > 0) ingredients.push(`${recipe.miracSpice}mS`);
    const ingredientStr = ingredients.join(' ');
    
    // determine which ingredients are used for filtering
    const hasMeat = isMirac ? recipe.miracMeat > 0 : recipe.clownMeat > 0;
    const hasVeggie = isMirac ? recipe.miracVeggie > 0 : recipe.clownVeggie > 0;
    const hasSpice = isMirac ? recipe.miracSpice > 0 : recipe.clownSpice > 0;
    
    html += `
      <div class="recipe-card" data-recipe-id="${id}" 
           data-has-meat="${hasMeat}" data-has-veggie="${hasVeggie}" data-has-spice="${hasSpice}">
        <div class="recipe-header">
          <label class="recipe-toggle">
            <input type="checkbox" class="recipe-enabled" data-recipe="${id}" ${state.enabled ? 'checked' : ''}>
            <span class="recipe-name">${recipe.name}</span>
          </label>
        </div>
        <div class="recipe-config">
          <div class="recipe-field">
            <label>Stars</label>
            <select class="recipe-stars" data-recipe="${id}">
              <option value="1" ${state.stars === 1 ? 'selected' : ''}>1★</option>
              <option value="2" ${state.stars === 2 ? 'selected' : ''}>2★</option>
              <option value="3" ${state.stars === 3 ? 'selected' : ''}>3★</option>
              <option value="4" ${state.stars === 4 ? 'selected' : ''}>4★</option>
            </select>
          </div>
          <div class="recipe-field">
            <label>Price</label>
            <input type="number" class="recipe-price" data-recipe="${id}" value="${state.price}" min="1">
          </div>
          <div class="recipe-ingredients">
            ${ingredientStr}
          </div>
        </div>
      </div>
    `;
  }
  
  return html;
}

function buildResultsDashboard(root) {
  const container = root.querySelector('#cooking-results');
  if (!container) return;
  
  let html = `
    <div class="results-grid">
      <div class="results-rankings">
        <h3>📊 Optimal Dish Ranking</h3>
        <div class="ranking-table-container">
          <table class="cost-table" id="cooking-ranking-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Dish</th>
                <th>g/Order</th>
                <th>g/Hour</th>
                <th>Limiting</th>
              </tr>
            </thead>
            <tbody id="cooking-ranking-body">
            </tbody>
          </table>
        </div>
        
        <div class="stew-calculator-section collapsed">
          <div class="stew-section-header" onclick="this.parentElement.classList.toggle('collapsed')">
            <span class="section-toggle">▼</span>
            <h4>🎲 Mega Stew Calculator</h4>
          </div>
          <div class="stew-section-content">
            <div id="stew-calculator"></div>
          </div>
        </div>
      </div>
      
      <div class="results-sidebar">
        <div class="results-card shop-roi-card">
          <h4>💰 Daily Shop ROI</h4>
          <div id="shop-roi-summary"></div>
        </div>
        
        <div class="results-card strategy-card">
          <h4>🎯 Strategy Summary</h4>
          <div id="strategy-summary"></div>
        </div>
        
        <div class="results-card stew-card">
          <h4>🍲 Mega Stew Values</h4>
          <div id="stew-values"></div>
        </div>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
}

// ============== EVENT LISTENERS ==============

function setupCookingEventListeners(root) {
  // vendor config changes
  root.querySelectorAll('#cooking-vendor-config input').forEach(input => {
    input.addEventListener('change', () => {
      updateVendorState(root);
      recalculateCooking();
    });
  });
  
  // checkbox to enable/disable rate inputs
  ['clown', 'mirac'].forEach(vendor => {
    ['meat', 'veggie', 'spice'].forEach(type => {
      const checkbox = root.querySelector(`#${vendor}-${type}-enabled`);
      const rateInput = root.querySelector(`#${vendor}-${type}-rate`);
      if (checkbox && rateInput) {
        checkbox.addEventListener('change', () => {
          rateInput.disabled = !checkbox.checked;
          if (!checkbox.checked) rateInput.value = 0;
        });
      }
    });
  });
  
  // shop config changes
  root.querySelectorAll('#cooking-shop-config input').forEach(input => {
    input.addEventListener('change', () => {
      updateShopState(root);
      recalculateCooking();
    });
  });
  
  // recipe changes
  root.querySelectorAll('.recipe-enabled').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const id = e.target.dataset.recipe;
      cookingState.recipes[id].enabled = e.target.checked;
      recalculateCooking();
      saveCookingToStorage();
    });
  });
  
  root.querySelectorAll('.recipe-stars').forEach(select => {
    select.addEventListener('change', (e) => {
      const id = e.target.dataset.recipe;
      cookingState.recipes[id].stars = parseInt(e.target.value);
      recalculateCooking();
      saveCookingToStorage();
    });
  });
  
  root.querySelectorAll('.recipe-price').forEach(input => {
    input.addEventListener('change', (e) => {
      const id = e.target.dataset.recipe;
      cookingState.recipes[id].price = parseInt(e.target.value) || 0;
      recalculateCooking();
      saveCookingToStorage();
    });
  });
  
  // preset buttons
  for (let i = 1; i <= 3; i++) {
    const saveBtn = root.querySelector(`#saveCookingPreset${i}`);
    const loadBtn = root.querySelector(`#loadCookingPreset${i}`);
    if (saveBtn) saveBtn.addEventListener('click', () => saveCookingPreset(i));
    if (loadBtn) loadBtn.addEventListener('click', () => loadCookingPreset(i, root));
  }
  
  // reset button
  const resetBtn = root.querySelector('#resetCooking');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      loadCookingDefaults();
      refreshCookingUI(root);
      recalculateCooking();
      saveCookingToStorage();
    });
  }
  
  // ingredient filter checkboxes
  root.querySelectorAll('.filter-ingredient').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const vendor = e.target.dataset.vendor;
      const ingredient = e.target.dataset.ingredient;
      cookingState.filters[vendor][ingredient] = e.target.checked;
      applyRecipeFilters(root, vendor);
      saveCookingToStorage();
    });
  });
}

function applyRecipeFilters(root, vendor) {
  const filters = cookingState.filters[vendor];
  const hasActiveFilters = filters.meat || filters.veggie || filters.spice;
  
  const gridClass = vendor === 'clown' ? '.clown-recipes' : '.mirac-recipes';
  const recipeCards = root.querySelectorAll(`${gridClass} .recipe-card`);
  
  recipeCards.forEach(card => {
    if (!hasActiveFilters) {
      // no filters active, show all
      card.style.display = '';
      return;
    }
    
    // check if recipe matches ALL selected filters
    const hasMeat = card.dataset.hasMeat === 'true';
    const hasVeggie = card.dataset.hasVeggie === 'true';
    const hasSpice = card.dataset.hasSpice === 'true';
    
    let matches = true;
    
    // recipe must have ALL selected ingredients
    if (filters.meat && !hasMeat) matches = false;
    if (filters.veggie && !hasVeggie) matches = false;
    if (filters.spice && !hasSpice) matches = false;
    
    // recipe must NOT have ingredients that are NOT selected
    if (!filters.meat && hasMeat) matches = false;
    if (!filters.veggie && hasVeggie) matches = false;
    if (!filters.spice && hasSpice) matches = false;
    
    card.style.display = matches ? '' : 'none';
  });
}

function updateVendorState(root) {
  // clown vendor - check which preset is selected
  const clownPreset = root.querySelector('input[name="clown-preset"]:checked')?.value || 'all-three';
  if (clownPreset === 'meat-only') {
    cookingState.vendors.clown.meatEnabled = true;
    cookingState.vendors.clown.meatRate = 1.00;
    cookingState.vendors.clown.veggieEnabled = false;
    cookingState.vendors.clown.veggieRate = 0;
    cookingState.vendors.clown.spiceEnabled = false;
    cookingState.vendors.clown.spiceRate = 0;
  } else if (clownPreset === 'meat-veggie') {
    cookingState.vendors.clown.meatEnabled = true;
    cookingState.vendors.clown.meatRate = 0.7222;
    cookingState.vendors.clown.veggieEnabled = true;
    cookingState.vendors.clown.veggieRate = 0.2778;
    cookingState.vendors.clown.spiceEnabled = false;
    cookingState.vendors.clown.spiceRate = 0;
  } else { // all-three
    cookingState.vendors.clown.meatEnabled = true;
    cookingState.vendors.clown.meatRate = 0.65;
    cookingState.vendors.clown.veggieEnabled = true;
    cookingState.vendors.clown.veggieRate = 0.25;
    cookingState.vendors.clown.spiceEnabled = true;
    cookingState.vendors.clown.spiceRate = 0.10;
  }
  cookingState.vendors.clown.preset = clownPreset;
  
  // miraculand vendor - check which preset is selected
  const miracPreset = root.querySelector('input[name="mirac-preset"]:checked')?.value || 'meat-only';
  if (miracPreset === 'meat-only') {
    cookingState.vendors.miraculand.meatEnabled = true;
    cookingState.vendors.miraculand.meatRate = 1.00;
    cookingState.vendors.miraculand.veggieEnabled = false;
    cookingState.vendors.miraculand.veggieRate = 0;
    cookingState.vendors.miraculand.spiceEnabled = false;
    cookingState.vendors.miraculand.spiceRate = 0;
  } else if (miracPreset === 'meat-veggie') {
    cookingState.vendors.miraculand.meatEnabled = true;
    cookingState.vendors.miraculand.meatRate = 0.7222;
    cookingState.vendors.miraculand.veggieEnabled = true;
    cookingState.vendors.miraculand.veggieRate = 0.2778;
    cookingState.vendors.miraculand.spiceEnabled = false;
    cookingState.vendors.miraculand.spiceRate = 0;
  } else { // all-three
    cookingState.vendors.miraculand.meatEnabled = true;
    cookingState.vendors.miraculand.meatRate = 0.65;
    cookingState.vendors.miraculand.veggieEnabled = true;
    cookingState.vendors.miraculand.veggieRate = 0.25;
    cookingState.vendors.miraculand.spiceEnabled = true;
    cookingState.vendors.miraculand.spiceRate = 0.10;
  }
  cookingState.vendors.miraculand.preset = miracPreset;
  
  // supply orders per hour
  cookingState.shop.supplyOrdersPerHour = parseInt(root.querySelector('#supply-orders-per-hour')?.value) || 30;
  
  saveCookingToStorage();
}

function updateShopState(root) {
  // supply deals - fixed price of 100g
  cookingState.shop.supplyDeals.enabled = root.querySelector('#shop-supply-enabled')?.checked ?? true;
  cookingState.shop.supplyDeals.quantity = parseInt(root.querySelector('#shop-supply-qty')?.value) || 0;
  cookingState.shop.supplyDeals.cost = 100;
  cookingState.shop.supplyDeals.supplyOrdersEach = 20;
  
  // veggie purchase - fixed price of 220g
  cookingState.shop.veggiePurchase.enabled = root.querySelector('#shop-veggie-enabled')?.checked ?? true;
  cookingState.shop.veggiePurchase.quantity = parseInt(root.querySelector('#shop-veggie-qty')?.value) || 0;
  cookingState.shop.veggiePurchase.cost = 220;
  
  // spice purchase - fixed price of 360g
  cookingState.shop.spicePurchase.enabled = root.querySelector('#shop-spice-enabled')?.checked ?? false;
  cookingState.shop.spicePurchase.quantity = parseInt(root.querySelector('#shop-spice-qty')?.value) || 0;
  cookingState.shop.spicePurchase.cost = 360;
  
  saveCookingToStorage();
}

// ============== CALCULATIONS ==============

function recalculateCooking() {
  const root = document.getElementById('cookingCalculator');
  if (!root) return;
  
  const results = [];
  const clown = cookingState.vendors.clown;
  const mirac = cookingState.vendors.miraculand;
  
  // calculate supply order costs per ingredient
  const supplyOrderCosts = {
    clownMeat: clown.meatEnabled && clown.meatRate > 0 ? 1 / clown.meatRate : Infinity,
    clownVeggie: clown.veggieEnabled && clown.veggieRate > 0 ? 1 / clown.veggieRate : Infinity,
    clownSpice: clown.spiceEnabled && clown.spiceRate > 0 ? 1 / clown.spiceRate : Infinity,
    miracMeat: mirac.meatEnabled && mirac.meatRate > 0 ? 1 / mirac.meatRate : Infinity,
    miracVeggie: mirac.veggieEnabled && mirac.veggieRate > 0 ? 1 / mirac.veggieRate : Infinity,
    miracSpice: mirac.spiceEnabled && mirac.spiceRate > 0 ? 1 / mirac.spiceRate : Infinity
  };
  
  // average gold per supply order for calculating ingredient values
  // we'll calculate this iteratively
  
  for (const [id, state] of Object.entries(cookingState.recipes)) {
    if (!state.enabled) continue;
    
    const recipe = COOKING_RECIPES[id];
    const price = state.price;
    
    // determine which vendor to use based on recipe ingredients
    const usesClown = recipe.clownMeat > 0 || recipe.clownVeggie > 0 || recipe.clownSpice > 0;
    const usesMirac = recipe.miracMeat > 0 || recipe.miracVeggie > 0 || recipe.miracSpice > 0;
    
    // calculate supply orders needed for each ingredient
    let ordersNeeded = [];
    let limitingIngredient = "None";
    
    if (usesClown) {
      if (recipe.clownMeat > 0) ordersNeeded.push({ type: 'Clown Meat', orders: recipe.clownMeat * supplyOrderCosts.clownMeat });
      if (recipe.clownVeggie > 0) ordersNeeded.push({ type: 'Clown Veggie', orders: recipe.clownVeggie * supplyOrderCosts.clownVeggie });
      if (recipe.clownSpice > 0) ordersNeeded.push({ type: 'Clown Spice', orders: recipe.clownSpice * supplyOrderCosts.clownSpice });
    }
    
    if (usesMirac) {
      if (recipe.miracMeat > 0) ordersNeeded.push({ type: 'Mirac Meat', orders: recipe.miracMeat * supplyOrderCosts.miracMeat });
      if (recipe.miracVeggie > 0) ordersNeeded.push({ type: 'Mirac Veggie', orders: recipe.miracVeggie * supplyOrderCosts.miracVeggie });
      if (recipe.miracSpice > 0) ordersNeeded.push({ type: 'Mirac Spice', orders: recipe.miracSpice * supplyOrderCosts.miracSpice });
    }
    
    // find limiting ingredient (highest supply order cost)
    let totalOrders = 0;
    for (const o of ordersNeeded) {
      if (o.orders > totalOrders) {
        totalOrders = o.orders;
        limitingIngredient = o.type;
      }
    }
    
    // skip if impossible to make
    if (totalOrders === Infinity || totalOrders === 0) continue;
    
    // calculate expected drops and byproducts for clown vendor
    let byproductValue = 0;
    if (usesClown && !usesMirac) {
      const expectedMeat = totalOrders * clown.meatRate;
      const expectedVeggie = totalOrders * clown.veggieRate;
      const expectedSpice = totalOrders * clown.spiceRate;
      
      const excessMeat = Math.max(0, expectedMeat - recipe.clownMeat);
      const excessVeggie = Math.max(0, expectedVeggie - recipe.clownVeggie);
      const excessSpice = Math.max(0, expectedSpice - recipe.clownSpice);
      
      byproductValue = 
        excessMeat * MEGA_STEW_VALUES.clownMeat +
        excessVeggie * MEGA_STEW_VALUES.clownVeggie +
        excessSpice * MEGA_STEW_VALUES.clownSpice;
    }
    
    // calculate efficiency metrics
    const totalValue = price + byproductValue;
    const goldPerOrder = totalValue / totalOrders;
    const ordersPerHour = cookingState.shop.supplyOrdersPerHour;
    const dishesPerHour = ordersPerHour / totalOrders;
    const goldPerHour = dishesPerHour * totalValue;
    
    results.push({
      id,
      name: recipe.name,
      stars: state.stars,
      price,
      orders: totalOrders,
      limiting: limitingIngredient.replace('Clown ', '').replace('Mirac ', ''),
      byproductValue,
      totalValue,
      goldPerOrder,
      goldPerHour,
      dishesPerHour,
      vendor: usesMirac ? 'Miraculand' : 'Clown'
    });
  }
  
  // sort by gold per supply order descending
  results.sort((a, b) => b.goldPerOrder - a.goldPerOrder);
  cookingState.results = results;
  
  // update UI
  updateRankingTable(root, results);
  updateShopROI(root);
  updateStrategySummary(root, results);
  updateStewValues(root);
  updateStewCalculator(root);
}

function updateRankingTable(root, results) {
  const tbody = root.querySelector('#cooking-ranking-body');
  if (!tbody) return;
  
  let html = '';
  results.forEach((r, i) => {
    const rank = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
    const vendorClass = r.vendor === 'Miraculand' ? 'mirac-row' : '';
    
    html += `
      <tr class="${vendorClass}">
        <td>${rank}</td>
        <td>${r.name} <span class="stars">${'★'.repeat(r.stars)}</span></td>
        <td><strong>${r.goldPerOrder.toFixed(2)}</strong></td>
        <td>${r.goldPerHour.toFixed(0).toLocaleString()}</td>
        <td>${r.limiting}</td>
      </tr>
    `;
  });
  
  if (results.length === 0) {
    html = '<tr><td colspan="5" style="text-align:center;">No recipes enabled</td></tr>';
  }
  
  tbody.innerHTML = html;
}

function updateShopROI(root) {
  const container = root.querySelector('#shop-roi-summary');
  if (!container) return;
  
  const shop = cookingState.shop;
  const topGoldPerOrder = cookingState.results.length > 0 ? cookingState.results[0].goldPerOrder : 50;
  
  let html = '';
  let totalCost = 0;
  let totalProfit = 0;
  
  // clear inline results first
  const supplyResult = root.querySelector('#shop-supply-result');
  const veggieResult = root.querySelector('#shop-veggie-result');
  const spiceResult = root.querySelector('#shop-spice-result');
  if (supplyResult) supplyResult.innerHTML = '';
  if (veggieResult) veggieResult.innerHTML = '';
  if (spiceResult) spiceResult.innerHTML = '';
  
  // supply deals
  if (shop.supplyDeals.enabled && shop.supplyDeals.quantity > 0) {
    const cost = shop.supplyDeals.quantity * shop.supplyDeals.cost;
    const orders = shop.supplyDeals.quantity * shop.supplyDeals.supplyOrdersEach;
    const value = orders * topGoldPerOrder;
    const profit = value - cost;
    const roi = cost > 0 ? ((value / cost - 1) * 100).toFixed(0) : 0;
    
    totalCost += cost;
    totalProfit += profit;
    
    const profitClass = profit >= 0 ? 'positive' : 'negative';
    html += `
      <div class="roi-item">
        <div class="roi-name">Supply Deals (×${shop.supplyDeals.quantity})</div>
        <div class="roi-details">
          <span>Cost: ${cost.toLocaleString()}g</span>
          <span>Value: ${value.toFixed(0).toLocaleString()}g</span>
        </div>
        <div class="roi-result ${profitClass}">
          ${profit >= 0 ? '+' : ''}${profit.toFixed(0).toLocaleString()}g (${roi}% ROI)
        </div>
      </div>
    `;
    
    // update inline result
    if (supplyResult) supplyResult.innerHTML = `<span class="${profitClass}">${profit >= 0 ? '+' : ''}${profit.toFixed(0).toLocaleString()}g (${roi}%)</span>`;
  }
  
  // veggie purchase - value based on supply order savings
  if (shop.veggiePurchase.enabled && shop.veggiePurchase.quantity > 0) {
    const cost = shop.veggiePurchase.quantity * shop.veggiePurchase.cost;
    const orderCost = cookingState.vendors.clown.veggieRate > 0 ? 1 / cookingState.vendors.clown.veggieRate : 4;
    const value = shop.veggiePurchase.quantity * orderCost * topGoldPerOrder;
    const profit = value - cost;
    const roi = cost > 0 ? ((value / cost - 1) * 100).toFixed(0) : 0;
    
    totalCost += cost;
    totalProfit += profit;
    
    const profitClass = profit >= 0 ? 'positive' : 'negative';
    html += `
      <div class="roi-item">
        <div class="roi-name">Veggies (×${shop.veggiePurchase.quantity})</div>
        <div class="roi-details">
          <span>Cost: ${cost.toLocaleString()}g</span>
          <span>Value: ${value.toFixed(0).toLocaleString()}g</span>
        </div>
        <div class="roi-result ${profitClass}">
          ${profit >= 0 ? '+' : ''}${profit.toFixed(0).toLocaleString()}g (${roi}% ROI)
        </div>
      </div>
    `;
    
    if (veggieResult) veggieResult.innerHTML = `<span class="${profitClass}">${profit >= 0 ? '+' : ''}${profit.toFixed(0).toLocaleString()}g (${roi}%)</span>`;
  }
  
  // spice purchase - value based on mega stew
  if (shop.spicePurchase.enabled && shop.spicePurchase.quantity > 0) {
    const cost = shop.spicePurchase.quantity * shop.spicePurchase.cost;
    const value = shop.spicePurchase.quantity * MEGA_STEW_VALUES.clownSpice;
    const profit = value - cost;
    const roi = cost > 0 ? ((value / cost - 1) * 100).toFixed(0) : 0;
    
    totalCost += cost;
    totalProfit += profit;
    
    const profitClass = profit >= 0 ? 'positive' : 'negative';
    html += `
      <div class="roi-item">
        <div class="roi-name">Spice (×${shop.spicePurchase.quantity})</div>
        <div class="roi-details">
          <span>Cost: ${cost.toLocaleString()}g</span>
          <span>Value: ${value.toFixed(0).toLocaleString()}g</span>
        </div>
        <div class="roi-result ${profitClass}">
          ${profit >= 0 ? '+' : ''}${profit.toFixed(0).toLocaleString()}g (${roi}% ROI)
        </div>
      </div>
    `;
    
    if (spiceResult) spiceResult.innerHTML = `<span class="${profitClass}">${profit >= 0 ? '+' : ''}${profit.toFixed(0).toLocaleString()}g (${roi}%)</span>`;
  }
  
  // total
  if (totalCost > 0) {
    const totalROI = ((totalProfit / totalCost) * 100).toFixed(0);
    const profitClass = totalProfit >= 0 ? 'positive' : 'negative';
    html += `
      <div class="roi-total">
        <strong>Total:</strong> ${totalCost.toLocaleString()}g → 
        <span class="${profitClass}">${totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(0).toLocaleString()}g (${totalROI}% ROI)</span>
      </div>
    `;
  }
  
  container.innerHTML = html || '<div class="roi-empty">No shop purchases enabled</div>';
}

function updateStrategySummary(root, results) {
  const container = root.querySelector('#strategy-summary');
  if (!container) return;
  
  if (results.length === 0) {
    container.innerHTML = '<div class="strategy-empty">Enable recipes to see strategy</div>';
    return;
  }
  
  const best = results[0];
  const ordersPerHour = cookingState.shop.supplyOrdersPerHour;
  
  // find best meat-only dish for excess meat
  const meatOnlyDishes = results.filter(r => {
    const recipe = COOKING_RECIPES[r.id];
    return recipe.clownVeggie === 0 && recipe.clownSpice === 0 && recipe.clownMeat > 0;
  });
  const bestMeatDish = meatOnlyDishes.length > 0 ? meatOnlyDishes[0] : null;
  
  let html = `
    <div class="strategy-item best">
      <div class="strategy-label">Best Dish</div>
      <div class="strategy-value">${best.name}</div>
      <div class="strategy-detail">${best.goldPerOrder.toFixed(1)} g/order</div>
    </div>
    <div class="strategy-item">
      <div class="strategy-label">Expected Income</div>
      <div class="strategy-value">${best.goldPerHour.toFixed(0).toLocaleString()} g/hour</div>
      <div class="strategy-detail">@ ${ordersPerHour} orders/hour</div>
    </div>
  `;
  
  if (bestMeatDish && best.limiting.includes('Veggie')) {
    html += `
      <div class="strategy-item">
        <div class="strategy-label">Excess Meat →</div>
        <div class="strategy-value">${bestMeatDish.name}</div>
        <div class="strategy-detail">${bestMeatDish.goldPerOrder.toFixed(1)} g/order</div>
      </div>
    `;
  }
  
  html += `
    <div class="strategy-item">
      <div class="strategy-label">Excess Spice →</div>
      <div class="strategy-value">Mega Stew</div>
      <div class="strategy-detail">${MEGA_STEW_VALUES.clownSpice.toFixed(0)} g/spice</div>
    </div>
  `;
  
  container.innerHTML = html;
}

function updateStewValues(root) {
  const container = root.querySelector('#stew-values');
  if (!container) return;
  
  container.innerHTML = `
    <div style="margin-bottom: 15px;">
      <h5 style="margin: 0 0 10px 0; color: #1565c0; font-size: 0.95em;">🤡 Clown Vendor</h5>
      <div class="stew-grid">
        <div class="stew-item">
          <span class="stew-label">Meat</span>
          <span class="stew-value">${MEGA_STEW_VALUES.clownMeat.toFixed(2)} g</span>
        </div>
        <div class="stew-item">
          <span class="stew-label">Veggie</span>
          <span class="stew-value">${MEGA_STEW_VALUES.clownVeggie.toFixed(2)} g</span>
        </div>
        <div class="stew-item">
          <span class="stew-label">Spice</span>
          <span class="stew-value">${MEGA_STEW_VALUES.clownSpice.toFixed(2)} g</span>
        </div>
      </div>
    </div>
    
    <div>
      <h5 style="margin: 0 0 10px 0; color: #7b1fa2; font-size: 0.95em;">🎪 Miraculand Vendor</h5>
      <div class="stew-grid">
        <div class="stew-item">
          <span class="stew-label">Meat</span>
          <span class="stew-value">${MEGA_STEW_VALUES.miracMeat.toFixed(2)} g</span>
        </div>
        <div class="stew-item">
          <span class="stew-label">Veggie</span>
          <span class="stew-value">${MEGA_STEW_VALUES.miracVeggie.toFixed(2)} g</span>
        </div>
        <div class="stew-item">
          <span class="stew-label">Spice</span>
          <span class="stew-value">${MEGA_STEW_VALUES.miracSpice.toFixed(2)} g</span>
        </div>
      </div>
    </div>
  `;
}

// Mega Stew Simulator State
let stewSimulationResults = [];
let stewChart = null;

// Ingredient ranges for mega stew
const INGREDIENT_RANGES = {
  clownMeat: { min: 10, max: 48, mid: 29.00 },
  clownVeggie: { min: 29, max: 144, mid: 86.50 },
  clownSpice: { min: 72, max: 240, mid: 156.00 },
  miracMeat: { min: 12, max: 60, mid: 36.00 },
  miracVeggie: { min: 36, max: 180, mid: 108 },
  miracSpice: { min: 0, max: 0, mid: 0 }
};

function updateStewCalculator(root) {
  const container = root.querySelector('#stew-calculator');
  if (!container) return;
  
  container.innerHTML = `
    <div class="stew-simulator">
      <div class="info-blurb" style="margin-bottom: 15px; font-size: 0.95em;">
        Enter ingredient quantities to simulate mega stew outcomes. Requires at least 100 ingredients.
      </div>
      
      <!-- Ingredient Input Grid -->
      <div class="ingredient-grid">
        <div class="ingredient-card clown">
          <h4>🥩 Clown Meat</h4>
          <div class="vendor-label">Clown Vendor</div>
          <input type="number" id="sim-clown-meat" value="0" min="0" max="9999" class="stew-sim-input">
          <div class="ingredient-stats">
            <div class="range">10 - 48 gold/ea</div>
            <div>Expected: 29.00</div>
          </div>
        </div>
        
        <div class="ingredient-card clown">
          <h4>🥬 Clown Veggie</h4>
          <div class="vendor-label">Clown Vendor</div>
          <input type="number" id="sim-clown-veggie" value="0" min="0" max="9999" class="stew-sim-input">
          <div class="ingredient-stats">
            <div class="range">29 - 144 gold/ea</div>
            <div>Expected: 86.50</div>
          </div>
        </div>
        
        <div class="ingredient-card clown">
          <h4>🌶️ Clown Spice</h4>
          <div class="vendor-label">Clown Vendor</div>
          <input type="number" id="sim-clown-spice" value="0" min="0" max="9999" class="stew-sim-input">
          <div class="ingredient-stats">
            <div class="range">72 - 240 gold/ea</div>
            <div>Expected: 156.00</div>
          </div>
        </div>
        
        <div class="ingredient-card mirac">
          <h4>🥩 Mirac Meat</h4>
          <div class="vendor-label">Miraculand Vendor</div>
          <input type="number" id="sim-mirac-meat" value="0" min="0" max="9999" class="stew-sim-input">
          <div class="ingredient-stats">
            <div class="range">12 - 60 gold/ea</div>
            <div>Expected: 36.00</div>
          </div>
        </div>
        
        <div class="ingredient-card mirac">
          <h4>🥬 Mirac Veggie</h4>
          <div class="vendor-label">Miraculand Vendor</div>
          <input type="number" id="sim-mirac-veggie" value="0" min="0" max="9999" class="stew-sim-input">
          <div class="ingredient-stats">
            <div class="range">36 - 180 gold/ea</div>
            <div>Expected: 108.00</div>
          </div>
        </div>
      </div>
      
      <!-- Total Count -->
      <div class="total-count" id="stew-total-count">
        Total Ingredients: <strong>0</strong> (minimum 100 required)
      </div>
      
      <!-- Warning -->
      <div class="warning" id="stew-min-warning">
        ⚠️ Mega Stew requires at least 100 ingredients!
      </div>
      
      <!-- Range Results -->
      <div class="stew-results-container">
        <div class="stew-results-card">
          <h4>📊 Expected Range</h4>
          <div class="range-display">
            <div class="range-value min">
              <div class="label">Minimum</div>
              <div class="value" id="stew-range-min">0</div>
            </div>
            <div class="range-bar"></div>
            <div class="range-value max">
              <div class="label">Maximum</div>
              <div class="value" id="stew-range-max">0</div>
            </div>
          </div>
          <div style="text-align: center; margin-top: 15px;">
            <div class="range-value mid">
              <div class="label">Expected Value</div>
              <div class="value" id="stew-range-mid">0</div>
            </div>
          </div>
        </div>
        
        <div class="stew-results-card">
          <h4>📈 Value Per Ingredient</h4>
          <div style="text-align: center; padding: 20px 10px;">
            <div style="font-size: 0.85em; color: #666; margin-bottom: 5px;">AVERAGE</div>
            <div style="font-size: 1.8em; font-weight: bold; color: #1565c0;" id="stew-per-ingredient">0.00</div>
            <div style="font-size: 0.85em; color: #666;">gold per ingredient</div>
          </div>
        </div>
      </div>
      
      <!-- Simulate Button -->
      <button class="simulate-btn" id="stew-simulate-btn" disabled>
        🎲 Run 10,000 Simulations
      </button>
      
      <!-- Simulation Stats -->
      <div class="stats-grid" id="stew-sim-stats" style="display: none;">
        <div class="stat-card green">
          <div class="stat-value" id="stew-sim-min">-</div>
          <div class="stat-label">Sim Minimum</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-value" id="stew-sim-mean">-</div>
          <div class="stat-label">Sim Mean</div>
        </div>
        <div class="stat-card red">
          <div class="stat-value" id="stew-sim-max">-</div>
          <div class="stat-label">Sim Maximum</div>
        </div>
      </div>
      
      <!-- Chart -->
      <div class="chart-container" id="stew-chart-container" style="display: none;">
        <canvas id="stewDistributionChart"></canvas>
      </div>
    </div>
  `;
  
  // Set up event listeners for inputs
  const inputs = ['sim-clown-meat', 'sim-clown-veggie', 'sim-clown-spice', 'sim-mirac-meat','sim-mirac-veggie'];
  inputs.forEach(id => {
    const input = container.querySelector(`#${id}`);
    if (input) {
      input.addEventListener('input', () => calculateStewRanges(root));
    }
  });
  
  // Simulate button
  const simBtn = container.querySelector('#stew-simulate-btn');
  if (simBtn) {
    simBtn.addEventListener('click', () => runStewSimulation(root));
  }
  
  // Initial calculation
  calculateStewRanges(root);
}

function calculateStewRanges(root) {
  const container = root.querySelector('#stew-calculator');
  if (!container) return;
  
  const quantities = {
    clownMeat: parseInt(container.querySelector('#sim-clown-meat')?.value) || 0,
    clownVeggie: parseInt(container.querySelector('#sim-clown-veggie')?.value) || 0,
    clownSpice: parseInt(container.querySelector('#sim-clown-spice')?.value) || 0,
    miracMeat: parseInt(container.querySelector('#sim-mirac-meat')?.value) || 0,
    miracVeggie: parseInt(container.querySelector('#sim-mirac-veggie')?.value) || 0
  };
  
  const totalQty = Object.values(quantities).reduce((a, b) => a + b, 0);
  
  let totalMin = 0, totalMax = 0, totalMid = 0;
  
  for (const [key, qty] of Object.entries(quantities)) {
    const range = INGREDIENT_RANGES[key];
    totalMin += qty * range.min;
    totalMax += qty * range.max;
    totalMid += qty * range.mid;
  }
  
  // Update display
  const totalCountEl = container.querySelector('#stew-total-count');
  const minWarning = container.querySelector('#stew-min-warning');
  const simulateBtn = container.querySelector('#stew-simulate-btn');
  const rangeMin = container.querySelector('#stew-range-min');
  const rangeMax = container.querySelector('#stew-range-max');
  const rangeMid = container.querySelector('#stew-range-mid');
  const perIngredient = container.querySelector('#stew-per-ingredient');
  
  if (totalCountEl) {
    totalCountEl.innerHTML = `Total Ingredients: <strong>${totalQty.toLocaleString()}</strong> ${totalQty < 100 ? '(minimum 100 required)' : ''}`;
  }
  
  if (totalQty < 100) {
    if (minWarning) minWarning.style.display = 'block';
    if (simulateBtn) simulateBtn.disabled = true;
    if (rangeMin) rangeMin.textContent = '-';
    if (rangeMax) rangeMax.textContent = '-';
    if (rangeMid) rangeMid.textContent = '-';
    if (perIngredient) perIngredient.textContent = '-';
  } else {
    if (minWarning) minWarning.style.display = 'none';
    if (simulateBtn) simulateBtn.disabled = false;
    if (rangeMin) rangeMin.textContent = totalMin.toLocaleString();
    if (rangeMax) rangeMax.textContent = totalMax.toLocaleString();
    if (rangeMid) rangeMid.textContent = Math.round(totalMid).toLocaleString();
    if (perIngredient) perIngredient.textContent = (totalMid / totalQty).toFixed(2);
  }
  
  return { quantities, totalQty, totalMin, totalMax, totalMid };
}

function simulateStew(quantities) {
  let totalMin = 0, totalMax = 0;
  
  for (const [key, qty] of Object.entries(quantities)) {
    if (qty === 0) continue;
    const range = INGREDIENT_RANGES[key];
    totalMin += qty * range.min;
    totalMax += qty * range.max;
  }
  
  const mean = (totalMin + totalMax) / 2;
  const stdDev = (totalMax - totalMin) / 6;
  
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  
  const result = mean + z * stdDev;
  
  // Clamp to min/max boundaries
  return Math.round(Math.max(totalMin, Math.min(totalMax, result)));
}

async function runStewSimulation(root) {
  const container = root.querySelector('#stew-calculator');
  if (!container) return;
  
  const result = calculateStewRanges(root);
  if (!result || result.totalQty < 100) return;
  
  const { quantities } = result;
  const simulateBtn = container.querySelector('#stew-simulate-btn');
  
  if (simulateBtn) {
    simulateBtn.disabled = true;
    simulateBtn.textContent = '⏳ Simulating...';
  }
  
  await new Promise(r => setTimeout(r, 50));
  
  stewSimulationResults = [];
  const numSims = 10000;
  
  for (let i = 0; i < numSims; i++) {
    stewSimulationResults.push(simulateStew(quantities));
    
    if (i % 1000 === 0) {
      await new Promise(r => setTimeout(r, 1));
    }
  }
  
  // Calculate stats
  const sorted = [...stewSimulationResults].sort((a, b) => a - b);
  const sum = stewSimulationResults.reduce((a, b) => a + b, 0);
  const mean = sum / numSims;
  
  // Update stats display
  container.querySelector('#stew-sim-min').textContent = sorted[0].toLocaleString();
  container.querySelector('#stew-sim-mean').textContent = Math.round(mean).toLocaleString();
  container.querySelector('#stew-sim-max').textContent = sorted[numSims - 1].toLocaleString();
  
  const simStats = container.querySelector('#stew-sim-stats');
  const chartContainer = container.querySelector('#stew-chart-container');
  
  if (simStats) simStats.style.display = 'grid';
  if (chartContainer) chartContainer.style.display = 'block';
  
  // Build histogram
  updateStewChart(container, sorted, mean);
  
  if (simulateBtn) {
    simulateBtn.disabled = false;
    simulateBtn.textContent = '🎲 Run 10,000 Simulations';
  }
}

function updateStewChart(container, sorted, mean) {
  const canvas = container.querySelector('#stewDistributionChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  if (stewChart) {
    stewChart.destroy();
  }
  
  // Create histogram bins
  const binCount = 50;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const binSize = (max - min) / binCount;
  const bins = Array(binCount).fill(0);
  const binLabels = [];
  
  for (let i = 0; i < binCount; i++) {
    binLabels.push(Math.round(min + i * binSize));
  }
  
  for (const value of sorted) {
    const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
    bins[binIndex]++;
  }
  
  stewChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: binLabels,
      datasets: [{
        label: 'Simulation Results',
        data: bins,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Distribution of Mega Stew Outcomes',
          font: { size: 16, weight: 'bold' }
        },
        legend: { display: true, position: 'top' },
        tooltip: {
          callbacks: {
            afterLabel: function(context) {
              const total = bins.reduce((a, b) => a + b, 0);
              const percent = ((context.parsed.y / total) * 100).toFixed(1);
              return `${percent}% of outcomes`;
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Gold Received', font: { size: 12, weight: 'bold' } }
        },
        y: {
          title: { display: true, text: 'Frequency', font: { size: 12, weight: 'bold' } },
          beginAtZero: true
        }
      }
    }
  });
}

function checkStewPercentile(root) {
  const container = root.querySelector('#stew-calculator');
  if (!container) return;
  
  const input = parseInt(container.querySelector('#stew-percentile-input')?.value);
  const resultEl = container.querySelector('#stew-percentile-result');
  
  if (!resultEl) return;
  
  if (isNaN(input) || stewSimulationResults.length === 0) {
    resultEl.textContent = '';
    return;
  }
  
  const belowCount = stewSimulationResults.filter(x => x <= input).length;
  const luckier = stewSimulationResults.filter(x => x > input).length / stewSimulationResults.length * 100;
  
  if (luckier > 50) {
    resultEl.innerHTML = `Getting <strong>${input.toLocaleString()}</strong> gold is luckier than <strong>${luckier.toFixed(1)}%</strong> of outcomes! 🍀`;
  } else {
    resultEl.innerHTML = `Getting <strong>${input.toLocaleString()}</strong> gold is unluckier than <strong>${(100 - luckier).toFixed(1)}%</strong> of outcomes 😢`;
  }
}

// ============== STORAGE ==============

function saveCookingToStorage() {
  try {
    localStorage.setItem('cookingState', JSON.stringify(cookingState));
  } catch (e) {
    console.warn('Could not save cooking state:', e);
  }
}

function loadCookingFromStorage() {
  try {
    const saved = localStorage.getItem('cookingState');
    if (saved) {
      const parsed = JSON.parse(saved);
      // merge with defaults to handle new recipes
      if (parsed.recipes) {
        for (const [id, state] of Object.entries(parsed.recipes)) {
          if (cookingState.recipes[id]) {
            cookingState.recipes[id] = { ...cookingState.recipes[id], ...state };
          }
        }
      }
      if (parsed.vendors) {
        cookingState.vendors = { ...cookingState.vendors, ...parsed.vendors };
      }
      if (parsed.shop) {
        cookingState.shop = { ...cookingState.shop, ...parsed.shop };
      }
      
      const root = document.getElementById('cookingCalculator');
      if (root) {
        refreshCookingUI(root);
        recalculateCooking();
      }
    }
  } catch (e) {
    console.warn('Could not load cooking state:', e);
  }
}

function refreshCookingUI(root) {
  // refresh vendor UI - set radio buttons based on saved preset
  const clownPreset = cookingState.vendors.clown.preset || 'all-three';
  const clownRadio = root.querySelector(`input[name="clown-preset"][value="${clownPreset}"]`);
  if (clownRadio) clownRadio.checked = true;
  
  const miracPreset = cookingState.vendors.miraculand.preset || 'meat-only';
  const miracRadio = root.querySelector(`input[name="mirac-preset"][value="${miracPreset}"]`);
  if (miracRadio) miracRadio.checked = true;
  
  root.querySelector('#supply-orders-per-hour').value = cookingState.shop.supplyOrdersPerHour;
  
  // refresh shop UI
  const shop = cookingState.shop;
  root.querySelector('#shop-supply-enabled').checked = shop.supplyDeals.enabled;
  root.querySelector('#shop-supply-qty').value = shop.supplyDeals.quantity;
  
  root.querySelector('#shop-veggie-enabled').checked = shop.veggiePurchase.enabled;
  root.querySelector('#shop-veggie-qty').value = shop.veggiePurchase.quantity;
  
  root.querySelector('#shop-spice-enabled').checked = shop.spicePurchase.enabled;
  root.querySelector('#shop-spice-qty').value = shop.spicePurchase.quantity;
  
  // refresh recipe UI
  for (const [id, state] of Object.entries(cookingState.recipes)) {
    const enabledBox = root.querySelector(`.recipe-enabled[data-recipe="${id}"]`);
    const starsSelect = root.querySelector(`.recipe-stars[data-recipe="${id}"]`);
    const priceInput = root.querySelector(`.recipe-price[data-recipe="${id}"]`);
    
    if (enabledBox) enabledBox.checked = state.enabled;
    if (starsSelect) starsSelect.value = state.stars;
    if (priceInput) priceInput.value = state.price;
  }
}

function saveCookingPreset(num) {
  try {
    localStorage.setItem(`cookingPreset${num}`, JSON.stringify(cookingState));
    alert(`Cooking Preset ${num} saved!`);
  } catch (e) {
    console.warn('Could not save preset:', e);
  }
}

function loadCookingPreset(num, root) {
  try {
    const saved = localStorage.getItem(`cookingPreset${num}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      cookingState = parsed;
      refreshCookingUI(root);
      recalculateCooking();
      saveCookingToStorage();
    } else {
      alert(`Cooking Preset ${num} is empty.`);
    }
  } catch (e) {
    console.warn('Could not load preset:', e);
  }
}

// Export for module use
if (typeof window !== 'undefined') {
  window.initCookingCalculator = initCookingCalculator;
}
