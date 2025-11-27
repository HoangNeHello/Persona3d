<script setup>
// Core Vue APIs
import { ref, onMounted } from "vue";

// UI components
import ChatMessages from "../components/ChatMessages.vue";
import ChatInput from "../components/ChatInput.vue";
import AvatarCanvas from "../components/AvatarCanvas.vue";

// Backend health status (ok / error / checking)
const backendStatus = ref("checking");

// Conversation history shown in chat
const messages = ref([]);

const defaultGreeting = {
  role: "assistant",
  content: "Hi, I'm your Persona3D prototype. Say hi!",
};


// Flags for async state
const isSending = ref(false);   // true while waiting for backend reply
const isSpeaking = ref(false);  // true while TTS is speaking

// Ping backend /health to check server status
const checkBackend = async () => {
  backendStatus.value = "checking";
  try {
    const res = await fetch("http://localhost:3000/health");
    backendStatus.value = res.ok ? "ok" : "error";
  } catch (e) {
    backendStatus.value = "error";
  }
};

const loadHistory = async () => {
  try {
    // Ask backend for recent messages from default conversation
    const res = await fetch("http://localhost:3000/history");
    if (!res.ok) throw new Error("Failed to load history");
    const data = await res.json();

    if (Array.isArray(data.messages) && data.messages.length > 0) {
      // We have stored messages → use them
      messages.value = data.messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));
    } else {
      // No history yet → start with default greeting
      messages.value = [defaultGreeting];
    }
  } catch (e) {
    console.error("History load failed:", e);
    // On error, still show something friendly
    messages.value = [defaultGreeting];
  }
};



// Simple browser TTS wrapper (no external API)
const speak = (text) => {
  // Guard for unsupported browsers
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("speechSynthesis not supported in this browser.");
    return;
  }

  // Stop any previous speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // Update speaking flag for UI + avatar animation
  utterance.onstart = () => {
    isSpeaking.value = true;
  };

  utterance.onend = () => {
    isSpeaking.value = false;
  };

  utterance.onerror = () => {
    isSpeaking.value = false;
  };

  window.speechSynthesis.speak(utterance);
};

// Handle user sending a new chat message
const handleSendMessage = async (text) => {
  if (isSending.value) return; // prevent double-send

  const userMsg = { role: "user", content: text };
  messages.value.push(userMsg);
  isSending.value = true;

  try {
    // Call backend /chat endpoint with full message history
    const res = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages.value,
      }),
    });

    if (!res.ok) {
      throw new Error("Chat request failed");
    }

    const data = await res.json();
    const replyText = data.reply ?? "[no reply from backend]";

    const assistantMsg = {
      role: "assistant",
      content: replyText,
    };

    // Show assistant reply in UI
    messages.value.push(assistantMsg);

    // Speak the reply using browser TTS
    speak(replyText);
  } catch (err) {
    console.error(err);

    const fallback = "Oops, something went wrong talking to the backend.";

    messages.value.push({
      role: "assistant",
      content: fallback,
    });

    speak(fallback);
  } finally {
    isSending.value = false;
  }
};

// Run backend health check when view is mounted
onMounted(() => {
  checkBackend();
  loadHistory();
});

</script>

<template>
  <div class="app-page">
    <!-- Top bar: title + backend status -->
    <header class="app-header">
      <div class="logo">
        <span class="dot" />
        <span>Persona3D Lab</span>
      </div>

      <div class="status">
        <span v-if="backendStatus === 'checking'">🟡 Backend: checking...</span>
        <span v-else-if="backendStatus === 'ok'">🟢 Backend: OK</span>
        <span v-else>🔴 Backend: offline</span>
        <button class="small-btn" @click="checkBackend">Retry</button>
      </div>
    </header>

    <main class="app-main">
      <!-- LEFT: 3D avatar area -->
      <section class="avatar-panel">
        <div class="avatar-wrapper">
          <!-- talking prop drives cube animation -->
          <AvatarCanvas :talking="isSpeaking" />
          <div class="avatar-caption">
            <h2>Persona Avatar</h2>
            <p>Level 2: simple talking animation driven by TTS.</p>
          </div>
        </div>
      </section>

      <!-- RIGHT: chat panel -->
      <section class="chat-panel">
        <div class="chat-header">
          Chat
          <!-- Show thinking/speaking state next to title -->
          <span v-if="isSending" class="typing-indicator">
            Persona is thinking…
          </span>
          <span v-else-if="isSpeaking" class="typing-indicator">
            Persona is speaking…
          </span>
        </div>

        <div class="chat-messages">
          <!-- Message list (user + assistant bubbles) -->
          <ChatMessages :messages="messages" />
        </div>

        <!-- Input box + send button -->
        <ChatInput @send="handleSendMessage" />
      </section>
    </main>
  </div>
</template>

<style scoped>
/* Small status text beside "Chat" */
.typing-indicator {
  margin-left: 0.5rem;
  font-size: 0.8rem;
  opacity: 0.7;
}

/* Page layout */
.app-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Top header bar */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1.4rem;
  border-bottom: 1px solid #111827;
  background: rgba(3, 7, 18, 0.9);
}

/* Logo / title styling */
.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #4f46e5;
}

/* Backend status area */
.status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
}

/* Small pill-style button */
.small-btn {
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  background: #4f46e5;
  color: white;
}

/* Main two-column layout */
.app-main {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.3fr);
  gap: 1px;
  min-height: 0;
}

/* Shared padding for both panels */
.avatar-panel,
.chat-panel {
  padding: 1rem;
}

/* Left: avatar panel layout */
.avatar-panel {
  border-right: 1px solid #111827;
  display: flex;
  align-items: stretch;
  justify-content: center;
}

.avatar-wrapper {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.avatar-caption h2 {
  margin: 0;
  font-size: 1rem;
}

.avatar-caption p {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
  opacity: 0.7;
}

/* Right: chat panel layout */
.chat-panel {
  display: flex;
  flex-direction: column;
}

.chat-header {
  font-weight: 600;
  margin-bottom: 0.75rem;
}

/* Scrollable message area */
.chat-messages {
  flex: 1;
  border-radius: 0.75rem;
  border: 1px solid #1f2933;
  padding: 0.75rem;
  overflow-y: auto;
}
</style>
