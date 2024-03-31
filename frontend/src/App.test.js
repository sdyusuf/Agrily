import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Agrily brand in navigation', () => {
  render(<App />);
  const brandElements = screen.getAllByText(/Agrily/i);
  expect(brandElements.length).toBeGreaterThan(0);
});
