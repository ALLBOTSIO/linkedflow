// Load environment explicitly
require('fs').readFileSync('.env', 'utf8').split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    process.env[key] = value.replace(/"/g, '');
  }
});

const { Client } = require('pg');

console.log('DATABASE_URL:', process.env.DATABASE_URL);

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Direct PostgreSQL connection successful');

    const result = await client.query('SELECT COUNT(*) FROM organizations');
    console.log('✅ Organizations table query successful, count:', result.rows[0].count);

    await client.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection()