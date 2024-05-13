import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../auth/useUser';
import './DriverRegistration.css';

const AVAILABLE_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Eastern',
  'Central',
  'Western',
  'Volta',
  'Bono',
  'Northern'
];

const VEHICLE_OPTIONS = [
  {
    id: 'pickup_truck',
    name: 'Pickup Truck',
    defaultCapacity: 1200,
    maxVolume: 4,
    description: 'Light goods up to 1.5 Tons'
  },
  {
    id: 'cargo_van',
    name: 'Cargo Van',
    defaultCapacity: 2500,
    maxVolume: 12,
    description: 'Medium freight up to 2.5 Tons'
  },
  {
    id: 'box_truck',
    name: 'Box Truck',
    defaultCapacity: 10000,
    maxVolume: 35,
    description: 'Bulk dry goods up to 10 Tons'
  },
  {
    id: 'refrigerated_van',
    name: 'Reefer Van',
    defaultCapacity: 5000,
    maxVolume: 18,
    description: 'Temperature-controlled cold chain'
  },
  {
    id: 'flatbed',
    name: 'Flatbed Hauler',
    defaultCapacity: 25000,
    maxVolume: 60,
    description: 'Heavy timber & bulk commodity bags'
  }
];

export const TruckSvg = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M10 17h4V5H2v12h3" />
    <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" />
    <circle cx="7.5" cy="17.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);

export const ShieldCheckSvg = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const MapPinSvg = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export default function DriverRegistration() {
  const navigate = useNavigate();
  const user = useUser();

  const [formData, setFormData] = useState({
    userEmail: user?.email || '',
    fullName: user?.fullName || '',
    phone: '',
    licenseNumber: '',
    licenseClass: 'medium_truck',
    licenseExpiry: '',
    nationalIdNumber: '',
    vehicleType: 'box_truck',
    registrationNumber: '',
    make: '',
    model: '',
    year: 2020,
    payloadCapacityKg: 10000,
    maxVolumeCubicMeters: 35,
    hasRefrigeration: false,
    operatingRegions: ['Greater Accra', 'Ashanti'],
    city: 'Accra',
    state: 'Greater Accra'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleVehicleTypeSelect = (opt) => {
    setFormData((prev) => ({
      ...prev,
      vehicleType: opt.id,
      payloadCapacityKg: opt.defaultCapacity,
      maxVolumeCubicMeters: opt.maxVolume,
      hasRefrigeration: opt.id === 'refrigerated_van' ? true : prev.hasRefrigeration
    }));
  };

  const handleRegionToggle = (region) => {
    setFormData((prev) => {
      const exists = prev.operatingRegions.includes(region);
      if (exists) {
        if (prev.operatingRegions.length === 1) return prev; // Keep at least one
        return {
          ...prev,
          operatingRegions: prev.operatingRegions.filter((r) => r !== region)
        };
      } else {
        return {
          ...prev,
          operatingRegions: [...prev.operatingRegions, region]
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.userEmail || !formData.fullName || !formData.phone || !formData.licenseNumber) {
      setErrorMessage('Please complete all required personal and licensing fields.');
      return;
    }

    if (!formData.registrationNumber || !formData.make || !formData.model) {
      setErrorMessage('Please complete all vehicle registration details.');
      return;
    }

    if (formData.operatingRegions.length === 0) {
      setErrorMessage('Please select at least one regional operating corridor.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      userEmail: formData.userEmail.trim(),
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
      licenseNumber: formData.licenseNumber.trim(),
      licenseClass: formData.licenseClass,
      licenseExpiry: formData.licenseExpiry || '2028-12-31',
      nationalIdNumber: formData.nationalIdNumber.trim() || 'GHA-000000000-0',
      vehicle: {
        vehicleType: formData.vehicleType,
        registrationNumber: formData.registrationNumber.trim().toUpperCase(),
        make: formData.make.trim(),
        model: formData.model.trim(),
        year: Number(formData.year),
        payloadCapacityKg: Number(formData.payloadCapacityKg),
        maxVolumeCubicMeters: Number(formData.maxVolumeCubicMeters),
        hasRefrigeration: Boolean(formData.hasRefrigeration)
      },
      operatingRegions: formData.operatingRegions,
      baseLocation: {
        city: formData.city.trim(),
        state: formData.state.trim()
      }
    };

    try {
      const response = await fetch('/api/drivers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage('Driver onboarding submitted! Your commercial credentials are now queued for fleet verification.');
        setTimeout(() => {
          navigate('/driver/dashboard');
        }, 1500);
      } else {
        setErrorMessage(data.message || (data.errors && data.errors[0]) || 'Failed to submit driver registration. Please try again.');
      }
    } catch (err) {
      setErrorMessage('Network error encountered while communicating with the logistics gateway.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="driver-registration-container" data-testid="driver-registration-page">
      <div className="driver-registration-wrapper">
        <header className="driver-registration-header">
          <span className="driver-badge-pill" data-testid="driver-badge-pill">
            <ShieldCheckSvg size={16} /> Agrily Freight Network
          </span>
          <h1 className="driver-registration-title">Driver & Fleet Onboarding</h1>
          <p className="driver-registration-subtitle">
            Register your transport vehicle to haul verified agricultural cargo directly from rural farmgates to urban wholesale markets.
          </p>
        </header>

        {errorMessage && (
          <div className="driver-feedback-alert error" role="alert" data-testid="driver-error-banner">
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="driver-feedback-alert success" role="alert" data-testid="driver-success-banner">
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} data-testid="driver-registration-form">
          {/* Section 1: Personal & Licensing */}
          <div className="driver-card">
            <div className="driver-card-header">
              <div className="driver-card-icon">
                <ShieldCheckSvg size={20} />
              </div>
              <h2 className="driver-card-title">Commercial Driver Credentials</h2>
            </div>

            <div className="driver-form-grid">
              <div>
                <label className="driver-form-label" htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  name="fullName"
                  className="driver-form-input"
                  placeholder="e.g. Kwame Mensah Boateng"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="driver-form-label" htmlFor="userEmail">Account Email</label>
                <input
                  id="userEmail"
                  name="userEmail"
                  type="email"
                  className="driver-form-input"
                  placeholder="driver@agrily.com"
                  value={formData.userEmail}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="driver-form-label" htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  className="driver-form-input"
                  placeholder="+233 24 123 4567"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="driver-form-label" htmlFor="nationalIdNumber">National Identity / Ghana Card</label>
                <input
                  id="nationalIdNumber"
                  name="nationalIdNumber"
                  className="driver-form-input"
                  placeholder="GHA-123456789-0"
                  value={formData.nationalIdNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="driver-form-label" htmlFor="licenseNumber">Commercial License Number</label>
                <input
                  id="licenseNumber"
                  name="licenseNumber"
                  className="driver-form-input"
                  placeholder="GH-COMM-88129"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="driver-form-label" htmlFor="licenseClass">License Classification</label>
                <select
                  id="licenseClass"
                  name="licenseClass"
                  className="driver-form-select"
                  value={formData.licenseClass}
                  onChange={handleInputChange}
                >
                  <option value="light_goods">Class B — Light Goods (Pickups & Vans)</option>
                  <option value="medium_truck">Class C — Medium Rigid Truck (Up to 10T)</option>
                  <option value="heavy_duty">Class D — Heavy Articulated Cargo (10T+)</option>
                  <option value="refrigerated_cargo">Class R — Certified Cold-Chain Hauler</option>
                </select>
              </div>

              <div>
                <label className="driver-form-label" htmlFor="licenseExpiry">License Expiration Date</label>
                <input
                  id="licenseExpiry"
                  name="licenseExpiry"
                  type="date"
                  className="driver-form-input"
                  value={formData.licenseExpiry}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Vehicle Specifications */}
          <div className="driver-card">
            <div className="driver-card-header">
              <div className="driver-card-icon">
                <TruckSvg size={20} />
              </div>
              <h2 className="driver-card-title">Vehicle Cargo & Freight Capacity</h2>
            </div>

            <label className="driver-form-label">Select Primary Vehicle Configuration</label>
            <div className="vehicle-selector-grid" data-testid="vehicle-selector-grid">
              {VEHICLE_OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  className={`vehicle-type-card ${formData.vehicleType === opt.id ? 'selected' : ''}`}
                  onClick={() => handleVehicleTypeSelect(opt)}
                  data-testid={`vehicle-option-${opt.id}`}
                >
                  <TruckSvg size={28} className="vehicle-type-icon" />
                  <span className="vehicle-type-name">{opt.name}</span>
                  <span className="vehicle-type-capacity">{(opt.defaultCapacity / 1000).toFixed(1)}T Payload</span>
                </div>
              ))}
            </div>

            <div className="driver-form-grid" style={{ marginTop: '1.5rem' }}>
              <div>
                <label className="driver-form-label" htmlFor="registrationNumber">Vehicle Plate / Registration</label>
                <input
                  id="registrationNumber"
                  name="registrationNumber"
                  className="driver-form-input"
                  placeholder="GT-4912-22"
                  value={formData.registrationNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="driver-form-label" htmlFor="make">Vehicle Make</label>
                <input
                  id="make"
                  name="make"
                  className="driver-form-input"
                  placeholder="e.g. Isuzu, Mercedes, Toyota"
                  value={formData.make}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="driver-form-label" htmlFor="model">Vehicle Model</label>
                <input
                  id="model"
                  name="model"
                  className="driver-form-input"
                  placeholder="e.g. FTR 850 / Dyna 300"
                  value={formData.model}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="driver-form-label" htmlFor="year">Manufacture Year</label>
                <input
                  id="year"
                  name="year"
                  type="number"
                  min="1990"
                  max="2030"
                  className="driver-form-input"
                  value={formData.year}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="driver-form-label" htmlFor="payloadCapacityKg">Payload Capacity (Kilograms)</label>
                <input
                  id="payloadCapacityKg"
                  name="payloadCapacityKg"
                  type="number"
                  min="250"
                  max="60000"
                  step="50"
                  className="driver-form-input"
                  value={formData.payloadCapacityKg}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="driver-form-label" htmlFor="maxVolumeCubicMeters">Cargo Bed Volume (m³)</label>
                <input
                  id="maxVolumeCubicMeters"
                  name="maxVolumeCubicMeters"
                  type="number"
                  min="1"
                  max="150"
                  className="driver-form-input"
                  value={formData.maxVolumeCubicMeters}
                  onChange={handleInputChange}
                />
              </div>

              <div className="driver-form-group-full">
                <label className="reefer-toggle-wrapper">
                  <input
                    type="checkbox"
                    name="hasRefrigeration"
                    checked={formData.hasRefrigeration}
                    onChange={handleInputChange}
                    className="reefer-checkbox"
                    data-testid="reefer-checkbox"
                  />
                  <span className="reefer-toggle-text">
                    Equipped with Temperature-Controlled Refrigeration Unit (Cold-Chain Certified)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Operating Logistics Regions */}
          <div className="driver-card">
            <div className="driver-card-header">
              <div className="driver-card-icon">
                <MapPinSvg size={20} />
              </div>
              <h2 className="driver-card-title">Regional Service Corridors</h2>
            </div>

            <label className="driver-form-label">Active Operating Regions (Select all that apply)</label>
            <div className="regions-chips-grid" data-testid="regions-chips-grid">
              {AVAILABLE_REGIONS.map((region) => {
                const isSelected = formData.operatingRegions.includes(region);
                return (
                  <button
                    key={region}
                    type="button"
                    className={`region-chip ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleRegionToggle(region)}
                    data-testid={`region-chip-${region.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {region}
                  </button>
                );
              })}
            </div>

            <div className="driver-form-grid" style={{ marginTop: '1.5rem' }}>
              <div>
                <label className="driver-form-label" htmlFor="city">Base Station City</label>
                <input
                  id="city"
                  name="city"
                  className="driver-form-input"
                  placeholder="Accra"
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="driver-form-label" htmlFor="state">Base Station State / Region</label>
                <input
                  id="state"
                  name="state"
                  className="driver-form-input"
                  placeholder="Greater Accra"
                  value={formData.state}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="driver-submit-btn"
            disabled={isSubmitting}
            data-testid="driver-submit-button"
          >
            {isSubmitting ? 'Registering Fleet Vehicle...' : 'Complete Driver Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}
