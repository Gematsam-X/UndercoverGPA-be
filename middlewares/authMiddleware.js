import jwt from "jsonwebtoken";
import User from "../models/User.ts";

const JWT_SECRET = process.env.JWT_SECRET

/**
 * Middleware per protezione rotte (autenticazione)
 */
export default async function authMiddleware(req, res, next) {
  try {
    // 1️⃣ Controlla se c'è l'header Authorization
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ error: "Token mancante" });

    // 2️⃣ Estrae il token (Bearer <token>)
    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token mancante" });

    // 3️⃣ Verifica che il token sia valido
    const payload = jwt.verify(token, JWT_SECRET);

    // 4️⃣ Recupera l'utente dal DB
    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ error: "Utente non trovato" });

    // 5️⃣ Controllo inattività: blocca se ultimo accesso > 30 giorni
    const now = new Date();
    const diffDays = (now - user.lastActive) / (1000 * 60 * 60 * 24); // differenza in giorni
    if (diffDays > 30) return res.status(403).json({ error: "Token scaduto per inattività" });

    // 6️⃣ Aggiorna ultima attività (ottimizzato: solo se differenza > 10 min)
    if (diffDays > 0) { // Puoi modificare la condizione se vuoi
      user.lastActive = now;
      await user.save();
    }

    // 7️⃣ Aggiungi l'utente alla richiesta per i controller
    req.user = user;

    // ✅ Passa al controller successivo
    next();

  } catch (err) {
    console.error("Errore authMiddleware:", err.message);
    return res.status(403).json({ error: "Token non valido" });
  }
};