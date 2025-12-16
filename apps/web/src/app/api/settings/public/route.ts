import { NextResponse } from 'next/server';
import { prisma } from '@asuite/database';

export async function GET() {
    try {
        // Fetch public settings (non-sensitive ones)
        const settings = await prisma.systemSetting.findMany({
            where: {
                OR: [
                    { key: { startsWith: 'support.' } },
                    { key: { startsWith: 'general.' } },
                ],
            },
        });

        // Group by category
        const grouped: Record<string, Record<string, string>> = {};
        for (const setting of settings) {
            const [category, key] = setting.key.split('.');
            if (!grouped[category]) {
                grouped[category] = {};
            }
            grouped[category][key] = setting.value;
        }

        return NextResponse.json(grouped);
    } catch (error) {
        console.error('Error fetching public settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}
