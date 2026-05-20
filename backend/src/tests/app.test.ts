import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app.js";

describe("backend HTTP API", () => {
  const app = createApp();

  it("returns health status for Render checks", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body).toMatchObject({
      status: "ok",
      service: "routelab-backend"
    });
  });

  it("solves greedy TSP requests", async () => {
    const response = await request(app)
      .post("/api/solve/greedy")
      .send({
        start: 0,
        costMatrix: [
          [0, 10, 15],
          [10, 0, 20],
          [15, 20, 0]
        ]
      })
      .expect(200);

    expect(response.body).toMatchObject({
      route: [0, 1, 2, 0],
      totalCost: 45
    });
    expect(response.body.runtimeMs).toBeGreaterThanOrEqual(0);
  });

  it("rejects invalid solve requests", async () => {
    const response = await request(app)
      .post("/api/solve/branch-and-bound")
      .send({
        start: 10,
        costMatrix: [[0, -1], [1]]
      })
      .expect(400);

    expect(response.body.error).toBe("Invalid solve request.");
    expect(response.body.issues.length).toBeGreaterThan(0);
  });
});
