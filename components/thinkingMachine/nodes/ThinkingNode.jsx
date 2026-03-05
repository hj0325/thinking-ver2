"use client";

import { Handle, Position } from "reactflow";

const CATEGORY_COLORS = {
  When: "#9DBCFF",
  Where: "#E6E8B4",
  How: "#8FE5EA",
  What: "#97E9C0",
  Why: "#D2EEA1",
  Who: "#A999F1",
  Problem: "#EFAEA8",
  Solution: "#E8A0E6",
};

const HANDLE_STYLE = {
  top: 52,
  width: 1,
  height: 1,
  border: "none",
  background: "transparent",
  opacity: 0,
  pointerEvents: "none",
};

function getPortColor(category) {
  return CATEGORY_COLORS[category] || "#E5E7EB";
}

export default function ThinkingNode({ data }) {
  const portColor = getPortColor(data?.category);
  const hasLeftPort = Boolean(data?.hasLeftPort);
  const hasRightPort = Boolean(data?.hasRightPort);

  return (
    <div className="relative h-full w-full">
      {data?.label}
      {hasLeftPort && (
        <span
          className="pointer-events-none absolute left-[-10px] top-[42px] z-[40] h-5 w-5 rounded-full bg-white"
          aria-hidden
        >
          <span
            className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ backgroundColor: portColor }}
          />
        </span>
      )}
      {hasRightPort && (
        <span
          className="pointer-events-none absolute right-[-10px] top-[42px] z-[40] h-5 w-5 rounded-full bg-white"
          aria-hidden
        >
          <span
            className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ backgroundColor: portColor }}
          />
        </span>
      )}
      <Handle
        id="right-source"
        type="source"
        position={Position.Right}
        style={{ ...HANDLE_STYLE }}
        isConnectable={false}
      />
      <Handle
        id="left-target"
        type="target"
        position={Position.Left}
        style={{ ...HANDLE_STYLE }}
        isConnectable={false}
      />
    </div>
  );
}
