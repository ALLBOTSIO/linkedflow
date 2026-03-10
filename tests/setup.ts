/**
 * Copyright (c) 2026 LinkedFlow Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

import { beforeAll, afterAll } from 'vitest'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Global test setup
beforeAll(async () => {
  // Ensure test database is clean and up to date
  await execAsync('npx prisma db push --force-reset')
})

afterAll(async () => {
  // Clean up after all tests
  await execAsync('npx prisma db push --force-reset')
})