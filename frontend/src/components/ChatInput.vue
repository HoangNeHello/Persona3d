<script setup>
import { ref } from "vue";

const emit = defineEmits(["send"]);

const text = ref("");

const handleSend = () => {
  if (!text.value.trim()) return;
  emit("send", text.value.trim());
  text.value = "";
};
</script>

<template>
  <div class="input-row">
    <input
      v-model="text"
      type="text"
      placeholder="Type a message..."
      @keyup.enter="handleSend"
    />
    <button @click="handleSend">
      Send
    </button>
  </div>
</template>

<style scoped>
.input-row {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}
input {
  flex: 1;
  padding: 0.6rem 0.8rem;
  border-radius: 999px;
  border: 1px solid #374151;
  background: #020617;
  color: #f9fafb;
}
button {
  padding: 0.6rem 1rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  background: #4f46e5;
  color: #fff;
  font-weight: 500;
}
</style>
