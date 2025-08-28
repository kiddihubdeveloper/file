import { Request, Joi } from "./Request.js";
import imageConfig from "../config/images.js";

export class StoreImage extends Request {
  /**
   * @param {import('express').Request} req
   */
  constructor(req) {
    const validThumbnails = Object.keys(imageConfig.thumbnails);
    super(req, {
      thumbnail: Joi.string()
        .valid(...validThumbnails)
        .optional(),
    });
  }
}
