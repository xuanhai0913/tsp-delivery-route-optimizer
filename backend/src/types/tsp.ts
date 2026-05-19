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

export type ValidationIssue = {
  code: string;
  message: string;
};
