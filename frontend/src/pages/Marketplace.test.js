import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Marketplace from './Marketplace';

jest.mock('axios');

describe('Marketplace Page Unit Tests', () => {
  const mockCatalogResponse = {
    data: {
      success: true,
      page: 1,
      limit: 12,
      totalProducts: 2,
      totalPages: 1,
      products: [
        {
          _id: 'prod-001',
          name: 'Sweet Potatoes',
          category: 'tubers',
          unit: 'crate',
          price: 8500,
          quantity: 40,
          minOrderQuantity: 2,
          isSold: false
        },
        {
          _id: 'prod-002',
          name: 'Fresh Tomatoes',
          category: 'vegetables',
          unit: 'basket',
          price: 12000,
          quantity: 25,
          minOrderQuantity: 1,
          isSold: false
        }
      ]
    }
  };

  beforeEach(() => {
    axios.get.mockResolvedValue(mockCatalogResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders marketplace hero title, search bar, and filter controls', async () => {
    render(
      <BrowserRouter>
        <Marketplace />
      </BrowserRouter>
    );

    expect(screen.getByText('Explore Fresh Farm Harvests')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search farm produce by name/i)).toBeInTheDocument();
    expect(screen.getByText('Price Range')).toBeInTheDocument();
    expect(screen.getByLabelText(/Sort Listings By/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Sweet Potatoes')).toBeInTheDocument();
      expect(screen.getByText('Fresh Tomatoes')).toBeInTheDocument();
    });
  });

  test('renders category chips for produce classification', async () => {
    render(
      <BrowserRouter>
        <Marketplace />
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: /All Produce/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Grains & Cereals/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tubers & Roots/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Vegetables & Greens/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Sweet Potatoes')).toBeInTheDocument();
    });
  });
});
