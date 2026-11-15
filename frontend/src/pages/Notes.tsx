import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { api, qs, type ItemResponse, type ListResponse } from "../lib/api";
import { Button, EmptyState, Input, PageHeader, Select, Skeleton, Textarea } from "../components/ui";
import { useSemesters, useSubjects } from "../hooks/useAcademic";

type Note = {
  _id: string;
  title: string;
  content: string;
  semester?: { _id: string; name: string } | string;
  subject?: { _id: string; name: string } | string;
  favorite: boolean;
  updatedAt: string;
};

export function NotesPage() {
  const client = useQueryClient();
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved">("saved");
  const list = useQuery({
    queryKey: ["notes", q],
    queryFn: () => api<ListResponse<Note>>(`/api/notes${qs({ q, limit: 50, sort: "-updatedAt" })}`),
  });
  const active = useMemo(() => list.data?.data.find((item) => item._id === activeId) ?? list.data?.data[0], [list.data, activeId]);
  const [draft, setDraft] = useState<Note | null>(null);
  const semesters = useSemesters();
  const semesterId = typeof draft?.semester === "string" ? draft.semester : draft?.semester?._id;
  const subjects = useSubjects(semesterId);

  useEffect(() => {
    if (active) {
      setDraft({
        ...active,
        semester: typeof active.semester === "object" ? active.semester?._id : active.semester,
        subject: typeof active.subject === "object" ? active.subject?._id : active.subject,
      });
      setSaveState("saved");
    }
  }, [active?._id]);

  useEffect(() => {
    if (!draft || saveState !== "unsaved") return;
    const handle = window.setTimeout(async () => {
      setSaveState("saving");
      try {
        await api(`/api/notes/${draft._id}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: draft.title,
            content: draft.content,
            semester: draft.semester || undefined,
            subject: draft.subject || undefined,
            favorite: draft.favorite,
          }),
        });
        setSaveState("saved");
        client.invalidateQueries({ queryKey: ["notes"] });
      } catch {
        setSaveState("unsaved");
        toast.error("Autosave failed. Your latest text is still in the editor.");
      }
    }, 800);
    return () => window.clearTimeout(handle);
  }, [draft, saveState, client]);

  async function createNote() {
    const created = await api<ItemResponse<Note>>("/api/notes", {
      method: "POST",
      body: JSON.stringify({ title: "Untitled note", content: "" }),
    });
    await list.refetch();
    setActiveId(created.data._id);
  }

  function exportPdf() {
    if (!draft) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(draft.title || "Untitled note", 14, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(draft.content || "", 180);
    doc.text(lines, 14, 32);
    doc.save(`${draft.title || "note"}.pdf`);
  }

  if (list.isLoading) return <Skeleton className="h-96" />;

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div>
        <PageHeader title="My Notes" actions={<Button onClick={createNote}>New note</Button>} />
        <Input className="mb-3" placeholder="Search notes" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="space-y-2">
          {list.data?.data.map((item) => (
            <button
              key={item._id}
              onClick={() => setActiveId(item._id)}
              className={`card w-full p-3 text-left ${item._id === draft?._id ? "ring-1 ring-[var(--accent)]" : ""}`}
            >
              <div className="truncate">{item.title}</div>
              <div className="text-xs text-[var(--muted)]">{new Date(item.updatedAt).toLocaleString()}</div>
            </button>
          ))}
        </div>
      </div>
      {!draft ? (
        <EmptyState title="No notes yet" text="Create a note and start writing. Changes autosave." action={<Button onClick={createNote}>Create note</Button>} />
      ) : (
        <div className="card min-h-[70vh] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs uppercase tracking-widest text-[var(--muted)]">
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Unsaved"}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportPdf}>Export PDF</Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  await api(`/api/notes/${draft._id}`, { method: "DELETE" });
                  setDraft(null);
                  list.refetch();
                }}
              >
                Delete
              </Button>
            </div>
          </div>
          <Input
            className="border-0 bg-transparent px-0 text-2xl"
            value={draft.title}
            onChange={(e) => {
              setDraft({ ...draft, title: e.target.value });
              setSaveState("unsaved");
            }}
          />
          <div className="my-3 grid gap-2 md:grid-cols-2">
            <Select
              value={semesterId || ""}
              onChange={(e) => {
                setDraft({ ...draft, semester: e.target.value, subject: "" });
                setSaveState("unsaved");
              }}
            >
              <option value="">Semester</option>
              {semesters.data?.data.map((item) => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </Select>
            <Select
              value={typeof draft.subject === "string" ? draft.subject : ""}
              onChange={(e) => {
                setDraft({ ...draft, subject: e.target.value });
                setSaveState("unsaved");
              }}
            >
              <option value="">Subject</option>
              {subjects.data?.data.map((item) => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </Select>
          </div>
          <Textarea
            className="min-h-[50vh] border-0 bg-transparent px-0 text-base leading-7"
            value={draft.content}
            onChange={(e) => {
              setDraft({ ...draft, content: e.target.value });
              setSaveState("unsaved");
            }}
            placeholder="Write without distraction…"
          />
        </div>
      )}
    </div>
  );
}
