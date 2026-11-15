import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { Material } from "../models/Material.js";
import { Semester } from "../models/Semester.js";
import { Subject } from "../models/Subject.js";
import { Topic } from "../models/Topic.js";
import { validateBody } from "../middleware/validate.js";
import { assertAllowedFile, PREVIEWABLE } from "../services/files.js";
import { assertWithinStorageQuota } from "../services/storageQuota.js";
import { objectExists, presignDownload, presignUpload } from "../services/r2.js";
import { trackActivity } from "../services/activity.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { errors } from "../utils/ApiError.js";
import { created, ok, paginated } from "../utils/response.js";
import { ownerAlive, pagination, searchFilter, sortSpec } from "../utils/query.js";
import { sanitizeFileName } from "../utils/sanitize.js";

const initiateSchema = z.object({
  fileName: z.string().min(1).max(180),
  mimeType: z.string().min(1).max(120),
  size: z.number().int().positive(),
  description: z.string().max(2000).optional(),
  semester: z.string().min(1),
  subject: z.string().min(1),
  topic: z.string().min(1),
});

export const materialsRouter = Router();

materialsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = pagination(req);
    const filter: Record<string, unknown> = ownerAlive(req.user!.id);
    if (req.query.ready !== "0") filter.status = "ready";
    if (typeof req.query.semester === "string") filter.semester = req.query.semester;
    if (typeof req.query.subject === "string") filter.subject = req.query.subject;
    if (typeof req.query.topic === "string") filter.topic = req.query.topic;
    if (req.query.favorite === "true") filter.favorite = true;
    Object.assign(filter, searchFilter(req.query.q, ["fileName", "originalName", "description", "extension"]));
    const sort = sortSpec(req, ["createdAt", "fileName", "size", "extension", "originalName"]);
    const [items, total] = await Promise.all([
      Material.find(filter)
        .populate("semester", "name")
        .populate("subject", "name")
        .populate("topic", "name")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Material.countDocuments(filter),
    ]);
    paginated(res, items, { page, limit, total });
  }),
);

materialsRouter.post(
  "/initiate",
  validateBody(initiateSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof initiateSchema>;
    await assertWithinStorageQuota(body.size);
    let extension: string;
    try {
      extension = assertAllowedFile(body.fileName, body.mimeType, body.size, env.maxUploadBytes);
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status === 413) throw errors.tooLarge((error as Error).message);
      throw errors.unsupported((error as Error).message);
    }

    const [semester, subject, topic] = await Promise.all([
      Semester.findOne({ _id: body.semester, ...ownerAlive(req.user!.id) }),
      Subject.findOne({ _id: body.subject, ...ownerAlive(req.user!.id) }),
      Topic.findOne({ _id: body.topic, ...ownerAlive(req.user!.id) }),
    ]);
    if (!semester || !subject || !topic) throw errors.badRequest("Invalid semester, subject, or topic");

    const fileName = sanitizeFileName(body.fileName);
    const r2Key = `materials/${req.user!.id}/${randomUUID()}/${fileName}`;
    const material = await Material.create({
      owner: req.user!.id,
      semester: body.semester,
      subject: body.subject,
      topic: body.topic,
      fileName,
      originalName: fileName,
      description: body.description ?? "",
      mimeType: body.mimeType,
      size: body.size,
      extension,
      r2Key,
      status: "pending",
    });
    const uploadUrl = await presignUpload(r2Key, body.mimeType);
    created(res, {
      id: material.id,
      uploadUrl,
      expiresIn: env.presignExpiresSeconds,
      maxUploadBytes: env.maxUploadBytes,
    });
  }),
);

materialsRouter.post(
  "/:id/complete",
  asyncHandler(async (req, res) => {
    const material = await Material.findOne({ _id: req.params.id, owner: req.user!.id, isDeleted: { $ne: true } });
    if (!material) throw errors.notFound();
    const exists = await objectExists(material.r2Key);
    if (!exists) throw errors.badRequest("Upload was not found in storage. Try uploading again.");
    material.status = "ready";
    await material.save();
    await trackActivity(req.user!.id, "material", material.id, material.fileName, "uploaded");
    ok(res, material);
  }),
);

materialsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const material = await Material.findOne({ _id: req.params.id, ...ownerAlive(req.user!.id) })
      .populate("semester", "name")
      .populate("subject", "name")
      .populate("topic", "name");
    if (!material) throw errors.notFound();
    ok(res, material);
  }),
);

materialsRouter.patch(
  "/:id",
  validateBody(
    z.object({
      fileName: z.string().min(1).max(180).optional(),
      description: z.string().max(2000).optional(),
      semester: z.string().optional(),
      subject: z.string().optional(),
      topic: z.string().optional(),
      favorite: z.boolean().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const material = await Material.findOneAndUpdate(
      { _id: req.params.id, ...ownerAlive(req.user!.id) },
      req.body,
      { new: true },
    );
    if (!material) throw errors.notFound();
    ok(res, material);
  }),
);

materialsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const material = await Material.findOneAndUpdate(
      { _id: req.params.id, ...ownerAlive(req.user!.id) },
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );
    if (!material) throw errors.notFound();
    ok(res, { id: material.id });
  }),
);

materialsRouter.post(
  "/:id/access",
  asyncHandler(async (req, res) => {
    const inline = req.query.inline === "1";
    const material = await Material.findOne({ _id: req.params.id, ...ownerAlive(req.user!.id), status: "ready" });
    if (!material) throw errors.notFound();
    material.lastAccessedAt = new Date();
    await material.save();
    await trackActivity(req.user!.id, "material", material.id, material.fileName, inline ? "previewed" : "downloaded");
    const url = await presignDownload(material.r2Key, material.fileName, inline);
    ok(res, {
      url,
      expiresIn: env.presignExpiresSeconds,
      previewable: PREVIEWABLE.has(material.extension),
      mimeType: material.mimeType,
      fileName: material.fileName,
    });
  }),
);
