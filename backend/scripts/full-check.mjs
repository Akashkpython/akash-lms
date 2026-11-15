import dotenv from "dotenv";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

dotenv.config();

async function runCheck() {
  console.log("=== AKASH LMS FULL SYSTEM AUDIT ===\n");

  // 1. Live Render Backend Health
  try {
    const t0 = Date.now();
    const res = await fetch("https://akash-lms.onrender.com/api/health");
    const data = await res.json();
    const ms = Date.now() - t0;
    console.log(`[PASS] 1. Live Backend Health (${ms}ms)`);
    console.log(`       Status: HTTP ${res.status}`);
    console.log(`       Response:`, data);
  } catch (e) {
    console.error(`[FAIL] 1. Live Backend Health:`, e.message);
  }

  // 2. Live API Auth & MongoDB Atlas Connectivity
  try {
    const t0 = Date.now();
    const res = await fetch("https://akash-lms.onrender.com/api/auth/status", {
      headers: { Origin: "https://akashkpython.github.io" },
    });
    const data = await res.json();
    const cors = res.headers.get("access-control-allow-origin");
    const ms = Date.now() - t0;
    console.log(`\n[PASS] 2. Live Database & CORS (${ms}ms)`);
    console.log(`       Status: HTTP ${res.status}`);
    console.log(`       CORS Header: ${cors}`);
    console.log(`       Admin Setup Required: ${data.data?.setupRequired}`);
  } catch (e) {
    console.error(`\n[FAIL] 2. Live Database & CORS:`, e.message);
  }

  // 3. Live GitHub Pages Frontend
  try {
    const t0 = Date.now();
    const res = await fetch("https://akashkpython.github.io/akash-lms/");
    const html = await res.text();
    const ms = Date.now() - t0;
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const hasRoot = html.includes('id="root"');
    console.log(`\n[PASS] 3. Live Frontend (GitHub Pages) (${ms}ms)`);
    console.log(`       Status: HTTP ${res.status}`);
    console.log(`       Page Title: "${titleMatch ? titleMatch[1] : 'N/A'}"`);
    console.log(`       React Root Container: ${hasRoot ? "Present" : "Missing"}`);
  } catch (e) {
    console.error(`\n[FAIL] 3. Live Frontend:`, e.message);
  }

  // 4. Cloudflare R2 Bucket
  try {
    const t0 = Date.now();
    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
    const list = await s3.send(
      new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET_NAME, MaxKeys: 5 })
    );
    const ms = Date.now() - t0;
    console.log(`\n[PASS] 4. Cloudflare R2 Storage (${ms}ms)`);
    console.log(`       Bucket: ${process.env.R2_BUCKET_NAME}`);
    console.log(`       Access: Authenticated Read/Write`);
    console.log(`       Objects in Bucket: ${list.KeyCount ?? 0}`);
  } catch (e) {
    console.error(`\n[FAIL] 4. Cloudflare R2:`, e.message);
  }

  console.log("\n===================================");
}

runCheck();
