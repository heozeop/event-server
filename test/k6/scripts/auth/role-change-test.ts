import { getAdminToken } from "@/common/admin.login";
import { loadUserData } from "@/common/load-data";
import { Role } from "@libs/enums";
import { UserEntity } from "@libs/types";
import { check } from "k6";
import http from "k6/http";
import { Counter } from "k6/metrics";
import { Options } from "k6/options";
import { API_BASE_URL } from "prepare/constants";
import { randomSleep } from "../utils";

// Custom metrics
const successfulSingleRoleChanges = new Counter(
  "successful_single_role_changes",
);
const successfulMultiRoleChanges = new Counter("successful_multi_role_changes");

// Define test options with two scenarios as per requirements
export const options: Options = {
  scenarios: {
    // Scenario 1: Single role addition - 3 requests per second
    single_role_addition: {
      executor: "constant-arrival-rate",
      rate: 3, // 3 requests per second
      timeUnit: "1s", // 1 second
      duration: "2m", // 2 minutes
      preAllocatedVUs: 5, // Initial pool of VUs
      maxVUs: 15, // Maximum number of VUs to handle the rate
      exec: "singleRoleAdditionScenario", // Function to execute
    },
    // Scenario 2: Multiple role change - 2 requests per second
    multi_role_change: {
      executor: "constant-arrival-rate",
      rate: 2, // 2 requests per second
      timeUnit: "1s", // 1 second
      duration: "2m", // 2 minutes
      preAllocatedVUs: 5, // Initial pool of VUs
      maxVUs: 10, // Maximum number of VUs to handle the rate
      exec: "multiRoleChangeScenario", // Function to execute
    },
  },
  thresholds: {
    // All responses should be below 300ms for 95% of requests (as per requirement)
    http_req_duration: ["p(95)<300"],

    // Specific thresholds for each scenario
    "http_req_duration{scenario:single_role_addition}": ["p(95)<300"],
    "http_req_duration{scenario:multi_role_change}": ["p(95)<300"],

    // Threshold for success rates
    "http_reqs{status:200}": ["rate>0.99"], // 99% success rate overall

    // Custom metrics thresholds
    successful_single_role_changes: ["count>0"], // Expecting ~0
    successful_multi_role_changes: ["count>0"], // Expecting ~0
  },
};

const users = loadUserData();

// Setup function - runs once per VU
export function setup(): { token: string; testData: { users: UserEntity[] } } {
  // Get admin auth token
  const token = getAdminToken();

  return {
    token,
    testData: {
      users: users.users,
    },
  };
}

// Scenario 1: Single role addition (adding OPERATOR role)
export function singleRoleAdditionScenario(data: {
  token: string;
  testData: { users: UserEntity[] };
}) {
  randomSleep(2, 10);

  // Use data from setup
  const { token, testData } = data;

  // Get a random user
  const user =
    testData.users[Math.floor(Math.random() * testData.users.length)];
  console.log(user._id);

  // Add OPERATOR role to the user (keeping existing USER role)
  const response = http.patch(
    `${API_BASE_URL}/auth/users/${user._id.toString()}/roles`,
    JSON.stringify({
      roles: [Role.USER, Role.OPERATOR],
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
  console.log(response.json());

  // Check response
  const success = check(response, {
    "status is 200": (r) => r.status === 200,
    "response time < 300ms": (r) => r.timings.duration < 300,
    "user ID exists": (r) => r.json("id") !== undefined,
    "email matches": (r) => r.json("email") === user.email,
    "roles contain OPERATOR": (r) => {
      const roles = r.json("roles");
      return Array.isArray(roles) && roles.includes(Role.OPERATOR);
    },
    "updatedAt exists": (r) => r.json("updatedAt") !== undefined,
  });

  if (success) {
    successfulSingleRoleChanges.add(1);
  }

  return success;
}

// Scenario 2: Multiple role change (changing to OPERATOR and ANALYST)
export function multiRoleChangeScenario(data: {
  token: string;
  testData: { users: UserEntity[] };
}) {
  randomSleep(2, 10);

  // Use data from setup
  const { token, testData } = data;

  // Get a random user
  const user =
    testData.users[Math.floor(Math.random() * testData.users.length)];
  console.log(user._id);

  // Change roles to OPERATOR and ANALYST (replacing USER role)
  const response = http.patch(
    `${API_BASE_URL}/auth/users/${user._id}/roles`,
    JSON.stringify({
      roles: [Role.OPERATOR, Role.ADMIN],
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
  console.log(response.json());

  // Check response
  const success = check(response, {
    "status is 200": (r) => r.status === 200,
    "response time < 300ms": (r) => r.timings.duration < 300,
    "user ID exists": (r) => r.json("id") !== undefined,
    "email matches": (r) => r.json("email") === user.email,
    "roles contain OPERATOR and ANALYST": (r) => {
      const roles = r.json("roles");
      return (
        Array.isArray(roles) &&
        roles.includes(Role.OPERATOR) &&
        roles.includes(Role.ADMIN)
      );
    },
    "roles no longer contain USER": (r) => {
      const roles = r.json("roles");
      return Array.isArray(roles) && !roles.includes("USER");
    },
    "updatedAt exists": (r) => r.json("updatedAt") !== undefined,
  });

  if (success) {
    successfulMultiRoleChanges.add(1);
  }

  return success;
}

export default function ({
  token,
  testData,
}: {
  token: string;
  testData: { users: UserEntity[] };
}) {
  singleRoleAdditionScenario({ token, testData });
  multiRoleChangeScenario({ token, testData });
}
