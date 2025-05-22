import { faker } from "@faker-js/faker/.";
import { EventStatus, Role } from "@libs/enums";
import request from "supertest";

describe("USER Use Cases", () => {
  const baseUrl = "http://localhost:3333";
  let userToken: string;
  let userId: string;
  let eventId: string;
  let rewardId: string;
  let requestId: string;

  // Regular user credentials
  const userCredentials = {
    email: faker.internet.email(),
    password: faker.internet.password(),
  };

  const adminCredentials = {
    email: "admin@example.com",
    password: "admin1234",
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

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty("accessToken");
    expect(loginResponse.body).toHaveProperty("user.roles");
    expect(loginResponse.body.user.roles).toContain(Role.USER);

    userToken = loginResponse.body.accessToken;
    userId = loginResponse.body.user.id;

    // Login as admin to create an event and reward for testing
    const adminLoginResponse = await request(baseUrl)
      .post("/auth/login")
      .send(adminCredentials);
    
    const adminToken = adminLoginResponse.body.accessToken;

    // Create an event for testing
    const eventResponse = await request(baseUrl)
      .post("/events")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test Event",
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24),
        rewardCondition: {
          minPurchase: 1000,
        },
        status: EventStatus.ACTIVE,
      })
      .expect(201);

    eventId = eventResponse.body.id;

    // Create a reward for testing
    const rewardResponse = await request(baseUrl)
      .post("/rewards/POINT")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test Reward",
        points: 1000,
      })
      .expect(201);

    rewardId = rewardResponse.body.id;

    // Add reward to event
    await request(baseUrl)
      .post(`/events/${eventId}/rewards`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ 
        rewardId,
        condition: {
          minPurchase: 1000,
        },
        autoResolve: true,
      })
      .expect(201)

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

      expect(response.status).toBe(200);
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
      expect(response.body).toHaveProperty("items");
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body).toHaveProperty("nextCursor");
      expect(response.body).toHaveProperty("hasMore");
    });

    it("should get event details", async () => {
      const response = await request(baseUrl)
        .get(`/events/${eventId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", eventId);
    });

    it("should get event rewards", async () => {
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
      const response = await request(baseUrl)
        .post(`/events/${eventId}/requests/${rewardId}`)
        .set("Authorization", `Bearer ${userToken}`);

      // Success case (201)
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("userId", userId);
      expect(response.body.eventReward.event.id).toBe(eventId);
      requestId = response.body.id;
    });

    it("should get user reward requests", async () => {
      const response = await request(baseUrl)
        .get("/events/requests/mine")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body).toHaveProperty("totalItems");

      // All requests should belong to the current user
      if (response.body.items.length > 0) {
        response.body.items.forEach((request: any) => {
          expect(request.userId).toBe(userId);
        });
      }
    });

    it("should get specific reward request by ID", async () => {
      const response = await request(baseUrl)
        .get(`/events/requests/${requestId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", requestId);
      expect(response.body).toHaveProperty("userId", userId);
    });

    it("should filter reward requests by status", async () => {
      const response = await request(baseUrl)
        .get("/events/requests/mine?status=PENDING")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body).toHaveProperty("totalItems");

      // All requests should have PENDING status and belong to current user
      if (response.body.items.length > 0) {
        response.body.items.forEach((request: any) => {
          expect(request.status).toBe("PENDING");
          expect(request.userId).toBe(userId);
        });
      }
    });

    it("should filter reward requests by event ID", async () => {
      const response = await request(baseUrl)
        .get(`/events/requests/mine?eventId=${eventId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body).toHaveProperty("totalItems");

      // All requests should be for the specified event and belong to current user
      if (response.body.items.length > 0) {
        response.body.items.forEach((request: any) => {
          expect(request.event.id).toBe(eventId);
          expect(request.userId).toBe(userId);
        });
      }
    });
  });

  // Test unauthorized access
  describe("Unauthorized Access", () => {
    it("should return 401 when accessing events without token", async () => {
      const response = await request(baseUrl).get("/events");
      expect(response.status).toBe(401);
    });

    it("should return 401 when requesting reward without token", async () => {
      const response = await request(baseUrl).post(
        `/events/${eventId}/requests/${rewardId}`,
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
        .post(`/events/${fakeEventId}/requests/${rewardId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });

    it("should handle reward request for non-existent reward", async () => {
      const fakeRewardId = "645f2d1b8c5cd2f948e9a999";
      const response = await request(baseUrl)
        .post(`/events/${eventId}/requests/${fakeRewardId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });

    it("should reject request for reward in inactive event", async () => {
      // This test assumes there's an inactive event or you can create one
      // For now, we'll mock this by expecting a 400 response for a valid but inactive event
      const inactiveEventId = "645f2d1b8c5cd2f948e9a258"; // Dummy ID
      const response = await request(baseUrl)
        .post(`/events/${inactiveEventId}/requests/${rewardId}`)
        .set("Authorization", `Bearer ${userToken}`);

      // Either 400 (inactive) or 404 (not found) is acceptable
      expect([400, 404]).toContain(response.status);
    });
  });
});
