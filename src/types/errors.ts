/**
 * Copyright (c) 2026 TattooIdeas Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

import { ErrorCode } from './enums'

// ============================================================================
// BASE ERROR CLASS
// ============================================================================

export class TattooIdeasError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly details?: Record<string, any>
  public readonly timestamp: Date

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: Record<string, any>
  ) {
    super(message)
    this.name = 'TattooIdeasError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.timestamp = new Date()

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, TattooIdeasError.prototype)
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp
    }
  }
}

// ============================================================================
// AUTHENTICATION ERRORS
// ============================================================================

export class InvalidCredentialsError extends TattooIdeasError {
  constructor(email: string, details?: Record<string, any>) {
    super(
      ErrorCode.INVALID_CREDENTIALS,
      `Invalid credentials for: ${email}`,
      401,
      { email, ...details }
    )
    this.name = 'InvalidCredentialsError'
  }
}

export class SessionExpiredError extends TattooIdeasError {
  constructor(userId: string, details?: Record<string, any>) {
    super(
      ErrorCode.SESSION_EXPIRED,
      `Session expired for user: ${userId}`,
      401,
      { userId, ...details }
    )
    this.name = 'SessionExpiredError'
  }
}

export class UnauthorizedError extends TattooIdeasError {
  constructor(resource: string, action: string, details?: Record<string, any>) {
    super(
      ErrorCode.UNAUTHORIZED,
      `Unauthorized to ${action} ${resource}`,
      401,
      { resource, action, ...details }
    )
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends TattooIdeasError {
  constructor(resource: string, reason: string, details?: Record<string, any>) {
    super(
      ErrorCode.FORBIDDEN,
      `Access forbidden to ${resource}: ${reason}`,
      403,
      { resource, reason, ...details }
    )
    this.name = 'ForbiddenError'
  }
}

// ============================================================================
// AI GENERATION ERRORS
// ============================================================================

export class AIRateLimitExceededError extends TattooIdeasError {
  public readonly retryAfter?: number

  constructor(
    userId: string,
    limit: number,
    retryAfter?: number,
    details?: Record<string, any>
  ) {
    super(
      ErrorCode.AI_RATE_LIMIT_EXCEEDED,
      `AI generation rate limit exceeded for user: ${userId} (${limit}/day)`,
      429,
      { userId, limit, retryAfter, ...details }
    )
    this.name = 'AIRateLimitExceededError'
    this.retryAfter = retryAfter
  }
}

export class AIGenerationFailedError extends TattooIdeasError {
  constructor(
    prompt: string,
    provider: string,
    reason?: string,
    details?: Record<string, any>
  ) {
    super(
      ErrorCode.AI_GENERATION_FAILED,
      `AI generation failed for prompt: "${prompt.substring(0, 50)}..." using ${provider}${reason ? ` - ${reason}` : ''}`,
      500,
      { prompt, provider, reason, ...details }
    )
    this.name = 'AIGenerationFailedError'
  }
}

export class AIProviderError extends TattooIdeasError {
  constructor(
    provider: string,
    originalError: string,
    details?: Record<string, any>
  ) {
    super(
      ErrorCode.AI_PROVIDER_ERROR,
      `AI provider error (${provider}): ${originalError}`,
      500,
      { provider, originalError, ...details }
    )
    this.name = 'AIProviderError'
  }
}

export class InsufficientCreditsError extends TattooIdeasError {
  constructor(
    userId: string,
    required: number,
    available: number,
    details?: Record<string, any>
  ) {
    super(
      ErrorCode.INSUFFICIENT_CREDITS,
      `Insufficient credits for user: ${userId} (need ${required}, have ${available})`,
      402,
      { userId, required, available, ...details }
    )
    this.name = 'InsufficientCreditsError'
  }
}

export class InvalidPromptError extends TattooIdeasError {
  constructor(
    prompt: string,
    violations: string[],
    details?: Record<string, any>
  ) {
    super(
      ErrorCode.INVALID_PROMPT,
      `Invalid prompt: ${violations.join(', ')}`,
      400,
      { prompt, violations, ...details }
    )
    this.name = 'InvalidPromptError'
  }
}

export class ContentPolicyViolationError extends TattooIdeasError {
  constructor(
    content: string,
    violations: string[],
    details?: Record<string, any>
  ) {
    super(
      ErrorCode.CONTENT_POLICY_VIOLATION,
      `Content policy violation: ${violations.join(', ')}`,
      400,
      { content: content.substring(0, 100), violations, ...details }
    )
    this.name = 'ContentPolicyViolationError'
  }
}

// ============================================================================
// DESIGN & CONTENT ERRORS
// ============================================================================

export class DesignNotFoundError extends TattooIdeasError {
  constructor(designId: string, details?: Record<string, any>) {
    super(
      ErrorCode.DESIGN_NOT_FOUND,
      `Design not found: ${designId}`,
      404,
      { designId, ...details }
    )
    this.name = 'DesignNotFoundError'
  }
}

export class InvalidImageFormatError extends TattooIdeasError {
  constructor(
    filename: string,
    format: string,
    supportedFormats: string[],
    details?: Record<string, any>
  ) {
    super(
      ErrorCode.INVALID_IMAGE_FORMAT,
      `Invalid image format for ${filename}: ${format}. Supported: ${supportedFormats.join(', ')}`,
      400,
      { filename, format, supportedFormats, ...details }
    )
    this.name = 'InvalidImageFormatError'
  }
}

export class ImageTooLargeError extends TattooIdeasError {
  constructor(
    filename: string,
    sizeMB: number,
    maxSizeMB: number,
    details?: Record<string, any>
  ) {
    super(
      ErrorCode.IMAGE_TOO_LARGE,
      `Image ${filename} too large: ${sizeMB}MB (max: ${maxSizeMB}MB)`,
      413,
      { filename, sizeMB, maxSizeMB, ...details }
    )
    this.name = 'ImageTooLargeError'
  }
}

export class DesignUploadFailedError extends TattooIdeasError {
  constructor(
    filename: string,
    reason: string,
    details?: Record<string, any>
  ) {
    super(
      ErrorCode.DESIGN_UPLOAD_FAILED,
      `Design upload failed for ${filename}: ${reason}`,
      500,
      { filename, reason, ...details }
    )
    this.name = 'DesignUploadFailedError'
  }
}

// ============================================================================
// USER & ARTIST ERRORS
// ============================================================================

export class ArtistNotFoundError extends TattooIdeasError {
  constructor(artistId: string, details?: Record<string, any>) {
    super(
      ErrorCode.ARTIST_NOT_FOUND,
      `Artist not found: ${artistId}`,
      404,
      { artistId, ...details }
    )
    this.name = 'ArtistNotFoundError'
  }
}

export class UserNotFoundError extends TattooIdeasError {
  constructor(userId: string, details?: Record<string, any>) {
    super(
      ErrorCode.USER_NOT_FOUND,
      `User not found: ${userId}`,
      404,
      { userId, ...details }
    )
    this.name = 'UserNotFoundError'
  }
}

export class ArtistNotVerifiedError extends TattooIdeasError {
  constructor(artistId: string, details?: Record<string, any>) {
    super(
      ErrorCode.ARTIST_NOT_VERIFIED,
      `Artist not verified: ${artistId}`,
      403,
      { artistId, ...details }
    )
    this.name = 'ArtistNotVerifiedError'
  }
}

export class DuplicateEmailError extends TattooIdeasError {
  constructor(email: string, details?: Record<string, any>) {
    super(
      ErrorCode.DUPLICATE_EMAIL,
      `Email already exists: ${email}`,
      409,
      { email, ...details }
    )
    this.name = 'DuplicateEmailError'
  }
}

export class InvalidPortfolioError extends TattooIdeasError {
  constructor(
    artistId: string,
    violations: string[],
    details?: Record<string, any>
  ) {
    super(
      ErrorCode.INVALID_PORTFOLIO,
      `Invalid portfolio for artist ${artistId}: ${violations.join(', ')}`,
      400,
      { artistId, violations, ...details }
    )
    this.name = 'InvalidPortfolioError'
  }
}

// ============================================================================
// E-COMMERCE ERRORS
// ============================================================================

export class PaymentFailedError extends TattooIdeasError {
  constructor(
    orderId: string,
    paymentIntentId: string,
    reason: string,
    details?: Record<string, any>
  ) {
    super(
      ErrorCode.PAYMENT_FAILED,
      `Payment failed for order ${orderId}: ${reason}`,
      402,
      { orderId, paymentIntentId, reason, ...details }
    )
    this.name = 'PaymentFailedError'
  }
}

export class OrderNotFoundError extends TattooIdeasError {
  constructor(orderId: string, details?: Record<string, any>) {
    super(
      ErrorCode.ORDER_NOT_FOUND,
      `Order not found: ${orderId}`,
      404,
      { orderId, ...details }
    )
    this.name = 'OrderNotFoundError'
  }
}

export class StripeError extends TattooIdeasError {
  constructor(
    operation: string,
    stripeError: string,
    details?: Record<string, any>
  ) {
    super(
      ErrorCode.STRIPE_ERROR,
      `Stripe error during ${operation}: ${stripeError}`,
      500,
      { operation, stripeError, ...details }
    )
    this.name = 'StripeError'
  }
}

export class ShippingError extends TattooIdeasError {
  constructor(
    orderId: string,
    shippingError: string,
    details?: Record<string, any>
  ) {
    super(
      ErrorCode.SHIPPING_ERROR,
      `Shipping error for order ${orderId}: ${shippingError}`,
      500,
      { orderId, shippingError, ...details }
    )
    this.name = 'ShippingError'
  }
}

export class RefundFailedError extends TattooIdeasError {
  constructor(
    orderId: string,
    amount: number,
    reason: string,
    details?: Record<string, any>
  ) {
    super(
      ErrorCode.REFUND_FAILED,
      `Refund failed for order ${orderId} ($${amount}): ${reason}`,
      500,
      { orderId, amount, reason, ...details }
    )
    this.name = 'RefundFailedError'
  }
}

export class SubscriptionError extends TattooIdeasError {
  constructor(
    userId: string,
    subscriptionId: string,
    operation: string,
    reason: string,
    details?: Record<string, any>
  ) {
    super(
      ErrorCode.SUBSCRIPTION_ERROR,
      `Subscription ${operation} failed for user ${userId}: ${reason}`,
      500,
      { userId, subscriptionId, operation, reason, ...details }
    )
    this.name = 'SubscriptionError'
  }
}

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

export class InvalidInputError extends TattooIdeasError {
  constructor(
    field: string,
    value: any,
    validationErrors: string[],
    details?: Record<string, any>
  ) {
    super(
      ErrorCode.INVALID_INPUT,
      `Invalid input for field: ${field} - ${validationErrors.join(', ')}`,
      400,
      { field, value, validationErrors, ...details }
    )
    this.name = 'InvalidInputError'
  }
}

export class MissingRequiredFieldError extends TattooIdeasError {
  constructor(
    field: string,
    context: string,
    details?: Record<string, any>
  ) {
    super(
      ErrorCode.MISSING_REQUIRED_FIELD,
      `Missing required field: ${field} in ${context}`,
      400,
      { field, context, ...details }
    )
    this.name = 'MissingRequiredFieldError'
  }
}

export class ValidationError extends TattooIdeasError {
  constructor(
    errors: Array<{ field: string; message: string }>,
    details?: Record<string, any>
  ) {
    const errorMessages = errors.map(e => `${e.field}: ${e.message}`)
    super(
      ErrorCode.VALIDATION_ERROR,
      `Validation failed: ${errorMessages.join(', ')}`,
      400,
      { errors, ...details }
    )
    this.name = 'ValidationError'
  }
}

// ============================================================================
// SYSTEM ERRORS
// ============================================================================

export class DatabaseError extends TattooIdeasError {
  constructor(operation: string, originalError: Error, details?: Record<string, any>) {
    super(
      ErrorCode.DATABASE_ERROR,
      `Database error during ${operation}: ${originalError.message}`,
      500,
      { operation, originalError: originalError.message, ...details }
    )
    this.name = 'DatabaseError'
  }
}

export class NetworkError extends TattooIdeasError {
  constructor(url: string, originalError: Error, details?: Record<string, any>) {
    super(
      ErrorCode.NETWORK_ERROR,
      `Network error for ${url}: ${originalError.message}`,
      500,
      { url, originalError: originalError.message, ...details }
    )
    this.name = 'NetworkError'
  }
}

export class FileStorageError extends TattooIdeasError {
  constructor(
    operation: string,
    filename: string,
    originalError: Error,
    details?: Record<string, any>
  ) {
    super(
      ErrorCode.FILE_STORAGE_ERROR,
      `File storage error during ${operation} for ${filename}: ${originalError.message}`,
      500,
      { operation, filename, originalError: originalError.message, ...details }
    )
    this.name = 'FileStorageError'
  }
}

export class EmailDeliveryError extends TattooIdeasError {
  constructor(
    recipient: string,
    subject: string,
    originalError: Error,
    details?: Record<string, any>
  ) {
    super(
      ErrorCode.EMAIL_DELIVERY_ERROR,
      `Email delivery failed to ${recipient} (${subject}): ${originalError.message}`,
      500,
      { recipient, subject, originalError: originalError.message, ...details }
    )
    this.name = 'EmailDeliveryError'
  }
}

export class RateLimitExceededError extends TattooIdeasError {
  public readonly retryAfter?: number

  constructor(
    endpoint: string,
    limit: string,
    retryAfter?: number,
    details?: Record<string, any>
  ) {
    super(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded for ${endpoint} (${limit})`,
      429,
      { endpoint, limit, retryAfter, ...details }
    )
    this.name = 'RateLimitExceededError'
    this.retryAfter = retryAfter
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function isTattooIdeasError(error: any): error is TattooIdeasError {
  return error instanceof TattooIdeasError
}

export function isRetryableError(error: TattooIdeasError): boolean {
  const retryableCodes = [
    ErrorCode.NETWORK_ERROR,
    ErrorCode.DATABASE_ERROR,
    ErrorCode.AI_PROVIDER_ERROR,
    ErrorCode.FILE_STORAGE_ERROR,
    ErrorCode.EMAIL_DELIVERY_ERROR,
    ErrorCode.STRIPE_ERROR,
    ErrorCode.SHIPPING_ERROR
  ]

  return retryableCodes.includes(error.code)
}

export function isUserError(error: TattooIdeasError): boolean {
  const userErrorCodes = [
    ErrorCode.INVALID_INPUT,
    ErrorCode.MISSING_REQUIRED_FIELD,
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.INVALID_CREDENTIALS,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.DESIGN_NOT_FOUND,
    ErrorCode.ARTIST_NOT_FOUND,
    ErrorCode.USER_NOT_FOUND,
    ErrorCode.ORDER_NOT_FOUND,
    ErrorCode.INSUFFICIENT_CREDITS,
    ErrorCode.AI_RATE_LIMIT_EXCEEDED,
    ErrorCode.RATE_LIMIT_EXCEEDED
  ]

  return userErrorCodes.includes(error.code)
}

export function convertToTattooIdeasError(error: unknown): TattooIdeasError {
  if (isTattooIdeasError(error)) {
    return error
  }

  if (error instanceof Error) {
    return new TattooIdeasError(
      ErrorCode.UNKNOWN_ERROR,
      error.message,
      500,
      { originalError: error.name, stack: error.stack }
    )
  }

  return new TattooIdeasError(
    ErrorCode.UNKNOWN_ERROR,
    'Unknown error occurred',
    500,
    { originalError: String(error) }
  )
}