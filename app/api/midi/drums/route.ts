import { NextResponse } from 'next/server';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

type DrumSignature = '4/4' | '3/4' | '6/8';

type DrumFileItem = {
  path: string;
  label: string;
  category: string;
  signatures: DrumSignature[];
};

const DRUMS_ROOT = path.join(process.cwd(), 'public', 'midi', 'drums');
const EXCLUDED_FILE_NAMES = new Set(['.DS_Store']);
const EXCLUDED_DIR_NAMES = new Set(['_notes']);

const inferSignatures = (fileName: string): DrumSignature[] => {
  const normalized = fileName.toLowerCase();
  if (normalized.includes('34time')) {
    return ['3/4'];
  }
  if (normalized.includes('68time')) {
    return ['6/8'];
  }

  return ['4/4'];
};

const buildLabel = (fileName: string): string => {
  const withoutExtension = fileName.replace(/\.mid$/i, '');
  return withoutExtension.replace(/[_-]+/g, ' ').trim();
};

const toCategoryName = (relativeDir: string): string =>
  relativeDir
    .split(path.sep)
    .filter(Boolean)
    .map((part) => part.replace(/[_-]+/g, ' '))
    .join(' / ');

const listMidiFilesRecursively = async (
  absoluteDir: string,
  relativeDir: string,
): Promise<DrumFileItem[]> => {
  const entries = await readdir(absoluteDir, { withFileTypes: true });
  const items: DrumFileItem[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIR_NAMES.has(entry.name)) {
        continue;
      }

      const nestedAbsoluteDir = path.join(absoluteDir, entry.name);
      const nestedRelativeDir = path.join(relativeDir, entry.name);
      const nestedItems = await listMidiFilesRecursively(nestedAbsoluteDir, nestedRelativeDir);
      items.push(...nestedItems);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (EXCLUDED_FILE_NAMES.has(entry.name)) {
      continue;
    }

    if (!entry.name.toLowerCase().endsWith('.mid')) {
      continue;
    }

    const publicPath = path
      .join('/midi', 'drums', relativeDir, entry.name)
      .split(path.sep)
      .join('/');

    items.push({
      path: publicPath,
      label: buildLabel(entry.name),
      category: toCategoryName(relativeDir),
      signatures: inferSignatures(entry.name),
    });
  }

  return items;
};

export async function GET() {
  try {
    const files = await listMidiFilesRecursively(DRUMS_ROOT, '');
    files.sort((a, b) => {
      const categoryCompare = a.category.localeCompare(b.category);
      if (categoryCompare !== 0) {
        return categoryCompare;
      }
      return a.label.localeCompare(b.label);
    });

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Failed to list metronome drum files:', error);
    return NextResponse.json({ message: 'Failed to list drum files' }, { status: 500 });
  }
}
