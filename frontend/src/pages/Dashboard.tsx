import { format, formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api, type ItemResponse } from "../lib/api";
import { Badge, Button, Card, PageHeader, Skeleton } from "../components/ui";
import { ROUTE_BY_TYPE } from "../lib/constants";

type Dashboard = {
  cards: {
    materials: number;
    websites: number;
    notes: number;
    pendingAssignments: number;
    completedAssignments: number;
    snippets: number;
  };
  recent: { resourceType: string; title: string; action: string; createdAt: string }[];
  upcoming: { _id: string; title: string; deadline: string; computedStatus: string; priority: string }[];
  subjects: { _id: string; name: string; subjects: { _id: string; name: string }[] }[];
  timetable: { _id: string; subjectName: string; startTime: string; endTime: string; room: string }[];
  favorites: {
    materials: { _id: string; fileName: string }[];
    websites: { _id: string; title: string }[];
    notes: { _id: string; title: string }[];
    snippets: { _id: string; title: string }[];
  };
};

export function DashboardPage() {
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<ItemResponse<Dashboard>>("/api/dashboard"),
  });

  if (query.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    );
  }
  const data = query.data?.data;
  if (!data) return null;
  const cards = [
    ["Study materials", data.cards.materials],
    ["Saved websites", data.cards.websites],
    ["Notes", data.cards.notes],
    ["Pending assignments", data.cards.pendingAssignments],
    ["Completed assignments", data.cards.completedAssignments],
    ["Code snippets", data.cards.snippets],
  ] as const;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Your academic workspace at a glance." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <div className="text-sm text-[var(--muted)]">{label}</div>
            <div className="mt-2 text-3xl font-medium">{value}</div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <h3 className="mb-3 font-medium">Quick actions</h3>
          <div className="grid gap-2">
            {[
              ["Upload material", "/materials"],
              ["Create note", "/notes"],
              ["Save website", "/websites"],
              ["Add assignment", "/assignments"],
              ["Save code snippet", "/snippets"],
            ].map(([label, to]) => (
              <Button key={label} variant="outline" onClick={() => navigate(to)}>
                {label}
              </Button>
            ))}
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <h3 className="mb-3 font-medium">Recent activity</h3>
          <div className="space-y-2">
            {data.recent.length === 0 && <p className="text-sm text-[var(--muted)]">No activity yet.</p>}
            {data.recent.map((item, index) => (
              <button
                key={index}
                className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left hover:bg-white/5"
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
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-medium">Upcoming tasks</h3>
          {data.upcoming.length === 0 && <p className="text-sm text-[var(--muted)]">No pending deadlines.</p>}
          {data.upcoming.map((item) => (
            <div key={item._id} className="flex items-center justify-between border-b border-[var(--line)] py-3 last:border-0">
              <div>
                <div>{item.title}</div>
                <div className="text-xs text-[var(--muted)]">{format(new Date(item.deadline), "dd MMM yyyy, HH:mm")}</div>
              </div>
              <Badge tone={item.computedStatus === "overdue" ? "bad" : item.priority === "high" ? "warn" : "default"}>
                {item.computedStatus}
              </Badge>
            </div>
          ))}
        </Card>
        <Card>
          <h3 className="mb-3 font-medium">Today's timetable</h3>
          {data.timetable.length === 0 && <p className="text-sm text-[var(--muted)]">No classes scheduled today.</p>}
          {data.timetable.map((item) => (
            <div key={item._id} className="flex items-center justify-between py-2">
              <div>
                <div>{item.subjectName}</div>
                <div className="text-xs text-[var(--muted)]">{item.room || "Room TBA"}</div>
              </div>
              <div className="text-sm">
                {item.startTime} – {item.endTime}
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-medium">Subject overview</h3>
          {data.subjects.length === 0 && <p className="text-sm text-[var(--muted)]">Create a semester to start organizing materials.</p>}
          {data.subjects.map((semester) => (
            <div key={semester._id} className="mb-3">
              <div className="text-sm text-[var(--accent)]">{semester.name}</div>
              <div className="mt-1 flex flex-wrap gap-2">
                {semester.subjects.map((subject) => (
                  <span key={subject._id} className="rounded-full border border-[var(--line)] px-2 py-1 text-xs">
                    {subject.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <h3 className="mb-3 font-medium">Quick access</h3>
          {[...data.favorites.materials.map((i) => i.fileName), ...data.favorites.notes.map((i) => i.title), ...data.favorites.websites.map((i) => i.title), ...data.favorites.snippets.map((i) => i.title)].length === 0 && (
            <p className="text-sm text-[var(--muted)]">Mark favorites to pin them here.</p>
          )}
          <ul className="space-y-2 text-sm">
            {data.favorites.materials.map((item) => (
              <li key={item._id}>{item.fileName}</li>
            ))}
            {data.favorites.notes.map((item) => (
              <li key={item._id}>{item.title}</li>
            ))}
            {data.favorites.websites.map((item) => (
              <li key={item._id}>{item.title}</li>
            ))}
            {data.favorites.snippets.map((item) => (
              <li key={item._id}>{item.title}</li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
