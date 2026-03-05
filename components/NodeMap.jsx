"use client";

import { useMemo } from "react";
import ReactFlow, {
    Background,
    Controls,
    ConnectionMode,
} from "reactflow";
import "reactflow/dist/style.css";
import ThinkingNode from "./nodes/ThinkingNode";
import PostitDraftNode from "./nodes/PostitDraftNode";
import ImageDraftNode from "./nodes/ImageDraftNode";
import IdeaGroupNode from "./nodes/IdeaGroupNode";
import ConnectorEdge from "./edges/ConnectorEdge";

export default function NodeMap({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    highlightedNodeIds,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
    onInit,
    onSelectionChange,
    selectionBoxEnabled = false,
    draftHandlers,
    draftSubmittingIds,
}) {
    const currentCanvasStage = "research-diverge";

    const nodeTypes = useMemo(
        () => ({
            thinkingNode: ThinkingNode,
            postitDraft: PostitDraftNode,
            imageDraft: ImageDraftNode,
            ideaGroup: IdeaGroupNode,
        }),
        []
    );
    const edgeTypes = useMemo(() => ({ connectorEdge: ConnectorEdge }), []);

    const portVisibilityByNode = useMemo(() => {
        const map = new Map();
        edges.forEach((edge) => {
            if (edge?.source) {
                const current = map.get(edge.source) || { hasLeftPort: false, hasRightPort: false };
                current.hasRightPort = true;
                map.set(edge.source, current);
            }
            if (edge?.target) {
                const current = map.get(edge.target) || { hasLeftPort: false, hasRightPort: false };
                current.hasLeftPort = true;
                map.set(edge.target, current);
            }
        });
        return map;
    }, [edges]);

    // highlightedNodeIds/연결 포트 상태 기반으로 노드 표시 상태를 항상 최신 유지
    const displayNodes = useMemo(() => {
        const hasHighlightSet = highlightedNodeIds instanceof Set;
        return nodes.map((n) => ({
            ...n,
            data: {
                ...n.data,
                hasLeftPort: portVisibilityByNode.get(n.id)?.hasLeftPort || false,
                hasRightPort: portVisibilityByNode.get(n.id)?.hasRightPort || false,
                ...(n.type === "postitDraft"
                    ? {
                        onChangeText: draftHandlers?.onPostitChangeText,
                        onSubmit: draftHandlers?.onDraftSubmit,
                        isSubmitting: Boolean(draftSubmittingIds?.has?.(n.id)),
                    }
                    : {}),
                ...(n.type === "imageDraft"
                    ? {
                        onPickImage: draftHandlers?.onImagePick,
                        onChangeCaption: draftHandlers?.onImageChangeCaption,
                        onSubmit: draftHandlers?.onDraftSubmit,
                        isSubmitting: Boolean(draftSubmittingIds?.has?.(n.id)),
                    }
                    : {}),
            },
            className: hasHighlightSet && highlightedNodeIds.has(n.id) ? 'node-highlighted' : (n.className || ''),
        }));
    }, [nodes, highlightedNodeIds, portVisibilityByNode, draftHandlers, draftSubmittingIds]);

    return (
        <div className="tm-canvas-bg h-full w-full" data-stage={currentCanvasStage}>
            <ReactFlow
                nodes={displayNodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeDragStart={onNodeDragStart}
                onNodeDrag={onNodeDrag}
                onNodeDragStop={onNodeDragStop}
                onInit={onInit}
                onSelectionChange={onSelectionChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionMode={ConnectionMode.Loose}
                fitView
                className="reactflow-canvas-pan tm-canvas-flow z-10"
                minZoom={0.2}
                // Default interaction: empty-space drag pan (touchpad friendly).
                // Hold Shift to enable box selection for drafts.
                panOnDrag={selectionBoxEnabled ? [1, 2] : true}
                selectionOnDrag={selectionBoxEnabled}
            >
                <Background gap={20} color="#FFFFFF4D" />
                <Controls className="bg-white/80 backdrop-blur-sm border-white/50 shadow-xl" />
            </ReactFlow>
        </div>
    );
}
