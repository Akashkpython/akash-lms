export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code = "ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const errors = {
  badRequest: (message: string, code = "BAD_REQUEST") => new ApiError(400, message, code),
  unauthorized: (message = "Authentication required") => new ApiError(401, message, "UNAUTHORIZED"),
  forbidden: (message = "Access denied") => new ApiError(403, message, "FORBIDDEN"),
  notFound: (message = "Resource not found") => new ApiError(404, message, "NOT_FOUND"),
  conflict: (message: string) => new ApiError(409, message, "CONFLICT"),
  tooLarge: (message: string) => new ApiError(413, message, "PAYLOAD_TOO_LARGE"),
  unsupported: (message: string) => new ApiError(415, message, "UNSUPPORTED_MEDIA_TYPE"),
  tooMany: (message = "Too many requests") => new ApiError(429, message, "RATE_LIMITED"),
};
