// Core dependencies
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Use built-in fetch if available (Node 18+), otherwise fallback to node-fetch
const fetch = global.fetch || require("node-fetch");

/**
 * Call external LLM API with the current conversation history.
 * This is written to be generic and controlled via environment variables.
 */
async function callLLM(messages) {
  const apiKey = process.env.LLM_API_KEY;
  const apiBase = process.env.LLM_API_BASE;
  const model = process.env.LLM_MODEL || "gpt-4o-mini";

  // If not configured, force an error so the caller can fall back
  if (!apiKey || !apiBase) {
    throw new Error("LLM_API_KEY or LLM_API_BASE not configured");
  }

  const payload = {
    model,
    messages: [
      // System prompt: controls the assistant behaviour
      {
        role: "system",
        content:
          "You are Persona3D, a friendly AI persona speaking via a 3D avatar. Keep replies concise and conversational.",
      },
      // Map frontend messages (user / assistant) into LLM format
      ...messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    ],
  };

  const res = await fetch(apiBase, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM error: ${res.status} ${text}`);
  }

  const data = await res.json();
  const reply =
    data.choices?.[0]?.message?.content?.trim() ||
    "I couldn't think of a reply, sorry.";

  return reply;
}

// ----- Global middlewares -----
app.use(cors());           // allow frontend (different port) to call this API
app.use(express.json());   // parse JSON bodies

// Root route: simple text to confirm server is running
app.get("/", (req, res) => {
  res.send("Persona3D backend is running");
});

// Health check: used by frontend to show backend status
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
  });
});

// Main chat endpoint: receives conversation history and returns assistant reply
app.post("/chat", async (req, res) => {
  try {
    const { messages = [] } = req.body || {};

    // Log last user message for debugging
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    console.log("Incoming last user message:", lastUserMsg?.content);

    // Try to call real LLM service
    const reply = await callLLM(messages);

    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);

    // Fallback reply if LLM call fails or is not configured
    res.status(500).json({
      reply:
        "I'm having some trouble talking to my brain (LLM service). This is a fallback reply.",
    });
  }
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
