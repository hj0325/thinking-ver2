"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    useNodesState,
    useEdgesState,
} from "reactflow";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import NodeMap from "./NodeMap";
import LeftCanvasTools from "./LeftCanvasTools";
import SuggestionPanel from "./SuggestionPanel";
import ChatDialog from "./ChatDialog";
import InputPanel from "./InputPanel";
import RightAgentDrawer from "./RightAgentDrawer";
import TopBar from "./TopBar";

const INITIAL_NODES = [];
const INITIAL_EDGES = [];
const SOURCE_HANDLE_ID = "right-source";
const TARGET_HANDLE_ID = "left-target";
const FANOUT_STEP = 26;
const FANOUT_MAX = 104;
const EDGE_CLEARANCE_X = 20;
const EDGE_LINE_WIDTH = 2;
const EDGE_LINE_COLOR = "#FFFFFF";
const EDGE_CORNER_RADIUS = 24;
const EDGE_LANE_GAP = 80;
const ADMIN_MODE_STORAGE_KEY = "vtm-admin-mode-enabled";
const ADMIN_HINT_DISMISSED_KEY = "vtm-admin-shortcut-hint-dismissed";
const ADMIN_SHORTCUT_LABEL = "Ctrl/Cmd + Shift + A";
const LEGACY_CHAT_QUERY_KEY = "legacyChat";
const POSTIT_DRAFT_SIZE = { w: 272, h: 240 };
const IMAGE_DRAFT_SIZE = { w: 272, h: 240 };
const GROUP_PADDING = 44;
const GROUP_TOP_PADDING = 56;
const GROUP_INNER_PAD_X = 28;
const GROUP_INNER_PAD_BOTTOM = 28;
const GROUP_DRAFT_GAP = 16;
const GROUP_DRAFT_MIN_SIZE = { w: 196, h: 176 };

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

function extractNodeImageUrl(rawData) {
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
function buildNodeLabel(nodeData) {
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

function buildNodeStyle() {
    return {
        background: "#FFFFFF",
        border: "none",
        borderRadius: "30px",
        padding: '0',
        width: 232,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        boxShadow: "0 8px 24px -12px rgb(0 0 0 / 0.22)",
        zIndex: 20,
    };
}

function toChatErrorMessage(error) {
    return (
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        "Sorry, something went wrong. Please try again."
    );
}

function countExistingBySide(currentEdges) {
    const sourceCounts = new Map();
    const targetCounts = new Map();
    currentEdges.forEach((edge) => {
        sourceCounts.set(edge.source, (sourceCounts.get(edge.source) || 0) + 1);
        targetCounts.set(edge.target, (targetCounts.get(edge.target) || 0) + 1);
    });
    return { sourceCounts, targetCounts };
}

function getNodeY(node) {
    const y = node?.position?.y;
    return Number.isFinite(y) ? Number(y) : 0;
}

function computeFanoutOffset(slot, total) {
    if (!Number.isFinite(slot) || !Number.isFinite(total) || total <= 1) return 0;
    const center = (total - 1) / 2;
    const raw = (slot - center) * FANOUT_STEP;
    return Math.max(-FANOUT_MAX, Math.min(FANOUT_MAX, raw));
}

function assignSideMeta(normalizedEdges, nodeMap, currentEdges) {
    const { sourceCounts, targetCounts } = countExistingBySide(currentEdges);
    const sourceMeta = new Map();
    const targetMeta = new Map();

    const sourceGroups = new Map();
    const targetGroups = new Map();

    normalizedEdges.forEach((edge) => {
        const s = sourceGroups.get(edge.source) || [];
        s.push(edge);
        sourceGroups.set(edge.source, s);

        const t = targetGroups.get(edge.target) || [];
        t.push(edge);
        targetGroups.set(edge.target, t);
    });

    sourceGroups.forEach((list, nodeId) => {
        const base = sourceCounts.get(nodeId) || 0;
        const sorted = [...list].sort((a, b) => {
            const ay = getNodeY(nodeMap.get(a.target));
            const by = getNodeY(nodeMap.get(b.target));
            if (ay === by) return String(a.id).localeCompare(String(b.id));
            return ay - by;
        });
        const total = base + sorted.length;
        sorted.forEach((edge, idx) => {
            sourceMeta.set(edge.id, { slot: base + idx, total });
        });
    });

    targetGroups.forEach((list, nodeId) => {
        const base = targetCounts.get(nodeId) || 0;
        const sorted = [...list].sort((a, b) => {
            const ay = getNodeY(nodeMap.get(a.source));
            const by = getNodeY(nodeMap.get(b.source));
            if (ay === by) return String(a.id).localeCompare(String(b.id));
            return ay - by;
        });
        const total = base + sorted.length;
        sorted.forEach((edge, idx) => {
            targetMeta.set(edge.id, { slot: base + idx, total });
        });
    });

    return { sourceMeta, targetMeta };
}

function buildNodeCategoryMap(nodeList) {
    const map = new Map();
    nodeList.forEach((node) => {
        if (!node?.id) return;
        const category = node?.data?.category;
        if (typeof category === "string" && category) {
            map.set(node.id, category);
        }
    });
    return map;
}

function buildNodeMap(nodeList) {
    const map = new Map();
    nodeList.forEach((node) => {
        if (node?.id) map.set(node.id, node);
    });
    return map;
}

function getNodeX(node) {
    const x = node?.position?.x;
    const base = Number.isFinite(x) ? Number(x) : 0;
    const w = node?.style?.width;
    return Number.isFinite(w) ? base + Number(w) / 2 : base;
}

function normalizeEdgeDirection(edge, nodeMap) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    if (!sourceNode || !targetNode) return edge;

    const sourcePhase = sourceNode?.data?.phase;
    const targetPhase = targetNode?.data?.phase;
    const sourceX = getNodeX(sourceNode);
    const targetX = getNodeX(targetNode);

    let shouldSwap = false;

    // Problem -> Solution 흐름을 우선 적용
    if (sourcePhase === "Solution" && targetPhase === "Problem") {
        shouldSwap = true;
    } else if (sourceX > targetX) {
        // 좌->우 시각 흐름 유지 (동일 phase 포함)
        shouldSwap = true;
    }

    if (!shouldSwap) return edge;
    return {
        ...edge,
        source: edge.target,
        target: edge.source,
    };
}

function toConnectorEdges(rawEdges, nodeList, currentEdges = []) {
    const categoryMap = buildNodeCategoryMap(nodeList);
    const nodeMap = buildNodeMap(nodeList);
    const normalizedEdges = rawEdges.map((edge) => normalizeEdgeDirection(edge, nodeMap));
    const { sourceMeta, targetMeta } = assignSideMeta(normalizedEdges, nodeMap, currentEdges);

    return normalizedEdges.map((normalizedEdge) => {
        const sourceHandle = SOURCE_HANDLE_ID;
        const targetHandle = TARGET_HANDLE_ID;
        const source = sourceMeta.get(normalizedEdge.id) || { slot: 0, total: 1 };
        const target = targetMeta.get(normalizedEdge.id) || { slot: 0, total: 1 };

        return {
            id: normalizedEdge.id,
            source: normalizedEdge.source,
            target: normalizedEdge.target,
            label: normalizedEdge.label,
            type: "connectorEdge",
            animated: false,
            sourceHandle,
            targetHandle,
            data: {
                sourceCategory: categoryMap.get(normalizedEdge.source) || "What",
                targetCategory: categoryMap.get(normalizedEdge.target) || "What",
                sourceOffsetY: computeFanoutOffset(source.slot, source.total),
                targetOffsetY: computeFanoutOffset(target.slot, target.total),
                clearanceX: EDGE_CLEARANCE_X,
                lineWidth: EDGE_LINE_WIDTH,
                lineColor: EDGE_LINE_COLOR,
                cornerRadius: EDGE_CORNER_RADIUS,
                laneGap: EDGE_LANE_GAP,
            },
        };
    });
}

function toReactFlowNode(n, highlightedId) {
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
        className: n.id === highlightedId ? 'node-highlighted' : '',
        data: { ...nodeData },
        style: buildNodeStyle(),
    };
    // ReactFlow node renderer expects `data.label` to be renderable content (JSX).
    // Keep the raw text in `data.content` for AI + exports.
    rfNode.data.label = buildNodeLabel(nodeData);
    return rfNode;
}

export default function ThinkingMachine() {
    const [nodes, setNodes, baseOnNodesChange] = useNodesState(INITIAL_NODES);
    const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [showAdminShortcutHint, setShowAdminShortcutHint] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState("chat");
    const [legacyChatFallbackEnabled, setLegacyChatFallbackEnabled] = useState(false);

    // AI 제안 패널
    const [suggestions, setSuggestions] = useState([]);
    const [highlightedNodeIds, setHighlightedNodeIds] = useState(new Set());

    // Chat state (Drawer Chat primary + optional legacy dialog fallback)
    const [activeSuggestion, setActiveSuggestion] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isChatConverting, setIsChatConverting] = useState(false);
    const [attachedNodes, setAttachedNodes] = useState([]); // [{id,title,content,category,phase}]
    const [isChatDropActive, setIsChatDropActive] = useState(false);
    const [ghostDrag, setGhostDrag] = useState(null); // {x,y,count,phase:"dragging"|"dropping", targetX?, targetY?}
    const activeSuggestionIdRef = useRef(null);
    const chatButtonRef = useRef(null);
    const chatDropZoneRef = useRef(null);
    const didAutoOpenOnDragRef = useRef(false);
    const dragOriginRef = useRef(null); // { ids: string[], positions: Map<id, {x,y}> }
    const isNodeDraggingRef = useRef(false);
    const restoreRafRef = useRef(null);
    const dragStartPointRef = useRef(null); // {x,y}
    const didShowGhostRef = useRef(false);
    const reactFlowRef = useRef(null);
    const [selectedDraftIds, setSelectedDraftIds] = useState([]);
    const [showDraftConvertPrompt, setShowDraftConvertPrompt] = useState(false);
    const draftConvertIdsRef = useRef([]);
    const prevDraftSelectionRef = useRef({ idsKey: "", shouldPrompt: false });
    const [selectionBoxEnabled, setSelectionBoxEnabled] = useState(false);
    const ghostCaptureRef = useRef(false);
    const convertDraftsToGroupRef = useRef(null);
    const [draftSubmittingIds, setDraftSubmittingIds] = useState(() => new Set());

    const hasThinkingGraph = useMemo(() => {
        return nodes.some((n) => n?.type === "thinkingNode" || n?.type === "ideaGroup");
    }, [nodes]);

    const makeAttachedContextId = (ids) => {
        const base = Array.isArray(ids) ? ids.join(",") : "";
        return `attached-${Date.now()}-${base.length}-${Math.random().toString(16).slice(2, 6)}`;
    };

    const buildAttachedNodesContext = (selected) => {
        const safeSelected = Array.isArray(selected) ? selected : [];
        const items = safeSelected
            .map((n) => ({
                id: n?.id,
                title: n?.data?.title,
                content: n?.data?.content,
                category: n?.data?.category,
                phase: n?.data?.phase,
            }))
            .filter((n) => typeof n.id === "string" && n.id && typeof n.title === "string" && n.title.trim().length > 0);

        return {
            id: makeAttachedContextId(items.map((i) => i.id)),
            type: "attachedNodes",
            title: items.length === 1 ? "Attached node" : `Attached nodes (${items.length})`,
            content: "Use these nodes as the primary context for this chat.",
            category: "What",
            phase: "Problem",
            attached_nodes: items,
        };
    };

    const getPointerClientPoint = (event) => {
        const e = event?.nativeEvent ?? event;
        const touch = e?.touches?.[0] || e?.changedTouches?.[0];
        if (touch) return { x: touch.clientX, y: touch.clientY };
        if (typeof e?.clientX === "number" && typeof e?.clientY === "number") return { x: e.clientX, y: e.clientY };
        return null;
    };

    const isPointNearChatButton = (pt) => {
        const el = chatButtonRef.current;
        if (!pt || !el?.getBoundingClientRect) return false;
        const rect = el.getBoundingClientRect();
        const pad = 28;
        const left = rect.left - pad;
        const right = rect.right + pad;
        const top = rect.top - pad;
        const bottom = rect.bottom + pad;
        return pt.x >= left && pt.x <= right && pt.y >= top && pt.y <= bottom;
    };

    const getChatDropZoneRect = () => {
        const el = chatDropZoneRef.current;
        if (!el?.getBoundingClientRect) return null;
        return el.getBoundingClientRect();
    };

    const isPointInRect = (pt, rect, pad = 0) => {
        if (!pt || !rect) return false;
        return (
            pt.x >= rect.left - pad &&
            pt.x <= rect.right + pad &&
            pt.y >= rect.top - pad &&
            pt.y <= rect.bottom + pad
        );
    };

    const isPointInChatRegion = (pt) => {
        if (!pt) return false;
        const width = typeof window !== "undefined" ? window.innerWidth : 0;
        if (!width) return false;
        // 오른쪽 영역 진입만으로도 Chat 모드가 자연스럽게 열리도록 넓게 잡음
        return pt.x >= width - 240;
    };

    const isPointInChatDropZone = (pt) => {
        const rect = getChatDropZoneRect();
        if (rect) return isPointInRect(pt, rect, 24);
        // Drawer가 아직 열리지 않았을 때도 오른쪽 영역이면 드롭 허용
        return isPointInChatRegion(pt);
    };

    const getDropAnimationTarget = () => {
        const rect = getChatDropZoneRect();
        if (rect) return { x: rect.left + rect.width * 0.55, y: rect.top + 120 };
        const width = typeof window !== "undefined" ? window.innerWidth : 0;
        const height = typeof window !== "undefined" ? window.innerHeight : 0;
        return { x: Math.max(0, width - 180), y: Math.max(0, height * 0.35) };
    };

    const filteredOnNodesChange = useMemo(() => {
        return (changes) => {
            // 고스트 드래그 UX: 원본 노드는 드래그 중 위치가 바뀌지 않도록 position changes 무시
            if (isNodeDraggingRef.current && ghostCaptureRef.current && Array.isArray(changes)) {
                const next = changes.filter((c) => c?.type !== "position");
                baseOnNodesChange(next);
                return;
            }
            baseOnNodesChange(changes);
        };
    }, [baseOnNodesChange]);

    const handleFlowInit = (instance) => {
        reactFlowRef.current = instance;
    };

    const screenCenterToFlowPosition = () => {
        const inst = reactFlowRef.current;
        if (!inst || typeof window === "undefined") return { x: 0, y: 0 };
        const pt = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        if (typeof inst.screenToFlowPosition === "function") return inst.screenToFlowPosition(pt);
        // fallback for older APIs
        if (typeof inst.project === "function") return inst.project(pt);
        return { x: 0, y: 0 };
    };

    const buildDraftStyle = (kind) => {
        const size = kind === "image" ? IMAGE_DRAFT_SIZE : POSTIT_DRAFT_SIZE;
        return {
            width: size.w,
            height: size.h,
            border: "none",
            background: "transparent",
            padding: 0,
            zIndex: 60,
        };
    };

    const computeNodeBounds = (nodeList) => {
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
    };

    const shiftClusterRightOfExisting = (existingNodes, incomingNodes) => {
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
    };

    const layoutDraftsInGroupGrid = ({ draftNodes, groupW, groupH }) => {
        const list = Array.isArray(draftNodes) ? draftNodes : [];
        if (list.length === 0) return [];

        const innerTop = GROUP_TOP_PADDING + 18;
        const innerW = Math.max(0, groupW - GROUP_INNER_PAD_X * 2);
        const innerH = Math.max(0, groupH - innerTop - GROUP_INNER_PAD_BOTTOM);

        const count = list.length;
        const aspect = innerW > 0 && innerH > 0 ? innerW / innerH : 1;
        const idealCols = Math.ceil(Math.sqrt(count * aspect));
        const cols = Math.max(1, Math.min(count, idealCols || 1));
        const rows = Math.max(1, Math.ceil(count / cols));

        const cellW = innerW / cols;
        const cellH = innerH / rows;

        const maxW = Math.max(0, Math.floor(cellW - GROUP_DRAFT_GAP));
        const maxH = Math.max(0, Math.floor(cellH - GROUP_DRAFT_GAP));
        const minW = Math.min(GROUP_DRAFT_MIN_SIZE.w, maxW);
        const minH = Math.min(GROUP_DRAFT_MIN_SIZE.h, maxH);
        const targetW = Math.max(minW, Math.floor(Math.min(POSTIT_DRAFT_SIZE.w, maxW)));
        const targetH = Math.max(minH, Math.floor(Math.min(POSTIT_DRAFT_SIZE.h, maxH)));

        return list.map((n, idx) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const x = GROUP_INNER_PAD_X + Math.round(col * cellW + (cellW - targetW) / 2);
            const y = innerTop + Math.round(row * cellH + (cellH - targetH) / 2);
            return {
                ...n,
                style: { ...(n.style || {}), width: targetW, height: targetH, zIndex: 60 },
                position: { x, y },
            };
        });
    };

    const createPostitDraft = () => {
        const center = screenCenterToFlowPosition();
        const topLevelDraftCount = nodes.filter((n) => (n?.type === "postitDraft" || n?.type === "imageDraft") && !n?.parentNode).length;
        const offset = (topLevelDraftCount % 9) * 26;
        const id = `draft-postit-${Date.now()}`;
        const node = {
            id,
            type: "postitDraft",
            position: { x: center.x - POSTIT_DRAFT_SIZE.w / 2 + offset, y: center.y - POSTIT_DRAFT_SIZE.h / 2 + offset },
            data: {
                text: "",
            },
            style: buildDraftStyle("postit"),
        };
        setNodes((prev) => [...prev, node]);
    };

    const createImageDraft = () => {
        const center = screenCenterToFlowPosition();
        const topLevelDraftCount = nodes.filter((n) => (n?.type === "postitDraft" || n?.type === "imageDraft") && !n?.parentNode).length;
        const offset = (topLevelDraftCount % 9) * 26;
        const id = `draft-image-${Date.now()}`;
        const node = {
            id,
            type: "imageDraft",
            position: { x: center.x - IMAGE_DRAFT_SIZE.w / 2 + offset, y: center.y - IMAGE_DRAFT_SIZE.h / 2 + offset },
            data: {
                imageUrl: "",
                fileName: "",
                caption: "",
            },
            style: buildDraftStyle("image"),
        };
        setNodes((prev) => [...prev, node]);
    };

    const handlePostitChangeText = useCallback((nodeId, nextText) => {
        setNodes((prev) =>
            prev.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, text: nextText } } : n))
        );
    }, []);

    const handleImageChangeCaption = useCallback((nodeId, nextCaption) => {
        setNodes((prev) =>
            prev.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, caption: nextCaption } } : n))
        );
    }, []);

    const handleImagePick = useCallback((nodeId, file) => {
        const url = URL.createObjectURL(file);
        setNodes((prev) =>
            prev.map((n) => {
                if (n.id !== nodeId) return n;
                const prevUrl = typeof n?.data?.imageUrl === "string" ? n.data.imageUrl : "";
                if (prevUrl && prevUrl.startsWith("blob:")) {
                    try {
                        URL.revokeObjectURL(prevUrl);
                    } catch {
                        // ignore
                    }
                }
                return {
                    ...n,
                    data: {
                        ...n.data,
                        imageUrl: url,
                        fileName: file?.name || "",
                    },
                };
            })
        );
    }, []);

    const handleDraftSubmit = useCallback((nodeId) => {
        const fn = convertDraftsToGroupRef.current;
        if (typeof fn === "function") void fn([nodeId]);
    }, []);

    const handleSelectionChange = useCallback(({ nodes: selectedNodes } = {}) => {
        const selected = Array.isArray(selectedNodes) ? selectedNodes : [];
        const draftIds = selected
            .filter((n) => n?.type === "postitDraft" || n?.type === "imageDraft")
            .map((n) => n.id)
            .filter(Boolean)
            .sort();

        const shouldPrompt = draftIds.length >= 2;
        const idsKey = draftIds.join("|");
        const prev = prevDraftSelectionRef.current;

        // Prevent infinite update loops: only update state when selection actually changes.
        if (prev.idsKey !== idsKey) {
            setSelectedDraftIds(draftIds);
            draftConvertIdsRef.current = draftIds;
            prevDraftSelectionRef.current = { ...prevDraftSelectionRef.current, idsKey };
        }
        if (prev.shouldPrompt !== shouldPrompt) {
            setShowDraftConvertPrompt(shouldPrompt);
            prevDraftSelectionRef.current = { ...prevDraftSelectionRef.current, shouldPrompt };
        }
    }, []);

    const buildDraftBundleText = (draftNodeList) => {
        return draftNodeList
            .map((n, idx) => {
                if (n.type === "postitDraft") {
                    const t = typeof n?.data?.text === "string" ? n.data.text.trim() : "";
                    return t ? `Draft ${idx + 1} (Post-it): ${t}` : "";
                }
                if (n.type === "imageDraft") {
                    const name = typeof n?.data?.fileName === "string" ? n.data.fileName.trim() : "";
                    const caption = typeof n?.data?.caption === "string" ? n.data.caption.trim() : "";
                    const parts = [];
                    parts.push(`Draft ${idx + 1} (Image)`);
                    if (name) parts.push(`file: ${name}`);
                    if (caption) parts.push(`note: ${caption}`);
                    if (!name && !caption) parts.push("uploaded image (no caption)");
                    return parts.join(" | ");
                }
                return "";
            })
            .filter(Boolean)
            .join("\n");
    };

    useEffect(() => {
        const handleDown = (event) => {
            if (event.key === "Shift") setSelectionBoxEnabled(true);
        };
        const handleUp = (event) => {
            if (event.key === "Shift") setSelectionBoxEnabled(false);
        };
        window.addEventListener("keydown", handleDown);
        window.addEventListener("keyup", handleUp);
        return () => {
            window.removeEventListener("keydown", handleDown);
            window.removeEventListener("keyup", handleUp);
        };
    }, []);

    const computeBounds = computeNodeBounds;

    const layoutThinkingNodesInGroup = (rfNodes, groupW) => {
        const CATEGORY_ORDER = ["Why", "Who", "What", "How", "When", "Where"];
        const rowMap = new Map(CATEGORY_ORDER.map((c, i) => [c, i]));
        const colX = { Problem: 24, Solution: 320 };
        const baseY = 62;
        const rowGap = 178;
        const slotGap = 54;

        const byRowCol = new Map();
        rfNodes.forEach((n) => {
            const cat = n?.data?.category || "What";
            const phase = n?.data?.phase || "Problem";
            const row = rowMap.get(cat) ?? 2;
            const col = phase === "Solution" ? "Solution" : "Problem";
            const key = `${row}:${col}`;
            const arr = byRowCol.get(key) || [];
            arr.push(n);
            byRowCol.set(key, arr);
        });

        const maxColX = Math.max(colX.Problem, colX.Solution);
        const safeRight = Math.max(groupW - 260, maxColX);

        const out = [];
        byRowCol.forEach((arr, key) => {
            const [rowStr, col] = key.split(":");
            const row = Number(rowStr);
            arr.forEach((n, idx) => {
                const x = Math.min(colX[col] + idx * slotGap, safeRight);
                const y = baseY + row * rowGap;
                out.push({ ...n, position: { x, y } });
            });
        });
        return out;
    };

    const toggleIdeaGroupMode = (groupId) => {
        setNodes((prev) => {
            const group = prev.find((n) => n.id === groupId);
            const currentMode = group?.data?.mode === "raw" ? "raw" : "nodes";
            const nextMode = currentMode === "raw" ? "nodes" : "raw";
            const groupW = group?.style?.width ?? 520;
            const groupH = group?.style?.height ?? 360;

            let rawGridMap = null;
            if (nextMode === "raw") {
                const draftChildren = prev
                    .filter((n) => n.parentNode === groupId && (n.type === "postitDraft" || n.type === "imageDraft"))
                    .map((n) => ({ ...n, hidden: false }));
                const laidOutDrafts = layoutDraftsInGroupGrid({ draftNodes: draftChildren, groupW, groupH });
                rawGridMap = new Map(laidOutDrafts.map((n) => [n.id, n]));
            }
            return prev.map((n) => {
                if (n.id === groupId) return { ...n, data: { ...n.data, mode: nextMode } };
                if (n.parentNode !== groupId) return n;
                const isDraft = n.type === "postitDraft" || n.type === "imageDraft";
                const isThinking = n.type === "thinkingNode";
                if (nextMode === "raw") {
                    if (isDraft) return rawGridMap?.get?.(n.id) || { ...n, hidden: false };
                    if (isThinking) return { ...n, hidden: true };
                } else {
                    if (isDraft) return { ...n, hidden: true };
                    if (isThinking) return { ...n, hidden: false };
                }
                return n;
            });
        });
    };

    const convertDraftsToGroup = async (draftIds) => {
        const ids = Array.isArray(draftIds) ? draftIds : [];
        if (ids.length === 0 || isAnalyzing) return;

        const draftNodes = nodes.filter((n) => ids.includes(n.id));
        const bundleText = buildDraftBundleText(draftNodes);
        if (!bundleText.trim()) return;

        setDraftSubmittingIds((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => next.add(id));
            return next;
        });
        setIsAnalyzing(true);
        try {
            const history = nodes
                .filter((n) => n.type === "thinkingNode")
                .map((n) => ({
                    id: n.id,
                    data: { title: n.data.title, category: n.data.category, phase: n.data.phase },
                    position: n.position,
                }));
            const payload = { text: bundleText, history };
            const response = await axios.post("/api/analyze", payload);
            const data = response.data;

            const suggestionNodeData = data.nodes.find((n) => n.data.is_ai_generated);
            const userNodeDatas = data.nodes.filter((n) => !n.data.is_ai_generated);
            const rawEdges = data.edges.filter((e) => !e.id.startsWith("e-suggest-"));

            const bounds = computeBounds(draftNodes) || { minX: 0, minY: 0, maxX: 520, maxY: 420 };
            const groupId = `idea-group-${Date.now()}`;
            const groupPos = { x: bounds.minX - GROUP_PADDING, y: bounds.minY - GROUP_PADDING - 12 };
            const DRAFT_AREA_W = (bounds.maxX - bounds.minX) + GROUP_PADDING * 2;
            const DRAFT_AREA_H = (bounds.maxY - bounds.minY) + GROUP_PADDING * 2 + GROUP_TOP_PADDING;

            const tempRfNodes = userNodeDatas.map((n) => toReactFlowNode(n, null));
            const CARD_W = 232;
            const CARD_H = 186;
            const seedLayout = layoutThinkingNodesInGroup(tempRfNodes, 820);
            const seedMaxX = Math.max(0, ...seedLayout.map((n) => (n.position?.x ?? 0) + CARD_W));
            const seedMaxY = Math.max(0, ...seedLayout.map((n) => (n.position?.y ?? 0) + CARD_H));
            const thinkingAreaW = seedMaxX + 36;
            const thinkingAreaH = seedMaxY + 40;

            const groupW = Math.max(DRAFT_AREA_W, thinkingAreaW, 520);
            const groupH = Math.max(DRAFT_AREA_H, thinkingAreaH, 360);

            const groupNode = {
                id: groupId,
                type: "ideaGroup",
                position: groupPos,
                data: {
                    mode: "nodes",
                    title: ids.length === 1 ? "Post-it idea" : `Draft bundle (${ids.length})`,
                    onToggle: toggleIdeaGroupMode,
                    category: "What",
                    phase: "Problem",
                },
                style: { width: groupW, height: groupH, background: "transparent", border: "none", zIndex: 0 },
            };

            // Move drafts into group as children (grid layout so they don't dominate the space in Raw mode)
            const draftChildrenBase = draftNodes.map((n) => ({
                ...n,
                parentNode: groupId,
                extent: "parent",
                hidden: true, // nodes mode default
            }));
            const draftChildrenGrid = layoutDraftsInGroupGrid({ draftNodes: draftChildrenBase, groupW, groupH });
            const movedDrafts = draftChildrenGrid.map((n) => ({
                ...n,
                parentNode: groupId,
                extent: "parent",
                hidden: true,
            }));

            // Create thinking nodes inside group
            const laidOut = layoutThinkingNodesInGroup(tempRfNodes, groupW).map((n) => ({
                ...n,
                parentNode: groupId,
                extent: "parent",
                position: { x: n.position.x, y: n.position.y },
                hidden: false,
            }));

            // Merge nodes: remove drafts from base, then add group (behind) + moved drafts + new thinking nodes
            const otherNodes = nodes.filter((n) => !ids.includes(n.id));
            const nextNodes = [...otherNodes, groupNode, ...movedDrafts, ...laidOut];

            // Route cross-boundary edges to groups (group-to-group / group-to-outside)
            const childToGroup = new Map();
            nextNodes.forEach((n) => {
                if (n?.parentNode && n.type === "thinkingNode") childToGroup.set(n.id, n.parentNode);
            });
            // include existing grouped thinking nodes already in state
            nodes.forEach((n) => {
                if (n?.parentNode && n.type === "thinkingNode") childToGroup.set(n.id, n.parentNode);
            });

            const routedRawEdges = [];
            const seenPairs = new Set();
            rawEdges.forEach((e) => {
                const src = e?.source;
                const tgt = e?.target;
                if (!src || !tgt) return;
                const sG = childToGroup.get(src);
                const tG = childToGroup.get(tgt);
                // Keep internal edges within same group
                let nextSource = src;
                let nextTarget = tgt;
                if (sG && tG && sG === tG) {
                    // no change
                } else {
                    if (sG) nextSource = sG;
                    if (tG) nextTarget = tG;
                }
                if (nextSource === nextTarget) return;
                const key = `${nextSource}->${nextTarget}`;
                if (seenPairs.has(key)) return;
                seenPairs.add(key);
                routedRawEdges.push({ ...e, source: nextSource, target: nextTarget });
            });

            // Build edges (connector styling)
            const nextEdges = toConnectorEdges(routedRawEdges, nextNodes, edges);
            setNodes(nextNodes);
            setEdges((prev) => [...prev, ...nextEdges]);

            // Push suggestion to Tip shelf
            if (suggestionNodeData) {
                const newSuggestion = {
                    id: `suggestion-${Date.now()}`,
                    title: suggestionNodeData.data.label,
                    content: suggestionNodeData.data.content,
                    category: suggestionNodeData.data.category,
                    phase: suggestionNodeData.data.phase,
                    relatedNodeId: null,
                };
                setSuggestions((prev) => [newSuggestion, ...prev]);
            }

            setShowDraftConvertPrompt(false);
            setSelectedDraftIds([]);
        } catch (error) {
            const serverMsg =
                error?.response?.data?.error ||
                error?.response?.data?.detail ||
                error?.message;
            alert(serverMsg ? `Failed to analyze draft: ${serverMsg}` : "Failed to analyze draft. Please try again.");
        } finally {
            setIsAnalyzing(false);
            setDraftSubmittingIds((prev) => {
                const next = new Set(prev);
                ids.forEach((id) => next.delete(id));
                return next;
            });
        }
    };

    // Keep a ref to the latest converter so draft nodes never call stale closures.
    convertDraftsToGroupRef.current = convertDraftsToGroup;

    useEffect(() => {
        try {
            const persistedAdminMode = window.localStorage.getItem(ADMIN_MODE_STORAGE_KEY);
            if (persistedAdminMode === "1") setIsAdminMode(true);

            const dismissedHint = window.sessionStorage.getItem(ADMIN_HINT_DISMISSED_KEY) === "1";
            setShowAdminShortcutHint(!dismissedHint);
        } catch {
            setShowAdminShortcutHint(true);
        }
    }, []);

    useEffect(() => {
        try {
            const query = new URLSearchParams(window.location.search);
            setLegacyChatFallbackEnabled(query.get(LEGACY_CHAT_QUERY_KEY) === "1");
        } catch {
            setLegacyChatFallbackEnabled(false);
        }
    }, []);

    useEffect(() => {
        activeSuggestionIdRef.current = activeSuggestion?.id ?? null;
    }, [activeSuggestion?.id]);

    useEffect(() => {
        try {
            window.localStorage.setItem(ADMIN_MODE_STORAGE_KEY, isAdminMode ? "1" : "0");
        } catch {
            // ignore storage write errors
        }
    }, [isAdminMode]);

    const dismissAdminShortcutHint = () => {
        setShowAdminShortcutHint(false);
        try {
            window.sessionStorage.setItem(ADMIN_HINT_DISMISSED_KEY, "1");
        } catch {
            // ignore storage write errors
        }
    };

    useEffect(() => {
        const handleKeydown = (event) => {
            const isAdminToggle = (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "a";
            if (!isAdminToggle) return;

            event.preventDefault();
            setIsAdminMode((prev) => !prev);
            dismissAdminShortcutHint();
        };

        window.addEventListener("keydown", handleKeydown);
        return () => window.removeEventListener("keydown", handleKeydown);
    }, []);

    useEffect(() => {
        if (!isDrawerOpen) return undefined;

        const handleEscClose = (event) => {
            if (event.key === "Escape") {
                setIsDrawerOpen(false);
            }
        };

        window.addEventListener("keydown", handleEscClose);
        return () => window.removeEventListener("keydown", handleEscClose);
    }, [isDrawerOpen]);

    const handleDismissSuggestion = (suggestionId) => {
        setSuggestions((prev) => {
            const dismissed = prev.find((s) => s.id === suggestionId);
            const nextSuggestions = prev.filter((s) => s.id !== suggestionId);
            if (dismissed) {
                setHighlightedNodeIds((ids) => {
                    const next = new Set(ids);
                    next.delete(dismissed.relatedNodeId);
                    return next;
                });
                // 활성 컨텍스트 카드가 dismiss된 경우 다음 카드로 교체(없으면 해제)
                if (activeSuggestion?.id === suggestionId) {
                    setActiveSuggestion(legacyChatFallbackEnabled ? null : (nextSuggestions[0] || null));
                    if (nextSuggestions.length === 0) {
                        setChatMessages([]);
                        setChatInput("");
                    }
                }
            }
            return nextSuggestions;
        });
    };

    const handleSuggestionClick = (suggestion) => {
        // Legacy fallback path is available with `?legacyChat=1`.
        if (legacyChatFallbackEnabled) {
            setIsDrawerOpen(false);
            if (activeSuggestion?.id === suggestion.id) {
                setActiveSuggestion(null);
            } else {
                setActiveSuggestion(suggestion);
            }
            return;
        }

        if (activeSuggestion?.id === suggestion.id && isDrawerOpen && drawerMode === "chat") {
            setIsDrawerOpen(false);
            setActiveSuggestion(null);
            setChatMessages([]);
            setChatInput("");
            return;
        }

        setActiveSuggestion(suggestion);
        setDrawerMode("chat");
        setIsDrawerOpen(true);
    };

    const handleDrawerModeToggle = (nextMode) => {
        if (isDrawerOpen && drawerMode === nextMode) {
            setIsDrawerOpen(false);
            return;
        }
        setDrawerMode(nextMode);
        setIsDrawerOpen(true);
        // Chat 모드는 "첨부 노드 컨텍스트" 전용 (Tip 컨텍스트와 분리)
        if (nextMode === "chat" && activeSuggestion?.type !== "attachedNodes") {
            setActiveSuggestion(null);
        }
        if (nextMode === "tip" && activeSuggestion?.type === "attachedNodes") {
            setActiveSuggestion(suggestions[0] || null);
        }
    };

    useEffect(() => {
        if (legacyChatFallbackEnabled) {
            setChatMessages([]);
            setChatInput("");
            setIsChatLoading(false);
            return;
        }

        if (!activeSuggestion) {
            setChatMessages([]);
            setChatInput("");
            setIsChatLoading(false);
            return;
        }

        let cancelled = false;
        const targetSuggestion = activeSuggestion;

        const bootstrapChat = async () => {
            setChatMessages([]);
            setChatInput("");
            setIsChatLoading(true);
            try {
                const isAttachedNodesContext = targetSuggestion?.type === "attachedNodes";
                const attached = isAttachedNodesContext ? (targetSuggestion?.attached_nodes ?? []) : [];
                const payload = {
                    suggestion_title: targetSuggestion.title,
                    suggestion_content: targetSuggestion.content,
                    suggestion_category: targetSuggestion.category,
                    suggestion_phase: targetSuggestion.phase,
                    messages: [],
                    attached_nodes: attached,
                    user_message: isAttachedNodesContext
                        ? "Analyze the attached nodes, summarize what they collectively imply, and ask me one clarifying question to move forward."
                        : "Please explain this suggestion first.",
                };
                const res = await axios.post("/api/chat", payload);
                if (cancelled || activeSuggestionIdRef.current !== targetSuggestion.id) return;
                setChatMessages([{ role: "assistant", content: res.data.reply }]);
            } catch (error) {
                if (cancelled || activeSuggestionIdRef.current !== targetSuggestion.id) return;
                setChatMessages([{ role: "assistant", content: toChatErrorMessage(error) }]);
            } finally {
                if (!cancelled && activeSuggestionIdRef.current === targetSuggestion.id) {
                    setIsChatLoading(false);
                }
            }
        };

        void bootstrapChat();
        return () => {
            cancelled = true;
        };
    }, [activeSuggestion?.id, legacyChatFallbackEnabled]);

    const handleDrawerChatSubmit = async () => {
        const targetSuggestion = activeSuggestion;
        const trimmedInput = chatInput.trim();

        if (!targetSuggestion || !trimmedInput || isChatLoading) return;

        const historyForApi = chatMessages;
        const targetSuggestionId = targetSuggestion.id;
        setChatMessages((prev) => [...prev, { role: "user", content: trimmedInput }]);
        setChatInput("");
        setIsChatLoading(true);

        try {
            const isAttachedNodesContext = targetSuggestion?.type === "attachedNodes";
            const attached = isAttachedNodesContext ? (targetSuggestion?.attached_nodes ?? []) : [];
            const payload = {
                suggestion_title: targetSuggestion.title,
                suggestion_content: targetSuggestion.content,
                suggestion_category: targetSuggestion.category,
                suggestion_phase: targetSuggestion.phase,
                messages: historyForApi,
                user_message: trimmedInput,
                attached_nodes: attached,
            };
            const res = await axios.post("/api/chat", payload);
            if (activeSuggestionIdRef.current !== targetSuggestionId) return;
            setChatMessages((prev) => [...prev, { role: "assistant", content: res.data.reply }]);
        } catch (error) {
            if (activeSuggestionIdRef.current !== targetSuggestionId) return;
            setChatMessages((prev) => [...prev, { role: "assistant", content: toChatErrorMessage(error) }]);
        } finally {
            if (activeSuggestionIdRef.current === targetSuggestionId) {
                setIsChatLoading(false);
            }
        }
    };

    const handleDrawerChatConvertToNodes = async () => {
        if (!activeSuggestion || chatMessages.length === 0 || isChatConverting) return;
        setIsChatConverting(true);

        try {
            const isAttachedNodesContext = activeSuggestion?.type === "attachedNodes";
            const attached = isAttachedNodesContext ? (activeSuggestion?.attached_nodes ?? []) : [];
            const payload = {
                suggestion_title: activeSuggestion.title,
                suggestion_content: activeSuggestion.content,
                suggestion_category: activeSuggestion.category,
                suggestion_phase: activeSuggestion.phase,
                messages: chatMessages,
                attached_nodes: attached,
                existing_nodes: nodes.map((n) => ({
                    id: n.id,
                    data: {
                        title: n.data.title,
                        category: n.data.category,
                        phase: n.data.phase,
                    },
                    position: n.position,
                })),
            };
            const res = await axios.post("/api/chat-to-nodes", payload);
            handleAddNodesFromChat(res.data);
            setIsDrawerOpen(false);
            setActiveSuggestion(null);
            setChatMessages([]);
            setChatInput("");
        } catch (error) {
            const serverMsg =
                error?.response?.data?.error ||
                error?.response?.data?.detail ||
                error?.message;
            alert(serverMsg ? `Failed to convert conversation to nodes: ${serverMsg}` : "Failed to convert conversation to nodes. Please try again shortly.");
        } finally {
            setIsChatConverting(false);
        }
    };

    const handleDrawerContextSelect = (item) => {
        if (!item) return;
        setActiveSuggestion(item);
        // attachedNodes는 Chat 모드, 그 외 suggestion은 Tip 모드로
        setDrawerMode(item?.type === "attachedNodes" ? "chat" : "tip");
        setIsDrawerOpen(true);
    };

    const handleNodeDragUpdate = (event) => {
        const pt = getPointerClientPoint(event);
        const near = isPointInChatRegion(pt) || isPointNearChatButton(pt);
        setIsChatDropActive(Boolean(near));

        if (pt) {
            const start = dragStartPointRef.current;
            const dx = start ? pt.x - start.x : 0;
            const dy = start ? pt.y - start.y : 0;
            const dist2 = dx * dx + dy * dy;
            const movedEnough = dist2 >= 36; // 6px threshold

            const origin = dragOriginRef.current;
            const count = origin?.ids?.length || 1;
            // 고스트 드래그는 "오른쪽(Chat) 첨부" 제스처로 진입했을 때만 활성화
            if (!ghostCaptureRef.current && movedEnough && near) {
                ghostCaptureRef.current = true;
            }

            if (ghostCaptureRef.current && movedEnough) {
                didShowGhostRef.current = true;
                setGhostDrag((prev) => {
                    if (prev?.phase === "dropping") return prev;
                    return { x: pt.x, y: pt.y, count, phase: "dragging" };
                });
            }
        }

        // 원본 노드 위치 유지: 드래그 중에는 저장된 원점으로 계속 복원 (RAF로 부하 제한)
        const origin = dragOriginRef.current;
        if (ghostCaptureRef.current && origin?.positions && origin?.ids?.length && !restoreRafRef.current) {
            restoreRafRef.current = requestAnimationFrame(() => {
                restoreRafRef.current = null;
                const idSet = new Set(origin.ids);
                setNodes((prev) =>
                    prev.map((n) => {
                        if (!idSet.has(n.id)) return n;
                        const pos = origin.positions.get(n.id);
                        if (!pos) return n;
                        if (n.position?.x === pos.x && n.position?.y === pos.y) return n;
                        return { ...n, position: { x: pos.x, y: pos.y } };
                    })
                );
            });
        }

        if (near && !didAutoOpenOnDragRef.current) {
            didAutoOpenOnDragRef.current = true;
            setDrawerMode("chat");
            setIsDrawerOpen(true);
        }
    };

    const handleNodeDragStart = (event, node) => {
        didAutoOpenOnDragRef.current = false;
        isNodeDraggingRef.current = true;
        ghostCaptureRef.current = false;
        didShowGhostRef.current = false;
        const selectedNodes = nodes.filter((n) => n?.selected);
        const ids =
            node?.selected && selectedNodes.length
                ? selectedNodes.map((n) => n.id)
                : node?.id
                    ? [node.id]
                    : [];
        const positions = new Map();
        nodes.forEach((n) => {
            if (ids.includes(n.id)) positions.set(n.id, { x: n.position?.x ?? 0, y: n.position?.y ?? 0 });
        });
        dragOriginRef.current = { ids, positions };

        const pt = getPointerClientPoint(event);
        if (pt) dragStartPointRef.current = { x: pt.x, y: pt.y };
        // 고스트는 실제로 일정 거리 이상 움직였을 때만 보여준다 (클릭/탭 오작동 방지)
        setGhostDrag(null);
    };

    const handleNodeDragStop = (event, node) => {
        const pt = getPointerClientPoint(event);
        const shouldAttach = isPointInChatDropZone(pt);
        setIsChatDropActive(false);
        didAutoOpenOnDragRef.current = false;
        isNodeDraggingRef.current = false;
        ghostCaptureRef.current = false;
        dragStartPointRef.current = null;

        // 드래그가 "의도"되지 않았거나(짧은 탭) 드롭존이 아니면 고스트만 정리
        if (!shouldAttach) {
            setGhostDrag(null);
            return;
        }

        const selectedNodes = nodes.filter((n) => n?.selected);
        const draggedNode = node ? (nodes.find((n) => n.id === node.id) || node) : null;
        const toAttach =
            draggedNode?.selected && selectedNodes.length
                ? selectedNodes
                : draggedNode
                    ? [draggedNode]
                    : [];
        if (toAttach.length === 0) return;

        const context = buildAttachedNodesContext(toAttach);
        setAttachedNodes(context.attached_nodes);
        setActiveSuggestion(context);
        setDrawerMode("chat");
        setIsDrawerOpen(true);

        // 고스트 흡수 애니메이션 (고스트가 실제로 표시된 경우에만)
        if (pt && didShowGhostRef.current) {
            const target = getDropAnimationTarget();
            setGhostDrag({ x: pt.x, y: pt.y, count: context.attached_nodes.length, phase: "dropping", targetX: target.x, targetY: target.y });
            window.setTimeout(() => setGhostDrag(null), 260);
        } else {
            setGhostDrag(null);
        }
    };

    useEffect(() => {
        if (!ghostDrag) return undefined;
        const clear = () => {
            setGhostDrag(null);
            setIsChatDropActive(false);
            isNodeDraggingRef.current = false;
            didAutoOpenOnDragRef.current = false;
            dragStartPointRef.current = null;
        };
        window.addEventListener("mouseup", clear);
        window.addEventListener("touchend", clear);
        window.addEventListener("touchcancel", clear);
        window.addEventListener("blur", clear);
        return () => {
            window.removeEventListener("mouseup", clear);
            window.removeEventListener("touchend", clear);
            window.removeEventListener("touchcancel", clear);
            window.removeEventListener("blur", clear);
        };
    }, [ghostDrag]);

    // 채팅 대화에서 노드+엣지 추가
    const handleAddNodesFromChat = (data) => {
        const incoming = Array.isArray(data?.nodes) ? data.nodes : [];
        const incomingEdges = Array.isArray(data?.edges) ? data.edges : [];
        setNodes((prevNodes) => {
            const rawNewNodes = incoming.map((n) => toReactFlowNode(n, null));
            const newNodes = shiftClusterRightOfExisting(prevNodes, rawNewNodes);
            const mergedNodes = [...prevNodes, ...newNodes];
            setEdges((prevEdges) => [...prevEdges, ...toConnectorEdges(incomingEdges, mergedNodes, prevEdges)]);
            return mergedNodes;
        });
    };

    const handleInputSubmit = async (text) => {
        setIsAnalyzing(true);

        try {
            const payload = {
                text,
                history: nodes.map((n) => ({
                    id: n.id,
                    data: {
                        title: n.data.title,
                        category: n.data.category,
                        phase: n.data.phase,
                    },
                    position: n.position,
                })),
            };

            const response = await axios.post("/api/analyze", payload);
            const data = response.data;

            // 제안 노드(is_ai_generated=true)와 사용자 노드 분리
            const suggestionNodeData = data.nodes.find((n) => n.data.is_ai_generated);
            const userNodeDatas = data.nodes.filter((n) => !n.data.is_ai_generated);

            // e-suggest- 엣지에서 연결된 사용자 노드 ID 파악
            const suggestEdge = data.edges.find((e) => e.id.startsWith("e-suggest-"));
            const highlightedMainNodeId = suggestEdge ? suggestEdge.source : null;

            // 사용자 노드 → ReactFlow
            const rawNewNodes = userNodeDatas.map((n) => toReactFlowNode(n, highlightedMainNodeId));
            const enrichedNodes = nodes.length ? shiftClusterRightOfExisting(nodes, rawNewNodes) : rawNewNodes;

            // 제안 노드 → SuggestionPanel
            if (suggestionNodeData) {
                const newSuggestion = {
                    id: `suggestion-${Date.now()}`,
                    title: suggestionNodeData.data.label,
                    content: suggestionNodeData.data.content,
                    category: suggestionNodeData.data.category,
                    phase: suggestionNodeData.data.phase,
                    relatedNodeId: highlightedMainNodeId,
                };
                setSuggestions((prev) => [newSuggestion, ...prev]);
                if (highlightedMainNodeId) {
                    setHighlightedNodeIds((prev) => new Set([...prev, highlightedMainNodeId]));
                }
            }

            // 엣지 처리 (e-suggest- 제외)
            const updatedExistingNodes = nodes.map((n) => ({
                ...n,
                className: highlightedNodeIds.has(n.id) ? 'node-highlighted' : (n.className || ''),
            }));
            const mergedNodes = [...updatedExistingNodes, ...enrichedNodes];
            const rawEdges = data.edges.filter((e) => !e.id.startsWith("e-suggest-"));
            const newReactFlowEdges = toConnectorEdges(rawEdges, mergedNodes, edges);

            setNodes(mergedNodes);
            setEdges((eds) => [...eds, ...newReactFlowEdges]);

        } catch (error) {
            console.error("Failed to analyze input:", error);
            const serverMsg =
                error?.response?.data?.error ||
                error?.response?.data?.detail ||
                error?.message;
            alert(serverMsg ? `AI Agent error: ${serverMsg}` : "AI Agent error. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="w-full h-screen relative flex flex-col overflow-hidden bg-slate-50">
            <TopBar />

            {showAdminShortcutHint && (
                <div className="pointer-events-auto absolute left-1/2 top-14 z-[80] -translate-x-1/2">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/78 px-4 py-2 text-xs text-slate-700 shadow-lg backdrop-blur-md">
                        <span>
                            Press <span className="font-semibold">{ADMIN_SHORTCUT_LABEL}</span> to toggle Admin Mode.
                        </span>
                        <button
                            type="button"
                            className="rounded-full border border-slate-300/80 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-white"
                            onClick={dismissAdminShortcutHint}
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            <header className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-end items-center bg-transparent pointer-events-none">
                <div className="flex gap-2 pointer-events-auto">
                    {isAdminMode && (
                        <div className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/76 px-3 py-2 text-xs text-slate-700 shadow-lg backdrop-blur-md">
                            <span className="rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white">
                                Admin Mode
                            </span>
                            <span className="inline-flex items-center gap-1.5 font-semibold text-indigo-800">
                                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                Autonomous Agent Active
                            </span>
                            <span className="text-slate-400">|</span>
                            <span>Nodes {nodes.length}</span>
                            <span>Suggestions {suggestions.length}</span>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 w-full h-full relative">
                {!hasThinkingGraph ? (
                    <div className="tm-canvas-bg h-full w-full" data-stage="research-diverge">
                        <div className="absolute inset-0 z-[5] flex items-center justify-center px-6">
                            <motion.div
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex w-full max-w-3xl flex-col items-center gap-6"
                            >
                                <div className="text-center">
                                    <div className="font-heading text-[44px] font-bold tracking-[-0.02em] text-white/90">
                                        Analyze your idea
                                    </div>
                                    <div className="mt-2 text-[14px] font-medium text-white/70">
                                        Start with a short message. We’ll turn it into connected nodes.
                                    </div>
                                </div>

                                <div className="relative h-[110px] w-[220px]">
                                    <div className="absolute left-1/2 top-1/2 h-[86px] w-[170px] -translate-x-1/2 -translate-y-1/2 rounded-[26px] border border-white/40 bg-white/20 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur-[10px]" />
                                    <div className="absolute left-1/2 top-1/2 h-[86px] w-[170px] -translate-x-[45%] -translate-y-[60%] rotate-[-6deg] rounded-[26px] border border-white/40 bg-white/18 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur-[10px]" />
                                    <div className="absolute left-1/2 top-1/2 h-[86px] w-[170px] -translate-x-[55%] -translate-y-[45%] rotate-[7deg] rounded-[26px] border border-white/40 bg-white/22 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur-[10px]" />
                                </div>
                            </motion.div>
                        </div>

                        <InputPanel onSubmit={handleInputSubmit} isAnalyzing={isAnalyzing} />
                    </div>
                ) : (
                    <>
                        <NodeMap
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={filteredOnNodesChange}
                            onEdgesChange={onEdgesChange}
                            highlightedNodeIds={highlightedNodeIds}
                            onNodeDragStart={handleNodeDragStart}
                            onNodeDrag={handleNodeDragUpdate}
                            onNodeDragStop={handleNodeDragStop}
                            onInit={handleFlowInit}
                            onSelectionChange={handleSelectionChange}
                            selectionBoxEnabled={selectionBoxEnabled}
                            draftHandlers={{
                                onPostitChangeText: handlePostitChangeText,
                                onImagePick: handleImagePick,
                                onImageChangeCaption: handleImageChangeCaption,
                                onDraftSubmit: handleDraftSubmit,
                            }}
                            draftSubmittingIds={draftSubmittingIds}
                        />

                        <LeftCanvasTools onAddPostit={createPostitDraft} onAddImage={createImageDraft} />
                    </>
                )}

                {showDraftConvertPrompt && (
                    <div className="pointer-events-none absolute inset-x-0 top-20 z-[75] flex justify-center">
                        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/70 bg-white/72 px-4 py-2 text-[12px] font-semibold text-slate-700 shadow-[0_12px_26px_rgba(0,0,0,0.14)] backdrop-blur-[12px]">
                            <span>
                                Convert {selectedDraftIds.length} drafts into nodes?
                            </span>
                            <button
                                type="button"
                                onClick={() => void convertDraftsToGroup(draftConvertIdsRef.current)}
                                className="inline-flex items-center justify-center rounded-full bg-teal-500 px-3 py-1 text-[12px] font-semibold text-white transition hover:bg-teal-600 disabled:opacity-55"
                                disabled={isAnalyzing}
                                aria-label="Confirm convert drafts"
                            >
                                ✓
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowDraftConvertPrompt(false)}
                                className="inline-flex items-center justify-center rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[12px] font-semibold text-slate-600 transition hover:bg-white/80"
                                aria-label="Cancel convert drafts"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* Legacy fallback suggestion panel (`?legacyChat=1`) */}
                {hasThinkingGraph && legacyChatFallbackEnabled && (
                    <SuggestionPanel
                        suggestions={suggestions}
                        onDismiss={handleDismissSuggestion}
                        onSuggestionClick={handleSuggestionClick}
                        activeSuggestionId={activeSuggestion?.id}
                        drawerOpen={isDrawerOpen}
                    />
                )}

                {hasThinkingGraph && (
                    <RightAgentDrawer
                        isOpen={isDrawerOpen}
                        mode={drawerMode}
                        suggestions={suggestions}
                        onToggleMode={handleDrawerModeToggle}
                        onClose={() => setIsDrawerOpen(false)}
                        activeSuggestion={activeSuggestion}
                        chatMessages={chatMessages}
                        chatInput={chatInput}
                        isChatLoading={isChatLoading}
                        isChatConverting={isChatConverting}
                        onChatInputChange={setChatInput}
                        onChatSubmit={handleDrawerChatSubmit}
                        onChatConvertToNodes={handleDrawerChatConvertToNodes}
                        onChatContextSelect={handleDrawerContextSelect}
                        attachedContext={
                            attachedNodes.length
                                ? {
                                    id: "attached-nodes",
                                    type: "attachedNodes",
                                    title: attachedNodes.length === 1 ? "Attached node" : `Attached nodes (${attachedNodes.length})`,
                                    content: "Use these nodes as the primary context for this chat.",
                                    category: "What",
                                    phase: "Problem",
                                    attached_nodes: attachedNodes,
                                }
                                : null
                        }
                        chatButtonRef={chatButtonRef}
                        chatDropZoneRef={chatDropZoneRef}
                        isChatDropActive={isChatDropActive}
                    />
                )}

                <AnimatePresence>
                    {ghostDrag && (
                        <motion.div
                            key="ghost-drag"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{
                                opacity: ghostDrag.phase === "dropping" ? 0 : 0.55,
                                scale: ghostDrag.phase === "dropping" ? 0.72 : 1,
                                x: (ghostDrag.phase === "dropping" ? ghostDrag.targetX : ghostDrag.x) - 90,
                                y: (ghostDrag.phase === "dropping" ? ghostDrag.targetY : ghostDrag.y) - 40,
                            }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", damping: 26, stiffness: 420 }}
                            className="pointer-events-none fixed left-0 top-0 z-[90]"
                            style={{ width: 180, height: 80 }}
                        >
                            <div
                                className="h-full w-full rounded-[26px] border border-white/70 bg-white/35 shadow-[0_16px_38px_rgba(0,0,0,0.14)] backdrop-blur-[10px]"
                                aria-hidden
                            >
                                <div className="flex h-full w-full items-center justify-center px-4 text-[12px] font-semibold text-slate-800/80">
                                    {ghostDrag.count > 1 ? `${ghostDrag.count} nodes` : "1 node"}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Legacy fallback chat dialog (`?legacyChat=1`) */}
                {hasThinkingGraph && legacyChatFallbackEnabled && activeSuggestion && (
                    <ChatDialog
                        suggestion={activeSuggestion}
                        onClose={() => setActiveSuggestion(null)}
                        onAddNodes={handleAddNodesFromChat}
                        existingNodes={nodes}
                    />
                )}

                {/* Idea input has moved into Post-it drafts (Left toolbar). */}
            </main>
        </div>
    );
}
