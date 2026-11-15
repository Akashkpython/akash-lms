export const ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "txt",
  "csv",
  "zip",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "mp3",
  "mp4",
  "md",
  "json",
  "xml",
  "py",
  "java",
  "c",
  "cpp",
  "js",
  "ts",
  "sql",
] as const;

export const MIME_BY_EXT: Record<string, string[]> = {
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ppt: ["application/vnd.ms-powerpoint"],
  pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  xls: ["application/vnd.ms-excel"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  txt: ["text/plain"],
  csv: ["text/csv", "application/vnd.ms-excel", "text/plain"],
  zip: ["application/zip", "application/x-zip-compressed"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  webp: ["image/webp"],
  gif: ["image/gif"],
  mp3: ["audio/mpeg", "audio/mp3"],
  mp4: ["video/mp4"],
  md: ["text/markdown", "text/plain"],
  json: ["application/json", "text/plain"],
  xml: ["application/xml", "text/xml"],
  py: ["text/x-python", "text/plain"],
  java: ["text/x-java-source", "text/plain"],
  c: ["text/x-c", "text/plain"],
  cpp: ["text/x-c++src", "text/plain"],
  js: ["text/javascript", "application/javascript", "text/plain"],
  ts: ["text/typescript", "text/plain"],
  sql: ["application/sql", "text/plain"],
};

export const PREVIEWABLE = new Set(["pdf", "png", "jpg", "jpeg", "webp", "gif", "txt", "csv", "md", "mp3", "mp4"]);

export function extensionOf(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop()! : "";
}

export function assertAllowedFile(fileName: string, mimeType: string, size: number, maxBytes: number) {
  const extension = extensionOf(fileName);
  if (!ALLOWED_EXTENSIONS.includes(extension as (typeof ALLOWED_EXTENSIONS)[number])) {
    throw Object.assign(new Error("File type is not allowed"), { status: 415 });
  }
  const allowedMimes = MIME_BY_EXT[extension] ?? [];
  if (mimeType && !allowedMimes.includes(mimeType) && mimeType !== "application/octet-stream") {
    throw Object.assign(new Error("MIME type does not match the file extension"), { status: 415 });
  }
  if (size > maxBytes) {
    throw Object.assign(new Error(`File exceeds the ${Math.round(maxBytes / (1024 * 1024))} MB upload limit`), {
      status: 413,
    });
  }
  return extension;
}
