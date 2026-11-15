import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { authRouter } from "./routes/auth.js";
import { academicRouter } from "./routes/academic.js";
import { materialsRouter } from "./routes/materials.js";
import { dashboardRouter } from "./routes/dashboard.js";
import {
  assignmentsRouter,
  commandsRouter,
  examRouter,
  notesRouter,
  snippetsRouter,
  sqlRouter,
  websitesRouter,
} from "./routes/modules.js";
import { timetableRouter } from "./routes/timetable.js";
import { libraryRouter } from "./routes/library.js";
import { assignmentFileRouter } from "./routes/assignmentFiles.js";
import { r2Configured } from "./services/r2.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (env.corsOrigins.includes(origin)) return callback(null, true);
        callback(null, false);
      },
      credentials: false,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(apiLimiter);

  const health = (_req: express.Request, res: express.Response) => {
    res.json({
      success: true,
      data: {
        status: "ok",
        service: "akash-lms-api",
        storage: r2Configured() ? "configured" : "missing",
      },
    });
  };
  app.get("/", health);
  app.get("/health", health);
  app.get("/api/health", health);

  app.use("/api/auth", authRouter);
  app.use("/api/dashboard", requireAuth, dashboardRouter);
  app.use("/api", requireAuth, academicRouter);
  app.use("/api/materials", requireAuth, materialsRouter);
  app.use("/api/websites", requireAuth, websitesRouter);
  app.use("/api/notes", requireAuth, notesRouter);
  app.use("/api/assignments", requireAuth, assignmentFileRouter);
  app.use("/api/assignments", requireAuth, assignmentsRouter);
  app.use("/api/snippets", requireAuth, snippetsRouter);
  app.use("/api/sql-queries", requireAuth, sqlRouter);
  app.use("/api/terminal-commands", requireAuth, commandsRouter);
  app.use("/api/exam-preparation", requireAuth, examRouter);
  app.use("/api/timetable", requireAuth, timetableRouter);
  app.use("/api", requireAuth, libraryRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
