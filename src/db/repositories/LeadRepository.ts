/**
 * Copyright (c) 2026 LinkedFlow Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

import { PrismaClient, Lead as PrismaLead } from '@prisma/client'
import { Lead } from '../../types/interfaces'
import { LeadStatus, LeadSource } from '../../types/enums'
import { LinkedFlowError, LeadNotFoundError, DuplicateLeadError, DatabaseError } from '../../types/errors'
import { pino } from 'pino'

const logger = pino({ name: 'LeadRepository' })

export class LeadRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new lead
   */
  async create(leadData: {
    first_name: string
    last_name: string
    linkedin_url: string
    email?: string
    company?: string
    title?: string
    location?: string
    status?: LeadStatus
    source?: LeadSource
    campaign_id?: string
    assigned_account_id?: string
    notes?: string
    tags?: string[]
    custom_fields?: Record<string, any>
  }): Promise<Lead> {
    try {
      // Check for duplicate LinkedIn URL
      const existingLead = await this.findByLinkedInUrl(leadData.linkedin_url)
      if (existingLead) {
        throw new DuplicateLeadError(leadData.linkedin_url, existingLead.id)
      }

      const lead = await this.prisma.lead.create({
        data: {
          first_name: leadData.first_name,
          last_name: leadData.last_name,
          linkedin_url: leadData.linkedin_url,
          email: leadData.email,
          company: leadData.company,
          title: leadData.title,
          location: leadData.location,
          status: leadData.status || LeadStatus.IMPORTED,
          source: leadData.source || LeadSource.MANUAL_ENTRY,
          campaign_id: leadData.campaign_id,
          assigned_account_id: leadData.assigned_account_id,
          notes: leadData.notes,
          tags: leadData.tags ? JSON.stringify(leadData.tags) : null,
          custom_fields: leadData.custom_fields ? JSON.stringify(leadData.custom_fields) : null
        },
        include: {
          campaign: true,
          assigned_account: true
        }
      })

      logger.info(`Created lead ${lead.id} for ${lead.linkedin_url}`)
      return this.transformToInterface(lead)
    } catch (error) {
      if (error instanceof DuplicateLeadError) {
        throw error
      }
      throw new DatabaseError('create lead', error as Error)
    }
  }

  /**
   * Find lead by ID with relations
   */
  async findById(id: string): Promise<Lead | null> {
    try {
      const lead = await this.prisma.lead.findUnique({
        where: { id },
        include: {
          campaign: true,
          assigned_account: true
        }
      })

      if (!lead) {
        return null
      }

      return this.transformToInterface(lead)
    } catch (error) {
      throw new DatabaseError('find lead by ID', error as Error)
    }
  }

  /**
   * Find lead by LinkedIn URL
   */
  async findByLinkedInUrl(linkedinUrl: string): Promise<Lead | null> {
    try {
      const lead = await this.prisma.lead.findUnique({
        where: { linkedin_url: linkedinUrl },
        include: {
          campaign: true,
          assigned_account: true
        }
      })

      if (!lead) {
        return null
      }

      return this.transformToInterface(lead)
    } catch (error) {
      throw new DatabaseError('find lead by LinkedIn URL', error as Error)
    }
  }

  /**
   * Find multiple leads with pagination and filters
   */
  async findMany(options: {
    page?: number
    limit?: number
    status?: LeadStatus
    source?: LeadSource
    campaign_id?: string
    assigned_account_id?: string
    search?: string
  } = {}): Promise<{
    leads: Lead[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    try {
      const page = options.page || 1
      const limit = Math.min(options.limit || 50, 100) // Cap at 100
      const skip = (page - 1) * limit

      const where: any = {}

      if (options.status) {
        where.status = options.status
      }

      if (options.source) {
        where.source = options.source
      }

      if (options.campaign_id) {
        where.campaign_id = options.campaign_id
      }

      if (options.assigned_account_id) {
        where.assigned_account_id = options.assigned_account_id
      }

      if (options.search) {
        const searchTerm = `%${options.search}%`
        where.OR = [
          { first_name: { contains: searchTerm } },
          { last_name: { contains: searchTerm } },
          { email: { contains: searchTerm } },
          { company: { contains: searchTerm } },
          { title: { contains: searchTerm } },
          { linkedin_url: { contains: searchTerm } }
        ]
      }

      const [leads, total] = await Promise.all([
        this.prisma.lead.findMany({
          where,
          include: {
            campaign: true,
            assigned_account: true
          },
          skip,
          take: limit,
          orderBy: { created_at: 'desc' }
        }),
        this.prisma.lead.count({ where })
      ])

      return {
        leads: leads.map(lead => this.transformToInterface(lead)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    } catch (error) {
      throw new DatabaseError('find many leads', error as Error)
    }
  }

  /**
   * Update a lead
   */
  async update(id: string, updateData: Partial<{
    first_name: string
    last_name: string
    email: string
    company: string
    title: string
    location: string
    status: LeadStatus
    campaign_id: string
    assigned_account_id: string
    notes: string
    tags: string[]
    custom_fields: Record<string, any>
  }>): Promise<Lead> {
    try {
      const existingLead = await this.prisma.lead.findUnique({ where: { id } })
      if (!existingLead) {
        throw new LeadNotFoundError(id)
      }

      const updatePayload: any = { ...updateData }

      // Handle JSON fields
      if (updateData.tags !== undefined) {
        updatePayload.tags = updateData.tags ? JSON.stringify(updateData.tags) : null
      }

      if (updateData.custom_fields !== undefined) {
        updatePayload.custom_fields = updateData.custom_fields
          ? JSON.stringify(updateData.custom_fields)
          : null
      }

      const lead = await this.prisma.lead.update({
        where: { id },
        data: updatePayload,
        include: {
          campaign: true,
          assigned_account: true
        }
      })

      logger.info(`Updated lead ${id}`)
      return this.transformToInterface(lead)
    } catch (error) {
      if (error instanceof LeadNotFoundError) {
        throw error
      }
      throw new DatabaseError('update lead', error as Error)
    }
  }

  /**
   * Delete a lead
   */
  async delete(id: string): Promise<void> {
    try {
      const existingLead = await this.prisma.lead.findUnique({ where: { id } })
      if (!existingLead) {
        throw new LeadNotFoundError(id)
      }

      await this.prisma.lead.delete({ where: { id } })
      logger.info(`Deleted lead ${id}`)
    } catch (error) {
      if (error instanceof LeadNotFoundError) {
        throw error
      }
      throw new DatabaseError('delete lead', error as Error)
    }
  }

  /**
   * Bulk insert leads for CSV imports
   */
  async bulkInsert(leadsData: Array<{
    first_name: string
    last_name: string
    linkedin_url: string
    email?: string
    company?: string
    title?: string
    location?: string
    notes?: string
    tags?: string[]
    custom_fields?: Record<string, any>
    source?: LeadSource
    status?: LeadStatus
  }>): Promise<{
    createdCount: number
    duplicateCount: number
    duplicateUrls: string[]
  }> {
    try {
      let createdCount = 0
      let duplicateCount = 0
      const duplicateUrls: string[] = []

      // Process in batches to avoid memory issues
      const batchSize = 50
      for (let i = 0; i < leadsData.length; i += batchSize) {
        const batch = leadsData.slice(i, i + batchSize)

        for (const leadData of batch) {
          try {
            await this.create({
              ...leadData,
              source: leadData.source || LeadSource.CSV_IMPORT,
              status: leadData.status || LeadStatus.IMPORTED
            })
            createdCount++
          } catch (error) {
            if (error instanceof DuplicateLeadError) {
              duplicateCount++
              duplicateUrls.push(leadData.linkedin_url)
            } else {
              throw error
            }
          }
        }
      }

      logger.info(`Bulk insert completed: ${createdCount} created, ${duplicateCount} duplicates`)
      return { createdCount, duplicateCount, duplicateUrls }
    } catch (error) {
      throw new DatabaseError('bulk insert leads', error as Error)
    }
  }

  /**
   * Get leads by campaign ID
   */
  async findByCampaignId(campaignId: string, limit: number = 100): Promise<Lead[]> {
    try {
      const leads = await this.prisma.lead.findMany({
        where: { campaign_id: campaignId },
        include: {
          campaign: true,
          assigned_account: true
        },
        take: limit,
        orderBy: { created_at: 'desc' }
      })

      return leads.map(lead => this.transformToInterface(lead))
    } catch (error) {
      throw new DatabaseError('find leads by campaign', error as Error)
    }
  }

  /**
   * Get leads by account ID
   */
  async findByAccountId(accountId: string, limit: number = 100): Promise<Lead[]> {
    try {
      const leads = await this.prisma.lead.findMany({
        where: { assigned_account_id: accountId },
        include: {
          campaign: true,
          assigned_account: true
        },
        take: limit,
        orderBy: { created_at: 'desc' }
      })

      return leads.map(lead => this.transformToInterface(lead))
    } catch (error) {
      throw new DatabaseError('find leads by account', error as Error)
    }
  }

  /**
   * Transform Prisma lead to interface
   */
  private transformToInterface(lead: any): Lead {
    return {
      id: lead.id,
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      linkedin_url: lead.linkedin_url,
      company: lead.company,
      title: lead.title,
      location: lead.location,
      status: lead.status as LeadStatus,
      source: lead.source as LeadSource,
      campaign_id: lead.campaign_id,
      assigned_account_id: lead.assigned_account_id,
      notes: lead.notes,
      tags: lead.tags ? JSON.parse(lead.tags) : [],
      custom_fields: lead.custom_fields ? JSON.parse(lead.custom_fields) : undefined,
      created_at: lead.created_at,
      updated_at: lead.updated_at,
      campaign: lead.campaign,
      assigned_account: lead.assigned_account
    }
  }
}