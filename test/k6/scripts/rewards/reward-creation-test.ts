import { faker } from '@faker-js/faker';
import { RewardType } from '@libs/enums';
import { BadgeRewardEntity, CouponRewardEntity, PointRewardEntity, RewardBaseEntity } from '@libs/types';
import { check } from 'k6';
import http from 'k6/http';
import { Counter } from 'k6/metrics';
import { Options } from 'k6/options';
import { API_BASE_URL, TEST_PASSWORD } from 'prepare/constants';
import { randomSleep } from '../utils';

// Custom metrics
const successfulPointRewardCreations = new Counter('successful_point_reward_creations');
const successfulBadgeRewardCreations = new Counter('successful_badge_reward_creations');
const successfulCouponRewardCreations = new Counter('successful_coupon_reward_creations');

// Function to load rewards data from JSON
function loadRewardsData(): {
  pointRewards: PointRewardEntity[];
  badgeRewards: BadgeRewardEntity[];
  couponRewards: CouponRewardEntity[];
} {
  // Load rewards data from JSON file
  const allRewards = JSON.parse(open('../prepare/data/rewards.json')) as RewardBaseEntity[];
  
  // Filter by reward type
  const pointRewards = allRewards.filter(
    (reward): reward is PointRewardEntity => reward.type === RewardType.POINT
  );
  
  const badgeRewards = allRewards.filter(
    (reward): reward is BadgeRewardEntity => reward.type === RewardType.BADGE
  );
  
  const couponRewards = allRewards.filter(
    (reward): reward is CouponRewardEntity => reward.type === RewardType.COUPON
  );
  
  return {
    pointRewards,
    badgeRewards,
    couponRewards
  };
}

// Admin user credentials - from the prepared data
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = TEST_PASSWORD;

// Define test options with three scenarios as per requirements
export const options: Options = {
  scenarios: {
    // Scenario 1: Point reward creation - 5 requests per second
    point_reward_creation: {
      executor: 'constant-arrival-rate',
      rate: 5,               // 5 requests per second
      timeUnit: '1s',        // 1 second
      duration: '2m',        // 2 minutes
      preAllocatedVUs: 10,   // Initial pool of VUs
      maxVUs: 20,            // Maximum number of VUs to handle the rate
      exec: 'pointRewardScenario', // Function to execute
    },
    // Scenario 2: Badge reward creation - 3 requests per second
    badge_reward_creation: {
      executor: 'constant-arrival-rate',
      rate: 3,               // 3 requests per second
      timeUnit: '1s',        // 1 second
      duration: '2m',        // 2 minutes
      preAllocatedVUs: 5,    // Initial pool of VUs
      maxVUs: 15,            // Maximum number of VUs to handle the rate
      exec: 'badgeRewardScenario', // Function to execute
    },
    // Scenario 3: Coupon reward creation - 3 requests per second
    coupon_reward_creation: {
      executor: 'constant-arrival-rate',
      rate: 3,               // 3 requests per second
      timeUnit: '1s',        // 1 second
      duration: '2m',        // 2 minutes
      preAllocatedVUs: 5,    // Initial pool of VUs
      maxVUs: 15,            // Maximum number of VUs to handle the rate
      exec: 'couponRewardScenario', // Function to execute
    },
  },
  thresholds: {
    // All responses should be below 200ms for 95% of requests (as per requirement)
    http_req_duration: ['p(95)<200'],
    
    // Specific thresholds for each scenario
    'http_req_duration{scenario:point_reward_creation}': ['p(95)<200'],
    'http_req_duration{scenario:badge_reward_creation}': ['p(95)<200'],
    'http_req_duration{scenario:coupon_reward_creation}': ['p(95)<200'],
    
    // Threshold for success rates
    'http_reqs{status:201}': ['rate>0.99'], // 99% success rate overall
    
    // Custom metrics thresholds
    successful_point_reward_creations: ['count>550'],   // Expecting ~600 (5/s * 120s)
    successful_badge_reward_creations: ['count>340'],   // Expecting ~360 (3/s * 120s)
    successful_coupon_reward_creations: ['count>340'],  // Expecting ~360 (3/s * 120s)
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
  
  const responseBody = response.json() as unknown as { accessToken: string };
  return responseBody.accessToken;
}

// Setup function - runs once per VU
export function setup() {
  // Get admin auth token
  const token = getAdminToken();
  
  // Load rewards data
  const rewardsData = loadRewardsData();
  
  return { 
    token,
    rewardsData
  };
}

// Scenario 1: Point reward creation
export function pointRewardScenario(data: { token: string; rewardsData: { pointRewards: PointRewardEntity[]; badgeRewards: BadgeRewardEntity[]; couponRewards: CouponRewardEntity[] } }) {
  randomSleep(2, 5);
  
  // Use token and data from setup
  const { token, rewardsData } = data;
  const { pointRewards } = rewardsData;
  
  // Get a random point reward template from real data samples
  const randomIndex = Math.floor(Math.random() * pointRewards.length);
  const pointRewardTemplate = pointRewards[randomIndex];
  
  // Create unique name by adding a suffix to make it unique
  const uniqueName = `${pointRewardTemplate.name}-${faker.string.uuid().substring(0, 8)}`;
  
  // Create point reward with real data
  const payload = {
    name: uniqueName,
    points: pointRewardTemplate.points
  };
  
  const response = http.post(
    `${API_BASE_URL}/rewards/POINT`,
    payload as any,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  // Check response
  const success = check(response, {
    'status is 201': (r) => r.status === 201,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'reward ID exists': (r) => r.json('id') !== undefined,
    'reward type is POINT': (r) => r.json('type') === 'POINT',
    'points value matches': (r) => r.json('points') === pointRewardTemplate.points,
  });
  
  if (success) {
    successfulPointRewardCreations.add(1);
  }
}

// Scenario 2: Badge reward creation
export function badgeRewardScenario(data: { token: string; rewardsData: { pointRewards: PointRewardEntity[]; badgeRewards: BadgeRewardEntity[]; couponRewards: CouponRewardEntity[] } }) {
  randomSleep(2, 5);
  
  // Use token and data from setup
  const { token, rewardsData } = data;
  const { badgeRewards } = rewardsData;
  
  // Get a random badge reward template from real data samples
  const randomIndex = Math.floor(Math.random() * badgeRewards.length);
  const badgeRewardTemplate = badgeRewards[randomIndex];
  
  // Create unique name by adding a suffix to make it unique
  const uniqueName = `${badgeRewardTemplate.name}-${faker.string.uuid().substring(0, 8)}`;
  
  // Create badge reward with real data
  const payload = {
    name: uniqueName,
    badgeId: badgeRewardTemplate.badgeId
  };
  
  const response = http.post(
    `${API_BASE_URL}/rewards/BADGE`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  // Check response
  const success = check(response, {
    'status is 201': (r) => r.status === 201,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'reward ID exists': (r) => r.json('id') !== undefined,
    'reward type is BADGE': (r) => r.json('type') === 'BADGE',
    'badgeId matches': (r) => r.json('badgeId') === badgeRewardTemplate.badgeId,
  });
  
  if (success) {
    successfulBadgeRewardCreations.add(1);
  }
}

// Scenario 3: Coupon reward creation
export function couponRewardScenario(data: { token: string; rewardsData: { pointRewards: PointRewardEntity[]; badgeRewards: BadgeRewardEntity[]; couponRewards: CouponRewardEntity[] } }) {
  randomSleep(2, 5);
  
  // Use token and data from setup
  const { token, rewardsData } = data;
  const { couponRewards } = rewardsData;
  
  // Get a random coupon reward template from real data samples
  const randomIndex = Math.floor(Math.random() * couponRewards.length);
  const couponRewardTemplate = couponRewards[randomIndex];
  
  // Create unique name by adding a suffix to make it unique
  const uniqueName = `${couponRewardTemplate.name}-${faker.string.uuid().substring(0, 8)}`;
  
  // Create unique coupon code
  const uniqueCouponCode = `${couponRewardTemplate.couponCode}-${Math.floor(Math.random() * 9000) + 1000}`;
  
  // Create coupon reward with real data and unique code
  const payload = JSON.stringify({
    name: uniqueName,
    couponCode: uniqueCouponCode,
    expiry: couponRewardTemplate.expiry
  });
  
  const response = http.post(
    `${API_BASE_URL}/rewards/COUPON`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  // Check response
  const success = check(response, {
    'status is 201': (r) => r.status === 201,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'reward ID exists': (r) => r.json('id') !== undefined,
    'reward type is COUPON': (r) => r.json('type') === 'COUPON',
    'couponCode exists': (r) => r.json('couponCode') !== undefined,
    'expiry exists': (r) => r.json('expiry') !== undefined,
  });
  
  if (success) {
    successfulCouponRewardCreations.add(1);
  }
}

// Default function - not used in this multi-scenario test
export default function() {
  // Not used in this test, scenarios are executed directly
} 
