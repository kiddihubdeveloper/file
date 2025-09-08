import multer from "multer";
import fs from "fs";
import fileConfig from "../config/file.js";

// Ensure upload directory exists
if (!fs.existsSync(fileConfig.upload_folder)) {
  fs.mkdirSync(fileConfig.upload_folder, { recursive: true });
}

export const uploader = multer({
  dest: fileConfig.upload_folder,
  limits: {
    fileSize: fileConfig.max_file_size,
    // files: fileConfig.max_files,
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Ensure directory exists before writing
      if (!fs.existsSync(fileConfig.upload_folder)) {
        fs.mkdirSync(fileConfig.upload_folder, { recursive: true });
      }
      cb(null, fileConfig.upload_folder);
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  }),
});
