import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EditProductModal from './EditProductModal';

describe('EditProductModal Unit Tests', () => {
  const mockProduct = {
    _id: '60d5ec49f1b2c82b88123456',
    name: 'Organic Sweet Potatoes',
    category: 'tubers',
    unit: 'crate',
    quantity: 45,
    minOrderQuantity: 3,
    price: 6500,
    harvestDate: '2024-01-15T00:00:00.000Z',
    description: 'High-quality farm harvested tubers'
  };

  test('renders modal and prefills produce attributes when visible', () => {
    const handleHide = jest.fn();
    const handleUpdate = jest.fn();

    render(
      <EditProductModal
        show={true}
        onHide={handleHide}
        product={mockProduct}
        onProductUpdated={handleUpdate}
      />
    );

    expect(screen.getByText(/Edit Produce Listing/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Organic Sweet Potatoes')).toBeInTheDocument();
    expect(screen.getByDisplayValue('6500')).toBeInTheDocument();
    expect(screen.getByDisplayValue('45')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
    expect(screen.getByDisplayValue(/High-quality farm harvested tubers/i)).toBeInTheDocument();
  });

  test('calls onHide callback when Cancel button is clicked', () => {
    const handleHide = jest.fn();

    render(
      <EditProductModal
        show={true}
        onHide={handleHide}
        product={mockProduct}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(handleHide).toHaveBeenCalledTimes(1);
  });

  test('updates form field values when user types', () => {
    render(
      <EditProductModal
        show={true}
        onHide={jest.fn()}
        product={mockProduct}
      />
    );

    const nameInput = screen.getByDisplayValue('Organic Sweet Potatoes');
    fireEvent.change(nameInput, { target: { value: 'Premium Cassava' } });
    expect(screen.getByDisplayValue('Premium Cassava')).toBeInTheDocument();

    const priceInput = screen.getByDisplayValue('6500');
    fireEvent.change(priceInput, { target: { value: '8000' } });
    expect(screen.getByDisplayValue('8000')).toBeInTheDocument();
  });
});
