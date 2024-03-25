/**
 * ============================================================================
 * AGRILY AGRICULTURAL COMMERCE & PROVENANCE PLATFORM
 * Farm Profile Editor Component Test Suite
 * ============================================================================
 * 
 * @module frontend/src/components/FarmProfileEditor.test
 * @description
 * Unit and integration tests for the FarmProfileEditor component, verifying form
 * state initialization, crop chip management, validation errors, fetch requests,
 * and responsive actions.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FarmProfileEditor from './FarmProfileEditor';

const mockProfile = {
  bio: 'Sustainable sorghum and cowpea grower.',
  cooperativeName: 'Zaria Agro Alliance',
  contactPhone: '+234 803 111 2222',
  farmSizeHectares: 15.5,
  yearEstablished: 2016,
  verificationStatus: 'verified',
  trustScore: 94,
  farmLocation: {
    state: 'Kaduna',
    lga: 'Zaria',
    address: 'KM 10 Hunkuyi Road',
    coordinates: {
      lat: 11.08,
      lng: 7.72
    }
  },
  cropSpecialties: ['White Maize', 'Sorghum'],
  certifications: ['Global GAP Compliance']
};

describe('FarmProfileEditor Component Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders editor header, verification status pill, and trust score', () => {
    render(<FarmProfileEditor initialProfile={mockProfile} userEmail="farmer@test.ng" />);

    expect(screen.getByText('Farmer & Producer Profile')).toBeInTheDocument();
    expect(screen.getByTestId('verification-status-pill')).toHaveTextContent('Verified Producer');
    expect(screen.getByTestId('trust-score-val')).toHaveTextContent('94%');
  });

  it('pre-fills input fields with provided initialProfile data', () => {
    render(<FarmProfileEditor initialProfile={mockProfile} userEmail="farmer@test.ng" />);

    expect(screen.getByTestId('input-bio')).toHaveValue('Sustainable sorghum and cowpea grower.');
    expect(screen.getByTestId('input-coop')).toHaveValue('Zaria Agro Alliance');
    expect(screen.getByTestId('input-phone')).toHaveValue('+234 803 111 2222');
    expect(screen.getByTestId('input-farm-size')).toHaveValue(15.5);
    expect(screen.getByTestId('input-year-est')).toHaveValue(2016);
    expect(screen.getByTestId('select-state')).toHaveValue('Kaduna');
    expect(screen.getByTestId('input-lga')).toHaveValue('Zaria');
    expect(screen.getByTestId('input-address')).toHaveValue('KM 10 Hunkuyi Road');
    expect(screen.getByTestId('input-latitude')).toHaveValue(11.08);
    expect(screen.getByTestId('input-longitude')).toHaveValue(7.72);

    expect(screen.getByTestId('chip-White Maize')).toBeInTheDocument();
    expect(screen.getByTestId('chip-Sorghum')).toBeInTheDocument();
  });

  it('allows adding and removing crop specialty chips', () => {
    render(<FarmProfileEditor initialProfile={mockProfile} userEmail="farmer@test.ng" />);

    const newCropInput = screen.getByTestId('input-new-crop');
    const addBtn = screen.getByTestId('btn-add-crop');

    // Add a new crop
    fireEvent.change(newCropInput, { target: { value: 'Soybeans' } });
    fireEvent.click(addBtn);

    expect(screen.getByTestId('chip-Soybeans')).toBeInTheDocument();

    // Remove existing crop chip
    const removeMaizeBtn = screen.getByTitle('Remove White Maize');
    fireEvent.click(removeMaizeBtn);

    expect(screen.queryByTestId('chip-White Maize')).not.toBeInTheDocument();
  });

  it('displays client-side validation error for invalid latitude degrees', async () => {
    render(<FarmProfileEditor initialProfile={mockProfile} userEmail="farmer@test.ng" />);

    const latInput = screen.getByTestId('input-latitude');
    fireEvent.change(latInput, { target: { value: '115.0' } }); // > 90

    const submitBtn = screen.getByTestId('btn-save-profile');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('editor-error-alert')).toBeInTheDocument();
      expect(screen.getByTestId('editor-error-alert')).toHaveTextContent(
        'Latitude must be a valid numeric degree between -90 and +90.'
      );
    });
  });

  it('submits updated profile and fires onSaveSuccess callback on HTTP 200', async () => {
    const handleSaveSuccess = jest.fn();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            profile: {
              ...mockProfile,
              bio: 'Updated high yield farm story.'
            }
          })
      })
    );

    render(
      <FarmProfileEditor
        initialProfile={mockProfile}
        userEmail="farmer@test.ng"
        onSaveSuccess={handleSaveSuccess}
      />
    );

    const bioInput = screen.getByTestId('input-bio');
    fireEvent.change(bioInput, { target: { value: 'Updated high yield farm story.' } });

    const submitBtn = screen.getByTestId('btn-save-profile');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/users/profile',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        })
      );
      expect(screen.getByTestId('editor-success-alert')).toBeInTheDocument();
      expect(handleSaveSuccess).toHaveBeenCalled();
    });
  });

  it('triggers onCancel when cancel button is clicked', () => {
    const handleCancel = jest.fn();
    render(
      <FarmProfileEditor
        initialProfile={mockProfile}
        userEmail="farmer@test.ng"
        onCancel={handleCancel}
      />
    );

    const cancelBtn = screen.getByTestId('btn-cancel');
    fireEvent.click(cancelBtn);

    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});
