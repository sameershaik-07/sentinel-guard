"use client";

import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Handle,
  Position,
  MarkerType
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { Server, Database, Key, ShieldCheck, Globe } from "lucide-react";

// --- Custom Node Implementation ---
const iconMap: any = {
  Internet: Globe,
  Firewall: ShieldCheck,
  LoadBalancer: Server,
  AppServerA: Server,
  AppServerB: Server,
  Database: Database,
  Identity: Key
};

function CustomSecurityNode({ data, id }: any) {
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
const getLayoutedElements = (nodes: any[], edges: any[]) => {
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

export default function ReactAttackMap({ graphData }: { graphData: any }) {
  if (!graphData || !graphData.nodes || !graphData.edges) return null;
  return <ReactAttackMapInner graphData={graphData} />;
}

function ReactAttackMapInner({ graphData }: { graphData: any }) {
  // Add markerEnd to edges for sleek arrows
  const mappedEdges = graphData.edges.map((e: any) => ({
    ...e,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: e.style?.stroke || "#3b82f6",
    },
  }));

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(graphData.nodes, mappedEdges),
    [graphData]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // --- BLAST RADIUS LOGIC ---
  const handleNodeClick = useCallback((event: any, node: any) => {
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
           markerEnd: { ...e.markerEnd, color: "#f97316" }
         };
      }
      return e;
    });

    setNodes(finalNodes);
    setEdges(finalEdges);
  }, [nodes, edges, setNodes, setEdges]);

  return (
    <div className="glass-card mt-8 flex flex-col h-[500px] rounded-xl overflow-hidden relative">
      <div className="relative flex-shrink-0 px-5 py-3 z-10 border-b border-white/5 bg-[#01030a]/50">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-cyan-400/80">Interactive Attack Surface</h3>
        <p className="text-[10px] text-gray-500/80 mt-1">Click a vulnerable node to simulate a breach. Secure nodes will block attacks.</p>
      </div>

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
  );
}
