import { readFile } from "node:fs/promises";
/**
 * @param {string|Express.Multer.File} file
 */
export default async function (file) {
  const output = {
    buffer: null,
    contentType: null,
    originalname: "",
  };
  if (typeof file === "string") {
    const response = await fetch(file);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${file}: ${response.statusText}`);
    }
    output.contentType = response.headers.get("content-type");
    output.buffer = Buffer.from(await response.arrayBuffer());
    output.originalname = file.split("/").pop();
  } else {
    output.contentType = file.mimetype;
    output.buffer = await readFile(file.path);
    output.originalname = file.originalname;
  }
  return output;
}
