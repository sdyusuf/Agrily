import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LiveTransitMap from './LiveTransitMap';

describe('LiveTransitMap Component Tests', () => {
  const mockTelemetry = {
    coordinates: { lng: -0.7812, lat: 6.4251 },
    speedKmh: 72.5,
    headingDegrees: 180,
    altitudeMeters: 160,
    batteryLevelPct: 94,
    cargoTemperatureC: 4.2,
    recordedAt: '2024-05-27T10:00:00Z'
  };

  const mockBreadcrumbs = [
    { coordinates: { lng: -1.3658, lat: 7.3789 } },
    { coordinates: { lng: -1.1850, lat: 7.0210 } },
    { coordinates: { lng: -0.7812, lat: 6.4251 } }
  ];

  test('renders transit map with consignment ID, driver name, and active status', () => {
    render(
      <LiveTransitMap
        consignmentOrderId="ORD-GH-5544"
        driverName="Kwame Asare"
        vehicleRegistration="GT-9921-22"
        currentTelemetry={mockTelemetry}
        breadcrumbs={mockBreadcrumbs}
        isLive={true}
      />
    );

    expect(screen.getByTestId('live-transit-map')).toBeInTheDocument();
    expect(screen.getByText(/ORD-GH-5544/i)).toBeInTheDocument();
    expect(screen.getByText(/Kwame Asare/i)).toBeInTheDocument();
    expect(screen.getAllByText(/GT-9921-22/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('live-status-pill')).toHaveTextContent(/Live Telemetry Active/i);
  });

  test('displays telemetry metrics accurately in the stats ribbon', () => {
    render(
      <LiveTransitMap
        currentTelemetry={mockTelemetry}
        breadcrumbs={mockBreadcrumbs}
      />
    );

    expect(screen.getByTestId('metric-speed')).toHaveTextContent('72.5');
    expect(screen.getByTestId('metric-heading')).toHaveTextContent('180°');
    expect(screen.getByTestId('metric-temp')).toHaveTextContent('4.2');
    expect(screen.getByTestId('metric-battery')).toHaveTextContent('94%');
    expect(screen.getByTestId('metric-altitude')).toHaveTextContent('160');
  });

  test('allows zooming in and out via map controls', () => {
    render(
      <LiveTransitMap
        currentTelemetry={mockTelemetry}
        breadcrumbs={mockBreadcrumbs}
      />
    );

    const zoomInBtn = screen.getByRole('button', { name: /zoom in/i });
    const zoomOutBtn = screen.getByRole('button', { name: /zoom out/i });
    const centerBtn = screen.getByRole('button', { name: /center on vehicle/i });
    const breadcrumbToggle = screen.getByRole('button', { name: /toggle breadcrumb waypoints/i });

    expect(zoomInBtn).toBeInTheDocument();
    expect(zoomOutBtn).toBeInTheDocument();

    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomOutBtn);
    fireEvent.click(centerBtn);
    fireEvent.click(breadcrumbToggle);
  });

  test('handles null/missing telemetry values gracefully without crashing', () => {
    render(
      <LiveTransitMap
        currentTelemetry={null}
        breadcrumbs={null}
        origin={null}
        destination={null}
        isLive={false}
      />
    );

    expect(screen.getByTestId('live-transit-map')).toBeInTheDocument();
    expect(screen.getByTestId('live-status-pill')).toHaveTextContent(/Offline \/ Cached/i);
    expect(screen.getByTestId('metric-speed')).toHaveTextContent('0');
  });
});
