/**
 * Copyright (c) 2026 LinkedFlow Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

import { z } from 'zod'
import { LeadStatus, LeadSource } from '../types/enums'

// ============================================================================
// SHARED VALIDATION PATTERNS
// ============================================================================

const linkedInUrlPattern = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ============================================================================
// BASE SCHEMAS
// ============================================================================

export const LeadCreateSchema = z.object({
  first_name: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be 50 characters or less')
    .trim(),

  last_name: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be 50 characters or less')
    .trim(),

  linkedin_url: z.string()
    .url('Must be a valid URL')
    .regex(linkedInUrlPattern, 'Must be a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)')
    .transform(url => url.replace(/\/$/, '')), // Remove trailing slash

  email: z.string()
    .email('Must be a valid email address')
    .max(255, 'Email must be 255 characters or less')
    .optional()
    .or(z.literal('')), // Allow empty string

  company: z.string()
    .max(100, 'Company name must be 100 characters or less')
    .trim()
    .optional(),

  title: z.string()
    .max(100, 'Title must be 100 characters or less')
    .trim()
    .optional(),

  location: z.string()
    .max(100, 'Location must be 100 characters or less')
    .trim()
    .optional(),

  status: z.nativeEnum(LeadStatus)
    .optional()
    .default(LeadStatus.IMPORTED),

  source: z.nativeEnum(LeadSource)
    .optional()
    .default(LeadSource.MANUAL_ENTRY),

  campaign_id: z.string()
    .cuid('Invalid campaign ID format')
    .optional(),

  assigned_account_id: z.string()
    .cuid('Invalid account ID format')
    .optional(),

  notes: z.string()
    .max(1000, 'Notes must be 1000 characters or less')
    .optional(),

  tags: z.array(z.string().trim().min(1))
    .max(10, 'Maximum 10 tags allowed')
    .optional()
    .default([]),

  custom_fields: z.record(z.any())
    .optional()
})
  .strict() // Don't allow extra fields
  .transform(data => {
    // Clean up empty optional fields
    const cleaned = { ...data }
    if (cleaned.email === '') cleaned.email = undefined
    if (cleaned.company === '') cleaned.company = undefined
    if (cleaned.title === '') cleaned.title = undefined
    if (cleaned.location === '') cleaned.location = undefined
    if (cleaned.notes === '') cleaned.notes = undefined
    return cleaned
  })

export const LeadUpdateSchema = z.object({
  first_name: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be 50 characters or less')
    .trim()
    .optional(),

  last_name: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be 50 characters or less')
    .trim()
    .optional(),

  email: z.string()
    .email('Must be a valid email address')
    .max(255, 'Email must be 255 characters or less')
    .optional()
    .or(z.literal('')),

  company: z.string()
    .max(100, 'Company name must be 100 characters or less')
    .trim()
    .optional(),

  title: z.string()
    .max(100, 'Title must be 100 characters or less')
    .trim()
    .optional(),

  location: z.string()
    .max(100, 'Location must be 100 characters or less')
    .trim()
    .optional(),

  status: z.nativeEnum(LeadStatus).optional(),

  campaign_id: z.string()
    .cuid('Invalid campaign ID format')
    .optional(),

  assigned_account_id: z.string()
    .cuid('Invalid account ID format')
    .optional(),

  notes: z.string()
    .max(1000, 'Notes must be 1000 characters or less')
    .optional(),

  tags: z.array(z.string().trim().min(1))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),

  custom_fields: z.record(z.any())
    .optional()
})
  .strict()
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
  })
  .transform(data => {
    // Clean up empty optional fields
    const cleaned = { ...data }
    if (cleaned.email === '') cleaned.email = undefined
    if (cleaned.company === '') cleaned.company = undefined
    if (cleaned.title === '') cleaned.title = undefined
    if (cleaned.location === '') cleaned.location = undefined
    if (cleaned.notes === '') cleaned.notes = undefined
    return cleaned
  })

// ============================================================================
// CSV IMPORT SCHEMA
// ============================================================================

export const LeadImportSchema = z.object({
  first_name: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be 50 characters or less')
    .trim(),

  last_name: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be 50 characters or less')
    .trim(),

  linkedin_url: z.string()
    .url('Must be a valid URL')
    .regex(linkedInUrlPattern, 'Must be a valid LinkedIn profile URL')
    .transform(url => url.replace(/\/$/, '')),

  email: z.string()
    .email('Must be a valid email address')
    .max(255, 'Email must be 255 characters or less')
    .optional()
    .or(z.literal('')),

  company: z.string()
    .max(100, 'Company name must be 100 characters or less')
    .trim()
    .optional()
    .or(z.literal('')),

  title: z.string()
    .max(100, 'Title must be 100 characters or less')
    .trim()
    .optional()
    .or(z.literal('')),

  location: z.string()
    .max(100, 'Location must be 100 characters or less')
    .trim()
    .optional()
    .or(z.literal('')),

  notes: z.string()
    .max(1000, 'Notes must be 1000 characters or less')
    .optional()
    .or(z.literal('')),

  tags: z.string()
    .optional()
    .or(z.literal(''))
    .transform(tags => {
      if (!tags || tags.trim() === '') return []
      return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    })
})
  .transform(data => {
    // Clean up empty string fields to undefined
    const cleaned = { ...data }
    if (cleaned.email === '') cleaned.email = undefined
    if (cleaned.company === '') cleaned.company = undefined
    if (cleaned.title === '') cleaned.title = undefined
    if (cleaned.location === '') cleaned.location = undefined
    if (cleaned.notes === '') cleaned.notes = undefined
    return cleaned
  })

// ============================================================================
// QUERY PARAMETER SCHEMAS
// ============================================================================

export const LeadQuerySchema = z.object({
  page: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 1)
    .pipe(z.number().int().min(1).max(1000)),

  limit: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 50)
    .pipe(z.number().int().min(1).max(100)),

  status: z.nativeEnum(LeadStatus).optional(),

  source: z.nativeEnum(LeadSource).optional(),

  campaign_id: z.string()
    .cuid('Invalid campaign ID format')
    .optional(),

  assigned_account_id: z.string()
    .cuid('Invalid account ID format')
    .optional(),

  search: z.string()
    .max(100, 'Search term must be 100 characters or less')
    .trim()
    .optional()
})

// ============================================================================
// FILE UPLOAD SCHEMA
// ============================================================================

export const FileUploadSchema = z.object({
  filename: z.string()
    .regex(/\.csv$/i, 'File must be a CSV file'),

  mimetype: z.string()
    .refine(
      type => ['text/csv', 'application/csv', 'text/plain'].includes(type),
      'File must be a valid CSV file'
    ),

  size: z.number()
    .max(50 * 1024 * 1024, 'File size must be less than 50MB') // 50MB limit
})

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

export const LeadResponseSchema = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().optional(),
  linkedin_url: z.string(),
  company: z.string().optional(),
  title: z.string().optional(),
  location: z.string().optional(),
  status: z.nativeEnum(LeadStatus),
  source: z.nativeEnum(LeadSource),
  campaign_id: z.string().optional(),
  assigned_account_id: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()),
  custom_fields: z.record(z.any()).optional(),
  created_at: z.date(),
  updated_at: z.date()
})

export const ImportResultSchema = z.object({
  totalRows: z.number().int().min(0),
  successCount: z.number().int().min(0),
  errorCount: z.number().int().min(0),
  duplicateCount: z.number().int().min(0),
  errors: z.array(z.object({
    row: z.number().int().min(1),
    field: z.string(),
    message: z.string(),
    data: z.record(z.any())
  }))
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type LeadCreateInput = z.infer<typeof LeadCreateSchema>
export type LeadUpdateInput = z.infer<typeof LeadUpdateSchema>
export type LeadImportInput = z.infer<typeof LeadImportSchema>
export type LeadQueryInput = z.infer<typeof LeadQuerySchema>
export type FileUploadInput = z.infer<typeof FileUploadSchema>
export type LeadResponse = z.infer<typeof LeadResponseSchema>
export type ImportResult = z.infer<typeof ImportResultSchema>

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateLinkedInUrl(url: string): boolean {
  return linkedInUrlPattern.test(url)
}

export function validateEmail(email: string): boolean {
  return emailPattern.test(email)
}

export function sanitizeLeadData(data: any): any {
  // Remove any potentially dangerous characters
  const sanitized = { ...data }

  const stringFields = ['first_name', 'last_name', 'company', 'title', 'location', 'notes']
  for (const field of stringFields) {
    if (typeof sanitized[field] === 'string') {
      // Remove control characters and normalize whitespace
      sanitized[field] = sanitized[field]
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    }
  }

  return sanitized
}

export function parseCSVTags(tagsString: string): string[] {
  if (!tagsString || typeof tagsString !== 'string') {
    return []
  }

  return tagsString
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0 && tag.length <= 50)
    .slice(0, 10) // Max 10 tags
}