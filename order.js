const CART_STORAGE_KEY = "r-pizza-cart";
const LAST_ORDER_KEY = "r-pizza-last-order";
const RESTAURANT_WHATSAPP = "916301045696";

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
  return {
    address: String(formData.get("customerAddress") || "").trim(),
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

function updateMapPreview(query) {
  const source = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`;
  selectedMap.innerHTML = `<iframe title="Selected location map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${source}"></iframe>`;
  selectedMap.classList.add("is-visible");
  selectedMap.removeAttribute("aria-hidden");
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
      locationStatus.textContent = `Selected: ${lat}, ${lng}`;
      updateMapPreview(`${lat},${lng}`);
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

function renderOrderHistory() {
  const historyList = document.querySelector("#order-history-list");
  if (!historyList) return;

  const orders = readAllOrders();
  // Sort by newest first
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (orders.length === 0) {
    historyList.innerHTML = `<p class="empty-cart">No orders placed from this browser yet.</p>`;
    return;
  }

  historyList.innerHTML = orders
    .map((order) => {
      const date = new Date(order.createdAt).toLocaleString();
      const statusClass = `status-${order.status.toLowerCase().replace(/\s+/g, "-")}`;
      
      const itemsText = order.items
        ? order.items.map((item) => `${item.qty} x ${item.name}`).join(", ")
        : order.cart
        ? order.cart.map((item) => `${item.qty} x ${item.name}`).join(", ")
        : "No items";

      const canCancel = order.status === "Pending";
      const cancelBtn = canCancel
        ? `<button type="button" class="button ghost cancel-order-btn" data-order-id="${order.id}">Cancel Order</button>`
        : "";

      const customerPhone = order.details.phone || "N/A";
      const customerAddress = order.details.address || "N/A";

      return `
        <div class="history-order-card" data-order-status="${order.status}">
          <div class="history-card-header">
            <div>
              <strong>Order ID: ${order.id}</strong>
              <div class="history-card-date">${date}</div>
            </div>
            <span class="status-badge ${statusClass}">${order.status}</span>
          </div>
          
          <div class="history-card-body">
            <div class="history-info-row">
              <strong>Items:</strong> <span>${itemsText}</span>
            </div>
            <div class="history-info-row">
              <strong>Total:</strong> <strong style="color: var(--tomato-dark);">${formatRupees(order.total)}</strong>
            </div>
            <div class="history-info-row">
              <strong>Phone:</strong> <span>${customerPhone}</span>
            </div>
            <div class="history-info-row">
              <strong>Address:</strong> <span>${customerAddress}</span>
            </div>
            ${order.details.notes ? `
            <div class="history-info-row">
              <strong>Notes:</strong> <span>${order.details.notes}</span>
            </div>` : ""}
          </div>
          
          <div class="history-card-actions">
            <a class="button primary text-sm" href="https://wa.me/${RESTAURANT_WHATSAPP}?text=${encodeURIComponent(orderMessage(order.details, order.id))}" target="_blank" rel="noreferrer" style="min-height: 36px; height: 36px; padding: 0 16px; font-size: 0.82rem; margin-right: 8px;">
              Send on WhatsApp
            </a>
            ${cancelBtn}
          </div>
        </div>
      `;
    })
    .join("");
}

function handleCancelOrder(orderId) {
  if (!confirm("Are you sure you want to cancel this order?")) return;
  const orders = readAllOrders();
  const order = orders.find((o) => o.id === orderId);
  if (order && order.status === "Pending") {
    order.status = "Cancelled";
    saveAllOrders(orders);
    renderOrderHistory();
    showToast("Order cancelled successfully");
    // Trigger storage event manually for same-page listeners
    window.dispatchEvent(new Event("storage"));
  }
}

function submitOrder(event) {
  event.preventDefault();
  const { count, total } = cartStats();
  if (!count) {
    showToast("Add at least one item first");
    return;
  }

  if (!orderForm.reportValidity()) return;

  const details = customerDetails();
  const id = `RPZ-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-5)}`;
  const message = orderMessage(details, id);

  const newOrder = {
    cart,
    items: cart,
    createdAt: new Date().toISOString(),
    details,
    id,
    total,
    status: "Pending",
  };

  localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(newOrder));

  // Add to persistent orders list
  const orders = readAllOrders();
  orders.push(newOrder);
  saveAllOrders(orders);

  orderNumber.textContent = id;
  receiptPreview.textContent = `${details.name}, ${count} ${count === 1 ? "item" : "items"} · ${formatRupees(total)} · ${details.service}`;
  sendWhatsapp.href = `https://wa.me/${RESTAURANT_WHATSAPP}?text=${encodeURIComponent(message)}`;
  confirmationBox.hidden = false;
  showToast("Order receipt created");

  renderOrderHistory();

  confirmationBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
  renderOrderHistory();
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
  const addressTextarea = document.querySelector("#customer-address");
  if (addressTextarea) {
    addressTextarea.addEventListener("input", (event) => {
      const address = event.target.value.trim();
      if (address.length > 4) {
        updateMapPreview(address);
        document.querySelector("#map-link").value = `https://www.google.com/maps?q=${encodeURIComponent(address)}`;
        locationStatus.textContent = "Previewing exact address on map.";
      } else if (!address && !document.querySelector("#latitude").value) {
        selectedMap.innerHTML = "";
        selectedMap.classList.remove("is-visible");
        selectedMap.setAttribute("aria-hidden", "true");
        locationStatus.textContent = "No map location selected.";
      }
    });
  }

  // Handle cancellation click
  const historyList = document.querySelector("#order-history-list");
  if (historyList) {
    historyList.addEventListener("click", (event) => {
      const cancelBtn = event.target.closest(".cancel-order-btn");
      if (cancelBtn) {
        handleCancelOrder(cancelBtn.dataset.orderId);
      }
    });
  }

  // Live storage event listener to automatically sync changes from admin.html
  window.addEventListener("storage", (event) => {
    if (event.key === ALL_ORDERS_KEY || event.key === null) {
      renderOrderHistory();
    }
  });

  orderForm.addEventListener("submit", submitOrder);
}

bootOrderPage();
