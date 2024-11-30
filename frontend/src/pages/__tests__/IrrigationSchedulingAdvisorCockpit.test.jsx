import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import IrrigationSchedulingAdvisorCockpit from '../IrrigationSchedulingAdvisorCockpit';

describe('IrrigationSchedulingAdvisorCockpit Page', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      })
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders cockpit hero, root-zone bucket, smart pump relay card, and 7-day ledger', () => {
    render(<IrrigationSchedulingAdvisorCockpit />);

    expect(
      screen.getByTestId('irrigation-scheduling-advisor-cockpit')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('root-zone-depletion-bucket-canvas')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('smart-pump-relay-control-card')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('seven-day-evapotranspiration-ledger-card')
    ).toBeInTheDocument();
  });

  test('opens manual valve override modal and dispatches relay command with toast confirmation', () => {
    render(<IrrigationSchedulingAdvisorCockpit />);

    fireEvent.click(screen.getByTestId('hero-open-valve-override-btn'));
    expect(
      screen.getByTestId('manual-valve-override-modal')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('submit-valve-override-btn'));
    expect(
      screen.getByTestId('irrigation-relay-toast-banner')
    ).toBeInTheDocument();
  });
});
