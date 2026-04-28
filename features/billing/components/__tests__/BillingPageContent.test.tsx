import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import BillingPageContent from '../BillingPageContent';

const mockUseAuth = jest.fn();
const mockOpenAuthModal = jest.fn();
const mockShowError = jest.fn();
const mockShowInfo = jest.fn();
const mockShowSuccess = jest.fn();
const mockEnsureCsrfCookie = jest.fn();
const mockCreateCsrfHeaders = jest.fn((headers?: HeadersInit) => ({
  ...Object.fromEntries(new Headers(headers).entries()),
  'x-csrf-token': 'token',
}));

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
    showInfo: mockShowInfo,
    showSuccess: mockShowSuccess,
  }),
}));

jest.mock('../../../../lib/csrfClient', () => ({
  ensureCsrfCookie: () => mockEnsureCsrfCookie(),
  createCsrfHeaders: (headers?: HeadersInit) => mockCreateCsrfHeaders(headers),
}));

const statusPayload = {
  plan: 'SESSION',
  entitlements: {
    aiGenerationsPerMonth: 10,
    maxSavedProgressions: 10,
    maxSavedArrangements: 5,
    maxPublicShares: 2,
    canExportMidi: false,
    canExportPdf: false,
    canSharePublicly: true,
    canUsePremiumAiModel: false,
  },
  planOverride: null,
  planOverrideExpiresAt: null,
  subscriptionStatus: null,
  billing: {
    stripeCustomerId: null,
    subscription: null,
  },
  usage: {
    aiGenerationsUsed: 0,
    aiGenerationsLimit: 10,
  },
};

describe('BillingPageContent invite redemption', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url === '/api/billing/status') {
        return {
          ok: true,
          json: async () => statusPayload,
        } as Response;
      }

      if (url === '/api/invites/redeem') {
        return {
          ok: true,
          json: async () => ({
            applied: true,
            expiresAt: '2026-04-15T00:00:00.000Z',
          }),
        } as Response;
      }

      throw new Error(`Unexpected fetch call to ${url}`);
    }) as jest.Mock;
  });

  it('redeems an invite code and refreshes billing status', async () => {
    render(<BillingPageContent />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/billing/status',
        expect.objectContaining({ credentials: 'include' }),
      );
    });

    const inviteInput = await screen.findByLabelText('Invite code');
    fireEvent.change(inviteInput, { target: { value: 'producer-abc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Redeem' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/invites/redeem',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    const inviteCall = (global.fetch as jest.Mock).mock.calls.find(
      (call) => String(call[0]) === '/api/invites/redeem',
    );

    expect(inviteCall).toBeDefined();

    const invitePayload = JSON.parse(inviteCall?.[1]?.body as string) as { code: string };
    expect(invitePayload).toEqual({ code: 'PRODUCER-ABC' });
    expect(mockEnsureCsrfCookie).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalled();
    });

    expect(
      (global.fetch as jest.Mock).mock.calls.filter(
        (call) => String(call[0]) === '/api/billing/status',
      ).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it('shows inline error on the invite field when redeem returns 4xx', async () => {
    (global.fetch as jest.Mock).mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url === '/api/billing/status') {
        return { ok: true, json: async () => statusPayload } as Response;
      }

      if (url === '/api/invites/redeem') {
        return {
          ok: false,
          json: async () => ({ message: 'Invite code not found or inactive' }),
        } as Response;
      }

      throw new Error(`Unexpected fetch call to ${url}`);
    });

    render(<BillingPageContent />);

    const inviteInput = await screen.findByLabelText('Invite code');
    fireEvent.change(inviteInput, { target: { value: 'INVALID-CODE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Redeem' }));

    await waitFor(() => {
      expect(screen.getByText('Invite code not found or inactive')).toBeInTheDocument();
    });

    expect(mockShowError).not.toHaveBeenCalled();
  });

  it('clears inline invite error when the user edits the invite code field', async () => {
    (global.fetch as jest.Mock).mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url === '/api/billing/status') {
        return { ok: true, json: async () => statusPayload } as Response;
      }

      if (url === '/api/invites/redeem') {
        return {
          ok: false,
          json: async () => ({ message: 'Invite code not found or inactive' }),
        } as Response;
      }

      throw new Error(`Unexpected fetch call to ${url}`);
    });

    render(<BillingPageContent />);

    const inviteInput = await screen.findByLabelText('Invite code');
    fireEvent.change(inviteInput, { target: { value: 'INVALID-CODE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Redeem' }));

    await waitFor(() => {
      expect(screen.getByText('Invite code not found or inactive')).toBeInTheDocument();
    });

    fireEvent.change(inviteInput, { target: { value: 'NEW-CODE' } });

    expect(screen.queryByText('Invite code not found or inactive')).not.toBeInTheDocument();
  });
});
