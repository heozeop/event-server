import { check } from 'k6';
import http from 'k6/http';
import { Counter } from 'k6/metrics';
import { Options } from 'k6/options';
import { API_BASE_URL, TEST_PASSWORD } from 'prepare/constants';
import { randomSleep } from '../utils';
import { authenticate } from './auth-utils';

// Type definitions for events and rewards
type Event = {
  id: string;
  name: string;
  condition: {
    minPurchase: number;
    maxRewards: number;
  };
  period: {
    start: string;
    end: string;
  };
  status: string;
  createdAt: string;
};

type Reward = {
  _id: string;
  type: string;
  name: string;
  [key: string]: unknown;
};

// Custom metrics
const successfulNewEventConnections = new Counter('successful_new_event_connections');
const successfulExistingEventConnections = new Counter('successful_existing_event_connections');

// Admin user credentials - from the prepared data
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = TEST_PASSWORD;

// Load data from JSON files
function loadTestData(): { activeEvents: Event[]; inactiveEvents: Event[]; rewards: Reward[] } {
  // Load events data
  const events = JSON.parse(open('../prepare/data/events.json')) as Event[];
  
  // Filter events by status
  const activeEvents = events.filter(event => event.status === 'ACTIVE');
  const inactiveEvents = events.filter(event => event.status === 'INACTIVE');
  
  // Load rewards data
  const rewards = JSON.parse(open('../prepare/data/rewards.json')) as Reward[];
  
  return {
    activeEvents,
    inactiveEvents,
    rewards
  };
}

// Define test options with two scenarios as per requirements
export const options: Options = {
  scenarios: {
    // Scenario 1: Add rewards to new events - 5 requests per second
    new_event_rewards: {
      executor: 'constant-arrival-rate',
      rate: 5,               // 5 requests per second
      timeUnit: '1s',        // 1 second
      duration: '2m',        // 2 minutes
      preAllocatedVUs: 10,   // Initial pool of VUs
      maxVUs: 30,            // Maximum number of VUs to handle the rate
      exec: 'newEventScenario', // Function to execute
    },
    // Scenario 2: Add rewards to existing events - 8 requests per second
    existing_event_rewards: {
      executor: 'constant-arrival-rate',
      rate: 8,               // 8 requests per second
      timeUnit: '1s',        // 1 second
      duration: '2m',        // 2 minutes
      preAllocatedVUs: 15,   // Initial pool of VUs
      maxVUs: 40,            // Maximum number of VUs to handle the rate
      exec: 'existingEventScenario', // Function to execute
    },
  },
  thresholds: {
    // All responses should be below 150ms for 95% of requests (as per requirement)
    http_req_duration: ['p(95)<150'],
    
    // Specific thresholds for each scenario
    'http_req_duration{scenario:new_event_rewards}': ['p(95)<150'],
    'http_req_duration{scenario:existing_event_rewards}': ['p(95)<150'],
    
    // Threshold for success rates
    'http_reqs{status:200}': ['rate>0.99'], // 99% success rate overall
    
    // Custom metrics thresholds
    successful_new_event_connections: ['count>550'],     // Expecting ~600 (5/s * 120s)
    successful_existing_event_connections: ['count>900'], // Expecting ~960 (8/s * 120s)
  },
};

// Setup function - runs once per VU
export function setup() {
  // Get auth token for admin user
  const token = authenticate(ADMIN_EMAIL, ADMIN_PASSWORD);
  
  // Load test data
  const testData = loadTestData();
  
  return {
    token,
    testData
  };
}

// Scenario 1: Add rewards to new events (created in the last 24 hours)
export function newEventScenario(data: { token: string; testData: { activeEvents: Event[]; inactiveEvents: Event[]; rewards: Reward[] } }) {
  randomSleep(2, 10);
  
  // Use data from setup
  const { token, testData } = data;
  const { activeEvents, rewards } = testData;
  
  // Get a random new event (simulate newly created event by using active events)
  const event = activeEvents[Math.floor(Math.random() * activeEvents.length)];
  
  // Get a random reward
  const reward = rewards[Math.floor(Math.random() * rewards.length)];
  
  // Add reward to event
  const response = http.post(
    `${API_BASE_URL}/events/${event.id}/rewards`,
    {
      rewardId: reward._id
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  // Check response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 150ms': (r) => r.timings.duration < 150,
  });
  
  if (success) {
    successfulNewEventConnections.add(1);
  }
}

// Scenario 2: Add rewards to existing events
export function existingEventScenario(data: { token: string; testData: { activeEvents: Event[]; inactiveEvents: Event[]; rewards: Reward[] } }) {
  randomSleep(2, 10);
  
  // Use data from setup
  const { token, testData } = data;
  const { inactiveEvents, rewards } = testData;
  
  // Get a random existing event (simulate existing event by using inactive events)
  const event = inactiveEvents[Math.floor(Math.random() * inactiveEvents.length)];
  
  // Get a random reward
  const reward = rewards[Math.floor(Math.random() * rewards.length)];
  
  // Add reward to event
  const response = http.post(
    `${API_BASE_URL}/events/${event.id}/rewards`,
    {
      rewardId: reward._id
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  // Check response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 150ms': (r) => r.timings.duration < 150,
  });
  
  if (success) {
    successfulExistingEventConnections.add(1);
  }
}

// Default function - not used in this multi-scenario test
export default function() {
  // Not used in this test, scenarios are executed directly
} 
