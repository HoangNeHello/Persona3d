import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import AppView from "../views/AppView.vue";

const routes = [
  { path: "/login", name: "login", component: LoginView },
  { path: "/app", name: "app", component: AppView },
  { path: "/", redirect: "/login" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const isAuthed = !!localStorage.getItem("persona3d_token");

  if (to.name === "app" && !isAuthed) {
    return next({ name: "login" });
  }

  if (to.name === "login" && isAuthed) {
    return next({ name: "app" });
  }

  next();
});

export default router;
