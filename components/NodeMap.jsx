"use client";

import { useMemo } from "react";
import ReactFlow, {
    Background,
    Controls,
    ConnectionMode,
} from "reactflow";
import "reactflow/dist/style.css";
import ThinkingNode from "./nodes/ThinkingNode";
import ConnectorEdge from "./edges/ConnectorEdge";

export default function NodeMap({ nodes, edges, onNodesChange, onEdgesChange, highlightedNodeIds }) {

    const nodeTypes = useMemo(() => ({ thinkingNode: ThinkingNode }), []);
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
            },
            className: hasHighlightSet && highlightedNodeIds.has(n.id) ? 'node-highlighted' : (n.className || ''),
        }));
    }, [nodes, highlightedNodeIds, portVisibilityByNode]);

    return (
        <div className="w-full h-full bg-slate-50">
            {/* Background Visuals for Double Diamond */}
            <div className="absolute inset-0 pointer-events-none z-0 flex">
                <div className="w-1/2 h-full bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-r border-indigo-100/50 p-8">
                    <h2 className="text-4xl font-bold text-indigo-900/10 tracking-widest uppercase">Problem</h2>
                    <p className="text-indigo-900/10">Research Focus</p>
                </div>
                <div className="w-1/2 h-full bg-gradient-to-bl from-purple-50/50 to-pink-50/50 p-8 text-right">
                    <h2 className="text-4xl font-bold text-purple-900/10 tracking-widest uppercase">Solution</h2>
                    <p className="text-purple-900/10">Design Focus</p>
                </div>
            </div>

            <ReactFlow
                nodes={displayNodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionMode={ConnectionMode.Loose}
                fitView
                className="z-10 reactflow-canvas-pan"
                minZoom={0.2}
                panOnDrag={true}
                selectionOnDrag={false}
            >
                <Background gap={20} color="#f1f5f9" />
                <Controls className="bg-white/80 backdrop-blur-sm border-white/50 shadow-xl" />
            </ReactFlow>
        </div>
    );
}
