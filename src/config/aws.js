import dotenv from "dotenv";

dotenv.config();

export default {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_DEFAULT_REGION,
    //
    baseCDN: process.env.AWS_CDN_BASE,
    //
    s3: {
        endpoint: process.env.AWS_S3_URL,
        bucket: process.env.AWS_S3_BUCKET,
    },
}