import { useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { ValidationMessage } from "../components/ValidationMessage";
import type { Dataset } from "../types/path";
import { validateDataset } from "../utils/validation";

type DataPageProps = {
  dataset: Dataset;
  onApplyDataset: (dataset: Dataset) => void;
};

export function DataPage({ dataset, onApplyDataset }: DataPageProps) {
  const [draft, setDraft] = useState<Dataset>(dataset);
  const [draftSource, setDraftSource] = useState(dataset.defaultSource);
  const [draftTarget, setDraftTarget] = useState(dataset.defaultTarget);
  const issues = useMemo(() => validateDataset(draft, draftSource, draftTarget), [draft, draftSource, draftTarget]);

  const updateNode = (index: number, field: "name" | "lat" | "lng", value: string) => {
    setDraft((current) => ({
      ...current,
      nodes: current.nodes.map((node, nodeIndex) =>
        nodeIndex === index
          ? {
              ...node,
              [field]: field === "name" ? value : Number(value),
            }
          : node
      ),
    }));
  };

  const updateEdge = (index: number, field: "from" | "to" | "weight" | "label", value: string) => {
    setDraft((current) => ({
      ...current,
      edges: current.edges.map((edge, edgeIndex) =>
        edgeIndex === index
          ? {
              ...edge,
              [field]: field === "label" ? value : Number(value),
            }
          : edge
      ),
    }));
  };

  const addNode = () => {
    setDraft((current) => {
      const nextId = Math.max(...current.nodes.map((node) => node.id)) + 1;
      return {
        ...current,
        nodes: [
          ...current.nodes,
          {
            id: nextId,
            name: `Node mới ${nextId}`,
            lat: current.nodes[0]?.lat ?? 10.7769,
            lng: current.nodes[0]?.lng ?? 106.7009,
          },
        ],
      };
    });
  };

  const removeNode = (index: number) => {
    setDraft((current) => {
      if (current.nodes.length <= 4) {
        return current;
      }

      const removedId = current.nodes[index].id;
      return {
        ...current,
        nodes: current.nodes.filter((_, nodeIndex) => nodeIndex !== index),
        edges: current.edges.filter((edge) => edge.from !== removedId && edge.to !== removedId),
      };
    });
  };

  const addEdge = () => {
    setDraft((current) => {
      const from = current.nodes[0]?.id ?? 0;
      const to = current.nodes[1]?.id ?? from;
      const id = `e${from}-${to}-${current.edges.length + 1}`;
      return {
        ...current,
        edges: [...current.edges, { id, from, to, weight: 3, label: "New edge" }],
      };
    });
  };

  const removeEdge = (index: number) => {
    setDraft((current) => ({
      ...current,
      edges: current.edges.filter((_, edgeIndex) => edgeIndex !== index),
    }));
  };

  const applyDraft = () => {
    onApplyDataset({
      ...draft,
      defaultSource: draftSource,
      defaultTarget: draftTarget,
    });
  };

  return (
    <div className="page-stack page-enter">
      <div className="page-header-row">
        <div>
          <h1>Nhập dữ liệu graph</h1>
          <p>Chỉnh sửa nodes, weighted edges, nguồn và đích cho bài toán shortest path.</p>
        </div>
        <div className="header-actions">
          <button className="secondary-button" type="button" onClick={() => setDraft(dataset)}>
            Khôi phục
          </button>
          <button className="solid-button" type="button" onClick={applyDraft}>
            <Save size={17} />
            Dùng graph này
          </button>
        </div>
      </div>

      <ValidationMessage issues={issues} />

      <div className="panel source-target-panel">
        <label className="field-label" htmlFor="draft-source">
          Nguồn mặc định
        </label>
        <select id="draft-source" value={draftSource} onChange={(event) => setDraftSource(Number(event.target.value))}>
          {draft.nodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.id} - {node.name}
            </option>
          ))}
        </select>
        <label className="field-label" htmlFor="draft-target">
          Đích mặc định
        </label>
        <select id="draft-target" value={draftTarget} onChange={(event) => setDraftTarget(Number(event.target.value))}>
          {draft.nodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.id} - {node.name}
            </option>
          ))}
        </select>
      </div>

      <div className="data-editor-grid">
        <section className="panel editor-panel">
          <div className="panel-heading">
            <h2>Nodes</h2>
            <button className="secondary-button compact-button" type="button" onClick={addNode}>
              <Plus size={17} />
              Thêm node
            </button>
          </div>

          <div className="editor-table-wrap">
            <table className="editor-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên node</th>
                  <th>Vĩ độ</th>
                  <th>Kinh độ</th>
                  <th aria-label="Xóa" />
                </tr>
              </thead>
              <tbody>
                {draft.nodes.map((node, index) => (
                  <tr key={node.id}>
                    <td>{node.id}</td>
                    <td>
                      <input value={node.name} onChange={(event) => updateNode(index, "name", event.target.value)} />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={node.lat}
                        step="0.0001"
                        onChange={(event) => updateNode(index, "lat", event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={node.lng}
                        step="0.0001"
                        onChange={(event) => updateNode(index, "lng", event.target.value)}
                      />
                    </td>
                    <td>
                      <button className="icon-button subtle" type="button" onClick={() => removeNode(index)}>
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel editor-panel">
          <div className="panel-heading">
            <h2>Weighted edges</h2>
            <button className="secondary-button compact-button" type="button" onClick={addEdge}>
              <Plus size={17} />
              Thêm cạnh
            </button>
          </div>

          <div className="editor-table-wrap">
            <table className="editor-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Weight</th>
                  <th>Geometry</th>
                  <th>Label</th>
                  <th aria-label="Xóa" />
                </tr>
              </thead>
              <tbody>
                {draft.edges.map((edge, index) => (
                  <tr key={`${edge.id}-${index}`}>
                    <td>{edge.id}</td>
                    <td>
                      <input type="number" value={edge.from} onChange={(event) => updateEdge(index, "from", event.target.value)} />
                    </td>
                    <td>
                      <input type="number" value={edge.to} onChange={(event) => updateEdge(index, "to", event.target.value)} />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={edge.weight}
                        step="0.1"
                        onChange={(event) => updateEdge(index, "weight", event.target.value)}
                      />
                    </td>
                    <td>{edge.geometry?.length ?? 2} pts</td>
                    <td>
                      <input value={edge.label ?? ""} onChange={(event) => updateEdge(index, "label", event.target.value)} />
                    </td>
                    <td>
                      <button className="icon-button subtle" type="button" onClick={() => removeEdge(index)}>
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="muted-note">
            Graph demo đang là vô hướng. Geometry là optional; nếu không có, bản đồ sẽ fallback về line thẳng giữa hai node.
          </p>
        </section>
      </div>
    </div>
  );
}
