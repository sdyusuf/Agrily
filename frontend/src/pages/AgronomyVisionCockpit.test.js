/**
 * @file AgronomyVisionCockpit.test.js
 * @description Unit tests for AgronomyVisionCockpit page component.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AgronomyVisionCockpit from './AgronomyVisionCockpit';

// Mock child components to isolate cockpit navigation & lifecycle
jest.mock('../components/NavBar', () => () => <nav data-testid="mock-navbar">Agrily NavBar</nav>);
jest.mock('../components/LeafPathologyScannerCard', () => () => <div data-testid="mock-scanner">Mock Scanner</div>);
jest.mock('../components/AgronomyTreatmentPlanCard', () => () => <div data-testid="mock-treatment-plan">Mock Treatment Plan</div>);
jest.mock('../components/RegionalDiseaseHeatmapCard', () => () => <div data-testid="mock-heatmap">Mock Heatmap</div>);

describe('AgronomyVisionCockpit Page Component Tests', () => {
  const mockDiagnosesList = {
    success: true,
    records: [
      {
        diagnosisId: 'DX-TEST-001',
        cropType: 'TOMATO',
        farmerName: 'Garba Bello',
        farmLocation: { state: 'KANO' },
        aiInference: {
          commonDiseaseName: 'Tomato Early Blight',
          triagePriority: 'MEDIUM_ISOLATE_ZONE'
        },
        economicImpactEstimate: {
          projectedYieldLossPct: 35
        },
        cryptographicSeal: 'abcdef1234567890'
      }
    ]
  };

  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/agronomy-vision/diagnoses')) {
        return Promise.resolve({ ok: true, json: async () => mockDiagnosesList });
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders cockpit hero heading, KPI stats, and tabs', async () => {
    render(<AgronomyVisionCockpit />);

    expect(screen.getByText(/Agronomy Disease Vision & Telemetry Cockpit/i)).toBeInTheDocument();
    expect(screen.getByText(/Foliar Scans Processed/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('12,480')).toBeInTheDocument();
    });
    expect(screen.getByText('₦184.5M')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /AI Foliar Scanner/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Treatment & Dosage Matrix/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Regional Outbreak Radar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Diagnostic Audit Trail/i })).toBeInTheDocument();
  });

  test('defaults to AI Foliar Scanner tab view', async () => {
    render(<AgronomyVisionCockpit />);

    await waitFor(() => {
      expect(screen.getByTestId('tab-scanner-view')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('tab-treatment-view')).not.toBeInTheDocument();
  });

  test('navigates to Regional Outbreak Radar tab view', async () => {
    render(<AgronomyVisionCockpit />);

    await waitFor(() => {
      expect(screen.getByTestId('tab-scanner-view')).toBeInTheDocument();
    });

    const heatmapTab = screen.getByRole('button', { name: /Regional Outbreak Radar/i });
    fireEvent.click(heatmapTab);

    expect(screen.getByTestId('tab-heatmap-view')).toBeInTheDocument();
    expect(screen.queryByTestId('tab-scanner-view')).not.toBeInTheDocument();
  });

  test('navigates to Diagnostic Audit Trail tab and displays recent records table', async () => {
    render(<AgronomyVisionCockpit />);

    const historyTab = screen.getByRole('button', { name: /Diagnostic Audit Trail/i });
    fireEvent.click(historyTab);

    expect(screen.getByTestId('tab-history-view')).toBeInTheDocument();
    expect(screen.getByText(/Recent Crop Pathology Records/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('DX-TEST-001')).toBeInTheDocument();
      expect(screen.getByText('Garba Bello (KANO)')).toBeInTheDocument();
      expect(screen.getByText('Tomato Early Blight')).toBeInTheDocument();
    });
  });

  test('navigates to Treatment tab when Prescribe button is clicked in audit trail', async () => {
    render(<AgronomyVisionCockpit />);

    // Go to history tab
    fireEvent.click(screen.getByRole('button', { name: /Diagnostic Audit Trail/i }));

    await waitFor(() => {
      expect(screen.getByText('DX-TEST-001')).toBeInTheDocument();
    });

    const prescribeBtn = screen.getByRole('button', { name: /Prescribe/i });
    fireEvent.click(prescribeBtn);

    // Should switch to Treatment view
    expect(screen.getByTestId('tab-treatment-view')).toBeInTheDocument();
  });
});
