import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SatelliteDroughtRiskCard from '../SatelliteDroughtRiskCard';

describe('🛰️ SatelliteDroughtRiskCard Component', () => {
  const defaultProps = {
    parcelName: 'Kano North Irrigation Plot 4B',
    cropType: 'Maize',
    zoneName: 'Sudan Savanna',
    meanNdvi: 0.65,
    lstCelsius: 32.5,
    vciPct: 58.0,
    tciPct: 52.0,
    tvdi: 0.42,
    cwsi: 0.38
  };

  test('renders drought radar header, parcel metadata, and default normal moisture tier', () => {
    render(<SatelliteDroughtRiskCard {...defaultProps} />);

    expect(screen.getByTestId('satellite-drought-risk-card')).toBeInTheDocument();
    expect(screen.getByText(/Kano North Irrigation Plot 4B/i)).toBeInTheDocument();
    expect(screen.getByText(/Sudan Savanna/i)).toBeInTheDocument();
    expect(screen.getByTestId('drought-tier-badge')).toBeInTheDocument();
    expect(screen.getByText(/D_NORMAL/i)).toBeInTheDocument();
  });

  test('displays key remote sensing index values (VHI, TVDI, CWSI, LST)', () => {
    render(<SatelliteDroughtRiskCard {...defaultProps} />);

    // 0.5 * 58 + 0.5 * 52 = 55%
    expect(screen.getByText(/55%/i)).toBeInTheDocument();
    expect(screen.getByText('0.42')).toBeInTheDocument();
    expect(screen.getByText('0.38')).toBeInTheDocument();
    expect(screen.getAllByText(/32.5°C/i).length).toBeGreaterThanOrEqual(1);
  });

  test('updates drought tier and indices when moving the temperature simulator slider', () => {
    render(<SatelliteDroughtRiskCard {...defaultProps} />);

    const slider = screen.getByTestId('lst-simulator-slider');
    expect(slider).toBeInTheDocument();

    // Simulate extreme heatwave +6°C
    fireEvent.change(slider, { target: { value: '6' } });

    // Effective LST should now be 32.5 + 6 = 38.5°C
    expect(screen.getByText(/38.5°C/i)).toBeInTheDocument();
    // VHI should drop significantly, triggering D1 or D2 drought tier
    const badge = screen.getByTestId('drought-tier-badge');
    expect(badge).not.toHaveTextContent('D_NORMAL');
  });

  test('renders actionable agronomic smallholder prescriptions', () => {
    render(<SatelliteDroughtRiskCard {...defaultProps} />);

    expect(screen.getByText(/Actionable Smallholder Agronomic Prescription/i)).toBeInTheDocument();
    expect(screen.getByText(/Mulch Recommendation/i)).toBeInTheDocument();
    expect(screen.getByText(/Nitrogen Timing/i)).toBeInTheDocument();
  });
});
