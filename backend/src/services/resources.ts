import type { Model } from "mongoose";
import { Assignment } from "../models/Assignment.js";
import { CodeSnippet } from "../models/CodeSnippet.js";
import { ExamEntry } from "../models/ExamEntry.js";
import { Material } from "../models/Material.js";
import { Note } from "../models/Note.js";
import { SqlQuery } from "../models/SqlQuery.js";
import { TerminalCommand } from "../models/TerminalCommand.js";
import { Website } from "../models/Website.js";
import { deleteObject } from "./r2.js";

export const SOFT_DELETE_MODELS: { type: string; model: Model<any>; titleField: string }[] = [
  { type: "material", model: Material, titleField: "fileName" },
  { type: "website", model: Website, titleField: "title" },
  { type: "note", model: Note, titleField: "title" },
  { type: "assignment", model: Assignment, titleField: "title" },
  { type: "snippet", model: CodeSnippet, titleField: "title" },
  { type: "sql", model: SqlQuery, titleField: "title" },
  { type: "command", model: TerminalCommand, titleField: "title" },
  { type: "exam", model: ExamEntry, titleField: "question" },
];

export async function permanentlyDeleteDoc(type: string, doc: any) {
  if (type === "material" && doc.r2Key) {
    try {
      await deleteObject(doc.r2Key);
    } catch {
      throw new Error("Failed to delete the stored file. The database record was not removed.");
    }
  }
  if (type === "assignment" && doc.attachmentKey) {
    try {
      await deleteObject(doc.attachmentKey);
    } catch {
      throw new Error("Failed to delete the stored attachment. The database record was not removed.");
    }
  }
  await doc.deleteOne();
}
