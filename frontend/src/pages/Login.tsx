import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
      <div className="hidden flex-col justify-between border-r border-[var(--line)] bg-[var(--bg-elev)] p-12 lg:flex">
        <div className="text-sm tracking-[0.3em] text-[var(--muted)]">AKASH LMS</div>
        <div>
          <h1 className="max-w-md text-4xl font-medium leading-tight">A private academic workspace, built for laboratory PCs and home.</h1>
          <p className="mt-4 max-w-md text-[var(--muted)]">
            Upload study materials from home, then open them from college with a secure login. Notes, assignments, snippets and exam prep stay on your account only.
          </p>
        </div>
        <div className="text-sm text-[var(--muted)]">Private personal LMS · Dark SaaS dashboard</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <form
          className="card w-full max-w-md p-8"
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
          <h2 className="text-2xl">{setupRequired ? "Create your administrator account" : "Welcome back"}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {setupRequired
              ? "This is a one-time setup. Public registration stays disabled after this account is created."
              : "Sign in with your private Akash LMS credentials."}
          </p>
          <div className="mt-6 space-y-3">
            {setupRequired && (
              <div>
                <Input placeholder="Your name" {...form.register("name")} />
                {form.formState.errors.name && <p className="mt-1 text-xs text-[var(--danger)]">{form.formState.errors.name.message}</p>}
              </div>
            )}
            <div>
              <Input type="email" placeholder="Email" {...form.register("email")} />
              {form.formState.errors.email && <p className="mt-1 text-xs text-[var(--danger)]">{form.formState.errors.email.message}</p>}
            </div>
            <div>
              <Input
                type="password"
                placeholder={setupRequired ? "Password (min 10 characters)" : "Password"}
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="mt-1 text-xs text-[var(--danger)]">{form.formState.errors.password.message}</p>
              )}
            </div>
          </div>
          <Button className="mt-6 w-full" disabled={form.formState.isSubmitting} type="submit">
            {form.formState.isSubmitting ? "Please wait…" : setupRequired ? "Create workspace" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
