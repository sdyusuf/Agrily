/**
 * @file SoilTextureTriangleCanvas.test.js
 * @description Unit tests for USDA Soil Texture Ternary Triangle Canvas Component.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SoilTextureTriangleCanvas, {
  classifyTextureClass,
  USDA_TEXTURE_DATA,
  NIGERIAN_TEXTURE_PRESETS
} from '../components/SoilTextureTriangleCanvas';

describe('SoilTextureTriangleCanvas Component & Classifier', () => {
  beforeEach(() => {
    // Mock HTMLCanvasElement getContext
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      arc: jest.fn(),
      roundRect: jest.fn(),
      fillText: jest.fn(),
      setLineDash: jest.fn(),
      measureText: jest.fn(() => ({ width: 100 }))
    }));
  });

  describe('USDA Textural Classifier Logic', () => {
    test('accurately classifies SAND (88% sand, 7% silt, 5% clay)', () => {
      const cls = classifyTextureClass(88, 7, 5);
      expect(cls).toBe('SAND');
    });

    test('accurately classifies CLAY (20% sand, 20% silt, 60% clay)', () => {
      const cls = classifyTextureClass(20, 20, 60);
      expect(cls).toBe('CLAY');
    });

    test('accurately classifies SILT (5% sand, 90% silt, 5% clay)', () => {
      const cls = classifyTextureClass(5, 90, 5);
      expect(cls).toBe('SILT');
    });

    test('accurately classifies SANDY_LOAM (65% sand, 20% silt, 15% clay)', () => {
      const cls = classifyTextureClass(65, 20, 15);
      expect(cls).toBe('SANDY_LOAM');
    });

    test('accurately classifies CLAY_LOAM (30% sand, 35% silt, 35% clay)', () => {
      const cls = classifyTextureClass(30, 35, 35);
      expect(cls).toBe('CLAY_LOAM');
    });
  });

  describe('Component Rendering & Interactions', () => {
    test('renders canvas, title, and particle size distribution controls', () => {
      render(<SoilTextureTriangleCanvas initialSand={60} initialSilt={25} initialClay={15} />);

      expect(screen.getByText('USDA Soil Textural Triangle')).toBeInTheDocument();
      expect(screen.getByText('Particle Size Distribution (% Mass)')).toBeInTheDocument();
      expect(screen.getByRole('img', { name: /USDA Soil Texture Triangle Ternary Canvas/i })).toBeInTheDocument();
      expect(screen.getByText('Sandy Loam')).toBeInTheDocument();
    });

    test('renders regional preset buttons for Nigerian agro-zones', () => {
      render(<SoilTextureTriangleCanvas />);

      expect(screen.getByText('Sahel Sand')).toBeInTheDocument();
      expect(screen.getByText('Sudan Sandy Loam')).toBeInTheDocument();
      expect(screen.getByText('Guinea Savanna Loam')).toBeInTheDocument();
      expect(screen.getByText('Rainforest Clay Loam')).toBeInTheDocument();
      expect(screen.getByText('Coastal Silty Clay')).toBeInTheDocument();
    });

    test('clicking a regional preset button updates texture class and advisory', () => {
      const onTextureChangeMock = jest.fn();
      render(<SoilTextureTriangleCanvas onTextureChange={onTextureChangeMock} />);

      const sahelBtn = screen.getByText('Sahel Sand');
      fireEvent.click(sahelBtn);

      expect(screen.getByText('Sand', { selector: '.pill-label' })).toBeInTheDocument();
      expect(screen.getByText(/Prone to rapid drought stress and severe nitrogen\/potassium leaching/i)).toBeInTheDocument();
      expect(onTextureChangeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          sandPercentage: 90,
          siltPercentage: 5,
          clayPercentage: 5,
          texturalClass: 'SAND'
        })
      );
    });

    test('adjusting sand slider updates sand percentage', () => {
      const onTextureChangeMock = jest.fn();
      render(<SoilTextureTriangleCanvas initialSand={50} initialSilt={25} initialClay={25} onTextureChange={onTextureChangeMock} />);

      const sandSlider = screen.getByLabelText(/Sand \(0.05/i);
      fireEvent.change(sandSlider, { target: { value: '75' } });

      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });
});
