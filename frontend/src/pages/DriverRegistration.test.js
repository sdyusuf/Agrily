import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DriverRegistration from './DriverRegistration';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const mockUser = { email: 'driver.ibrahim@agrily.com', fullName: 'Ibrahim Aliyu Bello' };
jest.mock('../auth/useUser', () => ({
  useUser: () => mockUser
}));

describe('DriverRegistration Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <DriverRegistration />
      </MemoryRouter>
    );
  };

  it('renders driver onboarding header, badge pill, and form sections', () => {
    renderComponent();

    expect(screen.getByTestId('driver-registration-page')).toBeInTheDocument();
    expect(screen.getByTestId('driver-badge-pill')).toHaveTextContent(/Agrily Freight Network/i);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Driver & Fleet Onboarding/i);

    expect(screen.getByLabelText(/Full Name/i)).toHaveValue('Ibrahim Aliyu Bello');
    expect(screen.getByLabelText(/Account Email/i)).toHaveValue('driver.ibrahim@agrily.com');
    expect(screen.getByLabelText(/Commercial Driver's License/i)).toBeInTheDocument();
  });

  it('renders interactive vehicle type selection cards and updates selection on click', () => {
    renderComponent();

    const boxTruckOption = screen.getByTestId('vehicle-option-box_truck');
    expect(boxTruckOption).toHaveClass('selected');

    const flatbedOption = screen.getByTestId('vehicle-option-flatbed');
    fireEvent.click(flatbedOption);

    expect(flatbedOption).toHaveClass('selected');
    expect(boxTruckOption).not.toHaveClass('selected');
    expect(screen.getByLabelText(/Payload Capacity/i)).toHaveValue(25000);
  });

  it('allows toggling regional operating corridor chips', () => {
    renderComponent();

    const kadunaChip = screen.getByTestId('region-chip-kaduna-agro-transit-hub');
    expect(kadunaChip).not.toHaveClass('selected');

    fireEvent.click(kadunaChip);
    expect(kadunaChip).toHaveClass('selected');

    fireEvent.click(kadunaChip);
    expect(kadunaChip).not.toHaveClass('selected');
  });

  it('allows toggling cold-chain refrigeration option', () => {
    renderComponent();

    const reeferCheckbox = screen.getByTestId('reefer-checkbox');
    expect(reeferCheckbox).not.toBeChecked();

    fireEvent.click(reeferCheckbox);
    expect(reeferCheckbox).toBeChecked();
  });

  it('displays client-side validation error when phone or license is omitted', async () => {
    renderComponent();

    // Clear required phone and license
    const submitBtn = screen.getByTestId('driver-submit-button');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const errorBanner = screen.getByTestId('driver-error-banner');
      expect(errorBanner).toHaveTextContent(/Please complete all required personal and licensing fields/i);
    });
  });

  it('submits driver onboarding form and shows success banner upon HTTP 201', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Driver profile registered successfully! Verification is pending.'
      })
    });

    renderComponent();

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Phone Number/i), {
      target: { value: '+2348031234567' }
    });
    fireEvent.change(screen.getByLabelText(/Commercial Driver's License/i), {
      target: { value: 'FRSC-KAD-99120' }
    });
    fireEvent.change(screen.getByLabelText(/Vehicle Plate \/ Registration/i), {
      target: { value: 'KAD-881-XA' }
    });
    fireEvent.change(screen.getByLabelText(/Vehicle Make/i), {
      target: { value: 'Isuzu' }
    });
    fireEvent.change(screen.getByLabelText(/Vehicle Model/i), {
      target: { value: 'Forward FTR' }
    });

    fireEvent.click(screen.getByTestId('driver-submit-button'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/drivers/register',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('driver-success-banner')).toHaveTextContent(
        /Driver onboarding submitted!/i
      );
    });
  });
});
