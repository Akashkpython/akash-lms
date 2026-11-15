import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assignmentStatus, isSafeHttpUrl, sanitizeFileName } from "../src/utils/sanitize.ts";
import { assertAllowedFile } from "../src/services/files.ts";

describe("assignmentStatus", () => {
  it("keeps completed tasks completed", () => {
    assert.equal(assignmentStatus("completed", new Date(Date.now() - 86400000)), "completed");
  });

  it("marks past deadlines overdue when not completed", () => {
    assert.equal(assignmentStatus("pending", new Date(Date.now() - 1000)), "overdue");
    assert.equal(assignmentStatus("in_progress", new Date(Date.now() - 1000)), "overdue");
  });

  it("does not auto-complete incomplete work", () => {
    assert.equal(assignmentStatus("pending", new Date(Date.now() + 86400000)), "pending");
  });
});

describe("isSafeHttpUrl", () => {
  it("allows http and https", () => {
    assert.equal(isSafeHttpUrl("https://www.netacad.com/"), true);
    assert.equal(isSafeHttpUrl("http://localhost:3000"), true);
  });

  it("rejects unsafe schemes", () => {
    assert.equal(isSafeHttpUrl("javascript:alert(1)"), false);
    assert.equal(isSafeHttpUrl("data:text/html,hi"), false);
  });
});

describe("sanitizeFileName", () => {
  it("strips path segments", () => {
    assert.equal(sanitizeFileName("..\\windows\\notes.pdf"), "notes.pdf");
  });
});

describe("assertAllowedFile", () => {
  it("accepts a pdf under the limit", () => {
    assert.equal(assertAllowedFile("unit1.pdf", "application/pdf", 1024, 10_000), "pdf");
  });

  it("rejects oversized files", () => {
    assert.throws(() => assertAllowedFile("unit1.pdf", "application/pdf", 200, 100));
  });
});
