const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.identity.count();
    console.log('Identity count:', count);
    console.log('Database connection is working and tables exist!');
  } catch(e) {
    console.error('Error connecting or querying tables:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
