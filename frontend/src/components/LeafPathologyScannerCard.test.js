/**
 * @file LeafPathologyScannerCard.test.js
 * @description Unit tests for LeafPathologyScannerCard component.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LeafPathologyScannerCard from './LeafPathologyScannerCard';

describe('LeafPathologyScannerCard Component Tests', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders scanner card header, crop selector, and controls correctly', () => {
    render(<LeafPathologyScannerCard />);

    expect(screen.getByText(/Crop Foliar Disease Neural Scanner/i)).toBeInTheDocument();
    expect(screen.getByText(/Agronomy AI Vision/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Agricultural Commodity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lesion Severity Progression Tier/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Field Acreage/i)).toBeInTheDocument();
    expect(screen.getByText(/Run Foliar AI Diagnosis/i)).toBeInTheDocument();
  });

  test('allows changing selected crop commodity', () => {
    render(<LeafPathologyScannerCard />);

    const cropSelect = screen.getByLabelText(/Target Agricultural Commodity/i);
    fireEvent.change(cropSelect, { target: { value: 'CASSAVA' } });

    expect(cropSelect.value).toBe('CASSAVA');
  });

  test('toggles healthy mode simulation button', () => {
    render(<LeafPathologyScannerCard />);

    const modeBtn = screen.getByText(/Mode: Disease Lesion/i);
    fireEvent.click(modeBtn);

    expect(screen.getByText(/Mode: Healthy Foliage/i)).toBeInTheDocument();
  });

  test('executes neural scan and renders diagnosis results panel with triage pill', async () => {
    const mockDiagnosisResponse = {
      success: true,
      cropType: 'TOMATO',
      record: {
        diagnosisId: 'DX-TEST-001',
        aiInference: {
          diseaseCode: 'TOM-EB-001',
          commonDiseaseName: 'Tomato Early Blight',
          pathogenType: 'FUNGAL',
          confidenceScore: 0.95,
          severityStage: 'STAGE_2_MODERATE_FOLIAR_SPREAD',
          affectedCanopyPercentage: 35,
          triagePriority: 'MEDIUM_ISOLATE_ZONE'
        },
        economicImpactEstimate: {
          projectedYieldLossPct: 30,
          estimatedFinancialLossNgn: 937500
        }
      },
      visionTelemetry: {
        detectedLesionCount: 4,
        lesionBoundingBoxes: [
          { boxId: 'LESION-01', coordinates: { ymin: 0.1, xmin: 0.2, ymax: 0.3, xmax: 0.4 }, lesionConfidence: 0.88 }
        ]
      },
      cryptographicSeal: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDiagnosisResponse
    });

    const mockDiagnosisComplete = jest.fn();
    render(<LeafPathologyScannerCard onDiagnosisComplete={mockDiagnosisComplete} />);

    const scanBtn = screen.getByText(/Run Foliar AI Diagnosis/i);
    fireEvent.click(scanBtn);

    await waitFor(() => {
      expect(screen.getByTestId('diagnosis-results-panel')).toBeInTheDocument();
    });

    expect(screen.getByText(/Tomato Early Blight/i)).toBeInTheDocument();
    expect(screen.getByText(/MEDIUM ISOLATE ZONE/i)).toBeInTheDocument();
    expect(screen.getByText(/Foliar Canopy Loss/i)).toBeInTheDocument();
    expect(screen.getByText('35%')).toBeInTheDocument();
    expect(screen.getByText(/Generate Curative & Organic Treatment Prescription/i)).toBeInTheDocument();
    expect(mockDiagnosisComplete).toHaveBeenCalledWith(mockDiagnosisResponse);
  });
});
