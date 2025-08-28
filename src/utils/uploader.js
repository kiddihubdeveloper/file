import multer from "multer";
import fileConfig from "../config/file.js";

export const uploader = multer({
  dest: fileConfig.upload_folder,
  limits: {
    fileSize: fileConfig.max_file_size,
    files: fileConfig.max_files,
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, fileConfig.upload_folder);
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  }),
});
