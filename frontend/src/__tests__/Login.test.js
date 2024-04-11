import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import Login from '../pages/Login';

// Mock axios
jest.mock('axios');

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Login Component & Form Handling', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  test('renders login header, inputs, labels, and navigation links', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In to Dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/Forgot\?/i)).toHaveAttribute('href', '/forgot-password');
    expect(screen.getByText(/Create an Account/i)).toHaveAttribute('href', '/register');
  });

  test('submit button is disabled when fields are empty', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Sign In to Dashboard/i });
    expect(submitBtn).toBeDisabled();

    // Type email only
    const emailInput = screen.getByPlaceholderText('farmer@example.com');
    fireEvent.change(emailInput, { target: { value: 'farmer@agrily.com' } });
    expect(submitBtn).toBeDisabled();

    // Type password too -> becomes enabled
    const passwordInput = screen.getByPlaceholderText('••••••••');
    fireEvent.change(passwordInput, { target: { value: 'mySecurePass123' } });
    expect(submitBtn).not.toBeDisabled();
  });

  test('toggles password visibility when clicking Show/Hide button', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: /Show/i });
    fireEvent.click(toggleBtn);

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /Hide/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Hide/i }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('displays error alert banner upon failed authentication response', async () => {
    axios.post.mockRejectedValueOnce({
      response: {
        data: { message: 'Invalid credentials provided. Please check your password.' }
      }
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('farmer@example.com'), {
      target: { value: 'farmer@agrily.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrongpassword' }
    });

    const submitBtn = screen.getByRole('button', { name: /Sign In to Dashboard/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Invalid credentials provided. Please check your password.')
      ).toBeInTheDocument();
    });
  });

  test('stores JWT token in localStorage on successful login', async () => {
    axios.post.mockResolvedValueOnce({
      data: { token: 'mock-jwt-token-xyz-123' }
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('farmer@example.com'), {
      target: { value: 'farmer@agrily.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'correctPassword' }
    });

    const submitBtn = screen.getByRole('button', { name: /Sign In to Dashboard/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(window.localStorage.getItem('token')).toBe('mock-jwt-token-xyz-123');
    });
  });
});
