import authMiddleware from "../middlewares/authMiddleware.js";
import Vote from "../models/Vote.js";
import express from "express";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// --- GET backup voti ---
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const votes = await Vote.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(votes);
  } catch (err) {
    console.error("Errore recupero backup voti:", err);
    res.status(500).json({ error: "Errore server: " + err });
  }
});

// --- POST restore backup voti ---
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { votes: clientVotes, priority } = req.body;

    // 🔹 Validazione base
    if (
      !Array.isArray(clientVotes) ||
      !["replace", "backup", "server"].includes(priority)
    ) {
      return res.status(400).json({ error: "Dati del backup non validi" });
    }

    const serverVotes = await Vote.find({ userId });
    let finalVotes = [];

    // ================= REPLACE =================
    if (priority === "replace") {
      console.log(
        "[restore] Priority: REPLACE - cancello tutto e inserisco client"
      );

      // cancella tutti i voti dell'utente
      await Vote.deleteMany({ userId });

      // assegna logicalId unici se non presenti
      finalVotes = clientVotes.map((v) => ({
        logicalId: v.logicalId || uuidv4(),
        userId,
        label: v.label,
        value: v.value,
        subject: v.subject,
        examType: v.examType,
        createdAt: v.createdAt ? new Date(v.createdAt) : new Date(),
      }));

      const inserted = await Vote.insertMany(finalVotes);
      console.log("[restore] inserted votes:", inserted.length);

      return res.status(200).json({
        message: "Backup ripristinato con successo (REPLACE)!",
        votesCount: inserted.length,
      });
    }

    // ================= MERGE BACKUP/SERVER =================
    console.log(
      "[restore] Priority:",
      priority.toUpperCase(),
      "- faccio merge"
    );

    // 🔹 Creiamo una mappa con chiavi logiche: logicalId
    const voteMap = new Map();
    const first = priority === "backup" ? clientVotes : serverVotes;
    const second = priority === "backup" ? serverVotes : clientVotes;

    // 🔹 Inseriamo i voti del primo set
    first.forEach((v) => {
      const id = v.logicalId || uuidv4();
      voteMap.set(id, {
        logicalId: id,
        userId,
        label: v.label,
        value: v.value,
        subject: v.subject,
        examType: v.examType,
        createdAt: v.createdAt ? new Date(v.createdAt) : new Date(),
      });
    });

    // 🔹 Inseriamo i voti del secondo set solo se logicalId non esiste
    second.forEach((v) => {
      const id = v.logicalId || uuidv4();
      if (!voteMap.has(id)) {
        voteMap.set(id, {
          logicalId: id,
          userId,
          label: v.label,
          value: v.value,
          subject: v.subject,
          examType: v.examType,
          createdAt: v.createdAt ? new Date(v.createdAt) : new Date(),
        });
      }
    });

    finalVotes = Array.from(voteMap.values());

    // 🔹 Cancella tutti i voti esistenti e inserisci il merge
    await Vote.deleteMany({ userId });
    const inserted = await Vote.insertMany(finalVotes);

    console.log("[restore] inserted votes after merge:", inserted.length);

    return res.status(200).json({
      message: `Backup ripristinato con successo (MERGE - ${priority.toUpperCase()})!`,
      votesCount: inserted.length,
    });
  } catch (err) {
    console.error("❌ Errore ripristino backup:", err);
    return res
      .status(500)
      .json({ error: "Errore server durante il ripristino del backup" });
  }
});

export default router;
