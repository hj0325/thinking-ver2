const CHIP_BG_COLORS = {
  When: "#9DBCFF",
  Where: "#E6E8B4",
  How: "#8FE5EA",
  What: "#97E9C0",
  Why: "#D2EEA1",
  Who: "#A999F1",
  Problem: "#EFAEA8",
  Solution: "#E8A0E6",
};

export function extractNodeImageUrl(rawData) {
  const candidates = [
    rawData?.image_url,
    rawData?.imageUrl,
    rawData?.image,
    rawData?.image_src,
    rawData?.imageSrc,
  ];
  return candidates.find((v) => typeof v === "string" && v.trim().length > 0) || null;
}

function Chip({ label }) {
  const backgroundColor = CHIP_BG_COLORS[label] || "#E5E7EB";
  return (
    <span
      className="inline-flex items-center justify-center gap-1 rounded-[99px] px-2 py-1.5 text-[12px] font-semibold leading-none text-[#111111]"
      style={{ backgroundColor }}
    >
      {label}
    </span>
  );
}

// 노드 데이터에서 JSX label 빌드 (재사용)
export function buildNodeLabel(nodeData) {
  return (
    <div className="flex h-full w-full flex-col items-start gap-3 px-4 pb-3 pt-4 text-left">
      <div className="font-heading line-clamp-2 text-[15px] font-bold leading-[1.2] text-[#4A4A4A]">
        {nodeData.title}
      </div>
      <div className="font-node-body line-clamp-3 text-[12px] leading-[1.4] text-[#666666]">
        {nodeData.content}
      </div>
      {nodeData.imageUrl && (
        <div className="h-[136px] w-full overflow-hidden rounded-[30px] bg-[#F3F4F6]">
          <img
            src={nodeData.imageUrl}
            alt={`${nodeData.title || "Node"} visual`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Chip label={nodeData.category} />
        <Chip label={nodeData.phase} />
      </div>
    </div>
  );
}

export function buildNodeStyle() {
  return {
    background: "#FFFFFF",
    border: "none",
    borderRadius: "30px",
    padding: "0",
    width: 232,
    display: "flex",
    flexDirection: "column",
    overflow: "visible",
    boxShadow: "0 8px 24px -12px rgb(0 0 0 / 0.22)",
    zIndex: 20,
  };
}

export function toReactFlowNode(n, highlightedId) {
  const nodeData = {
    title: n.data.label,
    content: n.data.content,
    phase: n.data.phase,
    category: n.data.category,
    imageUrl: extractNodeImageUrl(n.data),
    is_ai_suggestion: false,
  };
  const rfNode = {
    id: n.id,
    type: "thinkingNode",
    position: n.position,
    className: n.id === highlightedId ? "node-highlighted" : "",
    data: { ...nodeData },
    style: buildNodeStyle(),
  };
  // ReactFlow node renderer expects `data.label` to be renderable content (JSX).
  // Keep the raw text in `data.content` for AI + exports.
  rfNode.data.label = buildNodeLabel(nodeData);
  return rfNode;
}

