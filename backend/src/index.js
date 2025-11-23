const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
  });
});

// TODO: /chat and other routes will go here later

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

