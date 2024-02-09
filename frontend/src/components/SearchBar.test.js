import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SearchBar from './SearchBar';

describe('SearchBar Unit Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders with placeholder text and search icon', () => {
    render(<SearchBar placeholder="Find fresh crops..." onSearch={jest.fn()} />);

    const input = screen.getByPlaceholderText('Find fresh crops...');
    expect(input).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();
  });

  test('triggers debounced onSearch after specified delay', () => {
    const handleSearch = jest.fn();
    render(<SearchBar onSearch={handleSearch} debounceMs={300} />);

    const input = screen.getByRole('textbox', { name: /search produce/i });

    // Type "Tomatoes"
    fireEvent.change(input, { target: { value: 'Tomatoes' } });

    // Fast-forward 100ms - should NOT have fired yet
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(handleSearch).not.toHaveBeenCalled();

    // Fast-forward remaining 200ms (total 300ms) - should have fired
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(handleSearch).toHaveBeenCalledTimes(1);
    expect(handleSearch).toHaveBeenCalledWith('Tomatoes');
  });

  test('shows clear button when text is present and resets on click', () => {
    const handleSearch = jest.fn();
    render(<SearchBar onSearch={handleSearch} initialValue="Cassava" />);

    const input = screen.getByRole('textbox', { name: /search produce/i });
    expect(input.value).toBe('Cassava');

    const clearBtn = screen.getByRole('button', { name: /clear search/i });
    expect(clearBtn).toBeInTheDocument();

    // Click clear
    fireEvent.click(clearBtn);

    expect(input.value).toBe('');
    expect(handleSearch).toHaveBeenCalledWith('');
    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();
  });
});
