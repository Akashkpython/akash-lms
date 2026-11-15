import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppShell } from "./components/layout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoginPage } from "./pages/Login";
import { useAuth } from "./store/auth";

const DashboardPage = lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.DashboardPage })));
const MaterialsPage = lazy(() => import("./pages/Materials").then((m) => ({ default: m.MaterialsPage })));
const NotesPage = lazy(() => import("./pages/Notes").then((m) => ({ default: m.NotesPage })));
const AssignmentsPage = lazy(() => import("./pages/Assignments").then((m) => ({ default: m.AssignmentsPage })));
const TimetablePage = lazy(() => import("./pages/Timetable").then((m) => ({ default: m.TimetablePage })));
const WebsitesPage = lazy(() => import("./pages/Collections").then((m) => ({ default: m.WebsitesPage })));
const SnippetsPage = lazy(() => import("./pages/Collections").then((m) => ({ default: m.SnippetsPage })));
const SqlPage = lazy(() => import("./pages/Collections").then((m) => ({ default: m.SqlPage })));
const CommandsPage = lazy(() => import("./pages/Collections").then((m) => ({ default: m.CommandsPage })));
const ExamPage = lazy(() => import("./pages/Collections").then((m) => ({ default: m.ExamPage })));
const FavoritesPage = lazy(() => import("./pages/Personal").then((m) => ({ default: m.FavoritesPage })));
const RecentPage = lazy(() => import("./pages/Personal").then((m) => ({ default: m.RecentPage })));
const RecycleBinPage = lazy(() => import("./pages/Personal").then((m) => ({ default: m.RecycleBinPage })));
const SettingsPage = lazy(() => import("./pages/Personal").then((m) => ({ default: m.SettingsPage })));

const client = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Fallback() {
  return <div className="grid min-h-[40vh] place-items-center text-[var(--muted)]">Loading…</div>;
}

function Gate({ children }: { children: ReactNode }) {
  const { ready, user, setupRequired } = useAuth();
  if (!ready) return <Fallback />;
  if (!user || setupRequired) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const base = import.meta.env.BASE_URL;
  const hydrate = useAuth((state) => state.hydrate);
  const ready = useAuth((state) => state.ready);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  if (!ready) {
    return <div className="grid min-h-screen place-items-center text-[var(--muted)]">Loading workspace…</div>;
  }
  return (
    <ErrorBoundary>
      <QueryClientProvider client={client}>
        <BrowserRouter basename={base === "/" ? undefined : base.replace(/\/$/, "")}>
          <Toaster theme="dark" position="top-right" />
          <Suspense fallback={<Fallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <Gate>
                    <AppShell />
                  </Gate>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="materials" element={<MaterialsPage />} />
                <Route path="websites" element={<WebsitesPage />} />
                <Route path="notes" element={<NotesPage />} />
                <Route path="assignments" element={<AssignmentsPage />} />
                <Route path="snippets" element={<SnippetsPage />} />
                <Route path="sql" element={<SqlPage />} />
                <Route path="commands" element={<CommandsPage />} />
                <Route path="exam" element={<ExamPage />} />
                <Route path="timetable" element={<TimetablePage />} />
                <Route path="favorites" element={<FavoritesPage />} />
                <Route path="recent" element={<RecentPage />} />
                <Route path="recycle-bin" element={<RecycleBinPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
