import * as fs from "fs";
import { MongoClient, ObjectId } from "mongodb";
import * as path from "path";

// Configuration for database connections
const config = {
  user: {
    uri: process.env.USER_DB_URI || "mongodb://mongo-user:27017",
    dbName: process.env.USER_DB_NAME || "user-db",
    collection: process.env.USER_COLLECTION || "user",
  },
  event: {
    uri: process.env.EVENT_DB_URI || "mongodb://mongo-event:27017",
    dbName: process.env.EVENT_DB_NAME || "event-db",
    collection: process.env.EVENT_COLLECTION || "event",
  },
  reward: {
    uri: process.env.REWARD_DB_URI || "mongodb://mongo-event:27017",
    dbName: process.env.REWARD_DB_NAME || "event-db",
    collection: process.env.REWARD_COLLECTION || "rewards",
  },
  eventReward: {
    uri: process.env.EVENT_REWARD_DB_URI || "mongodb://mongo-event:27017",
    dbName: process.env.EVENT_REWARD_DB_NAME || "event-db",
    collection: process.env.EVENT_REWARD_COLLECTION || "event-reward",
  },
};

// Import data from data files
function loadDataFile(filePath: string): any[] {
  try {
    // Get the full path to the data file
    const fullPath = path.resolve(__dirname, filePath);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.error(`Data file not found: ${fullPath}`);
      console.log(
        'Please run "pnpm generate:fixtures" first to generate test data',
      );
      process.exit(1);
    }

    // Read and parse the JavaScript file
    const fileContent = fs.readFileSync(fullPath, "utf8");

    // Extract the default export which contains the array
    const data = JSON.parse(fileContent);

    return data;
  } catch (error) {
    console.error(`Error loading data file ${filePath}:`, error);
    process.exit(1);
  }
}

// Load data
const userData = loadDataFile("./data/users.json");
const eventData = loadDataFile("./data/events.json");
const rewardData = loadDataFile("./data/rewards.json");
const eventRewardData = loadDataFile("./data/event-rewards.json");

async function seedDatabase() {
  console.log("Starting database seeding...");
  console.log(`User DB: ${config.user.uri}/${config.user.dbName}`);
  console.log(`Event DB: ${config.event.uri}/${config.event.dbName}`);
  console.log(`Reward DB: ${config.reward.uri}/${config.reward.dbName}`);

  // Connect to MongoDB instances
  const userClient = new MongoClient(config.user.uri);
  const eventClient = new MongoClient(config.event.uri);

  try {
    // Connect to both clients
    await userClient.connect();
    console.log("Connected to user database");

    await eventClient.connect();
    console.log("Connected to event database");

    // Insert users data
    const userDb = userClient.db(config.user.dbName);
    const userCollection = userDb.collection(config.user.collection);

    // Drop existing collection if it exists
    await userCollection.deleteMany({});

    // Prepare user data - convert string IDs to ObjectIds
    const preparedUserData = userData.map((user) => ({
      ...user,
      _id: new ObjectId(user._id),
    }));

    // Insert all users
    const userResult = await userCollection.insertMany(preparedUserData);
    console.log(`${userResult.insertedCount} users inserted successfully`);

    // Insert events data
    const eventDb = eventClient.db(config.event.dbName);
    const eventCollection = eventDb.collection(config.event.collection);

    // Drop existing collection if it exists
    await eventCollection.deleteMany({});

    // Prepare event data - convert string IDs to ObjectIds and format dates
    const preparedEventData = eventData.map((event) => ({
      ...event,
      _id: new ObjectId(event._id),
      periodStart: new Date(event.periodStart),
      periodEnd: event.periodEnd ? new Date(event.periodEnd) : null,
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(),
    }));

    // Insert all events
    const eventResult = await eventCollection.insertMany(preparedEventData);
    console.log(`${eventResult.insertedCount} events inserted successfully`);

    // Insert rewards data
    const rewardDb = eventClient.db(config.reward.dbName);
    const rewardCollection = rewardDb.collection(config.reward.collection);

    // Drop existing collection if it exists
    await rewardCollection.deleteMany({});
    const preparedRewardData = rewardData.map((reward) => ({
      ...reward,
      _id: new ObjectId(reward._id),
      createdAt: new Date(reward.createdAt),
      updatedAt: new Date(),
    }));

    const rewardResult = await rewardCollection.insertMany(preparedRewardData);
    console.log(`${rewardResult.insertedCount} rewards inserted successfully`);

    // Insert event rewards data
    const eventRewardDb = eventClient.db(config.eventReward.dbName);
    const eventRewardCollection = eventRewardDb.collection(
      config.eventReward.collection,
    );

    // Drop existing collection if it exists
    await eventRewardCollection.deleteMany({});

    const preparedEventRewardData = eventRewardData.map((eventReward) => ({
      ...eventReward,
      _id: new ObjectId(eventReward._id),
      createdAt: new Date(eventReward.createdAt),
      updatedAt: new Date(),
    }));

    const eventRewardResult = await eventRewardCollection.insertMany(
      preparedEventRewardData,
    );
    console.log(
      `${eventRewardResult.insertedCount} event rewards inserted successfully`,
    );

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    // Close connections
    await userClient.close();
    await eventClient.close();
    console.log("Database connections closed");
  }
}

// Run the seed function
seedDatabase();
