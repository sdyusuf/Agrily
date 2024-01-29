import React, { useState } from 'react';
import Card from 'react-bootstrap/Card';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { CategoryBadge, StockBadge } from './CategoryBadge';
import { SproutIcon, AlertCircleIcon } from './Icons';

function ProductCard({ product, onEdit, onDelete, onArchive }) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!product) return null;

  const {
    _id,
    name = 'Farm Produce',
    category = 'other',
    unit = 'kg',
    price = 0,
    quantity = 0,
    minOrderQuantity = 1,
    harvestDate,
    description,
    imageURL,
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
        month: 'short',
        year: 'numeric'
      })
    : null;

  const handleConfirmDelete = async (permanent = false) => {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(_id, permanent);
      }
    } finally {
      setIsDeleting(false);
      setShowConfirmModal(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (onArchive) {
      await onArchive(product);
    }
  };

  return (
    <>
      <Card
        className="agrily-card h-100"
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Produce Image or Fallback Header */}
        <div
          style={{
            height: '160px',
            backgroundColor: '#f1f5f9',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {imageURL ? (
            <Card.Img
              variant="top"
              src={imageURL}
              alt={name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#64748b'
              }}
            >
              <SproutIcon size={36} color="#52b788" />
              <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>No Photo Attached</span>
            </div>
          )}

          {/* Badges Overlay */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              right: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pointerEvents: 'none'
            }}
          >
            <CategoryBadge category={category} size="sm" />
            <StockBadge isSold={isSold} quantity={quantity} size="sm" />
          </div>
        </div>

        {/* Card Body */}
        <Card.Body style={{ padding: '1.25rem', flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <h3
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: '#1b4332',
                marginBottom: 0,
                lineHeight: 1.3
              }}
            >
              {name}
            </h3>
          </div>

          {/* Price & Unit */}
          <div className="mb-2">
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#bc6c25'
              }}
            >
              {formattedPrice}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: '0.25rem' }}>
              / {unit}
            </span>
          </div>

          {/* Inventory Meta */}
          <div
            style={{
              fontSize: '0.85rem',
              color: '#475569',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              marginBottom: '0.75rem'
            }}
          >
            <div>
              <strong>Available:</strong> {quantity} {unit}s
            </div>
            {minOrderQuantity > 1 && (
              <div>
                <strong>Min. Order:</strong> {minOrderQuantity} {unit}s
              </div>
            )}
            {formattedDate && (
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                <strong>Harvested:</strong> {formattedDate}
              </div>
            )}
          </div>

          {description && (
            <p
              style={{
                fontSize: '0.85rem',
                color: '#64748b',
                lineHeight: 1.4,
                marginBottom: '1rem',
                flexGrow: 1,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {description}
            </p>
          )}

          {/* Action Footer Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              marginTop: 'auto',
              paddingTop: '0.75rem',
              borderTop: '1px solid #f1f5f9'
            }}
          >
            <button
              type="button"
              className="btn-agrily-outline"
              style={{
                flex: 1,
                padding: '0.4rem 0.5rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                borderRadius: '8px',
                textAlign: 'center'
              }}
              onClick={() => onEdit && onEdit(product)}
            >
              Edit
            </button>

            <button
              type="button"
              style={{
                background: isSold ? '#ecfdf5' : '#fefae0',
                color: isSold ? '#065f46' : '#bc6c25',
                border: `1px solid ${isSold ? '#a7f3d0' : '#dda15e'}`,
                borderRadius: '8px',
                padding: '0.4rem 0.6rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
              title={isSold ? 'Restore listing to Active' : 'Archive listing'}
              onClick={handleArchiveToggle}
            >
              {isSold ? 'Restore' : 'Archive'}
            </button>

            <button
              type="button"
              style={{
                background: '#fef2f2',
                color: '#991b1b',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '0.4rem 0.6rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
              onClick={() => setShowConfirmModal(true)}
              aria-label="Delete listing"
            >
              Delete
            </button>
          </div>
        </Card.Body>
      </Card>

      {/* Delete / Archive Confirmation Dialog */}
      <Modal
        show={showConfirmModal}
        onHide={() => !isDeleting && setShowConfirmModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton={!isDeleting} style={{ borderBottom: '1px solid #e5e7eb' }}>
          <Modal.Title style={{ fontSize: '1.15rem', color: '#1b4332', fontWeight: 700 }}>
            Remove Produce Listing
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '1.5rem' }}>
          <div className="d-flex align-items-start gap-3">
            <div
              style={{
                backgroundColor: '#fef2f2',
                borderRadius: '50%',
                padding: '0.5rem',
                display: 'flex',
                color: '#991b1b'
              }}
            >
              <AlertCircleIcon size={24} color="#991b1b" />
            </div>
            <div>
              <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>
                Are you sure you want to remove &ldquo;{name}&rdquo;?
              </p>
              <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: 0 }}>
                You can archive this listing so it is hidden from the marketplace but preserved in your sales records, or permanently delete it.
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #e5e7eb', backgroundColor: '#f8faf9' }}>
          <Button
            variant="light"
            onClick={() => setShowConfirmModal(false)}
            disabled={isDeleting}
            style={{ fontWeight: 600, fontSize: '0.9rem' }}
          >
            Cancel
          </Button>
          <Button
            variant="outline-secondary"
            onClick={() => handleConfirmDelete(false)}
            disabled={isDeleting}
            style={{ fontWeight: 600, fontSize: '0.9rem' }}
          >
            Archive Instead
          </Button>
          <Button
            variant="danger"
            onClick={() => handleConfirmDelete(true)}
            disabled={isDeleting}
            style={{ fontWeight: 600, fontSize: '0.9rem' }}
          >
            {isDeleting ? 'Deleting...' : 'Permanently Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ProductCard;
