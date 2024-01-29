import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductCard from './ProductCard';

describe('ProductCard Unit Tests', () => {
  const mockProduct = {
    _id: 'prod-12345',
    name: 'Fresh Bell Peppers',
    category: 'vegetables',
    unit: 'bag',
    price: 3500,
    quantity: 20,
    minOrderQuantity: 2,
    harvestDate: '2024-01-20T00:00:00.000Z',
    description: 'Crisp greenhouse bell peppers',
    isSold: false
  };

  test('renders produce details, price, and category badge', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Fresh Bell Peppers')).toBeInTheDocument();
    expect(screen.getByText(/3,500/)).toBeInTheDocument();
    expect(screen.getByText(/Vegetables & Greens/i)).toBeInTheDocument();
    expect(screen.getByText(/In Stock/i)).toBeInTheDocument();
    expect(screen.getByText(/Available:/i)).toBeInTheDocument();
  });

  test('invokes onEdit callback when Edit button is clicked', () => {
    const handleEdit = jest.fn();
    render(<ProductCard product={mockProduct} onEdit={handleEdit} />);

    const editBtn = screen.getByRole('button', { name: /^edit$/i });
    fireEvent.click(editBtn);

    expect(handleEdit).toHaveBeenCalledWith(mockProduct);
  });

  test('invokes onArchive callback when Archive button is clicked', () => {
    const handleArchive = jest.fn();
    render(<ProductCard product={mockProduct} onArchive={handleArchive} />);

    const archiveBtn = screen.getByRole('button', { name: /archive/i });
    fireEvent.click(archiveBtn);

    expect(handleArchive).toHaveBeenCalledWith(mockProduct);
  });

  test('opens confirmation modal and triggers permanent delete', async () => {
    const handleDelete = jest.fn();
    render(<ProductCard product={mockProduct} onDelete={handleDelete} />);

    // Open confirmation modal
    const deleteTrigger = screen.getByRole('button', { name: /delete listing/i });
    fireEvent.click(deleteTrigger);

    expect(screen.getByText(/Are you sure you want to remove/i)).toBeInTheDocument();

    // Confirm permanent deletion
    const confirmDeleteBtn = screen.getByRole('button', { name: /permanently delete/i });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(handleDelete).toHaveBeenCalledWith('prod-12345', true);
    });
  });

  test('triggers archive from confirmation modal when Archive Instead is clicked', async () => {
    const handleDelete = jest.fn();
    render(<ProductCard product={mockProduct} onDelete={handleDelete} />);

    const deleteTrigger = screen.getByRole('button', { name: /delete listing/i });
    fireEvent.click(deleteTrigger);

    const archiveInsteadBtn = screen.getByRole('button', { name: /archive instead/i });
    fireEvent.click(archiveInsteadBtn);

    await waitFor(() => {
      expect(handleDelete).toHaveBeenCalledWith('prod-12345', false);
    });
  });
});
