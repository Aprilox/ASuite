import { prisma } from '../src/client';

async function main() {
    console.log('🔍 Global search for any email verification settings...');

    // Search WITHOUT category filter
    const allSettings = await prisma.systemSetting.findMany({
        where: {
            key: {
                contains: 'email_verification'
            }
        }
    });

    console.log(`Found ${allSettings.length} matches:`);
    console.table(allSettings.map(s => ({
        id: s.id,
        key: s.key,
        value: s.value,
        type: s.type,
        category: s.category
    })));

    // Delete anything that strictly matches the OLD key
    const rogue = allSettings.find(s => s.key === 'security_require_email_verification');
    if (rogue) {
        console.log(`\n🎯 Found ROGUE setting with ID ${rogue.id}`);
        await prisma.systemSetting.delete({
            where: { id: rogue.id }
        });
        console.log('💥 ROGUE SETTING DESTROYED');
    } else {
        console.log('\n🤷 No setting with exact key "security_require_email_verification" found.');
        // Check for similar keys
        const similar = allSettings.filter(s => s.key !== 'security_email_verification');
        if (similar.length > 0) {
            console.log('⚠️ Found potential other rogue keys:');
            similar.forEach(s => console.log(` - ${s.key}`));
        }
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
