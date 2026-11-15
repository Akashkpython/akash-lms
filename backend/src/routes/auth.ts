import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { errors } from "../utils/ApiError.js";
import { ok, created } from "../utils/response.js";

const credentials = z.object({
  email: z.string().email().max(120),
  password: z.string().min(10).max(128),
});

const setupSchema = credentials.extend({
  name: z.string().min(2).max(80),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

const profileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  theme: z.enum(["dark", "light", "system"]).optional(),
});

export const authRouter = Router();

authRouter.get(
  "/status",
  asyncHandler(async (_req, res) => {
    const count = await User.countDocuments();
    ok(res, { setupRequired: count === 0 });
  }),
);

authRouter.post(
  "/setup",
  authLimiter,
  validateBody(setupSchema),
  asyncHandler(async (req, res) => {
    if (await User.countDocuments()) {
      throw errors.forbidden("Administrator already exists. Public registration is disabled.");
    }
    const { email, password, name } = req.body as z.infer<typeof setupSchema>;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash, name });
    const token = signToken({ id: user.id, email: user.email });
    created(res, {
      token,
      user: { id: user.id, email: user.email, name: user.name, theme: user.theme },
    });
  }),
);

authRouter.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user) throw errors.unauthorized("Invalid email or password");
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw errors.unauthorized("Invalid email or password");
    const token = signToken({ id: user.id, email: user.email });
    ok(res, {
      token,
      user: { id: user.id, email: user.email, name: user.name, theme: user.theme },
    });
  }),
);

authRouter.post(
  "/logout",
  requireAuth,
  asyncHandler(async (_req, res) => {
    ok(res, { ok: true });
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.id);
    if (!user) throw errors.unauthorized();
    ok(res, { id: user.id, email: user.email, name: user.name, theme: user.theme });
  }),
);

authRouter.patch(
  "/me",
  requireAuth,
  validateBody(profileSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.user!.id, req.body, { new: true });
    if (!user) throw errors.notFound();
    ok(res, { id: user.id, email: user.email, name: user.name, theme: user.theme });
  }),
);
