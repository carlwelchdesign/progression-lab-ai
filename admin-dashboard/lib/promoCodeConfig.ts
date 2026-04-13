/**
 * Promo code generator that respects admin configuration.
 * Follows Dependency Inversion: depends on config interface, not concrete words.
 */

export interface PromoCodeConfig {
  prefixes: string;
  suffixLength: number;
  separator: string;
}

/**
 * Generate a promo code based on business-configurable prefixes.
 * Decoupled from any specific business domain.
 */
export function generatePromoCode(config: PromoCodeConfig): string {
  const prefixes = config.prefixes
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (prefixes.length === 0) {
    throw new Error('No prefixes configured for promo code generation');
  }

  const word = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.random()
    .toString(36)
    .substring(2, 2 + config.suffixLength)
    .toUpperCase();

  return `${word}${config.separator}${suffix}`;
}

/**
 * Fetch current promo code config from API.
 * This allows the component to stay in sync if admin changes settings.
 */
export async function fetchPromoCodeConfig(): Promise<PromoCodeConfig> {
  const response = await fetch('/api/promo-codes/config');
  if (!response.ok) {
    throw new Error('Failed to fetch promo code config');
  }
  return response.json();
}

/**
 * Update promo code config.
 * Admin use case: change prefix strategy without code deployment.
 */
export async function updatePromoCodeConfig(
  config: Partial<PromoCodeConfig>,
): Promise<PromoCodeConfig> {
  const response = await fetch('/api/promo-codes/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update config');
  }
  return response.json();
}
