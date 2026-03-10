/**
 * Copyright (c) 2026 LinkedFlow Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

import request from 'supertest'
import app from '../server'
import prisma from '../db/client'
import { ActionType, StepCondition, CampaignStatus, LeadStatus, LeadSource } from '../types/enums'

describe('Campaign System Integration Tests', () => {
  let organizationId: string
  let userId: string
  let campaignId: string
  let leadId: string

  beforeAll(async () => {
    // Create test organization and user
    const organization = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        domain: 'test.linkedflow.com'
      }
    })
    organizationId = organization.id

    const user = await prisma.user.create({
      data: {
        email: 'test@linkedflow.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        role: 'admin',
        organization_id: organizationId
      }
    })
    userId = user.id

    // Create test LinkedIn account
    const linkedinAccount = await prisma.linkedInAccount.create({
      data: {
        email: 'test.account@linkedin.com',
        encrypted_cookies: 'encrypted_test_cookies',
        proxy_ip: '192.168.1.1',
        account_type: 'free',
        status: 'active',
        organization_id: organizationId
      }
    })

    // Create test lead and assign LinkedIn account
    const lead = await prisma.lead.create({
      data: {
        first_name: 'John',
        last_name: 'Doe',
        linkedin_url: 'https://linkedin.com/in/johndoe',
        email: 'john@example.com',
        company: 'Test Company',
        title: 'CEO',
        status: LeadStatus.IMPORTED,
        source: LeadSource.MANUAL_ENTRY,
        assigned_account_id: linkedinAccount.id
      }
    })
    leadId = lead.id
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.actionLog.deleteMany()
    await prisma.campaignStep.deleteMany()
    await prisma.lead.deleteMany()
    await prisma.campaign.deleteMany()
    await prisma.linkedInAccount.deleteMany()
    await prisma.user.deleteMany()
    await prisma.organization.deleteMany()
    await prisma.$disconnect()
  })

  describe('Campaign Creation and Management', () => {
    it('should create a new campaign successfully', async () => {
      const campaignData = {
        name: 'Test Campaign',
        description: 'A test campaign for LinkedIn outreach',
        organization_id: organizationId,
        created_by: userId
      }

      const response = await request(app)
        .post('/api/campaigns')
        .send(campaignData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toMatchObject({
        name: 'Test Campaign',
        description: 'A test campaign for LinkedIn outreach',
        status: CampaignStatus.DRAFT,
        organization_id: organizationId,
        created_by: userId,
        total_leads: 0,
        completed_leads: 0,
        active_leads: 0,
        replied_leads: 0,
        connected_leads: 0
      })
      expect(response.body.data.id).toBeDefined()

      campaignId = response.body.data.id
    })

    it('should get campaigns with pagination', async () => {
      const response = await request(app)
        .get('/api/campaigns?page=1&limit=10')
        .set('x-organization-id', organizationId)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.meta).toMatchObject({
        page: 1,
        limit: 10,
        hasNext: false,
        hasPrev: false
      })
      expect(response.body.data.length).toBe(1)
      expect(response.body.data[0].name).toBe('Test Campaign')
    })

    it('should get campaign by ID', async () => {
      const response = await request(app)
        .get(`/api/campaigns/${campaignId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(campaignId)
      expect(response.body.data.steps).toEqual([])
      expect(response.body.data.stats).toBeDefined()
    })
  })

  describe('Campaign Steps Management', () => {
    it('should create a 4-step campaign sequence', async () => {
      const steps = [
        {
          step_order: 1,
          action_type: ActionType.VIEW_PROFILE,
          delay_minutes: 60, // 1 hour
          condition: StepCondition.ALWAYS
        },
        {
          step_order: 2,
          action_type: ActionType.SEND_CONNECTION,
          delay_minutes: 1440, // 24 hours
          condition: StepCondition.IF_NOT_CONNECTED
        },
        {
          step_order: 3,
          action_type: ActionType.SEND_MESSAGE,
          delay_minutes: 2880, // 48 hours
          message_template: 'Hi {{first_name}}, I saw your profile and would love to connect!',
          condition: StepCondition.IF_CONNECTED
        },
        {
          step_order: 4,
          action_type: ActionType.FOLLOW_USER,
          delay_minutes: 4320, // 72 hours
          condition: StepCondition.IF_NOT_REPLIED
        }
      ]

      const response = await request(app)
        .post(`/api/campaigns/${campaignId}/steps/bulk`)
        .send({ steps })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(4)

      // Verify each step was created correctly
      const createdSteps = response.body.data
      expect(createdSteps[0]).toMatchObject({
        step_order: 1,
        action_type: ActionType.VIEW_PROFILE,
        delay_minutes: 60,
        condition: StepCondition.ALWAYS
      })

      expect(createdSteps[1]).toMatchObject({
        step_order: 2,
        action_type: ActionType.SEND_CONNECTION,
        delay_minutes: 1440,
        condition: StepCondition.IF_NOT_CONNECTED
      })

      expect(createdSteps[2]).toMatchObject({
        step_order: 3,
        action_type: ActionType.SEND_MESSAGE,
        delay_minutes: 2880,
        message_template: 'Hi {{first_name}}, I saw your profile and would love to connect!',
        condition: StepCondition.IF_CONNECTED
      })

      expect(createdSteps[3]).toMatchObject({
        step_order: 4,
        action_type: ActionType.FOLLOW_USER,
        delay_minutes: 4320,
        condition: StepCondition.IF_NOT_REPLIED
      })
    })

    it('should retrieve campaign with correct step order and conditions', async () => {
      const response = await request(app)
        .get(`/api/campaigns/${campaignId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      const campaign = response.body.data
      expect(campaign.steps).toHaveLength(4)

      // Verify steps are in correct order
      expect(campaign.steps[0].step_order).toBe(1)
      expect(campaign.steps[1].step_order).toBe(2)
      expect(campaign.steps[2].step_order).toBe(3)
      expect(campaign.steps[3].step_order).toBe(4)

      // Verify conditions
      expect(campaign.steps[0].condition).toBe(StepCondition.ALWAYS)
      expect(campaign.steps[1].condition).toBe(StepCondition.IF_NOT_CONNECTED)
      expect(campaign.steps[2].condition).toBe(StepCondition.IF_CONNECTED)
      expect(campaign.steps[3].condition).toBe(StepCondition.IF_NOT_REPLIED)
    })

    it('should update individual steps', async () => {
      // Get first step
      const campaign = await request(app)
        .get(`/api/campaigns/${campaignId}`)
        .expect(200)

      const firstStepId = campaign.body.data.steps[0].id

      const updateData = {
        delay_minutes: 120, // Change to 2 hours
        message_template: 'Updated template'
      }

      const response = await request(app)
        .put(`/api/campaigns/${campaignId}/steps/${firstStepId}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.delay_minutes).toBe(120)
    })
  })

  describe('Campaign Lead Enrollment', () => {
    it('should activate campaign before enrollment', async () => {
      const response = await request(app)
        .put(`/api/campaigns/${campaignId}`)
        .send({ status: CampaignStatus.ACTIVE })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe(CampaignStatus.ACTIVE)
    })

    it('should enroll a test lead in the campaign', async () => {
      const response = await request(app)
        .post(`/api/campaigns/${campaignId}/enroll`)
        .send({ lead_ids: [leadId] })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.successCount).toBe(1)
      expect(response.body.data.errorCount).toBe(0)
      expect(response.body.data.alreadyEnrolledCount).toBe(0)

      // Verify lead was enrolled
      const lead = await prisma.lead.findUnique({ where: { id: leadId } })
      expect(lead?.campaign_id).toBe(campaignId)
      expect(lead?.status).toBe(LeadStatus.ENROLLED)
    })

    it('should verify first action was scheduled', async () => {
      // Check that first action was created
      const actions = await prisma.actionLog.findMany({
        where: { lead_id: leadId },
        orderBy: { created_at: 'asc' }
      })

      expect(actions).toHaveLength(1)
      expect(actions[0].action_type).toBe(ActionType.VIEW_PROFILE)
      expect(actions[0].status).toBe('scheduled')
      expect(actions[0].scheduled_at).toBeInstanceOf(Date)

      // Verify scheduling delay (should be ~1 hour from now)
      const scheduledTime = actions[0].scheduled_at.getTime()
      const currentTime = Date.now()
      const delayMinutes = (scheduledTime - currentTime) / (1000 * 60)
      expect(delayMinutes).toBeGreaterThan(55) // Allow some variance
      expect(delayMinutes).toBeLessThan(65)
    })

    it('should prevent duplicate enrollment', async () => {
      const response = await request(app)
        .post(`/api/campaigns/${campaignId}/enroll`)
        .send({ lead_ids: [leadId] })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.successCount).toBe(0)
      expect(response.body.data.alreadyEnrolledCount).toBe(1)
    })
  })

  describe('Campaign Pause and Resume', () => {
    it('should pause campaign successfully', async () => {
      const response = await request(app)
        .post(`/api/campaigns/${campaignId}/pause`)
        .expect(200)

      expect(response.body.success).toBe(true)

      // Verify campaign status changed
      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } })
      expect(campaign?.status).toBe(CampaignStatus.PAUSED)

      // Verify scheduled actions were cancelled
      const actions = await prisma.actionLog.findMany({
        where: {
          lead_id: leadId,
          status: 'scheduled'
        }
      })
      expect(actions).toHaveLength(0)

      // Verify lead status changed to paused
      const lead = await prisma.lead.findUnique({ where: { id: leadId } })
      expect(lead?.status).toBe(LeadStatus.PAUSED)
    })

    it('should resume campaign successfully', async () => {
      const response = await request(app)
        .post(`/api/campaigns/${campaignId}/resume`)
        .expect(200)

      expect(response.body.success).toBe(true)

      // Verify campaign status changed
      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } })
      expect(campaign?.status).toBe(CampaignStatus.ACTIVE)

      // Verify lead status changed back to in_progress
      const lead = await prisma.lead.findUnique({ where: { id: leadId } })
      expect(lead?.status).toBe(LeadStatus.IN_PROGRESS)
    })
  })

  describe('Campaign Statistics', () => {
    it('should return accurate campaign statistics', async () => {
      const response = await request(app)
        .get(`/api/campaigns/${campaignId}/stats`)
        .expect(200)

      expect(response.body.success).toBe(true)
      const stats = response.body.data

      expect(stats).toMatchObject({
        campaign_id: campaignId,
        total_leads: 1,
        enrolled_leads: 1,
        active_leads: 1,
        completed_leads: 0,
        replied_leads: 0,
        connected_leads: 0
      })

      expect(stats.conversion_rate).toBe(0)
      expect(stats.reply_rate).toBe(0)
      expect(stats.connection_rate).toBe(0)
      expect(stats.actions_pending).toBeGreaterThan(0)
    })
  })

  describe('Step Reordering', () => {
    it('should reorder steps correctly', async () => {
      // Get current steps
      const campaign = await request(app)
        .get(`/api/campaigns/${campaignId}`)
        .expect(200)

      const steps = campaign.body.data.steps

      // Reorder: move step 4 to position 2
      const reorderData = {
        steps: [
          { id: steps[0].id, step_order: 1 },
          { id: steps[3].id, step_order: 2 }, // Move step 4 to position 2
          { id: steps[1].id, step_order: 3 }, // Move step 2 to position 3
          { id: steps[2].id, step_order: 4 }  // Move step 3 to position 4
        ]
      }

      const response = await request(app)
        .put(`/api/campaigns/${campaignId}/steps/reorder`)
        .send(reorderData)
        .expect(200)

      expect(response.body.success).toBe(true)
      const reorderedSteps = response.body.data

      // Verify new order
      expect(reorderedSteps[0].action_type).toBe(ActionType.VIEW_PROFILE) // Position 1
      expect(reorderedSteps[1].action_type).toBe(ActionType.FOLLOW_USER)  // Position 2 (was 4)
      expect(reorderedSteps[2].action_type).toBe(ActionType.SEND_CONNECTION) // Position 3 (was 2)
      expect(reorderedSteps[3].action_type).toBe(ActionType.SEND_MESSAGE) // Position 4 (was 3)
    })
  })

  describe('Input Validation', () => {
    it('should validate campaign creation data', async () => {
      const invalidData = {
        name: '', // Empty name should fail
        organization_id: organizationId,
        created_by: userId
      }

      const response = await request(app)
        .post('/api/campaigns')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should validate step sequence rules', async () => {
      // Try to create steps with gaps in order
      const invalidSteps = {
        steps: [
          {
            step_order: 1,
            action_type: ActionType.VIEW_PROFILE,
            delay_minutes: 60
          },
          {
            step_order: 3, // Gap - should fail
            action_type: ActionType.SEND_CONNECTION,
            delay_minutes: 1440
          }
        ]
      }

      const response = await request(app)
        .post(`/api/campaigns/${campaignId}/steps/bulk`)
        .send(invalidSteps)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should validate LinkedIn message length limits', async () => {
      const longMessage = 'x'.repeat(3001) // Exceed 3000 character limit

      const invalidStep = {
        step_order: 1,
        action_type: ActionType.SEND_MESSAGE,
        delay_minutes: 60,
        message_template: longMessage
      }

      const response = await request(app)
        .post(`/api/campaigns/${campaignId}/steps`)
        .send(invalidStep)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })
})