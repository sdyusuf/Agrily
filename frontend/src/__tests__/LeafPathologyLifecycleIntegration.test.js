/**
 * @file LeafPathologyLifecycleIntegration.test.js
 * @description End-to-end integration test for Agronomy AI Leaf Pathology lifecycle.
 * Validates specimen scanning, AI diagnosis inference, curative and organic prescription generation,
 * and interstate corridor phytosanitary clearance verification.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LeafPathologyScannerCard from '../components/LeafPathologyScannerCard';
import AgronomyTreatmentPlanCard from '../components/AgronomyTreatmentPlanCard';
import RegionalDiseaseHeatmapCard from '../components/RegionalDiseaseHeatmapCard';

describe('Leaf Pathology End-to-End Lifecycle Integration', () => {
  const mockDiagnosisResult = {
    success: true,
    cropType: 'TOMATO',
    record: {
      diagnosisId: 'DX-E2E-2024',
      cropType: 'TOMATO',
      farmerName: 'Kano Horticultural Cooperative',
      farmLocation: { state: 'KANO', lga: 'Kura' },
      fieldAcreageHectares: 3.0,
      aiInference: {
        diseaseCode: 'TOM-EB-001',
        commonDiseaseName: 'Tomato Early Blight',
        pathogenType: 'FUNGAL',
        confidenceScore: 0.94,
        severityStage: 'STAGE_2_MODERATE_FOLIAR_SPREAD',
        affectedCanopyPercentage: 35,
        triagePriority: 'MEDIUM_ISOLATE_ZONE'
      },
      economicImpactEstimate: {
        projectedYieldLossPct: 30,
        estimatedFinancialLossNgn: 1125000
      },
      cryptographicSeal: 'e2e_sha256_mock_seal_1234567890abcdef1234567890abcdef1234567890abcdef'
    },
    visionTelemetry: {
      detectedLesionCount: 4,
      chlorophyllDegradationPct: 30.8,
      lesionBoundingBoxes: [
        { boxId: 'BOX-1', coordinates: { ymin: 0.1, xmin: 0.2, ymax: 0.25, xmax: 0.38 }, lesionConfidence: 0.92 }
      ]
    },
    cryptographicSeal: 'e2e_sha256_mock_seal_1234567890abcdef1234567890abcdef1234567890abcdef'
  };

  const mockPrescriptionResult = {
    success: true,
    prescriptionId: 'RX-E2E-001',
    diseaseName: 'Tomato Early Blight',
    targetCrop: 'TOMATO',
    treatments: [
      {
        protocolCode: 'PROT-CHEM-EB',
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
          fieldAcreageHectares: 3.0,
          totalChemicalProductRequired: 7.5,
          productUnit: 'KG_PER_HA',
          totalDilutionWaterLiters: 750,
          estimated20LKnapsackLoads: 38,
          estimatedTreatmentCostNgn: 138750
        },
        safetyClearance: {
          preHarvestIntervalDays: 14,
          safeHarvestEarliestDate: '2024-09-15',
          foodSafetyStatus: 'MANDATORY_RESIDUE_WITHDRAWAL_WINDOW'
        }
      }
    ],
    phytosanitaryClearanceSeal: 'e2e_rx_clearance_seal_aabbccddeeff11223344556677889900aabbccddeeff'
  };

  const mockOutbreakTelemetry = {
    success: true,
    summary: {
      totalStatesMonitored: 37,
      activeOutbreakClustersCount: 6,
      criticalLockdownsCount: 1,
      epidemicSurgeWarningsCount: 1,
      totalHectaresUnderQuarantine: 990
    },
    clusters: [
      {
        state: 'KANO',
        primaryCrop: 'TOMATO',
        activePathogenCode: 'TOM-EB-001',
        pathogenName: 'Tomato Early Blight',
        riskStatus: 'MODERATE_SPREAD_WATCH',
        reportedCases: 38,
        affectedAcreageHectares: 145.0,
        quarantineRadiusKm: 8.0
      }
    ],
    nationalTelemetrySeal: 'e2e_national_telemetry_seal_00112233445566778899aabbccddeeff0011'
  };

  const mockClearance = {
    success: true,
    clearance: {
      state: 'KANO',
      corridorClearance: 'TRANSIT_CAUTION_INSPECTION_MANDATORY',
      isTransitInterdicted: false,
      quarantineRadiusKm: 8.0,
      primaryCropAffected: 'TOMATO',
      pathogenName: 'Tomato Early Blight',
      advisory: 'Normal haulage permitted with phytosanitary inspection seal.'
    }
  };

  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/agronomy-vision/diagnose')) {
        return Promise.resolve({ ok: true, json: async () => mockDiagnosisResult });
      }
      if (url.includes('/api/agronomy-vision/treatment-prescription')) {
        return Promise.resolve({ ok: true, json: async () => mockPrescriptionResult });
      }
      if (url.includes('/api/agronomy-vision/outbreak-telemetry')) {
        return Promise.resolve({ ok: true, json: async () => mockOutbreakTelemetry });
      }
      if (url.includes('/api/agronomy-vision/corridor-clearance')) {
        return Promise.resolve({ ok: true, json: async () => mockClearance });
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('successfully completes end-to-end diagnosis -> prescription -> corridor clearance lifecycle', async () => {
    // 1. Render Scanner and trigger AI diagnosis
    const onDiagnosisComplete = jest.fn();
    const onSelectTreatment = jest.fn();

    const { rerender } = render(
      <LeafPathologyScannerCard
        onDiagnosisComplete={onDiagnosisComplete}
        onSelectTreatment={onSelectTreatment}
      />
    );

    const scanBtn = screen.getByRole('button', { name: /Run Foliar AI Diagnosis/i });
    fireEvent.click(scanBtn);

    await waitFor(() => {
      expect(screen.getByText('Tomato Early Blight')).toBeInTheDocument();
      expect(screen.getByText('MEDIUM ISOLATE ZONE')).toBeInTheDocument();
      expect(screen.getByText(/35%/i)).toBeInTheDocument();
    });

    // 2. Click Generate Treatment Prescription
    const rxBtn = screen.getByRole('button', { name: /Generate Curative & Organic Treatment Prescription/i });
    fireEvent.click(rxBtn);
    expect(onSelectTreatment).toHaveBeenCalledWith(mockDiagnosisResult.record);

    // 3. Render Treatment Plan Card with diagnosed record
    rerender(
      <AgronomyTreatmentPlanCard
        diagnosisRecord={mockDiagnosisResult.record}
        initialAcreage={3.0}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Mancozeb 80% WP High-Efficacy Fungicide')).toBeInTheDocument();
      expect(screen.getByText(/7.5 kg/i)).toBeInTheDocument();
      expect(screen.getByText(/~38 Tanks/i)).toBeInTheDocument();
      expect(screen.getByText(/Mandatory 14-Day Safety Withdrawal/i)).toBeInTheDocument();
    });

    // 4. Render Regional Heatmap and verify corridor clearance
    rerender(<RegionalDiseaseHeatmapCard />);

    await waitFor(() => {
      expect(screen.getByText('36-State Crop Outbreak & Quarantine Heatmap')).toBeInTheDocument();
      expect(screen.getByText('37')).toBeInTheDocument();
      expect(screen.getByText('990 Ha')).toBeInTheDocument();
    });
  });
});
