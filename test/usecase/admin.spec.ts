import { faker } from "@faker-js/faker";
import { CreateEventDto, CreateEventRewardDto, CreatePointRewardDto, UpdateEventRewardDto } from '@libs/dtos';
import { EventStatus, RewardRequestStatus, RewardType, Role } from "@libs/enums";
import request from "supertest";

describe("ADMIN Use Cases", () => {
  const baseUrl = "http://localhost:3333";
  let adminToken: string;
  let adminId: string;
  let userId: string;
  let eventId: string;
  let rewardId: string;
  let requestId: string;

  // Admin credentials
  const adminCredentials = {
    email: "admin@example.com",
    password: "admin1234",
  };

  // Test user credentials
  const testUserCredentials = {
    email: `testuser${Date.now()}@example.com`,
    password: "testuser1234",
  };

  // Setup: Login as admin
  beforeAll(async () => {
    // Login as admin
    const loginResponse = await request(baseUrl)
      .post("/auth/login")
      .send(adminCredentials);

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty("accessToken");
    expect(loginResponse.body).toHaveProperty("user.roles");
    expect(loginResponse.body.user.roles).toContain(Role.ADMIN);

    adminToken = loginResponse.body.accessToken;
    adminId = loginResponse.body.user.id;

    // Create a test user for admin operations
    const createUserResponse = await request(baseUrl)
      .post("/auth/users")
      .send(testUserCredentials);

    expect(createUserResponse.status).toBe(201);
    userId = createUserResponse.body.id;
  });

  // Test account management
  describe("Account Management", () => {
    it("should login with admin credentials", async () => {
      const response = await request(baseUrl)
        .post("/auth/login")
        .send(adminCredentials);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("user.roles");
      expect(response.body.user.roles).toContain(Role.ADMIN);
      adminToken = response.body.accessToken;
    });

    it("should get user by email", async () => {
      const response = await request(baseUrl)
        .get(`/auth/users/email?email=${adminCredentials.email}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", adminId);
      expect(response.body).toHaveProperty("email", adminCredentials.email);
      expect(response.body).toHaveProperty("roles");
      expect(response.body.roles).toContain(Role.ADMIN);
    });
  });

  // Test user management
  describe("User Management", () => {
    const testUser = {
      email: "testuser@example.com",
      password: "testuser1234",
    };

    // Create a test user
    beforeAll(async () => {
      const response = await request(baseUrl)
        .post("/auth/users")
        .send(testUser);

      if (response.status === 201) {
        userId = response.body.id;
      } else if (response.status > 400) {
        // User already exists, fetch the user ID
        const userResponse = await request(baseUrl)
          .get(`/auth/users/email?email=${testUser.email}`)
          .set("Authorization", `Bearer ${adminToken}`);

        userId = userResponse.body.id;
      }
    });

    it("should find user by email", async () => {
      const response = await request(baseUrl)
        .get(`/auth/users/email?email=${testUser.email}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("email", testUser.email);
      expect(response.body).toHaveProperty("id");
    });

    it("should find user by ID", async () => {
      const response = await request(baseUrl)
        .get(`/auth/users/${userId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", userId);
      expect(response.body).toHaveProperty("email", testUser.email);
      expect(response.body).toHaveProperty("roles");
      expect(response.body.roles).toContain(Role.USER);
    });

    it("should update user roles", async () => {
      const response = await request(baseUrl)
        .patch(`/auth/users/${userId}/roles`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          roles: [Role.USER, Role.OPERATOR],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", userId);
      expect(response.body).toHaveProperty("roles");
      expect(response.body.roles).toContain(Role.USER);
      expect(response.body.roles).toContain(Role.OPERATOR);
    });
  });

  // Test event management
  describe("Event Management", () => {
    it("should create a new event", async () => {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      const newEvent = {
        name: faker.book.title(),
        rewardCondition: {
          newUser: true,
        },
        periodStart: today,
        periodEnd: nextMonth,
        status: EventStatus.ACTIVE,
      } satisfies CreateEventDto;

      const response = await request(baseUrl)
        .post("/events")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newEvent);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("name", newEvent.name);

      eventId = response.body.id;
    });

    it("should get events list", async () => {
      const response = await request(baseUrl)
        .get("/events")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body).toHaveProperty("nextCursor");
      expect(response.body).toHaveProperty("hasMore");
    });

    it("should get specific event", async () => {
      const response = await request(baseUrl)
        .get(`/events/${eventId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", eventId);
      expect(response.body).toHaveProperty("name");
      expect(response.body).toHaveProperty("periodStart");
      expect(response.body).toHaveProperty("periodEnd");
      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("eventRewards");
    });

    it("should update an event", async () => {
      const updateData = {
        name: "Updated Event Name",
        description: "Updated event description"
      };

      const response = await request(baseUrl)
        .patch(`/events/${eventId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", eventId);
      expect(response.body).toHaveProperty("name", updateData.name);
      expect(response.body).toHaveProperty("periodStart");
      expect(response.body).toHaveProperty("periodEnd");
      expect(response.body).toHaveProperty("status");
    });

    it("should create a point reward", async () => {
      const newReward = {
        name: faker.book.title(),
        points: 1000,
      };

      const response = await request(baseUrl)
        .post("/rewards/POINT")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newReward);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("type", "POINT");
      expect(response.body).toHaveProperty("points", newReward.points);

      rewardId = response.body.id;
    });

    it("should get a specific reward", async () => {
      const response = await request(baseUrl)
        .get(`/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", rewardId);
      expect(response.body).toHaveProperty("type", "POINT");
    });

    it("should get rewards list", async () => {
      const response = await request(baseUrl)
        .get("/rewards")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body).toHaveProperty("totalItems");
    });

    it("should add reward to event", async () => {
      const response = await request(baseUrl)
        .post(`/events/${eventId}/rewards`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          rewardId,
          condition: {
            newUser: true,
          },
          autoResolve: true,
        } satisfies Omit<CreateEventRewardDto, 'eventId'>);

      expect(response.status).toBe(201);
    });

    it("should get event rewards", async () => {
      const response = await request(baseUrl)
        .get(`/events/${eventId}/rewards`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const addedReward = response.body.find(
        (reward: any) => reward.reward.id === rewardId,
      );
      expect(addedReward).toBeDefined();
      expect(addedReward.reward).toBeDefined();
      expect(addedReward.reward.type).toBe(RewardType.POINT);
    });

    it("should update event reward", async () => {
      const updateData = {
        autoResolve: false,
        condition: {
          minPurchase: 10000
        }
      } satisfies Omit<UpdateEventRewardDto, 'eventId' | 'rewardId'>;

      const response = await request(baseUrl)
        .patch(`/events/${eventId}/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("event.id", eventId);
      expect(response.body).toHaveProperty("reward.id", rewardId);
      expect(response.body).toHaveProperty("autoResolve", updateData.autoResolve);
      expect(response.body).toHaveProperty("condition", updateData.condition);
    });

    it("should remove reward from event", async () => {
      // First, create a second reward to add and then remove
      const tempReward = {
        name: "Temporary Reward",
        points: 500
      } satisfies CreatePointRewardDto;

      const createResponse = await request(baseUrl)
        .post("/rewards/POINT")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(tempReward);

      const tempRewardId = createResponse.body.id;

      // Add to event
      await request(baseUrl)
        .post(`/events/${eventId}/rewards`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ rewardId: tempRewardId, condition: {}, autoResolve: true } satisfies Omit<CreateEventRewardDto, 'eventId'>)
        .expect(201);


      // Now remove it
      const response = await request(baseUrl)
        .delete(`/events/${eventId}/rewards/${tempRewardId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(204);
    });

    it("should request reward", async () => {
      const response = await request(baseUrl)
        .post(`/events/${eventId}/requests/${rewardId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("status", "PENDING");
      
      requestId = response.body.id;
    });

    it("should get reward requests", async () => {
      const response = await request(baseUrl)
        .get("/events/requests")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body).toHaveProperty("totalItems");

      const requestData = response.body.items[0];
      expect(requestData).toHaveProperty("id");
      expect(requestData).toHaveProperty("userId");
      expect(requestData.eventReward).toHaveProperty("id");
      expect(requestData).toHaveProperty("status");
    });

    it("should get specific reward request", async () => {
      const response = await request(baseUrl)
        .get(`/events/requests/${requestId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", requestId);
      expect(response.body).toHaveProperty("status");
    });

    it("should update reward request status", async () => {
      const response = await request(baseUrl)
        .patch(`/events/requests/${requestId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: RewardRequestStatus.APPROVED
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", requestId);
      expect(response.body).toHaveProperty("status", RewardRequestStatus.APPROVED);
    });

    it("should delete an event", async () => {
      // First create a temporary event to delete
      const tempEvent = {
        name: "Temporary Event to Delete",
        rewardCondition: { newUser: true },
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE
      } satisfies CreateEventDto;

      const createResponse = await request(baseUrl)
        .post("/events")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(tempEvent);

      const tempEventId = createResponse.body.id;

      // Now delete it
      const response = await request(baseUrl)
        .delete(`/events/${tempEventId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(204);
    });
  });

  // Test unauthorized access
  describe("Unauthorized Access", () => {
    it("should return 401 when accessing admin endpoints without token", async () => {
      const response = await request(baseUrl).get(`/auth/users/${userId}`);

      expect(response.status).toBe(401);
    });

    it("should return 403 when non-admin tries to update user roles", async () => {
      const email = `regularuser${Date.now()}@example.com`;
      // First create a regular user
      const userResponse = await request(baseUrl).post("/auth/users").send({
        email: email,
        password: "regular1234",
      });

      expect(userResponse.status).toBe(201);
      const regularUserId = userResponse.body.id;

      // Login as the regular user
      const loginResponse = await request(baseUrl).post("/auth/login").send({
        email: email,
        password: "regular1234",
      });

      expect(loginResponse.status).toBe(200);
      const regularUserToken = loginResponse.body.accessToken;

      // Try to update roles as regular user
      const response = await request(baseUrl)
        .patch(`/auth/users/${userId}/roles`)
        .set("Authorization", `Bearer ${regularUserToken}`)
        .send({
          roles: [Role.USER, Role.OPERATOR],
        });

      expect(response.status).toBe(403);
    });
  });

  // Test edge cases
  describe("Edge Cases", () => {
    it("should return 404 when querying non-existent user", async () => {
      const fakeUserId = "645f2d1b8c5cd2f948e9a999";
      const response = await request(baseUrl)
        .get(`/auth/users/${fakeUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it("should handle duplicate user creation", async () => {
      const response = await request(baseUrl)
        .post("/auth/users")
        .send(adminCredentials);

      expect(response.status).toBe(409);
    });

    it("should reject invalid role updates", async () => {
      const response = await request(baseUrl)
        .patch(`/auth/users/${userId}/roles`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          roles: [Role.USER, "INVALID_ROLE"],
        });

      expect(response.status).toBe(400);
    });
    
    it("should handle past date event creation", async () => {
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 1);
      
      const invalidEvent = {
        name: "Past Event",
        condition: { newUser: true },
        periodStart: pastDate.toISOString(),
        periodEnd: new Date().toISOString(),
        status: EventStatus.ACTIVE
      };
      
      const response = await request(baseUrl)
        .post("/events")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(invalidEvent);
        
      expect(response.status).toBe(400);
    });
    
    it("should reject adding reward to non-existent event", async () => {
      const fakeEventId = "645f2d1b8c5cd2f948e9a999";
      
      const response = await request(baseUrl)
        .post(`/events/${fakeEventId}/rewards`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ rewardId, condition: {}, autoResolve: true } satisfies Omit<CreateEventRewardDto, 'eventId'>);
        
      expect(response.status).toBe(404);
    });
    
    it("should handle expired token", async () => {
      // Use a made-up expired token
      const expiredToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      
      const response = await request(baseUrl)
        .get("/auth/me")
        .set("Authorization", `Bearer ${expiredToken}`);
        
      expect(response.status).toBe(401);
    });
  });
});
