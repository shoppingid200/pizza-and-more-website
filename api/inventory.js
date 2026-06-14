const { Redis } = require("@upstash/redis");
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const INVENTORY_KEY = "r-pizza-and-more:inventory";

// Mirrors the menu catalog used by `app.js` so the backend can be seeded.
const MENU_ITEMS = [
  {
    name: "Fresh veggie",
    category: "Veg Specials",
    type: "Veg",
    desc: "3 topping, onion, capsicum tomato",
    price: 179,
  },
  {
    name: "Veg pasta pizza",
    category: "Veg Specials",
    type: "Veg",
    desc: "5 topping, capsicum tomato pasta olives jalpino",
    price: 209,
  },
  { name: "Farmhouse", category: "Veg Specials", type: "Veg", desc: "5 topping, capsicum tomato onion corn mushroom", price: 209 },
  { name: "Veggi paradise", category: "Veg Specials", type: "Veg", desc: "4 topping, capsicum corn peprika olivs", price: 209 },
  { name: "Peppy Paneer", category: "Paneer Pizzas", type: "Veg", desc: "4 topping, capsicum onion paneer makhani", price: 209 },
  { name: "Paneer makhani", category: "Paneer Pizzas", type: "Veg", desc: "4 topping, capsicum peprika paneer makhani mint", price: 239 },
  { name: "Delux paneer veggie", category: "Paneer Pizzas", type: "Veg", desc: "4 topping, capsicum tomato paneer corn mushroom", price: 239 },
  { name: "veg extra vaganza", category: "Veg Specials", type: "Veg", desc: "7 topping, capsicum onion tomato corn olives mushroom jalapino", price: 239 },
  { name: "Tandoori paneer pizza", category: "Paneer Pizzas", type: "Veg", desc: "5 topping, capsicum peprika paneer makhani mint", price: 239 },
  { name: "Margherita", category: "Classic Veg", type: "Veg", desc: "Cheese only", price: 99 },
  { name: "Cheese paneer", category: "Classic Veg", type: "Veg", desc: "Single topping, paneer", price: 129 },
  { name: "Corn paneer", category: "Classic Veg", type: "Veg", desc: "2 topping, paneer, corn", price: 139 },
  { name: "Capsicum paneer", category: "Classic Veg", type: "Veg", desc: "2 topping, paneer, capsicum", price: 139 },
  { name: "Double cheese", category: "Classic Veg", type: "Veg", desc: "Double cheese only", price: 179 },
  { name: "Cheese corn", category: "Classic Veg", type: "Veg", desc: "Double cheese with corn", price: 179 },
  { name: "Cheese tomato", category: "Classic Veg", type: "Veg", desc: "Double cheese with tomato", price: 179 },
  { name: "Chicken sausage", category: "Non Veg", type: "Non Veg", desc: "Single topping, sausage flavour", price: 159 },
  { name: "Barbecue Chicken", category: "Non Veg", type: "Non Veg", desc: "Single topping, barbecue flavour", price: 189 },
  { name: "Nonveg pasta pizza", category: "Non Veg", type: "Non Veg", desc: "5 topping, capsicum tomato pasta chicken onion jalpino", price: 219 },
  { name: "Chicken goldendelight", category: "Non Veg", type: "Non Veg", desc: "2 topping, bbq chicken corn extra cheese", price: 219 },
  { name: "Barbecue & Onion", category: "Non Veg", type: "Non Veg", desc: "2 topping, barbecue flavour with onion", price: 219 },
  { name: "Chicken dominator", category: "Non Veg", type: "Non Veg", desc: "5 topping, capsicum tomato onion BBQ sausage ex cheese", price: 249 },
  { name: "Chicken tikka", category: "Non Veg", type: "Non Veg", desc: "4 topping capsicum peprika chicken makhani mint", price: 249 },
  { name: "Spice Double chicken", category: "Non Veg", type: "Non Veg", desc: "2 topping, BBQ & sausage with extra cheese", price: 249 },
  { name: "Tomato", category: "Burgers & More", type: "Veg", desc: "Quick bite", price: 69 },
  { name: "Onion", category: "Burgers & More", type: "Veg", desc: "Quick bite", price: 69 },
  { name: "Capsicum", category: "Burgers & More", type: "Veg", desc: "Quick bite", price: 69 },
  { name: "Golden corn", category: "Burgers & More", type: "Veg", desc: "Quick bite", price: 69 },
  { name: "Paneer onion", category: "Burgers & More", type: "Veg", desc: "Quick bite", price: 79 },
  { name: "Loaded veg", category: "Burgers & More", type: "Veg", desc: "Quick bite", price: 79 },
  { name: "Sausage", category: "Burgers & More", type: "Non Veg", desc: "Quick bite", price: 109 },
  { name: "Loaded chicken", category: "Burgers & More", type: "Non Veg", desc: "Quick bite", price: 129 },
  { name: "Cheese Nonveg", category: "Burgers & More", type: "Non Veg", desc: "Quick bite", price: 139 },
];

function buildDefaultInventory() {
  return MENU_ITEMS.map((item) => ({
    ...item,
    stock: 50,
    available: true,
  }));
}

async function ensureSeeded() {
  const existing = await redis.get(INVENTORY_KEY);
  if (Array.isArray(existing)) return existing;
  const seeded = buildDefaultInventory();
  await redis.set(INVENTORY_KEY, seeded);
  return seeded;
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (req.body && typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return await new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += String(chunk);
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  setCors(res);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    res.setHeader("Cache-Control", "public, s-maxage=3, stale-while-revalidate=5");
  } else {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  }

  try {
    if (req.method === "GET") {
      const inventory = await ensureSeeded();
      return res.status(200).json(inventory);
    }

    if (req.method === "PUT") {
      const body = await readJsonBody(req);
      const inventory = body?.inventory;
      if (!Array.isArray(inventory)) return res.status(400).json({ message: "Invalid inventory payload" });

      // Basic validation: ensure required fields exist.
      const normalized = inventory
        .filter((x) => x && typeof x.name === "string")
        .map((x) => {
          const obj = {
            name: String(x.name),
            category: String(x.category || ""),
            type: String(x.type || ""),
            desc: String(x.desc || ""),
            price: Number(x.price) || 0,
            stock: Number(x.stock) || 0,
            available: Boolean(x.available),
          };
          if (Array.isArray(x.variations) && x.variations.length > 0) {
            obj.variations = x.variations.map((v) => ({
              name: String(v.name || ""),
              price: Number(v.price) || 0,
            }));
          }
          if (typeof x.image === "string" && x.image.length > 0) {
            obj.image = x.image;
          }
          return obj;
        });

      await redis.set(INVENTORY_KEY, normalized);
      return res.status(200).json(normalized);
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ message: "Inventory endpoint failed", error: String(e?.message || e) });
  }
};

