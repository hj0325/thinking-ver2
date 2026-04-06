"use client";

import { Handle, Position } from "reactflow";
import { getTypeMeta, normalizeNodeCategory } from "@/lib/thinkingMachine/nodeMeta";

const HANDLE_STYLE = {
  top: 38,
  width: 1,
  height: 1,
  border: "none",
  background: "transparent",
  opacity: 0,
  pointerEvents: "none",
};

function getPortColor(category) {
  return getTypeMeta(normalizeNodeCategory(category)).color;
}

function AnchorPort({ side, color }) {
  const sideClass = side === "left" ? "left-[-5px]" : "right-[-5px]";

  return (
    <span
      className={`pointer-events-none absolute ${sideClass} top-[31px] z-[40] flex h-[14px] w-[14px] items-center justify-center rounded-full border border-white/55 bg-white/82 shadow-[0_4px_12px_rgba(15,23,42,0.08)] backdrop-blur-sm`}
      aria-hidden
    >
      <span
        className="absolute h-[8px] w-[8px] rounded-full opacity-30"
        style={{ backgroundColor: color }}
      />
      <span
        className="relative h-[3px] w-[3px] rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 0 1px ${color}22` }}
      />
    </span>
  );
}

export default function ThinkingNode({ data }) {
  const portColor = getPortColor(data?.category);
  const hasLeftPort = Boolean(data?.hasLeftPort);
  const hasRightPort = Boolean(data?.hasRightPort);

  return (
    <div className="relative h-full w-full">
      {data?.label}
      {hasLeftPort ? <AnchorPort side="left" color={portColor} /> : null}
      {hasRightPort ? <AnchorPort side="right" color={portColor} /> : null}
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
