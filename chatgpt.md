# Mount Parche change log

## Branding and storefront

- Renamed the website, admin area, order history, delivery area, privacy page, package name, browser storage keys, and Redis keys to Mount Parche.
- Added the contact email: [mountparche@duck.com](mailto:mountparche@duck.com).
- The storefront presents Mount Parche as a shop for clothes, accessories, crockery, and general items.
- The active storefront features the Mount Parche SVG logo and a product-focused shopping layout.
- Seeded a new editable catalog with Clothing, Accessories, Crockery, and Other Items. Add any future product from the existing Inventory Manager.

## Razorpay payment integration

- Added api/payment.js for secure Razorpay order creation and signature verification.
- The client starts the Razorpay Checkout only after the server calculates the real cart total from the inventory.
- The order API accepts a Razorpay order only after the server has verified the Razorpay signature; the payment record is then marked consumed.
- RAZORPAY_KEY_SECRET stays on the Vercel server and is never sent to the browser. Razorpay's key ID is returned only when creating a checkout, which is required by Razorpay Checkout.
- Cash on Delivery remains available as an optional checkout method.

## Checkout improvements

- Checkout offers an "As soon as possible" delivery option.
- A saved address appears in one line under "Delivering to" with an Edit button; the address form appears when a customer needs to enter or update details.
- Razorpay is selected by default, and the Place Order button stays accessible beneath the order summary while scrolling.

## COD controls (Admin)

- **Store-wide COD toggle**: Settings page → "COD Enabled/Disabled" dropdown controls whether Cash on Delivery appears at checkout; Razorpay is available for online payments.
- **Per-item COD toggle**: Inventory Manager → each item row has a "COD" checkbox to set Cash on Delivery availability for that product before customers place orders.
- Checkout displays Cash on Delivery when it is enabled for every product in the cart, with Razorpay available for online payment.

## Product detail page

- Full-screen product view with an image gallery, MRP/discount (red text when `mrp` > `price`), size buttons when the product has a `sizes` array, selectable variant buttons, quantity controls, Add to Cart, and Buy Now.
- Buy Now flow: separate `mount-parche-direct-order` key → `order.html?direct=1`, skips regular cart, cleans up after order.

## Recent product and checkout improvements

- Inventory Manager supports adding multiple product images when creating a new item or editing an existing item.
- Products support MRP and sale price; the storefront displays the sale price, MRP, and calculated discount on product cards and the product detail page.
- Product details display the ₹21 online payment savings, a 7-day return policy, and Cash on Delivery availability when enabled for that product.
- Product variations use selectable option buttons, with a prominent selected-size label and compact size buttons.
- Added a full-size image preview with a close button, image thumbnails, synchronized previous/next controls and image counter, animated transitions, and touch swipe navigation for multi-image products.
- Updated the default product image preview to preserve the source image's proportions and show the full image without cropping.
- Added a ₹21 discount for online/Razorpay checkout; the server-calculated order and payment totals reflect the discount.
- Updated the checkout Place Order button behavior so it remains accessible beneath the order summary while scrolling.
- Added per-size stock counts in Inventory Manager; product pages cross out and disable sizes with zero stock, and orders check and deduct stock for the selected size.

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
- api/orders.js — server-authoritative pricing, paid-order validation, fulfilment actions (COD settings are configured before order placement).
- api/payment.js — Razorpay create-order and signature-verification endpoints.
- api/settings.js — store-wide settings (minOrderPrice, **codEnabled**).
- app.js, order.js, order.html, product.js, product.html — Mount Parche branding, product shop copy, checkout flow, **per-item COD visibility logic**.
- admin.html — **Admin Settings COD toggle + per-item COD checkbox in Inventory Manager**.
- images/mount-parche-logo.svg — new logo asset.
- package.json and package-lock.json — package branding.
- website_blueprint_prompt.md — updated project blueprint.


## Product color families

Inventory Manager can group separate product listings with a private color-family name (up to 80 characters) and assign each listing a buyer-facing color name (up to 40 characters). Product pages show clickable color choices with thumbnails; each choice opens its own product listing, preserving separate names, prices, sizes, stock, and checkout items. The private family name is used only to connect listings and is not displayed in storefront text.

## Product categories

Inventory Manager supports adding a custom category from the Add New Item form. Categories used by saved products are retained in inventory and appear as storefront category tabs.
