import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SevenDayEvapotranspirationLedgerCard from '../SevenDayEvapotranspirationLedgerCard';

describe('SevenDayEvapotranspirationLedgerCard Component', () => {
  test('renders 7-day rolling FAO-56 evapotranspiration and auto-refill ledger table', () => {
    render(<SevenDayEvapotranspirationLedgerCard />);

    expect(
      screen.getByTestId('seven-day-evapotranspiration-ledger-card')
    ).toBeInTheDocument();
    expect(screen.getByTestId('ledger-total-applied-badge')).toHaveTextContent(
      '52.3 mm'
    );
    expect(screen.getByTestId('ledger-day-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('ledger-day-row-7')).toBeInTheDocument();
  });
});
