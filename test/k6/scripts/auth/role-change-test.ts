import { Role } from '@libs/enums';
import { UserEntity } from '@libs/types';
import { check } from 'k6';
import http from 'k6/http';
import { Counter } from 'k6/metrics';
import { Options } from 'k6/options';
import { API_BASE_URL } from 'prepare/constants';
import { randomSleep } from '../utils';

// Custom metrics
const successfulSingleRoleChanges = new Counter('successful_single_role_changes');
const successfulMultiRoleChanges = new Counter('successful_multi_role_changes');

// Admin user credentials - from the prepared data
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Password123!';

// Define test options with two scenarios as per requirements
export const options: Options = {
  scenarios: {
    // Scenario 1: Single role addition - 3 requests per second
    single_role_addition: {
      executor: 'constant-arrival-rate',
      rate: 3,               // 3 requests per second
      timeUnit: '1s',        // 1 second
      duration: '2m',        // 2 minutes
      preAllocatedVUs: 5,    // Initial pool of VUs
      maxVUs: 15,            // Maximum number of VUs to handle the rate
      exec: 'singleRoleAdditionScenario', // Function to execute
    },
    // Scenario 2: Multiple role change - 2 requests per second
    multi_role_change: {
      executor: 'constant-arrival-rate',
      rate: 2,               // 2 requests per second
      timeUnit: '1s',        // 1 second
      duration: '2m',        // 2 minutes
      preAllocatedVUs: 5,    // Initial pool of VUs
      maxVUs: 10,            // Maximum number of VUs to handle the rate
      exec: 'multiRoleChangeScenario', // Function to execute
    },
  },
  thresholds: {
    // All responses should be below 150ms for 95% of requests (as per requirement)
    http_req_duration: ['p(95)<150'],
    
    // Specific thresholds for each scenario
    'http_req_duration{scenario:single_role_addition}': ['p(95)<150'],
    'http_req_duration{scenario:multi_role_change}': ['p(95)<150'],
    
    // Threshold for success rates
    'http_reqs{status:200}': ['rate>0.99'], // 99% success rate overall
    
    // Custom metrics thresholds
    successful_single_role_changes: ['count>340'],  // Expecting ~360 (3/s * 120s)
    successful_multi_role_changes: ['count>230'],   // Expecting ~240 (2/s * 120s)
  },
};

// Authenticate and get admin token
function getAdminToken() {
  const response = http.post(
    `${API_BASE_URL}/auth/login`,
    ({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  if (response.status !== 200) {
    throw new Error(`Admin authentication failed: ${response.status} - ${response.body}`);
  }
  
  return response.json('accessToken') as string;
}

// Load test data from files
function loadTestData(): { users: UserEntity[] } {
  // Load users data from the K6 bundle
  const usersData = JSON.parse(open('../prepare/data/users.json')) as UserEntity[];
  
  // Filter regular users (non-admin)
  const regularUsers = usersData.filter((user: UserEntity) => 
    !user.roles.includes(Role.ADMIN) && user.email !== ADMIN_EMAIL
  );
  
  return {
    users: regularUsers
  };
}

// Setup function - runs once per VU
export function setup(): { token: string; testData: { users: UserEntity[] } } {
  // Get admin auth token
  const token = getAdminToken();
  
  // Load test data
  const testData = loadTestData();
  
  return {
    token,
    testData
  };
}

// Scenario 1: Single role addition (adding OPERATOR role)
export function singleRoleAdditionScenario(data: { token: string; testData: { users: UserEntity[] } }): void {
  randomSleep(2, 10);
  
  // Use data from setup
  const { token, testData } = data;
  
  // Get a random user
  const user = testData.users[Math.floor(Math.random() * testData.users.length)];
  
  // Add OPERATOR role to the user (keeping existing USER role)
  const response = http.put(
    `${API_BASE_URL}/auth/users/${user._id.toString()}/roles`,
    ({
      roles: ['USER', 'OPERATOR']
    } as any),
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
    'user ID exists': (r) => r.json('id') !== undefined,
    'email matches': (r) => r.json('email') === user.email,
    'roles contain OPERATOR': (r) => {
      const roles = r.json('roles');
      return Array.isArray(roles) && roles.includes('OPERATOR');
    },
    'updatedAt exists': (r) => r.json('updatedAt') !== undefined,
  });
  
  if (success) {
    successfulSingleRoleChanges.add(1);
  }
}

// Scenario 2: Multiple role change (changing to OPERATOR and ANALYST)
export function multiRoleChangeScenario(data: { token: string; testData: { users: UserEntity[] } }): void {
  randomSleep(2, 10);
  
  // Use data from setup
  const { token, testData } = data;
  
  // Get a random user
  const user = testData.users[Math.floor(Math.random() * testData.users.length)];
  
  // Change roles to OPERATOR and ANALYST (replacing USER role)
  const response = http.put(
    `${API_BASE_URL}/auth/users/${user._id.toString()}/roles`,
    ({
      roles: ['OPERATOR', 'ANALYST']
    } as any),
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
    'user ID exists': (r) => r.json('id') !== undefined,
    'email matches': (r) => r.json('email') === user.email,
    'roles contain OPERATOR and ANALYST': (r) => {
      const roles = r.json('roles');
      return Array.isArray(roles) && 
             roles.includes('OPERATOR') && 
             roles.includes('ANALYST');
    },
    'roles no longer contain USER': (r) => {
      const roles = r.json('roles');
      return Array.isArray(roles) && !roles.includes('USER');
    },
    'updatedAt exists': (r) => r.json('updatedAt') !== undefined,
  });
  
  if (success) {
    successfulMultiRoleChanges.add(1);
  }
}

// Default function - not used in this multi-scenario test
export default function() {
  // Not used in this test, scenarios are executed directly
} 
