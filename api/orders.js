const { Redis } = require("@upstash/redis");
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const ORDERS_KEY = "r-pizza-and-more:orders";
const INVENTORY_KEY = "r-pizza-and-more:inventory";

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
  return MENU_ITEMS.map((item) => ({ ...item, stock: 50, available: true }));
}

async function ensureSeededInventory() {
  const existing = await redis.get(INVENTORY_KEY);
  if (Array.isArray(existing)) return existing;
  const seeded = buildDefaultInventory();
  await redis.set(INVENTORY_KEY, seeded);
  return seeded;
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
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

function generateOrderId() {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Date.now().toString().slice(-5);
  return `RPZ-${day}-${suffix}`;
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
    const ordersExisting = (await redis.get(ORDERS_KEY)) || [];

    if (req.method === "GET") {
      return res.status(200).json(Array.isArray(ordersExisting) ? ordersExisting : []);
    }

    if (req.method === "POST") {
      const body = await readJsonBody(req);
      const details = body?.details;
      const cart = body?.cart;
      const id = body?.id || generateOrderId();
      const providedTotal = Number(body?.total);

      if (!details || typeof details !== "object") return res.status(400).json({ message: "Missing order details" });
      if (!Array.isArray(cart)) return res.status(400).json({ message: "Missing cart items" });

      const cleanedCart = cart
        .map((x) => ({
          name: String(x?.name || ""),
          qty: Number(x?.qty || 0),
          price: Number(x?.price || 0),
        }))
        .filter((x) => x.name && x.qty > 0);

      if (!cleanedCart.length) return res.status(400).json({ message: "Cart is empty" });

      const inventory = await ensureSeededInventory();
      const inventoryByName = new Map(inventory.map((x) => [x.name, x]));

      // Validate stock
      for (const ci of cleanedCart) {
        const invItem = inventoryByName.get(ci.name);
        if (!invItem) return res.status(400).json({ message: `Item not found: ${ci.name}` });
        if (!invItem.available) return res.status(409).json({ message: `${ci.name} is currently unavailable.` });
        if (invItem.stock < ci.qty) return res.status(409).json({ message: `Only ${invItem.stock} of ${ci.name} are available.` });
      }

      // Deduct stock
      for (const ci of cleanedCart) {
        const invItem = inventoryByName.get(ci.name);
        invItem.stock = Math.max(0, invItem.stock - ci.qty);
      }

      // Recompute total from cart (more reliable than trusting the client)
      const total = cleanedCart.reduce((sum, x) => sum + x.price * x.qty, 0);

      const createdAt = new Date().toISOString();
      const order = {
        id,
        createdAt,
        details,
        // Keep both `items` and `cart` for compatibility with your admin page.
        items: cleanedCart.map((x) => ({ ...x, category: "", type: "" })),
        cart: cleanedCart.map((x) => ({ ...x, category: "", type: "" })),
        total: Number.isFinite(providedTotal) && providedTotal > 0 ? providedTotal : total,
        status: "Pending",
      };

      const nextOrders = Array.isArray(ordersExisting) ? [...ordersExisting, order] : [order];
      await redis.set(ORDERS_KEY, nextOrders);
      await redis.set(INVENTORY_KEY, inventory);

      return res.status(201).json({ order, inventory });
    }

    if (req.method === "PATCH") {
      const body = await readJsonBody(req);
      const id = body?.id;
      const status = body?.status;
      if (!id || typeof id !== "string") return res.status(400).json({ message: "Missing order id" });
      if (!status || typeof status !== "string") return res.status(400).json({ message: "Missing status" });

      const orders = Array.isArray(ordersExisting) ? ordersExisting : [];
      const idx = orders.findIndex((o) => o?.id === id);
      if (idx === -1) return res.status(404).json({ message: "Order not found" });

      const inventory = await ensureSeededInventory();
      const inventoryByName = new Map(inventory.map((x) => [x.name, x]));

      const order = orders[idx];
      const prevStatus = order.status;
      order.status = status;

      // Generate a 6-digit delivery code when order goes "Out for Delivery"
      if (status === "Out for Delivery" && prevStatus !== "Out for Delivery") {
        if (!order.deliveryCode) {
          order.deliveryCode = String(Math.floor(100000 + Math.random() * 900000));
        }
        order.partnerAccepted = false;
        
        // Save delivery partner if assigned
        if (body.deliveryPartner) {
          order.deliveryPartner = String(body.deliveryPartner).trim();
        } else {
          order.deliveryPartner = ""; // Ensure it's clear for Any Partner
        }
      }

      // If an order is cancelled, restore stock once (only on transition to Cancelled).
      // Note: once an order is Fulfilled, we should not restore inventory.
      if (status === "Cancelled" && prevStatus !== "Cancelled") {
        if (prevStatus === "Fulfilled") {
          return res.status(409).json({ message: "Cannot cancel a fulfilled order" });
        }

        const items = Array.isArray(order.items) && order.items.length ? order.items : (Array.isArray(order.cart) ? order.cart : []);
        for (const it of items) {
          const name = String(it?.name || "");
          const qty = Number(it?.qty || 0);
          if (!name || qty <= 0) continue;
          const invItem = inventoryByName.get(name);
          if (!invItem) continue;
          invItem.stock += qty;
          // If inventory item exists but was unavailable, keep its `available` flag as-is.
        }
      }

      orders[idx] = order;
      await redis.set(ORDERS_KEY, orders);
      await redis.set(INVENTORY_KEY, inventory);

      return res.status(200).json({ order, inventory });
    }

    if (req.method === "DELETE") {
      const body = await readJsonBody(req);
      const id = body?.id;
      if (!id || typeof id !== "string") return res.status(400).json({ message: "Missing order id" });

      const orders = Array.isArray(ordersExisting) ? ordersExisting : [];
      const nextOrders = orders.filter((o) => o?.id !== id);
      await redis.set(ORDERS_KEY, nextOrders);
      return res.status(200).json({ ok: true });
    }

    if (req.method === "PUT") {
      const body = await readJsonBody(req);
      const action = String(body?.action || "").trim();

      // ── ACCEPT DELIVERY ORDER ──
      if (action === "accept-delivery") {
        const id = String(body?.id || "").trim();
        const partner = String(body?.partner || "").trim();

        if (!id || !partner) {
          return res.status(400).json({ message: "Order ID and partner name are required" });
        }

        const orders = Array.isArray(ordersExisting) ? ordersExisting : [];
        const idx = orders.findIndex((o) => o?.id === id);

        if (idx === -1) {
          return res.status(404).json({ message: "Order not found" });
        }

        const order = orders[idx];

        if (order.status !== "Out for Delivery") {
          return res.status(409).json({ message: "Order is not available for delivery" });
        }

        // Check if already claimed/assigned to someone else
        if (order.deliveryPartner && order.deliveryPartner !== partner) {
          return res.status(409).json({ message: "Order is assigned to another partner" });
        }
        
        // Check if already accepted
        if (order.partnerAccepted) {
          return res.status(409).json({ message: "Order has already been accepted" });
        }

        order.deliveryPartner = partner;
        order.partnerAccepted = true;
        orders[idx] = order;
        await redis.set(ORDERS_KEY, orders);

        return res.status(200).json({ message: "Order claimed successfully", order });
      }

      // ── VERIFY DELIVERY OTP ──
      if (action === "verify-otp") {
        const id = String(body?.id || "").trim();
        const otp = String(body?.otp || "").trim();

        if (!id || !otp) {
          return res.status(400).json({ message: "Order ID and OTP are required" });
        }

        const orders = Array.isArray(ordersExisting) ? ordersExisting : [];
        const idx = orders.findIndex((o) => o?.id === id);

        if (idx === -1) {
          return res.status(404).json({ message: "Order not found" });
        }

        const order = orders[idx];

        if (order.status !== "Out for Delivery") {
          return res.status(409).json({ message: "Order is not out for delivery" });
        }

        if (!order.deliveryCode) {
          return res.status(409).json({ message: "No delivery code assigned to this order" });
        }

        if (order.deliveryCode !== otp) {
          return res.status(403).json({ message: "Incorrect OTP. Please try again." });
        }

        // OTP matches — mark as Fulfilled
        order.status = "Fulfilled";
        order.fulfilledAt = new Date().toISOString();
        orders[idx] = order;
        await redis.set(ORDERS_KEY, orders);

        return res.status(200).json({ message: "Delivery verified! Order fulfilled.", order });
      }

      // ── CANCEL SPECIFIC ITEM ──
      if (action === "cancel-item") {
        const id = String(body?.id || "").trim();
        const itemName = String(body?.itemName || "").trim();

        if (!id || !itemName) {
          return res.status(400).json({ message: "Order ID and item name are required" });
        }

        const orders = Array.isArray(ordersExisting) ? ordersExisting : [];
        const idx = orders.findIndex((o) => o?.id === id);

        if (idx === -1) {
          return res.status(404).json({ message: "Order not found" });
        }

        const order = orders[idx];

        if (order.status === "Fulfilled" || order.status === "Cancelled") {
          return res.status(409).json({ message: "Cannot modify items in a fulfilled or cancelled order" });
        }

        const items = Array.isArray(order.items) ? order.items : (Array.isArray(order.cart) ? order.cart : []);
        const itemIdx = items.findIndex(it => it.name === itemName);

        if (itemIdx === -1) {
          return res.status(404).json({ message: "Item not found in this order" });
        }

        const targetItem = items[itemIdx];

        if (targetItem.cancelled) {
          return res.status(409).json({ message: "Item is already cancelled" });
        }

        // Cancel item and reduce total
        targetItem.cancelled = true;
        const itemCost = Number(targetItem.price || 0) * Number(targetItem.qty || 1);
        order.total = Math.max(0, order.total - itemCost);

        // Turn off item in inventory
        const inventory = await ensureSeededInventory();
        const invItem = inventory.find(x => x.name === itemName);
        if (invItem) {
          invItem.available = false;
        }

        // Check if ALL items are cancelled
        const allCancelled = items.every(it => it.cancelled);
        if (allCancelled) {
          order.status = "Cancelled";
        }

        orders[idx] = order;
        await redis.set(ORDERS_KEY, orders);
        await redis.set(INVENTORY_KEY, inventory);

        return res.status(200).json({ message: `Item ${itemName} cancelled`, order, inventory });
      }

      return res.status(400).json({ message: "Unknown PUT action" });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ message: "Orders endpoint failed", error: String(e?.message || e) });
  }
};

