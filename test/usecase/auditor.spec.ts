import { Role } from '@libs/enums';
import request from 'supertest';

describe('AUDITOR Use Cases', () => {
  const baseUrl = 'http://localhost:3333';
  let auditorToken: string;
  let userId: string;
  let eventId: string;

  // Auditor credentials for login
  const auditorCredentials = {
    email: 'auditor@example.com',
    password: 'auditor1234',
  };

  // Setup: Login as auditor
  beforeAll(async () => {
    // First try to create a user with auditor role if needed
    try {
      // Create user first (might fail if exists)
      await request(baseUrl).post('/auth/users').send(auditorCredentials);
      
      // Login as admin to set auditor role
      const adminLogin = await request(baseUrl)
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'admin1234',
        });

      const adminToken = adminLogin.body.accessToken;

      // Get user by email
      const userResponse = await request(baseUrl)
        .get(`/auth/users/email?email=${auditorCredentials.email}`)
        .set('Authorization', `Bearer ${adminToken}`);

      userId = userResponse.body.id;

      // Update roles to include AUDITOR
      await request(baseUrl)
        .put(`/auth/users/${userId}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roles: [Role.USER, Role.AUDITOR],
        });
    } catch (error: any) {
      console.log('Setup error (may be normal if user exists):', error.message);
    }

    // Now login as auditor
    const response = await request(baseUrl)
      .post('/auth/login')
      .send(auditorCredentials);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('accessToken');
    auditorToken = response.body.accessToken;

    // Get an event ID for testing
    const eventsResponse = await request(baseUrl)
      .get('/events')
      .set('Authorization', `Bearer ${auditorToken}`);

    if (eventsResponse.body.length > 0) {
      eventId = eventsResponse.body[0].id;
    }
  });

  // Test auditor login and account info
  describe('Auditor Authentication', () => {
    it('should login as auditor', async () => {
      const response = await request(baseUrl)
        .post('/auth/login')
        .send(auditorCredentials);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.roles).toContain(Role.AUDITOR);
    });

    it('should get current auditor user information', async () => {
      const response = await request(baseUrl)
        .get('/auth/me')
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', auditorCredentials.email);
      expect(response.body).toHaveProperty('roles');
      expect(response.body.roles).toContain(Role.AUDITOR);
    });
  });

  // Test event monitoring
  describe('Event Monitoring', () => {
    it('should get all events', async () => {
      const response = await request(baseUrl)
        .get('/events')
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // Save an event ID if we don't have one yet
      if (!eventId && response.body.length > 0) {
        eventId = response.body[0].id;
      }
    });

    it('should get specific event details', async () => {
      // Skip if no event is available
      if (!eventId) {
        console.log('Skipping test because no event ID is available');
        return;
      }

      const response = await request(baseUrl)
        .get(`/events/${eventId}`)
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', eventId);
    });

    it('should get event rewards', async () => {
      // Skip if no event is available
      if (!eventId) {
        console.log('Skipping test because no event ID is available');
        return;
      }

      const response = await request(baseUrl)
        .get(`/events/${eventId}/rewards`)
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // Test reward request auditing
  describe('Reward Request Auditing', () => {
    it('should get all reward requests', async () => {
      const response = await request(baseUrl)
        .get('/events/requests')
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter reward requests by status', async () => {
      const response = await request(baseUrl)
        .get('/events/requests?status=PENDING')
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // All returned items should have status PENDING
      response.body.forEach((request: any) => {
        expect(request.status).toBe('PENDING');
      });
    });

    it('should filter reward requests by event ID', async () => {
      // Skip if no event is available
      if (!eventId) {
        console.log('Skipping test because no event ID is available');
        return;
      }

      const response = await request(baseUrl)
        .get(`/events/requests?eventId=${eventId}`)
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // All returned items should be for this event
      response.body.forEach((request: any) => {
        expect(request.event.id).toBe(eventId);
      });
    });

    it('should filter reward requests by user ID', async () => {
      const response = await request(baseUrl)
        .get(`/events/requests?userId=${userId}`)
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // All returned items should be for this user
      response.body.forEach((request: any) => {
        expect(request.userId).toBe(userId);
      });
    });
  });

  // Test unauthorized access
  describe('Unauthorized Access', () => {
    it('should return 401 when accessing reward requests without token', async () => {
      const response = await request(baseUrl).get('/events/requests');
      expect(response.status).toBe(401);
    });

    it('should forbid role updates by auditor', async () => {
      // Try to update a user's roles (which should be forbidden for AUDITOR)
      const response = await request(baseUrl)
        .put(`/auth/users/${userId}/roles`)
        .set('Authorization', `Bearer ${auditorToken}`)
        .send({
          roles: [Role.USER, Role.OPERATOR],
        });

      expect(response.status).toBe(403);
    });
  });

  // Test edge cases
  describe('Edge Cases', () => {
    it('should handle non-existent event ID', async () => {
      const fakeEventId = '645f2d1b8c5cd2f948e9a999';
      const response = await request(baseUrl)
        .get(`/events/${fakeEventId}`)
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(response.status).toBe(404);
    });

    it('should handle non-existent event rewards', async () => {
      const fakeEventId = '645f2d1b8c5cd2f948e9a999';
      const response = await request(baseUrl)
        .get(`/events/${fakeEventId}/rewards`)
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(response.status).toBe(404);
    });

    it('should handle invalid status parameter', async () => {
      const response = await request(baseUrl)
        .get('/events/requests?status=INVALID_STATUS')
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(response.status).toBe(400);
    });

    it('should handle invalid ObjectId format', async () => {
      const response = await request(baseUrl)
        .get('/events/requests?eventId=invalid-object-id')
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(response.status).toBe(400);
    });

    it('should handle non-existent user ID in requests', async () => {
      const fakeUserId = '645f2d1b8c5cd2f948e9a999';
      const response = await request(baseUrl)
        .get(`/events/requests?userId=${fakeUserId}`)
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0); // Should return empty array, not an error
    });
  });
}); 
