import { Role } from '@libs/enums';
import { UserEntity } from '@libs/types';
import { check } from 'k6';
import http from 'k6/http';
import { Counter } from 'k6/metrics';
import { Options } from 'k6/options';
import { API_BASE_URL, TEST_PASSWORD } from 'prepare/constants';
import { randomSleep } from '../utils';

// Custom metrics
const successfulNormalLogins = new Counter('successful_normal_logins');
const successfulWrongPasswordTests = new Counter('successful_wrong_password_tests');
const successfulNonExistentUserTests = new Counter('successful_non_existent_user_tests');

// Define test options with three scenarios as per requirements
export const options: Options = {
  scenarios: {
    // Scenario 1: Normal login - 10 requests per second
    normal_login: {
      executor: 'constant-arrival-rate',
      rate: 10,              // 10 requests per second
      timeUnit: '1s',        // 1 second
      duration: '2m',        // 2 minutes
      preAllocatedVUs: 15,   // Initial pool of VUs
      maxVUs: 30,            // Maximum number of VUs to handle the rate
      exec: 'normalLoginScenario', // Function to execute
    },
    // Scenario 2: Wrong password - 5 requests per second
    wrong_password: {
      executor: 'constant-arrival-rate',
      rate: 5,               // 5 requests per second
      timeUnit: '1s',        // 1 second
      duration: '2m',        // 2 minutes
      preAllocatedVUs: 10,   // Initial pool of VUs
      maxVUs: 20,            // Maximum number of VUs to handle the rate
      exec: 'wrongPasswordScenario', // Function to execute
    },
    // Scenario 3: Non-existent user - 2 requests per second
    non_existent_user: {
      executor: 'constant-arrival-rate',
      rate: 2,               // 2 requests per second
      timeUnit: '1s',        // 1 second
      duration: '2m',        // 2 minutes
      preAllocatedVUs: 5,    // Initial pool of VUs
      maxVUs: 10,            // Maximum number of VUs to handle the rate
      exec: 'nonExistentUserScenario', // Function to execute
    },
  },
  thresholds: {
    // All responses should be below 100ms for 95% of requests (as per requirement)
    http_req_duration: ['p(95)<100'],
    
    // Specific thresholds for each scenario
    'http_req_duration{scenario:normal_login}': ['p(95)<100'],
    'http_req_duration{scenario:wrong_password}': ['p(95)<100'],
    'http_req_duration{scenario:non_existent_user}': ['p(95)<100'],
    
    // Custom metrics thresholds
    successful_normal_logins: ['count>1150'],           // Expecting ~1200 (10/s * 120s)
    successful_wrong_password_tests: ['count>575'],     // Expecting ~600 (5/s * 120s)
    successful_non_existent_user_tests: ['count>230'],  // Expecting ~240 (2/s * 120s)
  },
};

// Load test data from files
function loadTestData(): { users: UserEntity[]; nonExistentEmails: string[] } {
  // Load users data from the K6 bundle
  const usersData = JSON.parse(open('../prepare/data/users.json')) as UserEntity[];
  
  // Filter regular users (non-admin)
  const regularUsers = usersData.filter(user => 
    !user.roles.includes(Role.ADMIN) && user.email !== 'admin@example.com'
  );
  
  // Generate non-existent emails by modifying existing emails
  const nonExistentEmails = regularUsers.slice(0, 20).map(user => 
    `nonexistent_${user.email}`
  );
  
  return {
    users: regularUsers,
    nonExistentEmails: nonExistentEmails
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

// Scenario 1: Normal login
export function normalLoginScenario(data: { testData: { users: UserEntity[] } }) {
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
    'response time < 100ms': (r) => r.timings.duration < 100,
    'access token exists': (r) => r.json('accessToken') !== undefined,
    'user object exists': (r) => r.json('user') !== undefined,
    'user ID matches': (r) => r.json('user.id') === user._id.toString(),
    'user email matches': (r) => r.json('user.email') === user.email,
    'user roles exist': (r) => Array.isArray(r.json('user.roles')),
  });
  
  if (success) {
    successfulNormalLogins.add(1);
  }
}

// Scenario 2: Wrong password
export function wrongPasswordScenario(data: { testData: { users: UserEntity[] } }) {
  randomSleep(1, 5);
  
  // Use data from setup
  const { testData } = data;
  
  // Select a random user
  const user = testData.users[Math.floor(Math.random() * testData.users.length)];
  
  // Make login request with incorrect password
  const payload = ({
    email: user.email,
    password: `Wrong${TEST_PASSWORD}123!` // Intentionally wrong password
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
    'status is 401': (r) => r.status === 401,
    'response time < 100ms': (r) => r.timings.duration < 100,
    'error message exists': (r) => r.json('message') !== undefined,
    'status code is 401': (r) => r.json('statusCode') === 401,
  });
  
  if (success) {
    successfulWrongPasswordTests.add(1);
  }
}

// Scenario 3: Non-existent user
export function nonExistentUserScenario(data: { testData: { nonExistentEmails: string[] } }) {
  randomSleep(1, 5);
  
  // Use data from setup
  const { testData } = data;
  
  // Select a random non-existent email
  const nonExistentEmail = testData.nonExistentEmails[
    Math.floor(Math.random() * testData.nonExistentEmails.length)
  ];
  
  // Make login request with non-existent user
  const payload = ({
    email: nonExistentEmail,
    password: 'SomeRandomPassword123!'
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
    'status is 401': (r) => r.status === 401,
    'response time < 100ms': (r) => r.timings.duration < 100,
    'error message exists': (r) => r.json('message') !== undefined,
    'status code is 401': (r) => r.json('statusCode') === 401,
  });
  
  if (success) {
    successfulNonExistentUserTests.add(1);
  }
}

// Default function - not used in this multi-scenario test
export default function() {
  // Not used in this test, scenarios are executed directly
} 
