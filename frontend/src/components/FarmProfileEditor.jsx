/**
 * ============================================================================
 * AGRILY AGRICULTURAL COMMERCE & PROVENANCE PLATFORM
 * Farm Profile Editor Component
 * ============================================================================
 * 
 * @component FarmProfileEditor
 * @module frontend/src/components/FarmProfileEditor
 * @description
 * High-fidelity interactive profile editor allowing registered agricultural producers,
 * smallholder farming families, and cooperative representatives to configure their
 * public marketplace credentials, farm location coordinates, crop specializations,
 * hectares under cultivation, and cooperative affiliations.
 * 
 * Agricultural Domain & UI/UX Principles:
 * 1. Visual Verification & Trust Clarity:
 *    Producers immediately see their current platform verification status ('unverified',
 *    'pending', 'verified', 'flagged') alongside an algorithmic Trust Score gauge.
 * 2. Precision Geolocation:
 *    Captures exact or centroid farm coordinates to facilitate cold-chain logistics routing,
 *    produce pickup waypoint scheduling, and aggregation hub consolidation.
 * 3. Crop Specialty Tags:
 *    Interactive produce category chips allow rapid tag additions and removals without
 *    cumbersome multi-page modal workflows.
 * 4. Design System Compliance:
 *    Adheres strictly to Agrily Design System tokens (Emerald #1b4332 / #2d6a4f, Earth Ochre
 *    #bc6c25, smooth cubic-bezier transitions, and tactile hover lifts).
 * 
 * @license Private / Proprietary Agrily Inc.
 */

import React, { useState, useEffect } from 'react';
import './FarmProfileEditor.css';

/**
 * Standard agricultural states across Nigeria's primary agro-ecological farming zones.
 */
const NIGERIAN_AGRO_STATES = [
  'Kaduna',
  'Kano',
  'Plateau',
  'Benue',
  'Niger',
  'Oyo',
  'Ogun',
  'Taraba',
  'Cross River',
  'Bauchi',
  'Kebbi',
  'Jigawa',
  'Katsina',
  'Nasarawa',
  'Kogi',
  'Ondo',
  'Edo',
  'Enugu',
  'Delta',
  'Lagos'
];

/**
 * Popular staple produce categories and crop specializations for rapid chip selection.
 */
const DEFAULT_CROP_SUGGESTIONS = [
  'White Maize',
  'Yellow Maize',
  'Soybeans',
  'Sorghum',
  'Millet',
  'Cowpeas',
  'Yam Tubers',
  'Cassava Roots',
  'Irish Potatoes',
  'Sweet Potatoes',
  'Fresh Tomatoes',
  'Bell Peppers',
  'Habanero Peppers',
  'Onions',
  'Ginger',
  'Garlic',
  'Sesame Seeds',
  'Groundnuts',
  'Cocoa Beans',
  'Oil Palm'
];

/**
 * Common agricultural standards and certifications.
 */
const DEFAULT_CERTIFICATION_OPTIONS = [
  'National Agricultural Seeds Council (NASC)',
  'Global GAP Compliance',
  'Certified Organic Standard',
  'Fair Trade Agricultural Partner',
  'Good Agronomic Practices (GAP) Vouched',
  'Standard Organization of Nigeria (SON)'
];

/**
 * FarmProfileEditor Component
 * 
 * @param {Object} props - Component properties
 * @param {Object} [props.initialProfile] - Existing farmer profile record from database
 * @param {string} [props.userEmail] - Email of the authenticated account
 * @param {Function} [props.onSaveSuccess] - Callback executed upon successful profile synchronization
 * @param {Function} [props.onCancel] - Callback invoked when producer dismisses editor
 * @returns {React.ReactElement} Interactive profile editor interface
 */
export default function FarmProfileEditor({
  initialProfile = {},
  userEmail = '',
  onSaveSuccess,
  onCancel
}) {
  // --------------------------------------------------------------------------
  // FORM STATE DECLARATIONS
  // --------------------------------------------------------------------------
  const [bio, setBio] = useState(initialProfile.bio || '');
  const [cooperativeName, setCooperativeName] = useState(initialProfile.cooperativeName || '');
  const [contactPhone, setContactPhone] = useState(initialProfile.contactPhone || '');
  const [farmSizeHectares, setFarmSizeHectares] = useState(initialProfile.farmSizeHectares || 0);
  const [yearEstablished, setYearEstablished] = useState(initialProfile.yearEstablished || 2020);

  // Embedded Location Sub-document State
  const [stateName, setStateName] = useState(initialProfile.farmLocation?.state || 'Kaduna');
  const [lga, setLga] = useState(initialProfile.farmLocation?.lga || '');
  const [address, setAddress] = useState(initialProfile.farmLocation?.address || '');
  const [latitude, setLatitude] = useState(initialProfile.farmLocation?.coordinates?.lat || 0.0);
  const [longitude, setLongitude] = useState(initialProfile.farmLocation?.coordinates?.lng || 0.0);

  // Arrays: Crop Specialties and Certifications
  const [cropSpecialties, setCropSpecialties] = useState(
    Array.isArray(initialProfile.cropSpecialties) ? initialProfile.cropSpecialties : []
  );
  const [newCropInput, setNewCropInput] = useState('');

  const [certifications, setCertifications] = useState(
    Array.isArray(initialProfile.certifications) ? initialProfile.certifications : []
  );

  // UI Status & Feedback States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Producer Trust and Verification Indicators
  const verificationStatus = initialProfile.verificationStatus || 'unverified';
  const trustScore = initialProfile.trustScore ?? 100;

  // Sync state if initialProfile prop changes dynamically
  useEffect(() => {
    if (initialProfile && Object.keys(initialProfile).length > 0) {
      if (initialProfile.bio !== undefined) setBio(initialProfile.bio);
      if (initialProfile.cooperativeName !== undefined) setCooperativeName(initialProfile.cooperativeName);
      if (initialProfile.contactPhone !== undefined) setContactPhone(initialProfile.contactPhone);
      if (initialProfile.farmSizeHectares !== undefined) setFarmSizeHectares(initialProfile.farmSizeHectares);
      if (initialProfile.yearEstablished !== undefined) setYearEstablished(initialProfile.yearEstablished);
      if (initialProfile.farmLocation?.state) setStateName(initialProfile.farmLocation.state);
      if (initialProfile.farmLocation?.lga) setLga(initialProfile.farmLocation.lga);
      if (initialProfile.farmLocation?.address) setAddress(initialProfile.farmLocation.address);
      if (initialProfile.farmLocation?.coordinates?.lat !== undefined) {
        setLatitude(initialProfile.farmLocation.coordinates.lat);
      }
      if (initialProfile.farmLocation?.coordinates?.lng !== undefined) {
        setLongitude(initialProfile.farmLocation.coordinates.lng);
      }
      if (Array.isArray(initialProfile.cropSpecialties)) {
        setCropSpecialties(initialProfile.cropSpecialties);
      }
      if (Array.isArray(initialProfile.certifications)) {
        setCertifications(initialProfile.certifications);
      }
    }
  }, [initialProfile]);

  // --------------------------------------------------------------------------
  // CROP SPECIALTY TAG HANDLERS
  // --------------------------------------------------------------------------
  /**
   * Adds a new crop specialty tag if unique and non-empty.
   * 
   * @param {string} crop - Crop name to append
   */
  const handleAddCrop = (crop) => {
    const trimmed = (crop || '').trim();
    if (!trimmed) return;
    if (!cropSpecialties.includes(trimmed)) {
      setCropSpecialties([...cropSpecialties, trimmed]);
    }
    setNewCropInput('');
  };

  /**
   * Removes a crop specialty tag.
   * 
   * @param {string} cropToRemove - Crop name to discard
   */
  const handleRemoveCrop = (cropToRemove) => {
    setCropSpecialties(cropSpecialties.filter((c) => c !== cropToRemove));
  };

  /**
   * Toggles an agricultural certification badge.
   * 
   * @param {string} cert - Certification title to toggle
   */
  const handleToggleCert = (cert) => {
    if (certifications.includes(cert)) {
      setCertifications(certifications.filter((c) => c !== cert));
    } else {
      setCertifications([...certifications, cert]);
    }
  };

  // --------------------------------------------------------------------------
  // SUBMISSION & PERSISTENCE HANDLER
  // --------------------------------------------------------------------------
  /**
   * Dispatches profile updates to the backend PUT /api/users/profile endpoint.
   * 
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Client-side sanity validations
    if (bio.length > 1000) {
      setErrorMessage('Farm biography exceeds the 1000-character maximum limit.');
      setIsSubmitting(false);
      return;
    }

    const numLat = parseFloat(latitude);
    const numLng = parseFloat(longitude);

    if (isNaN(numLat) || numLat < -90 || numLat > 90) {
      setErrorMessage('Latitude must be a valid numeric degree between -90 and +90.');
      setIsSubmitting(false);
      return;
    }

    if (isNaN(numLng) || numLng < -180 || numLng > 180) {
      setErrorMessage('Longitude must be a valid numeric degree between -180 and +180.');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      email: userEmail,
      bio: bio.trim(),
      cooperativeName: cooperativeName.trim(),
      contactPhone: contactPhone.trim(),
      farmSizeHectares: parseFloat(farmSizeHectares) || 0,
      yearEstablished: parseInt(yearEstablished, 10) || 2020,
      cropSpecialties,
      certifications,
      farmLocation: {
        state: stateName,
        lga: lga.trim(),
        address: address.trim(),
        coordinates: {
          lat: numLat,
          lng: numLng
        }
      }
    };

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const contentType = response.headers?.get ? (response.headers.get('content-type') || '') : 'application/json';
      if (contentType && !contentType.includes('application/json')) {
        throw new Error('Server returned unexpected non-JSON response.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || (data.errors && data.errors.join(', ')) || 'Failed to update farm profile');
      }

      setSuccessMessage('Farmer profile synchronized and updated successfully!');
      if (typeof onSaveSuccess === 'function') {
        onSaveSuccess(data.profile);
      }
    } catch (err) {
      console.error('FarmProfileEditor submit error:', err);
      setErrorMessage(err.message || 'Network error encountered while saving profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // RENDER COMPONENT VIEW
  // --------------------------------------------------------------------------
  return (
    <div className="farm-profile-editor-container" data-testid="farm-profile-editor">
      {/* HEADER SECTION WITH VERIFICATION PILL & TRUST METER */}
      <div className="farm-profile-header">
        <div className="farm-profile-title-group">
          <h2 className="farm-profile-heading">Farmer & Producer Profile</h2>
          <p className="farm-profile-subheading">
            Manage your agricultural credentials, cultivation zone, and verified marketplace reputation.
          </p>
        </div>

        <div className="farm-profile-trust-badge-group">
          <div className={`status-pill status-${verificationStatus}`} data-testid="verification-status-pill">
            <span className="status-pill-dot" />
            <span className="status-pill-text">
              {verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1)} Producer
            </span>
          </div>

          <div className="trust-score-gauge" title="Calculated from delivery reliability and buyer satisfaction">
            <span className="trust-score-label">Trust Score:</span>
            <span className="trust-score-value" data-testid="trust-score-val">{trustScore}%</span>
          </div>
        </div>
      </div>

      {/* ALERT BANNERS */}
      {errorMessage && (
        <div className="farm-profile-alert alert-error" role="alert" data-testid="editor-error-alert">
          <svg className="alert-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="farm-profile-alert alert-success" role="status" data-testid="editor-success-alert">
          <svg className="alert-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* FORM BODY */}
      <form onSubmit={handleSubmit} className="farm-profile-form" noValidate>
        {/* SECTION 1: PRODUCER BIOGRAPHY & COOPERATIVE */}
        <div className="form-section-card">
          <h3 className="section-title">1. Agricultural Biography & Affiliation</h3>

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="farmBio" className="form-label">
                Farm Story & Agricultural Mission
              </label>
              <span className={`char-counter ${bio.length > 900 ? 'counter-warning' : ''}`}>
                {bio.length} / 1000
              </span>
            </div>
            <textarea
              id="farmBio"
              className="form-textarea"
              rows="4"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe your farming methods, heritage varieties cultivated, organic compost practices, and produce freshness guarantees..."
              data-testid="input-bio"
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="coopName" className="form-label">
                Agricultural Cooperative / Grower Union
              </label>
              <input
                id="coopName"
                type="text"
                className="form-input"
                value={cooperativeName}
                onChange={(e) => setCooperativeName(e.target.value)}
                placeholder="e.g., Northern Maize Growers Cooperative"
                data-testid="input-coop"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactPhone" className="form-label">
                Commercial Dispatch Phone
              </label>
              <input
                id="contactPhone"
                type="tel"
                className="form-input"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="e.g., +234 803 000 0000"
                data-testid="input-phone"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="farmSize" className="form-label">
                Active Cultivation Area (Hectares)
              </label>
              <input
                id="farmSize"
                type="number"
                min="0"
                step="0.1"
                className="form-input"
                value={farmSizeHectares}
                onChange={(e) => setFarmSizeHectares(e.target.value)}
                data-testid="input-farm-size"
              />
            </div>

            <div className="form-group">
              <label htmlFor="yearEst" className="form-label">
                Year Established
              </label>
              <input
                id="yearEst"
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                className="form-input"
                value={yearEstablished}
                onChange={(e) => setYearEstablished(e.target.value)}
                data-testid="input-year-est"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: REGIONAL GEOLOCATION & HUB ROUTING */}
        <div className="form-section-card">
          <h3 className="section-title">2. Farm Geolocation & Logistics Waypoint</h3>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="farmState" className="form-label">
                Agro-Ecological State
              </label>
              <select
                id="farmState"
                className="form-select"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                data-testid="select-state"
              >
                {NIGERIAN_AGRO_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st} State
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="farmLga" className="form-label">
                Local Government Area (LGA) / County
              </label>
              <input
                id="farmLga"
                type="text"
                className="form-input"
                value={lga}
                onChange={(e) => setLga(e.target.value)}
                placeholder="e.g., Zaria, Bichi, Bokkos, Saki"
                data-testid="input-lga"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="farmAddress" className="form-label">
              Farm Gate Access Address / Landmark
            </label>
            <input
              id="farmAddress"
              type="text"
              className="form-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., KM 12 Old Kano Road, near Samaru Research Farm Gate"
              data-testid="input-address"
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="farmLat" className="form-label">
                Centroid Latitude (°N/°S)
              </label>
              <input
                id="farmLat"
                type="number"
                step="any"
                min="-90"
                max="90"
                className="form-input"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                data-testid="input-latitude"
              />
            </div>

            <div className="form-group">
              <label htmlFor="farmLng" className="form-label">
                Centroid Longitude (°E/°W)
              </label>
              <input
                id="farmLng"
                type="number"
                step="any"
                min="-180"
                max="180"
                className="form-input"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                data-testid="input-longitude"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: CROP SPECIALTY TAGS & CERTIFICATIONS */}
        <div className="form-section-card">
          <h3 className="section-title">3. Produce Specialties & Quality Standards</h3>

          <div className="form-group">
            <label className="form-label">Active Crop Specialties</label>
            <div className="tag-chips-wrapper" data-testid="crop-chips-container">
              {cropSpecialties.length === 0 ? (
                <span className="no-tags-hint">No specialty crops selected yet. Click quick tags below or enter custom crops.</span>
              ) : (
                cropSpecialties.map((crop) => (
                  <span key={crop} className="crop-chip" data-testid={`chip-${crop}`}>
                    <span className="crop-chip-label">{crop}</span>
                    <button
                      type="button"
                      className="crop-chip-remove"
                      onClick={() => handleRemoveCrop(crop)}
                      title={`Remove ${crop}`}
                      aria-label={`Remove ${crop}`}
                    >
                      &times;
                    </button>
                  </span>
                ))
              )}
            </div>

            <div className="tag-input-row">
              <input
                type="text"
                className="form-input tag-text-input"
                value={newCropInput}
                onChange={(e) => setNewCropInput(e.target.value)}
                placeholder="Add custom produce crop..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCrop(newCropInput);
                  }
                }}
                data-testid="input-new-crop"
              />
              <button
                type="button"
                className="btn-add-tag"
                onClick={() => handleAddCrop(newCropInput)}
                data-testid="btn-add-crop"
              >
                + Add Crop
              </button>
            </div>

            <div className="quick-suggestions-block">
              <span className="suggestions-label">Quick Suggestions:</span>
              <div className="suggestion-pills-row">
                {DEFAULT_CROP_SUGGESTIONS.slice(0, 10).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className={`pill-suggestion ${cropSpecialties.includes(suggestion) ? 'pill-active' : ''}`}
                    onClick={() => handleAddCrop(suggestion)}
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group cert-group">
            <label className="form-label">Agronomic Certifications & Standards</label>
            <div className="cert-checkbox-grid">
              {DEFAULT_CERTIFICATION_OPTIONS.map((cert) => {
                const isChecked = certifications.includes(cert);
                return (
                  <label key={cert} className={`cert-item-card ${isChecked ? 'cert-active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleCert(cert)}
                      className="cert-checkbox"
                    />
                    <span className="cert-title">{cert}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="farm-profile-actions">
          {typeof onCancel === 'function' && (
            <button
              type="button"
              className="btn-editor-cancel"
              onClick={onCancel}
              disabled={isSubmitting}
              data-testid="btn-cancel"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            className="btn-editor-save"
            disabled={isSubmitting}
            data-testid="btn-save-profile"
          >
            {isSubmitting ? (
              <span className="btn-loading-flex">
                <span className="spinner-dot" />
                Synchronizing Profile...
              </span>
            ) : (
              'Save & Update Farm Profile'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
