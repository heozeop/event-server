import { getAdminToken } from '@/common/admin.login';
import { RewardRequestResponseDto } from '@libs/dtos';
import { Role } from '@libs/enums';
import { EventEntity, UserEntity } from '@libs/types';
import { check } from 'k6';
import http from 'k6/http';
import { Counter } from 'k6/metrics';
import { Options } from 'k6/options';
import { ADMIN_EMAIL, API_BASE_URL } from 'prepare/constants';
import { randomSleep } from '../utils';

// Function to load test data
function loadTestData(): { eventIds: string[]; userIds: string[] } {
  // Load events data
  const events = JSON.parse(open('/data/events.json')) as EventEntity[];
  const eventIds = events.map(event => event._id.toString());
  
  // Load users data
  const users = JSON.parse(open('/data/users.json')) as UserEntity[];
  const userIds = users
    .filter(user => !user.roles.includes(Role.ADMIN) && user.email !== ADMIN_EMAIL)
    .map(user => user._id.toString());
  
  return {
    eventIds,
    userIds
  };
}

// Custom metrics
const successfulNoFilterRequests = new Counter('successful_no_filter_requests');
const successfulUserFilterRequests = new Counter('successful_user_filter_requests');
const successfulEventFilterRequests = new Counter('successful_event_filter_requests');

// Define test options with three scenarios as per requirements
export const options: Options = {
  scenarios: {
    // Scenario 1: No filter - 10 requests per second
    no_filter_requests: {
      executor: 'constant-arrival-rate',
      rate: 10,              // 10 requests per second
      timeUnit: '1s',        // 1 second
      duration: '2m',        // 2 minutes
      preAllocatedVUs: 20,   // Initial pool of VUs
      maxVUs: 50,            // Maximum number of VUs to handle the rate
      exec: 'noFilterScenario', // Function to execute
    },
    // Scenario 2: User filter - 5 requests per second
    user_filter_requests: {
      executor: 'constant-arrival-rate',
      rate: 5,               // 5 requests per second
      timeUnit: '1s',        // 1 second
      duration: '2m',        // 2 minutes
      preAllocatedVUs: 10,   // Initial pool of VUs
      maxVUs: 30,            // Maximum number of VUs to handle the rate
      exec: 'userFilterScenario', // Function to execute
    },
    // Scenario 3: Event filter - 5 requests per second
    event_filter_requests: {
      executor: 'constant-arrival-rate',
      rate: 5,               // 5 requests per second
      timeUnit: '1s',        // 1 second
      duration: '2m',        // 2 minutes
      preAllocatedVUs: 10,   // Initial pool of VUs
      maxVUs: 30,            // Maximum number of VUs to handle the rate
      exec: 'eventFilterScenario', // Function to execute
    },
  },
  thresholds: {
    // All responses should be below 120ms for 95% of requests (as per requirement)
    http_req_duration: ['p(95)<120'],
    
    // Specific thresholds for each scenario
    'http_req_duration{scenario:no_filter_requests}': ['p(95)<120'],
    'http_req_duration{scenario:user_filter_requests}': ['p(95)<120'],
    'http_req_duration{scenario:event_filter_requests}': ['p(95)<120'],
    
    // Threshold for success rates
    'http_reqs{status:200}': ['rate>0.99'], // 99% success rate overall
    
    // Custom metrics thresholds
    successful_no_filter_requests: ['count>1100'],    // Expecting ~1200 (10/s * 120s)
    successful_user_filter_requests: ['count>550'],   // Expecting ~600 (5/s * 120s)
    successful_event_filter_requests: ['count>550'],  // Expecting ~600 (5/s * 120s)
  },
};

// Helper function to check if response is an array of event requests
function isEventRequestArray(data: unknown): data is RewardRequestResponseDto[] {
  return Array.isArray(data) && (data.length === 0 || (
    typeof data[0] === 'object' && data[0] !== null &&
    'id' in data[0] && 'eventId' in data[0] && 'userId' in data[0] &&
    'status' in data[0] && 'createdAt' in data[0]
  ));
}

const testData = loadTestData();

// Setup function - runs once per VU
export function setup() {
  const token = getAdminToken();
  
  return { 
    token,
    testData
  };
}

// Scenario 1: No filter requests
export function noFilterScenario(data: { token: string; testData: { eventIds: string[]; userIds: string[] } }) {
  randomSleep(2, 10);
  
  const { token } = data;
  
  const response = http.get(
    `${API_BASE_URL}/events/requests`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 120ms': (r) => r.timings.duration < 120,
    'response is an array': (r) => Array.isArray(r.json()),
    'items have required fields': (r) => {
      const items = r.json();
      return isEventRequestArray(items);
    },
  });
  
  if (success) {
    successfulNoFilterRequests.add(1);
  }
}

// Scenario 2: User filter requests
export function userFilterScenario(data: { token: string; testData: { eventIds: string[]; userIds: string[] } }) {
  randomSleep(2, 10);
  
  const { token, testData } = data;
  const { userIds } = testData;
  
  // Get a random user ID from the real data
  const userId = userIds[Math.floor(Math.random() * userIds.length)];
  
  const response = http.get(
    `${API_BASE_URL}/events/requests?userId=${userId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 120ms': (r) => r.timings.duration < 120,
    'response is an array': (r) => Array.isArray(r.json()),
    'items have correct userId': (r) => {
      const items = r.json();
      if (!isEventRequestArray(items)) return false;
      return items.length === 0 || items.every(item => item.userId === userId);
    },
  });
  
  if (success) {
    successfulUserFilterRequests.add(1);
  }
}

// Scenario 3: Event filter requests
export function eventFilterScenario(data: { token: string; testData: { eventIds: string[]; userIds: string[] } }) {
  randomSleep(2, 10);
  
  const { token, testData } = data;
  const { eventIds } = testData;
  
  // Get a random event ID from the real data
  const eventId = eventIds[Math.floor(Math.random() * eventIds.length)];
  
  const response = http.get(
    `${API_BASE_URL}/events/requests?eventId=${eventId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 120ms': (r) => r.timings.duration < 120,
    'response is an array': (r) => Array.isArray(r.json()),
    'items have correct eventId': (r) => {
      const items = r.json()
      if (!isEventRequestArray(items)) return false;
      return items.length === 0 || items.every(item => item.event.id === eventId);
    },
  });
  
  if (success) {
    successfulEventFilterRequests.add(1);
  }
}

// Default function - not used in this multi-scenario test
export default function() {
  // Do nothing
} 
