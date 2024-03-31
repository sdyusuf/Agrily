/**
 * ==============================================================================
 * AGRILY AGRICULTURAL COMMERCE & PROVENANCE PLATFORM
 * Email Verification Completion Portal (/verify/:verificationString)
 * ==============================================================================
 * 
 * @module frontend/src/pages/EmailVerificationLandingPage
 * @description
 * High-fidelity, dedicated email verification completion landing page.
 * Validates the one-time verification UUID token against the Agrily backend,
 * updates the local JWT session token, and displays agricultural account activation benefits.
 * 
 * Design Standards:
 *  - Follows Agrily Design System tokens (Lush Emerald #1b4332, Harvest Ochre #bc6c25, Canvas #f8faf9).
 *  - Standard SVG icons used throughout (no emojis).
 *  - Responsive grid layout adapting from desktop to mobile screens (< 768px).
 *  - Null-safe authentication handling and smooth micro-interactions.
 * 
 * @component EmailVerificationLandingPage
 * @requires react
 * @requires react-router-dom
 * @requires axios
 * @requires ../auth/useToken
 * @requires ../components/NavBar
 * @requires ../components/Footer
 * @requires ./EmailVerificationLandingPage.css
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToken } from '../auth/useToken';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import './EmailVerificationLandingPage.css';

/**
 * Animated Checkmark Shield SVG Icon Primitive
 */
function SuccessShieldIcon({ size = 46 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

/**
 * Alert Triangle Icon Primitive
 */
function AlertShieldIcon({ size = 46 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/**
 * Standard Clock SVG Icon Primitive
 */
function ClockIcon({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

/**
 * Verified Check Badge SVG Icon Primitive
 */
function VerifiedCheckIcon({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

/**
 * Award Trust Badge SVG Icon Primitive
 */
function AwardTrustIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  );
}

/**
 * Escrow Security Lock SVG Icon Primitive
 */
function ShieldLockIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <circle cx="12" cy="16" r="1" />
    </svg>
  );
}

/**
 * Wholesale Trading Analytics SVG Icon Primitive
 */
function TrendingUpIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

/**
 * Alert Triangle Small Icon Primitive
 */
function AlertTriangleIcon({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/**
 * Information Circle Icon Primitive
 */
function InfoCircleIcon({ size = 17 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

/**
 * Right Arrow Icon Primitive
 */
function ArrowRightIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

/**
 * Compass Marketplace Icon Primitive
 */
function CompassIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function EmailVerificationLandingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { verificationString } = useParams();
  const [, setToken] = useToken();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      if (!verificationString) {
        if (isMounted) {
          setIsLoading(false);
          setIsSuccess(false);
          setErrorMessage('No verification token supplied.');
        }
        return;
      }

      try {
        const response = await axios.put('http://localhost:5000/verify', {
          verificationString
        });

        if (isMounted) {
          const { token } = response.data || {};
          if (token && typeof setToken === 'function') {
            setToken(token);
          }
          setIsSuccess(true);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err.response?.data?.message ||
            'This verification link is invalid, has already been redeemed, or has expired.';
          setErrorMessage(message);
          setIsSuccess(false);
          setIsLoading(false);
        }
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [verificationString, setToken]);

  return (
    <div className="agrily-landing-verify-container" data-testid="email-verification-landing-page">
      <NavBar />

      <main className="agrily-landing-verify-content">
        <div className="agrily-landing-verify-card">
          {/* Loading State */}
          {isLoading && (
            <div data-testid="verification-loading-state" className="py-4">
              <div className="agrily-landing-icon-wrap loading">
                <div className="agrily-landing-spinner" aria-label="Loading verification" />
              </div>

              <div className="agrily-landing-badge-pill loading">
                <ClockIcon size={14} />
                <span>Authenticating Verification Token...</span>
              </div>

              <h1 className="agrily-landing-title">Activating Your Account</h1>
              <p className="agrily-landing-subtitle">
                Please wait while we validate your credentials and authenticate your agricultural
                producer profile on the Agrily network.
              </p>
            </div>
          )}

          {/* Success State */}
          {!isLoading && isSuccess && (
            <div data-testid="verification-success-state">
              <div className="agrily-landing-icon-wrap success">
                <SuccessShieldIcon size={46} />
              </div>

              <div className="agrily-landing-badge-pill success">
                <VerifiedCheckIcon size={15} />
                <span>Producer Account Activated & Verified</span>
              </div>

              <h1 className="agrily-landing-title">Account Verified Successfully!</h1>

              <p className="agrily-landing-subtitle">
                Your email address has been confirmed and your agricultural profile is fully unlocked.
                You can now list harvests, manage wholesale orders, and trade securely through Agrily Escrow.
              </p>

              {/* Producer Verification Benefits with Standard Icons */}
              <div className="agrily-landing-benefits" role="region" aria-label="Unlocked features">
                <div className="agrily-landing-benefit-card">
                  <div className="agrily-landing-benefit-icon" aria-hidden="true">
                    <AwardTrustIcon size={20} />
                  </div>
                  <div className="agrily-landing-benefit-title">Verified Trust Badge</div>
                  <p className="agrily-landing-benefit-desc">
                    Your profile and produce listings now display the official verified trust checkmark.
                  </p>
                </div>

                <div className="agrily-landing-benefit-card">
                  <div className="agrily-landing-benefit-icon" aria-hidden="true">
                    <ShieldLockIcon size={20} />
                  </div>
                  <div className="agrily-landing-benefit-title">Escrow Payout Settlement</div>
                  <p className="agrily-landing-benefit-desc">
                    Direct automated bank payouts upon confirmed buyer waybill inspection and delivery.
                  </p>
                </div>

                <div className="agrily-landing-benefit-card">
                  <div className="agrily-landing-benefit-icon" aria-hidden="true">
                    <TrendingUpIcon size={20} />
                  </div>
                  <div className="agrily-landing-benefit-title">Wholesale Trade Access</div>
                  <p className="agrily-landing-benefit-desc">
                    Submit bulk supply tenders and receive purchase inquiries from commercial food processors.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="agrily-landing-actions">
                <button
                  type="button"
                  onClick={() => navigate('/home')}
                  className="agrily-landing-btn-primary"
                >
                  <span>Enter Producer Dashboard</span>
                  <ArrowRightIcon size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/marketplace')}
                  className="agrily-landing-btn-secondary"
                >
                  <CompassIcon size={16} />
                  <span>Explore Marketplace</span>
                </button>
              </div>
            </div>
          )}

          {/* Failure / Expired State */}
          {!isLoading && !isSuccess && (
            <div data-testid="verification-fail-state">
              <div className="agrily-landing-icon-wrap error">
                <AlertShieldIcon size={46} />
              </div>

              <div className="agrily-landing-badge-pill error">
                <AlertTriangleIcon size={14} />
                <span>Verification Token Notice</span>
              </div>

              <h1 className="agrily-landing-title">Verification Link Expired or Invalid</h1>

              <p className="agrily-landing-subtitle">
                {errorMessage ||
                  'The activation token could not be verified. It may have already been used, or expired.'}
              </p>

              <div className="agrily-landing-error-box">
                <div className="agrily-landing-error-title">
                  <InfoCircleIcon size={17} />
                  <span>What should you do?</span>
                </div>
                <ul>
                  <li>If your account is already active, you can sign in directly with your email and password.</li>
                  <li>If you need a new activation link, log in to request a fresh verification email.</li>
                  <li>Ensure you copied the entire URL if you pasted it manually into your browser bar.</li>
                </ul>
              </div>

              <div className="agrily-landing-actions">
                <Link to="/login" className="agrily-landing-btn-primary">
                  <span>Proceed to Sign In</span>
                  <ArrowRightIcon size={16} />
                </Link>

                <Link to="/" className="agrily-landing-btn-secondary">
                  <span>Return to Home</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default EmailVerificationLandingPage;
