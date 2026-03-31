import { NextRequest, NextResponse } from 'next/server';

import {
  getPublishedMarketingContent,
  resolvePublicMarketingContentKey,
} from '../../../../lib/marketingContentPublic';

export async function GET(request: NextRequest) {
  try {
    const rawKey = request.nextUrl.searchParams.get('contentKey') ?? '';
    const locale = request.nextUrl.searchParams.get('locale') ?? 'en';
    const contentKey = resolvePublicMarketingContentKey(rawKey.trim());

    if (!contentKey) {
      return NextResponse.json({ message: 'Invalid contentKey' }, { status: 400 });
    }

    const item = await getPublishedMarketingContent({ contentKey, locale });

    if (!item) {
      return NextResponse.json({ item: null }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Failed to fetch public marketing content:', error);
    return NextResponse.json(
      { message: 'Failed to fetch public marketing content' },
      { status: 500 },
    );
  }
}
