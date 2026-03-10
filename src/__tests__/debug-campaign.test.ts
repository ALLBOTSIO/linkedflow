/**
 * Debug campaign step creation
 */

import request from 'supertest'
import app from '../server'
import prisma from '../db/client'
import { ActionType, StepCondition, CampaignStatus, LeadStatus, LeadSource } from '../types/enums'

describe('Debug Campaign Step Creation', () => {
  let organizationId: string
  let userId: string
  let campaignId: string

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
  })

  afterAll(async () => {
    await prisma.campaignStep.deleteMany()
    await prisma.campaign.deleteMany()
    await prisma.linkedInAccount.deleteMany()
    await prisma.user.deleteMany()
    await prisma.organization.deleteMany()
    await prisma.$disconnect()
  })

  it('should create a campaign', async () => {
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
    campaignId = response.body.data.id
  })

  it('should create a single step', async () => {
    const stepData = {
      step_order: 1,
      action_type: ActionType.VIEW_PROFILE,
      delay_minutes: 60,
      condition: StepCondition.ALWAYS
    }

    const response = await request(app)
      .post(`/api/campaigns/${campaignId}/steps`)
      .send(stepData)

    console.log('Response status:', response.status)
    console.log('Response body:', JSON.stringify(response.body, null, 2))

    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
  })
})