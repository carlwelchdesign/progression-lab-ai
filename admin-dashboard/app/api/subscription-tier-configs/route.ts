import { NextRequest, NextResponse } from 'next/server';

import { getAdminUserFromRequest } from '../../../lib/adminAccess';
import { getAllTierConfigs } from '../../../lib/subscriptionConfig';

/**
 * GET /api/subscription-tier-configs
 * Fetch all subscription tier configurations
 */
export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUserFromRequest(request);
    if (!adminUser) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const configs = await getAllTierConfigs();
    const configArray = Object.values(configs);
    return NextResponse.json({ items: configArray });
  } catch (error) {
    console.error('Failed to fetch tier configs:', error);
    return NextResponse.json({ message: 'Failed to fetch tier configurations' }, { status: 500 });
  }
}
