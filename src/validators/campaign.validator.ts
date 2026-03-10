/**
 * Copyright (c) 2026 LinkedFlow Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

import { z } from 'zod'
import { ActionType, CampaignStatus, StepCondition } from '../types/enums'

// ============================================================================
// CAMPAIGN VALIDATION SCHEMAS
// ============================================================================

export const CampaignCreateSchema = z.object({
  name: z.string()
    .min(1, 'Campaign name is required')
    .max(255, 'Campaign name must be less than 255 characters')
    .trim(),

  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),

  status: z.enum(Object.values(CampaignStatus) as [string, ...string[]])
    .default(CampaignStatus.DRAFT),

  organization_id: z.string()
    .min(1, 'Organization ID is required'),

  created_by: z.string()
    .min(1, 'Creator user ID is required')
})

export const CampaignUpdateSchema = z.object({
  name: z.string()
    .min(1, 'Campaign name is required')
    .max(255, 'Campaign name must be less than 255 characters')
    .trim()
    .optional(),

  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),

  status: z.enum(Object.values(CampaignStatus) as [string, ...string[]])
    .optional()
})

export const CampaignQuerySchema = z.object({
  page: z.coerce.number()
    .int()
    .min(1, 'Page must be at least 1')
    .default(1),

  limit: z.coerce.number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must be at most 100')
    .default(20),

  status: z.enum(Object.values(CampaignStatus) as [string, ...string[]])
    .optional(),

  search: z.string()
    .min(1)
    .max(255)
    .optional()
})

// ============================================================================
// CAMPAIGN STEP VALIDATION SCHEMAS
// ============================================================================

export const CampaignStepSchema = z.object({
  step_order: z.number()
    .int()
    .min(1, 'Step order must be at least 1')
    .max(20, 'Maximum 20 steps allowed per campaign'),

  action_type: z.enum(Object.values(ActionType) as [string, ...string[]], {
    required_error: 'Action type is required'
  }),

  delay_minutes: z.number()
    .int()
    .min(0, 'Delay cannot be negative')
    .max(10080, 'Maximum delay is 7 days (10080 minutes)'), // 7 days max

  message_template: z.string()
    .max(3000, 'LinkedIn messages have a 3000 character limit')
    .optional()
    .refine((val, ctx) => {
      const actionType = ctx.path[0] === 'action_type' ? ctx.parent?.action_type : null
      if (actionType === ActionType.SEND_MESSAGE && !val) {
        return false
      }
      return true
    }, 'Message template is required for SEND_MESSAGE actions'),

  condition: z.enum(Object.values(StepCondition) as [string, ...string[]])
    .default(StepCondition.ALWAYS),

  condition_value: z.string()
    .max(255, 'Condition value must be less than 255 characters')
    .optional(),

  is_active: z.boolean()
    .default(true)
})

export const CampaignStepUpdateSchema = CampaignStepSchema.partial()

export const BulkStepsCreateSchema = z.object({
  steps: z.array(CampaignStepSchema)
    .min(1, 'At least one step is required')
    .max(20, 'Maximum 20 steps allowed per campaign')
    .refine((steps) => {
      // Validate step orders are sequential starting from 1
      const orders = steps.map(step => step.step_order).sort((a, b) => a - b)
      return orders.every((order, index) => order === index + 1)
    }, 'Step orders must be sequential starting from 1')
})

export const StepReorderSchema = z.object({
  steps: z.array(z.object({
    id: z.string().min(1, 'Step ID is required'),
    step_order: z.number().int().min(1, 'Step order must be at least 1')
  }))
    .min(1, 'At least one step is required')
    .refine((steps) => {
      // Validate step orders are sequential starting from 1
      const orders = steps.map(step => step.step_order).sort((a, b) => a - b)
      return orders.every((order, index) => order === index + 1)
    }, 'Step orders must be sequential starting from 1')
})

// ============================================================================
// CAMPAIGN ENROLLMENT SCHEMAS
// ============================================================================

export const EnrollLeadsSchema = z.object({
  lead_ids: z.array(z.string().min(1))
    .min(1, 'At least one lead ID is required')
    .max(1000, 'Maximum 1000 leads can be enrolled at once')
})

// ============================================================================
// MESSAGE TEMPLATE VALIDATION
// ============================================================================

export const MessageTemplateSchema = z.string()
  .min(1, 'Message template cannot be empty')
  .max(3000, 'LinkedIn messages have a 3000 character limit')
  .refine((template) => {
    // Check for valid personalization tokens
    const validTokens = [
      '{{first_name}}',
      '{{last_name}}',
      '{{company}}',
      '{{title}}',
      '{{location}}'
    ]

    // Extract all tokens from template
    const tokens = template.match(/\{\{[^}]+\}\}/g) || []

    // Validate all tokens are recognized
    return tokens.every(token => validTokens.includes(token))
  }, 'Invalid personalization token. Valid tokens: {{first_name}}, {{last_name}}, {{company}}, {{title}}, {{location}}')

// ============================================================================
// STEP CONDITION VALIDATION
// ============================================================================

export const StepConditionSchema = z.object({
  condition: z.enum(Object.values(StepCondition) as [string, ...string[]]),
  condition_value: z.string().optional()
}).refine((data) => {
  // Validate condition_value requirements
  if (data.condition === StepCondition.WAIT_DAYS) {
    if (!data.condition_value) {
      return false
    }
    const days = parseInt(data.condition_value, 10)
    return !isNaN(days) && days >= 1 && days <= 30 // Max 30 days wait
  }

  return true
}, {
  message: 'WAIT_DAYS condition requires a valid number of days (1-30)',
  path: ['condition_value']
})

// ============================================================================
// DELAY VALIDATION HELPERS
// ============================================================================

export const DelayValidationSchema = z.object({
  delay_minutes: z.number()
    .int()
    .min(0, 'Delay cannot be negative')
    .max(10080) // 7 days max
    .refine((minutes) => {
      // Reasonable minimum delays for different action types
      if (minutes < 60 && minutes !== 0) {
        return false // Minimum 1 hour delay (except for immediate)
      }
      return true
    }, 'Minimum delay is 1 hour (60 minutes) for safety, or 0 for immediate execution')
})

// ============================================================================
// SEQUENCE VALIDATION
// ============================================================================

export const CampaignSequenceSchema = z.object({
  steps: z.array(CampaignStepSchema)
    .min(1, 'Campaign must have at least one step')
    .max(20, 'Maximum 20 steps allowed')
    .refine((steps) => {
      // Must start with VIEW_PROFILE or SEND_CONNECTION
      const firstStep = steps.find(s => s.step_order === 1)
      if (!firstStep) return false

      const validFirstActions = [ActionType.VIEW_PROFILE, ActionType.SEND_CONNECTION]
      return validFirstActions.includes(firstStep.action_type)
    }, 'First step must be VIEW_PROFILE or SEND_CONNECTION')
    .refine((steps) => {
      // SEND_MESSAGE can only come after SEND_CONNECTION
      const messageSteps = steps.filter(s => s.action_type === ActionType.SEND_MESSAGE)
      const connectionSteps = steps.filter(s => s.action_type === ActionType.SEND_CONNECTION)

      if (messageSteps.length === 0) return true // No message steps is OK
      if (connectionSteps.length === 0) return false // Message without connection is not OK

      // Check that first message comes after first connection
      const firstMessage = messageSteps.sort((a, b) => a.step_order - b.step_order)[0]
      const firstConnection = connectionSteps.sort((a, b) => a.step_order - b.step_order)[0]

      return firstMessage.step_order > firstConnection.step_order
    }, 'SEND_MESSAGE steps must come after SEND_CONNECTION steps')
})

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type CampaignCreateData = z.infer<typeof CampaignCreateSchema>
export type CampaignUpdateData = z.infer<typeof CampaignUpdateSchema>
export type CampaignQueryParams = z.infer<typeof CampaignQuerySchema>
export type CampaignStepData = z.infer<typeof CampaignStepSchema>
export type CampaignStepUpdateData = z.infer<typeof CampaignStepUpdateSchema>
export type BulkStepsCreateData = z.infer<typeof BulkStepsCreateSchema>
export type StepReorderData = z.infer<typeof StepReorderSchema>
export type EnrollLeadsData = z.infer<typeof EnrollLeadsSchema>