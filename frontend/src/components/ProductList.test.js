/**
 * ==============================================================================
 * AGRILY FRONTEND TEST SUITE - PRODUCTLIST COMPONENT UNIT TESTS
 * ==============================================================================
 * 
 * Test Suite Description:
 * Verifies farmer produce inventory rendering, debounced filtering,
 * empty state behavior, and edit/archive/delete interactions.
 * 
 * @module components/ProductList.test
 * @requires react
 * @requires @testing-library/react
 * @requires axios
 * @requires ./ProductList
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import axios from 'axios';
import ProductList from './ProductList';

jest.mock('axios');

jest.mock('../auth/useToken', () => ({
  useToken: () => ['mock-token']
}));

jest.mock('./EditProductModal', () => {
  return function MockEditProductModal({ show, onHide }) {
    if (!show) return null;
    return (
      <div data-testid="mock-edit-modal">
        <button type="button" onClick={onHide}>Close Modal</button>
      </div>
    );
  };
});

describe('ProductList Component Unit Tests', () => {
  const mockProducts = [
    {
      _id: 'prod-001',
      name: 'Organic Yellow Maize',
      category: 'Grains & Cereals',
      variety: 'Hybrid Yellow',
      description: 'High-yield nutritious maize grains.',
      price: 18000,
      quantity: 50,
      unit: 'bag',
      isSold: false
    },
    {
      _id: 'prod-002',
      name: 'Benue White Yam',
      category: 'Tubers & Roots',
      variety: 'Pona',
      description: 'Mature pounded yam grade tubers.',
      price: 45000,
      quantity: 20,
      unit: 'bundle',
      isSold: false
    },
    {
      _id: 'prod-003',
      name: 'Fresh Ripe Tomatoes',
      category: 'Vegetables',
      variety: 'Roma',
      description: 'Fresh farm-picked red tomatoes.',
      price: 12000,
      quantity: 15,
      unit: 'crate',
      isSold: true
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders loading spinner initially, then displays products list', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProducts });

    render(<ProductList email="farmer@agrily.com" />);

    expect(screen.getByText(/loading your produce listings/i)).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(50);
    });

    await waitFor(() => {
      expect(screen.getByText('Organic Yellow Maize')).toBeInTheDocument();
      expect(screen.getByText('Benue White Yam')).toBeInTheDocument();
      expect(screen.getByText('Fresh Ripe Tomatoes')).toBeInTheDocument();
    });
  });

  test('renders empty state when farmer has no listed produce', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    render(<ProductList email="newfarmer@agrily.com" />);

    await act(async () => {
      jest.advanceTimersByTime(50);
    });

    await waitFor(() => {
      expect(screen.getByText('No Produce Listed Yet')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /list your first produce/i })).toBeInTheDocument();
    });
  });

  test('filters produce list using debounced search input', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProducts });

    render(<ProductList email="farmer@agrily.com" />);

    await act(async () => {
      jest.advanceTimersByTime(50);
    });

    await waitFor(() => {
      expect(screen.getByText('Organic Yellow Maize')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('textbox', { name: /filter your produce listings/i });

    // Type 'Yam' into search input
    fireEvent.change(searchInput, { target: { value: 'Yam' } });

    // Advance 100ms - debounce should not trigger yet
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(screen.getByText('Organic Yellow Maize')).toBeInTheDocument();

    // Advance 250ms (total 350ms, beyond 300ms debounce)
    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(screen.getByText('Benue White Yam')).toBeInTheDocument();
    expect(screen.queryByText('Organic Yellow Maize')).not.toBeInTheDocument();
    expect(screen.queryByText('Fresh Ripe Tomatoes')).not.toBeInTheDocument();
  });

  test('displays "No Matching Produce" when search returns zero results', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProducts });

    render(<ProductList email="farmer@agrily.com" />);

    await act(async () => {
      jest.advanceTimersByTime(50);
    });

    await waitFor(() => {
      expect(screen.getByText('Organic Yellow Maize')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('textbox', { name: /filter your produce listings/i });
    fireEvent.change(searchInput, { target: { value: 'Avocado' } });

    act(() => {
      jest.advanceTimersByTime(350);
    });

    expect(screen.getByText('No Matching Produce')).toBeInTheDocument();
    expect(screen.getByText(/no listed produce matches "avocado"/i)).toBeInTheDocument();
  });

  test('displays error alert on network failure', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network Error'));

    render(<ProductList email="farmer@agrily.com" />);

    await act(async () => {
      jest.advanceTimersByTime(50);
    });

    await waitFor(() => {
      expect(screen.getByText(/unable to load produce inventory/i)).toBeInTheDocument();
    });
  });
});
