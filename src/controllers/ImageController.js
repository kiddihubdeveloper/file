import { StoreImage } from "../requests/StoreImage.js";
import FileServices from "../services/File/index.js";
import ImageServices from "../services/Image/index.js";
import imageConfig from "../config/images.js";

export default {
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async store(req, res) {
    // try {
    const params = new StoreImage(req).validate();
    //   const { filename } = await FileServices.upload(req.file, false);
    const thumbnailPath = await ImageServices.Thumnail.makeOne(req.file, {
      width: 512,
      height: 235,
    });
    //   return res.status(201).send(ImageServices.url(filename));
    return res
      .status(201)
      .send({ message: "Image uploaded successfully", thumbnailPath });
    // } catch (error) {
    //   return res.status(400).send(error);
    // }
  },
};
