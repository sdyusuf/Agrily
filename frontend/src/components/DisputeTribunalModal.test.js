import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DisputeTribunalModal from './DisputeTribunalModal';

describe('DisputeTribunalModal Component Tests', () => {
  const mockVault = {
    vaultNumber: 'VAULT-2024-TEST-TRIB',
    totalPrincipalNgn: 2500000
  };

  test('does not render when show is false', () => {
    const { container } = render(
      <DisputeTribunalModal
        show={false}
        onClose={jest.fn()}
        vault={mockVault}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders modal heading, vault number, and algorithmic simulator', () => {
    render(
      <DisputeTribunalModal
        show={true}
        onClose={jest.fn()}
        vault={mockVault}
      />
    );

    expect(screen.getByText(/Escrow Dispute Tribunal Chamber/i)).toBeInTheDocument();
    expect(screen.getByText(/VAULT-2024-TEST-TRIB/i)).toBeInTheDocument();
    expect(screen.getByText(/Algorithmic Adjudication Engine/i)).toBeInTheDocument();
    expect(screen.getByTestId('dispute-tribunal-modal')).toBeInTheDocument();
  });

  test('invokes onClose when dismiss or close button is clicked', () => {
    const handleClose = jest.fn();
    render(
      <DisputeTribunalModal
        show={true}
        onClose={handleClose}
        vault={mockVault}
      />
    );

    fireEvent.click(screen.getByLabelText(/Close arbitration dialog/i));
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Dismiss/i }));
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  test('updates simulated liability split when temperature slider changes', () => {
    render(
      <DisputeTribunalModal
        show={true}
        onClose={jest.fn()}
        vault={mockVault}
      />
    );

    // Initial temp is 14.5°C (> 12°C) -> Carrier fault 80%
    expect(screen.getByText('80%')).toBeInTheDocument();

    // Change temp to 8°C (safe cold-chain)
    const tempInput = screen.getByTestId('range-transit-temp');
    fireEvent.change(tempInput, { target: { value: '8' } });

    // Changes simulation to settlement split or harvest fault
    expect(screen.queryByText('80%')).not.toBeInTheDocument();
  });

  test('validates statement length and submits dispute docket', () => {
    const handleSubmit = jest.fn();
    render(
      <DisputeTribunalModal
        show={true}
        onClose={jest.fn()}
        vault={mockVault}
        onSubmitDispute={handleSubmit}
      />
    );

    const submitBtn = screen.getByTestId('btn-submit-dispute');
    const textarea = screen.getByTestId('textarea-dispute-description');

    // Attempt submit with short description (< 15 chars)
    fireEvent.change(textarea, { target: { value: 'Short error' } });
    fireEvent.click(submitBtn);

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/minimum 15 characters/i)).toBeInTheDocument();

    // Fill valid description
    fireEvent.change(textarea, {
      target: { value: 'Produce arrived with 25% rot and temperature excursion in reefer.' }
    });
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const payload = handleSubmit.mock.calls[0][0];
    expect(payload.disputeReasonCategory).toBe('EXCESSIVE_SPOILAGE_ROTTEN');
    expect(payload.claimantStatement).toContain('Produce arrived with 25% rot');
    expect(payload.evidenceLocker).toBeDefined();
  });
});
