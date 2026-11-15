import type { Request } from "express";
import { escapeRegExp } from "./sanitize.js";

export function pagination(req: Request) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

export function sortSpec(req: Request, allowed: string[], fallback = "-createdAt") {
  const sort = typeof req.query.sort === "string" ? req.query.sort : fallback;
  const field = sort.replace(/^-/, "");
  if (!allowed.includes(field)) return fallback;
  return sort;
}

export function searchFilter(q: unknown, fields: string[]) {
  if (typeof q !== "string" || !q.trim()) return {};
  const rx = new RegExp(escapeRegExp(q.trim()), "i");
  return { $or: fields.map((field) => ({ [field]: rx })) };
}

export function ownerAlive(owner: string) {
  return { owner, isDeleted: { $ne: true } };
}
