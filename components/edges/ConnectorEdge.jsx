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

function manhattanLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Math.abs(points[i].x - points[i - 1].x) + Math.abs(points[i].y - points[i - 1].y);
  }
  return total;
}

function countBends(points) {
  return Math.max(0, points.length - 2);
}

function scorePath(points, { isForward, startX, endX, sourceY, targetY }) {
  const pts = compressPoints(points);
  if (pts.length < 2) return Number.POSITIVE_INFINITY;

  const length = manhattanLength(pts);
  const bends = countBends(pts);
  let horizontalBacktrackPenalty = 0;
  let sideAttachPenalty = 0;
  let directionFlipPenalty = 0;
  let previousHorizontalSign = 0;

  for (let i = 1; i < pts.length; i += 1) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    if (dy !== 0 || dx === 0) continue;

    const sign = Math.sign(dx);
    if (isForward && sign < 0) {
      horizontalBacktrackPenalty += Math.abs(dx) * 10 + 500;
    }
    if (previousHorizontalSign !== 0 && sign !== previousHorizontalSign) {
      directionFlipPenalty += 120;
    }
    previousHorizontalSign = sign;
  }

  const firstDx = pts[1].x - pts[0].x;
  if (firstDx < 0) {
    sideAttachPenalty += Math.abs(firstDx) * 12 + 800;
  }

  const lastDx = pts[pts.length - 1].x - pts[pts.length - 2].x;
  if (lastDx < 0) {
    sideAttachPenalty += Math.abs(lastDx) * 12 + 800;
  }

  const yValues = pts.map((p) => p.y);
  const ySpan = Math.max(...yValues) - Math.min(...yValues);
  const baselineYSpan = Math.abs(targetY - sourceY);
  const detourPenalty = Math.max(0, ySpan - baselineYSpan) * 2;

  const endGapPenalty = Math.abs(pts[0].x - startX) + Math.abs(pts[pts.length - 1].x - endX);

  return (
    length +
    bends * 72 +
    detourPenalty +
    horizontalBacktrackPenalty +
    sideAttachPenalty +
    directionFlipPenalty +
    endGapPenalty
  );
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
  const isForward = pathEndX >= pathStartX;
  const laneTopY = Math.min(sourceY, targetY) - laneGap;
  const laneBottomY = Math.max(sourceY, targetY) + laneGap;
  const candidates = [];

  const startPoint = { x: pathStartX, y: sourceY };
  const endPoint = { x: pathEndX, y: targetY };

  if (isForward) {
    const midX = (pathStartX + pathEndX) / 2;
    candidates.push([
      startPoint,
      { x: midX, y: sourceY },
      { x: midX, y: targetY },
      endPoint,
    ]);
  }

  if (isForward && endStubX >= startStubX) {
    candidates.push([
      startPoint,
      { x: startStubX, y: sourceY },
      { x: startStubX, y: targetY },
      { x: endStubX, y: targetY },
      endPoint,
    ]);
  }

  candidates.push([
    startPoint,
    { x: startStubX, y: sourceY },
    { x: startStubX, y: laneTopY },
    { x: endStubX, y: laneTopY },
    { x: endStubX, y: targetY },
    endPoint,
  ]);

  candidates.push([
    startPoint,
    { x: startStubX, y: sourceY },
    { x: startStubX, y: laneBottomY },
    { x: endStubX, y: laneBottomY },
    { x: endStubX, y: targetY },
    endPoint,
  ]);

  let best = candidates[0];
  let bestScore = scorePath(best, {
    isForward,
    startX: pathStartX,
    endX: pathEndX,
    sourceY,
    targetY,
  });

  for (let i = 1; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    const score = scorePath(candidate, {
      isForward,
      startX: pathStartX,
      endX: pathEndX,
      sourceY,
      targetY,
    });
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
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
