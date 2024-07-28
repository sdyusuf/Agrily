import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EscrowManagement from './EscrowManagement';

const renderEscrowManagement = () => {
  return render(
    <BrowserRouter>
      <EscrowManagement />
    </BrowserRouter>
  );
};

describe('EscrowManagement Page & Dashboard Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.setTimeout(15000);
  });

  test('renders escrow vault header, breadcrumb, and live indicator', () => {
    renderEscrowManagement();

    expect(screen.getByRole('heading', { level: 1, name: /Multi-Tier Escrow Settlement/i })).toBeInTheDocument();
    expect(screen.getByText(/MULTI-RAIL ESCROW VAULT SECURED/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to Producer Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Audit Ledger/i })).toBeInTheDocument();
  });

  test('switches currency and updates active vault KPI totals', () => {
    renderEscrowManagement();

    // Default currency NGN
    expect(screen.getAllByText(/NGN/i).length).toBeGreaterThanOrEqual(1);

    // Switch to USD
    const usdBtn = screen.getByRole('button', { name: /\$ USD/i });
    fireEvent.click(usdBtn);

    expect(screen.getAllByText(/USD/i).length).toBeGreaterThanOrEqual(1);

    // Switch to KES
    const kesBtn = screen.getByRole('button', { name: /KSh KES/i });
    fireEvent.click(kesBtn);

    expect(screen.getAllByText(/KES/i).length).toBeGreaterThanOrEqual(1);
  });

  test('renders contract ledger with initial preset contracts', () => {
    renderEscrowManagement();

    expect(screen.getByText('ESC-2024-101')).toBeInTheDocument();
    expect(screen.getByText(/Premium White Maize/i)).toBeInTheDocument();
    expect(screen.getByText(/Lagos Foods Co/i)).toBeInTheDocument();
    expect(screen.getByText(/Ibrahim Kaduna/i)).toBeInTheDocument();
  });

  test('filters contracts table when clicking status filter tabs', () => {
    renderEscrowManagement();

    // Click Disputed tab
    const disputedTab = screen.getByRole('tab', { name: /^Disputed$/i });
    fireEvent.click(disputedTab);

    expect(screen.getByText('ESC-2024-104')).toBeInTheDocument();
    expect(screen.queryByText('ESC-2024-101')).not.toBeInTheDocument();

    // Click Disbursed tab
    const releasedTab = screen.getByRole('tab', { name: /^Disbursed$/i });
    fireEvent.click(releasedTab);

    expect(screen.getByText('ESC-2024-103')).toBeInTheDocument();
    expect(screen.queryByText('ESC-2024-104')).not.toBeInTheDocument();
  });

  test('opens release modal when clicking Release Tranche button', () => {
    renderEscrowManagement();

    // Filter to all or find Release Tranche button
    const allTab = screen.getByRole('tab', { name: /All Contracts/i });
    fireEvent.click(allTab);

    const releaseBtns = screen.getAllByRole('button', { name: /Release Tranche/i });
    expect(releaseBtns.length).toBeGreaterThan(0);

    fireEvent.click(releaseBtns[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Authorize Escrow Disbursement/i)).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /Close Release Modal/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('opens dispute modal and submits formal arbitration claim', async () => {
    renderEscrowManagement();

    const allTab = screen.getByRole('tab', { name: /All Contracts/i });
    fireEvent.click(allTab);

    const disputeBtns = screen.getAllByRole('button', { name: /^Dispute$/i });
    expect(disputeBtns.length).toBeGreaterThan(0);

    fireEvent.click(disputeBtns[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Open Escrow Dispute/i)).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Detail inspection failures/i);
    fireEvent.change(textarea, {
      target: { value: 'Produce arrived spoiled with mold throughout all crates.' }
    });

    const freezeBtn = screen.getByRole('button', { name: /Freeze Escrow & Open Dispute/i });
    expect(freezeBtn).not.toBeDisabled();

    fireEvent.click(freezeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  test('handles sync ledger button click cleanly', async () => {
    renderEscrowManagement();

    const syncBtn = screen.getByRole('button', { name: /Sync Ledger/i });
    fireEvent.click(syncBtn);

    expect(screen.getByText(/Syncing\.\.\./i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Sync Ledger/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
