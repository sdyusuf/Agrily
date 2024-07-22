import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import WaybillQrModal from './WaybillQrModal';

jest.mock('axios');

describe('WaybillQrModal Component', () => {
  const mockWaybill = {
    waybillNumber: 'WB-20240716-TEST01',
    integrityHash: '07becf0e6eaa6dd02901a91e45ff99120482bbda',
    verificationToken: '2f4a9206f884229445a0cfc0f4fc191d',
    qrVerificationUrl: 'https://agrily.com/waybills/verify/WB-20240716-TEST01?token=2f4a9206f884229445a0cfc0f4fc191d',
    totalNetWeightKg: 1850,
    securitySeals: [{ sealNumber: 'SEAL-AGR-4412' }]
  };

  test('renders modal with QR frame, hash display, and token', () => {
    render(<WaybillQrModal waybill={mockWaybill} isOpen={true} onClose={() => {}} />);

    expect(screen.getByTestId('waybill-qr-modal')).toBeInTheDocument();
    expect(screen.getByTestId('qr-matrix-frame')).toBeInTheDocument();
    expect(screen.getByTestId('integrity-hash-display')).toHaveTextContent('07becf0e6eaa6dd02901a91e45ff99120482bbda');
    expect(screen.getByTestId('verification-token-display')).toHaveTextContent('2f4a9206f884229445a0cfc0f4fc191d');
    expect(screen.getByTestId('verification-url-input')).toHaveValue(mockWaybill.qrVerificationUrl);
  });

  test('does not render when isOpen is false', () => {
    const { container } = render(<WaybillQrModal waybill={mockWaybill} isOpen={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  test('simulates scan verification and displays authentic confirmation banner', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        verified: true,
        waybillNumber: 'WB-20240716-TEST01',
        message: 'Waybill authenticity verified. Cryptographic SHA-256 seal matches Agrily central authority.'
      }
    });

    render(<WaybillQrModal waybill={mockWaybill} isOpen={true} onClose={() => {}} />);

    const scanBtn = screen.getByTestId('btn-simulate-scan');
    fireEvent.click(scanBtn);

    await waitFor(() => {
      expect(screen.getByTestId('verification-result-banner')).toBeInTheDocument();
      expect(screen.getByText('Cryptographically Verified Authentic')).toBeInTheDocument();
    });
  });

  test('triggers onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(<WaybillQrModal waybill={mockWaybill} isOpen={true} onClose={handleClose} />);

    fireEvent.click(screen.getByTestId('close-qr-modal'));
    expect(handleClose).toHaveBeenCalled();
  });
});
