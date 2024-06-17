import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Index from '../pages/Index';
import Login from '../pages/Login';
import Register from '../pages/Register';
import { PrivateRoute } from '../auth/PrivateRoute';
import * as useUserModule from '../auth/useUser';

// Mock child components of Index
jest.mock('../components/NavBar', () => () => <nav data-testid="mock-navbar">NavBar</nav>);
jest.mock('../components/Jumbotron', () => () => <header data-testid="mock-jumbotron">Jumbotron</header>);
jest.mock('../components/Body', () => () => <main data-testid="mock-body">Body</main>);
jest.mock('../components/Footer', () => () => <footer data-testid="mock-footer">Footer</footer>);

const mockAuthenticatedUser = {
  id: 'usr-101',
  email: 'farmer.kaduna@agrily.com',
  firstName: 'Ibrahim',
  lastName: 'Kaduna',
  isVerified: true
};

describe('Authenticated User Redirection Flow', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Index Page (/)', () => {
    test('renders landing page when visitor is unauthenticated', () => {
      jest.spyOn(useUserModule, 'useUser').mockReturnValue(null);

      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<Index />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
      expect(screen.getByTestId('mock-jumbotron')).toBeInTheDocument();
      expect(screen.getByTestId('mock-body')).toBeInTheDocument();
    });

    test('redirects logged-in user to /home dashboard', () => {
      jest.spyOn(useUserModule, 'useUser').mockReturnValue(mockAuthenticatedUser);

      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/home" element={<div data-testid="dashboard-page">Producer Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-jumbotron')).not.toBeInTheDocument();
    });
  });

  describe('Login Page (/login)', () => {
    test('renders login form when visitor is unauthenticated', () => {
      jest.spyOn(useUserModule, 'useUser').mockReturnValue(null);

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    });

    test('redirects logged-in user from /login to /home dashboard', () => {
      jest.spyOn(useUserModule, 'useUser').mockReturnValue(mockAuthenticatedUser);

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<div data-testid="dashboard-page">Producer Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      expect(screen.queryByText(/Welcome Back/i)).not.toBeInTheDocument();
    });
  });

  describe('Register Page (/register)', () => {
    test('renders register form when visitor is unauthenticated', () => {
      jest.spyOn(useUserModule, 'useUser').mockReturnValue(null);

      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText(/Create Farmer Account/i)).toBeInTheDocument();
    });

    test('redirects logged-in user from /register to /home dashboard', () => {
      jest.spyOn(useUserModule, 'useUser').mockReturnValue(mockAuthenticatedUser);

      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/home" element={<div data-testid="dashboard-page">Producer Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      expect(screen.queryByText(/Create Your Account/i)).not.toBeInTheDocument();
    });
  });

  describe('PrivateRoute Guard', () => {
    test('redirects unauthenticated user accessing protected route to /login', () => {
      jest.spyOn(useUserModule, 'useUser').mockReturnValue(null);

      render(
        <MemoryRouter initialEntries={['/home']}>
          <Routes>
            <Route element={<PrivateRoute />}>
              <Route path="/home" element={<div data-testid="protected-content">Protected</div>} />
            </Route>
            <Route path="/login" element={<div data-testid="login-redirect-target">Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('login-redirect-target')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    test('renders protected route for authenticated user', () => {
      jest.spyOn(useUserModule, 'useUser').mockReturnValue(mockAuthenticatedUser);

      render(
        <MemoryRouter initialEntries={['/home']}>
          <Routes>
            <Route element={<PrivateRoute />}>
              <Route path="/home" element={<div data-testid="protected-content">Protected</div>} />
            </Route>
            <Route path="/login" element={<div data-testid="login-redirect-target">Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByTestId('login-redirect-target')).not.toBeInTheDocument();
    });
  });
});
