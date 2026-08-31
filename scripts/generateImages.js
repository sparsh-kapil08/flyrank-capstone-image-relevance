import fs from "fs";
import path from "path";

const imgDir = path.resolve("data/images");
if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true });
}

export const DATASET_IMAGES = [
  { id: "img_01", filename: "red_fox_forest.svg", title: "Red Fox in Autumn Forest", category: "animal", subject: "red fox", color: "#d9531e", icon: "🦊" },
  { id: "img_02", filename: "arctic_fox_snow.svg", title: "Arctic Fox in Snow Tundra", category: "animal", subject: "arctic fox", color: "#f0f3f4", icon: "🦊" },
  { id: "img_03", filename: "gray_wolf_woods.svg", title: "Gray Wolf in Winter Woods", category: "animal", subject: "gray wolf", color: "#5d6d7e", icon: "🐺" },
  { id: "img_04", filename: "timber_wolf_cliff.svg", title: "Timber Wolf on Mountain Cliff", category: "animal", subject: "gray wolf", color: "#34495e", icon: "🐺" },
  { id: "img_05", filename: "golden_retriever_dog.svg", title: "Golden Retriever Running in Park", category: "animal", subject: "golden retriever", color: "#f5b041", icon: "🐕" },
  { id: "img_06", filename: "german_shepherd_dog.svg", title: "German Shepherd Dog Sitting Alert", category: "animal", subject: "golden retriever", color: "#ba4a00", icon: "🐕" },
  { id: "img_07", filename: "grizzly_bear_river.svg", title: "Grizzly Bear Fishing in River", category: "animal", subject: "grizzly bear", color: "#6e2c00", icon: "🐻" },
  { id: "img_08", filename: "black_bear_pine.svg", title: "Black Bear Climbing Pine Tree", category: "animal", subject: "grizzly bear", color: "#17202a", icon: "🐻" },
  { id: "img_09", filename: "white_tailed_deer_mist.svg", title: "White-tailed Deer in Morning Mist", category: "animal", subject: "white-tailed deer", color: "#af601a", icon: "🦌" },
  { id: "img_10", filename: "red_deer_stag_meadow.svg", title: "Red Deer Stag in Autumn Meadow", category: "animal", subject: "white-tailed deer", color: "#873600", icon: "🦌" },
  { id: "img_11", filename: "bald_eagle_mountain.svg", title: "Bald Eagle Soaring Over Mountains", category: "animal", subject: "bald eagle", color: "#283747", icon: "🦅" },
  { id: "img_12", filename: "african_lion_savanna.svg", title: "African Lion Resting in Savanna", category: "animal", subject: "african lion", color: "#d4ac0d", icon: "🦁" },
  { id: "img_13", filename: "blurry_wildlife_lowconf.svg", title: "Blurry Distant Animal in Fog", category: "animal", subject: "unidentified object", color: "#95a5a6", icon: "❓" },
  
  { id: "img_14", filename: "margherita_pizza_oven.svg", title: "Wood-fired Margherita Pizza", category: "food", subject: "margherita pizza", color: "#e74c3c", icon: "🍕" },
  { id: "img_15", filename: "pepperoni_pizza_slice.svg", title: "Crispy Pepperoni Pizza Slice", category: "food", subject: "margherita pizza", color: "#c0392b", icon: "🍕" },
  { id: "img_16", filename: "gourmet_cheeseburger_bacon.svg", title: "Gourmet Bacon Cheeseburger", category: "food", subject: "gourmet cheeseburger", color: "#d35400", icon: "🍔" },
  { id: "img_17", filename: "vegan_veggie_burger.svg", title: "Vegan Black Bean Burger", category: "food", subject: "gourmet cheeseburger", color: "#27ae60", icon: "🍔" },
  { id: "img_18", filename: "sushi_nigiri_platter.svg", title: "Assorted Salmon Nigiri Sushi Platter", category: "food", subject: "sushi platter", color: "#eb984e", icon: "🍣" },
  { id: "img_19", filename: "dragon_roll_sushi.svg", title: "Dragon Roll Sushi with Wasabi", category: "food", subject: "sushi platter", color: "#229954", icon: "🍣" },
  { id: "img_20", filename: "creamy_fettuccine_pasta.svg", title: "Creamy Fettuccine Alfredo Pasta", category: "food", subject: "creamy fettuccine pasta", color: "#f9e79f", icon: "🍝" },
  { id: "img_21", filename: "mediterranean_greek_salad.svg", title: "Mediterranean Greek Salad with Feta", category: "food", subject: "mediterranean greek salad", color: "#52be80", icon: "🥗" },
  { id: "img_22", filename: "latte_art_espresso_coffee.svg", title: "Fresh Espresso Latte with Foam Art", category: "food", subject: "latte coffee", color: "#795548", icon: "☕" },
  { id: "img_23", filename: "chocolate_lava_cake_dessert.svg", title: "Warm Chocolate Lava Cake", category: "food", subject: "chocolate lava cake", color: "#422517", icon: "🍰" },
  { id: "img_24", filename: "ambiguous_meal_lowconf.svg", title: "Unclear Food Dish in Low Light", category: "food", subject: "unidentified object", color: "#7f8c8d", icon: "❓" },

  { id: "img_25", filename: "snow_mountain_peak_sunrise.svg", title: "Snow-Capped Mountain Peak at Sunrise", category: "nature", subject: "snow-capped mountain peak", color: "#2980b9", icon: "🏔️" },
  { id: "img_26", filename: "alpine_rocky_valley.svg", title: "Rocky Mountain Alpine Valley", category: "nature", subject: "snow-capped mountain peak", color: "#7f8c8d", icon: "⛰️" },
  { id: "img_27", filename: "tropical_sandy_beach.svg", title: "Pristine Tropical Beach with Palms", category: "nature", subject: "tropical beach", color: "#1abc9c", icon: "🏖️" },
  { id: "img_28", filename: "sunset_ocean_waves.svg", title: "Golden Sunset Over Ocean Waves", category: "nature", subject: "tropical beach", color: "#e67e22", icon: "🌅" },
  { id: "img_29", filename: "cascading_waterfall_lagoon.svg", title: "Cascading Waterfall into Deep Lagoon", category: "nature", subject: "cascading waterfall", color: "#3498db", icon: "🌊" },
  { id: "img_30", filename: "ancient_redwood_forest.svg", title: "Ancient Redwood Forest with Sunbeams", category: "nature", subject: "ancient redwood forest", color: "#1e8449", icon: "🌲" },
  { id: "img_31", filename: "sahara_desert_sand_dunes.svg", title: "Sahara Desert Golden Sand Dunes", category: "nature", subject: "sahara sand dunes", color: "#f39c12", icon: "🏜️" },
  { id: "img_32", filename: "red_rock_canyon_sunset.svg", title: "Red Rock Canyon Sunset Panorama", category: "nature", subject: "sahara sand dunes", color: "#b03a2e", icon: "🏞️" },
  { id: "img_33", filename: "crystal_glacial_lake.svg", title: "Glacial Lake with Forest Reflection", category: "nature", subject: "snow-capped mountain peak", color: "#5dade2", icon: "🏞️" },
  { id: "img_34", filename: "northern_lights_aurora.svg", title: "Northern Lights Aurora in Night Sky", category: "nature", subject: "ancient redwood forest", color: "#117a65", icon: "🌌" },

  { id: "img_35", filename: "electric_sports_car_highway.svg", title: "Red Electric Sports Car on Highway", category: "vehicle", subject: "electric sports car", color: "#c0392b", icon: "🚗" },
  { id: "img_36", filename: "vintage_classic_muscle_car.svg", title: "Vintage Classic Muscle Car in City", category: "vehicle", subject: "electric sports car", color: "#1b2631", icon: "🏎️" },
  { id: "img_37", filename: "urban_electric_bicycle_lane.svg", title: "Modern Electric Commuter Bicycle", category: "vehicle", subject: "urban electric bicycle", color: "#16a085", icon: "🚲" },
  { id: "img_38", filename: "commercial_jet_airplane_takeoff.svg", title: "Commercial Jet Taking Off at Sunset", category: "vehicle", subject: "commercial airliner", color: "#2c3e50", icon: "✈️" },
  { id: "img_39", filename: "high_speed_bullet_train.svg", title: "High-Speed Bullet Train Railway", category: "vehicle", subject: "high-speed bullet train", color: "#8e44ad", icon: "🚅" },
  { id: "img_40", filename: "developer_workspace_laptop.svg", title: "Modern Developer Workspace Setup", category: "technology", subject: "developer workspace", color: "#2c3e50", icon: "💻" },
  { id: "img_41", filename: "camera_quadcopter_drone.svg", title: "Quadcopter Drone Flying Over Hill", category: "technology", subject: "camera drone", color: "#34495e", icon: "🛸" },
  { id: "img_42", filename: "industrial_robotic_arm.svg", title: "Autonomous Robotic Arm in Factory", category: "technology", subject: "developer workspace", color: "#d68910", icon: "🤖" }
];

export function generateSvgFile(item) {
  const filePath = path.join(imgDir, item.filename);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="grad_${item.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${item.color}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#1a1a24" stop-opacity="0.95"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#grad_${item.id})" rx="12"/>
  <rect x="20" y="20" width="560" height="360" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" rx="8"/>
  <text x="300" y="170" font-family="system-ui, -apple-system, sans-serif" font-size="72" text-anchor="middle">${item.icon}</text>
  <text x="300" y="230" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">${item.title}</text>
  <text x="300" y="265" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="rgba(255,255,255,0.7)" text-anchor="middle">Category: ${item.category.toUpperCase()} | ID: ${item.id}</text>
</svg>`;

  fs.writeFileSync(filePath, svg, "utf-8");
  return filePath;
}

export function createAllImages() {
  for (const item of DATASET_IMAGES) {
    generateSvgFile(item);
  }
}

if (process.argv[1] && process.argv[1].endsWith("generateImages.js")) {
  createAllImages();
  console.log(`Generated ${DATASET_IMAGES.length} sample dataset images in ${imgDir}`);
}
