import { Router } from "express";
import { z } from "zod";
import { Semester } from "../models/Semester.js";
import { Subject } from "../models/Subject.js";
import { Topic } from "../models/Topic.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { errors } from "../utils/ApiError.js";
import { created, ok } from "../utils/response.js";
import { ownerAlive } from "../utils/query.js";

const semesterSchema = z.object({
  name: z.string().min(1).max(80),
  code: z.string().max(40).optional(),
  order: z.number().int().optional(),
});

const subjectSchema = z.object({
  name: z.string().min(1).max(120),
  semester: z.string().min(1),
  code: z.string().max(40).optional(),
  color: z.string().max(20).optional(),
});

const topicSchema = z.object({
  name: z.string().min(1).max(120),
  subject: z.string().min(1),
});

export const academicRouter = Router();

academicRouter.get(
  "/tree",
  asyncHandler(async (req, res) => {
    const owner = req.user!.id;
    const semesters = await Semester.find(ownerAlive(owner)).sort({ order: 1, createdAt: 1 }).lean();
    const subjects = await Subject.find(ownerAlive(owner)).sort({ name: 1 }).lean();
    const topics = await Topic.find(ownerAlive(owner)).sort({ name: 1 }).lean();
    ok(
      res,
      semesters.map((semester) => ({
        ...semester,
        subjects: subjects
          .filter((subject) => String(subject.semester) === String(semester._id))
          .map((subject) => ({
            ...subject,
            topics: topics.filter((topic) => String(topic.subject) === String(subject._id)),
          })),
      })),
    );
  }),
);

academicRouter.get(
  "/semesters",
  asyncHandler(async (req, res) => {
    ok(res, await Semester.find(ownerAlive(req.user!.id)).sort({ order: 1, createdAt: 1 }));
  }),
);

academicRouter.post(
  "/semesters",
  validateBody(semesterSchema),
  asyncHandler(async (req, res) => {
    created(res, await Semester.create({ ...req.body, owner: req.user!.id }));
  }),
);

academicRouter.patch(
  "/semesters/:id",
  validateBody(semesterSchema.partial()),
  asyncHandler(async (req, res) => {
    const doc = await Semester.findOneAndUpdate(
      { _id: req.params.id, ...ownerAlive(req.user!.id) },
      req.body,
      { new: true },
    );
    if (!doc) throw errors.notFound();
    ok(res, doc);
  }),
);

academicRouter.delete(
  "/semesters/:id",
  asyncHandler(async (req, res) => {
    const doc = await Semester.findOneAndUpdate(
      { _id: req.params.id, ...ownerAlive(req.user!.id) },
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );
    if (!doc) throw errors.notFound();
    ok(res, { id: doc.id });
  }),
);

academicRouter.get(
  "/subjects",
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = ownerAlive(req.user!.id);
    if (typeof req.query.semester === "string") filter.semester = req.query.semester;
    ok(res, await Subject.find(filter).sort({ name: 1 }));
  }),
);

academicRouter.post(
  "/subjects",
  validateBody(subjectSchema),
  asyncHandler(async (req, res) => {
    const semester = await Semester.findOne({ _id: req.body.semester, ...ownerAlive(req.user!.id) });
    if (!semester) throw errors.badRequest("Semester not found");
    created(res, await Subject.create({ ...req.body, owner: req.user!.id }));
  }),
);

academicRouter.patch(
  "/subjects/:id",
  validateBody(subjectSchema.partial()),
  asyncHandler(async (req, res) => {
    const doc = await Subject.findOneAndUpdate(
      { _id: req.params.id, ...ownerAlive(req.user!.id) },
      req.body,
      { new: true },
    );
    if (!doc) throw errors.notFound();
    ok(res, doc);
  }),
);

academicRouter.delete(
  "/subjects/:id",
  asyncHandler(async (req, res) => {
    const doc = await Subject.findOneAndUpdate(
      { _id: req.params.id, ...ownerAlive(req.user!.id) },
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );
    if (!doc) throw errors.notFound();
    ok(res, { id: doc.id });
  }),
);

academicRouter.get(
  "/topics",
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = ownerAlive(req.user!.id);
    if (typeof req.query.subject === "string") filter.subject = req.query.subject;
    ok(res, await Topic.find(filter).sort({ name: 1 }));
  }),
);

academicRouter.post(
  "/topics",
  validateBody(topicSchema),
  asyncHandler(async (req, res) => {
    const subject = await Subject.findOne({ _id: req.body.subject, ...ownerAlive(req.user!.id) });
    if (!subject) throw errors.badRequest("Subject not found");
    created(res, await Topic.create({ ...req.body, owner: req.user!.id }));
  }),
);

academicRouter.patch(
  "/topics/:id",
  validateBody(topicSchema.partial()),
  asyncHandler(async (req, res) => {
    const doc = await Topic.findOneAndUpdate(
      { _id: req.params.id, ...ownerAlive(req.user!.id) },
      req.body,
      { new: true },
    );
    if (!doc) throw errors.notFound();
    ok(res, doc);
  }),
);

academicRouter.delete(
  "/topics/:id",
  asyncHandler(async (req, res) => {
    const doc = await Topic.findOneAndUpdate(
      { _id: req.params.id, ...ownerAlive(req.user!.id) },
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );
    if (!doc) throw errors.notFound();
    ok(res, { id: doc.id });
  }),
);
