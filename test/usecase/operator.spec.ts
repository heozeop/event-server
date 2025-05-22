import { CreateEventDto, UpdateEventDto } from '@libs/dtos';
import { EventStatus, RewardRequestStatus, RewardType, Role } from "@libs/enums";
import request from "supertest";

describe("OPERATOR Use Cases", () => {
  const baseUrl = "http://localhost:3333";
  let operatorToken: string;
  let operatorId: string;
  let eventId: string;
  let rewardId: string;
  let requestId: string;

  // Operator credentials
  const operatorCredentials = {
    email: "operator@example.com",
    password: "operator1234",
  };

  // Setup: Login as operator
  beforeAll(async () => {
    // Login as operator
    const loginResponse = await request(baseUrl)
      .post("/auth/login")
      .send(operatorCredentials);

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty("accessToken");
    expect(loginResponse.body).toHaveProperty("user.roles");
    expect(loginResponse.body.user.roles).toContain(Role.OPERATOR);

    operatorToken = loginResponse.body.accessToken;
    operatorId = loginResponse.body.user.id;
  });

  // Test account management
  describe("Account Management", () => {
    it("should login with operator credentials", async () => {
      const response = await request(baseUrl)
        .post("/auth/login")
        .send(operatorCredentials);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body.user.roles).toContain(Role.OPERATOR);

      operatorToken = response.body.accessToken;
    });

    it("should get current operator information", async () => {
      const response = await request(baseUrl)
        .get("/auth/me")
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", operatorId);
      expect(response.body).toHaveProperty("email", operatorCredentials.email);
      expect(response.body).toHaveProperty("roles");
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
        name: "여름 방학 특별 이벤트",
        rewardCondition: {
          minUserAge: 13,
          maxUserAge: 19,
        },
        periodStart: today,
        periodEnd: nextMonth,
        status: EventStatus.ACTIVE,
      } satisfies CreateEventDto;

      const response = await request(baseUrl)
        .post("/events")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(newEvent);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("name", newEvent.name);

      eventId = response.body.id;
    });

    it("should get list of events", async () => {
      const response = await request(baseUrl)
        .get("/events?status=ACTIVE")
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body).toHaveProperty("hasMore");
      expect(response.body.items.length).toBeGreaterThan(0);

      // Verify event data structure
      const event = response.body.items[0];
      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("name");
      expect(event).toHaveProperty("periodStart");
      expect(event).toHaveProperty("periodEnd");
      expect(event).toHaveProperty("status");
    });

    it("should get specific event details", async () => {
      const response = await request(baseUrl)
        .get(`/events/${eventId}`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", eventId);
      expect(response.body).toHaveProperty("name");
      expect(response.body).toHaveProperty("periodStart");
      expect(response.body).toHaveProperty("periodEnd");
      expect(response.body).toHaveProperty("status");
    });

    it("should update an event", async () => {
      const updateData = {
        name: "Updated Event Name",
        rewardCondition: {
          minUserAge: 13,
          maxUserAge: 19,
        },
        periodStart: new Date(),
        periodEnd: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 30),
        status: EventStatus.ACTIVE,
      } satisfies Omit<UpdateEventDto, 'id'>;

      const response = await request(baseUrl)
        .patch(`/events/${eventId}`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", eventId);
      expect(response.body).toHaveProperty("name", updateData.name);
      expect(response.body).toHaveProperty("rewardCondition", updateData.rewardCondition);
      expect(response.body).toHaveProperty("periodStart", updateData.periodStart.toISOString());
      expect(response.body).toHaveProperty("periodEnd", updateData.periodEnd.toISOString());
      expect(response.body).toHaveProperty("status", updateData.status);
    });
  });

  // Test reward management
  describe("Reward Management", () => {
    it("should create a point reward", async () => {
      const pointReward = {
        name: "Point Reward",
        description: "Test point reward",
        points: 1000
      };

      const response = await request(baseUrl)
        .post("/rewards/POINT")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(pointReward);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("type", RewardType.POINT);
      expect(response.body).toHaveProperty("points", pointReward.points);

      rewardId = response.body.id;
    });

    it("should create a coupon reward", async () => {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      const couponReward = {
        name: "SUMMER2023",
        description: "Summer coupon",
        couponCode: "SUMMER2023",
        expiry: nextMonth.toISOString(),
      };

      const response = await request(baseUrl)
        .post("/rewards/COUPON")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(couponReward);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("type", RewardType.COUPON);
      expect(response.body).toHaveProperty("couponCode", couponReward.couponCode);
    });

    it("should get list of rewards", async () => {
      const response = await request(baseUrl)
        .get("/rewards")
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body).toHaveProperty("totalItems");
    });

    it("should get a specific reward", async () => {
      const response = await request(baseUrl)
        .get(`/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", rewardId);
      expect(response.body).toHaveProperty("type");
    });

    it("should add reward to event", async () => {
      const response = await request(baseUrl)
        .post(`/events/${eventId}/rewards`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send({
          rewardId: rewardId,
          condition: {
            minPurchase: 10000,
          },
          autoResolve: true,
        });

      expect(response.status).toBe(201);
    });

    it("should get rewards for a specific event", async () => {
      const response = await request(baseUrl)
        .get(`/events/${eventId}/rewards`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // Now we should have at least one reward
      expect(response.body.length).toBeGreaterThan(0);
      const addedReward = response.body.find(
        (eventReward: any) => eventReward.reward.id === rewardId,
      );
      expect(addedReward).toBeDefined();
      expect(addedReward.reward.type).toBe(RewardType.POINT);
    });

    it("should update a reward in an event", async () => {
      const updateData = {
        condition: {
          minPurchase: 5000
        }
      };

      const response = await request(baseUrl)
        .patch(`/events/${eventId}/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("event.id", eventId);
      expect(response.body).toHaveProperty("reward.id", rewardId);
      expect(response.body).toHaveProperty("condition", updateData.condition);
      expect(response.body).toHaveProperty("condition", updateData.condition);
    });

    it("should remove a reward from an event", async () => {
      // First, we need a second reward to add and then remove
      // Create another reward
      const anotherReward = {
        name: "Temporary Reward",
        description: "To be removed",
        points: 500
      };

      const createResponse = await request(baseUrl)
        .post("/rewards/POINT")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(anotherReward)
        .expect(201);

      const tempRewardId = createResponse.body.id;

      // Add it to the event
      await request(baseUrl)
        .post(`/events/${eventId}/rewards`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send({
          rewardId: tempRewardId,
          condition: {
            minPurchase: 10000,
          },
          autoResolve: true,
        })
        .expect(201);

      // Now remove it
      const response = await request(baseUrl)
        .delete(`/events/${eventId}/rewards/${tempRewardId}`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(response.status).toBe(204);
    });
  });

  // Test reward request management
  describe("Reward Request Management", () => {
    // Create a test user and have them request a reward
    let testUserToken: string;
    
    beforeAll(async () => {
      // Create a test user
      const email = `testuser${Date.now()}@example.com`;
      const password = "testuser1234";
      
      await request(baseUrl)
        .post("/auth/users")
        .send({
          email,
          password
        });
        
      // Login as the test user
      const loginResponse = await request(baseUrl)
        .post("/auth/login")
        .send({
          email,
          password
        });
        
      testUserToken = loginResponse.body.accessToken;
      
      // Have the test user request a reward
      const requestResponse = await request(baseUrl)
        .post(`/events/${eventId}/requests/${rewardId}`)
        .set("Authorization", `Bearer ${testUserToken}`);
        
      requestId = requestResponse.body.id;
    });

    it("should get all reward requests", async () => {
      const response = await request(baseUrl)
        .get("/events/requests")
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body).toHaveProperty("totalItems");
    });

    it("should filter reward requests by status", async () => {
      const response = await request(baseUrl)
        .get("/events/requests?status=PENDING")
        .set("Authorization", `Bearer ${operatorToken}`);

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

    it("should get a specific reward request", async () => {
      const response = await request(baseUrl)
        .get(`/events/requests/${requestId}`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", requestId);
      expect(response.body).toHaveProperty("status");
    });

    it("should update a reward request status", async () => {
      const response = await request(baseUrl)
        .patch(`/events/requests/${requestId}`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send({
          status: RewardRequestStatus.APPROVED
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", requestId);
      expect(response.body).toHaveProperty("status", RewardRequestStatus.APPROVED);
    });
  });

  // Test unauthorized access
  describe("Unauthorized Access", () => {
    it("should return 401 when creating event without token", async () => {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      const newEvent = {
        name: "여름 방학 특별 이벤트",
        condition: {
          minUserAge: 13,
          maxUserAge: 19,
        },
        periodStart: today.toISOString(),
        periodEnd: nextMonth.toISOString(),
        status: EventStatus.ACTIVE,
      };

      const response = await request(baseUrl).post("/events").send(newEvent);
      expect(response.status).toBe(401);
    });

    it("should return 403 when non-operator tries to create event", async () => {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      const email = `regularuser${Date.now()}@example.com`;

      // First create a regular user
      const userResponse = await request(baseUrl).post("/auth/users").send({
        email: email,
        password: "regular1234",
      });

      expect(userResponse.status).toBe(201);

      // Login as the regular user
      const loginResponse = await request(baseUrl).post("/auth/login").send({
        email: email,
        password: "regular1234",
      });

      expect(loginResponse.status).toBe(200);
      const regularUserToken = loginResponse.body.accessToken;

      // Try to create event as regular user
      const response = await request(baseUrl)
        .post("/events")
        .set("Authorization", `Bearer ${regularUserToken}`)
        .send({
          name: "Unauthorized Event",
          condition: { newUser: true },
          periodStart: today.toISOString(),
          periodEnd: nextMonth.toISOString(),
          status: EventStatus.ACTIVE,
        });

      expect(response.status).toBe(403);
    });
  });

  // Test edge cases
  describe("Edge Cases", () => {
    it("should handle invalid date format in event creation", async () => {
      const invalidEvent = {
        name: "잘못된 날짜 이벤트",
        condition: {
          newUser: true,
        },
        periodStart: "2023-13-01T00:00:00.000Z", // Invalid month
        periodEnd: "2023-05-31T23:59:59.999Z",
        status: "ACTIVE",
      };

      const response = await request(baseUrl)
        .post("/events")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(invalidEvent);

      expect(response.status).toBe(400);
    });

    it("should reject event with end date before start date", async () => {
      const invalidEvent = {
        name: "날짜 역전 이벤트",
        condition: {
          newUser: true,
        },
        periodStart: "2023-05-31T00:00:00.000Z",
        periodEnd: "2023-05-01T23:59:59.999Z", // Before start date
        status: "ACTIVE",
      };

      const response = await request(baseUrl)
        .post("/events")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(invalidEvent);

      expect(response.status).toBe(400);
    });

    it("should reject event with missing required fields", async () => {
      const invalidEvent = {
        name: "필드 누락 이벤트",
        condition: {
          newUser: true,
        },
        // Missing period and status
      };

      const response = await request(baseUrl)
        .post("/events")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(invalidEvent);

      expect(response.status).toBe(400);
    });

    it("should reject negative points in point reward creation", async () => {
      const invalidReward = {
        points: -1000,
      };

      const response = await request(baseUrl)
        .post("/rewards/POINT")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(invalidReward);

      expect(response.status).toBe(400);
    });

    it("should reject invalid reward type", async () => {
      const rewardData = {
        points: 1000,
      };

      const response = await request(baseUrl)
        .post("/rewards/UNKNOWN_TYPE")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(rewardData);

      expect(response.status).toBe(400);
    });

    it("should reject adding already expired coupon reward", async () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1); // Set to 1 year ago
      
      const expiredCoupon = {
        name: "Expired Coupon",
        description: "This coupon has already expired",
        couponCode: "EXPIRED2023",
        expiry: pastDate.toISOString(),
      };

      const response = await request(baseUrl)
        .post("/rewards/COUPON")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(expiredCoupon);

      expect(response.status).toBe(400);
    });

    it("should prevent adding the same reward to an event twice", async () => {
      // Try to add the same reward again
      const response = await request(baseUrl)
        .post(`/events/${eventId}/rewards`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send({
          rewardId: rewardId,
          condition: {
            minPurchase: 10000,
          },
          autoResolve: true,
        });

      expect(response.status).toBe(409);
    });
  });
});
