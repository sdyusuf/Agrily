import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ConsignmentTracking from './ConsignmentTracking';

describe('ConsignmentTracking Page Tests', () => {
  const renderWithRouter = (ui) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  };

  test('renders page heading, search bar, and milestone progress stepper', () => {
    renderWithRouter(<ConsignmentTracking />);

    expect(screen.getByRole('heading', { level: 1, name: /Live Consignment GPS Radar/i })).toBeInTheDocument();
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter Consignment ID.../i)).toBeInTheDocument();
    expect(screen.getByTestId('eta-badge')).toHaveTextContent(/ETA: Today, 18:45 WAT/i);
    expect(screen.getByText('Farm Loaded')).toBeInTheDocument();
    expect(screen.getByText('In Transit')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
  });

  test('displays telemetry dashboard metric cards', () => {
    renderWithRouter(<ConsignmentTracking />);

    expect(screen.getByTestId('card-eta-val')).toHaveTextContent(/3h 15m remaining/i);
    expect(screen.getByTestId('card-distance-val')).toHaveTextContent(/184 km remaining/i);
    expect(screen.getByTestId('card-reefer-val')).toHaveTextContent(/\+3.8°C/i);
    expect(screen.getByTestId('card-pod-val')).toHaveTextContent(/89% Battery/i);
  });

  test('renders carrier driver profile and vehicle specs', () => {
    renderWithRouter(<ConsignmentTracking />);

    expect(screen.getByText('Ibrahim Aliyu Bello')).toBeInTheDocument();
    expect(screen.getByText(/Class C Heavy Freight/i)).toBeInTheDocument();
    expect(screen.getAllByText(/KAD-481-XA/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/4.95 \/ 5.0 Rating/i)).toBeInTheDocument();
    expect(screen.getByText(/142 Verified Hauls/i)).toBeInTheDocument();
  });

  test('submitting search form updates consignment query', () => {
    renderWithRouter(<ConsignmentTracking />);

    const input = screen.getByPlaceholderText(/Enter Consignment ID.../i);
    const trackBtn = screen.getByRole('button', { name: /Track Order/i });

    fireEvent.change(input, { target: { value: 'ORD-TEST-999' } });
    expect(input.value).toBe('ORD-TEST-999');

    fireEvent.click(trackBtn);
    expect(screen.getByText(/ORD-TEST-999/i)).toBeInTheDocument();
  });

  test('clicking share live tracking copies link and shows feedback', () => {
    renderWithRouter(<ConsignmentTracking />);

    const shareBtn = screen.getByRole('button', { name: /Share Live Tracking Link/i });
    expect(shareBtn).toBeInTheDocument();

    fireEvent.click(shareBtn);
    expect(screen.getByText(/Link Copied to Clipboard!/i)).toBeInTheDocument();
  });
});
