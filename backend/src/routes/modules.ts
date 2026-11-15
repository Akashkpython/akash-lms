import { z } from "zod";
import { Assignment } from "../models/Assignment.js";
import { CodeSnippet } from "../models/CodeSnippet.js";
import { ExamEntry } from "../models/ExamEntry.js";
import { Note } from "../models/Note.js";
import { SqlQuery } from "../models/SqlQuery.js";
import { TerminalCommand } from "../models/TerminalCommand.js";
import { Website } from "../models/Website.js";
import { assignmentStatus, isSafeHttpUrl } from "../utils/sanitize.js";
import { crudRouter, objectId, tags } from "./crud.js";

const websiteFields = {
  title: z.string().min(1).max(160),
  url: z
    .string()
    .url()
    .max(2000)
    .refine((value) => isSafeHttpUrl(value), "Only http and https URLs are allowed"),
  description: z.string().max(2000).optional(),
  notes: z.string().max(4000).optional(),
  tags,
  semester: objectId,
  subject: objectId,
  topic: objectId,
  favorite: z.boolean().optional(),
};

const websiteCreate = z.object(websiteFields);
const websiteUpdate = z.object(websiteFields).partial();

export const websitesRouter = crudRouter({
  model: Website,
  resourceType: "website",
  titleField: "title",
  createSchema: websiteCreate,
  updateSchema: websiteUpdate,
  searchFields: ["title", "url", "description", "notes", "tags"],
  filterFields: ["semester", "subject"],
  populate: ["semester", "subject", "topic"],
});

const noteSchema = z.object({
  title: z.string().min(1).max(160),
  content: z.string().max(200000).optional(),
  semester: objectId,
  subject: objectId,
  favorite: z.boolean().optional(),
});

export const notesRouter = crudRouter({
  model: Note,
  resourceType: "note",
  titleField: "title",
  createSchema: noteSchema,
  updateSchema: noteSchema.partial(),
  searchFields: ["title", "content"],
  filterFields: ["semester", "subject"],
  sortFields: ["updatedAt", "createdAt", "title"],
  populate: ["semester", "subject"],
});

const assignmentSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(8000).optional(),
  semester: objectId,
  subject: objectId,
  assignedDate: z.string().optional(),
  deadline: z.string().min(1),
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
  remarks: z.string().max(4000).optional(),
  favorite: z.boolean().optional(),
});

export const assignmentsRouter = crudRouter({
  model: Assignment,
  resourceType: "assignment",
  titleField: "title",
  createSchema: assignmentSchema,
  updateSchema: assignmentSchema.partial(),
  searchFields: ["title", "description", "remarks"],
  filterFields: ["semester", "subject", "priority"],
  sortFields: ["deadline", "createdAt", "title", "priority"],
  populate: ["semester", "subject"],
  transform: (doc) => {
    const json = typeof doc.toObject === "function" ? doc.toObject() : doc;
    return { ...json, computedStatus: assignmentStatus(json.status, json.deadline) };
  },
});

const snippetSchema = z.object({
  title: z.string().min(1).max(160),
  language: z.string().min(1).max(40),
  code: z.string().min(1).max(200000),
  description: z.string().max(4000).optional(),
  tags,
  subject: objectId,
  favorite: z.boolean().optional(),
});

export const snippetsRouter = crudRouter({
  model: CodeSnippet,
  resourceType: "snippet",
  titleField: "title",
  createSchema: snippetSchema,
  updateSchema: snippetSchema.partial(),
  searchFields: ["title", "code", "description", "tags", "language"],
  filterFields: ["language", "subject"],
  populate: ["subject"],
});

const sqlSchema = z.object({
  title: z.string().min(1).max(160),
  dbType: z.enum(["mysql", "postgresql", "sqlite", "sql"]).optional(),
  sql: z.string().min(1).max(200000),
  description: z.string().max(4000).optional(),
  expectedOutput: z.string().max(8000).optional(),
  subject: objectId,
  tags,
  favorite: z.boolean().optional(),
});

export const sqlRouter = crudRouter({
  model: SqlQuery,
  resourceType: "sql",
  titleField: "title",
  createSchema: sqlSchema,
  updateSchema: sqlSchema.partial(),
  searchFields: ["title", "sql", "description", "expectedOutput", "tags"],
  filterFields: ["dbType", "subject"],
  populate: ["subject"],
});

const commandSchema = z.object({
  title: z.string().min(1).max(160),
  command: z.string().min(1).max(4000),
  os: z.string().max(40).optional(),
  description: z.string().max(4000).optional(),
  example: z.string().max(4000).optional(),
  category: z.enum(["linux", "windows_cmd", "powershell", "git", "networking", "python", "nodejs", "dev_tools"]),
  tags,
  favorite: z.boolean().optional(),
});

export const commandsRouter = crudRouter({
  model: TerminalCommand,
  resourceType: "command",
  titleField: "title",
  createSchema: commandSchema,
  updateSchema: commandSchema.partial(),
  searchFields: ["title", "command", "description", "example", "tags"],
  filterFields: ["category", "os"],
});

const examSchema = z.object({
  semester: objectId,
  subject: objectId,
  topic: z.string().max(160).optional(),
  question: z.string().min(1).max(8000),
  answer: z.string().max(20000).optional(),
  kind: z.enum(["important", "short", "long", "viva", "definition", "notes"]).optional(),
  important: z.boolean().optional(),
  tags,
  favorite: z.boolean().optional(),
});

export const examRouter = crudRouter({
  model: ExamEntry,
  resourceType: "exam",
  titleField: "question",
  createSchema: examSchema,
  updateSchema: examSchema.partial(),
  searchFields: ["question", "answer", "topic", "tags"],
  filterFields: ["semester", "subject", "kind"],
  populate: ["semester", "subject"],
});
