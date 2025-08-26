import createApp from "./bootstrap/create-app.js";

(async function () {
  try {
    const APP_PORT = process.env.APP_PORT || 5000;

    return createApp(APP_PORT);

  } catch (error) {
    console.log("[ERROR] express: ", error.message);
  }
})();
