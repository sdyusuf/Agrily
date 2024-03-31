/**
 * ==============================================================================
 * AGRILY FRONTEND TEST SUITE - useDebounce HOOK UNIT TESTS
 * ==============================================================================
 * 
 * Test Suite Description:
 * Verifies debounce delay mechanics, cancellation on unmount, rapid keystroke
 * buffering, leading/trailing edge callbacks, and search state management.
 * 
 * @module hook/useDebounce.test
 * @requires react
 * @requires @testing-library/react
 * @requires ./useDebounce
 */

import React, { useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useDebounce, useDebouncedCallback, useDebounceSearch, DEFAULT_DEBOUNCE_DELAY_MS } from './useDebounce';

// Test Harness Component for useDebounce
function DebounceTestConsumer({ initialValue = '', delay = 300 }) {
  const [value, setValue] = useState(initialValue);
  const debounced = useDebounce(value, delay);

  return (
    <div>
      <input
        data-testid="input-val"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <span data-testid="output-debounced">{debounced}</span>
    </div>
  );
}

// Test Harness Component for useDebouncedCallback
function CallbackTestConsumer({ onTrigger, delay = 200, options }) {
  const debouncedFn = useDebouncedCallback(onTrigger, delay, options);

  return (
    <div>
      <button type="button" data-testid="btn-trigger" onClick={() => debouncedFn('Triggered')}>
        Trigger
      </button>
      <button type="button" data-testid="btn-trigger-custom" onClick={(e) => debouncedFn('Custom Payload')}>
        Trigger Custom
      </button>
      <button type="button" data-testid="btn-cancel" onClick={() => debouncedFn.cancel()}>
        Cancel
      </button>
      <button type="button" data-testid="btn-flush" onClick={() => debouncedFn.flush()}>
        Flush
      </button>
    </div>
  );
}

// Test Harness Component for useDebounceSearch
function SearchTestConsumer({ initialValue = '', delay = 250, onSearch }) {
  const { query, debouncedQuery, setQuery, handleClear, isDebouncing } = useDebounceSearch(
    initialValue,
    delay,
    onSearch
  );

  return (
    <div>
      <input
        data-testid="search-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <span data-testid="search-debounced">{debouncedQuery}</span>
      <span data-testid="search-status">{isDebouncing ? 'debouncing' : 'idle'}</span>
      <button type="button" data-testid="search-clear" onClick={handleClear}>
        Clear
      </button>
    </div>
  );
}

describe('useDebounce Hook Suite', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('useDebounce', () => {
    test('returns initial value immediately upon initial render', () => {
      render(<DebounceTestConsumer initialValue="Maize" delay={300} />);
      expect(screen.getByTestId('output-debounced').textContent).toBe('Maize');
    });

    test('debounces value updates according to specified delay interval', () => {
      render(<DebounceTestConsumer initialValue="M" delay={300} />);
      const input = screen.getByTestId('input-val');

      expect(screen.getByTestId('output-debounced').textContent).toBe('M');

      // Update rapidly simulating typing
      fireEvent.change(input, { target: { value: 'Mai' } });
      expect(screen.getByTestId('output-debounced').textContent).toBe('M');

      act(() => {
        jest.advanceTimersByTime(150);
      });
      expect(screen.getByTestId('output-debounced').textContent).toBe('M');

      fireEvent.change(input, { target: { value: 'Maize Grain' } });
      act(() => {
        jest.advanceTimersByTime(200);
      });
      // Still old value because timer was reset by new keystroke
      expect(screen.getByTestId('output-debounced').textContent).toBe('M');

      act(() => {
        jest.advanceTimersByTime(100);
      });
      // Full 300ms elapsed since last keystroke
      expect(screen.getByTestId('output-debounced').textContent).toBe('Maize Grain');
    });

    test('falls back to DEFAULT_DEBOUNCE_DELAY_MS if delay argument is invalid or omitted', () => {
      render(<DebounceTestConsumer initialValue="Initial" delay={null} />);
      const input = screen.getByTestId('input-val');

      fireEvent.change(input, { target: { value: 'Updated' } });

      act(() => {
        jest.advanceTimersByTime(DEFAULT_DEBOUNCE_DELAY_MS - 50);
      });
      expect(screen.getByTestId('output-debounced').textContent).toBe('Initial');

      act(() => {
        jest.advanceTimersByTime(50);
      });
      expect(screen.getByTestId('output-debounced').textContent).toBe('Updated');
    });

    test('cleans up timeout timer on unmount without throwing errors', () => {
      const { unmount } = render(<DebounceTestConsumer initialValue="First" delay={500} />);
      const input = screen.getByTestId('input-val');

      fireEvent.change(input, { target: { value: 'Second' } });
      unmount();

      act(() => {
        jest.advanceTimersByTime(500);
      });
      // Expect clean unmount without memory warnings
    });
  });

  describe('useDebouncedCallback', () => {
    test('delays function invocation until timeout has elapsed', () => {
      const callback = jest.fn();
      render(<CallbackTestConsumer onTrigger={callback} delay={200} />);

      const btn = screen.getByTestId('btn-trigger');
      fireEvent.click(btn);
      fireEvent.click(btn);
      fireEvent.click(btn);

      expect(callback).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(199);
      });
      expect(callback).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('Triggered');
    });

    test('supports manual cancellation via .cancel()', () => {
      const callback = jest.fn();
      render(<CallbackTestConsumer onTrigger={callback} delay={200} />);

      fireEvent.click(screen.getByTestId('btn-trigger'));
      fireEvent.click(screen.getByTestId('btn-cancel'));

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    test('supports immediate flush execution via .flush()', () => {
      const callback = jest.fn();
      render(<CallbackTestConsumer onTrigger={callback} delay={500} />);

      fireEvent.click(screen.getByTestId('btn-trigger-custom'));
      expect(callback).not.toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('btn-flush'));
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('Custom Payload');

      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('handles leading-edge execution when configured', () => {
      const callback = jest.fn();
      render(
        <CallbackTestConsumer
          onTrigger={callback}
          delay={300}
          options={{ leading: true, trailing: false }}
        />
      );

      fireEvent.click(screen.getByTestId('btn-trigger'));
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('Triggered');

      fireEvent.click(screen.getByTestId('btn-trigger'));
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('useDebounceSearch', () => {
    test('initializes with given value and reports isDebouncing false', () => {
      const onSearch = jest.fn();
      render(<SearchTestConsumer initialValue="Tomatoes" delay={250} onSearch={onSearch} />);

      expect(screen.getByTestId('search-input').value).toBe('Tomatoes');
      expect(screen.getByTestId('search-debounced').textContent).toBe('Tomatoes');
      expect(screen.getByTestId('search-status').textContent).toBe('idle');
      expect(onSearch).not.toHaveBeenCalled();
    });

    test('reports isDebouncing true while waiting for delay, then fires onSearch', () => {
      const onSearch = jest.fn();
      render(<SearchTestConsumer initialValue="" delay={250} onSearch={onSearch} />);

      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: 'Bell Peppers' } });

      expect(screen.getByTestId('search-status').textContent).toBe('debouncing');
      expect(onSearch).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(250);
      });

      expect(screen.getByTestId('search-debounced').textContent).toBe('Bell Peppers');
      expect(screen.getByTestId('search-status').textContent).toBe('idle');
      expect(onSearch).toHaveBeenCalledWith('Bell Peppers');
    });

    test('handleClear immediately empties query and calls onSearch with empty string', () => {
      const onSearch = jest.fn();
      render(<SearchTestConsumer initialValue="Old Query" delay={250} onSearch={onSearch} />);

      fireEvent.click(screen.getByTestId('search-clear'));

      expect(screen.getByTestId('search-input').value).toBe('');
      expect(onSearch).toHaveBeenCalledWith('');
    });
  });
});
