import FileServices from "../services/File/index.js";
import { TransferFile } from "../requests/TransferFile.js";

export default {
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async store(req, res) {
    try {
      const responseData = await FileServices.upload(req.file);
      return res.status(201).send({
        data: responseData,
      });
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async storeMultiple(req, res) {
    try {
      const { prefix } = req.query;
      const responseData = await FileServices.uploadMultiple(req.files, prefix);
      return res.status(201).send({
        data: responseData,
      });
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async transferUrl(req, res) {
    try {
      const { urls } = new TransferFile(req).validate();
      const responseData = await FileServices.transferUrl(urls);
      return res.status(201).send({
        data: responseData,
      });
    } catch (error) {
      return res.status(400).send(error);
    }
  },
};
