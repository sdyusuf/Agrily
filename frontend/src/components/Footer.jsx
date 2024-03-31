import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Link } from 'react-router-dom';
import Logo from './Logo';

function Footer() {
  return (
    <footer
      style={{
        backgroundColor: '#081c15',
        color: '#e2e8f0',
        padding: '3.5rem 0 2rem 0',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        marginTop: 'auto'
      }}
    >
      <Container>
        <Row className="gy-4 mb-4">
          <Col lg={5} md={6}>
            <div className="mb-2">
              <Logo size="md" variant="light" linkTo="/" />
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.92rem', maxWidth: '360px', lineHeight: '1.6' }}>
              The agricultural marketplace connecting local farmers directly with commercial and household buyers. Fresh produce, transparent pricing, verified trade.
            </p>
          </Col>

          <Col lg={3} sm={6}>
            <div style={{ fontWeight: '700', color: '#ffffff', marginBottom: '1rem', fontSize: '0.95rem' }}>
              Quick Navigation
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '2.1', fontSize: '0.9rem' }}>
              <li><Link to="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Home</Link></li>
              <li><Link to="/login" style={{ color: '#94a3b8', textDecoration: 'none' }}>Farmer Dashboard</Link></li>
              <li><Link to="/register" style={{ color: '#94a3b8', textDecoration: 'none' }}>Register as Farmer</Link></li>
              <li><Link to="/add-product" style={{ color: '#94a3b8', textDecoration: 'none' }}>List Produce</Link></li>
            </ul>
          </Col>

          <Col lg={4} sm={6}>
            <div style={{ fontWeight: '700', color: '#ffffff', marginBottom: '1rem', fontSize: '0.95rem' }}>
              Produce Categories
            </div>
            <div className="d-flex flex-wrap" style={{ gap: '0.5rem' }}>
              {['Grains', 'Tubers', 'Fruits', 'Vegetables', 'Livestock', 'Poultry', 'Dairy'].map((item) => (
                <span
                  key={item}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#cbd5e1',
                    fontSize: '0.78rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px'
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </Col>
        </Row>

        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '1.5rem',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: '#64748b'
          }}
        >
          Agrily &copy; {new Date().getFullYear()} — Cultivating Direct Agricultural Commerce. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
