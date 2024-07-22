import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WaybillCard from './WaybillCard';

describe('WaybillCard Component', () => {
  const mockWaybill = {
    waybillNumber: 'WB-20240716-TEST01',
    status: 'ISSUED',
    originDepot: { name: 'Zaria Agro Logistics Hub' },
    destinationHub: { name: 'Kano Distribution Terminal' },
    shipper: { contactPerson: 'Musa Danladi', state: 'Kaduna', pickupAddress: 'Makarfi Km 14' },
    consignee: { businessName: 'Kano Fresh Foods Ltd', state: 'Kano' },
    carrier: { driverName: 'Ibrahim Sani', vehicleRegistrationPlate: 'KAD-882-TR' },
    totalNetWeightKg: 1850,
    totalCratesCount: 80,
    estimatedDistanceKm: 128.5,
    securitySeals: [{ sealNumber: 'SEAL-AGR-4412' }],
    consignments: [
      {
        commodityName: 'Roma Tomatoes',
        numberOfCrates: 80,
        netWeightKg: 1850,
        temperatureClass: 'CHILLED',
        perishabilityPriority: 'HIGH'
      }
    ],
    currentHolder: {
      name: 'Musa Danladi',
      role: 'FARMER'
    },
    isHighlyPerishable: true
  };

  test('renders waybill number, status pill, and route corridor', () => {
    render(<WaybillCard waybill={mockWaybill} />);

    expect(screen.getByTestId('waybill-code')).toHaveTextContent('WB-20240716-TEST01');
    expect(screen.getByTestId('waybill-status')).toHaveTextContent('Authorized & Issued');
    expect(screen.getByText('Zaria Agro Logistics Hub')).toBeInTheDocument();
    expect(screen.getByText('Kano Distribution Terminal')).toBeInTheDocument();
    expect(screen.getByText('128.5 km')).toBeInTheDocument();
  });

  test('displays cargo metrics and seal numbers accurately', () => {
    render(<WaybillCard waybill={mockWaybill} />);

    expect(screen.getByText('Roma Tomatoes')).toBeInTheDocument();
    expect(screen.getByText('1,850')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('SEAL-AGR-4412')).toBeInTheDocument();
    expect(screen.getByText('Cold-Chain')).toBeInTheDocument();
  });

  test('invokes action callbacks when buttons are clicked', () => {
    const handleViewQr = jest.fn();
    const handleViewInvoice = jest.fn();
    const handleTransfer = jest.fn();
    const handlePrint = jest.fn();

    render(
      <WaybillCard
        waybill={mockWaybill}
        onViewQr={handleViewQr}
        onViewInvoice={handleViewInvoice}
        onInitiateTransfer={handleTransfer}
        onPrintWaybill={handlePrint}
      />
    );

    fireEvent.click(screen.getByTestId('btn-view-qr'));
    expect(handleViewQr).toHaveBeenCalledWith(mockWaybill);

    fireEvent.click(screen.getByTestId('btn-view-invoice'));
    expect(handleViewInvoice).toHaveBeenCalledWith(mockWaybill);

    fireEvent.click(screen.getByTestId('btn-custody-transfer'));
    expect(handleTransfer).toHaveBeenCalledWith(mockWaybill);

    fireEvent.click(screen.getByTestId('btn-print-waybill'));
    expect(handlePrint).toHaveBeenCalledWith(mockWaybill);
  });
});
