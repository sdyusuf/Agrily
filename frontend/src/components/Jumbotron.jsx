import React from "react";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import background from '../images/bg.jpg';
import { Link } from 'react-router-dom';
import { WheatIcon } from './Icons';

function Jumbotron() {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '75vh',
        backgroundImage: `linear-gradient(135deg, rgba(8, 28, 21, 0.82) 0%, rgba(27, 67, 50, 0.88) 100%), url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        color: '#ffffff',
        padding: '5rem 0 4rem 0'
      }}
    >
      <Container>
        <Row className="justify-content-center text-center">
          <Col lg={10} xl={9}>
            {/* Pill Banner */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(254, 250, 224, 0.15)',
                border: '1px solid rgba(254, 250, 224, 0.35)',
                color: '#fefae0',
                padding: '0.4rem 1.2rem',
                borderRadius: '9999px',
                fontSize: '0.88rem',
                fontWeight: '600',
                marginBottom: '1.75rem',
                backdropFilter: 'blur(8px)'
              }}
            >
              <WheatIcon size={16} color="#dda15e" /> Direct Farmer-to-Buyer Agricultural Trade
            </div>

            {/* Main Heading */}
            <h1
              className="brand-font"
              style={{
                fontSize: 'clamp(2.2rem, 5vw, 3.75rem)',
                fontWeight: '800',
                lineHeight: '1.15',
                color: '#ffffff',
                marginBottom: '1.5rem',
                letterSpacing: '-0.03em'
              }}
            >
              Empowering Farmers. <br />
              <span style={{ color: '#dda15e' }}>Delivering Fresh Produce Directly.</span>
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                color: '#e2e8f0',
                maxWidth: '680px',
                margin: '0 auto 2.5rem auto',
                lineHeight: '1.6'
              }}
            >
              Agrily provides a reliable, transparent digital marketplace for farmers to list freshly harvested crops, grains, and livestock — getting fair prices with zero middleman friction.
            </p>

            {/* CTA Buttons */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                flexWrap: 'wrap'
              }}
            >
              <Link
                to="/register"
                className="btn-agrily-harvest"
                style={{
                  textDecoration: 'none',
                  fontSize: '1.05rem',
                  padding: '0.85rem 2rem'
                }}
              >
                Join as a Farmer
              </Link>

              <Link
                to="/login"
                className="btn-agrily-outline"
                style={{
                  textDecoration: 'none',
                  fontSize: '1.05rem',
                  padding: '0.85rem 1.8rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  borderColor: 'rgba(255, 255, 255, 0.4)'
                }}
              >
                Sign In to Dashboard
              </Link>
            </div>

            {/* Trust Metrics Bar */}
            <Row
              className="mt-5 pt-4 justify-content-center"
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                margin: '3rem auto 0 auto',
                maxWidth: '750px'
              }}
            >
              <Col xs={4}>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#52b788' }}>100%</div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Direct from Farm</div>
              </Col>
              <Col xs={4}>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#dda15e' }}>Verified</div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Farmer Profiles</div>
              </Col>
              <Col xs={4}>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#52b788' }}>Zero</div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Hidden Margins</div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Jumbotron;
