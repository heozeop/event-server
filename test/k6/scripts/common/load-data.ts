import { Role } from "@libs/enums/auth";
import { RewardType } from "@libs/enums/event";
import { UserEntity } from "@libs/types/auth";
import { BadgeRewardEntity, CouponRewardEntity, EventEntity, PointRewardEntity, RewardBaseEntity } from "@libs/types/event";
import { ADMIN_EMAIL } from "prepare/constants";

// Load test data from files
export function loadUserData(): { users: UserEntity[]; nonExistentEmails: string[] } {
  // Load users data from the K6 bundle
  const usersData = JSON.parse(open("/data/users.json")) as UserEntity[];

  // Filter regular users (non-admin)
  const regularUsers = usersData.filter(
    (user) => !user.roles.includes(Role.ADMIN) && user.email !== ADMIN_EMAIL,
  );

  // Generate non-existent emails by modifying existing emails
  const nonExistentEmails = regularUsers
    .slice(0, 20)
    .map((user) => `nonexistent_${user.email}`);

  return {
    users: regularUsers,
    nonExistentEmails: nonExistentEmails,
  };
}

// Load data from JSON files
export function loadEventAndRewardData(): {
  activeEvents: EventEntity[];
  inactiveEvents: EventEntity[];
  rewards: RewardBaseEntity[];
} {
  // Load events data
  const events = JSON.parse(open("/data/events.json")) as EventEntity[];

  // Filter events by status
  const activeEvents = events.filter((event) => event.status === "ACTIVE");
  const inactiveEvents = events.filter((event) => event.status === "INACTIVE");

  // Load rewards data
  const rewards = JSON.parse(open("/data/rewards.json")) as RewardBaseEntity[];

  return {
    activeEvents,
    inactiveEvents,
    rewards,
  };
}


// Function to load rewards data from JSON
export function loadRewardsData(): {
  pointRewards: PointRewardEntity[];
  badgeRewards: BadgeRewardEntity[];
  couponRewards: CouponRewardEntity[];
} {
  // Load rewards data from JSON file
  const allRewards = JSON.parse(
    open("/data/rewards.json"),
  ) as RewardBaseEntity[];

  // Filter by reward type
  const pointRewards = allRewards.filter(
    (reward): reward is PointRewardEntity => reward.type === RewardType.POINT,
  );

  const badgeRewards = allRewards.filter(
    (reward): reward is BadgeRewardEntity => reward.type === RewardType.BADGE,
  );

  const couponRewards = allRewards.filter(
    (reward): reward is CouponRewardEntity => reward.type === RewardType.COUPON,
  );

  return {
    pointRewards,
    badgeRewards,
    couponRewards,
  };
}
