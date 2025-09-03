import express from "express";
import ImageController from "../controllers/ImageController.js";
import FileController from "../controllers/FileController.js";
import { uploader } from "../utils/uploader.js";
import fileConfig from "../config/file.js";

const router = express.Router();

export default function () {
  router.post("/file", uploader.single("file"), FileController.store);
  router.post(
    "/multiple-file",
    uploader.array("files", fileConfig.max_files),
    FileController.storeMultiple
  );
  router.post("/transfer-file-url", FileController.transferUrl);
  router.post(
    "/multiple-image/:category",
    uploader.array("files", fileConfig.max_files),
    ImageController.uploadMultipleByCategory
  );
  router.delete("/image/delete-by-key", ImageController.deleteByKey);
  router.post(
    "/image/transfer-image-url/:category",
    ImageController.transferUrl
  );
  return router;
}
