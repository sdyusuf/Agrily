import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import axios from 'axios';
import TopBar from '../components/TopBar';
import Footer from '../components/Footer';
import { useToken } from '../auth/useToken';
import { useUser } from '../auth/useUser';
import { SproutIcon, AlertCircleIcon, CheckCircleIcon, ArrowRightIcon } from '../components/Icons';

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

function AddProduct() {
  const navigate = useNavigate();
  const [token] = useToken();
  const user = useUser();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('grains');
  const [unit, setUnit] = useState('bag');
  const [quantity, setQuantity] = useState('');
  const [minOrderQuantity, setMinOrderQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [harvestDate, setHarvestDate] = useState('');
  const [description, setDescription] = useState('');

  // Image & Live Preview State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Revoke object URL on cleanup to avoid memory leaks
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type (JPEG, PNG, WebP)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Please select a valid JPEG, PNG, or WebP image.');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Produce photo size must be less than 5MB.');
      return;
    }

    setErrorMessage('');
    setSelectedFile(file);
    try {
      const createUrl = window.URL?.createObjectURL || URL.createObjectURL;
      const objectUrl = createUrl(file);
      setPreviewUrl(objectUrl);
    } catch (err) {
      console.warn('Could not create preview URL:', err);
    }
  };

  const handleRemoveImage = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price || !quantity) {
      setErrorMessage('Please fill in all required produce fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('category', category);
      formData.append('unit', unit);
      formData.append('quantity', String(Number(quantity)));
      formData.append('minOrderQuantity', String(Number(minOrderQuantity) || 1));
      formData.append('price', String(Number(price)));
      if (harvestDate) formData.append('harvestDate', harvestDate);
      if (description) formData.append('description', description.trim());
      formData.append('ownerEmail', user?.email || 'farmer@agrily.com');
      formData.append(
        'ownerName',
        user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Farmer'
      );

      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      const headers = {
        'Content-Type': 'multipart/form-data'
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      await axios.post('http://localhost:5000/api/product', formData, { headers });

      setSuccessMessage('Produce listed successfully! Redirecting to your inventory...');
      setTimeout(() => {
        navigate('/home');
      }, 1500);
    } catch (err) {
      setIsSubmitting(false);
      const msg =
        err.response?.data?.errors?.[0] ||
        err.response?.data?.message ||
        'Failed to list produce. Please check your inputs.';
      setErrorMessage(msg);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8faf9' }}>
      <TopBar />

      <main style={{ flex: '1 0 auto', padding: '2.5rem 1rem' }}>
        <Container>
          <Row className="justify-content-center">
            <Col xs={12} md={10} lg={8} xl={7}>
              <div
                className="agrily-card"
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '20px',
                  boxShadow: 'var(--shadow-xl)',
                  padding: '2.5rem 2rem',
                  border: '1px solid rgba(229, 231, 235, 0.8)'
                }}
              >
                {/* Header */}
                <div className="mb-4">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span
                      style={{
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        borderRadius: '8px',
                        padding: '6px',
                        display: 'inline-flex',
                        color: '#2d6a4f'
                      }}
                    >
                      <SproutIcon size={22} color="#2d6a4f" />
                    </span>
                    <h2
                      className="brand-font mb-0"
                      style={{ fontWeight: 800, color: '#1b4332', fontSize: '1.65rem' }}
                    >
                      List New Harvest
                    </h2>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 0 }}>
                    Provide produce details, harvest timing, and pricing for buyers on the Agrily marketplace.
                  </p>
                </div>

                {/* Alerts */}
                {errorMessage && (
                  <Alert variant="danger" className="d-flex align-items-center gap-2 mb-3">
                    <AlertCircleIcon size={20} color="#991b1b" />
                    <span>{errorMessage}</span>
                  </Alert>
                )}

                {successMessage && (
                  <Alert variant="success" className="d-flex align-items-center gap-2 mb-3">
                    <CheckCircleIcon size={20} color="#065f46" />
                    <span>{successMessage}</span>
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  {/* Photo Upload with Live Preview */}
                  <Form.Group className="mb-4">
                    <Form.Label style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>
                      Produce Photograph
                    </Form.Label>

                    {previewUrl ? (
                      <div
                        style={{
                          border: '2px solid #52b788',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          backgroundColor: '#f8faf9',
                          padding: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1.25rem'
                        }}
                      >
                        <img
                          src={previewUrl}
                          alt="Produce Preview"
                          data-testid="produce-preview-image"
                          style={{
                            width: '110px',
                            height: '110px',
                            objectFit: 'cover',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px rgba(15, 23, 42, 0.08)'
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: '#1b4332', fontSize: '0.95rem' }}>
                            {selectedFile?.name || 'Selected Photograph'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                            {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            style={{
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              color: '#991b1b',
                              borderRadius: '8px',
                              padding: '0.3rem 0.75rem',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              marginTop: '0.5rem',
                              cursor: 'pointer'
                            }}
                          >
                            Remove / Change Photo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          border: '2px dashed #cbd5e1',
                          borderRadius: '16px',
                          padding: '1.75rem 1rem',
                          textAlign: 'center',
                          backgroundColor: '#f8faf9',
                          transition: 'all 200ms ease'
                        }}
                      >
                        <SproutIcon size={32} color="#94a3b8" />
                        <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0.5rem 0' }}>
                          Upload clean produce photo (JPEG, PNG, WebP up to 5MB)
                        </p>
                        <Form.Control
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileChange}
                          data-testid="produce-image-input"
                          style={{ maxWidth: '280px', margin: '0 auto', fontSize: '0.85rem' }}
                        />
                      </div>
                    )}
                  </Form.Group>

                  {/* Produce Name */}
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: 600, color: '#334155', fontSize: '0.88rem' }}>
                      Produce Name *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Yellow Maize, Yam Tubers, Bell Peppers"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      style={{
                        padding: '0.7rem 0.9rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1'
                      }}
                    />
                  </Form.Group>

                  {/* Category & Unit */}
                  <Row className="g-3 mb-3">
                    <Col xs={12} sm={6}>
                      <Form.Group>
                        <Form.Label style={{ fontWeight: 600, color: '#334155', fontSize: '0.88rem' }}>
                          Category *
                        </Form.Label>
                        <Form.Select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          style={{
                            padding: '0.7rem 0.9rem',
                            borderRadius: '10px',
                            border: '1.5px solid #cbd5e1'
                          }}
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
                        <Form.Label style={{ fontWeight: 600, color: '#334155', fontSize: '0.88rem' }}>
                          Measurement Unit *
                        </Form.Label>
                        <Form.Select
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          style={{
                            padding: '0.7rem 0.9rem',
                            borderRadius: '10px',
                            border: '1.5px solid #cbd5e1'
                          }}
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

                  {/* Price & Quantity */}
                  <Row className="g-3 mb-3">
                    <Col xs={12} sm={6}>
                      <Form.Group>
                        <Form.Label style={{ fontWeight: 600, color: '#334155', fontSize: '0.88rem' }}>
                          Unit Price (₦) *
                        </Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          step="any"
                          placeholder="e.g. 15000"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          required
                          style={{
                            padding: '0.7rem 0.9rem',
                            borderRadius: '10px',
                            border: '1.5px solid #cbd5e1'
                          }}
                        />
                      </Form.Group>
                    </Col>

                    <Col xs={12} sm={6}>
                      <Form.Group>
                        <Form.Label style={{ fontWeight: 600, color: '#334155', fontSize: '0.88rem' }}>
                          Available Quantity *
                        </Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          placeholder="e.g. 50"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          required
                          style={{
                            padding: '0.7rem 0.9rem',
                            borderRadius: '10px',
                            border: '1.5px solid #cbd5e1'
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Min Order & Harvest Date */}
                  <Row className="g-3 mb-3">
                    <Col xs={12} sm={6}>
                      <Form.Group>
                        <Form.Label style={{ fontWeight: 600, color: '#334155', fontSize: '0.88rem' }}>
                          Minimum Order Quantity
                        </Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          placeholder="Default is 1"
                          value={minOrderQuantity}
                          onChange={(e) => setMinOrderQuantity(e.target.value)}
                          style={{
                            padding: '0.7rem 0.9rem',
                            borderRadius: '10px',
                            border: '1.5px solid #cbd5e1'
                          }}
                        />
                      </Form.Group>
                    </Col>

                    <Col xs={12} sm={6}>
                      <Form.Group>
                        <Form.Label style={{ fontWeight: 600, color: '#334155', fontSize: '0.88rem' }}>
                          Harvest Date
                        </Form.Label>
                        <Form.Control
                          type="date"
                          value={harvestDate}
                          onChange={(e) => setHarvestDate(e.target.value)}
                          style={{
                            padding: '0.7rem 0.9rem',
                            borderRadius: '10px',
                            border: '1.5px solid #cbd5e1'
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Description */}
                  <Form.Group className="mb-4">
                    <Form.Label style={{ fontWeight: 600, color: '#334155', fontSize: '0.88rem' }}>
                      Produce Description
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Describe freshness, storage conditions, packaging type, or farming practices..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      style={{
                        padding: '0.7rem 0.9rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1'
                      }}
                    />
                  </Form.Group>

                  {/* Submit / Cancel Buttons */}
                  <div className="d-flex justify-content-end gap-3 align-items-center">
                    <Link
                      to="/home"
                      style={{
                        textDecoration: 'none',
                        color: '#64748b',
                        fontWeight: 600,
                        fontSize: '0.92rem'
                      }}
                    >
                      Cancel
                    </Link>

                    <button
                      type="submit"
                      className="btn-agrily-primary"
                      disabled={isSubmitting}
                      style={{
                        padding: '0.65rem 1.6rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <span>{isSubmitting ? 'Publishing...' : 'List Produce'}</span>
                      <ArrowRightIcon size={16} />
                    </button>
                  </div>
                </Form>
              </div>
            </Col>
          </Row>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

export default AddProduct;
