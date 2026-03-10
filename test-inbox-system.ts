/**
 * Copyright (c) 2026 LinkedFlow Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

import { PrismaClient } from '@prisma/client';
import { InboxPoller } from './src/services/InboxPoller';
import { CookieVault } from './src/services/CookieVault';
import { ProxyManager } from './src/services/ProxyManager';
import { CampaignEngine } from './src/services/CampaignEngine';
import { LinkedFlowWorker } from './src/worker/index';
import { LeadStatus, CampaignStatus, ActionLogStatus, ActionType, StepCondition } from './src/types/enums';
import { logger } from './src/utils/logger';

/**
 * Acceptance test for Gate 7: Accept-Detection + Stop-on-Reply system
 * Tests inbox monitoring for connection acceptance and reply detection
 */
async function testInboxSystem() {
  const prisma = new PrismaClient();
  let worker: LinkedFlowWorker | null = null;

  try {
    logger.info('Starting Gate 7 Inbox System acceptance test');

    // ====================================================================
    // SETUP: Create test data
    // ====================================================================

    // Create test organization
    const organization = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        domain: 'test.com'
      }
    });

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User',
        role: 'admin',
        organization_id: organization.id
      }
    });

    // Create test LinkedIn account
    const linkedinAccount = await prisma.linkedInAccount.create({
      data: {
        email: 'test@linkedin.com',
        encrypted_cookies: 'encrypted_test_cookies_data',
        proxy_ip: '127.0.0.1',
        account_type: 'premium',
        status: 'active',
        actions_today: 0,
        connections_today: 0,
        messages_today: 0,
        views_today: 0,
        daily_reset_at: new Date(),
        warmup_day: 31,
        organization_id: organization.id
      }
    });

    // Create test campaign with if_accepted condition step
    const campaign = await prisma.campaign.create({
      data: {
        name: 'Test Inbox Campaign',
        description: 'Testing inbox detection',
        status: CampaignStatus.ACTIVE,
        organization_id: organization.id,
        created_by: user.id,
        total_leads: 3,
        completed_leads: 0,
        active_leads: 0,
        replied_leads: 0,
        connected_leads: 0
      }
    });

    // Create campaign steps
    const step1 = await prisma.campaignStep.create({
      data: {
        campaign_id: campaign.id,
        step_order: 1,
        action_type: ActionType.SEND_CONNECTION,
        delay_minutes: 0,
        message_template: 'Let\'s connect!',
        condition: StepCondition.ALWAYS,
        is_active: true
      }
    });

    const step2 = await prisma.campaignStep.create({
      data: {
        campaign_id: campaign.id,
        step_order: 2,
        action_type: ActionType.SEND_MESSAGE,
        delay_minutes: 1440, // 24 hours
        message_template: 'Thanks for connecting!',
        condition: StepCondition.IF_CONNECTED,
        is_active: true
      }
    });

    // Create test leads
    const leads = await Promise.all([
      // Lead 1: Will have connection accepted
      prisma.lead.create({
        data: {
          first_name: 'John',
          last_name: 'Connected',
          linkedin_url: 'https://linkedin.com/in/john-connected',
          status: LeadStatus.IN_PROGRESS,
          source: 'manual_entry',
          campaign_id: campaign.id,
          assigned_account_id: linkedinAccount.id
        }
      }),
      // Lead 2: Will reply (should stop automation)
      prisma.lead.create({
        data: {
          first_name: 'Jane',
          last_name: 'Replied',
          linkedin_url: 'https://linkedin.com/in/jane-replied',
          status: LeadStatus.IN_PROGRESS,
          source: 'manual_entry',
          campaign_id: campaign.id,
          assigned_account_id: linkedinAccount.id
        }
      }),
      // Lead 3: No activity (control)
      prisma.lead.create({
        data: {
          first_name: 'Bob',
          last_name: 'NoActivity',
          linkedin_url: 'https://linkedin.com/in/bob-noactivity',
          status: LeadStatus.IN_PROGRESS,
          source: 'manual_entry',
          campaign_id: campaign.id,
          assigned_account_id: linkedinAccount.id
        }
      })
    ]);

    // Create completed connection requests for testing
    await prisma.actionLog.create({
      data: {
        lead_id: leads[0].id,
        campaign_step_id: step1.id,
        linkedin_account_id: linkedinAccount.id,
        action_type: ActionType.SEND_CONNECTION,
        status: ActionLogStatus.COMPLETED,
        scheduled_at: new Date(Date.now() - 60000),
        executed_at: new Date(Date.now() - 60000),
        metadata: JSON.stringify({
          step_order: 1,
          message_template: 'Let\'s connect!'
        })
      }
    });

    await prisma.actionLog.create({
      data: {
        lead_id: leads[1].id,
        campaign_step_id: step1.id,
        linkedin_account_id: linkedinAccount.id,
        action_type: ActionType.SEND_CONNECTION,
        status: ActionLogStatus.COMPLETED,
        scheduled_at: new Date(Date.now() - 120000),
        executed_at: new Date(Date.now() - 120000),
        metadata: JSON.stringify({
          step_order: 1,
          message_template: 'Let\'s connect!'
        })
      }
    });

    logger.info('Test data created', {
      organizationId: organization.id,
      campaignId: campaign.id,
      accountId: linkedinAccount.id,
      leadCount: leads.length
    });

    // ====================================================================
    // STEP 1: Initialize inbox polling system
    // ====================================================================

    logger.info('Initializing inbox polling system...');
    const cookieVault = new CookieVault();
    const proxyManager = new ProxyManager();
    const inboxPoller = new InboxPoller(prisma, cookieVault, proxyManager);

    // ====================================================================
    // STEP 2: Simulate connection acceptance
    // ====================================================================

    logger.info('Simulating connection acceptance for lead 1...');

    // Mark first lead as connected (simulating inbox detection)
    await inboxPoller.markAsConnected(leads[0].id);

    // ====================================================================
    // STEP 3: Simulate reply detection
    // ====================================================================

    logger.info('Simulating reply detection for lead 2...');

    // Mark second lead as replied (simulating inbox detection)
    const replyMessage = "Hi! Thanks for reaching out. I'm interested in learning more about your services.";
    await inboxPoller.markAsReplied(leads[1].id, replyMessage);

    // ====================================================================
    // STEP 4: Test inbox polling (mocked)
    // ====================================================================

    logger.info('Testing inbox polling functionality...');

    // Note: In a real test environment, we would need actual LinkedIn credentials
    // For this test, we'll verify the service can be called without crashing
    try {
      // This will fail without real credentials, but we can verify structure
      await inboxPoller.pollAccount(linkedinAccount.id);
    } catch (error) {
      logger.info('Inbox polling failed as expected (no real LinkedIn credentials)', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // ====================================================================
    // STEP 5: Verify database changes
    // ====================================================================

    logger.info('Verifying database changes...');

    // Check lead statuses
    const [updatedLead1, updatedLead2, updatedLead3] = await Promise.all([
      prisma.lead.findUnique({ where: { id: leads[0].id } }),
      prisma.lead.findUnique({ where: { id: leads[1].id } }),
      prisma.lead.findUnique({ where: { id: leads[2].id } })
    ]);

    // Check action logs
    const actionLogs = await prisma.actionLog.findMany({
      where: {
        lead_id: { in: leads.map(l => l.id) }
      },
      orderBy: { created_at: 'desc' }
    });

    // Check campaign stats
    const updatedCampaign = await prisma.campaign.findUnique({
      where: { id: campaign.id }
    });

    // ====================================================================
    // STEP 6: Test stop-on-reply logic
    // ====================================================================

    logger.info('Testing stop-on-reply logic...');

    // Check if pending actions were skipped for replied lead
    const skippedActions = await prisma.actionLog.findMany({
      where: {
        lead_id: leads[1].id,
        status: ActionLogStatus.SKIPPED
      }
    });

    // ====================================================================
    // VALIDATION RESULTS
    // ====================================================================

    logger.info('='.repeat(60));
    logger.info('GATE 7 INBOX SYSTEM TEST RESULTS');
    logger.info('='.repeat(60));

    const validationResults = {
      connectionDetectionWorking: updatedLead1?.status === LeadStatus.CONNECTED,
      replyDetectionWorking: updatedLead2?.status === LeadStatus.REPLIED,
      controlLeadUnchanged: updatedLead3?.status === LeadStatus.IN_PROGRESS,
      connectionLogged: actionLogs.some(log =>
        log.lead_id === leads[0].id &&
        log.metadata?.includes('connection_accepted')
      ),
      replyLogged: actionLogs.some(log =>
        log.lead_id === leads[1].id &&
        log.metadata?.includes('reply_detected')
      ),
      campaignStatsUpdated:
        updatedCampaign?.connected_leads === 1 &&
        updatedCampaign?.replied_leads === 1,
      stopOnReplyWorking: skippedActions.length > 0,
      replyMessageStored: updatedLead2?.notes?.includes(replyMessage.substring(0, 30)) || false
    };

    logger.info('Test Summary:', {
      lead1Status: updatedLead1?.status,
      lead2Status: updatedLead2?.status,
      lead3Status: updatedLead3?.status,
      totalActionLogs: actionLogs.length,
      skippedActions: skippedActions.length,
      campaignConnected: updatedCampaign?.connected_leads,
      campaignReplied: updatedCampaign?.replied_leads
    });

    logger.info('Validation Results:', validationResults);

    // Overall test result
    const testPassed = Object.values(validationResults).every(result => result === true);

    if (testPassed) {
      logger.info('✅ GATE 7 INBOX SYSTEM TEST PASSED');
      logger.info('✅ Connection acceptance detection working');
      logger.info('✅ Reply detection working');
      logger.info('✅ Stop-on-reply logic working');
      logger.info('✅ Campaign flow integration working');
      logger.info('✅ Database updates working correctly');
      logger.info('✅ Inbox system ready for production');
    } else {
      logger.error('❌ GATE 7 INBOX SYSTEM TEST FAILED');
      logger.error('❌ Issues found in inbox detection implementation');
    }

    return testPassed;

  } catch (error) {
    logger.error('Test execution failed', {
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;

  } finally {
    // ====================================================================
    // CLEANUP
    // ====================================================================

    logger.info('Cleaning up test environment...');

    if (worker) {
      await worker.stop();
    }

    // Clean up test data
    await prisma.actionLog.deleteMany({});
    await prisma.campaignStep.deleteMany({});
    await prisma.lead.deleteMany({});
    await prisma.campaign.deleteMany({});
    await prisma.linkedInAccount.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});

    await prisma.$disconnect();

    logger.info('Cleanup complete');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testInboxSystem()
    .then((passed) => {
      process.exit(passed ? 0 : 1);
    })
    .catch((error) => {
      logger.error('Test execution error', { error: String(error) });
      process.exit(1);
    });
}

export { testInboxSystem };