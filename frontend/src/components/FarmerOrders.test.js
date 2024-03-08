/**
 * ==============================================================================
 * AGRILY FRONTEND TEST SUITE - FARMER ORDERS COMPONENT UNIT TESTS
 * ==============================================================================
 * 
 * Test Suite Description:
 * Verifies farmer order fulfillment dashboard rendering, filter tabs,
 * optimistic status transitions (Confirm, Dispatch, Delivered), and error notices.
 * 
 * @module components/FarmerOrders.test
 * @requires react
 * @requires @testing-library/react
 * @requires ./FarmerOrders
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FarmerOrders from './FarmerOrders';

// Mock auth hooks
jest.mock('../auth/useUser', () => ({
  useUser: () => ({
    email: 'farmer.kaduna@agrily.com',
    name: 'Malam Ibrahim'
  })
}));

jest.mock('../auth/useToken', () => ({
  useToken: () => ['mock-jwt-token']
}));

describe('FarmerOrders Component Unit Tests', () => {
  const mockOrders = [
    {
      _id: 'order-101',
      orderNumber: 'AGR-20240305-KAD1',
      buyerName: 'Northern Flour Mills',
      buyerEmail: 'procure@flourmills.ng',
      buyerPhone: '+234 803 111 2222',
      status: 'Pending',
      totalAmount: 180000,
      createdAt: '2024-03-05T10:00:00.000Z',
      items: [
        {
          name: 'White Maize Grain',
          quantity: 10,
          unit: 'bag',
          price: 18000,
          ownerEmail: 'farmer.kaduna@agrily.com'
        }
      ],
      deliveryAddress: {
        street: 'Flour Mill Complex, Grain Terminal 2',
        city: 'Kaduna',
        state: 'Kaduna State'
      }
    },
    {
      _id: 'order-102',
      orderNumber: 'AGR-20240305-KAD2',
      buyerName: 'Danladi Foods Ltd',
      buyerEmail: 'danladi@foods.ng',
      status: 'Confirmed',
      totalAmount: 45000,
      createdAt: '2024-03-06T12:00:00.000Z',
      items: [
        {
          name: 'Yellow Sweet Potatoes',
          quantity: 5,
          unit: 'crate',
          price: 9000,
          ownerEmail: 'farmer.kaduna@agrily.com'
        }
      ],
      deliveryAddress: {
        street: 'Central Market Depot',
        city: 'Zaria',
        state: 'Kaduna State'
      }
    },
    {
      _id: 'order-103',
      orderNumber: 'AGR-20240305-KAD3',
      buyerName: 'Kano Agro Traders',
      buyerEmail: 'trader@kano.ng',
      status: 'In Transit',
      totalAmount: 60000,
      createdAt: '2024-03-07T14:00:00.000Z',
      items: [
        {
          name: 'Fresh Habanero Peppers',
          quantity: 10,
          unit: 'basket',
          price: 6000,
          ownerEmail: 'farmer.kaduna@agrily.com'
        }
      ],
      deliveryAddress: {
        street: 'Dawanau Export Gate',
        city: 'Kano',
        state: 'Kano State'
      }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders empty state when supplied with empty orders array', () => {
    render(<FarmerOrders initialOrders={[]} />);

    expect(screen.getByTestId('farmer-orders-board')).toBeInTheDocument();
    expect(screen.getByText('No Orders Found')).toBeInTheDocument();
    expect(screen.getByText(/you do not have any incoming buyer orders/i)).toBeInTheDocument();
  });

  test('renders orders table with buyer information, produce items, amounts, and status badges', () => {
    render(<FarmerOrders initialOrders={mockOrders} />);

    expect(screen.getByText('AGR-20240305-KAD1')).toBeInTheDocument();
    expect(screen.getByText('Northern Flour Mills')).toBeInTheDocument();
    expect(screen.getByText('White Maize Grain')).toBeInTheDocument();
    expect(screen.getByText('10 bags')).toBeInTheDocument();

    expect(screen.getByText('AGR-20240305-KAD2')).toBeInTheDocument();
    expect(screen.getByText('Yellow Sweet Potatoes')).toBeInTheDocument();

    expect(screen.getByText('AGR-20240305-KAD3')).toBeInTheDocument();
    expect(screen.getByText('Fresh Habanero Peppers')).toBeInTheDocument();
  });

  test('filters orders table when status filter chips are clicked', () => {
    render(<FarmerOrders initialOrders={mockOrders} />);

    // Click "Pending" filter
    const pendingChip = screen.getByRole('tab', { name: /pending/i });
    fireEvent.click(pendingChip);

    // Only Pending order should be visible
    expect(screen.getByText('AGR-20240305-KAD1')).toBeInTheDocument();
    expect(screen.queryByText('AGR-20240305-KAD2')).not.toBeInTheDocument();
    expect(screen.queryByText('AGR-20240305-KAD3')).not.toBeInTheDocument();

    // Click "In Transit" filter
    const inTransitChip = screen.getByRole('tab', { name: /in transit/i });
    fireEvent.click(inTransitChip);

    expect(screen.queryByText('AGR-20240305-KAD1')).not.toBeInTheDocument();
    expect(screen.getByText('AGR-20240305-KAD3')).toBeInTheDocument();
  });

  test('calls PATCH status endpoint and updates order status to Confirmed', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Order status successfully transitioned from "Pending" to "Confirmed".'
      })
    });

    render(<FarmerOrders initialOrders={mockOrders} />);

    const confirmBtn = screen.getByRole('button', { name: /confirm order agr-20240305-kad1/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/orders/order-101/status',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'Confirmed' })
        })
      );
    });

    // Success notice banner should be displayed
    expect(await screen.findByText(/order status successfully updated to "confirmed"/i)).toBeInTheDocument();
  });

  test('calls PATCH status endpoint and dispatches order into In Transit', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Order status successfully transitioned from "Confirmed" to "In Transit".'
      })
    });

    render(<FarmerOrders initialOrders={mockOrders} />);

    const dispatchBtn = screen.getByRole('button', { name: /dispatch order agr-20240305-kad2 into transit/i });
    fireEvent.click(dispatchBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/orders/order-102/status',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'In Transit' })
        })
      );
    });
  });

  test('calls PATCH status endpoint and marks order as Delivered', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Order status successfully transitioned from "In Transit" to "Delivered".'
      })
    });

    render(<FarmerOrders initialOrders={mockOrders} />);

    const deliveredBtn = screen.getByRole('button', { name: /mark order agr-20240305-kad3 as delivered/i });
    fireEvent.click(deliveredBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/orders/order-103/status',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'Delivered' })
        })
      );
    });
  });
});
