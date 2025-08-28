import { S3ServiceException } from "@aws-sdk/client-s3";

export default function (error) {
  if (error instanceof S3ServiceException && error.name === "EntityTooLarge") {
    console.error(
      `Error from S3 while uploading object to ${aws.s3.bucket}. \
          The object was too large. To upload objects larger than 5GB, use the S3 console (160GB max) \
          or the multipart upload API (5TB max).`
    );
  } else if (error instanceof S3ServiceException) {
    console.error(
      `Error from S3 while uploading object to ${aws.s3.bucket}.  ${error.name}: ${error.message}`
    );
  } else {
    throw error;
  }
}
