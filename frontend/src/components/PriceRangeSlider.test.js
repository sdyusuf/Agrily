import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PriceRangeSlider from './PriceRangeSlider';

describe('PriceRangeSlider Unit Tests', () => {
  test('renders price range header and formatted currency pill', () => {
    render(<PriceRangeSlider initialMin={5000} initialMax={50000} />);

    expect(screen.getByText('Price Range')).toBeInTheDocument();
    const pill = screen.getByTestId('price-display-pill');
    expect(pill).toBeInTheDocument();
    expect(pill.textContent).toContain('5,000');
    expect(pill.textContent).toContain('50,000');
  });

  test('updates price bounds and invokes callback when preset chip is clicked', () => {
    const handleChange = jest.fn();
    render(<PriceRangeSlider onChange={handleChange} />);

    const under5kBtn = screen.getByRole('button', { name: 'Under ₦5K' });
    fireEvent.click(under5kBtn);

    expect(handleChange).toHaveBeenCalledWith({ minPrice: 0, maxPrice: 5000 });
    const pill = screen.getByTestId('price-display-pill');
    expect(pill.textContent).toContain('5,000');
  });

  test('updates minimum price when min slider changes', () => {
    const handleChange = jest.fn();
    render(
      <PriceRangeSlider
        initialMin={0}
        initialMax={100000}
        step={1000}
        onChange={handleChange}
      />
    );

    const minSlider = screen.getByRole('slider', { name: /minimum produce price/i });
    fireEvent.change(minSlider, { target: { value: '15000' } });

    expect(handleChange).toHaveBeenCalledWith({ minPrice: 15000, maxPrice: 100000 });
  });

  test('updates maximum price when max slider changes', () => {
    const handleChange = jest.fn();
    render(
      <PriceRangeSlider
        initialMin={0}
        initialMax={100000}
        step={1000}
        onChange={handleChange}
      />
    );

    const maxSlider = screen.getByRole('slider', { name: /maximum produce price/i });
    fireEvent.change(maxSlider, { target: { value: '75000' } });

    expect(handleChange).toHaveBeenCalledWith({ minPrice: 0, maxPrice: 75000 });
  });
});
