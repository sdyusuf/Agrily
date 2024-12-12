import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MultilingualAgronomyChatThreadCanvas from '../MultilingualAgronomyChatThreadCanvas';

describe('MultilingualAgronomyChatThreadCanvas Component', () => {
  const mockTurns = [
    {
      turnIndex: 1,
      senderRole: 'FARMER_USER',
      localeCode: 'ha-NG',
      utteranceText: 'Tsutsar masara tana cin ganyen masara a Kura',
      englishTranslation: 'Fall armyworm is eating maize leaves in Kura',
      detectedIntent: 'PEST_IPM_AND_FALL_ARMYWORM',
    },
    {
      turnIndex: 2,
      senderRole: 'AGRONOMY_AI_ASSISTANT',
      localeCode: 'ha-NG',
      utteranceText: 'A fesa Emamectin benzoate 5% WG (250g/ha) da safe.',
      englishTranslation: 'Spray Emamectin benzoate 5% WG (250g/ha) early morning.',
      detectedIntent: 'PEST_IPM_AND_FALL_ARMYWORM',
      ragCitationBulletinIds: ['IITA-IPM-FAW-2024-01'],
    },
  ];

  test('renders chat thread, switches Nigerian locale, and sends farmer message', () => {
    const onSelectLocale = jest.fn();
    const onSendMessage = jest.fn();

    render(
      <MultilingualAgronomyChatThreadCanvas
        selectedLocale="ha-NG"
        onSelectLocale={onSelectLocale}
        turns={mockTurns}
        onSendMessage={onSendMessage}
        showEnglishTranslation={true}
      />
    );

    expect(
      screen.getByTestId('multilingual-agronomy-chat-thread-canvas')
    ).toBeInTheDocument();
    expect(screen.getByTestId('turn-intent-badge-1')).toHaveTextContent(
      'PEST_IPM_AND_FALL_ARMYWORM'
    );
    expect(screen.getByTestId('turn-english-subtext-1')).toHaveTextContent(
      'Spray Emamectin benzoate'
    );

    fireEvent.click(screen.getByTestId('select-locale-btn-yo-NG'));
    expect(onSelectLocale).toHaveBeenCalledWith('yo-NG');

    const input = screen.getByTestId('multilingual-chat-input');
    fireEvent.change(input, {
      target: { value: 'Buhu nawa na NPK zan sa?' },
    });
    fireEvent.click(screen.getByTestId('multilingual-chat-send-btn'));
    expect(onSendMessage).toHaveBeenCalledWith('Buhu nawa na NPK zan sa?');
  });
});
