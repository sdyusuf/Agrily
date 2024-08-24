/**
 * @file FreightPricingDynamicQuoteMatrix.test.js
 * @description Frontend Integration Test Suite for Freight Pricing & Quote Generator
 * Tests route selections, diesel surcharge dynamics, reefer toggle updates, and quote clipboard actions.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FreightRateCalculatorCard from '../components/FreightRateCalculatorCard';
import FleetAnalyticsCockpit from '../pages/FleetAnalyticsCockpit';

describe('Freight Pricing Dynamic Quote Matrix Suite', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            corridors: [],
            leaderboard: { rankings: [] }
          })
      })
    );

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve())
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('dynamically recalculates quote when origin and destination change', () => {
    render(<FreightRateCalculatorCard defaultOrigin="KANO" defaultDestination="LAGOS" defaultTonnage={10} />);

    const origSelect = screen.getByLabelText(/origin state/i);
    const destSelect = screen.getByLabelText(/destination state/i);

    fireEvent.change(origSelect, { target: { value: 'PLATEAU' } });
    fireEvent.change(destSelect, { target: { value: 'RIVERS' } });

    expect(origSelect.value).toBe('PLATEAU');
    expect(destSelect.value).toBe('RIVERS');
    expect(screen.getByText(/estimated freight tariff/i)).toBeInTheDocument();
  });

  test('updates diesel surcharge when diesel price input changes', () => {
    render(<FreightRateCalculatorCard defaultOrigin="KANO" defaultDestination="LAGOS" defaultTonnage={10} />);

    const dieselInput = screen.getByLabelText(/local diesel price/i);
    fireEvent.change(dieselInput, { target: { value: '1200' } });

    expect(screen.getByText(/\+₦250 surcharge/i)).toBeInTheDocument();
    expect(screen.getByText(/diesel inflation surcharge/i)).toBeInTheDocument();
  });

  test('toggles cold-chain reefer premium in line-items', () => {
    render(<FreightRateCalculatorCard defaultOrigin="KANO" defaultDestination="LAGOS" defaultTonnage={15} />);

    // Initially ambient
    expect(screen.queryByText(/reefer cold-chain assurance/i)).not.toBeInTheDocument();

    // Toggle reefer on
    const reeferBtn = screen.getByRole('button', { name: /ambient transit/i });
    fireEvent.click(reeferBtn);

    expect(screen.getByText(/reefer cold-chain assurance/i)).toBeInTheDocument();
  });

  test('copies quote to clipboard on button click', async () => {
    render(<FreightRateCalculatorCard defaultOrigin="KANO" defaultDestination="LAGOS" defaultTonnage={10} />);

    const copyBtn = screen.getByRole('button', { name: /copy quote/i });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText(/✓ quote copied!/i)).toBeInTheDocument();
    });
  });

  test('cockpit page allows switching to calculator tab and requesting quote', async () => {
    render(<FleetAnalyticsCockpit />);

    const calcTab = screen.getByRole('tab', { name: /freight rate calculator/i });
    fireEvent.click(calcTab);

    expect(screen.getByText(/haulage freight rate calculator/i)).toBeInTheDocument();
    const bookBtn = screen.getByRole('button', { name: /dispatch consignment/i });
    fireEvent.click(bookBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/consignment dispatch booking initiated/i);
    });
  });
});
