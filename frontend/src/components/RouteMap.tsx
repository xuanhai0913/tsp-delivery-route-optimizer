import { useEffect, useMemo } from "react";
import { DivIcon, type LatLngBoundsExpression } from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { AlgorithmKey, Dataset, SolverState } from "../types/tsp";
import { routeToCoordinates } from "../utils/route";

type RouteMapProps = {
  dataset: Dataset;
  results: SolverState;
  visibleRoutes: Record<AlgorithmKey, boolean>;
  start: number;
};

function FitBounds({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(bounds, { padding: [28, 28] });
  }, [bounds, map]);

  return null;
}

function createMarkerIcon(id: number, isStart: boolean) {
  return new DivIcon({
    className: "route-marker-wrapper",
    html: `<span class="route-marker ${isStart ? "start" : ""}">${id}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export default function RouteMap({ dataset, results, visibleRoutes, start }: RouteMapProps) {
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

      {visibleRoutes.greedy && routeLines.greedy.length > 0 ? (
        <Polyline
          positions={routeLines.greedy}
          pathOptions={{ color: "#c96f1d", weight: 5, opacity: 0.82, dashArray: "8 8" }}
        />
      ) : null}

      {visibleRoutes.branchAndBound && routeLines.branchAndBound.length > 0 ? (
        <Polyline
          positions={routeLines.branchAndBound}
          pathOptions={{ color: "#00796b", weight: 5, opacity: 0.86 }}
        />
      ) : null}

      {dataset.locations.map((location) => (
        <Marker
          key={location.id}
          position={[location.lat, location.lng]}
          icon={createMarkerIcon(location.id, location.id === start)}
        >
          <Popup>
            <strong>{location.name}</strong>
            <br />
            ID {location.id}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
