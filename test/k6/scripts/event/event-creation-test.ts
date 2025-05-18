import { getAdminToken } from '@/common/admin.login';
import { faker } from '@faker-js/faker';
import { check } from 'k6';
import http from 'k6/http';
import { Counter } from 'k6/metrics';
import { Options } from 'k6/options';
import { API_BASE_URL } from 'prepare/constants';
import { randomSleep } from '../utils';

// Custom metrics
const successfulCreations = new Counter('successful_event_creations');

// Define test options based on requirements: 30 requests per second, 250ms response time
export const options: Options = {
  scenarios: {
    event_creation: {
      executor: 'constant-arrival-rate',
      rate: 30,              // 30 requests per second
      timeUnit: '1s',        // 1 second
      duration: '2m',        // 2 minutes
      preAllocatedVUs: 40,   // Initial pool of VUs
      maxVUs: 80,            // Maximum number of VUs to handle the rate
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<250'], // 95% of requests should be below 250ms
    'http_req_duration{status:201}': ['max<400'], // Max duration for 201 Created should be below 400ms
    'http_reqs{status:201}': ['rate>0.99'], // 99% success rate
    successful_creations: ['count>3500'], // Expecting ~3600 successful requests over 2 minutes (30/s * 120s)
  },
};

// Real template event data based on the JSON data files
const EVENT_TEMPLATES = [
  {
    name: "Flatley Group Event",
    condition: { minPurchase: 9241, maxRewards: 4 },
    period: { start: "2025-06-22T19:47:30.744Z", end: "2025-06-29T19:47:30.744Z" }
  },
  {
    name: "Stoltenberg - Carter Event",
    condition: { minPurchase: 4262, maxRewards: 3 },
    period: { start: "2025-10-10T05:00:32.871Z", end: "2025-11-02T05:00:32.871Z" }
  },
  {
    name: "Abbott - Anderson Event",
    condition: { minPurchase: 7206, maxRewards: 2 },
    period: { start: "2025-08-02T06:13:45.539Z", end: "2025-08-22T06:13:45.539Z" }
  },
  {
    name: "Schultz LLC Event",
    condition: { minPurchase: 6697, maxRewards: 1 },
    period: { start: "2025-06-05T11:47:04.413Z", end: "2025-07-05T11:47:04.413Z" }
  },
  {
    name: "Fisher - Ratke Event",
    condition: { minPurchase: 2837, maxRewards: 4 },
    period: { start: "2026-03-17T19:55:35.974Z", end: "2026-04-10T19:55:35.974Z" }
  },
  {
    name: "Gottlieb - McCullough Event",
    condition: { minPurchase: 5066, maxRewards: 3 },
    period: { start: "2025-09-17T05:50:35.916Z", end: "2025-09-29T05:50:35.916Z" }
  },
  {
    name: "Tremblay, Parker and Davis Event",
    condition: { minPurchase: 379, maxRewards: 3 },
    period: { start: "2025-08-14T14:16:04.252Z", end: "2025-08-31T14:16:04.252Z" }
  },
  {
    name: "Feil LLC Event",
    condition: { minPurchase: 7438, maxRewards: 1 },
    period: { start: "2025-07-06T20:14:16.724Z", end: "2025-07-16T20:14:16.724Z" }
  }
];

// Setup function - runs once per VU
export function setup(): { authToken: string } {
  // Save auth token for test runs
  const authToken = getAdminToken();
  
  return {
    authToken
  };
}

// Generate a random event name using a template plus a unique suffix
function generateEventName(index: number): string {
  const templateEvent = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
  return `${templateEvent.name}-${faker.string.uuid().substring(0, 8)}-${index}`;
}

// Generate future dates for event period based on templates
function generateEventPeriod(): { start: string; end: string } {
  const templateEvent = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
  
  // Generate dates based on template but with slight randomization
  const startDate = new Date(templateEvent.period.start);
  startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 5)); // Add 0-5 days
  
  const endDate = new Date(templateEvent.period.end);
  endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 5) - 2); // Add -2 to +2 days
  
  return {
    start: startDate.toISOString(),
    end: endDate.toISOString()
  };
}

// Default function executed for each virtual user
export default function(data: { authToken: string }): void {
  // Small random delay to prevent perfect sync of requests
  randomSleep(1, 5);
  
  const { authToken } = data;
  const eventIndex = __ITER;
  
  // Get a template event
  const templateIndex = Math.floor(Math.random() * EVENT_TEMPLATES.length);
  const templateEvent = EVENT_TEMPLATES[templateIndex];
  
  // Generate event data with some randomization based on the template
  const eventPeriod = generateEventPeriod();
  const minPurchase = Math.max(100, templateEvent.condition.minPurchase + Math.floor(Math.random() * 1000) - 500);
  const maxRewards = Math.max(1, templateEvent.condition.maxRewards + Math.floor(Math.random() * 2) - 1);

  const eventPayload = JSON.stringify({
    name: generateEventName(eventIndex),
    condition: {
      minPurchase: minPurchase,
      maxRewards: maxRewards
    },
    period: eventPeriod,
    status: 'ACTIVE'
  });
  
  // Make event creation request
  const response = http.post(
    `${API_BASE_URL}/events`,
    eventPayload,
    {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  // Check response
  const success = check(response, {
    'status is 201': (r) => r.status === 201,
    'response time < 250ms': (r) => r.timings.duration < 250,
    'event id exists': (r) => r.json('id') !== undefined,
    'event name matches': (r) => r.json('name') !== undefined && (r.json('name') as string).includes('Event'),
    'condition exists': (r) => {
      const condition = r.json('condition') as any;
      return condition && 
        typeof condition.minPurchase === 'number' && 
        typeof condition.maxRewards === 'number';
    },
    'period exists': (r) => {
      const period = r.json('period') as any;
      return period && 
        typeof period.start === 'string' && 
        typeof period.end === 'string';
    },
    'status is ACTIVE': (r) => r.json('status') === 'ACTIVE',
  });
  
  // Increment counter if request was successful
  if (success) {
    successfulCreations.add(1);
  }
} 
