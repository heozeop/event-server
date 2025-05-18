import { getAdminToken } from "@/common/admin.login";
import { loadUserData } from "@/common/load-data";
import { UserEntity } from "@libs/types";
import { check } from "k6";
import http from "k6/http";
import { Counter } from "k6/metrics";
import { Options } from "k6/options";
import { API_BASE_URL } from "prepare/constants";
import { randomSleep } from "../utils";

// Custom metrics
const successfulIdLookups = new Counter("successful_id_lookups");
const successfulEmailLookups = new Counter("successful_email_lookups");

// Define test options with two scenarios as per requirements
export const options: Options = {
  scenarios: {
    // Scenario 1: ID-based user lookup - 15 requests per second
    id_based_lookup: {
      executor: "constant-arrival-rate",
      rate: 15, // 15 requests per second
      timeUnit: "1s", // 1 second
      duration: "2m", // 2 minutes
      preAllocatedVUs: 20, // Initial pool of VUs
      maxVUs: 40, // Maximum number of VUs to handle the rate
      exec: "idLookupScenario", // Function to execute
    },
    // Scenario 2: Email-based user lookup - 10 requests per second
    email_based_lookup: {
      executor: "constant-arrival-rate",
      rate: 10, // 10 requests per second
      timeUnit: "1s", // 1 second
      duration: "2m", // 2 minutes
      preAllocatedVUs: 15, // Initial pool of VUs
      maxVUs: 30, // Maximum number of VUs to handle the rate
      exec: "emailLookupScenario", // Function to execute
    },
  },
  thresholds: {
    // All responses should be below 100ms for 95% of requests (as per requirement)
    http_req_duration: ["p(95)<100"],

    // Specific thresholds for each scenario
    "http_req_duration{scenario:id_based_lookup}": ["p(95)<100"],
    "http_req_duration{scenario:email_based_lookup}": ["p(95)<100"],

    // Threshold for success rates
    "http_reqs{status:200}": ["rate>0.99"], // 99% success rate overall

    // Custom metrics thresholds
    successful_id_lookups: ["count>1700"], // Expecting ~1800 (15/s * 120s)
    successful_email_lookups: ["count>1100"], // Expecting ~1200 (10/s * 120s)
  },
};

// Load test data
const testData = loadUserData();

// Setup function - runs once per VU
export function setup(): { token: string; testData: { users: UserEntity[] } } {
  // Get admin auth token
  const token = getAdminToken();

  return {
    token,
    testData,
  };
}

// Scenario 1: ID-based user lookup
export function idLookupScenario(data: {
  token: string;
  testData: { users: UserEntity[] };
}): void {
  randomSleep(2, 5);

  // Use data from setup
  const { token, testData } = data;

  // Get a random user
  const user =
    testData.users[Math.floor(Math.random() * testData.users.length)];

  // Make the ID-based lookup request
  const response = http.get(
    `${API_BASE_URL}/auth/users/${user._id.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  // Check response
  const success = check(response, {
    "status is 200": (r) => r.status === 200,
    "response time < 100ms": (r) => r.timings.duration < 100,
    "user ID matches": (r) => r.json("id") === user._id.toString(),
    "email matches": (r) => r.json("email") === user.email,
    "roles exist": (r) => {
      const roles = r.json("roles");
      return Array.isArray(roles) && roles.length > 0;
    },
    "createdAt exists": (r) => r.json("createdAt") !== undefined,
    "updatedAt exists": (r) => r.json("updatedAt") !== undefined,
  });

  if (success) {
    successfulIdLookups.add(1);
  }
}

// Scenario 2: Email-based user lookup
export function emailLookupScenario(data: {
  token: string;
  testData: { users: UserEntity[] };
}): void {
  randomSleep(2, 5);

  // Use data from setup
  const { token, testData } = data;

  // Get a random user
  const user =
    testData.users[Math.floor(Math.random() * testData.users.length)];

  // Make the email-based lookup request
  const response = http.get(
    `${API_BASE_URL}/auth/users/email?email=${user.email}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  // Check response
  const success = check(response, {
    "status is 200": (r) => r.status === 200,
    "response time < 100ms": (r) => r.timings.duration < 100,
    "user ID matches": (r) => r.json("id") === user._id.toString(),
    "email matches": (r) => r.json("email") === user.email,
    "roles exist": (r) => {
      const roles = r.json("roles");
      return Array.isArray(roles) && roles.length > 0;
    },
    "createdAt exists": (r) => r.json("createdAt") !== undefined,
    "updatedAt exists": (r) => r.json("updatedAt") !== undefined,
  });

  if (success) {
    successfulEmailLookups.add(1);
  }
}

// Default function - not used in this multi-scenario test
export default function (data: {
  token: string;
  testData: { users: UserEntity[] };
}): void {
  idLookupScenario(data);
  emailLookupScenario(data);
}
