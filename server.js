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
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// CORS per permettere cookie
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

// --- CONNESSIONE MONGODB ---
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MONGODB CONNESSO"))
  .catch((err) => console.error("❌ ERRORE MONGO:", err));

// --- IMPORT AUTOMATICO ROTTE ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesPath = path.join(__dirname, "routes");
fs.readdirSync(routesPath).forEach(async (file) => {
  if (file.endsWith(".js")) {
    const route = await import(`./routes/${file}`);
    // usa come prefisso il nome del file senza estensione
    const routeName = "/api/" + file.replace(".js", "");
    app.use(routeName, route.default); // attenzione: con import ES Modules devi usare .default
    console.log(`📦 Rotta caricata: ${routeName}`);
  }
});

// --- AVVIO SERVER ---
app.listen(PORT, () => console.log(`🚀 Server attivo su porta ${PORT}`));
