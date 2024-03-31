/**
 * ==============================================================================
 * AGRILY FRONTEND TEST SUITE - PLEASEVERIFYEMAILPAGE UNIT TESTS
 * ==============================================================================
 * 
 * Test Suite Description:
 * Verifies email verification page rendering, persistent portal retention without
 * automatic redirects, manual token confirmation, resend dispatch, and error handling.
 * 
 * @module pages/PleaseVerifyEmailPage.test
 * @requires react
 * @requires @testing-library/react
 * @requires axios
 * @requires ./PleaseVerifyEmailPage
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import PleaseVerifyEmailPage from './PleaseVerifyEmailPage';

jest.mock('axios');

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

    // Ensure it does not redirect after 5 seconds
    act(() => {
      jest.advanceTimersByTime(6000);
    });

    // Still on the page
    expect(screen.getByText('Verify Your Email Address')).toBeInTheDocument();
  });

  test('submits manual activation code and displays success state', async () => {
    axios.put.mockResolvedValueOnce({
      data: { token: 'new-verified-jwt-token' }
    });

    render(
      <BrowserRouter>
        <PleaseVerifyEmailPage />
      </BrowserRouter>
    );

    const input = screen.getByRole('textbox', { name: /enter email verification token/i });
    const submitBtn = screen.getByRole('button', { name: /activate account/i });

    // Enter token
    fireEvent.change(input, { target: { value: 'test-uuid-token-12345' } });
    fireEvent.click(submitBtn);

    await act(async () => {
      jest.advanceTimersByTime(50);
    });

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith('http://localhost:5000/verify', {
        verificationString: 'test-uuid-token-12345'
      });
      expect(screen.getByText('Account Verified Successfully!')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /proceed to producer dashboard/i })).toBeInTheDocument();
    });
  });

  test('handles invalid activation code error gracefully', async () => {
    axios.put.mockRejectedValueOnce({
      response: { data: { message: 'The email verification code is incorrect!' } }
    });

    render(
      <BrowserRouter>
        <PleaseVerifyEmailPage />
      </BrowserRouter>
    );

    const input = screen.getByRole('textbox', { name: /enter email verification token/i });
    const submitBtn = screen.getByRole('button', { name: /activate account/i });

    fireEvent.change(input, { target: { value: 'invalid-code' } });
    fireEvent.click(submitBtn);

    await act(async () => {
      jest.advanceTimersByTime(50);
    });

    await waitFor(() => {
      expect(screen.getByText('The email verification code is incorrect!')).toBeInTheDocument();
    });
  });

  test('requests resend of verification email and starts 60-second cooldown', async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: true, message: 'Verification link has been sent to your email' }
    });

    render(
      <MemoryRouter initialEntries={[{ pathname: '/verify-email', state: { email: 'farmer@agrily.com' } }]}>
        <PleaseVerifyEmailPage />
      </MemoryRouter>
    );

    const resendBtn = screen.getByRole('button', { name: /resend verification email/i });
    fireEvent.click(resendBtn);

    await act(async () => {
      jest.advanceTimersByTime(50);
    });

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('http://localhost:5000/api/resend-verification', {
        email: 'farmer@agrily.com'
      });
      expect(screen.getByText(/verification email successfully resent/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /resend verification email/i })).toBeDisabled();
    });

    // Advance 60 seconds to clear cooldown
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(screen.getByRole('button', { name: /resend verification email/i })).not.toBeDisabled();
  });
});
