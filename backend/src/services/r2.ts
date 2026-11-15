import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env.js";
import { errors } from "../utils/ApiError.js";

function client() {
  if (!env.r2.accountId || !env.r2.accessKeyId || !env.r2.secretAccessKey || !env.r2.bucket) {
    throw errors.badRequest("Cloudflare R2 is not configured on the server");
  }
  const endpoint = env.r2.endpoint || `https://${env.r2.accountId}.r2.cloudflarestorage.com`;
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: env.r2.accessKeyId,
      secretAccessKey: env.r2.secretAccessKey,
    },
  });
}

export function r2Configured() {
  return Boolean(env.r2.accountId && env.r2.accessKeyId && env.r2.secretAccessKey && env.r2.bucket);
}

export async function presignUpload(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: env.r2.bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client(), command, { expiresIn: env.presignExpiresSeconds });
}

export async function presignDownload(key: string, fileName: string, inline = false) {
  const command = new GetObjectCommand({
    Bucket: env.r2.bucket,
    Key: key,
    ResponseContentDisposition: `${inline ? "inline" : "attachment"}; filename="${fileName.replace(/"/g, "")}"`,
  });
  return getSignedUrl(client(), command, { expiresIn: env.presignExpiresSeconds });
}

export async function objectExists(key: string) {
  try {
    await client().send(new HeadObjectCommand({ Bucket: env.r2.bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

export async function deleteObject(key: string) {
  await client().send(new DeleteObjectCommand({ Bucket: env.r2.bucket, Key: key }));
}
