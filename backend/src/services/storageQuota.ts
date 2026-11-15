import { Material } from "../models/Material.js";
import { Assignment } from "../models/Assignment.js";
import { env } from "../config/env.js";
import { errors } from "../utils/ApiError.js";

export async function getCurrentStorageUsageBytes(): Promise<number> {
  const [materialUsage, assignmentUsage] = await Promise.all([
    Material.aggregate([
      { $group: { _id: null, total: { $sum: "$size" } } },
    ]),
    Assignment.aggregate([
      { $match: { attachmentKey: { $ne: null } } },
      { $group: { _id: null, total: { $sum: "$attachmentSize" } } },
    ]),
  ]);

  const materialsTotal = Number(materialUsage[0]?.total ?? 0);
  const assignmentsTotal = Number(assignmentUsage[0]?.total ?? 0);
  return materialsTotal + assignmentsTotal;
}

export async function assertWithinStorageQuota(incomingBytes: number): Promise<void> {
  const currentBytes = await getCurrentStorageUsageBytes();
  if (currentBytes + incomingBytes > env.maxStorageBytes) {
    const currentMB = (currentBytes / (1024 * 1024)).toFixed(1);
    const maxMB = Math.round(env.maxStorageBytes / (1024 * 1024));
    const incomingMB = (incomingBytes / (1024 * 1024)).toFixed(1);
    throw errors.badRequest(
      `Cloudflare R2 1 GB limit reached: Current storage is ${currentMB} MB. Uploading ${incomingMB} MB exceeds your ${maxMB} MB quota. Please delete unused files or empty the recycle bin to free up space.`
    );
  }
}
