import React from 'react';
import { useNavigate } from 'react-router-dom';

function EmailVerificationFail() {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', padding: '1.5rem' }}>
      <h2 style={{ color: '#bc6c25', fontWeight: 800, marginBottom: '0.75rem' }}>
        Verification Notice ⚠️
      </h2>
      <p style={{ color: '#475569', fontSize: '1rem', marginBottom: '1.5rem' }}>
        Something went wrong while verifying this link. It may have expired or already been used.
      </p>
      <button
        type="button"
        onClick={() => navigate('/login')}
        className="btn-agrily-outline"
        style={{
          padding: '0.75rem 2rem',
          fontSize: '1rem',
          fontWeight: 700,
          borderRadius: '10px'
        }}
      >
        Proceed to Sign In &rarr;
      </button>
    </div>
  );
}

export default EmailVerificationFail;