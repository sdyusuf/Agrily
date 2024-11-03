import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import WeighbridgeCalibrationModal from '../WeighbridgeCalibrationModal';

describe('WeighbridgeCalibrationModal', () => {
  test('returns null when isOpen is false and renders shrinkage ledger when open', () => {
    const handleClose = jest.fn();
    const handleSubmit = jest.fn();

    const { rerender } = render(
      <WeighbridgeCalibrationModal
        isOpen={false}
        onClose={handleClose}
        forecastSummary={{
          cropKey: 'MAIZE',
          parcelName: 'Zaria Giwa Block A-04',
          areaHectares: 6.5,
          predictedP50TonsHa: 4.52,
        }}
        onSubmitCalibration={handleSubmit}
      />
    );

    expect(
      screen.queryByTestId('weighbridge-calibration-modal')
    ).not.toBeInTheDocument();

    rerender(
      <WeighbridgeCalibrationModal
        isOpen={true}
        onClose={handleClose}
        forecastSummary={{
          cropKey: 'MAIZE',
          parcelName: 'Zaria Giwa Block A-04',
          areaHectares: 6.5,
          predictedP50TonsHa: 4.52,
        }}
        onSubmitCalibration={handleSubmit}
      />
    );

    expect(
      screen.getByTestId('weighbridge-calibration-modal')
    ).toBeInTheDocument();

    const dryNetBefore = screen.getByTestId('wb-dry-net-tons').textContent;
    const grossInput = screen.getByLabelText(/Truck Gross Weight/i);
    fireEvent.change(grossInput, { target: { value: '46500' } });

    const dryNetAfter = screen.getByTestId('wb-dry-net-tons').textContent;
    expect(dryNetAfter).not.toEqual(dryNetBefore);

    const submitBtn = screen.getByRole('button', {
      name: /Commit Weighbridge Ticket & Recalibrate Model/i,
    });
    fireEvent.click(submitBtn);
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});
