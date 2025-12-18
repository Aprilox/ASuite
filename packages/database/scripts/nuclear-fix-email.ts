import { prisma } from '../src/client';

async function main() {
    console.log('☢️  NUCLEAR OPTION: Deleting ALL email verification settings...');

    const deleted = await prisma.systemSetting.deleteMany({
        where: {
            key: { contains: 'email_verification' }
        }
    });

    console.log(`💥 Deleted ${deleted.count} settings.`);

    console.log('🆕 Re-creating correct setting...');

    await prisma.systemSetting.create({
        data: {
            key: 'security_email_verification',
            value: 'false',
            type: 'boolean',
            category: 'security',
            label: 'Vérification email requise' // Optional label fallback
        }
    });

    console.log('✅ Created clean security_email_verification setting.');

    // Verify
    const verify = await prisma.systemSetting.findFirst({
        where: { key: 'security_email_verification' }
    });
    console.log('🔍 Verification:', verify);
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
