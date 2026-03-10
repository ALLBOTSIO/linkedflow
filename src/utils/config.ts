/**
 * Copyright (c) 2026 LinkedFlow Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

import { LinkedFlowError } from '../types/errors'
import { ErrorCode } from '../types/enums'

export interface AppConfig {
  // Database
  databaseUrl: string

  // Redis
  redis: {
    host: string
    port: number
    password?: string
    db: number
  }

  // Encryption
  encryptionKey: string

  // LinkedIn Accounts
  linkedinAccounts: string[]

  // Proxy Configuration
  proxyList: ProxyConfig[]

  // Safety Limits
  dailyConnectionLimit: number
  dailyMessageLimit: number
  dailyViewLimit: number

  // Application
  nodeEnv: string
  port: number
  apiUrl: string

  // Logging
  logLevel: string

  // Worker
  workerConcurrency: number
  queueName: string

  // Session Management
  sessionActiveMin: number
  sessionActiveMax: number
  sessionRestMin: number
  sessionRestMax: number

  // Safety Thresholds
  captchaThreshold: number
  rateLimitThreshold: number
  sessionExpiredThreshold: number
}

interface ProxyConfig {
  host: string
  port: number
  username?: string
  password?: string
  type: 'http' | 'socks5'
}

class ConfigManager {
  private static instance: ConfigManager
  private config: AppConfig

  private constructor() {
    this.config = this.loadConfig()
    this.validateConfig()
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  public getConfig(): AppConfig {
    return { ...this.config }
  }

  private loadConfig(): AppConfig {
    return {
      // Database
      databaseUrl: this.getEnvVar('DATABASE_URL', 'file:./dev.db'),

      // Redis
      redis: this.parseRedisConfig(),

      // Encryption
      encryptionKey: this.getEnvVar('ENCRYPTION_KEY'),

      // LinkedIn Accounts
      linkedinAccounts: this.parseStringArray(this.getEnvVar('LINKEDIN_ACCOUNTS', '')),

      // Proxy Configuration
      proxyList: this.parseProxyList(this.getEnvVar('PROXY_LIST', '')),

      // Safety Limits
      dailyConnectionLimit: this.parseNumber('DAILY_CONNECTION_LIMIT', 50),
      dailyMessageLimit: this.parseNumber('DAILY_MESSAGE_LIMIT', 30),
      dailyViewLimit: this.parseNumber('DAILY_VIEW_LIMIT', 100),

      // Application
      nodeEnv: this.getEnvVar('NODE_ENV', 'development'),
      port: this.parseNumber('PORT', 3000),
      apiUrl: this.getEnvVar('NEXT_PUBLIC_API_URL', 'http://localhost:3000/api'),

      // Logging
      logLevel: this.getEnvVar('LOG_LEVEL', 'info'),

      // Worker
      workerConcurrency: this.parseNumber('WORKER_CONCURRENCY', 3),
      queueName: this.getEnvVar('QUEUE_NAME', 'linkedflow_actions'),

      // Session Management
      sessionActiveMin: this.parseNumber('SESSION_ACTIVE_MIN', 30),
      sessionActiveMax: this.parseNumber('SESSION_ACTIVE_MAX', 90),
      sessionRestMin: this.parseNumber('SESSION_REST_MIN', 15),
      sessionRestMax: this.parseNumber('SESSION_REST_MAX', 60),

      // Safety Thresholds
      captchaThreshold: this.parseNumber('CAPTCHA_THRESHOLD', 3),
      rateLimitThreshold: this.parseNumber('RATE_LIMIT_THRESHOLD', 5),
      sessionExpiredThreshold: this.parseNumber('SESSION_EXPIRED_THRESHOLD', 10)
    }
  }

  private validateConfig(): void {
    const errors: string[] = []

    // Validate encryption key
    if (!this.config.encryptionKey) {
      errors.push('ENCRYPTION_KEY is required')
    } else if (this.config.encryptionKey === 'your-256-bit-aes-encryption-key-here') {
      errors.push('ENCRYPTION_KEY must be changed from default value')
    } else {
      // Validate key format and length
      if (this.config.encryptionKey.length === 64) {
        // Hex string (32 bytes = 64 hex chars)
        if (!/^[a-fA-F0-9]{64}$/.test(this.config.encryptionKey)) {
          errors.push('ENCRYPTION_KEY must be a valid 64-character hex string or 32-byte string')
        }
      } else if (this.config.encryptionKey.length !== 32) {
        errors.push('ENCRYPTION_KEY must be exactly 32 bytes (or 64 hex characters)')
      }
    }

    // Validate database URL
    if (!this.config.databaseUrl) {
      errors.push('DATABASE_URL is required')
    }

    // Validate Redis configuration
    if (!this.config.redis.host) {
      errors.push('Redis host is required')
    }
    if (this.config.redis.port <= 0 || this.config.redis.port > 65535) {
      errors.push('Redis port must be between 1 and 65535')
    }

    // Validate numerical values
    if (this.config.dailyConnectionLimit <= 0) {
      errors.push('DAILY_CONNECTION_LIMIT must be positive')
    }

    if (this.config.dailyMessageLimit <= 0) {
      errors.push('DAILY_MESSAGE_LIMIT must be positive')
    }

    if (this.config.dailyViewLimit <= 0) {
      errors.push('DAILY_VIEW_LIMIT must be positive')
    }

    if (this.config.port <= 0 || this.config.port > 65535) {
      errors.push('PORT must be between 1 and 65535')
    }

    if (this.config.workerConcurrency <= 0) {
      errors.push('WORKER_CONCURRENCY must be positive')
    }

    // Validate session timing
    if (this.config.sessionActiveMin >= this.config.sessionActiveMax) {
      errors.push('SESSION_ACTIVE_MIN must be less than SESSION_ACTIVE_MAX')
    }

    if (this.config.sessionRestMin >= this.config.sessionRestMax) {
      errors.push('SESSION_REST_MIN must be less than SESSION_REST_MAX')
    }

    // Validate log level
    const validLogLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']
    if (!validLogLevels.includes(this.config.logLevel)) {
      errors.push(`LOG_LEVEL must be one of: ${validLogLevels.join(', ')}`)
    }

    // Validate environment
    const validEnvironments = ['development', 'staging', 'production']
    if (!validEnvironments.includes(this.config.nodeEnv)) {
      errors.push(`NODE_ENV must be one of: ${validEnvironments.join(', ')}`)
    }

    if (errors.length > 0) {
      throw new LinkedFlowError(
        ErrorCode.CONFIGURATION_ERROR,
        'Configuration validation failed',
        { errors }
      )
    }
  }

  private getEnvVar(name: string, defaultValue?: string): string {
    const value = process.env[name]

    if (value === undefined || value === '') {
      if (defaultValue !== undefined) {
        return defaultValue
      }
      throw new LinkedFlowError(
        ErrorCode.CONFIGURATION_ERROR,
        `Environment variable ${name} is required`,
        { variable: name }
      )
    }

    return value
  }

  private parseNumber(name: string, defaultValue: number): number {
    const value = process.env[name]

    if (value === undefined || value === '') {
      return defaultValue
    }

    const parsed = parseInt(value, 10)
    if (isNaN(parsed)) {
      throw new LinkedFlowError(
        ErrorCode.CONFIGURATION_ERROR,
        `Environment variable ${name} must be a valid number`,
        { variable: name, value }
      )
    }

    return parsed
  }

  private parseStringArray(value: string): string[] {
    if (!value) return []
    return value.split(',').map(s => s.trim()).filter(s => s.length > 0)
  }

  private parseProxyList(value: string): ProxyConfig[] {
    if (!value) return []

    const proxies: ProxyConfig[] = []
    const proxyStrings = value.split(',').map(s => s.trim()).filter(s => s.length > 0)

    for (const proxyString of proxyStrings) {
      const parts = proxyString.split(':')

      if (parts.length < 2) {
        throw new LinkedFlowError(
          ErrorCode.CONFIGURATION_ERROR,
          'Invalid proxy format. Expected format: host:port or host:port:username:password',
          { proxyString }
        )
      }

      const host = parts[0]
      const port = parseInt(parts[1], 10)

      if (isNaN(port) || port <= 0 || port > 65535) {
        throw new LinkedFlowError(
          ErrorCode.CONFIGURATION_ERROR,
          'Invalid proxy port',
          { proxyString, port: parts[1] }
        )
      }

      const proxy: ProxyConfig = {
        host,
        port,
        type: 'http'
      }

      if (parts.length >= 4) {
        proxy.username = parts[2]
        proxy.password = parts[3]
      }

      proxies.push(proxy)
    }

    return proxies
  }

  private parseRedisConfig(): { host: string; port: number; password?: string; db: number } {
    const redisUrl = this.getEnvVar('REDIS_URL', 'redis://localhost:6379/0');

    try {
      const url = new URL(redisUrl);

      return {
        host: url.hostname || 'localhost',
        port: parseInt(url.port) || 6379,
        password: url.password || undefined,
        db: parseInt(url.pathname.slice(1)) || 0
      };
    } catch (error) {
      // Fallback to individual env vars if URL parsing fails
      return {
        host: this.getEnvVar('REDIS_HOST', 'localhost'),
        port: this.parseNumber('REDIS_PORT', 6379),
        password: process.env.REDIS_PASSWORD || undefined,
        db: this.parseNumber('REDIS_DB', 0)
      };
    }
  }
}

// Export singleton instance
export const config = ConfigManager.getInstance().getConfig()

// Export helper functions
export function getConfig(): AppConfig {
  return ConfigManager.getInstance().getConfig()
}

export function validateEncryptionKey(key: string): boolean {
  if (!key) return false

  if (key.length === 64) {
    // Hex string
    return /^[a-fA-F0-9]{64}$/.test(key)
  } else if (key.length === 32) {
    // 32-byte string
    return true
  }

  return false
}

export function generateSecureKey(): string {
  const crypto = require('crypto')
  return crypto.randomBytes(32).toString('hex')
}