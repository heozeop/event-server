import { faker } from '@faker-js/faker';
import { EventStatus, RewardType, Role } from '@libs/enums';
import request from 'supertest';
jest.setTimeout(60 *60 * 1_000);

describe('ADMIN Use Cases', () => {
  const baseUrl = 'http://localhost:3333';
  let adminToken: string;
  let userId: string;
  let eventId: string;
  let rewardId: string;

  // Admin credentials for login
  const adminCredentials = {
    email: 'admin@example.com',
    password: 'admin1234',
  };

  // Setup: Login as admin
  beforeAll(async () => {
    const response = await request(baseUrl)
      .post('/auth/login')
      .send(adminCredentials);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('user.roles');
    expect(response.body.user.roles).toContain(Role.ADMIN);

    adminToken = response.body.accessToken;
  });

  // Test admin login
  describe('Admin Authentication', () => {
    it('should login as admin', async () => {
      const response = await request(baseUrl)
        .post('/auth/login')
        .send(adminCredentials);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user.roles');
      expect(response.body.user.roles).toContain(Role.ADMIN);
    });

    it('should get current admin user information', async () => {
      const response = await request(baseUrl)
        .get('/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', adminCredentials.email);
      expect(response.body).toHaveProperty('roles');
      expect(response.body.roles).toContain(Role.ADMIN);
    });
  });

  // Test user management
  describe('User Management', () => {
    const testUser = {
      email: 'testuser@example.com',
      password: 'testuser1234',
    };

    // Create a test user
    beforeAll(async () => {
      const response = await request(baseUrl)
        .post('/auth/users')
        .send(testUser);

      if (response.status === 201) {
        userId = response.body.id;
      } else if (response.status > 400) {
        // User already exists, fetch the user ID
        const userResponse = await request(baseUrl)
          .get(`/auth/users/email?email=${testUser.email}`)
          .set('Authorization', `Bearer ${adminToken}`);
        
        userId = userResponse.body.id;
      }
    });

    it('should find user by email', async () => {
      const response = await request(baseUrl)
        .get(`/auth/users/email?email=${testUser.email}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('id');
    });

    it('should find user by ID', async () => {
      const response = await request(baseUrl)
        .get(`/auth/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('id', userId);
    });

    it('should update user roles', async () => {
      const response = await request(baseUrl)
        .put(`/auth/users/${userId}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roles: [Role.USER, Role.OPERATOR],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('roles');
      expect(response.body.roles).toContain(Role.USER);
      expect(response.body.roles).toContain(Role.OPERATOR);
    });
  });

  // Test event and reward management
  describe('Event and Reward Management', () => {
    it('should create a new event', async () => {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      const newEvent = {
        name: faker.book.title(),
        condition: {
          newUser: true,
        },
        periodStart: today.toISOString(),
        periodEnd: nextMonth.toISOString(),
        status: EventStatus.ACTIVE,
      };

      const response = await request(baseUrl)
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newEvent);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', newEvent.name);

      eventId = response.body.id;
    });

    it('should create a point reward', async () => {
      const newReward = {
        name: faker.book.title(),
        points: 1000,
      };

      const response = await request(baseUrl)
        .post('/rewards/POINT')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newReward);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('type', 'POINT');
      expect(response.body).toHaveProperty('points', newReward.points);

      rewardId = response.body.id;
    });

    it('should add reward to event', async () => {
      const response = await request(baseUrl)
        .post(`/events/${eventId}/rewards`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rewardId: rewardId,
        });

      expect(response.status).toBe(201);
    });

    it('should get rewards for a specific event', async () => {
      const response = await request(baseUrl)
        .get(`/events/${eventId}/rewards`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const addedReward = response.body.find((reward: any) => reward.id === rewardId);
      expect(addedReward).toBeDefined();
      expect(addedReward.type).toBe(RewardType.POINT);
    });

    it('should request reward', async () => {
      const response = await request(baseUrl)
        .post(`/events/${eventId}/requests`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send();

      expect(response.status).toBe(201);
    });

    it('should get reward requests', async () => {
      const response = await request(baseUrl)
        .get('/events/requests?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  // Test unauthorized access
  describe('Unauthorized Access', () => {
    it('should return 401 when accessing user list without token', async () => {
      const response = await request(baseUrl).get('/auth/users/email?email=user@example.com');
      expect(response.status).toBe(401);
    });
  });

  // Test edge cases
  describe('Edge Cases', () => {
    it('should return 404 when querying non-existent user', async () => {
      const fakeUserId = '111111111111111111111111';
      const response = await request(baseUrl)
        .get(`/auth/users/${fakeUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should handle duplicate user creation', async () => {
      const response = await request(baseUrl)
        .post('/auth/users')
        .send(adminCredentials);

      expect(response.status).toBe(409);
    });

    it('should reject invalid role updates', async () => {
      const response = await request(baseUrl)
        .put(`/auth/users/${userId}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roles: [Role.USER, 'INVALID_ROLE'],
        });

      expect(response.status).toBe(400);
    });
  });
}); 
