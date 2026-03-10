/**
 * Copyright (c) 2026 TattooIdeas Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

import {
  UserRole,
  UserStatus,
  SubscriptionTier,
  TattooStyle,
  BodyPlacement,
  TattooSize,
  ColorType,
  DesignSource,
  DesignStatus,
  GenerationType,
  GenerationStatus,
  AIProvider,
  ArtistStatus,
  ArtistTier,
  VerificationMethod,
  ReferralStatus,
  OrderStatus,
  OrderType,
  ShippingSpeed,
  PaymentStatus,
  ContentStatus,
  FlagReason
} from './enums'

// ============================================================================
// USER MANAGEMENT INTERFACES
// ============================================================================

export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  avatar_url?: string
  role: UserRole
  status: UserStatus
  subscription_tier: SubscriptionTier
  subscription_expires_at?: Date

  // Preferences
  location_city?: string
  location_state?: string
  location_zip?: string
  preferred_styles: TattooStyle[]
  tattoo_experience: 'none' | 'few' | 'many' | 'heavy'

  // Credits & Billing
  ai_credits_remaining: number
  stripe_customer_id?: string

  // Referral System
  referral_code: string
  referred_by?: string
  referral_earnings: number

  created_at: Date
  updated_at: Date
}

export interface UserProfile {
  user_id: string
  bio?: string
  instagram_handle?: string
  favorite_artists: string[]
  tattoo_count: number
  planning_next_tattoo: boolean
  budget_range?: string
  style_preferences: TattooStyle[]
  placement_interests: BodyPlacement[]
  updated_at: Date
}

// ============================================================================
// DESIGN & CONTENT INTERFACES
// ============================================================================

export interface Design {
  id: string
  title: string
  description?: string
  image_url: string
  thumbnail_url: string

  // Categorization
  style: TattooStyle
  placement: BodyPlacement
  size: TattooSize
  color_type: ColorType
  tags: string[]

  // Source & Attribution
  source: DesignSource
  creator_id?: string
  artist_id?: string
  original_prompt?: string

  // Engagement Metrics
  view_count: number
  save_count: number
  share_count: number
  like_count: number

  // Status & Moderation
  status: DesignStatus
  is_featured: boolean
  is_trending: boolean
  moderation_notes?: string

  created_at: Date
  updated_at: Date
}

export interface Collection {
  id: string
  user_id: string
  name: string
  description?: string
  is_public: boolean
  design_count: number
  created_at: Date
  updated_at: Date
}

export interface CollectionDesign {
  collection_id: string
  design_id: string
  added_at: Date
}

// ============================================================================
// AI GENERATION INTERFACES
// ============================================================================

export interface AIGeneration {
  id: string
  user_id: string

  // Input Parameters
  prompt: string
  style: TattooStyle
  placement: BodyPlacement
  color_type: ColorType
  generation_type: GenerationType

  // AI Configuration
  ai_provider: AIProvider
  model_version?: string
  seed?: number

  // Output Results
  result_urls: string[]
  selected_variant?: number
  status: GenerationStatus

  // Billing
  credits_used: number
  cost_usd?: number

  // Metadata
  generation_time_ms?: number
  error_message?: string
  moderation_flags?: string[]

  created_at: Date
  completed_at?: Date
}

export interface AIGenerationRequest {
  prompt: string
  style: TattooStyle
  placement: BodyPlacement
  color_type: ColorType
  generation_type: GenerationType
  reference_image_url?: string
}

export interface AIGenerationResult {
  generation_id: string
  image_urls: string[]
  cost_credits: number
  generation_time_ms: number
}

// ============================================================================
// ARTIST MARKETPLACE INTERFACES
// ============================================================================

export interface Artist {
  id: string
  user_id?: string

  // Basic Info
  name: string
  studio_name?: string
  bio?: string

  // Location
  city: string
  state: string
  zip: string
  country: string
  latitude?: number
  longitude?: number

  // Professional Info
  styles: TattooStyle[]
  years_experience: number
  instagram_handle?: string
  website_url?: string

  // Portfolio
  portfolio_images: string[]
  featured_work_ids: string[]

  // Verification & Status
  verification_status: ArtistStatus
  verification_method?: VerificationMethod
  verified_at?: Date

  // Subscription & Billing
  subscription_tier: ArtistTier
  subscription_expires_at?: Date
  stripe_connect_id?: string

  // Metrics
  avg_rating: number
  total_reviews: number
  total_referrals: number
  total_earnings: number

  // Import Data
  is_imported: boolean
  claim_token?: string
  claimed_at?: Date

  created_at: Date
  updated_at: Date
}

export interface ArtistReview {
  id: string
  artist_id: string
  user_id: string
  rating: number
  review_text?: string
  session_type?: string
  tattoo_image_url?: string
  verified_booking: boolean
  created_at: Date
}

export interface ArtistMatch {
  artist: Artist
  distance_miles: number
  style_match_score: number
  availability_score: number
  overall_score: number
}

// ============================================================================
// REFERRAL SYSTEM INTERFACES
// ============================================================================

export interface Referral {
  id: string
  user_id: string
  artist_id: string

  referral_link: string
  utm_source?: string

  status: ReferralStatus
  session_value?: number
  commission_amount?: number
  commission_paid_at?: Date

  // Tracking Data
  clicked_at?: Date
  consulted_at?: Date
  booked_at?: Date
  completed_at?: Date
  cancelled_at?: Date

  metadata?: Record<string, any>
  created_at: Date
  updated_at: Date
}

export interface ReferralEarnings {
  user_id: string
  total_earnings: number
  pending_earnings: number
  paid_earnings: number
  total_referrals: number
  successful_referrals: number
  next_payout_at?: Date
}

// ============================================================================
// E-COMMERCE INTERFACES
// ============================================================================

export interface Order {
  id: string
  user_id: string

  order_type: OrderType
  status: OrderStatus

  // Items
  design_id?: string
  ai_generation_id?: string
  temp_tattoo_size?: string
  quantity: number

  // Pricing
  unit_price: number
  shipping_cost: number
  tax_amount: number
  total_amount: number

  // Shipping
  shipping_speed: ShippingSpeed
  shipping_address: ShippingAddress
  tracking_number?: string
  carrier?: string

  // Payment
  stripe_payment_intent_id?: string
  payment_status: PaymentStatus

  // Fulfillment
  print_file_url?: string
  shipped_at?: Date
  delivered_at?: Date

  created_at: Date
  updated_at: Date
}

export interface ShippingAddress {
  name: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone?: string
}

export interface CartItem {
  design_id?: string
  ai_generation_id?: string
  temp_tattoo_size: string
  quantity: number
  unit_price: number
}

// ============================================================================
// CONTENT MODERATION INTERFACES
// ============================================================================

export interface ContentFlag {
  id: string
  content_type: 'design' | 'user_upload' | 'ai_generation' | 'review'
  content_id: string
  user_id: string
  reason: FlagReason
  description?: string
  status: ContentStatus
  reviewed_by?: string
  reviewed_at?: Date
  action_taken?: string
  created_at: Date
}

export interface ModerationQueue {
  id: string
  content_type: string
  content_id: string
  priority: number
  assigned_to?: string
  status: ContentStatus
  created_at: Date
}

// ============================================================================
// ANALYTICS & METRICS INTERFACES
// ============================================================================

export interface DesignMetrics {
  design_id: string
  views_today: number
  views_week: number
  views_month: number
  saves_today: number
  saves_week: number
  saves_month: number
  shares_today: number
  shares_week: number
  shares_month: number
  conversion_rate: number
  updated_at: Date
}

export interface UserAnalytics {
  user_id: string
  session_count: number
  total_time_spent: number
  designs_viewed: number
  designs_saved: number
  ai_generations_created: number
  orders_placed: number
  last_active_at: Date
}

export interface PlatformStats {
  total_users: number
  active_users_week: number
  total_designs: number
  total_ai_generations: number
  total_orders: number
  total_revenue: number
  top_styles: Array<{ style: TattooStyle; count: number }>
  top_placements: Array<{ placement: BodyPlacement; count: number }>
}

// ============================================================================
// API RESPONSE INTERFACES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
  meta?: PaginationMeta
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// ============================================================================
// SEARCH & FILTERING INTERFACES
// ============================================================================

export interface SearchFilters {
  styles?: TattooStyle[]
  placements?: BodyPlacement[]
  sizes?: TattooSize[]
  color_types?: ColorType[]
  sources?: DesignSource[]
  query?: string
  min_rating?: number
  featured_only?: boolean
  trending_only?: boolean
}

export interface SearchResult<T> {
  items: T[]
  total: number
  took_ms: number
  facets?: SearchFacets
}

export interface SearchFacets {
  styles: Array<{ value: TattooStyle; count: number }>
  placements: Array<{ value: BodyPlacement; count: number }>
  sizes: Array<{ value: TattooSize; count: number }>
  color_types: Array<{ value: ColorType; count: number }>
}

// ============================================================================
// EMAIL & NOTIFICATIONS INTERFACES
// ============================================================================

export interface EmailSubscriber {
  id: string
  email: string
  first_name?: string
  tattoo_interests: TattooStyle[]
  source: 'popup' | 'footer' | 'checkout' | 'social'
  hubspot_contact_id?: string
  is_subscribed: boolean
  unsubscribed_at?: Date
  created_at: Date
}

export interface NotificationPreferences {
  user_id: string
  email_marketing: boolean
  new_designs: boolean
  trending_alerts: boolean
  ai_generation_complete: boolean
  order_updates: boolean
  artist_matches: boolean
  referral_earnings: boolean
  updated_at: Date
}

// ============================================================================
// IMPORT & MIGRATION INTERFACES
// ============================================================================

export interface ArtistImportRow {
  name: string
  studio_name?: string
  city: string
  state: string
  country?: string
  styles: string
  instagram_handle?: string
  website_url?: string
  email?: string
  years_experience?: string
}

export interface ImportResult {
  total_rows: number
  success_count: number
  error_count: number
  duplicate_count: number
  errors: ImportError[]
}

export interface ImportError {
  row: number
  field: string
  message: string
  data: Record<string, any>
}