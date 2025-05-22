import { faker } from "@faker-js/faker";
import { EventStatus, RewardType, Role } from "@libs/enums";
import {
  BadgeRewardEntity,
  CouponRewardEntity,
  EventEntity,
  EventRewardEntity,
  ItemRewardEntity,
  PointRewardEntity,
  RewardBaseEntity,
  UserEntity,
} from "@libs/types";
import * as bcrypt from "bcryptjs";
import * as fs from "fs";
import { ObjectId } from "mongodb";
import { ADMIN_EMAIL, TEST_PASSWORD } from "./constants";

// Number of test entities to generate
const NUM_USERS = 100;
const NUM_EVENTS = 50;

// Function to generate random users
function generateUsers(count: number): UserEntity[] {
  const users: UserEntity[] = [];
  const testPasswordHash = bcrypt.hashSync(TEST_PASSWORD, 10);

  for (let i = 0; i < count; i++) {
    const user: UserEntity = {
      _id: new ObjectId(),
      email: faker.internet.email(),
      passwordHash: testPasswordHash, // For testing purposes, don't need real hash
      roles: [Role.USER],
      createdAt: faker.date.past(),
      updatedAt: new Date(),
    };

    users.push(user);
  }

  // Add an admin user for testing
  const adminUser: UserEntity = {
    _id: new ObjectId(),
    email: ADMIN_EMAIL,
    passwordHash: testPasswordHash,
    roles: [Role.ADMIN],
    createdAt: faker.date.past(),
    updatedAt: new Date(),
  };

  users.push(adminUser);

  return users;
}

// Function to generate random rewards
function generateRewards(count: number): RewardBaseEntity[] {
  const rewards: RewardBaseEntity[] = [];

  for (let i = 0; i < count; i++) {
    const rewardType = faker.helpers.arrayElement(Object.values(RewardType));
    let reward: RewardBaseEntity;

    switch (rewardType) {
      case RewardType.POINT:
        reward = {
          _id: new ObjectId(),
          type: RewardType.POINT,
          name: `${faker.number.int({ min: 100, max: 10000 })} Points Reward`,
          points: faker.number.int({ min: 100, max: 10000 }),
          createdAt: faker.date.past(),
          updatedAt: new Date(),
        } as PointRewardEntity;
        break;

      case RewardType.ITEM:
        reward = {
          _id: new ObjectId(),
          type: RewardType.ITEM,
          name: `${faker.company.name()} Item`,
          itemId: faker.string.uuid(),
          quantity: faker.number.int({ min: 1, max: 5 }),
          createdAt: faker.date.past(),
          updatedAt: new Date(),
        } as ItemRewardEntity;
        break;

      case RewardType.COUPON:
        reward = {
          _id: new ObjectId(),
          type: RewardType.COUPON,
          name: `${faker.company.name()} Coupon`,
          couponCode: `COUPON-${faker.number.int({ min: 1000, max: 9999 })}`,
          expiry: faker.date.future(),
          createdAt: faker.date.past(),
          updatedAt: new Date(),
        } as CouponRewardEntity;
        break;

      case RewardType.BADGE:
        reward = {
          _id: new ObjectId(),
          type: RewardType.BADGE,
          name: `${faker.company.name()} Badge`,
          badgeId: faker.string.uuid(),
          createdAt: faker.date.past(),
          updatedAt: new Date(),
        } as BadgeRewardEntity;
        break;

      default:
        throw new Error(`Unknown reward type: ${rewardType}`);
    }

    rewards.push(reward);
  }

  return rewards;
}

// Function to generate random events
function generateEvents(count: number, users: UserEntity[]): EventEntity[] {
  const events: EventEntity[] = [];
  for (let i = 0; i < count; i++) {
    const startDate = faker.date.future();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + faker.number.int({ min: 1, max: 30 }));

    const event: EventEntity = {
      _id: new ObjectId(),
      name: faker.company.name() + " Event",
      rewardCondition: {
        minPurchase: faker.number.int({ min: 100, max: 10000 }),
        maxRewards: faker.number.int({ min: 1, max: 5 }),
      },
      periodStart: startDate,
      periodEnd: endDate,
      status: faker.helpers.arrayElement(Object.values(EventStatus)),
      createdAt: faker.date.past(),
      updatedAt: new Date(),
    };

    events.push(event);
  }

  return events;
}

function generateEventRewards(
  count: number,
  events: EventEntity[],
  rewards: RewardBaseEntity[],
): EventRewardEntity[] {
  const rewardEvents: EventRewardEntity[] = [];

  for (let i = 0; i < count; i++) {
    const rewardEvent: EventRewardEntity = {
      _id: new ObjectId(),
      event: faker.helpers
        .arrayElement(events)
        ._id.toString() as unknown as EventEntity,
      reward: faker.helpers
        .arrayElement(rewards)
        ._id.toString() as unknown as RewardBaseEntity,
      createdAt: faker.date.past(),
      updatedAt: new Date(),
      condition: {
        minPurchase: faker.number.int({ min: 100, max: 10000 }),
      },
      autoResolve: faker.helpers.arrayElement([true, false]),
    };

    rewardEvents.push(rewardEvent);
  }
  return rewardEvents;
}

// Function to export data for k6 tests
function exportDataForK6Tests(
  users: UserEntity[],
  events: EventEntity[],
  rewards: RewardBaseEntity[],
): void {
  const dataDir = `${__dirname}/data`;

  // Create directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const eventRewards = generateEventRewards(NUM_EVENTS, events, rewards);

  // Create export files that include helper functions
  const usersExport = JSON.stringify(users);
  const eventsExport = JSON.stringify(events);
  const rewardsExport = JSON.stringify(rewards);
  const eventRewardsExport = JSON.stringify(eventRewards);
  // Convert to a format with IDs for export

  fs.writeFileSync(`${dataDir}/users.json`, usersExport);
  fs.writeFileSync(`${dataDir}/events.json`, eventsExport);
  fs.writeFileSync(`${dataDir}/rewards.json`, rewardsExport);
  fs.writeFileSync(`${dataDir}/event-rewards.json`, eventRewardsExport);

  console.log("✅ Test data exported for k6 tests");
}

// Generate and save data
async function generateTestData(): Promise<void> {
  console.log("Generating test data...");

  try {
    // Generate entities directly without ORM
    const users = generateUsers(NUM_USERS);
    const events = generateEvents(NUM_EVENTS, users);
    const rewards = generateRewards(NUM_EVENTS * 2);

    // Export data for k6 tests
    exportDataForK6Tests(users, events, rewards);

    console.log("✅ Test data generation complete");
  } catch (error) {
    console.error("❌ Error generating test data:", error);
  }
}

// Run the data generation
generateTestData().catch(console.error);
