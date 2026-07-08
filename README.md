# TOMOC Store

Монгол хэл дээрх mobile-first e-commerce сайт. Next.js, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons болон Supabase ашиглана.

## Local development

```bash
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

## Content editing map

- Products, prices, benefits and image paths: `lib/products.ts`
- Delivery and payment wording: `lib/store-config.ts`
- Product image files: `public/products/`
- Messenger, WhatsApp, Facebook and email: `.env.local`, using `.env.example`

For real product photos, WebP or AVIF at 1200 × 1400 px and under 250 KB is recommended. Place each image in `public/products/`, then change only its `image` path in `lib/products.ts`.

## Supabase

For a new project, run `supabase/schema.sql` once in the Supabase SQL Editor, then apply every file in `supabase/migrations/` in filename order. The baseline creates the schema, RLS policies, five initial products, coupon, indexes, and the public `products` image bucket. The migrations add order audit history, policy hardening, transactional stock reservation, verified review moderation, duplicate-review protection, and wishlist indexes.

Add these variables locally and in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it in browser code or prefix it with `NEXT_PUBLIC_`.

Customer reviews are matched to the order number, phone, and purchased product, then held for admin moderation. Customer phone numbers are never returned in review responses. Logged-in wishlists use Supabase RLS; guest wishlists remain on the device and merge into the account after sign-in.

Cloudinary product uploads additionally require these server-only variables:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Analytics and consent

GA4 Ecommerce and Meta Pixel are loaded lazily only after the visitor accepts the analytics notice. Events pass through a shared PII filter and deduplication layer. Configure these public identifiers locally and in Vercel:

```env
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=
```

To create the first admin, register a user in Supabase Authentication, then run:

```sql
update public.profiles set role = 'admin' where id = '<AUTH_USER_UUID>';
```

Orders are created only in Supabase. Product prices and stock are validated inside one database transaction; successful orders reserve inventory before WhatsApp confirmation opens. If Supabase is unavailable, checkout preserves the cart and displays an error instead of creating an untracked local order.

## Vercel deployment

1. Push the project to GitHub, GitLab or Bitbucket.
2. Import the repository in Vercel.
3. Add every variable from `.env.example` under Project Settings → Environment Variables.
4. Set `NEXT_PUBLIC_SITE_URL` to the final Vercel or custom domain.
5. Deploy. The included `vercel.json` uses the Next.js production build.

The storefront can render before Supabase is connected by using the local development catalog. Checkout and production administration intentionally remain unavailable until Supabase is configured.

## Admin

The dashboard is available at `/admin`. With Supabase configured it requires authentication and verifies `profiles.role = 'admin'` on every admin API request. Admins can create, edit, delete, search, and hide products; upload up to eight product images; manage price and stock; view all orders; and update order status. Production admin is closed when Supabase is not configured.
