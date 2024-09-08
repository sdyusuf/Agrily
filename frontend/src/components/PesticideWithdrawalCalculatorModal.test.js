/**
 * @file PesticideWithdrawalCalculatorModal.test.js
 * @description Unit tests for PesticideWithdrawalCalculatorModal component.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PesticideWithdrawalCalculatorModal from './PesticideWithdrawalCalculatorModal';

describe('PesticideWithdrawalCalculatorModal Component Tests', () => {
  test('renders modal when isOpen is true', () => {
    const handleClose = jest.fn();
    render(<PesticideWithdrawalCalculatorModal isOpen={true} onClose={handleClose} />);

    expect(screen.getByText(/Pesticide Residue & Withdrawal Calculator/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Agro-Chemical Applied/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date of Last Foliar Spray/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Market Standard/i)).toBeInTheDocument();
    expect(screen.getByTestId('phi-verdict-banner')).toBeInTheDocument();
  });

  test('does not render when isOpen is false', () => {
    render(<PesticideWithdrawalCalculatorModal isOpen={false} onClose={jest.fn()} />);

    expect(screen.queryByTestId('pesticide-withdrawal-calculator-modal')).not.toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(<PesticideWithdrawalCalculatorModal isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: /Close modal/i });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('evaluates biological spray as safe for immediate harvest with zero PHI', () => {
    render(
      <PesticideWithdrawalCalculatorModal
        isOpen={true}
        onClose={jest.fn()}
        initialFormulation="BACILLUS_THURINGIENSIS_2X"
      />
    );

    const select = screen.getByLabelText(/Agro-Chemical Applied/i);
    fireEvent.change(select, { target: { value: 'BACILLUS_THURINGIENSIS_2X' } });

    expect(screen.getByText(/PRODUCE CLEARED: SAFE FOR HARVEST/i)).toBeInTheDocument();
    expect(screen.getByText(/Required Withdrawal:/i)).toHaveTextContent('0 Days');
  });
});
