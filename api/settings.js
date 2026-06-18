const { Redis } = require("@upstash/redis");

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const SETTINGS_KEY = "r-pizza-and-more:settings";
const SESSIONS_KEY = "r-pizza-and-more:sessions";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
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

  try {
    if (req.method === "GET") {
      const settings = (await redis.get(SETTINGS_KEY)) || {};
      return res.status(200).json(settings);
    }

    if (req.method === "POST") {
      const body = await readJsonBody(req);
      const token = String(body.token || "").trim();

      if (!token) return res.status(401).json({ message: "No token provided" });

      const sessions = (await redis.get(SESSIONS_KEY)) || [];
      const session = sessions.find((s) => s.token === token);

      // Only admins can update settings
      if (!session || session.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized to update settings" });
      }

      const settings = (await redis.get(SETTINGS_KEY)) || {};

      if (body.minOrderPrice !== undefined) {
        settings.minOrderPrice = Number(body.minOrderPrice);
      }

      await redis.set(SETTINGS_KEY, settings);
      return res.status(200).json({ message: "Settings updated successfully", settings });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ message: "Settings endpoint failed", error: String(e?.message || e) });
  }
};
