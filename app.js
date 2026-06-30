const menuItems = [
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
  {
    name: "Farmhouse",
    category: "Veg Specials",
    type: "Veg",
    desc: "5 topping, capsicum tomato onion corn mushroom",
    price: 209,
  },
  {
    name: "Veggi paradise",
    category: "Veg Specials",
    type: "Veg",
    desc: "4 topping, capsicum corn peprika olivs",
    price: 209,
  },
  {
    name: "Peppy Paneer",
    category: "Paneer Pizzas",
    type: "Veg",
    desc: "4 topping, capsicum onion paneer makhani",
    price: 209,
  },
  {
    name: "Paneer makhani",
    category: "Paneer Pizzas",
    type: "Veg",
    desc: "4 topping, capsicum peprika paneer makhani mint",
    price: 239,
  },
  {
    name: "Delux paneer veggie",
    category: "Paneer Pizzas",
    type: "Veg",
    desc: "4 topping, capsicum tomato paneer corn mushroom",
    price: 239,
  },
  {
    name: "veg extra vaganza",
    category: "Veg Specials",
    type: "Veg",
    desc: "7 topping, capsicum onion tomato corn olives mushroom jalapino",
    price: 239,
  },
  {
    name: "Tandoori paneer pizza",
    category: "Paneer Pizzas",
    type: "Veg",
    desc: "5 topping, capsicum peprika paneer makhani mint",
    price: 239,
  },
  {
    name: "Margherita",
    category: "Classic Veg",
    type: "Veg",
    desc: "Cheese only",
    price: 99,
  },
  {
    name: "Cheese paneer",
    category: "Classic Veg",
    type: "Veg",
    desc: "Single topping, paneer",
    price: 129,
  },
  {
    name: "Corn paneer",
    category: "Classic Veg",
    type: "Veg",
    desc: "2 topping, paneer, corn",
    price: 139,
  },
  {
    name: "Capsicum paneer",
    category: "Classic Veg",
    type: "Veg",
    desc: "2 topping, paneer, capsicum",
    price: 139,
  },
  {
    name: "Double cheese",
    category: "Classic Veg",
    type: "Veg",
    desc: "Double cheese only",
    price: 179,
  },
  {
    name: "Cheese corn",
    category: "Classic Veg",
    type: "Veg",
    desc: "Double cheese with corn",
    price: 179,
  },
  {
    name: "Cheese tomato",
    category: "Classic Veg",
    type: "Veg",
    desc: "Double cheese with tomato",
    price: 179,
  },
  {
    name: "Chicken sausage",
    category: "Non Veg",
    type: "Non Veg",
    desc: "Single topping, sausage flavour",
    price: 159,
  },
  {
    name: "Barbecue Chicken",
    category: "Non Veg",
    type: "Non Veg",
    desc: "Single topping, barbecue flavour",
    price: 189,
  },
  {
    name: "Nonveg pasta pizza",
    category: "Non Veg",
    type: "Non Veg",
    desc: "5 topping, capsicum tomato pasta chicken onion jalpino",
    price: 219,
  },
  {
    name: "Chicken goldendelight",
    category: "Non Veg",
    type: "Non Veg",
    desc: "2 topping, bbq chicken corn extra cheese",
    price: 219,
  },
  {
    name: "Barbecue & Onion",
    category: "Non Veg",
    type: "Non Veg",
    desc: "2 topping, barbecue flavour with onion",
    price: 219,
  },
  {
    name: "Chicken dominator",
    category: "Non Veg",
    type: "Non Veg",
    desc: "5 topping, capsicum tomato onion BBQ sausage ex cheese",
    price: 249,
  },
  {
    name: "Chicken tikka",
    category: "Non Veg",
    type: "Non Veg",
    desc: "4 topping capsicum peprika chicken makhani mint",
    price: 249,
  },
  {
    name: "Spice Double chicken",
    category: "Non Veg",
    type: "Non Veg",
    desc: "2 topping, BBQ & sausage with extra cheese",
    price: 249,
  },
  {
    name: "Tomato",
    category: "Burgers & More",
    type: "Veg",
    desc: "Quick bite",
    price: 69,
  },
  {
    name: "Onion",
    category: "Burgers & More",
    type: "Veg",
    desc: "Quick bite",
    price: 69,
  },
  {
    name: "Capsicum",
    category: "Burgers & More",
    type: "Veg",
    desc: "Quick bite",
    price: 69,
  },
  {
    name: "Golden corn",
    category: "Burgers & More",
    type: "Veg",
    desc: "Quick bite",
    price: 69,
  },
  {
    name: "Paneer onion",
    category: "Burgers & More",
    type: "Veg",
    desc: "Quick bite",
    price: 79,
  },
  {
    name: "Loaded veg",
    category: "Burgers & More",
    type: "Veg",
    desc: "Quick bite",
    price: 79,
  },
  {
    name: "Sausage",
    category: "Burgers & More",
    type: "Non Veg",
    desc: "Quick bite",
    price: 109,
  },
  {
    name: "Loaded chicken",
    category: "Burgers & More",
    type: "Non Veg",
    desc: "Quick bite",
    price: 129,
  },
  {
    name: "Cheese Nonveg",
    category: "Burgers & More",
    type: "Non Veg",
    desc: "Quick bite",
    price: 139,
  },
];

const INVENTORY_STORAGE_KEY = "r-pizza-inventory";
const INVENTORY_API_URL = "/api/inventory";

function initializeInventoryFromDefaults() {
  // Only used as an absolute fallback when both the API and localStorage are empty.
  const items = menuItems.map(item => ({
    ...item,
    stock: 50,
    available: true
  }));
  localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
}
// Do NOT call initializeInventoryFromDefaults here; bootMenu handles it.

function readInventory() {
  try {
    return JSON.parse(localStorage.getItem(INVENTORY_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveInventory(inventory) {
  localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
}

async function syncInventoryFromApi() {
  const res = await fetch(`${INVENTORY_API_URL}?t=${Date.now()}`, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || data?.message || `Inventory sync failed (${res.status})`);
  }
  const inventory = await res.json();
  if (!Array.isArray(inventory)) throw new Error("Invalid inventory payload");
  saveInventory(inventory);
  return inventory;
}

const menuGrid = document.querySelector("#menu-grid");
const tabs = document.querySelector("#category-tabs");
const searchInput = document.querySelector("#menu-search");
const cartLines = document.querySelector("#cart-lines");
const cartCount = document.querySelector("#cart-count");
const cartTotal = document.querySelector("#cart-total");
const floatingCartButton = document.querySelector("#floating-cart");
const floatingCartCount = document.querySelector("#floating-cart-count");
const toast = document.querySelector("#toast");
const CART_STORAGE_KEY = "r-pizza-cart";
const cart = new Map();

let activeCategory = "All";

function formatRupees(value) {
  return `₹${value}`;
}

function safeId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function readStoredCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart() {
  const items = [...cart.entries()].map(([cartKey, { item, qty, variation }]) => ({
    cartKey,
    category: item.category,
    desc: item.desc,
    name: item.name,
    price: variation && item.variations ? (item.variations.find(v => v.name === variation) || {}).price || item.price : item.price,
    qty,
    type: item.type,
    variation: variation || null,
  }));
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

function restoreCart() {
  const inventory = readInventory();
  readStoredCart().forEach((entry) => {
    const item = inventory.find((menuItem) => menuItem.name === entry.name) || entry;
    const qty = Number(entry.qty) || 0;
    if (item.name && qty > 0 && item.available && item.stock > 0) {
      const finalQty = Math.min(qty, item.stock);
      const cartKey = entry.cartKey || (entry.variation ? `${entry.name}||${entry.variation}` : entry.name);
      cart.set(cartKey, { item, qty: finalQty, variation: entry.variation || null });
    }
  });
  saveCart();
}

function getCategories() {
  const inventory = readInventory();
  return ["All", ...new Set(inventory.map((item) => item.category))];
}

function renderTabs() {
  const categories = getCategories();
  tabs.innerHTML = categories
    .map(
      (category) => `
        <button
          class="category-tab${category === activeCategory ? " active" : ""}"
          type="button"
          role="tab"
          aria-selected="${category === activeCategory}"
          data-category="${category}"
        >
          ${category}
        </button>
      `
    )
    .join("");
}

function currentItems() {
  const inventory = readInventory();
  const searchTerm = searchInput.value.trim().toLowerCase();
  return inventory.filter((item) => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = [item.name, item.desc, item.category, item.type]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm);
    return matchesCategory && matchesSearch;
  });
}

function renderMenu() {
  const items = currentItems();

  if (!items.length) {
    menuGrid.innerHTML = `<p class="empty-cart">No menu items found.</p>`;
    return;
  }

  menuGrid.innerHTML = items
    .map(
      (item) => {
        const isOutOfStock = item.stock <= 0 || item.available === false;
        const hasVariations = item.variations && item.variations.length > 0;
        const hasImage = item.image && item.image.length > 0;
        
        let priceDisplay = '';
        let actionControl = '';

        if (isOutOfStock) {
          priceDisplay = `<span class="item-price">${formatRupees(item.price)}</span>`;
          actionControl = `<span class="status-badge status-cancelled out-of-stock-badge" style="font-size: 0.72rem; padding: 2px 8px; font-weight:900;">Out of Stock</span>`;
        } else if (hasVariations) {
          priceDisplay = `<select class="var-select" data-item-name="${item.name}" style="background: var(--paper); border: 1px solid var(--line); border-radius: 4px; font-weight: 800; font-size: 0.82rem; padding: 4px 6px; color: var(--ink); max-width: 100%; text-overflow: ellipsis; flex-shrink: 1;">
            ${item.variations.map(v => `<option value="${v.name}" data-price="${v.price}">${v.name} · ${formatRupees(v.price)}</option>`).join('')}
          </select>`;
          actionControl = `<button class="add-button" type="button" data-add-var-item="${item.name}" aria-label="Add ${item.name}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z" /></svg>
            </button>`;
        } else {
          priceDisplay = `<span class="item-price">${formatRupees(item.price)}</span>`;
          actionControl = `<button class="add-button" type="button" data-add-item="${item.name}" aria-label="Add ${item.name}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z" /></svg>
            </button>`;
        }

        const imageHTML = hasImage
          ? `<div style="width:100%; aspect-ratio: 4/3; border-radius:var(--radius) var(--radius) 0 0; overflow:hidden; background:#f9f9fa; display:flex; align-items:center; justify-content:center; border-bottom: 1px solid var(--line);"><img src="${item.image}" alt="${item.name}" style="width:100%; height:100%; object-fit:contain; object-position:center;" loading="lazy"></div>`
          : '';

        return `
          <article class="menu-card reveal is-visible" data-menu-id="${safeId(item.name)}" style="${hasImage ? 'padding:0;' : ''}">
            ${imageHTML}
            <div style="padding:${hasImage ? '12px 16px 16px' : '0'};">
              <div class="item-top" style="flex-wrap: wrap;">
                <h3 class="item-name" style="word-break: break-word;">${item.name}</h3>
                ${priceDisplay}
              </div>
              <p class="item-desc">${item.desc}</p>
              <div class="item-meta" data-action-container-for="${item.name}">
                <span class="item-tag">${item.type}</span>
                ${actionControl}
              </div>
            </div>
          </article>
        `;
      }
    )
    .join("");
  syncMenuButtons();
}

function addItem(name, variationName) {
  const inventory = readInventory();
  const item = inventory.find((entry) => entry.name === name);
  if (!item) return;

  const cartKey = variationName ? `${name}||${variationName}` : name;
  const existing = cart.get(cartKey) || { item, qty: 0, variation: variationName || null };
  
  if (existing.qty >= item.stock) {
    showToast(`Sorry, only ${item.stock} available in stock.`);
    return;
  }

  existing.qty += 1;
  cart.set(cartKey, existing);
  renderCart();
  syncMenuButtons();
  showToast(`${variationName ? variationName + ' ' : ''}${item.name} added`);
}

function changeQty(cartKey, delta) {
  const line = cart.get(cartKey);
  if (!line) return;
  
  if (delta > 0) {
    const inventory = readInventory();
    const item = inventory.find((entry) => entry.name === line.item.name);
    if (item && line.qty >= item.stock) {
      showToast(`Sorry, only ${item.stock} available in stock.`);
      return;
    }
  }

  line.qty += delta;
  if (line.qty <= 0) {
    cart.delete(cartKey);
  } else {
    cart.set(cartKey, line);
  }
  renderCart();
  syncMenuButtons();
}

function getItemPrice(line) {
  const { item, variation } = line;
  if (variation && item.variations) {
    const v = item.variations.find(x => x.name === variation);
    if (v) return v.price;
  }
  return item.price;
}

function cartStats() {
  let total = 0;
  let count = 0;
  cart.forEach((line) => {
    total += getItemPrice(line) * line.qty;
    count += line.qty;
  });
  return { total, count };
}

function renderCart() {
  const { total, count } = cartStats();
  saveCart();
  cartCount.textContent = `${count} ${count === 1 ? "item" : "items"}`;
  cartTotal.textContent = formatRupees(total);

  if (floatingCartButton && floatingCartCount) {
    floatingCartCount.textContent = String(count);
    floatingCartButton.hidden = count === 0;
  }

  if (!count) {
    cartLines.innerHTML = `<p class="empty-cart">No items selected yet.</p>`;
    return;
  }

  cartLines.innerHTML = [...cart.entries()]
    .map(
      ([cartKey, line]) => {
        const price = getItemPrice(line);
        const title = line.variation ? `${line.item.name} (${line.variation})` : line.item.name;
        return `
      <div class="cart-line">
        <span>${title}<br><small>${formatRupees(price)} x ${line.qty}</small></span>
        <div class="qty-controls" aria-label="${title} quantity controls">
          <button type="button" data-qty-item="${cartKey}" data-qty-delta="-1" aria-label="Remove one">-</button>
          <strong>${line.qty}</strong>
          <button type="button" data-qty-item="${cartKey}" data-qty-delta="1" aria-label="Add one">+</button>
        </div>
      </div>
    `;
      }
    )
    .join("");
}

function reconcileCartWithInventory(inventory) {
  let changed = false;
  cart.forEach((line, cartKey) => {
    const inv = inventory.find((x) => x.name === line.item.name);
    if (!inv || !inv.available || inv.stock <= 0) {
      cart.delete(cartKey);
      changed = true;
      return;
    }
    if (line.qty > inv.stock) {
      cart.set(cartKey, { ...line, item: inv, qty: inv.stock });
      changed = true;
      return;
    }
    cart.set(cartKey, { ...line, item: inv });
  });
  return changed;
}

function syncMenuButtons() {
  const inventory = readInventory();
  document.querySelectorAll('.item-meta[data-action-container-for]').forEach(meta => {
    const itemName = meta.dataset.actionContainerFor;
    const item = inventory.find(i => i.name === itemName);
    if (!item || item.stock <= 0 || item.available === false) return;

    let cartKey = itemName;
    if (item.variations && item.variations.length > 0) {
      const card = meta.closest('.menu-card');
      const select = card ? card.querySelector('.var-select') : null;
      if (select) {
        cartKey = `${itemName}||${select.value}`;
      }
    }

    const cartLine = cart.get(cartKey);
    let newActionHTML = '';
    
    if (cartLine && cartLine.qty > 0) {
      newActionHTML = `
        <div class="qty-controls" aria-label="${cartKey} quantity controls">
          <button type="button" data-qty-item="${cartKey}" data-qty-delta="-1" aria-label="Remove one">-</button>
          <strong>${cartLine.qty}</strong>
          <button type="button" data-qty-item="${cartKey}" data-qty-delta="1" aria-label="Add one">+</button>
        </div>
      `;
    } else {
      if (item.variations && item.variations.length > 0) {
        newActionHTML = `
          <button class="add-button" type="button" data-add-var-item="${itemName}" aria-label="Add ${itemName}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z" /></svg>
          </button>
        `;
      } else {
        newActionHTML = `
          <button class="add-button" type="button" data-add-item="${itemName}" aria-label="Add ${itemName}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z" /></svg>
          </button>
        `;
      }
    }

    if (meta.lastElementChild && !meta.lastElementChild.classList.contains('item-tag')) {
       meta.lastElementChild.remove();
       meta.insertAdjacentHTML('beforeend', newActionHTML);
    }
  });
}

function orderText() {
  const { total, count } = cartStats();
  if (!count) return "No items selected.";
  const lines = [...cart.values()].map((line) => {
    const price = getItemPrice(line);
    const label = line.variation ? `${line.item.name} (${line.variation})` : line.item.name;
    return `${line.qty} x ${label} - ${formatRupees(price * line.qty)}`;
  });
  return `R Pizza and More order\n${lines.join("\n")}\nTotal: ${formatRupees(total)}`;
}

async function copyOrder() {
  const text = orderText();
  try {
    await navigator.clipboard.writeText(text);
    showToast("Order copied");
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    showToast("Order copied");
  }
}

async function bootMenu() {
  // Load latest inventory from the API (single source of truth).
  try {
    await syncInventoryFromApi();
  } catch (e) {
    console.warn("Inventory sync skipped:", e);
    // If API failed AND localStorage is empty, seed with hardcoded defaults.
    if (!localStorage.getItem(INVENTORY_STORAGE_KEY) || readInventory().length === 0) {
      initializeInventoryFromDefaults();
    }
  }

  restoreCart();
  renderTabs();
  renderMenu();
  renderCart();
  syncMenuButtons();

  tabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    renderTabs();
    renderMenu();
  });

  searchInput.addEventListener("input", renderMenu);

  document.addEventListener("change", (event) => {
    if (event.target.classList.contains("var-select")) {
      syncMenuButtons();
    }
  });

  document.addEventListener("click", (event) => {
    const addButton = event.target.closest("[data-add-item]");
    if (addButton) {
      addItem(addButton.dataset.addItem);
      return;
    }

    const addVarBtn = event.target.closest("[data-add-var-item]");
    if (addVarBtn) {
      const card = addVarBtn.closest('.menu-card');
      const select = card ? card.querySelector('.var-select') : null;
      if (select) {
        addItem(addVarBtn.dataset.addVarItem, select.value);
      }
      return;
    }

    const qtyButton = event.target.closest("[data-qty-item]");
    if (qtyButton) {
      changeQty(qtyButton.dataset.qtyItem, Number(qtyButton.dataset.qtyDelta));
    }
  });

  document.querySelector("#copy-order").addEventListener("click", copyOrder);
  document.querySelector("#clear-cart").addEventListener("click", () => {
    cart.clear();
    renderCart();
    syncMenuButtons();
    showToast("Order cleared");
  });

  if (floatingCartButton) {
    floatingCartButton.addEventListener("click", () => {
      const panel = document.querySelector("#cart-panel");
      if (panel) panel.scrollIntoView({ behavior: "smooth", block: "center" });
      else window.location.href = "order.html";
    });
  }

  // Periodically sync inventory from backend (cross-user updates).
  // NOTE: Disabled inventory polling to load once or on manual refresh to save resources.
  /*
  window.setInterval(async () => {
    try {
      const inventory = await syncInventoryFromApi();
      const cartChanged = reconcileCartWithInventory(inventory);
      if (cartChanged) showToast("Cart updated due to stock changes.");
      renderTabs();
      renderMenu();
      renderCart();
    } catch {
      // Keep the UI usable with cached inventory.
    }
  }, 5000);
  */

  // Dynamic cross-tab stock sync
  window.addEventListener("storage", (event) => {
    if (event.key === INVENTORY_STORAGE_KEY || event.key === null) {
      renderTabs();
      renderMenu();
      
      let cartChanged = false;
      const inventory = readInventory();
      cart.forEach((line, cartKey) => {
        const item = inventory.find((entry) => entry.name === line.item.name);
        if (!item || !item.available || item.stock <= 0) {
          cart.delete(cartKey);
          cartChanged = true;
        } else if (line.qty > item.stock) {
          line.qty = item.stock;
          cart.set(cartKey, line);
          cartChanged = true;
        }
      });
      if (cartChanged) {
        renderCart();
        showToast("Cart updated due to stock changes.");
      }
    }
  });
}

function bootScrollAnimations() {
  const progress = document.querySelector(".scroll-progress");
  const reveals = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  reveals.forEach((element) => observer.observe(element));

  function updateProgress() {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = height > 0 ? (window.scrollY / height) * 100 : 0;
    progress.style.width = `${Math.min(100, scrolled)}%`;
  }

  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
}

function bootCanvasFallback(canvas) {
  const ctx = canvas.getContext("2d");
  const state = { frame: 0, pointerX: 0, pointerY: 0, mode: "canvas-fallback" };
  window.__pizzaSceneStatus = state;
  canvas.dataset.sceneMode = state.mode;

  function markFallbackPixels() {
    try {
      const data = ctx.getImageData(0, 0, Math.min(canvas.width, 120), Math.min(canvas.height, 80)).data;
      let colorful = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 8 && Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]) > 18) {
          colorful += 1;
        }
      }
      canvas.dataset.pixelCheck = String(colorful);
    } catch (error) {
      canvas.dataset.pixelCheck = `error:${String(error).slice(0, 48)}`;
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function drawPizza(cx, cy, radius, tilt, spin) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spin);
    ctx.scale(1, tilt);

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#b96125";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.88, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd36b";
    ctx.fill();

    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(255, 247, 234, 0.75)";
    for (let i = 0; i < 8; i += 1) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos((i * Math.PI) / 4) * radius * 0.82, Math.sin((i * Math.PI) / 4) * radius * 0.82);
      ctx.stroke();
    }

    const toppings = [
      [-0.4, -0.28, "#d92d20"],
      [0.2, -0.44, "#12805c"],
      [0.5, 0.12, "#d92d20"],
      [-0.18, 0.42, "#764021"],
      [-0.62, 0.2, "#12805c"],
      [0.03, 0.04, "#d92d20"],
      [0.42, -0.22, "#764021"],
      [-0.12, -0.62, "#12805c"],
      [0.72, 0.34, "#d92d20"],
      [-0.7, -0.38, "#764021"],
    ];

    toppings.forEach(([x, y, color], index) => {
      ctx.save();
      ctx.translate(x * radius, y * radius);
      ctx.rotate(index * 0.8);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 0.07, radius * 0.045, 0, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  }

  function render(time) {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    const cx = rect.width * 0.5 + state.pointerX * 24;
    const cy = rect.height * (window.innerWidth < 760 ? 0.2 : 0.5) + state.pointerY * 16;
    const radius = Math.max(150, Math.min(rect.width, rect.height) * 0.32);
    const spin = time * 0.00035;

    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 5; i += 1) {
      drawPizza(cx - i * 38, cy + i * 18, radius * (1 - i * 0.07), 0.42, spin + i * 0.2);
    }
    ctx.globalAlpha = 1;
    drawPizza(cx, cy, radius, 0.48, spin);

    state.frame += 1;
    canvas.dataset.sceneFrame = String(state.frame);
    if (state.frame >= 6 && !canvas.dataset.pixelCheckPending && !canvas.dataset.pixelCheck) {
      canvas.dataset.pixelCheckPending = "true";
      markFallbackPixels();
    }
    requestAnimationFrame(render);
  }

  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    state.pointerX = (event.clientX - rect.left) / rect.width - 0.5;
    state.pointerY = (event.clientY - rect.top) / rect.height - 0.5;
  });

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(render);
}

function buildThreePizza(THREE, canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  const group = new THREE.Group();
  const state = { frame: 0, pointerX: 0, pointerY: 0, mode: "three-js" };
  window.__pizzaSceneStatus = state;
  canvas.dataset.sceneMode = state.mode;

  camera.position.set(0, 5.1, 7.4);
  camera.lookAt(0, 0, 0);
  scene.add(group);

  const cheese = new THREE.MeshStandardMaterial({ color: 0xffd36b, roughness: 0.58, metalness: 0.02, emissive: 0x3a2400 });
  const crust = new THREE.MeshStandardMaterial({ color: 0xb96125, roughness: 0.88 });
  const sauce = new THREE.MeshStandardMaterial({ color: 0xd92d20, roughness: 0.64 });
  const basil = new THREE.MeshStandardMaterial({ color: 0x12805c, roughness: 0.7 });
  const olive = new THREE.MeshStandardMaterial({ color: 0x2a201b, roughness: 0.82 });
  const paneer = new THREE.MeshStandardMaterial({ color: 0xfff1c1, roughness: 0.78 });
  const corn = new THREE.MeshStandardMaterial({ color: 0xffe15c, roughness: 0.64 });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.2, 0.26, 96), cheese);
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const edge = new THREE.Mesh(new THREE.TorusGeometry(2.08, 0.18, 18, 128), crust);
  edge.rotation.x = Math.PI / 2;
  edge.position.y = 0.08;
  group.add(edge);

  const sauceSpiral = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.028, 8, 90), sauce);
  sauceSpiral.rotation.x = Math.PI / 2;
  sauceSpiral.position.y = 0.155;
  sauceSpiral.scale.z = 0.55;
  group.add(sauceSpiral);

  const toppingData = [
    [-0.9, -0.55, sauce, 0.22],
    [0.15, -0.88, basil, 0.16],
    [0.9, -0.48, paneer, 0.2],
    [0.68, 0.34, sauce, 0.2],
    [-0.45, 0.72, olive, 0.13],
    [-1.15, 0.25, basil, 0.16],
    [0.2, 0.24, sauce, 0.18],
    [1.18, 0.74, olive, 0.13],
    [-0.22, -0.12, paneer, 0.16],
    [-0.58, -1.02, sauce, 0.18],
    [1.18, -0.08, basil, 0.15],
    [-1.35, -0.62, paneer, 0.15],
    [0.46, 1.05, corn, 0.13],
    [-0.9, 0.96, corn, 0.12],
    [0.02, -1.32, corn, 0.11],
  ];

  toppingData.forEach(([x, z, material, radius], index) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.94, 0.045, 28), material);
    mesh.position.set(x, 0.18 + index * 0.001, z);
    mesh.rotation.y = index * 0.45;
    group.add(mesh);
  });

  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2;
    const string = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.025, 1.74),
      new THREE.MeshStandardMaterial({ color: 0xfff0b2, roughness: 0.6 })
    );
    string.position.y = 0.19;
    string.rotation.y = angle;
    group.add(string);
  }

  const glow = new THREE.PointLight(0xffd36b, 3.2, 10);
  glow.position.set(-3.6, 4.2, 4.5);
  scene.add(glow);
  scene.add(new THREE.HemisphereLight(0xfff4d2, 0x4d1b12, 2.1));

  async function markThreePixels() {
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const probe = document.createElement("canvas");
      probe.width = 120;
      probe.height = 80;
      const ctx = probe.getContext("2d");
      ctx.drawImage(img, 0, 0, probe.width, probe.height);
      const data = ctx.getImageData(0, 0, probe.width, probe.height).data;
      let colorful = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 8 && Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]) > 18) {
          colorful += 1;
        }
      }
      canvas.dataset.pixelCheck = String(colorful);
    } catch (error) {
      canvas.dataset.pixelCheck = `error:${String(error).slice(0, 48)}`;
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function render(time) {
    const rect = canvas.getBoundingClientRect();
    const mobile = window.innerWidth < 760;
    group.position.x = 0;
    group.position.y = mobile ? 0.22 : -0.06;
    group.rotation.x = -0.36 + state.pointerY * 0.18;
    group.rotation.y = time * 0.00038 + state.pointerX * 0.26;
    group.rotation.z = Math.sin(time * 0.001) * 0.035;
    group.scale.setScalar(mobile ? 0.8 : 1.15);
    camera.position.z = 7.4;
    renderer.setViewport(0, 0, rect.width, rect.height);
    renderer.render(scene, camera);
    state.frame += 1;
    canvas.dataset.sceneFrame = String(state.frame);
    if (state.frame >= 6 && !canvas.dataset.pixelCheckPending && !canvas.dataset.pixelCheck) {
      canvas.dataset.pixelCheckPending = "true";
      markThreePixels();
    }
    requestAnimationFrame(render);
  }

  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    state.pointerX = (event.clientX - rect.left) / rect.width - 0.5;
    state.pointerY = (event.clientY - rect.top) / rect.height - 0.5;
  });

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(render);
}

async function bootPizzaScene() {
  const canvas = document.querySelector("#pizza-scene");
  if (!canvas) return;

  try {
    const THREE = await import("https://unpkg.com/three@0.165.0/build/three.module.js");
    buildThreePizza(THREE, canvas);
  } catch (error) {
    window.__pizzaSceneImportError = String(error);
    bootCanvasFallback(canvas);
  }
}

void bootMenu();
bootScrollAnimations();
bootPizzaScene();
