export function computeNodeBounds(nodeList) {
  const list = Array.isArray(nodeList) ? nodeList : [];
  if (list.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  list.forEach((n) => {
    const x = n?.position?.x ?? 0;
    const y = n?.position?.y ?? 0;
    const w = n?.style?.width ?? 240;
    const h = n?.style?.height ?? 180;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  });
  return { minX, minY, maxX, maxY };
}

export function shiftClusterRightOfExisting(existingNodes, incomingNodes) {
  const existingBounds = computeNodeBounds(existingNodes);
  const incomingBounds = computeNodeBounds(incomingNodes);
  if (!incomingBounds) return incomingNodes;
  if (!existingBounds) return incomingNodes;

  const desiredMinX = existingBounds.maxX + 320;
  const deltaX = desiredMinX - incomingBounds.minX;
  if (!Number.isFinite(deltaX) || deltaX <= 0) return incomingNodes;

  return incomingNodes.map((n) => ({
    ...n,
    position: { x: (n.position?.x ?? 0) + deltaX, y: n.position?.y ?? 0 },
  }));
}

