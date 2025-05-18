# Complex Workflow Test

This directory contains load and performance tests that simulate complex user workflows through the event system.

## Complex Workflow Test

The `complex-workflow-test.ts` script simulates a complete user flow with 100 concurrent users performing the following sequence:

1. Login to the system
2. Retrieve the event list
3. Select a specific event
4. Request a reward

This test verifies the requirement that the entire flow should complete in less than 3 seconds.

### Test Configuration

- **Users**: 100 concurrent users
- **Duration**: 2 minutes (30s ramp-up, 1min steady load, 30s ramp-down)
- **Performance Threshold**: Complete flow in under 3 seconds (p95)

### Running the Test

To run this test:

1. Make sure you have k6 installed on your system
2. Build the test bundle:
   ```bash
   pnpm build
   ```
3. Run the test:
   ```bash
   pnpm test:k6:workflow
   ```

### Prerequisites

For this test to run successfully, you need:

1. A running event server instance
2. Test users already created in the system (use `pnpm seed:db` to create test data)

### Success Criteria

The test is considered successful if:
- 95% of all requests complete in under 3 seconds
- At least 95% of all workflows complete successfully 
