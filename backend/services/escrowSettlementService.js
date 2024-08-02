/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-COMMERCE PLATFORM: ESCROW SETTLEMENT SERVICE
 * ==============================================================================
 * 
 * Production-ready settlement execution and multi-split payment distributor.
 * Simulates and orchestrates multi-party agricultural disbursements across
 * commercial Nigerian banking rails (NIBSS, Paystack sub-accounts, Flutterwave).
 * 
 * Features:
 *  - 48-Hour automated countdown inspection time-lock evaluator.
 *  - Cryptographic buyer PIN authorization for milestone releases.
 *  - Tribunal arbitration settlement execution & financial ledger updates.
 *  - Comprehensive financial audit reporting.
 * 
 * @module services/escrowSettlementService
 * @author Agrily Core Financial Engineering
 * ==============================================================================
 */

const crypto = require('crypto');
const { EscrowSettlementVault } = require('../models/EscrowSettlementVault');
const { DisputeTribunalCase } = require('../models/DisputeTribunalCase');
const { QualityInspectionCertificate } = require('../models/QualityInspectionCertificate');

class EscrowSettlementService {
  /**
   * Initialize a new Escrow Settlement Vault for an Order
   */
  static async initializeVault(vaultData) {
    const vault = new EscrowSettlementVault(vaultData);
    await vault.validate();
    return vault;
  }

  /**
   * Release a specific milestone on a vault with buyer/inspector authorization
   */
  static async releaseMilestone(vault, milestoneKey, signatoryPin, txRef = null) {
    if (!vault) {
      throw new Error('Valid EscrowSettlementVault instance is required');
    }

    if (vault.status === 'ARBITRATION_LOCKED') {
      throw new Error('Vault is locked under formal arbitration dispute; milestone release prohibited');
    }

    const milestone = vault.releaseMilestone(milestoneKey, signatoryPin, txRef);
    return {
      vaultNumber: vault.vaultNumber,
      milestoneKey: milestone.milestoneKey,
      amount: milestone.amount,
      status: milestone.status,
      releasedAt: milestone.releasedAt,
      releaseTransactionRef: milestone.releaseTransactionRef,
      vaultStatus: vault.status,
      totalReleased: vault.totalReleasedAmount
    };
  }

  /**
   * Record receiver dock arrival and initiate 48-hour inspection countdown
   */
  static recordDockArrival(vault, arrivalDate = new Date()) {
    vault.recordDockArrival(arrivalDate);
    return {
      vaultNumber: vault.vaultNumber,
      status: vault.status,
      dockArrivalTimestamp: vault.dockArrivalTimestamp,
      inspectionDeadlineTimestamp: vault.inspectionDeadlineTimestamp,
      windowHours: vault.inspectionWindowHours,
      isOpen: vault.isInspectionWindowOpen
    };
  }

  /**
   * Check and auto-release vaults whose 48-hour inspection countdown has lapsed
   */
  static evaluateExpiredCountdowns(vaultList = []) {
    const autoReleasedVaults = [];

    for (const vault of vaultList) {
      if (vault.status === 'INSPECTION_PENDING' && vault.isAutoReleaseEligible) {
        // Auto-release all remaining locked milestones to farmer and carrier
        for (const milestone of vault.milestones) {
          if (milestone.status === 'LOCKED' || milestone.status === 'ELIGIBLE') {
            milestone.status = 'RELEASED';
            milestone.releasedAt = new Date();
            milestone.releaseSignatoryPin = 'AUTO_RELEASE_COUNTDOWN_EXPIRATION';
            milestone.releaseTransactionRef = `TX-AUTO-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
            vault.totalReleasedAmount = Number((vault.totalReleasedAmount + milestone.amount).toFixed(2));
          }
        }

        vault.status = 'FULLY_SETTLED';
        vault.settledAt = new Date();
        vault.recalculateFinancials();

        autoReleasedVaults.push({
          vaultNumber: vault.vaultNumber,
          orderId: vault.orderId,
          totalReleased: vault.totalReleasedAmount,
          settledAt: vault.settledAt
        });
      }
    }

    return autoReleasedVaults;
  }

  /**
   * Execute financial distributions ordered by a binding Tribunal Verdict
   */
  static executeTribunalSettlement(vault, tribunalCase) {
    if (!vault || !tribunalCase) {
      throw new Error('Both vault and tribunal case instances are required');
    }

    const verdict = tribunalCase.arbitrationVerdict;
    if (!verdict || !verdict.outcome) {
      throw new Error('Cannot execute settlement without issued tribunal verdict');
    }

    // Allocate buyer refund
    if (verdict.buyerRefundAmount > 0) {
      vault.totalRefundedAmount = verdict.buyerRefundAmount;
      vault.milestones.push({
        milestoneKey: 'FARMER_GATE_ADVANCE', // fallback key
        title: `Tribunal Buyer Refund (${verdict.outcome})`,
        beneficiaryRole: 'BUYER_REFUND',
        beneficiaryName: vault.buyer.name,
        beneficiaryAccountRef: `REFUND-${vault.buyer.email}`,
        amount: verdict.buyerRefundAmount,
        percentageOfTotal: Number(((verdict.buyerRefundAmount / vault.totalEscrowAmount) * 100).toFixed(2)),
        status: 'RELEASED',
        releasedAt: new Date(),
        releaseTransactionRef: `TX-REFUND-${Date.now()}`,
        releaseSignatoryPin: 'TRIBUNAL_SEALED'
      });
    }

    // Mark remaining farmer/carrier milestones adjusted
    for (const m of vault.milestones) {
      if (m.beneficiaryRole === 'FARMER') {
        if (verdict.farmerPayoutAmount === 0) {
          m.status = 'FORFEITED';
        } else {
          m.status = 'RELEASED';
          m.releasedAt = new Date();
        }
      } else if (m.beneficiaryRole === 'CARRIER') {
        if (verdict.carrierPayoutAmount === 0) {
          m.status = 'FORFEITED';
        } else {
          m.status = 'RELEASED';
          m.releasedAt = new Date();
        }
      }
    }

    vault.totalReleasedAmount = Number((
      (verdict.farmerPayoutAmount || 0) +
      (verdict.carrierPayoutAmount || 0) +
      (vault.platformCommissionFee || 0) +
      (vault.statutoryVatAmount || 0)
    ).toFixed(2));

    vault.status = 'FULLY_SETTLED';
    vault.settledAt = new Date();
    vault.recalculateFinancials();

    tribunalCase.markSettlementExecuted();

    return {
      vaultNumber: vault.vaultNumber,
      docketNumber: tribunalCase.docketNumber,
      outcome: verdict.outcome,
      buyerRefundAmount: verdict.buyerRefundAmount,
      farmerPayoutAmount: verdict.farmerPayoutAmount,
      carrierPayoutAmount: verdict.carrierPayoutAmount,
      totalReleased: vault.totalReleasedAmount,
      totalRefunded: vault.totalRefundedAmount,
      settledAt: vault.settledAt
    };
  }

  /**
   * Compile standalone printable settlement certificate HTML report
   */
  static generateSettlementAuditReportHtml(vault, tribunalCase = null) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Agrily Settlement Audit Certificate - ${vault.vaultNumber}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #0f172a; margin: 40px; background: #fff; }
    .header { border-bottom: 2px solid #1b4332; padding-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
    .title { color: #1b4332; font-size: 24px; font-weight: 800; }
    .badge { background: #d8f3dc; color: #1b4332; padding: 4px 12px; border-radius: 99px; font-weight: 700; font-size: 13px; }
    .section-title { color: #bc6c25; font-size: 16px; font-weight: 700; margin-top: 24px; text-transform: uppercase; letter-spacing: 0.05em; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #f8faf9; color: #475569; text-align: left; padding: 10px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
    td { padding: 10px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
    .total-row { font-weight: 800; font-size: 15px; background: #f8faf9; }
    .seal-box { margin-top: 30px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; background: #f8faf9; font-family: monospace; font-size: 12px; word-break: break-all; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">🌾 Agrily Agricultural Escrow Settlement</div>
      <div style="color: #64748b; font-size: 13px;">Official Tri-Party Disbursement & Audit Certificate</div>
    </div>
    <div class="badge">${vault.status}</div>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
    <div>
      <strong>Vault Reference:</strong> ${vault.vaultNumber}<br>
      <strong>Order Reference:</strong> ${vault.orderId}<br>
      <strong>Waybill Reference:</strong> ${vault.waybillNumber || 'N/A'}<br>
      <strong>Currency:</strong> ${vault.currency}
    </div>
    <div>
      <strong>Buyer:</strong> ${vault.buyer.name} (${vault.buyer.email})<br>
      <strong>Farmer:</strong> ${vault.farmer.name} (${vault.farmer.farmName || 'Verified Producer'})<br>
      <strong>Carrier:</strong> ${vault.carrier.name} (${vault.carrier.vehiclePlateNumber})<br>
      <strong>Settlement Date:</strong> ${vault.settledAt ? new Date(vault.settledAt).toLocaleDateString() : 'Pending Final Release'}
    </div>
  </div>

  <div class="section-title">Itemized Milestone Disbursement Ledger</div>
  <table>
    <thead>
      <tr>
        <th>Milestone Checkpoint</th>
        <th>Beneficiary</th>
        <th>Allocation %</th>
        <th>Status</th>
        <th>Amount (${vault.currency})</th>
      </tr>
    </thead>
    <tbody>
      ${vault.milestones.map(m => `
        <tr>
          <td>${m.title}</td>
          <td>${m.beneficiaryName}</td>
          <td>${m.percentageOfTotal}%</td>
          <td><strong>${m.status}</strong></td>
          <td>₦${Number(m.amount).toLocaleString()}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td colspan="4">Total Vault Escrow Capital:</td>
        <td>₦${Number(vault.totalEscrowAmount).toLocaleString()}</td>
      </tr>
    </tbody>
  </table>

  <div class="seal-box">
    <strong>CRYPTOGRAPHIC INTEGRITY SEAL (SHA-256):</strong><br>
    ${vault.financialChecksum}
  </div>
</body>
</html>`;
  }
}

module.exports = {
  EscrowSettlementService
};
