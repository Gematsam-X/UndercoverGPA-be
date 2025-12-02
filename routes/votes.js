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

router.delete("/:_id", authMiddleware, async (req, res) => {
  try {
    const voteId = req.params._id;
    const userId = req.user.id;

    // Trova il voto per ID e userId
    const vote = await Vote.findOne({ _id: voteId, userId: userId });

    if (!vote) {
      return res.status(404).json({ error: "Voto non trovato" });
    }

    // Elimina il voto
    await Vote.deleteOne({ _id: voteId });

    res.status(200).json({ message: "Voto eliminato con successo" });
  } catch (err) {
    console.error("Errore eliminazione voto:", err);
    res.status(500).json({ error: "Errore server: " + err });
  }
});

export default router;
