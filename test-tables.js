// Test direct PostgreSQL connection without Prisma
const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    connectionString: 'postgresql://linkedflow:linkedflow_dev_password@localhost:5432/linkedflow'
  });

  try {
    await client.connect();
    console.log('✅ Direct PostgreSQL connection successful');

    // List tables
    const result = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    console.log('📋 Tables found:', result.rows.map(r => r.tablename));

    // Test a simple query
    const orgCount = await client.query('SELECT COUNT(*) FROM organizations');
    console.log('✅ Organizations table query successful, count:', orgCount.rows[0].count);

    await client.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection()