const { Redis } = require("@upstash/redis");
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const USERS_KEY = "r-pizza-and-more:users";
const SESSIONS_KEY = "r-pizza-and-more:sessions";
const MASTER_KEY = process.env.ADMIN_MASTER_KEY || "TheAdminHouse";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function generateToken() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (req.body && typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return await new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => { raw += String(chunk); });
    req.on("end", () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  setCors(res);
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const body = await readJsonBody(req);
    const action = String(body.action || "").trim();

    // ── LOGIN ──
    if (action === "login") {
      const username = String(body.username || "").trim().toLowerCase();
      const password = String(body.password || "").trim();

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const users = (await redis.get(USERS_KEY)) || [];
      const user = users.find(
        (u) => u.username.toLowerCase() === username && u.password === password
      );

      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Create session
      const token = generateToken();
      const sessions = (await redis.get(SESSIONS_KEY)) || [];
      sessions.push({
        token,
        username: user.username,
        role: user.role || "admin",
        createdAt: new Date().toISOString(),
      });

      // Keep only last 50 sessions to avoid bloat
      const trimmed = sessions.slice(-50);
      await redis.set(SESSIONS_KEY, trimmed);

      return res.status(200).json({
        token,
        username: user.username,
        role: user.role || "admin",
        message: "Login successful",
      });
    }

    // ── REGISTER (requires master key) ──
    if (action === "register") {
      const masterKey = String(body.masterKey || "").trim();
      const username = String(body.username || "").trim();
      const password = String(body.password || "").trim();

      if (!masterKey || !username || !password) {
        return res.status(400).json({ message: "Master key, username, and password are required" });
      }

      if (masterKey !== MASTER_KEY) {
        return res.status(403).json({ message: "Invalid master key" });
      }

      if (username.length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters" });
      }
      if (password.length < 4) {
        return res.status(400).json({ message: "Password must be at least 4 characters" });
      }

      const users = (await redis.get(USERS_KEY)) || [];
      const exists = users.some((u) => u.username.toLowerCase() === username.toLowerCase());

      if (exists) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const role = String(body.role || "admin").trim();
      if (role !== "admin" && role !== "delivery") {
        return res.status(400).json({ message: "Role must be 'admin' or 'delivery'" });
      }

      users.push({
        username,
        password,
        role,
        createdAt: new Date().toISOString(),
      });

      await redis.set(USERS_KEY, users);

      return res.status(201).json({ message: `${role === "delivery" ? "Delivery partner" : "Admin"} "${username}" created successfully` });
    }

    // ── VERIFY SESSION ──
    if (action === "verify") {
      const token = String(body.token || "").trim();
      if (!token) return res.status(401).json({ valid: false, message: "No token provided" });

      const sessions = (await redis.get(SESSIONS_KEY)) || [];
      const session = sessions.find((s) => s.token === token);

      if (!session) {
        return res.status(401).json({ valid: false, message: "Session expired or invalid" });
      }

      return res.status(200).json({ valid: true, username: session.username, role: session.role || "admin" });
    }

    // ── LOGOUT ──
    if (action === "logout") {
      const token = String(body.token || "").trim();
      if (!token) return res.status(200).json({ message: "Logged out" });

      const sessions = (await redis.get(SESSIONS_KEY)) || [];
      const filtered = sessions.filter((s) => s.token !== token);
      await redis.set(SESSIONS_KEY, filtered);

      return res.status(200).json({ message: "Logged out successfully" });
    }
    // ── DELETE USER (requires master key) ──
    if (action === "delete") {
      const masterKey = String(body.masterKey || "").trim();
      const username = String(body.username || "").trim();

      if (!masterKey || !username) {
        return res.status(400).json({ message: "Master key and username are required" });
      }

      if (masterKey !== MASTER_KEY) {
        return res.status(403).json({ message: "Invalid master key" });
      }

      const users = (await redis.get(USERS_KEY)) || [];
      const filtered = users.filter((u) => u.username.toLowerCase() !== username.toLowerCase());

      if (filtered.length === users.length) {
        return res.status(404).json({ message: `User "${username}" not found` });
      }

      await redis.set(USERS_KEY, filtered);

      // Also remove their sessions
      const sessions = (await redis.get(SESSIONS_KEY)) || [];
      const cleanSessions = sessions.filter((s) => s.username.toLowerCase() !== username.toLowerCase());
      await redis.set(SESSIONS_KEY, cleanSessions);

      return res.status(200).json({ message: `User "${username}" removed successfully` });
    }

    // ── LIST USERS (requires master key) ──
    if (action === "list") {
      const masterKey = String(body.masterKey || "").trim();

      if (!masterKey) {
        return res.status(400).json({ message: "Master key is required" });
      }

      if (masterKey !== MASTER_KEY) {
        return res.status(403).json({ message: "Invalid master key" });
      }

      const users = (await redis.get(USERS_KEY)) || [];
      const usernames = users.map((u) => ({ username: u.username, role: u.role || "admin", createdAt: u.createdAt }));

      return res.status(200).json({ users: usernames });
    }

    return res.status(400).json({ message: "Unknown action. Use: login, register, verify, logout, delete, list" });
  } catch (e) {
    return res.status(500).json({ message: "Auth endpoint failed", error: String(e?.message || e) });
  }
};
