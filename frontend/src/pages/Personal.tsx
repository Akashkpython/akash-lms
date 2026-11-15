import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, type ItemResponse } from "../lib/api";
import { Button, Card, ConfirmDialog, EmptyState, Input, PageHeader, Select, Skeleton } from "../components/ui";
import { ROUTE_BY_TYPE } from "../lib/constants";
import { useAuth } from "../store/auth";
import { useState } from "react";

export function FavoritesPage() {
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ["favorites"],
    queryFn: () =>
      api<ItemResponse<Record<string, { _id: string; title?: string; fileName?: string; question?: string }[]>>>("/api/favorites"),
  });
  if (query.isLoading) return <Skeleton className="h-64" />;
  const data = query.data?.data || {};
  const sections = Object.entries(data);
  const empty = sections.every(([, items]) => !items?.length);
  return (
    <div>
      <PageHeader title="Favorites" subtitle="Bookmarked materials, notes, websites and libraries." />
      {empty && <EmptyState title="No favorites" text="Use the star icon on any resource to pin it here." />}
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map(([type, items]) => (
          <Card key={type}>
            <h3 className="mb-3 capitalize">{type}</h3>
            <div className="space-y-2">
              {items.map((item) => (
                <button key={item._id} className="block text-left hover:text-[var(--accent)]" onClick={() => navigate(ROUTE_BY_TYPE[type.replace(/s$/, "")] || "/")}>
                  {item.title || item.fileName || item.question}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function RecentPage() {
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ["recent"],
    queryFn: () =>
      api<ItemResponse<{ resourceType: string; title: string; action: string; createdAt: string }[]>>("/api/recent"),
  });
  if (query.isLoading) return <Skeleton className="h-64" />;
  const items = query.data?.data ?? [];
  return (
    <div>
      <PageHeader title="Recently opened" subtitle="The latest 40 actions across your workspace." />
      {items.length === 0 && <EmptyState title="Nothing opened yet" text="Open notes, files or snippets to build history." />}
      <div className="space-y-2">
        {items.map((item, index) => (
          <button
            key={index}
            className="card flex w-full items-center justify-between p-4 text-left"
            onClick={() => navigate(ROUTE_BY_TYPE[item.resourceType] || "/")}
          >
            <div>
              <div>{item.title}</div>
              <div className="text-xs text-[var(--muted)]">
                {item.resourceType} · {item.action}
              </div>
            </div>
            <div className="text-xs text-[var(--muted)]">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function RecycleBinPage() {
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const query = useQuery({
    queryKey: ["recycle"],
    queryFn: () =>
      api<ItemResponse<{ id: string; type: string; title: string; deletedAt: string; expiresAt: string }[]>>("/api/recycle-bin"),
  });
  if (query.isLoading) return <Skeleton className="h-64" />;
  const items = query.data?.data ?? [];
  return (
    <div>
      <PageHeader
        title="Recycle Bin"
        subtitle="Soft-deleted items stay recoverable until the retention period ends. Files remain in R2 until permanent deletion succeeds."
        actions={<Button variant="danger" onClick={() => setConfirmEmpty(true)}>Empty recycle bin</Button>}
      />
      {items.length === 0 && <EmptyState title="Bin is empty" text="Deleted resources will appear here." />}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={`${item.type}-${item.id}`} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div>{item.title}</div>
              <div className="text-xs text-[var(--muted)]">
                {item.type} · deleted {item.deletedAt ? new Date(item.deletedAt).toLocaleString() : ""}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  await api(`/api/recycle-bin/${item.type}/${item.id}/restore`, { method: "POST" });
                  toast.success("Restored");
                  query.refetch();
                }}
              >
                Restore
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  await api(`/api/recycle-bin/${item.type}/${item.id}`, { method: "DELETE" });
                  toast.success("Permanently deleted");
                  query.refetch();
                }}
              >
                Delete forever
              </Button>
            </div>
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={confirmEmpty}
        title="Empty recycle bin?"
        text="This permanently deletes every item in the bin, including stored files."
        confirmLabel="Empty bin"
        onClose={() => setConfirmEmpty(false)}
        onConfirm={async () => {
          await api("/api/recycle-bin", { method: "DELETE" });
          setConfirmEmpty(false);
          query.refetch();
        }}
      />
    </div>
  );
}

export function SettingsPage() {
  const { user, updateMe } = useAuth();
  const [name, setName] = useState(user?.name || "");
  return (
    <div className="max-w-xl">
      <PageHeader title="Settings" subtitle="Profile, theme and workspace preferences." />
      <Card>
        <div className="space-y-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <Input value={user?.email || ""} disabled />
          <Select value={user?.theme} onChange={(e) => updateMe({ theme: e.target.value as "dark" | "light" | "system" })}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </Select>
          <Button
            onClick={async () => {
              await updateMe({ name });
              toast.success("Profile updated");
            }}
          >
            Save profile
          </Button>
        </div>
      </Card>
      <Card className="mt-4 text-sm text-[var(--muted)]">
        Public registration is disabled. Only this administrator account can access academic data. GitHub Pages hosts the
        static UI; all private data is authorized by the API.
      </Card>
    </div>
  );
}
