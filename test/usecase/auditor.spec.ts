import { CreateEventDto, CreateEventRewardDto } from '@libs/dtos';
import { EventStatus, Role } from "@libs/enums";
import request from "supertest";

describe("AUDITOR Use Cases", () => {
  const baseUrl = "http://localhost:3333";
  let auditorToken: string;
  let auditorId: string;
  let eventId: string;
  let rewardId: string;
  let requestId: string;

  // Auditor credentials
  const auditorCredentials = {
    email: "auditor@example.com",
    password: "auditor1234",
  };

  const adminCredentials = {
    email: "admin@example.com",
    password: "admin1234",
  };

  // Setup: Login as auditor
  beforeAll(async () => {
    // Login as auditor
    const loginResponse = await request(baseUrl)
      .post("/auth/login")
      .send(auditorCredentials);

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty("accessToken");
    expect(loginResponse.body).toHaveProperty("user.roles");
    expect(loginResponse.body.user.roles).toContain(Role.AUDITOR);

    auditorToken = loginResponse.body.accessToken;
    auditorId = loginResponse.body.user.id;

    const adminLoginResponse = await request(baseUrl)
      .post("/auth/login")
      .send(adminCredentials);

    expect(adminLoginResponse.status).toBe(200);
    const adminToken = adminLoginResponse.body.accessToken;

    // Create test event
    const eventResponse = await request(baseUrl)
      .post("/events")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test Event",
        status: EventStatus.ACTIVE,
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24),
        rewardCondition: {
          minPurchase: 1000,
          maxRewards: 1,
        },
      } satisfies CreateEventDto)
      .expect(201);

    eventId = eventResponse.body.id;

    // Create a reward for testing
    const rewardResponse = await request(baseUrl)
      .post("/rewards/POINT")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test Reward",
        description: "Test Reward Description",
        points: 1000,
      });

    rewardId = rewardResponse.body.id;

    // Add reward to event
    await request(baseUrl)
      .post(`/events/${eventId}/rewards`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ 
        rewardId, 
        condition: {}, 
        autoResolve: true 
      } satisfies Omit<CreateEventRewardDto, 'eventId'>)
      .expect(201);

    // Create a test user account and request a reward
    const testUser = {
      email: `testuser${Date.now()}@example.com`,
      password: "testuser1234",
    };

    await request(baseUrl)
      .post("/auth/users")
      .send(testUser);

    const userLoginResponse = await request(baseUrl)
      .post("/auth/login")
      .send(testUser)
      .expect(200);

    const userToken = userLoginResponse.body.accessToken;

    // Create a reward request
    const requestResponse = await request(baseUrl)
      .post(`/events/${eventId}/requests/${rewardId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(201);

    requestId = requestResponse.body.id;
  });

  // Test account management
  describe("Account Management", () => {
    it("should login with auditor credentials", async () => {
      const response = await request(baseUrl)
        .post("/auth/login")
        .send(auditorCredentials);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body.user.roles).toContain(Role.AUDITOR);
      auditorToken = response.body.accessToken;
    });

    it("should get current auditor information", async () => {
      const response = await request(baseUrl)
        .get("/auth/me")
        .set("Authorization", `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", auditorId);
      expect(response.body).toHaveProperty("email", auditorCredentials.email);
      expect(response.body).toHaveProperty("roles");
      expect(response.body.roles).toContain(Role.AUDITOR);
    });
  });

  // Test event monitoring
  describe("Event Monitoring", () => {
    it("should get all events", async () => {
      const response = await request(baseUrl)
        .get("/events")
        .set("Authorization", `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body).toHaveProperty("nextCursor");
      expect(response.body).toHaveProperty("hasMore");
      expect(response.body.items.length).toBeGreaterThan(0);
    });

    it("should get specific event details", async () => {
      const response = await request(baseUrl)
        .get(`/events/${eventId}`)
        .set("Authorization", `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", eventId);
      expect(response.body).toHaveProperty("name");
      expect(response.body).toHaveProperty("periodStart");
      expect(response.body).toHaveProperty("periodEnd");
      expect(response.body).toHaveProperty("status");
    });

    it("should get event rewards", async () => {
      const response = await request(baseUrl)
        .get(`/events/${eventId}/rewards`)
        .set("Authorization", `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // Verify reward data structure if rewards exist
      if (response.body.length > 0) {
        const eventReward = response.body[0];
        expect(eventReward).toHaveProperty("id");

        if (eventReward.reward.type === "POINT") {
          expect(eventReward.reward).toHaveProperty("points");
        } else if (eventReward.reward.type === "COUPON") {
          expect(eventReward.reward).toHaveProperty("couponCode");
        }
      }
    });
  });

  // Test reward request auditing
  describe("Reward Request Auditing", () => {
    it("should get all reward requests", async () => {
      const response = await request(baseUrl)
        .get("/events/requests")
        .set("Authorization", `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body).toHaveProperty("totalItems");

      // Verify request data structure if requests exist
      if (response.body.items.length > 0) {
        const request = response.body.items[0];
        expect(request).toHaveProperty("id");
        expect(request).toHaveProperty("userId");
        expect(request).toHaveProperty("eventReward");
        expect(request).toHaveProperty("status");
        expect(request).toHaveProperty("createdAt");
        expect(request).toHaveProperty("updatedAt");
      }
    });

    it("should filter reward requests by status", async () => {
      const response = await request(baseUrl)
        .get("/events/requests?status=PENDING")
        .set("Authorization", `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
      expect(Array.isArray(response.body.items)).toBe(true);

      // All requests should have PENDING status
      if (response.body.items.length > 0) {
        response.body.items.forEach((request: any) => {
          expect(request.status).toBe("PENDING");
        });
      }
    });

    it("should filter reward requests by event ID", async () => {
      const response = await request(baseUrl)
        .get(`/events/requests?eventId=${eventId}`)
        .set("Authorization", `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
      expect(Array.isArray(response.body.items)).toBe(true);

      // All requests should be for the specified event
      if (response.body.items.length > 0) {
        response.body.items.forEach((request: any) => {
          expect(request.event.id).toBe(eventId);
        });
      }
    });

    it("should get a specific reward request by ID", async () => {
      const response = await request(baseUrl)
        .get(`/events/requests/${requestId}`)
        .set("Authorization", `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", requestId);
      expect(response.body).toHaveProperty("eventReward");
      expect(response.body).toHaveProperty("status");
    });

    it("should filter reward requests by user ID", async () => {
      // Get existing user ID from the created request
      const requestsResponse = await request(baseUrl)
        .get("/events/requests")
        .set("Authorization", `Bearer ${auditorToken}`);
      
      if (requestsResponse.body.items.length > 0) {
        const userId = requestsResponse.body.items[0].userId;

        const response = await request(baseUrl)
          .get(`/events/requests?userId=${userId}`)
          .set("Authorization", `Bearer ${auditorToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("items");
        expect(Array.isArray(response.body.items)).toBe(true);

        // All requests should be from the specified user
        if (response.body.items.length > 0) {
          response.body.items.forEach((request: any) => {
            expect(request.userId).toBe(userId);
          });
        }
      }
    });
  });

  // Test unauthorized access
  describe("Unauthorized Access", () => {
    it("should return 401 when accessing reward requests without token", async () => {
      const response = await request(baseUrl).get("/events/requests");
      expect(response.status).toBe(401);
    });

    it("should forbid role updates by auditor", async () => {
      // First create a regular user
      const email = `testuser${Date.now()}@example.com`;
      const userResponse = await request(baseUrl).post("/auth/users").send({
        email: email,
        password: "test12341234",
      });

      expect(userResponse.status).toBe(201);
      const userId = userResponse.body.id;

      // Try to update user role as auditor
      const response = await request(baseUrl)
        .put(`/auth/users/${userId}/roles`)
        .set("Authorization", `Bearer ${auditorToken}`)
        .send({
          roles: [Role.OPERATOR],
        });

      expect(response.status).toBe(403);
    });
  });

  // Test edge cases
  describe("Edge Cases", () => {
    it("should handle non-existent event ID", async () => {
      const fakeEventId = "645f2d1b8c5cd2f948e9a999";
      const response = await request(baseUrl)
        .get(`/events/${fakeEventId}`)
        .set("Authorization", `Bearer ${auditorToken}`);

      expect(response.status).toBe(404);
    });

    it("should handle non-existent event rewards", async () => {
      const fakeEventId = "645f2d1b8c5cd2f948e9a999";
      const response = await request(baseUrl)
        .get(`/events/${fakeEventId}/rewards`)
        .set("Authorization", `Bearer ${auditorToken}`);

      expect(response.status).toBe(404);
    });

    it("should handle invalid status parameter", async () => {
      const response = await request(baseUrl)
        .get("/events/requests?status=INVALID_STATUS")
        .set("Authorization", `Bearer ${auditorToken}`);

      expect(response.status).toBe(400);
    });

    it("should handle non-existent user ID in requests", async () => {
      const fakeUserId = "645f2d1b8c5cd2f948e9a999";
      const response = await request(baseUrl)
        .get(`/events/requests?userId=${fakeUserId}`)
        .set("Authorization", `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items.length).toBe(0);
    });

    it("should handle invalid Object ID format", async () => {
      const invalidObjectId = "invalid-object-id";
      const response = await request(baseUrl)
        .get(`/events/requests?eventId=${invalidObjectId}`)
        .set("Authorization", `Bearer ${auditorToken}`);

      expect(response.status).toBe(400);
    });
  });
});
