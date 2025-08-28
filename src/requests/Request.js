import Joi from "joi";

class Request {
  /**
   * @type {import('express').Request}
   */
  origin;
  /**
   * @type {import('joi').ObjectSchema}
   */
  validateRules;
  /**
   * @type {Object<string, any>}
   */
  data = {};
  /**
   * @param {import('express').Request} req
   * @param {import('joi').ObjectSchema|null} validateRules
   */
  constructor(req, validateRules = null) {
    this.validateRules = validateRules;
    this.data = this.#getData(req);
    this.origin = req;
  }
  /**
   * Get request data
   * @param {import('express').Request} req
   * @return {{}}
   */
  #getData(req) {
    if (req.method == "GET") return { ...req.query, ...req.params };
    return req.body;
  }
  /**
   * Validate request data and return all data if success
   */
  validate() {
    if (this.validateRules == null) return this.data;
    const { error } = Joi.object(this.validateRules)
      .options({ stripUnknown: true })
      .validate(this.data);
    if (error) throw error.details[0].message;
    return Object.keys(this.validateRules).reduce((all, fieldName) => {
      if (!!this.data[fieldName]) all[fieldName] = this.data[fieldName];
      return all;
    }, {});
  }
}
export { Request, Joi };
