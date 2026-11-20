const { Redis } = require("@upstash/redis");
const { INVENTORY_KEY, ensureSeededInventory, priceForCartItem } = require("./catalog");

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const ORDERS_KEY = "mount-parche:orders";
const SETTINGS_KEY = "mount-parche:settings";
const PAYMENT_KEY_PREFIX = "mount-parche:payment:";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
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

function generateOrderId() {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return "MP-" + day + "-" + Date.now().toString().slice(-6);
}

function cleanCart(cart, inventory) {
  const inventoryByName = new Map(inventory.map((item) => [item.name, item]));
  const quantities = new Map();
  for (const line of cart) {
    const key = [String(line?.name || "").trim(), String(line?.variation || "").trim(), String(line?.size || "").trim()].join("\u0000");
    const qty = Number(line?.qty || 0);
    if (!Number.isInteger(qty) || qty < 1) throw new Error("Invalid cart item");
    const previous = quantities.get(key);
    quantities.set(key, { ...line, qty: (previous?.qty || 0) + qty });
  }
  cart = [...quantities.values()];
  const cleaned = [];
  for (const line of cart) {
    const name = String(line?.name || "").trim();
    const qty = Number(line?.qty || 0);
    const variation = String(line?.variation || "").trim();
    const size = String(line?.size || "").trim();
    const inventoryItem = inventoryByName.get(name);
    if (!name || !Number.isInteger(qty) || qty < 1) throw new Error("Invalid cart item");
    if (!inventoryItem) throw new Error("Item not found: " + name);
    if (!inventoryItem.available) throw new Error(name + " is currently unavailable.");
    const sizeTracked = Array.isArray(inventoryItem.sizes) && inventoryItem.sizes.length > 0;
    const availableStock = sizeTracked
      ? Number(inventoryItem.sizeStock?.[size] ?? inventoryItem.stock) || 0
      : Number(inventoryItem.stock);
    if (sizeTracked && !inventoryItem.sizes.includes(size)) throw new Error("Choose a valid size for " + name + ".");
    if (availableStock < qty) throw new Error("Only " + availableStock + " of " + name + (size ? ` in size ${size}` : "") + " are available.");
    const price = priceForCartItem(inventoryItem, line);
    if (!Number.isFinite(price) || price < 0) throw new Error("Invalid variation for " + name);
    cleaned.push({
      name,
      qty,
      price,
      variation: variation || undefined,
      size: size || undefined,
      category: String(inventoryItem.category || ""),
      type: String(inventoryItem.type || ""),
      subcategory: String(inventoryItem.subcategory || ""),
    });
  }
  if (!cleaned.length) throw new Error("Cart is empty");
  return cleaned;
}

async function validateRazorpayPayment(orderId, paymentVerification, total) {
  const payment = await redis.get(PAYMENT_KEY_PREFIX + orderId);
  if (!payment || payment.status !== "verified") throw new Error("Online payment has not been verified.");
  if (
    payment.razorpayOrderId !== String(paymentVerification?.razorpayOrderId || "") ||
    payment.razorpayPaymentId !== String(paymentVerification?.razorpayPaymentId || "") ||
    Number(payment.amount) !== Math.round(total * 100)
  ) {
    throw new Error("Online payment details do not match this order.");
  }
  return payment;
}

module.exports = async (req, res) => {
  setCors(res);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method === "OPTIONS") return res.status(200).end();
  res.setHeader("Cache-Control", req.method === "GET" ? "public, s-maxage=3, stale-while-revalidate=5" : "no-cache, no-store, must-revalidate");

  try {
    const storedOrders = (await redis.get(ORDERS_KEY)) || [];
    if (req.method === "GET") return res.status(200).json(Array.isArray(storedOrders) ? storedOrders : []);

    if (req.method === "POST") {
      const body = await readJsonBody(req);
      if (!body.details || typeof body.details !== "object") return res.status(400).json({ message: "Missing order details" });
      if (!Array.isArray(body.cart)) return res.status(400).json({ message: "Missing cart items" });

      const inventory = await ensureSeededInventory(redis);
      let items;
      try {
        items = cleanCart(body.cart, inventory);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
      const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
      const settings = (await redis.get(SETTINGS_KEY)) || {};
      const minOrderPrice = Number(settings.minOrderPrice) || 0;
      if (minOrderPrice > 0 && subtotal < minOrderPrice) {
        return res.status(400).json({ message: "Minimum order amount is ₹" + minOrderPrice + ". Your total is ₹" + subtotal + "." });
      }

      const paymentMethod = String(body.details.payment || "Cash on Delivery").trim();
      const discount = paymentMethod === "Razorpay" && subtotal > 21 ? 21 : 0;
      const total = subtotal - discount;
      const id = String(body.id || generateOrderId()).trim();
      let verifiedPayment;
      if (paymentMethod !== "Razorpay" && paymentMethod !== "Cash on Delivery") {
        return res.status(400).json({ message: "Unsupported payment method." });
      }
      if (paymentMethod === "Cash on Delivery" && (
        settings.codEnabled === false ||
        items.some((item) => inventory.find((inventoryItem) => inventoryItem.name === item.name)?.codEnabled === false)
      )) {
        return res.status(400).json({ message: "Cash on Delivery is unavailable for this order." });
      }
      if (paymentMethod === "Razorpay") {
        try {
          verifiedPayment = await validateRazorpayPayment(id, body.paymentVerification, total);
        } catch (error) {
          return res.status(400).json({ message: error.message });
        }
      }

      const inventoryByName = new Map(inventory.map((item) => [item.name, item]));
      for (const item of items) {
        const inventoryItem = inventoryByName.get(item.name);
        if (Array.isArray(inventoryItem.sizes) && inventoryItem.sizes.includes(item.size)) {
          inventoryItem.sizeStock = inventoryItem.sizeStock || Object.fromEntries(
            inventoryItem.sizes.map((size) => [size, Number(inventoryItem.stock) || 0])
          );
          inventoryItem.sizeStock[item.size] = Math.max(0, Number(inventoryItem.sizeStock[item.size]) - item.qty);
          inventoryItem.stock = Math.max(0, Number(inventoryItem.stock) - item.qty);
        } else {
          inventoryItem.stock = Math.max(0, Number(inventoryItem.stock) - item.qty);
        }
      }

      const order = {
        id,
        createdAt: new Date().toISOString(),
        details: { ...body.details, payment: paymentMethod || "Cash on Delivery" },
        items,
        cart: items,
        subtotal,
        discount,
        total,
        status: "Pending",
      };
      if (verifiedPayment) {
        order.payment = {
          provider: "Razorpay",
          paymentId: verifiedPayment.razorpayPaymentId,
          orderId: verifiedPayment.razorpayOrderId,
          status: "paid",
        };
        await redis.set(PAYMENT_KEY_PREFIX + id, { ...verifiedPayment, status: "consumed", consumedAt: new Date().toISOString() });
      }

      const orders = Array.isArray(storedOrders) ? storedOrders : [];
      await Promise.all([redis.set(ORDERS_KEY, [...orders, order]), redis.set(INVENTORY_KEY, inventory)]);

      // Send Telegram notification (best effort)
      try {
        const { sendTelegramMessage } = require("./telegram");
        const orderText = [
          "<b>New Order #" + order.id + "</b>",
          "Customer: " + (order.details.name || "N/A"),
          "Phone: " + (order.details.phone || "N/A"),
          "Payment: " + (order.details.payment || "N/A"),
          "Total: ₹" + order.total,
          "Items: " + (order.items || []).map((item) => item.qty + " × " + item.name).join(", "),
          "Address: " + (order.details.address || "N/A"),
          "Service: " + (order.details.service || "N/A") + " · " + (order.details.time || "N/A"),
        ].join("\n");
        await sendTelegramMessage(orderText);
      } catch (telegramError) {
        console.error("Telegram notification failed:", telegramError);
      }

      return res.status(201).json({ order, inventory });
    }

    if (req.method === "PATCH") {
      const body = await readJsonBody(req);
      const id = String(body.id || "").trim();
      const status = String(body.status || "").trim();
      if (!id || !status) return res.status(400).json({ message: "Missing order id or status" });

      const orders = Array.isArray(storedOrders) ? storedOrders : [];
      const index = orders.findIndex((order) => order?.id === id);
      if (index < 0) return res.status(404).json({ message: "Order not found" });

      const order = orders[index];
      const previousStatus = order.status;
      order.status = status;
      if (status === "Fulfilled" && previousStatus !== "Fulfilled") {
        order.fulfilledAt = new Date().toISOString();
      }
      if (status === "Out for Delivery" && previousStatus !== "Out for Delivery") {
        order.deliveryCode = order.deliveryCode || String(Math.floor(100000 + Math.random() * 900000));
        order.deliveryPartner = String(body.deliveryPartner || "").trim();
      }

      const inventory = await ensureSeededInventory(redis);
      if (status === "Cancelled" && previousStatus !== "Cancelled" && previousStatus !== "Fulfilled") {
        const inventoryByName = new Map(inventory.map((item) => [item.name, item]));
        for (const item of order.items || order.cart || []) {
          if (item.cancelled) continue;
          const inventoryItem = inventoryByName.get(item.name);
          if (inventoryItem) {
            const qty = Number(item.qty) || 0;
            if (Array.isArray(inventoryItem.sizes) && inventoryItem.sizes.includes(item.size)) {
              inventoryItem.sizeStock = inventoryItem.sizeStock || Object.fromEntries(
                inventoryItem.sizes.map((size) => [size, Number(inventoryItem.stock) || 0])
              );
              inventoryItem.sizeStock[item.size] = (Number(inventoryItem.sizeStock[item.size]) || 0) + qty;
            }
            inventoryItem.stock += qty;
          }
        }
        await redis.set(INVENTORY_KEY, inventory);
      }

      await redis.set(ORDERS_KEY, orders);
      return res.status(200).json({ order, inventory });
    }

    if (req.method === "DELETE") {
      const body = await readJsonBody(req);
      const orders = Array.isArray(storedOrders) ? storedOrders : [];
      if (body.action === "clear-expired-fulfilled") {
        const cutoff = Date.now() - 10 * 24 * 60 * 60 * 1000;
        const remainingOrders = orders.filter((order) => {
          if (order?.status !== "Fulfilled") return true;
          const fulfilledAt = Date.parse(order.fulfilledAt || "");
          return !Number.isFinite(fulfilledAt) || fulfilledAt > cutoff;
        });
        const deletedCount = orders.length - remainingOrders.length;
        if (deletedCount > 0) await redis.set(ORDERS_KEY, remainingOrders);
        return res.status(200).json({ message: "Expired delivered orders cleared", deletedCount });
      }
      const id = String(body.id || "").trim();
      const nextOrders = orders.filter((order) => order?.id !== id);
      if (nextOrders.length === orders.length) return res.status(404).json({ message: "Order not found" });
      await redis.set(ORDERS_KEY, nextOrders);
      return res.status(200).json({ message: "Order deleted" });
    }

    if (req.method === "PUT") {
      const body = await readJsonBody(req);
      const action = String(body.action || "").trim();
      const id = String(body.id || "").trim();
      const orders = Array.isArray(storedOrders) ? storedOrders : [];
      const index = orders.findIndex((order) => order?.id === id);
      if (!id || index < 0) return res.status(404).json({ message: "Order not found" });

      const order = orders[index];
      if (action === "request-return") {
        if (order.status !== "Fulfilled") return res.status(409).json({ message: "Returns are available only after delivery." });
        const deliveredAt = Date.parse(order.fulfilledAt || "");
        const ageMs = Date.now() - deliveredAt;
        if (!Number.isFinite(deliveredAt) || ageMs < 0 || ageMs > 7 * 24 * 60 * 60 * 1000) {
          return res.status(409).json({ message: "The 7-day return period has expired." });
        }
        if (order.returnRequest) return res.status(409).json({ message: "A return request already exists for this order." });
        const paymentMethod = String(order.details?.payment || "").trim();
        let upiId = "";
        if (paymentMethod === "Cash on Delivery") {
          upiId = String(body.upiId || "").trim();
          if (!/^[\w.-]{2,256}@[\w.-]{2,64}$/.test(upiId)) {
            return res.status(400).json({ message: "Enter a valid UPI ID for the COD refund." });
          }
        } else if (paymentMethod !== "Razorpay") {
          return res.status(400).json({ message: "Return requests are supported for Razorpay and Cash on Delivery orders." });
        }
        order.returnRequest = {
          status: "Requested",
          submittedAt: new Date().toISOString(),
          paymentMethod,
          upiId: upiId || undefined,
          customer: { ...order.details },
          items: (order.items || order.cart || []).filter((item) => !item.cancelled).map((item) => ({ name: item.name, qty: item.qty, price: item.price, size: item.size, variation: item.variation })),
          orderTotal: order.total,
        };
        await redis.set(ORDERS_KEY, orders);
        return res.status(201).json({ message: "Return request sent to the store", order });
      }
      if (action === "update-return-status") {
        const nextStatus = String(body.status || "").trim();
        if (!order.returnRequest) return res.status(404).json({ message: "Return request not found" });
        if (nextStatus === "Accepted" && order.returnRequest.status === "Requested") {
          order.returnRequest.status = "Accepted";
          order.returnRequest.acceptedAt = new Date().toISOString();
        } else if (nextStatus === "Refund Initiated" && order.returnRequest.status === "Accepted") {
          order.returnRequest.status = "Refund Initiated";
          order.returnRequest.refundInitiatedAt = new Date().toISOString();
        } else {
          return res.status(409).json({ message: "Return request status cannot be changed to that state." });
        }
        await redis.set(ORDERS_KEY, orders);
        return res.status(200).json({ message: `Return status updated to ${nextStatus}`, order });
      }
      if (action === "accept-delivery") {
        const partner = String(body.partner || "").trim();
        if (!partner) return res.status(400).json({ message: "Partner name is required" });
        if (order.status !== "Out for Delivery") return res.status(409).json({ message: "Order is not available for delivery" });
        if (order.deliveryPartner && order.deliveryPartner !== partner) {
          return res.status(409).json({ message: "Order is assigned to another partner" });
        }
        if (order.partnerAccepted) return res.status(409).json({ message: "Order has already been accepted" });
        order.deliveryPartner = partner;
        order.partnerAccepted = true;
        await redis.set(ORDERS_KEY, orders);
        return res.status(200).json({ message: "Order claimed successfully", order });
      }

      if (action === "verify-otp") {
        const otp = String(body.otp || "").trim();
        if (order.status !== "Out for Delivery") return res.status(409).json({ message: "Order is not out for delivery" });
        if (!order.deliveryCode || order.deliveryCode !== otp) {
          return res.status(403).json({ message: "Incorrect delivery code. Please try again." });
        }
        order.status = "Fulfilled";
        order.fulfilledAt = new Date().toISOString();
        await redis.set(ORDERS_KEY, orders);
        return res.status(200).json({ message: "Delivery verified! Order fulfilled.", order });
      }

      if (action === "cancel-item") {
        const itemName = String(body.itemName || "").trim();
        if (!itemName) return res.status(400).json({ message: "Item name is required" });
        if (order.status === "Fulfilled" || order.status === "Cancelled") {
          return res.status(409).json({ message: "Cannot modify a fulfilled or cancelled order" });
        }
        const items = Array.isArray(order.items) ? order.items : order.cart || [];
        const item = items.find((entry) => entry.name === itemName);
        if (!item) return res.status(404).json({ message: "Item not found in this order" });
        if (item.cancelled) return res.status(409).json({ message: "Item is already cancelled" });
        const inventory = await ensureSeededInventory(redis);
        const inventoryItem = inventory.find((entry) => entry.name === item.name);
        if (inventoryItem) {
          const qty = Number(item.qty) || 0;
          if (Array.isArray(inventoryItem.sizes) && inventoryItem.sizes.includes(item.size)) {
            inventoryItem.sizeStock = inventoryItem.sizeStock || Object.fromEntries(
              inventoryItem.sizes.map((size) => [size, Number(inventoryItem.stock) || 0])
            );
            inventoryItem.sizeStock[item.size] = (Number(inventoryItem.sizeStock[item.size]) || 0) + qty;
          }
          inventoryItem.stock = (Number(inventoryItem.stock) || 0) + qty;
          await redis.set(INVENTORY_KEY, inventory);
        }
        item.cancelled = true;
        order.total = Math.max(0, Number(order.total) - Number(item.price || 0) * Number(item.qty || 1));
        if (items.every((entry) => entry.cancelled)) order.status = "Cancelled";
        await redis.set(ORDERS_KEY, orders);
        return res.status(200).json({ message: "Item cancelled", order });
      }

      return res.status(400).json({ message: "Unknown order action" });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({ message: "Orders endpoint failed", error: String(error?.message || error) });
  }
};
