/**
 * ==============================================================================
 * AGRILY AGRICULTURAL LOGISTICS - ROUTE STOP SEQUENCE STEPPER COMPONENT
 * ==============================================================================
 * 
 * Component Description:
 * Renders an interactive, accessible list of farm-gate collection and terminal
 * drop-off stops. Supports manual re-ordering (Move Up / Move Down), perishability
 * urgency badges, loading time windows, and collection proof indicators.
 * 
 * Design Standards:
 *  - Strict adherence to DESIGN_SYSTEM.md
 *  - Emerald (#1b4332, #2d6a4f) and Harvest Ochre (#bc6c25, #dda15e) palette
 *  - Micro-interactions with cubic-bezier hover transitions
 *  - High contrast text for outdoor driver visibility
 * 
 * @module components/RouteStopSequence
 */

import React from 'react';
import PropTypes from 'prop-types';
import './RouteStopSequence.css';

/**
 * Format ISO date string into readable 12-hour or 24-hour time.
 * @param {string|Date} dateVal 
 * @returns {string} Formatted time string (e.g., '10:45 AM')
 */
const formatTime = (dateVal) => {
  if (!dateVal) return '--:--';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

export const RouteStopSequence = ({
  stops = [],
  onMoveUp,
  onMoveDown,
  onSelectStop,
  selectedStopId = null,
  isReadOnly = false,
  originDepot = null,
  destinationHub = null
}) => {
  return (
    <div className="route-stop-sequence-container" data-testid="route-stop-sequence">
      {/* Origin Depot Anchor */}
      {originDepot && (
        <div className="stop-card depot-card origin-card" data-testid="origin-depot-card">
          <div className="stop-marker depot-marker">
            <span className="marker-code">DEPOT</span>
          </div>
          <div className="stop-main-info">
            <div className="stop-header-row">
              <span className="facility-badge">Origin Dispatch Depot</span>
              <span className="stop-facility-code">{originDepot.facilityCode || 'ORIGIN'}</span>
            </div>
            <h4 className="stop-title">{originDepot.depotName}</h4>
            <p className="stop-address">{originDepot.address}, {originDepot.city}, {originDepot.state}</p>
            <div className="stop-meta-chips">
              <span className="meta-chip">Manager: {originDepot.contactPerson}</span>
              <span className="meta-chip">Tel: {originDepot.contactPhone}</span>
              <span className="meta-chip hours-chip">
                Hours: {originDepot.operatingHours?.openingTime || '06:00'} - {originDepot.operatingHours?.closingTime || '20:00'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Connecting Track Line */}
      <div className="sequence-connector-stem"></div>

      {/* Ordered Farm Pickup Stops */}
      {stops.length === 0 ? (
        <div className="empty-stops-placeholder" data-testid="empty-stops-message">
          <p className="empty-stops-title">No collection stops assigned to this route.</p>
          <p className="empty-stops-sub">Select unassigned farm harvest orders from the pool to build an itinerary.</p>
        </div>
      ) : (
        <div className="stops-list-flow" role="list">
          {stops.map((stop, index) => {
            const isFirst = index === 0;
            const isLast = index === stops.length - 1;
            const isSelected = selectedStopId === stop.stopId;
            const perishability = stop.producePayload?.perishabilityTier || 'MEDIUM';
            const weight = stop.producePayload?.weightKg || 0;
            const crates = stop.producePayload?.volumeCrates || 0;
            const produce = stop.producePayload?.produceName || 'Produce Consignment';
            const status = stop.status || 'PENDING';

            return (
              <div
                key={stop.stopId || index}
                role="listitem"
                className={`stop-card farm-stop-card ${isSelected ? 'selected-card' : ''} status-${status.toLowerCase()}`}
                data-testid={`stop-card-${stop.stopId || index}`}
                onClick={() => onSelectStop && onSelectStop(stop)}
              >
                {/* Stepper Node Number */}
                <div className="stop-marker farm-marker">
                  <span className="marker-number">{index + 1}</span>
                  <span className="marker-type-label">STOP</span>
                </div>

                {/* Stop Card Details */}
                <div className="stop-main-info">
                  <div className="stop-header-row">
                    <span className={`perishability-pill tier-${perishability.toLowerCase()}`}>
                      {perishability} Perishability
                    </span>
                    <span className={`stop-status-pill pill-${status.toLowerCase()}`}>
                      {status.replace('_', ' ')}
                    </span>
                    <span className="road-surface-tag">
                      {(stop.roadSurface || 'ASPHALT').replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="stop-title">{stop.locationName || stop.farmName || 'Farm Gate'}</h4>
                  <p className="stop-address">{stop.address}, {stop.state}</p>

                  <div className="produce-payload-ribbon">
                    <span className="cargo-item-name">{produce}</span>
                    <span className="cargo-item-stat"><strong>{weight.toLocaleString()}</strong> kg</span>
                    <span className="cargo-item-stat"><strong>{crates}</strong> crates</span>
                    {stop.producePayload?.requiresRefrigeration && (
                      <span className="cold-req-badge">Cold Chain Required</span>
                    )}
                  </div>

                  <div className="stop-meta-chips">
                    <span className="meta-chip">Farmer: {stop.contactName}</span>
                    <span className="meta-chip">Tel: {stop.contactPhone}</span>
                    <span className="meta-chip time-chip">
                      Est. Arrival: {formatTime(stop.estimatedArrival)}
                    </span>
                    {stop.delayMinutes > 0 && (
                      <span className="delay-alert-chip" data-testid="delay-alert">
                        +{stop.delayMinutes}m Perishability Warning
                      </span>
                    )}
                  </div>
                </div>

                {/* Manual Sequence Reorder Action Controls */}
                {!isReadOnly && (
                  <div className="stop-reorder-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="reorder-btn btn-up"
                      disabled={isFirst}
                      onClick={() => onMoveUp && onMoveUp(index)}
                      aria-label={`Move stop ${index + 1} up`}
                      title="Move stop earlier in sequence"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="18 15 12 9 6 15"></polyline>
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="reorder-btn btn-down"
                      disabled={isLast}
                      onClick={() => onMoveDown && onMoveDown(index)}
                      aria-label={`Move stop ${index + 1} down`}
                      title="Move stop later in sequence"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Connecting Stem to Destination */}
      <div className="sequence-connector-stem"></div>

      {/* Terminal Destination Hub */}
      {destinationHub && (
        <div className="stop-card depot-card destination-card" data-testid="destination-hub-card">
          <div className="stop-marker destination-marker">
            <span className="marker-code">TERM</span>
          </div>
          <div className="stop-main-info">
            <div className="stop-header-row">
              <span className="facility-badge terminal-badge">Wholesale Market Hub</span>
              <span className="stop-facility-code">{destinationHub.facilityCode || 'TERM'}</span>
            </div>
            <h4 className="stop-title">{destinationHub.depotName}</h4>
            <p className="stop-address">{destinationHub.address}, {destinationHub.city}, {destinationHub.state}</p>
            <div className="stop-meta-chips">
              <span className="meta-chip">Dock Manager: {destinationHub.contactPerson}</span>
              <span className="meta-chip">Tel: {destinationHub.contactPhone}</span>
              <span className="meta-chip receive-chip">Unloading Dock Verified</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

RouteStopSequence.propTypes = {
  stops: PropTypes.arrayOf(PropTypes.object),
  onMoveUp: PropTypes.func,
  onMoveDown: PropTypes.func,
  onSelectStop: PropTypes.func,
  selectedStopId: PropTypes.string,
  isReadOnly: PropTypes.bool,
  originDepot: PropTypes.object,
  destinationHub: PropTypes.object
};

export default RouteStopSequence;
