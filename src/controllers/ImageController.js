import { StoreImage } from "../requests/StoreImage.js";
import FileServices from "../services/File/index.js";
import ImageServices from "../services/Image/index.js";
import { TransferImage } from "../requests/TransferImage.js";

export default {
  // /**
  //  * Upload single image by category, with optional prefix
  //  */
  // async uploadByCategory(req, res) {
  //   try {
  //     const { category } = req.params;
  //     const prefix = req.query.prefix || req.body.prefix || null;
  //     const result = await uploadImage(req.file, category, prefix);
  //     res.status(201).json({ message: "Image uploaded", files: result });
  //   } catch (error) {
  //     res.status(400).json({ error: error.message });
  //   }
  // },

  /**
   * Upload multiple images by category, with optional prefix
   */
  async uploadMultipleByCategory(req, res) {
    try {
      const { category } = req.params;
      const prefix = req.query.prefix || req.body.prefix || null;
      const result = await ImageServices.uploadImage(
        req.files,
        category,
        prefix
      );
      res.status(201).json({ message: "Images uploaded", files: result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Delete image by S3 key (e.g. /image/abc.png or image/abc.png)
   */
  async deleteByKey(req, res) {
    try {
      let { key } = req.body;
      if (!key) return res.status(400).json({ error: "Missing key" });
      // Remove leading slash if present
      if (key.startsWith("/")) key = key.slice(1);
      await ImageServices.deleteImageByKey(key);
      res.status(200).json({ message: "Image deleted", key });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Transfer images from URLs to S3 by category
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async transferUrl(req, res) {
    try {
      const { category } = req.params;
      const prefix = req.query.prefix || req.body.prefix || null;

      // Validate request
      const { urls } = new TransferImage(req).validate();

      const responseData = await ImageServices.transferUrl(
        urls,
        category,
        prefix
      );

      return res.status(201).send({
        message: "Images transferred",
        files: responseData,
      });
    } catch (error) {
      // Better error logging
      if (error.details) {
        // Joi validation error
        console.error(
          "Validation error:",
          error.details.map((d) => d.message)
        );
        return res.status(400).send({
          error: "Validation failed",
          details: error.details.map((d) => d.message),
        });
      }

      return res.status(400).send({ error: error.message });
    }
  },
};
