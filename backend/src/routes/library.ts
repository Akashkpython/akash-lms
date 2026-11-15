import { Router } from "express";
import { Assignment } from "../models/Assignment.js";
import { CodeSnippet } from "../models/CodeSnippet.js";
import { ExamEntry } from "../models/ExamEntry.js";
import { Material } from "../models/Material.js";
import { Note } from "../models/Note.js";
import { RecentActivity } from "../models/RecentActivity.js";
import { SqlQuery } from "../models/SqlQuery.js";
import { TerminalCommand } from "../models/TerminalCommand.js";
import { Website } from "../models/Website.js";
import { env } from "../config/env.js";
import { permanentlyDeleteDoc, SOFT_DELETE_MODELS } from "../services/resources.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { errors } from "../utils/ApiError.js";
import { ok } from "../utils/response.js";
import { ownerAlive } from "../utils/query.js";
import { escapeRegExp } from "../utils/sanitize.js";

export const libraryRouter = Router();

libraryRouter.get(
  "/favorites",
  asyncHandler(async (req, res) => {
    const owner = ownerAlive(req.user!.id);
    const [materials, websites, notes, snippets, sql, commands] = await Promise.all([
      Material.find({ ...owner, favorite: true, status: "ready" }).sort({ updatedAt: -1 }).limit(50),
      Website.find({ ...owner, favorite: true }).sort({ updatedAt: -1 }).limit(50),
      Note.find({ ...owner, favorite: true }).sort({ updatedAt: -1 }).limit(50),
      CodeSnippet.find({ ...owner, favorite: true }).sort({ updatedAt: -1 }).limit(50),
      SqlQuery.find({ ...owner, favorite: true }).sort({ updatedAt: -1 }).limit(50),
      TerminalCommand.find({ ...owner, favorite: true }).sort({ updatedAt: -1 }).limit(50),
    ]);
    ok(res, { materials, websites, notes, snippets, sql, commands });
  }),
);

libraryRouter.get(
  "/recent",
  asyncHandler(async (req, res) => {
    ok(res, await RecentActivity.find({ owner: req.user!.id }).sort({ createdAt: -1 }).limit(40));
  }),
);

libraryRouter.get(
  "/search",
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q.length < 2) return ok(res, []);
    const rx = new RegExp(escapeRegExp(q), "i");
    const owner = ownerAlive(req.user!.id);
    const [materials, websites, notes, snippets, sql, commands, exams, assignments] = await Promise.all([
      Material.find({ ...owner, status: "ready", $or: [{ fileName: rx }, { description: rx }] }).limit(6),
      Website.find({ ...owner, $or: [{ title: rx }, { url: rx }] }).limit(6),
      Note.find({ ...owner, $or: [{ title: rx }, { content: rx }] }).limit(6),
      CodeSnippet.find({ ...owner, $or: [{ title: rx }, { code: rx }] }).limit(6),
      SqlQuery.find({ ...owner, $or: [{ title: rx }, { sql: rx }] }).limit(6),
      TerminalCommand.find({ ...owner, $or: [{ title: rx }, { command: rx }] }).limit(6),
      ExamEntry.find({ ...owner, $or: [{ question: rx }, { answer: rx }] }).limit(6),
      Assignment.find({ ...owner, $or: [{ title: rx }, { description: rx }] }).limit(6),
    ]);
    ok(res, [
      ...materials.map((item) => ({ type: "material", id: item.id, title: item.fileName })),
      ...websites.map((item) => ({ type: "website", id: item.id, title: item.title })),
      ...notes.map((item) => ({ type: "note", id: item.id, title: item.title })),
      ...snippets.map((item) => ({ type: "snippet", id: item.id, title: item.title })),
      ...sql.map((item) => ({ type: "sql", id: item.id, title: item.title })),
      ...commands.map((item) => ({ type: "command", id: item.id, title: item.title })),
      ...exams.map((item) => ({ type: "exam", id: item.id, title: item.question })),
      ...assignments.map((item) => ({ type: "assignment", id: item.id, title: item.title })),
    ]);
  }),
);

libraryRouter.get(
  "/recycle-bin",
  asyncHandler(async (req, res) => {
    const owner = req.user!.id;
    const cutoff = new Date(Date.now() - env.recycleRetentionDays * 86400000);
    const groups = await Promise.all(
      SOFT_DELETE_MODELS.map(async ({ type, model, titleField }) => {
        const docs = await model.find({ owner, isDeleted: true }).sort({ deletedAt: -1 }).limit(100);
        return docs.map((doc) => ({
          id: doc.id,
          type,
          title: String(doc.get(titleField) ?? "Untitled"),
          deletedAt: doc.get("deletedAt"),
          expiresAt: doc.get("deletedAt")
            ? new Date(new Date(doc.get("deletedAt")).getTime() + env.recycleRetentionDays * 86400000)
            : null,
          expired: doc.get("deletedAt") ? new Date(doc.get("deletedAt")) < cutoff : false,
        }));
      }),
    );
    ok(res, groups.flat().sort((a, b) => new Date(b.deletedAt ?? 0).getTime() - new Date(a.deletedAt ?? 0).getTime()));
  }),
);

libraryRouter.post(
  "/recycle-bin/:type/:id/restore",
  asyncHandler(async (req, res) => {
    const entry = SOFT_DELETE_MODELS.find((item) => item.type === req.params.type);
    if (!entry) throw errors.badRequest("Unknown resource type");
    const doc = await entry.model.findOneAndUpdate(
      { _id: req.params.id, owner: req.user!.id, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      { new: true },
    );
    if (!doc) throw errors.notFound();
    ok(res, doc);
  }),
);

libraryRouter.delete(
  "/recycle-bin/:type/:id",
  asyncHandler(async (req, res) => {
    const entry = SOFT_DELETE_MODELS.find((item) => item.type === req.params.type);
    if (!entry) throw errors.badRequest("Unknown resource type");
    const doc = await entry.model.findOne({ _id: req.params.id, owner: req.user!.id, isDeleted: true });
    if (!doc) throw errors.notFound();
    await permanentlyDeleteDoc(entry.type, doc);
    ok(res, { id: req.params.id });
  }),
);

libraryRouter.delete(
  "/recycle-bin",
  asyncHandler(async (req, res) => {
    let removed = 0;
    for (const entry of SOFT_DELETE_MODELS) {
      const docs = await entry.model.find({ owner: req.user!.id, isDeleted: true });
      for (const doc of docs) {
        await permanentlyDeleteDoc(entry.type, doc);
        removed += 1;
      }
    }
    ok(res, { removed });
  }),
);
