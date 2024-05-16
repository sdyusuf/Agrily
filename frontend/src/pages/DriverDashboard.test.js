import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DriverDashboard from './DriverDashboard';

const mockUser = { email: 'driver.kofi@agrily.com', fullName: 'Kofi Mensah Boateng' };
jest.mock('../auth/useUser', () => ({
  useUser: () => mockUser
}));

describe('DriverDashboard Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <DriverDashboard />
      </MemoryRouter>
    );
  };

  it('renders driver dashboard cockpit with header, avatar, and verification badge', () => {
    renderComponent();

    expect(screen.getByTestId('driver-dashboard-page')).toBeInTheDocument();
    expect(screen.getByTestId('driver-name-heading')).toHaveTextContent('Kofi Mensah Boateng');
    expect(screen.getByTestId('driver-avatar')).toHaveTextContent('K');
    expect(screen.getByTestId('driver-verification-badge')).toHaveTextContent(/Verified Fleet Hauler/i);
  });

  it('displays performance metric cards with accurate values', () => {
    renderComponent();

    expect(screen.getByTestId('metric-deliveries')).toHaveTextContent('28');
    expect(screen.getByTestId('metric-rating')).toHaveTextContent('4.95 / 5.0');
    expect(screen.getByTestId('metric-distance')).toHaveTextContent(/8,420 km/i);
  });

  it('displays cargo capacity utilization meter', () => {
    renderComponent();

    expect(screen.getByTestId('driver-capacity-card')).toBeInTheDocument();
    expect(screen.getByTestId('capacity-percentage')).toHaveTextContent('50% Booked');
    expect(screen.getByTestId('capacity-fill')).toHaveStyle('width: 50%');
  });

  it('toggles duty status between Online and Offline on button click', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ isAvailable: false })
    });

    renderComponent();

    const dutyIndicator = screen.getByTestId('duty-status-indicator');
    expect(dutyIndicator).toHaveTextContent(/Active on Duty/i);

    const toggleBtn = screen.getByTestId('duty-toggle-button');
    expect(toggleBtn).toHaveTextContent(/Go Offline/i);

    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(toggleBtn).toHaveTextContent(/Go Online/i);
    });

    expect(screen.getByTestId('duty-status-indicator')).toHaveTextContent(/Off Duty/i);
    expect(screen.getByTestId('driver-action-alert')).toHaveTextContent(/Duty status updated/i);
  });

  it('allows driver to accept consignment and updates dispatch status', async () => {
    renderComponent();

    const acceptBtn = screen.getByTestId('accept-consignment-CS-8921');
    expect(acceptBtn).toHaveTextContent(/Accept Freight Haul/i);

    fireEvent.click(acceptBtn);

    await waitFor(() => {
      const card = screen.getByTestId('consignment-card-CS-8921');
      expect(card).toHaveTextContent(/In Transit — Live GPS Tracking/i);
    });

    expect(screen.getByTestId('driver-action-alert')).toHaveTextContent(
      /Consignment CS-8921 accepted! Navigation route calculated./i
    );
  });
});
