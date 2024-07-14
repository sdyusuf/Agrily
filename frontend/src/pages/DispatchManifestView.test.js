/**
 * ==============================================================================
 * DISPATCH MANIFEST VIEW PAGE - UNIT TEST SUITE
 * ==============================================================================
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DispatchManifestView } from './DispatchManifestView';

describe('DispatchManifestView Page', () => {
  test('renders official waybill document and manifest serial number', () => {
    render(
      <BrowserRouter>
        <DispatchManifestView />
      </BrowserRouter>
    );

    expect(screen.getByText('FEDERAL REPUBLIC OF NIGERIA')).toBeInTheDocument();
    expect(screen.getByText('Consignment Waybill & Official Cargo Manifest')).toBeInTheDocument();
    expect(screen.getByTestId('manifest-number')).toHaveTextContent(/MNF-/);
    expect(screen.getByTestId('driver-name')).toHaveTextContent('Musa Abdullahi');
  });

  test('renders itemized consignments table with totals', () => {
    render(
      <BrowserRouter>
        <DispatchManifestView />
      </BrowserRouter>
    );

    expect(screen.getByTestId('consignments-table')).toBeInTheDocument();
    expect(screen.getByText('Makarfi Tomato Outgrowers Cluster, Kaduna')).toBeInTheDocument();
    expect(screen.getByText('Roma Plum Tomatoes')).toBeInTheDocument();
    expect(screen.getByText('Red Creole Onions')).toBeInTheDocument();
    expect(screen.getByTestId('total-weight')).toHaveTextContent('3,250 kg');
  });

  test('displays tamper-evident security seal numbers', () => {
    render(
      <BrowserRouter>
        <DispatchManifestView />
      </BrowserRouter>
    );

    expect(screen.getByTestId('seal-code-0')).toHaveTextContent('SEAL-KD-98231');
    expect(screen.getAllByText('Tamper Seal Verified Intact').length).toBe(2);
  });

  test('allows receiving officer to sign terminal dock verification', () => {
    render(
      <BrowserRouter>
        <DispatchManifestView />
      </BrowserRouter>
    );

    const dockBtn = screen.getByTestId('verify-dock-btn');
    expect(dockBtn).toHaveTextContent('Sign Receiving Dock Verification');

    fireEvent.click(dockBtn);
    expect(dockBtn).toHaveTextContent('Terminal Dock Verified');
    expect(screen.getByText(/Received: Alhaji Sani Bello/)).toBeInTheDocument();
  });
});
