import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EscrowStatusBadge from './EscrowStatusBadge';
import EscrowReleaseModal from './EscrowReleaseModal';

describe('EscrowStatusBadge & EscrowReleaseModal Component Tests', () => {
  describe('EscrowStatusBadge', () => {
    test('renders locked escrow badge with amount', () => {
      render(
        <EscrowStatusBadge
          status="DEPOSITED_LOCKED"
          currency="NGN"
          amount={150000}
        />
      );

      expect(screen.getByText(/Funds Locked in Escrow/i)).toBeInTheDocument();
      expect(screen.getByText(/NGN 150,000/i)).toBeInTheDocument();
    });

    test('renders status variations properly (inspection, released, disputed)', () => {
      const { rerender } = render(<EscrowStatusBadge status="INSPECTION_PENDING" />);
      expect(screen.getByText(/Inspection Window Open/i)).toBeInTheDocument();

      rerender(<EscrowStatusBadge status="RELEASED_TO_FARMER" />);
      expect(screen.getByText(/Disbursed to Producer/i)).toBeInTheDocument();

      rerender(<EscrowStatusBadge status="DISPUTED" />);
      expect(screen.getByText(/Arbitration Freeze/i)).toBeInTheDocument();
    });

    test('renders milestone stepper when showStepper is true', () => {
      render(
        <EscrowStatusBadge
          status="IN_TRANSIT_SECURED"
          showStepper={true}
        />
      );

      expect(screen.getByLabelText(/Escrow Lifecycle Progress/i)).toBeInTheDocument();
      expect(screen.getByText(/1\. Deposit Locked/i)).toBeInTheDocument();
      expect(screen.getByText(/2\. Transit Checkpoint/i)).toBeInTheDocument();
      expect(screen.getByText(/3\. Inspection Period/i)).toBeInTheDocument();
    });

    test('invokes onClick handler when clicked', () => {
      const handleClick = jest.fn();
      render(<EscrowStatusBadge status="DEPOSITED_LOCKED" onClick={handleClick} />);

      const badge = screen.getByTestId('escrow-status-badge');
      fireEvent.click(badge);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('EscrowReleaseModal', () => {
    const mockContract = {
      contractId: 'ESC-2024-991',
      orderId: 'ORD-77123',
      buyerEmail: 'buyer@agrily.com',
      farmerEmail: 'farmer@agrily.com',
      farmerName: 'Ibrahim Kaduna',
      currency: 'NGN',
      totalAmount: 150000,
      farmerPayoutAmount: 147750
    };

    test('does not render when isOpen is false', () => {
      render(
        <EscrowReleaseModal
          isOpen={false}
          onClose={jest.fn()}
          contract={mockContract}
          onConfirmRelease={jest.fn()}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('renders contract details and disables submit until checks and PIN are entered', () => {
      render(
        <EscrowReleaseModal
          isOpen={true}
          onClose={jest.fn()}
          contract={mockContract}
          onConfirmRelease={jest.fn()}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('ESC-2024-991')).toBeInTheDocument();
      expect(screen.getByText(/Ibrahim Kaduna/i)).toBeInTheDocument();

      const submitBtn = screen.getByRole('button', { name: /Authorize Disbursement/i });
      expect(submitBtn).toBeDisabled();
    });

    test('enables authorization button and submits release payload when checks are satisfied', () => {
      const handleConfirm = jest.fn();
      render(
        <EscrowReleaseModal
          isOpen={true}
          onClose={jest.fn()}
          contract={mockContract}
          onConfirmRelease={handleConfirm}
        />
      );

      // Check both checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      // Fill authorization PIN
      const pinInput = screen.getByPlaceholderText(/e\.g\. AUTH-9821/i);
      fireEvent.change(pinInput, { target: { value: 'AUTH-SECURE-99' } });

      const submitBtn = screen.getByRole('button', { name: /Authorize Disbursement/i });
      expect(submitBtn).not.toBeDisabled();

      fireEvent.click(submitBtn);

      expect(handleConfirm).toHaveBeenCalledWith({
        contractId: 'ESC-2024-991',
        milestoneIndex: 1,
        buyerSignature: 'AUTH-SECURE-99'
      });
    });
  });
});
