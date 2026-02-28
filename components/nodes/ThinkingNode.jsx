"use client";

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

export default function ThinkingNode({ data }) {
  return (
    <div className="relative h-full w-full">
      {data?.label}
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
