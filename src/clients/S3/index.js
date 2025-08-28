import PutObject from "./PutObject.js";
import aws from "../../config/aws.js";

export default {
    PutObject,
    __cnf: {
        endpoint: aws.s3.endpoint,
        bucket: aws.s3.bucket,
        baseCDN: aws.baseCDN
    }
}