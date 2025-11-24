<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const username = ref("");
const router = useRouter();

const handleLogin = () => {
  if (!username.value.trim()) return;
  localStorage.setItem("persona3d_token", "fake-token");
  router.push({ name: "app" });
};
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h1>Persona3D</h1>
      <p class="subtitle">Sign in to your lab</p>

      <input
        v-model="username"
        type="text"
        placeholder="Enter any name"
        class="login-input"
      />

      <button class="login-button" @click="handleLogin">
        Login
      </button>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  background: #0b1020;
  padding: 2rem 2.5rem;
  border-radius: 1rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  max-width: 360px;
  width: 100%;
  text-align: center;
}

h1 {
  margin: 0 0 0.5rem;
}

.subtitle {
  margin-bottom: 1.5rem;
  color: #9ca3af;
}

.login-input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border-radius: 0.5rem;
  border: 1px solid #374151;
  margin-bottom: 1rem;
  background: #020617;
  color: #f9fafb;
}

.login-input:focus {
  outline: none;
  border-color: #6366f1;
}

.login-button {
  width: 100%;
  padding: 0.7rem 0.8rem;
  border-radius: 0.5rem;
  border: none;
  background: #4f46e5;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.login-button:hover {
  background: #4338ca;
}
</style>
