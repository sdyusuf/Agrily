/**
 * ==============================================================================
 * AGRILY AGRICULTURAL COMMERCE & PROVENANCE PLATFORM
 * Email Verification Notice & Activation Console (/verify-email)
 * ==============================================================================
 * 
 * @module frontend/src/pages/PleaseVerifyEmailPage
 * @description
 * High-fidelity, dedicated email verification portal displayed to newly registered
 * agricultural producers and commercial buyers.
 * 
 * Architectural Features & User Experience:
 *  1. Persistent Portal: Stays securely on `/verify-email` without premature redirects,
 *     allowing users ample time to read verification instructions and review their credentials.
 *  2. Brevo Email Notification: Highlights the recipient email address where the transactional
 *     activation dispatch was transmitted.
 *  3. In-Page Token Verification: Provides an accessible input field allowing users to paste
 *     their verification token directly into the portal for instant account activation without
 *     needing to navigate across multiple browser tabs.
 *  4. One-Click Resend Dispatch: Enables seamless resend requests with a 60-second cooldown
 *     timer to mitigate excessive mail relay traffic.
 *  5. Producer Benefit Highlights: Communicates the value of account verification including
 *     Verified Farmer Trust Badges, escrow payout access, and wholesale grain contract inquiries.
 * 
 * Design Standards:
 *  - Follows Agrily Design System tokens (Lush Emerald #1b4332, Harvest Ochre #bc6c25, Canvas #f8faf9).
 *  - Responsive grid layout adapting from desktop to mobile screens (< 768px).
 *  - Strict null-safety across authentication context hooks.
 * 
 * @component PleaseVerifyEmailPage
 * @requires react
 * @requires react-router-dom
 * @requires axios
 * @requires ../auth/useUser
 * @requires ../auth/useToken
 * @requires ../components/NavBar
 * @requires ../components/Footer
 * @requires ./PleaseVerifyEmailPage.css
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../auth/useUser';
import { useToken } from '../auth/useToken';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import './PleaseVerifyEmailPage.css';

/**
 * Animated Mail Verification Shield SVG Primitive
 */
function ShieldMailIcon({ size = 42 }) {
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
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

/**
 * Refresh / Resend Spinner SVG
 */
function RefreshIcon({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function PleaseVerifyEmailPage() {
  const user = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [, setToken] = useToken();

  // Extract destination email from router navigation state, authenticated user, or fallback
  const registeredEmail = location?.state?.email || user?.email || '';

  // Local Component States
  const [manualCode, setManualCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(Boolean(user?.isVerified));
  const [verifyError, setVerifyError] = useState('');

  const [isResending, setIsResending] = useState(false);
  const [resendNotice, setResendNotice] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Manage 60-second resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Handle in-page verification code confirmation
  const handleManualVerify = useCallback(async (e) => {
    if (e) e.preventDefault();
    const tokenToVerify = manualCode.trim();
    if (!tokenToVerify) {
      setVerifyError('Please enter or paste your verification code.');
      return;
    }

    setIsVerifying(true);
    setVerifyError('');

    try {
      const response = await axios.put('http://localhost:5000/verify', {
        verificationString: tokenToVerify
      });

      if (response.data?.token) {
        setToken(response.data.token);
      }
      setVerifySuccess(true);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'The verification code or token is invalid or expired. Please check your link or request a new email.';
      setVerifyError(message);
    } finally {
      setIsVerifying(false);
    }
  }, [manualCode, setToken]);

  // Handle one-click resend verification request via Brevo
  const handleResendEmail = useCallback(async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setResendNotice('');
    setVerifyError('');

    try {
      const response = await axios.post('http://localhost:5000/api/resend-verification', {
        email: registeredEmail
      });

      if (response.data?.success) {
        setResendNotice(`✓ Verification email successfully resent to ${registeredEmail || 'your email'}.`);
        setResendCooldown(60);
      } else {
        setResendNotice(response.data?.message || 'Verification email has been dispatched.');
        setResendCooldown(60);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        'Unable to send verification email at this moment. Please check your internet connection or try again shortly.';
      setVerifyError(errorMsg);
    } finally {
      setIsResending(false);
    }
  }, [registeredEmail, resendCooldown, isResending]);

  return (
    <div className="agrily-verify-container" data-testid="please-verify-page">
      <NavBar />

      <main className="agrily-verify-content">
        <div className="agrily-verify-card">
          {/* Animated Shield Mail Header */}
          <div className="agrily-verify-icon-wrap" aria-hidden="true">
            <ShieldMailIcon size={44} />
          </div>

          {/* Agricultural Security Pill Badge */}
          <div className="agrily-verify-badge-pill">
            <span>🌾 Producer Security & Verification Portal</span>
          </div>

          {/* Success State When Verified */}
          {verifySuccess ? (
            <div data-testid="verification-success-state" className="py-3">
              <h1 className="agrily-verify-title" style={{ color: '#2d6a4f' }}>
                Account Verified Successfully!
              </h1>
              <p className="agrily-verify-subtitle">
                Your email has been confirmed. You now have full access to listing fresh produce,
                managing wholesale orders, and tracking escrow fulfillment.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/home')}
                  className="btn-agrily-harvest"
                  style={{
                    padding: '0.75rem 2rem',
                    fontSize: '1rem',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  Proceed to Producer Dashboard &rarr;
                </button>
              </div>
            </div>
          ) : (
            /* Primary Verification Instructions State */
            <>
              <h1 className="agrily-verify-title">Verify Your Email Address</h1>

              <p className="agrily-verify-subtitle">
                Thank you for registering on Agrily! We have dispatched a secure account activation
                link to verify your identity and protect your agricultural transactions.
                {registeredEmail && (
                  <span className="d-block mt-2">
                    <span className="agrily-email-chip">{registeredEmail}</span>
                  </span>
                )}
              </p>

              {/* Status Notice Alerts */}
              {resendNotice && (
                <div
                  className="alert alert-success d-flex align-items-center justify-content-center gap-2 mb-4"
                  style={{ borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600 }}
                  role="status"
                >
                  <span>{resendNotice}</span>
                </div>
              )}

              {verifyError && (
                <div
                  className="alert alert-danger d-flex align-items-center justify-content-center gap-2 mb-4"
                  style={{ borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600 }}
                  role="alert"
                >
                  <span>{verifyError}</span>
                </div>
              )}

              {/* Producer Verification Benefits */}
              <div className="agrily-verify-benefits" role="region" aria-label="Producer verification benefits">
                <div className="agrily-verify-benefit-card">
                  <span className="agrily-verify-benefit-icon">🏅</span>
                  <div className="agrily-verify-benefit-title">Verified Producer Badge</div>
                  <p className="agrily-verify-benefit-desc">
                    Display verified trust checkmarks across all your catalog produce listings to attract top buyers.
                  </p>
                </div>

                <div className="agrily-verify-benefit-card">
                  <span className="agrily-verify-benefit-icon">🛡️</span>
                  <div className="agrily-verify-benefit-title">Escrow Payout Settlement</div>
                  <p className="agrily-verify-benefit-desc">
                    Enable secure automated direct bank disbursements upon successful crop haulage delivery.
                  </p>
                </div>

                <div className="agrily-verify-benefit-card">
                  <span className="agrily-verify-benefit-icon">📈</span>
                  <div className="agrily-verify-benefit-title">Wholesale Trade Access</div>
                  <p className="agrily-verify-benefit-desc">
                    Receive contract inquiries and bulk grain purchase orders from industrial food processors.
                  </p>
                </div>
              </div>

              {/* Interactive In-Page Verification Code Box */}
              <div className="agrily-verify-code-box">
                <div className="agrily-verify-code-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>Have an Activation Code or Token?</span>
                </div>
                <p className="agrily-verify-code-desc">
                  Paste the verification string from your email link below to activate your account immediately:
                </p>

                <form onSubmit={handleManualVerify} className="agrily-verify-input-group">
                  <input
                    type="text"
                    className="agrily-verify-input"
                    placeholder="e.g. 4d8b-4672-bf50-cb91a6e20c74"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    aria-label="Enter email verification token"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    className="agrily-verify-submit-btn"
                    disabled={isVerifying || !manualCode.trim()}
                  >
                    {isVerifying ? 'Verifying...' : 'Activate Account'}
                  </button>
                </form>
              </div>

              {/* Resend and Navigation Actions */}
              <div className="agrily-verify-actions">
                <button
                  type="button"
                  className="agrily-resend-btn"
                  onClick={handleResendEmail}
                  disabled={isResending || resendCooldown > 0}
                  aria-label="Resend verification email"
                >
                  <RefreshIcon className={isResending ? 'spin' : ''} />
                  <span>
                    {isResending
                      ? 'Dispatching via Brevo...'
                      : resendCooldown > 0
                      ? `Resend Available in ${resendCooldown}s`
                      : 'Resend Verification Email'}
                  </span>
                </button>

                <div className="d-flex align-items-center gap-3 mt-2" style={{ fontSize: '0.88rem' }}>
                  <Link to="/login" style={{ color: '#2d6a4f', fontWeight: 600, textDecoration: 'none' }}>
                    &larr; Return to Sign In
                  </Link>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <Link to="/register" style={{ color: '#64748b', fontWeight: 500, textDecoration: 'none' }}>
                    Need to change email?
                  </Link>
                </div>
              </div>

              {/* Helpful Troubleshooting Advice */}
              <div className="agrily-verify-checklist">
                <div className="agrily-verify-checklist-title">
                  Didn&apos;t receive your verification email?
                </div>
                <ul>
                  <li>Wait 1–2 minutes for the delivery dispatch to reach your mail server.</li>
                  <li>Check your <strong>Spam</strong>, <strong>Junk</strong>, or <strong>Promotions</strong> folders.</li>
                  <li>Ensure your email address was spelled correctly during registration.</li>
                  <li>Add <strong>yusuf7samaila@gmail.com</strong> (Agrily verified sender) to your contacts or safe sender list.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default PleaseVerifyEmailPage;
