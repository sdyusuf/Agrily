import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ManualValveOverrideModal from '../ManualValveOverrideModal';

describe('ManualValveOverrideModal Component', () => {
  test('renders modal when open and submits solenoid valve override payload', () => {
    const onClose = jest.fn();
    const onSubmitOverride = jest.fn();

    render(
      <ManualValveOverrideModal
        isOpen={true}
        onClose={onClose}
        selectedPump={{ relayNodeCode: 'PMP-RLY-1002' }}
        onSubmitOverride={onSubmitOverride}
      />
    );

    expect(screen.getByTestId('manual-valve-override-modal')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('override-command-action-select'), {
      target: { value: 'FERTIGATION_PULSE' },
    });
    fireEvent.change(screen.getByTestId('override-runtime-input'), {
      target: { value: '60' },
    });

    fireEvent.click(screen.getByTestId('submit-valve-override-btn'));
    expect(onSubmitOverride).toHaveBeenCalledWith(
      expect.objectContaining({
        commandAction: 'FERTIGATION_PULSE',
        targetRuntimeMinutes: 60,
      })
    );
  });
});
