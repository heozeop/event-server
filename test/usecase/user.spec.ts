import { Role } from "@libs/enums";
import request from "supertest";

describe("USER Use Cases", () => {
  const baseUrl = "http://localhost:3333";
  let userToken: string;
  let userId: string;
  let eventId: string;
  let requestId: string;

  // Regular user credentials
  const userCredentials = {
    email: "user@example.com",
    password: "user1234",
  };

  // Setup: Create user and login
  beforeAll(async () => {
    // Try to create a new user (might fail if already exists)
    try {
      const createResponse = await request(baseUrl)
        .post("/auth/users")
        .send(userCredentials);

      if (createResponse.status === 201) {
        userId = createResponse.body.id;
      }
    } catch (error: any) {
      console.log(
        "User creation error (may be normal if user exists):",
        error.message,
      );
    }

    // Login as user
    const loginResponse = await request(baseUrl)
      .post("/auth/login")
      .send(userCredentials);

    expect(loginResponse.status).toBe(201);
    expect(loginResponse.body).toHaveProperty("accessToken");
    expect(loginResponse.body).toHaveProperty("user.roles");
    expect(loginResponse.body.user.roles).toContain(Role.USER);

    userToken = loginResponse.body.accessToken;
    userId = loginResponse.body.user.id;

    // Find an active event for testing
    const eventsResponse = await request(baseUrl)
      .get("/events")
      .set("Authorization", `Bearer ${userToken}`);

    if (eventsResponse.body.length > 0) {
      // Find an active event
      const activeEvent = eventsResponse.body.find(
        (event: any) =>
          event.status === "ACTIVE" && new Date(event.periodEnd) > new Date(),
      );

      if (activeEvent) {
        eventId = activeEvent.id;
      }
    }
  });

  // Test account management
  describe("Account Management", () => {
    const newUserCredentials = {
      email: `user${Date.now()}@example.com`,
      password: "newuser1234",
    };

    it("should create a new user account", async () => {
      const response = await request(baseUrl)
        .post("/auth/users")
        .send(newUserCredentials);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("email", newUserCredentials.email);
      expect(response.body).toHaveProperty("roles");
      expect(response.body.roles).toContain(Role.USER);
    });

    it("should login with user credentials", async () => {
      const response = await request(baseUrl)
        .post("/auth/login")
        .send(userCredentials);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body.user.roles).toContain(Role.USER);

      userToken = response.body.accessToken;
    });

    it("should get current user information", async () => {
      const response = await request(baseUrl)
        .get("/auth/me")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("email", userCredentials.email);
      expect(response.body).toHaveProperty("id", userId);
    });
  });

  // Test event viewing
  describe("Event Viewing", () => {
    it("should get event list", async () => {
      const response = await request(baseUrl)
        .get("/events")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should get event details", async () => {
      // Skip if no event is available
      if (!eventId) {
        console.log("Skipping test because no event ID is available");
        return;
      }

      const response = await request(baseUrl)
        .get(`/events/${eventId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", eventId);
    });

    it("should get event rewards", async () => {
      // Skip if no event is available
      if (!eventId) {
        console.log("Skipping test because no event ID is available");
        return;
      }

      const response = await request(baseUrl)
        .get(`/events/${eventId}/rewards`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // Test reward requests
  describe("Reward Requests", () => {
    it("should request a reward for an event", async () => {
      // Skip if no event is available
      if (!eventId) {
        console.log("Skipping test because no event ID is available");
        return;
      }

      // This test might fail if the user has already requested the reward
      // or if the user doesn't meet the event conditions
      const response = await request(baseUrl)
        .post(`/events/${eventId}/requests`)
        .set("Authorization", `Bearer ${userToken}`);

      // Success case (201) or already requested case (409)
      expect([201, 409]).toContain(response.status);

      if (response.status === 201) {
        expect(response.body).toHaveProperty("id");
        expect(response.body).toHaveProperty("userId", userId);
        expect(response.body).toHaveProperty("eventId", eventId);
        requestId = response.body.id;
      } else {
        const data = await request(baseUrl)
          .get(`/events/requests`)
          .set("Authorization", `Bearer ${userToken}`);

        expect(data.status).toBe(200);
        expect(Array.isArray(data.body)).toBe(true);

        requestId = data.body[0].id;
      }
    });

    it("should get user reward requests", async () => {
      const response = await request(baseUrl)
        .get("/events/requests")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // All requests should belong to the current user
      response.body.forEach((request: any) => {
        expect(request.userId).toBe(userId);
      });
    });

    it("should filter reward requests by status", async () => {
      const response = await request(baseUrl)
        .get("/events/requests?status=PENDING")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // All requests should have PENDING status and belong to current user
      response.body.forEach((request: any) => {
        expect(request.status).toBe("PENDING");
        expect(request.userId).toBe(userId);
      });
    });

    it("should filter reward requests by event ID", async () => {
      // Skip if no event is available
      if (!eventId) {
        console.log("Skipping test because no event ID is available");
        return;
      }

      const response = await request(baseUrl)
        .get(`/events/requests?eventId=${eventId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // All requests should be for the specified event and belong to current user
      response.body.forEach((request: any) => {
        expect(request.event.id).toBe(eventId);
        expect(request.userId).toBe(userId);
      });
    });
  });

  // Test unauthorized access
  describe("Unauthorized Access", () => {
    it("should return 401 when accessing events without token", async () => {
      const response = await request(baseUrl).get("/events");
      expect(response.status).toBe(401);
    });

    it("should return 401 when requesting reward without token", async () => {
      // Skip if no event is available
      if (!eventId) {
        console.log("Skipping test because no event ID is available");
        return;
      }

      const response = await request(baseUrl).post(
        `/events/${eventId}/requests`,
      );
      expect(response.status).toBe(401);
    });

    it("should forbid creating rewards", async () => {
      const pointReward = {
        points: 1000,
      };

      const response = await request(baseUrl)
        .post("/rewards/POINT")
        .set("Authorization", `Bearer ${userToken}`)
        .send(pointReward);

      expect(response.status).toBe(403);
    });
  });

  // Test edge cases
  describe("Edge Cases", () => {
    it("should reject account creation with invalid email", async () => {
      const invalidUser = {
        email: "invalid-email",
        password: "user1234",
      };

      const response = await request(baseUrl)
        .post("/auth/users")
        .send(invalidUser);

      expect(response.status).toBe(400);
    });

    it("should reject account creation with short password", async () => {
      const invalidUser = {
        email: "valid@example.com",
        password: "123", // Too short
      };

      const response = await request(baseUrl)
        .post("/auth/users")
        .send(invalidUser);

      expect(response.status).toBe(400);
    });

    it("should reject login with wrong password", async () => {
      const invalidCredentials = {
        email: userCredentials.email,
        password: "wrongpassword",
      };

      const response = await request(baseUrl)
        .post("/auth/login")
        .send(invalidCredentials);

      expect(response.status).toBe(401);
    });

    it("should handle non-existent event ID", async () => {
      const fakeEventId = "645f2d1b8c5cd2f948e9a999";
      const response = await request(baseUrl)
        .get(`/events/${fakeEventId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });

    it("should handle reward request for non-existent event", async () => {
      const fakeEventId = "645f2d1b8c5cd2f948e9a999";
      const response = await request(baseUrl)
        .post(`/events/${fakeEventId}/request`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });
  });
});
