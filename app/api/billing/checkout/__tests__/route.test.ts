/** @jest-environment node */

import { NextResponse } from 'next/server';

var mockCheckCsrfToken = jest.fn();
var mockGetSessionFromRequest = jest.fn();
var mockUserFindUnique = jest.fn();
var mockEnsureStripeCustomerForUser = jest.fn();
var mockGetAppUrl = jest.fn();
var mockGetBillingInterval = jest.fn();
var mockGetCheckoutPriceId = jest.fn();
var mockCheckoutSessionsCreate = jest.fn();

jest.mock('../../../../../lib/csrf', () => ({
  checkCsrfToken: (...args: unknown[]) => mockCheckCsrfToken(...args),
}));

jest.mock('../../../../../lib/auth', () => ({
  getSessionFromRequest: (...args: unknown[]) => mockGetSessionFromRequest(...args),
}));

jest.mock('../../../../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
  },
}));

jest.mock('../../../../../lib/billing', () => ({
  ensureStripeCustomerForUser: (...args: unknown[]) => mockEnsureStripeCustomerForUser(...args),
  getAppUrl: (...args: unknown[]) => mockGetAppUrl(...args),
  getBillingInterval: (...args: unknown[]) => mockGetBillingInterval(...args),
  getCheckoutPriceId: (...args: unknown[]) => mockGetCheckoutPriceId(...args),
  isBillablePlan: (value: string) => value === 'COMPOSER' || value === 'STUDIO',
  isCheckoutInterval: (value: string) => value === 'monthly' || value === 'yearly',
}));

jest.mock('../../../../../lib/stripe', () => ({
  getStripeClient: () => ({
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockCheckoutSessionsCreate(...args),
      },
    },
  }),
}));

import { POST } from '../route';

describe('POST /api/billing/checkout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();

    mockCheckCsrfToken.mockReturnValue(null);
    mockGetSessionFromRequest.mockReturnValue({ userId: 'user-1' });
    mockUserFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'artist@progressionlab.ai',
      name: 'Artist One',
      stripeCustomerId: null,
    });
    mockEnsureStripeCustomerForUser.mockResolvedValue('cus_123');
    mockGetAppUrl.mockReturnValue('http://localhost:3000');
    mockGetBillingInterval.mockReturnValue('MONTHLY');
    mockGetCheckoutPriceId.mockReturnValue('price_123');
    mockCheckoutSessionsCreate.mockResolvedValue({
      url: 'https://checkout.stripe.com/test-session',
    });
  });

  it('returns a CSRF error response when validation fails', async () => {
    mockCheckCsrfToken.mockReturnValue(
      NextResponse.json({ message: 'CSRF token validation failed' }, { status: 403 }),
    );

    const response = await POST({} as never);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ message: 'CSRF token validation failed' });
    expect(mockGetSessionFromRequest).not.toHaveBeenCalled();
  });

  it('returns 401 when the user is not authenticated', async () => {
    mockGetSessionFromRequest.mockReturnValue(null);

    const response = await POST({ json: async () => ({}) } as never);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ message: 'Unauthorized' });
    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });

  it('returns 400 when the billing selection is invalid', async () => {
    const response = await POST({
      json: async () => ({ plan: 'COMP', interval: 'weekly' }),
    } as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ message: 'Invalid billing selection' });
    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });

  it('creates a Stripe checkout session for a valid subscription selection', async () => {
    const response = await POST({
      json: async () => ({ plan: 'COMPOSER', interval: 'monthly' }),
      nextUrl: { origin: 'http://localhost:3000' },
    } as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockEnsureStripeCustomerForUser).toHaveBeenCalledWith({
      id: 'user-1',
      email: 'artist@progressionlab.ai',
      name: 'Artist One',
      stripeCustomerId: null,
    });
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        customer: 'cus_123',
        client_reference_id: 'user-1',
        line_items: [{ price: 'price_123', quantity: 1 }],
        success_url: 'http://localhost:3000/settings/billing?checkout=success',
        cancel_url: 'http://localhost:3000/pricing?checkout=cancelled',
        metadata: {
          userId: 'user-1',
          plan: 'COMPOSER',
          billingInterval: 'MONTHLY',
        },
        subscription_data: {
          metadata: {
            userId: 'user-1',
            plan: 'COMPOSER',
          },
        },
      }),
    );
    expect(body).toEqual({ url: 'https://checkout.stripe.com/test-session' });
  });
});
