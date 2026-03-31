import type {
  PublicMarketingContentKey,
  PublicMarketingContentResult,
} from './marketingContentPublic';

export async function fetchPublishedMarketingContent(
  contentKey: PublicMarketingContentKey,
  locale: string,
): Promise<PublicMarketingContentResult | null> {
  const searchParams = new URLSearchParams({ contentKey, locale });
  const response = await fetch(`/api/marketing-content/public?${searchParams.toString()}`, {
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch marketing content');
  }

  const body = (await response.json()) as { item: PublicMarketingContentResult | null };
  return body.item;
}
