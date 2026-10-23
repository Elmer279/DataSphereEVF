/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { safeSetJSON, safeSetItem } from '../utils/safeStorage';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Sparkles,
  Calendar,
  RotateCcw,
  RefreshCw,
  BookMarked,
  Layers3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export interface LearningMaterialItem {
  id: string;
  itemNumber: string;
  level: string;
  uacsCode: string;
  article: string;
  titleDescription: string;
  propertyNumber: string;
  dateAcquired: string;
  quantity: number;
  unit: string;
  clc: string;
  schoolYearUpdated: string;
  remarks: string;
  auditedBy?: string;
}

const LEVELS_LIST = [
  "Basic Literacy Program (BLP)",
  "A&E Elementary",
  "A&E Junior High School",
  "A&E Senior High School"
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

const SEED_LM_ITEMS: LearningMaterialItem[] = [
  {
    id: 'lm-1',
    itemNumber: 'LM-001',
    level: 'A&E Elementary',
    uacsCode: '5020311501',
    article: 'Worksheets Modules Set A',
    titleDescription: 'ALS K-12 Curriculum Modules: Developing English Speaking and Writing proficiency (A&E Elementary)',
    propertyNumber: 'DEPED-ALS-LM-2025-201',
    dateAcquired: '2025-07-20',
    quantity: 150,
    unit: 'Copies',
    clc: 'Tarlac City Central CLC',
    schoolYearUpdated: '2025-2026',
    remarks: 'In Stock - Issued to active enrollees'
  },
  {
    id: 'lm-2',
    itemNumber: 'LM-002',
    level: 'A&E Junior High School',
    uacsCode: '5020311502',
    article: 'Science and the Environment Textbook',
    titleDescription: 'Module 2: Exploring Ecosystems and Climate Change Adaptation Handbook',
    propertyNumber: 'DEPED-ALS-LM-2025-202',
    dateAcquired: '2025-08-11',
    quantity: 200,
    unit: 'Copies',
    clc: 'Maliwalo Outreach CLC',
    schoolYearUpdated: '2025-2026',
    remarks: 'In Stock - Good condition'
  },
  {
    id: 'lm-3',
    itemNumber: 'LM-003',
    level: 'Basic Literacy Program (BLP)',
    uacsCode: '5020311503',
    article: 'Functional Math Workbook Series',
    titleDescription: 'Workbook Vol 1: Basic Operations, Business Finance and Cooperative Computation',
    propertyNumber: 'DEPED-ALS-LM-2026-012',
    dateAcquired: '2026-02-01',
    quantity: 120,
    unit: 'Copies',
    clc: 'Ligtasan Outreach CLC',
    schoolYearUpdated: '2025-2026',
    remarks: 'Brand New - Distributed'
  },
  {
    id: 'lm-4',
    itemNumber: 'LM-004',
    level: 'A&E Junior High School',
    uacsCode: '5020311504',
    article: 'Entrepreneurship and Livelihood Guide',
    titleDescription: 'ALS Livelihood Skill Booklet: Setup of Home-based Micro Enterprise Ecosystems',
    propertyNumber: 'DEPED-ALS-LM-2025-305',
    dateAcquired: '2025-11-05',
    quantity: 180,
    unit: 'Copies',
    clc: 'San Roque Barangay CLC',
    schoolYearUpdated: '2025-2026',
    remarks: 'In Stock'
  },
  {
    id: 'lm-5',
    itemNumber: 'LM-005',
    level: 'A&E Junior High School',
    uacsCode: '5020311505',
    article: 'Citizenship and Civic Duties Module',
    titleDescription: 'Module 1: Human Rights, local laws and community engagement standards under TCSD boundaries',
    propertyNumber: 'DEPED-ALS-LM-2025-412',
    dateAcquired: '2025-10-14',
    quantity: 160,
    unit: 'Copies',
    clc: 'Tibag Barangay CLC',
    schoolYearUpdated: '2025-2026',
    remarks: 'Operational'
  }
];

export function PhysicalCountLearningMaterialsView() {
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollTable = (direction: 'left' | 'right') => {
    if (tableContainerRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      tableContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const [items, setItems] = useState<LearningMaterialItem[]>(() => {
    const saved = localStorage.getItem('tcsd_learning_materials_count');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seenIds = new Set();
          return parsed.map((item: any, idx: number) => {
            let itemId = item.id;
            if (!itemId || seenIds.has(itemId)) {
              itemId = `lm-safe-${idx}-${Date.now()}`;
            }
            seenIds.add(itemId);
            return {
              ...item,
              id: itemId,
              level: item.level || item.teacher || LEVELS_LIST[0],
              auditedBy: item.auditedBy || item.teacher || '',
              schoolYearUpdated: item.schoolYearUpdated || item.schoolYear || '2025-2026'
            };
          });
        }
      } catch (e) {
        return SEED_LM_ITEMS;
      }
    }
    return SEED_LM_ITEMS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('All');

  // State for Google Sheets syncing
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('tcsd_lm_sync_last_time');
  });

  const handleSyncFromSheet = async (showNotification = true) => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sheets/fetch-physical-count-learning-materials');
      if (!response.ok) {
        throw new Error(`Server returned status code: ${response.status}`);
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setItems(result.data);
        const now = new Date().toLocaleString('en-US', { hour12: true, dateStyle: 'medium', timeStyle: 'short' });
        setLastSyncTime(now);
        safeSetItem('tcsd_lm_sync_last_time', now);
        if (showNotification) {
          alert(`Successfully synchronized ${result.data.length} learning materials physical count records from the live Google Sheet!`);
        }
      } else {
        throw new Error(result.error || 'Failed to fetch spreadsheet rows.');
      }
    } catch (err: any) {
      console.error('[Learning Materials Sync failure]', err);
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

  // Form Modal triggers
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<LearningMaterialItem | null>(null);

  // Form properties state
  const [formItemNumber, setFormItemNumber] = useState('');
  const [formLevel, setFormLevel] = useState('');
  const [formUacsCode, setFormUacsCode] = useState('');
  const [formArticle, setFormArticle] = useState('');
  const [formTitleDescription, setFormTitleDescription] = useState('');
  const [formPropertyNumber, setFormPropertyNumber] = useState('');
  const [formDateAcquired, setFormDateAcquired] = useState('');
  const [formQuantity, setFormQuantity] = useState<number>(1);
  const [formUnit, setFormUnit] = useState('Copies');
  const [formClc, setFormClc] = useState('');
  const [formSchoolYearUpdated, setFormSchoolYearUpdated] = useState('2025-2026');
  const [formRemarks, setFormRemarks] = useState('In Stock');
  const [formAuditedBy, setFormAuditedBy] = useState('');

  // Persistance loop
  useEffect(() => {
    safeSetJSON('tcsd_learning_materials_count', items);
  }, [items]);

  // Open modal trigger - Add mode
  const handleAddNewItem = () => {
    setEditingItem(null);
    setFormItemNumber(`LM-${String(items.length + 1).padStart(3, '0')}`);
    setFormLevel(LEVELS_LIST[0]);
    setFormUacsCode('5020311501');
    setFormArticle('');
    setFormTitleDescription('');
    setFormPropertyNumber(`DEPED-ALS-LM-2026-${String(Math.floor(100 + Math.random() * 900))}`);
    setFormDateAcquired(new Date().toISOString().split('T')[0]);
    setFormQuantity(100);
    setFormUnit('Copies');
    setFormClc('Tarlac City Central CLC');
    setFormSchoolYearUpdated('2025-2026');
    setFormRemarks('In Stock - Good condition');
    setFormAuditedBy(TEACHERS_LIST[0]);
    setShowFormModal(true);
  };

  // Open modal trigger - Edit mode
  const handleEditClick = (item: LearningMaterialItem) => {
    setEditingItem(item);
    setFormItemNumber(item.itemNumber);
    setFormLevel(item.level);
    setFormUacsCode(item.uacsCode);
    setFormArticle(item.article);
    setFormTitleDescription(item.titleDescription);
    setFormPropertyNumber(item.propertyNumber);
    setFormDateAcquired(item.dateAcquired);
    setFormQuantity(item.quantity);
    setFormUnit(item.unit);
    setFormClc(item.clc);
    setFormSchoolYearUpdated(item.schoolYearUpdated);
    setFormRemarks(item.remarks);
    setFormAuditedBy(item.auditedBy || TEACHERS_LIST[0]);
    setShowFormModal(true);
  };

  // Delete handler
  const handleDeleteClick = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete instructional material record "${name}"?`)) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  // Reset baseline handles
  const handleResetSeeds = () => {
    if (window.confirm('Reset materials inventory counts back to original Division level entries?')) {
      setItems(SEED_LM_ITEMS);
    }
  };

  // Form save logic
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formArticle.trim() || !formTitleDescription.trim() || !formPropertyNumber.trim()) {
      alert('Please fill out all mandatory fields.');
      return;
    }

    if (editingItem) {
      setItems(prev => prev.map(item => item.id === editingItem.id ? {
        ...item,
        itemNumber: formItemNumber,
        level: formLevel,
        uacsCode: formUacsCode,
        article: formArticle,
        titleDescription: formTitleDescription,
        propertyNumber: formPropertyNumber,
        dateAcquired: formDateAcquired,
        quantity: Number(formQuantity),
        unit: formUnit,
        clc: formClc,
        schoolYearUpdated: formSchoolYearUpdated,
        remarks: formRemarks,
        auditedBy: formAuditedBy
      } : item));
    } else {
      const newItem: LearningMaterialItem = {
        id: 'lm-' + Date.now(),
        itemNumber: formItemNumber,
        level: formLevel,
        uacsCode: formUacsCode,
        article: formArticle,
        titleDescription: formTitleDescription,
        propertyNumber: formPropertyNumber,
        dateAcquired: formDateAcquired,
        quantity: Number(formQuantity),
        unit: formUnit,
        clc: formClc,
        schoolYearUpdated: formSchoolYearUpdated,
        remarks: formRemarks,
        auditedBy: formAuditedBy
      };
      setItems(prev => [...prev, newItem]);
    }
    setShowFormModal(false);
  };

  // Computes search + filtration
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return items.filter(item => {
      const matchesSearch = 
        item.article.toLowerCase().includes(q) ||
        item.titleDescription.toLowerCase().includes(q) ||
        item.propertyNumber.toLowerCase().includes(q) ||
        item.clc.toLowerCase().includes(q) ||
        item.level.toLowerCase().includes(q) ||
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
      {/* Table section upper title and utilities */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-dashed border-slate-200">
        <div>
          <h3 className="font-extrabold text-[#002B6D] text-base flex items-center gap-2">
            <BookMarked className="w-5.5 h-5.5 text-indigo-600 hover:rotate-6 transition duration-200" />
            Registry of Physical Count of Learning Materials
          </h3>
          <p className="text-slate-400 text-xs mt-0.5 leading-tight">
            Comprehensive ledger tracking educational text manuals, LS modules, study worksheets, and instructional materials count.
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
            href="https://docs.google.com/spreadsheets/d/1bSRpXpAeMLHulv4m_zK4WCsruli5BJhslZfQwRsZf58/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#002B6D] text-white rounded-xl text-xs font-extrabold tracking-tight hover:bg-blue-800 transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Learning Material
          </a>
        </div>
      </div>

      {/* Filter and query elements */}
      <div className="mt-5 flex flex-col sm:flex-row gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-200/50 shadow-2xs">
        <div className="relative grow">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search learning materials by title, item code, level or CLCs..."
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
            <option value="All">ALL TEACHERS</option>
            {TEACHERS_LIST.map(teacher => (
              <option key={teacher} value={teacher}>
                {teacher}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main spreadsheet representation display */}
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
          <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-550 font-extrabold uppercase tracking-wider">
              <th className="py-3 px-3 w-[120px]">ITEM NUMBER</th>
              <th className="py-3 px-3 w-[180px]">LEVEL</th>
              <th className="py-3 px-3 w-[110px]">UACS OBJECT CODE</th>
              <th className="py-3 px-3 w-[160px]">ARTICLE</th>
              <th className="py-3 px-4 w-[280px]">TITLE/DESCRIPTION<br /><span className="text-[9px] normal-case font-normal text-slate-400">( Details of Instructional Materials)</span></th>
              <th className="py-3 px-3 w-[150px]">PROPERTY NUMBER</th>
              <th className="py-3 px-3 w-[100px]">DATE ACQUIRED</th>
              <th className="py-3 px-3 w-[80px]">QUANTITY</th>
              <th className="py-3 px-3 w-[60px]">UNIT</th>
              <th className="py-3 px-3 w-[160px]">COMMUNITY LEARNING CENTER</th>
              <th className="py-3 px-3 w-[95px]">SCHOOL YEAR UPDATED</th>
              <th className="py-3 px-3 w-[130px]">REMARKS</th>
              <th className="py-3 px-3 w-[90px] text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-12 text-center text-slate-400 font-medium">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Layers3 className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-bold">No educational materials matched filters</p>
                    <p className="text-[10.5px]">Clear the query text or add custom entries to begin physical counts tracking</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition duration-155 text-slate-800">
                  {/* ITEM NUMBER */}
                  <td className="py-3.5 px-3 font-mono font-bold text-slate-550">
                    {item.itemNumber}
                  </td>

                  {/* LEVEL */}
                  <td className="py-3.5 px-3">
                    <span className="text-xs font-bold text-indigo-950 leading-tight block">
                      {item.level}
                    </span>
                  </td>

                  {/* UACS OBJECT CODE */}
                  <td className="py-3.5 px-3 font-mono font-bold text-[10.5px] text-slate-450">
                    {item.uacsCode}
                  </td>

                  {/* ARTICLE */}
                  <td className="py-3.5 px-3 font-bold text-slate-900 leading-snug">
                    {item.article}
                  </td>

                  {/* TITLE DESCRIPTION */}
                  <td className="py-3.5 px-4 text-slate-600 leading-relaxed max-w-[280px]" title={item.titleDescription}>
                    {item.titleDescription}
                  </td>

                  {/* PROPERTY NUMBER */}
                  <td className="py-3.5 px-3 font-mono font-semibold text-[10.5px] text-slate-700">
                    {item.propertyNumber}
                  </td>

                  {/* DATE ACQUIRED */}
                  <td className="py-3.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {item.dateAcquired}
                  </td>

                  {/* QUANTITY */}
                  <td className="py-3.5 px-3 font-mono font-bold text-slate-850">
                    {item.quantity}
                  </td>

                  {/* UNIT */}
                  <td className="py-3.5 px-3 text-slate-450">
                    {item.unit}
                  </td>

                  {/* COMMUNITY LEARNING CENTER */}
                  <td className="py-3.5 px-3 font-semibold text-slate-755">
                    <div>{item.clc}</div>
                    {item.auditedBy && (
                      <div className="text-[10px] text-indigo-600/80 font-extrabold mt-0.5 tracking-tight uppercase">Auditor: {item.auditedBy}</div>
                    )}
                  </td>

                  {/* SCHOOL YEAR UPDATED */}
                  <td className="py-3.5 px-3 font-mono font-bold text-slate-500">
                    {item.schoolYearUpdated}
                  </td>

                  {/* REMARKS */}
                  <td className="py-3.5 px-3">
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded px-2 py-0.5 text-[10px] font-bold">
                      {item.remarks}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="p-1 rounded-md border border-slate-200 text-slate-550 bg-white hover:bg-slate-550/10 transition cursor-pointer"
                        title="Edit material count"
                      >
                        <Edit2 className="w-3.2 h-3.2" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item.id, item.article)}
                        className="p-1 rounded-md border border-slate-200 text-rose-550 bg-white hover:bg-rose-50 transition cursor-pointer"
                        title="Remove material record"
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
        <span>Registered instructional count sums: <strong>{filteredItems.length}</strong> modules listed</span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-505" /> Dynamic local tracking with persistent store.
        </span>
      </div>

      {/* Edit Form Modal UI */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in text-slate-800">
            <div className="bg-[#002B6D] text-white p-4.5 px-6 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-black flex items-center gap-2 uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Edit Learning material entry
                </h4>
                <p className="text-[10px] text-sky-200 mt-0.5">Maintain continuous audit-trail accuracy under Division physical standards.</p>
              </div>
              <button 
                onClick={() => setShowFormModal(false)}
                className="text-slate-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Item Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LM-118"
                    value={formItemNumber}
                    onChange={(e) => setFormItemNumber(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Level *
                  </label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    {LEVELS_LIST.map(level => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
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
                    placeholder="e.g. 5020311501"
                    value={formUacsCode}
                    onChange={(e) => setFormUacsCode(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Article name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Worksheets Modules Set A"
                    value={formArticle}
                    onChange={(e) => setFormArticle(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  Title/Description (Details of Instructional Materials) *
                </label>
                <textarea
                  required
                  placeholder="Insert publication titles, handbook volumes, lesson coverage details..."
                  value={formTitleDescription}
                  onChange={(e) => setFormTitleDescription(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Property Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DEPED-ALS-LM-2025-201"
                    value={formPropertyNumber}
                    onChange={(e) => setFormPropertyNumber(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold font-mono focus:ring-1 focus:ring-indigo-500"
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
                    placeholder="e.g. Copies, Sets"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    School Year Updated *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2025-2026"
                    value={formSchoolYearUpdated}
                    onChange={(e) => setFormSchoolYearUpdated(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                    CLC (Hub)
                  </label>
                  <input
                    type="text"
                    required
                    value={formClc}
                    onChange={(e) => setFormClc(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Remarks / Audit State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. In Stock - Operational"
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
                  className="px-4 py-2 text-xs font-bold text-slate-550 border border-slate-200 rounded-xl bg-white hover:bg-slate-550/10 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold text-white bg-[#002B6D] hover:bg-blue-800 rounded-xl transition cursor-pointer shadow-xs"
                >
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
