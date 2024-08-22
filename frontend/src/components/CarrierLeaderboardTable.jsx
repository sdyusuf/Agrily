/**
 * @file CarrierLeaderboardTable.jsx
 * @description Logistics Carrier Ranking & Tier Leaderboard Component
 * Displays ranked carrier performance scorecards, on-time reliability,
 * incentive bonus allocations, and priority dispatch eligibility.
 */

import React, { useState } from 'react';
import './CarrierLeaderboardTable.css';

export default function CarrierLeaderboardTable({
  rankings = [],
  onSelectCarrier
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');

  const filtered = (rankings || []).filter((c) => {
    const matchesSearch =
      (c.carrierName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.carrierCode || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === 'ALL' || c.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const getTierBadgeClass = (tier) => {
    switch (tier) {
      case 'PLATINUM_AGRO_CARRIER': return 'tier-badge-platinum';
      case 'GOLD_AGRO_CARRIER': return 'tier-badge-gold';
      case 'SILVER_AGRO_CARRIER': return 'tier-badge-silver';
      case 'BRONZE_CARRIER': return 'tier-badge-bronze';
      default: return 'tier-badge-probation';
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <span className="rank-medal gold-medal" title="Rank 1">🥇 1</span>;
    if (rank === 2) return <span className="rank-medal silver-medal" title="Rank 2">🥈 2</span>;
    if (rank === 3) return <span className="rank-medal bronze-medal" title="Rank 3">🥉 3</span>;
    return <span className="rank-number">#{rank}</span>;
  };

  return (
    <div className="carrier-leaderboard-container" data-testid="carrier-leaderboard-table">
      <div className="leaderboard-controls">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="carrier-search-input"
            placeholder="Search carrier name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search carriers"
          />
        </div>

        <div className="tier-filter-chips">
          {['ALL', 'PLATINUM_AGRO_CARRIER', 'GOLD_AGRO_CARRIER', 'SILVER_AGRO_CARRIER'].map((tier) => (
            <button
              key={tier}
              type="button"
              className={`filter-chip-btn ${tierFilter === tier ? 'chip-active' : ''}`}
              onClick={() => setTierFilter(tier)}
            >
              {tier === 'ALL' ? 'All Tiers' : tier.replace(/_AGRO_CARRIER|_CARRIER/g, '')}
            </button>
          ))}
        </div>
      </div>

      <div className="table-responsive-wrapper">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Carrier Name & Code</th>
              <th>Tier Status</th>
              <th>Fleet</th>
              <th>Overall Score</th>
              <th>On-Time Rate</th>
              <th>Safety Score</th>
              <th>Bonus %</th>
              <th>Priority</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-table-state">
                  No carriers found matching the search criteria.
                </td>
              </tr>
            ) : (
              filtered.map((carrier) => (
                <tr
                  key={carrier.carrierCode}
                  className="leaderboard-row"
                  onClick={() => onSelectCarrier && onSelectCarrier(carrier)}
                >
                  <td className="cell-rank">{getRankBadge(carrier.rank)}</td>
                  <td className="cell-carrier-info">
                    <span className="carrier-name-text">{carrier.carrierName}</span>
                    <span className="carrier-code-text">{carrier.carrierCode}</span>
                  </td>
                  <td>
                    <span className={`tier-badge ${getTierBadgeClass(carrier.tier)}`}>
                      {carrier.tier.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="cell-fleet-size">{carrier.fleetSize} trucks</td>
                  <td className="cell-score">
                    <span className="score-pill">{carrier.overallScore} / 100</span>
                  </td>
                  <td className="cell-metric">{carrier.onTimeRatePct}%</td>
                  <td className="cell-metric">{carrier.safetyScore}</td>
                  <td className="cell-bonus">
                    {carrier.freightBonusPct > 0 ? (
                      <span className="bonus-positive">+{carrier.freightBonusPct}%</span>
                    ) : (
                      <span className="bonus-neutral">—</span>
                    )}
                  </td>
                  <td className="cell-priority">
                    {carrier.priorityDispatchAccess ? (
                      <span className="priority-badge" title="Priority Dispatch Enabled">⚡ VIP</span>
                    ) : (
                      <span className="standard-dispatch-badge">Standard</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
