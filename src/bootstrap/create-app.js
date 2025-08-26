import express from "express";
import middlewares from "../middlewares/index.js";
import createRouter from "./create-router.js";
import { rateLimit } from "express-rate-limit";

/**
 * Create Express application
 * @param {number} port Port that Express application listen on
 */
export default function (port) {
  const app = express();

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    // store: ... , // Redis, Memcached, etc. See below.
  });

  app.use(middlewares.cors);
  
  app.use(express.urlencoded({ extended: true }));
  /** Parse JSON bodies */
  app.use(express.json());
  /** Trust proxy */
  app.set("trust proxy", 1);
  /** Initialize API routes */
  app.use("/", createRouter());
  /** Apply rate limiting */
  app.use(limiter);
  /** Start the server */
  app.listen(port, () => {
    console.log(`[INFO] Express Server: Server is listening on port ${port}`);
  });

  return app;
}
