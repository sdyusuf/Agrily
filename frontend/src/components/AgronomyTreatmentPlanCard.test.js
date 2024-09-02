/**
 * @file AgronomyTreatmentPlanCard.test.js
 * @description Unit tests for AgronomyTreatmentPlanCard component.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AgronomyTreatmentPlanCard from './AgronomyTreatmentPlanCard';

describe('AgronomyTreatmentPlanCard Component Tests', () => {
  const mockDiagnosisRecord = {
    diagnosisId: 'DX-TOM-01',
    cropType: 'TOMATO',
    aiInference: {
      diseaseCode: 'TOM-EB-001',
      commonDiseaseName: 'Tomato Early Blight'
    }
  };

  const mockPrescriptionResponse = {
    success: true,
    prescriptionId: 'RX-TEST-001',
    diseaseName: 'Tomato Early Blight',
    treatments: [
      {
        protocolCode: 'PROT-CHEM-01',
        treatmentName: 'Mancozeb 80% WP High-Efficacy Fungicide',
        type: 'SYSTEMIC_CHEMICAL_FUNGICIDE',
        activeIngredient: 'Mancozeb 800 g/kg',
        dosagePerHectare: 2.5,
        dosageUnit: 'KG_PER_HA',
        preHarvestIntervalDays: 14,
        organicCertified: false,
        curativeEfficacyPct: 92.5,
        instructions: 'Mix 50g per 20L knapsack sprayer.',
        requiredPPE: ['Chemical Nitrile Gloves', 'N95 Respirator Mask'],
        nafdacRegNumber: 'NAFDAC-AG-048291',
        acreageCalculations: {
          fieldAcreageHectares: 2.5,
          totalChemicalProductRequired: 6.25,
          productUnit: 'KG_PER_HA',
          totalDilutionWaterLiters: 625,
          estimated20LKnapsackLoads: 32,
          estimatedTreatmentCostNgn: 115625
        },
        safetyClearance: {
          preHarvestIntervalDays: 14,
          safeHarvestEarliestDate: '2024-09-15',
          foodSafetyStatus: 'MANDATORY_RESIDUE_WITHDRAWAL_WINDOW'
        }
      },
      {
        protocolCode: 'PROT-BIO-01',
        treatmentName: 'Bacillus subtilis Bio-Fungicide (Serenade)',
        type: 'BENEFICIAL_MICROBIAL_INOCULANT',
        activeIngredient: 'Bacillus subtilis QST 713',
        dosagePerHectare: 3.0,
        dosageUnit: 'L_PER_HA',
        preHarvestIntervalDays: 0,
        organicCertified: true,
        curativeEfficacyPct: 84.0,
        instructions: 'Certified organic bio-control.',
        requiredPPE: ['Standard Coveralls'],
        nafdacRegNumber: 'NAFDAC-BIO-019283',
        acreageCalculations: {
          fieldAcreageHectares: 2.5,
          totalChemicalProductRequired: 7.5,
          productUnit: 'L_PER_HA',
          totalDilutionWaterLiters: 500,
          estimated20LKnapsackLoads: 25,
          estimatedTreatmentCostNgn: 105000
        },
        safetyClearance: {
          preHarvestIntervalDays: 0,
          safeHarvestEarliestDate: '2024-09-01',
          foodSafetyStatus: 'ZERO_WITHDRAWAL_SAFE_NOW'
        }
      }
    ],
    phytosanitaryClearanceSeal: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff'
  };

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPrescriptionResponse
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders treatment plan header, tabs, and treatments upon loading', async () => {
    render(<AgronomyTreatmentPlanCard diagnosisRecord={mockDiagnosisRecord} initialAcreage={2.5} />);

    expect(screen.getByText(/Phytosanitary Advisory Matrix/i)).toBeInTheDocument();
    expect(screen.getByText(/NAFDAC & SON Standard Compliant/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Mancozeb 80% WP High-Efficacy Fungicide')).toBeInTheDocument();
      expect(screen.getByText('Bacillus subtilis Bio-Fungicide (Serenade)')).toBeInTheDocument();
    });

    expect(screen.getByText(/Pre-Harvest Interval \(PHI\): Mandatory 14-Day Safety Withdrawal/i)).toBeInTheDocument();
    expect(screen.getByText(/Zero Harvest Delay/i)).toBeInTheDocument();
    expect(screen.getByText(/6.25 kg/i)).toBeInTheDocument();
    expect(screen.getByText(/~32 Tanks/i)).toBeInTheDocument();
  });

  test('filters treatments by Organic tab', async () => {
    render(<AgronomyTreatmentPlanCard diagnosisRecord={mockDiagnosisRecord} initialAcreage={2.5} />);

    await waitFor(() => {
      expect(screen.getByText('Mancozeb 80% WP High-Efficacy Fungicide')).toBeInTheDocument();
    });

    const organicTab = screen.getByText(/100% Organic Bio-Controls/i);
    fireEvent.click(organicTab);

    expect(screen.queryByText('Mancozeb 80% WP High-Efficacy Fungicide')).not.toBeInTheDocument();
    expect(screen.getByText('Bacillus subtilis Bio-Fungicide (Serenade)')).toBeInTheDocument();
  });

  test('filters treatments by Chemical tab', async () => {
    render(<AgronomyTreatmentPlanCard diagnosisRecord={mockDiagnosisRecord} initialAcreage={2.5} />);

    await waitFor(() => {
      expect(screen.getByText('Mancozeb 80% WP High-Efficacy Fungicide')).toBeInTheDocument();
    });

    const chemTab = screen.getByText(/Systemic Chemical Solutions/i);
    fireEvent.click(chemTab);

    expect(screen.getByText('Mancozeb 80% WP High-Efficacy Fungicide')).toBeInTheDocument();
    expect(screen.queryByText('Bacillus subtilis Bio-Fungicide (Serenade)')).not.toBeInTheDocument();
  });

  test('updates acreage when preset button is clicked', async () => {
    render(<AgronomyTreatmentPlanCard diagnosisRecord={mockDiagnosisRecord} initialAcreage={2.5} />);

    await waitFor(() => {
      expect(screen.getByText(/2.5 Hectares/i)).toBeInTheDocument();
    });

    const presetBtn = screen.getByText('5.0 Ha');
    fireEvent.click(presetBtn);

    await waitFor(() => {
      expect(screen.getByText(/5 Hectares/i)).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/agronomy-vision/treatment-prescription',
      expect.objectContaining({
        body: expect.stringContaining('"fieldAcreageHectares":5')
      })
    );
  });
});
