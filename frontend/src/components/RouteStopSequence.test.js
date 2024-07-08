/**
 * ==============================================================================
 * ROUTE STOP SEQUENCE COMPONENT - UNIT TESTS
 * ==============================================================================
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RouteStopSequence } from './RouteStopSequence';

describe('RouteStopSequence Component', () => {
  const mockOriginDepot = {
    depotName: 'Zaria Logistics Hub',
    facilityCode: 'ZAR-01',
    address: 'Old Jos Road',
    city: 'Zaria',
    state: 'Kaduna',
    contactPerson: 'Malam Ibrahim',
    contactPhone: '+2348031112233'
  };

  const mockDestinationHub = {
    depotName: 'Dawanau Grain Terminal',
    facilityCode: 'KAN-01',
    address: 'Dawanau Market',
    city: 'Kano',
    state: 'Kano',
    contactPerson: 'Alhaji Sani',
    contactPhone: '+2348029998877'
  };

  const mockStops = [
    {
      stopId: 'ST-01',
      stopSequence: 0,
      locationName: 'Makarfi Tomato Farm',
      contactName: 'Garba Bello',
      contactPhone: '+2348011223344',
      address: 'Makarfi Gate 1',
      state: 'Kaduna',
      roadSurface: 'SECONDARY_ASPHALT',
      producePayload: {
        produceName: 'Roma Plum Tomatoes',
        weightKg: 1200,
        volumeCrates: 48,
        perishabilityTier: 'HIGH',
        requiresRefrigeration: true
      },
      status: 'PENDING',
      delayMinutes: 0
    },
    {
      stopId: 'ST-02',
      stopSequence: 1,
      locationName: 'Ikara Onion Cluster',
      contactName: 'Audu Danjuma',
      contactPhone: '+2348055667788',
      address: 'Ikara Central',
      state: 'Kaduna',
      roadSurface: 'UNPAVED_LATERITE',
      producePayload: {
        produceName: 'Red Creole Onions',
        weightKg: 1500,
        volumeCrates: 60,
        perishabilityTier: 'LOW',
        requiresRefrigeration: false
      },
      status: 'COLLECTED',
      delayMinutes: 25
    }
  ];

  test('renders origin depot and destination hub cards', () => {
    render(
      <RouteStopSequence
        stops={mockStops}
        originDepot={mockOriginDepot}
        destinationHub={mockDestinationHub}
      />
    );

    expect(screen.getByTestId('origin-depot-card')).toBeInTheDocument();
    expect(screen.getByText('Zaria Logistics Hub')).toBeInTheDocument();
    expect(screen.getByTestId('destination-hub-card')).toBeInTheDocument();
    expect(screen.getByText('Dawanau Grain Terminal')).toBeInTheDocument();
  });

  test('renders ordered list of farm collection stops', () => {
    render(<RouteStopSequence stops={mockStops} />);

    expect(screen.getByText('Makarfi Tomato Farm')).toBeInTheDocument();
    expect(screen.getByText('Ikara Onion Cluster')).toBeInTheDocument();
    expect(screen.getByText('1,200')).toBeInTheDocument();
    expect(screen.getByText('48')).toBeInTheDocument();
  });

  test('displays perishability badges and cold-chain indicators', () => {
    render(<RouteStopSequence stops={mockStops} />);

    expect(screen.getByText('HIGH Perishability')).toBeInTheDocument();
    expect(screen.getByText('LOW Perishability')).toBeInTheDocument();
    expect(screen.getByText('Cold Chain Required')).toBeInTheDocument();
  });

  test('displays delay warning chip when delayMinutes > 0', () => {
    render(<RouteStopSequence stops={mockStops} />);

    expect(screen.getByTestId('delay-alert')).toBeInTheDocument();
    expect(screen.getByText('+25m Perishability Warning')).toBeInTheDocument();
  });

  test('calls onMoveUp and onMoveDown when reorder buttons are clicked', () => {
    const handleMoveUp = jest.fn();
    const handleMoveDown = jest.fn();

    render(
      <RouteStopSequence
        stops={mockStops}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
      />
    );

    // Stop 0 move up should be disabled
    const moveUpButtons = screen.getAllByRole('button', { name: /Move stop \d up/i });
    expect(moveUpButtons[0]).toBeDisabled();

    // Stop 0 move down should be enabled
    const moveDownButtons = screen.getAllByRole('button', { name: /Move stop \d down/i });
    expect(moveDownButtons[0]).not.toBeDisabled();
    fireEvent.click(moveDownButtons[0]);
    expect(handleMoveDown).toHaveBeenCalledWith(0);

    // Stop 1 move up should be enabled
    fireEvent.click(moveUpButtons[1]);
    expect(handleMoveUp).toHaveBeenCalledWith(1);
  });

  test('calls onSelectStop when stop card is clicked', () => {
    const handleSelectStop = jest.fn();

    render(
      <RouteStopSequence
        stops={mockStops}
        onSelectStop={handleSelectStop}
      />
    );

    fireEvent.click(screen.getByText('Makarfi Tomato Farm'));
    expect(handleSelectStop).toHaveBeenCalledWith(mockStops[0]);
  });

  test('renders empty placeholder message when no stops are provided', () => {
    render(<RouteStopSequence stops={[]} />);
    expect(screen.getByTestId('empty-stops-message')).toBeInTheDocument();
    expect(screen.getByText('No collection stops assigned to this route.')).toBeInTheDocument();
  });
});
