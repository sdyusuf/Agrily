import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RagKnowledgeCitationAndDialectCard from '../RagKnowledgeCitationAndDialectCard';

describe('RagKnowledgeCitationAndDialectCard Component', () => {
  test('renders RRF RAG citations, restores Yorùbá/Hausa diacritics, and updates 2G sync time', () => {
    render(<RagKnowledgeCitationAndDialectCard />);

    expect(
      screen.getByTestId('rag-knowledge-citation-and-dialect-card')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('rag-bulletin-card-IITA-IPM-FAW-2024-01')
    ).toBeInTheDocument();

    expect(screen.getByTestId('diacritic-restored-output')).toHaveTextContent(
      'kòkòrò'
    );
    expect(screen.getByTestId('diacritic-restored-output')).toHaveTextContent(
      'àgbàdo'
    );

    fireEvent.change(screen.getByTestId('edge-throughput-slider'), {
      target: { value: '64' },
    });
    expect(screen.getByTestId('pwa-sync-duration-badge')).toHaveTextContent(
      '2G EDGE Delta Sync: 3.3s'
    );
  });
});
