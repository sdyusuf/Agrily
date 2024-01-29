import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { useToken } from '../auth/useToken';
import ProductCard from './ProductCard';
import EditProductModal from './EditProductModal';
import { SproutIcon, AlertCircleIcon } from './Icons';

function ProductList({ email }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [token] = useToken();

  const fetchProducts = useCallback(async () => {
    if (!email) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.get(
        `http://localhost:5000/api/products/${encodeURIComponent(email)}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );
      if (Array.isArray(response.data)) {
        setProducts(response.data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Error fetching farmer inventory:', err);
      setErrorMessage('Unable to load produce inventory. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [email, token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleProductUpdated = (updatedProduct) => {
    setProducts((prev) =>
      prev.map((p) => (p._id === updatedProduct._id ? updatedProduct : p))
    );
  };

  const handleArchive = async (product) => {
    try {
      const newSoldStatus = !product.isSold;
      const response = await axios.put(
        `http://localhost:5000/api/product/${product._id}`,
        { isSold: newSoldStatus },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (response.data?.product) {
        handleProductUpdated(response.data.product);
      }
    } catch (err) {
      console.error('Error archiving product:', err);
    }
  };

  const handleDelete = async (productId, isPermanent) => {
    try {
      const endpoint = `http://localhost:5000/api/product/${productId}${
        isPermanent ? '?permanent=true' : ''
      }`;
      const response = await axios.delete(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (isPermanent) {
        setProducts((prev) => prev.filter((p) => p._id !== productId));
      } else if (response.data?.product) {
        handleProductUpdated(response.data.product);
      }
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: '#2d6a4f' }} />
        <p className="mt-2 text-muted" style={{ fontSize: '0.9rem' }}>
          Loading your produce listings...
        </p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <Alert variant="danger" className="d-flex align-items-center gap-2 my-3">
        <AlertCircleIcon size={20} color="#991b1b" />
        <span>{errorMessage}</span>
      </Alert>
    );
  }

  if (products.length === 0) {
    return (
      <div
        className="text-center py-5 px-3"
        style={{
          backgroundColor: '#f8faf9',
          borderRadius: '16px',
          border: '1.5px dashed #cbd5e1',
          margin: '1.5rem 0'
        }}
      >
        <SproutIcon size={48} color="#52b788" />
        <h4 className="mt-3" style={{ color: '#1b4332', fontWeight: 700 }}>
          No Produce Listed Yet
        </h4>
        <p className="text-muted" style={{ maxWidth: '420px', margin: '0 auto 1.25rem' }}>
          Start selling by adding your fresh farm harvest to the marketplace today.
        </p>
        <a href="/add-product" className="btn-agrily-primary">
          List Your First Produce
        </a>
      </div>
    );
  }

  return (
    <>
      <Row className="g-4">
        {products.map((product) => (
          <Col key={product._id} xs={12} sm={6} md={6} lg={4}>
            <ProductCard
              product={product}
              onEdit={(p) => setEditingProduct(p)}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          </Col>
        ))}
      </Row>

      {/* Edit Product Modal */}
      <EditProductModal
        show={Boolean(editingProduct)}
        onHide={() => setEditingProduct(null)}
        product={editingProduct}
        onProductUpdated={handleProductUpdated}
      />
    </>
  );
}

export default ProductList;
