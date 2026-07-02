# EXHAUSTIVE AI SYSTEM PROMPT: Rebuild Complete Serverless E-Commerce Platform

*Copy EVERYTHING below this line and paste it into any AI. It will build you an identical website with your own brand name, products, and menu items.*

---

## SECTION 1: TECHNOLOGY STACK & PROJECT STRUCTURE

### 1.1 Technology
- **Frontend:** Pure HTML5, Vanilla JavaScript (ES6+), Vanilla CSS. NO frameworks (no React, no Vue, no Tailwind).
- **Backend:** Vercel Serverless Functions (Node.js) in an `/api/` folder.
- **Database:** Upstash Redis via the `@upstash/redis` npm package (REST API).
- **Map Integration:** Leaflet.js (loaded from CDN `https://unpkg.com/leaflet@1.9.4`) for interactive delivery maps, plus Nominatim (OpenStreetMap) for address geocoding/search.
- **3D Animation:** Three.js (loaded from CDN `https://unpkg.com/three@0.165.0/build/three.module.js`) for a 3D spinning product on the hero section, with a 2D Canvas fallback.
- **Hosting:** Vercel (auto-deploys from GitHub).

### 1.2 File Structure
```
/
├── index.html          (Menu catalog page with cart - the MAIN customer page)
├── order.html          (Checkout page with multi-step form)
├── history.html        (Customer order tracking with live polling)
├── login.html          (Staff authentication - login & register)
├── admin.html          (Kitchen/Manager dashboard)
├── delivery.html       (Delivery rider dashboard)
├── styles.css          (Single shared stylesheet, ~2500 lines)
├── app.js              (Menu rendering, cart logic, 3D scene, ~990 lines)
├── order.js            (Checkout logic, form validation, pincode API, ~775 lines)
├── audio.js            (Web Audio API synthetic alarm engine, ~165 lines)
├── package.json        (Only dependency: @upstash/redis)
├── api/
│   ├── orders.js       (GET/POST/PATCH/PUT/DELETE - the core order engine)
│   ├── inventory.js    (GET/PUT - stock management)
│   └── auth.js         (POST - login, register, verify, logout, list, delete)
└── images/             (Storefront photo, logo, etc.)
```

### 1.3 package.json
```json
{
  "name": "your-brand-name",
  "private": true,
  "dependencies": {
    "@upstash/redis": "^1.30.0"
  }
}
```

### 1.4 Vercel Environment Variables
Set these in Vercel → Project → Settings → Environment Variables:
- `UPSTASH_REDIS_REST_URL` — OR — `KV_REST_API_URL` (the code checks both with fallback)
- `UPSTASH_REDIS_REST_TOKEN` — OR — `KV_REST_API_TOKEN`
- `ADMIN_MASTER_KEY` (optional, defaults to `"TheAdminHouse"` — used to register new staff accounts)
- `TELEGRAM_BOT_TOKEN` — Telegram bot API token for order notifications
- `TELEGRAM_CHAT_ID` — Telegram chat/group ID to receive order alerts

Every API file must connect to Redis like this:
```javascript
const { Redis } = require("@upstash/redis");
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});
```

---

## SECTION 2: COMPLETE CSS DESIGN SYSTEM (`styles.css`)

### 2.1 CSS Variables (`:root`)
```css
:root {
  color-scheme: light;
  --tomato: #d92d20;       /* Primary accent (red) */
  --tomato-dark: #9f1f16;
  --basil: #12805c;        /* Secondary accent (green) */
  --basil-dark: #0b4c39;
  --cheese: #ffd36b;       /* Warm highlight (yellow/gold) */
  --cream: #fff7ea;
  --paper: #fffdf8;        /* Page background */
  --ink: #221915;           /* Text color */
  --muted: #765f53;         /* Secondary text */
  --cobalt: #2953a6;
  --line: rgba(34, 25, 21, 0.14);  /* Borders */
  --shadow: 0 18px 50px rgba(82, 39, 19, 0.16);
  --radius: 8px;
}
```

### 2.2 Glassmorphism (Liquid Glass) Pattern
Every card, panel, navbar, and container MUST use this exact pattern:
```css
background: rgba(255, 255, 255, 0.65);
backdrop-filter: blur(8px);
-webkit-backdrop-filter: blur(8px);
border: 1px solid rgba(255, 255, 255, 0.4);
box-shadow: 0 12px 32px rgba(82, 39, 19, 0.08);
```
Apply to: `.topbar`, `.menu-card`, `.order-panel`, `.form-panel`, `.checkout-summary`.

### 2.3 Typography
- Font: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- `.eyebrow` class: `font-size: 0.78rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: var(--tomato-dark);`
- `h1`: `font-size: clamp(2.6rem, 6.4vw, 4.5rem); font-weight: 950; letter-spacing: -1.4px; line-height: 0.92;`

### 2.4 Layout Rules
- All grids use `gap: 24px`
- Card padding: `padding: 24px`
- Menu grid: 3 columns on desktop (`repeat(3, minmax(0, 1fr))`), 1 column on mobile
- Menu + Cart layout: `grid-template-columns: minmax(0, 1fr) 330px` (cart collapses below on mobile)
- Sticky navbar: `position: sticky; top: 0; z-index: 70;`

### 2.5 Animations
- `.reveal` class with `IntersectionObserver`: Elements start at `opacity: 0; transform: translateY(28px);` and animate to `opacity: 1; transform: none;` when scrolled into view.
- `.scroll-progress`: A thin bar at the top of the page that grows as the user scrolls (width percentage = scroll percentage).
- `.motion-strip`: Infinite horizontal CSS marquee (`@keyframes marquee`) — currently hidden with `display: none` to reduce clutter.
- Buttons: `transition: transform 180ms ease, box-shadow 180ms ease;` with hover scale `transform: scale(1.04)`.
- `.menu-card:hover`: `transform: translateY(-4px) rotateX(1.2deg); box-shadow: 0 18px 50px rgba(82, 39, 19, 0.16);`
- **Processing Button Animation** (`.btn-processing`, `.btn-spinner`, `.btn-step-text`): A spinning circle loader + animated step-text on the "Place Order" button while checkout is processing. Uses `@keyframes btnSpin` (360° rotation) and `@keyframes stepFadeIn` (fade + slide-up).

### 2.6 Responsive Breakpoints
- `@media (max-width: 900px)`: Menu grid becomes 2 columns. Cart panel stacks below.
- `@media (max-width: 600px)`: Menu grid becomes 1 column. Navbar hides desktop nav and shows mobile hamburger. Category tabs become horizontally scrollable.
- `@media (max-width: 480px)`: Hero text scales down. Checkout form panels stack vertically.

### 2.7 Status Badges
Color-coded status badges for orders:
```css
.status-pending    { background: #fff3cd; color: #856404; }  /* Yellow */
.status-preparing  { background: #cce5ff; color: #004085; }  /* Blue */
.status-dispatched { background: #d4edda; color: #155724; }  /* Green */
.status-fulfilled  { background: #d1ecf1; color: #0c5460; }  /* Teal */
.status-cancelled  { background: #f8d7da; color: #721c24; }  /* Red */
```

### 2.8 Admin Order Card Left-Border Accents
Each order card gets a colored left border based on status:
```css
.status-card-pending       { border-left: 5px solid #ffd36b; }
.status-card-preparing     { border-left: 5px solid #1c52d4; }
.status-card-out-for-delivery { border-left: 5px solid #7928ca; }
.status-card-fulfilled     { border-left: 5px solid #12805c; }
.status-card-cancelled     { border-left: 5px solid #d92d20; }
```

---

## SECTION 3: FRONTEND PAGES — COMPLETE SPECIFICATIONS

### 3.1 `index.html` + `app.js` — Menu Catalog & Shopping Cart

**HTML Structure:**
1. **Topbar**: Sticky glassmorphism navbar with brand logo (first letter in a colored circle), navigation links (Menu, Order, My Orders, Visit, Reviews), and an "Order" CTA button.
2. **Hero Section**: Full-viewport section with:
   - A `<canvas id="pizza-scene">` for 3D/2D animated product.
   - Rating row (e.g., "3.8 ★★★★☆ 52 Google ratings ₹1-200").
   - `<h1>` brand name, Hindi/secondary name.
   - "View menu" and "Directions" (Google Maps link) buttons.
   - A hidden `.service-grid` (Dine-in, Drive-through, etc.) and `.quick-ticket` sidebar.
3. **Menu Section**: Section heading with search input + category tabs + menu grid + cart sidebar.
4. **Reviews Section**: Google ratings overview.
5. **Visit Section**: Address, phone, hours, Google Maps `<iframe>` embed.
6. **Toast**: `<div class="toast" id="toast">` for popup notifications.
7. **Floating Cart Button**: A circular FAB (`<button id="floating-cart">`) showing cart count, hidden when empty.
8. **Footer**: Brand name + tagline.

**`app.js` — Complete Logic:**

**Menu Data:** A hardcoded `menuItems` array of objects, each with: `{ name, category, type ("Veg"/"Non Veg"), desc, price }`. Categories include "Veg Specials", "Paneer Pizzas", "Classic Veg", "Non Veg", "Burgers & More".

**localStorage Keys Used:**
- `r-pizza-cart` — Cart array: `[{ name, category, desc, price, qty, type }]`
- `r-pizza-inventory` — Cached inventory from server

**Inventory System:**
- On boot (`bootMenu()`), fetches `GET /api/inventory` to get latest stock. Falls back to localStorage cache. If both fail, seeds from hardcoded defaults (stock: 50 each).
- **Inventory polling is DISABLED** to save Upstash bandwidth — inventory loads once on page load. Cross-tab sync via `window.addEventListener("storage")` — if inventory changes in another tab, updates UI immediately.

**Cart System:**
- Uses a `Map()` keyed by item name.
- `addItem(name)`: Checks stock before adding. If `qty >= stock`, shows toast "Sorry, only X available".
- `changeQty(name, delta)`: Increments/decrements. Removes item if qty drops to 0.
- `renderCart()`: Generates HTML with qty controls (`-` / `+` buttons), updates count and total.
- `saveCart()`: Persists to `localStorage` after every change.
- `restoreCart()`: On page load, reads from localStorage, validates against current inventory stock.
- `reconcileCartWithInventory(inventory)`: After each API sync, removes unavailable items and clamps quantities to available stock.
- `copyOrder()`: Copies formatted order text to clipboard using `navigator.clipboard.writeText()` with fallback to `document.execCommand("copy")`.

**Category Tabs:** Dynamically rendered. Clicking a tab filters the menu. "All" shows everything.

**Search:** Real-time search across `name`, `desc`, `category`, and `type`.

**Menu Cards & Inline Controls (`syncMenuButtons()`):** Each card shows: item name, price (₹format), description, Veg/Non-Veg tag, and an Add button (or "Out of Stock" badge if `stock <= 0` or `available === false`). Once an item is added to the cart, the `syncMenuButtons()` function dynamically replaces the Add button directly on the menu card with inline `- 1 +` quantity controls.

**3D Product Animation (`bootPizzaScene()`):**
- Tries to dynamically import Three.js from CDN.
- If successful, builds a 3D scene with: a cylinder base (cheese colored), a torus ring (crust), sauce spiral, 15 topping meshes (sauce, basil, olive, paneer, corn), cheese strings, point light, hemisphere light.
- The 3D object slowly rotates and follows mouse pointer position.
- If Three.js fails to load, falls back to `bootCanvasFallback()`: a 2D canvas drawing of a pizza using `ctx.arc()`, `ctx.ellipse()`, with the same rotation and pointer-following behavior.

**Scroll Animations (`bootScrollAnimations()`):**
- `IntersectionObserver` with `threshold: 0.14` watches all `.reveal` elements.
- When visible, adds `.is-visible` class (CSS transitions `opacity` and `transform`).
- Scroll progress bar updates on `scroll` event.

---

### 3.2 `order.html` + `order.js` — Checkout Page

**HTML Structure:**
- Multi-step form with 5 panels, each numbered with a `.panel-step`:
  1. **Customer Details**: Name (required), Phone (required, 10-digit with green tick SVG).
  2. **Service**: Time dropdown (ASAP, 11AM-9PM), Payment dropdown (Cash, UPI, Card).
  3. **Delivery Address**: Pincode (6 digits, auto-fills city/state), State, City/District, House/Flat, Area/Street, Landmark (optional).
  4. **Map Location (Optional)**: Search bar (Nominatim geocoding), "Select location" GPS button, interactive Leaflet.js map with draggable pin. Hidden fields for `latitude`, `longitude`, `mapLink`.
  5. **Notes**: Textarea for cooking notes. "Place order" submit button.
- **Order Summary Sidebar**: Same glass panel showing cart items with qty controls, total, copy/clear buttons, and a hidden confirmation box that appears after order placement.
- **Success Overlay**: Full-screen animated checkmark SVG (`#order-success-overlay`). After order success, stays for ~3 seconds then **auto-redirects to `history.html`**.

**`order.js` — Complete Logic:**

**localStorage Keys Used:**
- `r-pizza-cart` — reads cart items
- `r-pizza-all-orders` — stores all orders placed from this browser
- `r-pizza-last-order` — stores the most recent order
- `r-pizza-saved-profile` — saves customer profile for auto-fill
- `r-pizza-inventory` — cached inventory

**Auto-Remove Out-of-Stock Items (Dual-Check):**
Out-of-stock items are checked and removed at **two** points:
1. **On page load (`bootOrderPage()`)**: Reads cached inventory from `localStorage`. Silently removes any items from the cart where `available === false` or `stock <= 0`. Shows toast: "Removed out-of-stock: Item1, Item2".
2. **On "Place Order" click (`submitOrder()`)**: Fetches **fresh live inventory** from the API first (`syncInventoryFromApi()`), then auto-removes out-of-stock items and **caps quantity** to available stock (e.g., cart has 3 but only 1 left → adjusts to 1). If cart becomes empty after removal, stops the order and restores the button.

**Profile Auto-fill:**
On boot, reads `r-pizza-saved-profile` from localStorage. Auto-fills: Name, Phone, Pincode, State, City, House, Area, Landmark. If phone is 10 digits, shows the green tick immediately.

**Phone Validation:**
- `input` event listener strips non-digits, limits to 10 chars: `e.target.value.replace(/\D/g, '').slice(0, 10)`
- Shows green checkmark SVG (opacity 1) when length === 10.

**Pincode Auto-fill:**
- `input` event listener strips non-digits, limits to 6 chars.
- When exactly 6 digits: `fetch('https://api.postalpincode.in/pincode/{PIN}')`.
- Parses response. If `Status === "Success"`, auto-fills City with `PostOffice[0].District` and State with `PostOffice[0].State`.
- Only fills if the field is currently empty (doesn't override manual entry).

**Map Integration (Leaflet.js):**
- "Select location" button uses `navigator.geolocation.getCurrentPosition()` with `enableHighAccuracy: true, maximumAge: 0, timeout: 10000`.
- Initializes Leaflet map with OpenStreetMap tiles. Adds a **draggable marker**.
- Marker drag and map click both update lat/lng and Google Maps link.
- Address search uses Nominatim API: `https://nominatim.openstreetmap.org/search?format=json&q={query}&countrycodes=in&limit=5` with 500ms debounce.
- Search results appear in a dropdown. Clicking a result places the marker.

**Animated Processing Button (Multi-Step UX):**
When the user clicks "Place Order", the button transforms through these stages:
1. Button disables, shows a **spinning circle loader** (`.btn-spinner`) + step text "Verifying items..."
2. Step text cycles every 800ms: "Checking availability..." → "Securing your order..." → "Almost there..."
3. On success, button turns green with **"✅ Order Placed!"** text (`background: var(--basil); color: #fff`).
4. After 600ms, the full-screen success overlay appears.
5. After 3.6 seconds total, **auto-redirects to `history.html`**.
6. On failure, button restores to original "Place order" text.

**Order Submission Flow:**
1. Validates form fields.
2. Shows animated processing button with spinner.
3. Syncs fresh inventory from API (catches errors gracefully).
4. **Auto-removes out-of-stock items** from cart. Caps quantities to available stock.
5. Builds `customerDetails()` object: `{ name, phone, address (concatenated), latitude, longitude, mapLink, notes, payment, service, time }`.
6. Generates order ID: `RPZ-YYYYMMDD-XXXXX` (where XXXXX = last 5 digits of `Date.now()`).
7. Sends `POST /api/orders` with `{ id, details, cart, total }`.
8. Saves profile to `r-pizza-saved-profile`.
9. Saves order to `r-pizza-all-orders`.
10. Transforms button to green tick → shows success overlay → **auto-redirects to order history**.

**WhatsApp Integration:**
- `RESTAURANT_WHATSAPP = "916301045696"` — used to generate `https://wa.me/{number}?text={encodedMessage}` links.

---

### 3.3 `history.html` — Customer Order Tracking

**HTML Structure:**
- Filter tabs: All, Pending, Preparing, Delivery, Completed, Cancelled.
- Order history list (dynamically rendered).
- Empty state CTA ("No orders yet — Place Your First Order").
- Loading spinner while fetching.

**Inline `<script>` Logic (embedded in HTML):**

**localStorage Keys:** `r-pizza-all-orders`, `r-pizza-cart`.

**Polling:** Uses `setInterval` every **20 seconds** to `GET /api/orders`. Merges server data with local orders (matches by order ID). Updates status, delivery codes, etc.

**Order Card Rendering:** Each order shows:
- Order ID, date/time (formatted with `toLocaleString("en-IN")`).
- Color-coded status badge.
- Item list with prices and quantities. Cancelled items shown with strikethrough.
- Total amount.
- **Delivery Code Panel**: If status is "Out for Delivery" and `order.deliveryCode` exists, shows the 6-digit code prominently with a "Share with delivery partner" instruction.
- **Cancel Button**: Only shown if status is "Pending". Sends `PATCH /api/orders` with `{ id, status: "Cancelled" }`.

**Filter System:** Clicking a filter tab sets `currentFilter` and re-renders the list.

---

### 3.4 `login.html` — Staff Authentication

**HTML Structure (all inline CSS + JS):**
- Centered login card with animated entry (`@keyframes cardEntry`).
- Two tabs: "Login" and "Register".
- Login form: Username + Password fields.
- Register form: Username + Password + Role dropdown (Admin/Delivery Partner) + Master Key field.
- After login, stores `auth_token`, `auth_username`, `auth_role` in localStorage and redirects to `admin.html` or `delivery.html`.

**API Calls:**
- Login: `POST /api/auth` with `{ action: "login", username, password }`. Returns `{ token, username, role }`.
- Register: `POST /api/auth` with `{ action: "register", masterKey, username, password, role }`.

---

### 3.5 `admin.html` — Kitchen/Manager Dashboard

**Auth Guard:** Script at top checks `localStorage.getItem("auth_token")`. Sends `POST /api/auth` with `{ action: "verify", token }`. If invalid, redirects to `login.html`.

**Features:**
- **Incoming Orders Grid**: Shows all Pending orders. Each card has "Preparing" and "Cancel" buttons.
- **Dispatch Panel**: For Preparing orders, shows "Dispatch" button. When clicked, admin can optionally select a delivery partner (fetched via `POST /api/auth` with `{ action: "list-delivery", token }`). Dispatching sends `PATCH /api/orders` with `{ id, status: "Out for Delivery", deliveryPartner }`.
- **Inventory Management**: Toggle item availability, adjust stock levels. Sends `PUT /api/inventory` with updated array. Inventory table uses `data-label` attributes on `<td>` elements for mobile card layout.
- **Inventory Image Upload**: File input with `accept="image/*" capture="environment"` — directly opens the phone camera on mobile for instant product photography.
- **Mobile Inventory Card Layout**: On screens ≤768px, the inventory table transforms into stacked cards via CSS (`#inventory-table thead { display: none }`, `#inventory-table tr` becomes a card block with `border-radius: 8px; margin-bottom: 16px; padding: 16px`). Each `<td>` uses `::before { content: attr(data-label) }` to show field labels.
- **Lightweight Image Placeholders**: In the inventory table, product images use a 📸 emoji placeholder instead of rendering full base64 images, dramatically reducing DOM size and browser memory.
- **User Management**: Create/delete staff accounts (requires Master Key).
- **Audio Alerts**: Imports `audio.js`. If pending order count increases between polls, plays `AudioEngine.playAdminRing()`. Stop button available.
- **Polling**: Orders poll every **20 seconds** (not 3). **Inventory does NOT auto-poll** — loads once on page open. This saves Upstash bandwidth.

---

### 3.6 `delivery.html` — Rider Dashboard

**Auth Guard:** Same as admin — verifies token, redirects if invalid.

**Features:**
- Shows orders with status "Out for Delivery".
- **Accept Delivery**: Rider clicks "Accept" → sends `PUT /api/orders` with `{ action: "accept-delivery", id, partner: username }`.
- **Verify OTP**: After accepting, shows OTP input field. Rider enters the 6-digit code the customer reads from their history page. Sends `PUT /api/orders` with `{ action: "verify-otp", id, otp }`. If match → order becomes "Fulfilled". If wrong → shows "Incorrect OTP" error.
- **Audio Alerts**: Uses `AudioEngine.playDeliveryPing()` when new deliveries appear.
- **Polling**: Every **20 seconds**.

---

## SECTION 4: BACKEND API — COMPLETE SPECIFICATIONS

### 4.1 Redis Keys
- `r-pizza-and-more:orders` — JSON array of all order objects.
- `r-pizza-and-more:inventory` — JSON array of all inventory items.
- `r-pizza-and-more:users` — JSON array of staff accounts `{ username, password, role, createdAt }`.
- `r-pizza-and-more:sessions` — JSON array of active sessions `{ token, username, role, createdAt }` (max 50, trimmed on login).

### 4.2 CORS Headers (Every API File)
```javascript
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
```
All endpoints handle `OPTIONS` preflight by returning `200`.

### 4.3 CRITICAL: Cache-Control Headers
**GET requests** must return:
```javascript
res.setHeader("Cache-Control", "public, s-maxage=3, stale-while-revalidate=5");
```
**Non-GET requests** must return:
```javascript
res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
```
This is the MOST IMPORTANT part of the backend. Without this, the Upstash free tier will be exceeded within minutes because 3 pages poll every 3 seconds.

### 4.4 `api/orders.js` — The Core Engine (~435 lines)

**GET** — Returns all orders array. Cached at edge for 3 seconds.

**POST** — Create Order:
1. Validates `details` (object) and `cart` (array).
2. Cleans cart: maps each item to `{ name, qty, price }`, filters out invalid entries.
3. Validates stock: for each cart item, checks inventory. Returns 409 if unavailable or insufficient stock.
4. Deducts stock from inventory.
5. Generates order ID: `RPZ-YYYYMMDD-XXXXX`.
6. Recomputes total server-side (doesn't trust client total).
7. Creates order object: `{ id, createdAt, details, items, cart, total, status: "Pending" }`.
8. **Runs Redis saves + Telegram notification in PARALLEL using `Promise.all()`** — all tasks complete BEFORE `res.json()` is called (critical for Vercel which kills execution after response).
9. Returns `{ order, inventory }`.

**Telegram Bot Integration (in POST handler):**
- Reads `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` from environment variables.
- Sends a formatted Markdown message via `POST https://api.telegram.org/bot{token}/sendMessage` with order details (customer name, phone, total, items list).
- Runs inside `Promise.all()` alongside Redis saves to guarantee delivery before Vercel shuts down the function.
- Uses `.catch()` to prevent Telegram failures from blocking order creation.

**PATCH** — Update Order Status:
- Takes `{ id, status }`.
- If status → `"Out for Delivery"`: Generates 6-digit delivery code: `String(Math.floor(100000 + Math.random() * 900000))`. Sets `partnerAccepted: false`. Optionally saves `deliveryPartner` from body.
- If status → `"Cancelled"`: Restores stock to inventory (unless previously Fulfilled). Returns 409 if trying to cancel a fulfilled order.
- Saves updated orders + inventory to Redis.
- Returns `{ order, inventory }`.

**PUT** — Delivery Actions (action-based routing):
- `action: "accept-delivery"`: Validates order is "Out for Delivery". Checks if already claimed by another partner (409). Sets `deliveryPartner` and `partnerAccepted: true`.
- `action: "verify-otp"`: Compares `body.otp` to `order.deliveryCode`. If match → sets `status: "Fulfilled"`, `fulfilledAt: ISO timestamp`. If wrong → returns 403 "Incorrect OTP".
- `action: "cancel-item"`: Cancels a specific item within an order. Sets `item.cancelled = true`. Reduces order total. Marks item as unavailable in inventory. If ALL items cancelled, sets order status to "Cancelled".

**DELETE** — Remove Order:
- Takes `{ id }`. Filters out the order from the array. Saves to Redis.

### 4.5 `api/inventory.js` (152 lines)

**GET** — Returns full inventory array. Cached at edge for 3 seconds. Auto-seeds default inventory if Redis is empty (stock: 50, available: true for each item).

**PUT** — Admin updates inventory. Takes `{ inventory: [...] }`. Validates and normalizes each item: `{ name, category, type, desc, price, stock, available }`. Saves to Redis.

### 4.6 `api/auth.js` (234 lines)

All requests are `POST` with an `action` field:
- `action: "login"` — Finds matching user in Redis. Creates 64-char random session token. Stores session. Returns `{ token, username, role }`.
- `action: "register"` — Requires `masterKey` matching `ADMIN_MASTER_KEY`. Creates new user with role "admin" or "delivery". Username min 3 chars, password min 4 chars. Checks for duplicates.
- `action: "verify"` — Checks if token exists in sessions array. Returns `{ valid, username, role }`.
- `action: "logout"` — Removes session by token.
- `action: "delete"` — Requires master key. Removes user and their sessions.
- `action: "list"` — Requires master key. Returns all usernames with roles.
- `action: "list-delivery"` — Requires valid token. Returns array of delivery partner usernames.

---

## SECTION 5: `audio.js` — SYNTHETIC ALARM ENGINE (165 lines)

Do NOT use MP3/WAV files. Use the browser's native `Web Audio API`.

**Architecture:** IIFE that exposes `window.AudioEngine` with methods:
- `playAdminRing()` — Continuous alarm. Plays a 660Hz triangle wave tone every 1.5 seconds until stopped.
- `stopAdminRing()` — Clears the interval.
- `playDeliveryPing(durationMs?)` — Double sonar ping (880Hz sine, 200ms, repeated at 300ms offset). Repeats every 2 seconds. Optional auto-stop after duration.
- `stopDeliveryPing()` — Stops delivery ping.
- `toggleMute()` / `getMuteState()` — Global mute control.

**Audio Context Unlocking:**
Browsers block AudioContext until user interaction. Must add:
```javascript
const unlockAudio = () => { initAudio(); document.removeEventListener('click', unlockAudio); };
document.addEventListener('click', unlockAudio);
document.addEventListener('touchstart', unlockAudio);
```

**Tone Generation:**
```javascript
function playTone(freq, duration, vol, type) {
  initAudio();
  if (isMuted || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || "triangle";
  osc.frequency.value = freq || 660;
  gain.gain.value = vol || 0.8;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + (duration || 0.3));
}
```

---

## SECTION 6: COMPLETE localStorage KEY REFERENCE

| Key | Used By | Purpose |
|-----|---------|---------|
| `r-pizza-cart` | app.js, order.js, history.html | Shopping cart items array |
| `r-pizza-inventory` | app.js, order.js | Cached inventory from server |
| `r-pizza-all-orders` | order.js, history.html | All orders placed from this browser |
| `r-pizza-last-order` | order.js | Most recently placed order |
| `r-pizza-saved-profile` | order.js | Saved customer name, phone, address for auto-fill |
| `auth_token` | login.html, admin.html, delivery.html | Session token for staff authentication |
| `auth_username` | admin.html, delivery.html | Logged-in staff username |
| `auth_role` | admin.html, delivery.html | "admin" or "delivery" |

---

## SECTION 7: ORDER OBJECT SCHEMA

```javascript
{
  id: "RPZ-20260604-12345",
  createdAt: "2026-06-04T10:30:00.000Z",
  details: {
    name: "Customer Name",
    phone: "9876543210",
    address: "House 12, Main Road, Landmark: Near Hospital, Tajpur, Bihar - 848130",
    latitude: "25.123456",
    longitude: "85.654321",
    mapLink: "https://www.google.com/maps?q=25.123456,85.654321",
    notes: "Extra cheese please",
    payment: "Cash",
    service: "Delivery",
    time: "As soon as possible"
  },
  items: [
    { name: "Margherita", qty: 2, price: 99, category: "", type: "" },
    { name: "Farmhouse", qty: 1, price: 209, category: "", type: "" }
  ],
  cart: [ /* same as items */ ],
  total: 407,
  status: "Pending",           // Pending → Preparing → Out for Delivery → Fulfilled / Cancelled
  deliveryCode: "847293",      // 6-digit, generated on dispatch
  deliveryPartner: "ravi",     // Assigned rider username
  partnerAccepted: true,       // Whether rider has accepted
  fulfilledAt: "2026-06-04T11:00:00.000Z"  // Set when OTP verified
}
```

---

## SECTION 8: CRITICAL IMPLEMENTATION NOTES

1. **Edge Caching is NON-NEGOTIABLE.** Without `s-maxage=3` on GET endpoints, the Upstash free tier (10,000 requests/day) will be exhausted in under 1 hour because admin, history, and delivery pages all poll every 20 seconds.

2. **Menu items are hardcoded in TWO places:** `app.js` (frontend) and `api/orders.js` + `api/inventory.js` (backend). They must be identical. The backend uses them to seed the inventory on first run.

3. **Default stock is 50 per item.** The `buildDefaultInventory()` function maps each menu item with `stock: 50, available: true`.

4. **The order total is recomputed server-side** from the cart items: `cleanedCart.reduce((sum, x) => sum + x.price * x.qty, 0)`. Never trust the client-provided total.

5. **Cancelled orders restore inventory stock.** The PATCH handler iterates over order items and adds back `qty` to each item's `stock`.

6. **The `cancel-item` PUT action marks an individual item as unavailable** in the inventory (sets `available: false`), effectively removing it from the menu for all customers.

7. **Sessions are trimmed to 50** on each login to prevent Redis bloat.

8. **The Leaflet map is lazy-loaded** — it only initializes when the user clicks "Select location" or picks a search result.

9. **Cross-tab synchronization** uses the `window.storage` event to instantly update inventory/cart across browser tabs without needing API calls.

10. **Telegram notifications MUST run inside `Promise.all()` before `res.json()`.** Vercel serverless functions are killed immediately after the response is sent. Any `fetch()` call placed after `res.json()` is a race condition and will randomly fail.

11. **Inventory polling is DISABLED on the main menu page (`app.js`).** Inventory loads once on page open. Admin dashboard polls only orders (not inventory) every 20 seconds. This keeps Upstash usage to ~15% of the free tier even with the admin tab open all day.

12. **Out-of-stock auto-removal is dual-check.** Cart items are cleaned against inventory at two points: (a) when the order page loads (uses cached inventory, zero API calls), and (b) when "Place Order" is clicked (fetches fresh inventory from API). This catches the scenario where another user buys the last item while you're filling in your address.

13. **Mobile inventory table uses CSS card transformation.** On screens ≤768px, the `<table>` becomes stacked cards via `display: block` on `thead`, `tr`, `td` and `::before { content: attr(data-label) }` pseudo-elements. No JavaScript needed.

14. **Camera capture for product images.** The admin inventory image upload uses `<input type="file" accept="image/*" capture="environment">` to launch the phone's rear camera directly on mobile devices.

---

## SECTION 9: POLLING INTERVALS & UPSTASH BUDGET

| Page | What it polls | Interval | Redis Commands per poll |
|------|--------------|:--------:|:-:|
| Admin Dashboard (`admin.html`) | Orders only | 20 sec | 1 GET |
| Delivery Page (`delivery.html`) | Orders for delivery | 20 sec | 1 GET |
| Order History (`history.html`) | Customer order statuses | 20 sec | 1 GET |
| Main Website (`app.js`) | Nothing (loads once) | — | 0 |
| Order Page (`order.js`) | Nothing (no polling) | — | 0 |

**Per Order Placement:** 3 Redis commands (1 GET orders + 1 SET orders + 1 SET inventory) + 1 Telegram API call = **~3 Redis commands**.

**Daily Budget Estimate (10 orders/day, admin open 8 hours):**
~1,500 commands/day out of 10,000 free limit (~15% usage).

---

## FINAL INSTRUCTIONS FOR AI

Build the COMPLETE system following every specification above. Do not skip any file. Do not simplify the API. Generate full HTML/CSS/JS files. The UI must use the exact Glassmorphism CSS pattern provided. The caching headers must be on every GET endpoint. The audio engine must use Web Audio API, not audio files. Telegram notifications must use `Promise.all()` before the response. The processing button must have a spinner and step messages. Out-of-stock auto-removal must happen at both page load and order click. Start by creating the file structure, then implement each file in order: package.json → styles.css → API files → HTML pages → JS files.
