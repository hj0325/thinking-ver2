import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/router";

const LOGIN_STORAGE_KEY = "isLoggedIn";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = typeof window !== "undefined" && window.localStorage.getItem(LOGIN_STORAGE_KEY) === "true";
    startTransition(() => {
      setIsLoggedIn(loggedIn);
      setIsCheckingAuth(false);
    });

    if (loggedIn) {
      void router.replace("/projects");
    }
  }, [router]);

  const handleLogin = (event) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) return;

    window.localStorage.setItem(LOGIN_STORAGE_KEY, "true");
    setIsLoggedIn(true);
    void router.push("/projects");
  };

  const handleLogout = () => {
    window.localStorage.removeItem(LOGIN_STORAGE_KEY);
    setIsLoggedIn(false);
    setEmail("");
    setPassword("");
  };

  if (isCheckingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300 backdrop-blur">
          Checking session...
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#1e293b,_#020617_58%)] px-6">
      <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/10 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="mb-6">
          <div className="text-[12px] font-semibold uppercase tracking-[0.28em] text-sky-200/80">
            Thinking Machine
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white">
            Log in
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Sign in to continue to your projects workspace.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
          >
            Log in
          </button>
        </form>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
        >
          Log out
        </button>

        {isLoggedIn ? (
          <p className="mt-4 text-center text-xs text-emerald-300">
            Logged in. Redirecting to /projects...
          </p>
        ) : null}
      </div>
    </main>
  );
}
