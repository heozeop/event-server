import { getAdminToken } from "@/common/admin.login";
import { loadEventAndRewardData } from "@/common/load-data";
import { check } from "k6";
import http from "k6/http";
import { Counter } from "k6/metrics";
import { Options } from "k6/options";
import { API_BASE_URL } from "prepare/constants";
import { randomSleep } from "../utils";

// Define types for data
type Event = {
  id: string;
  name: string;
  condition: {
    minPurchase: number;
    maxRewards: number;
  };
  period: {
    start: string;
    end: string;
  };
  status: string;
  createdAt: string;
};

type User = {
  id: string;
  email: string;
  roles: string[];
  password?: string;
  createdAt?: string;
  updatedAt?: string;
};

// Custom metrics
const successfulRequests = new Counter("successful_reward_requests");

// Define test options based on requirements: 50 requests per second, 150ms response time
export const options: Options = {
  scenarios: {
    reward_requests: {
      executor: "constant-arrival-rate",
      rate: 50, // 50 requests per second
      timeUnit: "1s", // 1 second
      duration: "2m", // 2 minutes
      preAllocatedVUs: 60, // Initial pool of VUs
      maxVUs: 100, // Maximum number of VUs to handle the rate
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<150"], // 95% of requests should be below 150ms
    "http_req_duration{status:201}": ["max<300"], // Max duration for 201 Created should be below 300ms
    "http_reqs{status:201}": ["rate>0.99"], // 99% success rate
    successful_requests: ["count>5900"], // Expecting ~6000 successful requests over 2 minutes (50/s * 120s)
  },
};

// Load test data
const testData = loadEventAndRewardData();

// Setup function - runs once per VU
export function setup() {
  // Save auth token for test runs
  const authToken = getAdminToken();

  return {
    authToken,
    testData,
  };
}

// Default function executed for each virtual user
export default function (data: {
  authToken: string;
  testData: { events: Event[]; users: User[] };
}): void {
  // Small random delay to prevent perfect sync of requests
  randomSleep(1, 5);

  const { authToken, testData } = data;
  const { events } = testData;

  // Select a random event and user
  const event = events[Math.floor(Math.random() * events.length)];

  // Make reward request
  const requestResponse = http.post(
    `${API_BASE_URL}/events/${event.id}/request`,
    undefined, // No payload needed for this endpoint
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  // Check response
  const success = check(requestResponse, {
    "status is 201": (r) => r.status === 201,
    "response time < 150ms": (r) => r.timings.duration < 150,
    "request id exists": (r) => r.json("id") !== undefined,
    "event id matches": (r) => r.json("eventId") === event.id,
    "user id exists": (r) => r.json("userId") !== undefined,
    "status is PENDING": (r) => r.json("status") === "PENDING",
    "createdAt exists": (r) => r.json("createdAt") !== undefined,
  });

  // Increment counter if request was successful
  if (success) {
    successfulRequests.add(1);
  }
}
