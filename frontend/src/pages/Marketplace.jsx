import React, { useState, useEffect, useCallback } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import axios from 'axios';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar';
import PriceRangeSlider from '../components/PriceRangeSlider';
import ProductCard from '../components/ProductCard';
import ProductDetailModal from '../components/ProductDetailModal';
import { CategoryChip } from '../components/CategoryBadge';
import { SproutIcon, AlertCircleIcon } from '../components/Icons';
import './Marketplace.css';

const CATEGORY_KEYS = [
  'all',
  'grains',
  'tubers',
  'fruits',
  'vegetables',
  'livestock',
  'poultry',
  'dairy',
  'other'
];

function Marketplace() {
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Active Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceBounds, setPriceBounds] = useState({ minPrice: 0, maxPrice: 200000 });
  const [sortBy, setSortBy] = useState('newest');

  // Selected produce for inspection modal
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchCatalog = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const params = {
        page: currentPage,
        limit: 12,
        sortBy
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedCategory && selectedCategory !== 'all') params.category = selectedCategory;
      if (priceBounds.minPrice > 0) params.minPrice = priceBounds.minPrice;
      if (priceBounds.maxPrice < 200000) params.maxPrice = priceBounds.maxPrice;

      const response = await axios.get('http://localhost:5000/api/marketplace', { params });
      if (response.data?.success) {
        setProducts(response.data.products || []);
        setTotalProducts(response.data.totalProducts || 0);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Error loading marketplace catalog:', err);
      setErrorMessage('Could not load marketplace listings. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, selectedCategory, priceBounds, sortBy]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const handleCategorySelect = (catKey) => {
    setSelectedCategory(catKey);
    setCurrentPage(1);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePriceChange = (bounds) => {
    setPriceBounds(bounds);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setPriceBounds({ minPrice: 0, maxPrice: 200000 });
    setSortBy('newest');
    setCurrentPage(1);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8faf9' }}>
      <NavBar />

      {/* Hero Header & Search Bar */}
      <section className="agrily-marketplace-hero text-center">
        <Container style={{ position: 'relative', zIndex: 1, maxWidth: '800px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(254, 250, 224, 0.2)',
              border: '1px solid rgba(254, 250, 224, 0.35)',
              color: '#fefae0',
              padding: '0.35rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1rem'
            }}
          >
            <SproutIcon size={16} color="#dda15e" />
            <span>Direct Farm-to-Buyer Marketplace</span>
          </div>

          <h1
            className="brand-font mb-2"
            style={{ fontWeight: 800, fontSize: '2.5rem', letterSpacing: '-0.03em' }}
          >
            Explore Fresh Farm Harvests
          </h1>
          <p style={{ color: '#d8f3dc', fontSize: '1.05rem', marginBottom: '1.75rem' }}>
            Discover organic grains, tubers, seasonal fruits, and vegetables sourced directly from verified producers.
          </p>

          <SearchBar
            placeholder="Search farm produce by name (e.g. Yellow Maize, Yam, Tomatoes)..."
            initialValue={searchTerm}
            onSearch={handleSearch}
          />
        </Container>
      </section>

      {/* Category Horizontal Scrolling Chips Bar */}
      <section style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
        <Container>
          <div className="agrily-marketplace-chips-bar" role="toolbar" aria-label="Filter produce by category">
            {CATEGORY_KEYS.map((key) => (
              <CategoryChip
                key={key}
                category={key}
                isActive={selectedCategory === key}
                onClick={handleCategorySelect}
                size="md"
              />
            ))}
          </div>
        </Container>
      </section>

      {/* Main Catalog View */}
      <main style={{ flex: '1 0 auto', padding: '2.5rem 1rem' }}>
        <Container>
          <Row className="g-4">
            {/* Filter Sidebar */}
            <Col xs={12} lg={3}>
              <div className="agrily-filter-sidebar">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1b4332', marginBottom: 0 }}>
                    Filters & Refine
                  </h3>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#bc6c25',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Reset All
                  </button>
                </div>

                <PriceRangeSlider
                  minBound={0}
                  maxBound={200000}
                  step={2000}
                  initialMin={priceBounds.minPrice}
                  initialMax={priceBounds.maxPrice}
                  onChange={handlePriceChange}
                  className="mb-3"
                />

                <div>
                  <label
                    htmlFor="sort-select"
                    style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem', display: 'block' }}
                  >
                    Sort Listings By
                  </label>
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={handleSortChange}
                    className="agrily-sort-select w-100"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="quantity_desc">Highest Stock Quantity</option>
                    <option value="oldest">Earliest Listed</option>
                  </select>
                </div>
              </div>
            </Col>

            {/* Produce Grid */}
            <Col xs={12} lg={9}>
              {/* Header metrics */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span style={{ fontSize: '0.92rem', color: '#64748b', fontWeight: 500 }}>
                  Showing <strong style={{ color: '#0f172a' }}>{products.length}</strong> of{' '}
                  <strong style={{ color: '#0f172a' }}>{totalProducts}</strong> produce listings
                </span>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <Alert variant="danger" className="d-flex align-items-center gap-2 mb-4">
                  <AlertCircleIcon size={20} color="#991b1b" />
                  <span>{errorMessage}</span>
                </Alert>
              )}

              {/* Loading Spinner */}
              {isLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" style={{ color: '#2d6a4f' }} />
                  <p className="mt-2 text-muted" style={{ fontSize: '0.92rem' }}>
                    Fetching fresh marketplace listings...
                  </p>
                </div>
              ) : products.length === 0 ? (
                /* Empty State */
                <div
                  className="text-center py-5 px-3"
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1.5px dashed #cbd5e1',
                    padding: '3rem 1rem'
                  }}
                >
                  <SproutIcon size={48} color="#94a3b8" />
                  <h4 className="mt-3" style={{ color: '#1b4332', fontWeight: 700 }}>
                    No Produce Found
                  </h4>
                  <p className="text-muted" style={{ maxWidth: '400px', margin: '0 auto 1.25rem' }}>
                    We could not find any listings matching your search or filters. Try adjusting your keywords or price bounds.
                  </p>
                  <button type="button" onClick={handleResetFilters} className="btn-agrily-outline">
                    Reset Filter Criteria
                  </button>
                </div>
              ) : (
                /* Cards Grid */
                <>
                  <Row className="g-4 mb-4">
                    {products.map((prod) => (
                      <Col key={prod._id} xs={12} sm={6} xl={4}>
                        <div
                          style={{ cursor: 'pointer', height: '100%' }}
                          onClick={() => setSelectedProduct(prod)}
                          tabIndex={0}
                          role="button"
                          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedProduct(prod)}
                          aria-label={`View details for ${prod.name}`}
                        >
                          <ProductCard product={prod} />
                        </div>
                      </Col>
                    ))}
                  </Row>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center align-items-center gap-3 pt-3">
                      <button
                        type="button"
                        className="agrily-pagination-btn"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                      >
                        &larr; Previous Page
                      </button>

                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>
                        {currentPage} / {totalPages}
                      </span>

                      <button
                        type="button"
                        className="agrily-pagination-btn"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                      >
                        Next Page &rarr;
                      </button>
                    </div>
                  )}
                </>
              )}
            </Col>
          </Row>
        </Container>
      </main>

      {/* Product Detail Modal */}
      <ProductDetailModal
        show={Boolean(selectedProduct)}
        onHide={() => setSelectedProduct(null)}
        product={selectedProduct}
      />

      <Footer />
    </div>
  );
}

export default Marketplace;
