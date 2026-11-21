import { describe, it, expect, beforeEach } from "@jest/globals";
import express from "express";
import request from "supertest";
import {
  requireIdempotencyKey,
  clearIdempotencyCache,
} from "./idempotency.middleware.js";

describe("Financial Idempotency Layer (QG-6)", () => {
  let app: express.Express;
  let counter = 0;

  beforeEach(() => {
    clearIdempotencyCache();
    counter = 0;
    app = express();
    app.use(express.json());

    app.post("/test-mutation", requireIdempotencyKey, (req, res) => {
      counter++;
      res.status(201).json({
        success: true,
        executionCount: counter,
        amount: req.body.amount,
      });
    });
  });

  it("rejects requests missing Idempotency-Key with 400 Bad Request", async () => {
    const res = await request(app).post("/test-mutation").send({ amount: 5000 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("IDEMPOTENCY_KEY_REQUIRED");
  });

  it("rejects keys shorter than 8 characters", async () => {
    const res = await request(app)
      .post("/test-mutation")
      .set("Idempotency-Key", "abc")
      .send({ amount: 5000 });
    expect(res.status).toBe(400);
  });

  it("executes handler on first request and returns 201", async () => {
    const key = "key_test_12345678";
    const res = await request(app)
      .post("/test-mutation")
      .set("Idempotency-Key", key)
      .send({ amount: 5000 });

    expect(res.status).toBe(201);
    expect(res.body.executionCount).toBe(1);
    expect(res.headers["idempotent-replay"]).toBeUndefined();
  });

  it("replays cached response without re-executing handler on duplicate key with identical payload", async () => {
    const key = "key_test_duplicate_1";

    // Request 1
    const res1 = await request(app)
      .post("/test-mutation")
      .set("Idempotency-Key", key)
      .send({ amount: 8500 });
    expect(res1.status).toBe(201);
    expect(res1.body.executionCount).toBe(1);

    // Request 2 (Duplicate)
    const res2 = await request(app)
      .post("/test-mutation")
      .set("Idempotency-Key", key)
      .send({ amount: 8500 });

    expect(res2.status).toBe(201);
    // Crucial check: handler was NOT executed a second time!
    expect(res2.body.executionCount).toBe(1);
    expect(res2.headers["idempotent-replay"]).toBe("true");
  });

  it("rejects key reuse with mismatched payload with 422 Unprocessable Entity", async () => {
    const key = "key_test_mismatch_1";

    // Request 1 with amount 1000
    await request(app)
      .post("/test-mutation")
      .set("Idempotency-Key", key)
      .send({ amount: 1000 });

    // Request 2 with same key but amount 2000
    const res2 = await request(app)
      .post("/test-mutation")
      .set("Idempotency-Key", key)
      .send({ amount: 2000 });

    expect(res2.status).toBe(422);
    expect(res2.body.code).toBe("IDEMPOTENCY_KEY_PAYLOAD_MISMATCH");
  });
});
