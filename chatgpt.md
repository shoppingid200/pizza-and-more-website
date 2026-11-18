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
- RAZORPAY_KEY_SECRET stays on the Vercel server and is never sent to the browser. Razorpay’s key ID is returned only when creating a checkout, which is required by Razorpay Checkout.
- Cash on Delivery remains available as an optional checkout method.

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

- api/catalog.js — shared Mount Parche catalog and Redis inventory namespace.
- api/inventory.js — generic product inventory API.
- api/orders.js — server-authoritative pricing, paid-order validation, and existing fulfilment actions.
- api/payment.js — Razorpay create-order and signature-verification endpoints.
- app.js, order.js, and HTML pages — Mount Parche branding, product shop copy, and checkout flow.
- images/mount-parche-logo.svg — new logo asset.
- package.json and package-lock.json — package branding.
- website_blueprint_prompt.md — updated project blueprint.
