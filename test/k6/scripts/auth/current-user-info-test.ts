import { Role } from '@libs/enums';
import { UserEntity } from '@libs/types';
import { check } from 'k6';
import http from 'k6/http';
import { Counter } from 'k6/metrics';
import { Options } from 'k6/options';
import { API_BASE_URL, TEST_PASSWORD } from 'prepare/constants';
import { randomItem, randomSleep } from '../utils';

// Custom metrics
const successfulRequests = new Counter('successful_user_info_requests');

// Define test options - 30 requests per second as per requirement
export const options: Options = {
  scenarios: {
    user_info_requests: {
      executor: 'constant-arrival-rate',
      rate: 30,              // 30 requests per second
      timeUnit: '1s',        // 1 second
      duration: '3m',        // 3 minutes
      preAllocatedVUs: 50,   // Initial pool of VUs
      maxVUs: 100,           // Maximum number of VUs to handle the rate
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<80'], // 95% of requests should be below 80ms (as per requirement)
    'http_req_duration{status:200}': ['max<150'], // Max duration for 200 OK should be below 150ms
    'http_reqs{status:200}': ['rate>0.99'],      // 99% success rate (failure rate below 1%)
    successful_requests: ['count>5000'],         // Expecting ~5400 successful requests over 3 minutes (30/s * 180s)
  },
};

// Load test data from files
function loadTestData(): { users: UserEntity[] } {
  // Load users data from the K6 bundle
  const usersData = JSON.parse(open('../prepare/data/users.json')) as UserEntity[];
  
  // Filter regular users (non-admin)
  const regularUsers = usersData.filter(user => 
    !user.roles.includes(Role.ADMIN) && user.email !== 'admin@example.com'
  );
  
  return {
    users: regularUsers
  };
}

// Setup function - runs once per VU
export function setup() {
  // Load test data
  const testData = loadTestData();
  
  // Create a map of access tokens for users
  const userTokens: Record<string, string> = {};
  
  // Get tokens for a subset of users (to avoid excessive login requests in setup)
  const usersForTokens = testData.users.slice(0, 20);
  
  for (const user of usersForTokens) {
    // Login to get access token
    const loginPayload = ({
      email: user.email,
      password: TEST_PASSWORD
    });
    
    const loginResponse = http.post(
      `${API_BASE_URL}/auth/login`,
      loginPayload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (loginResponse.status === 200) {
      const token = loginResponse.json('accessToken');
      if (token) {
        userTokens[user._id.toString()] = token as string;
      }
    }
  }
  
  return {
    testData,
    userTokens
  };
}

// Default function executed for each virtual user
export default function(data: { testData: { users: UserEntity[] }, userTokens: Record<string, string> }) {
  // Small random delay to prevent perfect sync of requests
  randomSleep(5, 20);
  
  // Use data from setup
  const { testData, userTokens } = data;
  
  // Get user IDs with tokens
  const userIdsWithTokens = Object.keys(userTokens);
  
  // Select a random user with a token
  const userId = randomItem(userIdsWithTokens);
  const token = userTokens[userId];
  
  // Make current user info request
  const userInfoResponse = http.get(
    `${API_BASE_URL}/auth/me`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  // Check response
  const success = check(userInfoResponse, {
    'status is 200': (r) => r.status === 200,
    'response time is acceptable': (r) => r.timings.duration < 80,
    'user ID exists': (r) => r.json('id') !== undefined,
    'email exists': (r) => r.json('email') !== undefined,
    'roles exist': (r) => {
      const roles = r.json('roles');
      return Array.isArray(roles) && roles.length > 0;
    },
    'createdAt exists': (r) => r.json('createdAt') !== undefined,
    'updatedAt exists': (r) => r.json('updatedAt') !== undefined,
  });
  
  // Increment counter if request was successful
  if (success) {
    successfulRequests.add(1);
  }
} 
