import { S3Client } from "@aws-sdk/client-s3";
import aws from "../../config/aws.js";

export default new S3Client({
    credentials: {
        accessKeyId: aws.accessKeyId,
        secretAccessKey: aws.secretAccessKey
    },
    region: aws.region,
    endpoint: aws.s3.endpoint,
    forcePathStyle: true
})
