/**
 * ==============================================================================
 * AGRILY FRONTEND TEST SUITE - PLEASEVERIFYEMAILPAGE UNIT TESTS
 * ==============================================================================
 * 
 * Test Suite Description:
 * Verifies email verification page rendering, persistent portal retention without
 * automatic redirects, display of destination email, and producer benefit highlights.
 * 
 * @module pages/PleaseVerifyEmailPage.test
 * @requires react
 * @requires @testing-library/react
 * @requires ./PleaseVerifyEmailPage
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PleaseVerifyEmailPage from './PleaseVerifyEmailPage';

// Mock auth context hooks
jest.mock('../auth/useUser', () => ({
  useUser: () => ({
    email: 'farmer.kaduna@agrily.com',
    isVerified: false
  })
}));

jest.mock('../auth/useToken', () => ({
  useToken: () => ['mock-token', jest.fn()]
}));

describe('PleaseVerifyEmailPage Component Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders verification portal with email and benefits without automatically redirecting', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/verify-email', state: { email: 'farmer@agrily.com' } }]}>
        <PleaseVerifyEmailPage />
      </MemoryRouter>
    );

    // Verify main headings and email chip
    expect(screen.getByTestId('please-verify-page')).toBeInTheDocument();
    expect(screen.getByText('Verify Your Email Address')).toBeInTheDocument();
    expect(screen.getByText('farmer@agrily.com')).toBeInTheDocument();

    // Verify benefits cards
    expect(screen.getByText('Verified Producer Badge')).toBeInTheDocument();
    expect(screen.getByText('Escrow Payout Settlement')).toBeInTheDocument();
    expect(screen.getByText('Wholesale Trade Access')).toBeInTheDocument();

    // Verify checklist instructions
    expect(screen.getByText(/didn't receive your verification email\?/i)).toBeInTheDocument();
    expect(screen.getByText(/yusuf\.hilside@gmail\.com/i)).toBeInTheDocument();

    // Ensure it does not redirect after 5 seconds
    act(() => {
      jest.advanceTimersByTime(6000);
    });

    // Still on the page
    expect(screen.getByText('Verify Your Email Address')).toBeInTheDocument();
  });

  test('displays fallback user email if router state is not supplied', () => {
    render(
      <MemoryRouter initialEntries={['/verify-email']}>
        <PleaseVerifyEmailPage />
      </MemoryRouter>
    );

    expect(screen.getByText('farmer.kaduna@agrily.com')).toBeInTheDocument();
  });
});
