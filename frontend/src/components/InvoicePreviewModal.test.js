import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InvoicePreviewModal from './InvoicePreviewModal';

describe('InvoicePreviewModal Component', () => {
  const mockInvoice = {
    invoiceNumber: 'INV-20240716-8812',
    status: 'ISSUED',
    currency: 'NGN',
    issuedDate: '2024-07-16T10:00:00Z',
    dueDate: '2024-07-23T18:00:00Z',
    seller: {
      entityName: 'Makarfi Agro Producer Syndicate',
      address: 'Agro Extension Zone 3, Makarfi, Kaduna',
      taxIdentificationNumber: 'TIN-NG-88912401',
      contactPhone: '+2348039988771',
      contactEmail: 'coop@makarfiagro.ng'
    },
    buyer: {
      entityName: 'Kano Fresh Foods Processing Ltd',
      billingAddress: 'Plot 44 Bompai Industrial Area, Kano',
      taxIdentificationNumber: 'TIN-NG-99210452',
      contactPhone: '+2348029998877',
      contactEmail: 'procurement@kanofresh.com'
    },
    items: [
      {
        commodityName: 'Roma Tomatoes',
        variety: 'Grade 1 Wholesale',
        quantity: 1850,
        unitOfMeasure: 'kg',
        unitPrice: 350,
        totalAmount: 647500
      }
    ],
    produceSubtotal: 647500,
    freightHaulageFee: 45000,
    coldChainSurcharge: 15000,
    escrowProtectionFee: 9712.5,
    taxVatAmount: 5715.94,
    totalInvoiceAmount: 722928.44,
    invoiceChecksum: '46c301f467f41d57e7829929188401aa8823bcf41029'
  };

  test('renders invoice number, parties, and items table', () => {
    render(<InvoicePreviewModal invoice={mockInvoice} isOpen={true} onClose={() => {}} />);

    expect(screen.getByTestId('invoice-preview-modal')).toBeInTheDocument();
    expect(screen.getByTestId('invoice-number')).toHaveTextContent('INV-20240716-8812');
    expect(screen.getByText('Makarfi Agro Producer Syndicate')).toBeInTheDocument();
    expect(screen.getByText('Kano Fresh Foods Processing Ltd')).toBeInTheDocument();
    expect(screen.getByTestId('invoice-items-table')).toBeInTheDocument();
    expect(screen.getByText('Roma Tomatoes')).toBeInTheDocument();
    expect(screen.getAllByText('₦647,500').length).toBeGreaterThan(0);
  });

  test('displays financial breakdown and grand total correctly', () => {
    render(<InvoicePreviewModal invoice={mockInvoice} isOpen={true} onClose={() => {}} />);

    expect(screen.getByTestId('grand-total-amount')).toHaveTextContent('₦722,928.44');
    expect(screen.getByTestId('invoice-checksum-display')).toHaveTextContent('46c301f467f41d57e7829929188401aa...');
  });

  test('calls onPrint and onClose callbacks', () => {
    const handlePrint = jest.fn();
    const handleClose = jest.fn();

    render(
      <InvoicePreviewModal
        invoice={mockInvoice}
        isOpen={true}
        onClose={handleClose}
        onPrint={handlePrint}
      />
    );

    fireEvent.click(screen.getByTestId('btn-print-invoice'));
    expect(handlePrint).toHaveBeenCalledWith(mockInvoice);

    fireEvent.click(screen.getByTestId('close-invoice-modal'));
    expect(handleClose).toHaveBeenCalled();
  });
});
