import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, getDate, getMonth, getYear, startOfMonth, getDay } from "date-fns";
import { api, qs, type ListResponse } from "../lib/api";
import { Badge, Button, ConfirmDialog, EmptyState, Input, Modal, PageHeader, Select, Skeleton, Textarea } from "../components/ui";
import { useSemesters, useSubjects } from "../hooks/useAcademic";
import { toast } from "sonner";

type Assignment = {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  assignedDate: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed";
  computedStatus: string;
  remarks: string;
  attachmentName?: string | null;
  semester?: { _id: string; name: string } | string;
  subject?: { _id: string; name: string } | string;
};

const blank = {
  title: "",
  description: "",
  deadline: "",
  priority: "medium",
  status: "pending",
  remarks: "",
  semester: "",
  subject: "",
};

export function AssignmentsPage() {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const semesters = useSemesters();
  const subjects = useSubjects(form.semester);
  const list = useQuery({
    queryKey: ["assignments", q],
    queryFn: () => api<ListResponse<Assignment>>(`/api/assignments${qs({ q, sort: "deadline", limit: 100 })}`),
  });

  const items = useMemo(() => {
    const rows = list.data?.data ?? [];
    if (!status) return rows;
    return rows.filter((item) => item.computedStatus === status);
  }, [list.data, status]);

  async function save() {
    const payload = { ...form, semester: form.semester || undefined, subject: form.subject || undefined };
    let id = editId;
    if (editId) {
      await api(`/api/assignments/${editId}`, { method: "PATCH", body: JSON.stringify(payload) });
    } else {
      const created = await api<{ success: true; data: Assignment }>("/api/assignments", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      id = created.data._id;
    }
    if (file && id) {
      const initiated = await api<{ success: true; data: { uploadUrl: string } }>(`/api/assignments/${id}/attachment/initiate`, {
        method: "POST",
        body: JSON.stringify({ fileName: file.name, mimeType: file.type || "application/octet-stream", size: file.size }),
      });
      await fetch(initiated.data.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } });
      await api(`/api/assignments/${id}/attachment/complete`, { method: "POST" });
    }
    toast.success("Assignment saved");
    setOpen(false);
    setEditId(null);
    setFile(null);
    setForm(blank);
    list.refetch();
  }

  if (list.isLoading) return <Skeleton className="h-80" />;

  return (
    <div>
      <PageHeader
        title="Assignments & Tasks"
        subtitle="Deadlines stay pending until you mark them complete."
        actions={<Button onClick={() => { setForm(blank); setEditId(null); setFile(null); setOpen(true); }}>Add assignment</Button>}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ["", "All tasks"],
          ["pending", "Pending"],
          ["in_progress", "In progress"],
          ["completed", "Completed"],
          ["overdue", "Overdue"],
        ].map(([id, label]) => (
          <Button key={id} variant={status === id ? "primary" : "outline"} onClick={() => setStatus(id)}>
            {label}
          </Button>
        ))}
        <Input className="max-w-xs" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button variant="ghost" onClick={() => setView(view === "list" ? "calendar" : "list")}>
          {view === "list" ? "Calendar view" : "List view"}
        </Button>
      </div>

      {items.length === 0 ? <EmptyState title="No assignments" text="Add a task with a deadline to track practicals and submissions." /> : null}

      {view === "list" ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item._id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-[var(--muted)]">{item.description}</div>
                <div className="mt-1 text-xs text-[var(--muted)]">Due {format(new Date(item.deadline), "dd MMM yyyy HH:mm")}</div>
                {item.attachmentName && (
                  <button
                    className="mt-1 text-xs text-[var(--accent)]"
                    onClick={async () => {
                      const result = await api<{ success: true; data: { url: string } }>(`/api/assignments/${item._id}/attachment/access`, { method: "POST" });
                      window.open(result.data.url, "_blank");
                    }}
                  >
                    Download {item.attachmentName}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={item.computedStatus === "overdue" ? "bad" : item.computedStatus === "completed" ? "ok" : "warn"}>
                  {item.computedStatus.replace("_", " ")}
                </Badge>
                {item.status !== "completed" && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      await api(`/api/assignments/${item._id}`, { method: "PATCH", body: JSON.stringify({ status: "completed" }) });
                      list.refetch();
                    }}
                  >
                    Complete
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditId(item._id);
                    setForm({
                      title: item.title,
                      description: item.description,
                      deadline: item.deadline.slice(0, 16),
                      priority: item.priority,
                      status: item.status,
                      remarks: item.remarks,
                      semester: typeof item.semester === "object" ? item.semester?._id || "" : item.semester || "",
                      subject: typeof item.subject === "object" ? item.subject?._id || "" : item.subject || "",
                    });
                    setOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button variant="ghost" onClick={() => setRemoveId(item._id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Calendar items={items} />
      )}

      <Modal open={open} title={editId ? "Edit assignment" : "Add assignment"} onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as typeof form.priority })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}>
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </Select>
          <Select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
            <option value="">Semester</option>
            {semesters.data?.data.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </Select>
          <Select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
            <option value="">Subject</option>
            {subjects.data?.data.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </Select>
          <Textarea placeholder="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
          <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <Button onClick={save}>Save</Button>
        </div>
      </Modal>
      <ConfirmDialog
        open={Boolean(removeId)}
        title="Move assignment to recycle bin?"
        text="You can restore it later from Recycle Bin."
        onClose={() => setRemoveId(null)}
        onConfirm={async () => {
          await api(`/api/assignments/${removeId}`, { method: "DELETE" });
          setRemoveId(null);
          list.refetch();
        }}
      />
    </div>
  );
}

function Calendar({ items }: { items: Assignment[] }) {
  const now = new Date();
  const start = startOfMonth(now);
  const offset = (getDay(start) + 6) % 7;
  const days = Array.from({ length: 42 }, (_, i) => i - offset + 1);
  return (
    <div className="grid grid-cols-7 gap-2">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
        <div key={d} className="text-xs text-[var(--muted)]">{d}</div>
      ))}
      {days.map((day, i) => {
        const date = new Date(getYear(now), getMonth(now), day);
        const inMonth = date.getMonth() === getMonth(now);
        const due = items.filter((item) => getDate(new Date(item.deadline)) === day && new Date(item.deadline).getMonth() === getMonth(now));
        return (
          <div key={i} className={`min-h-24 rounded-xl border border-[var(--line)] p-2 text-xs ${inMonth ? "" : "opacity-30"}`}>
            <div>{inMonth ? day : ""}</div>
            {due.map((item) => (
              <div key={item._id} className="mt-1 truncate rounded bg-white/8 px-1">{item.title}</div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
