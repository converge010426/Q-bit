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
    user_id TEXT PRIMARY KEY,
    credits INTEGER DEFAULT 0,
    role TEXT DEFAULT 'user'
  );
`);

// Seed initial users if table is empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  // Admin user
  db.prepare("INSERT INTO users (user_id, credits, role) VALUES (?, ?, ?)").run("admin", 9999, "admin");
  // 10 Trial candidates
  for (let i = 1; i <= 10; i++) {
    db.prepare("INSERT INTO users (user_id, credits, role) VALUES (?, ?, ?)").run(`user${i}`, 5, "user");
  }
}

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

  app.post("/api/auth/login", (req, res) => {
    const { userId } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE user_id = ?").get(userId) as any;
    
    if (!user) {
      return res.status(401).json({ error: "Invalid User ID" });
    }
    
    res.json({ success: true, user });
  });

  app.get("/api/user/credits", (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = db.prepare("SELECT credits, role FROM users WHERE user_id = ?").get(userId) as any;
    if (!user) return res.status(404).json({ error: "User not found" });
    
    res.json({ credits: user.credits, userId, role: user.role });
  });

  app.post("/api/user/deduct", (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = db.prepare("SELECT credits FROM users WHERE user_id = ?").get(userId) as any;
    if (!user || user.credits <= 0) {
      return res.status(403).json({ error: "Insufficient credits" });
    }

    db.prepare("UPDATE users SET credits = credits - 1 WHERE user_id = ?").run(userId);
    const updatedUser = db.prepare("SELECT credits FROM users WHERE user_id = ?").get(userId) as any;
    
    res.json({ success: true, credits: updatedUser.credits });
  });

  // Admin Routes
  app.get("/api/admin/users", (req, res) => {
    const adminId = req.headers["x-user-id"] as string;
    const admin = db.prepare("SELECT role FROM users WHERE user_id = ?").get(adminId) as any;
    
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const users = db.prepare("SELECT * FROM users WHERE role = 'user'").all();
    res.json(users);
  });

  app.post("/api/admin/users/credits", (req, res) => {
    const adminId = req.headers["x-user-id"] as string;
    const admin = db.prepare("SELECT role FROM users WHERE user_id = ?").get(adminId) as any;
    
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { targetUserId, amount } = req.body;
    db.prepare("UPDATE users SET credits = credits + ? WHERE user_id = ?").run(amount, targetUserId);
    
    res.json({ success: true });
  });

  app.post("/api/payfast/checkout", (req, res) => {
    const { tierId, userId } = req.body;
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
      email_address: "customer@example.com",
      m_payment_id: `PAY-${Date.now()}`,
      amount: tier.price.toFixed(2),
      item_name: `${tier.credits} Q-bit Credits`,
      custom_str1: userId,
      custom_str2: tier.credits.toString(),
    };

    data.signature = generatePayfastSignature(data, passphrase);

    const baseUrl = isSandbox ? "https://sandbox.payfast.co.za/eng/process" : "https://www.payfast.co.za/eng/process";
    
    res.json({ url: baseUrl, data });
  });

  app.post("/api/payfast/notify", (req, res) => {
    const data = req.body;
    console.log("PayFast Notification Received:", data);

    if (data.payment_status === "COMPLETE") {
      const userId = data.custom_str1;
      const creditsToAdd = parseInt(data.custom_str2);

      if (userId && !isNaN(creditsToAdd)) {
        db.prepare("UPDATE users SET credits = credits + ? WHERE user_id = ?").run(creditsToAdd, userId);
        console.log(`Added ${creditsToAdd} credits to ${userId}`);
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
