import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { GraduationCap, ShieldCheck, Cloud, Cpu, ArrowRight } from "lucide-react";
import { Button, Input } from "../components/ui";
import { useAuth } from "../store/auth";

const loginSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { setupRequired, login, setup, user } = useAuth();
  const navigate = useNavigate();
  const form = useForm<LoginValues>({
    resolver: zodResolver(
      setupRequired
        ? loginSchema.extend({
            name: z.string().min(2, "Name is required"),
            password: z.string().min(10, "Use at least 10 characters"),
          })
        : loginSchema,
    ),
    defaultValues: { name: "Akash", email: "", password: "" },
  });

  useEffect(() => {
    if (user && !setupRequired) navigate("/");
  }, [user, setupRequired, navigate]);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left Feature Showcase */}
      <div className="relative hidden flex-col justify-between border-r border-[var(--line)] bg-[#070b14] p-12 lg:flex overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25">
            <GraduationCap size={22} />
          </div>
          <div>
            <div className="text-sm font-bold tracking-widest text-[var(--text)]">AKASH LMS</div>
            <div className="text-[11px] text-[var(--muted)]">Personal MCA Cloud Environment</div>
          </div>
        </div>

        <div className="relative z-10 my-auto py-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 mb-6">
            <span>🎓 Academic Cloud Platform</span>
          </div>
          <h1 className="max-w-md text-4xl xl:text-5xl font-bold tracking-tight text-[var(--text)] leading-[1.15]">
            A private workspace built for laboratory PCs and home.
          </h1>
          <p className="mt-5 max-w-md text-sm md:text-base text-[var(--muted)] leading-relaxed">
            Upload study materials from home, then access them securely from any college browser. Notes, assignments, code snippets, and exam preparation stay strictly private.
          </p>

          {/* Feature Badges */}
          <div className="mt-8 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-[var(--text)]">
              <Cloud size={14} className="text-cyan-400" />
              <span>Cloudflare R2 Object Storage</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-[var(--text)]">
              <Cpu size={14} className="text-indigo-400" />
              <span>MongoDB Atlas Powered</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-[var(--text)]">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Single-Admin Privacy</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-[var(--muted)] border-t border-[var(--line)] pt-6">
          <span>Private personal LMS</span>
          <span>SaaS Edition</span>
        </div>
      </div>

      {/* Right Login / Setup Form */}
      <div className="relative flex items-center justify-center p-6 md:p-12 bg-[var(--bg)]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <form
          className="card relative z-10 w-full max-w-md p-8 md:p-10 border-white/[0.12] bg-[#0c1220]/90 backdrop-blur-2xl shadow-2xl"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              if (setupRequired) await setup(values.name || "Akash", values.email, values.password);
              else await login(values.email, values.password);
              navigate("/");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Authentication failed");
            }
          })}
        >
          {/* Mobile brand header */}
          <div className="flex items-center gap-2.5 mb-6 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/25">
              <GraduationCap size={18} />
            </div>
            <span className="font-bold tracking-wider text-sm text-[var(--text)]">AKASH LMS</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            {setupRequired ? "Create administrator account" : "Welcome back"}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            {setupRequired
              ? "This is a one-time setup. Public registration stays permanently disabled after this account is created."
              : "Sign in with your private Akash LMS credentials."}
          </p>

          <div className="mt-6 space-y-4">
            {setupRequired && (
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Full Name</label>
                <Input placeholder="Akash" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="mt-1.5 text-xs text-[var(--danger)]">{form.formState.errors.name.message}</p>
                )}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Email address</label>
              <Input type="email" placeholder="you@domain.com" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="mt-1.5 text-xs text-[var(--danger)]">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Password</label>
              <Input
                type="password"
                placeholder={setupRequired ? "Minimum 10 characters" : "••••••••••••"}
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="mt-1.5 text-xs text-[var(--danger)]">{form.formState.errors.password.message}</p>
              )}
            </div>
          </div>

          <Button className="mt-6 w-full py-2.5 text-sm" disabled={form.formState.isSubmitting} type="submit">
            <span>{form.formState.isSubmitting ? "Please wait…" : setupRequired ? "Create workspace" : "Sign in"}</span>
            {!form.formState.isSubmitting && <ArrowRight size={16} />}
          </Button>
        </form>
      </div>
    </div>
  );
}
