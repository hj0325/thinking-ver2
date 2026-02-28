"use client";

import { BaseEdge } from "reactflow";

const DEFAULT_LINE_COLOR = "#FFFFFF";
const DEFAULT_LINE_WIDTH = 4;
const DEFAULT_CLEARANCE = 20;
const OUTER_RADIUS = 10;
const MIN_CLEARANCE = 8;
const DEFAULT_CORNER_RADIUS = 24;
const DEFAULT_LANE_GAP = 80;

function toFiniteNumber(value, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function round(n) {
  return Number(n.toFixed(2));
}

function isSamePoint(a, b) {
  return a.x === b.x && a.y === b.y;
}

function compressPoints(points) {
  const compact = [];
  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    if (!compact.length || !isSamePoint(compact[compact.length - 1], p)) {
      compact.push(p);
    }
  }
  const out = [];
  for (let i = 0; i < compact.length; i += 1) {
    const prev = compact[i - 1];
    const curr = compact[i];
    const next = compact[i + 1];
    if (!prev || !next) {
      out.push(curr);
      continue;
    }
    const sameX = prev.x === curr.x && curr.x === next.x;
    const sameY = prev.y === curr.y && curr.y === next.y;
    if (!(sameX || sameY)) out.push(curr);
  }
  return out;
}

function buildRoundedOrthogonalPath(points, cornerRadius) {
  const pts = compressPoints(points);
  if (!pts.length) return "";
  if (pts.length === 1) return `M ${round(pts[0].x)} ${round(pts[0].y)}`;

  let d = `M ${round(pts[0].x)} ${round(pts[0].y)}`;
  for (let i = 1; i < pts.length; i += 1) {
    if (i === pts.length - 1) {
      d += ` L ${round(pts[i].x)} ${round(pts[i].y)}`;
      continue;
    }

    const prev = pts[i - 1];
    const curr = pts[i];
    const next = pts[i + 1];
    const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };
    const len1 = Math.hypot(v1.x, v1.y);
    const len2 = Math.hypot(v2.x, v2.y);

    if (len1 === 0 || len2 === 0) {
      d += ` L ${round(curr.x)} ${round(curr.y)}`;
      continue;
    }

    const r = Math.min(cornerRadius, len1 / 2, len2 / 2);
    if (r <= 0.1) {
      d += ` L ${round(curr.x)} ${round(curr.y)}`;
      continue;
    }

    const u1 = { x: v1.x / len1, y: v1.y / len1 };
    const u2 = { x: v2.x / len2, y: v2.y / len2 };
    const enter = { x: curr.x - u1.x * r, y: curr.y - u1.y * r };
    const exit = { x: curr.x + u2.x * r, y: curr.y + u2.y * r };
    const cross = v1.x * v2.y - v1.y * v2.x;
    const sweep = cross > 0 ? 1 : 0;

    d += ` L ${round(enter.x)} ${round(enter.y)}`;
    d += ` A ${round(r)} ${round(r)} 0 0 ${sweep} ${round(exit.x)} ${round(exit.y)}`;
  }
  return d;
}

function buildOrthogonalPoints(sourceX, sourceY, targetX, targetY, clearance, laneGap) {
  const pathStartX = sourceX + OUTER_RADIUS;
  const pathEndX = targetX - OUTER_RADIUS;
  const effectiveClearance = Math.max(MIN_CLEARANCE, clearance);
  const startStubX = pathStartX + effectiveClearance;
  const endStubX = pathEndX - effectiveClearance;
  const forwardEnough = pathEndX >= pathStartX && endStubX - startStubX >= effectiveClearance;

  if (forwardEnough) {
    return [
      { x: pathStartX, y: sourceY },
      { x: startStubX, y: sourceY },
      { x: startStubX, y: targetY },
      { x: endStubX, y: targetY },
      { x: pathEndX, y: targetY },
    ];
  }

  const laneY =
    targetY >= sourceY
      ? Math.min(sourceY, targetY) - laneGap
      : Math.max(sourceY, targetY) + laneGap;

  return [
    { x: pathStartX, y: sourceY },
    { x: startStubX, y: sourceY },
    { x: startStubX, y: laneY },
    { x: endStubX, y: laneY },
    { x: endStubX, y: targetY },
    { x: pathEndX, y: targetY },
  ];
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
  const cornerRadius = toFiniteNumber(data?.cornerRadius, DEFAULT_CORNER_RADIUS);
  const laneGap = toFiniteNumber(data?.laneGap, DEFAULT_LANE_GAP);
  const lineColor = data?.lineColor || DEFAULT_LINE_COLOR;
  const lineWidth = toFiniteNumber(data?.lineWidth, DEFAULT_LINE_WIDTH);

  const sy = sourceY + sourceOffsetY;
  const ty = targetY + targetOffsetY;
  const points = buildOrthogonalPoints(sourceX, sy, targetX, ty, clearanceX, laneGap);
  const path = buildRoundedOrthogonalPath(points, cornerRadius);

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
