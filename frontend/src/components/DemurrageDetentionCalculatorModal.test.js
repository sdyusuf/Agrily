import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DemurrageDetentionCalculatorModal from './DemurrageDetentionCalculatorModal';

describe('DemurrageDetentionCalculatorModal', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <DemurrageDetentionCalculatorModal isOpen={false} onClose={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal dialog when isOpen is true', () => {
    render(<DemurrageDetentionCalculatorModal isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByTestId('demurrage-detention-modal')).toBeInTheDocument();
    expect(screen.getByText('Terminal Demurrage & Driver Protection')).toBeInTheDocument();
    expect(screen.getByTestId('terminal-select')).toBeInTheDocument();
    expect(screen.getByTestId('total-demurrage-text')).toBeInTheDocument();
    expect(screen.getByTestId('driver-payout-text')).toBeInTheDocument();
  });

  it('switches terminal hub and recalculates free dwell allowance', () => {
    render(<DemurrageDetentionCalculatorModal isOpen={true} onClose={jest.fn()} />);

    const select = screen.getByTestId('terminal-select');
    fireEvent.change(select, { target: { value: 'DAWANAU' } });

    expect(select.value).toBe('DAWANAU');
    expect(screen.getByText(/Free Dwell Allowance:/)).toBeInTheDocument();
  });

  it('adjusts dwell slider and updates billable detention hours', () => {
    render(<DemurrageDetentionCalculatorModal isOpen={true} onClose={jest.fn()} />);

    const slider = screen.getByTestId('dwell-range-slider');
    fireEvent.change(slider, { target: { value: '12' } });

    expect(slider.value).toBe('12');
    expect(screen.getByText(/12 Hours/)).toBeInTheDocument();
  });

  it('calls onClose callback when clicking close button or backdrop', () => {
    const handleClose = jest.fn();
    render(<DemurrageDetentionCalculatorModal isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByTestId('close-modal-btn');
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
