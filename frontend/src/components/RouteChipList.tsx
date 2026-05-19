import type { Location } from "../types/tsp";

type RouteChipListProps = {
  route: number[];
  locations: Location[];
  tone: "greedy" | "branch";
};

export function RouteChipList({ route, locations, tone }: RouteChipListProps) {
  const locationNames = new Map(locations.map((location) => [location.id, location.name]));

  return (
    <div className="route-chip-list" aria-label="Lộ trình">
      {route.map((id, index) => (
        <span className="route-chip-wrap" key={`${id}-${index}`}>
          <span className={`route-chip ${tone}`} title={locationNames.get(id)}>
            {id}
          </span>
          {index < route.length - 1 ? <span className="route-arrow">→</span> : null}
        </span>
      ))}
    </div>
  );
}
