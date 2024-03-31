import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import axios from 'axios';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import Logo from '../components/Logo';
import { AlertCircleIcon, ArrowRightIcon } from '../components/Icons';
import { useToken } from '../auth/useToken';

function Register() {
  const [, setToken] = useToken();
  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !passwordsMatch) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await axios.post('http://localhost:5000/api/signup', {
        firstName,
        lastName,
        email,
        password
      });

      const { token } = response.data;
      if (token) setToken(token);
      navigate('/verify-email', { state: { email } });
    } catch (err) {
      setIsSubmitting(false);
      const serverMessage =
        err.response?.data?.message || 'Registration failed. An account with this email may already exist.';
      setErrorMessage(serverMessage);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8faf9' }}>
      <NavBar />

      <main style={{ flex: '1 0 auto', display: 'flex', alignItems: 'center', padding: '3.5rem 1rem' }}>
        <Container>
          <Row className="justify-content-center">
            <Col xs={12} sm={11} md={9} lg={6} xl={5}>
              <div
                className="agrily-card"
                style={{
                  padding: '2.5rem 2.25rem',
                  backgroundColor: '#ffffff',
                  boxShadow: 'var(--shadow-xl)',
                  borderRadius: '20px'
                }}
              >
                {/* Header */}
                <div className="text-center mb-4">
                  <div className="mb-2">
                    <Logo size="lg" linkTo="/" />
                  </div>
                  <h2 className="brand-font mt-2" style={{ fontWeight: '800', color: '#1b4332', fontSize: '1.75rem' }}>
                    Create Farmer Account
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    Join Agrily to list fresh produce and trade directly with verified buyers.
                  </p>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <Alert
                    variant="danger"
                    style={{
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      backgroundColor: '#fef2f2',
                      borderColor: '#fecaca',
                      color: '#991b1b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <AlertCircleIcon size={18} color="#991b1b" /> {errorMessage}
                  </Alert>
                )}

                <Form onSubmit={handleSignUp}>
                  {/* Name Fields (2 Columns) */}
                  <Row className="g-2 mb-3">
                    <Col sm={6}>
                      <Form.Group controlId="firstName">
                        <Form.Label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                          First Name
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g. Amina"
                          className="agrily-input"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>

                    <Col sm={6}>
                      <Form.Group controlId="lastName">
                        <Form.Label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                          Last Name
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g. Bello"
                          className="agrily-input"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Email Field */}
                  <Form.Group className="mb-3" controlId="email">
                    <Form.Label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                      Email Address
                    </Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="farmer@example.com"
                      className="agrily-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Form.Group>

                  {/* Password Field */}
                  <Form.Group className="mb-3" controlId="password">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <Form.Label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', margin: 0 }}>
                        Password
                      </Form.Label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        {showPassword ? 'Hide password' : 'Show password'}
                      </button>
                    </div>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      className="agrily-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Form.Group>

                  {/* Confirm Password */}
                  <Form.Group className="mb-3" controlId="confirmPassword">
                    <Form.Label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                      Confirm Password
                    </Form.Label>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      className="agrily-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    {confirmPassword.length > 0 && !passwordsMatch && (
                      <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                        Passwords do not match
                      </div>
                    )}
                  </Form.Group>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn-agrily-harvest w-100 mt-3"
                    disabled={
                      !firstName || !lastName || !email || !passwordsMatch || isSubmitting
                    }
                    style={{ fontSize: '1rem', padding: '0.75rem' }}
                  >
                    {isSubmitting ? 'Creating Account...' : (
                      <>
                        Complete Registration <ArrowRightIcon size={16} />
                      </>
                    )}
                  </button>
                </Form>

                {/* Footer Link */}
                <div className="text-center mt-4 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.88rem', color: '#64748b' }}>
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      style={{ color: '#bc6c25', fontWeight: '700', textDecoration: 'none' }}
                    >
                      Sign In
                    </Link>
                  </span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

export default Register;
