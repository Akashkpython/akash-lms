import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDb } from "./db/connect.js";
import { purgeExpiredTrash } from "./jobs/retention.js";

async function main() {
  await connectDb();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Akash LMS API listening on port ${env.port}`);
  });
  setInterval(() => {
    purgeExpiredTrash().catch(() => undefined);
  }, 6 * 60 * 60 * 1000);
}

main().catch((error) => {
  console.error("Failed to start server");
  console.error(error instanceof Error ? error.message : "Unknown error");
  process.exit(1);
});
