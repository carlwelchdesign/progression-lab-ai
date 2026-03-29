/** @jest-environment node */

type MockDirent = {
  name: string;
  isDirectory: () => boolean;
  isFile: () => boolean;
};

const createDir = (name: string): MockDirent => ({
  name,
  isDirectory: () => true,
  isFile: () => false,
});

const createFile = (name: string): MockDirent => ({
  name,
  isDirectory: () => false,
  isFile: () => true,
});

var mockReaddir = jest.fn();

jest.mock('node:fs/promises', () => ({
  readdir: (...args: unknown[]) => mockReaddir(...args),
}));

import { GET } from '../route';

describe('GET /api/midi/drums', () => {
  beforeEach(() => {
    mockReaddir.mockReset();
    console.error = jest.fn();
  });

  it('lists drum midi files recursively, excluding non-midi and note folders', async () => {
    mockReaddir.mockImplementation(async (dir: string) => {
      if (dir.endsWith('/public/midi/drums')) {
        return [
          createDir('Rock'),
          createDir('files_34_68'),
          createFile('.DS_Store'),
          createFile('ignore.zip'),
        ];
      }

      if (dir.endsWith('/public/midi/drums/Rock')) {
        return [createDir('_notes'), createFile('Rock13.mid'), createFile('Rock.zip')];
      }

      if (dir.endsWith('/public/midi/drums/files_34_68')) {
        return [createFile('34time2.mid'), createFile('68time7.mid')];
      }

      if (dir.endsWith('/public/midi/drums/Rock/_notes')) {
        return [createFile('should-not-load.mid')];
      }

      return [];
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.files).toEqual(
      expect.arrayContaining([
        {
          path: '/midi/drums/Rock/Rock13.mid',
          label: 'Rock13',
          category: 'Rock',
          signatures: ['4/4'],
        },
        {
          path: '/midi/drums/files_34_68/34time2.mid',
          label: '34time2',
          category: 'files 34 68',
          signatures: ['3/4'],
        },
        {
          path: '/midi/drums/files_34_68/68time7.mid',
          label: '68time7',
          category: 'files 34 68',
          signatures: ['6/8'],
        },
      ]),
    );

    expect(body.files).toHaveLength(3);
    expect(body.files.some((file: { path: string }) => file.path.includes('_notes'))).toBe(false);
  });

  it('returns 500 when reading drum directory fails', async () => {
    mockReaddir.mockRejectedValue(new Error('boom'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ message: 'Failed to list drum files' });
  });
});
