import React from 'react';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Image from 'react-bootstrap/Image';
import { Link } from 'react-router-dom';
import farmer from '../images/farmer.jpg';
import farmer2 from '../images/farmer1.jpg';
import { CategoryBadge } from './CategoryBadge';
import { ArrowRightIcon } from './Icons';

function Body() {
  const categoriesList = [
    'grains',
    'tubers',
    'fruits',
    'vegetables',
    'livestock',
    'poultry',
    'dairy',
    'other'
  ];

  return (
    <section style={{ padding: '4.5rem 0', backgroundColor: '#f8faf9' }}>
      <Container>
        {/* Category Showcase Ribbon */}
        <div id="categories" className="text-center mb-5 pb-3">
          <div
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontSize: '0.8rem',
              fontWeight: '700',
              color: '#2d6a4f',
              marginBottom: '0.5rem'
            }}
          >
            Explore Agricultural Markets
          </div>
          <h2 className="brand-font" style={{ fontWeight: '800', color: '#0f172a' }}>
            Supported Produce Categories
          </h2>
          <p style={{ color: '#475569', maxWidth: '600px', margin: '0.5rem auto 1.5rem auto' }}>
            From high-yield cereals and tubers to fresh orchard fruits and pasture-raised livestock.
          </p>

          <div
            className="d-flex justify-content-center flex-wrap"
            style={{ gap: '0.75rem', maxWidth: '850px', margin: '0 auto' }}
          >
            {categoriesList.map((cat) => (
              <CategoryBadge key={cat} category={cat} size="lg" />
            ))}
          </div>
        </div>

        {/* Feature Section 1: Farmers Choice */}
        <div id="about" className="agrily-card p-4 p-md-5 mb-5 agrily-card-hover" style={{ backgroundColor: '#ffffff' }}>
          <Row className="align-items-center g-4">
            <Col lg={6}>
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: '#ecfdf5',
                  color: '#065f46',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  marginBottom: '1rem'
                }}
              >
                For Producers & Farmers
              </div>
              <h3 className="brand-font" style={{ fontWeight: '800', color: '#1b4332', fontSize: '1.9rem' }}>
                Sell While It's Fresh. <br />Get Fair Market Value.
              </h3>
              <p style={{ color: '#475569', fontSize: '1.02rem', marginTop: '1rem', lineHeight: '1.7' }}>
                Post-harvest loss is a leading challenge for agricultural producers. Agrily provides farmers with an instant digital catalog to broadcast their harvest lots, connect directly with wholesale and retail buyers, and secure sales before freshness deteriorates.
              </p>
              <ul style={{ color: '#475569', paddingLeft: '1.25rem', marginBottom: '1.5rem', lineHeight: '1.8' }}>
                <li>Direct communication with verified crop buyers</li>
                <li>Set your own unit prices (per kg, bag, crate, or ton)</li>
                <li>Real-time inventory management and stock tracking</li>
              </ul>
              <Link to="/register" className="btn-agrily-primary" style={{ textDecoration: 'none' }}>
                Start Listing Produce <ArrowRightIcon size={16} />
              </Link>
            </Col>
            <Col lg={6}>
              <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
                <Image src={farmer2} fluid style={{ width: '100%', height: '360px', objectFit: 'cover' }} alt="Farmer harvesting crops" />
              </div>
            </Col>
          </Row>
        </div>

        {/* Feature Section 2: Buyers Choice */}
        <div className="agrily-card p-4 p-md-5 mb-5 agrily-card-hover" style={{ backgroundColor: '#ffffff' }}>
          <Row className="align-items-center g-4 flex-lg-row-reverse">
            <Col lg={6}>
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: '#fefae0',
                  color: '#7f3b08',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  marginBottom: '1rem'
                }}
              >
                For Bulk Buyers & Retailers
              </div>
              <h3 className="brand-font" style={{ fontWeight: '800', color: '#bc6c25', fontSize: '1.9rem' }}>
                Traceable Quality from <br />Reputable Local Growers.
              </h3>
              <p style={{ color: '#475569', fontSize: '1.02rem', marginTop: '1rem', lineHeight: '1.7' }}>
                Wholesalers, food processors, and grocers rely on Agrily to source high-grade produce at transparent prices. Filter by harvest date, category, and minimum order quantities to streamline procurement.
              </p>
              <ul style={{ color: '#475569', paddingLeft: '1.25rem', marginBottom: '1.5rem', lineHeight: '1.8' }}>
                <li>Verified farmer identities and transparent harvest dates</li>
                <li>Zero arbitrary middleman surcharges</li>
                <li>Transparent measurements and bulk packaging specifications</li>
              </ul>
              <Link to="/login" className="btn-agrily-harvest" style={{ textDecoration: 'none' }}>
                Sign In to Buy Produce <ArrowRightIcon size={16} />
              </Link>
            </Col>
            <Col lg={6}>
              <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
                <Image src={farmer} fluid style={{ width: '100%', height: '360px', objectFit: 'cover' }} alt="Buyer inspecting produce" />
              </div>
            </Col>
          </Row>
        </div>

        {/* Call To Action Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
            borderRadius: '20px',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            color: '#ffffff',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <h2 className="brand-font" style={{ fontWeight: '800', marginBottom: '1rem' }}>
            Ready to Transform Your Agricultural Commerce?
          </h2>
          <p style={{ color: '#d8f3dc', maxWidth: '580px', margin: '0 auto 2rem auto', fontSize: '1.1rem' }}>
            Join hundreds of proactive farmers and commercial buyers trading produce directly on Agrily.
          </p>
          <Link
            to="/register"
            className="btn-agrily-harvest"
            style={{
              textDecoration: 'none',
              fontSize: '1.05rem',
              padding: '0.85rem 2.2rem',
              backgroundColor: '#dda15e',
              color: '#081c15',
              borderColor: '#fefae0'
            }}
          >
            Create Your Free Account
          </Link>
        </div>
      </Container>
    </section>
  );
}

export default Body;
