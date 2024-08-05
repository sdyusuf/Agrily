import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EscrowSettlementLedgerCard from './EscrowSettlementLedgerCard';

describe('EscrowSettlementLedgerCard Component Tests', () => {
  const mockVault = {
    vaultNumber: 'VAULT-2024-TEST-999',
    status: 'DELIVERED_PENDING_INSPECTION',
    totalPrincipalNgn: 1000000,
    farmerPayoutNgn: 850000,
    carrierFeeNgn: 100000,
    platformCommissionFee: 35000,
    taxVatWithholding: 15000,
    inspectionWindowClosesAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    qualityCertificate: {
      assignedGrade: 'GRADE_A_EXPORT_PREMIUM'
    },
    milestones: [
      { step: 'DEPOSIT_LOCKED', completed: true },
      { step: 'IN_TRANSIT', completed: true }
    ],
    createdAt: '2024-08-01T10:00:00Z'
  };

  test('renders vault number, status badge, and inspection grade', () => {
    render(<EscrowSettlementLedgerCard vault={mockVault} />);

    expect(screen.getByTestId('vault-number-display')).toHaveTextContent('VAULT-2024-TEST-999');
    expect(screen.getByTestId('vault-status-badge')).toHaveTextContent(/Inspection Window Active/i);
    expect(screen.getByTestId('inspection-grade-pill')).toHaveTextContent(/Grade A: Export Premium/i);
  });

  test('formats principal and tri-party settlement amounts correctly in NGN', () => {
    render(<EscrowSettlementLedgerCard vault={mockVault} />);

    expect(screen.getByTestId('total-principal-display')).toHaveTextContent('₦1,000,000.00');
    expect(screen.getByTestId('farmer-payout-display')).toHaveTextContent('₦850,000.00');
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  test('renders remaining inspection countdown ribbon', () => {
    render(<EscrowSettlementLedgerCard vault={mockVault} />);

    const countdownBox = screen.getByTestId('inspection-countdown-box');
    expect(countdownBox).toBeInTheDocument();
    expect(countdownBox).toHaveTextContent(/remaining in window/i);
  });

  test('triggers onInspect callback when Inspect Produce button is clicked', () => {
    const handleInspect = jest.fn();
    render(
      <EscrowSettlementLedgerCard
        vault={mockVault}
        onInspect={handleInspect}
        userRole="buyer"
      />
    );

    const inspectBtn = screen.getByTestId('btn-open-inspection');
    fireEvent.click(inspectBtn);
    expect(handleInspect).toHaveBeenCalledTimes(1);
    expect(handleInspect).toHaveBeenCalledWith(mockVault);
  });

  test('triggers onDispute callback when Lodge Dispute button is clicked', () => {
    const handleDispute = jest.fn();
    render(
      <EscrowSettlementLedgerCard
        vault={mockVault}
        onDispute={handleDispute}
        userRole="buyer"
      />
    );

    const disputeBtn = screen.getByTestId('btn-open-dispute');
    fireEvent.click(disputeBtn);
    expect(handleDispute).toHaveBeenCalledTimes(1);
    expect(handleDispute).toHaveBeenCalledWith(mockVault);
  });

  test('triggers onRelease callback when Disburse Escrow button is clicked', () => {
    const handleRelease = jest.fn();
    render(
      <EscrowSettlementLedgerCard
        vault={mockVault}
        onRelease={handleRelease}
        userRole="buyer"
      />
    );

    const releaseBtn = screen.getByTestId('btn-release-vault');
    fireEvent.click(releaseBtn);
    expect(handleRelease).toHaveBeenCalledTimes(1);
    expect(handleRelease).toHaveBeenCalledWith(mockVault);
  });

  test('renders dispute alert banner when status is IN_DISPUTE_ARBITRATION', () => {
    const disputedVault = {
      ...mockVault,
      status: 'IN_DISPUTE_ARBITRATION'
    };

    render(<EscrowSettlementLedgerCard vault={disputedVault} />);

    expect(screen.getByTestId('dispute-alert-banner')).toBeInTheDocument();
    expect(screen.getByText(/Tribunal Arbitration Docket Active/i)).toBeInTheDocument();
  });
});
