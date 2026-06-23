// Cooking Calculator Data
// All recipes, vendor configurations, and economic constants

// The 12 standard recipe slots every vendor follows (meat / veg / spice).
// A recipe's ingredient amounts are determined by its slot position below.
const RECIPE_TIERS = [
  { meat: 1  },                     // 0  meat only
  { meat: 3  },                     // 1
  { meat: 5  },                     // 2
  { meat: 2,  veg: 1  },            // 3  meat + veg
  { meat: 3,  veg: 2  },            // 4
  { meat: 4,  veg: 2  },            // 5
  { meat: 6,  veg: 3  },            // 6
  { meat: 8,  veg: 4  },            // 7
  { meat: 10, veg: 6  },            // 8
  { meat: 5,  veg: 2, spice: 1 },   // 9  meat + veg + spice
  { meat: 8,  veg: 5, spice: 3 },   // 10
  { meat: 20, veg: 10, spice: 5 },  // 11
];

const COOKING_RECIPES = {};

// Register one vendor's recipes. `prefix` is the ingredient-field prefix
// ("clown" | "mirac" | "beast" | "witch"). entries[i] maps to RECIPE_TIERS[i].
//   entry = [id, name]                      -> ratio from the template by slot
//   entry = [id, name, { meat, veg, spice }] -> override the template ratio
//   entry = null                             -> empty slot (no recipe)
function defineVendor(prefix, entries) {
  entries.forEach((entry, slot) => {
    if (!entry) return;
    const [id, name, overrides] = entry;
    const amt = Object.assign({}, RECIPE_TIERS[slot], overrides);
    COOKING_RECIPES[id] = {
      name: name,
      defaultStars: 1,
      defaultPrice: 0,
      clownMeat: 0, clownVegetable: 0, clownSpice: 0,
      miracMeat: 0, miracVegetable: 0, miracSpice: 0,
      beastMeat: 0, beastVegetable: 0, beastSpice: 0,
      witchMeat: 0, witchVegetable: 0, witchSpice: 0,
    };
    COOKING_RECIPES[id][prefix + "Meat"]      = amt.meat  || 0;
    COOKING_RECIPES[id][prefix + "Vegetable"] = amt.veg   || 0;
    COOKING_RECIPES[id][prefix + "Spice"]     = amt.spice || 0;
  });
}

// Clown Vendor
defineVendor("clown", [
  ["fried_stinkworm",     "Fried Stinkworm"],
  ["goblin_burger",       "Goblin Burger"],
  ["toad_egg_salad",      "Toad Egg Salad"],
  ["rust_pudding",        "Rust Pudding"],
  ["braised_gumball",     "Braised Gumball"],
  ["garlic_dried_gecko",  "Garlic Dried Gecko"],
  ["fried_demon_beef_rib","Fried Demon Beef Rib"],
  ["teriyaki_blood_elf",  "Teriyaki Blood Elf"],
  ["worm_cheese",         "Worm Cheese"],
  ["spider_eyeball_soup", "Spider Eyeball Soup"],
  ["spicy_griffon_claw",  "Spicy Griffon Claw"],
  ["lube_cheese_brick",   "Lube-Cheese Brick"],
]);

// Miraculand Vendor
defineVendor("mirac", [
  ["nuclear_bbq_oyster",   "Nuclear BBQ Oyster"],
  ["marinated_octopus",    "Marinated Octopus"],
  ["manta_ray_sashimi",    "Manta Ray Sashimi"],
  ["braised_dire_shrimp",  "Braised Dire Shrimp"],
  ["stir_fried_sea_dragon","Stir-fried Sea Dragon"],
  ["sea_salt_cheese",      "Sea Salt Cheese"],
  ["mosasaur_teppanyaki",  "Mosasuar Teppanyaki"],
  ["stir_fried_sea_snake", "Stir-fried Sea Snake"],
  ["fermented_squid",      "Fermented Squid"],
  ["sour_merman_fin",      "Sour Merman Fin"],
  ["grilled_horn_shark",   "Grilled Horn Shark"],
  ["naga_fin_soup",        "Naga Fin Soup"],
]);

// Orc Hunter's Tribe
defineVendor("beast", [
  ["bite_back_biscuits",   "Bite-Back Biscuits"],
  ["salamander_brew",      "Salamander Brew"],
  ["dwarven_flame_wine",   "Dwarven Flame Wine"],
  ["bane_spider_pudding",  "Bane Spider Pudding"],
  ["smoked_spider",        "Smoked Spider"],
  ["dry_ice_soda",         "Dry Ice Soda"],
  ["pickled_deathcaller",  "Pickled Deathcaller"],
  ["braised_wolfclaw",     "Braised Wolfclaw"],
  ["fried_fire_dragon_egg","Fried Fire Dragon Egg"],
  ["siliconmon_shortcake", "Siliconmon Shortcake"],
  ["pufferfish_mousse",    "Pufferfish Mousse"],
  ["elf_noodle",           "Elf Noodle"],
]);

// Witch Alchemy Store
// Placeholders (witch_r05+) carry the known ratio so further-progressed players
// can use the calculator now. To name one later, change ONLY the name string and
// keep the id (ids are persisted in saved/exported configs).
defineVendor("witch", [
  ["smoked_cerberus",   "Smoked Cerberus"],          // 0  meat 1
  ["slug_jelly",        "Slug Jelly"],               // 1  meat 3
  ["dragonhorn_bun",    "Dragonhorn Bun"],           // 2  meat 5
  ["worm_with_truffle", "Worm with Truffle"],        // 3  meat 2 / veg 1
  ["steel_baked_dire_bird", "Steel Baked Dire Bird"],// 4  meat 3 / veg 2
  ["ghoul_salad", "Ghoul Salad"],                    // 5  meat 4 / veg 2
  ["fried_burrowing_bug", "Fried Burrowing Bug"],    // 6  meat 6 / veg 3
  ["witch_r08", "Witch Recipe (8/4)"],               // 7  meat 8 / veg 4
  ["witch_r09", "Witch Recipe (10/6)"],              // 8  meat 10 / veg 6
  ["witch_r10", "Witch Recipe (5/2/1)"],             // 9  meat 5 / veg 2 / spice 1
  ["witch_r11", "Witch Recipe (8/5/3)"],             // 10 meat 8 / veg 5 / spice 3
  ["witch_r12", "Witch Recipe (20/10/5)"],           // 11 meat 20 / veg 10 / spice 5
]);

// Default vendor configurations
const DEFAULT_VENDORS = {
  clown: {
    name: "Clown Vendor",
    enabled: true,
    preset: "all-three",
    meatEnabled: true,
    meatRate: 0.65,
    vegetableEnabled: true,
    vegetableRate: 0.25,
    spiceEnabled: true,
    spiceRate: 0.10
  },
  miraculand: {
    name: "Miraculand Vendor",
    enabled: true,
    preset: "none",
    meatEnabled: false,
    meatRate: 0.00,
    vegetableEnabled: false,
    vegetableRate: 0.00,
    spiceEnabled: false,
    spiceRate: 0.00
  },
  beast: {
    name: "Orc Hunter's Tribe",
    enabled: true,
    preset: "none",
    meatEnabled: false,
    meatRate: 0.00,
    vegetableEnabled: false,
    vegetableRate: 0.00,
    spiceEnabled: false,
    spiceRate: 0.00
  },
  witch: {
    name: "Witch Alchemy Store",
    enabled: true,
    preset: "none",
    meatEnabled: false,
    meatRate: 0.00,
    vegetableEnabled: false,
    vegetableRate: 0.00,
    spiceEnabled: false,
    spiceRate: 0.00
  }
};

// Default shop configurations
const DEFAULT_SHOP = {
  supplyOrdersPerHour: 0,
  supplyDeals: {
    enabled: false,
    quantity: 0,
    cost: 100,
    supplyOrdersEach: 20
  },
  vegetablePurchase: {
    enabled: false,
    quantity: 0,
    cost: 220
  },
  spicePurchase: {
    enabled: false,
    quantity: 0,
    cost: 360
  },
  miracVegetablePurchase: {
    enabled: false,
    quantity: 0,
    cost: 270
  },
  miracSpicePurchase: {
    enabled: false,
    quantity: 0,
    cost: 450
  },
  beastVegetablePurchase: {
    enabled: false,
    quantity: 0,
    cost: 360
  },
  beastSpicePurchase: {
    enabled: false,
    quantity: 0,
    cost: 600
  },
  witchVegetablePurchase: {
    enabled: false,
    quantity: 0,
    cost: 450  // estimated (~1.25x beast vegetable cost of 360)
  },
  witchSpicePurchase: {
    enabled: false,
    quantity: 0,
    cost: 750  // estimated (~1.25x beast spice cost of 600)
  },
  skillBooks: {
    enabled: false,
    quantity: 0,
    cost: 5000,
    level: 1  // 1 = 5000g, 2 = 10000g, 3 = 15000g
  }
};

// Mega Stew values (empirically derived)
const MEGA_STEW_VALUES = {
  clownMeat: 29.00,
  clownVegetable: 86.50,
  clownSpice: 156.00,
  miracMeat: 36.00,
  miracVegetable: 108,
  miracSpice: 195.00,
  beastMeat: 48.00,      // 16-80 range, mid = 48
  beastVegetable: 144,   // 48-240 range, mid = 144
  beastSpice: 260,       // 120-400 range, mid = 260
  witchMeat: 60.00,      // 20-100 range, mid = 60
  witchVegetable: 180,   // 60-300 range, mid = 180
  witchSpice: 325        // ~150-500 range, mid = 325 (estimated, ~5.4x witch meat)
};

// Display order is derived from registration order (vendor order, then slot
// order within each vendor). Adding a recipe via defineVendor() above is the
// single source of truth — no second list to keep in sync.
const RECIPE_ORDER = Object.keys(COOKING_RECIPES);
