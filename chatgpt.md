# Mount Parche change log

## Branding and storefront

- Renamed the website, admin area, order history, delivery area, privacy page, package name, browser storage keys, and Redis keys to Mount Parche.
- Added the contact email: [mountparche@duck.com](mailto:mountparche@duck.com).
- Replaced restaurant-facing storefront copy with clothes, accessories, crockery, and general-items copy.
- Added a Mount Parche SVG logo and removed the restaurant hero/map from the active storefront.
- Seeded a new editable catalog with Clothing, Accessories, Crockery, and Other Items. Add any future product from the existing Inventory Manager.

## Razorpay payment integration

- Added api/payment.js for secure Razorpay order creation and signature verification.
- The client starts the Razorpay Checkout only after the server calculates the real cart total from the inventory.
- The order API accepts a Razorpay order only after the server has verified the Razorpay signature; the payment record is then marked consumed.
- RAZORPAY_KEY_SECRET stays on the Vercel server and is never sent to the browser. Razorpay's key ID is returned only when creating a checkout, which is required by Razorpay Checkout.
- Cash on Delivery remains available as an optional checkout method.

## Checkout improvements

- Removed delivery time picker; simplified to "As soon as possible" only.
- Saved address shows in one line under "Delivering to" with Edit button; full form hidden when saved profile exists.
- Razorpay selected by default; Place Order button inside summary box for faster checkout.

## COD controls (Admin)

- **Store-wide COD toggle**: Settings page → "COD Enabled/Disabled" dropdown controls whether Cash on Delivery appears on checkout. When disabled, only Razorpay (online payment) is shown.
- **Per-item COD toggle**: Inventory Manager → each item row now has a "COD" checkbox to enable/disable Cash on Delivery for that specific product. Set before ordering — cannot be toggled after an order is placed.
- Checkout respects per-item COD: if any cart item has COD disabled, the "Cash on Delivery" option is hidden and Razorpay becomes the only payment method.

## Product detail page

- Full-screen product view with image, MRP/discount (red text when `mrp` > `price`), size buttons (only when product has `sizes` array), variant dropdown, quantity, Add to Cart + Buy Now.
- Buy Now flow: separate `mount-parche-direct-order` key → `order.html?direct=1`, skips regular cart, cleans up after order.

## Add these Vercel environment variables

Add these under **Vercel → Project → Settings → Environment Variables** for Production, Preview, and Development as appropriate:

~~~env
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
~~~

Keep the values empty in Git and enter the real values only in Vercel. After adding or changing them, redeploy the project.

The existing Upstash variables are still required:

~~~env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
~~~

## Files changed

- api/catalog.js — shared Mount Parche catalog and Redis inventory namespace, **codEnabled** field in catalog items.
- api/inventory.js — generic product inventory API, **codEnabled** preserved during normalization.
- api/orders.js — server-authoritative pricing, paid-order validation, fulfilment actions (**toggle-cod removed** — COD is set before ordering only).
- api/payment.js — Razorpay create-order and signature-verification endpoints.
- api/settings.js — store-wide settings (minOrderPrice, **codEnabled**).
- app.js, order.js, order.html, product.js, product.html — Mount Parche branding, product shop copy, checkout flow, **per-item COD visibility logic**.
- admin.html — **Admin Settings COD toggle + per-item COD checkbox in Inventory Manager**.
- images/mount-parche-logo.svg — new logo asset.
- package.json and package-lock.json — package branding.
- website_blueprint_prompt.md — updated project blueprint.
