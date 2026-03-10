const { PrismaClient } = require('@prisma/client')

async function testConnection() {
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: 'postgresql://linkedflow:linkedflow_dev_password@localhost:5432/linkedflow'
        }
      }
    })

    await prisma.$connect()
    console.log('✅ Database connection successful')

    // Try a raw query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Query successful:', result)

    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    process.exit(1)
  }
}

testConnection()