export type AlgorithmKey = "dijkstra" | "aStar";

export type GeoPoint = {
  lat: number;
  lng: number;
};

export type GraphNode = {
  id: number;
  name: string;
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

export type Dataset = {
  id: string;
  name: string;
  description: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  directed: boolean;
  defaultSource: number;
  defaultTarget: number;
};

export type DatasetSummary = {
  id: string;
  name: string;
  nodeCount: number;
  edgeCount: number;
  defaultSource: number;
  defaultTarget: number;
};

export type DatasetLoadSource = "backend" | "mock";
export type SolveResultSource = "backend" | "mock";

export type SolveRequest = {
  source: number;
  target: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  directed?: boolean;
};

export type RelaxedEdge = {
  from: number;
  to: number;
  cumulativeCost: number;
};

export type QueueEntry = {
  node: number;
  priority: number;
  cost: number;
  heuristic?: number;
};

export type NodeMetric = {
  node: number;
  status: "unvisited" | "queued" | "visited" | "current" | "path";
  distance?: number;
  previous?: number;
  gCost?: number;
  hCost?: number;
  fCost?: number;
};

export type AlgorithmTraceStep = {
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
  queue: QueueEntry[];
  nodes: NodeMetric[];
  message: string;
};

export type SolveResult = {
  path: number[];
  totalCost: number;
  runtimeMs: number;
  resultSource?: SolveResultSource;
  visitedOrder?: number[];
  relaxedEdges?: RelaxedEdge[];
  traceSteps?: AlgorithmTraceStep[];
};

export type SolverState = Partial<Record<AlgorithmKey, SolveResult>>;

export type ValidationIssue = {
  code: string;
  message: string;
  severity: "error" | "warning";
};

export type ComparisonRow = {
  algorithm: AlgorithmKey;
  name: string;
  path: number[];
  totalCost: number;
  runtimeMs: number;
  visitedCount: number;
  note: string;
  isBestCost: boolean;
  isFastest: boolean;
};

export type Coordinate = [number, number];

export type PathSegment = {
  stepIndex: number;
  from: number;
  to: number;
  fromCoordinate: Coordinate;
  toCoordinate: Coordinate;
  coordinates: Coordinate[];
  edgeCost: number;
  cumulativeCost: number;
};

export type RouteSegment = PathSegment;

export type RoutePlaybackSnapshot = {
  algorithm?: AlgorithmKey;
  segments: PathSegment[];
  segmentCount: number;
  activeStep: number;
  completedStepCount: number;
  segmentProgress: number;
  currentSegment?: PathSegment;
  movingPosition?: Coordinate;
  currentCost: number;
  isComplete: boolean;
  traceSteps?: AlgorithmTraceStep[];
  currentTraceStep?: AlgorithmTraceStep;
  completedTraceSteps: AlgorithmTraceStep[];
  isTraceMode: boolean;
};
