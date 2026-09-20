import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Authentication", () => {
  it("should reject requests without authentication", async () => {
    const response = await request(app).get(
      "/api/consultations/b01627c7-2bf6-4620-959c-69c3d433c437"
    );

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("error");
  });

  it("should reject invalid JWT", async () => {
    const response = await request(app)
      .get("/api/consultations/b01627c7-2bf6-4620-959c-69c3d433c437")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("error");
  });
});