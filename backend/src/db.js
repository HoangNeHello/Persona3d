// Simple SQLite wrapper using better-sqlite3
const Database = require("better-sqlite3");
const path = require("path");

// Store DB file one level up: backend/persona3d.db
const dbPath = path.join(__dirname, "..", "persona3d.db");
const db = new Database(dbPath);

// Basic schema + settings
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
  );
`);

// Always use a single default conversation for now (id = 1)
function getOrCreateDefaultConversation() {
  const row = db
    .prepare("SELECT id FROM conversations WHERE id = 1")
    .get();

  if (row) return row.id;

  const stmt = db.prepare(
    "INSERT INTO conversations (id, title) VALUES (1, 'Default Conversation')"
  );
  const info = stmt.run();
  return info.lastInsertRowid || 1;
}

// Insert a single message row
function saveMessage(conversationId, role, content) {
  const stmt = db.prepare(
    "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)"
  );
  stmt.run(conversationId, role, content);
}

// Get messages for default conversation, newest last
function getMessages(conversationId, limit = 50) {
  const stmt = db.prepare(
    `
    SELECT role, content, created_at
    FROM messages
    WHERE conversation_id = ?
    ORDER BY created_at ASC, id ASC
    LIMIT ?
  `
  );
  return stmt.all(conversationId, limit);
}

module.exports = {
  db,
  getOrCreateDefaultConversation,
  saveMessage,
  getMessages,
};
