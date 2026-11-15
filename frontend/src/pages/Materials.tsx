import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Eye, Star } from "lucide-react";
import { api, qs, type ItemResponse, type ListResponse } from "../lib/api";
import { useTree } from "../hooks/useAcademic";
import { Badge, Button, ConfirmDialog, EmptyState, Input, Modal, PageHeader, Select, Skeleton, Textarea } from "../components/ui";

type Material = {
  _id: string;
  fileName: string;
  description: string;
  size: number;
  extension: string;
  mimeType: string;
  createdAt: string;
  favorite: boolean;
  semester?: { name: string };
  subject?: { name: string };
  topic?: { name: string };
};

function uploadWithProgress(url: string, file: File, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed")));
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });
}

export function MaterialsPage() {
  const tree = useTree();
  const client = useQueryClient();
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<{ url: string; mimeType: string; fileName: string } | null>(null);
  const [edit, setEdit] = useState<Material | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [drag, setDrag] = useState(false);

  const subjects = useMemo(
    () => tree.data?.data.find((item) => item._id === semester)?.subjects ?? [],
    [tree.data, semester],
  );
  const topics = useMemo(() => subjects.find((item) => item._id === subject)?.topics ?? [], [subjects, subject]);

  const list = useQuery({
    queryKey: ["materials", semester, subject, topic, q, sort, page],
    queryFn: () =>
      api<ListResponse<Material>>(
        `/api/materials${qs({ semester, subject, topic, q, sort, page, limit: 20 })}`,
      ),
  });

  async function uploadFiles(files: FileList | File[]) {
    if (!semester || !subject || !topic) {
      toast.error("Select a semester, subject and topic before uploading.");
      setOpen(true);
      return;
    }
    for (const file of Array.from(files)) {
      try {
        const initiated = await api<ItemResponse<{ id: string; uploadUrl: string }>>("/api/materials/initiate", {
          method: "POST",
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            semester,
            subject,
            topic,
          }),
        });
        await uploadWithProgress(initiated.data.uploadUrl, file, (pct) => setProgress((p) => ({ ...p, [file.name]: pct })));
        await api(`/api/materials/${initiated.data.id}/complete`, { method: "POST" });
        toast.success(`${file.name} uploaded`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : `Failed to upload ${file.name}`);
      } finally {
        setProgress((p) => {
          const next = { ...p };
          delete next[file.name];
          return next;
        });
      }
    }
    client.invalidateQueries({ queryKey: ["materials"] });
    client.invalidateQueries({ queryKey: ["dashboard"] });
  }

  async function access(id: string, inline = false) {
    const result = await api<ItemResponse<{ url: string; previewable: boolean; mimeType: string; fileName: string }>>(
      `/api/materials/${id}/access${inline ? "?inline=1" : ""}`,
      { method: "POST" },
    );
    if (inline) {
      if (!result.data.previewable) {
        toast.message("Preview is not available for this file type. Starting download.");
        window.open(result.data.url, "_blank");
        return;
      }
      setPreview(result.data);
    } else {
      window.open(result.data.url, "_blank");
    }
  }

  return (
    <div>
      <PageHeader
        title="Study Materials"
        subtitle="Upload at home. Open from any laboratory PC after signing in."
        actions={<Button onClick={() => setOpen(true)}>Upload material</Button>}
      />

      <AcademicManager />

      <div className="mb-4 grid gap-3 md:grid-cols-5">
        <Select value={semester} onChange={(e) => { setSemester(e.target.value); setSubject(""); setTopic(""); }}>
          <option value="">All semesters</option>
          {tree.data?.data.map((item) => (
            <option key={item._id} value={item._id}>{item.name}</option>
          ))}
        </Select>
        <Select value={subject} onChange={(e) => { setSubject(e.target.value); setTopic(""); }}>
          <option value="">All subjects</option>
          {subjects.map((item) => (
            <option key={item._id} value={item._id}>{item.name}</option>
          ))}
        </Select>
        <Select value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="">All topics</option>
          {topics.map((item) => (
            <option key={item._id} value={item._id}>{item.name}</option>
          ))}
        </Select>
        <Input placeholder="Search files" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="-createdAt">Newest</option>
          <option value="fileName">Name</option>
          <option value="extension">Type</option>
          <option value="-size">Size</option>
        </Select>
      </div>

      <div
        className={`mb-6 rounded-2xl border border-dashed p-8 text-center ${drag ? "border-[var(--accent)] bg-white/5" : "border-[var(--line)]"}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
        }}
      >
        <p className="text-sm text-[var(--muted)]">Drag files here or use Upload. PDF, Office, images, zip, audio and video are supported.</p>
        {Object.entries(progress).map(([name, value]) => (
          <div key={name} className="mx-auto mt-3 max-w-md text-left text-sm">
            <div className="flex justify-between"><span>{name}</span><span>{value}%</span></div>
            <div className="mt-1 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-[var(--accent)]" style={{ width: `${value}%` }} /></div>
          </div>
        ))}
      </div>

      {list.isLoading ? <Skeleton className="h-64" /> : null}
      {list.data && list.data.data.length === 0 ? (
        <EmptyState title="No materials yet" text="Create a semester, subject and topic, then upload files from home." />
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-[var(--muted)]">
            <tr>
              <th className="py-2">File</th>
              <th>Subject</th>
              <th>Type</th>
              <th>Size</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.data?.data.map((item) => (
              <tr key={item._id} className="border-t border-[var(--line)]">
                <td className="py-3">
                  <div className="font-medium">{item.fileName}</div>
                  <div className="text-xs text-[var(--muted)]">{item.description || item.topic?.name}</div>
                </td>
                <td>{item.subject?.name}</td>
                <td><Badge>{item.extension.toUpperCase()}</Badge></td>
                <td>{(item.size / 1024).toFixed(1)} KB</td>
                <td className="space-x-2 whitespace-nowrap">
                  <button onClick={() => access(item._id, true)}><Eye size={16} /></button>
                  <button onClick={() => access(item._id)}><Download size={16} /></button>
                  <button onClick={() => api(`/api/materials/${item._id}`, { method: "PATCH", body: JSON.stringify({ favorite: !item.favorite }) }).then(() => list.refetch())}>
                    <Star size={16} fill={item.favorite ? "currentColor" : "none"} />
                  </button>
                  <Button variant="ghost" onClick={() => setEdit(item)}>Edit</Button>
                  <Button variant="ghost" onClick={() => setRemoveId(item._id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.data && list.data.meta.pages > 1 && (
        <div className="mt-4 flex gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <Button variant="outline" disabled={page >= list.data.meta.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      <UploadModal open={open} onClose={() => setOpen(false)} onFiles={uploadFiles} semester={semester} setSemester={setSemester} subject={subject} setSubject={setSubject} topic={topic} setTopic={setTopic} />

      <Modal open={Boolean(preview)} title={preview?.fileName || "Preview"} onClose={() => setPreview(null)}>
        {preview?.mimeType.startsWith("image/") && <img src={preview.url} alt={preview.fileName} className="max-h-[70vh] w-full object-contain" />}
        {preview?.mimeType === "application/pdf" && <iframe title="PDF preview" src={preview.url} className="h-[70vh] w-full rounded-xl" />}
        {preview?.mimeType.startsWith("audio/") && <audio controls src={preview.url} className="w-full" />}
        {preview?.mimeType.startsWith("video/") && <video controls src={preview.url} className="w-full" />}
        {preview?.mimeType.startsWith("text/") && <iframe title="Text preview" src={preview.url} className="h-[50vh] w-full rounded-xl bg-white" />}
      </Modal>

      <Modal open={Boolean(edit)} title="Edit material" onClose={() => setEdit(null)}>
        {edit && (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              await api(`/api/materials/${edit._id}`, {
                method: "PATCH",
                body: JSON.stringify({ fileName: edit.fileName, description: edit.description, topic: topic || undefined, subject: subject || undefined, semester: semester || undefined }),
              });
              toast.success("Updated");
              setEdit(null);
              list.refetch();
            }}
          >
            <Input value={edit.fileName} onChange={(e) => setEdit({ ...edit, fileName: e.target.value })} />
            <Textarea value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
            <p className="text-xs text-[var(--muted)]">To move a file, choose the destination filters above, then save.</p>
            <Button type="submit">Save</Button>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(removeId)}
        title="Move to recycle bin?"
        text="The file stays in cloud storage until you permanently delete it or the retention period ends."
        onClose={() => setRemoveId(null)}
        onConfirm={async () => {
          await api(`/api/materials/${removeId}`, { method: "DELETE" });
          setRemoveId(null);
          list.refetch();
        }}
      />
    </div>
  );
}

function UploadModal(props: {
  open: boolean;
  onClose: () => void;
  onFiles: (files: FileList) => void;
  semester: string;
  setSemester: (v: string) => void;
  subject: string;
  setSubject: (v: string) => void;
  topic: string;
  setTopic: (v: string) => void;
}) {
  const tree = useTree();
  const subjects = tree.data?.data.find((s) => s._id === props.semester)?.subjects ?? [];
  const topics = subjects.find((s) => s._id === props.subject)?.topics ?? [];
  return (
    <Modal open={props.open} title="Upload materials" onClose={props.onClose}>
      <div className="space-y-3">
        <Select value={props.semester} onChange={(e) => props.setSemester(e.target.value)}>
          <option value="">Semester</option>
          {tree.data?.data.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
        </Select>
        <Select value={props.subject} onChange={(e) => props.setSubject(e.target.value)}>
          <option value="">Subject</option>
          {subjects.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
        </Select>
        <Select value={props.topic} onChange={(e) => props.setTopic(e.target.value)}>
          <option value="">Topic</option>
          {topics.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
        </Select>
        <Input type="file" multiple onChange={(e) => e.target.files && props.onFiles(e.target.files)} />
      </div>
    </Modal>
  );
}

function AcademicManager() {
  const tree = useTree();
  const client = useQueryClient();
  const [semesterName, setSemesterName] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [topicName, setTopicName] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const create = useMutation({
    mutationFn: async () => undefined,
    onSuccess: () => client.invalidateQueries({ queryKey: ["academic-tree"] }),
  });

  return (
    <div className="card mb-6 grid gap-3 p-4 md:grid-cols-3">
      <form
        className="space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await api("/api/semesters", { method: "POST", body: JSON.stringify({ name: semesterName }) });
          setSemesterName("");
          create.mutate();
        }}
      >
        <div className="text-xs uppercase tracking-widest text-[var(--muted)]">Semester</div>
        <Input placeholder="Semester 1" value={semesterName} onChange={(e) => setSemesterName(e.target.value)} required />
        <Button type="submit">Add semester</Button>
      </form>
      <form
        className="space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await api("/api/subjects", { method: "POST", body: JSON.stringify({ name: subjectName, semester: semesterId }) });
          setSubjectName("");
          create.mutate();
        }}
      >
        <div className="text-xs uppercase tracking-widest text-[var(--muted)]">Subject</div>
        <Select value={semesterId} onChange={(e) => setSemesterId(e.target.value)} required>
          <option value="">Parent semester</option>
          {tree.data?.data.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
        </Select>
        <Input placeholder="Data Structures" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} required />
        <Button type="submit">Add subject</Button>
      </form>
      <form
        className="space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await api("/api/topics", { method: "POST", body: JSON.stringify({ name: topicName, subject: subjectId }) });
          setTopicName("");
          create.mutate();
        }}
      >
        <div className="text-xs uppercase tracking-widest text-[var(--muted)]">Topic</div>
        <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required>
          <option value="">Parent subject</option>
          {tree.data?.data.flatMap((s) => s.subjects).map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
        </Select>
        <Input placeholder="Unit 1" value={topicName} onChange={(e) => setTopicName(e.target.value)} required />
        <Button type="submit">Add topic</Button>
      </form>
    </div>
  );
}
