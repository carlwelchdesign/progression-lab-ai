import { createCsrfHeaders, ensureCsrfCookie } from '../../../lib/csrfClient';
import type { CreateArrangementRequest, UpdateArrangementRequest } from '../../../lib/types';

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { message?: string; detail?: string };
    if (body.message && body.detail) {
      return `${body.message}: ${body.detail}`;
    }

    return body.message || body.detail || fallback;
  } catch {
    return fallback;
  }
}

export async function createArrangement(payload: CreateArrangementRequest) {
  await ensureCsrfCookie();
  const response = await fetch('/api/arrangements', {
    method: 'POST',
    headers: createCsrfHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to save arrangement'));
  }

  return response.json();
}

export async function getMyArrangements() {
  const response = await fetch('/api/arrangements');

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch arrangements'));
  }

  return response.json();
}

export async function getArrangement(id: string) {
  const response = await fetch(`/api/arrangements/${id}`);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch arrangement'));
  }

  return response.json();
}

export async function updateArrangement(id: string, payload: UpdateArrangementRequest) {
  await ensureCsrfCookie();
  const response = await fetch(`/api/arrangements/${id}`, {
    method: 'PUT',
    headers: createCsrfHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to update arrangement'));
  }

  return response.json();
}

export async function deleteArrangement(id: string) {
  await ensureCsrfCookie();
  const response = await fetch(`/api/arrangements/${id}`, {
    method: 'DELETE',
    headers: createCsrfHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to delete arrangement'));
  }
}

export async function getSharedArrangement(shareId: string) {
  const response = await fetch(`/api/shared-arrangements/${shareId}`);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch shared arrangement'));
  }

  return response.json();
}
