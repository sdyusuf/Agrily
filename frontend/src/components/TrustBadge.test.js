/**
 * ============================================================================
 * AGRILY AGRICULTURAL COMMERCE & PROVENANCE PLATFORM
 * TrustBadge & VerificationSeal Unit Test Suite
 * ============================================================================
 * 
 * @module frontend/src/components/TrustBadge.test
 * @description
 * Unit tests validating render states, status styling classes, icons,
 * cooperative provenance information, and trust score metrics for both
 * TrustBadge and VerificationSeal components.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TrustBadge, VerificationSeal } from './TrustBadge';

describe('TrustBadge & VerificationSeal Component Unit Tests', () => {
  describe('TrustBadge Component', () => {
    it('renders verified farmer badge with check icon and trust score', () => {
      render(<TrustBadge status="verified" trustScore={98} size="md" />);

      const badge = screen.getByTestId('trust-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('badge-status-verified');
      expect(badge).toHaveClass('badge-size-md');
      expect(screen.getByText('Verified Farmer')).toBeInTheDocument();
      expect(screen.getByTestId('trust-score-badge')).toHaveTextContent('98%');
      expect(screen.getByTestId('icon-verified')).toBeInTheDocument();
    });

    it('renders pending status badge with clock icon and ochre styling', () => {
      render(<TrustBadge status="pending" trustScore={85} size="sm" />);

      const badge = screen.getByTestId('trust-badge');
      expect(badge).toHaveClass('badge-status-pending');
      expect(screen.getByText('KYC Pending')).toBeInTheDocument();
      expect(screen.getByTestId('icon-pending')).toBeInTheDocument();
      expect(screen.getByTestId('trust-score-badge')).toHaveTextContent('85%');
    });

    it('renders unverified community grower badge by default', () => {
      render(<TrustBadge />);

      const badge = screen.getByTestId('trust-badge');
      expect(badge).toHaveClass('badge-status-unverified');
      expect(screen.getByText('Community Grower')).toBeInTheDocument();
      expect(screen.getByTestId('icon-unverified')).toBeInTheDocument();
      expect(screen.getByTestId('trust-score-badge')).toHaveTextContent('100%');
    });

    it('renders flagged warning badge for accounts under compliance inquiry', () => {
      render(<TrustBadge status="flagged" trustScore={40} />);

      const badge = screen.getByTestId('trust-badge');
      expect(badge).toHaveClass('badge-status-flagged');
      expect(screen.getByText('Under Review')).toBeInTheDocument();
      expect(screen.getByTestId('icon-flagged')).toBeInTheDocument();
      expect(screen.getByTestId('trust-score-badge')).toHaveTextContent('40%');
    });

    it('respects showScore=false and showLabel=false flags', () => {
      render(
        <TrustBadge
          status="verified"
          trustScore={95}
          showScore={false}
          showLabel={false}
        />
      );

      expect(screen.queryByTestId('trust-score-badge')).not.toBeInTheDocument();
      expect(screen.queryByText('Verified Farmer')).not.toBeInTheDocument();
      expect(screen.getByTestId('icon-verified')).toBeInTheDocument();
    });

    it('handles unexpected status fallback safely to unverified', () => {
      render(<TrustBadge status="unknown_bogus_status" />);

      const badge = screen.getByTestId('trust-badge');
      expect(badge).toHaveClass('badge-status-unverified');
      expect(screen.getByText('Community Grower')).toBeInTheDocument();
    });
  });

  describe('VerificationSeal Component', () => {
    it('renders complete verification seal with cooperative and origin state', () => {
      render(
        <VerificationSeal
          status="verified"
          cooperativeName="Plateau Organic Growers Union"
          state="Plateau"
          trustScore={99}
          size="lg"
        />
      );

      const seal = screen.getByTestId('verification-seal');
      expect(seal).toBeInTheDocument();
      expect(seal).toHaveClass('seal-verified');
      expect(seal).toHaveClass('seal-size-lg');

      expect(screen.getByText('Agrily Verified Producer')).toBeInTheDocument();
      expect(screen.getByTestId('seal-score')).toHaveTextContent('99% Trust');
      expect(screen.getByTestId('seal-coop')).toHaveTextContent('Plateau Organic Growers Union');
      expect(screen.getByTestId('seal-state')).toHaveTextContent('Plateau State');
    });

    it('renders seal without cooperative if not specified', () => {
      render(
        <VerificationSeal
          status="verified"
          state="Kaduna"
          trustScore={92}
        />
      );

      expect(screen.getByTestId('seal-state')).toHaveTextContent('Kaduna State');
      expect(screen.queryByTestId('seal-coop')).not.toBeInTheDocument();
    });
  });
});
