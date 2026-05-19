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
