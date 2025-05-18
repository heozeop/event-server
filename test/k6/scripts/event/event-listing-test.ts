import { getAdminToken } from '@/common/admin.login';
import { EventResponseDto } from '@libs/dtos';
import { check } from 'k6';
import http from 'k6/http';
import { Counter } from 'k6/metrics';
import { Options } from 'k6/options';
import { API_BASE_URL, TEST_PASSWORD } from 'prepare/constants';
import { randomSleep } from '../utils';

// Custom metrics
const successfulNoFilterRequests = new Counter('successful_no_filter_requests');
const successfulDateFilterRequests = new Counter('successful_date_filter_requests');
const successfulLocationFilterRequests = new Counter('successful_location_filter_requests');

// Admin user credentials - from the prepared data
const ADMIN_PASSWORD = TEST_PASSWORD;

// Define test options with three scenarios as per requirements
export const options: Options = {
  scenarios: {
    // Scenario 1: No filter listing - 20 requests per second
    no_filter_listing: {
      executor: 'constant-arrival-rate',
      rate: 20,              // 20 requests per second
      timeUnit: '1s',        // 1 second
      duration: '2m',        // 2 minutes
      preAllocatedVUs: 30,   // Initial pool of VUs
      maxVUs: 60,            // Maximum number of VUs to handle the rate
      exec: 'noFilterScenario', // Function to execute
    },
    // Scenario 2: Date filter listing - 10 requests per second
    date_filter_listing: {
      executor: 'constant-arrival-rate',
      rate: 10,              // 10 requests per second
      timeUnit: '1s',        // 1 second
      duration: '2m',        // 2 minutes
      preAllocatedVUs: 15,   // Initial pool of VUs
      maxVUs: 30,            // Maximum number of VUs to handle the rate
      exec: 'dateFilterScenario', // Function to execute
    },
    // Scenario 3: Location filter listing - 5 requests per second
    location_filter_listing: {
      executor: 'constant-arrival-rate',
      rate: 5,               // 5 requests per second
      timeUnit: '1s',        // 1 second
      duration: '2m',        // 2 minutes
      preAllocatedVUs: 10,   // Initial pool of VUs
      maxVUs: 20,            // Maximum number of VUs to handle the rate
      exec: 'locationFilterScenario', // Function to execute
    },
  },
  thresholds: {
    // All responses should be below 150ms for 95% of requests (as per requirement)
    http_req_duration: ['p(95)<150'],
    
    // Specific thresholds for each scenario
    'http_req_duration{scenario:no_filter_listing}': ['p(95)<150'],
    'http_req_duration{scenario:date_filter_listing}': ['p(95)<150'],
    'http_req_duration{scenario:location_filter_listing}': ['p(95)<150'],
    
    // Threshold for success rates
    'http_reqs{status:200}': ['rate>0.99'], // 99% success rate overall
    
    // Custom metrics thresholds
    successful_no_filter_requests: ['count>2300'],      // Expecting ~2400 (20/s * 120s)
    successful_date_filter_requests: ['count>1150'],    // Expecting ~1200 (10/s * 120s)
    successful_location_filter_requests: ['count>570'], // Expecting ~600 (5/s * 120s)
  },
};

// Pre-computed date ranges based on the event periods
const DATE_RANGES = [
  { startDate: "2025-06-01", endDate: "2025-07-01" },
  { startDate: "2025-08-01", endDate: "2025-09-01" },
  { startDate: "2025-10-01", endDate: "2025-11-15" }
];

// Location filters (simulated)
const LOCATION_FILTERS = [
  'seoul',
  'busan',
  'incheon',
  'daegu',
  'daejeon'
];

// Helper function to check if response is an array of events
function isEventArray(data: unknown): data is EventResponseDto[] {
  return Array.isArray(data) && (data.length === 0 || (
    typeof data[0] === 'object' && data[0] !== null &&
    'id' in data[0] && 'name' in data[0] && 'condition' in data[0] &&
    'period' in data[0] && 'status' in data[0]
  ));
}

// Setup function - runs once per VU
export function setup() {
  // Get auth token for admin user
  const token = getAdminToken();
  
  return {
    token
  };
}

// Scenario 1: No filter listing
export function noFilterScenario(data: { token: string }) {
  randomSleep(1, 5);
  
  // Use data from setup
  const { token } = data;
  
  // Make request without filters
  const response = http.get(
    `${API_BASE_URL}/events`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  // Check response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 150ms': (r) => r.timings.duration < 150,
    'response is an array': (r) => Array.isArray(r.json()),
    'events have required fields': (r) => {
      const events = r.json();
      return isEventArray(events);
    }
  });
  
  if (success) {
    successfulNoFilterRequests.add(1);
  }
}

// Scenario 2: Date filter listing
export function dateFilterScenario(data: { token: string }) {
  randomSleep(1, 5);
  
  // Use data from setup
  const { token } = data;
  
  // Select a random date range
  const dateRange = DATE_RANGES[Math.floor(Math.random() * DATE_RANGES.length)];
  
  // Make request with date filter
  const response = http.get(
    `${API_BASE_URL}/events?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  // Check response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 150ms': (r) => r.timings.duration < 150,
    'response is an array': (r) => Array.isArray(r.json()),
    'events have required fields': (r) => {
      const events = r.json();
      return isEventArray(events);
    }
  });
  
  if (success) {
    successfulDateFilterRequests.add(1);
  }
}

// Scenario 3: Location filter listing
export function locationFilterScenario(data: { token: string }) {
  randomSleep(1, 5);
  
  // Use data from setup
  const { token } = data;
  
  // Select a random location filter
  const location = LOCATION_FILTERS[Math.floor(Math.random() * LOCATION_FILTERS.length)];
  
  // Make request with location filter
  const response = http.get(
    `${API_BASE_URL}/events?location=${location}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  // Check response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 150ms': (r) => r.timings.duration < 150,
    'response is an array': (r) => Array.isArray(r.json()),
    'events have required fields': (r) => {
      const events = r.json();
      return isEventArray(events);
    }
  });
  
  if (success) {
    successfulLocationFilterRequests.add(1);
  }
}

// Default function - not used in this multi-scenario test
export default function() {
  // This function is not used when exec functions are specified in scenarios
} 
