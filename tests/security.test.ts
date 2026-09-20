import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";

describe("Security", () => {
  it("should reject request without JWT", async () => {
    const response = await request(app)
      .get("/api/consultations/00000000-0000-0000-0000-000000000000");

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("error");
  });

  it("should reject invalid JWT", async () => {
    const response = await request(app)
      .get("/api/consultations/00000000-0000-0000-0000-000000000000")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("error");
  });

  it("should reject patient from admin payment endpoint", async () => {
    const token = jwt.sign(
      {
        id: "00000000-0000-0000-0000-000000000001",
        role: "PATIENT",
      },
      process.env.JWT_SECRET!
    );

    const response = await request(app)
      .patch("/api/payments/00000000-0000-0000-0000-000000000002/status")
      .set("Authorization", `Bearer ${token}`)
      .send({
        status: "SUCCESS",
      });

    expect(response.status).toBe(403);
    expect(response.body.status).toBe("error");
  });

  it("should enforce API rate limiting", async () => {
    let rateLimited = false;

    for (let i = 0; i < 105; i++) {
      const response = await request(app).get("/health");

      if (response.status === 429) {
        rateLimited = true;
        break;
      }
    }

    expect(rateLimited).toBe(true);
  });
});