/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { safeSetJSON, safeSetItem } from '../utils/safeStorage';
import { 
  FileText, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Sparkles,
  Calendar,
  RotateCcw,
  Package,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export interface PPEItem {
  id: string;
  itemNo: string;
  article: string;
  uacsCode: string;
  description: string;
  subsidiaryLedger: string;
  propertyNumber: string;
  dateAcquired: string;
  quantity: number;
  unit: string;
  clc: string;
  schoolYear: string;
  sourceOfProperty: string;
  remarks: string;
  auditedBy?: string;
}

const CLCS_LIST = [
  "ALS SHS Tibag High School",
  "ALS SHS Maliwalo National High School",
  "Alvindia Community Learning Center",
  "Amucao Community Learning Center",
  "Armenia Community Learning Center",
  "Armenia Apalang Community Learning Center",
  "Armenia Sitio Dam Community Learning Center",
  "Asturias Community Learning Center",
  "Atioc Community Learning Center",
  "Balanti Community Learning Center",
  "Balete Community Learning Center",
  "Balibago II Community Learning Center",
  "Balingcanaway Community Learning Center",
  "Bantog Community Learning Center",
  "Baras-Baras Community Learning Center",
  "Binauganan Community Learning Center",
  "Bora Community Learning Center",
  "Buenavista Community Learning Center",
  "Buhilit Community Learning Center",
  "Burot Community Learning Center",
  "Calingcuan Community Learning Center",
  "Capehan Community Learning Center",
  "Care Community Learning Center",
  "Carangian Community Learning Center",
  "Cut-Cut I Community Learning Center",
  "Cut-Cut II Community Learning Center",
  "Dalayap Community Learning Center",
  "Dela Paz Community Learning Center",
  "Dolores Community Learning Center",
  "Ligtasan Community Learning Center",
  "Maligaya Community Learning Center",
  "Maliwalo Community Learning Center",
  "Mapalacsiao Community Learning Center",
  "Matatalaib Community Learning Center",
  "San Isidro Community Learning Center",
  "San Jose Community Learning Center",
  "San Jose De Urquico Community Learning Center",
  "San Juan Bautista Community Learning Center",
  "San Juan De Mata Community Learning Center",
  "San Luis Community Learning Center",
  "San Manuel Community Learning Center",
  "San Miguel Community Learning Center",
  "San Nicolas Community Learning Center",
  "San Pablo Community Learning Center",
  "San Pascual Community Learning Center",
  "San Rafael Community Learning Center",
  "San Roque ECC Community Learning Center",
  "San Roque TWCES Community Learning Center"
];

export const TEACHERS_LIST = [
  "MELODY ANNE B. AQUINO",
  "MERVIN C. CALDOZA",
  "ANGELICA G. CANLAS",
  "RANIELLE PAOLO D. CAPIENDO",
  "RUSSEL M. DIONISIO",
  "REYNALDO M. DOMINGO JR.",
  "JENNY I. DUEÑAS",
  "CELESTE R. ESPINOSA",
  "ANTONIO B. GUBAN",
  "ARNOLD T. LUMBA",
  "JENNILYN D. MARTINEZ",
  "JUMAR M. MENDOZA",
  "RICARDO S. MORALES",
  "JULIUS C. PANGILINAN",
  "MARIELLA A. PORNILLOSA",
  "HEIZEL P. PANGILINAN",
  "RAMIL H. VALENTINO",
  "JOEL D. BAQUING",
  "JOHN L. ABAD",
  "MA. MONIQUE A. FRANCISCO",
  "JANICE J. GAMIS",
  "CINDY M. VALETE"
];

const SOURCE_OF_PROPERTY_LIST = [
  "DepEd Central Office Provision",
  "DepEd Division Office Allocation",
  "SEF (Special Education Fund)",
  "LGU Donation (Tarlac City)",
  "Rotary Club of Tarlac Donation",
  "PTA Contribution",
  "Stakeholder / Private Donor Support",
  "School Maintenance and Other Operating Expenses (MOOE)"
];

const SEED_PPE_ITEMS: PPEItem[] = [
  {
    id: 'ppe-1',
    itemNo: '1',
    article: 'SAMSUNG LED Smart TV 55"',
    uacsCode: '5020301000',
    description: 'SAMSUNG Crystal UHD 4K Smart TV for interactive audio-visual learning sessions',
    subsidiaryLedger: 'Property and Equipment - ICT Equipment',
    propertyNumber: 'DEPED-TCSD-ALS-2026-0081',
    dateAcquired: '2026-02-12',
    quantity: 2,
    unit: 'Units',
    clc: 'Alvindia Community Learning Center',
    schoolYear: '2025-2026',
    sourceOfProperty: 'DepEd Central Office Provision',
    remarks: 'Operational - Brand New',
    auditedBy: 'Melody Anne B. Aquino'
  },
  {
    id: 'ppe-2',
    itemNo: '2',
    article: 'Epson L3210 EcoTank Printer',
    uacsCode: '5020301001',
    description: 'Epson 3-in-1 print/copy/scan ink tank printer for modular worksheets printing',
    subsidiaryLedger: 'Property and Equipment - Office Equipment',
    propertyNumber: 'DEPED-TCSD-ALS-2025-0144',
    dateAcquired: '2025-09-18',
    quantity: 5,
    unit: 'Units',
    clc: 'Amucao Community Learning Center',
    schoolYear: '2025-2026',
    sourceOfProperty: 'SEF (Special Education Fund)',
    remarks: 'Operational - Excellent Condition',
    auditedBy: 'Mervin C. Caldoza'
  },
  {
    id: 'ppe-3',
    itemNo: '3',
    article: 'Plastic Monobloc Chairs & Folding Tables set',
    uacsCode: '5020301002',
    description: 'Heavy-duty plastic chairs (red/blue) and study tables for mobile learners',
    subsidiaryLedger: 'Furniture & Fixtures',
    propertyNumber: 'DEPED-TCSD-ALS-2025-0520',
    dateAcquired: '2025-10-05',
    quantity: 60,
    unit: 'Sets',
    clc: 'Asturias Community Learning Center',
    schoolYear: '2025-2026',
    sourceOfProperty: 'LGU Donation (Tarlac City)',
    remarks: 'Operational - Complete in Hubs',
    auditedBy: 'Angelica G. Canlas'
  },
  {
    id: 'ppe-4',
    itemNo: '4',
    article: 'Acer TravelMate Laptop Business',
    uacsCode: '5020301003',
    description: 'Intel Core i5, 8GB RAM, 256GB SSD laptop with Windows 11 for mobile tutors',
    subsidiaryLedger: 'Property and Equipment - ICT Equipment',
    propertyNumber: 'DEPED-TCSD-ALS-2026-0095',
    dateAcquired: '2026-01-14',
    quantity: 3,
    unit: 'Units',
    clc: 'Ligtasan Community Learning Center',
    schoolYear: '2025-2026',
    sourceOfProperty: 'DepEd Division Office Allocation',
    remarks: 'Operational - Issued under custody of mobile teachers',
    auditedBy: 'Ranielle Paolo D. Capiendo'
  },
  {
    id: 'ppe-5',
    itemNo: '5',
    article: 'Whiteboard Mobile Magnetic 4x3ft',
    uacsCode: '5020301015',
    description: 'Double-sided magnetic whiteboard on rolling stand lockable casters',
    subsidiaryLedger: 'Furniture & Fixtures',
    propertyNumber: 'DEPED-TCSD-ALS-2024-1104',
    dateAcquired: '2024-11-04',
    quantity: 4,
    unit: 'Units',
    clc: 'Maliwalo Community Learning Center',
    schoolYear: '2025-2026',
    sourceOfProperty: 'Rotary Club of Tarlac Donation',
    remarks: 'Excellent - Some markers stain',
    auditedBy: 'Russel M. Dionisio'
  }
];

export function PhysicalCountPropEquipView() {
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollTable = (direction: 'left' | 'right') => {
    if (tableContainerRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      tableContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const [items, setItems] = useState<PPEItem[]>(() => {
    const saved = localStorage.getItem('tcsd_ppe_items');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seenIds = new Set();
          return parsed.map((item: any, idx: number) => {
            let itemId = item.id;
            if (!itemId || seenIds.has(itemId)) {
              itemId = `ppe-safe-${idx}-${Date.now()}`;
            }
            seenIds.add(itemId);
            return {
              ...item,
              id: itemId,
              clc: item.clc || item.teacher || CLCS_LIST[0],
              auditedBy: item.auditedBy || item.teacher || '',
              sourceOfProperty: item.sourceOfProperty || 'DepEd Division Office Allocation'
            };
          });
        }
      } catch (e) {
        return SEED_PPE_ITEMS;
      }
    }
    return SEED_PPE_ITEMS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('All');

  // Form Modal flags
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PPEItem | null>(null);

  // Form inputs state
  const [formItemNo, setFormItemNo] = useState('');
  const [formArticle, setFormArticle] = useState('');
  const [formUacsCode, setFormUacsCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSubsidiaryLedger, setFormSubsidiaryLedger] = useState('');
  const [formPropertyNumber, setFormPropertyNumber] = useState('');
  const [formDateAcquired, setFormDateAcquired] = useState('');
  const [formQuantity, setFormQuantity] = useState<number>(1);
  const [formUnit, setFormUnit] = useState('Units');
  const [formClc, setFormClc] = useState('');
  const [formSchoolYear, setFormSchoolYear] = useState('2025-2026');
  const [formSourceOfProperty, setFormSourceOfProperty] = useState('');
  const [formRemarks, setFormRemarks] = useState('Operational');
  const [formAuditedBy, setFormAuditedBy] = useState('');

  // State for Google Sheets syncing
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('tcsd_ppe_sync_last_time');
  });

  // Synchronize state
  useEffect(() => {
    safeSetJSON('tcsd_ppe_items', items);
  }, [items]);

  const handleSyncFromSheet = async (showNotification = true) => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sheets/fetch-physical-count-ppe');
      if (!response.ok) {
        throw new Error(`Server returned status code: ${response.status}`);
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setItems(result.data);
        const now = new Date().toLocaleString('en-US', { hour12: true, dateStyle: 'medium', timeStyle: 'short' });
        setLastSyncTime(now);
        safeSetItem('tcsd_ppe_sync_last_time', now);
        if (showNotification) {
          alert(`Successfully synchronized ${result.data.length} PPE physical count records from the live Google Sheet!`);
        }
      } else {
        throw new Error(result.error || 'Failed to fetch spreadsheet rows.');
      }
    } catch (err: any) {
      console.error('[PPE Sync failure]', err);
      if (showNotification) {
        alert(`Failed to sync from Google Sheet: ${err.message || err}`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync on mount if never synced
  useEffect(() => {
    if (!lastSyncTime) {
      handleSyncFromSheet(false).catch(() => {});
    }
  }, []);

  // Handle addition trigger
  const handleAddNewItem = () => {
    setEditingItem(null);
    setFormItemNo(String(items.length + 1));
    setFormArticle('');
    setFormUacsCode('5020301000');
    setFormDescription('');
    setFormSubsidiaryLedger('Property and Equipment - ICT Equipment');
    setFormPropertyNumber(`DEPED-TCSD-ALS-2026-${String(Math.floor(1000 + Math.random() * 9000))}`);
    setFormDateAcquired(new Date().toISOString().split('T')[0]);
    setFormQuantity(1);
    setFormUnit('Units');
    setFormClc(CLCS_LIST[0]);
    setFormSchoolYear('2025-2026');
    setFormSourceOfProperty(SOURCE_OF_PROPERTY_LIST[0]);
    setFormRemarks('Operational - Good Condition');
    setFormAuditedBy(TEACHERS_LIST[0]);
    setShowFormModal(true);
  };

  // Handle edit trigger
  const handleEditClick = (item: PPEItem) => {
    setEditingItem(item);
    setFormItemNo(item.itemNo);
    setFormArticle(item.article);
    setFormUacsCode(item.uacsCode);
    setFormDescription(item.description);
    setFormSubsidiaryLedger(item.subsidiaryLedger);
    setFormPropertyNumber(item.propertyNumber);
    setFormDateAcquired(item.dateAcquired);
    setFormQuantity(item.quantity);
    setFormUnit(item.unit);
    setFormClc(item.clc);
    setFormSchoolYear(item.schoolYear);
    setFormSourceOfProperty(item.sourceOfProperty || SOURCE_OF_PROPERTY_LIST[0]);
    setFormRemarks(item.remarks);
    setFormAuditedBy(item.auditedBy || TEACHERS_LIST[0]);
    setShowFormModal(true);
  };

  // Handle deletion trigger
  const handleDeleteClick = (id: string, name: string) => {
    if (window.confirm(`Are you absolutely sure you want to delete "${name}" from PPE Physical Count Registries?`)) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  // Handle default seeds reload
  const handleResetSeeds = () => {
    if (window.confirm('Reset Physical Count registries back to the original DepEd Division Property records?')) {
      setItems(SEED_PPE_ITEMS);
    }
  };

  // Handle save from modal
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formArticle.trim() || !formUacsCode.trim() || !formPropertyNumber.trim()) {
      alert('Please fill out all mandatory fields.');
      return;
    }

    if (editingItem) {
      setItems(prev => prev.map(item => item.id === editingItem.id ? {
        ...item,
        itemNo: formItemNo,
        article: formArticle,
        uacsCode: formUacsCode,
        description: formDescription,
        subsidiaryLedger: formSubsidiaryLedger,
        propertyNumber: formPropertyNumber,
        dateAcquired: formDateAcquired,
        quantity: Number(formQuantity),
        unit: formUnit,
        clc: formClc,
        schoolYear: formSchoolYear,
        sourceOfProperty: formSourceOfProperty,
        remarks: formRemarks,
        auditedBy: formAuditedBy
      } : item));
    } else {
      const newItem: PPEItem = {
        id: 'ppe-' + Date.now(),
        itemNo: formItemNo,
        article: formArticle,
        uacsCode: formUacsCode,
        description: formDescription,
        subsidiaryLedger: formSubsidiaryLedger,
        propertyNumber: formPropertyNumber,
        dateAcquired: formDateAcquired,
        quantity: Number(formQuantity),
        unit: formUnit,
        clc: formClc,
        schoolYear: formSchoolYear,
        sourceOfProperty: formSourceOfProperty,
        remarks: formRemarks,
        auditedBy: formAuditedBy
      };
      setItems(prev => [...prev, newItem]);
    }
    setShowFormModal(false);
  };

  // Computed materials
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return items.filter(item => {
      const matchesSearch = 
        item.article.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.propertyNumber.toLowerCase().includes(q) ||
        item.clc.toLowerCase().includes(q) ||
        (item.sourceOfProperty && item.sourceOfProperty.toLowerCase().includes(q)) ||
        item.remarks.toLowerCase().includes(q) ||
        item.uacsCode.includes(q) ||
        (item.auditedBy && item.auditedBy.toLowerCase().includes(q));
      const matchesTeacher = selectedTeacher === 'All' || (item.auditedBy && (
        item.auditedBy.toUpperCase() === selectedTeacher.toUpperCase() ||
        (selectedTeacher.toUpperCase() === 'HEIZEL P. PANGILINAN' && item.auditedBy.toUpperCase() === 'HEIZEL B. PUCATE')
      ));
      return matchesSearch && matchesTeacher;
    });
  }, [items, searchQuery, selectedTeacher]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
      {/* Upper header segment layout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-dashed border-slate-200">
        <div>
          <h3 className="font-extrabold text-[#002B6D] text-base flex items-center gap-2">
            <FileSpreadsheet className="w-5.5 h-5.5 text-indigo-600 hover:rotate-6 transition duration-200 animate-pulse" />
            Registry of Physical Count of Property, Plant, and Equipment
          </h3>
          <p className="text-slate-400 text-xs mt-0.5 leading-tight">
            Comprehensive audit registry for plant properties, functional learning equipment, digital tablets, and instructional infrastructure.
            {lastSyncTime && (
              <span className="text-[#002B6D] font-semibold ml-2">
                • Last sync: {lastSyncTime}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleSyncFromSheet(true)}
            disabled={isSyncing}
            className={`px-3 py-1.5 rounded-xl border border-[#002B6D]/20 text-[#002B6D] bg-blue-50/50 hover:bg-blue-50 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer ${isSyncing ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync with Sheet'}
          </button>
          <button
            onClick={handleResetSeeds}
            className="p-2 py-1.5 rounded-xl border border-slate-200 text-slate-550 bg-slate-50 hover:bg-slate-100 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Baseline
          </button>
          <a
            href="https://docs.google.com/spreadsheets/d/1asI7J_IPBG6nNkyMeVc1IQo8Y4O88kWYCaaavckyy_8/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#002B6D] text-white rounded-xl text-xs font-extrabold tracking-tight hover:bg-blue-800 transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Asset Record
          </a>
        </div>
      </div>

      {/* Grid search and toolbar filters */}
      <div className="mt-5 flex flex-col sm:flex-row gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-200/50 shadow-2xs">
        <div className="relative grow">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by article, property number, remarks or object codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs font-medium text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-705 cursor-pointer focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Teachers</option>
            {TEACHERS_LIST.map(teacher => (
              <option key={teacher} value={teacher}>
                {teacher}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table Interface Grid */}
      <div className="relative group/table mt-5 border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden">
        {/* Floating Left Smooth-Scrolling Arrow Slider */}
        <button
          type="button"
          onClick={() => scrollTable('left')}
          className="absolute left-3 top-[50%] -translate-y-1/2 z-20 p-3 bg-white hover:bg-[#002B6D] text-slate-700 hover:text-white border border-slate-200 shadow-md rounded-full opacity-0 group-hover/table:opacity-90 hover:opacity-100 transition-all focus:outline-none flex items-center justify-center cursor-pointer transform hover:scale-110 active:scale-95 duration-150 backdrop-blur-xs print:hidden"
          title="Scroll Left"
          aria-label="Scroll table left"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Floating Right Smooth-Scrolling Arrow Slider */}
        <button
          type="button"
          onClick={() => scrollTable('right')}
          className="absolute right-3 top-[50%] -translate-y-1/2 z-20 p-3 bg-white hover:bg-[#002B6D] text-slate-700 hover:text-white border border-slate-200 shadow-md rounded-full opacity-0 group-hover/table:opacity-90 hover:opacity-100 transition-all focus:outline-none flex items-center justify-center cursor-pointer transform hover:scale-110 active:scale-95 duration-150 backdrop-blur-xs print:hidden"
          title="Scroll Right"
          aria-label="Scroll table right"
        >
          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div ref={tableContainerRef} className="overflow-x-auto scrollbar-thin grow">
          <table className="w-full text-left border-collapse min-w-[1400px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-550 font-extrabold uppercase tracking-wider">
              <th className="py-3 px-3 w-[60px]">ITEM NO.</th>
              <th className="py-3 px-3 w-[150px]">ARTICLE</th>
              <th className="py-3 px-3 w-[110px]">UACS OBJECT CODE</th>
              <th className="py-3 px-4 w-[240px]">DESCRIPTION</th>
              <th className="py-3 px-3 w-[180px]">SUBSIDIARY LEDGER DESCRIPTION</th>
              <th className="py-3 px-3 w-[150px]">PROPERTY NUMBER</th>
              <th className="py-3 px-3 w-[100px]">DATE ACQUIRED</th>
              <th className="py-3 px-3 w-[80px]">QUANTITY</th>
              <th className="py-3 px-3 w-[60px]">UNIT</th>
              <th className="py-3 px-3 w-[180px]">COMMUNITY LEARNING CENTER</th>
              <th className="py-3 px-3 w-[110px]">SCHOOL YEAR UPDATED</th>
              <th className="py-3 px-3 w-[180px]">SOURCE</th>
              <th className="py-3 px-3 w-[130px]">REMARKS</th>
              <th className="py-3 px-3 w-[90px] text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {isSyncing && filteredItems.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-12 text-center text-slate-400 font-medium">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <RefreshCw className="w-8 h-8 text-[#002B6D] animate-spin" />
                    <p className="text-sm font-bold text-[#002B6D]">Synchronizing PPE Registries...</p>
                    <p className="text-[10.5px]">Fetching live property counts across all division Community Learning Centers...</p>
                  </div>
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-12 text-center text-slate-400 font-medium">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Package className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-bold">No property records listed matches</p>
                    <p className="text-[10.5px]">Clear the query text or insert a brand-new asset to begin auditing</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition duration-155 text-slate-800">
                  {/* ITEM NO. */}
                  <td className="py-3 px-3 font-mono font-bold text-slate-400">
                    {item.itemNo}
                  </td>

                  {/* ARTICLE */}
                  <td className="py-3 px-3">
                    <p className="font-extrabold text-slate-900 leading-snug">{item.article}</p>
                  </td>

                  {/* UACS OBJECT CODE */}
                  <td className="py-3 px-3 font-mono font-bold text-[10.5px] text-slate-650">
                    {item.uacsCode}
                  </td>

                  {/* DESCRIPTION */}
                  <td className="py-3 px-4 text-slate-600 leading-relaxed max-w-[240px] truncate" title={item.description}>
                    {item.description}
                  </td>

                  {/* SUBSIDIARY LEDGER */}
                  <td className="py-3 px-3 text-slate-550 font-medium">
                    {item.subsidiaryLedger}
                  </td>

                  {/* PROPERTY NUMBER */}
                  <td className="py-3 px-3 font-mono text-[10.5px] font-bold text-indigo-950">
                    {item.propertyNumber}
                  </td>

                  {/* DATE ACQUIRED */}
                  <td className="py-3 px-3 text-slate-500 font-semibold font-mono whitespace-nowrap">
                    {item.dateAcquired}
                  </td>

                  {/* QUANTITY */}
                  <td className="py-3 px-3 font-mono font-bold text-slate-850">
                    {item.quantity}
                  </td>

                  {/* UNIT */}
                  <td className="py-3 px-3 text-slate-500">
                    {item.unit}
                  </td>

                  {/* COMMUNITY LEARNING CENTER */}
                  <td className="py-3 px-3 font-bold text-[#002B6D]">
                    <div>{item.clc}</div>
                    {item.auditedBy && (
                      <div className="text-[10px] text-indigo-600/80 font-extrabold mt-0.5 tracking-tight uppercase">Auditor: {item.auditedBy}</div>
                    )}
                  </td>

                  {/* SCHOOL YEAR */}
                  <td className="py-3 px-3 font-mono font-bold text-slate-500">
                    {item.schoolYear}
                  </td>

                  {/* SOURCE OF PROPERTY */}
                  <td className="py-3 px-3 font-semibold text-indigo-950">
                    {item.sourceOfProperty || 'DepEd Division Office Allocation'}
                  </td>

                  {/* REMARKS */}
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.remarks.toLowerCase().includes('brand new') || item.remarks.toLowerCase().includes('excellent')
                        ? 'bg-emerald-50 text-emerald-850 border border-emerald-100'
                        : item.remarks.toLowerCase().includes('repair') || item.remarks.toLowerCase().includes('missing')
                          ? 'bg-rose-50 text-rose-805 border border-rose-100'
                          : 'bg-indigo-50 text-[#002B6D] border border-indigo-100'
                    }`}>
                      {item.remarks}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="p-1 rounded-md border border-slate-200 text-slate-550 bg-white hover:bg-slate-550/10 transition cursor-pointer"
                        title="Edit entry"
                      >
                        <Edit2 className="w-3.2 h-3.2" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item.id, item.article)}
                        className="p-1 rounded-md border border-slate-200 text-rose-500 bg-white hover:bg-rose-50 transition cursor-pointer"
                        title="Remove entry"
                      >
                        <Trash2 className="w-3.2 h-3.2" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-150 flex flex-col sm:flex-row justify-between items-center text-[10.5px] text-slate-400 gap-2">
        <span>Registered inventory sums: <strong>{filteredItems.length}</strong> audited items on file</span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-505" /> Direct property mapping reports and ledger matching active.
        </span>
      </div>

      {/* Edit Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in text-slate-800">
            <div className="bg-[#002B6D] text-white p-4.5 px-6 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-black flex items-center gap-2 uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Edit Property physical audit details
                </h4>
                <p className="text-[10px] text-sky-200 mt-0.5">Maintain strict alignment to state property and classroom assets guidelines.</p>
              </div>
              <button 
                onClick={() => setShowFormModal(false)}
                className="text-slate-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Item No. / Sequence *
                  </label>
                  <input
                    type="text"
                    required
                    value={formItemNo}
                    onChange={(e) => setFormItemNo(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Article name / Name of Item *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acer Aspire 3 Dual Core"
                    value={formArticle}
                    onChange={(e) => setFormArticle(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    UACS Object Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5020301000"
                    value={formUacsCode}
                    onChange={(e) => setFormUacsCode(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Property Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DEPED-TCSD-ALS-2026-09"
                    value={formPropertyNumber}
                    onChange={(e) => setFormPropertyNumber(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  Item Description Details
                </label>
                <textarea
                  placeholder="e.g. Intel Core i3 laptop, issued with charging brick and mouse..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Subsidiary Ledger Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Property & Equipment - ICT"
                    value={formSubsidiaryLedger}
                    onChange={(e) => setFormSubsidiaryLedger(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Date Acquired *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDateAcquired}
                    onChange={(e) => setFormDateAcquired(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Unit Type *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Units, Sets, Copies"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    School Year *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2025-2026"
                    value={formSchoolYear}
                    onChange={(e) => setFormSchoolYear(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Community Learning Center (CLC) *
                  </label>
                  <select
                    value={formClc}
                    onChange={(e) => setFormClc(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white focus:ring-1 focus:ring-indigo-500"
                  >
                    {CLCS_LIST.map(clc => (
                      <option key={clc} value={clc}>
                        {clc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Source of Property *
                  </label>
                  <select
                    value={formSourceOfProperty}
                    onChange={(e) => setFormSourceOfProperty(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white focus:ring-1 focus:ring-indigo-500"
                  >
                    {SOURCE_OF_PROPERTY_LIST.map(source => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Audited By Teacher *
                  </label>
                  <select
                    value={formAuditedBy}
                    onChange={(e) => setFormAuditedBy(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white focus:ring-1 focus:ring-indigo-500"
                  >
                    {TEACHERS_LIST.map(teacher => (
                      <option key={teacher} value={teacher}>
                        {teacher}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Remarks / Status Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Operational - Brand New"
                    value={formRemarks}
                    onChange={(e) => setFormRemarks(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 border border-slate-200 rounded-xl bg-white hover:bg-slate-550/10 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold text-white bg-[#002B6D] hover:bg-blue-800 rounded-xl transition cursor-pointer shadow-xs"
                >
                  Save Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
