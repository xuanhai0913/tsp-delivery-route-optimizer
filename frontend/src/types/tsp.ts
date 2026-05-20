export type AlgorithmKey = "greedy" | "branchAndBound";

export type Location = {
  id: number;
  name: string;
  lat: number;
  lng: number;
};

export type Dataset = {
  id: string;
  name: string;
  description: string;
  locations: Location[];
  costMatrix: number[][];
};

export type SolveRequest = {
  start: number;
  costMatrix: number[][];
};

export type SolveResult = {
  route: number[];
  totalCost: number;
  runtimeMs: number;
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
  route: number[];
  totalCost: number;
  runtimeMs: number;
  note: string;
  isBestCost: boolean;
  isFastest: boolean;
};

export type Coordinate = [number, number];

export type RouteSegment = {
  stepIndex: number;
  from: number;
  to: number;
  fromCoordinate: Coordinate;
  toCoordinate: Coordinate;
  edgeCost: number;
  cumulativeCost: number;
};

export type RoutePlaybackSnapshot = {
  algorithm?: AlgorithmKey;
  segments: RouteSegment[];
  segmentCount: number;
  activeStep: number;
  completedStepCount: number;
  segmentProgress: number;
  currentSegment?: RouteSegment;
  movingPosition?: Coordinate;
  currentCost: number;
  isComplete: boolean;
};
