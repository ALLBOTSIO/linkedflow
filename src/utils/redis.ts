/**
 * Copyright (c) 2026 LinkedFlow Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

import Redis, { Redis as RedisClient } from 'ioredis';
import { logger } from './logger';
import { config } from './config';

/**
 * Redis client singleton for LinkedFlow
 * Handles connections, reconnection, and structured key management
 */
class RedisClientManager {
  private client: RedisClient | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 2000; // 2 seconds

  constructor() {
    this.initializeClient();
  }

  /**
   * Initialize Redis client with connection management
   */
  private initializeClient(): void {
    if (this.client || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      this.client = new Redis({
        host: config.redis.host || 'localhost',
        port: config.redis.port || 6379,
        password: config.redis.password,
        db: config.redis.db || 0,
        retryDelayOnFailover: 1000,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        reconnectOnError: (err) => {
          logger.warn('Redis reconnect on error', { error: err.message });
          return err.message.includes('READONLY');
        }
      });

      this.setupEventHandlers();
      this.client.connect().catch(this.handleConnectionError.bind(this));

    } catch (error) {
      this.handleConnectionError(error);
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Setup Redis client event handlers
   */
  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('connect', () => {
      logger.info('Redis client connected');
      this.reconnectAttempts = 0;
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error', { error: error.message });
    });

    this.client.on('close', () => {
      logger.warn('Redis client connection closed');
    });

    this.client.on('reconnecting', (delay) => {
      logger.info('Redis client reconnecting', { delay });
    });

    this.client.on('end', () => {
      logger.warn('Redis client connection ended');
      this.client = null;
      this.scheduleReconnect();
    });
  }

  /**
   * Handle connection errors with exponential backoff
   */
  private handleConnectionError(error: any): void {
    logger.error('Redis connection failed', {
      error: error.message,
      attempt: this.reconnectAttempts + 1,
      maxAttempts: this.maxReconnectAttempts
    });

    this.client = null;
    this.isConnecting = false;
    this.scheduleReconnect();
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max Redis reconnection attempts reached', {
        attempts: this.reconnectAttempts
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    logger.info('Scheduling Redis reconnect', {
      delay,
      attempt: this.reconnectAttempts
    });

    setTimeout(() => {
      this.initializeClient();
    }, delay);
  }

  /**
   * Get Redis client with fail-safe fallback
   */
  public getClient(): RedisClient {
    if (!this.client) {
      logger.warn('Redis client not available, attempting reconnection');
      this.initializeClient();

      // Return a mock client that fails gracefully
      return this.createFailSafeClient();
    }

    return this.client;
  }

  /**
   * Create a fail-safe Redis client that returns safe defaults
   */
  private createFailSafeClient(): RedisClient {
    const failSafeClient = {
      get: async () => null,
      set: async () => 'OK',
      hget: async () => null,
      hset: async () => 1,
      hgetall: async () => ({}),
      hincrby: async () => 1,
      del: async () => 1,
      expire: async () => 1,
      expireat: async () => 1,
      exists: async () => 0,
      ttl: async () => -1,
      disconnect: async () => undefined
    } as any;

    logger.warn('Using fail-safe Redis client');
    return failSafeClient;
  }

  /**
   * Check if Redis is connected
   */
  public isConnected(): boolean {
    return this.client?.status === 'ready';
  }

  /**
   * Gracefully disconnect Redis client
   */
  public async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.disconnect();
        logger.info('Redis client disconnected gracefully');
      } catch (error) {
        logger.error('Error disconnecting Redis client', { error: error.message });
      }
      this.client = null;
    }
  }

  /**
   * Health check for Redis connection
   */
  public async healthCheck(): Promise<{ status: string; latency?: number }> {
    if (!this.client) {
      return { status: 'disconnected' };
    }

    try {
      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;

      return {
        status: 'connected',
        latency
      };

    } catch (error) {
      logger.error('Redis health check failed', { error: error.message });
      return { status: 'error' };
    }
  }
}

// Singleton instance
const redisManager = new RedisClientManager();

// Export the client instance
export const redisClient = redisManager.getClient();

// Export manager methods for health checks and disconnect
export const isRedisConnected = () => redisManager.isConnected();
export const disconnectRedis = () => redisManager.disconnect();
export const redisHealthCheck = () => redisManager.healthCheck();

/**
 * Structured Redis key builders for consistent naming
 */
export const RedisKeys = {
  // Safety Engine keys
  safety: {
    session: (accountId: string) => `safety:session:${accountId}`,
    counters: {
      daily: (accountId: string, date: string) => `safety:counters:${accountId}:${date}`,
      weekly: (accountId: string, week: string) => `safety:weekly:${accountId}:${week}`
    },
    locks: (accountId: string) => `safety:lock:${accountId}`
  },

  // Concurrency Guard keys
  concurrency: {
    lock: (accountId: string) => `concurrency:lock:${accountId}`,
    queue: (accountId: string) => `concurrency:queue:${accountId}`
  },

  // BullMQ queue keys (managed by BullMQ)
  queues: {
    actions: 'linkedflow:actions',
    inbox: 'linkedflow:inbox'
  },

  // Campaign engine keys
  campaign: {
    state: (leadId: string) => `campaign:state:${leadId}`,
    schedule: (leadId: string) => `campaign:schedule:${leadId}`
  },

  // Browser session keys
  browser: {
    session: (accountId: string) => `browser:session:${accountId}`,
    fingerprint: (accountId: string) => `browser:fingerprint:${accountId}`
  }
};

/**
 * Redis utility functions
 */
export const RedisUtils = {
  /**
   * Set key with TTL in seconds
   */
  async setWithTTL(key: string, value: string, ttlSeconds: number): Promise<void> {
    await redisClient.setex(key, ttlSeconds, value);
  },

  /**
   * Increment counter with optional TTL
   */
  async incrementCounter(key: string, field: string, ttlSeconds?: number): Promise<number> {
    const result = await redisClient.hincrby(key, field, 1);
    if (ttlSeconds && result === 1) {
      // Set TTL only if this is the first increment
      await redisClient.expire(key, ttlSeconds);
    }
    return result;
  },

  /**
   * Get hash field with default value
   */
  async getHashField(key: string, field: string, defaultValue = '0'): Promise<string> {
    const value = await redisClient.hget(key, field);
    return value || defaultValue;
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await redisClient.exists(key);
    return result === 1;
  },

  /**
   * Get TTL for key
   */
  async getTTL(key: string): Promise<number> {
    return redisClient.ttl(key);
  },

  /**
   * Safely delete key
   */
  async deleteKey(key: string): Promise<boolean> {
    const result = await redisClient.del(key);
    return result === 1;
  }
};

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing Redis connection');
  await disconnectRedis();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing Redis connection');
  await disconnectRedis();
});

export default redisClient;