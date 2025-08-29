import S3 from "../../clients/S3/index.js";
export default async function deleteImageByKey(key) {
  await S3.DeleteObject(key);
}
