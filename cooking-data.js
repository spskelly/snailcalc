// Cooking Calculator Data
// All recipes, vendor configurations, and economic constants

const COOKING_RECIPES = {
  "fried_stinkworm": {
    name: "Fried Stinkworm",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 1,
    clownVegetable: 0,
    clownSpice: 0,
    miracMeat: 0,
    miracVegetable: 0,
    miracSpice: 0
  },
  "goblin_burger": {
    name: "Goblin Burger",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 3,
    clownVegetable: 0,
    clownSpice: 0,
    miracMeat: 0,
    miracVegetable: 0,
    miracSpice: 0
  },
  "toad_egg_salad": {
    name: "Toad Egg Salad",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 5,
    clownVegetable: 0,
    clownSpice: 0,
    miracMeat: 0,
    miracVegetable: 0,
    miracSpice: 0
  },
  "rust_pudding": {
    name: "Rust Pudding",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 2,
    clownVegetable: 1,
    clownSpice: 0,
    miracMeat: 0,
    miracVegetable: 0,
    miracSpice: 0
  },
  "braised_gumball": {
    name: "Braised Gumball",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 3,
    clownVegetable: 2,
    clownSpice: 0,
    miracMeat: 0,
    miracVegetable: 0,
    miracSpice: 0
  },
  "garlic_dried_gecko": {
    name: "Garlic Dried Gecko",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 4,
    clownVegetable: 2,
    clownSpice: 0,
    miracMeat: 0,
    miracVegetable: 0,
    miracSpice: 0
  },
  "fried_demon_beef_rib": {
    name: "Fried Demon Beef Rib",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 6,
    clownVegetable: 3,
    clownSpice: 0,
    miracMeat: 0,
    miracVegetable: 0,
    miracSpice: 0
  },
  "teriyaki_blood_elf": {
    name: "Teriyaki Blood Elf",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 8,
    clownVegetable: 4,
    clownSpice: 0,
    miracMeat: 0,
    miracVegetable: 0,
    miracSpice: 0
  },
  "worm_cheese": {
    name: "Worm Cheese",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 10,
    clownVegetable: 6,
    clownSpice: 0,
    miracMeat: 0,
    miracVegetable: 0,
    miracSpice: 0
  },
  "spider_eyeball_soup": {
    name: "Spider Eyeball Soup",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 5,
    clownVegetable: 2,
    clownSpice: 1,
    miracMeat: 0,
    miracVegetable: 0,
    miracSpice: 0
  },
  "spicy_griffon_claw": {
    name: "Spicy Griffon Claw",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 8,
    clownVegetable: 5,
    clownSpice: 3,
    miracMeat: 0,
    miracVegetable: 0,
    miracSpice: 0
  },
  "nuclear_bbq_oyster": {
    name: "Nuclear BBQ Oyster",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 0,
    clownVegetable: 0,
    clownSpice: 0,
    miracMeat: 1,
    miracVegetable: 0,
    miracSpice: 0
  },
  "marinated_octopus": {
    name: "Marinated Octopus",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 0,
    clownVegetable: 0,
    clownSpice: 0,
    miracMeat: 3,
    miracVegetable: 0,
    miracSpice: 0
  },
  "gouda_grease_galette": {
    name: "Gouda-Grease Galette",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 20,
    clownVegetable: 10,
    clownSpice: 5,
    miracMeat: 0,
    miracVegetable: 0,
    miracSpice: 0
  },
  "manta_ray_sashimi": {
    name: "Manta Ray Sashimi",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 0,
    clownVegetable: 0,
    clownSpice: 0,
    miracMeat: 5,
    miracVegetable: 0,
    miracSpice: 0
  },
  "braised_dire_shrimp": {
    name: "Braised Dire Shrimp",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 0,
    clownVegetable: 0,
    clownSpice: 0,
    miracMeat: 2,
    miracVegetable: 1,
    miracSpice: 0
  },
  "stir_fried_sea_dragon": {
    name: "Stir-fried Sea Dragon",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 0,
    clownVegetable: 0,
    clownSpice: 0,
    miracMeat: 3,
    miracVegetable: 2,
    miracSpice: 0
  },
  "sea_salt_cheese": {
    name: "Sea Salt Cheese",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 0,
    clownVegetable: 0,
    clownSpice: 0,
    miracMeat: 4,
    miracVegetable: 2,
    miracSpice: 0
  },
  "mosasaur_teppanyaki": {
    name: "Mosasuar Teppanyaki",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 0,
    clownVegetable: 0,
    clownSpice: 0,
    miracMeat: 6,
    miracVegetable: 3,
    miracSpice: 0
  },
  "stir_fried_sea_snake": {
    name: "Stir-fried Sea Snake",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 0,
    clownVegetable: 0,
    clownSpice: 0,
    miracMeat: 8,
    miracVegetable: 4,
    miracSpice: 0
  },
  "sour_merman_fin": {
    name: "Sour Merman Fin",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 0,
    clownVegetable: 0,
    clownSpice: 0,
    miracMeat: 5,
    miracVegetable: 2,
    miracSpice: 1
  },
};

// Default vendor configurations
const DEFAULT_VENDORS = {
  clown: {
    name: "Clown Vendor",
    enabled: true,
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
    meatEnabled: true,
    meatRate: 1.00,
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
  skillBooks: {
    enabled: false,
    quantity: 0,
    cost: 5000,
    level: 1  // 1 = 5000g, 2 = 10000g
  }
};

// Mega Stew values (empirically derived)
const MEGA_STEW_VALUES = {
  clownMeat: 29.00,
  clownVegetable: 86.50,
  clownSpice: 156.00,
  miracMeat: 36.00, 
  miracVegetable: 108,
  miracSpice: 195.00
};

// Recipe order for display (roughly by complexity/unlock order)
const RECIPE_ORDER = [
  "fried_stinkworm",
  "goblin_burger",
  "toad_egg_salad",
  "rust_pudding",
  "braised_gumball",
  "garlic_dried_gecko",
  "fried_demon_beef_rib",
  "teriyaki_blood_elf",
  "worm_cheese",
  "spider_eyeball_soup",
  "spicy_griffon_claw",
  "gouda_grease_galette",
  "nuclear_bbq_oyster",
  "marinated_octopus",
  "manta_ray_sashimi",
  "braised_dire_shrimp",
  "stir_fried_sea_dragon",
  "sea_salt_cheese",
  "mosasaur_teppanyaki",
  "stir_fried_sea_snake",
  "sour_merman_fin"
];
