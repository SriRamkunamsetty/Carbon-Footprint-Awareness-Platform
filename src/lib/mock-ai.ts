import { EMISSION_FACTORS } from "./carbon/emissionFactors";
import { calculateTransportEmissions, TransportMode } from "./carbon/transport";
import { calculateFoodEmissions, FoodEntry, FoodType } from "./carbon/food";
import { calculateElectricityEmissions, ApplianceUsage, ApplianceType } from "./carbon/electricity";
import { UserProfile } from "@/types";

export interface ParsedLogResult {
  categoryMatches: {
    transport: { mode: TransportMode; distanceKm: number; carbon: number }[];
    food: { type: FoodType; servings: number; carbon: number }[];
    electricity: { type: ApplianceType; hours: number; carbon: number }[];
    shopping: { category: string; count: number; carbon: number }[];
  };
  totalCarbon: number;
  explanation: string;
}

/** Extracts transport-related carbon emissions from normalized text */
function extractTransportEmissions(
  normalized: string
): { mode: TransportMode; distanceKm: number; carbon: number }[] {
  const results: { mode: TransportMode; distanceKm: number; carbon: number }[] = [];
  const modes: { keywords: string[]; mode: TransportMode; label: string }[] = [
    { keywords: ["electric car", "tesla", "ev"], mode: "electricCar", label: "Electric Vehicle" },
    { keywords: ["car", "drove", "drive", "taxi", "cab", "uber", "lyft"], mode: "gasolineCar", label: "Gasoline Car" },
    { keywords: ["bike", "bicycle", "cycle", "cycled", "cycling"], mode: "bicycle", label: "Bicycle" },
    { keywords: ["walk", "walked", "walking", "foot"], mode: "walking", label: "Walking" },
    { keywords: ["bus", "shuttle"], mode: "bus", label: "Bus" },
    { keywords: ["train", "subway", "metro", "rail", "tram"], mode: "train", label: "Train" },
    { keywords: ["motorcycle", "scooter", "motorbike"], mode: "motorcycle", label: "Motorcycle" },
  ];

  let textCopy = normalized;

  for (const item of modes) {
    for (const keyword of item.keywords) {
      if (textCopy.includes(keyword)) {
        const numberMatch = textCopy.match(new RegExp(`(?:${keyword}[^\\\\d]*|[^\\\\d]*${keyword}[^\\\\d]*)(\\\\d+(?:\\\\.\\\\d+)?)`, "i"))
          || textCopy.match(/(\d+(?:\.\d+)?)\s*(?:km|kms|miles|mile)?/i);

        if (numberMatch) {
          let distance = Number.parseFloat(numberMatch[1]);
          if (textCopy.includes("mile") || textCopy.includes("miles")) {
            distance = distance * 1.60934;
          }

          if (distance > 0) {
            const carbon = calculateTransportEmissions(item.mode, distance);
            results.push({
              mode: item.mode,
              distanceKm: Math.round(distance * 10) / 10,
              carbon: Math.round(carbon * 100) / 100,
            });
            textCopy = textCopy.replace(numberMatch[0], "");
            break;
          }
        }
      }
    }
  }

  // Fallback if flights are mentioned
  if (normalized.includes("flight") || normalized.includes("flew") || normalized.includes("plane")) {
    const flightHoursMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:hour|hours|hr|hrs)/);
    const hours = flightHoursMatch ? Number.parseFloat(flightHoursMatch[1]) : 2;
    const distance = hours * 800;
    const mode = distance > 1500 ? "flightLong" : "flightShort";
    const carbon = calculateTransportEmissions(mode, distance);
    results.push({
      mode,
      distanceKm: distance,
      carbon: Math.round(carbon * 100) / 100,
    });
  }

  return results;
}

/** Extracts food/diet-related carbon emissions from normalized text */
function extractFoodEmissions(
  normalized: string
): { type: FoodType; servings: number; carbon: number }[] {
  const results: { type: FoodType; servings: number; carbon: number }[] = [];
  const foods: { keywords: string[]; type: FoodType; label: string }[] = [
    { keywords: ["beef", "steak", "burger", "hamburger", "red meat"], type: "beef", label: "Beef" },
    { keywords: ["chicken", "poultry", "turkey", "biryani", "chicken biryani"], type: "poultry", label: "Poultry" },
    { keywords: ["pork", "bacon", "ham"], type: "pork", label: "Pork" },
    { keywords: ["fish", "salmon", "tuna", "seafood"], type: "fish", label: "Fish" },
    { keywords: ["dairy", "cheese", "milk", "butter", "egg", "eggs"], type: "dairy", label: "Dairy & Eggs" },
    { keywords: ["vegetable", "vegetables", "salad", "vegan", "vegetarian", "veg", "tofu"], type: "vegetables", label: "Plant-based" },
    { keywords: ["rice", "bread", "wheat", "grain", "grains", "cereal"], type: "grains", label: "Grains" },
  ];

  for (const item of foods) {
    const found = item.keywords.some(keyword => normalized.includes(keyword));
    if (found) {
      const servingMatch = normalized.match(new RegExp(`(\\\\d+)\\\\s*(?:serving|servings|plate|plates|portion|portions|item|items|cup|cups|burger|burgers)?\\\\s*(?:of\\\\s*)?${item.keywords[0]}`, "i"))
        || normalized.match(new RegExp(`${item.keywords[0]}[^\\\\d]*(\\\\d+)`, "i"));

      const servings = servingMatch ? Number.parseInt(servingMatch[1], 10) : 1;
      const carbon = calculateFoodEmissions([{ type: item.type, servings }]);
      results.push({
        type: item.type,
        servings,
        carbon: Math.round(carbon * 100) / 100,
      });
    }
  }

  return results;
}

/** Extracts electricity/appliance carbon emissions from normalized text */
function extractElectricityEmissions(
  normalized: string
): { type: ApplianceType; hours: number; carbon: number }[] {
  const results: { type: ApplianceType; hours: number; carbon: number }[] = [];
  const appliances: { keywords: string[]; type: ApplianceType; label: string }[] = [
    { keywords: ["ac", "aircon", "air conditioner", "air conditioning"], type: "airConditioner", label: "Air Conditioner" },
    { keywords: ["heater", "heating", "boiler"], type: "heater", label: "Space Heater" },
    { keywords: ["tv", "television", "netflix", "show"], type: "television", label: "Television" },
    { keywords: ["computer", "pc", "laptop", "gaming", "workstation"], type: "computer", label: "Computer" },
  ];

  for (const item of appliances) {
    const found = item.keywords.some(keyword => normalized.includes(keyword));
    if (found) {
      const hoursMatch = normalized.match(new RegExp(`(\\\\d+(?:\\\\.\\\\d+)?)\\\\s*(?:hour|hours|hr|hrs|h)\\\\s*(?:of\\\\s*)?${item.keywords[0]}`, "i"))
        || normalized.match(new RegExp(`${item.keywords[0]}[^\\\\d]*(\\\\d+(?:\\\\.\\\\d+)?)\\\\s*(?:hour|hours|hr|hrs|h)`, "i"))
        || normalized.match(new RegExp(`(?:used|ran|on)\\\\s*${item.keywords[0]}[^\\\\d]*(\\\\d+(?:\\\\.\\\\d+)?)`, "i"))
        || normalized.match(new RegExp(`(\\\\d+(?:\\\\.\\\\d+)?)\\\\s*(?:hour|hours|hr|hrs|h)`, "i"));

      const hours = hoursMatch ? Number.parseFloat(hoursMatch[1]) : 4;
      const carbon = calculateElectricityEmissions([{ type: item.type, hours }]);
      results.push({
        type: item.type,
        hours: Math.round(hours * 10) / 10,
        carbon: Math.round(carbon * 100) / 100,
      });
    }
  }

  return results;
}

/** Extracts shopping-related carbon emissions from normalized text */
function extractShoppingEmissions(
  normalized: string
): { category: string; count: number; carbon: number }[] {
  const results: { category: string; count: number; carbon: number }[] = [];
  const shoppingCats: { keywords: string[]; category: string; label: string; factor: number }[] = [
    { keywords: ["clothes", "shirt", "pants", "shoe", "shoes", "jacket", "clothing"], category: "clothing", label: "Clothing", factor: 15 },
    { keywords: ["phone", "laptop", "tablet", "gadget", "electronics", "tv purchase"], category: "electronics", label: "Electronics", factor: 120 },
    { keywords: ["chair", "table", "sofa", "bed", "furniture"], category: "furniture", label: "Furniture", factor: 45 },
    { keywords: ["bought", "purchased", "items"], category: "misc", label: "Miscellaneous Item", factor: 5 },
  ];

  for (const item of shoppingCats) {
    const found = item.keywords.some(keyword => normalized.includes(keyword));
    if (found) {
      const countMatch = normalized.match(new RegExp(`(\\\\d+)\\\\s*(?:items|pcs|units|brand new)?\\\\s*${item.keywords[0]}`, "i"))
        || normalized.match(new RegExp(`bought\\\\s*(\\\\d+)`, "i"));
      const count = countMatch ? Number.parseInt(countMatch[1], 10) : 1;
      const carbon = count * item.factor;
      results.push({
        category: item.category,
        count,
        carbon,
      });
    }
  }

  return results;
}

/**
 * Advanced heuristic NLP parser that scans raw text, detects intents and entities,
 * maps them to carbon factors, and computes carbon emissions.
 */
export function parseCarbonLog(text: string): ParsedLogResult {
  const normalized = text.toLowerCase();

  const transport = extractTransportEmissions(normalized);
  const food = extractFoodEmissions(normalized);
  const electricity = extractElectricityEmissions(normalized);
  const shopping = extractShoppingEmissions(normalized);

  const totalCarbon = [
    ...transport.map(t => t.carbon),
    ...food.map(f => f.carbon),
    ...electricity.map(e => e.carbon),
    ...shopping.map(s => s.carbon),
  ].reduce((sum, c) => sum + c, 0);

  const explanations = [
    ...transport.map(t => `Transport: ${t.distanceKm} km via ${t.mode} (${Math.round(t.carbon * 10) / 10} kg CO₂)`),
    ...food.map(f => `Diet: ${f.servings} serving(s) of ${f.type} (${Math.round(f.carbon * 10) / 10} kg CO₂)`),
    ...electricity.map(e => `Electricity: ${e.hours} hours of ${e.type} (${Math.round(e.carbon * 10) / 10} kg CO₂)`),
    ...shopping.map(s => `Shopping: ${s.count} ${s.category}(s) (${s.carbon} kg CO₂)`),
  ];

  return {
    categoryMatches: { transport, food, electricity, shopping },
    totalCarbon: Math.round(totalCarbon * 100) / 100,
    explanation: explanations.length === 0
      ? "No carbon-emitting activities detected. Try typing: 'I travelled 15 km by car, ate a beef steak, and used AC for 3 hours.'"
      : explanations.join('\n'),
  };
}

interface IntentMatch {
  keywords: string[];
  response: (name: string, profile: UserProfile | null) => string;
}

function matchIntent(msg: string, intents: IntentMatch[]): string | null {
  for (const intent of intents) {
    if (intent.keywords.some(kw => msg.includes(kw))) {
      return intent.response("", null);
    }
  }
  return null;
}

/**
 * Returns a conversational response from the AI Sustainability Coach.
 * Simulates a context-aware chat session referencing user logs, streak, and goals.
 */
export function getCoachResponse(
  history: { role: "user" | "assistant"; content: string }[],
  latestMessage: string,
  profile: UserProfile | null
): string {
  const msg = latestMessage.toLowerCase();
  const name = profile?.name || "Eco Friend";
  const carbonScore = profile?.carbonScore || 70;
  const goal = profile?.goal || 350;

  const intents: IntentMatch[] = [
    {
      keywords: ["hello", "hi ", "hey", "greet"],
      response: () => `Hello **${name}**! 👋 I am your **CarbonMind AI Coach**. 

I analyze your daily habits, transportation, diet, and utility usage to help you cut carbon, save money, and live sustainably. 

Your current Carbon Score is **${carbonScore}/100**, and your monthly target is **${goal} kg CO₂**. How can I help you reduce your environmental footprint today? You can ask me for a personalized reduction plan, tips on lowering home heating/cooling bills, or help understanding your stats!`,
    },
    {
      keywords: ["reduce", "decrease", "lower", "cut", "plan"],
      response: () => `Here is a custom **Emissions Reduction Roadmap** based on your profile (living in *${profile?.country || "your area"}* as a *${profile?.occupation || "professional"}*):

### 🚗 1. Transportation (Highest Impact)
* **Switch 2 Days/Week**: If you commute by gasoline car, swapping just 2 days for public transit or bicycling reduces your weekly transport footprint by **~64%** (saving roughly **40 kg CO₂/month**).
* **Eco-Driving**: Maintain steady speeds and proper tire inflation. This can improve fuel efficiency by up to 10-15%.

### 🍔 2. Dietary Adjustments
* **Meatless Mondays**: Swapping beef or pork for plant-based meals once a week cuts your food-related carbon footprint by **15-20 kg CO₂/month**. Beef emits roughly **16x more CO₂** per serving than grains or vegetables.
* **Minimize Waste**: Food waste in landfills produces methane, a potent greenhouse gas. Composting saves up to **80% of waste-related emissions**.

### ⚡ 3. Household Power
* **AC / Heating Modulation**: Setting your AC just 1.5°C higher in summer or heating 1.5°C lower in winter runs the compressor significantly less, reducing power draw by **~90 kWh/month** (saving **~42 kg CO₂**).
* **Smart Power Strips**: Phantom power from idle electronics represents 5-10% of residential energy use.

Would you like to run a simulation of these changes on your **Carbon Twin**?`,
    },
    {
      keywords: ["eat", "food", "diet", "beef", "chicken", "vegan"],
      response: () => `Dietary choices play a massive role in global greenhouse emissions. Here is the footprint breakdown of standard food ingredients per serving:
- **Beef (Red Meat)**: **~6.5 kg CO₂** (high land use, water consumption, and enteric fermentation)
- **Pork**: **~2.2 kg CO₂**
- **Poultry (Chicken)**: **~1.8 kg CO₂**
- **Fish**: **~1.6 kg CO₂**
- **Dairy & Eggs**: **~0.9 kg CO₂**
- **Grains & Cereals**: **~0.4 kg CO₂**
- **Vegetables & Fruits**: **~0.3 kg CO₂**

**💡 Easy Win**: Swapping beef or lamb for poultry or plant-based proteins (tofu, beans, lentils) is the single fastest way to reduce food carbon footprint without changing how much you eat. Eating local and organic foods also trims about **10%** off your food footprint due to reduced shipping distances ("food miles").`,
    },
    {
      keywords: ["ac ", "electricity", "power", "energy", "solar", "heater"],
      response: () => `Energy production is responsible for over **70% of global emissions**. Here is how you can optimize your home utilities:

1. **Air Conditioning (AC)**: An average central AC draws about **1.5 kW**. Running it for 6 hours a day creates roughly **4.2 kg CO₂** on a standard fossil-fuel power grid. If you offset this with **solar panels** (or sign up for a green community energy tariff), you can reduce this grid footprint to nearly **zero**!
2. **Heating**: Electric space heaters draw **~2.0 kW** (creating **0.94 kg CO₂ per hour**). Ensuring proper insulation and using heat pumps instead of standard resistance heating is up to 3-4x more efficient.
3. **Led Lighting**: Swapping standard incandescent bulbs for LEDs cuts lighting power usage by **85%**.

Do you know if your energy utility provider offers a **renewable energy option**? Selecting that option is an instant way to cut home emissions to zero!`,
    },
    {
      keywords: ["what is", "explain", "carbon footprint"],
      response: () => `A **Carbon Footprint** is the total greenhouse gas emissions (expressed in carbon dioxide equivalent, or **CO₂e**) caused directly and indirectly by an individual, organization, event, or product.

It consists of:
* **Direct (Scope 1) Emissions**: Things you burn directly, like gasoline in your car's engine, or gas/oil in your home heater.
* **Indirect (Scope 2 & 3) Emissions**: Emissions from power plants generating the electricity you consume, or emissions from factories manufacturing the clothes, phones, and food you purchase.

The global average carbon footprint is around **4.5 tonnes (4,500 kg) per person per year**. To avoid the worst impacts of climate change, the target global average needs to drop to under **2.0 tonnes** per person by 2030. Tracking daily with CarbonMind AI helps you stay on track!`,
    },
  ];

  for (const intent of intents) {
    if (intent.keywords.some(kw => msg.includes(kw))) {
      return intent.response(name, profile);
    }
  }

  // Default fallback
  return `Thank you for sharing that, ${name}. Every step towards tracking and mindfulness count! 

Based on your message, here is my suggestion:
* **Focus on Small Gains**: Swapping a short car drive for walking or biking saves roughly **0.21 kg CO₂ per kilometer**.
* **Review your Dashboard**: Check your **Carbon Score** to see how today's activities fit your target goal.
* **Log Frequently**: Your current streak is **${profile?.streak || 0} days**. Logging your habits daily builds long-term awareness.

What specific habit would you like to analyze or change next? (e.g., transport, shopping, food)`;
}
