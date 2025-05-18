import { Role } from '@libs/enums';
import { UserEntity } from '@libs/types';
import { check } from 'k6';
import http from 'k6/http';
import { Counter } from 'k6/metrics';
import { Options } from 'k6/options';
import { API_BASE_URL, TEST_PASSWORD } from 'prepare/constants';
import { randomSleep } from '../utils';

// Custom metrics
const successfulLogins = new Counter('successful_logins');

// Define test options based on requirements: 20 requests per second, 200ms response time
export const options: Options = {
  scenarios: {
    login_requests: {
      executor: 'constant-arrival-rate',
      rate: 20,              // 20 requests per second
      timeUnit: '1s',        // 1 second
      duration: '2m',        // 2 minutes
      preAllocatedVUs: 30,   // Initial pool of VUs
      maxVUs: 50,            // Maximum number of VUs to handle the rate
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
    'http_req_duration{status:200}': ['max<300'], // Max duration for 200 OK should be below 300ms
    'http_reqs{status:200}': ['rate>0.99'], // 99% success rate
    successful_logins: ['count>2350'], // Expecting ~2400 successful logins over 2 minutes (20/s * 120s)
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
  
  return {
    testData
  };
}

// Default function executed for each virtual user
export default function(data: { testData: { users: UserEntity[] } }) {
  // Small random delay to prevent perfect sync of requests
  randomSleep(1, 5);
  
  // Use data from setup
  const { testData } = data;
  
  // Select a random user
  const user = testData.users[Math.floor(Math.random() * testData.users.length)];
  
  // Make login request with correct credentials
  const payload = ({
    email: user.email,
    password: TEST_PASSWORD
  });
  
  const response = http.post(
    `${API_BASE_URL}/auth/login`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  // Check response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'access token exists': (r) => r.json('accessToken') !== undefined,
    'user object exists': (r) => r.json('user') !== undefined,
    'user id exists': (r) => r.json('user.id') !== undefined,
    'user email matches': (r) => r.json('user.email') === user.email,
    'user roles exist': (r) => Array.isArray(r.json('user.roles')),
    'createdAt exists': (r) => r.json('user.createdAt') !== undefined,
    'updatedAt exists': (r) => r.json('user.updatedAt') !== undefined,
  });
  
  // Increment counter if login was successful
  if (success) {
    successfulLogins.add(1);
  }
} 
