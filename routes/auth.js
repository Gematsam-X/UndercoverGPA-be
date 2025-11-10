import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.ts";
import express from "express";
import cookieParser from "cookie-parser";

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRE = "1h"; // access token breve
const REFRESH_TOKEN_EXPIRE = "30d"; // refresh token lungo
const router = express.Router();

// Middleware cookie parser necessario
router.use(cookieParser());

// --- FUNZIONI JWT ---
// Genera access token breve (lato client useremo questo)
const generateAccessToken = (user) =>
  jwt.sign(
    { id: user._id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRE }
  );

// Genera refresh token lungo (con solo id per sicurezza)
const generateRefreshToken = (user) =>
  jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRE });

// --- LOGIN ---
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Inserisci email e password" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Utente non trovato" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Password errata" });

    // Genera token
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Salva refresh token nel cookie HTTP-only
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // ⚠️ metti true solo se usi HTTPS
      sameSite: "Lax", // ✅ "Lax" permette cookie tra localhost:4200 e :3000
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 giorni
      path: "/", // 👈 importante per essere letto ovunque
    });

    // Ritorna solo accessToken e username (email non serve lato client se vuoi)
    res.json({
      message: "Login riuscito!",
      accessToken,
      username: user.username,
    });
  } catch (error) {
    console.error("Errore login:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});

// --- REGISTRAZIONE ---
router.post("/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password)
      return res.status(400).json({ error: "Tutti i campi sono obbligatori" });
    const emailNormalized = email.toLowerCase();

    const existingUser = await User.findOne({
      $or: [{ email: emailNormalized }, { username }],
    });

    if (existingUser)
      return res.status(400).json({ error: "Email o username già registrati" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "Utente registrato con successo!" });
  } catch (error) {
    console.error("Errore registrazione:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});

// --- RINNOVA ACCESS TOKEN ---
router.post("/token", async (req, res) => {
  const { refreshToken } = req.cookies; // legge cookie HTTP-only
  if (!refreshToken)
    return res.status(400).json({ error: "Refresh token mancante" });

  try {
    const payload = jwt.verify(refreshToken, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ error: "Utente non trovato" });

    const newAccessToken = generateAccessToken(user);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ error: "Refresh token scaduto o non valido" });
  }
});

// --- CHECK EMAIL / USERNAME ---
router.get("/check", async (req, res) => {
  try {
    const { email, username } = req.query;
    if (!email && !username)
      return res.status(400).json({ error: "Specificare email o username" });

    const filter = {};
    if (email) filter.email = email;
    if (username) filter.username = username;

    const user = await User.findOne(filter);
    res.json({ exists: !!user });
  } catch (error) {
    console.error("Errore controllo email/username:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});

export default router;
