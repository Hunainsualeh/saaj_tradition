# Cartelle Mock Store — E-commerce Web App Updated


A production-style fashion e-commerce application built with **Next.js App Router**.
It includes a customer-facing storefront and an admin back office for managing products, blog content, and media.

## 🔗 Links

- **Storefront** — https://cartelle-mock-store.vercel.app
- **Admin** — https://cartelle-mock-store.vercel.app/admin
- **Storybook** — https://cartelle-mock-store-storybook.vercel.app/
- **Architecture Case Study (includes demo video)** — https://samhalsall.dev/cartelle-case-study

---

## ✨ Features

- 🏪 **Customer storefront** — home, shop, product details, cart, checkout, blog, about, and support pages
- 🛒 **Cart system with persistence** — cookie-backed cart ID, quantity guardrails, and server-side cart mutations
- 💳 **PayFast checkout flow** — hosted payment handoff (card/JazzCash/EasyPaisa), secure server-side token generation, and callback-driven order/payment updates
- 📦 **Inventory reservation logic** — stock is reserved during checkout and finalized on successful payment
- ⚙️ **Admin content management** — product, blog, and author management pages with create/edit routes
- 📚 **Component library documentation** — Storybook for isolated component development and UI review
- 🖼️ **Media pipeline** — product image uploads to Vercel Blob via API route
- 🔧 **Automated maintenance jobs** — scheduled cleanup for unused Blob assets and expired checkout carts
- ✨ **Responsive, animated UI** — Tailwind + Framer Motion across key storefront sections

---

## 🛠️ Tech Stack

| Area      | Choice                             | Notes                                                            |
| --------- | ---------------------------------- | ---------------------------------------------------------------- |
| Framework | Next.js 16 (App Router)            | React Compiler enabled; server components + route handlers       |
| Language  | TypeScript                         | Full-stack typing                                                |
| Styling   | Tailwind CSS 4                     | `tailwind-merge`, `tw-animate-css`                               |
| UI        | shadcn/ui + Radix primitives       | Form controls, dialogs, admin UI building blocks                 |
| Animation | Framer Motion                      | Section and component transitions                                |
| Forms     | react-hook-form + zod              | Checkout and admin form validation                               |
| Data      | Prisma ORM + PostgreSQL            | Products, sizes, carts, orders, blog posts, authors              |
| Payments  | PayFast                            | Hosted checkout handoff + callback-driven order/payment updates  |
| Storage   | Vercel Blob                        | Product/blog/author asset storage                                |
| Tables    | TanStack React Table               | Admin listing tables                                             |
| Tooling   | ESLint, Prettier, Storybook, Husky | Linting/formatting/component development and pre-commit workflow |

---

## 🧩 Key Implementations

For a deeper architecture walkthrough (including a demo video), see the case study:
https://samhalsall.dev/cartelle-case-study

### Cart + Checkout + Payment

Checkout is handled through server actions and payment gateway integration:

1. Customer adds items by product + size into a cookie-scoped cart
2. Server validates per-item and total cart quantity limits
3. Checkout initiation reserves stock (`stockReserved`) atomically in Prisma
4. A PayFast access token is generated server-side and posted to PayFast's hosted checkout
5. Frontend checkout runs a three-step flow (delivery, payment, summary)
6. PayFast callback finalizes order/payment status and decrements reserved stock

Core files:

```
src/lib/server/actions/cart-actions.ts
src/lib/server/actions/order-actions.ts
src/components/common/CheckoutForm/CheckoutForm.tsx
src/app/api/payment/payfast/return/route.ts
```

Environment variables required:

```
DATABASE_URL=
PAYFAST_MERCHANT_ID=
PAYFAST_SECURE_KEY=
PAYFAST_TOKEN_URL=
NEXT_PUBLIC_PAYFAST_POST_URL=
# Optional
# PAYFAST_RETURN_URL=
# PAYFAST_POST_EXTRA_FIELDS={"VERSION":"1.1"}
# PAYFAST_BASE_URL=              # PayFast API base URL — enables payment reconciliation cron
```

---

### Admin + Media Storage

The admin area supports product/blog/author content workflows and media uploads.

- Product images are uploaded through `POST /api/products/upload`
- Files are stored in Vercel Blob with resource-based path prefixes
- Scheduled Vercel crons remove orphaned assets and clear expired checkout carts

Core files:

```
src/app/admin/products/page.tsx
src/app/admin/blogs/page.tsx
src/app/admin/authors/page.tsx
src/app/api/products/upload/route.ts
src/app/api/cleanup-unused-images/route.ts
src/app/api/payment/cleanup-expired-carts/route.ts
vercel.json
```

Additional environment variables:

```
BLOB_READ_WRITE_TOKEN=
```

---

## 💻 Development

Install and run locally:

```
npm install
npm run dev
```

Database setup (first run):

```
npx prisma migrate dev
```

Optional local tooling:

```
npm run storybook
npm run lint
```

Create a `.env` (or `.env.local`) file in the project root:

```
DATABASE_URL=
PAYFAST_MERCHANT_ID=
PAYFAST_SECURE_KEY=
PAYFAST_TOKEN_URL=
NEXT_PUBLIC_PAYFAST_POST_URL=
BLOB_READ_WRITE_TOKEN=
DEMO_MODE=
```

---

## 🚀 Deployment

The app is configured for **Vercel** deployment.

- Pushes to `master` can be connected to automatic deployments
- Configure all runtime environment variables in Vercel Project Settings
- `vercel.json` includes scheduled maintenance jobs:
  - `0 2 * * *` → `/api/cleanup-unused-images`
  - `0 1 * * *` → `/api/payment/cleanup-expired-carts`

---

## 🔮 Future Improvements

- Add authentication for admin dashboard rather then using demo flag
- Add automated tests for server actions, webhook flows, and checkout steps
- Add observability around PayFast callbacks and background cleanup jobs
- Improve product recommendation logic on product detail pages

---
