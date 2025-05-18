import { RewardType, Role } from '@libs/enums';
import request from 'supertest';

describe('OPERATOR Use Cases', () => {
  const baseUrl = 'http://localhost:3333';
  let operatorToken: string;
  let eventId: string;
  let rewardId: string;

  // Operator credentials for login
  const operatorCredentials = {
    email: 'operator@example.com',
    password: 'operator1234',
  };

  // Setup: Login as operator
  beforeAll(async () => {
    // First try to create a user with operator role if needed
    try {
      // Create user first (might fail if exists)
      await request(baseUrl).post('/auth/users').send(operatorCredentials);
      
      // Login as admin to set operator role
      const adminLogin = await request(baseUrl)
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'admin1234',
        });

      const adminToken = adminLogin.body.accessToken;

      // Get user by email
      const userResponse = await request(baseUrl)
        .get(`/auth/users/email?email=${operatorCredentials.email}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Update roles to include OPERATOR
      await request(baseUrl)
        .put(`/auth/users/${userResponse.body.id}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roles: [Role.USER, Role.OPERATOR],
        });
    } catch (error: any) {
      console.log('Setup error (may be normal if user exists):', error.message);
    }

    // Now login as operator
    const response = await request(baseUrl)
      .post('/auth/login')
      .send(operatorCredentials);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    operatorToken = response.body.accessToken;
  });

  // Test operator login and account info
  describe('Operator Authentication', () => {
    it('should login as operator', async () => {
      const response = await request(baseUrl)
        .post('/auth/login')
        .send(operatorCredentials);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.roles).toContain(Role.OPERATOR);
    });

    it('should get current operator user information', async () => {
      const response = await request(baseUrl)
        .get('/auth/me')
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', operatorCredentials.email);
      expect(response.body).toHaveProperty('roles');
      expect(response.body.roles).toContain(Role.OPERATOR);
    });
  });

  // Test event management
  describe('Event Management', () => {
    it('should create a new event', async () => {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      const newEvent = {
        name: '여름 방학 특별 이벤트',
        condition: {
          minUserAge: 13,
          maxUserAge: 19,
        },
        period: {
          start: today.toISOString(),
          end: nextMonth.toISOString(),
        },
        status: 'ACTIVE',
      };

      const response = await request(baseUrl)
        .post('/events')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send(newEvent);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', newEvent.name);

      eventId = response.body.id;
    });

    it('should get list of events', async () => {
      const response = await request(baseUrl)
        .get('/events?status=ACTIVE')
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get specific event by ID', async () => {
      const response = await request(baseUrl)
        .get(`/events/${eventId}`)
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', eventId);
    });
  });

  // Test reward management
  describe('Reward Management', () => {
    it('should create a coupon reward', async () => {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      const couponReward = {
        couponCode: 'SUMMER2023',
        expiry: nextMonth.toISOString(),
      };

      const response = await request(baseUrl)
        .post('/rewards/COUPON')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send(couponReward);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('type', RewardType.COUPON);
      expect(response.body).toHaveProperty('couponCode', couponReward.couponCode);

      rewardId = response.body.id;
    });

    it('should get list of rewards', async () => {
      const response = await request(baseUrl)
        .get('/rewards')
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should add reward to event', async () => {
      const response = await request(baseUrl)
        .post(`/events/${eventId}/rewards`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          rewardId: rewardId,
        });

      expect(response.status).toBe(204);
    });

    it('should get rewards for a specific event', async () => {
      const response = await request(baseUrl)
        .get(`/events/${eventId}/rewards`)
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const addedReward = response.body.find((reward: any) => reward.id === rewardId);
      expect(addedReward).toBeDefined();
      expect(addedReward.type).toBe(RewardType.COUPON);
    });
  });

  // Test unauthorized access
  describe('Unauthorized Access', () => {
    it('should return 401 when creating event without token', async () => {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      const newEvent = {
        name: '여름 방학 특별 이벤트',
        condition: {
          minUserAge: 13,
          maxUserAge: 19,
        },
        period: {
          start: today.toISOString(),
          end: nextMonth.toISOString(),
        },
        status: 'ACTIVE',
      };

      const response = await request(baseUrl).post('/events').send(newEvent);
      expect(response.status).toBe(401);
    });
  });

  // Test edge cases
  describe('Edge Cases', () => {
    it('should handle invalid date format in event creation', async () => {
      const invalidEvent = {
        name: '잘못된 날짜 이벤트',
        condition: {
          newUser: true,
        },
        period: {
          start: '2023-13-01T00:00:00.000Z', // Invalid month
          end: '2023-05-31T23:59:59.999Z',
        },
        status: 'ACTIVE',
      };

      const response = await request(baseUrl)
        .post('/events')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send(invalidEvent);

      expect(response.status).toBe(400);
    });

    it('should reject event with end date before start date', async () => {
      const invalidEvent = {
        name: '날짜 역전 이벤트',
        condition: {
          newUser: true,
        },
        period: {
          start: '2023-05-31T00:00:00.000Z',
          end: '2023-05-01T23:59:59.999Z', // Before start date
        },
        status: 'ACTIVE',
      };

      const response = await request(baseUrl)
        .post('/events')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send(invalidEvent);

      expect(response.status).toBe(400);
    });

    it('should reject event with missing required fields', async () => {
      const invalidEvent = {
        name: '필드 누락 이벤트',
        condition: {
          newUser: true,
        },
        // Missing period and status
      };

      const response = await request(baseUrl)
        .post('/events')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send(invalidEvent);

      expect(response.status).toBe(400);
    });

    it('should reject negative points in point reward creation', async () => {
      const invalidReward = {
        points: -1000,
      };

      const response = await request(baseUrl)
        .post('/rewards/POINT')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send(invalidReward);

      expect(response.status).toBe(400);
    });

    it('should reject invalid reward type', async () => {
      const rewardData = {
        points: 1000,
      };

      const response = await request(baseUrl)
        .post('/rewards/UNKNOWN_TYPE')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send(rewardData);

      expect(response.status).toBe(400);
    });

    it('should prevent adding the same reward to an event twice', async () => {
      // Try to add the same reward again
      const response = await request(baseUrl)
        .post(`/events/${eventId}/rewards`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          rewardId: rewardId,
        });

      expect(response.status).toBe(409);
    });
  });
}); 
