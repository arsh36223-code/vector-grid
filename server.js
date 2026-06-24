/* ============================================================
   Vector Grid — hardened backend (dropshipping-ready)
   - Verified Razorpay payments (signature checked server-side)
   - Captures EVERY order and emails you the shipping details
   - Per-product supplier + cost (kept private from customers)
   Secret keys + email creds live ONLY in environment variables.
   ============================================================ */

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const path = require("path");
const Razorpay = require("razorpay");
const { Pool } = require("pg");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(helmet({
  contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://checkout.razorpay.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://*.razorpay.com", "https://lumberjack.razorpay.com"],
    frameSrc: ["https://*.razorpay.com", "https://checkout.razorpay.com", "https://api.razorpay.com"],
    objectSrc: ["'none'"], baseUri: ["'self'"], formAction: ["'self'"], frameAncestors: ["'self'"],
    upgradeInsecureRequests: [],
  }},
  crossOriginEmbedderPolicy: false,
}));
// Product save can carry an uploaded (base64) image, so it needs a bigger body limit than the rest.
app.use("/api/admin/product-save", express.json({ limit: "4mb" }));
app.use(express.json({ limit: "10kb" }));
app.use("/api/", rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false }));
app.use(express.static(path.join(__dirname, "public")));

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
if (!KEY_ID || !KEY_SECRET) console.warn("⚠️  Razorpay keys not set — online payments disabled until set.");
const razorpay = (KEY_ID && KEY_SECRET) ? new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET }) : null;

// ---- Email (orders are sent to you, via Resend over HTTPS — works on Render) ----
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
// Sender: defaults to Resend's shared test address so it works before you own a domain.
const ORDER_FROM = process.env.ORDER_EMAIL_FROM || "Vector Grid <onboarding@resend.dev>";
if (!RESEND_API_KEY) console.warn("⚠️  No RESEND_API_KEY — orders will be logged to server logs only (no email).");
const ORDER_TO = process.env.ORDER_EMAIL_TO || "vectorgridsupport@gmail.com";
const SUPPLIER_TO = process.env.ORDER_EMAIL_SUPPLIER || "";

// ---- Database (stores orders so customers can track them) ----
const DB_URL = process.env.DATABASE_URL;
const DB_SSL = DB_URL && !/localhost|127\.0\.0\.1/.test(DB_URL);
const pool = DB_URL
  ? new Pool({ connectionString: DB_URL, ssl: DB_SSL ? { rejectUnauthorized: false } : false, max: 5 })
  : null;
if (!pool) console.warn("⚠️  No DATABASE_URL — order tracking is off until a database is connected.");

async function initDb() {
  if (!pool) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS orders (
    id text PRIMARY KEY,
    name text, phone text, email text,
    line1 text, line2 text, city text, state text, pincode text,
    items jsonb, subtotal int, shipping int, total int,
    paid boolean, payment_id text,
    status text DEFAULT 'Placed',
    tracking_url text, tracking_carrier text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  )`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS supply jsonb`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cod_fee int DEFAULT 0`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_confirmed boolean DEFAULT false`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirm_token text`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'none'`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS ip_affirmed boolean DEFAULT false`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_id_uniq ON orders(payment_id) WHERE payment_id IS NOT NULL`);
  await pool.query(`CREATE TABLE IF NOT EXISTS reviews (
    id bigserial PRIMARY KEY,
    product_id text NOT NULL,
    name text NOT NULL,
    rating int NOT NULL,
    comment text,
    hidden boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
  )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS reviews_product_idx ON reviews(product_id)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS support_messages (
    id bigserial PRIMARY KEY,
    order_id text NOT NULL,
    sender text NOT NULL,
    body text NOT NULL,
    seen_by_seller boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
  )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS support_order_idx ON support_messages(order_id)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS stock_notify (
    id serial PRIMARY KEY,
    product_id text,
    email text,
    created_at timestamptz DEFAULT now()
  )`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS stock_notify_uniq ON stock_notify(product_id,email)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS products (
    id text PRIMARY KEY,
    name text NOT NULL,
    price int NOT NULL,
    mrp int DEFAULT 0,
    stock int DEFAULT 0,
    img text,
    descr text,
    category text,
    cost int,
    supplier text,
    supplier_url text,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
  )`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes text`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS custom boolean DEFAULT false`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS styles text`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS style_costs text`);
  await pool.query(`CREATE TABLE IF NOT EXISTS order_designs (
    id serial PRIMARY KEY,
    order_id text,
    idx int,
    image text,
    notes text,
    created_at timestamptz DEFAULT now()
  )`);
  await seedProducts();
  // One-time demo clothing seed so the apparel + custom features are visible right after deploy,
  // with no manual steps. Guarded by a flag row: it runs once ever, and deleting the demos later
  // will NOT bring them back (even though the free-tier server restarts often).
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS app_flags (key text PRIMARY KEY, created_at timestamptz DEFAULT now())`);
    const flag = await pool.query("SELECT key FROM app_flags WHERE key='demo_clothing_seeded'");
    if (!flag.rows.length) {
      const demoIds = ["p10", "p11", "p12", "p13", "p14", "p15", "custom-tee"];
      let n = 0;
      for (const p of PRODUCTS.filter(pp => demoIds.includes(pp.id))) {
        const r = await pool.query(
          "INSERT INTO products (id,name,price,mrp,stock,img,descr,category,cost,supplier,supplier_url,sizes,styles,style_costs,custom,active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,true) ON CONFLICT (id) DO NOTHING RETURNING id",
          [p.id, p.name, p.price, p.mrp, p.stock, p.img, p.desc, p.category, p.cost, p.supplier, p.supplierUrl, p.sizes || null, p.styles || null, p.styleCosts || null, p.custom || false]
        );
        if (r.rows.length) n++;
      }
      await pool.query("INSERT INTO app_flags (key) VALUES ('demo_clothing_seeded') ON CONFLICT (key) DO NOTHING");
      console.log("Seeded " + n + " demo clothing product(s) (one-time).");
    }
    // One-time catalogue update: add the newer demo garments + apply final prices/styles (runs once; safe to re-edit after).
    const f3 = await pool.query("SELECT key FROM app_flags WHERE key='demo_catalog_v3'");
    if (!f3.rows.length) {
      for (const p of PRODUCTS.filter(pp => ["p12", "p13", "p14", "p15"].includes(pp.id))) {
        await pool.query(
          "INSERT INTO products (id,name,price,mrp,stock,img,descr,category,cost,supplier,supplier_url,sizes,styles,style_costs,custom,active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,true) ON CONFLICT (id) DO NOTHING",
          [p.id, p.name, p.price, p.mrp, p.stock, p.img, p.desc, p.category, p.cost, p.supplier, p.supplierUrl, p.sizes || null, p.styles || null, p.styleCosts || null, p.custom || false]
        );
      }
      await pool.query("UPDATE products SET name='Custom Print — Your Design', styles=$1, price=899, mrp=0 WHERE id='custom-tee'", ["Regular Tee:899, Full Sleeve Tee:999, Oversized Tee:1099, Sweatshirt:1399, Hoodie:1599, Oversized Hoodie:1899, Zip Hoodie:2099"]);
      await pool.query("UPDATE products SET price=1099, mrp=1599, cost=500 WHERE id='p10'");
      await pool.query("UPDATE products SET price=1599, mrp=2499, cost=740 WHERE id='p11'");
      await pool.query("INSERT INTO app_flags (key) VALUES ('demo_catalog_v3') ON CONFLICT (key) DO NOTHING");
      console.log("Applied demo catalogue update v3 (one-time).");
    }
    // One-time v4: accessory products + per-garment cost tracking on the custom product (runs once).
    const f4 = await pool.query("SELECT key FROM app_flags WHERE key='catalog_v4'");
    if (!f4.rows.length) {
      for (const p of PRODUCTS.filter(pp => ["p16", "p17", "p18", "p19", "p20"].includes(pp.id))) {
        await pool.query(
          "INSERT INTO products (id,name,price,mrp,stock,img,descr,category,cost,supplier,supplier_url,sizes,styles,style_costs,custom,active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,true) ON CONFLICT (id) DO NOTHING",
          [p.id, p.name, p.price, p.mrp, p.stock, p.img, p.desc, p.category, p.cost, p.supplier, p.supplierUrl, p.sizes || null, p.styles || null, p.styleCosts || null, p.custom || false]
        );
      }
      // Per-garment costs for the custom product — private, used only for your profit dashboard.
      await pool.query("UPDATE products SET style_costs=$1 WHERE id='custom-tee' AND (style_costs IS NULL OR style_costs='')", ["Regular Tee:420, Full Sleeve Tee:470, Oversized Tee:500, Sweatshirt:640, Hoodie:740, Oversized Hoodie:900, Zip Hoodie:1000"]);
      await pool.query("INSERT INTO app_flags (key) VALUES ('catalog_v4') ON CONFLICT (key) DO NOTHING");
      console.log("Applied catalogue update v4 (accessories + per-garment costs).");
    }
    // One-time v5: make the ceramic mug a customer-uploaded photo mug (prepaid custom product).
    const f5 = await pool.query("SELECT key FROM app_flags WHERE key='catalog_v5'");
    if (!f5.rows.length) {
      await pool.query(
        "UPDATE products SET name=$1, descr=$2, custom=true, supplier=$3 WHERE id='p16'",
        ["Custom Photo Mug — Your Design",
         "Your photo or design printed full-wrap on a glossy 11oz ceramic mug. Upload your image — microwave & dishwasher safe. Prepaid only.",
         "Qikink (custom print)"]
      );
      await pool.query("INSERT INTO app_flags (key) VALUES ('catalog_v5') ON CONFLICT (key) DO NOTHING");
      console.log("Applied catalogue update v5 (custom photo mug).");
    }
    // One-time v6: add the phone-model picker (stored in sizes) to the custom phone case.
    const f6 = await pool.query("SELECT key FROM app_flags WHERE key='catalog_v6'");
    if (!f6.rows.length) {
      await pool.query(
        "UPDATE products SET sizes=$1, descr=$2 WHERE id='p20'",
        [PHONE_MODELS,
         "Your photo or design on a durable anti-yellow clear case. Pick your phone model, upload your image — we print it and ship it to you. Prepaid only."]
      );
      await pool.query("INSERT INTO app_flags (key) VALUES ('catalog_v6') ON CONFLICT (key) DO NOTHING");
      console.log("Applied catalogue update v6 (phone case model picker).");
    }
  } catch (e) { console.error("demo seed failed:", e && e.message); }
  await refreshProductCache();
}
if (pool) initDb().then(() => console.log("Database ready.")).catch((e) => console.error("DB init failed:", e && e.message));

async function saveOrder(o) {
  if (!pool) return;
  const items = o.lineItems.map((li) => ({ name: li.name, qty: li.qty, price: li.price, size: li.size || "", style: li.style || "", color: li.color || "", custom: li.custom || false, notes: li.notes || "" }));
  const supply = o.lineItems.map((li) => ({ id: li.id, name: li.name, qty: li.qty, cost: li.cost, supplier: li.supplier, supplierUrl: li.supplierUrl }));
  const hasCustom = o.lineItems.some((li) => li.custom);
  await pool.query(
    `INSERT INTO orders (id,name,phone,email,line1,line2,city,state,pincode,items,subtotal,shipping,total,paid,payment_id,status,supply,cod_fee,confirm_token,review_status,ip_affirmed)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'Placed',$16,$17,$18,$19,$20) ON CONFLICT (id) DO NOTHING`,
    [o.id, o.customer.name, o.customer.phone, o.customer.email, o.customer.line1, o.customer.line2,
     o.customer.city, o.customer.state, o.customer.pincode, JSON.stringify(items),
     o.subtotal, o.shipping, o.total, o.paid, o.paymentId, JSON.stringify(supply), o.codFee || 0, o.confirmToken || null,
     hasCustom ? 'pending' : 'none', !!o.ipAffirmed]
  );
  // Persist any custom-design images in a side table (kept out of the orders row to keep order lists light).
  try {
    for (let i = 0; i < o.lineItems.length; i++) {
      const li = o.lineItems[i];
      if (li.custom && li.design && li.design.image) {
        await pool.query("INSERT INTO order_designs (order_id, idx, image, notes) VALUES ($1,$2,$3,$4)", [o.id, i, li.design.image, li.design.notes || ""]);
      }
    }
  } catch (e) { console.error("save design failed:", e && e.message); }
}

// ---- Seller admin auth (for updating order status) ----
const ADMIN_KEY = process.env.ADMIN_KEY || "";
if (!ADMIN_KEY) console.warn("⚠️  No ADMIN_KEY — the Manage Orders page is disabled until you set one.");
function adminOk(req) {
  const k = String((req.get && req.get("x-admin-key")) || (req.body && req.body.key) || (req.query && req.query.key) || "");
  if (!ADMIN_KEY || !k) return false;
  const a = Buffer.from(k), b = Buffer.from(ADMIN_KEY);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ============================================================
   YOUR PRODUCTS — the source of truth. Customers NEVER see
   `cost`, `supplier`, or `supplierUrl` (stripped before sending).
   For dropshipping (Option A): set supplier + where to order +
   your cost, so the order email tells you exactly what to do.
   ============================================================ */
// Phone models offered for the custom phone case. Trim/extend to match exactly what your
// POD supplier (Qikink) currently stocks — check your Qikink dashboard's phone-case model list.
const PHONE_MODELS = "iPhone 16 Pro Max,iPhone 16 Pro,iPhone 16 Plus,iPhone 16,iPhone 15 Pro Max,iPhone 15 Pro,iPhone 15 Plus,iPhone 15,iPhone 14 Pro Max,iPhone 14 Pro,iPhone 14 Plus,iPhone 14,iPhone 13 Pro Max,iPhone 13 Pro,iPhone 13,iPhone 13 mini,iPhone 12 Pro Max,iPhone 12 Pro,iPhone 12,iPhone 11 Pro Max,iPhone 11 Pro,iPhone 11,iPhone SE 2022,Samsung Galaxy S24 Ultra,Samsung Galaxy S24 Plus,Samsung Galaxy S24,Samsung Galaxy S23 Ultra,Samsung Galaxy S23,Samsung Galaxy S22,Samsung Galaxy A55,Samsung Galaxy A54,Samsung Galaxy A35,OnePlus 12,OnePlus 11,OnePlus Nord 3,Nothing Phone 2,Nothing Phone 2a,Google Pixel 8 Pro,Google Pixel 8";
// ── COURIER PICKUP ADDRESS ──────────────────────────────────────────────
// This is where the courier PICKS UP the parcel. For your dropship setup, set this to your
// SUPPLIER's address (the place that stores & packs your décor stock). Edit here, or override
// with env vars on Render (SHIP_PICKUP_*) so it stays out of your public repo.
const PICKUP = {
  name:    process.env.SHIP_PICKUP_NAME    || "Vector Grid",
  phone:   process.env.SHIP_PICKUP_PHONE   || "9999999999",       // ← put your supplier's real 10-digit phone
  email:   process.env.SHIP_PICKUP_EMAIL   || "orders@shopvectorgrid.com",
  line1:   process.env.SHIP_PICKUP_LINE1   || "Supplier warehouse, address line 1",
  line2:   process.env.SHIP_PICKUP_LINE2   || "",
  city:    process.env.SHIP_PICKUP_CITY    || "Haridwar",
  state:   process.env.SHIP_PICKUP_STATE   || "Uttarakhand",
  pincode: process.env.SHIP_PICKUP_PIN     || "249403",
};
const PRODUCTS = [
  { id: "p1", name: "Minimalist Steel Water Bottle", price: 549, mrp: 899, stock: 42, category: "Drinkware",
    img: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80",
    desc: "Insulated 750ml bottle. Keeps cold 24h, hot 12h.",
    cost: 320, supplier: "BaapStore", supplierUrl: "https://supplier.example.com/steel-bottle" },
  { id: "p2", name: "Linen Cushion Cover (Set of 2)", price: 699, mrp: 1199, stock: 30, category: "Home",
    img: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&q=80",
    desc: "16x16 inch, washed linen, hidden zip.",
    cost: 410, supplier: "vFulfill", supplierUrl: "https://supplier.example.com/linen-cushion" },
  { id: "p3", name: "Wireless Earbuds — Bass Edition", price: 1299, mrp: 2499, stock: 12, category: "Audio",
    img: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&q=80",
    desc: "ENC mic, 40h playback, IPX5.",
    cost: 740, supplier: "Ekomn", supplierUrl: "https://supplier.example.com/earbuds" },
  { id: "p4", name: "Stoneware Coffee Mug (350ml)", price: 399, mrp: 649, stock: 60, category: "Drinkware",
    img: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80",
    desc: "Hand-glazed ceramic mug, microwave safe.",
    cost: 190, supplier: "Qikink", supplierUrl: "https://supplier.example.com/mug" },
  { id: "p5", name: "Woven Seagrass Storage Basket", price: 849, mrp: 1499, stock: 18, category: "Home",
    img: "https://images.unsplash.com/photo-1595408076683-d0d8d5e8e0e9?w=600&q=80",
    desc: "Handwoven basket with handles. 30cm.",
    cost: 520, supplier: "vFulfill", supplierUrl: "https://supplier.example.com/basket" },
  { id: "p6", name: "Portable Bluetooth Speaker", price: 1599, mrp: 2999, stock: 9, category: "Audio",
    img: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80",
    desc: "12h playtime, deep bass, IPX6 splash-proof.",
    cost: 980, supplier: "Ekomn", supplierUrl: "https://supplier.example.com/speaker" },
  { id: "p7", name: "Heavy Canvas Tote Bag", price: 449, mrp: 799, stock: 75, category: "Accessories",
    img: "https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?w=600&q=80",
    desc: "12oz cotton canvas, roomy, everyday carry.",
    cost: 230, supplier: "Qikink", supplierUrl: "https://supplier.example.com/tote" },
  { id: "p8", name: "Adjustable LED Desk Lamp", price: 1099, mrp: 1899, stock: 22, category: "Tech",
    img: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80",
    desc: "3 light modes, touch dimmer, USB-powered.",
    cost: 640, supplier: "BaapStore", supplierUrl: "https://supplier.example.com/lamp" },
  { id: "p9", name: "Cotton Bath Towel (Pack of 2)", price: 749, mrp: 1299, stock: 0, category: "Home",
    img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
    desc: "500 GSM, quick-dry, soft combed cotton.",
    cost: 430, supplier: "vFulfill", supplierUrl: "https://supplier.example.com/towel" },
  { id: "p10", name: "Oversized Graphic Tee — Drop 01", price: 1099, mrp: 1599, stock: 100, category: "Clothing",
    img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
    desc: "240 GSM oversized cotton tee, DTF print. Unisex.",
    sizes: "S,M,L,XL,XXL",
    cost: 500, supplier: "Qikink", supplierUrl: "https://qikink.com" },
  { id: "p11", name: "Heavyweight Hoodie — Night Edition", price: 1599, mrp: 2499, stock: 100, category: "Clothing",
    img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80",
    desc: "300 GSM fleece hoodie, soft brushed inside. Unisex.",
    sizes: "S,M,L,XL,XXL",
    cost: 740, supplier: "Qikink", supplierUrl: "https://qikink.com" },
  { id: "p12", name: "Classic Graphic Tee", price: 899, mrp: 1499, stock: 100, category: "Clothing",
    img: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80",
    desc: "180 GSM regular-fit cotton tee, DTF print. Unisex.",
    sizes: "S,M,L,XL,XXL",
    cost: 420, supplier: "Qikink", supplierUrl: "https://qikink.com" },
  { id: "p13", name: "Full Sleeve Tee — Mono", price: 999, mrp: 1599, stock: 100, category: "Clothing",
    img: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80",
    desc: "180 GSM full-sleeve cotton tee, DTF print. Unisex.",
    sizes: "S,M,L,XL,XXL",
    cost: 470, supplier: "Qikink", supplierUrl: "https://qikink.com" },
  { id: "p14", name: "Graphic Sweatshirt", price: 1399, mrp: 2199, stock: 100, category: "Clothing",
    img: "https://images.unsplash.com/photo-1572495641004-28421ae29ed4?w=600&q=80",
    desc: "300 GSM fleece sweatshirt, ribbed cuffs. Unisex.",
    sizes: "S,M,L,XL,XXL",
    cost: 640, supplier: "Qikink", supplierUrl: "https://qikink.com" },
  { id: "p15", name: "Oversized Hoodie — Heavy 400", price: 1899, mrp: 2999, stock: 100, category: "Clothing",
    img: "https://images.unsplash.com/photo-1565693413579-8a73ffa8de15?w=600&q=80",
    desc: "400 GSM heavyweight oversized hoodie, drop shoulder. Unisex.",
    sizes: "S,M,L,XL,XXL",
    cost: 900, supplier: "Qikink", supplierUrl: "https://qikink.com" },
  { id: "custom-tee", name: "Custom Print — Your Design", price: 899, mrp: 0, stock: 100, category: "Custom",
    img: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80",
    desc: "Your design, printed on the garment of your choice. Pick a style, upload your image and choose a size — we print it and ship it to you. Prepaid only.",
    sizes: "S,M,L,XL,XXL", styles: "Regular Tee:899, Full Sleeve Tee:999, Oversized Tee:1099, Sweatshirt:1399, Hoodie:1599, Oversized Hoodie:1899, Zip Hoodie:2099",
    styleCosts: "Regular Tee:420, Full Sleeve Tee:470, Oversized Tee:500, Sweatshirt:640, Hoodie:740, Oversized Hoodie:900, Zip Hoodie:1000", custom: true,
    cost: 420, supplier: "Qikink (custom print)", supplierUrl: "https://qikink.com" },
  // ---- Accessories (Qikink print-on-demand; cost = landed estimate incl. print + shipping + GST) ----
  { id: "p16", name: "Custom Photo Mug — Your Design", price: 449, mrp: 699, stock: 100, category: "Accessories",
    img: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80",
    desc: "Your photo or design printed full-wrap on a glossy 11oz ceramic mug. Upload your image — microwave & dishwasher safe. Prepaid only.",
    custom: true,
    cost: 210, supplier: "Qikink (custom print)", supplierUrl: "https://qikink.com" },
  { id: "p17", name: "All-Over Print Tote Bag", price: 599, mrp: 999, stock: 100, category: "Accessories",
    img: "https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?w=600&q=80",
    desc: "Roomy cotton tote with an edge-to-edge printed design. Everyday carry, sturdy handles.",
    cost: 290, supplier: "Qikink", supplierUrl: "https://qikink.com" },
  { id: "p18", name: "Classic Embroidered Cap", price: 699, mrp: 1099, stock: 100, category: "Accessories",
    img: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80",
    desc: "Structured 6-panel baseball cap with neat embroidery. Adjustable strap, one size fits most.",
    cost: 350, supplier: "Qikink", supplierUrl: "https://qikink.com" },
  { id: "p19", name: "Insulated Steel Water Bottle (750ml)", price: 849, mrp: 1399, stock: 100, category: "Accessories",
    img: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80",
    desc: "Double-wall stainless steel bottle with a printed design. Keeps cold 24h, hot 12h.",
    cost: 420, supplier: "Qikink", supplierUrl: "https://qikink.com" },
  { id: "p20", name: "Custom Phone Case — Your Design", price: 699, mrp: 1199, stock: 100, category: "Accessories",
    img: "https://images.unsplash.com/photo-1601593346740-925612772716?w=600&q=80",
    desc: "Your photo or design on a durable anti-yellow clear case. Pick your phone model, upload your image — we print it and ship it to you. Prepaid only.",
    custom: true, sizes: PHONE_MODELS,
    cost: 310, supplier: "Qikink (custom print)", supplierUrl: "https://qikink.com" },
];

const rupee = (n) => "Rs." + Number(n || 0).toLocaleString("en-IN");
const parseSizesList = (s) => (typeof s === "string" ? s.split(",").map(x => x.trim()).filter(Boolean) : (Array.isArray(s) ? s.filter(Boolean) : []));
// Garment styles for custom products: "Regular Tee:799, Hoodie:1399" -> [{label,price}]; labels sanitized, price positive int.
const parseStylesList = (s) => (typeof s === "string" ? s.split(",").map(part => { const i = part.lastIndexOf(":"); if (i < 0) return null; const label = part.slice(0, i).trim().replace(/[^a-zA-Z0-9 +/&'\-]/g, "").slice(0, 40); const price = parseInt(part.slice(i + 1).trim(), 10); if (!label || !(price > 0) || price > 1000000) return null; return { label, price }; }).filter(Boolean) : []);
const shippingFor = (s) => s === 0 ? 0 : (s >= 999 ? 0 : 49);
// Cash-on-Delivery fee (₹). COD costs more (courier COD charges + higher return rate).
// Set to 0 to disable. Change this number to adjust the fee.
const COD_FEE = 0; // Cash-on-Delivery fee (₹). Set to 0 = no COD fee. Change to re-enable.
const COD_MAX = 2000; // Cash on Delivery is only allowed for orders up to this total (₹). Must match client.

// In-memory product cache (trusted source for pricing). Falls back to the constant above.
let productCache = PRODUCTS.slice();
async function seedProducts() {
  if (!pool) return;
  try {
    const c = await pool.query("SELECT COUNT(*)::int AS n FROM products");
    if (c.rows[0].n === 0) {
      for (const p of PRODUCTS) {
        await pool.query(
          "INSERT INTO products (id,name,price,mrp,stock,img,descr,category,cost,supplier,supplier_url,sizes,styles,style_costs,custom,active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,true) ON CONFLICT (id) DO NOTHING",
          [p.id, p.name, p.price, p.mrp, p.stock, p.img, p.desc, p.category, p.cost, p.supplier, p.supplierUrl, p.sizes || null, p.styles || null, p.styleCosts || null, p.custom || false]
        );
      }
      console.log("Seeded products table with starter products.");
    }
  } catch (e) { console.error("seedProducts failed:", e && e.message); }
}
async function refreshProductCache() {
  if (!pool) { productCache = PRODUCTS.slice(); return; }
  try {
    const r = await pool.query("SELECT id,name,price,mrp,stock,img,descr,category,cost,supplier,supplier_url,sizes,styles,style_costs,custom,active FROM products ORDER BY created_at ASC");
    if (r.rows.length) {
      productCache = r.rows.map(row => ({ id: row.id, name: row.name, price: row.price, mrp: row.mrp, stock: row.stock,
        img: row.img, desc: row.descr, category: row.category, cost: row.cost, supplier: row.supplier, supplierUrl: row.supplier_url, sizes: row.sizes, styles: row.styles, styleCosts: row.style_costs, custom: row.custom, active: row.active }));
    } else { productCache = PRODUCTS.slice(); }
  } catch (e) { console.error("product cache refresh failed:", e && e.message); }
}

// Compute an order from item ids+qty using TRUSTED server prices
function computeOrder(items, cod, requireDesign) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) return { error: "Invalid cart" };
  const lineItems = []; let subtotal = 0, totalCost = 0;
  const qtyById = {};
  for (const it of items) {
    if (!it || typeof it.id !== "string") return { error: "Invalid item" };
    const qty = Number.isInteger(it.qty) ? it.qty : parseInt(it.qty, 10);
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) return { error: "Invalid quantity" };
    const p = productCache.find(pp => pp.id === it.id);
    if (!p || p.active === false) return { error: "Unknown product" };
    if (typeof p.stock === "number" && p.stock <= 0) return { error: `"${p.name}" is out of stock.` };
    // Guard against oversell when the same product appears as several lines (different sizes / custom designs).
    qtyById[p.id] = (qtyById[p.id] || 0) + qty;
    if (typeof p.stock === "number" && qtyById[p.id] > p.stock) return { error: `Only ${p.stock} of "${p.name}" left in stock.` };
    const opts = parseSizesList(p.sizes);
    let size = it.size != null ? String(it.size).trim().slice(0, 40) : "";
    if (opts.length) {
      if (!size) return { error: `Please choose a size for "${p.name}".` };
      if (!opts.includes(size)) return { error: `"${size}" isn't an available size for "${p.name}".` };
    } else { size = ""; }
    const isCustom = p.custom === true;
    const styleList = isCustom ? parseStylesList(p.styles) : [];
    let unitPrice = p.price;
    let unitCost = (typeof p.cost === "number") ? p.cost : 0;
    let style = "";
    if (styleList.length) {
      style = it.style != null ? String(it.style).trim().slice(0, 40) : "";
      const match = styleList.find(s => s.label === style);
      if (!style || !match) return { error: `Please choose a style for "${p.name}".` };
      unitPrice = match.price;
      // Per-garment cost (private; used only for your profit reporting). Falls back to the base cost.
      const cm = parseStylesList(p.styleCosts).find(s => s.label === style);
      if (cm) unitCost = cm.price;
    }
    let design = null;
    if (isCustom) {
      const d = it.design || {};
      const img = typeof d.image === "string" ? d.image : "";
      if (requireDesign) {
        if (!img || !/^data:image\//.test(img)) return { error: `Please upload your design image for "${p.name}".` };
        if (img.length > 9000000) return { error: "Your design image is too large. Please use an image under ~6 MB." };
      }
      design = { image: img, notes: typeof d.notes === "string" ? d.notes.trim().slice(0, 500) : "" };
    }
    const color = (isCustom && it.color != null) ? String(it.color).trim().slice(0, 40) : "";
    subtotal += unitPrice * qty;
    totalCost += unitCost * qty;
    lineItems.push({ id: p.id, name: p.name, price: unitPrice, qty, size, style, color, custom: isCustom, notes: design ? design.notes : "", design, cost: unitCost, supplier: p.supplier, supplierUrl: p.supplierUrl });
  }
  const shipping = shippingFor(subtotal);
  const codFee = cod === true ? COD_FEE : 0;
  return { lineItems, subtotal, shipping, codFee, total: subtotal + shipping + codFee, totalCost };
}

function sanitizeCustomer(c) {
  c = c || {};
  const s = (v, n) => String(v == null ? "" : v).trim().slice(0, n);
  const out = {
    name: s(c.name, 80), phone: s(c.phone, 10), email: s(c.email, 120),
    line1: s(c.line1, 120), line2: s(c.line2, 120), city: s(c.city, 60),
    state: s(c.state, 60), pincode: s(c.pincode, 6),
  };
  if (!out.name) return { error: "Name required" };
  if (!/^[6-9]\d{9}$/.test(out.phone)) return { error: "Invalid phone" };
  if (!out.line1) return { error: "Address required" };
  if (!out.city) return { error: "City required" };
  if (!/^\d{6}$/.test(out.pincode)) return { error: "Invalid pincode" };
  return out;
}

async function notifyOrder(order) {
  const c = order.customer;
  const lines = order.lineItems.map((li, i) =>
    li.custom
      ? `- ${li.name}  x${li.qty}  [CUSTOM${li.style ? ": " + li.style.toUpperCase() : ""}${li.color ? ", " + li.color : ""}${li.size ? ", " + li.size : ""}]\n    sell ${rupee(li.price)} | your cost ${li.cost != null ? rupee(li.cost) : "-"} | print at: ${li.supplier || "-"}${li.supplierUrl ? "\n    order from: " + li.supplierUrl : ""}\n    >> customer's design attached as design-${order.id}-${i}.jpg${li.notes ? "\n    instructions: " + li.notes : ""}`
      : `- ${li.name}${li.style ? "  [" + li.style + "]" : ""}${li.size ? "  [size: " + li.size + "]" : ""}  x${li.qty}\n    sell ${rupee(li.price)} | your cost ${li.cost != null ? rupee(li.cost) : "-"} | supplier: ${li.supplier || "-"}${li.supplierUrl ? "\n    order from: " + li.supplierUrl : ""}`
  ).join("\n");
  // Build email attachments from any custom-design images.
  const attachments = [];
  order.lineItems.forEach((li, i) => {
    if (li.custom && li.design && li.design.image) {
      const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/.exec(li.design.image);
      if (m) {
        const ext = m[1].split("/")[1].replace("jpeg", "jpg");
        attachments.push({ filename: `design-${order.id}-${i}.${ext}`, content: m[2] });
      }
    }
  });
  const margin = (order.totalCost != null && order.totalCost > 0) ? rupee(order.total - order.shipping - (order.codFee || 0) - order.totalCost) : "n/a";
  const body = [
    `NEW ORDER ${order.id}  —  ${order.paid ? "PAID ONLINE" : "COD (collect on delivery)"}`,
    order.paymentId ? `Razorpay payment id: ${order.paymentId}` : "",
    order.lineItems.some(li => li.custom) ? "** CUSTOM DESIGN: review the attached artwork for copyright/trademark before printing. Approve it in Manage Orders first. **" : "",
    "",
    "ITEMS TO SOURCE & SHIP:",
    lines,
    "",
    `Revenue ${rupee(order.total)}${order.codFee ? " (incl. COD fee " + rupee(order.codFee) + ")" : ""}  |  Your cost ${order.totalCost != null ? rupee(order.totalCost) : "n/a"}  |  Margin ${margin}`,
    "",
    "SHIP TO:",
    c.name,
    c.line1 + (c.line2 ? ", " + c.line2 : ""),
    `${c.city}, ${c.state} - ${c.pincode}`,
    `Phone ${c.phone}` + (c.email ? ` | Email ${c.email}` : ""),
    "",
    attachments.length ? "Custom order: download the attached design, make the print-ready artwork, then place the order at your print supplier to this address." : "Next step: place this order with the supplier(s) above and have them ship to the address.",
  ].filter(x => x !== "").join("\n");

  console.log("==== ORDER ====\n" + body + "\n===============");  // backup record in server logs
  if (!RESEND_API_KEY || !ORDER_TO) return;
  const to = [ORDER_TO, SUPPLIER_TO].filter(Boolean);
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": "Bearer " + RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: ORDER_FROM,
      to,
      subject: `New order ${order.id} — ${order.paid ? "PAID" : "COD"} — ${rupee(order.total)}`,
      text: body,
      ...(attachments.length ? { attachments } : {}),
    }),
  });
  if (!resp.ok) throw new Error("Resend " + resp.status + ": " + (await resp.text()).slice(0, 200));
}

// Branded HTML wrapper for customer emails (logo header + footer)
const INSTAGRAM_URL = process.env.INSTAGRAM_URL || "https://instagram.com/shopvectorgrid";
const INSTAGRAM_HANDLE = "@shopvectorgrid";
function emailHeader() {
  const site = process.env.SITE_URL || "https://shopvectorgrid.com";
  return `<div style="text-align:center;padding:6px 0 18px">
    <a href="${site}"><img src="${site}/email-logo.png" alt="Vector Grid" width="180" style="display:inline-block;width:180px;max-width:60%;height:auto;border:0" /></a>
  </div>`;
}
function emailFooter() {
  const site = process.env.SITE_URL || "https://shopvectorgrid.com";
  return `<div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #e6e2da">
    <p style="margin:0 0 10px"><a href="${INSTAGRAM_URL}" style="color:#E8820C;text-decoration:none;font-size:13px;font-weight:bold">📸 Follow us on Instagram ${INSTAGRAM_HANDLE}</a></p>
    <p style="color:#aaa;font-size:12px;margin:0;line-height:1.6">Vector Grid · Ships pan-India<br/><a href="${site}" style="color:#E8820C;text-decoration:none">${site.replace(/^https?:\/\//,"")}</a></p>
  </div>`;
}
function emailShell(innerHtml) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:540px;margin:0 auto;padding:16px;background:#ffffff">${emailHeader()}${innerHtml}${emailFooter()}</div>`;
}

// Sent when an order is marked Delivered: invites the customer to rate what they received.
async function notifyReviewRequest(orderRow) {
  if (!RESEND_API_KEY || !orderRow || !orderRow.email) return;
  const site = process.env.SITE_URL || "https://shopvectorgrid.com";
  const eh = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  let supply = [];
  try { supply = Array.isArray(orderRow.supply) ? orderRow.supply : JSON.parse(orderRow.supply || "[]"); } catch (e) { supply = []; }
  const seen = new Set(); const prods = [];
  for (const s of supply) { if (s && s.id && !seen.has(s.id)) { seen.add(s.id); prods.push({ id: s.id, name: s.name }); } }
  if (!prods.length) return;
  const rateLink = (p) => `${site}/?p=${encodeURIComponent(p.id)}`;
  const textList = prods.map(p => `- ${p.name}: ${rateLink(p)}`).join("\n");
  const body = [
    `Hi ${orderRow.name || "there"},`,
    "",
    `Your order ${orderRow.id} has been delivered — we hope you love it!`,
    "",
    "Would you take 30 seconds to rate what you received? It really helps us and other shoppers:",
    "",
    textList,
    "",
    `Love it? Follow us on Instagram for new drops and offers: ${INSTAGRAM_URL}`,
    "",
    "Thank you for shopping with Vector Grid!",
    "— Team Vector Grid",
  ].join("\n");
  const itemsHtml = prods.map(p => `<tr><td style="padding:9px 0;color:#444;font-size:14px">${eh(p.name)}</td><td style="padding:9px 0;text-align:right"><a href="${rateLink(p)}" style="background:#E8820C;color:#fff;text-decoration:none;font-weight:bold;font-size:13px;padding:8px 16px;border-radius:999px;display:inline-block">★ Rate this</a></td></tr>`).join("");
  const html = emailShell(`
    <h2 style="color:#111;margin:0 0 6px">How was your order, ${eh(orderRow.name || "")}?</h2>
    <p style="color:#555;line-height:1.5;margin:0 0 18px">Your order <strong>${eh(orderRow.id)}</strong> has been delivered — we hope you love it! Could you take 30 seconds to rate what you received? It really helps us keep improving.</p>
    <table style="width:100%;border-collapse:collapse">${itemsHtml}</table>
    <div style="text-align:center;margin:26px 0 0">
      <a href="${INSTAGRAM_URL}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 24px;border-radius:999px">📸 Follow ${INSTAGRAM_HANDLE} for new drops</a>
    </div>`);
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": "Bearer " + RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ from: ORDER_FROM, to: [orderRow.email], reply_to: ORDER_TO, subject: `How was your Vector Grid order ${orderRow.id}? Rate it ★`, text: body, html }),
  });
  if (!resp.ok) throw new Error("Resend " + resp.status + ": " + (await resp.text()).slice(0, 200));
}
// Email everyone waiting for a product that just came back in stock, then clear the list.
async function notifyRestock(productId, productName) {
  if (!pool || !RESEND_API_KEY) return;
  const site = process.env.SITE_URL || "https://shopvectorgrid.com";
  const r = await pool.query("SELECT email FROM stock_notify WHERE product_id=$1", [productId]);
  if (!r.rows.length) return;
  const eh = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  for (const row of r.rows) {
    const html = emailShell(`<h2 style="color:#111;margin:0 0 10px">Good news — it's back! 🎉</h2>
      <p style="color:#555;line-height:1.6;margin:0 0 18px"><strong>${eh(productName)}</strong> is back in stock at Vector Grid. Grab it before it sells out again!</p>
      <div style="text-align:center;margin:20px 0"><a href="${site}" style="display:inline-block;background:#E8820C;color:#fff;text-decoration:none;font-weight:bold;font-size:16px;padding:13px 28px;border-radius:999px">Shop now</a></div>`);
    try {
      await sendMail(row.email, `${productName} is back in stock!`, `Good news! ${productName} is back in stock at Vector Grid. Shop now: ${site}`, ORDER_TO, html);
    } catch (e) { console.error("restock mail failed:", e && e.message); }
  }
  await pool.query("DELETE FROM stock_notify WHERE product_id=$1", [productId]);
}

// Send the BUYER a friendly email asking them to CONFIRM the order (click-to-confirm)
async function notifyBuyer(order) {
  const c = order.customer;
  if (!RESEND_API_KEY || !c.email) return;
  const site = process.env.SITE_URL || "https://vector-grid.onrender.com";
  const confirmUrl = `${site}/api/confirm?o=${encodeURIComponent(order.id)}&t=${encodeURIComponent(order.confirmToken || "")}`;
  const eh = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const items = order.lineItems.map(li => `- ${li.name} x${li.qty} — ${rupee(li.price * li.qty)}`).join("\n");
  const body = [
    `Hi ${c.name},`,
    "",
    "Thanks for your order with Vector Grid! We've received it and just need you to confirm you're ready to receive it before we ship.",
    "",
    `>> CONFIRM YOUR ORDER: ${confirmUrl}`,
    "",
    `Order ID: ${order.id}`,
    `Payment: ${order.paid ? "Paid online" : "Cash on Delivery"}`,
    "",
    "Items:",
    items,
    "",
    `Subtotal: ${rupee(order.subtotal)}`,
    `Shipping: ${order.shipping === 0 ? "Free" : rupee(order.shipping)}`,
    ...(order.codFee ? [`COD fee: ${rupee(order.codFee)}`] : []),
    `Total: ${rupee(order.total)}${order.paid ? "" : " (pay on delivery)"}`,
    "",
    "Delivering to:",
    c.line1 + (c.line2 ? ", " + c.line2 : ""),
    `${c.city}, ${c.state} - ${c.pincode}`,
    "",
    "Once you confirm, we'll pack and ship your order. You can track it anytime:",
    `Go to ${site} → "Track order" → enter Order ID ${order.id} and phone ${c.phone}`,
    "",
    "Questions? Just reply to this email.",
    "",
    "— Team Vector Grid",
  ].join("\n");
  const itemsHtml = order.lineItems.map(li => `<tr><td style="padding:4px 0;color:#444">${eh(li.name)} × ${li.qty}</td><td style="padding:4px 0;text-align:right;color:#111">${rupee(li.price * li.qty)}</td></tr>`).join("");
  const html = emailShell(`
    <h2 style="color:#111;margin:0 0 6px">Hi ${eh(c.name)}, please confirm your order</h2>
    <p style="color:#555;line-height:1.5;margin:0 0 18px">Thanks for your order with <strong>Vector Grid</strong>! We've received it and just need you to confirm you're ready to receive it before we ship.</p>
    <div style="text-align:center;margin:22px 0">
      <a href="${confirmUrl}" style="display:inline-block;background:#E8820C;color:#fff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 30px;border-radius:999px">✅ Yes, confirm my order</a>
    </div>
    <p style="color:#888;font-size:12px;text-align:center;margin:0 0 22px">If the button doesn't work, copy this link:<br>${confirmUrl}</p>
    <div style="background:#f6f4f0;border-radius:10px;padding:16px">
      <p style="margin:0 0 8px;color:#111;font-weight:bold">Order ${eh(order.id)} — ${order.paid ? "Paid online" : "Cash on Delivery"}</p>
      <table style="width:100%;font-size:14px;border-collapse:collapse">${itemsHtml}
        <tr><td style="padding-top:8px;color:#555;border-top:1px solid #ddd">Total</td><td style="padding-top:8px;text-align:right;font-weight:bold;border-top:1px solid #ddd">${rupee(order.total)}${order.paid ? "" : " (pay on delivery)"}</td></tr>
      </table>
      <p style="margin:12px 0 0;color:#555;font-size:13px">Delivering to: ${eh(c.line1)}${c.line2 ? ", " + eh(c.line2) : ""}, ${eh(c.city)}, ${eh(c.state)} - ${eh(c.pincode)}</p>
    </div>
    <p style="color:#888;font-size:13px;line-height:1.5;margin:18px 0 0">Once you confirm, we'll pack and ship your order. Track anytime at <a href="${site}" style="color:#E8820C">${site.replace(/^https?:\/\//,"")}</a> using Order ID ${eh(order.id)} and your phone number.</p>`);
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": "Bearer " + RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: ORDER_FROM,
      to: [c.email],
      reply_to: ORDER_TO,
      subject: `Please confirm your Vector Grid order ${order.id}`,
      text: body,
      html: html,
    }),
  });
  if (!resp.ok) throw new Error("Resend(buyer) " + resp.status + ": " + (await resp.text()).slice(0, 200));
}

// Public catalogue (cost/supplier stripped out)
app.get("/api/products", async (req, res) => {
  const list = (productCache && productCache.length ? productCache : PRODUCTS).filter(p => p.active !== false);
  const base = list.map(({ id, name, price, mrp, stock, img, desc, category, sizes, styles, custom }) => ({ id, name, price, mrp, stock, img, desc, category, sizes: sizes || "", styles: styles || "", custom: custom === true, rating: 0, reviewCount: 0 }));
  if (pool) {
    try {
      const r = await pool.query("SELECT product_id, ROUND(AVG(rating)::numeric,1) AS avg, COUNT(*) AS cnt FROM reviews WHERE hidden=false GROUP BY product_id");
      const map = {};
      r.rows.forEach(row => { map[row.product_id] = { rating: Number(row.avg), reviewCount: Number(row.cnt) }; });
      base.forEach(p => { if (map[p.id]) { p.rating = map[p.id].rating; p.reviewCount = map[p.id].reviewCount; } });
    } catch (e) { console.error("ratings join failed:", e && e.message); }
  }
  res.json(base);
});

// ---- Reviews: list for a product ----
app.get("/api/reviews", async (req, res) => {
  if (!pool) return res.json({ reviews: [] });
  const pid = String(req.query.product || "").trim().slice(0, 40);
  if (!pid) return res.status(400).json({ error: "Missing product." });
  try {
    const r = await pool.query("SELECT id,name,rating,comment,created_at FROM reviews WHERE product_id=$1 AND hidden=false ORDER BY created_at DESC LIMIT 100", [pid]);
    res.json({ reviews: r.rows });
  } catch (e) { console.error("reviews list failed:", e && e.message); res.status(500).json({ error: "Could not load reviews." }); }
});

// ---- Reviews: submit one ----
app.post("/api/reviews", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Reviews aren't available right now." });
  const b = req.body || {};
  const pid = String(b.productId || "").trim().slice(0, 40);
  const name = String(b.name || "").trim().slice(0, 60);
  const rating = Math.round(Number(b.rating) || 0);
  const comment = String(b.comment || "").trim().slice(0, 600);
  if (!(productCache.some(p => p.id === pid) || PRODUCTS.some(p => p.id === pid))) return res.status(400).json({ error: "Unknown product." });
  if (!name) return res.status(400).json({ error: "Please add your name." });
  if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ error: "Please pick a rating from 1 to 5 stars." });
  try {
    await pool.query("INSERT INTO reviews (product_id,name,rating,comment) VALUES ($1,$2,$3,$4)", [pid, name, rating, comment]);
    res.json({ ok: true, message: "Thanks for your review!" });
  } catch (e) { console.error("review insert failed:", e && e.message); res.status(500).json({ error: "Couldn't save your review. Please try again." }); }
});

// ---- Reviews: seller list + delete (admin) ----
app.get("/api/admin/reviews", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database not connected." });
  if (!adminOk(req)) return res.status(401).json({ error: "Wrong admin key." });
  try {
    const r = await pool.query("SELECT id,product_id,name,rating,comment,hidden,created_at FROM reviews ORDER BY created_at DESC LIMIT 200");
    res.json({ reviews: r.rows });
  } catch (e) { console.error("admin reviews failed:", e && e.message); res.status(500).json({ error: "Could not load reviews." }); }
});
app.post("/api/admin/review-delete", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database not connected." });
  if (!adminOk(req)) return res.status(401).json({ error: "Wrong admin key." });
  const rid = Math.round(Number((req.body && req.body.id) || 0));
  if (!rid) return res.status(400).json({ error: "Missing review id." });
  try {
    await pool.query("DELETE FROM reviews WHERE id=$1", [rid]);
    res.json({ ok: true });
  } catch (e) { console.error("review delete failed:", e && e.message); res.status(500).json({ error: "Delete failed." }); }
});

// ---- Seller: product management (full fields incl. private cost/supplier) ----
app.get("/api/admin/products", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database not connected." });
  if (!adminOk(req)) return res.status(401).json({ error: "Wrong admin key." });
  try {
    const r = await pool.query("SELECT id,name,price,mrp,stock,img,descr,category,cost,supplier,supplier_url,sizes,styles,style_costs,custom,active,created_at FROM products ORDER BY created_at ASC");
    res.json({ products: r.rows });
  } catch (e) { console.error("admin products failed:", e && e.message); res.status(500).json({ error: "Could not load products." }); }
});

// ---- Seller: add demo clothing products (one-click, idempotent) so you can test the apparel/custom features ----
app.post("/api/admin/seed-demo", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database not connected." });
  if (!adminOk(req)) return res.status(401).json({ error: "Wrong admin key." });
  const demoIds = ["p10", "p11", "p12", "p13", "p14", "p15", "custom-tee"];
  const demos = PRODUCTS.filter(p => demoIds.includes(p.id));
  try {
    let added = 0;
    for (const p of demos) {
      const r = await pool.query(
        "INSERT INTO products (id,name,price,mrp,stock,img,descr,category,cost,supplier,supplier_url,sizes,styles,style_costs,custom,active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,true) ON CONFLICT (id) DO NOTHING RETURNING id",
        [p.id, p.name, p.price, p.mrp, p.stock, p.img, p.desc, p.category, p.cost, p.supplier, p.supplierUrl, p.sizes || null, p.styles || null, p.styleCosts || null, p.custom || false]
      );
      if (r.rows.length) added++;
    }
    await refreshProductCache();
    res.json({ ok: true, added, total: demos.length });
  } catch (e) { console.error("seed-demo failed:", e && e.message); res.status(500).json({ error: "Could not add demo products." }); }
});

app.post("/api/notify-restock", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Not available right now." });
  const b = req.body || {};
  const pid = String(b.productId || "").trim().slice(0, 40);
  const email = String(b.email || "").trim().toLowerCase().slice(0, 120);
  if (!(productCache.some(p => p.id === pid) || PRODUCTS.some(p => p.id === pid))) return res.status(400).json({ error: "Unknown product." });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: "Please enter a valid email." });
  try {
    await pool.query("INSERT INTO stock_notify (product_id,email) VALUES ($1,$2) ON CONFLICT (product_id,email) DO NOTHING", [pid, email]);
    res.json({ ok: true, message: "We'll email you when it's back in stock!" });
  } catch (e) { console.error("notify-restock failed:", e && e.message); res.status(500).json({ error: "Couldn't save that. Please try again." }); }
});

app.post("/api/admin/product-save", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database not connected." });
  if (!adminOk(req)) return res.status(401).json({ error: "Wrong admin key." });
  const b = req.body || {};
  const name = String(b.name || "").trim().slice(0, 120);
  const price = Math.round(Number(b.price));
  const mrp = Math.round(Number(b.mrp) || 0);
  const stock = Math.round(Number(b.stock) || 0);
  const imgRaw = String(b.img || "").trim();
  const img = imgRaw.startsWith("data:image/") ? imgRaw.slice(0, 3600000) : imgRaw.slice(0, 500);
  const descr = String(b.desc || "").trim().slice(0, 600);
  const category = String(b.category || "").trim().slice(0, 40);
  const sizes = parseSizesList(b.sizes).join(",").slice(0, 4000);
  const styles = parseStylesList(b.styles).map(s => s.label + ":" + s.price).join(", ").slice(0, 240);
  const styleCosts = parseStylesList(b.styleCosts).map(s => s.label + ":" + s.price).join(", ").slice(0, 240);
  const custom = b.custom === true;
  const cost = b.cost === "" || b.cost == null ? null : Math.round(Number(b.cost));
  const supplier = String(b.supplier || "").trim().slice(0, 120);
  const supplierUrl = String(b.supplierUrl || "").trim().slice(0, 300);
  const active = b.active === false ? false : true;
  if (!name) return res.status(400).json({ error: "Product name is required." });
  if (!Number.isFinite(price) || price < 0) return res.status(400).json({ error: "Enter a valid price." });
  if (!Number.isFinite(stock) || stock < 0) return res.status(400).json({ error: "Enter a valid stock quantity." });
  try {
    let id = String(b.id || "").trim();
    let wasOutOfStock = false;
    if (id) {
      const prev = await pool.query("SELECT stock FROM products WHERE id=$1", [id]);
      wasOutOfStock = prev.rows.length && Number(prev.rows[0].stock) <= 0;
      const r = await pool.query(
        "UPDATE products SET name=$2,price=$3,mrp=$4,stock=$5,img=$6,descr=$7,category=$8,cost=$9,supplier=$10,supplier_url=$11,sizes=$12,custom=$13,active=$14,styles=$15,style_costs=$16 WHERE id=$1 RETURNING id",
        [id, name, price, mrp, stock, img, descr, category, cost, supplier, supplierUrl, sizes, custom, active, styles, styleCosts]
      );
      if (!r.rows.length) return res.status(404).json({ error: "Product not found." });
    } else {
      id = "p" + Date.now().toString(36);
      await pool.query(
        "INSERT INTO products (id,name,price,mrp,stock,img,descr,category,cost,supplier,supplier_url,sizes,custom,active,styles,style_costs) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)",
        [id, name, price, mrp, stock, img, descr, category, cost, supplier, supplierUrl, sizes, custom, active, styles, styleCosts]
      );
    }
    await refreshProductCache();
    // If this product just came back in stock, email everyone waiting (then clear the list).
    if (wasOutOfStock && stock > 0 && active) { notifyRestock(id, name).catch(e => console.error("restock notify failed:", e && e.message)); }
    res.json({ ok: true, id });
  } catch (e) { console.error("product save failed:", e && e.message); res.status(500).json({ error: "Couldn't save the product." }); }
});

app.post("/api/admin/product-delete", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database not connected." });
  if (!adminOk(req)) return res.status(401).json({ error: "Wrong admin key." });
  const id = String((req.body && req.body.id) || "").trim();
  if (!id) return res.status(400).json({ error: "Missing product id." });
  try {
    await pool.query("DELETE FROM products WHERE id=$1", [id]);
    await refreshProductCache();
    res.json({ ok: true });
  } catch (e) { console.error("product delete failed:", e && e.message); res.status(500).json({ error: "Delete failed." }); }
});

app.post("/api/admin/order-delete", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database not connected." });
  if (!adminOk(req)) return res.status(401).json({ error: "Wrong admin key." });
  const id = String((req.body && req.body.orderId) || "").trim().toUpperCase();
  if (!id) return res.status(400).json({ error: "Missing order id." });
  try {
    const r = await pool.query("DELETE FROM orders WHERE id=$1", [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: "Order not found." });
    res.json({ ok: true });
  } catch (e) { console.error("order delete failed:", e && e.message); res.status(500).json({ error: "Delete failed." }); }
});

// Approve / reject a custom order's design (IP review) before you fulfil it on Qikink.
app.post("/api/admin/order-review", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database not connected." });
  if (!adminOk(req)) return res.status(401).json({ error: "Wrong admin key." });
  const id = String((req.body && req.body.orderId) || "").trim().toUpperCase();
  const status = String((req.body && req.body.status) || "").trim();
  if (!id) return res.status(400).json({ error: "Missing order id." });
  if (!["approved", "rejected", "pending"].includes(status)) return res.status(400).json({ error: "Invalid review status." });
  try {
    const r = await pool.query("UPDATE orders SET review_status=$1, updated_at=now() WHERE id=$2", [status, id]);
    if (r.rowCount === 0) return res.status(404).json({ error: "Order not found." });
    res.json({ ok: true });
  } catch (e) { console.error("order review failed:", e && e.message); res.status(500).json({ error: "Update failed." }); }
});

// Create a Razorpay order (amount computed from trusted prices)
app.post("/api/create-order", async (req, res) => {
  if (!razorpay) return res.status(503).json({ error: "Payments are not set up yet." });
  const calc = computeOrder(req.body && req.body.items);
  if (calc.error) return res.status(400).json({ error: calc.error });
  try {
    const order = await razorpay.orders.create({ amount: calc.total * 100, currency: "INR", receipt: "rcpt_" + Date.now() });
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: KEY_ID });
  } catch (e) {
    console.error("create-order failed:", e && e.message);
    res.status(500).json({ error: "Could not create order" });
  }
});

// Place order: verifies payment (online) or records COD, then emails you
app.post("/api/place-order", async (req, res) => {
  try {
    const b = req.body || {};
    const calc = computeOrder(b.items, b.cod === true, true);
    if (calc.error) return res.status(400).json({ error: calc.error });
    if (b.cod === true && calc.lineItems.some(li => li.custom)) return res.status(400).json({ error: "Custom prints are prepaid only. Please choose online payment." });
    if (calc.lineItems.some(li => li.custom) && b.ipAffirmed !== true) return res.status(400).json({ error: "Please confirm you own the rights to your custom design to continue." });
    const customer = sanitizeCustomer(b.customer);
    if (customer.error) return res.status(400).json({ error: customer.error });

    let paid = false, paymentId = null;
    if (b.cod === true) {
      if (calc.total > COD_MAX) return res.status(400).json({ error: `Cash on Delivery isn't available for orders above ₹${COD_MAX.toLocaleString("en-IN")}. Please pay online.` });
      paid = false;
    } else {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = b;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({ error: "Missing payment details" });
      if (!KEY_SECRET) return res.status(503).json({ error: "Payments not configured" });
      const expected = crypto.createHmac("sha256", KEY_SECRET).update(razorpay_order_id + "|" + razorpay_payment_id).digest("hex");
      const a = Buffer.from(expected), bb = Buffer.from(String(razorpay_signature));
      const ok = a.length === bb.length && crypto.timingSafeEqual(a, bb);
      if (!ok) return res.status(400).json({ error: "Payment verification failed" });
      // CRITICAL: confirm the amount actually paid matches this cart — stops a cart-swap after payment.
      try {
        const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
        if (!rzpOrder || Number(rzpOrder.amount) !== Math.round(calc.total * 100)) {
          console.error("amount mismatch:", rzpOrder && rzpOrder.amount, "vs", Math.round(calc.total * 100));
          return res.status(400).json({ error: "Payment amount didn't match your order. If money was deducted it will be refunded automatically — please contact us." });
        }
      } catch (e) {
        console.error("amount verify failed:", e && e.message);
        return res.status(400).json({ error: "We couldn't verify your payment. If money was deducted it will be refunded — please contact us." });
      }
      paid = true; paymentId = razorpay_payment_id;
      // Idempotency: if this payment already created an order, return it instead of duplicating (stops double-ship on retry).
      if (pool) {
        try {
          const dup = await pool.query("SELECT id, total FROM orders WHERE payment_id=$1 LIMIT 1", [paymentId]);
          if (dup.rows.length) return res.json({ ok: true, orderId: dup.rows[0].id, total: dup.rows[0].total, duplicate: true });
        } catch (e) { console.error("dup check failed:", e && e.message); }
      }
    }

    const order = { id: "VG" + Date.now().toString().slice(-8) + crypto.randomBytes(4).toString("hex").toUpperCase(), ...calc, customer, paid, paymentId, ipAffirmed: b.ipAffirmed === true, confirmToken: crypto.randomBytes(16).toString("hex") };
    try { await saveOrder(order); } catch (e) { console.error("save failed:", e && e.message); }
    // Respond immediately so the customer isn't kept waiting; email sends in the background.
    res.json({ ok: true, orderId: order.id, total: order.total });
    notifyOrder(order).catch((e) => console.error("notify failed:", e && e.message));
    notifyBuyer(order).catch((e) => console.error("buyer notify failed:", e && e.message));
  } catch (e) {
    console.error("place-order failed:", e && e.message);
    res.status(500).json({ error: "Could not place order" });
  }
});

// ---- Customer order tracking (by order ID + phone, no account) ----
app.post("/api/track", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Order tracking isn't set up yet. Please contact us." });
  const id = String((req.body && req.body.orderId) || "").trim().toUpperCase().replace(/^#/, "");
  const phone = String((req.body && req.body.phone) || "").replace(/\D/g, "").slice(-10);
  if (!id || phone.length !== 10) return res.status(400).json({ error: "Enter your order ID and the 10-digit phone number you ordered with." });
  try {
    const r = await pool.query(
      "SELECT id,status,tracking_url,tracking_carrier,total,items,cod_fee,customer_confirmed,created_at,updated_at FROM orders WHERE id=$1 AND phone=$2",
      [id, phone]
    );
    if (!r.rows.length) return res.status(404).json({ error: "No order found with that ID and phone number." });
    const o = r.rows[0];
    const itemCount = (o.items || []).reduce((s, i) => s + (Number(i.qty) || 0), 0);
    res.json({ id: o.id, status: o.status, trackingUrl: o.tracking_url, trackingCarrier: o.tracking_carrier,
      total: o.total, codFee: o.cod_fee || 0, confirmed: o.customer_confirmed === true, itemCount, items: o.items || [], placedAt: o.created_at, updatedAt: o.updated_at });
  } catch (e) { console.error("track failed:", e && e.message); res.status(500).json({ error: "Couldn't fetch your order. Please try again." }); }
});

// ---- Customer clicks the "confirm my order" button in their email ----
function confirmPage(title, message, ok) {
  const accent = ok ? "#1f9e57" : "#E8820C";
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title>
  <style>body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#13100D;color:#F3EFE8;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
  .card{background:#1C1814;border:1px solid #2F2922;border-radius:18px;padding:34px 28px;max-width:420px;text-align:center}
  .ic{font-size:48px;margin-bottom:8px}.t{font-size:22px;font-weight:700;margin:0 0 10px}.m{color:#B9B0A3;line-height:1.55;font-size:15px;margin:0 0 20px}
  .b{display:inline-block;background:${accent};color:#fff;text-decoration:none;font-weight:700;padding:12px 26px;border-radius:999px;font-size:15px}</style></head>
  <body><div class="card"><div class="ic">${ok ? "✅" : "ℹ️"}</div><h1 class="t">${title}</h1><p class="m">${message}</p>
  <a class="b" href="${process.env.SITE_URL || "/"}">Continue shopping</a></div></body></html>`;
}
app.get("/api/confirm", async (req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8");
  if (!pool) return res.status(503).send(confirmPage("Not available", "Order confirmation isn't set up yet. Please contact us.", false));
  const id = String(req.query.o || "").trim().toUpperCase();
  const token = String(req.query.t || "").trim();
  if (!id || !token) return res.status(400).send(confirmPage("Invalid link", "This confirmation link looks incomplete. Please use the button in your order email.", false));
  try {
    const r = await pool.query("SELECT id,status,customer_confirmed,confirm_token FROM orders WHERE id=$1", [id]);
    if (!r.rows.length) return res.status(404).send(confirmPage("Order not found", "We couldn't find that order. Please check your email link or contact us.", false));
    const o = r.rows[0];
    const a = Buffer.from(token), b = Buffer.from(String(o.confirm_token || ""));
    const valid = o.confirm_token && a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!valid) return res.status(403).send(confirmPage("Invalid link", "This confirmation link isn't valid. Please use the button in your order email, or contact us.", false));
    if (o.status === "Cancelled") return res.status(200).send(confirmPage("Order cancelled", `Order ${id} has been cancelled, so it can't be confirmed. Contact us if this is a mistake.`, false));
    if (o.customer_confirmed === true) return res.status(200).send(confirmPage("Already confirmed", `Thanks! Order ${id} is already confirmed — we're getting it ready to ship.`, true));
    await pool.query("UPDATE orders SET customer_confirmed=true, updated_at=now() WHERE id=$1", [id]);
    try { await sendMail(ORDER_TO, `✅ Customer CONFIRMED order ${id}`, `Order ${id} has been confirmed by the customer. It's safe to ship.`); } catch (e) { console.error("confirm notify failed:", e && e.message); }
    return res.status(200).send(confirmPage("Order confirmed!", `Thank you! Order ${id} is confirmed. We'll pack and ship it shortly. 🎉`, true));
  } catch (e) {
    console.error("confirm failed:", e && e.message);
    return res.status(500).send(confirmPage("Something went wrong", "We couldn't confirm your order right now. Please try again, or contact us.", false));
  }
});

// ---- Customer: cancel an order (before dispatch) or request a return/refund (after) ----
async function sendMail(to, subject, text, replyTo, html) {
  if (!RESEND_API_KEY || !to) return;
  const payload = { from: ORDER_FROM, to: [to], reply_to: replyTo, subject, text };
  if (html) payload.html = html;
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": "Bearer " + RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error("Resend " + resp.status + ": " + (await resp.text()).slice(0, 160));
}

app.post("/api/cancel-request", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Not available right now. Please contact us." });
  const id = String((req.body && req.body.orderId) || "").trim().toUpperCase().replace(/^#/, "");
  const phone = String((req.body && req.body.phone) || "").replace(/\D/g, "").slice(-10);
  const reason = String((req.body && req.body.reason) || "").trim().slice(0, 300);
  if (!id || phone.length !== 10) return res.status(400).json({ error: "Enter your order ID and the 10-digit phone number you ordered with." });
  try {
    const r = await pool.query("SELECT id,name,email,phone,total,paid,payment_id,status FROM orders WHERE id=$1 AND phone=$2", [id, phone]);
    if (!r.rows.length) return res.status(404).json({ error: "No order found with that ID and phone number." });
    const o = r.rows[0];
    const st = o.status || "Placed";
    if (st === "Cancelled") return res.status(400).json({ error: "This order is already cancelled." });

    // Before dispatch -> allow self-cancel. After dispatch -> record a return/refund request.
    const canSelfCancel = (st === "Placed" || st === "Packed");
    if (canSelfCancel) {
      await pool.query("UPDATE orders SET status='Cancelled', updated_at=now() WHERE id=$1", [id]);
    }

    const action = canSelfCancel ? "ORDER CANCELLED BY CUSTOMER" : "RETURN / REFUND REQUEST";
    const sellerBody = [
      `${action}`,
      `Order: ${o.id}`,
      `Customer: ${o.name} | ${o.phone}${o.email ? " | " + o.email : ""}`,
      `Amount: ₹${o.total}  |  ${o.paid ? "PAID ONLINE" : "COD"}`,
      o.paid && o.payment_id ? `Razorpay payment id: ${o.payment_id}` : "",
      reason ? `Reason: ${reason}` : "Reason: (not provided)",
      "",
      canSelfCancel
        ? (o.paid
            ? "ACTION NEEDED: Order is now marked Cancelled. Since it was PAID ONLINE, please process the refund from your Razorpay dashboard (Transactions → find this payment → Refund)."
            : "Order is now marked Cancelled. It was COD, so no refund is needed.")
        : "ACTION NEEDED: This order was already dispatched/delivered. Review the return request per your policy, then refund via Razorpay if approved.",
    ].filter(Boolean).join("\n");

    try { await sendMail(ORDER_TO, `${canSelfCancel ? "Cancelled" : "Refund request"} — order ${o.id}`, sellerBody, o.email || undefined); } catch (e) { console.error("cancel notify(seller) failed:", e && e.message); }

    if (o.email) {
      const eh2 = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const buyerBody = canSelfCancel
        ? [`Hi ${o.name},`, "", `Your order ${o.id} has been cancelled as requested.`,
            o.paid ? `Since you paid online, your refund of ₹${o.total} will be processed to your original payment method. Refunds usually take 5–7 business days.` : "As this was a Cash-on-Delivery order, no payment was taken, so nothing needs to be refunded.",
            "", "If this wasn't you, please contact us right away.", "", "— Team Vector Grid"].join("\n")
        : [`Hi ${o.name},`, "", `We've received your return/refund request for order ${o.id}.`,
            "Our team will review it and get back to you shortly. If approved, refunds are processed to your original payment method within 5–7 business days.",
            "", "— Team Vector Grid"].join("\n");
      const buyerInner = canSelfCancel
        ? `<h2 style="color:#111;margin:0 0 10px">Hi ${eh2(o.name)}, your order is cancelled</h2>
           <p style="color:#555;line-height:1.6;margin:0 0 12px">Your order <strong>${eh2(o.id)}</strong> has been cancelled as requested.</p>
           <p style="color:#555;line-height:1.6;margin:0 0 12px">${o.paid ? `Since you paid online, your refund of ₹${o.total} will be processed to your original payment method. Refunds usually take 5–7 business days.` : "As this was a Cash-on-Delivery order, no payment was taken, so nothing needs to be refunded."}</p>
           <p style="color:#888;font-size:13px;line-height:1.6;margin:0">If this wasn't you, please contact us right away.</p>`
        : `<h2 style="color:#111;margin:0 0 10px">Hi ${eh2(o.name)}, we got your request</h2>
           <p style="color:#555;line-height:1.6;margin:0 0 12px">We've received your return/refund request for order <strong>${eh2(o.id)}</strong>.</p>
           <p style="color:#555;line-height:1.6;margin:0">Our team will review it and get back to you shortly. If approved, refunds are processed to your original payment method within 5–7 business days.</p>`;
      try { await sendMail(o.email, canSelfCancel ? `Your order ${o.id} is cancelled` : `Refund request received — ${o.id}`, buyerBody, ORDER_TO, emailShell(buyerInner)); } catch (e) { console.error("cancel notify(buyer) failed:", e && e.message); }
    }

    console.log(`==== ${action} ${o.id} ====\n${sellerBody}\n=========`);
    res.json({ ok: true, cancelled: canSelfCancel, paid: !!o.paid,
      message: canSelfCancel
        ? (o.paid ? "Your order has been cancelled. Your refund will be processed to your original payment method within 5–7 business days." : "Your order has been cancelled. No payment was taken (Cash on Delivery).")
        : "Your return/refund request has been received. Our team will review it and contact you shortly." });
  } catch (e) { console.error("cancel-request failed:", e && e.message); res.status(500).json({ error: "Couldn't process your request. Please try again or contact us." }); }
});

// ---- Seller: list orders ----
app.get("/api/admin/orders", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database not connected." });
  if (!adminOk(req)) return res.status(401).json({ error: "Wrong admin key." });
  try {
    const r = await pool.query(
      "SELECT id,name,phone,email,line1,line2,city,state,pincode,items,supply,subtotal,shipping,cod_fee,total,paid,payment_id,status,customer_confirmed,review_status,ip_affirmed,tracking_url,tracking_carrier,created_at FROM orders ORDER BY created_at DESC LIMIT 100"
    );
    res.json({ orders: r.rows, shipFrom: PICKUP });
  } catch (e) { console.error("admin list failed:", e && e.message); res.status(500).json({ error: "Could not load orders." }); }
});

/* ── OPTIONAL: one-click Shiprocket booking ──────────────────────────────
   Books the parcel pickup → delivery straight from the order. This is OFF until you set
   three env vars on Render: SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD (use a dedicated API user
   from Shiprocket → Settings → API, not your main login), and SHIPROCKET_PICKUP (the exact
   nickname of the pickup location you registered in Shiprocket = your supplier's address).
   Until then the admin panel falls back to a copy-paste shipment slip, which always works. */
let _srToken = null, _srTokenAt = 0;
async function shiprocketToken() {
  const email = process.env.SHIPROCKET_EMAIL, password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) return null;
  if (_srToken && (Date.now() - _srTokenAt) < 9 * 24 * 3600 * 1000) return _srToken;
  const r = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.token) throw new Error(j.message || "Shiprocket login failed — check SHIPROCKET_EMAIL/PASSWORD.");
  _srToken = j.token; _srTokenAt = Date.now();
  return _srToken;
}
async function shiprocketCreate(order, dims) {
  const token = await shiprocketToken();
  if (!token) return { notConfigured: true };
  let items = [];
  try { items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || "[]"); } catch (e) { items = []; }
  // This parcel ships from your supplier and carries only the NON-custom items.
  // Custom (Qikink) items are prepaid-only and shipped separately by Qikink.
  const ship = items.filter(it => !it.custom);
  const order_items = ship.map(it => ({
    name: String(it.name || "Item").slice(0, 80),
    sku: String(it.id || it.name || "SKU").slice(0, 40),
    units: Math.max(1, Number(it.qty) || 1),
    selling_price: Math.max(0, Number(it.price) || 0),
  }));
  const goodsValue = ship.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);
  // For COD the courier collects the full amount the customer agreed to pay (goods + shipping = order total).
  // For prepaid nothing is collected, so sub_total is just the declared goods value of this parcel.
  const subTotal = order.paid ? goodsValue : Math.max(0, Number(order.total) || goodsValue);
  const payload = {
    order_id: order.id,
    order_date: new Date(order.created_at || Date.now()).toISOString().slice(0, 16).replace("T", " "),
    pickup_location: process.env.SHIPROCKET_PICKUP || "Primary",
    billing_customer_name: order.name || "",
    billing_last_name: "",
    billing_address: order.line1 || "",
    billing_address_2: order.line2 || "",
    billing_city: order.city || "",
    billing_pincode: order.pincode || "",
    billing_state: order.state || "",
    billing_country: "India",
    billing_email: order.email || "",
    billing_phone: order.phone || "",
    shipping_is_billing: true,
    order_items,
    payment_method: order.paid ? "Prepaid" : "COD",
    sub_total: subTotal,
    length: Math.max(1, Number(dims.length) || 25),
    breadth: Math.max(1, Number(dims.breadth) || 20),
    height: Math.max(1, Number(dims.height) || 8),
    weight: Math.max(0.1, Number(dims.weight) || 0.5),
  };
  const r = await fetch("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
    body: JSON.stringify(payload),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.message || (j.errors ? JSON.stringify(j.errors) : "Shiprocket rejected the order — check your pickup nickname and address."));
  return { ok: true, shipmentId: j.shipment_id, scOrderId: j.order_id, status: j.status };
}
app.post("/api/admin/ship-create", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database not connected." });
  if (!adminOk(req)) return res.status(401).json({ error: "Wrong admin key." });
  if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) return res.json({ notConfigured: true });
  const b = req.body || {};
  const oid = String(b.orderId || "").trim().toUpperCase().slice(0, 40);
  if (!oid) return res.status(400).json({ error: "Missing order id." });
  try {
    const r = await pool.query("SELECT * FROM orders WHERE id=$1", [oid]);
    if (!r.rows.length) return res.status(404).json({ error: "Order not found." });
    const out = await shiprocketCreate(r.rows[0], { weight: b.weightKg, length: b.length, breadth: b.breadth, height: b.height });
    res.json(out);
  } catch (e) { console.error("ship-create failed:", e && e.message); res.status(502).json({ error: (e && e.message) || "Courier booking failed." }); }
});

// ---- Seller: fetch the custom-design image(s) for one order (kept out of the order list to keep it light) ----
app.get("/api/admin/order-designs", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database not connected." });
  if (!adminOk(req)) return res.status(401).json({ error: "Wrong admin key." });
  const oid = String((req.query && req.query.orderId) || "").trim().toUpperCase().slice(0, 40);
  if (!oid) return res.status(400).json({ error: "Missing order id." });
  try {
    const r = await pool.query("SELECT idx, image, notes FROM order_designs WHERE order_id=$1 ORDER BY idx ASC", [oid]);
    res.json({ designs: r.rows });
  } catch (e) { console.error("order-designs failed:", e && e.message); res.status(500).json({ error: "Could not load designs." }); }
});

// ---- Seller: update an order's status / tracking ----
app.post("/api/admin/update", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database not connected." });
  if (!adminOk(req)) return res.status(401).json({ error: "Wrong admin key." });
  const id = String((req.body && req.body.orderId) || "").trim().toUpperCase();
  const status = String((req.body && req.body.status) || "").trim();
  const allowed = ["Placed", "Packed", "Shipped", "Delivered", "Cancelled"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status." });
  const trackingUrl = String((req.body && req.body.trackingUrl) || "").trim().slice(0, 300);
  const trackingCarrier = String((req.body && req.body.trackingCarrier) || "").trim().slice(0, 60);
  try {
    const prev = await pool.query("SELECT status, name, email, supply FROM orders WHERE id=$1", [id]);
    const r = await pool.query(
      "UPDATE orders SET status=$2, tracking_url=$3, tracking_carrier=$4, updated_at=now() WHERE id=$1 RETURNING id",
      [id, status, trackingUrl, trackingCarrier]
    );
    if (!r.rows.length) return res.status(404).json({ error: "Order not found." });
    res.json({ ok: true });
    // Newly Delivered → invite the customer to rate what they received (runs in background).
    if (status === "Delivered" && prev.rows.length && prev.rows[0].status !== "Delivered" && prev.rows[0].email) {
      notifyReviewRequest({ id, name: prev.rows[0].name, email: prev.rows[0].email, supply: prev.rows[0].supply })
        .catch((e) => console.error("review request email failed:", e && e.message));
    }
  } catch (e) { console.error("admin update failed:", e && e.message); res.status(500).json({ error: "Update failed." }); }
});

// ============ Help Center (order-linked support) ============
// Customer: open/refresh the conversation for their order (verified by order id + phone)
app.post("/api/support/thread", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Support isn't set up yet. Please contact us." });
  const id = String((req.body && req.body.orderId) || "").trim().toUpperCase().replace(/^#/, "");
  const phone = String((req.body && req.body.phone) || "").replace(/\D/g, "").slice(-10);
  if (!id || phone.length !== 10) return res.status(400).json({ error: "Enter your order ID and the 10-digit phone number you ordered with." });
  try {
    const r = await pool.query("SELECT id,name,status,total FROM orders WHERE id=$1 AND phone=$2", [id, phone]);
    if (!r.rows.length) return res.status(404).json({ error: "No order found with that ID and phone number." });
    const o = r.rows[0];
    const m = await pool.query("SELECT id,sender,body,created_at FROM support_messages WHERE order_id=$1 ORDER BY created_at ASC", [id]);
    res.json({ order: { id: o.id, name: o.name, status: o.status, total: o.total }, messages: m.rows });
  } catch (e) { console.error("support thread failed:", e && e.message); res.status(500).json({ error: "Couldn't load your messages. Please try again." }); }
});

// Customer: send a message/complaint/request about their order
app.post("/api/support/message", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Support isn't set up yet. Please contact us." });
  const id = String((req.body && req.body.orderId) || "").trim().toUpperCase().replace(/^#/, "");
  const phone = String((req.body && req.body.phone) || "").replace(/\D/g, "").slice(-10);
  const body = String((req.body && req.body.body) || "").trim().slice(0, 1000);
  if (!id || phone.length !== 10) return res.status(400).json({ error: "Enter your order ID and the 10-digit phone number you ordered with." });
  if (!body) return res.status(400).json({ error: "Type a message first." });
  try {
    const r = await pool.query("SELECT id,name,email,phone,total,status FROM orders WHERE id=$1 AND phone=$2", [id, phone]);
    if (!r.rows.length) return res.status(404).json({ error: "No order found with that ID and phone number." });
    const o = r.rows[0];
    await pool.query("INSERT INTO support_messages (order_id,sender,body) VALUES ($1,'customer',$2)", [id, body]);
    const sellerBody = [
      `NEW SUPPORT MESSAGE — order ${o.id}`,
      `Customer: ${o.name} | ${o.phone}${o.email ? " | " + o.email : ""}`,
      `Order status: ${o.status || "Placed"}  |  Amount: Rs.${o.total}`,
      "",
      "Message:",
      body,
      "",
      "Reply from your Seller dashboard → Support tab.",
    ].join("\n");
    try { await sendMail(ORDER_TO, `New support message — order ${o.id}`, sellerBody, o.email || undefined); } catch (e) { console.error("support notify failed:", e && e.message); }
    const m = await pool.query("SELECT id,sender,body,created_at FROM support_messages WHERE order_id=$1 ORDER BY created_at ASC", [id]);
    res.json({ ok: true, messages: m.rows });
  } catch (e) { console.error("support message failed:", e && e.message); res.status(500).json({ error: "Couldn't send your message. Please try again." }); }
});

// Seller: list all support conversations (grouped by order)
app.get("/api/admin/support", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database not connected." });
  if (!adminOk(req)) return res.status(401).json({ error: "Wrong admin key." });
  try {
    const m = await pool.query("SELECT id,order_id,sender,body,seen_by_seller,created_at FROM support_messages ORDER BY created_at ASC");
    const byOrder = {};
    for (const row of m.rows) {
      if (!byOrder[row.order_id]) byOrder[row.order_id] = { orderId: row.order_id, messages: [], unseen: 0, lastAt: null };
      byOrder[row.order_id].messages.push({ id: row.id, sender: row.sender, body: row.body, created_at: row.created_at });
      if (row.sender === "customer" && !row.seen_by_seller) byOrder[row.order_id].unseen++;
      byOrder[row.order_id].lastAt = row.created_at;
    }
    const ids = Object.keys(byOrder);
    if (ids.length) {
      const info = await pool.query("SELECT id,name,phone,status,total FROM orders WHERE id = ANY($1::text[])", [ids]);
      const map = {}; for (const o of info.rows) map[o.id] = o;
      for (const oid of ids) { const o = map[oid] || {}; byOrder[oid].name = o.name || "(unknown order)"; byOrder[oid].phone = o.phone || ""; byOrder[oid].status = o.status || ""; byOrder[oid].total = o.total != null ? o.total : null; }
    }
    const threads = Object.values(byOrder).sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
    res.json({ threads });
  } catch (e) { console.error("admin support list failed:", e && e.message); res.status(500).json({ error: "Could not load support messages." }); }
});

// Seller: reply to a customer on an order (saved to thread + emailed to customer)
app.post("/api/admin/support-reply", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database not connected." });
  if (!adminOk(req)) return res.status(401).json({ error: "Wrong admin key." });
  const id = String((req.body && req.body.orderId) || "").trim().toUpperCase();
  const body = String((req.body && req.body.body) || "").trim().slice(0, 1000);
  if (!id) return res.status(400).json({ error: "Missing order id." });
  if (!body) return res.status(400).json({ error: "Type a reply first." });
  try {
    const r = await pool.query("SELECT id,name,email FROM orders WHERE id=$1", [id]);
    if (!r.rows.length) return res.status(404).json({ error: "Order not found." });
    const o = r.rows[0];
    await pool.query("INSERT INTO support_messages (order_id,sender,body) VALUES ($1,'seller',$2)", [id, body]);
    await pool.query("UPDATE support_messages SET seen_by_seller=true WHERE order_id=$1 AND sender='customer'", [id]);
    if (o.email) {
      const eh = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const inner = `<h2 style="color:#111;margin:0 0 10px">Hi ${eh(o.name)}, you have a reply</h2>
        <p style="color:#555;line-height:1.6;margin:0 0 12px">About your order <strong>${eh(o.id)}</strong>:</p>
        <p style="color:#222;line-height:1.6;margin:0 0 14px;padding:12px 14px;background:#f5f3ef;border-radius:8px">${eh(body)}</p>
        <p style="color:#888;font-size:13px;line-height:1.6;margin:0">To reply, open our Help Center and enter your order ID and phone number.</p>`;
      const text = `Hi ${o.name},\n\nYou have a reply about order ${o.id}:\n\n"${body}"\n\nTo continue the conversation, open our Help Center and enter your order ID and phone number.\n\n— Team Vector Grid`;
      try { await sendMail(o.email, `Reply about your order ${o.id} — Vector Grid`, text, ORDER_TO, emailShell(inner)); } catch (e) { console.error("support reply email failed:", e && e.message); }
    }
    res.json({ ok: true });
  } catch (e) { console.error("admin support reply failed:", e && e.message); res.status(500).json({ error: "Reply failed." }); }
});

app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Vector Grid running on port " + PORT));
