import fs from "fs";
import path from "path";

const imgDir = path.resolve("data/images");
if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true });
}

export const REAL_DATASET_IMAGES = [
  { id: "img_01", filename: "red_fox_forest.jpg", subject: "red fox", category: "animal", url: "https://images.unsplash.com/photo-1516934024742-b461fba47600?w=600&q=80" },
  { id: "img_02", filename: "arctic_fox_snow.jpg", subject: "arctic fox", category: "animal", url: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&q=80" },
  { id: "img_03", filename: "gray_wolf_woods.jpg", subject: "gray wolf", category: "animal", url: "https://images.unsplash.com/photo-1590422749897-47668612140a?w=600&q=80" },
  { id: "img_04", filename: "timber_wolf_cliff.jpg", subject: "gray wolf", category: "animal", url: "https://images.unsplash.com/photo-1549480017-d76466a4b7e8?w=600&q=80" },
  { id: "img_05", filename: "golden_retriever_dog.jpg", subject: "golden retriever", category: "animal", url: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&q=80" },
  { id: "img_06", filename: "german_shepherd_dog.jpg", subject: "golden retriever", category: "animal", url: "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=600&q=80" },
  { id: "img_07", filename: "grizzly_bear_river.jpg", subject: "grizzly bear", category: "animal", url: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&q=80" },
  { id: "img_08", filename: "black_bear_pine.jpg", subject: "grizzly bear", category: "animal", url: "https://images.unsplash.com/photo-1574870111867-089730e5a72b?w=600&q=80" },
  { id: "img_09", filename: "white_tailed_deer_mist.jpg", subject: "white-tailed deer", category: "animal", url: "https://images.unsplash.com/photo-1484406566174-9da000fda645?w=600&q=80" },
  { id: "img_10", filename: "red_deer_stag_meadow.jpg", subject: "white-tailed deer", category: "animal", url: "https://images.unsplash.com/photo-1508817628294-5a453fa0b8fb?w=600&q=80" },
  { id: "img_11", filename: "bald_eagle_mountain.jpg", subject: "bald eagle", category: "animal", url: "https://images.unsplash.com/photo-1611689342806-0863700ce1e4?w=600&q=80" },
  { id: "img_12", filename: "african_lion_savanna.jpg", subject: "african lion", category: "animal", url: "https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=600&q=80" },
  { id: "img_13", filename: "blurry_wildlife_lowconf.jpg", subject: "unidentified object", category: "animal", url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=100&q=10" },

  { id: "img_14", filename: "margherita_pizza_oven.jpg", subject: "margherita pizza", category: "food", url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80" },
  { id: "img_15", filename: "pepperoni_pizza_slice.jpg", subject: "margherita pizza", category: "food", url: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80" },
  { id: "img_16", filename: "gourmet_cheeseburger_bacon.jpg", subject: "gourmet cheeseburger", category: "food", url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80" },
  { id: "img_17", filename: "vegan_veggie_burger.jpg", subject: "gourmet cheeseburger", category: "food", url: "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=600&q=80" },
  { id: "img_18", filename: "sushi_nigiri_platter.jpg", subject: "sushi platter", category: "food", url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=80" },
  { id: "img_19", filename: "dragon_roll_sushi.jpg", subject: "sushi platter", category: "food", url: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=600&q=80" },
  { id: "img_20", filename: "creamy_fettuccine_pasta.jpg", subject: "creamy fettuccine pasta", category: "food", url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&q=80" },
  { id: "img_21", filename: "mediterranean_greek_salad.jpg", subject: "mediterranean greek salad", category: "food", url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80" },
  { id: "img_22", filename: "latte_art_espresso_coffee.jpg", subject: "latte coffee", category: "food", url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80" },
  { id: "img_23", filename: "chocolate_lava_cake_dessert.jpg", subject: "chocolate lava cake", category: "food", url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80" },
  { id: "img_24", filename: "ambiguous_meal_lowconf.jpg", subject: "unidentified object", category: "food", url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=10" },

  { id: "img_25", filename: "snow_mountain_peak_sunrise.jpg", subject: "snow-capped mountain peak", category: "nature", url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80" },
  { id: "img_26", filename: "alpine_rocky_valley.jpg", subject: "snow-capped mountain peak", category: "nature", url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&q=80" },
  { id: "img_27", filename: "tropical_sandy_beach.jpg", subject: "tropical beach", category: "nature", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80" },
  { id: "img_28", filename: "sunset_ocean_waves.jpg", subject: "tropical beach", category: "nature", url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600&q=80" },
  { id: "img_29", filename: "cascading_waterfall_lagoon.jpg", subject: "cascading waterfall", category: "nature", url: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&q=80" },
  { id: "img_30", filename: "ancient_redwood_forest.jpg", subject: "ancient redwood forest", category: "nature", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80" },
  { id: "img_31", filename: "sahara_desert_sand_dunes.jpg", subject: "sahara sand dunes", category: "nature", url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&q=80" },
  { id: "img_32", filename: "red_rock_canyon_sunset.jpg", subject: "red rock canyon", category: "nature", url: "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=600&q=80" },
  { id: "img_33", filename: "crystal_glacial_lake.jpg", subject: "glacial mountain lake", category: "nature", url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80" },
  { id: "img_34", filename: "northern_lights_aurora.jpg", subject: "northern lights aurora", category: "nature", url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&q=80" },

  { id: "img_35", filename: "electric_sports_car_highway.jpg", subject: "electric sports car", category: "vehicle", url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80" },
  { id: "img_36", filename: "vintage_classic_muscle_car.jpg", subject: "electric sports car", category: "vehicle", url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&q=80" },
  { id: "img_37", filename: "urban_electric_bicycle_lane.jpg", subject: "urban electric bicycle", category: "vehicle", url: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&q=80" },
  { id: "img_38", filename: "commercial_jet_airplane_takeoff.jpg", subject: "commercial airliner", category: "vehicle", url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80" },
  { id: "img_39", filename: "high_speed_bullet_train.jpg", subject: "high-speed bullet train", category: "vehicle", url: "https://images.unsplash.com/photo-1532105956626-9569c03602f6?w=600&q=80" },
  { id: "img_40", filename: "developer_workspace_laptop.jpg", subject: "developer workspace", category: "technology", url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80" },
  { id: "img_41", filename: "camera_quadcopter_drone.jpg", subject: "camera drone", category: "technology", url: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600&q=80" },
  { id: "img_42", filename: "industrial_robotic_arm.jpg", subject: "industrial robotic arm", category: "technology", url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&q=80" }
];

export async function downloadAllRealImages() {
  console.log(`Downloading ${REAL_DATASET_IMAGES.length} real JPEG images from Unsplash...`);
  
  for (let item of REAL_DATASET_IMAGES) {
    const destPath = path.join(imgDir, item.filename);
    try {
      const response = await fetch(item.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
      console.log(`Downloaded ${item.filename} (${(arrayBuffer.byteLength / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.warn(`Could not download ${item.filename}: ${err.message}.`);
    }
  }

  console.log("Real image downloads completed.");
}

if (process.argv[1] && process.argv[1].endsWith("downloadRealImages.js")) {
  downloadAllRealImages();
}
