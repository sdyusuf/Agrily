import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import IndigenousGlossaryExplorerCard from '../IndigenousGlossaryExplorerCard';

describe('IndigenousGlossaryExplorerCard Component', () => {
  test('renders NAERLS/IITA multilingual glossary concepts and filters by agronomy domain', () => {
    render(<IndigenousGlossaryExplorerCard />);

    expect(
      screen.getByTestId('indigenous-glossary-explorer-card')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('glossary-item-GLS-AGR-1001')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('glossary-item-GLS-AGR-1002')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('glossary-item-GLS-AGR-1003')
    ).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('glossary-domain-filter-select'), {
      target: { value: 'ENTOMOLOGY_IPM' },
    });

    expect(
      screen.getByTestId('glossary-item-GLS-AGR-1001')
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('glossary-item-GLS-AGR-1002')
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId('glossary-domain-filter-select'), {
      target: { value: 'SOIL_FERTILITY_NPK' },
    });
    expect(
      screen.getByTestId('glossary-item-GLS-AGR-1002')
    ).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('glossary-domain-filter-select'), {
      target: { value: 'ALL' },
    });
    expect(
      screen.getByTestId('glossary-item-GLS-AGR-1003')
    ).toBeInTheDocument();
  });
});
