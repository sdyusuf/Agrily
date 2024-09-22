/**
 * ==============================================================================
 * AGRILY SPRINT 18 TEST SUITE - SOIL PHENOLOGY & BIOLOGY CARD TESTS
 * ==============================================================================
 * 
 * Verifies SoilPhenologyAndBiologicalHealthCard component:
 * 1. Default render with Microbiome Vitality assays and BFI metrics.
 * 2. Tab switching between Microbiome, Phenology Curves, and Visual Diagnostics.
 * 3. Crop-specific phenological nutrient uptake timeline nodes.
 * 4. Interactive visual symptom button triggering the emergency foliar rescue protocol box.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SoilPhenologyAndBiologicalHealthCard from '../components/SoilPhenologyAndBiologicalHealthCard';

describe('SoilPhenologyAndBiologicalHealthCard Component', () => {
  it('renders Microbiome Vitality tab by default with BFI and enzyme progress bars', () => {
    render(<SoilPhenologyAndBiologicalHealthCard targetCrop="MAIZE" />);

    expect(screen.getByText(/Biological Vitality & Phenological Uptake/i)).toBeInTheDocument();
    expect(screen.getByText(/Biological Fertility Index/i)).toBeInTheDocument();
    expect(screen.getByText(/72 \/ 100/i)).toBeInTheDocument();
    expect(screen.getByText(/Dehydrogenase \(DHA - Microbial Respiration\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Trichoderma harzianum/i)).toBeInTheDocument();
  });

  it('switches to Phenology Curves tab when clicked', () => {
    render(<SoilPhenologyAndBiologicalHealthCard targetCrop="TOMATO" />);

    const phenologyTab = screen.getByRole('tab', { name: /Phenology Curves/i });
    fireEvent.click(phenologyTab);

    expect(screen.getByText(/Stage-by-Stage Nutrient Uptake Partitioning/i)).toBeInTheDocument();
    expect(screen.getByText(/Transplant Recovery/i)).toBeInTheDocument();
    expect(screen.getByText(/Flowering & First Fruit/i)).toBeInTheDocument();
  });

  it('switches to Visual Diagnostics and reveals foliar rescue protocol on symptom click', () => {
    render(<SoilPhenologyAndBiologicalHealthCard targetCrop="TOMATO" />);

    const foliarTab = screen.getByRole('tab', { name: /Visual Diagnostics/i });
    fireEvent.click(foliarTab);

    expect(screen.getByText(/Select an observed visual crop canopy symptom/i)).toBeInTheDocument();

    // Click blossom-end rot symptom button
    const blossomBtn = screen.getByRole('button', { name: /Blossom-end rot/i });
    fireEvent.click(blossomBtn);

    expect(screen.getByText(/EMERGENCY FOLIAR RESCUE PROTOCOL/i)).toBeInTheDocument();
    expect(screen.getByText(/Element Deficit: Ca/i)).toBeInTheDocument();
    expect(screen.getByText(/Chelated Calcium EDTA/i)).toBeInTheDocument();
  });
});
