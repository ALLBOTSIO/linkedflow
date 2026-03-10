/**
 * Copyright (c) 2026 LinkedFlow Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

import { pino } from 'pino'
import { config } from './config'


// Create logger instance with proper configuration
export const logger = pino({
  name: 'LinkedFlowWorker',
  level: config.logLevel || 'info',
  transport: config.nodeEnv === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined
})