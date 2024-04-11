import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import AddProduct from '../pages/AddProduct';

// Mock axios
jest.mock('axios');

describe('AddProduct Component & Form Handling', () => {
  beforeEach(() => {
    window.localStorage.setItem('token', 'mock-farmer-jwt-token-777');
    window.URL.createObjectURL = jest.fn(() => 'blob:http://localhost:3001/mock-harvest-preview-id');
    window.URL.revokeObjectURL = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  test('renders all agricultural produce form inputs, dropdowns, and buttons', () => {
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

  test('validates file upload format and rejects non-image files', () => {
    render(
      <BrowserRouter>
        <AddProduct />
      </BrowserRouter>
    );

    const fileInput = screen.getByTestId('produce-image-input');
    const fakePdfFile = new File(['dummy content'], 'document.pdf', {
      type: 'application/pdf'
    });

    fireEvent.change(fileInput, { target: { files: [fakePdfFile] } });

    expect(
      screen.getByText(/Please select a valid JPEG, PNG, or WebP image/i)
    ).toBeInTheDocument();
  });

  test('accepts valid JPEG image and creates preview', async () => {
    render(
      <BrowserRouter>
        <AddProduct />
      </BrowserRouter>
    );

    const fileInput = screen.getByTestId('produce-image-input');
    const validImage = new File(['fake image bytes'], 'yam.jpg', {
      type: 'image/jpeg'
    });

    fireEvent.change(fileInput, { target: { files: [validImage] } });

    expect(window.URL.createObjectURL).toHaveBeenCalledWith(validImage);

    await waitFor(() => {
      expect(screen.getByTestId('produce-preview-image')).toBeInTheDocument();
    });

    expect(screen.getByTestId('produce-preview-image')).toHaveAttribute(
      'src',
      'blob:http://localhost:3001/mock-harvest-preview-id'
    );
  });

  test('submits valid form with multipart FormData payload and auth header', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Product saved successfully!',
        product: { _id: 'prod123', name: 'Fresh White Yam' }
      }
    });

    render(
      <BrowserRouter>
        <AddProduct />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Yellow Maize/i), {
      target: { value: 'Fresh White Yam' }
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. 50'), {
      target: { value: '50' }
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. 15000'), {
      target: { value: '25000' }
    });

    const submitBtn = screen.getByRole('button', { name: /list produce/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    const [postUrl, formDataPayload, config] = axios.post.mock.calls[0];
    expect(postUrl).toBe('http://localhost:5000/api/product');
    expect(formDataPayload instanceof FormData).toBe(true);
    expect(config.headers.Authorization).toBe('Bearer mock-farmer-jwt-token-777');
  });

  test('displays error alert when API rejects produce creation', async () => {
    axios.post.mockRejectedValueOnce({
      response: {
        data: { message: 'Failed to publish produce. Insufficient farmer credentials.' }
      }
    });

    render(
      <BrowserRouter>
        <AddProduct />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Yellow Maize/i), {
      target: { value: 'Fresh White Yam' }
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. 50'), {
      target: { value: '50' }
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. 15000'), {
      target: { value: '25000' }
    });

    const submitBtn = screen.getByRole('button', { name: /list produce/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to publish produce. Insufficient farmer credentials.')
      ).toBeInTheDocument();
    });
  });
});
