import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import S3Client from "./Client.js";
import aws from "../../config/aws.js";

/**
 * Delete an object from S3 by key
 * @param {string} key
 * @returns {Promise<void>}
 */
export default async function DeleteObject(key) {
  await S3Client.send(
    new DeleteObjectCommand({
      Bucket: aws.s3.bucket,
      Key: key,
    })
  );
}
