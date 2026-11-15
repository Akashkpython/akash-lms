import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { Assignment } from "../models/Assignment.js";
import { validateBody } from "../middleware/validate.js";
import { assertAllowedFile } from "../services/files.js";
import { assertWithinStorageQuota } from "../services/storageQuota.js";
import { objectExists, presignDownload, presignUpload } from "../services/r2.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { errors } from "../utils/ApiError.js";
import { ok } from "../utils/response.js";
import { ownerAlive } from "../utils/query.js";
import { sanitizeFileName } from "../utils/sanitize.js";

const initiateSchema = z.object({
  fileName: z.string().min(1).max(180),
  mimeType: z.string().min(1).max(120),
  size: z.number().int().positive(),
});

export const assignmentFileRouter = Router();

assignmentFileRouter.post(
  "/:id/attachment/initiate",
  validateBody(initiateSchema),
  asyncHandler(async (req, res) => {
    const assignment = await Assignment.findOne({ _id: req.params.id, ...ownerAlive(req.user!.id) });
    if (!assignment) throw errors.notFound();
    const body = req.body as z.infer<typeof initiateSchema>;
    await assertWithinStorageQuota(body.size);
    try {
      assertAllowedFile(body.fileName, body.mimeType, body.size, env.maxUploadBytes);
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status === 413) throw errors.tooLarge((error as Error).message);
      throw errors.unsupported((error as Error).message);
    }
    const fileName = sanitizeFileName(body.fileName);
    const key = `assignments/${req.user!.id}/${assignment.id}/${randomUUID()}/${fileName}`;
    assignment.attachmentKey = key;
    assignment.attachmentName = fileName;
    assignment.attachmentSize = body.size;
    await assignment.save();
    const uploadUrl = await presignUpload(key, body.mimeType);
    ok(res, { uploadUrl, fileName });
  }),
);

assignmentFileRouter.post(
  "/:id/attachment/complete",
  asyncHandler(async (req, res) => {
    const assignment = await Assignment.findOne({ _id: req.params.id, ...ownerAlive(req.user!.id) });
    if (!assignment?.attachmentKey) throw errors.notFound();
    const exists = await objectExists(assignment.attachmentKey);
    if (!exists) throw errors.badRequest("Attachment was not found in storage.");
    ok(res, assignment);
  }),
);

assignmentFileRouter.post(
  "/:id/attachment/access",
  asyncHandler(async (req, res) => {
    const assignment = await Assignment.findOne({ _id: req.params.id, ...ownerAlive(req.user!.id) });
    if (!assignment?.attachmentKey || !assignment.attachmentName) throw errors.notFound();
    const url = await presignDownload(assignment.attachmentKey, assignment.attachmentName);
    ok(res, { url, fileName: assignment.attachmentName });
  }),
);
