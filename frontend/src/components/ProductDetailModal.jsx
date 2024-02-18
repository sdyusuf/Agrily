import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { CategoryBadge, StockBadge } from './CategoryBadge';
import { SproutIcon } from './Icons';
import './ProductDetailModal.css';

function ProductDetailModal({ show, onHide, product, onOrderInquiry }) {
  if (!product) return null;

  const {
    name = 'Farm Produce',
    category = 'other',
    unit = 'kg',
    price = 0,
    quantity = 0,
    minOrderQuantity = 1,
    harvestDate,
    description,
    imageURL,
    ownerName = 'Local Producer',
    ownerEmail = 'farmer@agrily.com',
    isSold = false
  } = product;

  const formattedPrice = Number(price).toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  });

  const formattedDate = harvestDate
    ? new Date(harvestDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : null;

  const initials = ownerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AG';

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      className="agrily-detail-modal"
    >
      <Modal.Header closeButton style={{ borderBottom: '1px solid #e5e7eb', padding: '1rem 1.5rem' }}>
        <div className="d-flex align-items-center gap-2">
          <CategoryBadge category={category} size="md" />
          <StockBadge isSold={isSold} quantity={quantity} size="md" />
        </div>
      </Modal.Header>

      <Modal.Body style={{ padding: '0 0 1.5rem 0' }}>
        {/* Produce Image Header */}
        {imageURL ? (
          <img src={imageURL} alt={name} className="agrily-detail-hero-img" />
        ) : (
          <div
            className="agrily-detail-hero-img d-flex flex-column align-items-center justify-content-center text-muted"
            style={{ backgroundColor: '#f1f5f9' }}
          >
            <SproutIcon size={48} color="#52b788" />
            <span className="mt-2" style={{ fontSize: '0.85rem' }}>Produce Photograph</span>
          </div>
        )}

        <div style={{ padding: '1.5rem 1.75rem 0 1.75rem' }}>
          {/* Title & Price */}
          <div className="d-flex flex-wrap justify-content-between align-items-baseline mb-3 gap-2">
            <div>
              <h2
                className="brand-font mb-1"
                style={{ color: '#1b4332', fontWeight: 800, fontSize: '1.65rem' }}
              >
                {name}
              </h2>
              {formattedDate && (
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Harvested on <strong>{formattedDate}</strong>
                </span>
              )}
            </div>

            <div className="text-end">
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#bc6c25' }}>
                {formattedPrice}
              </span>
              <span style={{ fontSize: '0.9rem', color: '#64748b', marginLeft: '0.3rem' }}>
                / {unit}
              </span>
            </div>
          </div>

          {/* Quick Specs Grid */}
          <Row className="g-3 mb-4">
            <Col xs={6} sm={4}>
              <div style={{ background: '#f8faf9', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', fontWeight: 600 }}>
                  Available Stock
                </span>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  {quantity} {unit}s
                </span>
              </div>
            </Col>

            <Col xs={6} sm={4}>
              <div style={{ background: '#f8faf9', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', fontWeight: 600 }}>
                  Min. Bulk Order
                </span>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  {minOrderQuantity} {unit}s
                </span>
              </div>
            </Col>

            <Col xs={12} sm={4}>
              <div style={{ background: '#f8faf9', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', fontWeight: 600 }}>
                  Measurement Standard
                </span>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  Standard {unit.toUpperCase()}
                </span>
              </div>
            </Col>
          </Row>

          {/* Produce Description */}
          {description && (
            <div className="mb-4">
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1b4332', marginBottom: '0.4rem' }}>
                About this Harvest
              </h4>
              <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: 0 }}>
                {description}
              </p>
            </div>
          )}

          {/* Producer / Farmer Credentials Card */}
          <div className="agrily-farmer-card">
            <div className="agrily-farmer-avatar">{initials}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#1b4332', fontSize: '0.95rem' }}>
                {ownerName}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Direct Farm Producer &bull; {ownerEmail}
              </div>
            </div>
            <a
              href={`mailto:${ownerEmail}?subject=Agrily Inquiry: ${encodeURIComponent(name)}`}
              className="btn-agrily-outline"
              style={{ textDecoration: 'none', padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
            >
              Email Farmer
            </a>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer style={{ borderTop: '1px solid #e5e7eb', backgroundColor: '#f8faf9', padding: '0.85rem 1.5rem' }}>
        <Button variant="light" onClick={onHide} style={{ fontWeight: 600, fontSize: '0.9rem' }}>
          Close
        </Button>
        <button
          type="button"
          className="btn-agrily-harvest"
          style={{ padding: '0.45rem 1.25rem', fontSize: '0.9rem' }}
          onClick={() => {
            if (onOrderInquiry) onOrderInquiry(product);
            else window.location.href = `mailto:${ownerEmail}?subject=Purchase Inquiry: ${encodeURIComponent(name)}`;
          }}
        >
          Purchase / Inquire
        </button>
      </Modal.Footer>
    </Modal>
  );
}

export default ProductDetailModal;
