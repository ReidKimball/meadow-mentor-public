import request from "supertest";
import express from "express";

import {
  validateUserRegistration,
  normalizeUserInput,
} from "../../middleware/inputValidation.middleware.js";

// NOTE: These tests intentionally do **not** call the real IP blacklist
// middleware. They focus purely on validation & normalization behavior, and
// avoid any MongoDB usage so they can run as fast, isolated unit tests.

const createAppWithMiddlewares = () => {
  const app = express();
  app.use(express.json());

  app.post(
    "/api/test-users",
    validateUserRegistration,
    normalizeUserInput,
    (req, res) => {
      // Echo back the normalized body for inspection.
      return res.status(201).json({ body: req.body });
    }
  );

  return app;
};

describe("Input Validation Middleware", () => {
  test("accepts valid registration data", async () => {
    const app = createAppWithMiddlewares();

    const response = await request(app).post("/api/test-users").send({
      firebaseUID: "test-uid-123",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.body.firstName).toBe("John");
    expect(response.body.body.email).toBe("john.doe@example.com");
  });

  test("rejects names containing URLs", async () => {
    const app = createAppWithMiddlewares();

    const response = await request(app).post("/api/test-users").send({
      firebaseUID: "test-uid-123",
      firstName: "John https://evil.com",
      email: "john@example.com",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Invalid input detected. Your request has been logged.");
    expect(response.body.details.security).toBeDefined();
  });

  test("rejects names containing HTML", async () => {
    const app = createAppWithMiddlewares();

    const response = await request(app).post("/api/test-users").send({
      firebaseUID: "test-uid-123",
      firstName: "<script>alert('XSS')</script>",
      email: "john@example.com",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Invalid input detected. Your request has been logged.");
  });

  test("rejects names containing emails", async () => {
    const app = createAppWithMiddlewares();

    const response = await request(app).post("/api/test-users").send({
      firebaseUID: "test-uid-123",
      firstName: "John john@example.com",
      email: "john@example.com",
    });

    expect(response.statusCode).toBe(400);
  });

  test("normalizes benign names and emails", async () => {
    const app = createAppWithMiddlewares();

    const response = await request(app).post("/api/test-users").send({
      firebaseUID: "test-uid-123",
      firstName: "  John   Doe  ",
      lastName: "  Smith  ",
      email: "  USER@Example.COM  ",
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.body.firstName).toBe("John Doe");
    expect(response.body.body.lastName).toBe("Smith");
    expect(response.body.body.email).toBe("user@example.com");
  });
});
