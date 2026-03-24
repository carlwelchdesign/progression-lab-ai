import {
  createProgression,
  getMyProgressions,
  getProgression,
  updateProgression,
  deleteProgression,
  getSharedProgression,
  getPublicProgressions,
} from './progressions';

// Mock fetch globally
global.fetch = jest.fn();

describe('progressions API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProgression', () => {
    it('should POST to /api/progressions with payload', async () => {
      const mockResponse = { id: '123', title: 'Test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const payload = {
        title: 'My Progression',
        chords: [{ name: 'C', beats: 4 }],
        isPublic: false,
      };

      const result = await createProgression(payload);

      expect(global.fetch).toHaveBeenCalledWith('/api/progressions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw with custom error when response not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid progression' }),
      });

      await expect(
        createProgression({
          title: 'Bad',
          chords: [],
          isPublic: false,
        }),
      ).rejects.toThrow('Invalid progression');
    });

    it('should throw with default message when response not ok and no message in body', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(
        createProgression({
          title: 'Bad',
          chords: [],
          isPublic: false,
        }),
      ).rejects.toThrow('Failed to save progression');
    });

    it('should use fallback error when response.json() throws', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(
        createProgression({
          title: 'Bad',
          chords: [],
          isPublic: false,
        }),
      ).rejects.toThrow('Failed to save progression');
    });
  });

  describe('getMyProgressions', () => {
    it('should GET /api/progressions', async () => {
      const mockResponse = [{ id: '1', title: 'Progression 1' }];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getMyProgressions();

      expect(global.fetch).toHaveBeenCalledWith('/api/progressions');
      expect(result).toEqual(mockResponse);
    });

    it('should throw with custom error when response not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(getMyProgressions()).rejects.toThrow('Unauthorized');
    });

    it('should use fallback error message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(getMyProgressions()).rejects.toThrow('Failed to fetch progressions');
    });
  });

  describe('getProgression', () => {
    it('should GET /api/progressions/{id}', async () => {
      const mockResponse = { id: '123', title: 'My Progression' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getProgression('123');

      expect(global.fetch).toHaveBeenCalledWith('/api/progressions/123');
      expect(result).toEqual(mockResponse);
    });

    it('should throw when progression not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Progression not found' }),
      });

      await expect(getProgression('nonexistent')).rejects.toThrow('Progression not found');
    });
  });

  describe('updateProgression', () => {
    it('should PUT to /api/progressions/{id} with payload', async () => {
      const mockResponse = { id: '123', title: 'Updated' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const payload = { title: 'Updated Title' };
      const result = await updateProgression('123', payload);

      expect(global.fetch).toHaveBeenCalledWith('/api/progressions/123', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw with custom error on failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Update failed' }),
      });

      await expect(updateProgression('123', { title: 'New' })).rejects.toThrow('Update failed');
    });
  });

  describe('deleteProgression', () => {
    it('should DELETE /api/progressions/{id}', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      await deleteProgression('123');

      expect(global.fetch).toHaveBeenCalledWith('/api/progressions/123', {
        method: 'DELETE',
      });
    });

    it('should throw with custom error on failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Cannot delete' }),
      });

      await expect(deleteProgression('123')).rejects.toThrow('Cannot delete');
    });

    it('should throw default error when response not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(deleteProgression('123')).rejects.toThrow('Failed to delete progression');
    });
  });

  describe('getSharedProgression', () => {
    it('should GET /api/shared/{shareId}', async () => {
      const mockResponse = { id: '123', title: 'Shared Progression', isPublic: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getSharedProgression('share-123');

      expect(global.fetch).toHaveBeenCalledWith('/api/shared/share-123');
      expect(result).toEqual(mockResponse);
    });

    it('should throw with custom error when progression not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Share link expired' }),
      });

      await expect(getSharedProgression('invalid')).rejects.toThrow('Share link expired');
    });
  });

  describe('getPublicProgressions', () => {
    it('should GET /api/shared without filters', async () => {
      const mockResponse: unknown = [{ id: '1', title: 'Public Progression' }];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getPublicProgressions();

      expect(global.fetch).toHaveBeenCalledWith('/api/shared');
      expect(result).toEqual(mockResponse);
    });

    it('should add tag filter to query string', async () => {
      const mockResponse: unknown = [];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await getPublicProgressions({ tags: ['jazz', 'blues'] });

      expect(global.fetch).toHaveBeenCalledWith('/api/shared?tag=jazz%2Cblues');
    });

    it('should add key filter to query string', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await getPublicProgressions({ keys: ['C', 'G'] });

      expect(global.fetch).toHaveBeenCalledWith('/api/shared?key=C%2CG');
    });

    it('should add both tag and key filters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await getPublicProgressions({ tags: ['jazz'], keys: ['Am'] });

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('tag=jazz'));
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('key=Am'));
    });

    it('should trim and deduplicate tags', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await getPublicProgressions({ tags: ['  jazz  ', 'jazz', 'blues', ''] });

      // Should only have 'jazz' once, not twice
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('tag='));
      const callArg = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callArg).toContain('tag=jazz%2Cblues');
    });

    it('should trim and deduplicate keys', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await getPublicProgressions({ keys: ['  C  ', 'C', 'G', ''] });

      const callArg = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callArg).toContain('key=C%2CG');
    });

    it('should skip empty filters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await getPublicProgressions({ tags: [''], keys: [''] });

      expect(global.fetch).toHaveBeenCalledWith('/api/shared');
    });

    it('should throw with custom error on failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Server error' }),
      });

      await expect(getPublicProgressions()).rejects.toThrow('Server error');
    });
  });
});
