const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});

async function checkDB() {
  try {
    const identityCount = await prisma.identity.count();
    console.log('✅ Success! Identity table exists. Count:', identityCount);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}
checkDB();
