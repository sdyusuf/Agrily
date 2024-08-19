/**
 * @file FreightRateCalculatorCard.test.js
 * @description Unit tests for FreightRateCalculatorCard React component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FreightRateCalculatorCard from './FreightRateCalculatorCard';

describe('FreightRateCalculatorCard Component', () => {
  test('renders origin and destination dropdowns with Nigerian states', () => {
    render(<FreightRateCalculatorCard defaultOrigin="KANO" defaultDestination="LAGOS" />);

    expect(screen.getByLabelText(/origin state/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/destination state/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('KANO')).toBeInTheDocument();
    expect(screen.getByDisplayValue('LAGOS')).toBeInTheDocument();
  });

  test('displays calculated freight tariff breakdown', () => {
    render(<FreightRateCalculatorCard defaultOrigin="KANO" defaultDestination="LAGOS" defaultTonnage={10} />);

    expect(screen.getByText(/estimated freight tariff/i)).toBeInTheDocument();
    expect(screen.getByText(/yield metric/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy quote/i })).toBeInTheDocument();
  });

  test('toggles cold-chain reefer and updates tariff display', () => {
    render(<FreightRateCalculatorCard defaultOrigin="PLATEAU" defaultDestination="RIVERS" defaultTonnage={5} />);

    const reeferBtn = screen.getByRole('button', { name: /ambient transit/i });
    fireEvent.click(reeferBtn);

    expect(screen.getByRole('button', { name: /active reefer/i })).toBeInTheDocument();
    expect(screen.getByText(/reefer cold-chain assurance/i)).toBeInTheDocument();
  });

  test('triggers onQuoteCalculated and onBookDispatch callbacks', () => {
    const handleQuote = jest.fn();
    const handleBook = jest.fn();

    render(
      <FreightRateCalculatorCard
        defaultOrigin="BENUE"
        defaultDestination="LAGOS"
        onQuoteCalculated={handleQuote}
        onBookDispatch={handleBook}
      />
    );

    expect(handleQuote).toHaveBeenCalled();

    const dispatchBtn = screen.getByRole('button', { name: /dispatch consignment/i });
    fireEvent.click(dispatchBtn);
    expect(handleBook).toHaveBeenCalledTimes(1);
  });
});
