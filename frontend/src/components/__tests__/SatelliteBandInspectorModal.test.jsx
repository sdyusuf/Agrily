import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SatelliteBandInspectorModal from '../SatelliteBandInspectorModal';

describe('🛰️ SatelliteBandInspectorModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    parcelName: 'Kano Maize Cluster 04',
    mgrsTile: '32NNQ',
    observationDate: '2024-09-22'
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('does not render when isOpen is false', () => {
    const { container } = render(
      <SatelliteBandInspectorModal {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders modal header, parcel name, MGRS tile, and default active band (B08)', () => {
    render(<SatelliteBandInspectorModal {...defaultProps} />);

    expect(screen.getByTestId('satellite-band-inspector-modal')).toBeInTheDocument();
    expect(screen.getByText(/Kano Maize Cluster 04/i)).toBeInTheDocument();
    expect(screen.getByText(/32NNQ/i)).toBeInTheDocument();
    expect(screen.getByText(/Near Infrared \(NIR\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/842 nm/i).length).toBeGreaterThanOrEqual(1);
  });

  test('switches selected band details when clicking a band chip', () => {
    render(<SatelliteBandInspectorModal {...defaultProps} />);

    // Click Red Edge 1 (B05)
    const b05Btn = screen.getByTestId('band-chip-B05');
    fireEvent.click(b05Btn);

    expect(screen.getByText(/Vegetation Red Edge 1/i)).toBeInTheDocument();
    expect(screen.getAllByText(/705 nm/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/RED_EDGE SPECTRUM/i)).toBeInTheDocument();
  });

  test('toggles reference land cover signature curves in comparison chart', () => {
    render(<SatelliteBandInspectorModal {...defaultProps} />);

    const bareSoilToggle = screen.getByTestId('toggle-BARE_SOIL');
    expect(bareSoilToggle).not.toHaveClass('active');

    fireEvent.click(bareSoilToggle);
    expect(bareSoilToggle).toHaveClass('active');

    fireEvent.click(bareSoilToggle);
    expect(bareSoilToggle).not.toHaveClass('active');
  });

  test('calls onClose when close icon button or dismiss button is clicked', () => {
    render(<SatelliteBandInspectorModal {...defaultProps} />);

    const closeBtn = screen.getByTestId('close-band-inspector-btn');
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);

    const dismissBtn = screen.getByTestId('dismiss-band-inspector-btn');
    fireEvent.click(dismissBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(2);
  });

  test('triggers onClose on Escape key press', () => {
    render(<SatelliteBandInspectorModal {...defaultProps} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
