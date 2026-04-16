import "dotenv/config";
console.log("[DevServer] Script started");
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import app from "./api/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startLocalServer() {
  const PORT = 3000;

  console.log("[DevServer] Starting server...");
  console.log("[DevServer] SUPABASE_URL defined:", !!process.env.SUPABASE_URL);
  console.log("[DevServer] SUPABASE_ANON_KEY defined:", !!process.env.SUPABASE_ANON_KEY);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("[DevServer] Initializing Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[DevServer] Vite middleware initialized.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Local development server running on http://localhost:${PORT}`);
  });
}

startLocalServer();
