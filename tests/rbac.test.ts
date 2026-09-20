import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";

describe("RBAC", () => {
  it("should reject patient from creating a prescription", async () => {
    const token = jwt.sign(
      {
        id: "bec3909d-bc9d-430d-afe9-8e2d9b9e3530",
        role: "PATIENT",
      },
      process.env.JWT_SECRET!
    );

    const response = await request(app)
      .post("/api/prescriptions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        consultationId: "b01627c7-2bf6-4620-959c-69c3d433c437",
        medicines: "Test medicine",
        instructions: "Test instruction",
      });

    expect(response.status).toBe(403);
    expect(response.body.status).toBe("error");
  });
});