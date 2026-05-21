export type GraphNode = {
  id: number;
  name: string;
  lat: number;
  lng: number;
};

export type GeoPoint = {
  lat: number;
  lng: number;
};

export type GraphEdge = {
  id: string;
  from: number;
  to: number;
  weight: number;
  label?: string;
  geometry?: GeoPoint[];
};

export type PathSolveRequest = {
  source: number;
  target: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  directed?: boolean;
};

export type PathSolveResult = {
  path: number[];
  totalCost: number;
  runtimeMs: number;
  visitedOrder?: number[];
  relaxedEdges?: Array<{
    from: number;
    to: number;
    cumulativeCost: number;
  }>;
  traceSteps?: Array<{
    stepIndex: number;
    phase: "select-current" | "relax-edge" | "final-path";
    currentNode?: number;
    relaxedEdge?: {
      id?: string;
      from: number;
      to: number;
      weight: number;
      cumulativeCost: number;
    };
    queue: Array<{
      node: number;
      priority: number;
      cost: number;
      heuristic?: number;
    }>;
    nodes: Array<{
      node: number;
      status: "unvisited" | "queued" | "visited" | "current" | "path";
      distance?: number;
      previous?: number;
      gCost?: number;
      hCost?: number;
      fCost?: number;
    }>;
    message: string;
  }>;
};

export type PathDataset = {
  id: string;
  name: string;
  description?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  directed: boolean;
  defaultSource: number;
  defaultTarget: number;
};

export type Dataset = PathDataset;

export type DatasetSummary = {
  id: string;
  name: string;
  nodeCount: number;
  edgeCount: number;
  defaultSource: number;
  defaultTarget: number;
};

export type ValidationIssue = {
  code: string;
  message: string;
};
