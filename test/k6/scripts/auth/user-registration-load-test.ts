import { check } from "k6";
import http from "k6/http";
import { Counter } from "k6/metrics";
import { Options } from "k6/options";
import { API_BASE_URL } from "prepare/constants";
import { generateUserData } from "../utils";

// Custom metrics
const successfulRegistrations = new Counter("successful_registrations");

// Define test options - 50 user registrations per second
export const options: Options = {
  scenarios: {
    user_registrations: {
      executor: "constant-arrival-rate",
      rate: 50, // 50 requests per second
      timeUnit: "1s", // 1 second
      duration: "5m", // 5 minutes
      preAllocatedVUs: 100, // Initial pool of VUs
      maxVUs: 200, // Maximum number of VUs to handle the rate
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<300"], // 95% of requests should be below 300ms (as per requirement)
    "http_req_duration{status:201}": ["max<500"], // Max duration for 201 Created should be below 500ms
    "http_reqs{status:201}": ["rate>0.99"], // 99% success rate (failure rate below 1%)
    successful_registrations: ["count>14000"], // Expecting ~15000 registrations over 5 minutes (50/s * 300s)
  },
};

// Default function executed for each virtual user
export default function () {
  // Generate unique user data
  const userData = generateUserData(
    Date.now() + Math.floor(Math.random() * 100000),
  );

  // Make user registration request
  const registrationResponse = http.post(
    `${API_BASE_URL}/auth/users`,
    JSON.stringify(userData),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  // Check response
  const success = check(registrationResponse, {
    "status is 201": (r) => r.status === 201,
    "user ID exists": (r) => r.json("id") !== undefined,
    "email matches": (r) => r.json("email") === userData.email,
    "roles contain USER": (r) => {
      const roles = r.json("roles");
      return Array.isArray(roles) && roles.includes("USER");
    },
    "createdAt exists": (r) => r.json("createdAt") !== undefined,
    "updatedAt exists": (r) => r.json("updatedAt") !== undefined,
  });

  // Increment counter if registration was successful
  if (success) {
    successfulRegistrations.add(1);
  }
}
