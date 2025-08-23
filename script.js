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
  let options;
  if (isSnail) {
    // Combine gear and amulet options for snail slots
    options = [...Object.keys(SNAIL_GEAR), ...SNAIL_AMULET_OPTIONS];
  } else {
    // Combine minion gear and amulet options for minion slots (up to +4)
    options = [...Object.keys(MINION_GEAR), ...MINION_AMULET_OPTIONS];
  }

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

    // Check if this is an amulet option
    let isAmulet = false;
    let amuletKey = null;
    if (upgrade === "Amulet (Red)") {
      isAmulet = true;
      amuletKey = "Red";
    } else if (upgrade.startsWith("Amulet +")) {
      isAmulet = true;
      amuletKey = "+" + upgrade.split("+")[1];
    }

    if (isAmulet && amuletKey && DEMON_GOD_AMULET_INCREMENTAL[amuletKey]) {
      const amuletCost = calculateAmuletCumulativeCost(amuletKey, DEMON_GOD_AMULET_INCREMENTAL);
      totalEye += amuletCost.eye || 0;
      totalOrange += amuletCost.orange || 0;
      totalAbyss += amuletCost.abyss || 0;
      totalHeaven += amuletCost.heaven || 0;
      totalGlue += amuletCost.glue || 0;
      totalBTad += amuletCost.b_tad || 0;
      totalDgCrystal += amuletCost.dg_crystal || 0;
    } else {
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

    // Check if this is an amulet option
    let isAmulet = false;
    let amuletKey = null;
    if (upgrade === "Amulet (Red)") {
      isAmulet = true;
      amuletKey = "Red";
    } else if (upgrade.startsWith("Amulet +")) {
      isAmulet = true;
      amuletKey = "+" + upgrade.split("+")[1];
    }

    if (isAmulet && amuletKey && WILL_AMULET_INCREMENTAL[amuletKey]) {
      const amuletCost = calculateAmuletCumulativeCost(amuletKey, WILL_AMULET_INCREMENTAL);
      totalEoH += amuletCost.eoh || 0;
      totalOrange += amuletCost.orange || 0;
      totalAbyss += amuletCost.abyss || 0;
      totalHeaven += amuletCost.heaven || 0;
      totalGlue += amuletCost.glue || 0;
      totalBTad += amuletCost.b_tad || 0;
      totalWillCrystal += amuletCost.will_crystal || 0;
    } else {
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
    // Amulet detection logic
    let isAmulet = false;
    let amuletKey = null;
    if (upgrade === "Amulet (Red)") {
      isAmulet = true;
      amuletKey = "Red";
    } else if (upgrade.startsWith("Amulet +")) {
      isAmulet = true;
      amuletKey = "+" + upgrade.split("+")[1];
    }
    if (isAmulet && amuletKey && WILL_AMULET_INCREMENTAL[amuletKey]) {
      const amuletCost = calculateAmuletCumulativeCost(amuletKey, WILL_AMULET_INCREMENTAL);
      current.eoh += amuletCost.eoh || 0;
      current.orange += amuletCost.orange || 0;
      current.abyss += amuletCost.abyss || 0;
      current.heaven += amuletCost.heaven || 0;
      current.glue += amuletCost.glue || 0;
      current.b_tad += amuletCost.b_tad || 0;
      current.will_crystal += amuletCost.will_crystal || 0;
    } else {
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
    // Amulet detection logic
    let isAmulet = false;
    let amuletKey = null;
    if (upgrade === "Amulet (Red)") {
      isAmulet = true;
      amuletKey = "Red";
    } else if (upgrade.startsWith("Amulet +")) {
      isAmulet = true;
      amuletKey = "+" + upgrade.split("+")[1];
    }
    if (isAmulet && amuletKey && DEMON_GOD_AMULET_INCREMENTAL[amuletKey]) {
      const amuletCost = calculateAmuletCumulativeCost(amuletKey, DEMON_GOD_AMULET_INCREMENTAL);
      current.eye += amuletCost.eye || 0;
      current.orange += amuletCost.orange || 0;
      current.abyss += amuletCost.abyss || 0;
      current.heaven += amuletCost.heaven || 0;
      current.glue += amuletCost.glue || 0;
      current.b_tad += amuletCost.b_tad || 0;
      current.dg_crystal += amuletCost.dg_crystal || 0;
    } else {
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
document.addEventListener("DOMContentLoaded", () => {
  // Existing setup
  loadFromLocalStorage();
  addEventListeners(); // Note: This only adds listeners for snail/minion gear
  renderSnailMainTable();
  renderMinionMainTable();

  // New Rocket Cabin Setup
  createAllRocketCabinsUI();
  renderAllRocketCabinSummaries();
  
  // Add event listeners for the new rocket dropdowns (per-cabin update)
  document.querySelectorAll(".rocket-tier-select").forEach(select => {
    select.addEventListener("change", (e) => {
      const cabinKey = select.getAttribute("data-cabin");
      calculateAndRenderRocketCabinSummary(cabinKey);
    });
  });

  // Setup the main calculator switcher
  setupSwitcher();
});

// --- ROCKET CABIN CALCULATOR ---

/**
 * Calculates the cumulative cost for a rocket device up to a target tier.
 * It assumes the recipe cost applies at each tier, requiring materials from the previous tier.
 * All material costs are converted to their T1 equivalent.
 */
function calculateRocketCumulativeCost(deviceRecipe, targetTier) {
  const tierIndex = ROCKET_TIER_PATH.indexOf(targetTier);
  const baseCost = { "A": 0, "B": 0, "C": 0, "D": 0, "E": 0 };

  if (tierIndex <= 0 || !deviceRecipe) return baseCost;

  let totalCost = { ...baseCost };

  for (let i = 1; i <= tierIndex; i++) {
    const t1_equivalent_multiplier = Math.pow(5, i - 1);
    totalCost["A"] += (deviceRecipe["A"] || 0) * t1_equivalent_multiplier;
    totalCost["B"] += (deviceRecipe["B"] || 0) * t1_equivalent_multiplier;
    totalCost["C"] += (deviceRecipe["C"] || 0) * t1_equivalent_multiplier;
    totalCost["D"] += (deviceRecipe["D"] || 0) * t1_equivalent_multiplier;
    totalCost["E"] += (deviceRecipe["E"] || 0) * t1_equivalent_multiplier;
    // Btad removed
  }

  return totalCost;
}

/**
 * Creates the entire UI for all three rocket cabins.
 */
function createAllRocketCabinsUI() {
  const container = document.getElementById("rocket-cabins-container");
  if (!container) return;
  container.innerHTML = ''; // Clear previous content

  Object.keys(ROCKET_DATA).forEach(cabinKey => {
    const cabin = ROCKET_DATA[cabinKey];
    
    // Create a wrapper for the cabin
    const cabinWrapper = document.createElement('div');
    cabinWrapper.className = 'cabin-section';
    
    const title = document.createElement('h2');
    title.className = 'cabin-title';
    title.textContent = cabin.title;
    cabinWrapper.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'rocket-selectors-grid';

    Object.keys(cabin.devices).forEach(deviceName => {
        const selectorDiv = document.createElement("div");
        selectorDiv.className = "rocket-device-selector";
        
        const label = document.createElement("label");
        label.textContent = deviceName;
        
        const select = document.createElement("select");
        // Unique ID: cabinKey-deviceName
        select.id = `rocket-${cabinKey}-${deviceName.replace(/\s+/g, '-')}`;
        select.className = "upgrade-select rocket-tier-select";
        select.setAttribute("data-cabin", cabinKey);

        // Tier display mapping
        const tierLabels = {
          "T1": "T1 (White)",
          "T2": "T2 (Green)",
          "T3": "T3 (Blue)",
          "T4": "T4 (Purple)",
          "T5": "T5 (Orange)"
        };
        ROCKET_TIER_PATH.forEach(tier => {
            const option = document.createElement("option");
            option.value = tier;
            option.textContent = tierLabels[tier] || tier;
            select.appendChild(option);
        });

        selectorDiv.appendChild(label);
        selectorDiv.appendChild(select);
        grid.appendChild(selectorDiv);
    });
    
    cabinWrapper.appendChild(grid);

    // Add collapsible excess materials grid (toggle like unequipped gear)
    const excessLabel = document.createElement("div");
    excessLabel.className = "excess-label";
    excessLabel.style.fontWeight = "bold";
    excessLabel.style.margin = "8px 0 4px 8px";
    excessLabel.style.fontSize = "1.1em";
    excessLabel.style.letterSpacing = "0.5px";
    excessLabel.style.display = "flex";
    excessLabel.style.alignItems = "center";
    excessLabel.style.gap = "8px";
    excessLabel.textContent = "Excess Materials";

    // Toggle button
    const toggleBtn = document.createElement("button");
    toggleBtn.id = `toggleExcess-${cabinKey}`;
    toggleBtn.className = "toggle-section-btn";
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.setAttribute("aria-controls", `excessGrid-${cabinKey}`);
    toggleBtn.textContent = "+";
    excessLabel.appendChild(toggleBtn);

    // Reset Excess button
    const resetExcessBtn = document.createElement("button");
    resetExcessBtn.className = "reset-button";
    resetExcessBtn.textContent = "Reset Excess";
    resetExcessBtn.style.marginLeft = "12px";
    resetExcessBtn.style.padding = "4px 14px";
    resetExcessBtn.style.fontSize = "0.98em";
    resetExcessBtn.addEventListener("click", () => {
      localStorage.removeItem(`rocketCabinExcess-${cabinKey}`);
      renderExcessGrid();
      calculateAndRenderRocketCabinSummary(cabinKey);
    });
    excessLabel.appendChild(resetExcessBtn);

    // Grid container (hidden by default)
    const gridContainer = document.createElement("div");
    gridContainer.id = `excessGrid-${cabinKey}`;
    gridContainer.style.display = "none";
    gridContainer.style.padding = "8px 12px 12px 12px";

    // Render the grid
    function renderExcessGrid(excessOverride) {
      // Get material keys and names
      const materialOrder = ["A", "B", "C", "D", "E"];
      const materialNames = materialOrder
        .filter(matKey => cabin.materials[matKey])
        .map(matKey => ({ key: matKey, name: cabin.materials[matKey] }));
      const tiers = ["T1", "T2", "T3", "T4", "T5"];
      // Load saved values if any, or use override
      let excessData = {};
      if (excessOverride) {
        excessData = excessOverride;
      } else {
        try {
          const saved = localStorage.getItem(`rocketCabinExcess-${cabinKey}`);
          if (saved) excessData = JSON.parse(saved);
        } catch {}
      }
      // Build table
      let html = '<table class="excess-grid-table" style="width:auto;border-collapse:collapse;"><tr><th style="min-width:110px"></th>';
      tiers.forEach(tier => {
        html += `<th style="padding:2px 6px;">${tier}</th>`;
      });
      html += "</tr>";
      materialNames.forEach(({ key, name }) => {
        html += `<tr><td style="padding:2px 6px;">${name}</td>`;
        tiers.forEach(tier => {
          const val = (excessData[key] && typeof excessData[key][tier] === "number") ? excessData[key][tier] : "";
          html += `<td style="padding:2px 6px;"><input type="number" min="0" class="excess-input" data-mat="${key}" data-tier="${tier}" value="${val}" style="width:60px;text-align:right;font-size:1em;"></td>`;
        });
        html += "</tr>";
      });
      html += "</table>";
      gridContainer.innerHTML = html;
    }
    renderExcessGrid();

    // Toggle logic (like unequipped gear)
    toggleBtn.addEventListener("click", () => {
      const expanded = toggleBtn.getAttribute("aria-expanded") === "true";
      if (expanded) {
        gridContainer.style.display = "none";
        toggleBtn.textContent = "+";
        toggleBtn.setAttribute("aria-expanded", "false");
      } else {
        gridContainer.style.display = "";
        toggleBtn.textContent = "−";
        toggleBtn.setAttribute("aria-expanded", "true");
      }
    });

    // Save on input change
    gridContainer.addEventListener("input", (e) => {
      if (e.target.classList.contains("excess-input")) {
        // Gather all values
        const materialOrder = ["A", "B", "C", "D", "E"];
        const tiers = ["T1", "T2", "T3", "T4", "T5"];
        let excessData = {};
        materialOrder.forEach(matKey => {
          excessData[matKey] = {};
          tiers.forEach(tier => {
            const input = gridContainer.querySelector(`input[data-mat="${matKey}"][data-tier="${tier}"]`);
            const val = input && input.value ? parseInt(input.value, 10) : 0;
            excessData[matKey][tier] = isNaN(val) ? 0 : val;
          });
        });
        localStorage.setItem(`rocketCabinExcess-${cabinKey}`, JSON.stringify(excessData));
        // Update summary
        calculateAndRenderRocketCabinSummary(cabinKey);
      }
    });

    // Insert excess label and grid before summary
    cabinWrapper.appendChild(excessLabel);
    cabinWrapper.appendChild(gridContainer);

    // Add preset and reset buttons (emulate gear calculator UI)
    const presetGroup = document.createElement("div");
    presetGroup.className = "preset-group";
    for (let i = 1; i <= 3; i++) {
      const presetSet = document.createElement("div");
      presetSet.className = "preset-set";

      const label = document.createElement("span");
      label.className = "preset-label";
      label.textContent = `Preset ${i}:`;
      presetSet.appendChild(label);

      const saveBtn = document.createElement("button");
      saveBtn.textContent = "Save";
      saveBtn.className = "preset-button";
      saveBtn.addEventListener("click", () => saveRocketCabinPreset(cabinKey, i));
      presetSet.appendChild(saveBtn);

      const loadBtn = document.createElement("button");
      loadBtn.textContent = "Load";
      loadBtn.className = "preset-button";
      loadBtn.addEventListener("click", () => loadRocketCabinPreset(cabinKey, i));
      presetSet.appendChild(loadBtn);

      presetGroup.appendChild(presetSet);
    }
    cabinWrapper.appendChild(presetGroup);

    const resetBtn = document.createElement("button");
    resetBtn.textContent = "Reset";
    resetBtn.className = "reset-button";
    resetBtn.style.display = "block";
    resetBtn.style.margin = "15px auto";
    resetBtn.addEventListener("click", () => resetRocketCabin(cabinKey));
    cabinWrapper.appendChild(resetBtn);

    // Add per-cabin summary
    const summaryDiv = document.createElement("div");
    summaryDiv.className = "totals-column rocket-cabin-totals-summary";
    summaryDiv.innerHTML = `<h3>Cabin Materials Summary <span style="font-weight:normal;font-size:0.95em;">(<span id="rocketTierSummaryLabel-${cabinKey}">T1 materials</span>)</span></h3>`;

    // Create tier toggle dropdown (now inside summaryDiv, just below header)
    const tierDiv = document.createElement("div");
    tierDiv.className = "rocket-tier-toggle";
    tierDiv.style.margin = "0 0 8px 0";
    tierDiv.style.display = "flex";
    tierDiv.style.alignItems = "center";
    tierDiv.style.justifyContent = "flex-end";
    tierDiv.style.width = "100%";

    const tierLabel = document.createElement("label");
    tierLabel.textContent = "Display as:";
    tierLabel.setAttribute("for", `rocketTierDisplay-${cabinKey}`);
    tierLabel.style.fontWeight = "normal";
    tierLabel.style.fontSize = "0.98em";
    tierLabel.style.marginRight = "6px";
    tierDiv.appendChild(tierLabel);

    const tierSelect = document.createElement("select");
    tierSelect.id = `rocketTierDisplay-${cabinKey}`;
    tierSelect.className = "upgrade-select";
    tierSelect.style.fontSize = "0.98em";
    tierSelect.style.padding = "2px 8px";
    tierSelect.style.height = "28px";
    const tierOptions = [
      { value: "T1", label: "T1 (White)" },
      { value: "T2", label: "T2 (Green)" },
      { value: "T3", label: "T3 (Blue)" },
      { value: "T4", label: "T4 (Purple)" },
      { value: "T5", label: "T5 (Orange)" }
    ];
    tierOptions.forEach(opt => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      tierSelect.appendChild(option);
    });
    // Load saved tier or default to T1
    let savedTier = "T1";
    try {
      const stored = localStorage.getItem(`rocketCabinDisplayTier-${cabinKey}`);
      if (stored && ["T1","T2","T3","T4","T5"].includes(stored)) savedTier = stored;
    } catch {}
    tierSelect.value = savedTier;
    tierDiv.appendChild(tierSelect);

    // On change, save and re-render summary
    tierSelect.addEventListener("change", () => {
      localStorage.setItem(`rocketCabinDisplayTier-${cabinKey}`, tierSelect.value);
      calculateAndRenderRocketCabinSummary(cabinKey);
    });

    summaryDiv.appendChild(tierDiv);
    // Add the summary table container
    const tableDiv = document.createElement("div");
    tableDiv.className = "rocketMaterialsTable";
    tableDiv.id = `rocketMaterialsTable-${cabinKey}`;
    summaryDiv.appendChild(tableDiv);

    cabinWrapper.appendChild(summaryDiv);

    container.appendChild(cabinWrapper);
  });
}

/**
 * Calculates and renders the total material costs for a single rocket cabin.
 */
function calculateAndRenderRocketCabinSummary(cabinKey) {
  const tableDiv = document.getElementById(`rocketMaterialsTable-${cabinKey}`);
  if (!tableDiv) return;

  // Get selected display tier (default T1)
  let displayTier = "T1";
  const tierSelect = document.getElementById(`rocketTierDisplay-${cabinKey}`);
  if (tierSelect && ["T1","T2","T3","T4","T5"].includes(tierSelect.value)) {
    displayTier = tierSelect.value;
  }
  // Update label in summary header
  const labelSpan = document.getElementById(`rocketTierSummaryLabel-${cabinKey}`);
  if (labelSpan) labelSpan.textContent = `${displayTier} materials`;

  // Conversion factors
  const tierDivisor = { T1: 1, T2: 5, T3: 25, T4: 125, T5: 625 };

  const cabin = ROCKET_DATA[cabinKey];
  // Helper to get device tiers for a given source (current or preset)
  function getDeviceTiers(source) {
    const tiers = {};
    Object.keys(cabin.devices).forEach(deviceName => {
      if (source === "current") {
        const selectEl = document.getElementById(`rocket-${cabinKey}-${deviceName.replace(/\s+/g, '-')}`);
        tiers[deviceName] = selectEl ? selectEl.value : "None";
      } else {
        // source is a preset object
        tiers[deviceName] = source[deviceName] || "None";
      }
    });
    return tiers;
  }

  // Always use A, B, C, D, E order for summary
  const materialOrder = ["A", "B", "C", "D", "E"];
  // Map to display names using cabin.materials
  const materialNames = materialOrder
    .filter(matKey => cabin.materials[matKey])
    .map(matKey => ({ key: matKey, name: cabin.materials[matKey] }));

  // Calculate totals for current and all 3 presets
  const currentTiers = getDeviceTiers("current");

  // Helper to get both device tiers and excess grid from a preset
  function getPresetData(i) {
    const presetObj = JSON.parse(localStorage.getItem(`rocketCabinPreset${i}-${cabinKey}`) || "{}");
    return {
      tiers: getDeviceTiers(presetObj.devices || {}),
      excess: presetObj.excess || {}
    };
  }
  const presetData = [1, 2, 3].map(getPresetData);

  function calcTotals(tiers, excessData) {
    const totals = {};
    Object.keys(cabin.devices).forEach(deviceName => {
      const deviceRecipe = cabin.devices[deviceName];
      const tier = tiers[deviceName] || "None";
      const deviceCost = calculateRocketCumulativeCost(deviceRecipe, tier);
      for (const matKey in cabin.materials) {
        const materialName = cabin.materials[matKey];
        totals[materialName] = (totals[materialName] || 0) + (deviceCost[matKey] || 0);
      }
    });
    // Add excess materials from grid (if provided)
    const tierMult = { T1: 1, T2: 5, T3: 25, T4: 125, T5: 625 };
    for (const matKey in cabin.materials) {
      const materialName = cabin.materials[matKey];
      if (excessData && excessData[matKey]) {
        for (const tier in tierMult) {
          const val = excessData[matKey][tier] || 0;
          totals[materialName] = (totals[materialName] || 0) + val * tierMult[tier];
        }
      }
    }
    return totals;
  }

  // Current totals use currentTiers and current excess grid
  let currentExcess = {};
  try {
    const saved = localStorage.getItem(`rocketCabinExcess-${cabinKey}`);
    if (saved) currentExcess = JSON.parse(saved);
  } catch {}
  const currentTotals = calcTotals(currentTiers, currentExcess);

  // Preset totals use preset device tiers and preset excess grid
  const presetTotals = presetData.map(pd => calcTotals(pd.tiers, pd.excess));

  // Build the HTML table for the summary
  let html = '<table class="cost-table"><tr><th>Material</th><th>Current</th><th>Preset 1</th><th>Preset 2</th><th>Preset 3</th></tr>';

  materialNames.forEach(({ key, name }) => {
    html += `<tr><td>${name}</td>`;
    // Convert to selected tier and display as integer
    const currentVal = currentTotals[name] ? Math.floor(currentTotals[name] / tierDivisor[displayTier]) : 0;
    html += `<td>${currentVal.toLocaleString()}</td>`;
    for (let i = 0; i < 3; i++) {
      const presetVal = presetTotals[i][name] ? Math.floor(presetTotals[i][name] / tierDivisor[displayTier]) : 0;
      html += `<td>${presetVal.toLocaleString()}</td>`;
    }
    html += "</tr>";
  });

  html += "</table>";
  tableDiv.innerHTML = html;
}

/**
 * Renders all cabin summaries (call after UI creation or any change).
 */
function renderAllRocketCabinSummaries() {
  Object.keys(ROCKET_DATA).forEach(cabinKey => {
    calculateAndRenderRocketCabinSummary(cabinKey);
  });
}


// --- Rocket Cabin Preset/Reset Logic ---
function saveRocketCabinPreset(cabinKey, presetNum) {
  const preset = {};
  const cabin = ROCKET_DATA[cabinKey];
  Object.keys(cabin.devices).forEach(deviceName => {
    const selectEl = document.getElementById(`rocket-${cabinKey}-${deviceName.replace(/\s+/g, '-')}`);
    if (selectEl) preset[deviceName] = selectEl.value;
  });
  // Save excess grid as part of preset
  let excessData = {};
  try {
    const saved = localStorage.getItem(`rocketCabinExcess-${cabinKey}`);
    if (saved) excessData = JSON.parse(saved);
  } catch {}
  localStorage.setItem(`rocketCabinPreset${presetNum}-${cabinKey}`, JSON.stringify({ devices: preset, excess: excessData }));
}

function loadRocketCabinPreset(cabinKey, presetNum) {
  const presetObj = JSON.parse(localStorage.getItem(`rocketCabinPreset${presetNum}-${cabinKey}`) || "{}");
  const cabin = ROCKET_DATA[cabinKey];
  // Restore device tiers
  const preset = presetObj.devices || presetObj;
  Object.keys(cabin.devices).forEach(deviceName => {
    const selectEl = document.getElementById(`rocket-${cabinKey}-${deviceName.replace(/\s+/g, '-')}`);
    if (selectEl) selectEl.value = preset[deviceName] || "None";
  });
  // Restore excess grid
  if (presetObj.excess) {
    localStorage.setItem(`rocketCabinExcess-${cabinKey}`, JSON.stringify(presetObj.excess));
    // Always re-render grid with restored values
    const gridContainer = document.getElementById(`excessGrid-${cabinKey}`);
    if (gridContainer) {
      // If grid is visible, keep it visible after re-render
      const wasVisible = gridContainer.style.display !== "none";
      // Use the same renderExcessGrid logic as in createAllRocketCabinsUI
      const materialOrder = ["A", "B", "C", "D", "E"];
      const tiers = ["T1", "T2", "T3", "T4", "T5"];
      let html = '<table class="excess-grid-table" style="width:auto;border-collapse:collapse;"><tr><th style="min-width:110px"></th>';
      tiers.forEach(tier => {
        html += `<th style="padding:2px 6px;">${tier}</th>`;
      });
      html += "</tr>";
      materialOrder.forEach(matKey => {
        const name = cabin.materials[matKey];
        html += `<tr><td style="padding:2px 6px;">${name}</td>`;
        tiers.forEach(tier => {
          const val = (presetObj.excess[matKey] && typeof presetObj.excess[matKey][tier] === "number") ? presetObj.excess[matKey][tier] : "";
          html += `<td style="padding:2px 6px;"><input type="number" min="0" class="excess-input" data-mat="${matKey}" data-tier="${tier}" value="${val}" style="width:60px;text-align:right;font-size:1em;"></td>`;
        });
        html += "</tr>";
      });
      html += "</table>";
      gridContainer.innerHTML = html;
      // Restore visibility
      gridContainer.style.display = wasVisible ? "" : "none";
    }
  }
  calculateAndRenderRocketCabinSummary(cabinKey);
}

function resetRocketCabin(cabinKey) {
  const cabin = ROCKET_DATA[cabinKey];
  Object.keys(cabin.devices).forEach(deviceName => {
    const selectEl = document.getElementById(`rocket-${cabinKey}-${deviceName.replace(/\s+/g, '-')}`);
    if (selectEl) selectEl.value = "None";
  });
  // Clear excess grid
  localStorage.removeItem(`rocketCabinExcess-${cabinKey}`);
  // Re-render grid if visible
  const gridContainer = document.getElementById(`excessGrid-${cabinKey}`);
  if (gridContainer) {
    const materialOrder = ["A", "B", "C", "D", "E"];
    const tiers = ["T1", "T2", "T3", "T4", "T5"];
    let html = '<table class="excess-grid-table" style="width:auto;border-collapse:collapse;"><tr><th style="min-width:110px"></th>';
    tiers.forEach(tier => {
      html += `<th style="padding:2px 6px;">${tier}</th>`;
    });
    html += "</tr>";
    materialOrder.forEach(matKey => {
      const name = cabin.materials[matKey];
      html += `<tr><td style="padding:2px 6px;">${name}</td>`;
      tiers.forEach(tier => {
        html += `<td style="padding:2px 6px;"><input type="number" min="0" class="excess-input" data-mat="${matKey}" data-tier="${tier}" value="" style="width:60px;text-align:right;font-size:1em;"></td>`;
      });
      html += "</tr>";
    });
    html += "</table>";
    gridContainer.innerHTML = html;
  }
  calculateAndRenderRocketCabinSummary(cabinKey);
}

// --- Main Switcher Logic ---
function setupSwitcher() {
    const gearBtn = document.getElementById('showGearCalc');
    const rocketBtn = document.getElementById('showRocketCalc');
    const steleBtn = document.getElementById('showSteleCalc');
    const gearCalc = document.getElementById('gearCalculator');
    const rocketCalc = document.getElementById('rocketCalculator');
    const steleCalc = document.getElementById('steleCalculator');

    // Helper to deactivate all
    function hideAll() {
        gearCalc.style.display = 'none';
        rocketCalc.style.display = 'none';
        steleCalc.style.display = 'none';
        gearBtn.classList.remove('active');
        rocketBtn.classList.remove('active');
        steleBtn.classList.remove('active');
    }

    gearBtn.addEventListener('click', () => {
        hideAll();
        gearCalc.style.display = 'block';
        gearBtn.classList.add('active');
    });

    rocketBtn.addEventListener('click', () => {
        hideAll();
        rocketCalc.style.display = 'block';
        rocketBtn.classList.add('active');

        // Rebuild rocket cabin UI and summaries
        createAllRocketCabinsUI();
        renderAllRocketCabinSummaries();

        // Add event listeners for the new rocket dropdowns (per-cabin update)
        document.querySelectorAll(".rocket-tier-select").forEach(select => {
          select.addEventListener("change", (e) => {
            const cabinKey = select.getAttribute("data-cabin");
            calculateAndRenderRocketCabinSummary(cabinKey);
          });
        });

        // Load Preset 1 for each cabin if it exists
        Object.keys(ROCKET_DATA).forEach(cabinKey => {
          const preset = localStorage.getItem(`rocketCabinPreset1-${cabinKey}`);
          if (preset) {
            loadRocketCabinPreset(cabinKey, 1);
          }
        });
    });

    steleBtn.addEventListener('click', async () => {
        hideAll();
        steleCalc.style.display = 'block';
        steleBtn.classList.add('active');
        // Dynamically import and initialize Stele calculator
        if (window.initSteleCalculator) {
            window.initSteleCalculator();
        } else {
            try {
                const mod = await import('./stele.js');
                if (mod && typeof mod.initSteleCalculator === 'function') {
                    window.initSteleCalculator = mod.initSteleCalculator;
                    mod.initSteleCalculator();
                }
            } catch (e) {
                // eslint-disable-next-line no-alert
                alert('Failed to load Stele Analysis module.');
            }
        }
    });
}
