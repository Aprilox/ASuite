import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking for unverified users...');

    const unverifiedUsers = await prisma.user.findMany({
        where: {
            emailVerified: null,
        },
    });

    console.log(`📊 Found ${unverifiedUsers.length} unverified users.`);

    if (unverifiedUsers.length === 0) {
        console.log('✅ All users are already verified.');
        return;
    }

    // En mode manuel interactif, on demanderait confirmation.
    // Ici nous allons simplement marquer tous les utilisateurs comme vérifiés.
    // Ce script est destiné à être exécuté par l'admin qui souhaite "whitelister" les utilisateurs actuels.

    console.log('🔄 Marking all existing unverified users as verified (Retroactive Verification)...');

    const updateResult = await prisma.user.updateMany({
        where: {
            emailVerified: null,
        },
        data: {
            emailVerified: new Date(),
        },
    });

    console.log(`✅ ${updateResult.count} users have been marked as verified.`);
    console.log('🛡️  You can now safely enable "Email Verification" in Admin Panel without blocking existing users.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
