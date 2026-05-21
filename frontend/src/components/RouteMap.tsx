import { useEffect, useMemo } from "react";
import { DivIcon, type LatLngBoundsExpression } from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { AlgorithmKey, Dataset, RoutePlaybackSnapshot, SolverState } from "../types/path";
import { edgeToCoordinates, findEdge, pathToCoordinates } from "../utils/route";
import { partialSegmentCoordinates, pathSegmentCoordinates } from "../utils/routeAnimation";

type RouteMapProps = {
  dataset: Dataset;
  results: SolverState;
  visibleRoutes: Record<AlgorithmKey, boolean>;
  source: number;
  target: number;
  playback?: RoutePlaybackSnapshot;
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
  visitOrder?: number
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
    html: `<span class="shipper-marker ${algorithm}"><span class="shipper-core">▶</span></span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function polylineOptions(algorithm: AlgorithmKey, variant: "context" | "completed" | "current") {
  const isDijkstra = algorithm === "dijkstra";
  const color = isDijkstra ? "#2563eb" : "#7c3aed";
  const baseDash = isDijkstra ? undefined : "9 7";

  if (variant === "context") {
    return {
      color,
      weight: 5,
      opacity: 0.24,
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

export default function RouteMap({ dataset, results, visibleRoutes, source, target, playback }: RouteMapProps) {
  const bounds = useMemo(
    () => dataset.nodes.map((node) => [node.lat, node.lng]) as LatLngBoundsExpression,
    [dataset.nodes]
  );

  const graphEdgeLines = useMemo(
    () => dataset.edges.map((edge) => edgeToCoordinates(edge, dataset.nodes, dataset.directed)).filter((line) => line.length >= 2),
    [dataset.directed, dataset.edges, dataset.nodes]
  );

  const pathLines = useMemo(
    () => ({
      dijkstra: results.dijkstra ? pathToCoordinates(results.dijkstra.path, dataset.nodes, dataset.edges, dataset.directed) : [],
      aStar: results.aStar ? pathToCoordinates(results.aStar.path, dataset.nodes, dataset.edges, dataset.directed) : [],
    }),
    [dataset.directed, dataset.edges, dataset.nodes, results.aStar, results.dijkstra]
  );

  const activePathLine = useMemo(
    () => pathSegmentCoordinates(playback?.segments ?? []),
    [playback?.segments]
  );
  const completedPathLine = useMemo(() => {
    if (!playback?.segments.length || playback.completedStepCount === 0 || playback.isTraceMode) {
      return [];
    }

    return pathSegmentCoordinates(playback.segments.slice(0, playback.completedStepCount));
  }, [playback?.completedStepCount, playback?.isTraceMode, playback?.segments]);
  const currentPathLine = useMemo(
    () =>
      playback?.currentSegment && playback.movingPosition
        ? partialSegmentCoordinates(playback.currentSegment, playback.segmentProgress)
        : [],
    [playback?.currentSegment, playback?.movingPosition, playback?.segmentProgress]
  );
  const completedRelaxedLines = useMemo(
    () =>
      playback?.completedTraceSteps.flatMap((step) => {
        if (!step.relaxedEdge) {
          return [];
        }
        const edge = findEdge(step.relaxedEdge.from, step.relaxedEdge.to, dataset.edges, dataset.directed);
        return edge ? [edgeToCoordinates(edge, dataset.nodes, dataset.directed, step.relaxedEdge.from, step.relaxedEdge.to)] : [];
      }) ?? [],
    [dataset.directed, dataset.edges, dataset.nodes, playback?.completedTraceSteps]
  );
  const activeRoute = playback?.algorithm;
  const activeResult = activeRoute ? results[activeRoute] : undefined;
  const activeVisitOrder = useMemo(() => {
    const visited = activeResult?.visitedOrder ?? activeResult?.path ?? [];
    return new Map(visited.map((id, index) => [id, index]));
  }, [activeResult?.path, activeResult?.visitedOrder]);
  const activeNodeStatus = useMemo(() => {
    const step = playback?.currentTraceStep ?? playback?.completedTraceSteps.at(-1);
    return new Map(step?.nodes.map((node) => [node.node, node.status]) ?? []);
  }, [playback?.completedTraceSteps, playback?.currentTraceStep]);
  const shouldShowFinalPath = !playback?.isTraceMode || playback.isComplete || playback.currentTraceStep?.phase === "final-path";

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

      {graphEdgeLines.map((line, index) => (
        <Polyline
          key={`edge-${index}`}
          positions={line}
          pathOptions={{
            color: "#64748b",
            weight: 2,
            opacity: 0.22,
            className: "map-graph-edge",
          }}
        />
      ))}

      {activeRoute && visibleRoutes[activeRoute]
        ? completedRelaxedLines.map((line, index) => (
            <Polyline
              key={`relaxed-${index}`}
              positions={line}
              pathOptions={{
                color: activeRoute === "dijkstra" ? "#2563eb" : "#0f766e",
                weight: 4.5,
                opacity: 0.36,
                dashArray: activeRoute === "dijkstra" ? "7 8" : "4 7",
                className: `map-relaxed-edge ${activeRoute}`,
              }}
            />
          ))
        : null}

      {(["dijkstra", "aStar"] as AlgorithmKey[]).map((algorithm) => {
        if (!visibleRoutes[algorithm]) {
          return null;
        }

        const routeLine = algorithm === "dijkstra" ? pathLines.dijkstra : pathLines.aStar;
        if (routeLine.length === 0) {
          return null;
        }

        const isActiveRoute = playback?.algorithm === algorithm;
        return (
          <Polyline
            key={`${algorithm}-context`}
            positions={isActiveRoute && activePathLine.length > 0 ? activePathLine : routeLine}
            pathOptions={polylineOptions(
              algorithm,
              (isActiveRoute && !shouldShowFinalPath) || activeRoute ? "context" : "completed"
            )}
          />
        );
      })}

      {activeRoute && visibleRoutes[activeRoute] && completedPathLine.length > 1 ? (
        <Polyline
          positions={completedPathLine}
          pathOptions={polylineOptions(activeRoute, "completed")}
        />
      ) : null}

      {activeRoute && visibleRoutes[activeRoute] && currentPathLine.length > 1 ? (
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

      {dataset.nodes.map((node) => {
        const visitOrder = activeVisitOrder.get(node.id);
        const traceStatus = activeNodeStatus.get(node.id);
        const isVisited =
          traceStatus === "visited" ||
          traceStatus === "path" ||
          (visitOrder !== undefined && !playback?.isTraceMode && visitOrder <= (playback?.completedStepCount ?? -1));
        const isCurrent = traceStatus === "current" || (playback?.currentSegment?.to === node.id && !playback.isComplete);
        const status = isCurrent ? "current" : isVisited ? "visited" : "default";
        const role = node.id === source ? "source" : node.id === target ? "target" : "default";

        return (
          <Marker
            key={node.id}
            position={[node.lat, node.lng]}
            icon={createMarkerIcon(
              node.id,
              role,
              status,
              visitOrder !== undefined ? visitOrder + 1 : undefined
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
