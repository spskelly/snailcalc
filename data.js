const SNAIL_GEAR = {
  // Base items
  "None": { eoh: 0, orange: 0, abyss: 0, heaven: 0, glue: 0, b_tad: 0, will_crystal: 0 },
  "Orange": { eoh: 0, orange: 0, abyss: 0, heaven: 0, glue: 100, b_tad: 24000, will_crystal: 0 },
  "Red": { eoh: 1, orange: 0, abyss: 0, heaven: 0, glue: 300, b_tad: 120000, will_crystal: 0 },
  "Time Wanderer": { eoh: 0, orange: 0, abyss: 0, heaven: 0, glue: 4500, b_tad: 1512000, will_crystal: 0 },

  // Cumulative costs for the +N upgrade path
  "+1": { eoh: 3, orange: 0, abyss: 1, heaven: 1, glue: 1160, b_tad: 520000, will_crystal: 1 },
  "+2": { eoh: 5, orange: 100, abyss: 3, heaven: 3, glue: 2010, b_tad: 930000, will_crystal: 2 },
  "+3": { eoh: 8, orange: 300, abyss: 6, heaven: 6, glue: 3210, b_tad: 1540000, will_crystal: 3 },
  "+4": { eoh: 12, orange: 600, abyss: 10, heaven: 10, glue: 4820, b_tad: 2390000, will_crystal: 4 },
  "+5": { eoh: 17, orange: 1000, abyss: 15, heaven: 15, glue: 6900, b_tad: 3520000, will_crystal: 5 },
  "+6": { eoh: 23, orange: 1500, abyss: 21, heaven: 21, glue: 9510, b_tad: 4970000, will_crystal: 6 },
  "+7": { eoh: 28, orange: 2100, abyss: 28, heaven: 28, glue: 12760, b_tad: 6780000, will_crystal: 7 },
  "+8": { eoh: 34, orange: 2800, abyss: 36, heaven: 36, glue: 16930, b_tad: 9210000, will_crystal: 8 },
  "+9": { eoh: 41, orange: 3600, abyss: 45, heaven: 45, glue: 22320, b_tad: 12430000, will_crystal: 9 }
};

const MINION_GEAR = {
  "None": { eye: 0, orange: 0, abyss: 0, heaven: 0, glue: 0, b_tad: 0, dg_crystal: 0 },
  "Red": { eye: 1, orange: 0, abyss: 1, heaven: 0, glue: 300, b_tad: 120000, dg_crystal: 0 },

  // Cumulative costs for the +N upgrade path
  "+1": { eye: 2, orange: 0, abyss: 2, heaven: 1, glue: 860, b_tad: 400000, dg_crystal: 1 },
  "+2": { eye: 4, orange: 100, abyss: 4, heaven: 3, glue: 1710, b_tad: 810000, dg_crystal: 2 },
  "+3": { eye: 7, orange: 300, abyss: 7, heaven: 6, glue: 2910, b_tad: 1420000, dg_crystal: 3 },
  "+4": { eye: 11, orange: 600, abyss: 11, heaven: 10, glue: 4590, b_tad: 2270000, dg_crystal: 4 },
  "+5": { eye: 16, orange: 1000, abyss: 16, heaven: 15, glue: 6670, b_tad: 3560000, dg_crystal: 5 }
};