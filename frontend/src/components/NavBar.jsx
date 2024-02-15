import React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import { Link } from 'react-router-dom';
import Logo from './Logo';

function NavBar() {
  return (
    <Navbar
      collapseOnSelect
      expand="lg"
      sticky="top"
      style={{
        background: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
        padding: '0.85rem 0',
        transition: 'all 200ms ease'
      }}
    >
      <Container>
        <Logo size="md" linkTo="/" />

        <Navbar.Toggle aria-controls="responsive-navbar-nav" style={{ border: 'none' }} />

        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="ms-auto align-items-center" style={{ gap: '1.25rem' }}>
            <Nav.Link
              as={Link}
              to="/"
              style={{ fontWeight: '500', color: '#475569', fontSize: '0.95rem' }}
            >
              Home
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/marketplace"
              style={{ fontWeight: '600', color: '#1b4332', fontSize: '0.95rem' }}
            >
              Marketplace
            </Nav.Link>
            <Nav.Link
              href="#about"
              style={{ fontWeight: '500', color: '#475569', fontSize: '0.95rem' }}
            >
              Why Agrily
            </Nav.Link>
            <Nav.Link
              href="#categories"
              style={{ fontWeight: '500', color: '#475569', fontSize: '0.95rem' }}
            >
              Categories
            </Nav.Link>

            <div className="d-flex align-items-center" style={{ gap: '0.75rem', marginLeft: '0.5rem' }}>
              <Link
                to="/login"
                className="btn-agrily-outline"
                style={{
                  textDecoration: 'none',
                  padding: '0.45rem 1.1rem',
                  fontSize: '0.9rem'
                }}
              >
                Sign In
              </Link>

              <Link
                to="/register"
                className="btn-agrily-harvest"
                style={{
                  textDecoration: 'none',
                  padding: '0.45rem 1.15rem',
                  fontSize: '0.9rem'
                }}
              >
                Get Started
              </Link>
            </div>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavBar;