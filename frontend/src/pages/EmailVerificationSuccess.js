import React from 'react';
import { useNavigate } from 'react-router-dom';

function EmailVerificationSuccess() {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', padding: '1.5rem' }}>
      <h2 style={{ color: '#1b4332', fontWeight: 800, marginBottom: '0.75rem' }}>
        Account Verified Successfully! 🎉
      </h2>
      <p style={{ color: '#475569', fontSize: '1rem', marginBottom: '1.5rem' }}>
        Thank you for verifying your agricultural producer profile. Your account is now fully active.
      </p>
      <button
        type="button"
        onClick={() => navigate('/home')}
        className="btn-agrily-harvest"
        style={{
          padding: '0.75rem 2rem',
          fontSize: '1rem',
          fontWeight: 700,
          border: 'none',
          borderRadius: '10px'
        }}
      >
        Go to Dashboard &rarr;
      </button>
    </div>
  );
}

export default EmailVerificationSuccess;
