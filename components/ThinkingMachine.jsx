"use client";

import { useState } from "react";
import {
    useNodesState,
    useEdgesState,
} from "reactflow";
import axios from "axios";
import NodeMap from "./NodeMap";
import InputPanel from "./InputPanel";
import SuggestionPanel from "./SuggestionPanel";
import ChatDialog from "./ChatDialog";

const INITIAL_NODES = [];
const INITIAL_EDGES = [];
const SOURCE_HANDLE_ID = "right-source";
const TARGET_HANDLE_ID = "left-target";
const FANOUT_PATTERN = [0, -6, 6, -12, 12];
const EDGE_CLEARANCE_X = 20;
const EDGE_LINE_WIDTH = 4;
const EDGE_LINE_COLOR = "#FFFFFF";

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
        overflow: 'hidden',
        boxShadow: "0 8px 24px -12px rgb(0 0 0 / 0.22)",
    };
}

function getFanoutOffset(index) {
    if (!Number.isFinite(index) || index < 0) return 0;
    return FANOUT_PATTERN[index % FANOUT_PATTERN.length];
}

function seedEdgeSideCounts(counts, currentEdges) {
    currentEdges.forEach((edge) => {
        const sourceHandle = edge.sourceHandle || SOURCE_HANDLE_ID;
        const targetHandle = edge.targetHandle || TARGET_HANDLE_ID;
        const sourceKey = `${edge.source}:${sourceHandle}`;
        const targetKey = `${edge.target}:${targetHandle}`;
        counts.set(sourceKey, (counts.get(sourceKey) || 0) + 1);
        counts.set(targetKey, (counts.get(targetKey) || 0) + 1);
    });
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

function toConnectorEdges(rawEdges, nodeList, currentEdges = []) {
    const counts = new Map();
    const categoryMap = buildNodeCategoryMap(nodeList);
    seedEdgeSideCounts(counts, currentEdges);

    return rawEdges.map((edge) => {
        const sourceHandle = SOURCE_HANDLE_ID;
        const targetHandle = TARGET_HANDLE_ID;
        const sourceKey = `${edge.source}:${sourceHandle}`;
        const targetKey = `${edge.target}:${targetHandle}`;

        const sourceIndex = counts.get(sourceKey) || 0;
        const targetIndex = counts.get(targetKey) || 0;
        counts.set(sourceKey, sourceIndex + 1);
        counts.set(targetKey, targetIndex + 1);

        return {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: edge.label,
            type: "connectorEdge",
            animated: false,
            sourceHandle,
            targetHandle,
            data: {
                sourceCategory: categoryMap.get(edge.source) || "What",
                targetCategory: categoryMap.get(edge.target) || "What",
                sourceOffsetY: getFanoutOffset(sourceIndex),
                targetOffsetY: getFanoutOffset(targetIndex),
                clearanceX: EDGE_CLEARANCE_X,
                lineWidth: EDGE_LINE_WIDTH,
                lineColor: EDGE_LINE_COLOR,
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

    // AI 제안 패널
    const [suggestions, setSuggestions] = useState([]);
    const [highlightedNodeIds, setHighlightedNodeIds] = useState(new Set());

    // Chat dialog
    const [activeSuggestion, setActiveSuggestion] = useState(null);

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
        // 같은 카드 다시 클릭 시 토글
        if (activeSuggestion?.id === suggestion.id) {
            setActiveSuggestion(null);
        } else {
            setActiveSuggestion(suggestion);
        }
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
            <header className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center bg-transparent pointer-events-none">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 pointer-events-auto">
                    Visual Thinking Machine
                </h1>
                <div className="flex gap-2 pointer-events-auto">
                    <div className="px-3 py-1 rounded-full bg-white/50 border border-indigo-100 text-xs text-indigo-800 backdrop-blur-sm shadow-sm flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        Autonomous Agent Active
                    </div>
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
