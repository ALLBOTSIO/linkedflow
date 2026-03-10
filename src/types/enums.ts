/**
 * Copyright (c) 2026 TattooIdeas Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

// ============================================================================
// USER & AUTH ENUMS
// ============================================================================

export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
  ARTIST = 'artist'
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
  BANNED = 'banned'
}

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  UNLIMITED = 'unlimited'
}

// ============================================================================
// DESIGN & TATTOO ENUMS
// ============================================================================

export enum TattooStyle {
  TRADITIONAL = 'traditional',
  NEO_TRADITIONAL = 'neo-traditional',
  BLACKWORK = 'blackwork',
  WATERCOLOR = 'watercolor',
  GEOMETRIC = 'geometric',
  MINIMALIST = 'minimalist',
  JAPANESE = 'japanese',
  TRIBAL = 'tribal',
  REALISM = 'realism',
  NEW_SCHOOL = 'new-school',
  DOTWORK = 'dotwork',
  CHICANO = 'chicano',
  BIOMECHANICAL = 'biomechanical',
  ILLUSTRATIVE = 'illustrative',
  FINELINE = 'fineline',
  ORNAMENTAL = 'ornamental'
}

export enum BodyPlacement {
  ARM = 'arm',
  FOREARM = 'forearm',
  UPPER_ARM = 'upper-arm',
  WRIST = 'wrist',
  SHOULDER = 'shoulder',
  BACK = 'back',
  UPPER_BACK = 'upper-back',
  LOWER_BACK = 'lower-back',
  CHEST = 'chest',
  LEG = 'leg',
  THIGH = 'thigh',
  CALF = 'calf',
  ANKLE = 'ankle',
  FOOT = 'foot',
  NECK = 'neck',
  HAND = 'hand',
  FINGER = 'finger',
  RIBCAGE = 'ribcage',
  HIP = 'hip',
  FACE = 'face',
  FULL_SLEEVE = 'full-sleeve',
  HALF_SLEEVE = 'half-sleeve'
}

export enum TattooSize {
  TINY = 'tiny',           // < 2"
  SMALL = 'small',         // 2"-4"
  MEDIUM = 'medium',       // 4"-8"
  LARGE = 'large',         // 8"-12"
  EXTRA_LARGE = 'extra_large' // 12"+
}

export enum ColorType {
  BLACK_GREY = 'black_grey',
  FULL_COLOR = 'full_color',
  SINGLE_COLOR = 'single_color',
  ACCENT_COLOR = 'accent_color'
}

export enum DesignSource {
  AI_GENERATED = 'ai_generated',
  CURATED = 'curated',
  USER_UPLOAD = 'user_upload',
  ARTIST_PORTFOLIO = 'artist_portfolio',
  STOCK_IMAGE = 'stock_image'
}

export enum DesignStatus {
  ACTIVE = 'active',
  PENDING_REVIEW = 'pending_review',
  REJECTED = 'rejected',
  FEATURED = 'featured',
  ARCHIVED = 'archived'
}

// ============================================================================
// AI GENERATION ENUMS
// ============================================================================

export enum AIProvider {
  OPENAI = 'openai',
  STABILITY = 'stability',
  MIDJOURNEY = 'midjourney',
  LEONARDO = 'leonardo'
}

export enum GenerationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RATE_LIMITED = 'rate_limited'
}

export enum GenerationType {
  TEXT_TO_TATTOO = 'text_to_tattoo',
  STYLE_TRANSFER = 'style_transfer',
  DESIGN_VARIATION = 'design_variation',
  PLACEMENT_PREVIEW = 'placement_preview'
}

// ============================================================================
// ARTIST & MARKETPLACE ENUMS
// ============================================================================

export enum ArtistStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FEATURED = 'featured',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected'
}

export enum ArtistTier {
  FREE = 'free',           // Basic listing
  PRO = 'pro',             // $49/mo - Priority placement
  ELITE = 'elite'          // $149/mo - Featured + promotion
}

export enum VerificationMethod {
  INSTAGRAM = 'instagram',
  PORTFOLIO_REVIEW = 'portfolio_review',
  MANUAL = 'manual',
  REFERRAL = 'referral'
}

export enum ReferralStatus {
  CLICKED = 'clicked',
  CONSULTED = 'consulted',
  BOOKED = 'booked',
  COMPLETED = 'completed',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}

// ============================================================================
// E-COMMERCE ENUMS
// ============================================================================

export enum OrderStatus {
  PENDING = 'pending',
  PAYMENT_PROCESSING = 'payment_processing',
  PAID = 'paid',
  PRINTING = 'printing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum OrderType {
  TEMP_TATTOO = 'temp_tattoo',
  AI_DESIGN = 'ai_design',
  ARTIST_SUBSCRIPTION = 'artist_subscription',
  USER_SUBSCRIPTION = 'user_subscription'
}

export enum ShippingSpeed {
  STANDARD = 'standard',   // 5-7 days
  RUSH = 'rush'           // 2-3 days
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

// ============================================================================
// CONTENT & MODERATION ENUMS
// ============================================================================

export enum ContentStatus {
  ACTIVE = 'active',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
  REMOVED = 'removed'
}

export enum FlagReason {
  INAPPROPRIATE = 'inappropriate',
  COPYRIGHT = 'copyright',
  OFFENSIVE = 'offensive',
  LOW_QUALITY = 'low_quality',
  SPAM = 'spam',
  VIOLENCE = 'violence',
  HATE_SPEECH = 'hate_speech'
}

// ============================================================================
// ERROR CODES
// ============================================================================

export enum ErrorCode {
  // Authentication Errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // AI Generation Errors
  AI_RATE_LIMIT_EXCEEDED = 'AI_RATE_LIMIT_EXCEEDED',
  AI_GENERATION_FAILED = 'AI_GENERATION_FAILED',
  AI_PROVIDER_ERROR = 'AI_PROVIDER_ERROR',
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  INVALID_PROMPT = 'INVALID_PROMPT',
  CONTENT_POLICY_VIOLATION = 'CONTENT_POLICY_VIOLATION',

  // Design & Content Errors
  DESIGN_NOT_FOUND = 'DESIGN_NOT_FOUND',
  INVALID_IMAGE_FORMAT = 'INVALID_IMAGE_FORMAT',
  IMAGE_TOO_LARGE = 'IMAGE_TOO_LARGE',
  DESIGN_UPLOAD_FAILED = 'DESIGN_UPLOAD_FAILED',

  // Artist & User Errors
  ARTIST_NOT_FOUND = 'ARTIST_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  ARTIST_NOT_VERIFIED = 'ARTIST_NOT_VERIFIED',
  DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',
  INVALID_PORTFOLIO = 'INVALID_PORTFOLIO',

  // E-commerce Errors
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  STRIPE_ERROR = 'STRIPE_ERROR',
  SHIPPING_ERROR = 'SHIPPING_ERROR',
  REFUND_FAILED = 'REFUND_FAILED',
  SUBSCRIPTION_ERROR = 'SUBSCRIPTION_ERROR',

  // Validation Errors
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // System Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  FILE_STORAGE_ERROR = 'FILE_STORAGE_ERROR',
  EMAIL_DELIVERY_ERROR = 'EMAIL_DELIVERY_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// ============================================================================
// PRICING & LIMITS
// ============================================================================

export const AI_GENERATION_PRICING = {
  [SubscriptionTier.FREE]: {
    daily_limit: 2,
    cost_per_generation: 0,
    monthly_limit: 60
  },
  [SubscriptionTier.PRO]: {
    daily_limit: 25,
    cost_per_generation: 0,
    monthly_limit: 750,
    cost_per_month: 9.99
  },
  [SubscriptionTier.UNLIMITED]: {
    daily_limit: -1, // unlimited
    cost_per_generation: 0,
    monthly_limit: -1,
    cost_per_month: 29.99
  }
} as const

export const PAY_PER_GENERATION_COST = 2.99

export const TEMP_TATTOO_PRICING = {
  '2x2': { price: 12.99, description: 'Small - 2" x 2"' },
  '4x4': { price: 17.99, description: 'Medium - 4" x 4"' },
  '6x6': { price: 22.99, description: 'Large - 6" x 6"' },
  'custom': { price: 29.99, description: 'Custom Size' }
} as const

export const SHIPPING_COSTS = {
  [ShippingSpeed.STANDARD]: 4.99,
  [ShippingSpeed.RUSH]: 9.99
} as const

export const ARTIST_SUBSCRIPTION_PRICING = {
  [ArtistTier.FREE]: { monthly_cost: 0, max_portfolio_images: 5 },
  [ArtistTier.PRO]: { monthly_cost: 49, max_portfolio_images: 50 },
  [ArtistTier.ELITE]: { monthly_cost: 149, max_portfolio_images: 100 }
} as const

export const REFERRAL_COMMISSION_RATE = 0.15 // 15%
export const MIN_REFERRAL_COMMISSION = 25.00

// ============================================================================
// CONTENT LIMITS & VALIDATION
// ============================================================================

export const CONTENT_LIMITS = {
  MAX_IMAGE_SIZE_MB: 10,
  MAX_PROMPT_LENGTH: 500,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_BIO_LENGTH: 500,
  MAX_PORTFOLIO_IMAGES: 100,
  MAX_COLLECTIONS: 50,
  MAX_DESIGNS_PER_COLLECTION: 500
} as const

export const SUPPORTED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp'] as const

// ============================================================================
// SEO & TRENDING
// ============================================================================

export const TRENDING_TIME_WINDOWS = {
  HOURLY: '1h',
  DAILY: '24h',
  WEEKLY: '7d',
  MONTHLY: '30d'
} as const

export const SEO_CATEGORIES = [
  // Style-based categories
  'traditional-tattoos',
  'blackwork-tattoos',
  'watercolor-tattoos',
  'geometric-tattoos',
  'minimalist-tattoos',
  'japanese-tattoos',
  'tribal-tattoos',
  'realism-tattoos',

  // Placement-based categories
  'arm-tattoos',
  'forearm-tattoos',
  'wrist-tattoos',
  'shoulder-tattoos',
  'back-tattoos',
  'chest-tattoos',
  'leg-tattoos',
  'ankle-tattoos',
  'neck-tattoos',
  'hand-tattoos',

  // Size-based categories
  'small-tattoos',
  'medium-tattoos',
  'large-tattoos',
  'sleeve-tattoos',

  // Theme-based categories
  'nature-tattoos',
  'animal-tattoos',
  'flower-tattoos',
  'skull-tattoos',
  'quotes-tattoos',
  'symbol-tattoos',
  'religious-tattoos',
  'memorial-tattoos'
] as const