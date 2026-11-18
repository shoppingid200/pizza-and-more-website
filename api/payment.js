const crypto = require("crypto");
const { Redis } = require("@upstash/redis");
const { ensureSeededInventory, priceForCartItem } = require("./catalog");

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const PAYMENT_KEY_PREFIX = "mount-parche:payment:";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
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

function generateMerchantOrderId() {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return "MP-" + day + "-" + Date.now().toString().slice(-6);
}

function calculateAuthoritativeTotal(cart, inventory) {
  if (!Array.isArray(cart) || !cart.length) throw new Error("Cart is empty");
  const inventoryByName = new Map(inventory.map((item) => [item.name, item]));
  let total = 0;

  for (const line of cart) {
    const name = String(line?.name || "").trim();
    const qty = Number(line?.qty || 0);
    const inventoryItem = inventoryByName.get(name);
    if (!name || !Number.isInteger(qty) || qty < 1) throw new Error("Invalid cart item");
    if (!inventoryItem || !inventoryItem.available || Number(inventoryItem.stock) < qty) {
      throw new Error(name + " is unavailable or has insufficient stock.");
    }
    const price = priceForCartItem(inventoryItem, line);
    if (!Number.isFinite(price) || price < 0) throw new Error("Invalid variation for " + name);
    total += price * qty;
  }

  return total;
}

async function razorpayRequest(path, keyId, keySecret, body) {
  const authorization = Buffer.from(keyId + ":" + keySecret).toString("base64");
  const response = await fetch("https://api.razorpay.com" + path, {
    method: "POST",
    headers: {
      Authorization: "Basic " + authorization,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.description || "Razorpay could not create the payment order.");
  return data;
}

module.exports = async (req, res) => {
  setCors(res);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

  try {
    const body = await readJsonBody(req);
    const action = String(body.action || "").trim();
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return res.status(503).json({ message: "Online payments are not configured yet." });

    if (action === "create-order") {
      const inventory = await ensureSeededInventory(redis);
      let total;
      try {
        total = calculateAuthoritativeTotal(body.cart, inventory);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }

      const merchantOrderId = generateMerchantOrderId();
      const razorpayOrder = await razorpayRequest("/v1/orders", keyId, keySecret, {
        amount: Math.round(total * 100),
        currency: "INR",
        receipt: merchantOrderId,
        notes: { store: "Mount Parche" },
      });
      await redis.set(PAYMENT_KEY_PREFIX + merchantOrderId, {
        status: "created",
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        razorpayOrderId: razorpayOrder.id,
        createdAt: new Date().toISOString(),
      });
      return res.status(201).json({
        merchantOrderId,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId,
      });
    }

    if (action === "verify") {
      const merchantOrderId = String(body.merchantOrderId || "").trim();
      const razorpayOrderId = String(body.razorpayOrderId || "").trim();
      const razorpayPaymentId = String(body.razorpayPaymentId || "").trim();
      const razorpaySignature = String(body.razorpaySignature || "").trim();
      const payment = await redis.get(PAYMENT_KEY_PREFIX + merchantOrderId);
      if (!merchantOrderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !payment) {
        return res.status(400).json({ message: "Missing or expired payment verification details." });
      }
      if (payment.status !== "created" || payment.razorpayOrderId !== razorpayOrderId) {
        return res.status(400).json({ message: "This payment order cannot be verified." });
      }

      const expectedSignature = crypto.createHmac("sha256", keySecret).update(razorpayOrderId + "|" + razorpayPaymentId).digest("hex");
      const expectedBuffer = Buffer.from(expectedSignature, "utf8");
      const actualBuffer = Buffer.from(razorpaySignature, "utf8");
      if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
        return res.status(400).json({ message: "Razorpay payment verification failed." });
      }

      const verifiedPayment = {
        ...payment,
        status: "verified",
        razorpayPaymentId,
        verifiedAt: new Date().toISOString(),
      };
      await redis.set(PAYMENT_KEY_PREFIX + merchantOrderId, verifiedPayment);
      return res.status(200).json({ merchantOrderId, razorpayOrderId, razorpayPaymentId });
    }

    return res.status(400).json({ message: "Unknown payment action" });
  } catch (error) {
    return res.status(500).json({ message: String(error?.message || "Payment request failed") });
  }
};
