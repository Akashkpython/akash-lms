import { env } from "../config/env.js";
import { permanentlyDeleteDoc, SOFT_DELETE_MODELS } from "../services/resources.js";

export async function purgeExpiredTrash() {
  const cutoff = new Date(Date.now() - env.recycleRetentionDays * 86400000);
  for (const entry of SOFT_DELETE_MODELS) {
    const docs = await entry.model.find({ isDeleted: true, deletedAt: { $lte: cutoff } });
    for (const doc of docs) {
      try {
        await permanentlyDeleteDoc(entry.type, doc);
      } catch {
        // Keep the database record if object storage deletion failed.
      }
    }
  }
}
