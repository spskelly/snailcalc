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

const ROCKET_DATA = {
  "Rebel": {
    title: "Rebel Cabin",
    materials: {
      "A": "Rebel Deck Plate", "B": "Rebel Lens", "C": "Rebel Radio", "D": "Rebel Polyester", "E": "Rebel Nano Chip"
    },
    devices: {
      "Photonic Communicator":  { "A": 40, "B": 40, "C": 40, "D": 0, "E": 0, "Btad": 50000 },
      "Prismatic Armor":        { "A": 40, "B": 40, "C": 0, "D": 40, "E": 0, "Btad": 50000 },
      "Auto-reload Device":     { "A": 40, "B": 0, "C": 40, "D": 40, "E": 0, "Btad": 50000 },
      "Biochemical MOD Module": { "A": 0, "B": 40, "C": 40, "D": 40, "E": 0, "Btad": 50000 },
      "Anti-gravity Device":    { "A": 100, "B": 100, "C": 0, "D": 0, "E": 5, "Btad": 100000 },
      "Dark Matter Reactor":    { "A": 0, "B": 0, "C": 100, "D": 100, "E": 5, "Btad": 100000 },
      "Steel Hall":             { "A": 200, "B": 0, "C": 200, "D": 0, "E": 50, "Btad": 150000 },
      "Silence Hall":           { "A": 0, "B": 200, "C": 0, "D": 200, "E": 50, "Btad": 150000 }
    }
  },
  "Demon God": {
    title: "Demon God Cabin",
    materials: {
      "A": "Demon God Bearing", "B": "Demon God Gear", "C": "Demon God Chip", "D": "Demon God Prism", "E": "Demon God Engine"
    },
    devices: {
      "Particle Accelerator": { "A": 40, "B": 40, "C": 40, "D": 0, "E": 0, "Btad": 50000 },
      "Assist System":        { "A": 40, "B": 40, "C": 0, "D": 40, "E": 0, "Btad": 50000 },
      "Orbit Assimilator":    { "A": 40, "B": 0, "C": 40, "D": 40, "E": 0, "Btad": 50000 },
      "Gravity Propeller":    { "A": 0, "B": 40, "C": 40, "D": 40, "E": 0, "Btad": 50000 },
      "Demon God Matrix":     { "A": 100, "B": 100, "C": 0, "D": 0, "E": 5, "Btad": 100000 },
      "Curvature Engine":     { "A": 0, "B": 0, "C": 100, "D": 100, "E": 5, "Btad": 100000 },
      "Apocalypse Hall":      { "A": 200, "B": 0, "C": 200, "D": 0, "E": 50, "Btad": 150000 },
      "Eternal Hall":         { "A": 0, "B": 200, "C": 0, "D": 200, "E": 50, "Btad": 150000 }
    }
  },
  "Earths Will": {
    title: "Earth's Will Cabin",
    materials: {
      "A": "Earth's Will Mindwave E", "B": "Earth's Will Mindwave A", "C": "Earth's Will Mindwave R", "D": "Earth's Will Mindwave T", "E": "Earth's Will Mindwave H"
    },
    devices: {
      "Rainbow Generator":  { "A": 40, "B": 40, "C": 40, "D": 0, "E": 0, "Btad": 50000 },
      "Gamma Ray":          { "A": 40, "B": 40, "C": 0, "D": 40, "E": 0, "Btad": 50000 },
      "EMP":                { "A": 40, "B": 0, "C": 40, "D": 40, "E": 0, "Btad": 50000 },
      "Space-sensing Radar":{ "A": 0, "B": 40, "C": 40, "D": 40, "E": 0, "Btad": 50000 },
      "Garden of Eden":     { "A": 100, "B": 100, "C": 0, "D": 0, "E": 5, "Btad": 100000 },
      "Domain Holograph":   { "A": 0, "B": 0, "C": 100, "D": 100, "E": 5, "Btad": 100000 },
      "Oracle Hall":        { "A": 200, "B": 0, "C": 200, "D": 0, "E": 50, "Btad": 150000 },
      "Revelation Hall":    { "A": 0, "B": 200, "C": 0, "D": 200, "E": 50, "Btad": 150000 }
    }
  }
};

const ROCKET_TIER_PATH = ["None", "T1", "T2", "T3", "T4", "T5"];

// Amulet options for minion gear slots (up to +4)
const MINION_AMULET_OPTIONS = [
  "Amulet (Red)",
  "Amulet +1",
  "Amulet +2",
  "Amulet +3",
  "Amulet +4"
];