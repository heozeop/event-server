import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import http from 'k6/http';
import { Options } from 'k6/options';

// Define test options
export const options: Options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users over 30 seconds
    { duration: '1m', target: 20 },   // Stay at 20 users for 1 minute
    { duration: '30s', target: 0 },   // Ramp down to 0 users over 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests should be below 1s
    'http_req_duration{status:200}': ['max<2000'], // Max duration for 200 OK should be below 2s
    'http_reqs{status:200}': ['rate>0.9'],         // 90% success rate
  },
};

// Initialize test data if needed
const eventIds = new SharedArray('eventIds', function() {
  // This could be replaced with actual event IDs in your system
  return Array.from({ length: 5 }, (_, i) => `event-${i + 1}`);
});

// Default function executed for each virtual user
export default function() {
  // Get events list
  const eventsResponse = http.get('http://event:3002/api/events');
  
  check(eventsResponse, {
    'status is 200': (r) => r.status === 200,
    'events list received': (r) => r.json().length > 0,
  });

  sleep(1);
  
  // Get specific event detail (using random event ID from the predefined list)
  const eventId = eventIds[Math.floor(Math.random() * eventIds.length)];
  const eventDetailResponse = http.get(`http://event:3002/api/events/${eventId}`);
  
  check(eventDetailResponse, {
    'event detail status is 200': (r) => r.status === 200,
    'event detail has data': (r) => r.json().id !== undefined,
  });
  
  sleep(1);
} 
