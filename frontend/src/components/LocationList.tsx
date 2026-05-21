import type { GraphNode } from "../types/path";

type LocationListProps = {
  nodes: GraphNode[];
  source: number;
  target: number;
};

export function LocationList({ nodes, source, target }: LocationListProps) {
  return (
    <div className="panel location-list-panel">
      <div className="section-title-inline">
        <span className="mini-icon" aria-hidden="true">
          ⬢
        </span>
        <h2>Graph nodes</h2>
      </div>
      <div className="location-table-wrap">
        <table className="location-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên node</th>
              <th>Vai trò</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => (
              <tr key={node.id} className={node.id === source || node.id === target ? "start-row" : ""}>
                <td>{node.id}</td>
                <td>{node.name}</td>
                <td>
                  {node.id === source ? "Nguồn" : node.id === target ? "Đích" : "Trung gian"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
