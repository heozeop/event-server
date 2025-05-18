import { faker } from '@faker-js/faker';
import { sleep } from 'k6';

/**
 * Returns a random item from an array
 * @param array The array to select from
 * @returns A random item from the array
 */
export function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Sleeps for a random time between min and max milliseconds
 * @param min Minimum sleep time in milliseconds
 * @param max Maximum sleep time in milliseconds
 */
export function randomSleep(min: number, max: number): void {
  const sleepTime = Math.floor(Math.random() * (max - min + 1)) + min;
  sleep(sleepTime / 1000); // k6 sleep expects seconds, not milliseconds
}

/**
 * Generates a random email
 * @returns Random email address
 */
export function generateRandomEmail(): string {
  return faker.internet.email();
}

/**
 * Generates user data for registration
 * @param index Optional index to include in email
 * @returns User registration data
 */
export function generateUserData(index?: number): { email: string; password: string } {
  return {
    email: index !== undefined ? `user${index}@example.com` : generateRandomEmail(),
    password: 'Password123!'
  };
}

/**
 * Generates a batch of unique user data
 * @param count Number of users to generate
 * @returns Array of user registration data
 */
export function generateUniqueUsers(count: number): Array<{ email: string; password: string }> {
  return Array.from({ length: count }, (_, i) => generateUserData(i));
} 
