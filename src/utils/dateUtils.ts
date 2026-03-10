/**
 * Copyright (c) 2026 LinkedFlow Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

/**
 * Format distance from now (e.g., "2 hours", "3 days", "1 week")
 */
export function formatDistanceToNow(date: Date | string): string {
  const now = new Date()
  const target = new Date(date)
  const diffMs = now.getTime() - target.getTime()

  const minute = 60 * 1000
  const hour = minute * 60
  const day = hour * 24
  const week = day * 7
  const month = day * 30
  const year = day * 365

  if (diffMs < minute) {
    return 'just now'
  } else if (diffMs < hour) {
    const minutes = Math.floor(diffMs / minute)
    return `${minutes} minute${minutes === 1 ? '' : 's'}`
  } else if (diffMs < day) {
    const hours = Math.floor(diffMs / hour)
    return `${hours} hour${hours === 1 ? '' : 's'}`
  } else if (diffMs < week) {
    const days = Math.floor(diffMs / day)
    return `${days} day${days === 1 ? '' : 's'}`
  } else if (diffMs < month) {
    const weeks = Math.floor(diffMs / week)
    return `${weeks} week${weeks === 1 ? '' : 's'}`
  } else if (diffMs < year) {
    const months = Math.floor(diffMs / month)
    return `${months} month${months === 1 ? '' : 's'}`
  } else {
    const years = Math.floor(diffMs / year)
    return `${years} year${years === 1 ? '' : 's'}`
  }
}

/**
 * Format date for display (e.g., "Jan 15, 2024 at 2:30 PM")
 */
export function formatDate(date: Date | string): string {
  const target = new Date(date)
  return target.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Format date for short display (e.g., "Jan 15")
 */
export function formatDateShort(date: Date | string): string {
  const target = new Date(date)
  return target.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format time for display (e.g., "2:30 PM")
 */
export function formatTime(date: Date | string): string {
  const target = new Date(date)
  return target.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
  const target = new Date(date)
  const today = new Date()

  return target.getDate() === today.getDate() &&
    target.getMonth() === today.getMonth() &&
    target.getFullYear() === today.getFullYear()
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: Date | string): boolean {
  const target = new Date(date)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  return target.getDate() === yesterday.getDate() &&
    target.getMonth() === yesterday.getMonth() &&
    target.getFullYear() === yesterday.getFullYear()
}