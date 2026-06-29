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

  it("solves Dijkstra shortest-path requests", async () => {
    const response = await request(app)
      .post("/api/solve/dijkstra")
      .send(graphRequest)
      .expect(200);

    expect(response.body).toMatchObject({
      path: [0, 1, 2],
      totalCost: 9
    });
    expect(response.body.runtimeMs).toEqual(expect.any(Number));
    expect(response.body.visitedOrder).toEqual([0, 1, 2]);
    expect(response.body.traceSteps.at(-1)).toMatchObject({
      phase: "final-path",
      currentNode: 2
    });
  });

  it("solves A* shortest-path requests with replay metrics", async () => {
    const response = await request(app)
      .post("/api/solve/a-star")
      .send(graphRequest)
      .expect(200);

    expect(response.body).toMatchObject({
      path: [0, 1, 2],
      totalCost: 9
    });
    expect(response.body.runtimeMs).toEqual(expect.any(Number));
    expect(response.body.visitedOrder).toEqual([0, 1, 2]);
    expect(response.body.traceSteps.at(-1)).toMatchObject({
      phase: "final-path",
      currentNode: 2
    });
    expect(
      response.body.traceSteps.some((step: { queue: Array<{ heuristic?: number }> }) =>
        step.queue.some((entry) => entry.heuristic !== undefined)
      )
    ).toBe(true);
  });

  it("solves Floyd-Warshall shortest-path requests with matrix replay metrics", async () => {
    const response = await request(app)
      .post("/api/solve/floyd-warshall")
      .send(graphRequest)
      .expect(200);

    expect(response.body).toMatchObject({
      path: [0, 1, 2],
      totalCost: 9
    });
    expect(response.body.runtimeMs).toEqual(expect.any(Number));
    expect(response.body.visitedOrder).toEqual([0, 1, 2]);
    expect(response.body.traceSteps.at(-1)).toMatchObject({
      phase: "final-path",
      currentNode: 2
    });
    expect(
      response.body.traceSteps.some((step: { message: string }) =>
        step.message.includes("Floyd-Warshall")
      )
    ).toBe(true);
  });

  it("solves Bellman-Ford shortest-path requests with relaxation rounds", async () => {
    const response = await request(app)
      .post("/api/solve/bellman-ford")
      .send(graphRequest)
      .expect(200);

    expect(response.body).toMatchObject({
      path: [0, 1, 2],
      totalCost: 9
    });
    expect(response.body.runtimeMs).toEqual(expect.any(Number));
    expect(response.body.visitedOrder).toEqual([0, 1, 2]);
    expect(response.body.traceSteps.at(-1)).toMatchObject({
      phase: "final-path",
      currentNode: 2
    });
    expect(
      response.body.traceSteps.some((step: { phase: string }) => step.phase === "relax-edge")
    ).toBe(true);
    expect(response.body.relaxedEdges).toBeInstanceOf(Array);
    expect(response.body.relaxedEdges.length).toBeGreaterThan(0);
  });

  it("detects negative cycle in Bellman-Ford solver", async () => {
    const negativeCycleRequest = {
      source: 0,
      target: 2,
      directed: true, 
      nodes: [
        { id: 0, name: 'A', lat: 0, lng: 0 },
        { id: 1, name: 'B', lat: 0, lng: 0 },
        { id: 2, name: 'C', lat: 0, lng: 0 }
      ],
      edges: [
        { id: 'e0-1', from: 0, to: 1, weight: 1 },
        { id: 'e1-2', from: 1, to: 2, weight: -2 },
        { id: 'e2-1', from: 2, to: 0, weight: -1 } 
      ]
    };

    const response = await request(app)
      .post("/api/solve/bellman-ford")
      .send(negativeCycleRequest)
      .expect(400);

    expect(response.body.error).toMatch(/negative[- ]?cycle/i);
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
