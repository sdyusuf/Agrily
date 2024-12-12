import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExtensionOfficerEscalationModal from '../ExtensionOfficerEscalationModal';

describe('ExtensionOfficerEscalationModal Component', () => {
  test('renders ADP escalation modal and submits ticket payload', () => {
    const onClose = jest.fn();
    const onSubmitEscalation = jest.fn();

    render(
      <ExtensionOfficerEscalationModal
        isOpen={true}
        onClose={onClose}
        selectedLocale="yo-NG"
        onSubmitEscalation={onSubmitEscalation}
      />
    );

    expect(
      screen.getByTestId('extension-officer-escalation-modal')
    ).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('adp-zone-select'), {
      target: { value: 'OYO_OYSADEP_ISEYIN' },
    });

    fireEvent.click(screen.getByTestId('submit-escalation-ticket-btn'));
    expect(onSubmitEscalation).toHaveBeenCalledWith(
      expect.objectContaining({
        stateAdpZone: 'OYO_OYSADEP_ISEYIN',
        preferredLocale: 'yo-NG',
      })
    );
  });
});
