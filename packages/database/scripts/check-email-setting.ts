import { prisma } from '../src/client';

async function main() {
    const setting = await prisma.systemSetting.findFirst({
        where: { key: 'security_email_verification' }
    });

    if (setting) {
        console.log(`\n🔍 Current Database Value:`);
        console.log(`Key:   ${setting.key}`);
        console.log(`Value: ${setting.value} (Type: ${typeof setting.value})`);
        console.log(`DB Type: ${setting.type}`);
        console.log(`----------------------------------------`);
    } else {
        console.log('❌ Setting not found!');
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
