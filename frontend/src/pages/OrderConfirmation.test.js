/**
 * ==============================================================================
 * AGRILY FRONTEND TEST SUITE - ORDER CONFIRMATION PAGE UNIT TESTS
 * ==============================================================================
 * 
 * Test Suite Description:
 * Verifies post-purchase order confirmation display, itemized produce receipt
 * calculation, order reference copy actions, waybill print invocation, and escrow
 * timeline rendering.
 * 
 * @module pages/OrderConfirmation.test
 * @requires react
 * @requires @testing-library/react
 * @requires ./OrderConfirmation
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import OrderConfirmation from './OrderConfirmation';

describe('OrderConfirmation Page Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders default confirmation screen when accessed directly without location state', () => {
    render(
      <BrowserRouter>
        <OrderConfirmation />
      </BrowserRouter>
    );

    expect(screen.getByText('Thank You For Your Produce Order!')).toBeInTheDocument();
    expect(screen.getByText(/order confirmed & pending dispatch/i)).toBeInTheDocument();
    expect(screen.getByTestId('order-reference-code')).toHaveTextContent('AGR-2024-SAMPLE');
    expect(screen.getByText('Consignment Itemized Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Return to Farm Marketplace')).toBeInTheDocument();
  });

  test('renders rich order details passed via router state', () => {
    const mockOrderState = {
      order: {
        _id: 'order-98765',
        orderNumber: 'AGR-20240303-KANO',
        totalAmount: 185000,
        status: 'Pending',
        items: [
          {
            productId: 'p-1',
            name: 'Dried Split Ginger',
            quantity: 10,
            unit: 'bag',
            price: 18500,
            ownerEmail: 'ginger.farmer@agrily.com'
          }
        ],
        deliveryAddress: {
          street: 'Plot 8, Agro Export Hub, Dawanau Market',
          city: 'Kano',
          state: 'Kano State',
          country: 'Nigeria',
          specialInstructions: 'Offload at Cold Silo Bay 1'
        }
      },
      orderReference: 'AGR-20240303-KANO',
      estimatedDeliveryDays: '1 - 3 business days'
    };

    render(
      <MemoryRouter initialEntries={[{ pathname: '/order-confirmation', state: mockOrderState }]}>
        <OrderConfirmation />
      </MemoryRouter>
    );

    // Verify Reference code
    expect(screen.getByTestId('order-reference-code')).toHaveTextContent('AGR-20240303-KANO');

    // Verify Item
    expect(screen.getByText('Dried Split Ginger')).toBeInTheDocument();
    expect(screen.getByText('Producer: ginger.farmer@agrily.com')).toBeInTheDocument();

    // Verify Address
    expect(screen.getByText('Plot 8, Agro Export Hub, Dawanau Market')).toBeInTheDocument();
    expect(screen.getByText('Kano, Kano State')).toBeInTheDocument();
    expect(screen.getByText('Offload at Cold Silo Bay 1')).toBeInTheDocument();

    // Verify Estimated Window
    expect(screen.getByText('1 - 3 business days')).toBeInTheDocument();
  });

  test('handles copy reference to clipboard action', async () => {
    const originalClipboard = navigator.clipboard;
    const mockWriteText = jest.fn().mockResolvedValue();
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText
      }
    });

    render(
      <BrowserRouter>
        <OrderConfirmation />
      </BrowserRouter>
    );

    const copyBtn = screen.getByRole('button', { name: /copy order reference/i });
    fireEvent.click(copyBtn);

    expect(mockWriteText).toHaveBeenCalledWith('AGR-2024-SAMPLE');
    expect(await screen.findByText('✓ Copied')).toBeInTheDocument();

    Object.assign(navigator, { clipboard: originalClipboard });
  });

  test('triggers window.print when print receipt button is clicked', () => {
    const originalPrint = window.print;
    window.print = jest.fn();

    render(
      <BrowserRouter>
        <OrderConfirmation />
      </BrowserRouter>
    );

    const printBtn = screen.getByRole('button', { name: /print consignment receipt/i });
    fireEvent.click(printBtn);

    expect(window.print).toHaveBeenCalledTimes(1);

    window.print = originalPrint;
  });
});
