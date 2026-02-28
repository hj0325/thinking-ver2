"use client";

import { BaseEdge } from "reactflow";

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

const DEFAULT_PORT_COLOR = "#E5E7EB";
const DEFAULT_LINE_COLOR = "#FFFFFF";
const DEFAULT_LINE_WIDTH = 4;
const DEFAULT_CLEARANCE = 20;
const OUTER_RADIUS = 10;
const INNER_RADIUS = 6;
const MIN_CLEARANCE = 8;

function pickColor(label) {
  return CATEGORY_COLORS[label] || DEFAULT_PORT_COLOR;
}

function toFiniteNumber(value, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function buildConnectorPath(sourceX, sourceY, targetX, targetY, clearance) {
  const pathStartX = sourceX + OUTER_RADIUS;
  const pathEndX = targetX - OUTER_RADIUS;
  const span = Math.max(pathEndX - pathStartX, 0);
  const effectiveClearance = Math.max(
    MIN_CLEARANCE,
    Math.min(clearance, span > 0 ? span / 3 : clearance)
  );
  const c1x = pathStartX + effectiveClearance;
  const c2x = pathEndX - effectiveClearance;
  return `M ${pathStartX} ${sourceY} C ${c1x} ${sourceY}, ${c2x} ${targetY}, ${pathEndX} ${targetY}`;
}

export default function ConnectorEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}) {
  const sourceOffsetY = toFiniteNumber(data?.sourceOffsetY, 0);
  const targetOffsetY = toFiniteNumber(data?.targetOffsetY, 0);
  const clearanceX = toFiniteNumber(data?.clearanceX, DEFAULT_CLEARANCE);
  const lineColor = data?.lineColor || DEFAULT_LINE_COLOR;
  const lineWidth = toFiniteNumber(data?.lineWidth, DEFAULT_LINE_WIDTH);

  const sourcePortColor = pickColor(data?.sourceCategory);
  const targetPortColor = pickColor(data?.targetCategory);

  const sy = sourceY + sourceOffsetY;
  const ty = targetY + targetOffsetY;
  const path = buildConnectorPath(sourceX, sy, targetX, ty, clearanceX);

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: lineColor,
          strokeWidth: lineWidth,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          filter: "drop-shadow(0 0 1px rgba(0, 0, 0, 0.18))",
        }}
      />
      <circle cx={sourceX} cy={sy} r={OUTER_RADIUS} fill="#FFFFFF" />
      <circle cx={sourceX} cy={sy} r={INNER_RADIUS} fill={sourcePortColor} />
      <circle cx={targetX} cy={ty} r={OUTER_RADIUS} fill="#FFFFFF" />
      <circle cx={targetX} cy={ty} r={INNER_RADIUS} fill={targetPortColor} />
    </>
  );
}
