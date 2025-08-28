import { Request, Joi } from "./Request.js";
export class TransferFile extends Request {
  /**
   * @param {import('express').Request} req
   */
  constructor(req) {
    super(req, {
      urls: Joi.array().items(Joi.string().uri()).required(),
    });
  }
}
