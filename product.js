const productImage = document.getElementById("product-image");
const productThumbnails = document.getElementById("product-thumbnails");
const productGalleryControls = document.getElementById("product-gallery-controls");
const productImagePrev = document.getElementById("product-image-prev");
const productImageNext = document.getElementById("product-image-next");
const productImageCount = document.getElementById("product-image-count");
const imageLightbox = document.getElementById("image-lightbox");
const imageLightboxImg = document.getElementById("image-lightbox-img");
const imageLightboxClose = document.getElementById("image-lightbox-close");
const productTitle = document.getElementById("product-title");
const productCategory = document.getElementById("product-category");
const productPrice = document.getElementById("product-price");
const productMrp = document.getElementById("product-mrp");
const productDiscount = document.getElementById("product-discount");
const productDesc = document.getElementById("product-desc");
const productColors = document.getElementById("product-colors");
const productColorOptions = document.getElementById("product-color-options");
const selectedColorName = document.getElementById("selected-color-name");
const productVariations = document.getElementById("product-variations");
const variantOptions = document.getElementById("variant-options");
const selectedVariantName = document.getElementById("selected-variant-name");
const productCodBenefit = document.getElementById("product-cod-benefit");
const productSizes = document.getElementById("product-sizes");
const sizeOptions = document.getElementById("size-options");
const selectedSizeName = document.getElementById("selected-size-name");
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
let variationsMatchSizes = false;
let maxStock = 0;
let galleryImages = [];
let galleryIndex = 0;
let activeMainImage = null;
let lastGallerySwipeAt = 0;
let galleryPointerStart = null;

function formatRupees(value) {
  return "₹" + value;
}

function updateProductPrice(price, mrp) {
  const salePrice = Number(price) || 0;
  const listPrice = Number(mrp) || 0;
  productPrice.textContent = formatRupees(salePrice);
  if (listPrice > salePrice && listPrice > 0) {
    productMrp.hidden = false;
    productMrp.textContent = "MRP " + formatRupees(listPrice);
    productDiscount.hidden = false;
    productDiscount.textContent = "-" + Math.round(((listPrice - salePrice) / listPrice) * 100) + "%";
  } else {
    productMrp.hidden = true;
    productDiscount.hidden = true;
  }
}

function openProductImage(image) {
  imageLightboxImg.src = image.src;
  imageLightboxImg.alt = image.alt;
  imageLightbox.hidden = false;
  document.body.classList.add("image-lightbox-open");
  imageLightboxClose.focus();
}

function closeProductImage() {
  imageLightbox.hidden = true;
  document.body.classList.remove("image-lightbox-open");
  productImage.querySelector(".product-image-expand")?.focus();
}

imageLightboxClose.addEventListener("click", closeProductImage);
imageLightbox.addEventListener("click", (event) => {
  if (event.target === imageLightbox) closeProductImage();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !imageLightbox.hidden) closeProductImage();
});

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

function showGalleryImage(index, direction = 1) {
  if (!galleryImages.length || !activeMainImage) return;
  galleryIndex = (index + galleryImages.length) % galleryImages.length;
  activeMainImage.src = galleryImages[galleryIndex];
  activeMainImage.alt = `${currentProduct.name}, image ${galleryIndex + 1} of ${galleryImages.length}`;
  productImageCount.textContent = `${galleryIndex + 1} / ${galleryImages.length}`;

  activeMainImage.classList.remove("gallery-slide-next", "gallery-slide-prev");
  void activeMainImage.offsetWidth;
  activeMainImage.classList.add(direction >= 0 ? "gallery-slide-next" : "gallery-slide-prev");

  productThumbnails.querySelectorAll(".product-thumbnail").forEach((button, buttonIndex) => {
    const active = buttonIndex === galleryIndex;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function renderProductGallery() {
  galleryImages = Array.isArray(currentProduct.images) && currentProduct.images.length
    ? currentProduct.images.filter((image) => typeof image === "string" && image)
    : (currentProduct.image ? [currentProduct.image] : []);
  galleryIndex = galleryImages.length ? galleryIndex % galleryImages.length : 0;
  productImage.replaceChildren();
  productThumbnails.replaceChildren();
  activeMainImage = null;
  productGalleryControls.hidden = galleryImages.length < 2;
  productThumbnails.hidden = galleryImages.length < 2;

  if (!galleryImages.length) {
    const placeholder = document.createElement("div");
    placeholder.className = "product-image-placeholder";
    placeholder.textContent = "No image";
    productImage.appendChild(placeholder);
    return;
  }

  activeMainImage = document.createElement("img");
  activeMainImage.src = galleryImages[galleryIndex];
  activeMainImage.alt = `${currentProduct.name}, image ${galleryIndex + 1} of ${galleryImages.length}`;
  activeMainImage.className = "product-main-image";
  const expandImageButton = document.createElement("button");
  expandImageButton.type = "button";
  expandImageButton.className = "product-image-expand";
  expandImageButton.setAttribute("aria-label", "View full size image of " + currentProduct.name);
  expandImageButton.appendChild(activeMainImage);
  expandImageButton.addEventListener("click", () => {
    if (Date.now() - lastGallerySwipeAt > 500) openProductImage(activeMainImage);
  });
  productImage.appendChild(expandImageButton);

  if (galleryImages.length < 2) return;

  galleryImages.forEach((src, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `product-thumbnail${index === galleryIndex ? " active" : ""}`;
    button.setAttribute("aria-label", `Show product image ${index + 1}`);
    button.setAttribute("aria-pressed", String(index === galleryIndex));
    const thumbnail = document.createElement("img");
    thumbnail.src = src;
    thumbnail.alt = "";
    button.appendChild(thumbnail);
    button.addEventListener("click", () => showGalleryImage(index, index >= galleryIndex ? 1 : -1));
    productThumbnails.appendChild(button);
  });

  productImageCount.textContent = `${galleryIndex + 1} / ${galleryImages.length}`;
}

productImagePrev.addEventListener("click", () => showGalleryImage(galleryIndex - 1, -1));
productImageNext.addEventListener("click", () => showGalleryImage(galleryIndex + 1, 1));

productImage.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "touch") return;
  galleryPointerStart = { x: event.clientX, y: event.clientY };
});

productImage.addEventListener("pointerup", (event) => {
  if (!galleryPointerStart || galleryImages.length < 2) return;
  const deltaX = event.clientX - galleryPointerStart.x;
  const deltaY = event.clientY - galleryPointerStart.y;
  galleryPointerStart = null;
  if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY)) return;
  lastGallerySwipeAt = Date.now();
  showGalleryImage(galleryIndex + (deltaX < 0 ? 1 : -1), deltaX < 0 ? 1 : -1);
});

productImage.addEventListener("pointercancel", () => {
  galleryPointerStart = null;
});

function renderProductColors() {
  productColorOptions.replaceChildren();
  const family = String(currentProduct.colorFamily || "").trim();
  const colorName = String(currentProduct.colorName || "").trim();
  const isPlaceholderColor = colorName.toLowerCase() === "free";
  const matches = family && family.toLowerCase() !== "free" && colorName && !isPlaceholderColor
    ? inventory.filter((item) => {
        const itemFamily = String(item.colorFamily || "").trim();
        const itemColor = String(item.colorName || "").trim();
        return itemFamily === family && itemColor && itemColor.toLowerCase() !== "free";
      })
    : [];

  if (matches.length < 2) {
    productColors.hidden = true;
    return;
  }

  selectedColorName.textContent = colorName;
  matches.forEach((item) => {
    const itemColorName = String(item.colorName).trim();
    const isCurrent = item.name === currentProduct.name;
    const link = document.createElement("a");
    const hasStock = item.available !== false && (Array.isArray(item.sizes) && item.sizes.length
      ? item.sizes.some((size) => Number((item.sizeStock || {})[size] ?? item.stock) > 0)
      : Number(item.stock) > 0);
    link.className = `product-color-option${isCurrent ? " active" : ""}${hasStock ? "" : " unavailable"}`;
    link.href = "product.html?name=" + encodeURIComponent(item.name);
    link.setAttribute("aria-label", `${itemColorName}${isCurrent ? ", selected" : ""}${hasStock ? "" : ", out of stock"}`);
    if (isCurrent) link.setAttribute("aria-current", "page");

    const imageUrl = Array.isArray(item.images) && item.images.length ? item.images[0] : item.image;
    if (imageUrl) {
      const image = document.createElement("img");
      image.src = imageUrl;
      image.alt = "";
      image.loading = "lazy";
      link.appendChild(image);
    } else {
      const swatch = document.createElement("span");
      swatch.className = "product-color-swatch";
      swatch.setAttribute("aria-hidden", "true");
      link.appendChild(swatch);
    }

    const label = document.createElement("span");
    label.textContent = itemColorName;
    link.appendChild(label);
    productColorOptions.appendChild(link);
  });
  productColors.hidden = false;
}

function renderProduct() {
  if (!currentProduct) return;
  renderProductColors();

  productTitle.textContent = currentProduct.name;
  productCategory.textContent = currentProduct.category;
  productDesc.textContent = currentProduct.desc || "No description.";

  const price = selectedVariation ? Number(selectedVariation.price) : Number(currentProduct.price || 0);
  const mrp = selectedVariation ? Number(selectedVariation.mrp || currentProduct.mrp || 0) : Number(currentProduct.mrp || 0);
  updateProductPrice(price, mrp);

  renderProductGallery();
  maxStock = Number(currentProduct.stock || 0);
  const available = currentProduct.available !== false && maxStock > 0;

  productStock.textContent = available
    ? "In stock: " + maxStock + " available"
    : "Out of stock";
  productStock.style.color = available ? "var(--basil)" : "var(--tomato)";
  productCodBenefit.hidden = currentProduct.codEnabled === false;

  const variations = currentProduct.variations && currentProduct.variations.length
    ? currentProduct.variations
    : null;

  const sizes = Array.isArray(currentProduct.sizes) && currentProduct.sizes.length
    ? currentProduct.sizes
    : null;
  const normalizeOption = (value) => String(value || "").trim().toLowerCase();
  variationsMatchSizes = Boolean(sizes && variations && sizes.length === variations.length &&
    sizes.every((size) => variations.some((variation) => normalizeOption(variation.name) === normalizeOption(size))));

  if (sizes) {
    productSizes.hidden = false;
    const sizeStock = currentProduct.sizeStock || {};
    const availableSizes = sizes.filter((size) => Number(sizeStock[size] ?? currentProduct.stock) > 0);
    selectedSize = sizes.includes(selectedSize) && Number(sizeStock[selectedSize] ?? currentProduct.stock) > 0
      ? selectedSize
      : (availableSizes[0] || null);
    maxStock = selectedSize ? Math.max(0, Number(sizeStock[selectedSize] ?? currentProduct.stock) || 0) : 0;
    if (variationsMatchSizes && selectedSize) {
      selectedVariation = variations.find((variation) => normalizeOption(variation.name) === normalizeOption(selectedSize)) || null;
      if (selectedVariation) updateProductPrice(selectedVariation.price, selectedVariation.mrp || currentProduct.mrp);
    } else if (variationsMatchSizes) {
      selectedVariation = null;
      updateProductPrice(currentProduct.price, currentProduct.mrp);
    }
    selectedSizeName.textContent = selectedSize || "Unavailable";
    productStock.textContent = maxStock > 0 ? `In stock for ${selectedSize}: ${maxStock} available` : `No sizes currently available`;
    productStock.style.color = maxStock > 0 ? "var(--basil)" : "var(--tomato)";
    sizeOptions.replaceChildren();
    sizes.forEach((size) => {
      const available = Number(sizeStock[size] ?? currentProduct.stock) > 0;
      const button = document.createElement("button");
      button.type = "button";
      button.className = `size-btn${selectedSize === size ? " active" : ""}${available ? "" : " out-of-stock"}`;
      button.dataset.size = size;
      button.setAttribute("aria-pressed", String(selectedSize === size));
      button.setAttribute("aria-label", `Size ${size}${available ? "" : ", out of stock"}`);
      button.disabled = !available;
      button.textContent = size;
      sizeOptions.appendChild(button);
    });
    sizeOptions.querySelectorAll(".size-btn:not(:disabled)").forEach((button) => {
      button.addEventListener("click", () => {
        selectedSize = button.dataset.size;
        maxStock = Math.max(0, Number(sizeStock[selectedSize] ?? currentProduct.stock) || 0);
        if (variationsMatchSizes) {
          selectedVariation = variations.find((variation) => normalizeOption(variation.name) === normalizeOption(selectedSize)) || null;
          if (selectedVariation) updateProductPrice(selectedVariation.price, selectedVariation.mrp || currentProduct.mrp);
        }
        selectedSizeName.textContent = selectedSize;
        productStock.textContent = `In stock for ${selectedSize}: ${maxStock} available`;
        sizeOptions.querySelectorAll(".size-btn").forEach((item) => {
          const isSelected = item === button;
          item.classList.toggle("active", isSelected);
          item.setAttribute("aria-pressed", String(isSelected));
        });
        qtyInput.value = 1;
        updateQtyBounds();
      });
    });
  } else {
    productSizes.hidden = true;
    selectedSize = null;
  }

  if (variations && !variationsMatchSizes) {
    productVariations.hidden = false;
    selectedVariation = variations.find(v => selectedVariation && v.name === selectedVariation.name) || variations[0];
    selectedVariantName.textContent = selectedVariation.name;
    variantOptions.replaceChildren();
    variations.forEach((variation) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `size-btn${selectedVariation.name === variation.name ? " active" : ""}`;
      button.dataset.variation = variation.name;
      button.setAttribute("aria-pressed", String(selectedVariation.name === variation.name));
      button.textContent = variation.name;
      variantOptions.appendChild(button);
    });
    variantOptions.querySelectorAll(".size-btn").forEach((button) => {
      button.addEventListener("click", () => {
        selectedVariation = variations.find(v => v.name === button.dataset.variation) || variations[0];
        renderProduct();
      });
    });
    updateProductPrice(selectedVariation.price, selectedVariation.mrp || currentProduct.mrp);
  } else {
    productVariations.hidden = true;
    if (!variationsMatchSizes) selectedVariation = null;
  }

  qtyInput.value = 1;
  updateQtyBounds();
  addToCartMessage.textContent = "";
}

function getCartVariation() {
  return variationsMatchSizes ? null : selectedVariation;
}

function addToCart() {
  if (!currentProduct) return;
  const variationForCart = getCartVariation();
  const price = selectedVariation ? Number(selectedVariation.price) : Number(currentProduct.price || 0);
  const qty = Number(qtyInput.value) || 1;

  if (qty > maxStock) {
    showToast("Only " + maxStock + " available in stock.");
    return;
  }

  const cart = readCart();
  const existing = cart.find((item) => item.name === currentProduct.name && item.variation === (variationForCart ? variationForCart.name : null) && item.size === (selectedSize || null));

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
      variation: variationForCart ? variationForCart.name : null,
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
    const variationForCart = getCartVariation();
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
      variation: variationForCart ? variationForCart.name : null,
      size: selectedSize || null,
      codEnabled: currentProduct.codEnabled !== false
    };
    localStorage.setItem("mount-parche-direct-order", JSON.stringify(directItem));
    window.location.href = "order.html?direct=1";
  });

loadProduct();
