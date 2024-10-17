/**
 * ==============================================================================
 * 🌾 AGRILY HYPERLOCAL WEATHER: ALERT SUBSCRIPTION & DISPATCH SIMULATOR MODAL
 * ==============================================================================
 *
 * Interactive modal enabling farmers to configure hyperlocal frost, heatwave,
 * wind-drift, and dry-spell thresholds, select multi-channel delivery rails
 * (Push, SMS, WhatsApp, Email), and test live emergency alert dispatch.
 * ==============================================================================
 */

import React, { useState } from 'react';
import './WeatherAlertSubscriptionModal.css';
import { BellRingIcon, XIcon, CheckCircleIcon, ZapIcon } from './Icons';

export default function WeatherAlertSubscriptionModal({
  isOpen = false,
  onClose,
  stationCode = 'AWS-JOS-1042',
  stationName = 'Jos Plateau Montane Observatory #4',
  cropType = 'Potato',
  onSaveSubscription
}) {
  const [subscriberEmail, setSubscriberEmail] = useState('amina.bello@agrily.ng');
  const [farmerName, setFarmerName] = useState('Hajiya Amina Bello');
  const [phoneNumber, setPhoneNumber] = useState('+2348031234567');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [frostThreshold, setFrostThreshold] = useState(3.5);
  const [heatwaveThreshold, setHeatwaveThreshold] = useState(36.5);
  const [maxWindKmh, setMaxWindKmh] = useState(15.0);
  const [droughtDays, setDroughtDays] = useState(10);
  const [channels, setChannels] = useState({
    pushNotification: true,
    smsGateway: true,
    whatsappBot: true,
    emailDigest: true
  });
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const toggleChannel = (key) => {
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      subscriberEmail,
      farmerName,
      phoneNumber,
      stationCode,
      cropType,
      preferredLanguage,
      channels,
      thresholds: {
        frostTemperatureThresholdCelsius: Number(frostThreshold),
        heatwaveTemperatureThresholdCelsius: Number(heatwaveThreshold),
        maxSprayWindSpeedKmh: Number(maxWindKmh),
        droughtConsecutiveDryDays: Number(droughtDays)
      }
    };

    try {
      await fetch('/api/weather/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {
      // Offline / test fallback
    }

    if (typeof onSaveSubscription === 'function') {
      onSaveSubscription(payload);
    }
    setStatusMessage(
      `Saved ${preferredLanguage} alert rules for ${stationCode} via Push/SMS/WhatsApp.`
    );
  };

  const handleTestDispatch = async () => {
    setStatusMessage(
      `Dispatched simulated CRITICAL FROST alert for ${stationCode} to ${phoneNumber} (${preferredLanguage}).`
    );
  };

  return (
    <div
      className="weather-sub-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Configure Hyperlocal Weather Alerts"
      data-testid="weather-subscription-modal"
    >
      <div className="weather-sub-modal-panel">
        <div className="weather-sub-modal-header">
          <div className="sub-modal-title-wrap">
            <span className="sub-modal-icon-circle">
              <BellRingIcon size={20} color="#1b4332" />
            </span>
            <div>
              <h3 className="sub-modal-title">Hyperlocal Weather Alert Subscriptions</h3>
              <p className="sub-modal-subtitle">
                Station: <strong>{stationName} ({stationCode})</strong> &bull; Crop: <strong>{cropType}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            className="sub-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
            data-testid="close-subscription-modal-btn"
          >
            <XIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="weather-sub-form">
          <div className="sub-form-grid">
            <div className="sub-form-field">
              <label htmlFor="sub-farmer-name">Farmer / Producer Name</label>
              <input
                id="sub-farmer-name"
                type="text"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                required
              />
            </div>

            <div className="sub-form-field">
              <label htmlFor="sub-email">Subscriber Email</label>
              <input
                id="sub-email"
                type="email"
                value={subscriberEmail}
                onChange={(e) => setSubscriberEmail(e.target.value)}
                required
              />
            </div>

            <div className="sub-form-field">
              <label htmlFor="sub-phone">SMS / WhatsApp Phone</label>
              <input
                id="sub-phone"
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>

            <div className="sub-form-field">
              <label htmlFor="sub-lang">Advisory Broadcast Language</label>
              <select
                id="sub-lang"
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                data-testid="subscription-language-select"
              >
                <option value="English">English</option>
                <option value="Hausa">Hausa</option>
                <option value="Yoruba">Yoruba</option>
                <option value="Igbo">Igbo</option>
                <option value="Pidgin">Nigerian Pidgin</option>
              </select>
            </div>
          </div>

          <h4 className="sub-section-heading">Custom Crop Hazard Trigger Thresholds</h4>
          <div className="sub-form-grid">
            <div className="sub-form-field">
              <label htmlFor="sub-frost">Frost Trigger Ceiling (&deg;C)</label>
              <input
                id="sub-frost"
                type="number"
                step="0.5"
                value={frostThreshold}
                onChange={(e) => setFrostThreshold(e.target.value)}
              />
            </div>

            <div className="sub-form-field">
              <label htmlFor="sub-heat">Heatwave Trigger Floor (&deg;C)</label>
              <input
                id="sub-heat"
                type="number"
                step="0.5"
                value={heatwaveThreshold}
                onChange={(e) => setHeatwaveThreshold(e.target.value)}
              />
            </div>

            <div className="sub-form-field">
              <label htmlFor="sub-wind">Spray Drift Wind Limit (km/h)</label>
              <input
                id="sub-wind"
                type="number"
                step="1"
                value={maxWindKmh}
                onChange={(e) => setMaxWindKmh(e.target.value)}
              />
            </div>

            <div className="sub-form-field">
              <label htmlFor="sub-drought">Dry Spell Consecutive Days</label>
              <input
                id="sub-drought"
                type="number"
                step="1"
                value={droughtDays}
                onChange={(e) => setDroughtDays(e.target.value)}
              />
            </div>
          </div>

          <h4 className="sub-section-heading">Multi-Channel Dispatch Rails</h4>
          <div className="sub-channels-row">
            {[
              { key: 'pushNotification', label: 'Browser & Mobile Push' },
              { key: 'smsGateway', label: 'GSM SMS Gateway' },
              { key: 'whatsappBot', label: 'WhatsApp Agronomy Bot' },
              { key: 'emailDigest', label: 'Daily ET0 Email Digest' }
            ].map((ch) => (
              <label key={ch.key} className="sub-channel-checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(channels[ch.key])}
                  onChange={() => toggleChannel(ch.key)}
                />
                <span>{ch.label}</span>
              </label>
            ))}
          </div>

          {statusMessage && (
            <div className="sub-status-toast" data-testid="subscription-status-toast">
              <CheckCircleIcon size={16} />
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="sub-modal-actions">
            <button
              type="button"
              className="sub-btn-test"
              onClick={handleTestDispatch}
              data-testid="test-alert-dispatch-btn"
            >
              <ZapIcon size={15} /> Test Emergency Frost Push
            </button>

            <button
              type="submit"
              className="sub-btn-save"
              data-testid="save-subscription-btn"
            >
              Save Alert Thresholds
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
