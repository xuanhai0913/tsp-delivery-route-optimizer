import { describe, expect, it } from "vitest";

import { parseEdgeGeometry } from "./datasetRepository.js";

describe("datasetRepository geometry parsing", () => {
  it("returns undefined when edge geometry is not provided", () => {
    expect(parseEdgeGeometry(null, "e0-1")).toBeUndefined();
    expect(parseEdgeGeometry(undefined, "e0-1")).toBeUndefined();
  });

  it("accepts JSONB geometry arrays from PostgreSQL", () => {
    const geometry = parseEdgeGeometry(
      [
        { lat: 10.7725, lng: 106.698 },
        { lat: 10.777, lng: 106.6953 }
      ],
      "e1-2"
    );

    expect(geometry).toEqual([
      { lat: 10.7725, lng: 106.698 },
      { lat: 10.777, lng: 106.6953 }
    ]);
  });

  it("accepts stringified geometry arrays from custom drivers", () => {
    const geometry = parseEdgeGeometry(
      JSON.stringify([
        { lat: 10.7725, lng: 106.698 },
        { lat: 10.777, lng: 106.6953 }
      ]),
      "e1-2"
    );

    expect(geometry).toHaveLength(2);
  });

  it("rejects malformed or incomplete geometry", () => {
    expect(() => parseEdgeGeometry("not-json", "bad-json")).toThrow("bad-json");
    expect(() => parseEdgeGeometry([{ lat: 10, lng: 106 }], "too-short")).toThrow("too-short");
    expect(() => parseEdgeGeometry([{ lat: 10, lng: 106 }, { lat: 11 }], "bad-point")).toThrow(
      "bad-point"
    );
  });
});
