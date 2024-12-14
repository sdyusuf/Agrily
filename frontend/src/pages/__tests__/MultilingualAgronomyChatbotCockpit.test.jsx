import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MultilingualAgronomyChatbotCockpit from '../MultilingualAgronomyChatbotCockpit';

describe('MultilingualAgronomyChatbotCockpit Page', () => {
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

  test('renders cockpit hero, multilingual chat canvas, voice/USSD card, and indigenous glossary', () => {
    render(<MultilingualAgronomyChatbotCockpit />);

    expect(
      screen.getByTestId('multilingual-agronomy-chatbot-cockpit')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('multilingual-agronomy-chat-thread-canvas')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('indigenous-voice-waveform-and-ussd-card')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('indigenous-glossary-explorer-card')
    ).toBeInTheDocument();
  });

  test('opens extension officer escalation modal and displays toast banner on submit', () => {
    render(<MultilingualAgronomyChatbotCockpit />);

    fireEvent.click(screen.getByTestId('hero-open-escalation-modal-btn'));
    expect(
      screen.getByTestId('extension-officer-escalation-modal')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('submit-escalation-ticket-btn'));
    expect(screen.getByTestId('chatbot-toast-banner')).toBeInTheDocument();
  });
});
