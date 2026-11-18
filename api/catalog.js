const INVENTORY_KEY = "mount-parche:inventory";

const CATALOG_ITEMS = [
  {
    name: "Classic Cotton T-Shirt",
    category: "Clothing",
    type: "Apparel",
    desc: "Everyday cotton T-shirt. Add your sizes and colours in the admin panel.",
    price: 499,
    codEnabled: true,
  },
  {
    name: "Casual Shirt",
    category: "Clothing",
    type: "Apparel",
    desc: "Comfortable casual shirt for daily wear.",
    price: 899,
    codEnabled: true,
  },
  {
    name: "Fashion Handbag",
    category: "Accessories",
    type: "Accessory",
    desc: "A versatile handbag for everyday essentials.",
    price: 1199,
    codEnabled: true,
  },
  {
    name: "Sunglasses",
    category: "Accessories",
    type: "Accessory",
    desc: "Lightweight sunglasses with UV protection.",
    price: 699,
    codEnabled: true,
  },
  {
    name: "Ceramic Mug Set",
    category: "Crockery",
    type: "Homeware",
    desc: "Set of two ceramic mugs for tea, coffee, or gifting.",
    price: 599,
    codEnabled: true,
  },
  {
    name: "Dinner Plate Set",
    category: "Crockery",
    type: "Homeware",
    desc: "Durable dinner plate set for your table.",
    price: 1499,
    codEnabled: true,
  },
  {
    name: "Everyday Essentials",
    category: "Other Items",
    type: "General",
    desc: "A flexible listing for any product you want to sell.",
    price: 299,
    codEnabled: true,
  },
];

function buildDefaultInventory() {
  return CATALOG_ITEMS.map((item) => ({ ...item, stock: 50, available: true, codEnabled: item.codEnabled !== false }));
}

async function ensureSeededInventory(redis) {
  const existing = await redis.get(INVENTORY_KEY);
  if (Array.isArray(existing)) return existing;

  const seeded = buildDefaultInventory();
  await redis.set(INVENTORY_KEY, seeded);
  return seeded;
}

function priceForCartItem(inventoryItem, cartItem) {
  const variationName = String(cartItem?.variation || "").trim();
  if (variationName && Array.isArray(inventoryItem.variations)) {
    const variation = inventoryItem.variations.find((item) => item.name === variationName);
    if (!variation) return null;
    return Number(variation.price);
  }
  return Number(inventoryItem.price);
}

module.exports = {
  INVENTORY_KEY,
  buildDefaultInventory,
  ensureSeededInventory,
  priceForCartItem,
};
