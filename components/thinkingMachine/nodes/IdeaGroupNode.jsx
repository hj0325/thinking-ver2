"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { Handle, Position } from "reactflow";

const HANDLE_STYLE = {
  top: 52,
  width: 1,
  height: 1,
  border: "none",
  background: "transparent",
  opacity: 0,
  pointerEvents: "none",
};

export default function IdeaGroupNode({ id, data, selected }) {
  const mode = data?.mode === "raw" ? "raw" : "nodes";
  const title = typeof data?.title === "string" && data.title.trim() ? data.title : "Idea bundle";
  const onToggle = data?.onToggle;

  const isRaw = mode === "raw";

  return (
    <div
      className={`relative h-full w-full rounded-[34px] border ${
        selected ? "border-teal-300/70 ring-2 ring-teal-200/60" : "border-white/40"
      } bg-white/10 shadow-[0_18px_50px_rgba(0,0,0,0.12)]`}
    >
      <div className="absolute left-4 top-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onToggle?.(id)}
          className="inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/55 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-white/70 active:scale-[0.99]"
          aria-label="Toggle raw ideas view"
          title="Toggle raw ideas"
        >
          {isRaw ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          {isRaw ? "Raw ideas" : "Nodes"}
        </button>
        <span className="text-[11px] font-semibold text-slate-700/80">{title}</span>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-[34px] ring-0 ring-teal-300/25 transition" />

      {/* Invisible handles so connector edges can anchor to groups */}
      <Handle id="right-source" type="source" position={Position.Right} style={{ ...HANDLE_STYLE }} isConnectable={false} />
      <Handle id="left-target" type="target" position={Position.Left} style={{ ...HANDLE_STYLE }} isConnectable={false} />
    </div>
  );
}

