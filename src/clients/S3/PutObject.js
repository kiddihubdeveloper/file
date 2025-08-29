import aws from "../../config/aws.js";
import readFile from "./support/ReadFile.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import exceptionHandler from "./ExceptionHandler.js";
import S3Client from "./Client.js";

/**
 * Get file store key
 * @param {string} originalname
 * @param {string|null} customname
 * @returns {string}
 */
function storeKey(originalname, customname = null) {
  const [mainName, extension] = originalname.split(".");
  return `${Date.now()}-${customname ? customname : mainName}.${extension}`;
}
/**
 * Upload a file to S3 storage
 * @param {Express.Multer.File} file
 * @param {string} key - Full S3 key path (e.g., "prefix/filename.ext")
 * @return {Promise<{filename:string}>}
 */
export default async function (file, key) {
  try {
    const { buffer, contentType } = await readFile(file);
    await S3Client.send(
      new PutObjectCommand({
        Body: buffer,
        ContentType: contentType,
        Bucket: aws.s3.bucket,
        ACL: "public-read",
        Key: key,
      })
    );
    return { filename: key };
  } catch (error) {
    exceptionHandler(error);
  }
}
