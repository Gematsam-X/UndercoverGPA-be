import authMiddleware from "../middlewares/authMiddleware.js";
import Vote from "../models/Vote.js";
import express from "express";

const router = express.Router();

// Endpoint nuovo voto
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { label, value, subject, examType, createdAt } = req.body;

    if (!label || value === undefined)
      return res.status(400).json({ error: "Dati del voto mancanti" });

    // Salva il voto nel DB
    const newVote = new Vote({
      userId: req.user.id, // preso dal token JWT nell'authMiddleware
      label,
      value,
      subject,
      examType,
      createdAt,
    });

    await newVote.save();

    res
      .status(201)
      .json({ message: "Voto creato con successo!", vote: newVote });
  } catch (err) {
    console.error("Errore creazione voto:", err);
    res.status(500).json({ error: "Errore server" + err });
  }
});

// Endpoint GET per ottenere i voti dell'utente loggato
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Recupera tutti i voti dell'utente
    const votes = await Vote.find({ userId: userId }).sort({ createdAt: -1 });
    // -1 ordina dal più recente al più vecchio

    if (!votes || votes.length === 0) {
      return res
        .status(200)
        .json({ message: "Nessun voto trovato", votes: [] });
    }

    // Ritorna i voti
    res.status(200).json(votes);
  } catch (err) {
    console.error("Errore recupero voti:", err);
    res.status(500).json({ error: "Errore server: " + err });
  }
});

export default router;
