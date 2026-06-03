const CART_STORAGE_KEY = "r-pizza-cart";
const LAST_ORDER_KEY = "r-pizza-last-order";
const RESTAURANT_WHATSAPP = "916301045696";
const ORDERS_API_URL = "/api/orders";
const INVENTORY_API_URL = "/api/inventory";

const checkoutItems = document.querySelector("#checkout-items");
const summaryCount = document.querySelector("#summary-count");
const summaryTotal = document.querySelector("#summary-total");
const orderForm = document.querySelector("#order-form");
const toast = document.querySelector("#toast");
const locationStatus = document.querySelector("#location-status");
const selectedMap = document.querySelector("#selected-map");
const confirmationBox = document.querySelector("#confirmation-box");
const orderNumber = document.querySelector("#order-number");
const receiptPreview = document.querySelector("#receipt-preview");
const sendWhatsapp = document.querySelector("#send-whatsapp");

let cart = readCart();

function formatRupees(value) {
  return `₹${value}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

async function syncInventoryFromApi() {
  const res = await fetch(`${INVENTORY_API_URL}?t=${Date.now()}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Inventory sync failed (${res.status})`);
  const inventory = await res.json();
  if (!Array.isArray(inventory)) throw new Error("Invalid inventory payload");
  localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
  return inventory;
}

async function placeOrderOnApi(payload) {
  const res = await fetch(ORDERS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || data?.message || "Failed to place order");
  return data;
}

async function patchOrderStatusOnApi({ id, status }) {
  const res = await fetch(ORDERS_API_URL, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ id, status }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || data?.message || "Failed to update order");
  return data;
}

function readCart() {
  try {
    const items = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
    return items
      .map((item) => ({
        category: item.category || "Menu",
        desc: item.desc || "",
        name: item.name,
        price: Number(item.price) || 0,
        qty: Number(item.qty) || 0,
        type: item.type || "Item",
      }))
      .filter((item) => item.name && item.qty > 0);
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function cartStats() {
  return cart.reduce(
    (stats, item) => ({
      count: stats.count + item.qty,
      total: stats.total + item.price * item.qty,
    }),
    { count: 0, total: 0 }
  );
}

function renderCart() {
  const { count, total } = cartStats();
  summaryCount.textContent = `${count} ${count === 1 ? "item" : "items"}`;
  summaryTotal.textContent = formatRupees(total);

  if (!count) {
    checkoutItems.innerHTML = `<p class="empty-cart">No items selected yet.</p>`;
    return;
  }

  checkoutItems.innerHTML = cart
    .map(
      (item) => `
        <div class="checkout-item">
          <div class="summary-item-info">
            <strong>${item.name}</strong>
            <span>${formatRupees(item.price)} x ${item.qty}</span>
          </div>
          <div class="qty-controls" aria-label="${item.name} quantity controls">
            <button type="button" data-summary-item="${item.name}" data-summary-delta="-1" aria-label="Remove one ${item.name}">-</button>
            <strong>${item.qty}</strong>
            <button type="button" data-summary-item="${item.name}" data-summary-delta="1" aria-label="Add one ${item.name}">+</button>
          </div>
        </div>
      `
    )
    .join("");
}

function changeQty(name, delta) {
  cart = cart
    .map((item) => (item.name === name ? { ...item, qty: item.qty + delta } : item))
    .filter((item) => item.qty > 0);
  saveCart();
  renderCart();
}

function customerDetails() {
  const formData = new FormData(orderForm);
  
  const house = String(formData.get("addrHouse") || "").trim();
  const area = String(formData.get("addrArea") || "").trim();
  const landmark = String(formData.get("addrLandmark") || "").trim();
  const city = String(formData.get("addrCity") || "").trim();
  const state = String(formData.get("addrState") || "").trim();
  const pincode = String(formData.get("addrPincode") || "").trim();
  
  let fullAddress = "";
  if (house) {
    fullAddress = `${house}, ${area}`;
    if (landmark) fullAddress += `, Landmark: ${landmark}`;
    fullAddress += `, ${city}, ${state} - ${pincode}`;
  } else {
    // Fallback if they somehow bypassed it
    fullAddress = String(formData.get("customerAddress") || "").trim();
  }

  return {
    address: fullAddress,
    latitude: String(formData.get("latitude") || "").trim(),
    longitude: String(formData.get("longitude") || "").trim(),
    mapLink: String(formData.get("mapLink") || "").trim(),
    name: String(formData.get("customerName") || "").trim(),
    notes: String(formData.get("orderNotes") || "").trim(),
    payment: String(formData.get("paymentMode") || "").trim(),
    phone: String(formData.get("customerPhone") || "").trim(),
    service: String(formData.get("serviceType") || "").trim(),
    time: String(formData.get("orderTime") || "").trim(),
  };
}

function orderMessage(details, id) {
  const { count, total } = cartStats();
  const itemLines = cart.map((item) => `${item.qty} x ${item.name} - ${formatRupees(item.price * item.qty)}`);
  const locationLines = [
    details.address ? `Address: ${details.address}` : "",
    details.mapLink ? `Map: ${details.mapLink}` : "",
    details.latitude && details.longitude ? `GPS: ${details.latitude}, ${details.longitude}` : "",
  ].filter(Boolean);

  return [
    `R Pizza and More order ${id}`,
    `Name: ${details.name}`,
    `Phone: ${details.phone}`,
    `Service: ${details.service}`,
    `Time: ${details.time}`,
    `Payment: ${details.payment}`,
    "",
    "Items:",
    ...itemLines,
    `Total: ${formatRupees(total)} (${count} ${count === 1 ? "item" : "items"})`,
    locationLines.length ? "" : "",
    ...locationLines,
    details.notes ? "" : "",
    details.notes ? `Notes: ${details.notes}` : "",
  ]
    .filter((line, index, lines) => line || lines[index - 1])
    .join("\n");
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    showToast(successMessage);
  }
}

let leafletMap = null;
let leafletMarker = null;

function updateMapPreview(lat, lng) {
  const mapContainer = document.getElementById("interactive-map");
  mapContainer.classList.add("is-visible");
  mapContainer.removeAttribute("aria-hidden");
  
  if (!leafletMap) {
    leafletMap = L.map('interactive-map').setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(leafletMap);
    
    leafletMarker = L.marker([lat, lng], { draggable: true }).addTo(leafletMap);
    
    leafletMarker.on('dragend', function() {
      const position = leafletMarker.getLatLng();
      setMapCoordinates(position.lat, position.lng);
    });

    leafletMap.on('click', function(e) {
      leafletMarker.setLatLng(e.latlng);
      setMapCoordinates(e.latlng.lat, e.latlng.lng);
    });
    
    setTimeout(() => leafletMap.invalidateSize(), 200);
  } else {
    leafletMap.setView([lat, lng], 15);
    leafletMarker.setLatLng([lat, lng]);
  }
}

function setMapCoordinates(lat, lng) {
  const flat = parseFloat(lat).toFixed(6);
  const flng = parseFloat(lng).toFixed(6);
  document.querySelector("#latitude").value = flat;
  document.querySelector("#longitude").value = flng;
  document.querySelector("#map-link").value = `https://www.google.com/maps?q=${flat},${flng}`;
  locationStatus.textContent = `Selected: ${flat}, ${flng} (You can drag the pin)`;
}

function selectCurrentLocation() {
  if (!navigator.geolocation) {
    showToast("Location is not available in this browser");
    return;
  }

  locationStatus.textContent = "Finding location...";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude.toFixed(6);
      const lng = position.coords.longitude.toFixed(6);
      document.querySelector("#latitude").value = lat;
      document.querySelector("#longitude").value = lng;
      document.querySelector("#map-link").value = `https://www.google.com/maps?q=${lat},${lng}`;
      locationStatus.textContent = `Selected: ${lat}, ${lng} (You can drag the pin)`;
      updateMapPreview(lat, lng);
      showToast("Location selected");
    },
    () => {
      locationStatus.textContent = "No map location selected.";
      showToast("Location permission was not granted");
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
  );
}

const ALL_ORDERS_KEY = "r-pizza-all-orders";

function readAllOrders() {
  try {
    return JSON.parse(localStorage.getItem(ALL_ORDERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveAllOrders(orders) {
  localStorage.setItem(ALL_ORDERS_KEY, JSON.stringify(orders));
}

async function syncOrdersFromApi() {
  const res = await fetch(`${ORDERS_API_URL}?t=${Date.now()}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Orders sync failed (${res.status})`);
  const apiOrders = await res.json();
  if (!Array.isArray(apiOrders)) return;

  // Only keep orders that belong to this customer (match by IDs we have locally)
  const localOrders = readAllOrders();
  const localIds = new Set(localOrders.map(o => o.id));
  
  // Update local orders with server status, keep local-only orders as-is
  const merged = localOrders.map(localOrder => {
    const serverOrder = apiOrders.find(o => o.id === localOrder.id);
    return serverOrder || localOrder;
  });
  
  saveAllOrders(merged);
  return merged;
}



const INVENTORY_STORAGE_KEY = "r-pizza-inventory";

function validateStockAvailability() {
  try {
    const inventory = JSON.parse(localStorage.getItem(INVENTORY_STORAGE_KEY)) || [];
    for (const cartItem of cart) {
      const invItem = inventory.find((item) => item.name === cartItem.name);
      if (!invItem || !invItem.available || invItem.stock < cartItem.qty) {
        return {
          available: false,
          message: invItem
            ? `Sorry, only ${invItem.stock} of ${cartItem.name} are available in stock.`
            : `Sorry, ${cartItem.name} is no longer available.`
        };
      }
    }
  } catch {
    // ignore
  }
  return { available: true };
}

function deductInventoryStock(cartItems) {
  try {
    const inventory = JSON.parse(localStorage.getItem(INVENTORY_STORAGE_KEY)) || [];
    let updated = false;

    cartItems.forEach((cartItem) => {
      const invItem = inventory.find((item) => item.name === cartItem.name);
      if (invItem) {
        invItem.stock = Math.max(0, invItem.stock - cartItem.qty);
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
      // Notify other tabs immediately
      window.dispatchEvent(new Event("storage"));
    }
  } catch (e) {
    console.error("Inventory deduction failed:", e);
  }
}

async function handleCancelOrder(orderId) {
  if (!confirm("Are you sure you want to cancel this order?")) return;
  const orders = readAllOrders();
  const order = orders.find((o) => o.id === orderId);
  if (order && order.status === "Pending") {
    try {
      const data = await patchOrderStatusOnApi({ id: orderId, status: "Cancelled" });
      const updatedOrder = data?.order;
      const inventory = data?.inventory;

      if (Array.isArray(inventory)) {
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
      }

      const idx = orders.findIndex((o) => o.id === orderId);
      if (idx >= 0 && updatedOrder) orders[idx] = updatedOrder;
      else if (updatedOrder) orders.push(updatedOrder);

      saveAllOrders(orders);
      renderOrderHistory();
      showToast("Order cancelled successfully");
    } catch (e) {
      showToast(String(e?.message || e || "Cancel failed"));
    }
  }
}

async function submitOrder(event) {
  event.preventDefault();
  const { count, total } = cartStats();
  if (!count) {
    showToast("Add at least one item first");
    return;
  }

  if (!orderForm.reportValidity()) return;

  // Validate stock before placing order (try to refresh inventory from server).
  try {
    await syncInventoryFromApi();
  } catch {
    // fall back to locally cached inventory
  }

  const validation = validateStockAvailability();
  if (!validation.available) {
    showToast(validation.message);
    return;
  }

  const details = customerDetails();
  
  // Save profile for future orders
  const formData = new FormData(orderForm);
  const profile = {
    customerName: formData.get("customerName") || "",
    customerPhone: formData.get("customerPhone") || "",
    addrPincode: formData.get("addrPincode") || "",
    addrState: formData.get("addrState") || "",
    addrCity: formData.get("addrCity") || "",
    addrHouse: formData.get("addrHouse") || "",
    addrArea: formData.get("addrArea") || "",
    addrLandmark: formData.get("addrLandmark") || "",
  };
  localStorage.setItem("r-pizza-saved-profile", JSON.stringify(profile));

  const id = `RPZ-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-5)}`;
  const message = orderMessage(details, id);

  let placed;
  try {
    placed = await placeOrderOnApi({ id, details, cart, total });
  } catch (e) {
    showToast(String(e?.message || e || "Order placement failed"));
    return;
  }

  const serverOrder = placed?.order;
  const serverInventory = placed?.inventory;

  if (serverInventory && Array.isArray(serverInventory)) {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(serverInventory));
  }

  const orders = readAllOrders();
  if (serverOrder?.id) {
    const idx = orders.findIndex((o) => o.id === serverOrder.id);
    if (idx >= 0) orders[idx] = serverOrder;
    else orders.push(serverOrder);
    saveAllOrders(orders);
    localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(serverOrder));

    orderNumber.textContent = serverOrder.id;
    receiptPreview.textContent = `${details.name}, ${count} ${count === 1 ? "item" : "items"} · ${formatRupees(serverOrder.total ?? total)} · ${details.service}`;
  } else {
    // Should not happen; UI still tries to show a receipt.
    localStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ id, details, total }));
    receiptPreview.textContent = `${details.name}, ${count} ${count === 1 ? "item" : "items"} · ${formatRupees(total)} · ${details.service}`;
    orderNumber.textContent = id;
    orders.push({ id, details, total, status: "Pending" });
    saveAllOrders(orders);
  }


  confirmationBox.hidden = false;
  
  const overlay = document.getElementById("order-success-overlay");
  if (overlay) {
    document.getElementById("success-order-id").textContent = `Order #${serverOrder?.id || id}`;

    
    overlay.hidden = false;
    
    setTimeout(() => {
      overlay.hidden = true;
      confirmationBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 3000);
  } else {
    showToast("Order receipt created");
    confirmationBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }


}

function bootScrollAnimations() {
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
    { threshold: 0.02 }
  );

  reveals.forEach((element) => observer.observe(element));

  // Fallback to guarantee visibility of forms on load
  setTimeout(() => {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }, 100);
}

function bootOrderPage() {
  renderCart();
  bootScrollAnimations();

  checkoutItems.addEventListener("click", (event) => {
    const button = event.target.closest("[data-summary-item]");
    if (!button) return;
    changeQty(button.dataset.summaryItem, Number(button.dataset.summaryDelta));
  });

  document.querySelector("#clear-summary").addEventListener("click", () => {
    cart = [];
    saveCart();
    renderCart();
    confirmationBox.hidden = true;
    showToast("Order cleared");
  });

  document.querySelector("#copy-summary").addEventListener("click", () => {
    const id = orderNumber.textContent || "Draft";
    copyText(orderMessage(customerDetails(), id), "Order copied");
  });

  document.querySelector("#use-location").addEventListener("click", selectCurrentLocation);

  document.querySelector("#map-link").addEventListener("input", (event) => {
    const link = event.target.value.trim();
    if (!link) {
      selectedMap.innerHTML = "";
      selectedMap.classList.remove("is-visible");
      selectedMap.setAttribute("aria-hidden", "true");
      locationStatus.textContent = "No map location selected.";
      return;
    }
    locationStatus.textContent = "Map link added.";
  });

  // Auto-preview typed address on map
  const mapSearchInput = document.querySelector("#map-search-input");
  const mapSearchResults = document.querySelector("#map-search-results");
  let searchTimeout = null;

  if (mapSearchInput && mapSearchResults) {
    mapSearchInput.addEventListener("input", (event) => {
      const query = event.target.value.trim();
      clearTimeout(searchTimeout);
      
      if (query.length < 3) {
        mapSearchResults.hidden = true;
        if (!query && !document.querySelector("#latitude").value) {
          selectedMap.innerHTML = "";
          selectedMap.classList.remove("is-visible");
          selectedMap.setAttribute("aria-hidden", "true");
          locationStatus.textContent = "No map location selected.";
        }
        return;
      }

      mapSearchResults.hidden = false;
      mapSearchResults.innerHTML = `<li class="loading-li">Searching...</li>`;

      searchTimeout = setTimeout(async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`);
          const data = await res.json();
          
          if (!data || data.length === 0) {
            mapSearchResults.innerHTML = `<li class="empty-li">No results found in India.</li>`;
            return;
          }

          mapSearchResults.innerHTML = data.map(item => `
            <li data-lat="${item.lat}" data-lon="${item.lon}" data-name="${item.display_name.replace(/"/g, '&quot;')}">
              ${item.display_name}
            </li>
          `).join("");

        } catch (e) {
          mapSearchResults.innerHTML = `<li class="empty-li">Search failed. Try again.</li>`;
        }
      }, 500);
    });

    // Handle clicks on autocomplete results
    mapSearchResults.addEventListener("click", (e) => {
      const li = e.target.closest("li");
      if (!li || li.classList.contains("loading-li") || li.classList.contains("empty-li")) return;

      const lat = parseFloat(li.dataset.lat).toFixed(6);
      const lon = parseFloat(li.dataset.lon).toFixed(6);
      const name = li.dataset.name;

      mapSearchInput.value = name;
      mapSearchResults.hidden = true;

      document.querySelector("#latitude").value = lat;
      document.querySelector("#longitude").value = lon;
      
      const gmapsLink = `https://www.google.com/maps?q=${lat},${lon}`;
      document.querySelector("#map-link").value = gmapsLink;
      
      locationStatus.textContent = `Selected: ${name} (You can drag the pin to adjust)`;
      updateMapPreview(lat, lon);
    });

    // Hide dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!mapSearchInput.contains(e.target) && !mapSearchResults.contains(e.target)) {
        mapSearchResults.hidden = true;
      }
    });
  }





  orderForm.addEventListener("submit", submitOrder);


  // Format phone field and show green tick on 10 digits
  const phoneInput = document.getElementById("customer-phone");
  const phoneTick = document.getElementById("phone-valid-tick");
  
  // Load saved profile
  try {
    const saved = JSON.parse(localStorage.getItem("r-pizza-saved-profile"));
    if (saved) {
      if (document.getElementById("customer-name")) document.getElementById("customer-name").value = saved.customerName || "";
      if (phoneInput) document.getElementById("customer-phone").value = saved.customerPhone || "";
      if (document.getElementById("address-pincode")) document.getElementById("address-pincode").value = saved.addrPincode || "";
      if (document.getElementById("address-state")) document.getElementById("address-state").value = saved.addrState || "";
      if (document.getElementById("address-city")) document.getElementById("address-city").value = saved.addrCity || "";
      if (document.getElementById("address-house")) document.getElementById("address-house").value = saved.addrHouse || "";
      if (document.getElementById("address-area")) document.getElementById("address-area").value = saved.addrArea || "";
      if (document.getElementById("address-landmark")) document.getElementById("address-landmark").value = saved.addrLandmark || "";
      
      // trigger phone validation
      if (saved.customerPhone && saved.customerPhone.length === 10 && phoneTick) {
        phoneTick.style.opacity = "1";
      }
    }
  } catch(e) {}

  if (phoneInput && phoneTick) {
    phoneInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
      phoneTick.style.opacity = e.target.value.length === 10 ? "1" : "0";
    });
  }
}

bootOrderPage();
