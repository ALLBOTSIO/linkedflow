/**
 * Copyright (c) 2026 LinkedFlow Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

import { PrismaClient } from '@prisma/client'
import { Campaign, CampaignStats } from '../../types/interfaces'
import { CampaignStatus, LeadStatus } from '../../types/enums'
import { LinkedFlowError, CampaignNotFoundError, DatabaseError } from '../../types/errors'
import { pino } from 'pino'

const logger = pino({ name: 'CampaignRepository' })

export class CampaignRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new campaign
   */
  async create(campaignData: {
    name: string
    description?: string
    status?: CampaignStatus
    organization_id: string
    created_by: string
  }): Promise<Campaign> {
    try {
      const campaign = await this.prisma.campaign.create({
        data: {
          name: campaignData.name,
          description: campaignData.description,
          status: campaignData.status || CampaignStatus.DRAFT,
          organization_id: campaignData.organization_id,
          created_by: campaignData.created_by,
          total_leads: 0,
          completed_leads: 0,
          active_leads: 0,
          replied_leads: 0,
          connected_leads: 0
        },
        include: {
          organization: true,
          created_by_user: true,
          steps: {
            orderBy: { step_order: 'asc' }
          },
          leads: {
            take: 10
          }
        }
      })

      logger.info(`Created campaign ${campaign.id}: ${campaign.name}`)
      return this.transformToInterface(campaign)
    } catch (error) {
      throw new DatabaseError('create campaign', error as Error)
    }
  }

  /**
   * Find campaign by ID with relations
   */
  async findById(id: string, includeSteps: boolean = true, includeLeads: boolean = false): Promise<Campaign | null> {
    try {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id },
        include: {
          organization: true,
          created_by_user: true,
          steps: includeSteps ? {
            orderBy: { step_order: 'asc' }
          } : false,
          leads: includeLeads ? {
            take: 100
          } : false
        }
      })

      if (!campaign) {
        return null
      }

      return this.transformToInterface(campaign)
    } catch (error) {
      throw new DatabaseError('find campaign by ID', error as Error)
    }
  }

  /**
   * Find multiple campaigns with pagination and filters
   */
  async findMany(options: {
    page?: number
    limit?: number
    status?: CampaignStatus
    organization_id?: string
    created_by?: string
    search?: string
  } = {}): Promise<{
    campaigns: Campaign[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    try {
      const page = options.page || 1
      const limit = Math.min(options.limit || 20, 100)
      const skip = (page - 1) * limit

      const where: any = {}

      if (options.organization_id) {
        where.organization_id = options.organization_id
      }

      if (options.status) {
        where.status = options.status
      }

      if (options.created_by) {
        where.created_by = options.created_by
      }

      if (options.search) {
        const searchTerm = `%${options.search}%`
        where.OR = [
          { name: { contains: searchTerm } },
          { description: { contains: searchTerm } }
        ]
      }

      const [campaigns, total] = await Promise.all([
        this.prisma.campaign.findMany({
          where,
          include: {
            organization: true,
            created_by_user: true,
            steps: {
              orderBy: { step_order: 'asc' },
              take: 5 // Just first few steps for list view
            },
            _count: {
              select: {
                leads: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { created_at: 'desc' }
        }),
        this.prisma.campaign.count({ where })
      ])

      return {
        campaigns: campaigns.map(campaign => this.transformToInterface(campaign)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    } catch (error) {
      throw new DatabaseError('find many campaigns', error as Error)
    }
  }

  /**
   * Find campaigns by organization
   */
  async findByOrganization(organizationId: string, includeSteps: boolean = false): Promise<Campaign[]> {
    try {
      const campaigns = await this.prisma.campaign.findMany({
        where: { organization_id: organizationId },
        include: {
          organization: true,
          created_by_user: true,
          steps: includeSteps ? {
            orderBy: { step_order: 'asc' }
          } : false,
          _count: {
            select: {
              leads: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      })

      return campaigns.map(campaign => this.transformToInterface(campaign))
    } catch (error) {
      throw new DatabaseError('find campaigns by organization', error as Error)
    }
  }

  /**
   * Update a campaign
   */
  async update(id: string, updateData: Partial<{
    name: string
    description: string
    status: CampaignStatus
  }>): Promise<Campaign> {
    try {
      const existingCampaign = await this.prisma.campaign.findUnique({ where: { id } })
      if (!existingCampaign) {
        throw new CampaignNotFoundError(id)
      }

      const campaign = await this.prisma.campaign.update({
        where: { id },
        data: updateData,
        include: {
          organization: true,
          created_by_user: true,
          steps: {
            orderBy: { step_order: 'asc' }
          }
        }
      })

      logger.info(`Updated campaign ${id}`)
      return this.transformToInterface(campaign)
    } catch (error) {
      if (error instanceof CampaignNotFoundError) {
        throw error
      }
      throw new DatabaseError('update campaign', error as Error)
    }
  }

  /**
   * Delete a campaign
   */
  async delete(id: string): Promise<void> {
    try {
      const existingCampaign = await this.prisma.campaign.findUnique({ where: { id } })
      if (!existingCampaign) {
        throw new CampaignNotFoundError(id)
      }

      await this.prisma.campaign.delete({ where: { id } })
      logger.info(`Deleted campaign ${id}`)
    } catch (error) {
      if (error instanceof CampaignNotFoundError) {
        throw error
      }
      throw new DatabaseError('delete campaign', error as Error)
    }
  }

  /**
   * Enroll leads in campaign (batch operation)
   */
  async enrollLeads(campaignId: string, leadIds: string[]): Promise<{
    successCount: number
    errorCount: number
    alreadyEnrolledCount: number
  }> {
    try {
      const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } })
      if (!campaign) {
        throw new CampaignNotFoundError(campaignId)
      }

      let successCount = 0
      let errorCount = 0
      let alreadyEnrolledCount = 0

      // Process leads in batches
      for (const leadId of leadIds) {
        try {
          const lead = await this.prisma.lead.findUnique({ where: { id: leadId } })
          if (!lead) {
            errorCount++
            continue
          }

          if (lead.campaign_id) {
            alreadyEnrolledCount++
            continue
          }

          await this.prisma.lead.update({
            where: { id: leadId },
            data: {
              campaign_id: campaignId,
              status: LeadStatus.ENROLLED
            }
          })

          successCount++
        } catch (error) {
          errorCount++
          logger.error(`Failed to enroll lead ${leadId} in campaign ${campaignId}:`, error)
        }
      }

      // Update campaign lead counts
      await this.updateLeadCounts(campaignId)

      logger.info(`Enrolled leads in campaign ${campaignId}: ${successCount} success, ${errorCount} errors, ${alreadyEnrolledCount} already enrolled`)
      return { successCount, errorCount, alreadyEnrolledCount }
    } catch (error) {
      if (error instanceof CampaignNotFoundError) {
        throw error
      }
      throw new DatabaseError('enroll leads in campaign', error as Error)
    }
  }

  /**
   * Update lead counts for campaign statistics
   */
  async updateLeadCounts(campaignId: string): Promise<void> {
    try {
      const counts = await this.prisma.lead.groupBy({
        by: ['status'],
        where: { campaign_id: campaignId },
        _count: { status: true }
      })

      const stats = counts.reduce((acc, item) => {
        acc[item.status] = item._count.status
        return acc
      }, {} as Record<string, number>)

      const totalLeads = Object.values(stats).reduce((sum, count) => sum + count, 0)
      const activeLeads = (stats[LeadStatus.ENROLLED] || 0) + (stats[LeadStatus.IN_PROGRESS] || 0)
      const completedLeads = stats[LeadStatus.COMPLETED] || 0
      const repliedLeads = stats[LeadStatus.REPLIED] || 0
      const connectedLeads = stats[LeadStatus.CONNECTED] || 0

      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: {
          total_leads: totalLeads,
          active_leads: activeLeads,
          completed_leads: completedLeads,
          replied_leads: repliedLeads,
          connected_leads: connectedLeads
        }
      })
    } catch (error) {
      throw new DatabaseError('update campaign lead counts', error as Error)
    }
  }

  /**
   * Get detailed campaign statistics
   */
  async getCampaignStats(campaignId: string): Promise<CampaignStats> {
    try {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          _count: {
            select: {
              leads: true
            }
          }
        }
      })

      if (!campaign) {
        throw new CampaignNotFoundError(campaignId)
      }

      // Get lead status breakdown
      const leadStats = await this.prisma.lead.groupBy({
        by: ['status'],
        where: { campaign_id: campaignId },
        _count: { status: true }
      })

      const stats = leadStats.reduce((acc, item) => {
        acc[item.status] = item._count.status
        return acc
      }, {} as Record<string, number>)

      // Get action counts
      const actionCounts = await this.prisma.actionLog.groupBy({
        by: ['status'],
        where: {
          lead: {
            campaign_id: campaignId
          }
        },
        _count: { status: true }
      })

      const actions = actionCounts.reduce((acc, item) => {
        acc[item.status] = item._count.status
        return acc
      }, {} as Record<string, number>)

      const totalLeads = campaign.total_leads
      const enrolledLeads = (stats[LeadStatus.ENROLLED] || 0) + (stats[LeadStatus.IN_PROGRESS] || 0)
      const activeLeads = stats[LeadStatus.IN_PROGRESS] || 0
      const completedLeads = stats[LeadStatus.COMPLETED] || 0
      const repliedLeads = stats[LeadStatus.REPLIED] || 0
      const connectedLeads = stats[LeadStatus.CONNECTED] || 0

      const actionsExecuted = (actions['completed'] || 0) + (actions['failed'] || 0)
      const actionsPending = actions['scheduled'] || 0

      // Calculate rates (avoid division by zero)
      const conversionRate = totalLeads > 0 ? (completedLeads / totalLeads) * 100 : 0
      const replyRate = totalLeads > 0 ? (repliedLeads / totalLeads) * 100 : 0
      const connectionRate = totalLeads > 0 ? (connectedLeads / totalLeads) * 100 : 0

      return {
        campaign_id: campaignId,
        total_leads: totalLeads,
        enrolled_leads: enrolledLeads,
        active_leads: activeLeads,
        completed_leads: completedLeads,
        replied_leads: repliedLeads,
        connected_leads: connectedLeads,
        actions_executed: actionsExecuted,
        actions_pending: actionsPending,
        conversion_rate: parseFloat(conversionRate.toFixed(2)),
        reply_rate: parseFloat(replyRate.toFixed(2)),
        connection_rate: parseFloat(connectionRate.toFixed(2)),
        created_at: campaign.created_at,
        updated_at: campaign.updated_at
      }
    } catch (error) {
      if (error instanceof CampaignNotFoundError) {
        throw error
      }
      throw new DatabaseError('get campaign statistics', error as Error)
    }
  }

  /**
   * Transform Prisma campaign to interface
   */
  private transformToInterface(campaign: any): Campaign {
    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      status: campaign.status as CampaignStatus,
      organization_id: campaign.organization_id,
      created_by: campaign.created_by,
      total_leads: campaign.total_leads,
      completed_leads: campaign.completed_leads,
      active_leads: campaign.active_leads,
      replied_leads: campaign.replied_leads,
      connected_leads: campaign.connected_leads,
      created_at: campaign.created_at,
      updated_at: campaign.updated_at,
      organization: campaign.organization,
      created_by_user: campaign.created_by_user,
      steps: campaign.steps || [],
      leads: campaign.leads || []
    }
  }
}