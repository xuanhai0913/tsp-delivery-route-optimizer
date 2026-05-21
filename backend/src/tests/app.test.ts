import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app.js";

const graphRequest = {
  source: 0,
  target: 2,
  directed: false,
  nodes: [
    { id: 0, name: "A", lat: 10, lng: 106 },
    { id: 1, name: "B", lat: 10.1, lng: 106.1 },
    { id: 2, name: "C", lat: 10.2, lng: 106.2 }
  ],
  edges: [
    { id: "0-1", from: 0, to: 1, weight: 4 },
    { id: "1-2", from: 1, to: 2, weight: 5 }
  ]
};

describe("backend HTTP API", () => {
  const app = createApp();

  it("returns health status for deployment checks", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body).toMatchObject({
      status: "ok",
      service: "routelab-backend"
    });
  });

  it("lists demo graph datasets for the frontend", async () => {
    const response = await request(app).get("/api/datasets").expect(200);

    expect(response.body.datasets).toContainEqual({
      id: "hcm-7",
      name: "Ho Chi Minh City shortest-path graph",
      nodeCount: 7,
      edgeCount: 12,
      defaultSource: 1,
      defaultTarget: 6
    });
  });

  it("returns a selected graph dataset with nodes and edges", async () => {
    const response = await request(app).get("/api/datasets/hcm-7").expect(200);

    expect(response.body).toMatchObject({
      id: "hcm-7",
      directed: false,
      defaultSource: 1,
      defaultTarget: 6
    });
    expect(response.body.nodes).toHaveLength(7);
    expect(response.body.edges).toHaveLength(12);
  });

  it("keeps shortest-path endpoints visible while backend solvers are pending", async () => {
    const response = await request(app)
      .post("/api/solve/dijkstra")
      .send(graphRequest)
      .expect(501);

    expect(response.body).toMatchObject({
      error: "Shortest-path solver is not implemented yet.",
      algorithm: "dijkstra"
    });
  });

  it("rejects invalid shortest-path solve requests", async () => {
    const response = await request(app)
      .post("/api/solve/a-star")
      .send({
        source: 10,
        target: 11,
        nodes: graphRequest.nodes,
        edges: [{ id: "bad", from: 0, to: 99, weight: -1 }]
      })
      .expect(400);

    expect(response.body.error).toBe("Invalid shortest-path solve request.");
    expect(response.body.issues.length).toBeGreaterThan(0);
  });
});
