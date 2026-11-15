import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Select, Textarea } from "./ui";
import { api } from "../lib/api";
import { useSemesters, useSubjects } from "../hooks/useAcademic";
import { toast } from "sonner";

export function QuickAdd({ onDone }: { onDone: () => void }) {
  const [tab, setTab] = useState<"note" | "website" | "assignment" | "snippet">("note");
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["note", "website", "assignment", "snippet"] as const).map((item) => (
          <Button key={item} variant={tab === item ? "primary" : "outline"} onClick={() => setTab(item)}>
            {item}
          </Button>
        ))}
        <Button
          variant="ghost"
          onClick={() => {
            onDone();
            navigate("/materials");
          }}
        >
          Upload material
        </Button>
      </div>
      {tab === "note" && <NoteForm onDone={onDone} />}
      {tab === "website" && <WebsiteForm onDone={onDone} />}
      {tab === "assignment" && <AssignmentForm onDone={onDone} />}
      {tab === "snippet" && <SnippetForm onDone={onDone} />}
    </div>
  );
}

function NoteForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        await api("/api/notes", { method: "POST", body: JSON.stringify({ title, content: "" }) });
        toast.success("Note created");
        onDone();
      }}
    >
      <Input placeholder="Note title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <Button type="submit">Create note</Button>
    </form>
  );
}

function WebsiteForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        await api("/api/websites", { method: "POST", body: JSON.stringify({ title, url }) });
        toast.success("Website saved");
        onDone();
      }}
    >
      <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <Input placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} required />
      <Button type="submit">Save website</Button>
    </form>
  );
}

function AssignmentForm({ onDone }: { onDone: () => void }) {
  const semesters = useSemesters();
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [semester, setSemester] = useState("");
  const subjects = useSubjects(semester);
  const [subject, setSubject] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        await api("/api/assignments", {
          method: "POST",
          body: JSON.stringify({ title, deadline, semester: semester || undefined, subject: subject || undefined }),
        });
        toast.success("Assignment added");
        onDone();
      }}
    >
      <Input placeholder="Assignment title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
      <Select value={semester} onChange={(e) => setSemester(e.target.value)}>
        <option value="">Semester</option>
        {semesters.data?.data.map((item) => (
          <option key={item._id} value={item._id}>
            {item.name}
          </option>
        ))}
      </Select>
      <Select value={subject} onChange={(e) => setSubject(e.target.value)}>
        <option value="">Subject</option>
        {subjects.data?.data.map((item) => (
          <option key={item._id} value={item._id}>
            {item.name}
          </option>
        ))}
      </Select>
      <Button type="submit">Add assignment</Button>
    </form>
  );
}

function SnippetForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        await api("/api/snippets", { method: "POST", body: JSON.stringify({ title, language, code }) });
        toast.success("Snippet saved");
        onDone();
      }}
    >
      <Input placeholder="Snippet title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <Input placeholder="Language" value={language} onChange={(e) => setLanguage(e.target.value)} />
      <Textarea rows={6} className="font-mono" placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} required />
      <Button type="submit">Save snippet</Button>
    </form>
  );
}
