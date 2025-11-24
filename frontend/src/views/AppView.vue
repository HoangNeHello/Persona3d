<script setup>
import { ref, onMounted } from "vue";
import ChatMessages from "../components/ChatMessages.vue";
import ChatInput from "../components/ChatInput.vue";
import AvatarCanvas from "../components/AvatarCanvas.vue";

const backendStatus = ref("checking");

const messages = ref([
  {
    role: "assistant",
    content: "Hi, I'm your Persona3D prototype. Say hi!",
  },
]);

const checkBackend = async () => {
  backendStatus.value = "checking";
  try {
    const res = await fetch("http://localhost:3000/health");
    backendStatus.value = res.ok ? "ok" : "error";
  } catch (e) {
    backendStatus.value = "error";
  }
};

const handleSendMessage = async (text) => {
  const userMsg = { role: "user", content: text };
  messages.value.push(userMsg);

  try {
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

    messages.value.push({
      role: "assistant",
      content: data.reply ?? "[no reply from backend]",
    });
  } catch (err) {
    console.error(err);
    messages.value.push({
      role: "assistant",
      content: "Oops, something went wrong talking to the backend.",
    });
  }
};


onMounted(checkBackend);
</script>


<template>
  <div class="app-page">
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
      <!-- LEFT: avatar placeholder -->
      <section class="avatar-panel">
        <div class="avatar-wrapper">
          <AvatarCanvas />
          <div class="avatar-caption">
            <h2>Persona Avatar</h2>
            <p>Level 1: simple 3D placeholder. Later: full character.</p>
          </div>
        </div>
      </section>


      <!-- RIGHT: chat panel -->
      <section class="chat-panel">
        <div class="chat-header">Chat</div>
        <div class="chat-messages">
          <ChatMessages :messages="messages" />
        </div>
        <ChatInput @send="handleSendMessage" />
      </section>
    </main>
  </div>
</template>

<style scoped>
.app-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1.4rem;
  border-bottom: 1px solid #111827;
  background: rgba(3, 7, 18, 0.9);
}

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

.status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
}

.small-btn {
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  background: #4f46e5;
  color: white;
}

.app-main {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.3fr);
  gap: 1px;
  min-height: 0;
}

.avatar-panel,
.chat-panel {
  padding: 1rem;
}

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

.chat-panel {
  display: flex;
  flex-direction: column;
}

.chat-header {
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.chat-messages {
  flex: 1;
  border-radius: 0.75rem;
  border: 1px solid #1f2933;
  padding: 0.75rem;
  overflow-y: auto;
}
</style>
