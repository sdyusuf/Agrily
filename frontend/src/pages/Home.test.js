/**
 * ============================================================================
 * AGRILY AGRICULTURAL COMMERCE & PROVENANCE PLATFORM
 * Home Dashboard Page Unit Test Suite
 * ============================================================================
 * 
 * @module frontend/src/pages/Home.test
 * @description
 * Unit tests validating render states, operations hero banner, unverified email warnings,
 * section layout, and the interactive FarmProfileEditor modal on the Home dashboard.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';
import { AppContext } from '../state/AppContext';
import * as useUserModule from '../auth/useUser';
import * as useTokenModule from '../auth/useToken';

// Mock child components that perform external network calls
jest.mock('../components/RevenueCards', () => () => (
  <div data-testid="mock-revenue-cards">Revenue Cards Mock</div>
));
jest.mock('../components/FarmerOrders', () => () => (
  <div data-testid="mock-farmer-orders">Farmer Orders Mock</div>
));
jest.mock('../components/ProductList', () => () => (
  <div data-testid="mock-product-list">Product List Mock</div>
));

const mockUser = {
  id: 'usr-1',
  firstName: 'Bello',
  lastName: 'Garba',
  email: 'bello@agrohub.ng',
  isVerified: true,
  farmProfile: {
    bio: 'Heirloom maize producer.',
    verificationStatus: 'verified',
    trustScore: 97,
    farmLocation: {
      state: 'Kaduna',
      lga: 'Zaria'
    },
    cooperativeName: 'Samaru Grain Growers'
  }
};

describe('Home Dashboard Page Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(useUserModule, 'useUser').mockReturnValue(mockUser);
    jest.spyOn(useTokenModule, 'useToken').mockReturnValue(['fake-jwt-token', jest.fn()]);

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            profile: {
              ...mockUser,
              farmProfile: mockUser.farmProfile
            }
          })
      })
    );
  });

  const renderHome = async () => {
    let rendered;
    await act(async () => {
      rendered = render(
        <AppContext.Provider value={{ value: [], setValue: jest.fn() }}>
          <MemoryRouter>
            <Home />
          </MemoryRouter>
        </AppContext.Provider>
      );
    });
    return rendered;
  };

  it('renders operations hero banner with personalized greeting matching landing page', async () => {
    await renderHome();

    expect(screen.getByText('Farm Operations & Logistics Console')).toBeInTheDocument();
    expect(screen.getByText(/Good (morning|afternoon|evening),/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Bello/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('btn-add-produce')).toBeInTheDocument();
    expect(screen.getByTestId('btn-open-profile-modal')).toBeInTheDocument();
  });

  it('renders all three key dashboard sections: revenue, orders, and produce listings', async () => {
    await renderHome();

    expect(screen.getByTestId('mock-revenue-cards')).toBeInTheDocument();
    expect(screen.getByTestId('mock-farmer-orders')).toBeInTheDocument();
    expect(screen.getByTestId('mock-product-list')).toBeInTheDocument();
    expect(screen.getByText('Revenue & Sales Performance')).toBeInTheDocument();
    expect(screen.getByText('Order Fulfillment & Transit Dispatch')).toBeInTheDocument();
    expect(screen.getByText('My Listed Farm Produce')).toBeInTheDocument();
  });

  it('displays warning banner when user email is unverified', async () => {
    jest.spyOn(useUserModule, 'useUser').mockReturnValue({
      ...mockUser,
      isVerified: false
    });

    await renderHome();

    expect(screen.getByTestId('unverified-alert')).toBeInTheDocument();
    expect(screen.getByText(/Action Required: Email Verification Pending/i)).toBeInTheDocument();
  });

  it('opens and closes the FarmProfileEditor modal when clicking edit button', async () => {
    await renderHome();

    expect(screen.queryByTestId('farm-profile-modal')).not.toBeInTheDocument();

    const openBtn = screen.getByTestId('btn-open-profile-modal');
    fireEvent.click(openBtn);

    expect(screen.getByTestId('farm-profile-modal')).toBeInTheDocument();
    expect(screen.getByTestId('farm-profile-editor')).toBeInTheDocument();

    // Close modal via close button
    const closeBtn = screen.getByTestId('btn-close-profile-modal');
    fireEvent.click(closeBtn);

    expect(screen.queryByTestId('farm-profile-modal')).not.toBeInTheDocument();
  });
});
