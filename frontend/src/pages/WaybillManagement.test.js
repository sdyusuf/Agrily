import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import WaybillManagement from './WaybillManagement';

jest.mock('axios');

describe('WaybillManagement Cockpit Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: []
      }
    });
  });

  test('renders cockpit headline, domain pill, and KPI summary cards', () => {
    render(<WaybillManagement />);

    expect(screen.getByText('Logistics & Legal Freight Conveyance')).toBeInTheDocument();
    expect(screen.getByText('Agricultural Digital Waybills & Invoicing')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-total-waybills')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-in-transit')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-tonnage')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-escrow-value')).toBeInTheDocument();
  });

  test('renders initial waybills in grid with codes and status pills', () => {
    render(<WaybillManagement />);

    expect(screen.getByText('WB-20240716-KAD01')).toBeInTheDocument();
    expect(screen.getByText('WB-20240716-PLT02')).toBeInTheDocument();
    expect(screen.getByText('WB-20240715-KAN03')).toBeInTheDocument();
    expect(screen.getByText('In Road Transit')).toBeInTheDocument();
  });

  test('filters waybills when status tabs are clicked', () => {
    render(<WaybillManagement />);

    const inTransitTab = screen.getByTestId('tab-in_transit');
    fireEvent.click(inTransitTab);

    expect(screen.getByText('WB-20240716-KAD01')).toBeInTheDocument();
    expect(screen.queryByText('WB-20240716-PLT02')).not.toBeInTheDocument(); // PLT02 is ISSUED
  });

  test('filters waybills by search query', () => {
    render(<WaybillManagement />);

    const searchInput = screen.getByTestId('waybill-search-input');
    fireEvent.change(searchInput, { target: { value: 'Hadejia' } });

    expect(screen.getByText('WB-20240715-KAN03')).toBeInTheDocument();
    expect(screen.queryByText('WB-20240716-KAD01')).not.toBeInTheDocument();
  });

  test('opens and closes WaybillQrModal on Verify QR button click', () => {
    render(<WaybillManagement />);

    const qrBtns = screen.getAllByTestId('btn-view-qr');
    fireEvent.click(qrBtns[0]);

    expect(screen.getByTestId('waybill-qr-modal')).toBeInTheDocument();
    expect(screen.getByText('Official Waybill Verification QR')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('close-qr-modal'));
    expect(screen.queryByTestId('waybill-qr-modal')).not.toBeInTheDocument();
  });

  test('opens and closes InvoicePreviewModal on Invoice button click', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          invoiceNumber: 'INV-20240716-KAD01',
          status: 'ISSUED',
          currency: 'NGN',
          seller: { entityName: 'Makarfi Syndicate', taxIdentificationNumber: 'TIN-01' },
          buyer: { entityName: 'Kano Foods', billingAddress: 'Plot 44 Bompai' },
          items: [{ commodityName: 'Roma Tomatoes', quantity: 1850, unitPrice: 350, totalAmount: 647500 }],
          produceSubtotal: 647500,
          freightHaulageFee: 45000,
          totalInvoiceAmount: 722928.44
        }
      }
    });

    render(<WaybillManagement />);

    const invoiceBtns = screen.getAllByTestId('btn-view-invoice');
    fireEvent.click(invoiceBtns[0]);

    await waitFor(() => {
      expect(screen.getByTestId('invoice-preview-modal')).toBeInTheDocument();
      expect(screen.getByText('Commercial Tax Invoice')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('close-invoice-modal'));
    expect(screen.queryByTestId('invoice-preview-modal')).not.toBeInTheDocument();
  });

  test('opens Custody Transfer modal, enters handover details, and executes transition', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        status: 'IN_TRANSIT'
      }
    });

    render(<WaybillManagement />);

    const transferBtns = screen.getAllByTestId('btn-custody-transfer');
    fireEvent.click(transferBtns[1]); // Click for PLT02 (currently ISSUED)

    expect(screen.getByTestId('custody-transfer-modal')).toBeInTheDocument();
    expect(screen.getByText('Log Custody Handover')).toBeInTheDocument();

    const receiverInput = screen.getByTestId('input-receiver-name');
    fireEvent.change(receiverInput, { target: { value: 'Suleiman Audu' } });

    const submitBtn = screen.getByTestId('btn-confirm-transfer');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('custody-transfer-modal')).not.toBeInTheDocument();
    });
  });

  test('handles print waybill button by opening print route in new tab', () => {
    window.open = jest.fn();
    render(<WaybillManagement />);

    const printBtns = screen.getAllByTestId('btn-print-waybill');
    fireEvent.click(printBtns[0]);

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('/api/waybills/WB-20240716-KAD01/print'),
      '_blank'
    );
  });
});
