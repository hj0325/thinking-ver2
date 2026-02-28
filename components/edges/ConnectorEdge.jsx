"use client";

import { BaseEdge } from "reactflow";

const DEFAULT_LINE_COLOR = "#FFFFFF";
const DEFAULT_LINE_WIDTH = 4;
const DEFAULT_CLEARANCE = 20;
const OUTER_RADIUS = 10;
const MIN_CLEARANCE = 8;

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

  const sy = sourceY + sourceOffsetY;
  const ty = targetY + targetOffsetY;
  const path = buildConnectorPath(sourceX, sy, targetX, ty, clearanceX);

  return (
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
  );
}
