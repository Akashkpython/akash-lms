import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { errors } from "../utils/ApiError.js";

interface TokenPayload {
  sub: string;
  email: string;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw errors.unauthorized();
    }
    const token = header.slice("Bearer ".length).trim();
    const payload = jwt.verify(token, env.jwtSecret) as TokenPayload;
    if (!payload.sub || !payload.email) throw errors.unauthorized();
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (error) {
    next(error instanceof Error && "status" in error ? error : errors.unauthorized("Session expired or invalid"));
  }
}

export function signToken(user: { id: string; email: string }) {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
}
