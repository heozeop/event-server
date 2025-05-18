import { check } from 'k6';
import http from 'k6/http';
import { Options } from 'k6/options';
import { v4 as uuidv4 } from 'uuid';

import { EventResponseDto } from '@libs/dtos';
import { baseUrl, defaultHeaders, getAuthToken } from '../common/helpers';

export const options: Options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '1m', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],
    'http_req_duration{name:create-event}': ['p(95)<500'],
  },
};

export default function() {
  const token = getAuthToken();
  const eventId = uuidv4();
  
  const payload = JSON.stringify({
    name: `Test Event ${eventId}`,
    description: 'This is a test event for load testing',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000).toISOString(), // 1 day later
    location: 'Test Location',
    maxParticipants: 100,
    rewardAmount: 1000
  });
  
  const headers = {
    ...defaultHeaders,
    'Authorization': `Bearer ${token}`
  };
  
  const res = http.post(`${baseUrl}/events`, payload, {
    headers,
    tags: { name: 'create-event' },
  });
  
  check(res, {
    'create event status is 201': (r) => r.status === 201,
    'has event id': (r) => (r.json() as EventResponseDto).id !== undefined,
  });
} 
