import { RecentActivity } from "../models/RecentActivity.js";

export async function trackActivity(
  owner: string,
  resourceType: string,
  resourceId: string,
  title: string,
  action: string,
) {
  await RecentActivity.create({ owner, resourceType, resourceId, title, action });
  const extras = await RecentActivity.find({ owner }).sort({ createdAt: -1 }).skip(50).select("_id");
  if (extras.length) {
    await RecentActivity.deleteMany({ _id: { $in: extras.map((item) => item._id) } });
  }
}
