import { Router } from "express";
import { Assignment } from "../models/Assignment.js";
import { CodeSnippet } from "../models/CodeSnippet.js";
import { Material } from "../models/Material.js";
import { Note } from "../models/Note.js";
import { RecentActivity } from "../models/RecentActivity.js";
import { Semester } from "../models/Semester.js";
import { Subject } from "../models/Subject.js";
import { TimetableEntry } from "../models/TimetableEntry.js";
import { Website } from "../models/Website.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";
import { ownerAlive } from "../utils/query.js";
import { assignmentStatus } from "../utils/sanitize.js";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

export const dashboardRouter = Router();

dashboardRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const owner = req.user!.id;
    const alive = ownerAlive(owner);
    const today = DAYS[new Date().getDay()];

    const [
      materials,
      websites,
      notes,
      assignments,
      snippets,
      recent,
      semesters,
      subjects,
      timetable,
      favorites,
    ] = await Promise.all([
      Material.countDocuments({ ...alive, status: "ready" }),
      Website.countDocuments(alive),
      Note.countDocuments(alive),
      Assignment.find(alive).lean(),
      CodeSnippet.countDocuments(alive),
      RecentActivity.find({ owner }).sort({ createdAt: -1 }).limit(12).lean(),
      Semester.find(alive).sort({ order: 1 }).lean(),
      Subject.find(alive).lean(),
      today === "sunday"
        ? []
        : TimetableEntry.find({ ...alive, day: today }).sort({ startTime: 1 }).lean(),
      Promise.all([
        Material.find({ ...alive, favorite: true, status: "ready" }).sort({ updatedAt: -1 }).limit(5).lean(),
        Website.find({ ...alive, favorite: true }).sort({ updatedAt: -1 }).limit(5).lean(),
        Note.find({ ...alive, favorite: true }).sort({ updatedAt: -1 }).limit(5).lean(),
        CodeSnippet.find({ ...alive, favorite: true }).sort({ updatedAt: -1 }).limit(5).lean(),
      ]),
    ]);

    const withStatus = assignments.map((item) => ({
      ...item,
      computedStatus: assignmentStatus(item.status, item.deadline),
    }));
    const pending = withStatus.filter((item) => item.computedStatus === "pending").length;
    const completed = withStatus.filter((item) => item.computedStatus === "completed").length;
    const upcoming = withStatus
      .filter((item) => item.computedStatus !== "completed")
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 8);

    ok(res, {
      cards: {
        materials,
        websites,
        notes,
        pendingAssignments: pending,
        completedAssignments: completed,
        snippets,
      },
      recent,
      upcoming,
      subjects: semesters.map((semester) => ({
        ...semester,
        subjects: subjects.filter((subject) => String(subject.semester) === String(semester._id)),
      })),
      timetable,
      favorites: {
        materials: favorites[0],
        websites: favorites[1],
        notes: favorites[2],
        snippets: favorites[3],
      },
    });
  }),
);
