/**
 * Cooking Calculator Module
 * Handles recipe optimization, vendor calculations, and UI updates
 */

let cookingState = {
  recipes: {},      // user's recipe configurations
  vendors: {},      // vendor configurations  
  shop: {},         // shop purchase configurations
  results: [],      // calculated results
  currentIngredients: {  // current ingredient inventory
    clownMeat: 0,
    clownVegetable: 0,
    clownSpice: 0,
    miracMeat: 0,
    miracVegetable: 0,
    miracSpice: 0,
    beastMeat: 0,
    beastVegetable: 0,
    beastSpice: 0,
    witchMeat: 0,
    witchVegetable: 0,
    witchSpice: 0
  },
  dailySummaryVendor: 'clown'  // user-selected vendor for daily summary
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
  buildDailySummary(root);
  buildVendorConfig(root);
  buildShopConfig(root);
  buildRecipeManager(root);
  buildResultsDashboard(root);
  buildBatchPlanner(root);

  // set up event listeners
  setupCookingEventListeners(root);
  setupBatchPlannerListeners(root);
  
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

function buildDailySummary(root) {
  const container = root.querySelector('#cooking-daily-summary');
  if (!container) return;
  
  container.innerHTML = `
    <div class="daily-summary-card">
      <div class="daily-summary-header">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h3 style="margin: 0;">💰 Daily Income Summary</h3>
          <div class="vendor-toggle" style="display: flex; gap: 10px; background: var(--bg-alt); padding: 6px 10px; border-radius: 6px;">
            <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 0.9em;">
              <input type="radio" name="daily-vendor-select" value="clown" checked>
              🤡 Clown
            </label>
            <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 0.9em;">
              <input type="radio" name="daily-vendor-select" value="miraculand">
              🌴 Miraculand
            </label>
            <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 0.9em;">
              <input type="radio" name="daily-vendor-select" value="beast">
              👹 Orc
            </label>
            <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 0.9em;">
              <input type="radio" name="daily-vendor-select" value="witch">
              🧙 Witch
            </label>
          </div>
        </div>
        <span class="daily-summary-subtitle">Based on 24 hours of passive supply order generation</span>
      </div>
      <div class="daily-summary-content">
        <div class="daily-summary-loading">Configure recipes below to see daily projections</div>
      </div>
    </div>
  `;
}

function updateDailySummary(root) {
  const container = root.querySelector('#cooking-daily-summary .daily-summary-content');
  if (!container) return;
  
  const shop = cookingState.shop;
  const results = cookingState.results;
  const clown = cookingState.vendors.clown;
  const mirac = cookingState.vendors.miraculand;
  const beast = cookingState.vendors.beast;
  const witch = cookingState.vendors.witch;

  // Check if we have any enabled recipes
  if (results.length === 0) {
    container.innerHTML = `
      <div class="daily-summary-loading">
        <span style="color: #666;">Enable recipes and set prices to see daily income projections</span>
      </div>
    `;
    return;
  }
  
  // Calculate daily supply orders
  const baseOrdersPerDay = shop.supplyOrdersPerHour * 24;
  const bonusOrders = shop.supplyDeals.enabled ? shop.supplyDeals.quantity * shop.supplyDeals.supplyOrdersEach : 0;
  const totalDailyOrders = baseOrdersPerDay + bonusOrders;
  
  // Use user-selected vendor from toggle
  const selectedVendor = cookingState.dailySummaryVendor; // 'clown', 'miraculand', 'beast', or 'witch'
  const usesClown = selectedVendor === 'clown';
  const usesMirac = selectedVendor === 'miraculand';
  const usesBeast = selectedVendor === 'beast';
  const usesWitch = selectedVendor === 'witch';
  
  // Shop costs - only include vendor-agnostic items and items matching selected vendor
  let shopCosts = 0;
  // Always include vendor-agnostic items
  if (shop.supplyDeals.enabled && shop.supplyDeals.quantity > 0) {
    shopCosts += shop.supplyDeals.quantity * shop.supplyDeals.cost;
  }
  if (shop.skillBooks.enabled && shop.skillBooks.quantity > 0) {
    shopCosts += shop.skillBooks.quantity * shop.skillBooks.cost;
  }
  // Only include shop items matching the selected vendor
  if (usesClown) {
    if (shop.vegetablePurchase.enabled && shop.vegetablePurchase.quantity > 0) {
      shopCosts += shop.vegetablePurchase.quantity * shop.vegetablePurchase.cost;
    }
    if (shop.spicePurchase.enabled && shop.spicePurchase.quantity > 0) {
      shopCosts += shop.spicePurchase.quantity * shop.spicePurchase.cost;
    }
  } else if (usesMirac) {
    if (shop.miracVegetablePurchase.enabled && shop.miracVegetablePurchase.quantity > 0) {
      shopCosts += shop.miracVegetablePurchase.quantity * shop.miracVegetablePurchase.cost;
    }
    if (shop.miracSpicePurchase.enabled && shop.miracSpicePurchase.quantity > 0) {
      shopCosts += shop.miracSpicePurchase.quantity * shop.miracSpicePurchase.cost;
    }
  } else if (usesWitch) {
    if (shop.witchVegetablePurchase.enabled && shop.witchVegetablePurchase.quantity > 0) {
      shopCosts += shop.witchVegetablePurchase.quantity * shop.witchVegetablePurchase.cost;
    }
    if (shop.witchSpicePurchase.enabled && shop.witchSpicePurchase.quantity > 0) {
      shopCosts += shop.witchSpicePurchase.quantity * shop.witchSpicePurchase.cost;
    }
  }
  
  // === STEP 1: Calculate total daily ingredients from vendor ===
  let dailyIngredients = {
    clownMeat: 0,
    clownVegetable: 0,
    clownSpice: 0,
    miracMeat: 0,
    miracVegetable: 0,
    miracSpice: 0,
    beastMeat: 0,
    beastVegetable: 0,
    beastSpice: 0,
    witchMeat: 0,
    witchVegetable: 0,
    witchSpice: 0
  };
  
  // Generate ingredients from all supply orders based on selected vendor
  if (usesClown) {
    dailyIngredients.clownMeat = totalDailyOrders * clown.meatRate;
    dailyIngredients.clownVegetable = totalDailyOrders * clown.vegetableRate;
    dailyIngredients.clownSpice = totalDailyOrders * clown.spiceRate;
    
    // Add shop-purchased ingredients for Clown vendor only
    if (shop.vegetablePurchase.enabled) {
      dailyIngredients.clownVegetable += shop.vegetablePurchase.quantity;
    }
    if (shop.spicePurchase.enabled) {
      dailyIngredients.clownSpice += shop.spicePurchase.quantity;
    }
  } else if (usesMirac) {
    dailyIngredients.miracMeat = totalDailyOrders * mirac.meatRate;
    dailyIngredients.miracVegetable = totalDailyOrders * mirac.vegetableRate;
    dailyIngredients.miracSpice = totalDailyOrders * mirac.spiceRate;
    
    // Add shop-purchased ingredients for Miraculand vendor only
    if (shop.miracVegetablePurchase.enabled) {
      dailyIngredients.miracVegetable += shop.miracVegetablePurchase.quantity;
    }
    if (shop.miracSpicePurchase.enabled) {
      dailyIngredients.miracSpice += shop.miracSpicePurchase.quantity;
    }
  } else if (usesBeast) {
    dailyIngredients.beastMeat = totalDailyOrders * beast.meatRate;
    dailyIngredients.beastVegetable = totalDailyOrders * beast.vegetableRate;
    dailyIngredients.beastSpice = totalDailyOrders * beast.spiceRate;

    if (shop.beastVegetablePurchase.enabled) {
      dailyIngredients.beastVegetable += shop.beastVegetablePurchase.quantity;
    }
    if (shop.beastSpicePurchase.enabled) {
      dailyIngredients.beastSpice += shop.beastSpicePurchase.quantity;
    }
  } else if (usesWitch) {
    dailyIngredients.witchMeat = totalDailyOrders * witch.meatRate;
    dailyIngredients.witchVegetable = totalDailyOrders * witch.vegetableRate;
    dailyIngredients.witchSpice = totalDailyOrders * witch.spiceRate;

    if (shop.witchVegetablePurchase.enabled) {
      dailyIngredients.witchVegetable += shop.witchVegetablePurchase.quantity;
    }
    if (shop.witchSpicePurchase.enabled) {
      dailyIngredients.witchSpice += shop.witchSpicePurchase.quantity;
    }
  }
  
  // === STEP 2: Use shared phase-based sequencing algorithm ===
  // Build list of all enabled dishes with their recipes
  const availableDishes = results.map(r => ({
    id: r.id,
    name: r.name,
    recipe: COOKING_RECIPES[r.id],
    state: cookingState.recipes[r.id],
    goldPerOrder: r.goldPerOrder
  }));
  
  // Call shared function to calculate optimal sequence
  const sequenceResult = calculatePhaseBasedSequence(dailyIngredients, availableDishes);
  const productionSteps = sequenceResult.sequence;
  const remaining = sequenceResult.remaining;
  const totalRemaining = sequenceResult.totalRemaining;
  const totalGold = sequenceResult.totalGold;
  const stewValue = sequenceResult.stewValue;
  
  // === STEP 5: Calculate totals ===
  const netDailyProfit = totalGold + stewValue - shopCosts;
  const profitClass = netDailyProfit >= 0 ? 'positive' : 'negative';
  
  // === BUILD HTML ===
  // Format ingredient display helper
  const formatIngredient = (val) => Math.round(val).toLocaleString();
  
  let html = `
    <div class="daily-summary-grid">
      <!-- Daily Ingredients Generated -->
      <div class="daily-summary-section">
        <div class="daily-summary-section-title">📦 Daily Ingredients (24hr)</div>
        <div class="daily-summary-row">
          <span>Supply Orders</span>
          <span class="daily-value">${totalDailyOrders.toLocaleString()}</span>
        </div>
        <div style="margin: 10px 0; padding: 10px; background: var(--bg-alt); border-radius: 6px; font-size: 0.9em;">
          ${usesClown ? `
            <div style="margin-bottom: 6px;"><strong>🤡 Clown Vendor:</strong></div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-left: 8px;">
              <span>🥩: ${formatIngredient(totalDailyOrders * clown.meatRate)}</span>
              ${clown.vegetableRate > 0 ? `<span>🥬: ${formatIngredient(totalDailyOrders * clown.vegetableRate)}</span>` : ''}
              ${clown.spiceRate > 0 ? `<span>🌶️: ${formatIngredient(totalDailyOrders * clown.spiceRate)}</span>` : ''}
            </div>
          ` : ''}
          ${usesMirac ? `
            <div style="margin-bottom: 6px;"><strong>🌴 Miraculand Vendor:</strong></div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-left: 8px;">
              <span>🥩: ${formatIngredient(totalDailyOrders * mirac.meatRate)}</span>
              ${mirac.vegetableRate > 0 ? `<span>🥬: ${formatIngredient(totalDailyOrders * mirac.vegetableRate)}</span>` : ''}
              ${mirac.spiceRate > 0 ? `<span>🌶️: ${formatIngredient(totalDailyOrders * mirac.spiceRate)}</span>` : ''}
            </div>
          ` : ''}
          ${usesBeast ? `
            <div style="margin-bottom: 6px;"><strong>👹 Orc Hunter's Tribe:</strong></div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-left: 8px;">
              <span>🥩: ${formatIngredient(totalDailyOrders * beast.meatRate)}</span>
              ${beast.vegetableRate > 0 ? `<span>🥬: ${formatIngredient(totalDailyOrders * beast.vegetableRate)}</span>` : ''}
              ${beast.spiceRate > 0 ? `<span>🌶️: ${formatIngredient(totalDailyOrders * beast.spiceRate)}</span>` : ''}
            </div>
          ` : ''}
          ${usesWitch ? `
            <div style="margin-bottom: 6px;"><strong>🧙 Witch Alchemy Store:</strong></div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-left: 8px;">
              <span>🥩: ${formatIngredient(totalDailyOrders * witch.meatRate)}</span>
              ${witch.vegetableRate > 0 ? `<span>🥬: ${formatIngredient(totalDailyOrders * witch.vegetableRate)}</span>` : ''}
              ${witch.spiceRate > 0 ? `<span>🌶️: ${formatIngredient(totalDailyOrders * witch.spiceRate)}</span>` : ''}
            </div>
          ` : ''}
          ${(usesClown && (shop.vegetablePurchase.enabled && shop.vegetablePurchase.quantity > 0 || shop.spicePurchase.enabled && shop.spicePurchase.quantity > 0)) || (usesMirac && (shop.miracVegetablePurchase.enabled && shop.miracVegetablePurchase.quantity > 0 || shop.miracSpicePurchase.enabled && shop.miracSpicePurchase.quantity > 0)) || (usesBeast && (shop.beastVegetablePurchase.enabled && shop.beastVegetablePurchase.quantity > 0 || shop.beastSpicePurchase.enabled && shop.beastSpicePurchase.quantity > 0)) || (usesWitch && (shop.witchVegetablePurchase.enabled && shop.witchVegetablePurchase.quantity > 0 || shop.witchSpicePurchase.enabled && shop.witchSpicePurchase.quantity > 0)) ? `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #ccc;">
              <div style="margin-bottom: 6px;"><strong>🛒 Shop Purchases:</strong></div>
              <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-left: 8px;">
                ${usesClown && shop.vegetablePurchase.enabled && shop.vegetablePurchase.quantity > 0 ? `<span>🥬: ${formatIngredient(shop.vegetablePurchase.quantity)}</span>` : ''}
                ${usesClown && shop.spicePurchase.enabled && shop.spicePurchase.quantity > 0 ? `<span>🌶️: ${formatIngredient(shop.spicePurchase.quantity)}</span>` : ''}
                ${usesMirac && shop.miracVegetablePurchase.enabled && shop.miracVegetablePurchase.quantity > 0 ? `<span>🥬: ${formatIngredient(shop.miracVegetablePurchase.quantity)}</span>` : ''}
                ${usesMirac && shop.miracSpicePurchase.enabled && shop.miracSpicePurchase.quantity > 0 ? `<span>🌶️: ${formatIngredient(shop.miracSpicePurchase.quantity)}</span>` : ''}
                ${usesBeast && shop.beastVegetablePurchase.enabled && shop.beastVegetablePurchase.quantity > 0 ? `<span>🥬: ${formatIngredient(shop.beastVegetablePurchase.quantity)}</span>` : ''}
                ${usesBeast && shop.beastSpicePurchase.enabled && shop.beastSpicePurchase.quantity > 0 ? `<span>🌶️: ${formatIngredient(shop.beastSpicePurchase.quantity)}</span>` : ''}
                ${usesWitch && shop.witchVegetablePurchase.enabled && shop.witchVegetablePurchase.quantity > 0 ? `<span>🥬: ${formatIngredient(shop.witchVegetablePurchase.quantity)}</span>` : ''}
                ${usesWitch && shop.witchSpicePurchase.enabled && shop.witchSpicePurchase.quantity > 0 ? `<span>🌶️: ${formatIngredient(shop.witchSpicePurchase.quantity)}</span>` : ''}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
      
      <!-- Recipe Production -->
      <div class="daily-summary-section">
        <div class="daily-summary-section-title">🍳 Recipe Production</div>
        ${productionSteps.map(step => `
          <div class="daily-summary-row" style="padding: 8px 0; ${step.step === 1 ? 'background: rgba(46, 125, 50, 0.1); border-radius: 6px; padding: 8px;' : ''}">
            <div>
              <strong>${step.step === 1 ? '⭐ ' : ''}${step.name}</strong>
              <div style="font-size: 0.85em; color: #666;">${step.note}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: bold;">${step.quantity}×</div>
              <div style="color: #2e7d32; font-weight: bold;">${step.gold.toLocaleString()}g</div>
            </div>
          </div>
        `).join('')}
        ${productionSteps.length === 0 ? `
          <div style="text-align: center; color: #666; padding: 10px;">
            No dishes can be produced with current settings
          </div>
        ` : ''}
      </div>
      
      <!-- Remaining Ingredients -->
      <div class="daily-summary-section">
        <div class="daily-summary-section-title">📦 Remaining Ingredients</div>
        <div style="padding: 10px; background: var(--bg-alt); border-radius: 6px;">
          ${Object.values(remaining).reduce((a, b) => a + b, 0) > 0 ? `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 0.9em;">
              ${Math.round(remaining.clownMeat) > 0 ? `<span>🥩: ${formatIngredient(remaining.clownMeat)}</span>` : ''}
              ${Math.round(remaining.clownVegetable) > 0 ? `<span>🥬: ${formatIngredient(remaining.clownVegetable)}</span>` : ''}
              ${Math.round(remaining.clownSpice) > 0 ? `<span>🌶️: ${formatIngredient(remaining.clownSpice)}</span>` : ''}
              ${Math.round(remaining.miracMeat) > 0 ? `<span>🥩: ${formatIngredient(remaining.miracMeat)} (m)</span>` : ''}
              ${Math.round(remaining.miracVegetable) > 0 ? `<span>🥬: ${formatIngredient(remaining.miracVegetable)} (m)</span>` : ''}
              ${Math.round(remaining.miracSpice) > 0 ? `<span>🌶️: ${formatIngredient(remaining.miracSpice)} (m)</span>` : ''}
              ${Math.round(remaining.beastMeat) > 0 ? `<span>🥩: ${formatIngredient(remaining.beastMeat)} (o)</span>` : ''}
              ${Math.round(remaining.beastVegetable) > 0 ? `<span>🥬: ${formatIngredient(remaining.beastVegetable)} (o)</span>` : ''}
              ${Math.round(remaining.beastSpice) > 0 ? `<span>🌶️: ${formatIngredient(remaining.beastSpice)} (o)</span>` : ''}
              ${Math.round(remaining.witchMeat) > 0 ? `<span>🥩: ${formatIngredient(remaining.witchMeat)} (w)</span>` : ''}
              ${Math.round(remaining.witchVegetable) > 0 ? `<span>🥬: ${formatIngredient(remaining.witchVegetable)} (w)</span>` : ''}
              ${Math.round(remaining.witchSpice) > 0 ? `<span>🌶️: ${formatIngredient(remaining.witchSpice)} (w)</span>` : ''}
            </div>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #ccc; text-align: center;">
              🍲 Mega Stew Value: <strong style="color: #2e7d32;">${Math.round(stewValue).toLocaleString()}g</strong>
              ${totalRemaining < 100 ? `<div style="color: #666; font-size: 0.85em; margin-top: 4px;">(need ${Math.round(100 - totalRemaining)} more to craft)</div>` : ''}
            </div>
          ` : `
            <div style="text-align: center; color: #2e7d32; font-weight: bold;">
              ✅ All ingredients used perfectly!
            </div>
          `}
        </div>
      </div>
    </div>
    
    <!-- Net Daily Profit -->
    <div class="daily-summary-total">
      <div class="daily-summary-row">
        <span>Recipe Sales</span>
        <span class="daily-value positive">+${totalGold.toLocaleString()}g</span>
      </div>
      ${stewValue > 0 ? `
        <div class="daily-summary-row">
          <span>Mega Stew</span>
          <span class="daily-value positive">+${Math.round(stewValue).toLocaleString()}g</span>
        </div>
      ` : ''}
      ${shopCosts > 0 ? `
        <div class="daily-summary-row">
          <span>Shop Costs</span>
          <span class="daily-value negative">-${shopCosts.toLocaleString()}g</span>
        </div>
      ` : ''}
      <div class="daily-summary-row" style="font-size: 1.2em; padding-top: 10px; border-top: 2px solid var(--border-color);">
        <span><strong>Net Daily Profit</strong></span>
        <span class="daily-value ${profitClass}" style="font-size: 1.3em;"><strong>${netDailyProfit >= 0 ? '+' : ''}${netDailyProfit.toLocaleString()}g</strong></span>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
}

function buildVendorConfig(root) {
  const container = root.querySelector('#cooking-vendor-config');
  if (!container) return;
  
  const isCollapsed = getAccordionState('vendor-config') ? '' : ' collapsed';
  
  let html = `<div class="panel${isCollapsed}" data-accordion-id="vendor-config">`;
  html += '<div class="panel-header" onclick="toggleAccordion(this)">';
  html += '<span class="panel-toggle">▼</span>';
  html += '<h4 class="panel-title">Vendor Configuration Details</h4>';
  html += '</div>';
  html += '<div class="panel-content">';
  html += '<div class="grid-responsive grid-md gap-lg">';
  
  // clown vendor
  html += `
    <div class="card card-lg vendor-card">
      <h4 class="card-header">🤡 Clown Vendor</h4>
      <div class="card-body vendor-preset">
        <label style="display: block; margin-bottom: 8px;">
          <input type="radio" name="clown-preset" value="meat-only"> Meat Only (100%)
        </label>
        <label style="display: block; margin-bottom: 8px;">
          <input type="radio" name="clown-preset" value="meat-vegetable"> Meat + Vegetable (72% / 28%)
        </label>
        <label style="display: block; margin-bottom: 8px;">
          <input type="radio" name="clown-preset" value="all-three" checked> Meat + Vegetable + Spice (65% / 25% / 10%)
        </label>
      </div>
    </div>
  `;
  
  // miraculand vendor
  html += `
    <div class="card card-lg vendor-card">
      <h4 class="card-header">🌴 Miraculand Vendor</h4>
      <div class="card-body vendor-preset">
        <label style="display: block; margin-bottom: 8px;">
          <input type="radio" name="mirac-preset" value="none"> None (Not Unlocked)
        </label>
        <label style="display: block; margin-bottom: 8px;">
          <input type="radio" name="mirac-preset" value="meat-only" checked> Meat Only (100%)
        </label>
        <label style="display: block; margin-bottom: 8px;">
          <input type="radio" name="mirac-preset" value="meat-vegetable"> Meat + Vegetable (72% / 28%)
        </label>
        <label style="display: block; margin-bottom: 8px;">
          <input type="radio" name="mirac-preset" value="all-three"> Meat + Vegetable + Spice (65% / 25% / 10%)
        </label>
      </div>
    </div>
  `;
  
  // orc hunter's tribe vendor
  html += `
    <div class="card card-lg vendor-card">
      <h4 class="card-header">👹 Orc Hunter's Tribe</h4>
      <div class="card-body vendor-preset">
        <label style="display: block; margin-bottom: 8px;">
          <input type="radio" name="beast-preset" value="none"> None (Not Unlocked)
        </label>
        <label style="display: block; margin-bottom: 8px;">
          <input type="radio" name="beast-preset" value="meat-only" checked> Meat Only (100%)
        </label>
        <label style="display: block; margin-bottom: 8px;">
          <input type="radio" name="beast-preset" value="meat-vegetable"> Meat + Vegetable (72% / 28%)
        </label>
        <label style="display: block; margin-bottom: 8px;">
          <input type="radio" name="beast-preset" value="all-three"> Meat + Vegetable + Spice (65% / 25% / 10%)
        </label>
      </div>
    </div>
  `;

  // witch alchemy store vendor
  html += `
    <div class="card card-lg vendor-card">
      <h4 class="card-header">🧙 Witch Alchemy Store</h4>
      <div class="card-body vendor-preset">
        <label style="display: block; margin-bottom: 8px;">
          <input type="radio" name="witch-preset" value="none"> None (Not Unlocked)
        </label>
        <label style="display: block; margin-bottom: 8px;">
          <input type="radio" name="witch-preset" value="meat-only" checked> Meat Only (100%)
        </label>
        <label style="display: block; margin-bottom: 8px;">
          <input type="radio" name="witch-preset" value="meat-vegetable"> Meat + Vegetable (72% / 28%)
        </label>
        <label style="display: block; margin-bottom: 8px;">
          <input type="radio" name="witch-preset" value="all-three"> Meat + Vegetable + Spice (65% / 25% / 10%)
        </label>
      </div>
    </div>
  `;

  html += '</div>'; // end grid
  
  // supply orders per hour
  html += `
    <div class="voucher-config">
      <label>Supply Orders per Hour: 
        <input type="number" id="supply-orders-per-hour" value="30" min="1" max="999" class="form-control form-control-md">
      </label>
    </div>
  `;
  
  html += '</div>'; // end panel-content
  html += '</div>'; // end panel
  
  container.innerHTML = html;
}

function buildShopConfig(root) {
  const container = root.querySelector('#cooking-shop-config');
  if (!container) return;
  
  const shop = cookingState.shop;
  
  const isCollapsed = getAccordionState('shop-config') ? '' : ' collapsed';
  
  // Collapsible section wrapping the entire shop content
  let html = `<div class="panel${isCollapsed}" data-accordion-id="shop-config">`;
  html += '<div class="panel-header" onclick="toggleAccordion(this)">';
  html += '<span class="panel-toggle">▼</span>';
  html += '<h4 class="panel-title">Shop Items & Daily ROI</h4>';
  html += '</div>';
  html += '<div class="panel-content">';
  
  // Two-column layout: items on left, ROI on right
  html += '<div class="shop-layout-container">';
  
  // Left column: shop items
  html += '<div class="card shop-items-card">';
  html += '<h4 class="card-header">🛒 Shop Items</h4>';
  html += '<div class="shop-items-list">';
  
  // Row 1: General items (non-vendor specific)
  html += '<div class="shop-row">';
  html += '<div class="shop-row-label">General</div>';
  html += '<div class="shop-row-items">';
  
  // supply deals
  html += `
    <div class="shop-item">
      <label>
        <input type="checkbox" id="shop-supply-enabled" ${shop.supplyDeals.enabled ? 'checked' : ''}>
        <strong>Supply Deals</strong>
      </label>
      <div class="d-flex items-center gap-sm">
        <label>Qty: <input type="number" id="shop-supply-qty" value="${shop.supplyDeals.quantity}" min="0" max="99" step="1" class="form-control form-control-xs"></label>
        <label>@ <span class="fixed-price">100g</span> each</label>
      </div>
      <div class="shop-result" id="shop-supply-result"></div>
    </div>
  `;
  
  // skill books purchase
  html += `
    <div class="shop-item">
      <label>
        <input type="checkbox" id="shop-skillbooks-enabled" ${shop.skillBooks.enabled ? 'checked' : ''}>
        <strong>📚 Skill Books</strong>
      </label>
      <div class="d-flex items-center gap-sm">
        <label>Level: 
          <select id="shop-skillbooks-level" class="form-control form-control-xs" style="width: 80px;">
            <option value="1" ${shop.skillBooks.level === 1 ? 'selected' : ''}>1</option>
            <option value="2" ${shop.skillBooks.level === 2 ? 'selected' : ''}>2</option>
            <option value="3" ${shop.skillBooks.level === 3 ? 'selected' : ''}>3</option>
          </select>
        </label>
        <label>Qty: <input type="number" id="shop-skillbooks-qty" value="${shop.skillBooks.quantity}" min="0" max="4" step="1" class="form-control form-control-xs"></label>
        <label>@ <span class="fixed-price" id="shop-skillbooks-price">${shop.skillBooks.level === 3 ? '15,000g' : shop.skillBooks.level === 2 ? '10,000g' : '5,000g'}</span> each</label>
      </div>
      <div class="shop-result" id="shop-skillbooks-result"></div>
    </div>
  `;
  
  html += '</div>'; // end shop-row-items
  html += '</div>'; // end shop-row
  
  // Row 2: Clown vendor items
  html += '<div class="shop-row">';
  html += '<div class="shop-row-label">🤡 Clown</div>';
  html += '<div class="shop-row-items">';
  
  // clown vegetable purchase
  html += `
    <div class="shop-item">
      <label>
        <input type="checkbox" id="shop-vegetable-enabled" ${shop.vegetablePurchase.enabled ? 'checked' : ''}>
        <strong>🥬 Vegetables</strong>
      </label>
      <div class="d-flex items-center gap-sm">
        <label>Qty: <input type="number" id="shop-vegetable-qty" value="${shop.vegetablePurchase.quantity}" min="0" max="99" step="1" class="form-control form-control-xs"></label>
        <label>@ <span class="fixed-price">220g</span> each</label>
      </div>
      <div class="shop-result" id="shop-vegetable-result"></div>
    </div>
  `;
  
  // clown spice purchase
  html += `
    <div class="shop-item">
      <label>
        <input type="checkbox" id="shop-spice-enabled" ${shop.spicePurchase.enabled ? 'checked' : ''}>
        <strong>🌶️ Spice</strong>
      </label>
      <div class="d-flex items-center gap-sm">
        <label>Qty: <input type="number" id="shop-spice-qty" value="${shop.spicePurchase.quantity}" min="0" max="99" step="1" class="form-control form-control-xs"></label>
        <label>@ <span class="fixed-price">360g</span> each</label>
      </div>
      <div class="shop-result" id="shop-spice-result"></div>
    </div>
  `;
  
  html += '</div>'; // end shop-row-items
  html += '</div>'; // end shop-row
  
  // Row 3: Miraculand vendor items
  html += '<div class="shop-row">';
  html += '<div class="shop-row-label">🌴 Mirac</div>';
  html += '<div class="shop-row-items">';
  
  // miraculand vegetable purchase
  html += `
    <div class="shop-item">
      <label>
        <input type="checkbox" id="shop-mirac-vegetable-enabled" ${shop.miracVegetablePurchase.enabled ? 'checked' : ''}>
        <strong>🥬 Vegetables</strong>
      </label>
      <div class="d-flex items-center gap-sm">
        <label>Qty: <input type="number" id="shop-mirac-vegetable-qty" value="${shop.miracVegetablePurchase.quantity}" min="0" max="5" step="1" class="form-control form-control-xs"></label>
        <label>@ <span class="fixed-price">270g</span> each</label>
      </div>
      <div class="shop-result" id="shop-mirac-vegetable-result"></div>
    </div>
  `;
  
  // miraculand spice purchase
  html += `
    <div class="shop-item">
      <label>
        <input type="checkbox" id="shop-mirac-spice-enabled" ${shop.miracSpicePurchase.enabled ? 'checked' : ''}>
        <strong>🌶️ Spice</strong>
      </label>
      <div class="d-flex items-center gap-sm">
        <label>Qty: <input type="number" id="shop-mirac-spice-qty" value="${shop.miracSpicePurchase.quantity}" min="0" max="5" step="1" class="form-control form-control-xs"></label>
        <label>@ <span class="fixed-price">450g</span> each</label>
      </div>
      <div class="shop-result" id="shop-mirac-spice-result"></div>
    </div>
  `;
  
  html += '</div>'; // end shop-row-items
  html += '</div>'; // end shop-row
  
  // Row 4: Orc Hunter's Tribe vendor items
  html += '<div class="shop-row">';
  html += '<div class="shop-row-label">👹 Orc</div>';
  html += '<div class="shop-row-items">';
  
  // orc vegetable purchase
  html += `
    <div class="shop-item">
      <label>
        <input type="checkbox" id="shop-beast-vegetable-enabled" ${shop.beastVegetablePurchase.enabled ? 'checked' : ''}>
        <strong>🥬 Vegetables</strong>
      </label>
      <div class="d-flex items-center gap-sm">
        <label>Qty: <input type="number" id="shop-beast-vegetable-qty" value="${shop.beastVegetablePurchase.quantity}" min="0" max="5" step="1" class="form-control form-control-xs"></label>
        <label>@ <span class="fixed-price">360g</span> each</label>
      </div>
      <div class="shop-result" id="shop-beast-vegetable-result"></div>
    </div>
  `;
  
  // orc spice purchase
  html += `
    <div class="shop-item">
      <label>
        <input type="checkbox" id="shop-beast-spice-enabled" ${shop.beastSpicePurchase.enabled ? 'checked' : ''}>
        <strong>🌶️ Spice</strong>
      </label>
      <div class="d-flex items-center gap-sm">
        <label>Qty: <input type="number" id="shop-beast-spice-qty" value="${shop.beastSpicePurchase.quantity}" min="0" max="5" step="1" class="form-control form-control-xs"></label>
        <label>@ <span class="fixed-price">600g</span> each</label>
      </div>
      <div class="shop-result" id="shop-beast-spice-result"></div>
    </div>
  `;
  
  html += '</div>'; // end shop-row-items
  html += '</div>'; // end shop-row

  // Row 5: Witch Alchemy Store vendor items
  html += '<div class="shop-row">';
  html += '<div class="shop-row-label">🧙 Witch</div>';
  html += '<div class="shop-row-items">';

  // witch vegetable purchase
  html += `
    <div class="shop-item">
      <label>
        <input type="checkbox" id="shop-witch-vegetable-enabled" ${shop.witchVegetablePurchase.enabled ? 'checked' : ''}>
        <strong>🥬 Vegetables</strong>
      </label>
      <div class="d-flex items-center gap-sm">
        <label>Qty: <input type="number" id="shop-witch-vegetable-qty" value="${shop.witchVegetablePurchase.quantity}" min="0" max="5" step="1" class="form-control form-control-xs"></label>
        <label>@ <span class="fixed-price">450g</span> each <span style="font-size: 0.8em; color: #888;">(est.)</span></label>
      </div>
      <div class="shop-result" id="shop-witch-vegetable-result"></div>
    </div>
  `;

  // witch spice purchase
  html += `
    <div class="shop-item">
      <label>
        <input type="checkbox" id="shop-witch-spice-enabled" ${shop.witchSpicePurchase.enabled ? 'checked' : ''}>
        <strong>🌶️ Spice</strong>
      </label>
      <div class="d-flex items-center gap-sm">
        <label>Qty: <input type="number" id="shop-witch-spice-qty" value="${shop.witchSpicePurchase.quantity}" min="0" max="5" step="1" class="form-control form-control-xs"></label>
        <label>@ <span class="fixed-price">750g</span> each <span style="font-size: 0.8em; color: #888;">(est.)</span></label>
      </div>
      <div class="shop-result" id="shop-witch-spice-result"></div>
    </div>
  `;

  html += '</div>'; // end shop-row-items
  html += '</div>'; // end shop-row

  html += '</div>'; // end shop-items-list
  html += '</div>'; // end shop-items-card
  
  // Right column: ROI summary
  html += '<div class="card card-lg shop-roi-card">';
  html += '<h4 class="card-header">💰 Daily Shop ROI</h4>';
  html += '<div id="shop-roi-summary"></div>';
  html += '</div>'; // end shop-roi-card
  
  html += '</div>'; // end shop-layout-container
  
  html += '</div>'; // end panel-content
  html += '</div>'; // end panel
  
  container.innerHTML = html;
}

function buildRecipeManager(root) {
  const container = root.querySelector('#cooking-recipe-manager');
  if (!container) return;
  
  // separate recipes by vendor and categorize by ingredient complexity
  const clownRecipes = {
    meatOnly: [],
    meatVeg: [],
    meatVegSpice: []
  };
  const miracRecipes = {
    meatOnly: [],
    meatVeg: [],
    meatVegSpice: []
  };
  const beastRecipes = {
    meatOnly: [],
    meatVeg: [],
    meatVegSpice: []
  };
  const witchRecipes = {
    meatOnly: [],
    meatVeg: [],
    meatVegSpice: []
  };

  for (const id of RECIPE_ORDER) {
    const recipe = COOKING_RECIPES[id];
    const usesMirac = recipe.miracMeat > 0 || recipe.miracVegetable > 0 || recipe.miracSpice > 0;
    const usesBeast = recipe.beastMeat > 0 || recipe.beastVegetable > 0 || recipe.beastSpice > 0;
    const usesWitch = recipe.witchMeat > 0 || recipe.witchVegetable > 0 || recipe.witchSpice > 0;

    if (usesWitch) {
      // Categorize witch (Witch Alchemy Store) recipes
      const hasMeat = recipe.witchMeat > 0;
      const hasVeg = recipe.witchVegetable > 0;
      const hasSpice = recipe.witchSpice > 0;

      if (hasMeat && !hasVeg && !hasSpice) {
        witchRecipes.meatOnly.push(id);
      } else if (hasMeat && hasVeg && !hasSpice) {
        witchRecipes.meatVeg.push(id);
      } else if (hasMeat && hasVeg && hasSpice) {
        witchRecipes.meatVegSpice.push(id);
      }
    } else if (usesBeast) {
      // Categorize beast (Orc Hunter's Tribe) recipes
      const hasMeat = recipe.beastMeat > 0;
      const hasVeg = recipe.beastVegetable > 0;
      const hasSpice = recipe.beastSpice > 0;
      
      if (hasMeat && !hasVeg && !hasSpice) {
        beastRecipes.meatOnly.push(id);
      } else if (hasMeat && hasVeg && !hasSpice) {
        beastRecipes.meatVeg.push(id);
      } else if (hasMeat && hasVeg && hasSpice) {
        beastRecipes.meatVegSpice.push(id);
      }
    } else if (usesMirac) {
      // Categorize miraculand recipes
      const hasMeat = recipe.miracMeat > 0;
      const hasVeg = recipe.miracVegetable > 0;
      const hasSpice = recipe.miracSpice > 0;
      
      if (hasMeat && !hasVeg && !hasSpice) {
        miracRecipes.meatOnly.push(id);
      } else if (hasMeat && hasVeg && !hasSpice) {
        miracRecipes.meatVeg.push(id);
      } else if (hasMeat && hasVeg && hasSpice) {
        miracRecipes.meatVegSpice.push(id);
      }
    } else {
      // Categorize clown recipes
      const hasMeat = recipe.clownMeat > 0;
      const hasVeg = recipe.clownVegetable > 0;
      const hasSpice = recipe.clownSpice > 0;
      
      if (hasMeat && !hasVeg && !hasSpice) {
        clownRecipes.meatOnly.push(id);
      } else if (hasMeat && hasVeg && !hasSpice) {
        clownRecipes.meatVeg.push(id);
      } else if (hasMeat && hasVeg && hasSpice) {
        clownRecipes.meatVegSpice.push(id);
      }
    }
  }
  
  const clownTotal = clownRecipes.meatOnly.length + clownRecipes.meatVeg.length + clownRecipes.meatVegSpice.length;
  const miracTotal = miracRecipes.meatOnly.length + miracRecipes.meatVeg.length + miracRecipes.meatVegSpice.length;
  const beastTotal = beastRecipes.meatOnly.length + beastRecipes.meatVeg.length + beastRecipes.meatVegSpice.length;
  const witchTotal = witchRecipes.meatOnly.length + witchRecipes.meatVeg.length + witchRecipes.meatVegSpice.length;

  let html = '<div class="recipe-sections">';

  const clownCollapsed = getAccordionState('clown-recipes') ? '' : ' collapsed';
  const miracCollapsed = getAccordionState('mirac-recipes') ? '' : ' collapsed';
  const beastCollapsed = getAccordionState('beast-recipes') ? '' : ' collapsed';
  const witchCollapsed = getAccordionState('witch-recipes') ? '' : ' collapsed';
  const rankingCollapsed = getAccordionState('optimal-ranking') ? '' : ' collapsed';
  
  // Clown recipes section with nested groups
  html += `
    <div class="panel${clownCollapsed}" data-accordion-id="clown-recipes">
      <div class="panel-header" onclick="toggleAccordion(this)">
        <span class="panel-toggle">▼</span>
        <h3 class="panel-title">🤡 Clown Vendor Recipes (${clownTotal})</h3>
      </div>
      <div class="panel-content">
        ${buildRecipeGroup('clown-meat-only', '🥩 Meat Only', clownRecipes.meatOnly, false)}
        ${buildRecipeGroup('clown-meat-veg', '🥩🥬 Meat + Vegetable', clownRecipes.meatVeg, false)}
        ${buildRecipeGroup('clown-meat-veg-spice', '🥩🥬🌶️ Meat + Vegetable + Spice', clownRecipes.meatVegSpice, false)}
      </div>
    </div>
  `;
  
  // Miraculand recipes section with nested groups
  html += `
    <div class="panel${miracCollapsed}" data-accordion-id="mirac-recipes">
      <div class="panel-header" onclick="toggleAccordion(this)">
        <span class="panel-toggle">▼</span>
        <h3 class="panel-title">🌴 Miraculand Vendor Recipes (${miracTotal})</h3>
      </div>
      <div class="panel-content">
        ${buildRecipeGroup('mirac-meat-only', '🥩 Meat Only', miracRecipes.meatOnly, true)}
        ${buildRecipeGroup('mirac-meat-veg', '🥩🥬 Meat + Vegetable', miracRecipes.meatVeg, true)}
        ${buildRecipeGroup('mirac-meat-veg-spice', '🥩🥬🌶️ Meat + Vegetable + Spice', miracRecipes.meatVegSpice, true)}
      </div>
    </div>
  `;
  
  // Orc Hunter's Tribe (Beast) recipes section with nested groups
  if (beastTotal > 0) {
    html += `
      <div class="panel${beastCollapsed}" data-accordion-id="beast-recipes">
        <div class="panel-header" onclick="toggleAccordion(this)">
          <span class="panel-toggle">▼</span>
          <h3 class="panel-title">👹 Orc Hunter's Tribe Recipes (${beastTotal})</h3>
        </div>
        <div class="panel-content">
          ${buildRecipeGroup('beast-meat-only', '🥩 Meat Only', beastRecipes.meatOnly, false, 'border-beast')}
          ${buildRecipeGroup('beast-meat-veg', '🥩🥬 Meat + Vegetable', beastRecipes.meatVeg, false, 'border-beast')}
          ${buildRecipeGroup('beast-meat-veg-spice', '🥩🥬🌶️ Meat + Vegetable + Spice', beastRecipes.meatVegSpice, false, 'border-beast')}
        </div>
      </div>
    `;
  }
  
  // Witch Alchemy Store recipes section
  if (witchTotal > 0) {
    html += `
      <div class="panel${witchCollapsed}" data-accordion-id="witch-recipes">
        <div class="panel-header" onclick="toggleAccordion(this)">
          <span class="panel-toggle">▼</span>
          <h3 class="panel-title">🧙 Witch Alchemy Store Recipes (${witchTotal})</h3>
        </div>
        <div class="panel-content">
          ${buildRecipeGroup('witch-meat-only', '🥩 Meat Only', witchRecipes.meatOnly, false, 'border-witch')}
          ${buildRecipeGroup('witch-meat-veg', '🥩🥬 Meat + Vegetable', witchRecipes.meatVeg, false, 'border-witch')}
          ${buildRecipeGroup('witch-meat-veg-spice', '🥩🥬🌶️ Meat + Vegetable + Spice', witchRecipes.meatVegSpice, false, 'border-witch')}
        </div>
      </div>
    `;
  }

  // Add optimal dish ranking section at the end of recipes
  html += `
    <div class="panel${rankingCollapsed}" data-accordion-id="optimal-ranking">
      <div class="panel-header" onclick="toggleAccordion(this)">
        <span class="panel-toggle">▼</span>
        <h3 class="panel-title">
          📊 Optimal Dish Ranking
          <span class="info-icon" onclick="event.stopPropagation(); toggleRankingInfo()" title="How is this calculated?" style="cursor: pointer; margin-left: 8px; font-size: 0.9em; color: #2e7d32;">ℹ️</span>
        </h3>
      </div>
      <div class="panel-content">
        <!-- Explanation Popup (hidden by default) -->
        <div id="ranking-info-popup" style="display: none; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-left: 4px solid #2e7d32; border-radius: 6px;">
          <div style="display: flex; align-items: start; gap: 10px;">
            <div style="font-size: 1.5em;">ℹ️</div>
            <div style="flex: 1;">
              <div style="font-weight: bold; color: #2e7d32; margin-bottom: 8px;">How Ranking is Calculated</div>
              <div style="font-size: 0.9em; line-height: 1.6; color: #555;">
                <strong>g/Order</strong> measures gold efficiency per supply order spent:
                <ul style="margin: 8px 0; padding-left: 20px;">
                  <li><strong>Supply Orders Needed:</strong> Calculated based on vendor drop rates. The ingredient requiring the most orders becomes the "limiting" ingredient.</li>
                  <li><strong>Byproduct Value:</strong> While farming for the limiting ingredient, you'll generate excess ingredients. These are valued at Mega Stew rates.</li>
                  <li><strong>Total Value:</strong> Recipe sale price + byproduct value from excess ingredients.</li>
                  <li><strong>Final Metric:</strong> Total value ÷ supply orders needed = g/Order</li>
                </ul>
                <div style="margin-top: 8px; padding: 8px; background: #fff; border-radius: 4px; font-style: italic;">
                  💡 <strong>Best for:</strong> Maximizing gold when supply orders are your limiting factor. Higher g/Order = more efficient use of supply orders.
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 75/25 Layout: Table on left, Strategy on right -->
        <div class="optimal-ranking-layout">
          <!-- Ranking Table (75%) -->
          <div class="optimal-ranking-table">
            <div class="ranking-table-container">
              <div class="table-responsive-wrapper">
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
            </div>
          </div>
          
          <!-- Strategy Summary (25%) -->
          <div class="optimal-ranking-strategy">
            <h4 class="card-header">🎯 Strategy Summary</h4>
            <div id="strategy-summary"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  html += '</div>';
  container.innerHTML = html;
}

function buildRecipeGroup(groupId, groupTitle, recipeIds, isMirac, customBorderClass) {
  if (recipeIds.length === 0) return '';
  
  const isCollapsed = getAccordionState(groupId) ? '' : ' collapsed';
  const borderClass = customBorderClass || (isMirac ? 'border-mirac' : 'border-clown');
  
  return `
    <div class="panel${isCollapsed}" data-accordion-id="${groupId}" style="margin-bottom: 15px;">
      <div class="panel-header" onclick="toggleAccordion(this)" style="background: var(--bg-alt); padding: 10px 15px;">
        <span class="panel-toggle">▼</span>
        <h4 class="panel-title" style="margin: 0; font-size: 1em;">${groupTitle} (${recipeIds.length})</h4>
      </div>
      <div class="panel-content" style="padding-top: 15px;">
        <div class="recipe-card-grid">
          ${buildRecipeCards(recipeIds, isMirac, borderClass)}
        </div>
      </div>
    </div>
  `;
}

function buildRecipeCards(recipeIds, isMirac, borderClass) {
  let html = '';
  
  for (const id of recipeIds) {
    const recipe = COOKING_RECIPES[id];
    const state = cookingState.recipes[id];
    
    // Build ingredient display with icons only (no text labels) - now horizontal
    let ingredientItems = [];
    if (recipe.clownMeat > 0) {
      ingredientItems.push(`<span class="recipe-ingredient-item"><span class="ingredient-icon">🥩</span><span class="ingredient-amount">${recipe.clownMeat}</span></span>`);
    }
    if (recipe.clownVegetable > 0) {
      ingredientItems.push(`<span class="recipe-ingredient-item"><span class="ingredient-icon">🥬</span><span class="ingredient-amount">${recipe.clownVegetable}</span></span>`);
    }
    if (recipe.clownSpice > 0) {
      ingredientItems.push(`<span class="recipe-ingredient-item"><span class="ingredient-icon">🌶️</span><span class="ingredient-amount">${recipe.clownSpice}</span></span>`);
    }
    if (recipe.miracMeat > 0) {
      ingredientItems.push(`<span class="recipe-ingredient-item"><span class="ingredient-icon">🥩</span><span class="ingredient-amount">${recipe.miracMeat}</span></span>`);
    }
    if (recipe.miracVegetable > 0) {
      ingredientItems.push(`<span class="recipe-ingredient-item"><span class="ingredient-icon">🥬</span><span class="ingredient-amount">${recipe.miracVegetable}</span></span>`);
    }
    if (recipe.miracSpice > 0) {
      ingredientItems.push(`<span class="recipe-ingredient-item"><span class="ingredient-icon">🌶️</span><span class="ingredient-amount">${recipe.miracSpice}</span></span>`);
    }
    if (recipe.beastMeat > 0) {
      ingredientItems.push(`<span class="recipe-ingredient-item"><span class="ingredient-icon">🥩</span><span class="ingredient-amount">${recipe.beastMeat}</span></span>`);
    }
    if (recipe.beastVegetable > 0) {
      ingredientItems.push(`<span class="recipe-ingredient-item"><span class="ingredient-icon">🥬</span><span class="ingredient-amount">${recipe.beastVegetable}</span></span>`);
    }
    if (recipe.beastSpice > 0) {
      ingredientItems.push(`<span class="recipe-ingredient-item"><span class="ingredient-icon">🌶️</span><span class="ingredient-amount">${recipe.beastSpice}</span></span>`);
    }
    if (recipe.witchMeat > 0) {
      ingredientItems.push(`<span class="recipe-ingredient-item"><span class="ingredient-icon">🥩</span><span class="ingredient-amount">${recipe.witchMeat}</span></span>`);
    }
    if (recipe.witchVegetable > 0) {
      ingredientItems.push(`<span class="recipe-ingredient-item"><span class="ingredient-icon">🥬</span><span class="ingredient-amount">${recipe.witchVegetable}</span></span>`);
    }
    if (recipe.witchSpice > 0) {
      ingredientItems.push(`<span class="recipe-ingredient-item"><span class="ingredient-icon">🌶️</span><span class="ingredient-amount">${recipe.witchSpice}</span></span>`);
    }
    const ingredientHtml = ingredientItems.join('');
    
    html += `
      <div class="recipe-card ${borderClass}" data-recipe-id="${id}">
        <span class="recipe-rank" data-recipe-rank="${id}"></span>
        <div class="recipe-card-header">
          <label class="recipe-toggle">
            <input type="checkbox" class="recipe-enabled" data-recipe="${id}" ${state.enabled ? 'checked' : ''}>
            <span class="recipe-name">${recipe.name}</span>
          </label>
        </div>
        <div class="recipe-card-body">
          <div class="recipe-controls-row">
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
            <div class="recipe-ingredients-inline">
              ${ingredientHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  return html;
}


function updateCurrentIngredients(root) {
  const container = root.querySelector('#cooking-ingredient-optimizer');
  if (!container) return;
  
  cookingState.currentIngredients = {
    clownMeat: parseInt(container.querySelector('#current-clown-meat')?.value) || 0,
    clownVegetable: parseInt(container.querySelector('#current-clown-vegetable')?.value) || 0,
    clownSpice: parseInt(container.querySelector('#current-clown-spice')?.value) || 0,
    miracMeat: parseInt(container.querySelector('#current-mirac-meat')?.value) || 0,
    miracVegetable: parseInt(container.querySelector('#current-mirac-vegetable')?.value) || 0,
    miracSpice: parseInt(container.querySelector('#current-mirac-spice')?.value) || 0,
    beastMeat: parseInt(container.querySelector('#current-beast-meat')?.value) || 0,
    beastVegetable: parseInt(container.querySelector('#current-beast-vegetable')?.value) || 0,
    beastSpice: parseInt(container.querySelector('#current-beast-spice')?.value) || 0,
    witchMeat: parseInt(container.querySelector('#current-witch-meat')?.value) || 0,
    witchVegetable: parseInt(container.querySelector('#current-witch-vegetable')?.value) || 0,
    witchSpice: parseInt(container.querySelector('#current-witch-spice')?.value) || 0
  };
  
  saveCookingToStorage();
}

function calculateIngredientOptimizer(root) {
  const container = root.querySelector('#optimizer-results');
  if (!container) return;
  
  const ing = cookingState.currentIngredients;
  const totalIngredients = Object.values(ing).reduce((a, b) => a + b, 0);
  
  if (totalIngredients === 0) {
    container.innerHTML = '<div class="optimizer-empty">Enter your current ingredients above to see recommendations</div>';
    return;
  }
  
  // Sequential optimization - keep finding best recipe until nothing can be made
  const sequence = [];
  let remaining = { ...ing };
  let totalGoldFromRecipes = 0;
  let stepNumber = 1;
  
  while (true) {
    // Find recipes that can be made with remaining ingredients
    const viableRecipes = [];
    
    for (const [id, state] of Object.entries(cookingState.recipes)) {
      if (!state.enabled || !state.price) continue;
      
      const recipe = COOKING_RECIPES[id];
      if (!recipe) continue; // Skip if recipe doesn't exist in COOKING_RECIPES
      
      // Check if we have enough ingredients
      const canMake = 
        remaining.clownMeat >= recipe.clownMeat &&
        remaining.clownVegetable >= recipe.clownVegetable &&
        remaining.clownSpice >= recipe.clownSpice &&
        remaining.miracMeat >= recipe.miracMeat &&
        remaining.miracVegetable >= recipe.miracVegetable &&
        remaining.miracSpice >= recipe.miracSpice;
      
      if (canMake) {
        // Calculate how many we can make
        const maxCanMake = [];
        if (recipe.clownMeat > 0) maxCanMake.push(Math.floor(remaining.clownMeat / recipe.clownMeat));
        if (recipe.clownVegetable > 0) maxCanMake.push(Math.floor(remaining.clownVegetable / recipe.clownVegetable));
        if (recipe.clownSpice > 0) maxCanMake.push(Math.floor(remaining.clownSpice / recipe.clownSpice));
        if (recipe.miracMeat > 0) maxCanMake.push(Math.floor(remaining.miracMeat / recipe.miracMeat));
        if (recipe.miracVegetable > 0) maxCanMake.push(Math.floor(remaining.miracVegetable / recipe.miracVegetable));
        if (recipe.miracSpice > 0) maxCanMake.push(Math.floor(remaining.miracSpice / recipe.miracSpice));
        
        const quantity = Math.min(...maxCanMake);
        const totalGold = quantity * state.price;
        
        // Calculate opportunity cost based on Mega Stew values
        const opportunityCost = 
          (recipe.clownMeat * MEGA_STEW_VALUES.clownMeat) +
          (recipe.clownVegetable * MEGA_STEW_VALUES.clownVegetable) +
          (recipe.clownSpice * MEGA_STEW_VALUES.clownSpice) +
          (recipe.miracMeat * MEGA_STEW_VALUES.miracMeat) +
          (recipe.miracVegetable * MEGA_STEW_VALUES.miracVegetable) +
          (recipe.miracSpice * MEGA_STEW_VALUES.miracSpice);
        
        const profit = totalGold - (opportunityCost * quantity);
        
        // Calculate profit per dish (efficiency) for sorting
        const profitPerDish = state.price - opportunityCost;
        
        // Calculate ingredients used for display purposes
        const ingredientsUsed = 
          (recipe.clownMeat + recipe.clownVegetable + recipe.clownSpice +
           recipe.miracMeat + recipe.miracVegetable + recipe.miracSpice) * quantity;
        const goldPerIngredient = ingredientsUsed > 0 ? totalGold / ingredientsUsed : 0;
        
        viableRecipes.push({
          id,
          name: recipe.name,
          stars: state.stars,
          price: state.price,
          quantity,
          totalGold,
          opportunityCost: opportunityCost * quantity,
          profit,
          profitPerDish,
          ingredientsUsed,
          goldPerIngredient,
          recipe
        });
      }
    }
    
    // No more recipes can be made - break the loop
    if (viableRecipes.length === 0) break;
    
    // Sort by profit per dish (efficiency) - prioritizes valuable recipes regardless of quantity
    viableRecipes.sort((a, b) => b.profitPerDish - a.profitPerDish);
    
    const best = viableRecipes[0];
    
    // Add to sequence
    sequence.push({
      step: stepNumber++,
      name: best.name,
      stars: best.stars,
      quantity: best.quantity,
      gold: best.totalGold,
      efficiency: best.goldPerIngredient,
      ingredientsUsed: best.ingredientsUsed
    });
    
    totalGoldFromRecipes += best.totalGold;
    
    // Update remaining ingredients
    remaining = {
      clownMeat: remaining.clownMeat - (best.recipe.clownMeat * best.quantity),
      clownVegetable: remaining.clownVegetable - (best.recipe.clownVegetable * best.quantity),
      clownSpice: remaining.clownSpice - (best.recipe.clownSpice * best.quantity),
      miracMeat: remaining.miracMeat - (best.recipe.miracMeat * best.quantity),
      miracVegetable: remaining.miracVegetable - (best.recipe.miracVegetable * best.quantity),
      miracSpice: remaining.miracSpice - (best.recipe.miracSpice * best.quantity)
    };
  }
  
  // If no recipes in sequence, check if we can at least make stew
  if (sequence.length === 0) {
    const remainingTotal = Object.values(remaining).reduce((a, b) => a + b, 0);
    
    if (remainingTotal < 100) {
      container.innerHTML = '<div class="optimizer-empty">⚠️ No enabled recipes can be made with your current ingredients.<br>Enable recipes and set their prices in the Recipes section above.</div>';
      return;
    }
    
    // We have enough for stew - show stew-only output
    let stewValue = 
      remaining.clownMeat * MEGA_STEW_VALUES.clownMeat +
      remaining.clownVegetable * MEGA_STEW_VALUES.clownVegetable +
      remaining.clownSpice * MEGA_STEW_VALUES.clownSpice +
      remaining.miracMeat * MEGA_STEW_VALUES.miracMeat +
      remaining.miracVegetable * MEGA_STEW_VALUES.miracVegetable +
      remaining.miracSpice * MEGA_STEW_VALUES.miracSpice;
    
    let stewWarning = null;
    const totalVegetables = remaining.clownVegetable + remaining.miracVegetable;
    const totalMeat = remaining.clownMeat + remaining.miracMeat;
    
    const vegetableWarningThreshold = 30;
    const meatWarningThreshold = 40;
    
    if (totalVegetables >= vegetableWarningThreshold || totalMeat >= meatWarningThreshold) {
      const wastedVegetableValue = totalVegetables * MEGA_STEW_VALUES.clownVegetable;
      const wastedMeatValue = totalMeat * MEGA_STEW_VALUES.clownMeat;
      
      const warnings = [];
      if (totalVegetables >= vegetableWarningThreshold) {
        warnings.push(`${totalVegetables} vegetables (${Math.round(wastedVegetableValue).toLocaleString()}g in stew)`);
      }
      if (totalMeat >= meatWarningThreshold) {
        warnings.push(`${totalMeat} meat (${Math.round(wastedMeatValue).toLocaleString()}g in stew)`);
      }
      
      stewWarning = {
        message: warnings.join(' and '),
        vegetables: totalVegetables,
        meat: totalMeat
      };
    }
    
    let html = `
      <div class="optimizer-recommendation">
        <h4 class="card-heading">🎯 Current Ingredients Analysis</h4>
        <p style="color: #666; margin: 0 0 15px 0; font-size: 0.95em;">
          No recipes enabled or ingredients insufficient for enabled recipes.
        </p>
        <div class="remaining-ingredients" style="margin-top: 20px;">
          <h5>📦 Your Ingredients (${remainingTotal} total)</h5>
          <div class="remaining-grid">
            ${remaining.clownMeat > 0 ? `<p><strong>${remaining.clownMeat}</strong> Clown Meat</p>` : ''}
            ${remaining.clownVegetable > 0 ? `<p><strong>${remaining.clownVegetable}</strong> Clown Vegetable</p>` : ''}
            ${remaining.clownSpice > 0 ? `<p><strong>${remaining.clownSpice}</strong> Clown Spice</p>` : ''}
            ${remaining.miracMeat > 0 ? `<p><strong>${remaining.miracMeat}</strong> Mirac Meat</p>` : ''}
            ${remaining.miracVegetable > 0 ? `<p><strong>${remaining.miracVegetable}</strong> Mirac Vegetable</p>` : ''}
            ${remaining.miracSpice > 0 ? `<p><strong>${remaining.miracSpice}</strong> Mirac Spice</p>` : ''}
          </div>
          ${stewWarning ? `
            <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 15px; margin: 15px 0;">
              <div style="display: flex; align-items: start; gap: 10px;">
                <div style="font-size: 1.5em;">⚠️</div>
                <div style="flex: 1;">
                  <div style="font-weight: bold; color: #856404; margin-bottom: 8px;">Warning: Wasting Valuable Ingredients</div>
                  <div style="color: #856404; margin-bottom: 8px;">
                    Making Mega Stew will use ${stewWarning.message}
                  </div>
                  <div style="color: #856404; font-size: 0.9em; line-height: 1.4;">
                    ${stewWarning.vegetables >= 30 ? `<div>• <strong>Vegetables</strong> are high-value ingredients that work much better in recipes paired with meat</div>` : ''}
                    ${stewWarning.meat >= 40 ? `<div>• <strong>Meat</strong> is better used in recipes than stew</div>` : ''}
                    <div style="margin-top: 8px; font-style: italic;">💡 Consider waiting to gather ${stewWarning.vegetables >= 30 && stewWarning.meat < 20 ? 'meat' : stewWarning.meat >= 40 && stewWarning.vegetables < 20 ? 'vegetables' : 'balanced ingredients'} for making recipes instead</div>
                  </div>
                </div>
              </div>
            </div>
          ` : ''}
          <div class="mega-stew-suggestion">
            🍲 Make Mega Stew with these ingredients: <strong>${Math.round(stewValue).toLocaleString()}g</strong> expected value
          </div>
        </div>
        <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px; text-align: center;">
          <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">TOTAL EXPECTED VALUE</div>
          <div style="font-size: 1.8em; font-weight: bold; color: #1565c0;">${Math.round(stewValue).toLocaleString()}g</div>
          <div style="font-size: 0.85em; color: #666; margin-top: 5px;">
            ${Math.round(stewValue).toLocaleString()}g from Mega Stew
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
    return;
  }
  
  const remainingTotal = Object.values(remaining).reduce((a, b) => a + b, 0);
  
  // Calculate mega stew value for remaining ingredients
  let stewValue = 0;
  let stewWarning = null;
  
  if (remainingTotal >= 100) {
    stewValue = 
      remaining.clownMeat * MEGA_STEW_VALUES.clownMeat +
      remaining.clownVegetable * MEGA_STEW_VALUES.clownVegetable +
      remaining.clownSpice * MEGA_STEW_VALUES.clownSpice +
      remaining.miracMeat * MEGA_STEW_VALUES.miracMeat +
      remaining.miracVegetable * MEGA_STEW_VALUES.miracVegetable +
      remaining.miracSpice * MEGA_STEW_VALUES.miracSpice;
    
    // Check if we're wasting valuable vegetables or meat in stew
    const totalVegetables = remaining.clownVegetable + remaining.miracVegetable;
    const totalMeat = remaining.clownMeat + remaining.miracMeat;
    const totalSpice = remaining.clownSpice + remaining.miracSpice;
    
    // Calculate percentage of non-spice ingredients
    const nonSpiceTotal = totalVegetables + totalMeat;
    const vegetablePercent = nonSpiceTotal > 0 ? (totalVegetables / nonSpiceTotal) * 100 : 0;
    const meatPercent = nonSpiceTotal > 0 ? (totalMeat / nonSpiceTotal) * 100 : 0;
    
    // Warn if we're using significant vegetables or meat (which are better in recipes)
    const vegetableWarningThreshold = 30; // 30+ vegetables is significant waste
    const meatWarningThreshold = 40; // 40+ meat is significant waste
    
    if (totalVegetables >= vegetableWarningThreshold || totalMeat >= meatWarningThreshold) {
      const wastedVegetableValue = totalVegetables * MEGA_STEW_VALUES.clownVegetable; // Use clown value as average
      const wastedMeatValue = totalMeat * MEGA_STEW_VALUES.clownMeat;
      
      let warningMsg = '';
      const warnings = [];
      
      if (totalVegetables >= vegetableWarningThreshold) {
        warnings.push(`${totalVegetables} vegetables (${Math.round(wastedVegetableValue).toLocaleString()}g in stew)`);
      }
      if (totalMeat >= meatWarningThreshold) {
        warnings.push(`${totalMeat} meat (${Math.round(wastedMeatValue).toLocaleString()}g in stew)`);
      }
      
      warningMsg = warnings.join(' and ');
      
      stewWarning = {
        message: warningMsg,
        vegetables: totalVegetables,
        meat: totalMeat,
        vegetablePercent,
        meatPercent
      };
    }
  }
  
  // Build HTML output
  let html = `
    <div class="optimizer-recommendation">
      <h4 class="card-header">🎯 Optimal Crafting Sequence</h4>
      <p style="color: #666; margin: 0 0 15px 0; font-size: 0.95em;">
        Make recipes in order for maximum gold efficiency:
      </p>
  `;
  
  // Display each step in the sequence
  sequence.forEach((step, index) => {
    const isFirst = index === 0;
    html += `
      <div class="best-recipe" style="margin-bottom: ${index < sequence.length - 1 ? '20px' : '15px'};">
        <h5 style="margin: 0 0 8px 0; color: ${isFirst ? '#2e7d32' : '#4a4e69'}; font-size: 1.05em;">
          ${isFirst ? '⭐ ' : ''}Step ${step.step}: ${step.name} ${'★'.repeat(step.stars)}
        </h5>
        <div class="recipe-stats">
          <p style="margin: 4px 0;"><strong>Make:</strong> <span>${step.quantity}×</span></p>
          <p style="margin: 4px 0;"><strong>Gold Earned:</strong> <span style="color: #2e7d32; font-weight: bold;">${step.gold.toLocaleString()}g</span></p>
          <p style="margin: 4px 0;"><strong>Efficiency:</strong> <span>${step.efficiency.toFixed(2)} g/ingredient</span></p>
        </div>
      </div>
    `;
  });
  
  // Show remaining ingredients and Mega Stew
  if (remainingTotal > 0) {
    html += `
      <div class="remaining-ingredients" style="margin-top: 20px;">
        <h5>📦 Final Remaining Ingredients (${remainingTotal} total)</h5>
        <div class="remaining-grid">
          ${remaining.clownMeat > 0 ? `<p><strong>${remaining.clownMeat}</strong> Clown Meat</p>` : ''}
          ${remaining.clownVegetable > 0 ? `<p><strong>${remaining.clownVegetable}</strong> Clown Vegetable</p>` : ''}
          ${remaining.clownSpice > 0 ? `<p><strong>${remaining.clownSpice}</strong> Clown Spice</p>` : ''}
          ${remaining.miracMeat > 0 ? `<p><strong>${remaining.miracMeat}</strong> Mirac Meat</p>` : ''}
          ${remaining.miracVegetable > 0 ? `<p><strong>${remaining.miracVegetable}</strong> Mirac Vegetable</p>` : ''}
          ${remaining.miracSpice > 0 ? `<p><strong>${remaining.miracSpice}</strong> Mirac Spice</p>` : ''}
        </div>
        ${remainingTotal >= 100 ? `
          ${stewWarning ? `
            <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 15px; margin: 15px 0;">
              <div style="display: flex; align-items: start; gap: 10px;">
                <div style="font-size: 1.5em;">⚠️</div>
                <div style="flex: 1;">
                  <div style="font-weight: bold; color: #856404; margin-bottom: 8px;">Warning: Wasting Valuable Ingredients</div>
                  <div style="color: #856404; margin-bottom: 8px;">
                    Making Mega Stew will use ${stewWarning.message}
                  </div>
                  <div style="color: #856404; font-size: 0.9em; line-height: 1.4;">
                    ${stewWarning.vegetables >= 30 ? `<div>• <strong>Vegetables</strong> are high-value ingredients that work much better in recipes paired with meat</div>` : ''}
                    ${stewWarning.meat >= 40 ? `<div>• <strong>Meat</strong> is better used in recipes than stew</div>` : ''}
                    <div style="margin-top: 8px; font-style: italic;">💡 Consider waiting to gather ${stewWarning.vegetables >= 30 && stewWarning.meat < 20 ? 'meat' : stewWarning.meat >= 40 && stewWarning.vegetables < 20 ? 'vegetables' : 'balanced ingredients'} for making recipes instead</div>
                  </div>
                </div>
              </div>
            </div>
          ` : ''}
          <div class="mega-stew-suggestion">
            🍲 Make Mega Stew with remaining ingredients: <strong>${Math.round(stewValue).toLocaleString()}g</strong> expected value
          </div>
        ` : `
          <p style="text-align: center; color: #999; font-style: italic; margin-top: 10px;">
            Not enough for Mega Stew (needs 100 minimum)
          </p>
        `}
      </div>
    `;
  } else {
    html += '<div style="text-align: center; padding: 15px; color: #2e7d32; font-weight: bold;">✅ All ingredients used perfectly!</div>';
  }
  
  // Total value summary
  const totalValue = totalGoldFromRecipes + stewValue;
  html += `
    <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px; text-align: center;">
      <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">TOTAL EXPECTED VALUE</div>
      <div style="font-size: 1.8em; font-weight: bold; color: #1565c0;">${Math.round(totalValue).toLocaleString()}g</div>
      <div style="font-size: 0.85em; color: #666; margin-top: 5px;">
        ${totalGoldFromRecipes.toLocaleString()}g from recipes${stewValue > 0 ? ` + ${Math.round(stewValue).toLocaleString()}g from Mega Stew` : ''}
      </div>
    </div>
  `;
  
  html += '</div>';
  
  container.innerHTML = html;
}

function buildResultsDashboard(root) {
  const container = root.querySelector('#cooking-results');
  if (!container) return;
  
  const ing = cookingState.currentIngredients;
  
  const currentInventoryCollapsed = getAccordionState('current-inventory') ? '' : ' collapsed';
  const optimizerCollapsed = getAccordionState('current-optimizer') ? '' : ' collapsed';
  const stewCollapsed = getAccordionState('mega-stew') ? '' : ' collapsed';
  
  let html = `
    <div class="results-full-width">
      <!-- Current Ingredients Calculators Section Header -->
      <h3 style="margin: 20px 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #f2e9e4; color: #4a4e69;">🎒 Current Ingredients Calculators</h3>
      
      <!-- Current Inventory Collapseable Section -->
      <div class="panel${currentInventoryCollapsed}" data-accordion-id="current-inventory" style="margin-bottom: 20px;">
        <div class="panel-header" onclick="toggleAccordion(this)">
          <span class="panel-toggle">▼</span>
          <h3 class="panel-title">📦 Current Inventory</h3>
        </div>
        <div class="panel-content" id="cooking-ingredient-optimizer">
          <!-- Clown Vendor Row -->
          <div class="ingredient-row-clown">
            <div class="ingredient-row-label">🤡 Clown Vendor</div>
            <div class="ingredient-row">
              <div class="card card-md ingredient-card border-clown" style="text-align: center;">
                <label style="display: block; font-weight: bold; margin-bottom: 8px;">🥩 Meat</label>
                <input type="number" id="current-clown-meat" value="${ing.clownMeat}" min="0" max="9999" class="form-control w-full text-center" style="font-size: 1em; padding: 6px; box-sizing: border-box;">
              </div>
              <div class="card card-md ingredient-card border-clown" style="text-align: center;">
                <label style="display: block; font-weight: bold; margin-bottom: 8px;">🥬 Vegetable</label>
                <input type="number" id="current-clown-vegetable" value="${ing.clownVegetable}" min="0" max="9999" class="form-control w-full text-center" style="font-size: 1em; padding: 6px; box-sizing: border-box;">
              </div>
              <div class="card card-md ingredient-card border-clown" style="text-align: center;">
                <label style="display: block; font-weight: bold; margin-bottom: 8px;">🌶️ Spice</label>
                <input type="number" id="current-clown-spice" value="${ing.clownSpice}" min="0" max="9999" class="form-control w-full text-center" style="font-size: 1em; padding: 6px; box-sizing: border-box;">
              </div>
            </div>
          </div>
          
          <!-- Miraculand Vendor Row -->
          <div class="ingredient-row-mirac">
            <div class="ingredient-row-label">🌴 Miraculand Vendor</div>
            <div class="ingredient-row">
              <div class="card card-md ingredient-card border-mirac" style="text-align: center;">
                <label style="display: block; font-weight: bold; margin-bottom: 8px;">🥩 Meat</label>
                <input type="number" id="current-mirac-meat" value="${ing.miracMeat}" min="0" max="9999" class="form-control w-full text-center" style="font-size: 1em; padding: 6px; box-sizing: border-box;">
              </div>
              <div class="card card-md ingredient-card border-mirac" style="text-align: center;">
                <label style="display: block; font-weight: bold; margin-bottom: 8px;">🥬 Vegetable</label>
                <input type="number" id="current-mirac-vegetable" value="${ing.miracVegetable}" min="0" max="9999" class="form-control w-full text-center" style="font-size: 1em; padding: 6px; box-sizing: border-box;">
              </div>
              <div class="card card-md ingredient-card border-mirac" style="text-align: center;">
                <label style="display: block; font-weight: bold; margin-bottom: 8px;">🌶️ Spice</label>
                <input type="number" id="current-mirac-spice" value="${ing.miracSpice}" min="0" max="9999" class="form-control w-full text-center" style="font-size: 1em; padding: 6px; box-sizing: border-box;">
              </div>
            </div>
          </div>
          
          <!-- Beast (Orc Hunter's Tribe) Vendor Row -->
          <div class="ingredient-row-beast">
            <div class="ingredient-row-label">👹 Orc Hunter's Tribe</div>
            <div class="ingredient-row">
              <div class="card card-md ingredient-card border-beast" style="text-align: center;">
                <label style="display: block; font-weight: bold; margin-bottom: 8px;">🥩 Meat</label>
                <input type="number" id="current-beast-meat" value="${ing.beastMeat}" min="0" max="9999" class="form-control w-full text-center" style="font-size: 1em; padding: 6px; box-sizing: border-box;">
              </div>
              <div class="card card-md ingredient-card border-beast" style="text-align: center;">
                <label style="display: block; font-weight: bold; margin-bottom: 8px;">🥬 Vegetable</label>
                <input type="number" id="current-beast-vegetable" value="${ing.beastVegetable}" min="0" max="9999" class="form-control w-full text-center" style="font-size: 1em; padding: 6px; box-sizing: border-box;">
              </div>
              <div class="card card-md ingredient-card border-beast" style="text-align: center;">
                <label style="display: block; font-weight: bold; margin-bottom: 8px;">🌶️ Spice</label>
                <input type="number" id="current-beast-spice" value="${ing.beastSpice}" min="0" max="9999" class="form-control w-full text-center" style="font-size: 1em; padding: 6px; box-sizing: border-box;">
              </div>
            </div>
          </div>

          <!-- Witch Alchemy Store Vendor Row -->
          <div class="ingredient-row-witch">
            <div class="ingredient-row-label">🧙 Witch Alchemy Store</div>
            <div class="ingredient-row">
              <div class="card card-md ingredient-card border-witch" style="text-align: center;">
                <label style="display: block; font-weight: bold; margin-bottom: 8px;">🥩 Meat</label>
                <input type="number" id="current-witch-meat" value="${ing.witchMeat}" min="0" max="9999" class="form-control w-full text-center" style="font-size: 1em; padding: 6px; box-sizing: border-box;">
              </div>
              <div class="card card-md ingredient-card border-witch" style="text-align: center;">
                <label style="display: block; font-weight: bold; margin-bottom: 8px;">🥬 Vegetable</label>
                <input type="number" id="current-witch-vegetable" value="${ing.witchVegetable}" min="0" max="9999" class="form-control w-full text-center" style="font-size: 1em; padding: 6px; box-sizing: border-box;">
              </div>
              <div class="card card-md ingredient-card border-witch" style="text-align: center;">
                <label style="display: block; font-weight: bold; margin-bottom: 8px;">🌶️ Spice</label>
                <input type="number" id="current-witch-spice" value="${ing.witchSpice}" min="0" max="9999" class="form-control w-full text-center" style="font-size: 1em; padding: 6px; box-sizing: border-box;">
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Current Ingredients Optimizer -->
      <div class="panel${optimizerCollapsed}" data-accordion-id="current-optimizer" style="margin-bottom: 20px;">
        <div class="panel-header" onclick="toggleAccordion(this)">
          <span class="panel-toggle">▼</span>
          <h3 class="panel-title">🎯 Current Ingredients Optimizer</h3>
        </div>
        <div class="panel-content">
          <div id="optimizer-results"></div>
        </div>
      </div>
      
      <!-- Mega Stew Calculator -->
      <div class="panel${stewCollapsed}" data-accordion-id="mega-stew">
        <div class="panel-header" onclick="toggleAccordion(this)">
          <span class="panel-toggle">▼</span>
          <h3 class="panel-title">🎲 Mega Stew Calculator</h3>
        </div>
        <div class="panel-content">
          <div id="stew-calculator"></div>
        </div>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Set up event listeners for shared ingredient inputs
  ['clown-meat', 'clown-vegetable', 'clown-spice', 'mirac-meat', 'mirac-vegetable', 'mirac-spice', 'beast-meat', 'beast-vegetable', 'beast-spice'].forEach(id => {
    const input = container.querySelector(`#current-${id}`);
    if (input) {
      input.addEventListener('input', () => {
        updateCurrentIngredients(root);
        calculateIngredientOptimizer(root);
        // Also trigger stew calculator update
        calculateStewRanges(root);
      });
    }
  });
  
  // Initial calculation
  calculateIngredientOptimizer(root);
}

// ============== EVENT LISTENERS ==============

function setupCookingEventListeners(root) {
  // Daily summary vendor toggle
  root.querySelectorAll('input[name="daily-vendor-select"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      cookingState.dailySummaryVendor = e.target.value;
      updateDailySummary(root);
      saveCookingToStorage();
    });
  });
  
  // vendor config changes
  root.querySelectorAll('#cooking-vendor-config input').forEach(input => {
    input.addEventListener('change', () => {
      updateVendorState(root);
      recalculateCooking();
    });
  });
  
  // checkbox to enable/disable rate inputs
  ['clown', 'mirac'].forEach(vendor => {
    ['meat', 'vegetable', 'spice'].forEach(type => {
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
  
  // shop config changes - includes both input and select elements
  root.querySelectorAll('#cooking-shop-config input, #cooking-shop-config select').forEach(element => {
    element.addEventListener('change', () => {
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
      // Auto-enable checkbox when stars are changed
      cookingState.recipes[id].enabled = true;
      const checkbox = root.querySelector(`.recipe-enabled[data-recipe="${id}"]`);
      if (checkbox) checkbox.checked = true;
      recalculateCooking();
      saveCookingToStorage();
    });
  });
  
  root.querySelectorAll('.recipe-price').forEach(input => {
    input.addEventListener('change', (e) => {
      const id = e.target.dataset.recipe;
      const newPrice = parseInt(e.target.value) || 0;
      if (newPrice > 0) {
        cookingState.recipes[id].price = newPrice;
        // Auto-enable checkbox when price is entered
        cookingState.recipes[id].enabled = true;
        const checkbox = root.querySelector(`.recipe-enabled[data-recipe="${id}"]`);
        if (checkbox) checkbox.checked = true;
      } else {
        cookingState.recipes[id].price = 0;
      }
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
  
  // Export/Import listeners
  setupExportImportListeners(root);
}

function updateVendorState(root) {
  // clown vendor - check which preset is selected
  const clownPreset = root.querySelector('input[name="clown-preset"]:checked')?.value || 'all-three';
  if (clownPreset === 'meat-only') {
    cookingState.vendors.clown.meatEnabled = true;
    cookingState.vendors.clown.meatRate = 1.00;
    cookingState.vendors.clown.vegetableEnabled = false;
    cookingState.vendors.clown.vegetableRate = 0;
    cookingState.vendors.clown.spiceEnabled = false;
    cookingState.vendors.clown.spiceRate = 0;
  } else if (clownPreset === 'meat-vegetable') {
    cookingState.vendors.clown.meatEnabled = true;
    cookingState.vendors.clown.meatRate = 0.7222;
    cookingState.vendors.clown.vegetableEnabled = true;
    cookingState.vendors.clown.vegetableRate = 0.2778;
    cookingState.vendors.clown.spiceEnabled = false;
    cookingState.vendors.clown.spiceRate = 0;
  } else { // all-three
    cookingState.vendors.clown.meatEnabled = true;
    cookingState.vendors.clown.meatRate = 0.65;
    cookingState.vendors.clown.vegetableEnabled = true;
    cookingState.vendors.clown.vegetableRate = 0.25;
    cookingState.vendors.clown.spiceEnabled = true;
    cookingState.vendors.clown.spiceRate = 0.10;
  }
  cookingState.vendors.clown.preset = clownPreset;
  
  // miraculand vendor - check which preset is selected
  const miracPreset = root.querySelector('input[name="mirac-preset"]:checked')?.value || 'meat-only';
  if (miracPreset === 'none') {
    cookingState.vendors.miraculand.meatEnabled = false;
    cookingState.vendors.miraculand.meatRate = 0;
    cookingState.vendors.miraculand.vegetableEnabled = false;
    cookingState.vendors.miraculand.vegetableRate = 0;
    cookingState.vendors.miraculand.spiceEnabled = false;
    cookingState.vendors.miraculand.spiceRate = 0;
  } else if (miracPreset === 'meat-only') {
    cookingState.vendors.miraculand.meatEnabled = true;
    cookingState.vendors.miraculand.meatRate = 1.00;
    cookingState.vendors.miraculand.vegetableEnabled = false;
    cookingState.vendors.miraculand.vegetableRate = 0;
    cookingState.vendors.miraculand.spiceEnabled = false;
    cookingState.vendors.miraculand.spiceRate = 0;
  } else if (miracPreset === 'meat-vegetable') {
    cookingState.vendors.miraculand.meatEnabled = true;
    cookingState.vendors.miraculand.meatRate = 0.7222;
    cookingState.vendors.miraculand.vegetableEnabled = true;
    cookingState.vendors.miraculand.vegetableRate = 0.2778;
    cookingState.vendors.miraculand.spiceEnabled = false;
    cookingState.vendors.miraculand.spiceRate = 0;
  } else { // all-three
    cookingState.vendors.miraculand.meatEnabled = true;
    cookingState.vendors.miraculand.meatRate = 0.65;
    cookingState.vendors.miraculand.vegetableEnabled = true;
    cookingState.vendors.miraculand.vegetableRate = 0.25;
    cookingState.vendors.miraculand.spiceEnabled = true;
    cookingState.vendors.miraculand.spiceRate = 0.10;
  }
  cookingState.vendors.miraculand.preset = miracPreset;
  
  // beast vendor (Orc Hunter's Tribe) - check which preset is selected
  const beastPreset = root.querySelector('input[name="beast-preset"]:checked')?.value || 'meat-only';
  if (beastPreset === 'none') {
    cookingState.vendors.beast.meatEnabled = false;
    cookingState.vendors.beast.meatRate = 0;
    cookingState.vendors.beast.vegetableEnabled = false;
    cookingState.vendors.beast.vegetableRate = 0;
    cookingState.vendors.beast.spiceEnabled = false;
    cookingState.vendors.beast.spiceRate = 0;
  } else if (beastPreset === 'meat-only') {
    cookingState.vendors.beast.meatEnabled = true;
    cookingState.vendors.beast.meatRate = 1.00;
    cookingState.vendors.beast.vegetableEnabled = false;
    cookingState.vendors.beast.vegetableRate = 0;
    cookingState.vendors.beast.spiceEnabled = false;
    cookingState.vendors.beast.spiceRate = 0;
  } else if (beastPreset === 'meat-vegetable') {
    cookingState.vendors.beast.meatEnabled = true;
    cookingState.vendors.beast.meatRate = 0.7222;
    cookingState.vendors.beast.vegetableEnabled = true;
    cookingState.vendors.beast.vegetableRate = 0.2778;
    cookingState.vendors.beast.spiceEnabled = false;
    cookingState.vendors.beast.spiceRate = 0;
  } else { // all-three
    cookingState.vendors.beast.meatEnabled = true;
    cookingState.vendors.beast.meatRate = 0.65;
    cookingState.vendors.beast.vegetableEnabled = true;
    cookingState.vendors.beast.vegetableRate = 0.25;
    cookingState.vendors.beast.spiceEnabled = true;
    cookingState.vendors.beast.spiceRate = 0.10;
  }
  cookingState.vendors.beast.preset = beastPreset;

  // witch vendor (Witch Alchemy Store) - check which preset is selected
  const witchPreset = root.querySelector('input[name="witch-preset"]:checked')?.value || 'meat-only';
  if (witchPreset === 'none') {
    cookingState.vendors.witch.meatEnabled = false;
    cookingState.vendors.witch.meatRate = 0;
    cookingState.vendors.witch.vegetableEnabled = false;
    cookingState.vendors.witch.vegetableRate = 0;
    cookingState.vendors.witch.spiceEnabled = false;
    cookingState.vendors.witch.spiceRate = 0;
  } else if (witchPreset === 'meat-only') {
    cookingState.vendors.witch.meatEnabled = true;
    cookingState.vendors.witch.meatRate = 1.00;
    cookingState.vendors.witch.vegetableEnabled = false;
    cookingState.vendors.witch.vegetableRate = 0;
    cookingState.vendors.witch.spiceEnabled = false;
    cookingState.vendors.witch.spiceRate = 0;
  } else if (witchPreset === 'meat-vegetable') {
    cookingState.vendors.witch.meatEnabled = true;
    cookingState.vendors.witch.meatRate = 0.7222;
    cookingState.vendors.witch.vegetableEnabled = true;
    cookingState.vendors.witch.vegetableRate = 0.2778;
    cookingState.vendors.witch.spiceEnabled = false;
    cookingState.vendors.witch.spiceRate = 0;
  } else { // all-three
    cookingState.vendors.witch.meatEnabled = true;
    cookingState.vendors.witch.meatRate = 0.65;
    cookingState.vendors.witch.vegetableEnabled = true;
    cookingState.vendors.witch.vegetableRate = 0.25;
    cookingState.vendors.witch.spiceEnabled = true;
    cookingState.vendors.witch.spiceRate = 0.10;
  }
  cookingState.vendors.witch.preset = witchPreset;

  // supply orders per hour
  cookingState.shop.supplyOrdersPerHour = parseInt(root.querySelector('#supply-orders-per-hour')?.value) || 30;
  
  saveCookingToStorage();
}

function updateShopState(root) {
  // supply deals
  cookingState.shop.supplyDeals.enabled = root.querySelector('#shop-supply-enabled')?.checked ?? true;
  cookingState.shop.supplyDeals.quantity = parseInt(root.querySelector('#shop-supply-qty')?.value) || 0;
  
  // vegetable purchase
  cookingState.shop.vegetablePurchase.enabled = root.querySelector('#shop-vegetable-enabled')?.checked ?? true;
  cookingState.shop.vegetablePurchase.quantity = parseInt(root.querySelector('#shop-vegetable-qty')?.value) || 0;
  
  // spice purchase
  cookingState.shop.spicePurchase.enabled = root.querySelector('#shop-spice-enabled')?.checked ?? false;
  cookingState.shop.spicePurchase.quantity = parseInt(root.querySelector('#shop-spice-qty')?.value) || 0;
  
  // miraculand vegetable purchase
  cookingState.shop.miracVegetablePurchase.enabled = root.querySelector('#shop-mirac-vegetable-enabled')?.checked ?? false;
  cookingState.shop.miracVegetablePurchase.quantity = parseInt(root.querySelector('#shop-mirac-vegetable-qty')?.value) || 0;
  
  // miraculand spice purchase
  cookingState.shop.miracSpicePurchase.enabled = root.querySelector('#shop-mirac-spice-enabled')?.checked ?? false;
  cookingState.shop.miracSpicePurchase.quantity = parseInt(root.querySelector('#shop-mirac-spice-qty')?.value) || 0;
  
  // orc vegetable purchase
  cookingState.shop.beastVegetablePurchase.enabled = root.querySelector('#shop-beast-vegetable-enabled')?.checked ?? false;
  cookingState.shop.beastVegetablePurchase.quantity = parseInt(root.querySelector('#shop-beast-vegetable-qty')?.value) || 0;
  
  // orc spice purchase
  cookingState.shop.beastSpicePurchase.enabled = root.querySelector('#shop-beast-spice-enabled')?.checked ?? false;
  cookingState.shop.beastSpicePurchase.quantity = parseInt(root.querySelector('#shop-beast-spice-qty')?.value) || 0;

  // witch vegetable purchase
  cookingState.shop.witchVegetablePurchase.enabled = root.querySelector('#shop-witch-vegetable-enabled')?.checked ?? false;
  cookingState.shop.witchVegetablePurchase.quantity = parseInt(root.querySelector('#shop-witch-vegetable-qty')?.value) || 0;

  // witch spice purchase
  cookingState.shop.witchSpicePurchase.enabled = root.querySelector('#shop-witch-spice-enabled')?.checked ?? false;
  cookingState.shop.witchSpicePurchase.quantity = parseInt(root.querySelector('#shop-witch-spice-qty')?.value) || 0;

  // skill books purchase
  cookingState.shop.skillBooks.enabled = root.querySelector('#shop-skillbooks-enabled')?.checked ?? false;
  cookingState.shop.skillBooks.quantity = parseInt(root.querySelector('#shop-skillbooks-qty')?.value) || 0;
  cookingState.shop.skillBooks.level = parseInt(root.querySelector('#shop-skillbooks-level')?.value) || 1;
  
  // Update cost based on level
  if (cookingState.shop.skillBooks.level === 3) {
    cookingState.shop.skillBooks.cost = 15000;
  } else if (cookingState.shop.skillBooks.level === 2) {
    cookingState.shop.skillBooks.cost = 10000;
  } else {
    cookingState.shop.skillBooks.cost = 5000;
  }
  
  // Update the price display in the UI
  const priceDisplay = root.querySelector('#shop-skillbooks-price');
  if (priceDisplay) {
    priceDisplay.textContent = cookingState.shop.skillBooks.cost.toLocaleString() + 'g';
  }
  
  saveCookingToStorage();
}

// ============== CALCULATIONS ==============

/**
 * Shared phase-based sequencing algorithm
 * Used by both Daily Summary and Strategy Summary for consistency
 * @param {Object} ingredients - Available ingredients (clownMeat, clownVegetable, etc.)
 * @param {Array} availableDishes - List of enabled dishes with recipe data
 * @returns {Object} - { sequence: [...], remaining: {...}, totalGold: number, stewValue: number }
 */
function calculatePhaseBasedSequence(ingredients, availableDishes) {
  const productionSteps = [];
  let remaining = { ...ingredients };
  let totalGold = 0;
  let stepNumber = 1;
  
// PHASE 1: Vegetable recipes (sorted by g/order)
  // These recipes use vegetables, so we prioritize them to avoid wasting high-value veggies
  const vegetableDishes = availableDishes.filter(d => {
    const r = d.recipe;
    return (r.clownVegetable > 0 || r.miracVegetable > 0 || r.beastVegetable > 0);
  }).sort((a, b) => b.goldPerOrder - a.goldPerOrder);
  
  for (const dish of vegetableDishes) {
    const recipe = dish.recipe;
    
    // Check if we have enough ingredients
    if (remaining.clownMeat < recipe.clownMeat) continue;
    if (remaining.clownVegetable < recipe.clownVegetable) continue;
    if (remaining.clownSpice < recipe.clownSpice) continue;
    if (remaining.miracMeat < recipe.miracMeat) continue;
    if (remaining.miracVegetable < recipe.miracVegetable) continue;
    if (remaining.miracSpice < recipe.miracSpice) continue;
    if (remaining.beastMeat < recipe.beastMeat) continue;
    if (remaining.beastVegetable < recipe.beastVegetable) continue;
    if (remaining.beastSpice < recipe.beastSpice) continue;
    if (remaining.witchMeat < recipe.witchMeat) continue;
    if (remaining.witchVegetable < recipe.witchVegetable) continue;
    if (remaining.witchSpice < recipe.witchSpice) continue;

    // Calculate how many we can make
    const limits = [];
    if (recipe.clownMeat > 0) limits.push(Math.floor(remaining.clownMeat / recipe.clownMeat));
    if (recipe.clownVegetable > 0) limits.push(Math.floor(remaining.clownVegetable / recipe.clownVegetable));
    if (recipe.clownSpice > 0) limits.push(Math.floor(remaining.clownSpice / recipe.clownSpice));
    if (recipe.miracMeat > 0) limits.push(Math.floor(remaining.miracMeat / recipe.miracMeat));
    if (recipe.miracVegetable > 0) limits.push(Math.floor(remaining.miracVegetable / recipe.miracVegetable));
    if (recipe.miracSpice > 0) limits.push(Math.floor(remaining.miracSpice / recipe.miracSpice));
    if (recipe.beastMeat > 0) limits.push(Math.floor(remaining.beastMeat / recipe.beastMeat));
    if (recipe.beastVegetable > 0) limits.push(Math.floor(remaining.beastVegetable / recipe.beastVegetable));
    if (recipe.beastSpice > 0) limits.push(Math.floor(remaining.beastSpice / recipe.beastSpice));
    if (recipe.witchMeat > 0) limits.push(Math.floor(remaining.witchMeat / recipe.witchMeat));
    if (recipe.witchVegetable > 0) limits.push(Math.floor(remaining.witchVegetable / recipe.witchVegetable));
    if (recipe.witchSpice > 0) limits.push(Math.floor(remaining.witchSpice / recipe.witchSpice));
    
    const maxQuantity = limits.length > 0 ? Math.min(...limits) : 0;
    if (maxQuantity === 0) continue;
    
    const totalValue = maxQuantity * dish.state.price;
    
    // Determine limiting ingredient
    let limitedBy = 'Ingredient';
    const limitDetails = [];
    if (recipe.clownMeat > 0) limitDetails.push({ name: 'Meat', qty: remaining.clownMeat / recipe.clownMeat });
    if (recipe.clownVegetable > 0) limitDetails.push({ name: 'Vegetable', qty: remaining.clownVegetable / recipe.clownVegetable });
    if (recipe.clownSpice > 0) limitDetails.push({ name: 'Spice', qty: remaining.clownSpice / recipe.clownSpice });
    if (recipe.miracMeat > 0) limitDetails.push({ name: 'Meat', qty: remaining.miracMeat / recipe.miracMeat });
    if (recipe.miracVegetable > 0) limitDetails.push({ name: 'Vegetable', qty: remaining.miracVegetable / recipe.miracVegetable });
    if (recipe.miracSpice > 0) limitDetails.push({ name: 'Spice', qty: remaining.miracSpice / recipe.miracSpice });
    if (recipe.beastMeat > 0) limitDetails.push({ name: 'Meat', qty: remaining.beastMeat / recipe.beastMeat });
    if (recipe.beastVegetable > 0) limitDetails.push({ name: 'Vegetable', qty: remaining.beastVegetable / recipe.beastVegetable });
    if (recipe.beastSpice > 0) limitDetails.push({ name: 'Spice', qty: remaining.beastSpice / recipe.beastSpice });
    if (recipe.witchMeat > 0) limitDetails.push({ name: 'Meat', qty: remaining.witchMeat / recipe.witchMeat });
    if (recipe.witchVegetable > 0) limitDetails.push({ name: 'Vegetable', qty: remaining.witchVegetable / recipe.witchVegetable });
    if (recipe.witchSpice > 0) limitDetails.push({ name: 'Spice', qty: remaining.witchSpice / recipe.witchSpice });
    
    if (limitDetails.length > 0) {
      limitDetails.sort((a, b) => a.qty - b.qty);
      limitedBy = limitDetails[0].name;
    }
    
    // Add to production steps
    productionSteps.push({
      step: stepNumber++,
      name: dish.name,
      quantity: maxQuantity,
      gold: totalValue,
      note: `Limited by ${limitedBy}`,
      phase: 'Phase 1'
    });
    
    totalGold += totalValue;
    
    // Update remaining ingredients
    remaining.clownMeat -= maxQuantity * recipe.clownMeat;
    remaining.clownVegetable -= maxQuantity * recipe.clownVegetable;
    remaining.clownSpice -= maxQuantity * recipe.clownSpice;
    remaining.miracMeat -= maxQuantity * recipe.miracMeat;
    remaining.miracVegetable -= maxQuantity * recipe.miracVegetable;
    remaining.miracSpice -= maxQuantity * recipe.miracSpice;
    remaining.beastMeat -= maxQuantity * recipe.beastMeat;
    remaining.beastVegetable -= maxQuantity * recipe.beastVegetable;
    remaining.beastSpice -= maxQuantity * recipe.beastSpice;
    remaining.witchMeat -= maxQuantity * recipe.witchMeat;
    remaining.witchVegetable -= maxQuantity * recipe.witchVegetable;
    remaining.witchSpice -= maxQuantity * recipe.witchSpice;
  }

  // PHASE 2: Meat-only recipes (sorted by g/order)
  // These use excess meat that wasn't needed for vegetable recipes
  const meatOnlyDishes = availableDishes.filter(d => {
    const r = d.recipe;
    const hasMeat = (r.clownMeat > 0 || r.miracMeat > 0 || r.beastMeat > 0 || r.witchMeat > 0);
    const hasVeggie = (r.clownVegetable > 0 || r.miracVegetable > 0 || r.beastVegetable > 0 || r.witchVegetable > 0);
    const hasSpice = (r.clownSpice > 0 || r.miracSpice > 0 || r.beastSpice > 0 || r.witchSpice > 0);
    return hasMeat && !hasVeggie && !hasSpice;
  }).sort((a, b) => b.goldPerOrder - a.goldPerOrder);
  
  for (const dish of meatOnlyDishes) {
    const recipe = dish.recipe;
    
    // Check if we have enough ingredients
    if (remaining.clownMeat < recipe.clownMeat) continue;
    if (remaining.miracMeat < recipe.miracMeat) continue;
    if (remaining.beastMeat < recipe.beastMeat) continue;
    if (remaining.witchMeat < recipe.witchMeat) continue;

    // Calculate how many we can make
    const limits = [];
    if (recipe.clownMeat > 0) limits.push(Math.floor(remaining.clownMeat / recipe.clownMeat));
    if (recipe.miracMeat > 0) limits.push(Math.floor(remaining.miracMeat / recipe.miracMeat));
    if (recipe.beastMeat > 0) limits.push(Math.floor(remaining.beastMeat / recipe.beastMeat));
    if (recipe.witchMeat > 0) limits.push(Math.floor(remaining.witchMeat / recipe.witchMeat));
    
    const maxQuantity = limits.length > 0 ? Math.min(...limits) : 0;
    if (maxQuantity === 0) continue;
    
    const totalValue = maxQuantity * dish.state.price;
    
    // Add to production steps
    productionSteps.push({
      step: stepNumber++,
      name: dish.name,
      quantity: maxQuantity,
      gold: totalValue,
      note: 'Excess meat',
      phase: 'Phase 2'
    });
    
    totalGold += totalValue;
    
    // Update remaining ingredients
    remaining.clownMeat -= maxQuantity * recipe.clownMeat;
    remaining.miracMeat -= maxQuantity * recipe.miracMeat;
    remaining.beastMeat -= maxQuantity * recipe.beastMeat;
    remaining.witchMeat -= maxQuantity * recipe.witchMeat;
  }

  // Ensure no negative values
  for (const key of Object.keys(remaining)) {
    remaining[key] = Math.max(0, remaining[key]);
  }
  
  // Calculate Mega Stew value for remaining ingredients
  const totalRemaining = Object.values(remaining).reduce((a, b) => a + b, 0);
  
  let stewValue = 
    remaining.clownMeat * MEGA_STEW_VALUES.clownMeat +
    remaining.clownVegetable * MEGA_STEW_VALUES.clownVegetable +
    remaining.clownSpice * MEGA_STEW_VALUES.clownSpice +
    remaining.miracMeat * MEGA_STEW_VALUES.miracMeat +
    remaining.miracVegetable * MEGA_STEW_VALUES.miracVegetable +
    remaining.miracSpice * MEGA_STEW_VALUES.miracSpice +
    remaining.beastMeat * MEGA_STEW_VALUES.beastMeat +
    remaining.beastVegetable * MEGA_STEW_VALUES.beastVegetable +
    remaining.beastSpice * MEGA_STEW_VALUES.beastSpice +
    remaining.witchMeat * MEGA_STEW_VALUES.witchMeat +
    remaining.witchVegetable * MEGA_STEW_VALUES.witchVegetable +
    remaining.witchSpice * MEGA_STEW_VALUES.witchSpice;
  
  return {
    sequence: productionSteps,
    remaining,
    totalRemaining,
    totalGold,
    stewValue
  };
}

function recalculateCooking() {
  const root = document.getElementById('cookingCalculator');
  if (!root) return;
  
  const results = [];
  const clown = cookingState.vendors.clown;
  const mirac = cookingState.vendors.miraculand;
  const beast = cookingState.vendors.beast;
  const witch = cookingState.vendors.witch;

  // calculate supply order costs per ingredient
  const supplyOrderCosts = {
    clownMeat: clown.meatEnabled && clown.meatRate > 0 ? 1 / clown.meatRate : Infinity,
    clownVegetable: clown.vegetableEnabled && clown.vegetableRate > 0 ? 1 / clown.vegetableRate : Infinity,
    clownSpice: clown.spiceEnabled && clown.spiceRate > 0 ? 1 / clown.spiceRate : Infinity,
    miracMeat: mirac.meatEnabled && mirac.meatRate > 0 ? 1 / mirac.meatRate : Infinity,
    miracVegetable: mirac.vegetableEnabled && mirac.vegetableRate > 0 ? 1 / mirac.vegetableRate : Infinity,
    miracSpice: mirac.spiceEnabled && mirac.spiceRate > 0 ? 1 / mirac.spiceRate : Infinity,
    beastMeat: beast.meatEnabled && beast.meatRate > 0 ? 1 / beast.meatRate : Infinity,
    beastVegetable: beast.vegetableEnabled && beast.vegetableRate > 0 ? 1 / beast.vegetableRate : Infinity,
    beastSpice: beast.spiceEnabled && beast.spiceRate > 0 ? 1 / beast.spiceRate : Infinity,
    witchMeat: witch.meatEnabled && witch.meatRate > 0 ? 1 / witch.meatRate : Infinity,
    witchVegetable: witch.vegetableEnabled && witch.vegetableRate > 0 ? 1 / witch.vegetableRate : Infinity,
    witchSpice: witch.spiceEnabled && witch.spiceRate > 0 ? 1 / witch.spiceRate : Infinity
  };
  
  // average gold per supply order for calculating ingredient values
  // we'll calculate this iteratively
  
  for (const [id, state] of Object.entries(cookingState.recipes)) {
    if (!state.enabled) continue;
    
    const recipe = COOKING_RECIPES[id];
    const price = state.price;
    
    // determine which vendor to use based on recipe ingredients
    const usesClown = recipe.clownMeat > 0 || recipe.clownVegetable > 0 || recipe.clownSpice > 0;
    const usesMirac = recipe.miracMeat > 0 || recipe.miracVegetable > 0 || recipe.miracSpice > 0;
    const usesBeast = recipe.beastMeat > 0 || recipe.beastVegetable > 0 || recipe.beastSpice > 0;
    const usesWitch = recipe.witchMeat > 0 || recipe.witchVegetable > 0 || recipe.witchSpice > 0;
    
    // calculate supply orders needed for each ingredient
    let ordersNeeded = [];
    let limitingIngredient = "None";
    
    if (usesClown) {
      if (recipe.clownMeat > 0) ordersNeeded.push({ type: 'Clown Meat', orders: recipe.clownMeat * supplyOrderCosts.clownMeat });
      if (recipe.clownVegetable > 0) ordersNeeded.push({ type: 'Clown Vegetable', orders: recipe.clownVegetable * supplyOrderCosts.clownVegetable });
      if (recipe.clownSpice > 0) ordersNeeded.push({ type: 'Clown Spice', orders: recipe.clownSpice * supplyOrderCosts.clownSpice });
    }
    
    if (usesMirac) {
      if (recipe.miracMeat > 0) ordersNeeded.push({ type: 'Mirac Meat', orders: recipe.miracMeat * supplyOrderCosts.miracMeat });
      if (recipe.miracVegetable > 0) ordersNeeded.push({ type: 'Mirac Vegetable', orders: recipe.miracVegetable * supplyOrderCosts.miracVegetable });
      if (recipe.miracSpice > 0) ordersNeeded.push({ type: 'Mirac Spice', orders: recipe.miracSpice * supplyOrderCosts.miracSpice });
    }
    
    if (usesBeast) {
      if (recipe.beastMeat > 0) ordersNeeded.push({ type: 'Beast Meat', orders: recipe.beastMeat * supplyOrderCosts.beastMeat });
      if (recipe.beastVegetable > 0) ordersNeeded.push({ type: 'Beast Vegetable', orders: recipe.beastVegetable * supplyOrderCosts.beastVegetable });
      if (recipe.beastSpice > 0) ordersNeeded.push({ type: 'Beast Spice', orders: recipe.beastSpice * supplyOrderCosts.beastSpice });
    }

    if (usesWitch) {
      if (recipe.witchMeat > 0) ordersNeeded.push({ type: 'Witch Meat', orders: recipe.witchMeat * supplyOrderCosts.witchMeat });
      if (recipe.witchVegetable > 0) ordersNeeded.push({ type: 'Witch Vegetable', orders: recipe.witchVegetable * supplyOrderCosts.witchVegetable });
      if (recipe.witchSpice > 0) ordersNeeded.push({ type: 'Witch Spice', orders: recipe.witchSpice * supplyOrderCosts.witchSpice });
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
    
    // calculate byproducts only for vendors that the recipe actually uses
    let byproductValue = 0;
    
    // 1. Calculate Clown Byproducts (only if recipe uses Clown ingredients)
    if (usesClown && (clown.meatEnabled || clown.vegetableEnabled || clown.spiceEnabled)) {
      const expectedMeat = totalOrders * clown.meatRate;
      const expectedVegetable = totalOrders * clown.vegetableRate;
      const expectedSpice = totalOrders * clown.spiceRate;
      
      // Subtract what the recipe consumes (defaults to 0 if ingredient not used)
      const excessMeat = Math.max(0, expectedMeat - recipe.clownMeat);
      const excessVegetable = Math.max(0, expectedVegetable - recipe.clownVegetable);
      const excessSpice = Math.max(0, expectedSpice - recipe.clownSpice);
      
      byproductValue += 
        excessMeat * MEGA_STEW_VALUES.clownMeat +
        excessVegetable * MEGA_STEW_VALUES.clownVegetable +
        excessSpice * MEGA_STEW_VALUES.clownSpice;
    }
    
    // 2. Calculate Miraculand Byproducts (only if recipe uses Mirac ingredients)
    if (usesMirac && (mirac.meatEnabled || mirac.vegetableEnabled || mirac.spiceEnabled)) {
      const expectedMiracMeat = totalOrders * mirac.meatRate;
      const expectedMiracVegetable = totalOrders * mirac.vegetableRate;
      const expectedMiracSpice = totalOrders * mirac.spiceRate;
      
      const excessMiracMeat = Math.max(0, expectedMiracMeat - recipe.miracMeat);
      const excessMiracVegetable = Math.max(0, expectedMiracVegetable - recipe.miracVegetable);
      const excessMiracSpice = Math.max(0, expectedMiracSpice - recipe.miracSpice);
      
      byproductValue += 
        excessMiracMeat * MEGA_STEW_VALUES.miracMeat +
        excessMiracVegetable * MEGA_STEW_VALUES.miracVegetable +
        excessMiracSpice * MEGA_STEW_VALUES.miracSpice;
    }
    
    // 3. Calculate Beast (Orc) Byproducts (only if recipe uses Beast ingredients)
    if (usesBeast && (beast.meatEnabled || beast.vegetableEnabled || beast.spiceEnabled)) {
      const expectedBeastMeat = totalOrders * beast.meatRate;
      const expectedBeastVegetable = totalOrders * beast.vegetableRate;
      const expectedBeastSpice = totalOrders * beast.spiceRate;

      const excessBeastMeat = Math.max(0, expectedBeastMeat - recipe.beastMeat);
      const excessBeastVegetable = Math.max(0, expectedBeastVegetable - recipe.beastVegetable);
      const excessBeastSpice = Math.max(0, expectedBeastSpice - recipe.beastSpice);

      byproductValue +=
        excessBeastMeat * MEGA_STEW_VALUES.beastMeat +
        excessBeastVegetable * MEGA_STEW_VALUES.beastVegetable +
        excessBeastSpice * MEGA_STEW_VALUES.beastSpice;
    }

    // 4. Calculate Witch Alchemy Byproducts (only if recipe uses Witch ingredients)
    if (usesWitch && (witch.meatEnabled || witch.vegetableEnabled || witch.spiceEnabled)) {
      const expectedWitchMeat = totalOrders * witch.meatRate;
      const expectedWitchVegetable = totalOrders * witch.vegetableRate;
      const expectedWitchSpice = totalOrders * witch.spiceRate;

      const excessWitchMeat = Math.max(0, expectedWitchMeat - recipe.witchMeat);
      const excessWitchVegetable = Math.max(0, expectedWitchVegetable - recipe.witchVegetable);
      const excessWitchSpice = Math.max(0, expectedWitchSpice - recipe.witchSpice);

      byproductValue +=
        excessWitchMeat * MEGA_STEW_VALUES.witchMeat +
        excessWitchVegetable * MEGA_STEW_VALUES.witchVegetable +
        excessWitchSpice * MEGA_STEW_VALUES.witchSpice;
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
      limiting: limitingIngredient.replace('Clown ', '').replace('Mirac ', '').replace('Beast ', '').replace('Witch ', ''),
      byproductValue,
      totalValue,
      goldPerOrder,
      goldPerHour,
      dishesPerHour,
      vendor: usesWitch ? 'Witch' : (usesBeast ? 'Orc' : (usesMirac ? 'Miraculand' : 'Clown'))
    });
  }
  
  // sort by gold per supply order descending
  results.sort((a, b) => b.goldPerOrder - a.goldPerOrder);
  cookingState.results = results;
  
  // update UI
  updateDailySummary(root);
  updateRankingTable(root, results);
  updateShopROI(root);
  updateStrategySummary(root, results);
  updateStewCalculator(root);
  updateBatchPlannerResults(root);
}

function updateRankingTable(root, results) {
  const tbody = root.querySelector('#cooking-ranking-body');
  if (!tbody) return;
  
  let html = '';
  results.forEach((r, i) => {
    const rank = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
    const vendorClass = r.vendor === 'Miraculand' ? 'mirac-row' : '';
    
    // Get vendor icon
    const vendorIcon = r.vendor === 'Clown' ? '🤡' : r.vendor === 'Miraculand' ? '🌴' : r.vendor === 'Witch' ? '🧙' : '👹';
    
    html += `
      <tr class="${vendorClass}">
        <td>${rank}</td>
        <td>${vendorIcon} ${r.name} <span class="stars">${'★'.repeat(r.stars)}</span></td>
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
  
  // Update recipe card rank badges
  updateRecipeRankBadges(root, results);
}

function updateRecipeRankBadges(root, results) {
  // Clear all existing rank badges first
  root.querySelectorAll('.recipe-rank').forEach(badge => {
    badge.textContent = '';
    badge.className = 'recipe-rank';
    badge.style.display = 'none';
  });
  
  // Update badges for ranked recipes
  results.forEach((r, i) => {
    const badge = root.querySelector(`.recipe-rank[data-recipe-rank="${r.id}"]`);
    if (badge) {
      const rank = i + 1;
      badge.textContent = `#${rank}`;
      badge.style.display = 'block';
      
      // Add special styling for top 3
      if (rank === 1) {
        badge.classList.add('rank-1');
      } else if (rank === 2) {
        badge.classList.add('rank-2');
      } else if (rank === 3) {
        badge.classList.add('rank-3');
      }
    }
  });
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
  const vegetableResult = root.querySelector('#shop-vegetable-result');
  const spiceResult = root.querySelector('#shop-spice-result');
  const miracVegetableResult = root.querySelector('#shop-mirac-vegetable-result');
  const miracSpiceResult = root.querySelector('#shop-mirac-spice-result');
  if (supplyResult) supplyResult.innerHTML = '';
  if (vegetableResult) vegetableResult.innerHTML = '';
  if (spiceResult) spiceResult.innerHTML = '';
  if (miracVegetableResult) miracVegetableResult.innerHTML = '';
  if (miracSpiceResult) miracSpiceResult.innerHTML = '';
  
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
  
  // vegetable purchase - value based on supply order savings
  if (shop.vegetablePurchase.enabled && shop.vegetablePurchase.quantity > 0) {
    const cost = shop.vegetablePurchase.quantity * shop.vegetablePurchase.cost;
    const orderCost = cookingState.vendors.clown.vegetableRate > 0 ? 1 / cookingState.vendors.clown.vegetableRate : 4;
    const value = shop.vegetablePurchase.quantity * orderCost * topGoldPerOrder;
    const profit = value - cost;
    const roi = cost > 0 ? ((value / cost - 1) * 100).toFixed(0) : 0;
    
    totalCost += cost;
    totalProfit += profit;
    
    const profitClass = profit >= 0 ? 'positive' : 'negative';
    html += `
      <div class="roi-item">
        <div class="roi-name">Vegetables (×${shop.vegetablePurchase.quantity})</div>
        <div class="roi-details">
          <span>Cost: ${cost.toLocaleString()}g</span>
          <span>Value: ${value.toFixed(0).toLocaleString()}g</span>
        </div>
        <div class="roi-result ${profitClass}">
          ${profit >= 0 ? '+' : ''}${profit.toFixed(0).toLocaleString()}g (${roi}% ROI)
        </div>
      </div>
    `;
    
    if (vegetableResult) vegetableResult.innerHTML = `<span class="${profitClass}">${profit >= 0 ? '+' : ''}${profit.toFixed(0).toLocaleString()}g (${roi}%)</span>`;
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
  
  // miraculand vegetable purchase - value based on supply order savings (using mirac vegetable rate)
  if (shop.miracVegetablePurchase.enabled && shop.miracVegetablePurchase.quantity > 0) {
    const cost = shop.miracVegetablePurchase.quantity * shop.miracVegetablePurchase.cost;
    const orderCost = cookingState.vendors.miraculand.vegetableRate > 0 ? 1 / cookingState.vendors.miraculand.vegetableRate : 3.6;
    const value = shop.miracVegetablePurchase.quantity * orderCost * topGoldPerOrder;
    const profit = value - cost;
    const roi = cost > 0 ? ((value / cost - 1) * 100).toFixed(0) : 0;
    
    totalCost += cost;
    totalProfit += profit;
    
    const profitClass = profit >= 0 ? 'positive' : 'negative';
    html += `
      <div class="roi-item">
        <div class="roi-name">Mirac Vegetables (×${shop.miracVegetablePurchase.quantity})</div>
        <div class="roi-details">
          <span>Cost: ${cost.toLocaleString()}g</span>
          <span>Value: ${value.toFixed(0).toLocaleString()}g</span>
        </div>
        <div class="roi-result ${profitClass}">
          ${profit >= 0 ? '+' : ''}${profit.toFixed(0).toLocaleString()}g (${roi}% ROI)
        </div>
      </div>
    `;
    
    if (miracVegetableResult) miracVegetableResult.innerHTML = `<span class="${profitClass}">${profit >= 0 ? '+' : ''}${profit.toFixed(0).toLocaleString()}g (${roi}%)</span>`;
  }
  
  // miraculand spice purchase - value based on mega stew
  if (shop.miracSpicePurchase.enabled && shop.miracSpicePurchase.quantity > 0) {
    const cost = shop.miracSpicePurchase.quantity * shop.miracSpicePurchase.cost;
    const value = shop.miracSpicePurchase.quantity * MEGA_STEW_VALUES.miracSpice;
    const profit = value - cost;
    const roi = cost > 0 ? ((value / cost - 1) * 100).toFixed(0) : 0;
    
    totalCost += cost;
    totalProfit += profit;
    
    const profitClass = profit >= 0 ? 'positive' : 'negative';
    html += `
      <div class="roi-item">
        <div class="roi-name">Mirac Spice (×${shop.miracSpicePurchase.quantity})</div>
        <div class="roi-details">
          <span>Cost: ${cost.toLocaleString()}g</span>
          <span>Value: ${value.toFixed(0).toLocaleString()}g</span>
        </div>
        <div class="roi-result ${profitClass}">
          ${profit >= 0 ? '+' : ''}${profit.toFixed(0).toLocaleString()}g (${roi}% ROI)
        </div>
      </div>
    `;
    
    if (miracSpiceResult) miracSpiceResult.innerHTML = `<span class="${profitClass}">${profit >= 0 ? '+' : ''}${profit.toFixed(0).toLocaleString()}g (${roi}%)</span>`;
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
  
  // Calculate optimal vendor by comparing all vendors' daily income
  const shop = cookingState.shop;
  const clown = cookingState.vendors.clown;
  const mirac = cookingState.vendors.miraculand;
  const beast = cookingState.vendors.beast;
  const witch = cookingState.vendors.witch;

  const baseOrdersPerHour = shop.supplyOrdersPerHour;
  const bonusOrders = shop.supplyDeals.enabled ? shop.supplyDeals.quantity * shop.supplyDeals.supplyOrdersEach : 0;
  const dailyOrders = (baseOrdersPerHour * 24) + bonusOrders;

  // Build list of available dishes
  const availableDishes = results.map(r => ({
    id: r.id,
    name: r.name,
    recipe: COOKING_RECIPES[r.id],
    state: cookingState.recipes[r.id],
    goldPerOrder: r.goldPerOrder
  }));
  
  // === CALCULATE CLOWN VENDOR SEQUENCE ===
  const clownIngredients = {
    clownMeat: dailyOrders * clown.meatRate,
    clownVegetable: dailyOrders * clown.vegetableRate + (shop.vegetablePurchase.enabled ? shop.vegetablePurchase.quantity : 0),
    clownSpice: dailyOrders * clown.spiceRate + (shop.spicePurchase.enabled ? shop.spicePurchase.quantity : 0),
    miracMeat: 0,
    miracVegetable: 0,
    miracSpice: 0,
    beastMeat: 0,
    beastVegetable: 0,
    beastSpice: 0,
    witchMeat: 0,
    witchVegetable: 0,
    witchSpice: 0
  };
  const clownResult = calculatePhaseBasedSequence(clownIngredients, availableDishes);
  
  // Calculate shop costs for Clown vendor
  let clownShopCosts = 0;
  if (shop.supplyDeals.enabled && shop.supplyDeals.quantity > 0) {
    clownShopCosts += shop.supplyDeals.quantity * shop.supplyDeals.cost;
  }
  if (shop.skillBooks.enabled && shop.skillBooks.quantity > 0) {
    clownShopCosts += shop.skillBooks.quantity * shop.skillBooks.cost;
  }
  if (shop.vegetablePurchase.enabled && shop.vegetablePurchase.quantity > 0) {
    clownShopCosts += shop.vegetablePurchase.quantity * shop.vegetablePurchase.cost;
  }
  if (shop.spicePurchase.enabled && shop.spicePurchase.quantity > 0) {
    clownShopCosts += shop.spicePurchase.quantity * shop.spicePurchase.cost;
  }
  
  const clownDailyGold = clownResult.totalGold + clownResult.stewValue - clownShopCosts;
  
  // === CALCULATE MIRACULAND VENDOR SEQUENCE ===
  const miracIngredients = {
    clownMeat: 0,
    clownVegetable: 0,
    clownSpice: 0,
    miracMeat: dailyOrders * mirac.meatRate,
    miracVegetable: dailyOrders * mirac.vegetableRate + (shop.miracVegetablePurchase.enabled ? shop.miracVegetablePurchase.quantity : 0),
    miracSpice: dailyOrders * mirac.spiceRate + (shop.miracSpicePurchase.enabled ? shop.miracSpicePurchase.quantity : 0),
    beastMeat: 0,
    beastVegetable: 0,
    beastSpice: 0,
    witchMeat: 0,
    witchVegetable: 0,
    witchSpice: 0
  };
  const miracResult = calculatePhaseBasedSequence(miracIngredients, availableDishes);
  
  // Calculate shop costs for Miraculand vendor
  let miracShopCosts = 0;
  if (shop.supplyDeals.enabled && shop.supplyDeals.quantity > 0) {
    miracShopCosts += shop.supplyDeals.quantity * shop.supplyDeals.cost;
  }
  if (shop.skillBooks.enabled && shop.skillBooks.quantity > 0) {
    miracShopCosts += shop.skillBooks.quantity * shop.skillBooks.cost;
  }
  if (shop.miracVegetablePurchase.enabled && shop.miracVegetablePurchase.quantity > 0) {
    miracShopCosts += shop.miracVegetablePurchase.quantity * shop.miracVegetablePurchase.cost;
  }
  if (shop.miracSpicePurchase.enabled && shop.miracSpicePurchase.quantity > 0) {
    miracShopCosts += shop.miracSpicePurchase.quantity * shop.miracSpicePurchase.cost;
  }
  
  const miracDailyGold = miracResult.totalGold + miracResult.stewValue - miracShopCosts;
  
  // === CALCULATE BEAST (ORC) VENDOR SEQUENCE ===
  const beastIngredients = {
    clownMeat: 0,
    clownVegetable: 0,
    clownSpice: 0,
    miracMeat: 0,
    miracVegetable: 0,
    miracSpice: 0,
    beastMeat: dailyOrders * beast.meatRate,
    beastVegetable: dailyOrders * beast.vegetableRate + (shop.beastVegetablePurchase.enabled ? shop.beastVegetablePurchase.quantity : 0),
    beastSpice: dailyOrders * beast.spiceRate + (shop.beastSpicePurchase.enabled ? shop.beastSpicePurchase.quantity : 0),
    witchMeat: 0,
    witchVegetable: 0,
    witchSpice: 0
  };
  const beastResult = calculatePhaseBasedSequence(beastIngredients, availableDishes);

  // Calculate shop costs for Beast vendor
  let beastShopCosts = 0;
  if (shop.supplyDeals.enabled && shop.supplyDeals.quantity > 0) {
    beastShopCosts += shop.supplyDeals.quantity * shop.supplyDeals.cost;
  }
  if (shop.skillBooks.enabled && shop.skillBooks.quantity > 0) {
    beastShopCosts += shop.skillBooks.quantity * shop.skillBooks.cost;
  }
  if (shop.beastVegetablePurchase.enabled && shop.beastVegetablePurchase.quantity > 0) {
    beastShopCosts += shop.beastVegetablePurchase.quantity * shop.beastVegetablePurchase.cost;
  }
  if (shop.beastSpicePurchase.enabled && shop.beastSpicePurchase.quantity > 0) {
    beastShopCosts += shop.beastSpicePurchase.quantity * shop.beastSpicePurchase.cost;
  }

  const beastDailyGold = beastResult.totalGold + beastResult.stewValue - beastShopCosts;

  // === CALCULATE WITCH VENDOR SEQUENCE ===
  const witchIngredients = {
    clownMeat: 0,
    clownVegetable: 0,
    clownSpice: 0,
    miracMeat: 0,
    miracVegetable: 0,
    miracSpice: 0,
    beastMeat: 0,
    beastVegetable: 0,
    beastSpice: 0,
    witchMeat: dailyOrders * witch.meatRate,
    witchVegetable: dailyOrders * witch.vegetableRate + (shop.witchVegetablePurchase.enabled ? shop.witchVegetablePurchase.quantity : 0),
    witchSpice: dailyOrders * witch.spiceRate + (shop.witchSpicePurchase.enabled ? shop.witchSpicePurchase.quantity : 0)
  };
  const witchResult = calculatePhaseBasedSequence(witchIngredients, availableDishes);

  // Calculate shop costs for Witch vendor
  let witchShopCosts = 0;
  if (shop.supplyDeals.enabled && shop.supplyDeals.quantity > 0) {
    witchShopCosts += shop.supplyDeals.quantity * shop.supplyDeals.cost;
  }
  if (shop.skillBooks.enabled && shop.skillBooks.quantity > 0) {
    witchShopCosts += shop.skillBooks.quantity * shop.skillBooks.cost;
  }
  if (shop.witchVegetablePurchase.enabled && shop.witchVegetablePurchase.quantity > 0) {
    witchShopCosts += shop.witchVegetablePurchase.quantity * shop.witchVegetablePurchase.cost;
  }
  if (shop.witchSpicePurchase.enabled && shop.witchSpicePurchase.quantity > 0) {
    witchShopCosts += shop.witchSpicePurchase.quantity * shop.witchSpicePurchase.cost;
  }

  const witchDailyGold = witchResult.totalGold + witchResult.stewValue - witchShopCosts;

  // === DETERMINE OPTIMAL VENDOR (compare all four) ===
  const vendorGolds = [
    { name: 'Clown', gold: clownDailyGold, result: clownResult, emoji: '🤡' },
    { name: 'Miraculand', gold: miracDailyGold, result: miracResult, emoji: '🌴' },
    { name: 'Orc', gold: beastDailyGold, result: beastResult, emoji: '👹' },
    { name: 'Witch', gold: witchDailyGold, result: witchResult, emoji: '🧙' }
  ];
  
  // Sort by gold descending to find optimal
  vendorGolds.sort((a, b) => b.gold - a.gold);
  
  const optimal = vendorGolds[0];
  const secondBest = vendorGolds[1];
  const optimalResult = optimal.result;
  const optimalVendor = optimal.name;
  const optimalGold = optimal.gold;
  const alternateGold = secondBest.gold;
  const goldDifference = Math.abs(optimalGold - alternateGold);
  
  // Extract top 3 recipes for display
  const optimalSequence = optimalResult.sequence.slice(0, 3).map(step => ({
    name: step.name,
    goldPerOrder: availableDishes.find(d => d.name === step.name)?.goldPerOrder || 0,
    phase: step.phase
  }));
  
  const remaining = optimalResult.remaining;
  
  // Build HTML showing optimal vendor comparison and sequence
  const vendorEmoji = optimal.emoji;
  const alternateVendor = secondBest.name;
  const comparisonColor = goldDifference > 0 ? '#2e7d32' : '#666';
  
  // Build vendor comparison rows showing all three
  const vendorComparisonRows = vendorGolds.map(v => {
    const isOptimal = v.name === optimalVendor;
    const style = isOptimal ? 'font-weight: bold; color: #2e7d32;' : 'color: #666;';
    return `<div style="${style}">${v.emoji} ${v.name}: ${Math.round(v.gold).toLocaleString()}g${isOptimal ? ' ✓' : ''}</div>`;
  }).join('');
  
  let html = `
    <div style="margin-bottom: 15px;">
      <div style="font-size: 1.1em; font-weight: bold; color: #4a4e69; margin-bottom: 8px;">
        ${vendorEmoji} Optimal: ${optimalVendor}
      </div>
      <div style="font-size: 0.9em; color: ${comparisonColor}; padding: 8px; background: #f0f7f0; border-radius: 4px; border-left: 3px solid #2e7d32;">
        <strong>+${goldDifference.toLocaleString()}g daily</strong> over ${alternateVendor}
        <div style="font-size: 0.85em; margin-top: 6px;">
          ${vendorComparisonRows}
        </div>
      </div>
    </div>
    <div style="font-size: 0.9em; color: #666; margin-bottom: 12px; padding: 8px; background: #f8f8f8; border-radius: 4px;">📋 Phase-based production order:</div>
  `;
  
  optimalSequence.forEach((dish, index) => {
    const isFirst = index === 0;
    html += `
      <div class="strategy-item ${isFirst ? 'best' : ''}">
        <div class="strategy-label">${isFirst ? '1️⃣ Start' : index === 1 ? '2️⃣ Then' : '3️⃣ Next'}</div>
        <div class="strategy-value">${dish.name}</div>
        <div class="strategy-detail">${dish.goldPerOrder.toFixed(1)} g/order • ${dish.phase}</div>
      </div>
    `;
  });
  
  const remainingTotal = Object.values(remaining).reduce((a, b) => a + b, 0);
  if (remainingTotal >= 10) {
    html += `
      <div class="strategy-item">
        <div class="strategy-label">♻️ Remaining →</div>
        <div class="strategy-value">Mega Stew</div>
        <div class="strategy-detail">Phase 3 • Leftovers</div>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

// Mega Stew Simulator State
let stewSimulationResults = [];
let stewChart = null;

// Ingredient ranges for mega stew
const INGREDIENT_RANGES = {
  clownMeat: { min: 10, max: 48, mid: 29.00 },
  clownVegetable: { min: 29, max: 144, mid: 86.50 },
  clownSpice: { min: 72, max: 240, mid: 156.00 },
  miracMeat: { min: 12, max: 60, mid: 36.00 },
  miracVegetable: { min: 36, max: 180, mid: 108 },
  miracSpice: { min: 90, max: 300, mid: 195.00 },
  beastMeat: { min: 16, max: 80, mid: 48.00 },
  beastVegetable: { min: 48, max: 240, mid: 144 },
  beastSpice: { min: 120, max: 400, mid: 260 },
  witchMeat: { min: 20, max: 100, mid: 60.00 },
  witchVegetable: { min: 60, max: 300, mid: 180 },   // estimated
  witchSpice: { min: 150, max: 500, mid: 325 }        // estimated
};

function updateStewCalculator(root) {
  const container = root.querySelector('#stew-calculator');
  if (!container) return;
  
  container.innerHTML = `
    <div style="width: 100%;">
      <div class="info-blurb" style="margin-bottom: 15px; font-size: 0.95em;">
        Uses the ingredient quantities entered above. Requires at least 100 ingredients total.
      </div>
      
      <!-- Ingredient Value Reference -->
      <div class="card card-md" style="margin-bottom: 20px;">
        <h5 style="margin: 0 0 10px 0; color: #4a4e69; text-align: center;">Mega Stew Value Ranges (per ingredient)</h5>
        
        <!-- Clown Vendor Row -->
        <div class="ingredient-row-clown" style="margin-bottom: 15px;">
          <div class="ingredient-row-label">🤡 Clown Vendor</div>
          <div class="ingredient-row">
            <div class="card card-md ingredient-card border-clown" style="text-align: center;">
              <div style="font-weight: bold; margin-bottom: 4px;">🥩 Meat</div>
              <div style="font-size: 0.85em; color: #666;">
                <div style="font-family: monospace; font-size: 0.9em; margin-bottom: 2px;">10 - 48 gold</div>
                <div>Expected: 29.00</div>
              </div>
            </div>
            
            <div class="card card-md ingredient-card border-clown" style="text-align: center;">
              <div style="font-weight: bold; margin-bottom: 4px;">🥬 Vegetable</div>
              <div style="font-size: 0.85em; color: #666;">
                <div style="font-family: monospace; font-size: 0.9em; margin-bottom: 2px;">29 - 144 gold</div>
                <div>Expected: 86.50</div>
              </div>
            </div>
            
            <div class="card card-md ingredient-card border-clown" style="text-align: center;">
              <div style="font-weight: bold; margin-bottom: 4px;">🌶️ Spice</div>
              <div style="font-size: 0.85em; color: #666;">
                <div style="font-family: monospace; font-size: 0.9em; margin-bottom: 2px;">72 - 240 gold</div>
                <div>Expected: 156.00</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Miraculand Vendor Row -->
        <div class="ingredient-row-mirac" style="margin-bottom: 15px;">
          <div class="ingredient-row-label">🎪 Miraculand Vendor</div>
          <div class="ingredient-row">
            <div class="card card-md ingredient-card border-mirac" style="text-align: center;">
              <div style="font-weight: bold; margin-bottom: 4px;">🥩 Meat</div>
              <div style="font-size: 0.85em; color: #666;">
                <div style="font-family: monospace; font-size: 0.9em; margin-bottom: 2px;">12 - 60 gold</div>
                <div>Expected: 36.00</div>
              </div>
            </div>
            
            <div class="card card-md ingredient-card border-mirac" style="text-align: center;">
              <div style="font-weight: bold; margin-bottom: 4px;">🥬 Vegetable</div>
              <div style="font-size: 0.85em; color: #666;">
                <div style="font-family: monospace; font-size: 0.9em; margin-bottom: 2px;">36 - 180 gold</div>
                <div>Expected: 108.00</div>
              </div>
            </div>
            
            <div class="card card-md ingredient-card border-mirac" style="text-align: center;">
              <div style="font-weight: bold; margin-bottom: 4px;">🌶️ Spice</div>
              <div style="font-size: 0.85em; color: #666;">
                <div style="font-family: monospace; font-size: 0.9em; margin-bottom: 2px;">90 - 300 gold</div>
                <div>Expected: 195.00</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Beast (Orc Hunter's Tribe) Vendor Row -->
        <div class="ingredient-row-beast" style="margin-bottom: 15px;">
          <div class="ingredient-row-label">👹 Orc Hunter's Tribe</div>
          <div class="ingredient-row">
            <div class="card card-md ingredient-card border-beast" style="text-align: center;">
              <div style="font-weight: bold; margin-bottom: 4px;">🥩 Meat</div>
              <div style="font-size: 0.85em; color: #666;">
                <div style="font-family: monospace; font-size: 0.9em; margin-bottom: 2px;">16 - 80 gold</div>
                <div>Expected: 48.00</div>
              </div>
            </div>

            <div class="card card-md ingredient-card border-beast" style="text-align: center;">
              <div style="font-weight: bold; margin-bottom: 4px;">🥬 Vegetable</div>
              <div style="font-size: 0.85em; color: #666;">
                <div style="font-family: monospace; font-size: 0.9em; margin-bottom: 2px;">48 - 240 gold</div>
                <div>Expected: 144.00</div>
              </div>
            </div>

            <div class="card card-md ingredient-card border-beast" style="text-align: center;">
              <div style="font-weight: bold; margin-bottom: 4px;">🌶️ Spice</div>
              <div style="font-size: 0.85em; color: #666;">
                <div style="font-family: monospace; font-size: 0.9em; margin-bottom: 2px;">120 - 400 gold</div>
                <div>Expected: 260.00</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Witch Alchemy Store Vendor Row -->
        <div class="ingredient-row-witch">
          <div class="ingredient-row-label">🧙 Witch Alchemy Store <span style="font-size: 0.8em; color: #888; font-style: italic;">(veg/spice values estimated)</span></div>
          <div class="ingredient-row">
            <div class="card card-md ingredient-card border-witch" style="text-align: center;">
              <div style="font-weight: bold; margin-bottom: 4px;">🥩 Meat</div>
              <div style="font-size: 0.85em; color: #666;">
                <div style="font-family: monospace; font-size: 0.9em; margin-bottom: 2px;">20 - 100 gold</div>
                <div>Expected: 60.00</div>
              </div>
            </div>

            <div class="card card-md ingredient-card border-witch" style="text-align: center;">
              <div style="font-weight: bold; margin-bottom: 4px;">🥬 Vegetable</div>
              <div style="font-size: 0.85em; color: #666;">
                <div style="font-family: monospace; font-size: 0.9em; margin-bottom: 2px;">~60 - 300 gold</div>
                <div>Est. Expected: 180.00</div>
              </div>
            </div>

            <div class="card card-md ingredient-card border-witch" style="text-align: center;">
              <div style="font-weight: bold; margin-bottom: 4px;">🌶️ Spice</div>
              <div style="font-size: 0.85em; color: #666;">
                <div style="font-family: monospace; font-size: 0.9em; margin-bottom: 2px;">~150 - 500 gold</div>
                <div>Est. Expected: 325.00</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Total Count -->
      <div style="text-align: center; font-size: 1em; color: #4a4e69; margin-bottom: 12px; padding: 8px; background: #f2e9e4; border-radius: 6px;" id="stew-total-count">
        Total Ingredients: <strong>0</strong> (minimum 100 required)
      </div>
      
      <!-- Warning -->
      <div style="background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 12px; border-radius: 6px; text-align: center; margin-bottom: 15px;" id="stew-min-warning">
        ⚠️ Mega Stew requires at least 100 ingredients!
      </div>
      
      <!-- Range Results -->
      <div class="grid grid-2 gap-md" style="margin-bottom: 20px;">
        <div class="card card-md">
          <h4 class="card-header">📊 Expected Range</h4>
          <div class="d-flex justify-between items-center" style="margin: 12px 0;">
            <div style="text-align: center;">
              <div style="font-size: 0.75em; color: #777; text-transform: uppercase; margin-bottom: 4px;">Minimum</div>
              <div style="font-size: 1.4em; font-weight: bold; color: #2e7d32;" id="stew-range-min">0</div>
            </div>
            <div class="range-bar"></div>
            <div style="text-align: center;">
              <div style="font-size: 0.75em; color: #777; text-transform: uppercase; margin-bottom: 4px;">Maximum</div>
              <div style="font-size: 1.4em; font-weight: bold; color: #c62828;" id="stew-range-max">0</div>
            </div>
          </div>
          <div style="text-align: center; margin-top: 15px;">
            <div style="text-align: center;">
              <div style="font-size: 0.75em; color: #777; text-transform: uppercase; margin-bottom: 4px;">Expected Value</div>
              <div style="font-size: 1.4em; font-weight: bold; color: #1565c0;" id="stew-range-mid">0</div>
            </div>
          </div>
        </div>
        
        <div class="card card-md">
          <h4 class="card-header">📈 Value Per Ingredient</h4>
          <div style="text-align: center; padding: 20px 10px;">
            <div style="font-size: 0.85em; color: #666; margin-bottom: 5px;">AVERAGE</div>
            <div style="font-size: 1.8em; font-weight: bold; color: #1565c0;" id="stew-per-ingredient">0.00</div>
            <div style="font-size: 0.85em; color: #666;">gold per ingredient</div>
          </div>
        </div>
      </div>
      
      <!-- Simulate Button -->
      <button class="btn btn-primary btn-gradient btn-full simulate-btn" id="stew-simulate-btn" disabled>
        🎲 Run 10,000 Simulations
      </button>
      
      <!-- Simulation Stats -->
      <div class="grid grid-3 gap-md" id="stew-sim-stats" style="display: none; margin-bottom: 25px;">
        <div class="card card-md text-center">
          <div style="font-size: 2rem; font-weight: bold; margin-bottom: 5px; color: #2e7d32;" id="stew-sim-min">-</div>
          <div style="color: #666; font-size: 0.9rem;">Sim Minimum</div>
        </div>
        <div class="card card-md text-center">
          <div style="font-size: 2rem; font-weight: bold; margin-bottom: 5px; color: #1565c0;" id="stew-sim-mean">-</div>
          <div style="color: #666; font-size: 0.9rem;">Sim Mean</div>
        </div>
        <div class="card card-md text-center">
          <div style="font-size: 2rem; font-weight: bold; margin-bottom: 5px; color: #c62828;" id="stew-sim-max">-</div>
          <div style="color: #666; font-size: 0.9rem;">Sim Maximum</div>
        </div>
      </div>
      
      <!-- Chart -->
      <div class="card card-lg" id="stew-chart-container" style="display: none; height: 600px; padding: 20px;">
        <canvas id="stewDistributionChart"></canvas>
      </div>
    </div>
  `;
  
  // Simulate button
  const simBtn = container.querySelector('#stew-simulate-btn');
  if (simBtn) {
    simBtn.addEventListener('click', () => runStewSimulation(root));
  }
  
  // Initial calculation
  calculateStewRanges(root);
}

function calculateStewRanges(root) {
  // Read from the shared ingredient inputs
  const ingredientContainer = root.querySelector('#cooking-ingredient-optimizer');
  if (!ingredientContainer) return;
  
  const quantities = {
    clownMeat: parseInt(ingredientContainer.querySelector('#current-clown-meat')?.value) || 0,
    clownVegetable: parseInt(ingredientContainer.querySelector('#current-clown-vegetable')?.value) || 0,
    clownSpice: parseInt(ingredientContainer.querySelector('#current-clown-spice')?.value) || 0,
    miracMeat: parseInt(ingredientContainer.querySelector('#current-mirac-meat')?.value) || 0,
    miracVegetable: parseInt(ingredientContainer.querySelector('#current-mirac-vegetable')?.value) || 0,
    miracSpice: parseInt(ingredientContainer.querySelector('#current-mirac-spice')?.value) || 0,
    beastMeat: parseInt(ingredientContainer.querySelector('#current-beast-meat')?.value) || 0,
    beastVegetable: parseInt(ingredientContainer.querySelector('#current-beast-vegetable')?.value) || 0,
    beastSpice: parseInt(ingredientContainer.querySelector('#current-beast-spice')?.value) || 0,
    witchMeat: parseInt(ingredientContainer.querySelector('#current-witch-meat')?.value) || 0,
    witchVegetable: parseInt(ingredientContainer.querySelector('#current-witch-vegetable')?.value) || 0,
    witchSpice: parseInt(ingredientContainer.querySelector('#current-witch-spice')?.value) || 0
  };

  const container = root.querySelector('#stew-calculator');
  if (!container) return;
  
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

// ============== ACCORDION STATE MANAGEMENT ==============

function getAccordionState(accordionId) {
  try {
    const saved = localStorage.getItem(`accordion-${accordionId}`);
    if (saved === null) {
      // Default states: vendor-config and current-inventory are open by default
      return accordionId === 'vendor-config' || accordionId === 'current-inventory';
    }
    return saved === 'true';
  } catch (e) {
    return accordionId === 'vendor-config' || accordionId === 'current-inventory';
  }
}

function saveAccordionState(accordionId, isOpen) {
  try {
    localStorage.setItem(`accordion-${accordionId}`, isOpen.toString());
  } catch (e) {
    console.warn('Could not save accordion state:', e);
  }
}

function toggleAccordion(headerElement) {
  const section = headerElement.parentElement;
  const accordionId = section.dataset.accordionId;
  
  section.classList.toggle('collapsed');
  
  // Save the new state (collapsed = false means open)
  const isOpen = !section.classList.contains('collapsed');
  if (accordionId) {
    saveAccordionState(accordionId, isOpen);
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
      if (parsed.batchPlanner) {
        cookingState.batchPlanner = { ...(cookingState.batchPlanner || {}), ...parsed.batchPlanner };
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
  const clownPreset = cookingState.vendors.clown?.preset || 'all-three';
  const clownRadio = root.querySelector(`input[name="clown-preset"][value="${clownPreset}"]`);
  if (clownRadio) clownRadio.checked = true;
  
  const miracPreset = cookingState.vendors.miraculand?.preset || 'meat-only';
  const miracRadio = root.querySelector(`input[name="mirac-preset"][value="${miracPreset}"]`);
  if (miracRadio) miracRadio.checked = true;
  
  const beastPreset = cookingState.vendors.beast?.preset || 'meat-only';
  const beastRadio = root.querySelector(`input[name="beast-preset"][value="${beastPreset}"]`);
  if (beastRadio) beastRadio.checked = true;

  const witchPreset = cookingState.vendors.witch?.preset || 'meat-only';
  const witchRadio = root.querySelector(`input[name="witch-preset"][value="${witchPreset}"]`);
  if (witchRadio) witchRadio.checked = true;

  // refresh daily summary vendor toggle
  const dailyVendor = cookingState.dailySummaryVendor || 'clown';
  const dailyVendorRadio = root.querySelector(`input[name="daily-vendor-select"][value="${dailyVendor}"]`);
  if (dailyVendorRadio) dailyVendorRadio.checked = true;
  
  const supplyOrdersInput = root.querySelector('#supply-orders-per-hour');
  if (supplyOrdersInput) supplyOrdersInput.value = cookingState.shop.supplyOrdersPerHour;
  
  // refresh shop UI
  const shop = cookingState.shop;
  root.querySelector('#shop-supply-enabled').checked = shop.supplyDeals.enabled;
  root.querySelector('#shop-supply-qty').value = shop.supplyDeals.quantity;
  
  root.querySelector('#shop-vegetable-enabled').checked = shop.vegetablePurchase.enabled;
  root.querySelector('#shop-vegetable-qty').value = shop.vegetablePurchase.quantity;
  
  root.querySelector('#shop-spice-enabled').checked = shop.spicePurchase.enabled;
  root.querySelector('#shop-spice-qty').value = shop.spicePurchase.quantity;
  
  const miracVegetableEnabled = root.querySelector('#shop-mirac-vegetable-enabled');
  const miracVegetableQty = root.querySelector('#shop-mirac-vegetable-qty');
  if (miracVegetableEnabled) miracVegetableEnabled.checked = shop.miracVegetablePurchase.enabled;
  if (miracVegetableQty) miracVegetableQty.value = shop.miracVegetablePurchase.quantity;

  const witchVegetableEnabled = root.querySelector('#shop-witch-vegetable-enabled');
  const witchVegetableQty = root.querySelector('#shop-witch-vegetable-qty');
  if (witchVegetableEnabled) witchVegetableEnabled.checked = shop.witchVegetablePurchase.enabled;
  if (witchVegetableQty) witchVegetableQty.value = shop.witchVegetablePurchase.quantity;

  const witchSpiceEnabled = root.querySelector('#shop-witch-spice-enabled');
  const witchSpiceQty = root.querySelector('#shop-witch-spice-qty');
  if (witchSpiceEnabled) witchSpiceEnabled.checked = shop.witchSpicePurchase.enabled;
  if (witchSpiceQty) witchSpiceQty.value = shop.witchSpicePurchase.quantity;

  const skillBooksEnabled = root.querySelector('#shop-skillbooks-enabled');
  const skillBooksQty = root.querySelector('#shop-skillbooks-qty');
  const skillBooksLevel = root.querySelector('#shop-skillbooks-level');
  if (skillBooksEnabled) skillBooksEnabled.checked = shop.skillBooks.enabled;
  if (skillBooksQty) skillBooksQty.value = shop.skillBooks.quantity;
  if (skillBooksLevel) skillBooksLevel.value = shop.skillBooks.level || 1;
  
  // Update the price display
  const priceDisplay = root.querySelector('#shop-skillbooks-price');
  if (priceDisplay) {
    const displayCost = (shop.skillBooks.level === 2) ? '10,000g' : '5,000g';
    priceDisplay.textContent = displayCost;
  }
  
  // refresh recipe UI
  for (const [id, state] of Object.entries(cookingState.recipes)) {
    const enabledBox = root.querySelector(`.recipe-enabled[data-recipe="${id}"]`);
    const starsSelect = root.querySelector(`.recipe-stars[data-recipe="${id}"]`);
    const priceInput = root.querySelector(`.recipe-price[data-recipe="${id}"]`);
    
    if (enabledBox) enabledBox.checked = state.enabled;
    if (starsSelect) starsSelect.value = state.stars;
    if (priceInput) priceInput.value = state.price;
  }
  
  // refresh current ingredients inventory
  const ing = cookingState.currentIngredients || {};
  const ingredientInputs = {
    'current-clown-meat': ing.clownMeat || 0,
    'current-clown-vegetable': ing.clownVegetable || 0,
    'current-clown-spice': ing.clownSpice || 0,
    'current-mirac-meat': ing.miracMeat || 0,
    'current-mirac-vegetable': ing.miracVegetable || 0,
    'current-mirac-spice': ing.miracSpice || 0,
    'current-beast-meat': ing.beastMeat || 0,
    'current-beast-vegetable': ing.beastVegetable || 0,
    'current-beast-spice': ing.beastSpice || 0,
    'current-witch-meat': ing.witchMeat || 0,
    'current-witch-vegetable': ing.witchVegetable || 0,
    'current-witch-spice': ing.witchSpice || 0
  };
  
  for (const [inputId, value] of Object.entries(ingredientInputs)) {
    const input = root.querySelector(`#${inputId}`);
    if (input) input.value = value;
  }

  refreshBatchPlannerUI(root);
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

// ============== EXPORT/IMPORT FUNCTIONALITY ==============

function exportCookingConfig() {
  // Create export object with version for future compatibility
  const exportData = {
    version: 1,
    timestamp: new Date().toISOString(),
    state: cookingState
  };
  
  try {
    // Convert to JSON, then base64
    const jsonString = JSON.stringify(exportData);
    const base64String = btoa(jsonString);
    
    // Show modal with the string
    showExportModal(base64String);
  } catch (error) {
    alert('Export failed: ' + error.message);
  }
}

function importCookingConfig(base64String) {
  const root = document.getElementById('cookingCalculator');
  if (!root) return;
  
  try {
    // Decode base64 to JSON
    const jsonString = atob(base64String.trim());
    const importedData = JSON.parse(jsonString);
    
    // Validate version
    if (!importedData.version) {
      throw new Error("Invalid configuration format - no version found");
    }
    
    if (importedData.version !== 1) {
      throw new Error(`Unsupported configuration version: ${importedData.version}`);
    }
    
    // Validate structure
    if (!importedData.state) {
      throw new Error("Invalid configuration format - no state data found");
    }
    
    if (!importedData.state.recipes || !importedData.state.vendors || !importedData.state.shop) {
      throw new Error("Invalid configuration format - missing required data");
    }
    
    // Import the state
    cookingState = importedData.state;
    
    // Refresh UI and recalculate
    refreshCookingUI(root);
    recalculateCooking();
    saveCookingToStorage();
    
    // Close modal and show success
    closeCookingModal();
    alert("✅ Configuration imported successfully!");
    
  } catch (error) {
    // Show error in the modal
    const errorDiv = document.getElementById('importError');
    if (errorDiv) {
      errorDiv.textContent = '❌ ' + error.message;
      errorDiv.style.display = 'block';
    }
  }
}

function showExportModal(base64String) {
  const modal = document.getElementById('exportModal');
  const textarea = document.getElementById('exportTextarea');
  
  if (modal && textarea) {
    textarea.value = base64String;
    modal.style.display = 'flex';
    
    // Select the text for easy copying
    textarea.select();
  }
}

function showImportModal() {
  const modal = document.getElementById('importModal');
  const textarea = document.getElementById('importTextarea');
  const errorDiv = document.getElementById('importError');
  
  if (modal && textarea) {
    // Clear previous content and errors
    textarea.value = '';
    if (errorDiv) {
      errorDiv.style.display = 'none';
      errorDiv.textContent = '';
    }
    
    modal.style.display = 'flex';
    
    // Focus on textarea
    setTimeout(() => textarea.focus(), 100);
  }
}

function closeCookingModal() {
  const exportModal = document.getElementById('exportModal');
  const importModal = document.getElementById('importModal');
  
  if (exportModal) exportModal.style.display = 'none';
  if (importModal) importModal.style.display = 'none';
}

function copyExportToClipboard() {
  const textarea = document.getElementById('exportTextarea');
  const copyBtn = document.getElementById('copyExportBtn');
  
  if (!textarea) return;
  
  // Select the text
  textarea.select();
  textarea.setSelectionRange(0, 99999); // For mobile devices
  
  // Try modern clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textarea.value)
      .then(() => {
        // Show success feedback
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        copyBtn.style.backgroundColor = '#4caf50';
        
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.style.backgroundColor = '';
        }, 2000);
      })
      .catch((err) => {
        // Fallback to execCommand
        fallbackCopyToClipboard(textarea, copyBtn);
      });
  } else {
    // Fallback for older browsers
    fallbackCopyToClipboard(textarea, copyBtn);
  }
}

function fallbackCopyToClipboard(textarea, copyBtn) {
  try {
    document.execCommand('copy');
    
    // Show success feedback
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✅ Copied!';
    copyBtn.style.backgroundColor = '#4caf50';
    
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.backgroundColor = '';
    }, 2000);
  } catch (err) {
    alert('Failed to copy to clipboard. Please copy the text manually.');
  }
}

function setupExportImportListeners(root) {
  // Export button
  const exportBtn = root.querySelector('#exportCookingConfig');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportCookingConfig);
  }
  
  // Import button
  const importBtn = root.querySelector('#importCookingConfig');
  if (importBtn) {
    importBtn.addEventListener('click', showImportModal);
  }
  
  // Copy button in export modal
  const copyBtn = document.getElementById('copyExportBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', copyExportToClipboard);
  }
  
  // Import button in import modal
  const doImportBtn = document.getElementById('doImportBtn');
  if (doImportBtn) {
    doImportBtn.addEventListener('click', () => {
      const textarea = document.getElementById('importTextarea');
      if (textarea && textarea.value.trim()) {
        importCookingConfig(textarea.value);
      } else {
        const errorDiv = document.getElementById('importError');
        if (errorDiv) {
          errorDiv.textContent = '❌ Please paste a configuration string';
          errorDiv.style.display = 'block';
        }
      }
    });
  }
  
  // Close modal when clicking outside
  const exportModal = document.getElementById('exportModal');
  const importModal = document.getElementById('importModal');
  
  if (exportModal) {
    exportModal.addEventListener('click', (e) => {
      if (e.target === exportModal) {
        closeCookingModal();
      }
    });
  }
  
  if (importModal) {
    importModal.addEventListener('click', (e) => {
      if (e.target === importModal) {
        closeCookingModal();
      }
    });
  }
  
  // ESC key to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCookingModal();
    }
  });
}

// ============== RANKING INFO TOGGLE ==============

function toggleRankingInfo() {
  const popup = document.getElementById('ranking-info-popup');
  if (popup) {
    popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
  }
}

// ============== RECIPE BATCH PLANNER ==============

const BATCH_VENDOR_STATE_KEY = { clown: 'clown', mirac: 'miraculand', beast: 'beast', witch: 'witch' };
const BATCH_VENDOR_LABEL = {
  clown: '🤡 Clown',
  mirac: '🌴 Miraculand',
  beast: '👹 Orc Hunter\'s Tribe',
  witch: '🧙 Witch Alchemy Store'
};
const BATCH_TYPE_ICON = { Meat: '🥩', Vegetable: '🥬', Spice: '🌶️' };
const BATCH_ALL_ING_KEYS = [
  'clownMeat', 'clownVegetable', 'clownSpice',
  'miracMeat', 'miracVegetable', 'miracSpice',
  'beastMeat', 'beastVegetable', 'beastSpice',
  'witchMeat', 'witchVegetable', 'witchSpice'
];

function getRecipeVendorPrefix(recipe) {
  if (recipe.clownMeat || recipe.clownVegetable || recipe.clownSpice) return 'clown';
  if (recipe.miracMeat || recipe.miracVegetable || recipe.miracSpice) return 'mirac';
  if (recipe.beastMeat || recipe.beastVegetable || recipe.beastSpice) return 'beast';
  if (recipe.witchMeat || recipe.witchVegetable || recipe.witchSpice) return 'witch';
  return null;
}

// Effective per-hour generation rate for each of the 12 ingredient keys,
// assuming ALL supply orders (base + supply-deal bonus) go to the given vendor,
// plus shop vegetable/spice purchases for that vendor (converted to hourly).
// Only the vendor's own prefix keys will be non-zero.
function computeVendorRatesPerHour(vendorPrefix) {
  const rates = {
    clownMeat: 0, clownVegetable: 0, clownSpice: 0,
    miracMeat: 0, miracVegetable: 0, miracSpice: 0,
    beastMeat: 0, beastVegetable: 0, beastSpice: 0,
    witchMeat: 0, witchVegetable: 0, witchSpice: 0
  };
  const shop = cookingState.shop;
  const vendorKey = BATCH_VENDOR_STATE_KEY[vendorPrefix];
  const vendor = cookingState.vendors[vendorKey];
  if (!vendor) return rates;

  const baseOrdersPerHour = Number(shop.supplyOrdersPerHour) || 0;
  const bonusOrdersPerDay = shop.supplyDeals && shop.supplyDeals.enabled
    ? (shop.supplyDeals.quantity || 0) * (shop.supplyDeals.supplyOrdersEach || 0)
    : 0;
  const effectiveOrdersPerHour = baseOrdersPerHour + bonusOrdersPerDay / 24;

  if (vendor.meatEnabled) rates[vendorPrefix + 'Meat'] = effectiveOrdersPerHour * (vendor.meatRate || 0);
  if (vendor.vegetableEnabled) rates[vendorPrefix + 'Vegetable'] = effectiveOrdersPerHour * (vendor.vegetableRate || 0);
  if (vendor.spiceEnabled) rates[vendorPrefix + 'Spice'] = effectiveOrdersPerHour * (vendor.spiceRate || 0);

  // Shop purchases (daily qty → hourly)
  const shopKeyMap = {
    clown: { veg: 'vegetablePurchase', spice: 'spicePurchase' },
    mirac: { veg: 'miracVegetablePurchase', spice: 'miracSpicePurchase' },
    beast: { veg: 'beastVegetablePurchase', spice: 'beastSpicePurchase' },
    witch: { veg: 'witchVegetablePurchase', spice: 'witchSpicePurchase' }
  };
  const m = shopKeyMap[vendorPrefix];
  if (m) {
    const vegShop = shop[m.veg];
    if (vegShop && vegShop.enabled) rates[vendorPrefix + 'Vegetable'] += (vegShop.quantity || 0) / 24;
    const spiceShop = shop[m.spice];
    if (spiceShop && spiceShop.enabled) rates[vendorPrefix + 'Spice'] += (spiceShop.quantity || 0) / 24;
  }

  return rates;
}

function computeBatchPlan(recipeId, quantity) {
  const recipe = COOKING_RECIPES[recipeId];
  if (!recipe || !(quantity > 0)) return null;

  const prefix = getRecipeVendorPrefix(recipe);
  if (!prefix) return null;

  const rates = computeVendorRatesPerHour(prefix);
  const types = ['Meat', 'Vegetable', 'Spice'];

  const required = {};
  const perHour = {};
  const unreachable = [];
  let bottleneck = null;
  let maxHours = 0;

  for (const t of types) {
    const k = prefix + t;
    const amount = recipe[k] || 0;
    if (amount <= 0) continue;
    required[k] = amount * quantity;
    const rateHr = rates[k] || 0;
    perHour[k] = rateHr;
    if (rateHr <= 0) {
      unreachable.push(k);
    } else {
      const hrs = required[k] / rateHr;
      if (hrs > maxHours) {
        maxHours = hrs;
        bottleneck = k;
      }
    }
  }

  const plan = {
    recipeId, recipe, quantity, prefix,
    required, perHour, bottleneck,
    timeHours: maxHours,
    unreachable,
    generated: {}
  };

  if (unreachable.length > 0) return plan;

  for (const t of types) {
    const k = prefix + t;
    const gen = (rates[k] || 0) * maxHours;
    if (gen > 0 || required[k]) {
      plan.generated[k] = gen;
    }
  }
  return plan;
}

function formatBatchTime(hours) {
  if (!(hours > 0)) return '—';
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins} min`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)} hours`;
  }
  const days = Math.floor(hours / 24);
  const remHours = Math.round(hours - days * 24);
  if (remHours === 0) return `${days}d`;
  return `${days}d ${remHours}h`;
}

function formatBatchNumber(v) {
  return Math.round(v).toLocaleString();
}

function buildBatchPlanner(root) {
  const container = root.querySelector('#cooking-batch-planner');
  if (!container) return;

  if (!cookingState.batchPlanner) {
    cookingState.batchPlanner = { recipeId: RECIPE_ORDER[0] || '', quantity: 10 };
  }
  const { recipeId, quantity } = cookingState.batchPlanner;

  const vendorGroups = { clown: [], mirac: [], beast: [], witch: [] };
  for (const id of RECIPE_ORDER) {
    const recipe = COOKING_RECIPES[id];
    if (!recipe) continue;
    const prefix = getRecipeVendorPrefix(recipe);
    if (prefix && vendorGroups[prefix]) vendorGroups[prefix].push({ id, name: recipe.name });
  }

  const optgroups = Object.entries(vendorGroups)
    .filter(([, items]) => items.length > 0)
    .map(([prefix, items]) => {
      const opts = items
        .map(r => `<option value="${r.id}" ${r.id === recipeId ? 'selected' : ''}>${r.name}</option>`)
        .join('');
      return `<optgroup label="${BATCH_VENDOR_LABEL[prefix]}">${opts}</optgroup>`;
    }).join('');

  const isCollapsed = getAccordionState('batch-planner') ? '' : ' collapsed';

  container.innerHTML = `
    <div class="panel${isCollapsed}" data-accordion-id="batch-planner" style="margin-bottom: 20px;">
      <div class="panel-header" onclick="toggleAccordion(this)">
        <span class="panel-toggle">▼</span>
        <h3 class="panel-title">⏱️ Recipe Batch Planner</h3>
      </div>
      <div class="panel-content">
        <div style="font-size: 0.9em; color: #666; margin-bottom: 12px;">
          Pick a recipe and target quantity — see how long it takes to gather ingredients at your current supply rate, and what to do with leftovers.
        </div>
        <div class="d-flex items-center gap-md" style="flex-wrap: wrap; margin-bottom: 15px;">
          <label style="display: flex; align-items: center; gap: 6px;">
            <span><strong>Recipe:</strong></span>
            <select id="batch-planner-recipe" class="form-control form-control-md" style="min-width: 220px;">
              ${optgroups}
            </select>
          </label>
          <label style="display: flex; align-items: center; gap: 6px;">
            <span><strong>Quantity:</strong></span>
            <input type="number" id="batch-planner-qty" value="${quantity}" min="1" max="9999" step="1" class="form-control form-control-md" style="width: 100px;">
          </label>
        </div>
        <div id="batch-planner-results"></div>
      </div>
    </div>
  `;
}

function updateBatchPlannerResults(root) {
  const container = root.querySelector('#batch-planner-results');
  if (!container) return;

  const state = cookingState.batchPlanner || {};
  const recipeId = state.recipeId;
  const quantity = Number(state.quantity) || 0;

  if (!recipeId || !COOKING_RECIPES[recipeId] || quantity <= 0) {
    container.innerHTML = `<div style="text-align: center; color: #666; padding: 10px;">Select a recipe and enter a quantity.</div>`;
    return;
  }

  const plan = computeBatchPlan(recipeId, quantity);
  if (!plan) {
    container.innerHTML = `<div style="text-align: center; color: #c62828; padding: 10px;">Unable to plan this recipe.</div>`;
    return;
  }

  const vendorLabel = BATCH_VENDOR_LABEL[plan.prefix];

  // Effective orders/hour includes base supply orders + (supply deal bonus / 24)
  const shop = cookingState.shop;
  const baseOrdersPerHour = Number(shop.supplyOrdersPerHour) || 0;
  const bonusOrdersPerDay = shop.supplyDeals && shop.supplyDeals.enabled
    ? (shop.supplyDeals.quantity || 0) * (shop.supplyDeals.supplyOrdersEach || 0)
    : 0;
  const effectiveOrdersPerHour = baseOrdersPerHour + bonusOrdersPerDay / 24;

  if (plan.unreachable.length > 0 || plan.timeHours <= 0) {
    const reasons = [];
    if (effectiveOrdersPerHour <= 0) {
      reasons.push('Set <strong>Supply Orders per Hour</strong> above 0 in the Vendor Configuration.');
    }
    for (const k of plan.unreachable) {
      const type = k.replace(plan.prefix, '');
      reasons.push(`${vendorLabel} is not producing <strong>${BATCH_TYPE_ICON[type]} ${type}</strong> — enable or purchase it, or adjust vendor rates.`);
    }
    container.innerHTML = `
      <div style="padding: 12px; background: var(--bg-alt); border-radius: 6px; border-left: 4px solid #c62828;">
        <strong style="color: #c62828;">⚠️ Unreachable with current config</strong>
        <ul style="margin: 6px 0 0 20px;">${reasons.map(r => `<li>${r}</li>`).join('')}</ul>
      </div>
    `;
    return;
  }

  const bottleneckType = plan.bottleneck.replace(plan.prefix, '');
  const bottleneckLabel = `${BATCH_TYPE_ICON[bottleneckType]} ${vendorLabel} ${bottleneckType}`;

  const reqRows = Object.entries(plan.required).map(([k, amt]) => {
    const type = k.replace(plan.prefix, '');
    const per = plan.perHour[k] || 0;
    const hrs = per > 0 ? amt / per : 0;
    const isBottleneck = k === plan.bottleneck;
    return `
      <div style="padding: 6px 0; ${isBottleneck ? 'color: #c62828;' : ''}">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="${isBottleneck ? 'font-weight: bold;' : ''}">
            ${BATCH_TYPE_ICON[type]} ${type}${isBottleneck ? ' <span style="font-size: 0.8em; font-weight: normal;">(bottleneck)</span>' : ''}
          </span>
          <span style="font-weight: ${isBottleneck ? 'bold' : 'normal'};">${formatBatchNumber(amt)} needed</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.8em; color: ${isBottleneck ? '#c62828' : '#888'}; margin-top: 2px;">
          <span>${per.toFixed(1)}/hr</span>
          <span>${formatBatchTime(hrs)}</span>
        </div>
      </div>
    `;
  }).join('');

  // Build available dishes once for the phase-based sequencer.
  const availableDishes = cookingState.results.map(r => ({
    id: r.id,
    name: r.name,
    recipe: COOKING_RECIPES[r.id],
    state: cookingState.recipes[r.id],
    goldPerOrder: r.goldPerOrder
  }));

  // --- Target scenario: what you earn while targeting this recipe ---
  // Start with ingredients generated during the gather window.
  const targetIngredients = {
    clownMeat: 0, clownVegetable: 0, clownSpice: 0,
    miracMeat: 0, miracVegetable: 0, miracSpice: 0,
    beastMeat: 0, beastVegetable: 0, beastSpice: 0,
    witchMeat: 0, witchVegetable: 0, witchSpice: 0
  };
  Object.assign(targetIngredients, plan.generated);
  // Deduct what the target recipe consumes.
  for (const k of BATCH_ALL_ING_KEYS) {
    const need = (plan.recipe[k] || 0) * quantity;
    if (need > 0) targetIngredients[k] = Math.max(0, targetIngredients[k] - need);
  }
  // Run the phase-based sequencer on what's left, excluding the target recipe itself.
  const fillerDishes = availableDishes.filter(d => d.id !== recipeId);
  const targetSeq = calculatePhaseBasedSequence(targetIngredients, fillerDishes);
  const fillers = targetSeq.sequence;
  const fillerGold = targetSeq.totalGold;
  const stewValue = targetSeq.stewValue;
  const residue = targetSeq.remaining;

  const recipeSaleGold = quantity * (cookingState.recipes[recipeId]?.price || plan.recipe.defaultPrice || 0);
  const totalGold = recipeSaleGold + fillerGold + stewValue;
  const days = plan.timeHours / 24;
  const goldPerDay = days > 0 ? totalGold / days : 0;

  const leftoverChips = Object.entries(residue)
    .filter(([, v]) => Math.round(v) > 0)
    .map(([k, v]) => {
      const prefix = k.startsWith('clown') ? 'clown' : k.startsWith('mirac') ? 'mirac' : k.startsWith('beast') ? 'beast' : 'witch';
      const type = k.replace(prefix, '');
      return `<span>${BATCH_TYPE_ICON[type]} ${type}: ${formatBatchNumber(v)}</span>`;
    }).join('');

  const fillersHtml = fillers.length > 0
    ? fillers.slice(0, 5).map(s => `
        <div class="daily-summary-row" style="padding: 6px 0;">
          <span><strong>${s.name}</strong></span>
          <span style="text-align: right;">
            <span style="font-weight: bold;">${s.quantity}×</span>
            <span style="color: #2e7d32; font-weight: bold; margin-left: 8px;">+${Math.round(s.gold).toLocaleString()}g</span>
          </span>
        </div>
      `).join('')
    : `<div style="text-align: center; color: #666; padding: 6px;">No filler recipes fit the leftover ingredients.</div>`;

  // --- Optimal comparison: for the same time window, check each vendor independently. ---
  const optimalByVendor = [];
  for (const prefix of ['clown', 'mirac', 'beast', 'witch']) {
    const rates = computeVendorRatesPerHour(prefix);
    const ing = {
      clownMeat: 0, clownVegetable: 0, clownSpice: 0,
      miracMeat: 0, miracVegetable: 0, miracSpice: 0,
      beastMeat: 0, beastVegetable: 0, beastSpice: 0,
      witchMeat: 0, witchVegetable: 0, witchSpice: 0
    };
    for (const k of BATCH_ALL_ING_KEYS) ing[k] = (rates[k] || 0) * plan.timeHours;
    const seq = calculatePhaseBasedSequence(ing, availableDishes);
    const total = seq.totalGold + seq.stewValue;
    optimalByVendor.push({ prefix, total, seq });
  }
  optimalByVendor.sort((a, b) => b.total - a.total);
  const optimal = optimalByVendor[0];
  const optimalTotal = optimal ? optimal.total : 0;
  const opportunityCost = optimalTotal - totalGold;
  const targetIsOptimal = opportunityCost <= 1;
  const optimalSameVendor = optimal && optimal.prefix === plan.prefix;
  const optimalTopSteps = optimal ? optimal.seq.sequence.slice(0, 5) : [];

  container.innerHTML = `
    <div class="daily-summary-grid">
      <div class="daily-summary-section">
        <div class="daily-summary-section-title">⏱️ Time to Gather</div>
        <div style="text-align: center; padding: 10px;">
          <div style="font-size: 1.6em; font-weight: bold; color: #2e7d32;">${formatBatchTime(plan.timeHours)}</div>
          <div style="font-size: 0.85em; color: #666; margin-top: 4px;">
            ${Math.ceil(plan.timeHours * effectiveOrdersPerHour).toLocaleString()} supply orders
            at ${effectiveOrdersPerHour.toFixed(1)}/hr${bonusOrdersPerDay > 0 ? ` (incl. ${bonusOrdersPerDay}/day deals)` : ''}
          </div>
          <div style="font-size: 0.85em; margin-top: 8px;">
            Bottleneck: <strong>${bottleneckLabel}</strong>
          </div>
        </div>
      </div>

      <div class="daily-summary-section">
        <div class="daily-summary-section-title">📦 Ingredients Needed</div>
        <div style="padding: 6px 0; font-size: 0.9em;">
          ${reqRows}
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #ccc; font-size: 0.9em; text-align: center;">
          Recipe sales: <strong style="color: #2e7d32;">+${recipeSaleGold.toLocaleString()}g</strong>
        </div>
      </div>

      <div class="daily-summary-section">
        <div class="daily-summary-section-title">🍳 Best Use of Leftovers</div>
        <div style="font-size: 0.8em; color: #666; margin-bottom: 6px;">Filler recipes you can also make in the same window</div>
        <div style="padding: 8px; background: var(--bg-alt); border-radius: 6px; font-size: 0.9em;">
          ${fillersHtml}
          ${leftoverChips ? `
            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #ccc;">
              <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 6px; font-size: 0.85em; color: #666;">
                <span>Residue:</span>${leftoverChips}
              </div>
              <div style="text-align: center;">
                🍲 Mega Stew Value:
                <strong style="color: #2e7d32;">${Math.round(stewValue).toLocaleString()}g</strong>
              </div>
            </div>
          ` : stewValue > 0 ? `
            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #ccc; text-align: center;">
              🍲 Mega Stew Value:
              <strong style="color: #2e7d32;">${Math.round(stewValue).toLocaleString()}g</strong>
            </div>
          ` : ''}
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 24px; margin-top: 20px;">
    <div class="daily-summary-section">
      <div class="daily-summary-section-title">🎯 Targeting ${plan.recipe.name}</div>
      <div style="font-size: 0.85em; color: #888; margin-bottom: 8px;">over ${formatBatchTime(plan.timeHours)}</div>
      <div class="daily-summary-row">
        <span>⭐ ${plan.recipe.name} × ${quantity}</span>
        <span class="daily-value positive">+${recipeSaleGold.toLocaleString()}g</span>
      </div>
      ${fillers.map(s => `
        <div class="daily-summary-row">
          <span>${s.name} × ${s.quantity}</span>
          <span class="daily-value positive">+${Math.round(s.gold).toLocaleString()}g</span>
        </div>
      `).join('')}
      ${stewValue > 0 ? `
        <div class="daily-summary-row">
          <span>🍲 Mega Stew (leftovers)</span>
          <span class="daily-value positive">+${Math.round(stewValue).toLocaleString()}g</span>
        </div>
      ` : ''}
      <div class="daily-summary-row" style="font-size: 1.2em; padding-top: 10px; border-top: 2px solid var(--border-color);">
        <span><strong>Total Earnings</strong></span>
        <span class="daily-value positive" style="font-size: 1.3em;"><strong>+${Math.round(totalGold).toLocaleString()}g</strong></span>
      </div>
      ${days >= 0.5 ? `
        <div class="daily-summary-row" style="font-size: 0.9em; color: #666;">
          <span>≈ ${Math.round(goldPerDay).toLocaleString()}g / day</span>
          <span></span>
        </div>
      ` : ''}
    </div>

    ${optimal ? `
      <div class="daily-summary-section">
        <div class="daily-summary-section-title">📊 Optimal ${optimalSameVendor ? `<span style="font-size: 0.85em; font-weight: normal; color: #888;">(same vendor)</span>` : ''}</div>
        <div style="font-size: 0.85em; color: #888; margin-bottom: 8px;">${optimalSameVendor ? BATCH_VENDOR_LABEL[optimal.prefix] : `switch to <strong style="color: inherit;">${BATCH_VENDOR_LABEL[optimal.prefix]}</strong>`}</div>
        ${optimalTopSteps.map(s => `
          <div class="daily-summary-row">
            <span>${s.name} × ${s.quantity}</span>
            <span class="daily-value positive">+${Math.round(s.gold).toLocaleString()}g</span>
          </div>
        `).join('')}
        ${optimal.seq.stewValue > 0 ? `
          <div class="daily-summary-row">
            <span>🍲 Mega Stew (leftovers)</span>
            <span class="daily-value positive">+${Math.round(optimal.seq.stewValue).toLocaleString()}g</span>
          </div>
        ` : ''}
        <div class="daily-summary-row" style="font-size: 1.2em; padding-top: 10px; border-top: 2px solid var(--border-color);">
          <span><strong>Optimal Total</strong></span>
          <span class="daily-value positive" style="font-size: 1.3em;"><strong>+${Math.round(optimalTotal).toLocaleString()}g</strong></span>
        </div>
        ${days >= 0.5 ? `
          <div class="daily-summary-row" style="font-size: 0.9em; color: #666;">
            <span>≈ ${Math.round(optimalTotal / days).toLocaleString()}g / day</span>
            <span></span>
          </div>
        ` : ''}
      </div>
    ` : ''}
    </div>

    ${optimal ? `
      <div class="daily-summary-total" style="margin-top: 12px;">
        <div class="daily-summary-row" style="font-size: 1.15em;">
          <span><strong>💰 Cost of targeting ${plan.recipe.name}</strong></span>
          <span class="daily-value ${targetIsOptimal ? 'positive' : 'negative'}" style="font-size: 1.25em;">
            <strong>${targetIsOptimal ? '✅ already optimal' : `-${Math.round(opportunityCost).toLocaleString()}g`}</strong>
          </span>
        </div>
        ${!targetIsOptimal && optimalTopSteps.length === 0 ? `
          <div class="daily-summary-row" style="font-size: 0.85em; color: #666;">
            <span>(no enabled recipes can be made from optimal vendor — enable some to see the full comparison)</span>
            <span></span>
          </div>
        ` : ''}
      </div>
    ` : ''}
  `;
}

function setupBatchPlannerListeners(root) {
  const sel = root.querySelector('#batch-planner-recipe');
  const qty = root.querySelector('#batch-planner-qty');
  if (sel) {
    sel.addEventListener('change', (e) => {
      if (!cookingState.batchPlanner) cookingState.batchPlanner = { recipeId: '', quantity: 10 };
      cookingState.batchPlanner.recipeId = e.target.value;
      updateBatchPlannerResults(root);
      saveCookingToStorage();
    });
  }
  if (qty) {
    qty.addEventListener('input', (e) => {
      const n = parseInt(e.target.value, 10);
      if (!cookingState.batchPlanner) cookingState.batchPlanner = { recipeId: '', quantity: 10 };
      cookingState.batchPlanner.quantity = (isNaN(n) || n < 1) ? 1 : n;
      updateBatchPlannerResults(root);
      saveCookingToStorage();
    });
  }
}

function refreshBatchPlannerUI(root) {
  if (!cookingState.batchPlanner) return;
  const sel = root.querySelector('#batch-planner-recipe');
  const qty = root.querySelector('#batch-planner-qty');
  if (sel && cookingState.batchPlanner.recipeId && sel.querySelector(`option[value="${cookingState.batchPlanner.recipeId}"]`)) {
    sel.value = cookingState.batchPlanner.recipeId;
  }
  if (qty && cookingState.batchPlanner.quantity) {
    qty.value = cookingState.batchPlanner.quantity;
  }
}

// Export for module use
if (typeof window !== 'undefined') {
  window.initCookingCalculator = initCookingCalculator;
  window.toggleAccordion = toggleAccordion;
  window.closeCookingModal = closeCookingModal;
  window.toggleRankingInfo = toggleRankingInfo;
}
