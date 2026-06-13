const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const count = await prisma.identity.count();
    console.log('Identity count:', count);
    console.log('Database connection is working and tables exist!');
  } catch(e) {
    console.error('Error connecting or querying tables:', e.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
