import { describe, expect, it } from "vitest";

import { parseDatabaseCount, parseEdgeGeometry } from "./datasetRepository.js";

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

describe("datasetRepository database counts", () => {
  it("parses PostgreSQL count values returned as strings or numbers", () => {
    expect(parseDatabaseCount("12", "nodes")).toBe(12);
    expect(parseDatabaseCount(7, "edges")).toBe(7);
  });

  it("rejects invalid PostgreSQL count values", () => {
    expect(() => parseDatabaseCount("not-a-count", "nodes")).toThrow("nodes");
    expect(() => parseDatabaseCount(-1, "edges")).toThrow("edges");
    expect(() => parseDatabaseCount(1.5, "edges")).toThrow("edges");
  });
});
