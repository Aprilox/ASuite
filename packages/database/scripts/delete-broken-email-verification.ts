import { prisma } from '../src/client';

async function main() {
    console.log('🗑️  Deleting broken email verification setting...');

    // Delete the old/broken setting
    const deleted = await prisma.systemSetting.deleteMany({
        where: {
            key: 'security_require_email_verification'
        }
    });

    console.log(`✅ Deleted ${deleted.count} setting(s) with key: security_require_email_verification`);

    // Verify remaining settings
    const remaining = await prisma.systemSetting.findMany({
        where: {
            key: {
                contains: 'email_verification'
            }
        }
    });

    console.log(`\n📋 Remaining email verification settings: ${remaining.length}`);
    remaining.forEach(s => {
        console.log(`  - ${s.key}: ${s.value}`);
    });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Error:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
