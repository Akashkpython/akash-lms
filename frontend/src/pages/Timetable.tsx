import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type ItemResponse } from "../lib/api";
import { Button, ConfirmDialog, EmptyState, Input, Modal, PageHeader, Select, Skeleton, Textarea } from "../components/ui";
import { DAYS } from "../lib/constants";
import { useSubjects } from "../hooks/useAcademic";

type Entry = {
  _id: string;
  day: string;
  subjectName: string;
  startTime: string;
  endTime: string;
  room: string;
  faculty: string;
  notes: string;
  subject?: string;
};

export function TimetablePage() {
  const subjects = useSubjects();
  const [open, setOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [form, setForm] = useState({
    day: "monday",
    subjectName: "",
    subject: "",
    startTime: "09:00",
    endTime: "10:00",
    room: "",
    faculty: "",
    notes: "",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const list = useQuery({
    queryKey: ["timetable"],
    queryFn: () => api<ItemResponse<Entry[]>>("/api/timetable"),
  });

  if (list.isLoading) return <Skeleton className="h-96" />;
  const entries = list.data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle="Monday to Saturday weekly view."
        actions={<Button onClick={() => { setEditId(null); setOpen(true); }}>Add class</Button>}
      />
      {entries.length === 0 && <EmptyState title="No classes yet" text="Add your weekly college timetable." />}
      <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {DAYS.map((day) => (
          <div key={day} className="card p-3">
            <div className="mb-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{day}</div>
            <div className="space-y-2">
              {entries
                .filter((item) => item.day === day)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((item) => (
                  <button
                    key={item._id}
                    className="w-full rounded-xl bg-white/5 p-3 text-left"
                    onClick={() => {
                      setEditId(item._id);
                      setForm({
                        day: item.day,
                        subjectName: item.subjectName,
                        subject: item.subject || "",
                        startTime: item.startTime,
                        endTime: item.endTime,
                        room: item.room,
                        faculty: item.faculty,
                        notes: item.notes,
                      });
                      setOpen(true);
                    }}
                  >
                    <div className="text-sm font-medium">{item.subjectName}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {item.startTime} – {item.endTime}
                    </div>
                    <div className="text-xs text-[var(--muted)]">{item.room}</div>
                    <div className="mt-2 text-xs" onClick={(e) => { e.stopPropagation(); setRemoveId(item._id); }}>
                      Delete
                    </div>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
      <Modal open={open} title={editId ? "Edit class" : "Add class"} onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <Select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
            {DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
          </Select>
          <Select
            value={form.subject}
            onChange={(e) => {
              const subject = subjects.data?.data.find((item) => item._id === e.target.value);
              setForm({ ...form, subject: e.target.value, subjectName: subject?.name || form.subjectName });
            }}
          >
            <option value="">Link subject (optional)</option>
            {subjects.data?.data.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </Select>
          <Input placeholder="Subject name" value={form.subjectName} onChange={(e) => setForm({ ...form, subjectName: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </div>
          <Input placeholder="Room or lab" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
          <Input placeholder="Faculty (optional)" value={form.faculty} onChange={(e) => setForm({ ...form, faculty: e.target.value })} />
          <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Button
            onClick={async () => {
              if (editId) await api(`/api/timetable/${editId}`, { method: "PATCH", body: JSON.stringify(form) });
              else await api("/api/timetable", { method: "POST", body: JSON.stringify(form) });
              setOpen(false);
              list.refetch();
            }}
          >
            Save
          </Button>
        </div>
      </Modal>
      <ConfirmDialog
        open={Boolean(removeId)}
        title="Delete this class?"
        text="Timetable entries are removed immediately."
        onClose={() => setRemoveId(null)}
        onConfirm={async () => {
          await api(`/api/timetable/${removeId}`, { method: "DELETE" });
          setRemoveId(null);
          list.refetch();
        }}
      />
    </div>
  );
}
