import type { Location } from "../types/tsp";

type RouteChipListProps = {
  route: number[];
  locations: Location[];
  tone: "greedy" | "branch";
  activeStep?: number;
  isPlaybackTarget?: boolean;
};

export function RouteChipList({
  route,
  locations,
  tone,
  activeStep,
  isPlaybackTarget = false,
}: RouteChipListProps) {
  const locationNames = new Map(locations.map((location) => [location.id, location.name]));
  const currentNodeIndex =
    activeStep === undefined ? -1 : Math.min(activeStep + 1, route.length - 1);

  return (
    <div className="route-chip-list" aria-label="Lộ trình">
      {route.map((id, index) => {
        const isVisited = isPlaybackTarget && activeStep !== undefined && index <= activeStep;
        const isCurrent = isPlaybackTarget && index === currentNodeIndex;

        return (
          <span className="route-chip-wrap" key={`${id}-${index}`}>
            <span
              className={[
                "route-chip",
                tone,
                isVisited ? "visited" : "",
                isCurrent ? "active" : "",
              ].join(" ")}
              title={locationNames.get(id)}
            >
              {id}
            </span>
            {index < route.length - 1 ? <span className="route-arrow">→</span> : null}
          </span>
        );
      })}
    </div>
  );
}
