import { NextResponse } from 'next/server';

import { getPublicActivePlans } from '../../../lib/pricingConfig';

export async function GET() {
  try {
    const plans = await getPublicActivePlans();
    return NextResponse.json({ items: plans });
  } catch (error) {
    console.error('Failed to fetch pricing tier configs:', error);
    return NextResponse.json({ message: 'Failed to fetch pricing tier configs' }, { status: 500 });
  }
}
