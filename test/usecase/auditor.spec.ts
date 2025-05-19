import { Role } from '@libs/enums';
import request from 'supertest';

describe('AUDITOR Use Cases', () => {
  const baseUrl = 'http://localhost:3333';
  let auditorToken: string;
  let auditorId: string;
  let eventId: string;

  // Auditor credentials
  const auditorCredentials = {
    email: 'auditor@example.com',
    password: 'auditor1234',
  };

  // Setup: Login as auditor
  beforeAll(async () => {
    // Login as auditor
    const loginResponse = await request(baseUrl)
      .post('/auth/login')
      .send(auditorCredentials);

    expect(loginResponse.status).toBe(201);
    expect(loginResponse.body).toHaveProperty('accessToken');
    expect(loginResponse.body).toHaveProperty('user.roles');
    expect(loginResponse.body.user.roles).toContain(Role.AUDITOR);

    auditorToken = loginResponse.body.accessToken;
    auditorId = loginResponse.body.user.id;

    // Find an active event for testing
    const eventsResponse = await request(baseUrl)
      .get('/events')
      .set('Authorization', `Bearer ${auditorToken}`);

    if (eventsResponse.body.length > 0) {
      // Find an active event
      const activeEvent = eventsResponse.body.find((event: any) => 
        event.status === 'ACTIVE' && 
        new Date(event.periodEnd) > new Date());
      
      if (activeEvent) {
        eventId = activeEvent.id;
      }
    }
  });

  // Test account management
  describe('Account Management', () => {
    it('should login with auditor credentials', async () => {
      const response = await request(baseUrl)
        .post('/auth/login')
        .send(auditorCredentials);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.roles).toContain(Role.AUDITOR);
      auditorToken = response.body.accessToken;
    });

    it('should get current auditor information', async () => {
      const response = await request(baseUrl)
        .get('/auth/me')
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', auditorId);
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
      expect(response.body.length).toBeGreaterThan(0);
      
      // Verify event data structure
      const event = response.body[0];
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('name');
      expect(event).toHaveProperty('condition');
      expect(event).toHaveProperty('periodStart');
      expect(event).toHaveProperty('periodEnd');
      expect(event).toHaveProperty('status');
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
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('condition');
      expect(response.body).toHaveProperty('periodStart');
      expect(response.body).toHaveProperty('periodEnd');
      expect(response.body).toHaveProperty('status');
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
      
      // Verify reward data structure if rewards exist
      if (response.body.length > 0) {
        const reward = response.body[0];
        expect(reward).toHaveProperty('id');
        expect(reward).toHaveProperty('type');
        if (reward.type === 'POINT') {
          expect(reward).toHaveProperty('points');
        } else if (reward.type === 'COUPON') {
          expect(reward).toHaveProperty('code');
          expect(reward).toHaveProperty('discount');
          expect(reward).toHaveProperty('maxUses');
          expect(reward).toHaveProperty('expiresAt');
        }
      }
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
      
      // Verify request data structure if requests exist
      if (response.body.length > 0) {
        const request = response.body[0];
        expect(request).toHaveProperty('id');
        expect(request).toHaveProperty('userId');
        expect(request).toHaveProperty('eventId');
        expect(request).toHaveProperty('status');
        expect(request).toHaveProperty('createdAt');
      }
    });

    it('should filter reward requests by status', async () => {
      const response = await request(baseUrl)
        .get('/events/requests?status=PENDING')
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // All requests should have PENDING status
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
      
      // All requests should be for the specified event
      response.body.forEach((request: any) => {
        expect(request.event.id).toBe(eventId);
      });
    });

    it('should filter reward requests by user ID', async () => {
      // First get a user ID from any request
      const allRequestsResponse = await request(baseUrl)
        .get('/events/requests')
        .set('Authorization', `Bearer ${auditorToken}`);

      if (allRequestsResponse.body.length === 0) {
        console.log('Skipping test because no requests are available');
        return;
      }

      const userId = allRequestsResponse.body[0].userId;

      const response = await request(baseUrl)
        .get(`/events/requests?userId=${userId}`)
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // All requests should be from the specified user
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
        .put(`/auth/users/${auditorId}/roles`)
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
