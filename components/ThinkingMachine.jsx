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

function Chip({ label }) {
    const backgroundColor = CHIP_BG_COLORS[label] || "#E5E7EB";
    return (
        <span
            className="inline-flex items-center justify-center gap-2.5 rounded-[99px] px-2 py-1.5 text-[12px] font-semibold leading-none text-[#111111]"
            style={{ backgroundColor }}
        >
            {label}
        </span>
    );
}

// 노드 데이터에서 JSX label 빌드 (재사용)
function buildNodeLabel(nodeData) {
    return (
        <div className="flex h-full w-full flex-col items-start gap-3 px-3 pb-3 pt-4 text-left">
            <div className="line-clamp-2 text-sm font-bold leading-[1.3] text-[#333333]">
                {nodeData.title}
            </div>
            <div className="line-clamp-3 text-[12px] leading-[1.45] text-[#666666]">
                {nodeData.label}
            </div>
            <div className="flex items-center gap-2">
                <Chip label={nodeData.category} />
                <Chip label={nodeData.phase} />
            </div>
        </div>
    );
}

function buildNodeStyle(phase) {
    return {
        background: phase === "Problem" ? "rgba(243, 244, 246, 0.96)" : "rgba(248, 250, 252, 0.96)",
        border: "1px solid rgba(17, 24, 39, 0.08)",
        borderRadius: "24px",
        padding: '0',
        width: 232,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: "0 8px 20px -10px rgb(0 0 0 / 0.25)",
        backdropFilter: 'blur(8px)',
    };
}

function buildEdgeStyle(edgeId) {
    if (edgeId.startsWith('e-cross-')) {
        return { style: { stroke: '#8b5cf6', strokeWidth: 2.5 }, animated: false };
    }
    if (edgeId.startsWith('e-input-') || edgeId.startsWith('e-chat-')) {
        return { style: { stroke: '#6366f1', strokeDasharray: '4 3', strokeWidth: 1.5 }, animated: false };
    }
    return { style: { stroke: '#94a3b8' }, animated: true };
}

function toReactFlowNode(n, highlightedId) {
    const nodeData = {
        title: n.data.label,
        label: n.data.content,
        phase: n.data.phase,
        category: n.data.category,
        is_ai_suggestion: false,
    };
    const rfNode = {
        id: n.id,
        type: n.type || 'default',
        position: n.position,
        className: n.id === highlightedId ? 'node-highlighted' : '',
        data: { ...nodeData },
        style: buildNodeStyle(n.data.phase),
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
        const newEdges = data.edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            label: e.label,
            type: 'smoothstep',
            ...buildEdgeStyle(e.id),
        }));

        const newNodes = data.nodes.map((n) => toReactFlowNode(n, null));

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
            const newReactFlowEdges = data.edges
                .filter((e) => !e.id.startsWith("e-suggest-"))
                .map((e) => ({
                    id: e.id,
                    source: e.source,
                    target: e.target,
                    label: e.label,
                    type: 'smoothstep',
                    ...buildEdgeStyle(e.id),
                }));

            setNodes((nds) => {
                // 기존 하이라이트된 노드의 className 갱신
                const updated = nds.map((n) => ({
                    ...n,
                    className: highlightedNodeIds.has(n.id) ? 'node-highlighted' : (n.className || ''),
                }));
                return [...updated, ...enrichedNodes];
            });
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
