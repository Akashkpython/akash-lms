import { Router } from "express";
import type { Model } from "mongoose";
import type { ZodType } from "zod";
import { z } from "zod";
import { validateBody } from "../middleware/validate.js";
import { trackActivity } from "../services/activity.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { errors } from "../utils/ApiError.js";
import { created, ok, paginated } from "../utils/response.js";
import { ownerAlive, pagination, searchFilter, sortSpec } from "../utils/query.js";

interface CrudOptions {
  model: Model<any>;
  resourceType: string;
  titleField: string;
  createSchema: ZodType;
  updateSchema: ZodType;
  searchFields: string[];
  filterFields?: string[];
  sortFields?: string[];
  populate?: string[];
  transform?: (doc: any) => any;
}

export function crudRouter(options: CrudOptions) {
  const router = Router();
  const sortFields = options.sortFields ?? ["createdAt", "updatedAt", "title"];

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const { page, limit, skip } = pagination(req);
      const filter: Record<string, unknown> = ownerAlive(req.user!.id);
      if (req.query.favorite === "true") filter.favorite = true;
      for (const field of options.filterFields ?? []) {
        const value = req.query[field];
        if (typeof value === "string" && value) filter[field] = value;
      }
      Object.assign(filter, searchFilter(req.query.q, options.searchFields));
      let query = options.model.find(filter).sort(sortSpec(req, sortFields)).skip(skip).limit(limit);
      for (const path of options.populate ?? []) query = query.populate(path);
      const [items, total] = await Promise.all([query, options.model.countDocuments(filter)]);
      const data = options.transform ? items.map(options.transform) : items;
      paginated(res, data, { page, limit, total });
    }),
  );

  router.post(
    "/",
    validateBody(options.createSchema),
    asyncHandler(async (req, res) => {
      const doc = await options.model.create({ ...req.body, owner: req.user!.id });
      await trackActivity(
        req.user!.id,
        options.resourceType,
        doc.id,
        String(doc[options.titleField] ?? "Item"),
        "created",
      );
      created(res, doc);
    }),
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      let query = options.model.findOne({ _id: req.params.id, ...ownerAlive(req.user!.id) });
      for (const path of options.populate ?? []) query = query.populate(path);
      const doc = await query;
      if (!doc) throw errors.notFound();
      await trackActivity(
        req.user!.id,
        options.resourceType,
        doc.id,
        String(doc[options.titleField] ?? "Item"),
        "opened",
      );
      ok(res, options.transform ? options.transform(doc) : doc);
    }),
  );

  router.patch(
    "/:id",
    validateBody(options.updateSchema),
    asyncHandler(async (req, res) => {
      const doc = await options.model.findOneAndUpdate(
        { _id: req.params.id, ...ownerAlive(req.user!.id) },
        req.body,
        { new: true },
      );
      if (!doc) throw errors.notFound();
      ok(res, doc);
    }),
  );

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      const doc = await options.model.findOneAndUpdate(
        { _id: req.params.id, ...ownerAlive(req.user!.id) },
        { isDeleted: true, deletedAt: new Date() },
        { new: true },
      );
      if (!doc) throw errors.notFound();
      ok(res, { id: doc.id });
    }),
  );

  return router;
}

export const objectId = z.string().regex(/^[a-f\d]{24}$/i).optional();
export const tags = z.array(z.string().max(40)).max(20).optional();
