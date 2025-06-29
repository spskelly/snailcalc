// Helper function to calculate cumulative amulet costs
function calculateAmuletCumulativeCost(amuletLevel, amuletData) {
  if (amuletLevel === "Red") {
    return amuletData["Red"];
  }
  
  // For +N amulets, sum all costs from Red to +N
  const amuletPath = ["Red", "+1", "+2", "+3", "+4", "+5", "+6", "+7", "+8"];
  const targetIndex = amuletPath.indexOf(amuletLevel);
  if (targetIndex === -1) return { abyss: 0, heaven: 0, eoh: 0, eye: 0, glue: 0, orange: 0, b_tad: 0, will_crystal: 0, dg_crystal: 0 };
  
  let totalCost = { abyss: 0, heaven: 0, eoh: 0, eye: 0, glue: 0, orange: 0, b_tad: 0, will_crystal: 0, dg_crystal: 0 };
  
  for (let i = 0; i <= targetIndex; i++) {
    const level = amuletPath[i];
    const cost = amuletData[level];
    if (cost) {
      totalCost.abyss += cost.abyss || 0;
      totalCost.heaven += cost.heaven || 0;
      totalCost.eoh += cost.eoh || 0;
      totalCost.eye += cost.eye || 0;
      totalCost.glue += cost.glue || 0;
      totalCost.orange += cost.orange || 0;
      totalCost.b_tad += cost.b_tad || 0;
      totalCost.will_crystal += cost.will_crystal || 0;
      totalCost.dg_crystal += cost.dg_crystal || 0;
    }
  }
  
  return totalCost;
}

// Helper function to calculate cumulative costs for snail gear
function calculateSnailCumulativeCost(targetLevel) {
  const targetIndex = SNAIL_UPGRADE_PATH.indexOf(targetLevel);
  if (targetIndex === -1) return { eoh: 0, orange: 0, abyss: 0, heaven: 0, glue: 0, b_tad: 0, will_crystal: 0 };
  
  let totalCost = { eoh: 0, orange: 0, abyss: 0, heaven: 0, glue: 0, b_tad: 0, will_crystal: 0 };
  
  // Handle Time Wanderer as a unique item (not part of upgrade sequence)
  if (targetLevel === "Time Wanderer") {
    const gearCost = SNAIL_GEAR_INCREMENTAL["Time Wanderer"];
    totalCost.eoh += gearCost.eoh;
    totalCost.glue += gearCost.glue;
    totalCost.b_tad += gearCost.b_tad;
    return totalCost;
  }
  
  // Handle +1 as a special case (doesn't follow normal progression)
  if (targetLevel === "+1") {
    const gearCost = SNAIL_GEAR_INCREMENTAL["+1"];
    const redGearCost = SNAIL_GEAR_INCREMENTAL["Red"];
    const amuletCost = calculateAmuletCumulativeCost("Red", WILL_AMULET_INCREMENTAL);
    
    // +1 requires: 2x Red gear + +1 materials + Red amulet
    totalCost.eoh += (redGearCost.eoh * 2) + gearCost.eoh + amuletCost.eoh;
    totalCost.glue += (redGearCost.glue * 2) + gearCost.glue + amuletCost.glue;
    totalCost.b_tad += (redGearCost.b_tad * 2) + gearCost.b_tad + amuletCost.b_tad;
    totalCost.orange += amuletCost.orange;
    totalCost.abyss += amuletCost.abyss;
    totalCost.heaven += amuletCost.heaven;
    totalCost.will_crystal += amuletCost.will_crystal;
    
    return totalCost;
  }
  
  // For +2 and above, follow normal progression but skip +1 special case
  if (targetLevel.startsWith("+") && parseInt(targetLevel.substring(1)) > 1) {
    // Start with +1 costs
    totalCost = calculateSnailCumulativeCost("+1");
    
    // Add costs from +2 to target level
    const levelNum = parseInt(targetLevel.substring(1));
    for (let i = 2; i <= levelNum; i++) {
      const level = "+" + i;
      const gearCost = SNAIL_GEAR_INCREMENTAL[level];
      const requiredAmuletLevel = "+" + (i - 1);
      const amuletCost = calculateAmuletCumulativeCost(requiredAmuletLevel, WILL_AMULET_INCREMENTAL);
      
      // Add gear costs
      totalCost.eoh += gearCost.eoh;
      totalCost.glue += gearCost.glue;
      totalCost.b_tad += gearCost.b_tad;
      
      // Add amulet costs
      totalCost.eoh += amuletCost.eoh;
      totalCost.orange += amuletCost.orange;
      totalCost.abyss += amuletCost.abyss;
      totalCost.heaven += amuletCost.heaven;
      totalCost.glue += amuletCost.glue;
      totalCost.b_tad += amuletCost.b_tad;
      totalCost.will_crystal += amuletCost.will_crystal;
    }
    
    return totalCost;
  }
  
  // For base levels (Orange, Red), sum normally
  for (let i = 1; i <= targetIndex; i++) {
    const level = SNAIL_UPGRADE_PATH[i];
    if (level === "Time Wanderer" || level.startsWith("+")) continue;
    
    const gearCost = SNAIL_GEAR_INCREMENTAL[level];
    totalCost.eoh += gearCost.eoh;
    totalCost.glue += gearCost.glue;
    totalCost.b_tad += gearCost.b_tad;
  }
  
  return totalCost;
}

// Helper function to calculate cumulative costs for minion gear
function calculateMinionCumulativeCost(targetLevel) {
  const targetIndex = MINION_UPGRADE_PATH.indexOf(targetLevel);
  if (targetIndex === -1) return { eye: 0, orange: 0, abyss: 0, heaven: 0, glue: 0, b_tad: 0, dg_crystal: 0 };
  
  let totalCost = { eye: 0, orange: 0, abyss: 0, heaven: 0, glue: 0, b_tad: 0, dg_crystal: 0 };
  
  // Sum gear costs up to target level
  for (let i = 1; i <= targetIndex; i++) {
    const level = MINION_UPGRADE_PATH[i];
    const gearCost = MINION_GEAR_INCREMENTAL[level];
    
    // Add gear costs
    totalCost.eye += gearCost.eye;
    totalCost.glue += gearCost.glue;
    totalCost.b_tad += gearCost.b_tad;
    totalCost.abyss += gearCost.abyss;
    
    // Add amulet costs only for + levels (gear level N requires amulet level N-1)
    if (level.startsWith("+")) {
      const levelNum = parseInt(level.substring(1));
      let requiredAmuletLevel;
      
      if (levelNum === 1) {
        requiredAmuletLevel = "Red"; // +1 gear requires Red amulet
      } else {
        requiredAmuletLevel = "+" + (levelNum - 1); // +N gear requires +(N-1) amulet
      }
      
      // Use cumulative amulet costs
      const amuletCost = calculateAmuletCumulativeCost(requiredAmuletLevel, DEMON_GOD_AMULET_INCREMENTAL);
      if (amuletCost) {
        totalCost.eye += amuletCost.eye;
        totalCost.orange += amuletCost.orange;
        totalCost.abyss += amuletCost.abyss;
        totalCost.heaven += amuletCost.heaven;
        totalCost.glue += amuletCost.glue;
        totalCost.b_tad += amuletCost.b_tad;
        totalCost.dg_crystal += amuletCost.dg_crystal;
      }
    }
  }
  
  return totalCost;
}

// Legacy objects for compatibility with existing dropdown creation
const SNAIL_GEAR = {};
const MINION_GEAR = {};

// Populate legacy objects with keys for dropdown options
SNAIL_UPGRADE_PATH.forEach(level => {
  SNAIL_GEAR[level] = calculateSnailCumulativeCost(level);
});

MINION_UPGRADE_PATH.forEach(level => {
  MINION_GEAR[level] = calculateMinionCumulativeCost(level);
});

function createSlotElement(id, isSnail = false) {
  const container = document.createElement("div");
  container.className = "slot-container";

  const select = document.createElement("select");
  select.id = id;
  select.className = "upgrade-select";

  // Use the keys from our data objects to create the options
  const options = isSnail ? Object.keys(SNAIL_GEAR) : Object.keys(MINION_GEAR);

  options.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });

  container.appendChild(select);
  return container;
}

const snailRow1 = document.getElementById("snail-row-1");
const snailRow2 = document.getElementById("snail-row-2");
const snailRow3 = document.getElementById("snail-row-3");

for (let i = 1; i <= 6; i++) {
  snailRow1.appendChild(createSlotElement(`snail${i}`, true));
}
for (let i = 7; i <= 12; i++) {
  snailRow2.appendChild(createSlotElement(`snail${i}`, true));
}
for (let i = 13; i <= 24; i++) {
  snailRow3.appendChild(createSlotElement(`snail${i}`, true));
}

const minionRow1 = document.getElementById("minion-row-1");
const minionRow2 = document.getElementById("minion-row-2");
for (let i = 1; i <= 6; i++) {
  minionRow1.appendChild(createSlotElement(`slot${i}`, false));
}
for (let i = 7; i <= 12; i++) {
  minionRow2.appendChild(createSlotElement(`slot${i}`, false));
}

function calculateMinionTotals() {
  let totalEye = 0,
    totalOrange = 0,
    totalAbyss = 0,
    totalHeaven = 0,
    totalGlue = 0,
    totalBTad = 0,
    totalDgCrystal = 0;

  for (let i = 1; i <= 12; i++) {
    const selectEl = document.getElementById("slot" + i);
    const upgrade = selectEl.value;
    const gearData = calculateMinionCumulativeCost(upgrade); // Use new calculation function

    if (gearData) {
      totalEye += gearData.eye;
      totalOrange += gearData.orange;
      totalAbyss += gearData.abyss;
      totalHeaven += gearData.heaven;
      totalGlue += gearData.glue;
      totalBTad += gearData.b_tad;
      totalDgCrystal += gearData.dg_crystal;
    }
  }

  // Removed old totals display
}

function calculateSnailTotals() {
  let totalEoH = 0,
    totalOrange = 0,
    totalAbyss = 0,
    totalHeaven = 0,
    totalGlue = 0,
    totalBTad = 0,
    totalWillCrystal = 0;

  for (let i = 1; i <= 24; i++) {
    const selectEl = document.getElementById("snail" + i);
    const upgrade = selectEl.value;
    const gearData = calculateSnailCumulativeCost(upgrade); // Use new calculation function

    if (gearData) {
      totalEoH += gearData.eoh;
      totalOrange += gearData.orange;
      totalAbyss += gearData.abyss;
      totalHeaven += gearData.heaven;
      totalGlue += gearData.glue;
      totalBTad += gearData.b_tad;
      totalWillCrystal += gearData.will_crystal;
    }
  }

  // Removed old totals display
}

function resetSnailGear() {
  for (let i = 1; i <= 24; i++) {
    const selectEl = document.getElementById("snail" + i);
    if (selectEl) {
      selectEl.value = "None";
    }
  }
  calculateSnailTotals();
  saveToLocalStorage();
}

function resetMinionGear() {
  for (let i = 1; i <= 12; i++) {
    const selectEl = document.getElementById("slot" + i);
    if (selectEl) {
      selectEl.value = "None";
    }
  }
  calculateMinionTotals();
  saveToLocalStorage();
}

function saveToLocalStorage() {
  const snailSettings = {};
  const minionSettings = {};

  for (let i = 1; i <= 24; i++) {
    const selectEl = document.getElementById("snail" + i);
    if (selectEl) snailSettings[i] = selectEl.value;
  }

  for (let i = 1; i <= 12; i++) {
    const selectEl = document.getElementById("slot" + i);
    if (selectEl) minionSettings[i] = selectEl.value;
  }

  localStorage.setItem("snailGearSettings", JSON.stringify(snailSettings));
  localStorage.setItem("minionGearSettings", JSON.stringify(minionSettings));
}

function loadFromLocalStorage() {
  const snailSettings = JSON.parse(localStorage.getItem("snailGearSettings") || "{}");
  const minionSettings = JSON.parse(localStorage.getItem("minionGearSettings") || "{}");

  for (let i = 1; i <= 24; i++) {
    const selectEl = document.getElementById("snail" + i);
    if (selectEl) selectEl.value = snailSettings[i] || "None";
  }

  for (let i = 1; i <= 12; i++) {
    const selectEl = document.getElementById("slot" + i);
    if (selectEl) selectEl.value = minionSettings[i] || "None";
  }

  calculateSnailTotals();
  calculateMinionTotals();
}

// Render main cost tables for snail and minion
function renderSnailMainTable() {
  const tableDiv = document.getElementById("snailMainTable");
  if (!tableDiv) return;
  const headers = ["Resource", "Current", "Preset 1", "Preset 2", "Preset 3"];
  const rows = [
    ["Snail Eye (EoH)", "eoh"],
    ["Orange", "orange"],
    ["Abyss Wing", "abyss"],
    ["Heaven Wing", "heaven"],
    ["Glue", "glue"],
    ["B-tad", "b_tad"],
    ["Crystal of Will", "will_crystal"]
  ];
  // Current
  let current = { eoh: 0, orange: 0, abyss: 0, heaven: 0, glue: 0, b_tad: 0, will_crystal: 0 };
  for (let i = 1; i <= 24; i++) {
    const selectEl = document.getElementById("snail" + i);
    const upgrade = selectEl ? selectEl.value : "None";
    const gearData = calculateSnailCumulativeCost(upgrade);
    if (gearData) {
      current.eoh += gearData.eoh;
      current.orange += gearData.orange;
      current.abyss += gearData.abyss;
      current.heaven += gearData.heaven;
      current.glue += gearData.glue;
      current.b_tad += gearData.b_tad;
      current.will_crystal += gearData.will_crystal;
    }
  }
  // Presets
  const presets = [1, 2, 3].map(getSnailPresetTotals);
  let html = '<table class="cost-table"><tr>';
  headers.forEach(h => html += `<th>${h}</th>`);
  html += "</tr>";
  rows.forEach(([label, key]) => {
    html += `<tr><td>${label}</td>`;
    html += `<td>${current[key] ? current[key].toLocaleString() : "0"}</td>`;
    for (let i = 0; i < 3; i++) {
      html += `<td>${presets[i][key] ? presets[i][key].toLocaleString() : "0"}</td>`;
    }
    html += "</tr>";
  });
  html += "</table>";
  tableDiv.innerHTML = html;
}

function renderMinionMainTable() {
  const tableDiv = document.getElementById("minionMainTable");
  if (!tableDiv) return;
  const headers = ["Resource", "Current", "Preset 1", "Preset 2", "Preset 3"];
  const rows = [
    ["Minion Eye (EoB)", "eye"],
    ["Orange", "orange"],
    ["Abyss Wing", "abyss"],
    ["Heaven Wing", "heaven"],
    ["Glue", "glue"],
    ["B-tad", "b_tad"],
    ["Demon God Crystal", "dg_crystal"]
  ];
  // Current
  let current = { eye: 0, orange: 0, abyss: 0, heaven: 0, glue: 0, b_tad: 0, dg_crystal: 0 };
  for (let i = 1; i <= 12; i++) {
    const selectEl = document.getElementById("slot" + i);
    const upgrade = selectEl ? selectEl.value : "None";
    const gearData = calculateMinionCumulativeCost(upgrade);
    if (gearData) {
      current.eye += gearData.eye;
      current.orange += gearData.orange;
      current.abyss += gearData.abyss;
      current.heaven += gearData.heaven;
      current.glue += gearData.glue;
      current.b_tad += gearData.b_tad;
      current.dg_crystal += gearData.dg_crystal;
    }
  }
  // Presets
  const presets = [1, 2, 3].map(getMinionPresetTotals);
  let html = '<table class="cost-table"><tr>';
  headers.forEach(h => html += `<th>${h}</th>`);
  html += "</tr>";
  rows.forEach(([label, key]) => {
    html += `<tr><td>${label}</td>`;
    html += `<td>${current[key] ? current[key].toLocaleString() : "0"}</td>`;
    for (let i = 0; i < 3; i++) {
      html += `<td>${presets[i][key] ? presets[i][key].toLocaleString() : "0"}</td>`;
    }
    html += "</tr>";
  });
  html += "</table>";
  tableDiv.innerHTML = html;
}

function saveSnailPreset(slot) {
  const preset = {};
  for (let i = 1; i <= 24; i++) {
    const selectEl = document.getElementById("snail" + i);
    if (selectEl) preset[i] = selectEl.value;
  }
  localStorage.setItem("snailPreset" + slot, JSON.stringify(preset));
  renderSnailMainTable();
}

function loadSnailPreset(slot) {
  const preset = JSON.parse(localStorage.getItem("snailPreset" + slot) || "{}");
  for (let i = 1; i <= 24; i++) {
    const selectEl = document.getElementById("snail" + i);
    if (selectEl) selectEl.value = preset[i] || "None";
  }
  calculateSnailTotals();
  saveToLocalStorage();
  renderSnailMainTable();
}

function saveMinionPreset(slot) {
  const preset = {};
  for (let i = 1; i <= 12; i++) {
    const selectEl = document.getElementById("slot" + i);
    if (selectEl) preset[i] = selectEl.value;
  }
  localStorage.setItem("minionPreset" + slot, JSON.stringify(preset));
  renderMinionMainTable();
}

function loadMinionPreset(slot) {
  const preset = JSON.parse(localStorage.getItem("minionPreset" + slot) || "{}");
  // Remove change listeners temporarily
  const selects = [];
  for (let i = 1; i <= 12; i++) {
    const selectEl = document.getElementById("slot" + i);
    if (selectEl) {
      // Clone node to remove all listeners
      const newSelect = selectEl.cloneNode(true);
      selectEl.parentNode.replaceChild(newSelect, selectEl);
      newSelect.value = preset[i] || "None";
      selects.push(newSelect);
    }
  }
  // Now re-add the event listeners
  selects.forEach(select => {
    select.addEventListener("change", () => {
      calculateMinionTotals();
      saveToLocalStorage();
      renderMinionMainTable();
    });
  });
  calculateMinionTotals();
  saveToLocalStorage();
  renderMinionMainTable();
}

function getMinionPresetTotals(slot) {
  const preset = JSON.parse(localStorage.getItem("minionPreset" + slot) || "{}");
  let total = { eye: 0, orange: 0, abyss: 0, heaven: 0, glue: 0, b_tad: 0, dg_crystal: 0 };
  for (let i = 1; i <= 12; i++) {
    const upgrade = preset[i] || "None";
    const gearData = calculateMinionCumulativeCost(upgrade);
    if (gearData) {
      total.eye += gearData.eye;
      total.orange += gearData.orange;
      total.abyss += gearData.abyss;
      total.heaven += gearData.heaven;
      total.glue += gearData.glue;
      total.b_tad += gearData.b_tad;
      total.dg_crystal += gearData.dg_crystal;
    }
  }
  return total;
}


function getSnailPresetTotals(slot) {
  const preset = JSON.parse(localStorage.getItem("snailPreset" + slot) || "{}");
  let total = { eoh: 0, orange: 0, abyss: 0, heaven: 0, glue: 0, b_tad: 0, will_crystal: 0 };
  for (let i = 1; i <= 24; i++) {
    const upgrade = preset[i] || "None";
    const gearData = calculateSnailCumulativeCost(upgrade);
    if (gearData) {
      total.eoh += gearData.eoh;
      total.orange += gearData.orange;
      total.abyss += gearData.abyss;
      total.heaven += gearData.heaven;
      total.glue += gearData.glue;
      total.b_tad += gearData.b_tad;
      total.will_crystal += gearData.will_crystal;
    }
  }
  return total;
}

function renderSnailCompareTable() {
  const tableDiv = document.getElementById("snailCompareTable");
  if (!tableDiv) return;
  const headers = ["Resource", "Preset 1", "Preset 2", "Preset 3"];
  const rows = [
    ["Snail Eye (EoH)", "eoh"],
    ["Orange", "orange"],
    ["Abyss Wing", "abyss"],
    ["Heaven Wing", "heaven"],
    ["Glue", "glue"],
    ["B-tad", "b_tad"],
    ["Crystal of Will", "will_crystal"]
  ];
  let html = "<table><tr>";
  headers.forEach(h => html += `<th>${h}</th>`);
  html += "</tr>";
  rows.forEach(([label, key]) => {
    html += `<tr><td>${label}</td>`;
    for (let slot = 1; slot <= 3; slot++) {
      const totals = getSnailPresetTotals(slot);
      html += `<td>${totals[key] ? totals[key].toLocaleString() : "0"}</td>`;
    }
    html += "</tr>";
  });
  html += "</table>";
  tableDiv.innerHTML = html;
}

function renderMinionCompareTable() {
  const tableDiv = document.getElementById("minionCompareTable");
  if (!tableDiv) return;
  const headers = ["Resource", "Preset 1", "Preset 2", "Preset 3"];
  const rows = [
    ["Minion Eye (EoB)", "eye"],
    ["Orange", "orange"],
    ["Abyss Wing", "abyss"],
    ["Heaven Wing", "heaven"],
    ["Glue", "glue"],
    ["B-tad", "b_tad"],
    ["Demon God Crystal", "dg_crystal"]
  ];
  let html = "<table><tr>";
  headers.forEach(h => html += `<th>${h}</th>`);
  html += "</tr>";
  rows.forEach(([label, key]) => {
    html += `<tr><td>${label}</td>`;
    for (let slot = 1; slot <= 3; slot++) {
      const totals = getMinionPresetTotals(slot);
      html += `<td>${totals[key] ? totals[key].toLocaleString() : "0"}</td>`;
    }
    html += "</tr>";
  });
  html += "</table>";
  tableDiv.innerHTML = html;
}

function addEventListeners() {
  document.querySelectorAll(".upgrade-select").forEach(select => {
    select.addEventListener("change", () => {
      calculateSnailTotals();
      calculateMinionTotals();
      saveToLocalStorage();
      renderSnailMainTable();
      renderMinionMainTable();
    });
  });

  // Expand/collapse for unequipped snail section
  const toggleBtn = document.getElementById("toggleUnequipped");
  const unequippedRow = document.getElementById("snail-row-3");
  if (toggleBtn && unequippedRow) {
    toggleBtn.addEventListener("click", () => {
      const isExpanded = toggleBtn.getAttribute("aria-expanded") === "true";
      if (isExpanded) {
        unequippedRow.style.display = "none";
        toggleBtn.textContent = "+";
        toggleBtn.setAttribute("aria-expanded", "false");
      } else {
        unequippedRow.style.display = "";
        toggleBtn.textContent = "−";
        toggleBtn.setAttribute("aria-expanded", "true");
      }
    });
  }

  // Expand/collapse for unequipped minion section
  const toggleMinionBtn = document.getElementById("toggleMinionUnequipped");
  const minionUnequippedRow = document.getElementById("minion-row-2");
  if (toggleMinionBtn && minionUnequippedRow) {
    toggleMinionBtn.addEventListener("click", () => {
      const isExpanded = toggleMinionBtn.getAttribute("aria-expanded") === "true";
      if (isExpanded) {
        minionUnequippedRow.style.display = "none";
        toggleMinionBtn.textContent = "+";
        toggleMinionBtn.setAttribute("aria-expanded", "false");
      } else {
        minionUnequippedRow.style.display = "";
        toggleMinionBtn.textContent = "−";
        toggleMinionBtn.setAttribute("aria-expanded", "true");
      }
    });
  }

  document.getElementById("resetSnail").addEventListener("click", () => {
    resetSnailGear();
    renderSnailMainTable();
  });
  document.getElementById("resetMinion").addEventListener("click", () => {
    resetMinionGear();
    renderMinionMainTable();
  });

  // Snail Preset Buttons
  for (let i = 1; i <= 3; i++) {
    document.getElementById("saveSnailPreset" + i).addEventListener("click", () => saveSnailPreset(i));
    document.getElementById("loadSnailPreset" + i).addEventListener("click", () => loadSnailPreset(i));
  }
  // Minion Preset Buttons
  for (let i = 1; i <= 3; i++) {
    document.getElementById("saveMinionPreset" + i).addEventListener("click", () => saveMinionPreset(i));
    document.getElementById("loadMinionPreset" + i).addEventListener("click", () => loadMinionPreset(i));
  }
}

// Initial setup
loadFromLocalStorage();
addEventListeners();
renderSnailMainTable();
renderMinionMainTable();
