"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type FrontendLoginResponse = {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: "super_admin" | "user";
  };
  redirectTo: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string; errors?: unknown }
          | null;
        throw new Error(payload?.message ?? `Login failed (${response.status})`);
      }

      const payload = (await response.json()) as FrontendLoginResponse;

      router.push(payload.redirectTo);
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Unable to login";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 text-center md:mb-12">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">IP Management</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Dashboard Login
          </h1>
          <p className="mt-3 text-sm text-slate-300 md:text-base">
            Sign in to access audit logs and operational activity.
          </p>
        </header>

        <section className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-slate-100 outline-none transition focus:border-cyan-400"
                placeholder="admin@gmail.com"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-slate-100 outline-none transition focus:border-cyan-400"
                placeholder="Enter your password"
              />
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-cyan-400 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {error ? (
            <p className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
