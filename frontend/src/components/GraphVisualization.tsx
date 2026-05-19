import type { AlgorithmKey, Dataset, SolverState } from "../types/tsp";

type GraphVisualizationProps = {
  dataset: Dataset;
  results: SolverState;
  visibleRoutes: Record<AlgorithmKey, boolean>;
};

const graphPositions = [
  { x: 20, y: 58 },
  { x: 38, y: 20 },
  { x: 48, y: 70 },
  { x: 78, y: 32 },
  { x: 58, y: 10 },
  { x: 68, y: 84 },
  { x: 38, y: 92 },
];

function routeSegments(route: number[]) {
  return route.slice(0, -1).map((from, index) => [from, route[index + 1]] as const);
}

export function GraphVisualization({ dataset, results, visibleRoutes }: GraphVisualizationProps) {
  const routes = [
    { key: "greedy" as const, result: results.greedy, visible: visibleRoutes.greedy },
    {
      key: "branchAndBound" as const,
      result: results.branchAndBound,
      visible: visibleRoutes.branchAndBound,
    },
  ];

  return (
    <div className="graph-canvas" role="img" aria-label="Graph trực quan lộ trình">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#d9e3ee" strokeWidth="0.25" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />

        {routes.map(({ key, result, visible }) =>
          result && visible
            ? routeSegments(result.route).map(([from, to], index) => {
                const start = graphPositions[from];
                const end = graphPositions[to];
                return (
                  <line
                    key={`${key}-${from}-${to}-${index}`}
                    className={`graph-edge ${key}`}
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    pathLength="1"
                    style={{ animationDelay: `${index * 90}ms` }}
                  />
                );
              })
            : null
        )}

        {dataset.locations.map((location, index) => {
          const position = graphPositions[index] ?? graphPositions[0];
          return (
            <g key={location.id} className="graph-node">
              <circle cx={position.x} cy={position.y} r="3.8" />
              <text x={position.x} y={position.y + 1.3} textAnchor="middle">
                {location.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
