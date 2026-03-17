import type {
  CreateProgressionRequest,
  ProgressionPayload,
  UpdateProgressionRequest,
} from '@/lib/types';

export async function createProgression(payload: CreateProgressionRequest) {
  const response = await fetch('/api/progressions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to save progression');
  }

  return response.json();
}

export async function getMyProgressions() {
  const response = await fetch('/api/progressions');

  if (!response.ok) {
    throw new Error('Failed to fetch progressions');
  }

  return response.json();
}

export async function getProgression(id: string) {
  const response = await fetch(`/api/progressions/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch progression');
  }

  return response.json();
}

export async function updateProgression(
  id: string,
  payload: UpdateProgressionRequest
) {
  const response = await fetch(`/api/progressions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to update progression');
  }

  return response.json();
}

export async function deleteProgression(id: string) {
  const response = await fetch(`/api/progressions/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete progression');
  }
}

export async function getSharedProgression(shareId: string) {
  const response = await fetch(`/api/shared/${shareId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch shared progression');
  }

  return response.json();
}
