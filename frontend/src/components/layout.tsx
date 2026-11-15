import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Bookmark,
  CalendarDays,
  Clock3,
  Code2,
  Database,
  FileStack,
  GraduationCap,
  Home,
  Link2,
  Menu,
  Moon,
  NotebookPen,
  PanelLeft,
  Plus,
  Search,
  Settings,
  Sun,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api, type ItemResponse } from "../lib/api";
import { useAuth } from "../store/auth";
import { Button, Input, Modal } from "./ui";
import { QuickAdd } from "./QuickAdd";
import { ROUTE_BY_TYPE } from "../lib/constants";
import { cn } from "../lib/cn";

const NAV = [
  {
    label: "Workspace",
    items: [
      { to: "/", icon: Home, label: "Dashboard" },
      { to: "/materials", icon: FileStack, label: "Study Materials" },
      { to: "/websites", icon: Link2, label: "Website Collection" },
      { to: "/notes", icon: NotebookPen, label: "My Notes" },
      { to: "/assignments", icon: GraduationCap, label: "Assignments & Tasks" },
    ],
  },
  {
    label: "Development Library",
    items: [
      { to: "/snippets", icon: Code2, label: "Code Snippets" },
      { to: "/sql", icon: Database, label: "SQL Query Collection" },
      { to: "/commands", icon: Terminal, label: "Terminal Commands" },
    ],
  },
  {
    label: "Academic",
    items: [
      { to: "/exam", icon: BookOpen, label: "Exam Preparation" },
      { to: "/timetable", icon: CalendarDays, label: "Timetable" },
    ],
  },
  {
    label: "Personal",
    items: [
      { to: "/favorites", icon: Bookmark, label: "Favorites" },
      { to: "/recent", icon: Clock3, label: "Recently Opened" },
      { to: "/recycle-bin", icon: Trash2, label: "Recycle Bin" },
      { to: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState(false);
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState(false);
  const { user, logout, updateMe } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const search = useQuery({
    queryKey: ["search", query],
    enabled: query.trim().length > 1,
    queryFn: () => api<ItemResponse<{ type: string; id: string; title: string }[]>>(`/api/search?q=${encodeURIComponent(query)}`),
  });

  useEffect(() => {
    setMobileOpen(false);
    setMenu(false);
  }, [location.pathname]);

  const crumbs = useMemo(() => {
    const item = NAV.flatMap((group) => group.items).find((entry) =>
      entry.to === "/" ? location.pathname === "/" : location.pathname.startsWith(entry.to),
    );
    return item ? ["Workspace", item.label] : ["Workspace"];
  }, [location.pathname]);

  const sidebar = (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-[var(--line)] bg-[var(--bg-elev)]/90 backdrop-blur-xl transition-all",
        collapsed ? "w-[76px]" : "w-[280px]",
      )}
    >
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] text-[#070b14] font-semibold">
          A
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm font-semibold tracking-[0.18em]">AKASH LMS</div>
            <div className="text-xs text-[var(--muted)]">Personal academic workspace</div>
          </div>
        )}
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
        {NAV.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <div className="mb-2 px-2 text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{group.label}</div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-[var(--muted)] hover:bg-white/5 hover:text-[var(--text)]",
                      isActive && "bg-white/8 text-[var(--text)]",
                    )
                  }
                >
                  <item.icon size={18} />
                  {!collapsed && item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <button
        className="hidden items-center gap-2 border-t border-[var(--line)] px-4 py-3 text-sm text-[var(--muted)] md:flex"
        onClick={() => setCollapsed((value) => !value)}
      >
        <PanelLeft size={16} />
        {!collapsed && "Collapse"}
      </button>
    </aside>
  );

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">{sidebar}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 h-full">{sidebar}</div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[var(--line)] bg-[var(--bg)]/80 px-4 py-3 backdrop-blur-xl">
          <button className="rounded-xl p-2 hover:bg-white/5 md:hidden" onClick={() => setMobileOpen(true)}>
            <Menu size={18} />
          </button>
          <div className="hidden text-xs text-[var(--muted)] md:block">{crumbs.join(" / ")}</div>
          <div className="relative mx-auto w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-2.5 text-[var(--muted)]" size={16} />
            <Input className="pl-9" placeholder="Search workspace" value={query} onChange={(e) => setQuery(e.target.value)} />
            {query.trim().length > 1 && (
              <div className="card absolute mt-2 w-full overflow-hidden p-2">
                {search.isLoading && <div className="px-3 py-2 text-sm text-[var(--muted)]">Searching…</div>}
                {search.data?.data.length === 0 && <div className="px-3 py-2 text-sm text-[var(--muted)]">No matches</div>}
                {search.data?.data.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5"
                    onClick={() => {
                      navigate(ROUTE_BY_TYPE[item.type] || "/");
                      setQuery("");
                    }}
                  >
                    <span className="text-[var(--muted)]">{item.type}</span>
                    <div>{item.title}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button onClick={() => setQuickAdd(true)}>
            <Plus size={16} /> Quick add
          </Button>
          <div className="relative">
            <button className="flex items-center gap-2 rounded-full border border-[var(--line)] px-2 py-1" onClick={() => setMenu((v) => !v)}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm">
                {user?.name?.[0] || "A"}
              </div>
            </button>
            {menu && (
              <div className="card absolute right-0 mt-2 w-56 p-2">
                <div className="px-3 py-2 text-sm">
                  <div>{user?.name}</div>
                  <div className="text-xs text-[var(--muted)]">{user?.email}</div>
                </div>
                <button
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-white/5"
                  onClick={() => updateMe({ theme: user?.theme === "light" ? "dark" : "light" })}
                >
                  {user?.theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                  Toggle theme
                </button>
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-white/5" onClick={() => navigate("/settings")}>
                  <Settings size={16} /> Settings
                </button>
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-white/5" onClick={() => logout().then(() => navigate("/login"))}>
                  <X size={16} /> Log out
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-8">
          <Outlet />
        </main>
      </div>
      <Modal open={quickAdd} title="Quick add" onClose={() => setQuickAdd(false)}>
        <QuickAdd onDone={() => setQuickAdd(false)} />
      </Modal>
    </div>
  );
}
