import type { Edge, Node } from "@xyflow/react";

export interface GraphNodeData {
  label: string;
  compromised?: boolean;
  node_type?: string;
  defended?: boolean;
  threat_level?: string;
  [key: string]: unknown;
}

export interface GraphData {
  nodes: Array<Node<GraphNodeData>>;
  edges: Array<Edge>;
}

export interface ReconData {
  tech_stack: string[];
  subdomains: string[];
}

export interface ScanResult {
  id: string;
  target_url: string;
  score: string;
  score_percentage: number;
  vulnerabilities: Array<{ name: string; severity: string; fix_snippet: string }>;
  recon_data?: ReconData;
  graph_data: GraphData;
  mermaid_syntax: string;
  ai_remediation?: string;
}
