"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    useNodesState,
    useEdgesState,
} from "reactflow";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import NodeMap from "./NodeMap";
import InputPanel from "./InputPanel";
import SuggestionPanel from "./SuggestionPanel";
import ChatDialog from "./ChatDialog";
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
    return Number.isFinite(x) ? Number(x) : 0;
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
            if (isNodeDraggingRef.current && Array.isArray(changes)) {
                const next = changes.filter((c) => c?.type !== "position");
                baseOnNodesChange(next);
                return;
            }
            baseOnNodesChange(changes);
        };
    }, [baseOnNodesChange]);

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
            if (movedEnough) {
                didShowGhostRef.current = true;
                setGhostDrag((prev) => {
                    if (prev?.phase === "dropping") return prev;
                    return { x: pt.x, y: pt.y, count, phase: "dragging" };
                });
            }
        }

        // 원본 노드 위치 유지: 드래그 중에는 저장된 원점으로 계속 복원 (RAF로 부하 제한)
        const origin = dragOriginRef.current;
        if (origin?.positions && origin?.ids?.length && !restoreRafRef.current) {
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
        const newNodes = data.nodes.map((n) => toReactFlowNode(n, null));
        const mergedNodes = [...nodes, ...newNodes];
        const newEdges = toConnectorEdges(data.edges, mergedNodes, edges);

        setNodes((nds) => [...nds, ...newNodes]);
        setEdges((eds) => [...eds, ...newEdges]);
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
            const enrichedNodes = userNodeDatas.map((n) => toReactFlowNode(n, highlightedMainNodeId));

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
                <NodeMap
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={filteredOnNodesChange}
                    onEdgesChange={onEdgesChange}
                    highlightedNodeIds={highlightedNodeIds}
                    onNodeDragStart={handleNodeDragStart}
                    onNodeDrag={handleNodeDragUpdate}
                    onNodeDragStop={handleNodeDragStop}
                />

                {/* Legacy fallback suggestion panel (`?legacyChat=1`) */}
                {legacyChatFallbackEnabled && (
                    <SuggestionPanel
                        suggestions={suggestions}
                        onDismiss={handleDismissSuggestion}
                        onSuggestionClick={handleSuggestionClick}
                        activeSuggestionId={activeSuggestion?.id}
                        drawerOpen={isDrawerOpen}
                    />
                )}

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
                {legacyChatFallbackEnabled && activeSuggestion && (
                    <ChatDialog
                        suggestion={activeSuggestion}
                        onClose={() => setActiveSuggestion(null)}
                        onAddNodes={handleAddNodesFromChat}
                        existingNodes={nodes}
                    />
                )}

                <InputPanel onSubmit={handleInputSubmit} isAnalyzing={isAnalyzing} />
            </main>
        </div>
    );
}
