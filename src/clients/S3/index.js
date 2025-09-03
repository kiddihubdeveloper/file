import PutObject from "./PutObject.js";
import DeleteObject from "./DeleteObject.js";
import aws from "../../config/aws.js";

export default {
  PutObject,
  DeleteObject,
  __cnf: {
    endpoint: aws.s3.endpoint,
    bucket: aws.s3.bucket,
    baseCDN: aws.baseCDN,
  },
};
