import { useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { ValidationMessage } from "../components/ValidationMessage";
import type { Dataset } from "../types/tsp";
import { validateDataset } from "../utils/validation";

type DataPageProps = {
  dataset: Dataset;
  onApplyDataset: (dataset: Dataset) => void;
};

export function DataPage({ dataset, onApplyDataset }: DataPageProps) {
  const [draft, setDraft] = useState<Dataset>(dataset);
  const issues = useMemo(() => validateDataset(draft, 0), [draft]);

  const updateLocation = (index: number, field: "name" | "lat" | "lng", value: string) => {
    setDraft((current) => ({
      ...current,
      locations: current.locations.map((location, locationIndex) =>
        locationIndex === index
          ? {
              ...location,
              [field]: field === "name" ? value : Number(value),
            }
          : location
      ),
    }));
  };

  const updateMatrixCell = (rowIndex: number, columnIndex: number, value: string) => {
    setDraft((current) => ({
      ...current,
      costMatrix: current.costMatrix.map((row, currentRowIndex) =>
        currentRowIndex === rowIndex
          ? row.map((cell, currentColumnIndex) =>
              currentColumnIndex === columnIndex ? Number(value) : cell
            )
          : row
      ),
    }));
  };

  const addLocation = () => {
    setDraft((current) => {
      const nextId = current.locations.length;
      const nextLocations = [
        ...current.locations,
        {
          id: nextId,
          name: `Điểm mới ${nextId}`,
          lat: current.locations[0]?.lat ?? 10.7769,
          lng: current.locations[0]?.lng ?? 106.7009,
        },
      ];
      const nextMatrix = current.costMatrix.map((row) => [...row, 5]);
      nextMatrix.push(Array.from({ length: nextLocations.length }, (_, index) => (index === nextId ? 0 : 5)));

      return {
        ...current,
        locations: nextLocations,
        costMatrix: nextMatrix,
      };
    });
  };

  const removeLocation = (index: number) => {
    setDraft((current) => {
      if (current.locations.length <= 3) {
        return current;
      }

      const locations = current.locations
        .filter((_, locationIndex) => locationIndex !== index)
        .map((location, nextIndex) => ({ ...location, id: nextIndex }));
      const costMatrix = current.costMatrix
        .filter((_, rowIndex) => rowIndex !== index)
        .map((row) => row.filter((_, columnIndex) => columnIndex !== index));

      return { ...current, locations, costMatrix };
    });
  };

  const generateSampleMatrix = () => {
    setDraft((current) => {
      const size = current.locations.length;
      const costMatrix = Array.from({ length: size }, (_, rowIndex) =>
        Array.from({ length: size }, (_, columnIndex) => {
          if (rowIndex === columnIndex) {
            return 0;
          }

          return Number((3 + Math.abs(rowIndex - columnIndex) * 1.7 + ((rowIndex + columnIndex) % 3)).toFixed(1));
        })
      );

      return { ...current, costMatrix };
    });
  };

  return (
    <div className="page-stack page-enter">
      <div className="page-header-row">
        <div>
          <h1>Nhập dữ liệu TSP</h1>
          <p>Chỉnh sửa danh sách điểm đến và cập nhật ma trận chi phí tương ứng.</p>
        </div>
        <div className="header-actions">
          <button className="secondary-button" type="button" onClick={() => setDraft(dataset)}>
            Khôi phục
          </button>
          <button className="solid-button" type="button" onClick={() => onApplyDataset(draft)}>
            <Save size={17} />
            Dùng dữ liệu này để chạy thuật toán
          </button>
        </div>
      </div>

      <ValidationMessage issues={issues} />

      <div className="data-editor-grid">
        <section className="panel editor-panel">
          <div className="panel-heading">
            <h2>Danh sách Điểm đến</h2>
            <button className="secondary-button compact-button" type="button" onClick={addLocation}>
              <Plus size={17} />
              Thêm điểm
            </button>
          </div>

          <div className="editor-table-wrap">
            <table className="editor-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên địa điểm</th>
                  <th>Vĩ độ</th>
                  <th>Kinh độ</th>
                  <th aria-label="Xóa" />
                </tr>
              </thead>
              <tbody>
                {draft.locations.map((location, index) => (
                  <tr key={location.id}>
                    <td>{location.id}</td>
                    <td>
                      <input
                        value={location.name}
                        onChange={(event) => updateLocation(index, "name", event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={location.lat}
                        step="0.0001"
                        onChange={(event) => updateLocation(index, "lat", event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={location.lng}
                        step="0.0001"
                        onChange={(event) => updateLocation(index, "lng", event.target.value)}
                      />
                    </td>
                    <td>
                      <button className="icon-button subtle" type="button" onClick={() => removeLocation(index)}>
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
            <h2>Ma trận Chi phí</h2>
            <button className="secondary-button compact-button" type="button" onClick={generateSampleMatrix}>
              Tạo ma trận mẫu
            </button>
          </div>

          <div className="editable-matrix">
            <table className="matrix-editor-table">
              <thead>
                <tr>
                  <th>#</th>
                  {draft.costMatrix.map((_, index) => (
                    <th key={index}>{index}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {draft.costMatrix.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <th>{rowIndex}</th>
                    {row.map((value, columnIndex) => (
                      <td key={`${rowIndex}-${columnIndex}`}>
                        <input
                          className={rowIndex === columnIndex ? "diagonal-input" : ""}
                          type="number"
                          value={value}
                          step="0.1"
                          onChange={(event) => updateMatrixCell(rowIndex, columnIndex, event.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="muted-note">
            Gợi ý: cột và hàng tương ứng với ID điểm đến. Giá trị đường chéo mặc định bằng 0.
          </p>
        </section>
      </div>
    </div>
  );
}
