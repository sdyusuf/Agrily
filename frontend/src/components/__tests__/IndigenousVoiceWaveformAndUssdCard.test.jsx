import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import IndigenousVoiceWaveformAndUssdCard from '../IndigenousVoiceWaveformAndUssdCard';

describe('IndigenousVoiceWaveformAndUssdCard Component', () => {
  test('renders Opus voice waveform, updates ASR confidence with SNR, and navigates *347*24# USSD hops', () => {
    const onDispatchVoiceNote = jest.fn();
    const onOpenEscalationModal = jest.fn();

    render(
      <IndigenousVoiceWaveformAndUssdCard
        selectedLocale="ha-NG"
        onDispatchVoiceNote={onDispatchVoiceNote}
        onOpenEscalationModal={onOpenEscalationModal}
      />
    );

    expect(
      screen.getByTestId('indigenous-voice-waveform-and-ussd-card')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('simulate-voice-note-btn'));
    expect(onDispatchVoiceNote).toHaveBeenCalledWith(
      expect.objectContaining({
        localeCode: 'ha-NG',
      })
    );

    fireEvent.click(screen.getByTestId('ussd-send-hop-btn'));
    expect(screen.getByTestId('ussd-lcd-screen-text')).toHaveTextContent(
      'END Fesa Emamectin 5% WG'
    );

    fireEvent.click(screen.getByTestId('open-extension-escalation-modal-btn'));
    expect(onOpenEscalationModal).toHaveBeenCalledTimes(1);
  });
});
