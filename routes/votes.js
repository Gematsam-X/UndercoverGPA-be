import authMiddleware from "../middlewares/authMiddleware.js";
import Vote from "../models/Vote.ts";
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

export default router;