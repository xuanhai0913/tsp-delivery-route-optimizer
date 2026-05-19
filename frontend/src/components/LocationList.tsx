import type { Location } from "../types/tsp";

type LocationListProps = {
  locations: Location[];
  start: number;
};

export function LocationList({ locations, start }: LocationListProps) {
  return (
    <div className="location-list">
      <div className="table-title">Danh sách địa điểm</div>
      <div className="location-table-wrap">
        <table className="location-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên địa điểm</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((location) => (
              <tr key={location.id} className={location.id === start ? "selected" : ""}>
                <td>{location.id}</td>
                <td>{location.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
