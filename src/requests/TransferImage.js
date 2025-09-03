import { Request, Joi } from "./Request.js";

export class TransferImage extends Request {
  /**
   * @param {import('express').Request} req
   */
  constructor(req) {
    super(req, {
      urls: Joi.array()
        .items(
          Joi.string()
            .pattern(/^https?:\/\/.+/)
            .message("Each URL must be a valid HTTP or HTTPS URL")
        )
        .min(1)
        .required()
        .messages({
          "array.min": "At least one URL is required",
          "any.required": "URLs array is required",
        }),
    });
  }
}
