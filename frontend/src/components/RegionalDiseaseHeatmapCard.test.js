/**
 * @file RegionalDiseaseHeatmapCard.test.js
 * @description Unit tests for RegionalDiseaseHeatmapCard component.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegionalDiseaseHeatmapCard from './RegionalDiseaseHeatmapCard';

describe('RegionalDiseaseHeatmapCard Component Tests', () => {
  const mockTelemetryResponse = {
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
        state: 'PLATEAU',
        primaryCrop: 'TOMATO',
        activePathogenCode: 'TOM-LB-002',
        pathogenName: 'Tomato Late Blight',
        riskStatus: 'CRITICAL_QUARANTINE_LOCKDOWN',
        reportedCases: 84,
        affectedAcreageHectares: 320.0,
        quarantineRadiusKm: 25.0
      },
      {
        state: 'KANO',
        primaryCrop: 'TOMATO',
        activePathogenCode: 'TOM-EB-001',
        pathogenName: 'Tomato Early Blight',
        riskStatus: 'MODERATE_SPREAD_WATCH',
        reportedCases: 38,
        affectedAcreageHectares: 145.0,
        quarantineRadiusKm: 8.0
      },
      {
        state: 'LAGOS',
        primaryCrop: 'GENERAL',
        activePathogenCode: 'NONE_HEALTHY',
        pathogenName: 'No Active Contagion Cluster',
        riskStatus: 'MONITORING_NORMAL',
        reportedCases: 0,
        affectedAcreageHectares: 0,
        quarantineRadiusKm: 0
      }
    ],
    nationalTelemetrySeal: '99887766554433221100aabbccddeeff99887766554433221100aabbccddeeff'
  };

  const mockPlateauClearance = {
    success: true,
    clearance: {
      state: 'PLATEAU',
      corridorClearance: 'TRANSIT_PROHIBITED_QUARANTINE_ACTIVE',
      isTransitInterdicted: true,
      quarantineRadiusKm: 25.0,
      primaryCropAffected: 'TOMATO',
      pathogenName: 'Tomato Late Blight',
      advisory: 'Interstate haulage restricted under NAQS quarantine order.'
    }
  };

  const mockLagosClearance = {
    success: true,
    clearance: {
      state: 'LAGOS',
      corridorClearance: 'UNRESTRICTED_TRANSIT_CLEARED',
      isTransitInterdicted: false,
      quarantineRadiusKm: 0,
      advisory: 'No active phytosanitary checkpoints on agricultural produce.'
    }
  };

  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/agronomy-vision/outbreak-telemetry')) {
        return Promise.resolve({ ok: true, json: async () => mockTelemetryResponse });
      }
      if (url.includes('/api/agronomy-vision/corridor-clearance/PLATEAU')) {
        return Promise.resolve({ ok: true, json: async () => mockPlateauClearance });
      }
      if (url.includes('/api/agronomy-vision/corridor-clearance/LAGOS')) {
        return Promise.resolve({ ok: true, json: async () => mockLagosClearance });
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders 36-state outbreak heatmap header, KPI banner, and authority seal', async () => {
    render(<RegionalDiseaseHeatmapCard />);

    expect(screen.getByText(/36-State Crop Outbreak & Quarantine Heatmap/i)).toBeInTheDocument();
    expect(screen.getByText(/NAQS Federal Monitoring Authority/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('37')).toBeInTheDocument();
      expect(screen.getByText('990 Ha')).toBeInTheDocument();
      expect(screen.getByText('PLATEAU')).toBeInTheDocument();
      expect(screen.getByText('KANO')).toBeInTheDocument();
    });
  });

  test('corridor clearance checker displays prohibited status for Plateau State', async () => {
    render(<RegionalDiseaseHeatmapCard />);

    await waitFor(() => {
      expect(screen.getByText(/TRANSIT PROHIBITED QUARANTINE ACTIVE/i)).toBeInTheDocument();
      expect(screen.getByText(/25 KM Perimeter/i)).toBeInTheDocument();
    });
  });

  test('changes corridor clearance to cleared state when Lagos is selected', async () => {
    render(<RegionalDiseaseHeatmapCard />);

    await waitFor(() => {
      expect(screen.getByText(/TRANSIT PROHIBITED QUARANTINE ACTIVE/i)).toBeInTheDocument();
    });

    const select = screen.getByDisplayValue(/Plateau \(Highland Late Blight Hotspot\)/i);
    fireEvent.change(select, { target: { value: 'LAGOS' } });

    await waitFor(() => {
      expect(screen.getByText(/UNRESTRICTED TRANSIT CLEARED/i)).toBeInTheDocument();
    });
  });

  test('filters state clusters using search input', async () => {
    render(<RegionalDiseaseHeatmapCard />);

    await waitFor(() => {
      expect(screen.getByText('PLATEAU')).toBeInTheDocument();
      expect(screen.getByText('KANO')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search state, crop, or pathogen/i);
    fireEvent.change(searchInput, { target: { value: 'Kano' } });

    expect(screen.getByText('KANO')).toBeInTheDocument();
    expect(screen.queryByText('PLATEAU')).not.toBeInTheDocument();
  });
});
