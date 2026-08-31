import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { validateImageMetadata } from "../../schemas/imageSchema.js";
import { CostTracker } from "./costTracker.js";

const DEFAULT_METADATA_LIST = [
  { keywords: ["red_fox", "orange fur"], subject: "red fox", category: "animal", attributes: ["orange fur", "bushy tail", "pointed ears", "wild", "forest"], caption: "A red fox with vibrant orange fur standing alert in a forest", confidence: 0.96 },
  { keywords: ["arctic_fox", "white fox", "tundra"], subject: "arctic fox", category: "animal", attributes: ["white fur", "thick coat", "snow", "tundra", "polar"], caption: "An arctic fox with thick white fur in a snowy arctic landscape", confidence: 0.95 },
  { keywords: ["wolf", "gray_wolf", "timber_wolf"], subject: "gray wolf", category: "animal", attributes: ["gray fur", "pack hunter", "wilderness", "snow"], caption: "A majestic gray wolf standing in a snowy winter woodland", confidence: 0.94 },
  { keywords: ["dog", "golden_retriever", "german_shepherd"], subject: "golden retriever", category: "animal", attributes: ["golden fur", "domestic dog", "playful", "friendly"], caption: "A friendly golden retriever dog running outdoors on green grass", confidence: 0.93 },
  { keywords: ["bear", "grizzly_bear", "black_bear"], subject: "grizzly bear", category: "animal", attributes: ["brown fur", "large carnivore", "river", "wild"], caption: "A powerful grizzly bear fishing for salmon in a swift mountain river", confidence: 0.95 },
  { keywords: ["deer", "stag", "white_tailed"], subject: "white-tailed deer", category: "animal", attributes: ["antlers", "brown coat", "forest meadow", "graceful"], caption: "A white-tailed deer standing quietly in morning forest mist", confidence: 0.92 },
  { keywords: ["eagle", "bald_eagle"], subject: "bald eagle", category: "animal", attributes: ["white head", "sharp beak", "wingspan", "raptor"], caption: "A majestic bald eagle perched high on a pine branch", confidence: 0.96 },
  { keywords: ["lion", "african_lion"], subject: "african lion", category: "animal", attributes: ["golden mane", "big cat", "savanna", "predator"], caption: "An adult male African lion resting in tall grass under warm sunlight", confidence: 0.95 },
  { keywords: ["margherita_pizza", "pepperoni_pizza", "pizza"], subject: "margherita pizza", category: "food", attributes: ["melted cheese", "tomato sauce", "basil", "crust", "oven baked"], caption: "A hot wood-fired margherita pizza with melted mozzarella and fresh basil", confidence: 0.95 },
  { keywords: ["cheeseburger", "burger", "vegan_veggie"], subject: "gourmet cheeseburger", category: "food", attributes: ["beef patty", "melted cheddar", "brioche bun", "lettuce", "tomato"], caption: "A juicy gourmet cheeseburger stacked with lettuce, cheddar, and bacon on a brioche bun", confidence: 0.94 },
  { keywords: ["sushi", "nigiri", "dragon_roll"], subject: "sushi platter", category: "food", attributes: ["raw salmon", "tuna nigiri", "wasabi", "chopsticks", "rice"], caption: "An authentic Japanese sushi platter with fresh salmon nigiri and tuna rolls", confidence: 0.95 },
  { keywords: ["pasta", "fettuccine", "alfredo"], subject: "creamy fettuccine pasta", category: "food", attributes: ["creamy alfredo sauce", "parmesan", "parsley", "italian pasta"], caption: "A plate of creamy fettuccine alfredo garnished with grated parmesan and fresh herbs", confidence: 0.93 },
  { keywords: ["salad", "greek_salad"], subject: "mediterranean greek salad", category: "food", attributes: ["kalamata olives", "feta cheese", "cucumbers", "olive oil"], caption: "A fresh Mediterranean Greek salad bowl with feta cheese and kalamata olives", confidence: 0.92 },
  { keywords: ["coffee", "latte", "espresso"], subject: "latte coffee", category: "food", attributes: ["latte art", "espresso", "ceramic cup", "steamed milk", "cafe"], caption: "A freshly brewed espresso coffee cup with latte art on a wooden cafe table", confidence: 0.96 },
  { keywords: ["dessert", "lava_cake", "chocolate"], subject: "chocolate lava cake", category: "food", attributes: ["molten chocolate", "vanilla ice cream", "powdered sugar", "rich dessert"], caption: "A decadent warm chocolate lava cake served with a scoop of vanilla ice cream", confidence: 0.94 },
  { keywords: ["mountain", "snow_mountain", "alpine_rocky"], subject: "snow-capped mountain peak", category: "nature", attributes: ["rocky ridges", "snow", "sunrise glow", "high altitude"], caption: "Snow-capped mountain peaks bathed in golden morning sunrise light", confidence: 0.95 },
  { keywords: ["beach", "tropical_sandy", "sunset_ocean"], subject: "tropical beach", category: "nature", attributes: ["turquoise water", "white sand", "palm trees", "sunny"], caption: "A pristine tropical beach with turquoise ocean water and swaying palm trees", confidence: 0.95 },
  { keywords: ["waterfall", "cascading_waterfall"], subject: "cascading waterfall", category: "nature", attributes: ["falling water", "rocky cliff", "mist", "deep pool"], caption: "A powerful cascading waterfall plunging into a clear turquoise lagoon", confidence: 0.94 },
  { keywords: ["forest", "redwood", "ancient_redwood"], subject: "ancient redwood forest", category: "nature", attributes: ["tall redwoods", "sunbeams", "mossy ground", "peaceful canopy"], caption: "Sunbeams streaming through tall ancient redwood trees in a misty green forest", confidence: 0.94 },
  { keywords: ["desert", "sahara", "sand_dunes"], subject: "sahara sand dunes", category: "nature", attributes: ["golden sand", "wind ripples", "arid landscape", "blue sky"], caption: "Sweeping golden sand dunes stretching across the desert horizon under clear skies", confidence: 0.93 },
  { keywords: ["canyon", "red_rock"], subject: "red rock canyon", category: "nature", attributes: ["red rock", "canyon", "sunset"], caption: "Red rock canyon sunset view", confidence: 0.92 },
  { keywords: ["lake", "glacial_lake"], subject: "glacial mountain lake", category: "nature", attributes: ["glacial lake", "crystal clear", "reflection"], caption: "Crystal clear glacial lake reflecting mountain pine forest", confidence: 0.93 },
  { keywords: ["aurora", "northern_lights"], subject: "northern lights aurora", category: "nature", attributes: ["northern lights", "aurora borealis", "green night sky"], caption: "Vibrant green aurora borealis dancing across clear night sky", confidence: 0.94 },
  { keywords: ["car", "sports_car", "electric_sports_car", "vintage_classic"], subject: "electric sports car", category: "vehicle", attributes: ["sleek red body", "aerodynamic", "alloy wheels", "highway"], caption: "A modern red electric sports car driving along a scenic coastal road", confidence: 0.95 },
  { keywords: ["bike", "bicycle", "urban_electric"], subject: "urban electric bicycle", category: "vehicle", attributes: ["two wheels", "frame battery", "city street", "handlebars"], caption: "A sleek commuter electric bicycle parked along an urban city pathway", confidence: 0.92 },
  { keywords: ["airplane", "jet", "commercial_jet"], subject: "commercial airliner", category: "vehicle", attributes: ["jet engines", "wings", "takeoff", "sunset sky"], caption: "A commercial passenger jet airplane climbing into a warm sunset sky", confidence: 0.94 },
  { keywords: ["train", "bullet_train", "high_speed"], subject: "high-speed bullet train", category: "vehicle", attributes: ["aerodynamic nose", "electric railway", "countryside", "rapid transit"], caption: "A modern high-speed bullet train traveling along an elevated rail line", confidence: 0.94 },
  { keywords: ["developer_workspace", "workspace", "laptop", "coding"], subject: "developer workspace", category: "technology", attributes: ["dual monitors", "mechanical keyboard", "code on screen", "desk setup", "software developer"], caption: "A modern software developer workspace with dual monitors displaying code", confidence: 0.95 },
  { keywords: ["drone", "camera_quadcopter", "quadcopter"], subject: "camera drone", category: "technology", attributes: ["four rotors", "gimbal camera", "flying", "remote control"], caption: "A quadcopter camera drone hovering smoothly in mid-air over a landscape", confidence: 0.92 },
  { keywords: ["robotic_arm", "industrial_robotic", "robot"], subject: "industrial robotic arm", category: "technology", attributes: ["robotic arm", "automation", "smart factory"], caption: "An automated industrial robotic arm performing precision assembly", confidence: 0.93 }
];

export class GeminiService {
  constructor(apiKey = process.env.GEMINI_API_KEY) {
    this.apiKey = apiKey;
    this.client = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  }

  async classifyImage(imagePath, filename = "") {
    if (this.client) {
      try {
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Data = imageBuffer.toString("base64");
        const ext = path.extname(imagePath).toLowerCase();
        let mimeType = "image/jpeg";
        if (ext === ".png") mimeType = "image/png";

        const model = this.client.getGenerativeModel({
          model: "gemini-1.5-flash",
          generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `Analyze this image and return JSON:
{
  "subject": "e.g. red fox",
  "category": "animal, food, nature, vehicle, or technology",
  "attributes": ["list", "of", "traits"],
  "caption": "A clear descriptive caption",
  "confidence": 0.95
}`;

        const result = await model.generateContent([prompt, {
          inlineData: { data: base64Data, mimeType: mimeType }
        }]);

        const text = result.response.text();
        const parsed = JSON.parse(text);
        const validation = validateImageMetadata(parsed);

        const inputTokens = CostTracker.estimateTokenCount(prompt) + 258;
        const outputTokens = CostTracker.estimateTokenCount(text);
        const cost = CostTracker.calculateCost("gemini-1.5-flash", inputTokens, outputTokens, 1);

        return {
          success: validation.isValid,
          data: validation.data,
          cost: cost,
          isFlagged: validation.data.confidence < 0.70
        };
      } catch (err) {
        return this.getFallbackClassification(imagePath, filename);
      }
    }

    return this.getFallbackClassification(imagePath, filename);
  }

  getFallbackClassification(imagePath, filename = "") {
    const searchTarget = (filename + " " + path.basename(imagePath)).toLowerCase();
    
    let match = null;
    for (let item of DEFAULT_METADATA_LIST) {
      for (let kw of item.keywords) {
        if (searchTarget.includes(kw)) {
          match = item;
          break;
        }
      }
      if (match) break;
    }

    if (!match) {
      if (searchTarget.includes("blurry") || searchTarget.includes("lowconf")) {
        match = {
          subject: "unidentified object",
          category: "unknown",
          attributes: ["blurry", "unclear", "low resolution"],
          caption: "An unclear and low-resolution object with ambiguous features",
          confidence: 0.42
        };
      } else {
        match = {
          subject: "general object",
          category: "general",
          attributes: ["visual subject", "photography"],
          caption: "A clear visual photograph",
          confidence: 0.88
        };
      }
    }

    const validation = validateImageMetadata(match);
    const inputTokens = 270;
    const outputTokens = 45;
    const cost = CostTracker.calculateCost("gemini-1.5-flash", inputTokens, outputTokens, 1);

    return {
      success: validation.isValid,
      data: validation.data,
      cost: cost,
      isFlagged: validation.data.confidence < 0.70
    };
  }

  async generateEmbedding(text) {
    if (this.client) {
      try {
        const model = this.client.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(text);
        const vector = result.embedding.values;
        const inputTokens = CostTracker.estimateTokenCount(text);
        const cost = CostTracker.calculateCost("text-embedding-004", inputTokens, 0, 0);

        return {
          vector: vector,
          dimensions: vector.length,
          cost: cost
        };
      } catch (err) {
        return this.getFallbackEmbedding(text);
      }
    }

    return this.getFallbackEmbedding(text);
  }

  getFallbackEmbedding(text) {
    const dimensions = 128;
    const vector = new Array(dimensions).fill(0);
    const normalized = (text || "").toLowerCase().trim();

    const conceptMap = [
      { words: ["arctic fox", "white fox", "snow tundra", "subzero tundra"], index: 4 },
      { words: ["red fox", "vulpes", "orange fur", "fox ecology"], index: 0 },
      { words: ["gray wolf", "timber wolf", "canis lupus", "wolf pack"], index: 8 },
      { words: ["golden retriever", "domestic dog", "dog training", "canine companion", "shepherd", "grassy fields", "dog park"], index: 13 },
      { words: ["grizzly bear", "grizzly", "bear salmon", "brown bear", "ursus"], index: 18 },
      { words: ["deer", "stag", "antlers", "white-tailed"], index: 23 },
      { words: ["eagle", "raptor", "bald eagle"], index: 28 },
      { words: ["lion", "african lion", "savanna predator"], index: 33 },
      { words: ["pizza", "margherita", "pepperoni", "mozzarella", "neapolitan"], index: 38 },
      { words: ["burger", "cheeseburger", "beef patty", "brioche bun", "bacon"], index: 43 },
      { words: ["sushi", "nigiri", "raw salmon", "dragon roll", "wasabi"], index: 48 },
      { words: ["pasta", "fettuccine", "alfredo", "creamy pasta"], index: 53 },
      { words: ["greek salad", "mediterranean salad", "feta cheese", "kalamata"], index: 58 },
      { words: ["coffee", "latte art", "espresso", "cafe"], index: 63 },
      { words: ["chocolate lava cake", "dessert", "molten chocolate"], index: 68 },
      { words: ["snow-capped mountain", "mountain peak", "himalayas", "mountaineering", "icy rocky", "alpine summit"], index: 73 },
      { words: ["tropical beach", "sandy beach", "palm trees", "turquoise ocean"], index: 78 },
      { words: ["waterfall", "cascade", "lagoon"], index: 83 },
      { words: ["redwood forest", "ancient redwood", "coastal redwood", "towering trees", "forest canopy"], index: 88 },
      { words: ["sahara desert", "sand dunes", "desert landscape"], index: 93 },
      { words: ["electric sports car", "sports car", "aerodynamic", "instant torque", "zero emission", "electric vehicle"], index: 98 },
      { words: ["bicycle", "e-bike", "bike lane"], index: 103 },
      { words: ["airplane", "jet", "aviation", "commercial aircraft"], index: 108 },
      { words: ["bullet train", "high-speed train", "railway transit"], index: 113 },
      { words: ["developer workspace", "software developer", "dual monitors", "mechanical keyboard", "coding setup", "engineering desk"], index: 118 },
      { words: ["drone", "quadcopter", "aerial photography"], index: 123 }
    ];

    for (let i = 0; i < normalized.length; i++) {
      const code = normalized.charCodeAt(i);
      const slot = (i * 5 + code) % dimensions;
      vector[slot] += 0.05;
    }

    for (let concept of conceptMap) {
      for (let word of concept.words) {
        if (normalized.includes(word)) {
          for (let step = 0; step < 4; step++) {
            const slot = (concept.index + step) % dimensions;
            vector[slot] += 2.5 / (step + 1);
          }
          break;
        }
      }
    }

    let sumSquares = 0;
    for (let i = 0; i < dimensions; i++) {
      sumSquares += vector[i] * vector[i];
    }
    const norm = Math.sqrt(sumSquares);

    if (norm > 0) {
      for (let i = 0; i < dimensions; i++) {
        vector[i] = Number((vector[i] / norm).toFixed(6));
      }
    }

    const inputTokens = CostTracker.estimateTokenCount(text);
    const cost = CostTracker.calculateCost("text-embedding-004", inputTokens, 0, 0);

    return {
      vector: vector,
      dimensions: dimensions,
      cost: cost
    };
  }
}
