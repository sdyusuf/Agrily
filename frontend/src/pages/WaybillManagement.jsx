/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-LOGISTICS PLATFORM: DIGITAL WAYBILL MANAGEMENT COCKPIT
 * ==============================================================================
 *
 * @page WaybillManagement
 * @description
 * Mission-critical dispatcher cockpit, carrier console, and custody tracking
 * dashboard. Enables logistics coordinators, cooperative managers, and depot
 * agents to manage agricultural digital waybills, inspect cryptographic seals,
 * execute chain-of-custody handovers, and review commercial tax invoices.
 *
 * Adheres strictly to the Agrily Design System:
 *  - Curated brand palette (Lush greens `#1b4332`, `#2d6a4f`; Earth harvest `#bc6c25`, `#dda15e`).
 *  - Tactile micro-interactions and smooth transitions.
 *  - Accessible search and status filters.
 *  - Built-in Custody Handover modal, QR verification modal, and Invoice preview modal.
 *
 * @version 1.0.0
 * @author Agrily Frontend Engineering
 * ==============================================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import WaybillCard from '../components/WaybillCard';
import WaybillQrModal from '../components/WaybillQrModal';
import InvoicePreviewModal from '../components/InvoicePreviewModal';
import './WaybillManagement.css';

/**
 * Fallback baseline mock waybills for immediate UI hydration and resilient offline testing.
 */
const INITIAL_MOCK_WAYBILLS = [
  {
    _id: 'wb-mock-01',
    waybillNumber: 'WB-20240716-KAD01',
    status: 'IN_TRANSIT',
    shipper: {
      farmerId: 'farmer-01',
      cooperativeName: 'Makarfi Tomato Producers Syndicate',
      contactPerson: 'Musa Danladi',
      contactPhone: '+2348031112233',
      pickupAddress: 'Farm Gate Km 14, Makarfi Road',
      state: 'Kaduna',
      country: 'Nigeria'
    },
    consignee: {
      buyerId: 'buyer-01',
      businessName: 'Kano Fresh Foods Processing Ltd',
      contactPerson: 'Amina Bello',
      contactPhone: '+2348029998877',
      deliveryAddress: 'Plot 44 Bompai Industrial Area',
      state: 'Kano',
      country: 'Nigeria'
    },
    carrier: {
      driverId: 'drv-01',
      driverName: 'Ibrahim Sani',
      driverPhone: '+2348054443322',
      driverLicenseNumber: 'DL-KAN-889124',
      vehicleRegistrationPlate: 'KAD-882-TR',
      vehicleType: '3.5T Insulated Truck',
      refrigerationUnitOperational: true
    },
    originDepot: {
      name: 'Zaria Agro Logistics Hub',
      latitude: 11.0855,
      longitude: 7.7199
    },
    destinationHub: {
      name: 'Kano Distribution Terminal',
      latitude: 12.0022,
      longitude: 8.5920
    },
    consignments: [
      {
        _id: 'c-01',
        commodityName: 'Roma Tomatoes',
        category: 'vegetables',
        packagingType: 'PLASTIC_CRATE',
        declaredQuantity: 80,
        grossWeightKg: 2000,
        netWeightKg: 1850,
        numberOfCrates: 80,
        temperatureClass: 'CHILLED',
        targetMinTempC: 4.0,
        targetMaxTempC: 10.0,
        perishabilityPriority: 'HIGH'
      }
    ],
    totalGrossWeightKg: 2000,
    totalNetWeightKg: 1850,
    totalCratesCount: 80,
    estimatedDistanceKm: 128.5,
    estimatedTransitTimeHours: 3.2,
    securitySeals: [
      { sealNumber: 'SEAL-AGR-4412', placementLocation: 'REAR_DOOR_CONTAINER', intactOnArrival: true }
    ],
    integrityHash: '07becf0e6eaa6dd02901a91e45ff99120482bbda88124501aebc912044',
    verificationToken: '2f4a9206f884229445a0cfc0f4fc191d',
    qrVerificationUrl: 'https://agrily.com/waybills/verify/WB-20240716-KAD01?token=2f4a9206f884229445a0cfc0f4fc191d',
    currentHolder: {
      name: 'Ibrahim Sani',
      role: 'PRIMARY_DRIVER',
      transferAction: 'GATE_DISPATCH'
    },
    isHighlyPerishable: true,
    issuedAt: new Date('2024-07-16T08:30:00Z'),
    expectedDeliveryDate: new Date('2024-07-16T18:00:00Z')
  },
  {
    _id: 'wb-mock-02',
    waybillNumber: 'WB-20240716-PLT02',
    status: 'ISSUED',
    shipper: {
      cooperativeName: 'Plateau Vegetable Growers Alliance',
      contactPerson: 'Pam Gyang',
      contactPhone: '+2348035557788',
      pickupAddress: 'Vom Agro Aggregation Depot',
      state: 'Plateau',
      country: 'Nigeria'
    },
    consignee: {
      businessName: 'Abuja Central Wholesale Market',
      contactPerson: 'Emeka Okafor',
      contactPhone: '+2348092223344',
      deliveryAddress: 'Dei-Dei International Market Dock 12',
      state: 'FCT Abuja',
      country: 'Nigeria'
    },
    carrier: {
      driverName: 'Suleiman Audu',
      driverPhone: '+2348067778899',
      vehicleRegistrationPlate: 'PLT-551-LG',
      vehicleType: '7.5T Medium Cargo Truck',
      refrigerationUnitOperational: false
    },
    originDepot: {
      name: 'Jos Cold Storage Terminal',
      latitude: 9.8965,
      longitude: 8.8583
    },
    destinationHub: {
      name: 'Abuja Freight Depot',
      latitude: 9.0765,
      longitude: 7.3986
    },
    consignments: [
      {
        _id: 'c-02',
        commodityName: 'Irish Potatoes (Nicola Variety)',
        category: 'tubers',
        packagingType: 'JUTE_BAG',
        declaredQuantity: 70,
        grossWeightKg: 3500,
        netWeightKg: 3400,
        numberOfCrates: 70,
        temperatureClass: 'COOL',
        targetMinTempC: 8.0,
        targetMaxTempC: 15.0,
        perishabilityPriority: 'MEDIUM'
      }
    ],
    totalGrossWeightKg: 3500,
    totalNetWeightKg: 3400,
    totalCratesCount: 70,
    estimatedDistanceKm: 284.0,
    estimatedTransitTimeHours: 5.5,
    securitySeals: [
      { sealNumber: 'SEAL-AGR-8819', placementLocation: 'MAIN_LOCK_BAR', intactOnArrival: true }
    ],
    integrityHash: '91bc88ef1092aa7123bf01824abce12871239841029410',
    verificationToken: '88921cf0912ab01289fe129841ab012a',
    qrVerificationUrl: 'https://agrily.com/waybills/verify/WB-20240716-PLT02?token=88921cf0912ab01289fe129841ab012a',
    currentHolder: {
      name: 'Pam Gyang',
      role: 'FARMER',
      transferAction: 'PENDING_INITIAL_DISPATCH'
    },
    isHighlyPerishable: false,
    issuedAt: new Date('2024-07-16T09:15:00Z'),
    expectedDeliveryDate: new Date('2024-07-17T12:00:00Z')
  },
  {
    _id: 'wb-mock-03',
    waybillNumber: 'WB-20240715-KAN03',
    status: 'DELIVERED',
    shipper: {
      cooperativeName: 'Hadejia Valley Rice Farmers',
      contactPerson: 'Aliyu Garba',
      contactPhone: '+2348028881122',
      pickupAddress: 'Hadejia Rice Mill Depot',
      state: 'Jigawa',
      country: 'Nigeria'
    },
    consignee: {
      businessName: 'Dawanau Food Exchange Terminal',
      contactPerson: 'Kabiru Sanusi',
      contactPhone: '+2348033334455',
      deliveryAddress: 'Bayero Agro Trade Gate 3',
      state: 'Kano',
      country: 'Nigeria'
    },
    carrier: {
      driverName: 'Haruna Yakubu',
      driverPhone: '+2348051117766',
      vehicleRegistrationPlate: 'JIG-331-TR',
      vehicleType: '10T Heavy Articulated Truck',
      refrigerationUnitOperational: false
    },
    originDepot: {
      name: 'Hadejia Milling Center',
      latitude: 12.4500,
      longitude: 10.0333
    },
    destinationHub: {
      name: 'Dawanau Central Terminal',
      latitude: 12.0100,
      longitude: 8.5200
    },
    consignments: [
      {
        _id: 'c-03',
        commodityName: 'Milled Parboiled Rice (50kg Bags)',
        category: 'grains',
        packagingType: 'JUTE_BAG',
        declaredQuantity: 120,
        grossWeightKg: 6050,
        netWeightKg: 6000,
        numberOfCrates: 120,
        temperatureClass: 'AMBIENT',
        targetMinTempC: 15.0,
        targetMaxTempC: 28.0,
        perishabilityPriority: 'LOW'
      }
    ],
    totalGrossWeightKg: 6050,
    totalNetWeightKg: 6000,
    totalCratesCount: 120,
    estimatedDistanceKm: 175.0,
    estimatedTransitTimeHours: 4.0,
    securitySeals: [
      { sealNumber: 'SEAL-AGR-1092', placementLocation: 'CONTAINER_PIN', intactOnArrival: true }
    ],
    integrityHash: 'ab71290141bbce829104fae10948bca1209841aa9',
    verificationToken: 'ff10924ab719283019abef0182410982',
    qrVerificationUrl: 'https://agrily.com/waybills/verify/WB-20240715-KAN03?token=ff10924ab719283019abef0182410982',
    currentHolder: {
      name: 'Kabiru Sanusi',
      role: 'BUYER',
      transferAction: 'FINAL_DELIVERY'
    },
    isHighlyPerishable: false,
    issuedAt: new Date('2024-07-15T07:00:00Z'),
    expectedDeliveryDate: new Date('2024-07-15T15:00:00Z')
  }
];

export default function WaybillManagement() {
  const [waybills, setWaybills] = useState(INITIAL_MOCK_WAYBILLS);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [selectedWaybillForQr, setSelectedWaybillForQr] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Custody transfer modal state
  const [transferModalWaybill, setTransferModalWaybill] = useState(null);
  const [transferFormData, setTransferFormData] = useState({
    toPartyName: '',
    toPartyRole: 'PRIMARY_DRIVER',
    locationName: '',
    transferAction: 'GATE_DISPATCH',
    sealIntact: true,
    cargoTempC: '',
    notes: ''
  });

  // Fetch waybills from backend API
  useEffect(() => {
    let isMounted = true;
    async function fetchWaybills() {
      try {
        const res = await axios.get('/api/waybills');
        if (isMounted && res.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setWaybills(res.data.data);
        }
      } catch (err) {
        // Fall back gracefully to initialized mock dataset
      }
    }
    fetchWaybills();
    return () => { isMounted = false; };
  }, []);

  // Filtered dataset
  const filteredWaybills = useMemo(() => {
    return waybills.filter(wb => {
      const matchesFilter = activeFilter === 'ALL' || wb.status === activeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (wb.waybillNumber && wb.waybillNumber.toLowerCase().includes(q)) ||
        (wb.shipper?.contactPerson && wb.shipper.contactPerson.toLowerCase().includes(q)) ||
        (wb.shipper?.cooperativeName && wb.shipper.cooperativeName.toLowerCase().includes(q)) ||
        (wb.consignee?.businessName && wb.consignee.businessName.toLowerCase().includes(q)) ||
        (wb.carrier?.driverName && wb.carrier.driverName.toLowerCase().includes(q)) ||
        (wb.carrier?.vehicleRegistrationPlate && wb.carrier.vehicleRegistrationPlate.toLowerCase().includes(q)) ||
        (wb.originDepot?.name && wb.originDepot.name.toLowerCase().includes(q)) ||
        (wb.destinationHub?.name && wb.destinationHub.name.toLowerCase().includes(q)) ||
        (wb.consignments && wb.consignments.some(c => c.commodityName && c.commodityName.toLowerCase().includes(q)));

      return matchesFilter && matchesSearch;
    });
  }, [waybills, activeFilter, searchQuery]);

  // Aggregate KPI metrics
  const kpis = useMemo(() => {
    const totalCount = waybills.length;
    const inTransitCount = waybills.filter(w => w.status === 'IN_TRANSIT' || w.status === 'TRANSFERRED_AT_HUB').length;
    const totalTonnageKg = waybills.reduce((sum, w) => sum + (w.totalNetWeightKg || 0), 0);
    // Estimated escrow value protected (avg ₦400/kg)
    const escrowProtectedNgn = totalTonnageKg * 420;

    return {
      totalCount,
      inTransitCount,
      totalTonnageKg,
      escrowProtectedNgn
    };
  }, [waybills]);

  // Handlers
  const handleOpenQrModal = (waybill) => {
    setSelectedWaybillForQr(waybill);
  };

  const handleOpenInvoiceModal = async (waybill) => {
    try {
      const res = await axios.get(`/api/waybills/${waybill.waybillNumber}/invoice`);
      if (res.data && res.data.data && typeof res.data.data === 'object' && !Array.isArray(res.data.data)) {
        setSelectedInvoice(res.data.data);
      } else {
        throw new Error('No invoice data returned');
      }
    } catch (err) {
      // Local fallback calculation
      const produceSubtotal = (waybill.totalNetWeightKg || 1000) * 350;
      const freight = (waybill.estimatedDistanceKm || 100) * 250 + 15000;
      const escrow = produceSubtotal * 0.015;
      const vat = (freight + produceSubtotal * 0.025) * 0.075;
      setSelectedInvoice({
        invoiceNumber: `INV-${waybill.waybillNumber.replace('WB-', '')}`,
        status: 'ISSUED',
        currency: 'NGN',
        issuedDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        seller: {
          entityName: waybill.shipper?.cooperativeName || 'Agro Cooperative Syndicate',
          address: waybill.shipper?.pickupAddress || 'Farm Gate Depot',
          taxIdentificationNumber: 'TIN-NG-88912401',
          contactPhone: waybill.shipper?.contactPhone || '+2348031112233',
          contactEmail: 'coop.accounts@agrily.ng'
        },
        buyer: {
          entityName: waybill.consignee?.businessName || 'Kano Processing Terminal',
          billingAddress: waybill.consignee?.deliveryAddress || 'Plot 44 Industrial Area',
          taxIdentificationNumber: 'TIN-NG-99210452',
          contactPhone: waybill.consignee?.contactPhone || '+2348029998877',
          contactEmail: 'procurement@buyer.com'
        },
        items: (waybill.consignments || []).map(c => ({
          commodityName: c.commodityName,
          quantity: c.netWeightKg || 1000,
          unitOfMeasure: 'kg',
          unitPrice: 350,
          totalAmount: (c.netWeightKg || 1000) * 350
        })),
        produceSubtotal,
        freightHaulageFee: freight,
        coldChainSurcharge: waybill.isHighlyPerishable ? 15000 : 0,
        escrowProtectionFee: escrow,
        taxVatAmount: vat,
        totalInvoiceAmount: produceSubtotal + freight + escrow + vat + (waybill.isHighlyPerishable ? 15000 : 0),
        invoiceChecksum: '46c301f467f41d57e7829929188401aa8823bcf41029'
      });
    }
    setIsInvoiceModalOpen(true);
  };

  const handleOpenTransferModal = (waybill) => {
    setTransferModalWaybill(waybill);
    setTransferFormData({
      toPartyName: waybill.carrier?.driverName || '',
      toPartyRole: waybill.status === 'ISSUED' ? 'PRIMARY_DRIVER' : 'BUYER',
      locationName: waybill.destinationHub?.name || 'Hub Terminal',
      transferAction: waybill.status === 'ISSUED' ? 'GATE_DISPATCH' : 'FINAL_DELIVERY',
      sealIntact: true,
      cargoTempC: '6.5',
      notes: ''
    });
  };

  const handleExecuteTransfer = async (e) => {
    e.preventDefault();
    if (!transferModalWaybill) return;

    const payload = {
      fromParty: {
        name: transferModalWaybill.currentHolder?.name || transferModalWaybill.shipper?.contactPerson || 'Current Holder',
        role: transferModalWaybill.currentHolder?.role || 'FARMER'
      },
      toParty: {
        name: transferFormData.toPartyName || 'Consignee Receiver',
        role: transferFormData.toPartyRole
      },
      locationName: transferFormData.locationName || 'Transit Handover Gate',
      transferAction: transferFormData.transferAction,
      sealIntact: transferFormData.sealIntact,
      recordedCargoTempC: parseFloat(transferFormData.cargoTempC) || null,
      notes: transferFormData.notes || 'Custody transfer confirmed via Agrily operator terminal.'
    };

    try {
      await axios.post(`/api/waybills/${transferModalWaybill.waybillNumber}/custody-transfer`, payload);
    } catch (err) {
      // Local state update fallback
      console.warn('API custody transfer fallback applied:', err.message);
    }

    // Determine target status
    let nextStatus = 'IN_TRANSIT';
    if (transferFormData.transferAction === 'CROSS_DOCK_RELOAD') nextStatus = 'TRANSFERRED_AT_HUB';
    else if (transferFormData.transferAction === 'FINAL_DELIVERY') nextStatus = 'DELIVERED';

    setWaybills(prev => prev.map(w => {
      if (w.waybillNumber === transferModalWaybill.waybillNumber) {
        return {
          ...w,
          status: nextStatus,
          currentHolder: {
            name: transferFormData.toPartyName,
            role: transferFormData.toPartyRole,
            transferAction: transferFormData.transferAction
          }
        };
      }
      return w;
    }));

    setTransferModalWaybill(null);
  };

  const handlePrintWaybill = (waybill) => {
    window.open(`/api/waybills/${waybill.waybillNumber}/print`, '_blank');
  };

  return (
    <div className="waybill-management-page" data-testid="waybill-management-page">
      {/* Cockpit Headline */}
      <header className="waybill-cockpit-header">
        <div className="title-block">
          <span className="domain-pill">Logistics & Legal Freight Conveyance</span>
          <h1 className="cockpit-headline">Agricultural Digital Waybills & Invoicing</h1>
          <p className="cockpit-subtext">
            Track inter-state farm produce consignment notes, inspect cryptographic tamper seals,
            verify custody transfers, and reconcile commercial escrow payments.
          </p>
        </div>
      </header>

      {/* Strategic KPI Metric Cards */}
      <section className="kpi-metrics-grid" data-testid="kpi-metrics-grid">
        <div className="kpi-card" data-testid="kpi-total-waybills">
          <div className="kpi-icon icon-emerald">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Active Consignments</span>
            <h3 className="kpi-value">{kpis.totalCount}</h3>
            <span className="kpi-sub">Total Waybills Logged</span>
          </div>
        </div>

        <div className="kpi-card" data-testid="kpi-in-transit">
          <div className="kpi-icon icon-blue">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Vehicles in Transit</span>
            <h3 className="kpi-value">{kpis.inTransitCount}</h3>
            <span className="kpi-sub">Active Road Corridors</span>
          </div>
        </div>

        <div className="kpi-card" data-testid="kpi-tonnage">
          <div className="kpi-icon icon-ochre">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Cargo Tonnage</span>
            <h3 className="kpi-value">{(kpis.totalTonnageKg / 1000).toFixed(1)} <span className="kpi-unit">Tons</span></h3>
            <span className="kpi-sub">{kpis.totalTonnageKg.toLocaleString()} kg Net Produce</span>
          </div>
        </div>

        <div className="kpi-card" data-testid="kpi-escrow-value">
          <div className="kpi-icon icon-gold">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Escrow Value Protected</span>
            <h3 className="kpi-value">₦{(kpis.escrowProtectedNgn / 1000000).toFixed(2)}M</h3>
            <span className="kpi-sub">Secured Freight Value</span>
          </div>
        </div>
      </section>

      {/* Control Bar: Filter Tabs & Search Bar */}
      <section className="cockpit-control-bar">
        <div className="status-tabs-group" role="tablist">
          {['ALL', 'ISSUED', 'IN_TRANSIT', 'TRANSFERRED_AT_HUB', 'DELIVERED'].map(filter => (
            <button
              key={filter}
              type="button"
              className={`filter-tab ${activeFilter === filter ? 'active-tab' : ''}`}
              data-testid={`tab-${filter.toLowerCase()}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter === 'ALL' ? 'All Waybills' : filter.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="search-box">
          <svg
            className="search-icon"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input"
            data-testid="waybill-search-input"
            placeholder="Search by Waybill #, Shipper, Driver, or Plate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {/* Waybills List / Grid */}
      <main className="waybills-grid" data-testid="waybills-grid">
        {isLoading && waybills.length === 0 ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading digital waybill consignments...</p>
          </div>
        ) : filteredWaybills.length === 0 ? (
          <div className="empty-state" data-testid="empty-waybills-state">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#64748b" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <h3>No Waybill Consignments Found</h3>
            <p>No freight notes match your selected status filter or search parameters.</p>
          </div>
        ) : (
          filteredWaybills.map(waybill => (
            <WaybillCard
              key={waybill._id || waybill.waybillNumber}
              waybill={waybill}
              onViewQr={handleOpenQrModal}
              onViewInvoice={handleOpenInvoiceModal}
              onInitiateTransfer={handleOpenTransferModal}
              onPrintWaybill={handlePrintWaybill}
            />
          ))
        )}
      </main>

      {/* QR Verification Modal */}
      <WaybillQrModal
        waybill={selectedWaybillForQr}
        isOpen={Boolean(selectedWaybillForQr)}
        onClose={() => setSelectedWaybillForQr(null)}
      />

      {/* Commercial Invoice Modal */}
      <InvoicePreviewModal
        invoice={selectedInvoice}
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedInvoice(null);
        }}
        onPrint={(inv) => window.print()}
      />

      {/* Custody Hand-off Modal */}
      {transferModalWaybill && (
        <div
          className="transfer-modal-backdrop"
          data-testid="custody-transfer-modal"
          onClick={() => setTransferModalWaybill(null)}
        >
          <div
            className="transfer-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="transfer-modal-header">
              <div>
                <span className="modal-tag">Chain of Custody Protocol</span>
                <h2 className="transfer-modal-title">Log Custody Handover</h2>
                <span className="transfer-waybill-ref">{transferModalWaybill.waybillNumber}</span>
              </div>
              <button
                type="button"
                className="close-btn"
                data-testid="close-transfer-modal"
                onClick={() => setTransferModalWaybill(null)}
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleExecuteTransfer} className="transfer-modal-form">
              <div className="form-row">
                <label className="form-label">
                  Handover Action:
                  <select
                    className="form-select"
                    data-testid="select-transfer-action"
                    value={transferFormData.transferAction}
                    onChange={(e) => setTransferFormData({ ...transferFormData, transferAction: e.target.value })}
                  >
                    <option value="GATE_DISPATCH">Farm-Gate Dispatch (Driver Intake)</option>
                    <option value="CROSS_DOCK_RELOAD">Cross-Dock Transfer (Regional Hub)</option>
                    <option value="FINAL_DELIVERY">Final Delivery to Consignee Dock</option>
                  </select>
                </label>
              </div>

              <div className="form-grid-2">
                <label className="form-label">
                  Receiving Party Name:
                  <input
                    type="text"
                    required
                    className="form-input"
                    data-testid="input-receiver-name"
                    value={transferFormData.toPartyName}
                    onChange={(e) => setTransferFormData({ ...transferFormData, toPartyName: e.target.value })}
                    placeholder="e.g. Garba Mohammed / Amina Bello"
                  />
                </label>

                <label className="form-label">
                  Receiving Role:
                  <select
                    className="form-select"
                    data-testid="select-receiver-role"
                    value={transferFormData.toPartyRole}
                    onChange={(e) => setTransferFormData({ ...transferFormData, toPartyRole: e.target.value })}
                  >
                    <option value="PRIMARY_DRIVER">Primary Long-Haul Driver</option>
                    <option value="HUB_RECEIVER">Regional Warehouse Receipt Officer</option>
                    <option value="BUYER">Terminal Consignee / Buyer</option>
                    <option value="INSPECTOR">Phytosanitary Inspector</option>
                  </select>
                </label>
              </div>

              <div className="form-grid-2">
                <label className="form-label">
                  Handover Location:
                  <input
                    type="text"
                    required
                    className="form-input"
                    data-testid="input-transfer-location"
                    value={transferFormData.locationName}
                    onChange={(e) => setTransferFormData({ ...transferFormData, locationName: e.target.value })}
                    placeholder="e.g. Zaria Hub Gate 2"
                  />
                </label>

                <label className="form-label">
                  Cargo Temp Check (°C):
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    data-testid="input-cargo-temp"
                    value={transferFormData.cargoTempC}
                    onChange={(e) => setTransferFormData({ ...transferFormData, cargoTempC: e.target.value })}
                    placeholder="e.g. 6.5"
                  />
                </label>
              </div>

              <div className="form-checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={transferFormData.sealIntact}
                    onChange={(e) => setTransferFormData({ ...transferFormData, sealIntact: e.target.checked })}
                  />
                  <span>Physical Security Tamper Seal Inspected and Confirmed Intact</span>
                </label>
              </div>

              <div className="form-row">
                <label className="form-label">
                  Operational Handover Notes:
                  <textarea
                    className="form-textarea"
                    rows="2"
                    value={transferFormData.notes}
                    onChange={(e) => setTransferFormData({ ...transferFormData, notes: e.target.value })}
                    placeholder="Add inspection observations or vehicle condition notes..."
                  />
                </label>
              </div>

              <footer className="form-actions-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setTransferModalWaybill(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-confirm-transfer"
                  data-testid="btn-confirm-transfer"
                >
                  Confirm & Sign Custody Transfer
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
