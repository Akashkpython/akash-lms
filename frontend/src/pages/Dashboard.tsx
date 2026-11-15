import { format, formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  FileStack,
  Link2,
  NotebookPen,
  Clock3,
  CheckCircle2,
  Code2,
  HardDrive,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Bookmark,
} from "lucide-react";
import { api, type ItemResponse } from "../lib/api";
import { Badge, Button, Card, Skeleton } from "../components/ui";
import { ROUTE_BY_TYPE } from "../lib/constants";
import { useAuth } from "../store/auth";

type Dashboard = {
  cards: {
    materials: number;
    websites: number;
    notes: number;
    pendingAssignments: number;
    completedAssignments: number;
    snippets: number;
  };
  storage?: {
    usedBytes: number;
    maxBytes: number;
    usedFormatted: string;
    maxFormatted: string;
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
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<ItemResponse<Dashboard>>("/api/dashboard"),
  });

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  const data = query.data?.data;
  if (!data) return null;

  const storageUsed = data.storage?.usedBytes ?? 0;
  const storageMax = data.storage?.maxBytes ?? 1024 * 1024 * 1024;
  const storagePercent = Math.min(100, Math.round((storageUsed / storageMax) * 100));

  const stats = [
    {
      label: "Study Materials",
      value: data.cards.materials,
      icon: FileStack,
      color: "from-blue-500/20 to-indigo-500/10 text-indigo-400 border-indigo-500/30",
      to: "/materials",
    },
    {
      label: "Saved Websites",
      value: data.cards.websites,
      icon: Link2,
      color: "from-cyan-500/20 to-teal-500/10 text-cyan-400 border-cyan-500/30",
      to: "/websites",
    },
    {
      label: "My Notes",
      value: data.cards.notes,
      icon: NotebookPen,
      color: "from-amber-500/20 to-yellow-500/10 text-amber-400 border-amber-500/30",
      to: "/notes",
    },
    {
      label: "Pending Tasks",
      value: data.cards.pendingAssignments,
      icon: Clock3,
      color: "from-rose-500/20 to-pink-500/10 text-rose-400 border-rose-500/30",
      to: "/assignments",
    },
    {
      label: "Completed Tasks",
      value: data.cards.completedAssignments,
      icon: CheckCircle2,
      color: "from-emerald-500/20 to-green-500/10 text-emerald-400 border-emerald-500/30",
      to: "/assignments",
    },
    {
      label: "Code Snippets",
      value: data.cards.snippets,
      icon: Code2,
      color: "from-purple-500/20 to-violet-500/10 text-purple-400 border-purple-500/30",
      to: "/snippets",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-900/60 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
                <Sparkles size={12} className="text-indigo-400" />
                MCA Personal Workspace
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text)]">
              Welcome back, {user?.name || "Akash"} 👋
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)] max-w-xl">
              All your lecture notes, R2-synced study materials, and assignments ready for home & laboratory PC use.
            </p>
          </div>

          {/* R2 Cloud Storage Monitor Card */}
          <div className="shrink-0 w-full md:w-72 rounded-2xl border border-white/[0.08] bg-black/30 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-2">
              <span className="flex items-center gap-1.5 font-medium text-[var(--text)]">
                <HardDrive size={14} className="text-cyan-400" /> Cloudflare R2
              </span>
              <span className="font-semibold text-cyan-400">{storagePercent}%</span>
            </div>
            {/* Progress Bar */}
            <div className="h-2 w-full rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-500"
                style={{ width: `${Math.max(4, storagePercent)}%` }}
              />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-[var(--muted)]">
              <span>{data.storage?.usedFormatted || "0.0 MB"} used</span>
              <span className="font-medium text-[var(--text)]">1 GB Cap (Safe)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((card) => (
          <div
            key={card.label}
            onClick={() => navigate(card.to)}
            className="group card p-5 cursor-pointer hover:-translate-y-1 hover:border-white/[0.18] hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--muted)] group-hover:text-[var(--text)] transition">
                {card.label}
              </span>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border bg-gradient-to-br ${card.color}`}>
                <card.icon size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <div className="text-3xl font-bold tracking-tight text-[var(--text)]">{card.value}</div>
              <ArrowRight
                size={16}
                className="text-[var(--muted)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base text-[var(--text)]">Quick Actions</h3>
            <span className="text-xs text-[var(--muted)]">Shortcuts</span>
          </div>
          <div className="grid gap-2">
            {[
              { label: "Upload Study Material", to: "/materials", icon: FileStack },
              { label: "Create Lecture Note", to: "/notes", icon: NotebookPen },
              { label: "Bookmark Website", to: "/websites", icon: Link2 },
              { label: "Add Assignment Task", to: "/assignments", icon: Clock3 },
              { label: "Save Code Snippet", to: "/snippets", icon: Code2 },
            ].map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="w-full justify-start py-2.5 px-3 text-xs md:text-sm font-normal hover:border-indigo-500/40 hover:bg-indigo-500/5"
                onClick={() => navigate(action.to)}
              >
                <action.icon size={16} className="text-indigo-400 shrink-0" />
                <span className="truncate">{action.label}</span>
              </Button>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base text-[var(--text)]">Recent Activity</h3>
            <span className="text-xs text-[var(--muted)]">History</span>
          </div>
          <div className="space-y-1">
            {data.recent.length === 0 && (
              <div className="py-8 text-center text-sm text-[var(--muted)]">No recent activity logged yet.</div>
            )}
            {data.recent.map((item, index) => (
              <button
                key={index}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-white/[0.05] transition cursor-pointer"
                onClick={() => navigate(ROUTE_BY_TYPE[item.resourceType] || "/")}
              >
                <div className="min-w-0 pr-3">
                  <div className="text-sm font-medium text-[var(--text)] truncate">{item.title}</div>
                  <div className="text-xs text-[var(--muted)] flex items-center gap-1.5 mt-0.5">
                    <span className="capitalize">{item.resourceType}</span>
                    <span>•</span>
                    <span className="text-indigo-400/80">{item.action}</span>
                  </div>
                </div>
                <div className="text-xs text-[var(--muted)] shrink-0">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Upcoming Tasks & Today's Timetable */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base text-[var(--text)] flex items-center gap-2">
              <Clock3 size={18} className="text-rose-400" /> Upcoming Tasks & Deadlines
            </h3>
            <Button variant="ghost" className="text-xs h-7 px-2" onClick={() => navigate("/assignments")}>
              View all
            </Button>
          </div>
          {data.upcoming.length === 0 && (
            <div className="py-8 text-center text-sm text-[var(--muted)]">No upcoming deadlines scheduled.</div>
          )}
          <div className="space-y-2">
            {data.upcoming.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white/[0.01] p-3 transition hover:bg-white/[0.03]"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-sm font-medium text-[var(--text)] truncate">{item.title}</div>
                  <div className="text-xs text-[var(--muted)] mt-0.5">
                    {format(new Date(item.deadline), "dd MMM yyyy, HH:mm")}
                  </div>
                </div>
                <Badge
                  tone={
                    item.computedStatus === "overdue"
                      ? "bad"
                      : item.computedStatus === "completed"
                        ? "ok"
                        : item.priority === "high"
                          ? "warn"
                          : "default"
                  }
                >
                  {item.computedStatus}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base text-[var(--text)] flex items-center gap-2">
              <Calendar size={18} className="text-cyan-400" /> Today's Timetable
            </h3>
            <Button variant="ghost" className="text-xs h-7 px-2" onClick={() => navigate("/timetable")}>
              View schedule
            </Button>
          </div>
          {data.timetable.length === 0 && (
            <div className="py-8 text-center text-sm text-[var(--muted)]">No classes scheduled for today.</div>
          )}
          <div className="space-y-2">
            {data.timetable.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white/[0.01] p-3"
              >
                <div>
                  <div className="text-sm font-medium text-[var(--text)]">{item.subjectName}</div>
                  <div className="text-xs text-[var(--muted)] mt-0.5">{item.room || "Room TBA"}</div>
                </div>
                <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-xs font-semibold text-indigo-300">
                  {item.startTime} – {item.endTime}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Subject Tree & Quick Pinned Favorites */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base text-[var(--text)] flex items-center gap-2">
              <Layers size={18} className="text-indigo-400" /> Academic Hierarchy
            </h3>
            <span className="text-xs text-[var(--muted)]">Semesters & Subjects</span>
          </div>
          {data.subjects.length === 0 && (
            <div className="py-8 text-center text-sm text-[var(--muted)]">
              Create a semester to organize your academic coursework.
            </div>
          )}
          <div className="space-y-4">
            {data.subjects.map((semester) => (
              <div key={semester._id} className="rounded-xl border border-[var(--line)] p-3 bg-white/[0.01]">
                <div className="text-sm font-semibold text-indigo-400">{semester.name}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {semester.subjects.length === 0 && (
                    <span className="text-xs text-[var(--muted)]">No subjects added yet</span>
                  )}
                  {semester.subjects.map((subject) => (
                    <span
                      key={subject._id}
                      className="rounded-lg bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 text-xs font-medium text-[var(--text)] hover:border-indigo-500/40 transition"
                    >
                      {subject.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base text-[var(--text)] flex items-center gap-2">
              <Bookmark size={18} className="text-amber-400" /> Pinned Favorites
            </h3>
            <span className="text-xs text-[var(--muted)]">Quick Access</span>
          </div>
          {[
            ...data.favorites.materials,
            ...data.favorites.notes,
            ...data.favorites.websites,
            ...data.favorites.snippets,
          ].length === 0 && (
            <div className="py-8 text-center text-sm text-[var(--muted)]">
              Star your favorite materials, notes, and links to pin them here.
            </div>
          )}
          <div className="space-y-1.5">
            {data.favorites.materials.map((item) => (
              <div
                key={item._id}
                onClick={() => navigate("/materials")}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--text)] hover:bg-white/[0.05] transition cursor-pointer"
              >
                <FileStack size={14} className="text-indigo-400 shrink-0" />
                <span className="truncate">{item.fileName}</span>
              </div>
            ))}
            {data.favorites.notes.map((item) => (
              <div
                key={item._id}
                onClick={() => navigate("/notes")}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--text)] hover:bg-white/[0.05] transition cursor-pointer"
              >
                <NotebookPen size={14} className="text-amber-400 shrink-0" />
                <span className="truncate">{item.title}</span>
              </div>
            ))}
            {data.favorites.websites.map((item) => (
              <div
                key={item._id}
                onClick={() => navigate("/websites")}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--text)] hover:bg-white/[0.05] transition cursor-pointer"
              >
                <Link2 size={14} className="text-cyan-400 shrink-0" />
                <span className="truncate">{item.title}</span>
              </div>
            ))}
            {data.favorites.snippets.map((item) => (
              <div
                key={item._id}
                onClick={() => navigate("/snippets")}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--text)] hover:bg-white/[0.05] transition cursor-pointer"
              >
                <Code2 size={14} className="text-purple-400 shrink-0" />
                <span className="truncate">{item.title}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
