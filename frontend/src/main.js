import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

const app = createApp(App);
app.use(router);
app.mount("#app");

// Boots the Vue app and attaches the router. This is the entrypoint for the SPA.