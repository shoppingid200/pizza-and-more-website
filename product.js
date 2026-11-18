const productImage = document.getElementById("product-image");
const productTitle = document.getElementById("product-title");
const productCategory = document.getElementById("product-category");
const productPrice = document.getElementById("product-price");
const productMrp = document.getElementById("product-mrp");
const productDiscount = document.getElementById("product-discount");
const productDesc = document.getElementById("product-desc");
const productVariations = document.getElementById("product-variations");
const variantSelect = document.getElementById("product-variant-select");
const productSizes = document.getElementById("product-sizes");
const sizeOptions = document.getElementById("size-options");
const productStock = document.getElementById("product-stock");
const qtyInput = document.getElementById("product-qty");
const qtyMinus = document.getElementById("qty-minus");
const qtyPlus = document.getElementById("qty-plus");
const addToCartBtn = document.getElementById("add-to-cart-btn");
const buyNowBtn = document.getElementById("buy-now-btn");
const addToCartMessage = document.getElementById("add-to-cart-message");
const toast = document.getElementById("toast");

const CART_STORAGE_KEY = "mount-parche-cart";
const INVENTORY_STORAGE_KEY = "mount-parche-inventory";
const INVENTORY_API_URL = "/api/inventory";

let inventory = [];
let currentProduct = null;
let selectedVariation = null;
let selectedSize = null;
let maxStock = 0;

function formatRupees(value) {
  return "₹" + value;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function readInventory() {
  try {
    return JSON.parse(localStorage.getItem(INVENTORY_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function updateQtyBounds() {
  qtyInput.max = maxStock;
  if (Number(qtyInput.value) > maxStock) qtyInput.value = maxStock;
  if (Number(qtyInput.value) < 1) qtyInput.value = 1;
  qtyMinus.disabled = Number(qtyInput.value) <= 1;
  qtyPlus.disabled = Number(qtyInput.value) >= maxStock || maxStock === 0;
  addToCartBtn.disabled = maxStock === 0;
  buyNowBtn.disabled = maxStock === 0;
}

function renderProduct() {
  if (!currentProduct) return;

  productTitle.textContent = currentProduct.name;
  productCategory.textContent = currentProduct.category;
  productDesc.textContent = currentProduct.desc || "No description.";

  const price = selectedVariation ? Number(selectedVariation.price) : Number(currentProduct.price || 0);
  const mrp = Number(currentProduct.mrp || 0);
  productPrice.textContent = formatRupees(price);
  if (mrp > price && mrp > 0) {
    productMrp.hidden = false;
    productMrp.textContent = "MRP " + formatRupees(mrp);
    const pct = Math.round(((mrp - price) / mrp) * 100);
    productDiscount.hidden = false;
    productDiscount.textContent = "-" + pct + "%";
  } else {
    productMrp.hidden = true;
    productDiscount.hidden = true;
  }

  const container = document.querySelector("#product-image");
  if (currentProduct.image) {
    container.innerHTML = '<img src="' + currentProduct.image + '" alt="' + currentProduct.name + '" style="width:100%;height:100%;object-fit:cover;object-position:center;border-radius:inherit;">';
  } else {
    container.innerHTML = '<div class="product-image-placeholder">No image</div>';
  }

  maxStock = Number(currentProduct.stock || 0);
  const available = currentProduct.available !== false && maxStock > 0;

  productStock.textContent = available
    ? "In stock: " + maxStock + " available"
    : "Out of stock";
  productStock.style.color = available ? "var(--basil)" : "var(--tomato)";

  const variations = currentProduct.variations && currentProduct.variations.length
    ? currentProduct.variations
    : null;

  const sizes = Array.isArray(currentProduct.sizes) && currentProduct.sizes.length
    ? currentProduct.sizes
    : null;

  // Size buttons
  if (sizes) {
    productSizes.hidden = false;
    sizeOptions.innerHTML = sizes.map((s) => {
      const active = selectedSize === s ? "active" : "";
      return '<button type="button" class="size-btn ' + active + '" data-size="' + s + '">' + s + "</button>";
    }).join("");
    if (!selectedSize) selectedSize = sizes[0];
    sizeOptions.querySelectorAll(".size-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedSize = btn.dataset.size;
        sizeOptions.querySelectorAll(".size-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
  } else {
    productSizes.hidden = true;
    selectedSize = null;
  }

  if (variations) {
    productVariations.hidden = false;
    variantSelect.innerHTML = variations.map(
      (v) => '<option value="' + v.name + '">' + v.name + " · " + formatRupees(v.price) + "</option>"
    ).join("");
    selectedVariation = variations[0];
    productPrice.textContent = formatRupees(Number(selectedVariation.price));
    const selectedMrp = Number(currentProduct.mrp || 0);
    if (selectedMrp > Number(selectedVariation.price) && selectedMrp > 0) {
      productMrp.hidden = false;
      productMrp.textContent = "MRP " + formatRupees(selectedMrp);
      const pct = Math.round(((selectedMrp - Number(selectedVariation.price)) / selectedMrp) * 100);
      productDiscount.hidden = false;
      productDiscount.textContent = "-" + pct + "%";
    } else {
      productMrp.hidden = true;
      productDiscount.hidden = true;
    }
    maxStock = Number(currentProduct.stock || 0);
  } else {
  productVariations.hidden = true;
    selectedVariation = null;
  }

  qtyInput.value = 1;
  updateQtyBounds();
  addToCartMessage.textContent = "";
}

function addToCart() {
  if (!currentProduct) return;
  const price = selectedVariation ? Number(selectedVariation.price) : Number(currentProduct.price || 0);
  const qty = Number(qtyInput.value) || 1;

  if (qty > maxStock) {
    showToast("Only " + maxStock + " available in stock.");
    return;
  }

  const cart = readCart();
  const existing = cart.find((item) => item.name === currentProduct.name && item.variation === (selectedVariation ? selectedVariation.name : null) && item.size === (selectedSize || null));

  if (existing) {
    existing.qty += qty;
    if (existing.qty > maxStock) existing.qty = maxStock;
  } else {
    cart.push({
      name: currentProduct.name,
      category: currentProduct.category || "",
      type: currentProduct.type || "",
      desc: currentProduct.desc || "",
      price,
      qty,
      variation: selectedVariation ? selectedVariation.name : null,
      size: selectedSize || null,
      codEnabled: currentProduct.codEnabled !== false
    });
  }

  saveCart(cart);
  addToCartMessage.textContent = "Added " + qty + " x " + currentProduct.name + " to cart";
  addToCartMessage.style.color = "var(--basil)";
  showToast("Added to cart");
  window.dispatchEvent(new Event("storage"));
}

async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const nameParam = decodeURIComponent(params.get("name") || "");
  const idParam = decodeURIComponent(params.get("id") || "");
  if (!nameParam && !idParam) {
    productTitle.textContent = "Product not found";
    return;
  }

  try {
    const res = await fetch(INVENTORY_API_URL + "?t=" + Date.now(), { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Failed to load inventory");
    inventory = await res.json();
    if (!Array.isArray(inventory)) inventory = [];
  } catch {
    inventory = readInventory();
  }

  currentProduct = inventory.find((item) => {
    if (nameParam && item.name === nameParam) return true;
    return item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === idParam;
  });
  if (!currentProduct) {
    productTitle.textContent = "Product not found";
    return;
  }

  renderProduct();
}

variantSelect.addEventListener("change", (e) => {
  const v = currentProduct.variations.find((x) => x.name === e.target.value);
  selectedVariation = v || null;
  renderProduct();
});

qtyMinus.addEventListener("click", () => {
  qtyInput.value = Math.max(1, Number(qtyInput.value) - 1);
  updateQtyBounds();
});

qtyPlus.addEventListener("click", () => {
  qtyInput.value = Math.min(maxStock, Number(qtyInput.value) + 1);
  updateQtyBounds();
});

qtyInput.addEventListener("input", updateQtyBounds);

  addToCartBtn.addEventListener("click", addToCart);
  buyNowBtn.addEventListener("click", () => {
    const price = selectedVariation ? Number(selectedVariation.price) : Number(currentProduct.price || 0);
    const qty = Number(qtyInput.value) || 1;
    if (qty > maxStock) {
      showToast("Only " + maxStock + " available in stock.");
      return;
    }
    const directItem = {
      name: currentProduct.name,
      category: currentProduct.category || "",
      type: currentProduct.type || "",
      desc: currentProduct.desc || "",
      price,
      qty,
      variation: selectedVariation ? selectedVariation.name : null,
      size: selectedSize || null,
      codEnabled: currentProduct.codEnabled !== false
    };
    localStorage.setItem("mount-parche-direct-order", JSON.stringify(directItem));
    window.location.href = "order.html?direct=1";
  });

loadProduct();
