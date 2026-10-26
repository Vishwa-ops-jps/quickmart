# QuickCart: quick-commerce website + mobile app

One React codebase for the website, installable PWA and Android/iOS apps, plus an Express + MongoDB API.

```
quickcart/
├─ server/   Express API + MongoDB (Mongoose), JWT login
└─ client/   React (Vite) storefront, PWA, Capacitor mobile wrapper
```

## 1. Run it locally
You need Node 18+ and MongoDB (local, or a free MongoDB Atlas cluster).

```bash
npm run setup                 # installs root, server and client packages
# edit server/.env  (MONGO_URI, JWT_SECRET)  — already created with local defaults
npm run seed                  # fills the database with 26 products
npm run dev                   # API on :5000, website on http://localhost:5173
```
Open http://localhost:5173, add items, create an account, place an order. Orders are stored in MongoDB.

## 2. Rename and recolour
- Name: set `VITE_BRAND` in `client/.env`, then change `appName` in `client/capacitor.config.json`, `name` in `client/public/manifest.webmanifest`, and `<title>` in `client/index.html`.
- Colours: the variables at the top of `client/src/styles.css` (`--brand`, `--accent`). Also update `theme_color` in the manifest and index.html.
- Icon: replace `client/public/icon.svg` (for store builds, generate PNG icons with `npx @capacitor/assets generate`).

## 3. Mobile app (Android / iOS)
The app is the same React build wrapped by Capacitor.
1. Deploy the API somewhere public (Render, Railway, Fly.io…) with MongoDB Atlas, and set `VITE_API_URL=https://your-api-url` in `client/.env`. A phone can't reach `localhost`.
2. Add your API URL's frontend origins to `CLIENT_URL` in the server env (`capacitor://localhost` and `http://localhost` are already included).
3. In `client/`:
```bash
npm run cap:add:android     # once (needs Android Studio)
npm run cap:android         # builds, syncs and opens Android Studio → Run
npm run cap:add:ios         # once (needs a Mac + Xcode)
npm run cap:ios
```
Also: after you deploy the website over HTTPS, users can install it as a PWA from the browser menu ("Add to Home screen").

## 4. API
| Method | Route | Auth | What it does |
|---|---|---|---|
| GET | /api/health | no | server + database status |
| GET | /api/products?category=&q= | no | list or search products |
| POST | /api/auth/register | no | `{name, phone, password}` → token |
| POST | /api/auth/login | no | `{phone, password}` → token |
| POST | /api/orders | yes | `{items:[{productId,qty}], address, paymentMethod}`; prices computed on the server |
| GET | /api/orders | yes | your orders |
| GET | /api/orders/:id | yes | one order with live status |

## 5. Not included yet (add next)
Real payments (Razorpay/Stripe), an admin panel to manage products and orders, real product photos (set `image` on a product), live delivery tracking, OTP login, push notifications.
The delivery tracker is a demo: status advances every 20 seconds (`server/config.js`).
