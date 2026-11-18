# Mount Parche Store Blueprint

Mount Parche is an online shop for clothes, accessories, crockery, and other items.

- The storefront loads its product catalog from Upstash Redis through /api/inventory.
- The admin dashboard can add, edit, price, image, tag, stock, and activate any product category.
- Orders are stored in Upstash Redis through /api/orders.
- Razorpay is handled through /api/payment: amounts are calculated from the server-side inventory, and payment signatures are verified on the server before an online-paid order is saved.
- Secrets live only in Vercel environment variables. Do not add credentials to browser files, Git, or this document.

See chatgpt.md for the current environment-variable and deployment checklist.
