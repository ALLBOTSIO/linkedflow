/**
 * Copyright (c) 2026 LinkedFlow Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

/**
 * INTEGRATION TEST for Gate 6: Safety Engine + Worker Integration
 *
 * This test demonstrates how the Safety Engine integrates with the worker system
 * and validates the complete safety flow in a production-like environment.
 */

import { LinkedFlowWorker } from './src/worker';
import { SafetyEngine } from './src/services/SafetyEngine';
import { ActionType, AccountStatus, LinkedInAccountType } from './src/types/enums';
import { logger } from './src/utils/logger';
import { redisClient } from './src/utils/redis';
import prisma from './src/db/client';

async function runIntegrationTest() {
  logger.info('🚀 Starting Safety Engine Integration Test');

  const testAccountId = 'test-integration-account';
  const safetyEngine = new SafetyEngine();
  const worker = new LinkedFlowWorker();

  try {
    // ============================================================================
    // SETUP: Create test account and campaign
    // ============================================================================

    logger.info('📋 Setting up test environment');

    // Clean up any existing data
    await cleanupTestData(testAccountId);

    // Create test LinkedIn account
    const testAccount = await prisma.linkedInAccount.create({
      data: {
        id: testAccountId,
        email: 'test-integration@safety.com',
        encrypted_cookies: 'encrypted-test-cookies-data',
        proxy_ip: '192.168.1.100',
        account_type: LinkedInAccountType.FREE,
        status: AccountStatus.WARMING_UP,
        actions_today: 0,
        connections_today: 0,
        messages_today: 0,
        views_today: 0,
        daily_reset_at: new Date(),
        warmup_day: 1,
        organization_id: 'test-org',
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    // Create test campaign
    const testCampaign = await prisma.campaign.create({
      data: {
        id: 'test-campaign-safety',
        name: 'Safety Engine Test Campaign',
        description: 'Testing safety engine integration',
        status: 'active',
        organization_id: 'test-org',
        created_by: 'test-user',
        total_leads: 1,
        completed_leads: 0,
        active_leads: 1,
        replied_leads: 0,
        connected_leads: 0,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    // Create test lead
    const testLead = await prisma.lead.create({
      data: {
        id: 'test-lead-safety',
        first_name: 'John',
        last_name: 'Doe',
        linkedin_url: 'https://linkedin.com/in/john-doe-test',
        company: 'Test Company',
        title: 'CEO',
        status: 'enrolled',
        source: 'manual_entry',
        campaign_id: testCampaign.id,
        assigned_account_id: testAccountId,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    logger.info('✅ Test environment setup complete', {
      account: testAccountId,
      campaign: testCampaign.id,
      lead: testLead.id
    });

    // ============================================================================
    // TEST 1: Safety Engine Blocks Exceed Actions
    // ============================================================================

    logger.info('📋 Test 1: Safety engine integration with worker');

    // Start the worker
    await worker.start();

    // Start an active session
    await safetyEngine.startSession(testAccountId);

    // Create multiple action jobs to exceed warmup limit
    const jobIds: string[] = [];

    for (let i = 1; i <= 15; i++) {
      const jobId = await worker.addActionJob({
        lead_id: testLead.id,
        linkedin_account_id: testAccountId,
        action_type: ActionType.VIEW_PROFILE,
        target_url: `https://linkedin.com/in/test-user-${i}`,
        retry_count: 0,
        scheduled_at: new Date(),
        metadata: { testIteration: i }
      });

      jobIds.push(jobId);
      logger.debug(`Created job ${i}/15: ${jobId}`);

      // Small delay between job creation
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    logger.info('📊 Created 15 jobs, waiting for processing...');

    // Wait for jobs to process (with timeout)
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Check results
    const actionLogs = await prisma.actionLog.findMany({
      where: {
        linkedin_account_id: testAccountId
      },
      orderBy: { created_at: 'asc' }
    });

    const completedActions = actionLogs.filter(log => log.status === 'completed');
    const skippedActions = actionLogs.filter(log => log.status === 'skipped');
    const failedActions = actionLogs.filter(log => log.status === 'failed');

    logger.info('📊 Job processing results:', {
      totalJobs: jobIds.length,
      completedActions: completedActions.length,
      skippedActions: skippedActions.length,
      failedActions: failedActions.length
    });

    // ============================================================================
    // TEST 2: Safety Engine Status Check
    // ============================================================================

    logger.info('📋 Test 2: Account status and action counts');

    const accountStatus = await safetyEngine.checkAccountStatus(testAccountId);
    const actionCounts = await safetyEngine.getActionCounts(testAccountId);
    const isInSession = await safetyEngine.isInActiveSession(testAccountId);

    logger.info('📊 Safety engine status:', {
      accountStatus,
      actionCounts,
      isInSession
    });

    // ============================================================================
    // TEST 3: Kill Switch Simulation
    // ============================================================================

    logger.info('📋 Test 3: Kill switch simulation');

    // Trigger kill switch
    await safetyEngine.pauseAccount(testAccountId, '429 Rate Limited - Simulated LinkedIn Detection');

    const pausedStatus = await safetyEngine.checkAccountStatus(testAccountId);
    logger.info('Account status after kill switch:', { status: pausedStatus });

    // Try to add a job after kill switch
    try {
      await worker.addActionJob({
        lead_id: testLead.id,
        linkedin_account_id: testAccountId,
        action_type: ActionType.SEND_CONNECTION,
        target_url: 'https://linkedin.com/in/test-after-pause',
        retry_count: 0,
        scheduled_at: new Date()
      });

      // Wait a bit and check if it was blocked
      await new Promise(resolve => setTimeout(resolve, 2000));

      const postPauseLogs = await prisma.actionLog.findMany({
        where: {
          linkedin_account_id: testAccountId,
          action_type: ActionType.SEND_CONNECTION
        }
      });

      logger.info('Jobs after kill switch:', {
        connectionJobs: postPauseLogs.length,
        lastStatus: postPauseLogs[postPauseLogs.length - 1]?.status
      });

    } catch (error) {
      logger.info('Expected: Job blocked after kill switch', { error: error.message });
    }

    // ============================================================================
    // TEST 4: Account Resume
    // ============================================================================

    logger.info('📋 Test 4: Account resume functionality');

    await safetyEngine.resumeAccount(testAccountId);
    const resumedStatus = await safetyEngine.checkAccountStatus(testAccountId);

    logger.info('Account status after resume:', { status: resumedStatus });

    // ============================================================================
    // SUMMARY
    // ============================================================================

    const finalActionCounts = await safetyEngine.getActionCounts(testAccountId);

    logger.info('🎉 Integration test completed successfully!');
    logger.info('📊 Final Summary:', {
      totalJobsCreated: jobIds.length,
      finalActionCounts,
      accountStatus: resumedStatus,
      testAccountId
    });

    // Verify core functionality
    if (completedActions.length === 0) {
      throw new Error('No actions were completed - safety engine may be too restrictive');
    }

    if (skippedActions.length === 0) {
      throw new Error('No actions were skipped - safety limits not enforcing correctly');
    }

    if (pausedStatus !== AccountStatus.RATE_LIMITED) {
      throw new Error('Kill switch did not change account status correctly');
    }

    if (resumedStatus === AccountStatus.RATE_LIMITED) {
      throw new Error('Account resume did not work correctly');
    }

    logger.info('✅ All integration tests PASSED!');

  } catch (error) {
    logger.error('❌ Integration test FAILED:', {
      error: error.message,
      stack: error.stack
    });
    throw error;

  } finally {
    // Cleanup
    logger.info('🧹 Cleaning up test environment');

    try {
      await worker.stop();
      await cleanupTestData(testAccountId);
      await redisClient.disconnect();
      await prisma.$disconnect();
    } catch (cleanupError) {
      logger.warn('Cleanup warning:', { error: cleanupError.message });
    }

    logger.info('🏁 Integration test cleanup completed');
  }
}

/**
 * Clean up all test data
 */
async function cleanupTestData(accountId: string) {
  try {
    // Delete test data from database
    await prisma.actionLog.deleteMany({
      where: { linkedin_account_id: accountId }
    });

    await prisma.lead.deleteMany({
      where: { assigned_account_id: accountId }
    });

    await prisma.campaign.deleteMany({
      where: { id: 'test-campaign-safety' }
    });

    await prisma.linkedInAccount.deleteMany({
      where: { id: accountId }
    });

    // Clean Redis data
    const redisKeys = await redisClient.keys(`*${accountId}*`);
    if (redisKeys.length > 0) {
      await redisClient.del(...redisKeys);
    }

    logger.debug('Test data cleanup completed', { accountId });

  } catch (error) {
    logger.warn('Cleanup error (non-fatal)', { error: error.message });
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runIntegrationTest()
    .then(() => {
      logger.info('✅ Safety Engine integration test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Safety Engine integration test failed:', error);
      process.exit(1);
    });
}

export { runIntegrationTest };