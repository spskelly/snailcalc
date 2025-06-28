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
for (let i = 13; i <= 18; i++) {
  snailRow3.appendChild(createSlotElement(`snail${i}`, true));
}

const minionSlots = document.getElementById("minion-slots");
for (let i = 1; i <= 6; i++) {
  minionSlots.appendChild(createSlotElement(`slot${i}`, false));
}

function calculateMinionTotals() {
  let totalEye = 0,
    totalOrange = 0,
    totalAbyss = 0,
    totalHeaven = 0,
    totalGlue = 0,
    totalBTad = 0,
    totalDgCrystal = 0;

  for (let i = 1; i <= 6; i++) {
    const selectEl = document.getElementById("slot" + i);
    const upgrade = selectEl.value;
    const gearData = MINION_GEAR[upgrade]; // Directly look up the cumulative data

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

  document.getElementById("minionEyeTotal").textContent = totalEye.toLocaleString();
  document.getElementById("minionOrangeTotal").textContent = totalOrange.toLocaleString();
  document.getElementById("minionAbyssTotal").textContent = totalAbyss.toLocaleString();
  document.getElementById("minionHeavenTotal").textContent = totalHeaven.toLocaleString();
  document.getElementById("minionGlueTotal").textContent = totalGlue.toLocaleString();
  document.getElementById("minionBtadTotal").textContent = totalBTad.toLocaleString();
  document.getElementById("minionDgCrystalTotal").textContent = totalDgCrystal.toLocaleString();
}

function calculateSnailTotals() {
  let totalEoH = 0,
    totalOrange = 0,
    totalAbyss = 0,
    totalHeaven = 0,
    totalGlue = 0,
    totalBTad = 0,
    totalWillCrystal = 0;

  for (let i = 1; i <= 18; i++) {
    const selectEl = document.getElementById("snail" + i);
    const upgrade = selectEl.value;
    const gearData = SNAIL_GEAR[upgrade]; // Directly look up the cumulative data

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

  document.getElementById("eyeTotal").textContent = totalEoH.toLocaleString();
  document.getElementById("orangeTotal").textContent = totalOrange.toLocaleString();
  document.getElementById("abyssTotal").textContent = totalAbyss.toLocaleString();
  document.getElementById("heavenTotal").textContent = totalHeaven.toLocaleString();
  document.getElementById("glueTotal").textContent = totalGlue.toLocaleString();
  document.getElementById("btadTotal").textContent = totalBTad.toLocaleString();
  document.getElementById("willCrystalTotal").textContent = totalWillCrystal.toLocaleString();
}

function resetSnailGear() {
  for (let i = 1; i <= 18; i++) {
    const selectEl = document.getElementById("snail" + i);
    if (selectEl) {
      selectEl.value = "None";
    }
  }
  calculateSnailTotals();
  saveToLocalStorage();
}

function resetMinionGear() {
  for (let i = 1; i <= 6; i++) {
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

  for (let i = 1; i <= 18; i++) {
    const selectEl = document.getElementById("snail" + i);
    if (selectEl) snailSettings[i] = selectEl.value;
  }

  for (let i = 1; i <= 6; i++) {
    const selectEl = document.getElementById("slot" + i);
    if (selectEl) minionSettings[i] = selectEl.value;
  }

  localStorage.setItem("snailGearSettings", JSON.stringify(snailSettings));
  localStorage.setItem("minionGearSettings", JSON.stringify(minionSettings));
}

function loadFromLocalStorage() {
  const snailSettings = JSON.parse(localStorage.getItem("snailGearSettings") || "{}");
  const minionSettings = JSON.parse(localStorage.getItem("minionGearSettings") || "{}");

  for (let i = 1; i <= 18; i++) {
    const selectEl = document.getElementById("snail" + i);
    if (selectEl) selectEl.value = snailSettings[i] || "None";
  }

  for (let i = 1; i <= 6; i++) {
    const selectEl = document.getElementById("slot" + i);
    if (selectEl) selectEl.value = minionSettings[i] || "None";
  }

  calculateSnailTotals();
  calculateMinionTotals();
}

function addEventListeners() {
  document.querySelectorAll(".upgrade-select").forEach(select => {
    select.addEventListener("change", () => {
      calculateSnailTotals();
      calculateMinionTotals();
      saveToLocalStorage();
    });
  });

  document.getElementById("resetSnail").addEventListener("click", resetSnailGear);
  document.getElementById("resetMinion").addEventListener("click", resetMinionGear);
}

// Initial setup
loadFromLocalStorage();
addEventListeners();