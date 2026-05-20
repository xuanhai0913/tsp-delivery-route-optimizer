export type SolveRequest = {
  start: number;
  costMatrix: number[][];
};

export type SolveResult = {
  route: number[];
  totalCost: number;
  runtimeMs: number;
};

export type Location = {
  id: number;
  name: string;
  lat?: number;
  lng?: number;
};

export type Dataset = {
  id: string;
  name: string;
  locations: Location[];
  costMatrix: number[][];
  defaultStart: number;
};

export type DatasetSummary = {
  id: string;
  name: string;
  locationCount: number;
  defaultStart: number;
};

export type ValidationIssue = {
  code: string;
  message: string;
};
