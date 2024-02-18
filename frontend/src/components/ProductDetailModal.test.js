import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductDetailModal from './ProductDetailModal';

describe('ProductDetailModal Unit Tests', () => {
  const mockProduct = {
    _id: 'prod-999',
    name: 'Yellow Maize Grain',
    category: 'grains',
    unit: 'bag',
    price: 18500,
    quantity: 120,
    minOrderQuantity: 5,
    harvestDate: '2024-01-25T00:00:00.000Z',
    description: 'Dried yellow flint maize suitable for commercial poultry feeds and milling.',
    imageURL: 'http://localhost:5000/images/maize.jpg',
    ownerName: 'Danladi Agro Farms',
    ownerEmail: 'danladi@farms.com',
    isSold: false
  };

  test('renders modal with produce specs, price, and category badge', () => {
    render(<ProductDetailModal show={true} onHide={jest.fn()} product={mockProduct} />);

    expect(screen.getByText('Yellow Maize Grain')).toBeInTheDocument();
    expect(screen.getByText(/18,500/)).toBeInTheDocument();
    expect(screen.getByText(/Grains & Cereals/i)).toBeInTheDocument();
    expect(screen.getByText(/In Stock/i)).toBeInTheDocument();
    expect(screen.getByText('120 bags')).toBeInTheDocument();
    expect(screen.getByText('5 bags')).toBeInTheDocument();
    expect(screen.getByText(/Danladi Agro Farms/i)).toBeInTheDocument();
    expect(screen.getByText(/danladi@farms.com/i)).toBeInTheDocument();
  });

  test('calls onHide when Close button is clicked', () => {
    const handleHide = jest.fn();
    render(<ProductDetailModal show={true} onHide={handleHide} product={mockProduct} />);

    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);

    expect(handleHide).toHaveBeenCalledTimes(1);
  });

  test('invokes onOrderInquiry callback when Purchase / Inquire button is clicked', () => {
    const handleInquiry = jest.fn();
    render(
      <ProductDetailModal
        show={true}
        onHide={jest.fn()}
        product={mockProduct}
        onOrderInquiry={handleInquiry}
      />
    );

    const inquireBtn = screen.getByRole('button', { name: /purchase \/ inquire/i });
    fireEvent.click(inquireBtn);

    expect(handleInquiry).toHaveBeenCalledWith(mockProduct);
  });
});
