"use client";

import { useEffect, useState } from "react";
import {
    useNodesState,
    useEdgesState,
} from "reactflow";
import axios from "axios";
import NodeMap from "./NodeMap";
import InputPanel from "./InputPanel";
import SuggestionPanel from "./SuggestionPanel";
import ChatDialog from "./ChatDialog";
import RightAgentDrawer from "./RightAgentDrawer";

const INITIAL_NODES = [];
const INITIAL_EDGES = [];
const SOURCE_HANDLE_ID = "right-source";
const TARGET_HANDLE_ID = "left-target";
const FANOUT_STEP = 26;
const FANOUT_MAX = 104;
const EDGE_CLEARANCE_X = 20;
const EDGE_LINE_WIDTH = 4;
const EDGE_LINE_COLOR = "#FFFFFF";
const EDGE_CORNER_RADIUS = 24;
const EDGE_LANE_GAP = 80;
const ADMIN_MODE_STORAGE_KEY = "vtm-admin-mode-enabled";
const ADMIN_HINT_DISMISSED_KEY = "vtm-admin-shortcut-hint-dismissed";
const ADMIN_SHORTCUT_LABEL = "Ctrl/Cmd + Shift + A";

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
                {nodeData.label}
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
        label: n.data.content,
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
    rfNode.data.label = buildNodeLabel(nodeData);
    return rfNode;
}

export default function ThinkingMachine() {
    const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
    const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [showAdminShortcutHint, setShowAdminShortcutHint] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState("chat");

    // AI 제안 패널
    const [suggestions, setSuggestions] = useState([]);
    const [highlightedNodeIds, setHighlightedNodeIds] = useState(new Set());

    // Chat dialog
    const [activeSuggestion, setActiveSuggestion] = useState(null);

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
            if (dismissed) {
                setHighlightedNodeIds((ids) => {
                    const next = new Set(ids);
                    next.delete(dismissed.relatedNodeId);
                    return next;
                });
                // 열려있는 채팅창이 dismiss된 카드와 같으면 닫기
                if (activeSuggestion?.id === suggestionId) {
                    setActiveSuggestion(null);
                }
            }
            return prev.filter((s) => s.id !== suggestionId);
        });
    };

    const handleSuggestionClick = (suggestion) => {
        // Legacy chat fallback should remain available during drawer phase 1.
        setIsDrawerOpen(false);
        // 같은 카드 다시 클릭 시 토글
        if (activeSuggestion?.id === suggestion.id) {
            setActiveSuggestion(null);
        } else {
            setActiveSuggestion(suggestion);
        }
    };

    const handleDrawerModeToggle = (nextMode) => {
        if (isDrawerOpen && drawerMode === nextMode) {
            setIsDrawerOpen(false);
            return;
        }
        setActiveSuggestion(null);
        setDrawerMode(nextMode);
        setIsDrawerOpen(true);
    };

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
            {showAdminShortcutHint && (
                <div className="pointer-events-auto absolute left-1/2 top-4 z-[80] -translate-x-1/2">
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
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    highlightedNodeIds={highlightedNodeIds}
                />

                {/* AI 제안 우측 패널 */}
                <SuggestionPanel
                    suggestions={suggestions}
                    onDismiss={handleDismissSuggestion}
                    onSuggestionClick={handleSuggestionClick}
                    activeSuggestionId={activeSuggestion?.id}
                    drawerOpen={isDrawerOpen}
                />

                <RightAgentDrawer
                    isOpen={isDrawerOpen}
                    mode={drawerMode}
                    suggestions={suggestions}
                    onToggleMode={handleDrawerModeToggle}
                />

                {/* AI 채팅 대화창 */}
                {activeSuggestion && (
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
