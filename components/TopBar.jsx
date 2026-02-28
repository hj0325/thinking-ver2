"use client";

import Link from "next/link";
import { Home } from "lucide-react";

export default function TopBar() {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-[60] px-9 py-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-start">
        <div className="justify-self-start">
          <Link
            href="/"
            className="pointer-events-auto inline-flex items-center gap-2 text-[15px] font-medium text-slate-700 transition hover:text-slate-900"
            aria-label="Go to Home"
          >
            <Home size={15} strokeWidth={2.4} aria-hidden />
            <span>Home</span>
          </Link>
        </div>

        <div className="justify-self-center font-heading text-[15px] font-medium text-slate-700">
          Visual Thinking Machine
        </div>

        <div className="justify-self-end" aria-hidden>
          <span className="inline-block h-5 w-20" />
        </div>
      </div>
    </header>
  );
}
