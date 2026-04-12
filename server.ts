import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import CryptoJS from "crypto-js";
import bodyParser from "body-parser";

const PORT = 3000;
const DB_PATH = "qbit.db";

// Initialize Database
const db = new Database(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    credits INTEGER DEFAULT 5
  );
`);

// Mock user for demo purposes (using the user email from runtime context)
const DEFAULT_USER_EMAIL = "tomknsn@gmail.com";

// Ensure default user exists with some trial credits
const insertUser = db.prepare("INSERT OR IGNORE INTO users (email, credits) VALUES (?, ?)");
insertUser.run(DEFAULT_USER_EMAIL, 10);

// PayFast Helper Functions
function generatePayfastSignature(data: any, passphrase?: string) {
  let queryString = "";
  Object.keys(data).forEach((key) => {
    if (data[key] !== "" && key !== "signature") {
      queryString += `${key}=${encodeURIComponent(data[key].toString().trim()).replace(/%20/g, "+")}&`;
    }
  });

  queryString = queryString.substring(0, queryString.length - 1);
  if (passphrase) {
    queryString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`;
  }

  return CryptoJS.MD5(queryString).toString();
}

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // API Routes
  app.get("/api/pricing", (req, res) => {
    try {
      const pricing = JSON.parse(fs.readFileSync("pricing.json", "utf-8"));
      res.json(pricing);
    } catch (error) {
      res.status(500).json({ error: "Failed to load pricing" });
    }
  });

  app.get("/api/user/credits", (req, res) => {
    let user = db.prepare("SELECT credits FROM users WHERE email = ?").get(DEFAULT_USER_EMAIL) as { credits: number } | undefined;
    
    if (!user) {
      // Auto-create user if they don't exist
      db.prepare("INSERT INTO users (email, credits) VALUES (?, ?)").run(DEFAULT_USER_EMAIL, 20);
      user = { credits: 20 };
    }
    
    res.json({ credits: user.credits, email: DEFAULT_USER_EMAIL });
  });

  app.post("/api/user/deduct", (req, res) => {
    const user = db.prepare("SELECT credits FROM users WHERE email = ?").get(DEFAULT_USER_EMAIL) as { credits: number } | undefined;
    
    if (!user || user.credits <= 0) {
      return res.status(403).json({ error: "Insufficient credits" });
    }

    db.prepare("UPDATE users SET credits = credits - 1 WHERE email = ?").run(DEFAULT_USER_EMAIL);
    const updatedUser = db.prepare("SELECT credits FROM users WHERE email = ?").get(DEFAULT_USER_EMAIL) as { credits: number };
    
    res.json({ success: true, credits: updatedUser.credits });
  });

  app.post("/api/payfast/checkout", (req, res) => {
    const { tierId } = req.body;
    const pricing = JSON.parse(fs.readFileSync("pricing.json", "utf-8"));
    const tier = pricing.tiers.find((t: any) => t.id === tierId);

    if (!tier) {
      return res.status(400).json({ error: "Invalid tier" });
    }

    const merchantId = process.env.PAYFAST_MERCHANT_ID || "21424325";
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY || "gclahuwgyvzfa";
    const passphrase = process.env.PAYFAST_PASSPHRASE;
    const isSandbox = process.env.PAYFAST_SANDBOX === "true";
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;

    const data: any = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${appUrl}/?payment=success`,
      cancel_url: `${appUrl}/?payment=cancel`,
      notify_url: `${appUrl}/api/payfast/notify`,
      name_first: "Customer",
      email_address: DEFAULT_USER_EMAIL,
      m_payment_id: `PAY-${Date.now()}`,
      amount: tier.price.toFixed(2),
      item_name: `${tier.credits} Q-bit Credits`,
      custom_str1: DEFAULT_USER_EMAIL,
      custom_str2: tier.credits.toString(),
    };

    data.signature = generatePayfastSignature(data, passphrase);

    const baseUrl = isSandbox ? "https://sandbox.payfast.co.za/eng/process" : "https://www.payfast.co.za/eng/process";
    
    res.json({ url: baseUrl, data });
  });

  app.post("/api/payfast/notify", (req, res) => {
    const data = req.body;
    console.log("PayFast Notification Received:", data);

    // In a real app, you should verify the signature and the PayFast server IP
    // For this demo, we'll trust the notification if the payment_status is COMPLETE
    if (data.payment_status === "COMPLETE") {
      const email = data.custom_str1;
      const creditsToAdd = parseInt(data.custom_str2);

      if (email && !isNaN(creditsToAdd)) {
        db.prepare("UPDATE users SET credits = credits + ? WHERE email = ?").run(creditsToAdd, email);
        console.log(`Added ${creditsToAdd} credits to ${email}`);
      }
    }

    res.sendStatus(200);
  });

  // Catch-all for undefined API routes
  app.all("/api/*", (req, res) => {
    console.log(`API 404: ${req.method} ${req.url}`);
    res.status(404).json({ error: `API route not found: ${req.url}` });
  });

  // Vite middleware for development
  const isProd = process.env.NODE_ENV === "production";
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(distPath);

  if (isProd && hasDist) {
    console.log("Serving production build from dist/");
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log("Starting Vite in middleware mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
