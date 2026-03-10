/**
 * Copyright (c) 2026 LinkedFlow Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

import { PrismaClient } from '@prisma/client'
import { CampaignStep } from '../../types/interfaces'
import { ActionType, StepCondition } from '../../types/enums'
import { LinkedFlowError, CampaignNotFoundError, DatabaseError, InvalidInputError } from '../../types/errors'
import { pino } from 'pino'

const logger = pino({ name: 'CampaignStepRepository' })

export class CampaignStepRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new campaign step
   */
  async create(stepData: {
    campaign_id: string
    step_order: number
    action_type: ActionType
    delay_minutes: number
    message_template?: string
    condition?: StepCondition
    condition_value?: string
    is_active?: boolean
  }): Promise<CampaignStep> {
    try {
      // Verify campaign exists
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: stepData.campaign_id }
      })
      if (!campaign) {
        throw new CampaignNotFoundError(stepData.campaign_id)
      }

      // Check for duplicate step order
      const existingStep = await this.prisma.campaignStep.findUnique({
        where: {
          campaign_id_step_order: {
            campaign_id: stepData.campaign_id,
            step_order: stepData.step_order
          }
        }
      })

      if (existingStep) {
        throw new InvalidInputError(
          'step_order',
          stepData.step_order,
          [`Step order ${stepData.step_order} already exists for this campaign`]
        )
      }

      const step = await this.prisma.campaignStep.create({
        data: {
          campaign_id: stepData.campaign_id,
          step_order: stepData.step_order,
          action_type: stepData.action_type,
          delay_minutes: stepData.delay_minutes,
          message_template: stepData.message_template,
          condition: stepData.condition,
          condition_value: stepData.condition_value,
          is_active: stepData.is_active ?? true
        },
        include: {
          campaign: true
        }
      })

      logger.info(`Created step ${step.id} for campaign ${stepData.campaign_id} at order ${stepData.step_order}`)
      return this.transformToInterface(step)
    } catch (error) {
      if (error instanceof CampaignNotFoundError || error instanceof InvalidInputError) {
        throw error
      }
      throw new DatabaseError('create campaign step', error as Error)
    }
  }

  /**
   * Find step by ID
   */
  async findById(id: string): Promise<CampaignStep | null> {
    try {
      const step = await this.prisma.campaignStep.findUnique({
        where: { id },
        include: {
          campaign: true
        }
      })

      if (!step) {
        return null
      }

      return this.transformToInterface(step)
    } catch (error) {
      throw new DatabaseError('find step by ID', error as Error)
    }
  }

  /**
   * Find all steps for a campaign
   */
  async findByCampaign(campaignId: string, includeInactive: boolean = true): Promise<CampaignStep[]> {
    try {
      const where: any = { campaign_id: campaignId }

      if (!includeInactive) {
        where.is_active = true
      }

      const steps = await this.prisma.campaignStep.findMany({
        where,
        include: {
          campaign: true
        },
        orderBy: { step_order: 'asc' }
      })

      return steps.map(step => this.transformToInterface(step))
    } catch (error) {
      throw new DatabaseError('find steps by campaign', error as Error)
    }
  }

  /**
   * Update a campaign step
   */
  async update(id: string, updateData: Partial<{
    step_order: number
    action_type: ActionType
    delay_minutes: number
    message_template: string
    condition: StepCondition
    condition_value: string
    is_active: boolean
  }>): Promise<CampaignStep> {
    try {
      const existingStep = await this.prisma.campaignStep.findUnique({ where: { id } })
      if (!existingStep) {
        throw new InvalidInputError('step_id', id, ['Step not found'])
      }

      // If updating step_order, check for conflicts
      if (updateData.step_order && updateData.step_order !== existingStep.step_order) {
        const conflictingStep = await this.prisma.campaignStep.findUnique({
          where: {
            campaign_id_step_order: {
              campaign_id: existingStep.campaign_id,
              step_order: updateData.step_order
            }
          }
        })

        if (conflictingStep) {
          throw new InvalidInputError(
            'step_order',
            updateData.step_order,
            [`Step order ${updateData.step_order} already exists for this campaign`]
          )
        }
      }

      const step = await this.prisma.campaignStep.update({
        where: { id },
        data: updateData,
        include: {
          campaign: true
        }
      })

      logger.info(`Updated step ${id}`)
      return this.transformToInterface(step)
    } catch (error) {
      if (error instanceof InvalidInputError) {
        throw error
      }
      throw new DatabaseError('update campaign step', error as Error)
    }
  }

  /**
   * Delete a campaign step
   */
  async delete(id: string): Promise<void> {
    try {
      const existingStep = await this.prisma.campaignStep.findUnique({ where: { id } })
      if (!existingStep) {
        throw new InvalidInputError('step_id', id, ['Step not found'])
      }

      await this.prisma.campaignStep.delete({ where: { id } })
      logger.info(`Deleted step ${id}`)
    } catch (error) {
      if (error instanceof InvalidInputError) {
        throw error
      }
      throw new DatabaseError('delete campaign step', error as Error)
    }
  }

  /**
   * Reorder campaign steps - updates all step orders to ensure no gaps
   */
  async reorder(campaignId: string, stepOrderMap: Array<{ id: string; step_order: number }>): Promise<CampaignStep[]> {
    try {
      // Verify campaign exists
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId }
      })
      if (!campaign) {
        throw new CampaignNotFoundError(campaignId)
      }

      // Validate step orders start at 1 and have no gaps
      const orders = stepOrderMap.map(item => item.step_order).sort((a, b) => a - b)
      for (let i = 0; i < orders.length; i++) {
        if (orders[i] !== i + 1) {
          throw new InvalidInputError(
            'step_order',
            orders[i],
            ['Step orders must start at 1 and have no gaps']
          )
        }
      }

      // Verify all steps belong to the campaign
      const existingSteps = await this.prisma.campaignStep.findMany({
        where: {
          campaign_id: campaignId,
          id: { in: stepOrderMap.map(item => item.id) }
        }
      })

      if (existingSteps.length !== stepOrderMap.length) {
        throw new InvalidInputError(
          'step_ids',
          stepOrderMap.map(item => item.id),
          ['Some steps do not belong to this campaign']
        )
      }

      // Use a transaction to update all steps atomically
      await this.prisma.$transaction(async (prisma) => {
        // First, set all step orders to negative values to avoid unique constraint conflicts
        for (let i = 0; i < stepOrderMap.length; i++) {
          await prisma.campaignStep.update({
            where: { id: stepOrderMap[i].id },
            data: { step_order: -(i + 1) }
          })
        }

        // Then, set them to their final values
        for (const { id, step_order } of stepOrderMap) {
          await prisma.campaignStep.update({
            where: { id },
            data: { step_order }
          })
        }
      })

      // Return the updated steps in order
      const updatedSteps = await this.findByCampaign(campaignId)
      logger.info(`Reordered ${stepOrderMap.length} steps for campaign ${campaignId}`)

      return updatedSteps
    } catch (error) {
      if (error instanceof CampaignNotFoundError || error instanceof InvalidInputError) {
        throw error
      }
      throw new DatabaseError('reorder campaign steps', error as Error)
    }
  }

  /**
   * Bulk create steps for campaign builder
   */
  async bulkCreate(campaignId: string, stepsData: Array<{
    step_order: number
    action_type: ActionType
    delay_minutes: number
    message_template?: string
    condition?: StepCondition
    condition_value?: string
    is_active?: boolean
  }>): Promise<CampaignStep[]> {
    try {
      // Verify campaign exists
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId }
      })
      if (!campaign) {
        throw new CampaignNotFoundError(campaignId)
      }

      // Validate step orders are sequential starting from 1
      const orders = stepsData.map(step => step.step_order).sort((a, b) => a - b)
      for (let i = 0; i < orders.length; i++) {
        if (orders[i] !== i + 1) {
          throw new InvalidInputError(
            'step_order',
            orders[i],
            ['Step orders must be sequential starting from 1']
          )
        }
      }

      // Delete existing steps for this campaign
      await this.prisma.campaignStep.deleteMany({
        where: { campaign_id: campaignId }
      })

      // Create all steps in a transaction
      const createdSteps = await this.prisma.$transaction(
        stepsData.map(stepData =>
          this.prisma.campaignStep.create({
            data: {
              campaign_id: campaignId,
              step_order: stepData.step_order,
              action_type: stepData.action_type,
              delay_minutes: stepData.delay_minutes,
              message_template: stepData.message_template,
              condition: stepData.condition,
              condition_value: stepData.condition_value,
              is_active: stepData.is_active ?? true
            },
            include: {
              campaign: true
            }
          })
        )
      )

      logger.info(`Bulk created ${createdSteps.length} steps for campaign ${campaignId}`)
      return createdSteps.map(step => this.transformToInterface(step))
    } catch (error) {
      if (error instanceof CampaignNotFoundError || error instanceof InvalidInputError) {
        throw error
      }
      throw new DatabaseError('bulk create campaign steps', error as Error)
    }
  }

  /**
   * Get next step for a lead based on current step and conditions
   */
  async getNextStep(campaignId: string, currentStepOrder: number): Promise<CampaignStep | null> {
    try {
      const nextStep = await this.prisma.campaignStep.findFirst({
        where: {
          campaign_id: campaignId,
          step_order: currentStepOrder + 1,
          is_active: true
        },
        include: {
          campaign: true
        }
      })

      if (!nextStep) {
        return null
      }

      return this.transformToInterface(nextStep)
    } catch (error) {
      throw new DatabaseError('get next campaign step', error as Error)
    }
  }

  /**
   * Toggle step active status
   */
  async toggleActive(id: string): Promise<CampaignStep> {
    try {
      const existingStep = await this.prisma.campaignStep.findUnique({ where: { id } })
      if (!existingStep) {
        throw new InvalidInputError('step_id', id, ['Step not found'])
      }

      const step = await this.prisma.campaignStep.update({
        where: { id },
        data: { is_active: !existingStep.is_active },
        include: {
          campaign: true
        }
      })

      logger.info(`Toggled step ${id} active status to ${step.is_active}`)
      return this.transformToInterface(step)
    } catch (error) {
      if (error instanceof InvalidInputError) {
        throw error
      }
      throw new DatabaseError('toggle step active status', error as Error)
    }
  }

  /**
   * Transform Prisma step to interface
   */
  private transformToInterface(step: any): CampaignStep {
    return {
      id: step.id,
      campaign_id: step.campaign_id,
      step_order: step.step_order,
      action_type: step.action_type as ActionType,
      delay_minutes: step.delay_minutes,
      message_template: step.message_template,
      condition: step.condition as StepCondition,
      condition_value: step.condition_value,
      is_active: step.is_active,
      created_at: step.created_at,
      updated_at: step.updated_at,
      campaign: step.campaign
    }
  }
}