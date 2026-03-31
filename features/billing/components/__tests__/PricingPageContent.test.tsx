import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import PricingPageContent from '../PricingPageContent';

const mockUseAuth = jest.fn();
const mockOpenAuthModal = jest.fn();
const mockShowError = jest.fn();
const mockEnsureCsrfCookie = jest.fn();
const mockCreateCsrfHeaders = jest.fn(() => ({ 'x-csrf-token': 'token' }));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../../../components/providers/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../../../components/providers/AuthModalProvider', () => ({
  useAuthModal: () => ({
    openAuthModal: mockOpenAuthModal,
  }),
}));

jest.mock('../../../../components/providers/AppSnackbarProvider', () => ({
  useAppSnackbar: () => ({
    showError: mockShowError,
  }),
}));

jest.mock('../../../../lib/csrfClient', () => ({
  ensureCsrfCookie: () => mockEnsureCsrfCookie(),
  createCsrfHeaders: (...args: unknown[]) => mockCreateCsrfHeaders(...args),
}));

describe('PricingPageContent promo checkout', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url === '/api/pricing-tier-configs') {
        return {
          ok: false,
          json: async () => ({}),
        } as Response;
      }

      if (url === '/api/billing/checkout') {
        return {
          ok: false,
          json: async () => ({ message: 'Invalid or ineligible promo code' }),
        } as Response;
      }

      throw new Error(`Unexpected fetch call to ${url} (${JSON.stringify(init)})`);
    }) as jest.Mock;
  });

  it('sends the promo code to checkout payload for paid plans', async () => {
    render(<PricingPageContent />);

    fireEvent.change(screen.getByLabelText('Promo code'), { target: { value: 'producer-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'billing.pricing.tiers.composer.cta' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/billing/checkout',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    const checkoutCall = (global.fetch as jest.Mock).mock.calls.find(
      (call) => String(call[0]) === '/api/billing/checkout',
    );

    expect(checkoutCall).toBeDefined();

    const checkoutPayload = JSON.parse(checkoutCall?.[1]?.body as string) as {
      plan: string;
      interval: string;
      promoCode?: string;
    };

    expect(checkoutPayload).toEqual({
      plan: 'COMPOSER',
      interval: 'monthly',
      promoCode: 'PRODUCER-123',
    });
    expect(mockEnsureCsrfCookie).toHaveBeenCalledTimes(1);
  });
});
