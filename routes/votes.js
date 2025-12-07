import authMiddleware from "../middlewares/authMiddleware.js";
import Vote from "../models/Vote.js";
import express from "express";

const router = express.Router();

// --- Endpoint nuovo voto ---
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { label, value, subject, examType, createdAt } = req.body;

    if (!label || value === undefined || !subject || !examType || !createdAt)
      return res.status(400).json({ error: "Dati del voto mancanti" });

    const newVote = new Vote({
      userId: req.user.id,
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
    res.status(500).json({ error: "Errore server: " + err });
  }
});

// --- Endpoint GET voti utente ---
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const votes = await Vote.find({ userId }).sort({ createdAt: -1 });

    if (!votes || votes.length === 0)
      return res
        .status(200)
        .json({ message: "Nessun voto trovato", votes: [] });

    res.status(200).json(votes);
  } catch (err) {
    console.error("Errore recupero voti:", err);
    res.status(500).json({ error: "Errore server: " + err });
  }
});

// --- Endpoint DELETE voto ---
router.delete("/:_id", authMiddleware, async (req, res) => {
  try {
    const voteId = req.params._id;
    const userId = req.user.id;

    const vote = await Vote.findOne({ _id: voteId, userId });
    if (!vote) return res.status(404).json({ error: "Voto non trovato" });

    await Vote.deleteOne({ _id: voteId });

    res.status(200).json({ message: "Voto eliminato con successo" });
  } catch (err) {
    console.error("Errore eliminazione voto:", err);
    res.status(500).json({ error: "Errore server: " + err });
  }
});

// --- Endpoint PUT aggiornamento voto ---
router.put("/:_id", authMiddleware, async (req, res) => {
  try {
    const voteId = req.params._id;
    const userId = req.user.id;
    const { label, value, subject, examType, createdAt } = req.body;

    // ✅ tutti i campi sono obbligatori
    if (!label || value === undefined || !subject || !examType || !createdAt)
      return res.status(400).json({
        error:
          "Tutti i campi (label, value, subject, examType, createdAt) sono obbligatori",
      });

    // Trova voto
    const vote = await Vote.findOne({ _id: voteId, userId });
    if (!vote) return res.status(404).json({ error: "Voto non trovato" });

    // Aggiorna tutti i campi
    vote.label = label;
    vote.value = value;
    vote.subject = subject;
    vote.examType = examType;
    vote.createdAt = new Date(createdAt);

    await vote.save();

    res.status(200).json({
      ok: true,
      message: "Voto aggiornato con successo!",
      vote,
    });
  } catch (err) {
    console.error("Errore aggiornamento voto:", err);
    res.status(500).json({ error: "Errore server: " + err });
  }
});

export default router;
