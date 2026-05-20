import { useEffect, useMemo } from "react";
import { DivIcon, type LatLngBoundsExpression } from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { AlgorithmKey, Dataset, RoutePlaybackSnapshot, SolverState } from "../types/tsp";
import { routeToCoordinates } from "../utils/route";
import { routeSegmentCoordinates } from "../utils/routeAnimation";

type RouteMapProps = {
  dataset: Dataset;
  results: SolverState;
  visibleRoutes: Record<AlgorithmKey, boolean>;
  start: number;
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
  isStart: boolean,
  status: "default" | "visited" | "current",
  visitOrder?: number
) {
  return new DivIcon({
    className: "route-marker-wrapper",
    html: `<span class="route-marker ${isStart ? "start" : ""} ${status}">${id}${
      visitOrder !== undefined ? `<small>${visitOrder}</small>` : ""
    }</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function createShipperIcon(algorithm: AlgorithmKey) {
  return new DivIcon({
    className: "shipper-marker-wrapper",
    html: `<span class="shipper-marker ${algorithm}"><span class="shipper-core">▶</span></span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function polylineOptions(algorithm: AlgorithmKey, variant: "context" | "completed" | "current") {
  const isGreedy = algorithm === "greedy";
  const color = isGreedy ? "#c96f1d" : "#00796b";
  const baseDash = isGreedy ? "10 9" : undefined;

  if (variant === "context") {
    return {
      color,
      weight: isGreedy ? 5 : 5.5,
      opacity: 0.26,
      dashArray: baseDash,
      className: `map-route ${algorithm} context`,
    };
  }

  if (variant === "completed") {
    return {
      color,
      weight: isGreedy ? 6 : 6.5,
      opacity: 0.9,
      dashArray: baseDash,
      className: `map-route ${algorithm} completed`,
    };
  }

  return {
    color,
    weight: isGreedy ? 7 : 7.5,
    opacity: 1,
    dashArray: isGreedy ? "4 7" : undefined,
    className: `map-route ${algorithm} current`,
  };
}

export default function RouteMap({ dataset, results, visibleRoutes, start, playback }: RouteMapProps) {
  const bounds = useMemo(
    () => dataset.locations.map((location) => [location.lat, location.lng]) as LatLngBoundsExpression,
    [dataset.locations]
  );

  const routeLines = useMemo(
    () => ({
      greedy: results.greedy ? routeToCoordinates(results.greedy.route, dataset.locations) : [],
      branchAndBound: results.branchAndBound
        ? routeToCoordinates(results.branchAndBound.route, dataset.locations)
        : [],
    }),
    [dataset.locations, results.branchAndBound, results.greedy]
  );

  const activeRouteLine = useMemo(
    () => routeSegmentCoordinates(playback?.segments ?? []),
    [playback?.segments]
  );
  const completedRouteLine = useMemo(() => {
    if (!playback?.segments.length || playback.completedStepCount === 0) {
      return [];
    }

    return [
      playback.segments[0].fromCoordinate,
      ...playback.segments
        .slice(0, playback.completedStepCount)
        .map((segment) => segment.toCoordinate),
    ];
  }, [playback?.completedStepCount, playback?.segments]);
  const currentRouteLine = useMemo(
    () =>
      playback?.currentSegment && playback.movingPosition
        ? [playback.currentSegment.fromCoordinate, playback.movingPosition]
        : [],
    [playback?.currentSegment, playback?.movingPosition]
  );
  const activeRoute = playback?.algorithm;
  const activeResult = activeRoute ? results[activeRoute] : undefined;
  const activeVisitOrder = useMemo(() => {
    const route = activeResult?.route ?? [];
    return new Map(route.slice(0, -1).map((id, index) => [id, index]));
  }, [activeResult?.route]);

  const center = dataset.locations[0];

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

      {(["greedy", "branchAndBound"] as AlgorithmKey[]).map((algorithm) => {
        if (!visibleRoutes[algorithm]) {
          return null;
        }

        const routeLine = algorithm === "greedy" ? routeLines.greedy : routeLines.branchAndBound;
        if (routeLine.length === 0) {
          return null;
        }

        const isActiveRoute = playback?.algorithm === algorithm;
        return (
          <Polyline
            key={`${algorithm}-context`}
            positions={isActiveRoute && activeRouteLine.length > 0 ? activeRouteLine : routeLine}
            pathOptions={polylineOptions(
              algorithm,
              isActiveRoute || activeRoute ? "context" : "completed"
            )}
          />
        );
      })}

      {activeRoute && visibleRoutes[activeRoute] && completedRouteLine.length > 1 ? (
        <Polyline
          positions={completedRouteLine}
          pathOptions={polylineOptions(activeRoute, "completed")}
        />
      ) : null}

      {activeRoute && visibleRoutes[activeRoute] && currentRouteLine.length > 1 ? (
        <Polyline
          positions={currentRouteLine}
          pathOptions={polylineOptions(activeRoute, "current")}
        />
      ) : null}

      {activeRoute && visibleRoutes[activeRoute] && playback?.movingPosition ? (
        <Marker
          position={playback.movingPosition}
          icon={createShipperIcon(activeRoute)}
          zIndexOffset={900}
        />
      ) : null}

      {dataset.locations.map((location) => {
        const visitOrder = activeVisitOrder.get(location.id);
        const isVisited =
          visitOrder !== undefined && visitOrder <= (playback?.completedStepCount ?? -1);
        const isCurrent = playback?.currentSegment?.to === location.id && !playback.isComplete;
        const status = isCurrent ? "current" : isVisited ? "visited" : "default";

        return (
          <Marker
            key={location.id}
            position={[location.lat, location.lng]}
            icon={createMarkerIcon(
              location.id,
              location.id === start,
              status,
              visitOrder !== undefined ? visitOrder + 1 : undefined
            )}
          >
            <Popup>
              <strong>{location.name}</strong>
              <br />
              ID {location.id}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
