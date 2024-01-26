import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Alert from 'react-bootstrap/Alert';
import axios from 'axios';
import { useToken } from '../auth/useToken';
import { AlertCircleIcon, SproutIcon } from './Icons';
import './EditProductModal.css';

const CATEGORIES = [
  'grains',
  'tubers',
  'fruits',
  'vegetables',
  'livestock',
  'poultry',
  'dairy',
  'other'
];

const UNITS = [
  'kg',
  'bag',
  'crate',
  'ton',
  'basket',
  'piece',
  'liter'
];

function EditProductModal({ show, onHide, product, onProductUpdated }) {
  const [token] = useToken();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('other');
  const [unit, setUnit] = useState('kg');
  const [quantity, setQuantity] = useState(1);
  const [minOrderQuantity, setMinOrderQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [harvestDate, setHarvestDate] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setCategory(product.category || 'other');
      setUnit(product.unit || 'kg');
      setQuantity(product.quantity !== undefined ? product.quantity : 1);
      setMinOrderQuantity(product.minOrderQuantity || 1);
      setPrice(product.price !== undefined ? product.price : 0);
      setDescription(product.description || '');

      if (product.harvestDate) {
        const dateStr = new Date(product.harvestDate).toISOString().split('T')[0];
        setHarvestDate(dateStr);
      } else {
        setHarvestDate('');
      }
      setErrorMessage('');
    }
  }, [product, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product?._id) return;

    if (!name.trim()) {
      setErrorMessage('Produce name is required.');
      return;
    }
    if (Number(price) < 0) {
      setErrorMessage('Price cannot be negative.');
      return;
    }
    if (Number(quantity) < 0) {
      setErrorMessage('Available quantity cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        name: name.trim(),
        category,
        unit,
        quantity: Number(quantity),
        minOrderQuantity: Number(minOrderQuantity),
        price: Number(price),
        harvestDate: harvestDate || null,
        description: description.trim()
      };

      const response = await axios.put(
        `http://localhost:5000/api/product/${product._id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setIsSubmitting(false);
      if (onProductUpdated && response.data?.product) {
        onProductUpdated(response.data.product);
      }
      onHide();
    } catch (err) {
      setIsSubmitting(false);
      const msg = err.response?.data?.message || 'Failed to update produce listing. Please try again.';
      setErrorMessage(msg);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered className="agrily-modal" backdrop="static">
      <div className="agrily-modal-header d-flex justify-content-between align-items-center">
        <div className="agrily-modal-title">
          <SproutIcon size={20} color="#2d6a4f" />
          <span>Edit Produce Listing</span>
        </div>
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={onHide}
          disabled={isSubmitting}
        />
      </div>

      <Form onSubmit={handleSubmit}>
        <div className="agrily-modal-body">
          {errorMessage && (
            <Alert variant="danger" className="d-flex align-items-center gap-2 py-2 mb-3">
              <AlertCircleIcon size={18} color="#991b1b" />
              <span style={{ fontSize: '0.88rem' }}>{errorMessage}</span>
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label className="agrily-form-label">Produce Name</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fresh Organic Tomatoes"
              className="agrily-form-control"
              required
            />
          </Form.Group>

          <Row className="g-3 mb-3">
            <Col xs={12} sm={6}>
              <Form.Group>
                <Form.Label className="agrily-form-label">Category</Form.Label>
                <Form.Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="agrily-form-control"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12} sm={6}>
              <Form.Group>
                <Form.Label className="agrily-form-label">Measurement Unit</Form.Label>
                <Form.Select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="agrily-form-control"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      Per {u.toUpperCase()}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3 mb-3">
            <Col xs={12} sm={6}>
              <Form.Group>
                <Form.Label className="agrily-form-label">Unit Price (₦)</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="agrily-form-control"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12} sm={6}>
              <Form.Group>
                <Form.Label className="agrily-form-label">Available Quantity</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="agrily-form-control"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3 mb-3">
            <Col xs={12} sm={6}>
              <Form.Group>
                <Form.Label className="agrily-form-label">Min. Order Quantity</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={minOrderQuantity}
                  onChange={(e) => setMinOrderQuantity(e.target.value)}
                  className="agrily-form-control"
                />
              </Form.Group>
            </Col>

            <Col xs={12} sm={6}>
              <Form.Group>
                <Form.Label className="agrily-form-label">Harvest Date</Form.Label>
                <Form.Control
                  type="date"
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  className="agrily-form-control"
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-2">
            <Form.Label className="agrily-form-label">Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about quality, farming practices, or packaging..."
              className="agrily-form-control"
            />
          </Form.Group>
        </div>

        <div className="agrily-modal-footer">
          <button
            type="button"
            className="agrily-btn-cancel"
            onClick={onHide}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button type="submit" className="agrily-btn-save" disabled={isSubmitting}>
            {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </Form>
    </Modal>
  );
}

export default EditProductModal;
