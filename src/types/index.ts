/**
 * Copyright (c) 2026 TattooIdeas Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

// Export all interfaces
export * from './interfaces'

// Export all enums
export * from './enums'

// Export all error classes
export * from './errors'

// Re-export key types for convenience
export type {
  User,
  UserProfile,
  Design,
  Collection,
  AIGeneration,
  AIGenerationRequest,
  AIGenerationResult,
  Artist,
  ArtistReview,
  ArtistMatch,
  Referral,
  ReferralEarnings,
  Order,
  ShippingAddress,
  CartItem,
  SearchFilters,
  SearchResult,
  SearchFacets,
  ApiResponse,
  ApiError,
  PaginationMeta,
  DesignMetrics,
  UserAnalytics,
  PlatformStats
} from './interfaces'

export {
  // User & Auth
  UserRole,
  UserStatus,
  SubscriptionTier,

  // Design & Tattoo
  TattooStyle,
  BodyPlacement,
  TattooSize,
  ColorType,
  DesignSource,
  DesignStatus,

  // AI Generation
  AIProvider,
  GenerationType,
  GenerationStatus,

  // Artist & Marketplace
  ArtistStatus,
  ArtistTier,
  VerificationMethod,
  ReferralStatus,

  // E-commerce
  OrderStatus,
  OrderType,
  ShippingSpeed,
  PaymentStatus,

  // Content & Moderation
  ContentStatus,
  FlagReason,

  // Error Codes
  ErrorCode,

  // Pricing & Limits
  AI_GENERATION_PRICING,
  PAY_PER_GENERATION_COST,
  TEMP_TATTOO_PRICING,
  SHIPPING_COSTS,
  ARTIST_SUBSCRIPTION_PRICING,
  REFERRAL_COMMISSION_RATE,
  MIN_REFERRAL_COMMISSION,
  CONTENT_LIMITS,
  SUPPORTED_IMAGE_FORMATS,
  SEO_CATEGORIES,
  TRENDING_TIME_WINDOWS
} from './enums'

export {
  // Base Error
  TattooIdeasError,

  // Authentication Errors
  InvalidCredentialsError,
  SessionExpiredError,
  UnauthorizedError,
  ForbiddenError,

  // AI Generation Errors
  AIRateLimitExceededError,
  AIGenerationFailedError,
  AIProviderError,
  InsufficientCreditsError,
  InvalidPromptError,
  ContentPolicyViolationError,

  // Design & Content Errors
  DesignNotFoundError,
  InvalidImageFormatError,
  ImageTooLargeError,
  DesignUploadFailedError,

  // User & Artist Errors
  ArtistNotFoundError,
  UserNotFoundError,
  ArtistNotVerifiedError,
  DuplicateEmailError,
  InvalidPortfolioError,

  // E-commerce Errors
  PaymentFailedError,
  OrderNotFoundError,
  StripeError,
  ShippingError,
  RefundFailedError,
  SubscriptionError,

  // Validation Errors
  InvalidInputError,
  MissingRequiredFieldError,
  ValidationError,

  // System Errors
  DatabaseError,
  NetworkError,
  FileStorageError,
  EmailDeliveryError,
  RateLimitExceededError,

  // Utility Functions
  isTattooIdeasError,
  isRetryableError,
  isUserError,
  convertToTattooIdeasError
} from './errors'