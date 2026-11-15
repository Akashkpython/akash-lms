import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

const nodeEnv = optional("NODE_ENV", "development");
const production = nodeEnv === "production";

export const env = {
  nodeEnv,
  port: Number(optional("PORT", "8080")),
  mongoUri: production ? required("MONGODB_URI") : required("MONGODB_URI", "mongodb://127.0.0.1:27017/akash-lms"),
  jwtSecret: production ? required("JWT_SECRET") : required("JWT_SECRET", "dev-only-change-me"),
  jwtExpiresIn: optional("JWT_EXPIRES_IN", "7d"),
  corsOrigins: optional("CORS_ORIGINS", "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  r2: {
    accountId: optional("R2_ACCOUNT_ID", ""),
    accessKeyId: optional("R2_ACCESS_KEY_ID", ""),
    secretAccessKey: optional("R2_SECRET_ACCESS_KEY", ""),
    bucket: optional("R2_BUCKET_NAME", ""),
    endpoint: optional("R2_ENDPOINT", ""),
  },
  maxUploadBytes: Number(optional("MAX_UPLOAD_BYTES", String(50 * 1024 * 1024))),
  maxStorageBytes: Number(optional("MAX_STORAGE_BYTES", String(1024 * 1024 * 1024))),
  recycleRetentionDays: Number(optional("RECYCLE_RETENTION_DAYS", "30")),
  presignExpiresSeconds: Number(optional("PRESIGN_EXPIRES_SECONDS", "120")),
};

export const isProduction = production;
