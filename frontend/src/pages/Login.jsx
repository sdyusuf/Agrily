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

function Login() {
  const [, setToken] = useToken();
  const [errorMessage, setErrorMessage] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const onLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await axios.post('http://localhost:5000/api/login', { email, password });
      const { token } = response.data;
      setToken(token);
      navigate('/home');
    } catch (err) {
      setIsSubmitting(false);
      const serverMessage = err.response?.data?.message || 'Invalid email or password. Please try again.';
      setErrorMessage(serverMessage);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8faf9' }}>
      <NavBar />

      <main style={{ flex: '1 0 auto', display: 'flex', alignItems: 'center', padding: '3.5rem 1rem' }}>
        <Container>
          <Row className="justify-content-center">
            <Col xs={12} sm={10} md={8} lg={5} xl={4}>
              <div
                className="agrily-card"
                style={{
                  padding: '2.5rem 2rem',
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
                    Welcome Back
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    Sign in to manage your produce listings and incoming orders.
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

                <Form onSubmit={onLogin}>
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
                      <Link
                        to="/forgot-password"
                        style={{
                          fontSize: '0.8rem',
                          color: '#bc6c25',
                          fontWeight: '600',
                          textDecoration: 'none'
                        }}
                      >
                        Forgot?
                      </Link>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="agrily-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </Form.Group>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn-agrily-primary w-100 mt-2"
                    disabled={!email || !password || isSubmitting}
                    style={{ fontSize: '1rem', padding: '0.75rem' }}
                  >
                    {isSubmitting ? 'Signing in...' : (
                      <>
                        Sign In to Dashboard <ArrowRightIcon size={16} />
                      </>
                    )}
                  </button>
                </Form>

                {/* Footer Link */}
                <div className="text-center mt-4 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.88rem', color: '#64748b' }}>
                    New to Agrily?{' '}
                    <Link
                      to="/register"
                      style={{ color: '#2d6a4f', fontWeight: '700', textDecoration: 'none' }}
                    >
                      Create an Account
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

export default Login;
