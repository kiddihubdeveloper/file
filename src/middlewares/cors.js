import cors from "cors";
import env from "dotenv";
import checkMd5 from "../utilities/check-md5.js";

env.config();
/**
 * Check if the request has a valid secret key
 * @param {import('express').Request} req
 * @returns {Boolean}
 */
const hasValidSecretKey = (req) => {
  if (!req.headers["x-api-key"]) return false;
  return checkMd5(req.headers["x-api-key"]);
};
/**
 * Middleware to handle CORS
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
export default function (req, res, next) {
  // Configure CORS dynamically
  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin) {
        if (hasValidSecretKey(req)) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
      }

      const allowOrigins = process.env.ALLOW_ORIGIN.split(",");
      const isValid = allowOrigins.some(
        (item) => origin && origin.includes(item)
      );

      return isValid
        ? callback(null, true)
        : callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
  };

  return cors(corsOptions)(req, res, next);
}
