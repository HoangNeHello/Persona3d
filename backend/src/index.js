// Core dependencies
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Use built-in fetch if available (Node 18+), otherwise fallback to node-fetch
const fetch = global.fetch || require("node-fetch");

const {
  getOrCreateDefaultConversation,
  saveMessage,
  getMessages,
} = require("./db");


/**
 * Call external LLM API with the current conversation history.
 * This is written to be generic and controlled via environment variables.
 */
async function callLLM(messages) {
  const apiKey = process.env.LLM_API_KEY;
   const apiBase =
    process.env.LLM_API_BASE || "https://api.groq.com/openai/v1/chat/completions";
  const model =
    process.env.LLM_MODEL || "llama-3.1-8b-instant";

  // If not configured, force an error so the caller can fall back
  if (!apiKey || !apiBase) {
    throw new Error("LLM_API_KEY or LLM_API_BASE not configured");
  }

  const payload = {
    model,               // ✅ required by Groq/OpenAI-style APIs
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

    // Ensure we have a main conversation
    const conversationId = getOrCreateDefaultConversation();

    // Last user message (for logging + DB)
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    const userText = lastUserMsg?.content ?? "";

    console.log("Incoming last user message:", userText);

    // Save user message to DB (if any)
    if (userText) {
      saveMessage(conversationId, "user", userText);
    }

    // Try to call LLM (or fail to fallback)
    let reply;
    try {
      reply = await callLLM(messages);
    } catch (err) {
      console.error("LLM call failed, using fallback:", err.message);
      reply =
        "I'm having some trouble talking to my brain (LLM service). This is a fallback reply.";
    }

    // Save assistant message to DB
    saveMessage(conversationId, "assistant", reply);

    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);

    const fallback =
      "I'm having some trouble talking to my brain (LLM service). This is a fallback reply.";

    // Try to record fallback assistant message if possible
    try {
      const conversationId = getOrCreateDefaultConversation();
      saveMessage(conversationId, "assistant", fallback);
    } catch (e) {
      console.error("Failed to save fallback message:", e.message);
    }

    res.status(500).json({ reply: fallback });
  }
});

// Load recent message history for the default conversation
app.get("/history", (req, res) => {
  try {
    const conversationId = getOrCreateDefaultConversation();
    const msgs = getMessages(conversationId, 50);

    res.json({
      conversationId,
      messages: msgs.map((m) => ({
        role: m.role,
        content: m.content,
        created_at: m.created_at,
      })),
    });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ messages: [] });
  }
});


// Start HTTP server
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
