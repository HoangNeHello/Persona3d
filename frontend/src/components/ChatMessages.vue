<script setup>
const props = defineProps({
  messages: {
    type: Array,
    default: () => [],
  },
});
</script>

<template>
  <div class="messages">
    <div
      v-for="(m, idx) in messages"
      :key="idx"
      class="bubble"
      :class="m.role"
    >
      <div class="sender">
        {{ m.role === "user" ? "You" : "Persona" }}
      </div>
      <div class="content">
        {{ m.content }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.messages {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.bubble {
  max-width: 80%;
  padding: 0.6rem 0.8rem;
  border-radius: 0.75rem;
  font-size: 0.9rem;
}
.bubble.user {
  align-self: flex-end;
  background: #4f46e5;
  color: #f9fafb;
}
.bubble.assistant {
  align-self: flex-start;
  background: #111827;
  color: #e5e7eb;
}
.sender {
  font-size: 0.7rem;
  opacity: 0.7;
  margin-bottom: 0.1rem;
}
</style>
