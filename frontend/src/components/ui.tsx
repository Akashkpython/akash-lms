import {
  useEffect,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { X } from "lucide-react";
import { cn } from "../lib/cn";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "outline" }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        variant === "primary" &&
          "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white shadow-md shadow-indigo-500/25 active:scale-[0.98]",
        variant === "ghost" && "text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/[0.07]",
        variant === "outline" &&
          "border border-[var(--line)] bg-white/[0.03] hover:bg-white/[0.08] hover:border-[var(--line-strong)] text-[var(--text)] active:scale-[0.98]",
        variant === "danger" &&
          "bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 active:scale-[0.98]",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-[var(--line)] bg-[var(--bg-elev)]/70 px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)]/60 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-[var(--line)] bg-[var(--bg-elev)]/70 px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)]/60 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-xl border border-[var(--line)] bg-[var(--bg-elev)]/70 px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("card p-5 md:p-6", className)}>{children}</div>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--text)]">{title}</h1>
        {subtitle ? <p className="mt-1.5 text-sm text-[var(--muted)]">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2.5">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--line)] bg-gradient-to-br from-indigo-500/10 to-transparent">
        <div className="h-6 w-6 rounded-lg bg-[var(--accent)]/20" />
      </div>
      <h3 className="text-lg font-medium text-[var(--text)]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-[var(--muted)]">{text}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton h-28 rounded-2xl", className)} />;
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="card relative z-10 max-h-[90vh] w-full max-w-lg overflow-auto border-white/[0.12] bg-[#0c1220]/95 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="mb-5 flex items-center justify-between border-b border-[var(--line)] pb-4">
          <h2 className="text-lg font-semibold tracking-tight text-[var(--text)]">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--muted)] hover:bg-white/10 hover:text-[var(--text)] transition"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel = "Delete",
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  text: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-sm text-[var(--muted)] leading-relaxed">{text}</p>
      <div className="mt-6 flex justify-end gap-2.5">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "ok" | "warn" | "bad" | "info";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        tone === "default" && "bg-white/[0.06] border border-white/[0.08] text-[var(--muted)]",
        tone === "ok" && "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400",
        tone === "warn" && "bg-amber-500/10 border border-amber-500/25 text-amber-300",
        tone === "bad" && "bg-rose-500/10 border border-rose-500/25 text-rose-400",
        tone === "info" && "bg-indigo-500/10 border border-indigo-500/25 text-indigo-300",
      )}
    >
      {children}
    </span>
  );
}
