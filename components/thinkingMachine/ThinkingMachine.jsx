"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    useNodesState,
    useEdgesState,
} from "reactflow";
import { AnimatePresence, motion } from "framer-motion";
import NodeMap from "./NodeMap";
import LeftCanvasTools from "./LeftCanvasTools";
import SuggestionPanel from "./SuggestionPanel";
import ChatDialog from "./ChatDialog";
import InputPanel from "./InputPanel";
import RightAgentDrawer from "./RightAgentDrawer";
import TopBar from "./TopBar";
import { toConnectorEdges } from "@/lib/thinkingMachine/connectorEdges";
import { toReactFlowNode } from "@/lib/thinkingMachine/reactflowTransforms";
import { computeNodeBounds, shiftClusterRightOfExisting } from "@/lib/thinkingMachine/graphMerge";
import { analyze } from "@/lib/thinkingMachine/apiClient";
import { useAdminMode } from "@/components/thinkingMachine/hooks/useAdminMode";
import { useLegacyChatFallback } from "@/components/thinkingMachine/hooks/useLegacyChatFallback";
import { useDrawerChat } from "@/components/thinkingMachine/hooks/useDrawerChat";
import { useDraftGrouping } from "@/components/thinkingMachine/hooks/useDraftGrouping";
import { useGhostDragToChat } from "@/components/thinkingMachine/hooks/useGhostDragToChat";

const INITIAL_NODES = [];
const INITIAL_EDGES = [];
const ADMIN_MODE_STORAGE_KEY = "vtm-admin-mode-enabled";
const ADMIN_HINT_DISMISSED_KEY = "vtm-admin-shortcut-hint-dismissed";
const ADMIN_SHORTCUT_LABEL = "Ctrl/Cmd + Shift + A";
const LEGACY_CHAT_QUERY_KEY = "legacyChat";

export default function ThinkingMachine() {
    const [nodes, setNodes, baseOnNodesChange] = useNodesState(INITIAL_NODES);
    const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState("chat");

    const { isAdminMode, showAdminShortcutHint, dismissAdminShortcutHint } = useAdminMode({
        storageKey: ADMIN_MODE_STORAGE_KEY,
        hintDismissedKey: ADMIN_HINT_DISMISSED_KEY,
    });
    const legacyChatFallbackEnabled = useLegacyChatFallback(LEGACY_CHAT_QUERY_KEY);

    // AI 제안 패널
    const [suggestions, setSuggestions] = useState([]);
    const [highlightedNodeIds, setHighlightedNodeIds] = useState(new Set());

    // Chat state (Drawer Chat primary + optional legacy dialog fallback)
    const [attachedNodes, setAttachedNodes] = useState([]); // [{id,title,content,category,phase}]
    const reactFlowRef = useRef(null);

    const {
        activeSuggestion,
        setActiveSuggestion,
        chatMessages,
        chatInput,
        setChatInput,
        isChatLoading,
        isChatConverting,
        handleSuggestionClick,
        handleDrawerModeToggle,
        handleDrawerChatSubmit,
        handleDrawerChatConvertToNodes,
        handleDrawerContextSelect,
        resetChat,
    } = useDrawerChat({
        legacyChatFallbackEnabled,
        suggestions,
        nodes,
        onAddNodesFromChat: handleAddNodesFromChat,
        isDrawerOpen,
        setIsDrawerOpen,
        drawerMode,
        setDrawerMode,
    });

    const {
        selectedDraftIds,
        showDraftConvertPrompt,
        setShowDraftConvertPrompt,
        draftConvertIdsRef,
        selectionBoxEnabled,
        draftSubmittingIds,
        createPostitDraft,
        createImageDraft,
        handlePostitChangeText,
        handleImageChangeCaption,
        handleImagePick,
        handleDraftSubmit,
        handleSelectionChange,
        convertDraftsToGroup,
    } = useDraftGrouping({
        nodes,
        edges,
        setNodes,
        setEdges,
        isAnalyzing,
        setIsAnalyzing,
        setSuggestions,
        reactFlowRef,
    });

    const {
        isChatDropActive,
        ghostDrag,
        chatButtonRef,
        chatDropZoneRef,
        filteredOnNodesChange,
        handleNodeDragStart,
        handleNodeDragUpdate,
        handleNodeDragStop,
    } = useGhostDragToChat({
        nodes,
        setNodes,
        baseOnNodesChange,
        setAttachedNodes,
        setActiveSuggestion,
        setDrawerMode,
        setIsDrawerOpen,
    });

    const hasThinkingGraph = useMemo(() => {
        return nodes.some((n) => n?.type === "thinkingNode" || n?.type === "ideaGroup");
    }, [nodes]);

    const handleFlowInit = (instance) => {
        reactFlowRef.current = instance;
    };

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
                        resetChat();
                    }
                }
            }
            return nextSuggestions;
        });
    };

    // 채팅 대화에서 노드+엣지 추가
    function handleAddNodesFromChat(data) {
        const incoming = Array.isArray(data?.nodes) ? data.nodes : [];
        const incomingEdges = Array.isArray(data?.edges) ? data.edges : [];
        setNodes((prevNodes) => {
            const rawNewNodes = incoming.map((n) => toReactFlowNode(n, null));
            const newNodes = shiftClusterRightOfExisting(prevNodes, rawNewNodes);
            const mergedNodes = [...prevNodes, ...newNodes];
            setEdges((prevEdges) => [...prevEdges, ...toConnectorEdges(incomingEdges, mergedNodes, prevEdges)]);
            return mergedNodes;
        });
    }

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

            const data = await analyze(payload);

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
