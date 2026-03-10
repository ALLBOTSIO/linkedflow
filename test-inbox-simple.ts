/**
 * Copyright (c) 2026 LinkedFlow Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

import { PrismaClient } from '@prisma/client';
import { InboxPoller } from './src/services/InboxPoller';
import { CookieVault } from './src/services/CookieVault';
import { ProxyManager } from './src/services/ProxyManager';
import { LeadStatus } from './src/types/enums';

/**
 * Simple test to verify InboxPoller compiles and basic methods work
 */
async function testInboxPollerBasic() {
  const prisma = new PrismaClient();

  try {
    console.log('Testing InboxPoller compilation and basic functionality...');

    // Initialize services
    const cookieVault = new CookieVault();
    const proxyManager = new ProxyManager();
    const inboxPoller = new InboxPoller(prisma, cookieVault, proxyManager);

    console.log('✅ InboxPoller initialized successfully');

    // Create test data
    const organization = await prisma.organization.create({
      data: {
        name: 'Test Org',
        domain: 'test.com'
      }
    });

    const user = await prisma.user.create({
      data: {
        email: 'test@test.com',
        password_hash: 'hash',
        first_name: 'Test',
        last_name: 'User',
        role: 'admin',
        organization_id: organization.id
      }
    });

    const account = await prisma.linkedInAccount.create({
      data: {
        email: 'test@linkedin.com',
        encrypted_cookies: 'encrypted_cookies',
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

    const campaign = await prisma.campaign.create({
      data: {
        name: 'Test Campaign',
        status: 'active',
        organization_id: organization.id,
        created_by: user.id,
        total_leads: 0,
        completed_leads: 0,
        active_leads: 0,
        replied_leads: 0,
        connected_leads: 0
      }
    });

    const lead = await prisma.lead.create({
      data: {
        first_name: 'John',
        last_name: 'Test',
        linkedin_url: 'https://linkedin.com/in/john-test',
        status: 'in_progress',
        source: 'manual_entry',
        campaign_id: campaign.id,
        assigned_account_id: account.id
      }
    });

    console.log('✅ Test data created');

    // Test markAsConnected
    await inboxPoller.markAsConnected(lead.id);

    const updatedLead = await prisma.lead.findUnique({
      where: { id: lead.id }
    });

    if (updatedLead?.status === 'connected') {
      console.log('✅ markAsConnected works correctly');
    } else {
      console.log('❌ markAsConnected failed');
    }

    // Test markAsReplied
    await inboxPoller.markAsReplied(lead.id, 'Thanks for reaching out!');

    const repliedLead = await prisma.lead.findUnique({
      where: { id: lead.id }
    });

    if (repliedLead?.status === 'replied') {
      console.log('✅ markAsReplied works correctly');
    } else {
      console.log('❌ markAsReplied failed');
    }

    console.log('✅ Basic InboxPoller functionality test completed');

    // Cleanup
    await prisma.actionLog.deleteMany({});
    await prisma.lead.deleteMany({});
    await prisma.campaign.deleteMany({});
    await prisma.linkedInAccount.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;

  } finally {
    await prisma.$disconnect();
  }
}

// Run test
if (require.main === module) {
  testInboxPollerBasic()
    .then((passed) => {
      process.exit(passed ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test execution error:', error);
      process.exit(1);
    });
}

export { testInboxPollerBasic };