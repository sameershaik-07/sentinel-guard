"use client";

import { useMemo, useCallback, useEffect, useState } from "react";
import type { ElementType } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { Server, Database, Key, ShieldCheck, Globe } from "lucide-react";

// --- Custom Node Implementation ---
interface SecurityNodeData {
  label: string;
  compromised?: boolean;
  node_type?: string;
  defended?: boolean;
  threat_level?: string;
  [key: string]: unknown;
}

interface GraphData {
  nodes: Array<Node<SecurityNodeData>>;
  edges: Array<Edge>;
}

const iconMap: Record<string, ElementType> = {
  Internet: Globe,
  Firewall: ShieldCheck,
  LoadBalancer: Server,
  AppServerA: Server,
  AppServerB: Server,
  Database: Database,
  Identity: Key
};

function CustomSecurityNode({ data, id }: { data: SecurityNodeData; id: string }) {
  const Icon = iconMap[id] || Server;
  const isCompromised = data.compromised;
  const isWarning = data.node_type === "warning";
  const isDefended = data.defended;
  
  let borderColor = "rgba(6, 182, 212, 0.4)"; // secure
  let iconColor = "var(--cyan-400)";
  if (isCompromised) {
    borderColor = "rgba(239, 68, 68, 0.6)"; // red
    iconColor = "var(--red-400)";
  } else if (isWarning) {
    borderColor = "rgba(249, 115, 22, 0.6)"; // orange
    iconColor = "var(--orange-400)";
  } else if (isDefended) {
    borderColor = "rgba(34, 197, 94, 0.8)"; // strong green
    iconColor = "var(--green-400)";
  }

  const hasThreat = data.threat_level === "High" || data.threat_level === "Medium";

  return (
    <div
      className="glass-card shadow-lg flex flex-col items-center justify-center p-3 text-center relative"
      style={{
        width: 140,
        height: 80,
        border: `1px solid ${borderColor}`,
        boxShadow: `0 0 15px ${borderColor.replace('0.6', '0.1').replace('0.4', '0.1')}`,
        background: "rgba(0, 0, 0, 0.6)"
      }}
    >
      {hasThreat && (
        <div className="absolute -top-2 -right-2 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border border-black shadow"></span>
        </div>
      )}
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Icon className="w-6 h-6 mb-2" style={{ color: iconColor }} />
      <div className="text-xs font-semibold text-gray-200 leading-tight">
        {data.label}
      </div>
      {data.threat_level && data.threat_level !== "None" && data.threat_level !== "Unknown" && (
        <div className="text-[9px] text-red-400 mt-1 uppercase tracking-widest font-bold">
          Intel: {data.threat_level}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

const nodeTypes = {
  customSecurityNode: CustomSecurityNode,
};

// --- Tree Layout ---
const getLayoutedElements = (nodes: Array<Node<SecurityNodeData>>, edges: Array<Edge>) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 150, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 140, height: 80 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = Position.Top;
    node.sourcePosition = Position.Bottom;
    node.position = {
      x: nodeWithPosition.x - 70,
      y: nodeWithPosition.y - 40,
    };
  });

  return { nodes, edges };
};

export default function ReactAttackMap({ graphData }: { graphData: GraphData }) {
  if (!graphData || !graphData.nodes || !graphData.edges) return null;
  return <ReactAttackMapInner graphData={graphData} />;
}

function ReactAttackMapInner({ graphData }: { graphData: GraphData }) {
  // Add markerEnd to edges for sleek arrows
  const mappedEdges = useMemo(
    () => graphData.edges.map((e) => ({
      ...e,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
        color: e.style?.stroke || "#3b82f6",
      },
    })),
    [graphData.edges]
  );

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(graphData.nodes, mappedEdges),
    [graphData.nodes, mappedEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);
  const [isExpanded, setIsExpanded] = useState(false);

  // --- BLAST RADIUS LOGIC ---
  const handleNodeClick = useCallback((_: unknown, node: Node<SecurityNodeData>) => {
    // If the node is completely secure with no vulnerabilities, it cannot be breached
    if (node.data.node_type === "secure" && !node.data.compromised) {
      setNodes(nodes.map(n => n.id === node.id ? { ...n, data: { ...n.data, defended: true } } : n));
      return;
    }

    // 1. Mark clicked node as Compromised (Red)
    const newNodes = nodes.map(n => {
      if (n.id === node.id) {
        return { ...n, data: { ...n.data, compromised: true, node_type: "critical" } };
      }
      return n;
    });

    // 2. Find all Outbound neighbors recursively
    const findExposedNeighbors = (startId: string, visited = new Set<string>()) => {
      visited.add(startId);
      edges.forEach(e => {
        if (e.source === startId && !visited.has(e.target)) {
          visited.add(e.target);
          findExposedNeighbors(e.target, visited);
        }
      });
      return visited;
    };

    const blastRadius = findExposedNeighbors(node.id);
    blastRadius.delete(node.id); // don't count the originally clicked one

    // 3. Mark neighbors as "warning" (Orange)
    const finalNodes = newNodes.map(n => {
      if (blastRadius.has(n.id) && !n.data.compromised) {
        return { ...n, data: { ...n.data, node_type: "warning" } };
      }
      return n;
    });

    // 4. Highlight path edges connecting to blast radius
    const finalEdges = edges.map(e => {
      if (e.source === node.id || blastRadius.has(e.source)) {
         return {
           ...e,
           animated: true,
           style: { ...e.style, stroke: "#f97316", strokeWidth: 2 }, // orange stroke
           markerEnd: {
             type: MarkerType.ArrowClosed,
             width: 15,
             height: 15,
             color: "#f97316",
           }
         };
      }
      return e;
    });

    setNodes(finalNodes);
    setEdges(finalEdges);
  }, [nodes, edges, setNodes, setEdges]);

  useEffect(() => {
    if (!isExpanded) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExpanded(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isExpanded]);

  return (
    <>
      <div className="glass-card mt-8 flex flex-col h-125 rounded-xl overflow-hidden relative">
        <div className="relative shrink-0 px-5 py-3 z-10 border-b border-white/5 bg-[#01030a]/50 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-cyan-400/80">Interactive Attack Surface</h3>
            <p className="text-[10px] text-gray-500/80 mt-1">Click a vulnerable node to simulate a breach. Secure nodes will block attacks.</p>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-colors bg-cyan-500/10 text-cyan-300 border border-cyan-400/20 hover:bg-cyan-500/15"
            aria-label="Expand interactive attack surface to full page"
          >
            <span className="text-sm leading-none">⤢</span>
            Expand
          </button>
        </div>

        <div className="flex-1 min-h-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#222" gap={16} />
            <Controls showInteractive={false} className="opacity-60 hover:opacity-100" />
          </ReactFlow>
        </div>
      </div>

      {isExpanded && (
        <div
          className="fixed inset-0 z-80 flex flex-col bg-[#01030a]/98 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Interactive Attack Surface expanded view"
        >
          <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 border-b border-white/10 bg-[#01030a]/90 shrink-0">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-cyan-400/80">Interactive Attack Surface</h3>
              <p className="text-[10px] text-gray-500/80 mt-1">Expanded view. Click a vulnerable node to simulate a breach. Press Esc to close.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-colors bg-rose-500/10 text-rose-300 border border-rose-400/20 hover:bg-rose-500/15"
              aria-label="Close expanded interactive attack surface"
            >
              <span className="text-sm leading-none">×</span>
              Close
            </button>
          </div>

          <div className="flex-1 min-h-0 p-3 sm:p-5 lg:p-6">
            <div className="h-full rounded-xl overflow-hidden border border-white/10 bg-[#02050d] shadow-[0_0_60px_rgba(6,182,212,0.08)]">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                nodeTypes={nodeTypes}
                fitView
                proOptions={{ hideAttribution: true }}
              >
                <Background color="#222" gap={16} />
                <Controls showInteractive={false} className="opacity-60 hover:opacity-100" />
              </ReactFlow>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
