/**
 * Copyright (c) 2026 LinkedFlow Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

import { PrismaClient } from '@prisma/client'
import { pino } from 'pino'
import { config } from '../utils/config'


const logger = pino({ name: 'DatabaseClient' })

// Global Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined
}

// Create Prisma client with proper configuration
const createPrismaClient = () => {
  return new PrismaClient({
    log: config.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty'
  })
}

// Use singleton pattern for Prisma client
const prisma = globalThis.__prisma ?? createPrismaClient()

if (config.nodeEnv !== 'production') {
  globalThis.__prisma = prisma
}

// Graceful shutdown handlers
const gracefulShutdown = async () => {
  logger.info('Closing database connection...')
  await prisma.$disconnect()
  logger.info('Database connection closed')
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)
process.on('beforeExit', gracefulShutdown)

export default prisma