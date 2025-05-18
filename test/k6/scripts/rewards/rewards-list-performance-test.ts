import { getAdminToken } from '@/common/admin.login';
import { check } from 'k6';
import http from 'k6/http';
import { Counter } from 'k6/metrics';
import { Options } from 'k6/options';
import { API_BASE_URL } from 'prepare/constants';
import { randomSleep } from '../utils';

// Type definitions for K6 response structures
type JSONValue = string | number | boolean | null | { [key: string]: JSONValue } | JSONValue[];
type Reward = {
  id: string;
  type: string;
  name: string;
};

// Custom metrics
const successfulNoFilterRequests = new Counter('successful_no_filter_requests');
const successfulWithFilterRequests = new Counter('successful_with_filter_requests');

// Define test options based on requirements
export const options: Options = {
  scenarios: {
    // Scenario 1: No Filter - 15 requests per second
    no_filter_requests: {
      executor: 'constant-arrival-rate',
      rate: 15,             // 15 requests per second
      timeUnit: '1s',       // 1 second
      duration: '2m',       // 2 minutes
      preAllocatedVUs: 50,  // Initial pool of VUs
      maxVUs: 100,          // Maximum number of VUs to handle the rate
      exec: 'noFilterTest', // Reference to the function to execute
    },
    // Scenario 2: With Type Filter - 10 requests per second
    with_filter_requests: {
      executor: 'constant-arrival-rate',
      rate: 10,              // 10 requests per second
      timeUnit: '1s',        // 1 second
      duration: '2m',        // 2 minutes
      preAllocatedVUs: 30,   // Initial pool of VUs
      maxVUs: 60,            // Maximum number of VUs to handle the rate
      exec: 'withFilterTest', // Reference to the function to execute
      startTime: '2m',       // Start after the first scenario completes
    },
  },
  thresholds: {
    // Response time requirement: 100ms or less
    'http_req_duration{scenario:no_filter_requests}': ['p(95)<100'], // 95% of requests should be below 100ms
    'http_req_duration{scenario:with_filter_requests}': ['p(95)<100'], // 95% of requests should be below 100ms
    
    // Success rate
    'http_reqs{status:200}': ['rate>0.99'],  // 99% success rate
    
    // Count metrics
    'successful_no_filter_requests': ['count>1700'],   // At least 1700 successful requests (15/s * 120s = 1800 expected)
    'successful_with_filter_requests': ['count>1100'], // At least 1100 successful requests (10/s * 120s = 1200 expected)
  },
};

// Real reward types for testing
const REWARD_TYPES = ['POINT', 'BADGE', 'COUPON', 'ITEM'];

// Helper function to check if response is an array of rewards
function isRewardArray(data: JSONValue): data is Reward[] {
  return Array.isArray(data) && (data.length === 0 || (
    typeof data[0] === 'object' && data[0] !== null &&
    'id' in data[0] && 'type' in data[0] && 'name' in data[0]
  ));
}


// Setup function - runs once per VU
export function setup() {
  const token = getAdminToken();
  return { token };
}

// Scenario 1: No Filter
export function noFilterTest(data: { token: string }) {
  const { token } = data;
  
  const response = http.get(
    `${API_BASE_URL}/rewards`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response is an array': (r) => Array.isArray(r.json()),
    'response time is under 100ms': (r) => r.timings.duration < 100,
  });
  
  if (success) {
    successfulNoFilterRequests.add(1);
  }
  
  // Add some randomness to avoid synchronized requests
  randomSleep(50, 200);
}

// Scenario 2: With Type Filter
export function withFilterTest(data: { token: string }) {
  const { token } = data;
  
  // Use real reward types from our data
  const selectedType = REWARD_TYPES[Math.floor(Math.random() * REWARD_TYPES.length)];
  
  const response = http.get(
    `${API_BASE_URL}/rewards?type=${selectedType}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response is an array': (r) => Array.isArray(r.json()),
    'all items match filter type': (r) => {
      const rewards = r.json();
      if (!isRewardArray(rewards)) return false;
      return rewards.length === 0 || rewards.every(reward => reward.type === selectedType);
    },
    'response time is under 100ms': (r) => r.timings.duration < 100,
  });
  
  if (success) {
    successfulWithFilterRequests.add(1);
  }
  
  // Add some randomness to avoid synchronized requests
  randomSleep(50, 200);
}

// Default function will not be used for our test scenarios
export default function() {
  // This won't execute with our scenario-based approach
} 
