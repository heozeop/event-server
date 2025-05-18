import { getAdminToken } from "@/common/admin.login";
import { EventEntity, RewardBaseEntity } from "@libs/types";
import { check } from "k6";
import http from "k6/http";
import { Counter } from "k6/metrics";
import { Options } from "k6/options";
import { API_BASE_URL } from "prepare/constants";
import { randomSleep } from "../utils";

// Custom metrics
const successfulRequests = new Counter("successful_event_rewards_requests");

// Define test options based on requirements
export const options: Options = {
  scenarios: {
    event_rewards_requests: {
      executor: "constant-arrival-rate",
      rate: 20, // 20 requests per second as per requirements
      timeUnit: "1s", // 1 second
      duration: "2m", // 2 minutes test duration
      preAllocatedVUs: 50, // Initial pool of VUs
      maxVUs: 100, // Maximum number of VUs to handle the rate
      exec: "eventRewardsTest", // Reference to the function to execute
    },
  },
  thresholds: {
    // Response time requirement: 120ms or less (per requirements)
    "http_req_duration{scenario:event_rewards_requests}": ["p(95)<120"], // 95% of requests should be below 120ms

    // Success rate
    "http_reqs{status:200}": ["rate>0.99"], // 99% success rate

    // Count metrics
    successful_event_rewards_requests: ["count>2300"], // At least 2300 successful requests (20/s * 120s = 2400 expected)
  },
};

// Load event data from JSON file
function loadEventData(): string[] {
  // Load events data from the prepare directory
  const events = JSON.parse(open("/data/events.json")) as EventEntity[];

  // Extract event IDs
  const eventIds = events.map((event) => event._id.toString());

  return eventIds;
}

// Helper function to check if response is an array of rewards
function isRewardArray(data: unknown): data is RewardBaseEntity[] {
  return (
    Array.isArray(data) &&
    (data.length === 0 ||
      (typeof data[0] === "object" &&
        data[0] !== null &&
        "id" in data[0] &&
        "type" in data[0] &&
        "name" in data[0]))
  );
}

// Load test data
const eventIds = loadEventData();

// Setup function - runs once per VU
export function setup() {
  const token = getAdminToken();

  return {
    token,
    eventIds,
  };
}

// Event Rewards List Test
export function eventRewardsTest(data: { token: string; eventIds: string[] }) {
  // Select a random event ID from the array
  const eventId =
    data.eventIds[Math.floor(Math.random() * data.eventIds.length)];

  const response = http.get(`${API_BASE_URL}/events/${eventId}/rewards`, {
    headers: {
      Authorization: `Bearer ${data.token}`,
      "Content-Type": "application/json",
    },
  });

  const success = check(response, {
    "status is 200": (r) => r.status === 200,
    "response is an array": (r) => Array.isArray(r.json()),
    "rewards have proper structure": (r) => {
      const rewards = r.json();
      return isRewardArray(rewards);
    },
    "response time is under 120ms": (r) => r.timings.duration < 120,
  });

  if (success) {
    successfulRequests.add(1);
  }

  // Add some randomness to avoid synchronized requests
  randomSleep(50, 200);
}

// Default function will not be used for our test scenarios
export default function () {
  // This won't execute with our scenario-based approach
}
