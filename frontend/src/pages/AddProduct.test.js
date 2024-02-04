import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AddProduct from './AddProduct';

describe('AddProduct Page Unit Tests', () => {
  beforeEach(() => {
    window.URL.createObjectURL = jest.fn(() => 'blob:http://localhost:3001/mock-preview-id');
    window.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders produce creation form with inputs and submit button', () => {
    render(
      <BrowserRouter>
        <AddProduct />
      </BrowserRouter>
    );

    expect(screen.getByText('List New Harvest')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Yellow Maize/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. 15000')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. 50')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /list produce/i })).toBeInTheDocument();
  });

  test('displays instant live image preview when photograph is selected', () => {
    render(
      <BrowserRouter>
        <AddProduct />
      </BrowserRouter>
    );

    const fileInput = screen.getByTestId('produce-image-input');
    const fakeFile = new File(['fake image content'], 'harvest_yam.jpg', {
      type: 'image/jpeg'
    });

    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    // Preview image should be rendered
    const previewImg = screen.getByTestId('produce-preview-image');
    expect(previewImg).toBeInTheDocument();
    expect(previewImg.getAttribute('src')).toBe('blob:http://localhost:3001/mock-preview-id');
    expect(screen.getByText('harvest_yam.jpg')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove \/ change photo/i })).toBeInTheDocument();
  });

  test('clears image preview when Remove button is clicked', () => {
    render(
      <BrowserRouter>
        <AddProduct />
      </BrowserRouter>
    );

    const fileInput = screen.getByTestId('produce-image-input');
    const fakeFile = new File(['fake image content'], 'tomatoes.png', {
      type: 'image/png'
    });

    fireEvent.change(fileInput, { target: { files: [fakeFile] } });
    expect(screen.getByTestId('produce-preview-image')).toBeInTheDocument();

    const removeBtn = screen.getByRole('button', { name: /remove \/ change photo/i });
    fireEvent.click(removeBtn);

    expect(screen.queryByTestId('produce-preview-image')).not.toBeInTheDocument();
    expect(screen.getByTestId('produce-image-input')).toBeInTheDocument();
  });
});
