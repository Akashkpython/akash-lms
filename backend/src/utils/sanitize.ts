export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function sanitizeFileName(name: string) {
  const base = name.replace(/\\/g, "/").split("/").pop() ?? "file";
  const cleaned = base.replace(/[^\w.\- ()[\]]+/g, "_").replace(/^\.+/, "");
  return cleaned.slice(0, 180) || "file";
}

export function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function assignmentStatus(status: string, deadline?: Date | string | null) {
  if (status === "completed") return "completed";
  if (!deadline) return status;
  const due = new Date(deadline);
  if (Number.isNaN(due.getTime())) return status;
  if (due.getTime() < Date.now() && status !== "completed") return "overdue";
  return status;
}
