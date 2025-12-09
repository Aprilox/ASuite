import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ChangeEntry {
  type: 'feature' | 'security' | 'fix' | 'improvement';
  text: string;
}

interface VersionEntry {
  version: string;
  date: string;
  changes: ChangeEntry[];
}

function parseChangelog(content: string): VersionEntry[] {
  const versions: VersionEntry[] = [];
  const lines = content.split('\n');
  
  let currentVersion: VersionEntry | null = null;
  let currentType: 'feature' | 'security' | 'fix' | 'improvement' = 'feature';

  for (const line of lines) {
    // Match version header: ## [1.3.0] - 2025-01-09
    const versionMatch = line.match(/^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})/);
    if (versionMatch) {
      if (currentVersion) {
        versions.push(currentVersion);
      }
      currentVersion = {
        version: versionMatch[1],
        date: versionMatch[2],
        changes: [],
      };
      continue;
    }

    // Match section header: ### Nouveautés
    const sectionMatch = line.match(/^### (.+)/);
    if (sectionMatch) {
      const section = sectionMatch[1].toLowerCase();
      if (section.includes('nouveaut') || section.includes('feature')) {
        currentType = 'feature';
      } else if (section.includes('sécurit') || section.includes('security')) {
        currentType = 'security';
      } else if (section.includes('correction') || section.includes('fix')) {
        currentType = 'fix';
      } else if (section.includes('amélioration') || section.includes('improvement')) {
        currentType = 'improvement';
      }
      continue;
    }

    // Match list item: - Some change
    const itemMatch = line.match(/^- (.+)/);
    if (itemMatch && currentVersion) {
      currentVersion.changes.push({
        type: currentType,
        text: itemMatch[1],
      });
    }
  }

  // Don't forget the last version
  if (currentVersion) {
    versions.push(currentVersion);
  }

  return versions;
}

export async function GET() {
  try {
    // Try multiple possible paths for CHANGELOG.md
    const possiblePaths = [
      path.join(process.cwd(), 'CHANGELOG.md'),
      path.join(process.cwd(), '..', '..', 'CHANGELOG.md'),
      path.join(process.cwd(), '..', 'CHANGELOG.md'),
    ];

    let content = '';
    for (const filePath of possiblePaths) {
      try {
        if (fs.existsSync(filePath)) {
          content = fs.readFileSync(filePath, 'utf-8');
          break;
        }
      } catch {
        continue;
      }
    }

    if (!content) {
      return NextResponse.json({ versions: [] });
    }

    const versions = parseChangelog(content);
    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Error reading changelog:', error);
    return NextResponse.json({ versions: [] });
  }
}

