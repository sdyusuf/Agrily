/**
 * ==============================================================================
 * AGRILY FRONTEND TEST SUITE - EMAIL VERIFICATION LANDING PAGE UNIT TESTS
 * ==============================================================================
 * 
 * Verifies EmailVerificationLandingPage token validation, loading indicator,
 * success state with producer benefits and dashboard navigation, and graceful failure handling.
 * 
 * @module pages/EmailVerificationLandingPage.test
 * @requires react
 * @requires @testing-library/react
 * @requires axios
 * @requires ./EmailVerificationLandingPage
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import EmailVerificationLandingPage from './EmailVerificationLandingPage';

jest.mock('axios');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const mockSetToken = jest.fn();
jest.mock('../auth/useToken', () => ({
  useToken: () => ['mock-token', mockSetToken]
}));

describe('EmailVerificationLandingPage Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('successfully validates token and renders producer activation view', async () => {
    axios.put.mockResolvedValueOnce({
      data: { token: 'new-jwt-token-verified' }
    });

    render(
      <MemoryRouter initialEntries={['/verify/valid-token-uuid-123']}>
        <Routes>
          <Route path="/verify/:verificationString" element={<EmailVerificationLandingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith('http://localhost:5000/verify', {
        verificationString: 'valid-token-uuid-123'
      });
      expect(mockSetToken).toHaveBeenCalledWith('new-jwt-token-verified');
      expect(screen.getByText('Account Verified Successfully! 🎉')).toBeInTheDocument();
      expect(screen.getByText('🌾 Producer Account Activated & Verified')).toBeInTheDocument();
    });

    // Check unlocked features
    expect(screen.getByText('Verified Trust Badge')).toBeInTheDocument();
    expect(screen.getByText('Escrow Payout Settlement')).toBeInTheDocument();
    expect(screen.getByText('Wholesale Trade Access')).toBeInTheDocument();

    // Test dashboard navigation button
    const dashboardBtn = screen.getByRole('button', { name: /enter producer dashboard/i });
    fireEvent.click(dashboardBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  test('handles invalid or expired token and displays error checklist', async () => {
    axios.put.mockRejectedValueOnce({
      response: { data: { message: 'The email verification code is incorrect!' } }
    });

    render(
      <MemoryRouter initialEntries={['/verify/invalid-expired-uuid']}>
        <Routes>
          <Route path="/verify/:verificationString" element={<EmailVerificationLandingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Verification Link Expired or Invalid')).toBeInTheDocument();
      expect(screen.getByText('The email verification code is incorrect!')).toBeInTheDocument();
      expect(screen.getByText(/what should you do\?/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /proceed to sign in/i })).toBeInTheDocument();
  });
});
