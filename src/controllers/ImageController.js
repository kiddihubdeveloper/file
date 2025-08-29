import S3 from "../clients/S3/index.js";
import { StoreImage } from "../requests/StoreImage.js";
import FileServices from "../services/File/index.js";
import imageConfig from "../config/images.js";

import uploadImage from "../services/Image/uploadImage.js";
import ImageServices from "../services/Image/index.js";

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
      const result = await uploadImage(req.files, category, prefix);
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
};
