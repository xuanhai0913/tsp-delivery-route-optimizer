import type { AlgorithmKey, Dataset, RoutePlaybackSnapshot, SolverState } from "../types/path";
import { ALGORITHMS } from "../data/algorithms";

type GraphVisualizationProps = {
  dataset: Dataset;
  results: SolverState;
  visibleRoutes: Record<AlgorithmKey, boolean>;
  playback?: RoutePlaybackSnapshot;
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

function pathSegments(path: number[]) {
  return path.slice(0, -1).map((from, index) => ({
    from,
    to: path[index + 1],
    stepIndex: index,
  }));
}

export function GraphVisualization({ dataset, results, visibleRoutes, playback }: GraphVisualizationProps) {
  const routes = ALGORITHMS.map(({ key }) => ({
    key,
    result: results[key],
    visible: visibleRoutes[key],
  }));
  const currentTraceStep = playback?.currentTraceStep;
  const completedRelaxedKeys = new Set(
    playback?.completedTraceSteps
      .flatMap((step) => (step.relaxedEdge ? [`${step.relaxedEdge.from}-${step.relaxedEdge.to}`] : [])) ?? []
  );
  const currentRelaxedKey = currentTraceStep?.relaxedEdge
    ? `${currentTraceStep.relaxedEdge.from}-${currentTraceStep.relaxedEdge.to}`
    : undefined;
  const statusByNode = new Map(currentTraceStep?.nodes.map((node) => [node.node, node.status]) ?? []);
  const showFinalPath = !playback?.isTraceMode || playback.isComplete || currentTraceStep?.phase === "final-path";

  return (
    <div className="graph-canvas" role="img" aria-label="Graph trực quan shortest path">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#d9e3ee" strokeWidth="0.25" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />

        {dataset.edges.map((edge) => {
          const start = graphPositions[edge.from] ?? graphPositions[0];
          const end = graphPositions[edge.to] ?? graphPositions[0];
          const forwardKey = `${edge.from}-${edge.to}`;
          const reverseKey = `${edge.to}-${edge.from}`;
          const isCurrent = currentRelaxedKey === forwardKey || currentRelaxedKey === reverseKey;
          const isRelaxed = completedRelaxedKeys.has(forwardKey) || completedRelaxedKeys.has(reverseKey);
          return (
            <line
              key={edge.id}
              className={[
                "graph-base-edge",
                isRelaxed ? "relaxed" : "",
                isCurrent ? `current ${playback?.algorithm ?? ""}` : "",
              ].join(" ")}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
            />
          );
        })}

        {routes.map(({ key, result, visible }) =>
          result && visible
            ? pathSegments(result.path).map(({ from, to, stepIndex }) => {
                const start = graphPositions[from] ?? graphPositions[0];
                const end = graphPositions[to] ?? graphPositions[0];
                const isPlaybackRoute = playback?.algorithm === key;
                const hasPlaybackRoute = Boolean(playback?.algorithm);
                const playbackClass = isPlaybackRoute
                  ? playback?.isTraceMode
                    ? showFinalPath
                      ? "completed"
                      : "pending"
                    : stepIndex < playback.completedStepCount
                      ? "completed"
                      : stepIndex === playback.activeStep && !playback.isComplete
                        ? "current"
                        : "pending"
                  : hasPlaybackRoute
                    ? "context"
                    : "completed";

                return (
                  <line
                    key={`${key}-${from}-${to}-${stepIndex}`}
                    className={`graph-edge ${key} ${playbackClass}`}
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    pathLength="1"
                    style={{ animationDelay: `${stepIndex * 90}ms` }}
                  />
                );
              })
            : null
        )}

        {dataset.nodes.map((node, index) => {
          const position = graphPositions[index] ?? graphPositions[0];
          const activePath = playback?.algorithm ? results[playback.algorithm]?.path ?? [] : [];
          const visitIndex = activePath.findIndex((id) => id === node.id);
          const traceStatus = statusByNode.get(node.id);
          const isVisited =
            traceStatus === "visited" ||
            traceStatus === "path" ||
            (!playback?.isTraceMode && visitIndex >= 0 && visitIndex <= (playback?.completedStepCount ?? -1));
          const isCurrent = traceStatus === "current" || (playback?.currentSegment?.to === node.id && !playback.isComplete);

          return (
            <g
              key={node.id}
              className={[
                "graph-node",
                isVisited ? "visited" : "",
                isCurrent ? "current" : "",
                traceStatus === "queued" ? "queued" : "",
                traceStatus === "path" ? "path" : "",
              ].join(" ")}
            >
              <circle cx={position.x} cy={position.y} r="3.8" />
              <text x={position.x} y={position.y + 1.3} textAnchor="middle">
                {node.id}
              </text>
              {visitIndex >= 0 ? (
                <text className="graph-order" x={position.x + 4.7} y={position.y - 4.8}>
                  {visitIndex + 1}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <div className="graph-legend" aria-hidden="true">
        {ALGORITHMS.map(({ key, shortLabel }) => (
          <span key={key}>
            <i className={`legend-line ${key}`} /> {shortLabel}
          </span>
        ))}
      </div>
    </div>
  );
}
