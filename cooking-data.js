// Cooking Calculator Data
// All recipes, vendor configurations, and economic constants

const COOKING_RECIPES = {
  "fried_stinkworm": {
    name: "Fried Stinkworm",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 1,
    clownVeggie: 0,
    clownSpice: 0,
    miracMeat: 0,
    miracVeggie: 0,
    miracSpice: 0
  },
  "goblin_burger": {
    name: "Goblin Burger",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 3,
    clownVeggie: 0,
    clownSpice: 0,
    miracMeat: 0,
    miracVeggie: 0,
    miracSpice: 0
  },
  "toad_egg_salad": {
    name: "Toad Egg Salad",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 5,
    clownVeggie: 0,
    clownSpice: 0,
    miracMeat: 0,
    miracVeggie: 0,
    miracSpice: 0
  },
  "rust_pudding": {
    name: "Rust Pudding",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 2,
    clownVeggie: 1,
    clownSpice: 0,
    miracMeat: 0,
    miracVeggie: 0,
    miracSpice: 0
  },
  "braised_gumball": {
    name: "Braised Gumball",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 3,
    clownVeggie: 2,
    clownSpice: 0,
    miracMeat: 0,
    miracVeggie: 0,
    miracSpice: 0
  },
  "garlic_dried_gecko": {
    name: "Garlic Dried Gecko",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 4,
    clownVeggie: 2,
    clownSpice: 0,
    miracMeat: 0,
    miracVeggie: 0,
    miracSpice: 0
  },
  "fried_demon_beef_rib": {
    name: "Fried Demon Beef Rib",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 6,
    clownVeggie: 3,
    clownSpice: 0,
    miracMeat: 0,
    miracVeggie: 0,
    miracSpice: 0
  },
  "teriyaki_blood_elf": {
    name: "Teriyaki Blood Elf",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 8,
    clownVeggie: 4,
    clownSpice: 0,
    miracMeat: 0,
    miracVeggie: 0,
    miracSpice: 0
  },
  "worm_cheese": {
    name: "Worm Cheese",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 10,
    clownVeggie: 6,
    clownSpice: 0,
    miracMeat: 0,
    miracVeggie: 0,
    miracSpice: 0
  },
  "spider_eyeball_soup": {
    name: "Spider Eyeball Soup",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 5,
    clownVeggie: 2,
    clownSpice: 1,
    miracMeat: 0,
    miracVeggie: 0,
    miracSpice: 0
  },
  "spicy_griffon_claw": {
    name: "Spicy Griffon Claw",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 8,
    clownVeggie: 5,
    clownSpice: 3,
    miracMeat: 0,
    miracVeggie: 0,
    miracSpice: 0
  },
  "nuclear_bbq_oyster": {
    name: "Nuclear BBQ Oyster",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 0,
    clownVeggie: 0,
    clownSpice: 0,
    miracMeat: 1,
    miracVeggie: 0,
    miracSpice: 0
  },
  "marinated_octopus": {
    name: "Marinated Octopus",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 0,
    clownVeggie: 0,
    clownSpice: 0,
    miracMeat: 3,
    miracVeggie: 0,
    miracSpice: 0
  },
  "engine_cheese_biscuit": {
    name: "Engine Cheese Biscuit",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 20,
    clownVeggie: 10,
    clownSpice: 5,
    miracMeat: 0,
    miracVeggie: 0,
    miracSpice: 0
  },
  "manta_ray_sashimi": {
    name: "Manta Ray Sashimi",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 0,
    clownVeggie: 0,
    clownSpice: 0,
    miracMeat: 5,
    miracVeggie: 0,
    miracSpice: 0
  },
  "braised_dire_shrimp": {
    name: "Braised Dire Shrimp",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 0,
    clownVeggie: 0,
    clownSpice: 0,
    miracMeat: 2,
    miracVeggie: 1,
    miracSpice: 0
  },
  "stir_fried_sea_dragon": {
    name: "Stir-fried Sea Dragon",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 0,
    clownVeggie: 0,
    clownSpice: 0,
    miracMeat: 3,
    miracVeggie: 2,
    miracSpice: 0
  },
  "sea_salt_cheese": {
    name: "Sea Salt Cheese",
    defaultStars: 1,
    defaultPrice: 0,
    clownMeat: 0,
    clownVeggie: 0,
    clownSpice: 0,
    miracMeat: 4,
    miracVeggie: 2,
    miracSpice: 0
  },
};

// Default vendor configurations
const DEFAULT_VENDORS = {
  clown: {
    name: "Clown Vendor",
    enabled: true,
    meatEnabled: true,
    meatRate: 0.65,
    veggieEnabled: true,
    veggieRate: 0.25,
    spiceEnabled: true,
    spiceRate: 0.10
  },
  miraculand: {
    name: "Miraculand Vendor",
    enabled: true,
    meatEnabled: true,
    meatRate: 1.00,
    veggieEnabled: false,
    veggieRate: 0.00,
    spiceEnabled: false,
    spiceRate: 0.00
  }
};

// Default shop configurations
const DEFAULT_SHOP = {
  supplyOrdersPerHour: 30,
  supplyDeals: {
    enabled: false,
    quantity: 0,
    cost: 100,
    supplyOrdersEach: 20
  },
  veggiePurchase: {
    enabled: false,
    quantity: 0,
    cost: 220
  },
  spicePurchase: {
    enabled: false,
    quantity: 0,
    cost: 360
  }
};

// Mega Stew values (empirically derived)
const MEGA_STEW_VALUES = {
  clownMeat: 29.00,
  clownVeggie: 86.50,
  clownSpice: 156.00,
  miracMeat: 36.00, 
  miracVeggie: 108,
  miracSpice: 193.5 // est
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
  "engine_cheese_biscuit",
  "nuclear_bbq_oyster",
  "marinated_octopus",
  "manta_ray_sashimi",
  "braised_dire_shrimp",
  "stir_fried_sea_dragon",
  "sea_salt_cheese",
];
