import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CrowdScoutingReportModal from '../CrowdScoutingReportModal';

describe('CrowdScoutingReportModal', () => {
  test('returns null when closed and dispatches W-pattern scouting report when open', () => {
    const handleClose = jest.fn();
    const handleSubmit = jest.fn();

    const { rerender } = render(
      <CrowdScoutingReportModal
        isOpen={false}
        onClose={handleClose}
        pestKey="FALL_ARMYWORM"
        onSubmitScoutingReport={handleSubmit}
      />
    );

    expect(
      screen.queryByTestId('crowd-scouting-report-modal')
    ).not.toBeInTheDocument();

    rerender(
      <CrowdScoutingReportModal
        isOpen={true}
        onClose={handleClose}
        pestKey="FALL_ARMYWORM"
        onSubmitScoutingReport={handleSubmit}
      />
    );

    expect(
      screen.getByTestId('crowd-scouting-report-modal')
    ).toBeInTheDocument();

    const infestedInput = screen.getByLabelText(/Infested Plants Count/i);
    fireEvent.change(infestedInput, { target: { value: '54' } });

    expect(screen.getByTestId('scouting-live-incidence')).toHaveTextContent(
      '54% (SEVERE_OUTBREAK_SWARM)'
    );

    const submitBtn = screen.getByRole('button', {
      name: /Broadcast Scouting Telemetry & Generate IPM Plan/i,
    });
    fireEvent.click(submitBtn);
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});

