const { Redis } = require("@upstash/redis");
const { INVENTORY_KEY, ensureSeededInventory } = require("./catalog");

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += String(chunk);
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function normalizeInventory(inventory) {
  return inventory
    .filter((item) => item && typeof item.name === "string" && item.name.trim())
    .map((item) => {
      const normalized = {
        name: String(item.name).trim(),
        category: String(item.category || "Other Items").trim(),
        type: String(item.type || "General").trim(),
        desc: String(item.desc || "").trim(),
        price: Math.max(0, Number(item.price) || 0),
        stock: Math.max(0, Number(item.stock) || 0),
        available: Boolean(item.available),
        codEnabled: Boolean(item.codEnabled),
      };
      if (Array.isArray(item.variations) && item.variations.length) {
        normalized.variations = item.variations
          .filter((variation) => variation && String(variation.name || "").trim())
          .map((variation) => ({
            name: String(variation.name).trim(),
            price: Math.max(0, Number(variation.price) || 0),
          }));
      }
      if (typeof item.image === "string" && item.image.trim()) normalized.image = item.image.trim();
      if (Array.isArray(item.tags)) normalized.tags = item.tags.map(String).filter(Boolean);
      return normalized;
    });
}

module.exports = async (req, res) => {
  setCors(res);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method === "OPTIONS") return res.status(200).end();
  res.setHeader(
    "Cache-Control",
    req.method === "GET" ? "public, s-maxage=3, stale-while-revalidate=5" : "no-cache, no-store, must-revalidate"
  );

  try {
    if (req.method === "GET") return res.status(200).json(await ensureSeededInventory(redis));
    if (req.method === "PUT") {
      const body = await readJsonBody(req);
      if (!Array.isArray(body.inventory)) return res.status(400).json({ message: "Invalid inventory payload" });
      const inventory = normalizeInventory(body.inventory);
      await redis.set(INVENTORY_KEY, inventory);
      return res.status(200).json(inventory);
    }
    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({ message: "Inventory endpoint failed", error: String(error?.message || error) });
  }
};
