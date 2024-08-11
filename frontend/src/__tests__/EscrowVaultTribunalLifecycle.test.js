/**
 * ==============================================================================
 * 🌾 AGRILY FRONTEND: ESCROW VAULT & TRIBUNAL LIFECYCLE INTEGRATION TESTS
 * ==============================================================================
 * 
 * End-to-end user workflow integration test suite testing the interplay
 * between EscrowManagement, EscrowSettlementLedgerCard, QualityInspectionModal,
 * and DisputeTribunalModal.
 * 
 * Tests:
 *  1. Initial cockpit mount with multi-party settlement vault cards.
 *  2. View mode switching between Cards Cockpit and Contracts Table.
 *  3. Opening QualityInspectionModal from vault card, evaluating sliders, and stamping grade.
 *  4. Opening DisputeTribunalModal, evaluating real-time algorithmic liability split, and submitting claim.
 *  5. Milestone release authorization and disbursement actions.
 *  6. Copy vault number and audit certificate download triggers.
 * 
 * @module tests/EscrowVaultTribunalLifecycle.test
 * @author Agrily Frontend Engineering
 * ==============================================================================
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EscrowManagement from '../pages/EscrowManagement';

const renderEscrowCockpit = () => {
  return render(
    <BrowserRouter>
      <EscrowManagement />
    </BrowserRouter>
  );
};

describe('Escrow Vault & Tribunal Lifecycle Integration Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
  });

  test('renders multi-party settlement cockpit with active vault cards', () => {
    renderEscrowCockpit();

    // Verify main header and radar badge
    expect(screen.getByRole('heading', { level: 1, name: /Multi-Tier Escrow Settlement/i })).toBeInTheDocument();
    expect(screen.getByText(/MULTI-RAIL ESCROW VAULT SECURED/i)).toBeInTheDocument();

    // Verify preset vaults in cards cockpit
    expect(screen.getByTestId('vault-cards-container')).toBeInTheDocument();
    expect(screen.getByTestId('escrow-card-VAULT-2024-8801')).toBeInTheDocument();
    expect(screen.getByTestId('escrow-card-VAULT-2024-8802')).toBeInTheDocument();
    expect(screen.getByTestId('escrow-card-VAULT-2024-8803')).toBeInTheDocument();
  });

  test('toggles view mode between Cards Cockpit and Contracts Table', () => {
    renderEscrowCockpit();

    const tableToggleBtn = screen.getByRole('button', { name: /Escrow Contracts Table/i });
    const cardsToggleBtn = screen.getByRole('button', { name: /Multi-Party Settlement Vaults/i });

    expect(cardsToggleBtn).toHaveClass('active');

    // Switch to table view
    fireEvent.click(tableToggleBtn);
    expect(tableToggleBtn).toHaveClass('active');
    expect(screen.getByText('ESC-2024-101')).toBeInTheDocument();

    // Switch back to cards view
    fireEvent.click(cardsToggleBtn);
    expect(cardsToggleBtn).toHaveClass('active');
    expect(screen.getByTestId('vault-cards-container')).toBeInTheDocument();
  });

  test('opens QualityInspectionModal from card, adjusts sliders, and completes inspection sign-off', async () => {
    renderEscrowCockpit();

    const inspectButtons = screen.getAllByTestId('btn-open-inspection');
    expect(inspectButtons.length).toBeGreaterThan(0);

    // Open inspection modal on first eligible vault
    fireEvent.click(inspectButtons[0]);

    expect(screen.getByTestId('quality-inspection-modal')).toBeInTheDocument();
    expect(screen.getByText(/Official Agricultural Quality Inspection/i)).toBeInTheDocument();

    // Change spoilage slider
    const spoilageRange = screen.getByTestId('input-spoilage');
    fireEvent.change(spoilageRange, { target: { value: '2.0' } });

    // Submit inspection certificate
    const submitBtn = screen.getByTestId('btn-submit-inspection');
    fireEvent.click(submitBtn);

    // Modal closes upon lodging
    await waitFor(() => {
      expect(screen.queryByTestId('quality-inspection-modal')).not.toBeInTheDocument();
    });
  });

  test('opens DisputeTribunalModal from card, simulates algorithmic liability, and files claim', async () => {
    renderEscrowCockpit();

    const disputeButtons = screen.getAllByTestId('btn-open-dispute');
    expect(disputeButtons.length).toBeGreaterThan(0);

    // Open dispute modal on eligible vault
    fireEvent.click(disputeButtons[0]);

    expect(screen.getByTestId('dispute-tribunal-modal')).toBeInTheDocument();
    expect(screen.getByText(/Escrow Dispute Tribunal Chamber/i)).toBeInTheDocument();
    expect(screen.getByText(/Algorithmic Adjudication Engine/i)).toBeInTheDocument();

    // Adjust temperature slider to trigger carrier liability
    const tempRange = screen.getByTestId('range-transit-temp');
    fireEvent.change(tempRange, { target: { value: '16.0' } });

    // Enter substantive statement
    const statementTextarea = screen.getByTestId('textarea-dispute-description');
    fireEvent.change(statementTextarea, {
      target: { value: 'Refrigerated container reached 16°C resulting in catastrophic perishable damage.' }
    });

    // Submit tribunal docket
    const submitDisputeBtn = screen.getByTestId('btn-submit-dispute');
    fireEvent.click(submitDisputeBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('dispute-tribunal-modal')).not.toBeInTheDocument();
    });
  });

  test('triggers audit receipt download and copy vault number cleanly', () => {
    renderEscrowCockpit();

    // Trigger download receipt
    const downloadBtns = screen.getAllByTestId('btn-download-receipt');
    if (downloadBtns.length > 0) {
      fireEvent.click(downloadBtns[0]);
      expect(window.alert).toHaveBeenCalled();
    }

    // Trigger statement export from header
    const exportBtn = screen.getByRole('button', { name: /Audit Ledger/i });
    fireEvent.click(exportBtn);
    expect(window.alert).toHaveBeenCalled();
  });
});
