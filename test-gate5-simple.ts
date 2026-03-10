/**
 * Copyright (c) 2026 LinkedFlow Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

import Redis from 'ioredis';
import { ConcurrencyGuard } from './src/services/ConcurrencyGuard';
import { logger } from './src/utils/logger';

/**
 * Simple test to verify Gate 5 core components work
 */
async function testGate5Core() {
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    lazyConnect: true
  });

  try {
    logger.info('Testing Gate 5 core components...');

    // Test Redis connection
    await redis.connect();
    logger.info('✅ Redis connection successful');

    // Test ConcurrencyGuard
    const guard = new ConcurrencyGuard(redis);
    const testAccountId = 'test-account-123';

    // Test lock acquisition
    const lockAcquired = await guard.acquireLock(testAccountId, 10000);
    logger.info(`✅ Lock acquisition: ${lockAcquired}`);

    if (lockAcquired) {
      // Test lock info
      const lockInfo = await guard.getLockInfo(testAccountId);
      logger.info('✅ Lock info retrieved:', lockInfo);

      // Test lock check
      const isLocked = await guard.isLocked(testAccountId);
      logger.info(`✅ Lock status check: ${isLocked}`);

      // Test lock release
      await guard.releaseLock(testAccountId);
      logger.info('✅ Lock released successfully');

      // Verify lock is gone
      const isStillLocked = await guard.isLocked(testAccountId);
      logger.info(`✅ Lock cleanup verified: ${!isStillLocked}`);
    }

    logger.info('🎉 Gate 5 core components test PASSED');
    return true;

  } catch (error) {
    logger.error('❌ Gate 5 test failed:', { error: String(error) });
    return false;

  } finally {
    await redis.quit();
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testGate5Core()
    .then((passed) => {
      logger.info(`Test result: ${passed ? 'PASSED' : 'FAILED'}`);
      process.exit(passed ? 0 : 1);
    })
    .catch((error) => {
      logger.error('Test execution error:', { error: String(error) });
      process.exit(1);
    });
}