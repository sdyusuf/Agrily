import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import IpmBiocontrolMatrixCard from '../IpmBiocontrolMatrixCard';

describe('IpmBiocontrolMatrixCard', () => {
  test('renders Push-Pull companion banner and switches between Biocontrol Pyramid and IRAC Rotation tabs', () => {
    render(
      <IpmBiocontrolMatrixCard
        pestKey="FALL_ARMYWORM"
        pestCommonName="Fall Armyworm (Spodoptera frugiperda)"
      />
    );

    expect(
      screen.getByTestId('ipm-biocontrol-matrix-card')
    ).toBeInTheDocument();
    expect(screen.getByText(/Telenomus remus/i)).toBeInTheDocument();

    const iracTab = screen.getByTestId('ipm-tab-irac');
    fireEvent.click(iracTab);

    expect(iracTab).toHaveClass('active');
    expect(screen.getByText(/Chlorantraniliprole/i)).toBeInTheDocument();
  });
});

