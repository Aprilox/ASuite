import { prisma } from '../src/client';

async function main() {
    console.log('🔍 Inspecting security settings...');

    const settings = await prisma.systemSetting.findMany({
        where: {
            category: 'security'
        }
    });

    console.table(settings.map(s => ({ key: s.key, value: s.value, type: s.type })));

    console.log('\n🛠️  Fixing settings...');

    // 1. Fix security_email_verification type to boolean
    const correctSetting = settings.find(s => s.key === 'security_email_verification');
    if (correctSetting) {
        if (correctSetting.type !== 'boolean') {
            await prisma.systemSetting.update({
                where: { id: correctSetting.id },
                data: { type: 'boolean' }
            });
            console.log('✅ Updated security_email_verification type to boolean');
        } else {
            console.log('✅ security_email_verification is already boolean');
        }
    }

    // 2. Remove security_require_email_verification if exists (since we use the shorter one)
    const oldSetting = settings.find(s => s.key === 'security_require_email_verification');
    if (oldSetting) {
        await prisma.systemSetting.delete({
            where: { id: oldSetting.id }
        });
        console.log('🗑️  Deleted deprecated security_require_email_verification');
    } else {
        console.log('✅ No security_require_email_verification found');
    }
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
