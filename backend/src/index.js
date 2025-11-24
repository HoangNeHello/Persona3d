const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Optional root route (just to avoid Cannot GET / if you want)
app.get("/", (req, res) => {
  res.send("Persona3D backend is running");
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
  });
});

// Chat endpoint (dummy "LLM")
app.post("/chat", (req, res) => {
  const { messages } = req.body || {};

  // Find last user message
  const lastUserMsg = Array.isArray(messages)
    ? [...messages].reverse().find((m) => m.role === "user")
    : null;

  const userText = lastUserMsg?.content || "there";

  const reply = `You said: "${userText}". (Dummy backend reply for now)`;

  res.json({
    reply,
  });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
