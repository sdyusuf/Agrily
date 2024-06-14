import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ColdChainMonitor from './ColdChainMonitor';

const renderColdChainMonitor = () => {
  return render(
    <BrowserRouter>
      <ColdChainMonitor />
    </BrowserRouter>
  );
};

describe('ColdChainMonitor Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders cold chain telemetry dashboard header and live indicators', () => {
    renderColdChainMonitor();

    expect(screen.getByRole('heading', { level: 1, name: /Cold-Chain Sensor Telemetry/i })).toBeInTheDocument();
    expect(screen.getByText(/MQTT LIVE TELEMETRY/i)).toBeInTheDocument();
    expect(screen.getByText(/Continuous IoT environmental monitoring/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to Fleet Tracking/i })).toBeInTheDocument();
  });

  test('renders pod switcher with all preset pods', () => {
    renderColdChainMonitor();

    expect(screen.getAllByText('POD-BERRY-01').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('POD-DAIRY-04')).toBeInTheDocument();
    expect(screen.getByText('POD-MEAT-02')).toBeInTheDocument();
    expect(screen.getByText('POD-GREENS-07')).toBeInTheDocument();
  });

  test('switches active pod when selecting another pod pill', () => {
    renderColdChainMonitor();

    // Default is POD-BERRY-01
    expect(screen.getByText(/Fresh Strawberries & Blueberries/i)).toBeInTheDocument();

    // Click POD-DAIRY-04
    const dairyPill = screen.getByRole('button', { name: /POD-DAIRY-04/i });
    fireEvent.click(dairyPill);

    expect(screen.getByText(/Pasteurized Organic Whole Milk/i)).toBeInTheDocument();
    expect(screen.getByText(/KBZ 982Y/i)).toBeInTheDocument();
  });

  test('displays critical excursion banner when selecting pod with open door or breach', () => {
    renderColdChainMonitor();

    // Switch to POD-MEAT-02 which has an open door and temperature excursion
    const meatPill = screen.getByRole('button', { name: /POD-MEAT-02/i });
    fireEvent.click(meatPill);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Reefer Door Breach Detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Chilled Pasture-Raised Beef Sirloin/i)).toBeInTheDocument();

    // Can resolve/dismiss the alert
    const resolveBtn = screen.getByRole('button', { name: /Resolve Alert/i });
    fireEvent.click(resolveBtn);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('renders both Core Cargo Temperature and Relative Humidity gauges', () => {
    renderColdChainMonitor();

    expect(screen.getByText(/Core Cargo Temperature/i)).toBeInTheDocument();
    expect(screen.getByText(/Relative Humidity/i)).toBeInTheDocument();
    expect(screen.getByText(/Reefer Probe #1/i)).toBeInTheDocument();
    expect(screen.getByText(/Hygrometer #1/i)).toBeInTheDocument();
  });

  test('renders secondary metric cards: bay door, battery, and shelf-life', () => {
    renderColdChainMonitor();

    expect(screen.getByText(/Bay Door Status/i)).toBeInTheDocument();
    expect(screen.getByText(/Pod Battery & Telemetry/i)).toBeInTheDocument();
    expect(screen.getByText(/Dynamic Shelf-Life/i)).toBeInTheDocument();
    expect(screen.getByText(/Sealed & Locked/i)).toBeInTheDocument();
  });

  test('opens and closes the compliance audit certificate modal', () => {
    renderColdChainMonitor();

    const certBtn = screen.getByRole('button', { name: /Audit Certificate/i });
    fireEvent.click(certBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Cold-Chain Chain-of-Custody Certificate/i)).toBeInTheDocument();
    expect(screen.getByText(/VERIFIED PASS/i)).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /Close Modal/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('triggers sync pings button without errors', async () => {
    renderColdChainMonitor();

    const syncBtn = screen.getByRole('button', { name: /Sync Pings/i });
    fireEvent.click(syncBtn);

    expect(screen.getByText(/Syncing\.\.\./i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Sync Pings/i)).toBeInTheDocument();
    }, { timeout: 2500 });
  });
});
