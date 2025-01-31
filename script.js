function createSlotElement(id, isSnail = false) {
  const container = document.createElement("div");
  container.className = "slot-container";

  const select = document.createElement("select");
  select.id = id;
  select.className = "upgrade-select";

  const options = isSnail
    ? ["Red", "+1", "+2", "+3", "+4", "+5", "+6"]
    : ["Red", "+1", "+2", "+3", "+4"];

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

for (let i = 1; i <= 6; i++) {
  snailRow1.appendChild(createSlotElement(`snail${i}`, true));
}
for (let i = 7; i <= 12; i++) {
  snailRow2.appendChild(createSlotElement(`snail${i}`, true));
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
    totalCrystal = 0;

  for (let i = 1; i <= 6; i++) {
    const selectEl = document.getElementById("slot" + i);
    if (!selectEl) continue;

    const upgrade = selectEl.value;
    const mg = MINION_GEAR[upgrade];
    if (!mg) continue;

    // Add Minion Gear base cost
    totalEye += mg.eye;
    totalOrange += mg.orange;
    totalAbyss += mg.abyss;
    totalHeaven += mg.heaven;
    totalGlue += mg.glue;
    totalBTad += mg.b_tad;

    // If it requires a Demon God Amulet, add that cost too
    if (mg.dgNeeded) {
      const amLevel = mg.dgLevel;
      const amData = AMULET[amLevel];
      if (amData) {
        totalEye += amData.eye;
        totalOrange += amData.orange;
        totalAbyss += amData.abyss;
        totalHeaven += amData.heaven;
        totalGlue += amData.glue;
        totalBTad += amData.b_tad;
        totalCrystal += amData.dg_crystal;
      }
    }
  }

  document.getElementById("minionEyeTotal").textContent =
    totalEye.toLocaleString();
  document.getElementById("minionOrangeTotal").textContent =
    totalOrange.toLocaleString();
  document.getElementById("minionAbyssTotal").textContent =
    totalAbyss.toLocaleString();
  document.getElementById("minionHeavenTotal").textContent =
    totalHeaven.toLocaleString();
  document.getElementById("minionGlueTotal").textContent =
    totalGlue.toLocaleString();
  document.getElementById("minionBtadTotal").textContent =
    totalBTad.toLocaleString();
  document.getElementById("minionDgCrystalTotal").textContent =
    totalCrystal.toLocaleString();
}

function calculateSnailTotals() {
  let totalEoH = 0,
    totalOrange = 0,
    totalAbyss = 0,
    totalHeaven = 0,
    totalGlue = 0,
    totalBTad = 0,
    totalWillCrystal = 0;

  for (let i = 1; i <= 12; i++) {
    const selectEl = document.getElementById("snail" + i);
    if (!selectEl) continue;

    const upgrade = selectEl.value;
    const sgData = SNAIL_GEAR[upgrade];
    if (!sgData) continue;

    // Add snail gear costs
    totalEoH += sgData.eoh;
    totalAbyss += sgData.abyss;
    totalHeaven += sgData.heaven;
    totalGlue += sgData.glue;
    totalBTad += sgData.b_tad;

    // Check if a Will Amulet is needed
    if (sgData.willNeeded) {
      const willLevel = sgData.willLevel;
      const waData = WILL_AMULET[willLevel];
      if (waData) {
        totalEoH += waData.eoh;
        totalOrange += waData.orange;
        totalAbyss += waData.abyss;
        totalHeaven += waData.heaven;
        totalGlue += waData.glue;
        totalBTad += waData.b_tad;
        totalWillCrystal += waData.will_crystal;
      }
    }
  }

  // Update snail totals
  document.getElementById("eyeTotal").textContent = totalEoH.toLocaleString();
  document.getElementById("orangeTotal").textContent =
    totalOrange.toLocaleString();
  document.getElementById("abyssTotal").textContent =
    totalAbyss.toLocaleString();
  document.getElementById("heavenTotal").textContent =
    totalHeaven.toLocaleString();
  document.getElementById("glueTotal").textContent = totalGlue.toLocaleString();
  document.getElementById("btadTotal").textContent = totalBTad.toLocaleString();
  document.getElementById("willCrystalTotal").textContent =
    totalWillCrystal.toLocaleString();
}

function resetSnailGear() {
  for (let i = 1; i <= 12; i++) {
    const selectEl = document.getElementById("snail" + i);
    if (selectEl) {
      selectEl.value = "Red";
    }
  }
  calculateSnailTotals();
  saveToLocalStorage();
}

function resetMinionGear() {
  for (let i = 1; i <= 6; i++) {
    const selectEl = document.getElementById("slot" + i);
    if (selectEl) {
      selectEl.value = "Red";
    }
  }
  calculateMinionTotals();
  saveToLocalStorage();
}

function saveToLocalStorage() {
  const snailSettings = {};
  const minionSettings = {};

  for (let i = 1; i <= 12; i++) {
    const selectEl = document.getElementById("snail" + i);
    if (selectEl) {
      snailSettings[i] = selectEl.value;
    }
  }

  for (let i = 1; i <= 6; i++) {
    const selectEl = document.getElementById("slot" + i);
    if (selectEl) {
      minionSettings[i] = selectEl.value;
    }
  }

  localStorage.setItem("snailGearSettings", JSON.stringify(snailSettings));
  localStorage.setItem("minionGearSettings", JSON.stringify(minionSettings));
}

function loadFromLocalStorage() {
  const snailSettings = JSON.parse(
    localStorage.getItem("snailGearSettings") || "{}"
  );
  const minionSettings = JSON.parse(
    localStorage.getItem("minionGearSettings") || "{}"
  );

  for (let i = 1; i <= 12; i++) {
    const selectEl = document.getElementById("snail" + i);
    if (selectEl) {
      selectEl.value = snailSettings[i] || "Red";
    }
  }

  for (let i = 1; i <= 6; i++) {
    const selectEl = document.getElementById("slot" + i);
    if (selectEl) {
      selectEl.value = minionSettings[i] || "Red";
    }
  }

  calculateSnailTotals();
  calculateMinionTotals();
}

function initializeEventListeners() {
  // Minion gear listeners
  for (let i = 1; i <= 6; i++) {
    const selectEl = document.getElementById("slot" + i);
    if (selectEl) {
      selectEl.addEventListener("change", () => {
        calculateMinionTotals();
        saveToLocalStorage();
      });
    }
  }

  // Snail gear listeners
  for (let i = 1; i <= 12; i++) {
    const selectEl = document.getElementById("snail" + i);
    if (selectEl) {
      selectEl.addEventListener("change", () => {
        calculateSnailTotals();
        saveToLocalStorage();
      });
    }
  }

  // Reset button listeners
  document
    .getElementById("resetSnail")
    .addEventListener("click", resetSnailGear);
  document
    .getElementById("resetMinion")
    .addEventListener("click", resetMinionGear);

  // Load saved settings on page load
  loadFromLocalStorage();
}

// Initialize calculations and listeners
initializeEventListeners();
calculateMinionTotals();
calculateSnailTotals();