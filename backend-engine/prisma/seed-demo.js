/**
 * Demo Seed Script — Inserts a realistic batch with carbon logs
 * so the dashboard has data to display immediately.
 *
 * Usage: node prisma/seed-demo.js
 */

const { PrismaClient, BatchStage, VehicleType, EscrowStatus } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo data...\n');

  // 1. Create a demo manufacturer identity
  const manufacturer = await prisma.identity.upsert({
    where: { walletAddress: '0x59e12CfE55992Df21A2B0A57a93eC9d5f6d84523' },
    update: {},
    create: {
      walletAddress: '0x59e12CfE55992Df21A2B0A57a93eC9d5f6d84523',
      legalName: 'MST Supplier Pvt. Ltd.',
      entityType: 'SUPPLIER',
      kycDocCid: 'QmFakeKycDoc123',
      isVerified: true,
      verifiedBy: '0x0000000000000000000000000000000000000001',
    },
  });
  console.log('✅ Manufacturer identity created:', manufacturer.legalName);

  // 2. Create a demo batch
  const batch = await prisma.batch.create({
    data: {
      blockchainId: 1,
      gtin: '0123456789012',
      productName: 'Premium Organic Coffee Beans',
      originFacility: 'Bogota Highland Farms, Colombia',
      quantity: 500,
      unit: 'kg',
      weightTonnes: 0.5,
      stage: BatchStage.IN_TRANSIT,
      manufacturerId: manufacturer.id,
      currentCustodianId: manufacturer.id,
      mintTxHash: '0xabc123def456789000000000000000000000000000000000000000000000dead',
      mintedAt: new Date(),
    },
  });
  console.log('✅ Batch created:', batch.productName, '(ID:', batch.id, ')');

  // 3. Add a carbon log entry
  const carbonLog = await prisma.carbonLog.create({
    data: {
      batchId: batch.id,
      legIndex: 0,
      fromLocation: 'Bogota, Colombia',
      toLocation: 'Port of Buenaventura',
      distanceKm: 340,
      weightTonnes: 0.5,
      vehicleType: VehicleType.REFRIGERATED_TRUCK,
      transporterAddress: '0x59e12CfE55992Df21A2B0A57a93eC9d5f6d84523',
      emissionFactor: 0.1073,
      emissionsKg: 340 * 0.5 * 0.1073, // = 18.24 kg CO2
      txHash: '0xdef456abc789000000000000000000000000000000000000000000000000beef',
    },
  });
  console.log('✅ Carbon log created:', carbonLog.emissionsKg.toFixed(2), 'kg CO₂');

  // 4. Print the dashboard URL
  console.log('\n🎉 Demo data seeded successfully!');
  console.log(`\n👉 Open this URL in your browser:\n   http://localhost:3000/dashboard/${batch.id}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
