import { SubscriptionPlan } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { getAdminUserFromRequest } from '../../../../lib/adminAccess';
import { checkCsrfToken } from '../../../../lib/csrf';
import { updateTierConfig } from '../../../../lib/subscriptionConfig';

/**
 * PATCH /api/subscription-tier-configs/:plan
 * Update a specific subscription tier configuration (ADMIN only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ plan: string }> },
) {
  try {
    const adminUser = await getAdminUserFromRequest(request);
    if (!adminUser) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Only ADMIN can modify tier configurations' },
        { status: 403 },
      );
    }

    const { plan } = await params;

    if (!plan || !Object.values(SubscriptionPlan).includes(plan as SubscriptionPlan)) {
      return NextResponse.json({ message: 'Invalid subscription plan' }, { status: 400 });
    }

    // Check CSRF token
    const csrfValid = await checkCsrfToken(request);
    if (!csrfValid) {
      return NextResponse.json({ message: 'CSRF validation failed' }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    // Validate and sanitize input
    const updates: Record<string, unknown> = {};

    if (body.gptModel !== undefined) {
      if (typeof body.gptModel !== 'string' || !body.gptModel.trim()) {
        return NextResponse.json({ message: 'Invalid gptModel' }, { status: 400 });
      }
      updates.gptModel = body.gptModel.trim();
    }

    if (body.aiGenerationsPerMonth !== undefined) {
      if (body.aiGenerationsPerMonth !== null && typeof body.aiGenerationsPerMonth !== 'number') {
        return NextResponse.json({ message: 'Invalid aiGenerationsPerMonth' }, { status: 400 });
      }
      updates.aiGenerationsPerMonth = body.aiGenerationsPerMonth;
    }

    if (body.maxSavedProgressions !== undefined) {
      if (body.maxSavedProgressions !== null && typeof body.maxSavedProgressions !== 'number') {
        return NextResponse.json({ message: 'Invalid maxSavedProgressions' }, { status: 400 });
      }
      updates.maxSavedProgressions = body.maxSavedProgressions;
    }

    if (body.maxSavedArrangements !== undefined) {
      if (body.maxSavedArrangements !== null && typeof body.maxSavedArrangements !== 'number') {
        return NextResponse.json({ message: 'Invalid maxSavedArrangements' }, { status: 400 });
      }
      updates.maxSavedArrangements = body.maxSavedArrangements;
    }

    if (body.maxPublicShares !== undefined) {
      if (body.maxPublicShares !== null && typeof body.maxPublicShares !== 'number') {
        return NextResponse.json({ message: 'Invalid maxPublicShares' }, { status: 400 });
      }
      updates.maxPublicShares = body.maxPublicShares;
    }

    if (body.canExportMidi !== undefined) {
      if (typeof body.canExportMidi !== 'boolean') {
        return NextResponse.json({ message: 'Invalid canExportMidi' }, { status: 400 });
      }
      updates.canExportMidi = body.canExportMidi;
    }

    if (body.canExportPdf !== undefined) {
      if (typeof body.canExportPdf !== 'boolean') {
        return NextResponse.json({ message: 'Invalid canExportPdf' }, { status: 400 });
      }
      updates.canExportPdf = body.canExportPdf;
    }

    if (body.canSharePublicly !== undefined) {
      if (typeof body.canSharePublicly !== 'boolean') {
        return NextResponse.json({ message: 'Invalid canSharePublicly' }, { status: 400 });
      }
      updates.canSharePublicly = body.canSharePublicly;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'No valid updates provided' }, { status: 400 });
    }

    const updated = await updateTierConfig(
      plan as SubscriptionPlan,
      updates as Parameters<typeof updateTierConfig>[1],
    );

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error('Failed to update tier config:', error);
    return NextResponse.json({ message: 'Failed to update tier configuration' }, { status: 500 });
  }
}
