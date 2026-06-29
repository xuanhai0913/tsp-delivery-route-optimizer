import { useEffect, useMemo } from "react";
import { DivIcon, type LatLngBoundsExpression } from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet/dist/leaflet.css";
import type {
  AlgorithmKey,
  Coordinate,
  Dataset,
  RoadScenario,
  RoutePlaybackSnapshot,
  SolverState,
} from "../types/path";
import { ALGORITHM_KEYS, getAlgorithmColor } from "../data/algorithms";
import { edgeToCoordinates, findEdge, pathToCoordinates } from "../utils/route";
import {
  partialSegmentCoordinates,
  pathSegmentCoordinates,
} from "../utils/routeAnimation";

type RouteMapProps = {
  dataset: Dataset;
  baseDataset?: Dataset;
  results: SolverState;
  visibleRoutes: Record<AlgorithmKey, boolean>;
  source: number;
  target: number;
  playback?: RoutePlaybackSnapshot;
  roadScenario?: RoadScenario;
  affectedEdgeIds?: string[];
  blockedEdgeIds?: string[];
};

function FitBounds({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(bounds, { padding: [28, 28] });
  }, [bounds, map]);

  return null;
}

function createMarkerIcon(
  id: number,
  role: "source" | "target" | "default",
  status: "default" | "visited" | "current",
  visitOrder?: number,
) {
  return new DivIcon({
    className: "route-marker-wrapper",
    html: `<span class="route-marker ${role} ${status}">${id}${
      visitOrder !== undefined ? `<small>${visitOrder}</small>` : ""
    }</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function createScoutIcon(algorithm: AlgorithmKey) {
  return new DivIcon({
    className: "shipper-marker-wrapper",
    html: `<span class="shipper-marker ${algorithm}"><span class="shipper-core">➤</span></span>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

function createBlockedIcon() {
  return new DivIcon({
    className: "blocked-road-marker-wrapper",
    html: `<span class="blocked-road-marker">×</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function polylineOptions(
  algorithm: AlgorithmKey,
  variant: "context" | "completed" | "current",
) {
  const color = getAlgorithmColor(algorithm);
  const isDijkstra = algorithm === "dijkstra";
  const baseDash = isDijkstra ? undefined : algorithm === "aStar" ? "9 7" : "2 9";

  if (variant === "context") {
    return {
      color,
      weight: 5,
      opacity: 0.9,
      dashArray: baseDash,
      className: `map-route ${algorithm} context`,
    };
  }

  if (variant === "completed") {
    return {
      color,
      weight: 6.5,
      opacity: 0.9,
      dashArray: baseDash,
      className: `map-route ${algorithm} completed`,
    };
  }

  return {
    color,
    weight: 7.5,
    opacity: 1,
    dashArray: isDijkstra ? undefined : "4 7",
    className: `map-route ${algorithm} current`,
  };
}

function midpoint(line: Coordinate[]): Coordinate | undefined {
  return line.length > 0 ? line[Math.floor(line.length / 2)] : undefined;
}

export default function RouteMap({
  dataset,
  baseDataset,
  results,
  visibleRoutes,
  source,
  target,
  playback,
  roadScenario,
  affectedEdgeIds = [],
  blockedEdgeIds = [],
}: RouteMapProps) {
  const roadDataset = baseDataset ?? dataset;
  const affectedEdgeSet = useMemo(
    () => new Set(affectedEdgeIds),
    [affectedEdgeIds],
  );
  const blockedEdgeSet = useMemo(
    () => new Set(blockedEdgeIds),
    [blockedEdgeIds],
  );
  const bounds = useMemo(
    () =>
      dataset.nodes.map((node) => [
        node.lat,
        node.lng,
      ]) as LatLngBoundsExpression,
    [dataset.nodes],
  );

  const graphEdgeLines = useMemo(
    () =>
      roadDataset.edges
        .map((edge) => ({
          id: edge.id,
          line: edgeToCoordinates(
            edge,
            roadDataset.nodes,
            roadDataset.directed,
          ),
        }))
        .filter((item) => item.line.length >= 2),
    [roadDataset.directed, roadDataset.edges, roadDataset.nodes],
  );
  const affectedEdgeLines = useMemo(
    () =>
      graphEdgeLines.filter(
        (item) => affectedEdgeSet.has(item.id) && !blockedEdgeSet.has(item.id),
      ),
    [affectedEdgeSet, blockedEdgeSet, graphEdgeLines],
  );
  const blockedEdgeLines = useMemo(
    () => graphEdgeLines.filter((item) => blockedEdgeSet.has(item.id)),
    [blockedEdgeSet, graphEdgeLines],
  );

  const pathLines = useMemo(
    () =>
      ALGORITHM_KEYS.reduce(
        (accumulator, key) => {
          const result = results[key];
          accumulator[key] = result
            ? pathToCoordinates(result.path, dataset.nodes, dataset.edges, dataset.directed)
            : [];
          return accumulator;
        },
        {} as Record<AlgorithmKey, Coordinate[]>
      ),
    [dataset.directed, dataset.edges, dataset.nodes, results]
  );

  const activePathLine = useMemo(
    () => pathSegmentCoordinates(playback?.segments ?? []),
    [playback?.segments],
  );
  const completedPathLine = useMemo(() => {
    if (
      !playback?.segments.length ||
      playback.completedStepCount === 0 ||
      playback.isTraceMode
    ) {
      return [];
    }

    return pathSegmentCoordinates(
      playback.segments.slice(0, playback.completedStepCount),
    );
  }, [playback?.completedStepCount, playback?.isTraceMode, playback?.segments]);
  const currentPathLine = useMemo(
    () =>
      playback?.currentSegment && playback.movingPosition
        ? partialSegmentCoordinates(
            playback.currentSegment,
            playback.segmentProgress,
          )
        : [],
    [
      playback?.currentSegment,
      playback?.movingPosition,
      playback?.segmentProgress,
    ],
  );
  const completedRelaxedLines = useMemo(
    () =>
      playback?.completedTraceSteps.flatMap((step) => {
        if (!step.relaxedEdge) {
          return [];
        }
        const edge = findEdge(
          step.relaxedEdge.from,
          step.relaxedEdge.to,
          dataset.edges,
          dataset.directed,
        );
        return edge
          ? [
              edgeToCoordinates(
                edge,
                dataset.nodes,
                dataset.directed,
                step.relaxedEdge.from,
                step.relaxedEdge.to,
              ),
            ]
          : [];
      }) ?? [],
    [
      dataset.directed,
      dataset.edges,
      dataset.nodes,
      playback?.completedTraceSteps,
    ],
  );
  const activeRoute = playback?.algorithm;
  const activeResult = activeRoute ? results[activeRoute] : undefined;
  const activeVisitOrder = useMemo(() => {
    const visited = activeResult?.visitedOrder ?? activeResult?.path ?? [];
    return new Map(visited.map((id, index) => [id, index]));
  }, [activeResult?.path, activeResult?.visitedOrder]);
  const activeNodeStatus = useMemo(() => {
    const step =
      playback?.currentTraceStep ?? playback?.completedTraceSteps.at(-1);
    return new Map(step?.nodes.map((node) => [node.node, node.status]) ?? []);
  }, [playback?.completedTraceSteps, playback?.currentTraceStep]);
  const shouldShowFinalPath =
    !playback?.isTraceMode ||
    playback.isComplete ||
    playback.currentTraceStep?.phase === "final-path";

  const center = dataset.nodes[0];

  return (
    <MapContainer
      className="leaflet-map"
      center={[center.lat, center.lng]}
      zoom={13}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        crossOrigin="anonymous"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds bounds={bounds} />

      {graphEdgeLines.map(({ id, line }) => (
        <Polyline
          key={`edge-${id}`}
          positions={line}
          pathOptions={{
            color: "#64748b",
            weight: 2.2,
            opacity: blockedEdgeSet.has(id) ? 0.08 : 0.16,
            className: "map-graph-edge",
          }}
        />
      ))}

      {affectedEdgeLines.map(({ id, line }) => (
        <Polyline
          key={`traffic-${id}`}
          positions={line}
          pathOptions={{
            color: roadScenario?.key === "rain" ? "#0ea5e9" : "#f97316",
            weight: 8,
            opacity: roadScenario?.key === "rain" ? 0.28 : 0.62,
            dashArray: roadScenario?.key === "rain" ? "3 10" : "12 9",
            className: `map-traffic-edge ${roadScenario?.key ?? "normal"}`,
          }}
        />
      ))}

      {blockedEdgeLines.map(({ id, line }) => (
        <Polyline
          key={`blocked-${id}`}
          positions={line}
          pathOptions={{
            color: "#dc2626",
            weight: 9,
            opacity: 0.86,
            dashArray: "2 10",
            className: "map-blocked-edge",
          }}
        />
      ))}

      {activeRoute && visibleRoutes[activeRoute]
        ? completedRelaxedLines.map((line, index) => (
            <Polyline
              key={`relaxed-${index}`}
              positions={line}
              pathOptions={{
                color: getAlgorithmColor(activeRoute),
                weight: 4.5,
                opacity: 0.36,
                dashArray: activeRoute === "dijkstra" ? "7 8" : "4 7",
                className: `map-relaxed-edge ${activeRoute}`,
              }}
            />
          ))
        : null}

      {ALGORITHM_KEYS.map((algorithm) => {
        if (!visibleRoutes[algorithm]) {
          return null;
        }

        const routeLine = pathLines[algorithm];
        if (routeLine.length === 0) {
          return null;
        }

        const isActiveRoute = playback?.algorithm === algorithm;
        return (
          <Polyline
            key={`${algorithm}-context`}
            positions={
              isActiveRoute && activePathLine.length > 0
                ? activePathLine
                : routeLine
            }
            pathOptions={polylineOptions(
              algorithm,
              (isActiveRoute && !shouldShowFinalPath) || activeRoute
                ? "context"
                : "completed",
            )}
          />
        );
      })}

      {activeRoute &&
      visibleRoutes[activeRoute] &&
      completedPathLine.length > 1 ? (
        <Polyline
          positions={completedPathLine}
          pathOptions={polylineOptions(activeRoute, "completed")}
        />
      ) : null}

      {activeRoute &&
      visibleRoutes[activeRoute] &&
      currentPathLine.length > 1 ? (
        <Polyline
          positions={currentPathLine}
          pathOptions={polylineOptions(activeRoute, "current")}
        />
      ) : null}

      {activeRoute && visibleRoutes[activeRoute] && playback?.movingPosition ? (
        <Marker
          position={playback.movingPosition}
          icon={createScoutIcon(activeRoute)}
          zIndexOffset={900}
        />
      ) : null}

      {blockedEdgeLines.map(({ id, line }) => {
        const markerPosition = midpoint(line);
        return markerPosition ? (
          <Marker
            key={`blocked-marker-${id}`}
            position={markerPosition}
            icon={createBlockedIcon()}
            zIndexOffset={860}
          />
        ) : null;
      })}

      {dataset.nodes.map((node) => {
        const visitOrder = activeVisitOrder.get(node.id);
        const traceStatus = activeNodeStatus.get(node.id);
        const isVisited =
          traceStatus === "visited" ||
          traceStatus === "path" ||
          (visitOrder !== undefined &&
            !playback?.isTraceMode &&
            visitOrder <= (playback?.completedStepCount ?? -1));
        const isCurrent =
          traceStatus === "current" ||
          (playback?.currentSegment?.to === node.id && !playback.isComplete);
        const status = isCurrent
          ? "current"
          : isVisited
            ? "visited"
            : "default";
        const role =
          node.id === source
            ? "source"
            : node.id === target
              ? "target"
              : "default";

        return (
          <Marker
            key={node.id}
            position={[node.lat, node.lng]}
            icon={createMarkerIcon(
              node.id,
              role,
              status,
              visitOrder !== undefined ? visitOrder + 1 : undefined,
            )}
          >
            <Popup>
              <strong>{node.name}</strong>
              <br />
              Node {node.id}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
