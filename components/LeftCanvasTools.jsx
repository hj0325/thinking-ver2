"use client";

import { Image as ImageIcon, StickyNote } from "lucide-react";

export default function LeftCanvasTools({ onAddPostit, onAddImage }) {
  return (
    <div className="pointer-events-none absolute left-6 top-1/2 z-[70] -translate-y-1/2">
      <div className="pointer-events-auto rounded-[22px] bg-white/30 p-2 shadow-[0_18px_45px_rgba(0,0,0,0.12)] backdrop-blur-[14px]">
        <div className="flex flex-col gap-3 rounded-[18px] bg-white/25 px-2 py-3">
          <button
            type="button"
            onClick={onAddPostit}
            className="group inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-400/55 text-white shadow-[0_8px_18px_rgba(0,0,0,0.18)] transition-all hover:bg-slate-400/70 hover:shadow-[0_12px_26px_rgba(0,0,0,0.18)] hover:scale-[1.05] active:scale-[0.97]"
            aria-label="Create a post-it draft"
            title="Post-it"
          >
            <StickyNote className="h-6 w-6 opacity-90 transition-opacity group-hover:opacity-100" />
          </button>
          <button
            type="button"
            onClick={onAddImage}
            className="group inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-400/55 text-white shadow-[0_8px_18px_rgba(0,0,0,0.18)] transition-all hover:bg-slate-400/70 hover:shadow-[0_12px_26px_rgba(0,0,0,0.18)] hover:scale-[1.05] active:scale-[0.97]"
            aria-label="Create an image draft"
            title="Image"
          >
            <ImageIcon className="h-6 w-6 opacity-90 transition-opacity group-hover:opacity-100" />
          </button>
        </div>
      </div>
    </div>
  );
}

