/**
 * Copyright (c) 2026 LinkedFlow Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { LeadService } from '../src/services/LeadService'
import { LeadStatus, LeadSource } from '../src/types/enums'

const prisma = new PrismaClient()

describe('Lead Service Basic Functionality', () => {
  let leadService: LeadService

  beforeEach(async () => {
    // Clean the database before each test
    await prisma.lead.deleteMany({})
    leadService = new LeadService(prisma)
  })

  it('should create a lead', async () => {
    const leadData = {
      first_name: 'Test',
      last_name: 'User',
      linkedin_url: 'https://linkedin.com/in/test-user',
      email: 'test@example.com',
      company: 'Test Corp'
    }

    const lead = await leadService.createLead(leadData)

    expect(lead).toMatchObject({
      first_name: 'Test',
      last_name: 'User',
      linkedin_url: 'https://linkedin.com/in/test-user',
      email: 'test@example.com',
      company: 'Test Corp',
      status: LeadStatus.IMPORTED,
      source: LeadSource.MANUAL_ENTRY
    })

    expect(lead.id).toBeDefined()
    expect(lead.created_at).toBeDefined()
  })

  it('should import leads from CSV', async () => {
    const csvData = `first_name,last_name,linkedin_url,email,company
John,Doe,https://linkedin.com/in/john-doe,john@example.com,TechCorp
Jane,Smith,https://linkedin.com/in/jane-smith,jane@example.com,DesignCo`

    const result = await leadService.importLeadsFromCSV(csvData)

    expect(result).toMatchObject({
      totalRows: 2,
      successCount: 2,
      errorCount: 0,
      duplicateCount: 0,
      errors: []
    })

    // Verify leads were created
    const leads = await leadService.getLeads()
    expect(leads.leads).toHaveLength(2)
  })

  it('should detect duplicate LinkedIn URLs', async () => {
    // Create first lead
    await leadService.createLead({
      first_name: 'First',
      last_name: 'User',
      linkedin_url: 'https://linkedin.com/in/duplicate-test'
    })

    // Try to create duplicate
    const csvData = `first_name,last_name,linkedin_url
Second,User,https://linkedin.com/in/duplicate-test`

    const result = await leadService.importLeadsFromCSV(csvData)

    expect(result).toMatchObject({
      totalRows: 1,
      successCount: 0,
      duplicateCount: 1,
      errorCount: 1
    })

    expect(result.errors[0]).toMatchObject({
      field: 'linkedin_url',
      message: 'Lead with this LinkedIn URL already exists'
    })
  })
})