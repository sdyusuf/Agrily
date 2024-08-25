import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CorridorTollLevyBreakdownCard from './CorridorTollLevyBreakdownCard';

describe('CorridorTollLevyBreakdownCard', () => {
  it('renders statutory badge, VAT exemption pill, and breakdown columns', () => {
    render(<CorridorTollLevyBreakdownCard />);

    expect(screen.getByTestId('corridor-toll-levy-breakdown-card')).toBeInTheDocument();
    expect(screen.getByText('Interstate Produce Levies & Haulage VAT')).toBeInTheDocument();
    expect(screen.getByTestId('vat-exemption-pill')).toBeInTheDocument();
    expect(screen.getByText('Raw Produce 0% VAT Exempt')).toBeInTheDocument();
    expect(screen.getByTestId('levy-breakdown-grid')).toBeInTheDocument();
  });

  it('updates origin state and dynamically calculates farm-gate inspection fees', () => {
    render(<CorridorTollLevyBreakdownCard />);

    const originSelect = screen.getByTestId('origin-state-select');
    fireEvent.change(originSelect, { target: { value: 'Benue' } });

    expect(originSelect.value).toBe('Benue');
    expect(screen.getByText('1. Benue Farm-Gate Outflow')).toBeInTheDocument();
    expect(screen.getByText('₦18,000')).toBeInTheDocument();
  });

  it('computes 7.5% haulage VAT on base tariff', () => {
    render(<CorridorTollLevyBreakdownCard />);

    // Default base tariff is 850,000, 7.5% of 850,000 is 63,750
    const vatDisplay = screen.getByTestId('vat-amount-display');
    expect(vatDisplay).toHaveTextContent('₦63,750');
  });

  it('scales weighbridge fee when cargo tonnage exceeds 25 tonnes', () => {
    render(<CorridorTollLevyBreakdownCard />);

    const tonnageSlider = screen.getByTestId('corridor-tonnage-input');
    fireEvent.change(tonnageSlider, { target: { value: '28' } });

    expect(tonnageSlider.value).toBe('28');
    expect(screen.getByText(/FRSC Weighbridge Scale \(28T\)/)).toBeInTheDocument();
    expect(screen.getAllByText('₦5,000').length).toBeGreaterThanOrEqual(1);
  });
});
