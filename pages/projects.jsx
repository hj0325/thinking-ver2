import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

const LOGIN_STORAGE_KEY = "isLoggedIn";
const PROJECTS_STORAGE_KEY = "thinking-machine-projects";

function readProjects() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeProjects(projects) {
  window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

function formatDate(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function createProject() {
  const timestamp = new Date().toISOString();
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `project-${Date.now()}`;

  return {
    id,
    title: "Untitled Project",
    updatedAt: timestamp,
  };
}

export default function ProjectsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const isLoggedIn = typeof window !== "undefined" && window.localStorage.getItem(LOGIN_STORAGE_KEY) === "true";

    if (!isLoggedIn) {
      void router.replace("/");
      return;
    }

    startTransition(() => {
      setProjects(readProjects());
      setIsLoading(false);
    });
  }, [router]);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const aTime = new Date(a?.updatedAt || 0).getTime();
      const bTime = new Date(b?.updatedAt || 0).getTime();
      return bTime - aTime;
    });
  }, [projects]);

  const handleCreateProject = () => {
    const nextProject = createProject();
    const nextProjects = [nextProject, ...projects];
    setProjects(nextProjects);
    writeProjects(nextProjects);
    void router.push(`/projects/${nextProject.id}`);
  };

  const handleOpenProject = (projectId) => {
    void router.push(`/projects/${projectId}`);
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300 backdrop-blur">
          Loading projects...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e293b,_#020617_58%)] px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.28em] text-sky-200/80">
              Thinking Machine
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em]">Projects</h1>
            <p className="mt-2 text-sm text-slate-300">
              Open an existing project or create a new one to continue.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateProject}
            className="rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
          >
            Create New Project
          </button>
        </div>

        {sortedProjects.length === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-white/8 px-8 py-14 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="text-lg font-semibold text-white">No projects yet</div>
            <p className="mt-2 text-sm text-slate-300">
              Start your first project and we&apos;ll take you straight into it.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sortedProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => handleOpenProject(project.id)}
                className="rounded-[28px] border border-white/10 bg-white/8 p-5 text-left shadow-[0_24px_80px_rgba(0,0,0,0.22)] transition hover:bg-white/12 hover:-translate-y-0.5"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-200/70">
                  Project
                </div>
                <div className="mt-3 line-clamp-2 text-xl font-semibold tracking-[-0.03em] text-white">
                  {project.title || "Untitled Project"}
                </div>
                <div className="mt-6 text-xs text-slate-300">
                  Updated {formatDate(project.updatedAt)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
