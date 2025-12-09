// --- IMPORT ---
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// --- CONFIG ---
dotenv.config();
const app = express();
app.use(
  cors({
    origin: [
      "https://undercovergpa.netlify.app", // prod
      "http://localhost:4200", // dev Angular
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  })
);

// Log dettagliato di ogni richiesta
app.use((req, res, next) => {
  console.log("========== NUOVA RICHIESTA ==========");
  console.log("🔹 Metodo:", req.method);
  console.log("🔹 URL:", req.originalUrl);
  console.log("🔹 Headers:", req.headers);
  console.log("🔹 Cookies:", req.cookies);
  console.log("🔹 Body:", req.body);
  console.log("=====================================");
  console.log(res.statusCode);
  next();
});

// Middleware globali
app.use(express.json());
app.use(cookieParser());

// --- VARIABILI D’AMBIENTE ---
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// --- CONNESSIONE A MONGODB ---
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MONGODB CONNESSO"))
  .catch((err) => console.error("❌ ERRORE CONNESSIONE MONGO:", err));

// --- IMPORT AUTOMATICO DELLE ROTTE ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const routesPath = path.join(__dirname, "routes");

// Caricamento automatico di tutte le rotte nella cartella /routes
fs.readdirSync(routesPath).forEach(async (file) => {
  if (file.endsWith(".js")) {
    try {
      const route = await import(`./routes/${file}`);
      const routeName = "/api/" + file.replace(".js", "");
      app.use(routeName, route.default);
      console.log(`📦 Rotta caricata: ${routeName}`);
    } catch (error) {
      console.error(`❌ Errore nel caricamento di ${file}:`, error);
    }
  }
});

// --- GESTIONE ERRORI GLOBALI ---
app.use((err, req, res, next) => {
  console.error("🔥 ERRORE SERVER:", err);
  res.status(500).json({ error: "Errore interno del server" });
});

app.get("/api/ok", (req, res) => {
  res.status(200).json({ message: "Server on!" });
});

// Middleware globale che ritarda le richieste di 10 secondi

/* app.use(async (req, res, next) => {
  await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 secondi
  next();
});
*/
// --- AVVIO SERVER ---
app.listen(PORT, () =>
  console.log(`🚀 Server attivo e in ascolto sulla porta ${PORT}`)
);
