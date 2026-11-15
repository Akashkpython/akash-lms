import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { api, qs, type ListResponse } from "../lib/api";
import { Badge, Button, ConfirmDialog, EmptyState, Input, Modal, PageHeader, Select, Skeleton, Textarea } from "../components/ui";
import { CodeBlock } from "../components/CodeBlock";
import { COMMAND_CATEGORIES, DB_TYPES, EXAM_KINDS, LANGUAGES } from "../lib/constants";
import { useSemesters, useSubjects } from "../hooks/useAcademic";

type Item = Record<string, any>;

export function WebsitesPage() {
  return (
    <CollectionPage
      title="Website Collection"
      subtitle="Save practical links given by lecturers."
      endpoint="/api/websites"
      queryKey="websites"
      fields={[
        { key: "title", label: "Title", required: true },
        { key: "url", label: "URL", required: true },
        { key: "description", label: "Description" },
        { key: "notes", label: "Personal notes", type: "textarea" },
        { key: "tags", label: "Tags (comma separated)" },
      ]}
      academic
      render={(item, actions) => (
        <div className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <a href={item.url} target="_blank" rel="noreferrer" className="text-lg hover:text-[var(--accent)]">{item.title}</a>
              <div className="text-sm text-[var(--muted)]">{item.url}</div>
              <p className="mt-2 text-sm">{item.description}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{item.notes}</p>
              <div className="mt-2 flex flex-wrap gap-1">{(item.tags || []).map((tag: string) => <Badge key={tag}>{tag}</Badge>)}</div>
            </div>
            {actions(item)}
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(item.url).then(() => toast.success("URL copied"))}>Copy URL</Button>
            <Button variant="ghost" onClick={() => window.open(item.url, "_blank")}>Open</Button>
          </div>
        </div>
      )}
    />
  );
}

export function SnippetsPage() {
  return (
    <CollectionPage
      title="Code Snippets"
      subtitle="Personal programming library with indentation preserved."
      endpoint="/api/snippets"
      queryKey="snippets"
      fields={[
        { key: "title", label: "Title", required: true },
        { key: "language", label: "Language", type: "language", required: true },
        { key: "code", label: "Code", type: "code", required: true },
        { key: "description", label: "Description", type: "textarea" },
        { key: "tags", label: "Tags" },
      ]}
      filters={[{ key: "language", label: "Language", options: LANGUAGES.map((l) => ({ id: l, label: l })) }]}
      render={(item, actions) => (
        <div className="card space-y-3 p-4">
          <div className="flex justify-between gap-3">
            <div>
              <div className="text-lg">{item.title}</div>
              <div className="text-sm text-[var(--muted)]">{item.description}</div>
            </div>
            {actions(item)}
          </div>
          <CodeBlock code={item.code} language={item.language} />
        </div>
      )}
    />
  );
}

export function SqlPage() {
  return (
    <CollectionPage
      title="SQL Query Collection"
      subtitle="Store and learn queries. This module never executes SQL against a live database."
      endpoint="/api/sql-queries"
      queryKey="sql"
      fields={[
        { key: "title", label: "Title", required: true },
        { key: "dbType", label: "Database type", type: "select", options: DB_TYPES, required: true },
        { key: "sql", label: "SQL", type: "code", required: true },
        { key: "description", label: "Description", type: "textarea" },
        { key: "expectedOutput", label: "Expected output / explanation", type: "textarea" },
        { key: "tags", label: "Tags" },
      ]}
      filters={[{ key: "dbType", label: "Database", options: DB_TYPES }]}
      render={(item, actions) => (
        <div className="card space-y-3 p-4">
          <div className="flex justify-between">
            <div>
              <div className="text-lg">{item.title}</div>
              <Badge>{item.dbType}</Badge>
            </div>
            {actions(item)}
          </div>
          <CodeBlock code={item.sql} language="sql" />
          {item.expectedOutput && <pre className="whitespace-pre-wrap text-sm text-[var(--muted)]">{item.expectedOutput}</pre>}
        </div>
      )}
    />
  );
}

export function CommandsPage() {
  return (
    <CollectionPage
      title="Terminal Commands"
      subtitle="A personal command reference for labs and home."
      endpoint="/api/terminal-commands"
      queryKey="commands"
      fields={[
        { key: "title", label: "Title", required: true },
        { key: "command", label: "Command", type: "code", required: true },
        { key: "os", label: "Operating system" },
        { key: "category", label: "Category", type: "select", options: COMMAND_CATEGORIES, required: true },
        { key: "description", label: "Description", type: "textarea" },
        { key: "example", label: "Example usage", type: "textarea" },
        { key: "tags", label: "Tags" },
      ]}
      filters={[{ key: "category", label: "Category", options: COMMAND_CATEGORIES }]}
      render={(item, actions) => (
        <div className="card space-y-3 p-4">
          <div className="flex justify-between">
            <div>
              <div className="text-lg">{item.title}</div>
              <div className="text-xs text-[var(--muted)]">{item.os} · {item.category}</div>
            </div>
            {actions(item)}
          </div>
          <CodeBlock code={item.command} language="bash" />
          <p className="text-sm">{item.description}</p>
          {item.example && <p className="text-sm text-[var(--muted)]">{item.example}</p>}
        </div>
      )}
    />
  );
}

export function ExamPage() {
  return (
    <CollectionPage
      title="Exam Preparation"
      subtitle="Questions, answers, viva notes and definitions."
      endpoint="/api/exam-preparation"
      queryKey="exam"
      academic
      fields={[
        { key: "question", label: "Question", type: "textarea", required: true },
        { key: "answer", label: "Answer", type: "textarea" },
        { key: "topic", label: "Topic" },
        { key: "kind", label: "Type", type: "select", options: EXAM_KINDS },
        { key: "tags", label: "Tags" },
      ]}
      filters={[{ key: "kind", label: "Type", options: EXAM_KINDS }]}
      render={(item, actions) => (
        <div className="card p-4">
          <div className="flex justify-between gap-3">
            <div>
              <div className="text-lg">{item.question}</div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-[var(--muted)]">{item.answer}</div>
              <div className="mt-2 flex gap-2">
                <Badge>{item.kind}</Badge>
                {item.important && <Badge tone="warn">Important</Badge>}
              </div>
            </div>
            {actions(item)}
          </div>
        </div>
      )}
    />
  );
}

type Field = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "code" | "select" | "language";
  options?: { id: string; label: string }[];
  required?: boolean;
};

function CollectionPage({
  title,
  subtitle,
  endpoint,
  queryKey,
  fields,
  render,
  filters = [],
  academic = false,
}: {
  title: string;
  subtitle: string;
  endpoint: string;
  queryKey: string;
  fields: Field[];
  render: (item: Item, actions: (item: Item) => ReactNode) => ReactNode;
  filters?: { key: string; label: string; options: { id: string; label: string }[] }[];
  academic?: boolean;
}) {
  const [q, setQ] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Item>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const semesters = useSemesters();
  const subjects = useSubjects(form.semester);
  const list = useQuery({
    queryKey: [queryKey, q, filterValues],
    queryFn: () => api<ListResponse<Item>>(`${endpoint}${qs({ q, ...filterValues, limit: 50, sort: "-updatedAt" })}`),
  });

  function payload() {
    const body: Item = { ...form };
    if (typeof body.tags === "string") {
      body.tags = body.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
    }
    return body;
  }

  const actions = (item: Item) => (
    <div className="flex shrink-0 gap-2">
      <button
        onClick={async () => {
          await api(`${endpoint}/${item._id}`, { method: "PATCH", body: JSON.stringify({ favorite: !item.favorite }) });
          list.refetch();
        }}
      >
        <Star size={16} fill={item.favorite ? "currentColor" : "none"} />
      </button>
      <Button
        variant="ghost"
        onClick={() => {
          setEditId(item._id);
          setForm({
            ...item,
            tags: Array.isArray(item.tags) ? item.tags.join(", ") : "",
            semester: item.semester?._id || item.semester || "",
            subject: item.subject?._id || item.subject || "",
          });
          setOpen(true);
        }}
      >
        Edit
      </Button>
      <Button variant="ghost" onClick={() => setRemoveId(item._id)}>Delete</Button>
    </div>
  );

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} actions={<Button onClick={() => { setForm({}); setEditId(null); setOpen(true); }}>Add</Button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input className="max-w-sm" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        {filters.map((filter) => (
          <Select key={filter.key} value={filterValues[filter.key] || ""} onChange={(e) => setFilterValues({ ...filterValues, [filter.key]: e.target.value })}>
            <option value="">{filter.label}</option>
            {filter.options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </Select>
        ))}
      </div>
      {list.isLoading && <Skeleton className="h-64" />}
      {list.data?.data.length === 0 && <EmptyState title="Nothing saved yet" text="Add your first item to start this library." />}
      <div className="space-y-3">{list.data?.data.map((item) => <div key={item._id}>{render(item, actions)}</div>)}</div>

      <Modal open={open} title={editId ? "Edit" : "Add"} onClose={() => setOpen(false)}>
        <div className="space-y-3">
          {fields.map((field) => {
            if (field.type === "textarea" || field.type === "code") {
              return (
                <Textarea
                  key={field.key}
                  className={field.type === "code" ? "font-mono" : ""}
                  rows={field.type === "code" ? 8 : 4}
                  placeholder={field.label}
                  value={form[field.key] || ""}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  required={field.required}
                />
              );
            }
            if (field.type === "select" || field.type === "language") {
              const options = field.type === "language" ? LANGUAGES.map((l) => ({ id: l, label: l })) : field.options || [];
              return (
                <Select key={field.key} value={form[field.key] || ""} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}>
                  <option value="">{field.label}</option>
                  {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                </Select>
              );
            }
            return (
              <Input
                key={field.key}
                placeholder={field.label}
                value={form[field.key] || ""}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                required={field.required}
              />
            );
          })}
          {academic && (
            <>
              <Select value={form.semester || ""} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
                <option value="">Semester</option>
                {semesters.data?.data.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </Select>
              <Select value={form.subject || ""} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                <option value="">Subject</option>
                {subjects.data?.data.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </Select>
            </>
          )}
          <Button
            onClick={async () => {
              const body = payload();
              if (editId) await api(`${endpoint}/${editId}`, { method: "PATCH", body: JSON.stringify(body) });
              else await api(endpoint, { method: "POST", body: JSON.stringify(body) });
              toast.success("Saved");
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
        title="Move to recycle bin?"
        text="You can restore this item later."
        onClose={() => setRemoveId(null)}
        onConfirm={async () => {
          await api(`${endpoint}/${removeId}`, { method: "DELETE" });
          setRemoveId(null);
          list.refetch();
        }}
      />
    </div>
  );
}
