import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is missing");
  process.exit(1);
}

try {
  const started = Date.now();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log(`CONNECTED_OK db=${mongoose.connection.db?.databaseName} ${Date.now() - started}ms`);
  await mongoose.disconnect();
} catch (error) {
  const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
  console.error(`CONNECT_FAILED ${error.code || ""} ${message}`);
  process.exit(1);
}
