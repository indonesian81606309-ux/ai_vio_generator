import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  message: { error: "Terlalu banyak permintaan, silakan tunggu sebentar." }
});
app.use("/api", limiter);

// Cache
const cache = new Map();

async function getVioResponse(version, prompt) {
  const cacheKey = `${version}-${prompt.substring(0, 100)}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const model = version === "K1.5" ? "gpt-4o-mini" : "gpt-4o";

    const response = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: model,
      messages: [{ role: "user", content: prompt }],
      temperature: version === "K3" ? 0.65 : 0.75,
      max_tokens: version === "K1.5" ? 1000 : 2000
    }, {
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const result = {
      version: `Vio ${version}`,
      result: response.data.choices[0].message.content,
      speed: "live"
    };

    cache.set(cacheKey, result);
    return result;

  } catch (error) {
    console.error(error);
    return {
      version: `Vio ${version}`,
      result: "Maaf, Vio sedang sibuk. Silakan coba lagi beberapa detik lagi."
    };
  }
}

// Routes
app.post("/api/vio", async (req, res) => {
  const { version, prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt tidak boleh kosong" });

  const data = await getVioResponse(version, prompt);
  res.json({ success: true, ai: "Vio", ...data });
});

app.get("/", (req, res) => {
  res.send("✅ Vio AI Server is running!");
});

app.listen(PORT, () => {
  console.log(`🚀 Vio AI Server berjalan di port ${PORT}`);
});
