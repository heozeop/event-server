import { Role } from '@libs/enums';
import * as bcrypt from 'bcryptjs';
import { MongoClient, ObjectId } from 'mongodb';

// Configuration for database connections
const config = {
  user: {
    uri: process.env.USER_DB_URI || 'mongodb://localhost:27017',
    dbName: process.env.USER_DB_NAME || 'user-db',
    collection: process.env.USER_COLLECTION || 'user',
  },
};

// Base users needed for testing
const baseUsers = [
  {
    _id: new ObjectId('645f2d1b8c5cd2f948e9a111'),
    email: 'admin@example.com',
    passwordHash: hashPassword('admin1234'),
    roles: [Role.USER, Role.ADMIN],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: new ObjectId('645f2d1b8c5cd2f948e9a222'),
    email: 'operator@example.com',
    passwordHash: hashPassword('operator1234'),
    roles: [Role.USER, Role.OPERATOR],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: new ObjectId('645f2d1b8c5cd2f948e9a333'),
    email: 'auditor@example.com',
    passwordHash: hashPassword('auditor1234'),
    roles: [Role.USER, Role.AUDITOR],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: new ObjectId('645f2d1b8c5cd2f948e9a444'),
    email: 'user@example.com',
    passwordHash: hashPassword('user1234'),
    roles: [Role.USER],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Hash password utility function
function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

/**
 * Sets up the test database with base users
 */
export async function setupTestUsers(): Promise<void> {
  console.log('Setting up test users in database...');
  console.log(`User DB: ${config.user.uri}/${config.user.dbName}`);

  const userClient = new MongoClient(config.user.uri);

  try {
    await userClient.connect();
    console.log('Connected to user database');

    const userDb = userClient.db(config.user.dbName);
    const userCollection = userDb.collection(config.user.collection);

    // Upsert each base user (create if not exists, update if exists)
    for (const user of baseUsers) {
      const existingUser = await userCollection.findOne({ email: user.email });
      if (existingUser) {
        await userCollection.updateOne({ _id: existingUser._id }, { $set: {
          passwordHash: user.passwordHash,
          roles: user.roles,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        } });
      } else {
        await userCollection.insertOne(user);
      }
    }

    console.log(`Base users setup completed successfully`);
  } catch (error) {
    console.error('Error setting up test users:', error);
    throw error;
  } finally {
    await userClient.close();
    console.log('Database connection closed');
  }
}

/**
 * Checks if a user with the given email exists in the database
 */
export async function userExists(email: string): Promise<boolean> {
  const userClient = new MongoClient(config.user.uri);

  try {
    await userClient.connect();
    const userDb = userClient.db(config.user.dbName);
    const userCollection = userDb.collection(config.user.collection);

    const user = await userCollection.findOne({ email });
    return !!user;
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return false;
  } finally {
    await userClient.close();
  }
}

// Run the setup function if this file is executed directly
if (require.main === module) {
  setupTestUsers()
    .then(() => {
      console.log('Test setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test setup failed:', error);
      process.exit(1);
    });
}
