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
 *  3. Producer Benefit Highlights: Communicates the value of account verification including
 *     Verified Farmer Trust Badges, escrow payout access, and wholesale grain contract inquiries.
 *  4. Troubleshooting Checklist: Guides the user on checking spam/promotions folders and adding
 *     the verified sender email to prevent delivery drops.
 * 
 * Design Standards:
 *  - Follows Agrily Design System tokens (Lush Emerald #1b4332, Harvest Ochre #bc6c25, Canvas #f8faf9).
 *  - Responsive grid layout adapting from desktop to mobile screens (< 768px).
 *  - Strict null-safety across authentication context hooks.
 * 
 * @component PleaseVerifyEmailPage
 * @requires react
 * @requires react-router-dom
 * @requires ../auth/useUser
 * @requires ../components/NavBar
 * @requires ../components/Footer
 * @requires ./PleaseVerifyEmailPage.css
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../auth/useUser';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import './PleaseVerifyEmailPage.css';

/**
 * Animated Mail Verification Shield SVG Primitive
 */
function ShieldMailIcon({ size = 44 }) {
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

function PleaseVerifyEmailPage() {
  const user = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract destination email from router navigation state, authenticated user, or fallback
  const registeredEmail = location?.state?.email || user?.email || '';
  const isAlreadyVerified = Boolean(user?.isVerified);

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

          {/* State When Already Verified */}
          {isAlreadyVerified ? (
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
