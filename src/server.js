import createApp from "./boostrap/create-app.js";

(async function () {
  try {
    const APP_PORT = process.env.APP_PORT || 5000;

    const app = createApp(APP_PORT);
  } catch (error) {
    console.log("[ERROR]: ", error.message);
  }
})();
