import { useEffect, useMemo, useRef, useState } from "react";
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
  ChevronRight,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api, type ItemResponse } from "../lib/api";
import { useAuth } from "../store/auth";
import { Button, Modal } from "./ui";
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user, logout, updateMe } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const search = useQuery({
    queryKey: ["search", query],
    enabled: query.trim().length > 1,
    queryFn: () =>
      api<ItemResponse<{ type: string; id: string; title: string }[]>>(
        `/api/search?q=${encodeURIComponent(query)}`,
      ),
  });

  // Ctrl + K shortcut for search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
        "flex h-full flex-col border-r border-[var(--line)] bg-[var(--bg-elev)]/90 backdrop-blur-xl transition-all duration-300 select-none",
        collapsed ? "w-[76px]" : "w-[270px]",
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--line)]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25">
          <GraduationCap size={20} />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wider text-[var(--text)]">AKASH LMS</span>
              <span className="rounded-md bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-400">
                MCA
              </span>
            </div>
            <div className="text-[11px] text-[var(--muted)] truncate">Personal Cloud Workspace</div>
          </div>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {NAV.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]/70">
                {group.label}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-gradient-to-r from-indigo-500/15 via-indigo-500/10 to-transparent text-indigo-400 border-l-2 border-indigo-500 shadow-sm"
                        : "text-[var(--muted)] hover:bg-white/[0.05] hover:text-[var(--text)]",
                      collapsed && "justify-center px-0",
                    )
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon
                    size={18}
                    className="shrink-0 transition-transform duration-150 group-hover:scale-110"
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Cloud Status Footer */}
      {!collapsed && (
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white/[0.02] px-3 py-2 text-xs text-[var(--muted)]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="truncate">Connected · MongoDB & R2</span>
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        className="hidden items-center justify-between border-t border-[var(--line)] px-4 py-3 text-xs font-medium text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/[0.03] transition md:flex"
        onClick={() => setCollapsed((value) => !value)}
      >
        <span className="flex items-center gap-2">
          <PanelLeft size={16} />
          {!collapsed && "Collapse sidebar"}
        </span>
      </button>
    </aside>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0">{sidebar}</div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 h-full">{sidebar}</div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[var(--line)] bg-[var(--bg)]/80 px-4 md:px-8 py-3.5 backdrop-blur-xl">
          <button
            className="rounded-xl border border-[var(--line)] p-2 hover:bg-white/[0.05] text-[var(--text)] md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={18} />
          </button>

          {/* Breadcrumbs */}
          <div className="hidden items-center gap-1.5 text-xs text-[var(--muted)] lg:flex">
            <span>{crumbs[0]}</span>
            {crumbs[1] && (
              <>
                <ChevronRight size={13} className="opacity-50" />
                <span className="font-medium text-[var(--text)]">{crumbs[1]}</span>
              </>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative mx-auto w-full max-w-lg">
            <Search className="pointer-events-none absolute left-3.5 top-3 text-[var(--muted)]" size={16} />
            <input
              ref={searchInputRef}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg-elev)]/80 pl-10 pr-16 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)]/60 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Search anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="pointer-events-none absolute right-3 top-2.5 hidden items-center gap-0.5 rounded border border-[var(--line)] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-[var(--muted)] sm:flex">
              <span>Ctrl</span>
              <span>K</span>
            </div>

            {/* Live Search Results */}
            {query.trim().length > 1 && (
              <div className="card absolute mt-2 w-full overflow-hidden border-white/[0.12] bg-[#0c1220]/95 p-2 shadow-2xl backdrop-blur-2xl">
                {search.isLoading && (
                  <div className="flex items-center gap-2 px-3 py-3 text-sm text-[var(--muted)]">
                    <Sparkles size={14} className="animate-spin text-indigo-400" /> Searching...
                  </div>
                )}
                {search.data?.data.length === 0 && (
                  <div className="px-3 py-3 text-sm text-[var(--muted)]">No matches found for "{query}"</div>
                )}
                {search.data?.data.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-white/[0.06] transition"
                    onClick={() => {
                      navigate(ROUTE_BY_TYPE[item.type] || "/");
                      setQuery("");
                    }}
                  >
                    <span className="truncate font-medium text-[var(--text)]">{item.title}</span>
                    <span className="shrink-0 rounded-md bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 text-[10px] uppercase text-[var(--muted)]">
                      {item.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Add Button */}
          <Button onClick={() => setQuickAdd(true)} className="shrink-0">
            <Plus size={16} />
            <span className="hidden sm:inline">Quick Add</span>
          </Button>

          {/* User Profile Avatar & Dropdown */}
          <div className="relative">
            <button
              className="flex items-center gap-2 rounded-xl border border-[var(--line)] p-1 hover:border-indigo-500/40 transition cursor-pointer"
              onClick={() => setMenu((v) => !v)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-indigo-600 text-xs font-bold text-white shadow-sm shadow-indigo-500/30">
                {user?.name?.[0]?.toUpperCase() || "A"}
              </div>
            </button>

            {menu && (
              <div className="card absolute right-0 mt-2 w-64 border-white/[0.12] bg-[#0c1220]/95 p-2 shadow-2xl backdrop-blur-2xl">
                <div className="border-b border-[var(--line)] px-3 py-2.5">
                  <div className="font-semibold text-sm text-[var(--text)] truncate">{user?.name}</div>
                  <div className="text-xs text-[var(--muted)] truncate">{user?.email}</div>
                </div>
                <div className="p-1 space-y-1">
                  <button
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-white/[0.06] hover:text-[var(--text)] transition cursor-pointer"
                    onClick={() => updateMe({ theme: user?.theme === "light" ? "dark" : "light" })}
                  >
                    {user?.theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                    Toggle {user?.theme === "light" ? "Dark" : "Light"} theme
                  </button>
                  <button
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-white/[0.06] hover:text-[var(--text)] transition cursor-pointer"
                    onClick={() => navigate("/settings")}
                  >
                    <Settings size={16} /> Settings
                  </button>
                  <div className="my-1 border-t border-[var(--line)]" />
                  <button
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                    onClick={() => logout().then(() => navigate("/login"))}
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Routed Content */}
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Quick Add Modal */}
      <Modal open={quickAdd} title="Quick Add Item" onClose={() => setQuickAdd(false)}>
        <QuickAdd onDone={() => setQuickAdd(false)} />
      </Modal>
    </div>
  );
}
