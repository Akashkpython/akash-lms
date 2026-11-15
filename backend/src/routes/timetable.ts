import { Router } from "express";
import { z } from "zod";
import { TimetableEntry } from "../models/TimetableEntry.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { errors } from "../utils/ApiError.js";
import { created, ok } from "../utils/response.js";
import { ownerAlive } from "../utils/query.js";

const schema = z.object({
  day: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]),
  subject: z.string().optional(),
  subjectName: z.string().min(1).max(120),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  room: z.string().max(60).optional(),
  faculty: z.string().max(80).optional(),
  notes: z.string().max(1000).optional(),
});

export const timetableRouter = Router();

timetableRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = ownerAlive(req.user!.id);
    if (typeof req.query.day === "string") filter.day = req.query.day;
    ok(res, await TimetableEntry.find(filter).sort({ day: 1, startTime: 1 }).populate("subject", "name"));
  }),
);

timetableRouter.post(
  "/",
  validateBody(schema),
  asyncHandler(async (req, res) => {
    created(res, await TimetableEntry.create({ ...req.body, owner: req.user!.id }));
  }),
);

timetableRouter.patch(
  "/:id",
  validateBody(schema.partial()),
  asyncHandler(async (req, res) => {
    const doc = await TimetableEntry.findOneAndUpdate(
      { _id: req.params.id, ...ownerAlive(req.user!.id) },
      req.body,
      { new: true },
    );
    if (!doc) throw errors.notFound();
    ok(res, doc);
  }),
);

timetableRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const doc = await TimetableEntry.findOneAndDelete({ _id: req.params.id, owner: req.user!.id });
    if (!doc) throw errors.notFound();
    ok(res, { id: doc.id });
  }),
);
