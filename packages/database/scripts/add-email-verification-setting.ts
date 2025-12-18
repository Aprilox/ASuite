import { prisma } from '../src/client';

async function main() {
    console.log('🔧 Adding email verification setting...');

    // Check if setting already exists
    const existing = await prisma.systemSetting.findFirst({
        where: {
            key: 'security_email_verification',
        },
    });

    if (existing) {
        console.log('✅ Email verification setting already exists');
        return;
    }

    // Create the setting
    await prisma.systemSetting.create({
        data: {
            key: 'security_email_verification',
            value: 'false',
            category: 'security',
        },
    });

    console.log('✅ Email verification setting added successfully');
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
