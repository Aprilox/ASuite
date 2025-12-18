import { prisma } from '../src/client';

async function main() {
    console.log('📝 Dumping ALL SystemSettings...');

    const settings = await prisma.systemSetting.findMany({
        orderBy: { key: 'asc' }
    });

    console.log(`\nTotal Settings: ${settings.length}\n`);

    settings.forEach(s => {
        console.log(`[${s.id}] ${s.key} (${s.type}) = ${s.value}`);
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
