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

/**
 * Advanced heuristic NLP parser that scans raw text, detects intents and entities,
 * maps them to carbon factors, and computes carbon emissions.
 */
export function parseCarbonLog(text: string): ParsedLogResult {
  const normalized = text.toLowerCase();
  
  const result: ParsedLogResult = {
    categoryMatches: {
      transport: [],
      food: [],
      electricity: [],
      shopping: [],
    },
    totalCarbon: 0,
    explanation: "",
  };

  const explanations: string[] = [];

  // --- 1. TRANSPORT ENTITY EXTRACTION ---
  // Pattern 1: [distance] km/miles by [mode]
  // Pattern 2: [mode] for [distance] km/miles
  // Pattern 3: drove/rode [distance] km/miles
  const distRegex = /(\d+(?:\.\d+)?)\s*(?:km|kms|kilometers|miles|mile|m)/gi;
  const modes: { keywords: string[]; mode: TransportMode; label: string }[] = [
    { keywords: ["electric car", "tesla", "ev"], mode: "electricCar", label: "Electric Vehicle" },
    { keywords: ["car", "drove", "drive", "taxi", "cab", "uber", "lyft"], mode: "gasolineCar", label: "Gasoline Car" },
    { keywords: ["bike", "bicycle", "cycle", "cycled", "cycling"], mode: "bicycle", label: "Bicycle" },
    { keywords: ["walk", "walked", "walking", "foot"], mode: "walking", label: "Walking" },
    { keywords: ["bus", "shuttle"], mode: "bus", label: "Bus" },
    { keywords: ["train", "subway", "metro", "rail", "tram"], mode: "train", label: "Train" },
    { keywords: ["motorcycle", "scooter", "motorbike"], mode: "motorcycle", label: "Motorcycle" },
  ];

  // Try to find transport distances
  let match;
  let textCopy = normalized;
  
  // Basic search for keywords + numbers
  for (const item of modes) {
    for (const keyword of item.keywords) {
      if (textCopy.includes(keyword)) {
        // Find the nearest number
        const numberMatch = textCopy.match(new RegExp(`(?:${keyword}[^\\d]*|[^\\d]*${keyword}[^\\d]*)(\\d+(?:\\.\\d+)?)`, "i")) 
          || textCopy.match(/(\d+(?:\.\d+)?)\s*(?:km|kms|miles|mile)?/i);
        
        if (numberMatch) {
          let distance = parseFloat(numberMatch[1]);
          // Convert miles to km
          if (textCopy.includes("mile") || textCopy.includes("miles")) {
            distance = distance * 1.60934;
          }
          
          if (distance > 0) {
            const carbon = calculateTransportEmissions(item.mode, distance);
            result.categoryMatches.transport.push({
              mode: item.mode,
              distanceKm: Math.round(distance * 10) / 10,
              carbon: Math.round(carbon * 100) / 100,
            });
            explanations.push(`Transport: ${Math.round(distance * 10) / 10} km via ${item.label} (${Math.round(carbon * 10) / 10} kg CO₂)`);
            
            // Remove number to avoid double-matching
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
    const hours = flightHoursMatch ? parseFloat(flightHoursMatch[1]) : 2; // default to 2 hrs
    const distance = hours * 800; // avg speed 800 km/hr
    const mode = distance > 1500 ? "flightLong" : "flightShort";
    const carbon = calculateTransportEmissions(mode, distance);
    result.categoryMatches.transport.push({
      mode,
      distanceKm: distance,
      carbon: Math.round(carbon * 100) / 100,
    });
    explanations.push(`Transport: Flight duration ${hours} hrs (~${distance} km) (${Math.round(carbon * 10) / 10} kg CO₂)`);
  }

  // --- 2. DIET ENTITY EXTRACTION ---
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
    let found = false;
    for (const keyword of item.keywords) {
      if (normalized.includes(keyword)) {
        found = true;
        break;
      }
    }
    if (found) {
      // Look for serving sizes, e.g., "2 servings", "3 plates", "ate 2 burgers"
      const servingMatch = normalized.match(new RegExp(`(\\d+)\\s*(?:serving|servings|plate|plates|portion|portions|item|items|cup|cups|burger|burgers)?\\s*(?:of\\s*)?${item.keywords[0]}`, "i"))
        || normalized.match(new RegExp(`${item.keywords[0]}[^\\d]*(\\d+)`, "i"));
      
      const servings = servingMatch ? parseInt(servingMatch[1], 10) : 1;
      const carbon = calculateFoodEmissions([{ type: item.type, servings }]);
      result.categoryMatches.food.push({
        type: item.type,
        servings,
        carbon: Math.round(carbon * 100) / 100,
      });
      explanations.push(`Diet: ${servings} serving(s) of ${item.label} (${Math.round(carbon * 10) / 10} kg CO₂)`);
    }
  }

  // --- 3. ELECTRICITY / APPLIANCE EXTRACTION ---
  const appliances: { keywords: string[]; type: ApplianceType; label: string }[] = [
    { keywords: ["ac", "aircon", "air conditioner", "air conditioning"], type: "airConditioner", label: "Air Conditioner" },
    { keywords: ["heater", "heating", "boiler"], type: "heater", label: "Space Heater" },
    { keywords: ["tv", "television", "netflix", "show"], type: "television", label: "Television" },
    { keywords: ["computer", "pc", "laptop", "gaming", "workstation"], type: "computer", label: "Computer" },
  ];

  for (const item of appliances) {
    let found = false;
    for (const keyword of item.keywords) {
      if (normalized.includes(keyword)) {
        found = true;
        break;
      }
    }
    if (found) {
      const hoursMatch = normalized.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:hour|hours|hr|hrs|h)\\s*(?:of\\s*)?${item.keywords[0]}`, "i"))
        || normalized.match(new RegExp(`${item.keywords[0]}[^\\d]*(\\d+(?:\\.\\d+)?)\\s*(?:hour|hours|hr|hrs|h)`, "i"))
        || normalized.match(new RegExp(`(?:used|ran|on)\\s*${item.keywords[0]}[^\\d]*(\\d+(?:\\.\\d+)?)`, "i"))
        || normalized.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:hour|hours|hr|hrs|h)`, "i")); // general number of hours

      const hours = hoursMatch ? parseFloat(hoursMatch[1]) : 4; // default to 4 hrs
      const carbon = calculateElectricityEmissions([{ type: item.type, hours }]);
      result.categoryMatches.electricity.push({
        type: item.type,
        hours: Math.round(hours * 10) / 10,
        carbon: Math.round(carbon * 100) / 100,
      });
      explanations.push(`Electricity: ${Math.round(hours * 10) / 10} hours of ${item.label} (${Math.round(carbon * 10) / 10} kg CO₂)`);
    }
  }

  // --- 4. SHOPPING EXTRACTION ---
  const shoppingCats: { keywords: string[]; category: string; label: string; factor: number }[] = [
    { keywords: ["clothes", "shirt", "pants", "shoe", "shoes", "jacket", "clothing"], category: "clothing", label: "Clothing", factor: 15 },
    { keywords: ["phone", "laptop", "tablet", "gadget", "electronics", "tv purchase"], category: "electronics", label: "Electronics", factor: 120 },
    { keywords: ["chair", "table", "sofa", "bed", "furniture"], category: "furniture", label: "Furniture", factor: 45 },
    { keywords: ["bought", "purchased", "items"], category: "misc", label: "Miscellaneous Item", factor: 5 },
  ];

  for (const item of shoppingCats) {
    let found = false;
    for (const keyword of item.keywords) {
      if (normalized.includes(keyword)) {
        found = true;
        break;
      }
    }
    if (found) {
      const countMatch = normalized.match(new RegExp(`(\\d+)\\s*(?:items|pcs|units|brand new)?\\s*${item.keywords[0]}`, "i"))
        || normalized.match(new RegExp(`bought\\s*(\\d+)`, "i"));
      const count = countMatch ? parseInt(countMatch[1], 10) : 1;
      const carbon = count * item.factor;
      result.categoryMatches.shopping.push({
        category: item.category,
        count,
        carbon,
      });
      explanations.push(`Shopping: ${count} ${item.label}(s) (${carbon} kg CO₂)`);
    }
  }

  // Aggregate total carbon
  let sum = 0;
  result.categoryMatches.transport.forEach(t => sum += t.carbon);
  result.categoryMatches.food.forEach(f => sum += f.carbon);
  result.categoryMatches.electricity.forEach(e => sum += e.carbon);
  result.categoryMatches.shopping.forEach(s => sum += s.carbon);

  result.totalCarbon = Math.round(sum * 100) / 100;

  if (explanations.length === 0) {
    result.explanation = "No carbon-emitting activities detected. Try typing: 'I travelled 15 km by car, ate a beef steak, and used AC for 3 hours.'";
  } else {
    result.explanation = explanations.join("\n");
  }

  return result;
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

  // 1. Check intent: Introduction/Greet
  if (msg.includes("hello") || msg.includes("hi ") || msg.includes("hey") || msg.includes("greet")) {
    return `Hello **${name}**! 👋 I am your **CarbonMind AI Coach**. 

I analyze your daily habits, transportation, diet, and utility usage to help you cut carbon, save money, and live sustainably. 

Your current Carbon Score is **${carbonScore}/100**, and your monthly target is **${goal} kg CO₂**. How can I help you reduce your environmental footprint today? You can ask me for a personalized reduction plan, tips on lowering home heating/cooling bills, or help understanding your stats!`;
  }

  // 2. Check intent: Reduction plan / how to reduce
  if (msg.includes("reduce") || msg.includes("decrease") || msg.includes("lower") || msg.includes("cut") || msg.includes("plan")) {
    return `Here is a custom **Emissions Reduction Roadmap** based on your profile (living in *${profile?.country || "your area"}* as a *${profile?.occupation || "professional"}*):

### 🚗 1. Transportation (Highest Impact)
* **Switch 2 Days/Week**: If you commute by gasoline car, swapping just 2 days for public transit or bicycling reduces your weekly transport footprint by **~64%** (saving roughly **40 kg CO₂/month**).
* **Eco-Driving**: Maintain steady speeds and proper tire inflation. This can improve fuel efficiency by up to 10-15%.

### 🍔 2. Dietary Adjustments
* **Meatless Mondays**: Swapping beef or pork for plant-based meals once a week cuts your food-related carbon footprint by **15-20 kg CO₂/month**. Beef emits roughly **16x more CO₂** per serving than grains or vegetables.
* **Minimize Waste**: Food waste in landfills produces methane, a potent greenhouse gas. Composting saves up to **80% of waste-related emissions**.

### ⚡ 3. Household Power
* **AC / Heating Modulation**: Setting your AC just 1.5°C higher in summer or heating 1.5°C lower in winter runs the compressor significantly less, reducing power draw by **~90 kWh/month** (saving **~42 kg CO₂**).
* **Smart Power Strips**: Phantom power from idle electronics represents 5-10% of residential energy use.

Would you like to run a simulation of these changes on your **Carbon Twin**?`;
  }

  // 3. Check intent: Food/Diet questions
  if (msg.includes("eat") || msg.includes("food") || msg.includes("diet") || msg.includes("beef") || msg.includes("chicken") || msg.includes("vegan")) {
    return `Dietary choices play a massive role in global greenhouse emissions. Here is the footprint breakdown of standard food ingredients per serving:
- **Beef (Red Meat)**: **~6.5 kg CO₂** (high land use, water consumption, and enteric fermentation)
- **Pork**: **~2.2 kg CO₂**
- **Poultry (Chicken)**: **~1.8 kg CO₂**
- **Fish**: **~1.6 kg CO₂**
- **Dairy & Eggs**: **~0.9 kg CO₂**
- **Grains & Cereals**: **~0.4 kg CO₂**
- **Vegetables & Fruits**: **~0.3 kg CO₂**

**💡 Easy Win**: Swapping beef or lamb for poultry or plant-based proteins (tofu, beans, lentils) is the single fastest way to reduce food carbon footprint without changing how much you eat. Eating local and organic foods also trims about **10%** off your food footprint due to reduced shipping distances ("food miles").`;
  }

  // 4. Check intent: AC / Electricity / Energy
  if (msg.includes("ac ") || msg.includes("electricity") || msg.includes("power") || msg.includes("energy") || msg.includes("solar") || msg.includes("heater")) {
    return `Energy production is responsible for over **70% of global emissions**. Here is how you can optimize your home utilities:

1. **Air Conditioning (AC)**: An average central AC draws about **1.5 kW**. Running it for 6 hours a day creates roughly **4.2 kg CO₂** on a standard fossil-fuel power grid. If you offset this with **solar panels** (or sign up for a green community energy tariff), you can reduce this grid footprint to nearly **zero**!
2. **Heating**: Electric space heaters draw **~2.0 kW** (creating **0.94 kg CO₂ per hour**). Ensuring proper insulation and using heat pumps instead of standard resistance heating is up to 3-4x more efficient.
3. **Led Lighting**: Swapping standard incandescent bulbs for LEDs cuts lighting power usage by **85%**.

Do you know if your energy utility provider offers a **renewable energy option**? Selecting that option is an instant way to cut home emissions to zero!`;
  }

  // 5. Check intent: What is Carbon Footprint
  if (msg.includes("what is") || msg.includes("explain") || msg.includes("carbon footprint")) {
    return `A **Carbon Footprint** is the total greenhouse gas emissions (expressed in carbon dioxide equivalent, or **CO₂e**) caused directly and indirectly by an individual, organization, event, or product.

It consists of:
* **Direct (Scope 1) Emissions**: Things you burn directly, like gasoline in your car's engine, or gas/oil in your home heater.
* **Indirect (Scope 2 & 3) Emissions**: Emissions from power plants generating the electricity you consume, or emissions from factories manufacturing the clothes, phones, and food you purchase.

The global average carbon footprint is around **4.5 tonnes (4,500 kg) per person per year**. To avoid the worst impacts of climate change, the target global average needs to drop to under **2.0 tonnes** per person by 2030. Tracking daily with CarbonMind AI helps you stay on track!`;
  }

  // 6. Default fallback
  return `Thank you for sharing that, ${name}. Every step towards tracking and mindfulness count! 

Based on your message, here is my suggestion:
* **Focus on Small Gains**: Swapping a short car drive for walking or biking saves roughly **0.21 kg CO₂ per kilometer**.
* **Review your Dashboard**: Check your **Carbon Score** to see how today's activities fit your target goal.
* **Log Frequently**: Your current streak is **${profile?.streak || 0} days**. Logging your habits daily builds long-term awareness.

What specific habit would you like to analyze or change next? (e.g., transport, shopping, food)`;
  }
