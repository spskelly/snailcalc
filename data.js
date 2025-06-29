// Incremental costs for snail gear upgrades
const SNAIL_GEAR_INCREMENTAL = {
  "None": { eoh: 0, glue: 0, b_tad: 0, requires_red_gear: 0 },
  "Orange": { eoh: 0, glue: 100, b_tad: 24000, requires_red_gear: 0 },
  "Red": { eoh: 1, glue: 300, b_tad: 120000, requires_red_gear: 0 },
  "+1": { eoh: 0, glue: 500, b_tad: 160000, requires_red_gear: 2 },
  "+2": { eoh: 0, glue: 750, b_tad: 250000, requires_red_gear: 0 },
  "+3": { eoh: 0, glue: 1050, b_tad: 360000, requires_red_gear: 0 },
  "+4": { eoh: 0, glue: 1400, b_tad: 490000, requires_red_gear: 0 },
  "+5": { eoh: 0, glue: 1800, b_tad: 640000, requires_red_gear: 0 },
  "+6": { eoh: 0, glue: 2250, b_tad: 810000, requires_red_gear: 0 },
  "+7": { eoh: 0, glue: 2800, b_tad: 1000000, requires_red_gear: 0 },
  "+8": { eoh: 0, glue: 3600, b_tad: 1200000, requires_red_gear: 0 },
  "+9": { eoh: 0, glue: 4500, b_tad: 1500000, requires_red_gear: 0 },
  "Time Wanderer": { eoh: 0, glue: 4500, b_tad: 1512000, requires_red_gear: 0 }
};

// Incremental costs for will amulets (required for snail gear)
const WILL_AMULET_INCREMENTAL = {
  "Red": { abyss: 1, heaven: 1, eoh: 1, glue: 60, orange: 0, b_tad: 120000, will_crystal: 1 },
  "+1": { abyss: 1, heaven: 1, eoh: 1, glue: 100, orange: 100, b_tad: 160000, will_crystal: 0 },
  "+2": { abyss: 1, heaven: 1, eoh: 1, glue: 150, orange: 200, b_tad: 250000, will_crystal: 0 },
  "+3": { abyss: 1, heaven: 1, eoh: 1, glue: 210, orange: 300, b_tad: 360000, will_crystal: 0 },
  "+4": { abyss: 1, heaven: 1, eoh: 1, glue: 280, orange: 400, b_tad: 490000, will_crystal: 0 },
  "+5": { abyss: 1, heaven: 1, eoh: 1, glue: 360, orange: 500, b_tad: 640000, will_crystal: 0 },
  "+6": { abyss: 1, heaven: 1, eoh: 1, glue: 450, orange: 600, b_tad: 810000, will_crystal: 0 },
  "+7": { abyss: 1, heaven: 1, eoh: 1, glue: 560, orange: 700, b_tad: 1000000, will_crystal: 0 },
  "+8": { abyss: 1, heaven: 1, eoh: 1, glue: 720, orange: 800, b_tad: 1200000, will_crystal: 0 }
};

// Incremental costs for minion gear upgrades
const MINION_GEAR_INCREMENTAL = {
  "None": { eye: 0, glue: 0, b_tad: 0, abyss: 0 },
  "Red": { eye: 1, glue: 300, b_tad: 120000, abyss: 1 },
  "+1": { eye: 0, glue: 500, b_tad: 160000, abyss: 0 },
  "+2": { eye: 0, glue: 750, b_tad: 250000, abyss: 0 },
  "+3": { eye: 0, glue: 1050, b_tad: 360000, abyss: 0 },
  "+4": { eye: 0, glue: 1400, b_tad: 490000, abyss: 0 },
  "+5": { eye: 0, glue: 1800, b_tad: 640000, abyss: 0 }
};

// Incremental costs for demon god amulets (required for minion gear)
const DEMON_GOD_AMULET_INCREMENTAL = {
  "None": { abyss: 0, heaven: 0, eye: 0, glue: 0, orange: 0, b_tad: 0, dg_crystal: 0 },
  "Red": { abyss: 1, heaven: 1, eye: 1, glue: 60, orange: 0, b_tad: 120000, dg_crystal: 1 },
  "+1": { abyss: 1, heaven: 1, eye: 1, glue: 100, orange: 100, b_tad: 160000, dg_crystal: 0 },
  "+2": { abyss: 1, heaven: 1, eye: 1, glue: 150, orange: 200, b_tad: 250000, dg_crystal: 0 },
  "+3": { abyss: 1, heaven: 1, eye: 1, glue: 210, orange: 300, b_tad: 360000, dg_crystal: 0 },
  "+4": { abyss: 1, heaven: 1, eye: 1, glue: 280, orange: 400, b_tad: 490000, dg_crystal: 0 },
  "+5": { abyss: 0, heaven: 0, eye: 0, glue: 0, orange: 0, b_tad: 0, dg_crystal: 0 }
};

// Define upgrade paths for cumulative calculation
const SNAIL_UPGRADE_PATH = ["None", "Orange", "Red", "+1", "+2", "+3", "+4", "+5", "+6", "+7", "+8", "+9", "Time Wanderer"];

// Amulet options for snail gear slots
const SNAIL_AMULET_OPTIONS = [
  "Amulet (Red)",
  "Amulet +1",
  "Amulet +2",
  "Amulet +3",
  "Amulet +4",
  "Amulet +5",
  "Amulet +6",
  "Amulet +7",
  "Amulet +8"
];
const MINION_UPGRADE_PATH = ["None", "Red", "+1", "+2", "+3", "+4", "+5"];

// Amulet options for minion gear slots (up to +4)
const MINION_AMULET_OPTIONS = [
  "Amulet (Red)",
  "Amulet +1",
  "Amulet +2",
  "Amulet +3",
  "Amulet +4"
];
