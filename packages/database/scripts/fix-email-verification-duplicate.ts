import { prisma } from '../src/client';

async function main() {
    console.log('🔍 Checking for duplicate email verification settings...');

    // Find all email verification related settings
    const settings = await prisma.systemSetting.findMany({
        where: {
            OR: [
                { key: 'security_email_verification' },
                { key: 'security_require_email_verification' }
            ]
        },
        orderBy: {
            createdAt: 'asc'
        }
    });

    console.log(`Found ${settings.length} email verification setting(s):`);
    settings.forEach(s => {
        console.log(`  - ${s.key}: ${s.value} (created: ${s.createdAt})`);
    });

    if (settings.length > 1) {
        console.log('\n🧹 Removing duplicate...');

        // Keep security_email_verification, remove security_require_email_verification
        const toDelete = settings.find(s => s.key === 'security_require_email_verification');

        if (toDelete) {
            await prisma.systemSetting.delete({
                where: { id: toDelete.id }
            });
            console.log(`✅ Deleted duplicate: ${toDelete.key}`);
        }
    } else if (settings.length === 1) {
        const setting = settings[0];

        // If the only one is the old key, rename it
        if (setting.key === 'security_require_email_verification') {
            await prisma.systemSetting.update({
                where: { id: setting.id },
                data: { key: 'security_email_verification' }
            });
            console.log('✅ Renamed security_require_email_verification to security_email_verification');
        } else {
            console.log('✅ Already using correct key: security_email_verification');
        }
    }

    console.log('\n✅ Cleanup complete!');
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
