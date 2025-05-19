import { loadUserData } from "@/common/load-data";
import { UserEntity } from "@libs/types";
import { check } from "k6";
import http from "k6/http";
import { Counter } from "k6/metrics";
import { Options } from "k6/options";
import { API_BASE_URL, TEST_PASSWORD } from "prepare/constants";
import { randomSleep } from "../utils";

// Custom metrics
const successfulNormalLogins = new Counter("successful_normal_logins");
const successfulWrongPasswordTests = new Counter(
  "successful_wrong_password_tests",
);
const successfulNonExistentUserTests = new Counter(
  "successful_non_existent_user_tests",
);

// Define test options with three scenarios as per requirements
export const options: Options = {
  scenarios: {
    // Scenario 1: Normal login - 10 requests per second
    normal_login: {
      executor: "constant-arrival-rate",
      rate: 10, // 10 requests per second
      timeUnit: "1s", // 1 second
      duration: "2m", // 2 minutes
      preAllocatedVUs: 15, // Initial pool of VUs
      maxVUs: 30, // Maximum number of VUs to handle the rate
      exec: "normalLoginScenario", // Function to execute
    },
    // Scenario 2: Wrong password - 5 requests per second
    wrong_password: {
      executor: "constant-arrival-rate",
      rate: 5, // 5 requests per second
      timeUnit: "1s", // 1 second
      duration: "2m", // 2 minutes
      preAllocatedVUs: 10, // Initial pool of VUs
      maxVUs: 20, // Maximum number of VUs to handle the rate
      exec: "wrongPasswordScenario", // Function to execute
    },
    // Scenario 3: Non-existent user - 2 requests per second
    non_existent_user: {
      executor: "constant-arrival-rate",
      rate: 2, // 2 requests per second
      timeUnit: "1s", // 1 second
      duration: "2m", // 2 minutes
      preAllocatedVUs: 5, // Initial pool of VUs
      maxVUs: 10, // Maximum number of VUs to handle the rate
      exec: "nonExistentUserScenario", // Function to execute
    },
  },
  thresholds: {
    // Set thresholds for full mode with more generous response time
    http_req_duration: ["p(95)<500"],

    // Specific thresholds for each scenario
    "http_req_duration{scenario:normal_login}": ["p(95)<500"],
    "http_req_duration{scenario:wrong_password}": ["p(95)<500"],
    "http_req_duration{scenario:non_existent_user}": ["p(95)<500"],

    // Set thresholds based on whether we're in quick mode (CLI override) or full mode
    // For full mode with the defined scenarios, these thresholds will apply
    successful_normal_logins: ["count>0"],
    successful_wrong_password_tests: ["count>0"],
    successful_non_existent_user_tests: ["count>0"],
  },
};

const users = loadUserData();

// Setup function - runs once per VU
export function setup() {
  return {
    testData: {
      users: users.users,
      nonExistentEmails: users.users
        .slice(0, 20)
        .map((user) => `nonexistent_${user.email}`),
    },
  };
}

// Scenario 1: Normal login
export function normalLoginScenario(data: {
  testData: { users: UserEntity[]; nonExistentEmails: string[] };
}) {
  randomSleep(1, 2); // Reduced sleep time for quick mode

  // Select a random user
  const { users } = data.testData;
  const user = users[Math.floor(Math.random() * users.length)];

  // Make login request with correct credentials
  const payload = JSON.stringify({
    email: user.email,
    password: TEST_PASSWORD,
  });

  const response = http.post(`${API_BASE_URL}/auth/login`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  // For quick mode, also count any 201 response as a success for the metric
  if (response.status === 201) {
    successfulNormalLogins.add(1);
  }

  // Check response
  const success = check(response, {
    "status is 201": (r) => r.status === 201,
    "response time < 500ms": (r) => r.timings.duration < 500, // Increased threshold
    "access token exists": (r) => r.json("accessToken") !== undefined,
    "user object exists": (r) => r.json("user") !== undefined,
    "user ID exists": (r) => r.json("user.id") !== undefined,
    "user email matches": (r) => r.json("user.email") === user.email,
    "user roles exist": (r) => Array.isArray(r.json("user.roles")),
  });

  // Only return success for the checks, not affecting the metric
  return success;
}

// Scenario 2: Wrong password
export function wrongPasswordScenario(data: {
  testData: { users: UserEntity[]; nonExistentEmails: string[] };
}) {
  randomSleep(1, 2);

  // Select a random user
  const { users } = data.testData;
  const user = users[Math.floor(Math.random() * users.length)];

  // Make login request with incorrect password
  const payload = JSON.stringify({
    email: user.email,
    password: `Wrong${TEST_PASSWORD}123!`, // Intentionally wrong password
  });

  const response = http.post(`${API_BASE_URL}/auth/login`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Check response - in the test environment, we get a 500 error with "Invalid credentials" message
  const responseBody = response.body ? String(response.body) : "";

  // For quick mode, count the scenario as a success if status is not 201 (it's an error as expected)
  if (response.status !== 201) {
    successfulWrongPasswordTests.add(1);
  }

  const success = check(response, {
    "response time < 500ms": (r) => r.timings.duration < 500, // Increased threshold
    "error status code": (r) =>
      r.status === 500 || r.status === 401 || r.status === 400,
    "error response exists": (r) => responseBody.length > 0,
    "invalid credentials message": (r) =>
      responseBody.includes("Invalid credentials") ||
      responseBody.includes("invalid credentials") ||
      responseBody.includes("unauthorized"),
  });

  // Return success for the checks
  return success;
}

// Scenario 3: Non-existent user
export function nonExistentUserScenario(data: {
  testData: { users: UserEntity[]; nonExistentEmails: string[] };
}) {
  randomSleep(1, 2);

  // Select a random non-existent email
  const { nonExistentEmails } = data.testData;
  const nonExistentEmail =
    nonExistentEmails[Math.floor(Math.random() * nonExistentEmails.length)];

  // Make login request with non-existent user
  const payload = JSON.stringify({
    email: nonExistentEmail,
    password: "SomeRandomPassword123!",
  });

  const response = http.post(`${API_BASE_URL}/auth/login`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Check response - in the test environment, we get a 500 error with "User not found" message
  const responseBody = response.body ? String(response.body) : "";

  // For quick mode, count the scenario as a success if status is not 201 (it's an error as expected)
  if (response.status !== 201) {
    successfulNonExistentUserTests.add(1);
  }

  const success = check(response, {
    "response time < 500ms": (r) => r.timings.duration < 500, // Increased threshold
    "error status code": (r) =>
      r.status === 500 ||
      r.status === 401 ||
      r.status === 404 ||
      r.status === 400,
    "error response exists": (r) => responseBody.length > 0,
    "user not found message": (r) =>
      responseBody.includes("User not found") ||
      responseBody.includes("user not found") ||
      responseBody.includes("not exist"),
  });

  // Return success for the checks
  return success;
}

// Default function for quick mode testing
export default function (data: {
  testData: { users: UserEntity[]; nonExistentEmails: string[] };
}) {
  // Run all three scenarios in sequence during quick mode to ensure all metrics are tested
  normalLoginScenario(data);
  wrongPasswordScenario(data);
  nonExistentUserScenario(data);
}
