import './admin.spec';
import './auditor.spec';
import './operator.spec';
import './user.spec';

// This file allows running all test files in a specific order
// Run with: npm test -- test/usecase/index.spec.ts

describe('End-to-End Test Suite', () => {
  it('runs all tests in the correct order', () => {
    // This is a dummy test to ensure the describe block is valid
    expect(true).toBe(true);
  });
}); 
