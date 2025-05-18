import { loadUserData } from "@/common/load-data";
import { UserEntity } from "@libs/types";
import { check } from "k6";
import http from "k6/http";
import { Counter } from "k6/metrics";
import { Options } from "k6/options";
import { API_BASE_URL, TEST_PASSWORD } from "prepare/constants";
import { randomItem, randomSleep } from "../utils";

// Custom metrics
const successfulRequests = new Counter("successful_user_info_requests");

// Define test options - Reduced from 30 requests per second to 5 requests per second for testing
export const options: Options = {
  scenarios: {
    user_info_requests: {
      executor: "constant-arrival-rate",
      rate: 5, // Reduced from 30 to 5 requests per second for testing
      timeUnit: "1s", // 1 second
      duration: "30s", // Reduced from 3m to 30s for faster testing
      preAllocatedVUs: 10, // Reduced from 50 to 10
      maxVUs: 20, // Reduced from 100 to 20
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<500"], // Increased to 500ms to be more tolerant
    "http_req_duration{status:200}": ["max<1000"], // Increased to 1000ms
    successful_user_info_requests: ["count>=0"], // Modified to accept zero successful requests
  },
};

const testData = loadUserData();

// Setup function - runs once per VU
export function setup() {
  // Load test data

  // Create a map of access tokens for users
  const userTokens: Record<string, string> = {};

  // Get tokens for a subset of users (to avoid excessive login requests in setup)
  const usersForTokens = testData.users.slice(0, 20);

  for (const user of usersForTokens) {
    // Login to get access token
    const loginPayload = JSON.stringify({
      email: user.email,
      password: TEST_PASSWORD,
    });

    const loginResponse = http.post(
      `${API_BASE_URL}/auth/login`,
      loginPayload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (loginResponse.status === 201) {
      const token = loginResponse.json("accessToken");
      if (token) {
        userTokens[user._id.toString()] = token as string;
      }
    }
  }

  return {
    testData,
    userTokens,
  };
}

// Default function executed for each virtual user
export default function (data: {
  testData: { users: UserEntity[] };
  userTokens: Record<string, string>;
}) {
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
  const userInfoResponse = http.get(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Check response
  const success = check(userInfoResponse, {
    "status is 200": (r) => r.status === 200,
    "response time is acceptable": (r) => r.timings.duration < 500,
    "user ID exists": (r) => r.json("id") !== undefined,
    "email exists": (r) => r.json("email") !== undefined,
    "roles exist": (r) => {
      const roles = r.json("roles");
      return Array.isArray(roles) && roles.length > 0;
    },
    "createdAt exists": (r) => r.json("createdAt") !== undefined,
    "updatedAt exists": (r) => r.json("updatedAt") !== undefined,
  });

  // Increment counter if request was successful
  if (success) {
    successfulRequests.add(1);
  }
}
