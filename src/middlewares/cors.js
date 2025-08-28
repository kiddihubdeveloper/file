import cors from "cors";
import appConfig from "../config/app.js";

export default cors({
  origin: (origin, callback) => {
    const allowOrigins = appConfig.allowOrigins
    const isValid = allowOrigins.some(
      (item) => origin && origin.includes(item)
    );
    return isValid
      ? callback(null, true)
      : callback("Not allowed by CORS");
  },
  methods: ["GET", "POST"],
});
