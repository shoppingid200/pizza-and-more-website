const { Redis } = require("@upstash/redis");

const CATEGORIES_KEY = "mount-parche:categories";
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const DEFAULT_CATEGORIES = [];

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => { raw += String(chunk); });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (error) { reject(error); }
    });
    req.on("error", reject);
  });
}

function normalizeTree(tree) {
  let count = 0;
  function normalizeNodes(nodes, depth = 0) {
    if (!Array.isArray(nodes)) throw new Error("Category tree must contain lists of categories.");
    return nodes.map((node) => {
      count += 1;
      if (count > 500 || depth > 8) throw new Error("Category tree is too large or too deeply nested.");
      const id = String(node?.id || "").trim();
      const name = String(node?.name || "").trim();
      const image = typeof node?.image === "string" ? node.image : "";
      if (!/^[A-Za-z0-9_-]{1,80}$/.test(id) || !name || name.length > 60) {
        throw new Error("Every category needs a valid ID and a name up to 60 characters.");
      }
      if (image && (!image.startsWith("data:image/") || image.length > 1600000)) {
        throw new Error("Category images must be compressed image files under 1.2 MB.");
      }
      return { id, name, image, children: normalizeNodes(node.children || [], depth + 1) };
    });
  }
  return normalizeNodes(tree);
}

module.exports = async (req, res) => {
  setCors(res);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method === "OPTIONS") return res.status(200).end();
  res.setHeader("Cache-Control", req.method === "GET" ? "public, s-maxage=3, stale-while-revalidate=5" : "no-cache, no-store, must-revalidate");

  try {
    if (req.method === "GET") {
      const saved = await redis.get(CATEGORIES_KEY);
      if (Array.isArray(saved)) return res.status(200).json(saved);
      await redis.set(CATEGORIES_KEY, DEFAULT_CATEGORIES);
      return res.status(200).json(DEFAULT_CATEGORIES);
    }
    if (req.method === "PUT") {
      const body = await readJsonBody(req);
      const categories = normalizeTree(body.categories);
      await redis.set(CATEGORIES_KEY, categories);
      return res.status(200).json(categories);
    }
    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    const message = String(error?.message || error);
    const isInvalidPayload = error instanceof SyntaxError || [
      "Category tree must contain lists of categories.",
      "Category tree is too large or too deeply nested.",
      "Every category needs a valid ID and a name up to 60 characters.",
      "Category images must be compressed image files under 1.2 MB.",
    ].includes(message);
    return res.status(isInvalidPayload ? 400 : 500).json({
      message: isInvalidPayload ? "Invalid category request" : "Category service unavailable",
      error: message,
    });
  }
};
