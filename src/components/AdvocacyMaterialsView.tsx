/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { safeSetJSON } from '../utils/safeStorage';
import { 
  FileText, 
  Search, 
  Plus, 
  ExternalLink, 
  Copy, 
  Edit2, 
  Trash2, 
  X, 
  CheckCircle, 
  Sparkles,
  Layers,
  Calendar,
  User,
  RotateCcw
} from 'lucide-react';

export interface AdvocacyMaterial {
  id: string;
  title: string;
  advocacyType: string;
  link: string;
  dateDeveloped: string;
  developedBy: string;
  no?: string;
  sheetRowIndex?: number;
  timestamp?: string;
}

export const ADVOCACY_TYPES = [
  'Animated Explainers',
  'Audio Jingle',
  'Blog',
  'Brochure',
  'Flyer',
  'Handout Guide',
  'Infographic',
  'Poster/Banner',
  'Presentation Slide',
  'Social Media Post',
  'Tarpaulin',
  'Testimonials',
  'Video'
];

export const DEVELOPED_BY_AUTHORS = [
  'Melody Anne B. Aquino',
  'Mervin C. Caldoza',
  'Angelica G. Canlas',
  'Ranielle Paolo D. Capiendo',
  'Russel M. Dionisio',
  'Reynaldo M. Domingo Jr.',
  'Jenny I. Dueñas',
  'Celeste R. Espinosa',
  'Antonio B. Guban',
  'Arnold T. Lumba',
  'Jennilyn D. Martinez',
  'Jumar M. Mendoza',
  'Ricardo S. Morales',
  'Julius C. Pangilinan',
  'Mariella A. Pornillosa',
  'Heizel B. Pucate',
  'Ramil H. Valentino',
  'Joel D. Baquing'
];

const SEED_ADVOCACY_MATERIALS: AdvocacyMaterial[] = [
  {
    id: 'adv-1',
    title: 'ALS Community Mobilization Flyer 2026',
    advocacyType: 'Flyer',
    link: 'https://depedtarlaccity.ph/als/advocacy/flyer2026.pdf',
    dateDeveloped: '2026-01-15',
    developedBy: 'Mrs. Maria Santos, EdD'
  },
  {
    id: 'adv-2',
    title: 'ALS Literacy Caravan Seminar Presentation Deck',
    advocacyType: 'Presentation Slide',
    link: 'https://depedtarlaccity.ph/als/advocacy/seminar-slides.pptx',
    dateDeveloped: '2025-11-04',
    developedBy: 'Mr. Juan Dela Cruz, LPT'
  },
  {
    id: 'adv-3',
    title: 'ALS Outstanding Graduates Success Stories video (AVP)',
    advocacyType: 'Video',
    link: 'https://youtube.com/watch?v=depedtarlac-als-success',
    dateDeveloped: '2025-12-10',
    developedBy: 'TCSD ALS Media & Tech Unit'
  },
  {
    id: 'adv-4',
    title: 'Tarlac City Depot Alternative Learning System Brochure (Expanded Edition)',
    advocacyType: 'Brochure',
    link: 'https://depedtarlaccity.ph/als/advocacy/als-brochure-expanded.pdf',
    dateDeveloped: '2026-02-20',
    developedBy: 'TCSD ALS Division Committee'
  },
  {
    id: 'adv-5',
    title: 'Community Mobilizer\'s Strategic Handbook for Brgy. Leaders',
    advocacyType: 'Handout Guide',
    link: 'https://depedtarlaccity.ph/als/advocacy/mobilizer-handbook.pdf',
    dateDeveloped: '2025-08-25',
    developedBy: 'Dr. Roberto Aquino, CESO V'
  },
  {
    id: 'adv-6',
    title: 'Social Mobilization FM Radio Spot Advisory Jingle',
    advocacyType: 'Audio Jingle',
    link: 'https://depedtarlaccity.ph/als/advocacy/radio-jingle.mp3',
    dateDeveloped: '2026-03-01',
    developedBy: 'Tarlac City Mobile Teachers Club'
  }
];

export function AdvocacyMaterialsView() {
  const [materials, setMaterials] = useState<AdvocacyMaterial[]>(() => {
    const saved = localStorage.getItem('tcsd_advocacy_materials');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse advocacy materials from cache, falling back to defaults", e);
      }
    }
    return SEED_ADVOCACY_MATERIALS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedAuthor, setSelectedAuthor] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<AdvocacyMaterial | null>(null);

  // Form Fields State
  const [formTitle, setFormTitle] = useState('');
  const [formAdvocacyType, setFormAdvocacyType] = useState('Animated Explainers');
  const [formLink, setFormLink] = useState('');
  const [formDateDeveloped, setFormDateDeveloped] = useState('');
  const [formDevelopedBy, setFormDevelopedBy] = useState('Melody Anne B. Aquino');

  // Integration States
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const ADVOCACY_SPREADSHEET_ID = '1McoLOyrv2CoSiGLnWMnLPaMGxKJ4usuZnmgRw17TmNk';
  const ADVOCACY_TAB_NAME = 'Advocacy Materials';

  // Fetch from Google Sheet via Dual-Sync Controller
  const fetchFromSheet = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch(`/api/advocacy/sync?_=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`Fetch failed with status ${response.status}`);
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.records)) {
        const parsedMaterials: AdvocacyMaterial[] = result.records.map((item: any) => ({
          id: item.record_id,
          no: item.payload.no,
          title: item.payload.title,
          advocacyType: item.payload.advocacyType,
          link: item.payload.link,
          dateDeveloped: item.payload.dateDeveloped,
          developedBy: item.payload.developedBy,
          timestamp: item.timestamp
        }));

        setMaterials(parsedMaterials);
        safeSetJSON('tcsd_advocacy_materials', parsedMaterials);
        
        if (result.isFallback) {
          setErrorMsg(`Connected via offline fallback. To sync live, please share your Google Sheet with our secure engine email: datasphere-core-engine@gen-lang-client-0675008110.iam.gserviceaccount.com`);
        } else {
          setSyncSuccess(true);
          setTimeout(() => setSyncSuccess(false), 3000);
        }
      } else {
        throw new Error(result.error || 'Invalid sync response format');
      }
    } catch (err: any) {
      console.error('Failed to fetch from sheet, using cached data.', err);
      setErrorMsg(`Offline fallback active: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFromSheet();
  }, []);

  // Persist state
  useEffect(() => {
    safeSetJSON('tcsd_advocacy_materials', materials);
  }, [materials]);

  // Unique list of advocacy types for filtering
  const allTypes = useMemo(() => {
    return ['All', ...ADVOCACY_TYPES];
  }, []);

  // Handle link copy to clipboard
  const handleCopyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Open modal for adding
  const handleAddClick = () => {
    setEditingMaterial(null);
    setFormTitle('');
    setFormAdvocacyType('Animated Explainers');
    setFormLink('');
    setFormDateDeveloped(new Date().toISOString().split('T')[0]);
    setFormDevelopedBy('Melody Anne B. Aquino');
    setShowFormModal(true);
  };

  // Helper to format date for HTML5 date input (expects YYYY-MM-DD)
  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return '';
    // If already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    
    // Try parsing M/D/YYYY or MM/DD/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      let month = parts[0];
      let day = parts[1];
      let year = parts[2];
      if (month.length === 1) month = '0' + month;
      if (day.length === 1) day = '0' + day;
      if (year.length === 2) year = '20' + year; // handle 2-digit years
      return `${year}-${month}-${day}`;
    }
    
    // General parser fallback
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
    } catch (e) {}
    return dateStr;
  };

  // Open modal for editing
  const handleEditClick = (mat: AdvocacyMaterial) => {
    setEditingMaterial(mat);
    setFormTitle(mat.title);
    setFormAdvocacyType(mat.advocacyType);
    setFormLink(mat.link);
    setFormDateDeveloped(formatDateForInput(mat.dateDeveloped));
    setFormDevelopedBy(mat.developedBy);
    setShowFormModal(true);
  };

  // Handle delete via Dual-Sync Controller
  const handleDeleteClick = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the advocacy material "${name}"?`)) {
      return;
    }

    const targetMaterial = materials.find(m => m.id === id);
    if (!targetMaterial) return;

    // Send DELETE action to controller
    const currentTimestamp = new Date().toISOString();
    const syncPayload = {
      record_id: id,
      action: 'DELETE',
      source: 'FRONTEND',
      payload: {
        no: targetMaterial.no || '',
        title: targetMaterial.title,
        advocacyType: targetMaterial.advocacyType,
        link: targetMaterial.link,
        dateDeveloped: targetMaterial.dateDeveloped,
        developedBy: targetMaterial.developedBy
      },
      last_updated: currentTimestamp,
      timestamp: currentTimestamp
    };

    try {
      const response = await fetch('/api/advocacy/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(syncPayload)
      });

      if (!response.ok) {
        throw new Error(`Sync request failed with status ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setMaterials(prev => prev.filter(m => m.id !== id));
        alert('Success! The advocacy material has been deleted from local storage and updated on the Google Sheet.');
        fetchFromSheet();
      } else {
        throw new Error(result.error || 'Failed to sync delete with controller');
      }
    } catch (err: any) {
      console.error('Failed to sync delete, removing locally.', err);
      setMaterials(prev => prev.filter(m => m.id !== id));
      alert(`Record deleted locally (offline fallback): ${err.message || err}`);
    }
  };

  // Save Add/Edit form submission via Dual-Sync Controller
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formLink.trim() || !formDevelopedBy.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);

    // Conflict Resolution: set current timestamp in ISO format
    const currentTimestamp = new Date().toISOString();
    const action = editingMaterial ? 'UPDATE' : 'CREATE';
    const recId = editingMaterial ? editingMaterial.id : `adv-${Date.now()}`;
    
    // Create new No. if creating
    let newNo = '';
    if (!editingMaterial) {
      const maxNo = materials.reduce((max, item) => {
        const num = parseInt(String(item.no || ''), 10);
        return !isNaN(num) && num > max ? num : max;
      }, 0);
      newNo = (maxNo + 1).toString();
    } else {
      newNo = editingMaterial.no || '1';
    }

    const syncPayload = {
      record_id: recId,
      action: action,
      source: 'FRONTEND',
      payload: {
        no: newNo,
        title: formTitle,
        advocacyType: formAdvocacyType,
        link: formLink,
        dateDeveloped: formDateDeveloped,
        developedBy: formDevelopedBy
      },
      last_updated: currentTimestamp,
      timestamp: currentTimestamp
    };

    try {
      const response = await fetch('/api/advocacy/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(syncPayload)
      });

      if (!response.ok) {
        throw new Error(`Sync request failed with status ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        // If sync accepted the update, update frontend local state
        const updatedMaterial: AdvocacyMaterial = {
          id: result.record_id,
          no: result.payload.no,
          title: result.payload.title,
          advocacyType: result.payload.advocacyType,
          link: result.payload.link,
          dateDeveloped: result.payload.dateDeveloped,
          developedBy: result.payload.developedBy,
          timestamp: result.timestamp
        };

        if (editingMaterial) {
          setMaterials(prev => prev.map(m => m.id === editingMaterial.id ? updatedMaterial : m));
          alert(result.synced ? 'Success! Advocacy record has been successfully updated on the Google Sheet.' : 'Advocacy record updated successfully in server local resilient storage! (Google Sheets direct sync is temporarily offline/restricted).');
        } else {
          setMaterials(prev => [...prev, updatedMaterial]);
          alert(result.synced ? 'Success! Advocacy record has been successfully saved to the Google Sheet.' : 'Advocacy record saved successfully to server local resilient storage! (Google Sheets direct sync is temporarily offline/restricted).');
        }
        fetchFromSheet();
      } else if (result.conflict) {
        alert(`Sync Conflict: ${result.message}`);
        fetchFromSheet();
      } else {
        throw new Error(result.error || 'Failed to sync with controller');
      }
    } catch (err: any) {
      console.error('Failed to sync via controller, applying local optimistic state.', err);
      // Local optimistic state fallback
      const fallbackMaterial: AdvocacyMaterial = {
        id: recId,
        no: newNo,
        title: formTitle,
        advocacyType: formAdvocacyType,
        link: formLink,
        dateDeveloped: formDateDeveloped,
        developedBy: formDevelopedBy,
        timestamp: currentTimestamp
      };

      if (editingMaterial) {
        setMaterials(prev => prev.map(m => m.id === editingMaterial.id ? fallbackMaterial : m));
      } else {
        setMaterials(prev => [...prev, fallbackMaterial]);
      }
      alert(`Record saved locally (offline fallback): ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
      setShowFormModal(false);
    }
  };

  // Filtered Advocacy Materials list
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        m.title.toLowerCase().includes(query) ||
        m.advocacyType.toLowerCase().includes(query) ||
        m.developedBy.toLowerCase().includes(query) ||
        m.link.toLowerCase().includes(query);
      const matchesType = selectedType === 'All' || m.advocacyType === selectedType;
      const matchesAuthor = selectedAuthor === 'All' || m.developedBy === selectedAuthor;
      return matchesSearch && matchesType && matchesAuthor;
    });
  }, [materials, searchQuery, selectedType, selectedAuthor]);

  // Badge Color Mapper
  const getBadgeClass = (type: string) => {
    const cleanType = type.toLowerCase();
    if (cleanType.includes('flyer')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (cleanType.includes('brochure')) return 'bg-sky-50 text-sky-700 border-sky-100';
    if (cleanType.includes('video') || cleanType.includes('avp')) return 'bg-violet-50 text-violet-700 border-violet-100';
    if (cleanType.includes('presentation') || cleanType.includes('slide')) return 'bg-amber-50 text-amber-700 border-amber-100';
    if (cleanType.includes('jingle')) return 'bg-rose-50 text-rose-700 border-rose-100';
    return 'bg-slate-50 text-slate-700 border-slate-100';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-dashed border-slate-200">
        <div>
          <h3 className="font-extrabold text-[#002B6D] text-base flex items-center gap-2">
            <FileText className="w-5.5 h-5.5 text-indigo-600 hover:rotate-6 transition duration-200" />
            List and Records of Advocacy Materials
          </h3>
          <p className="text-slate-400 text-xs mt-0.5 leading-tight">
            Repository of alternative learning resources, advocacy collateral, social media posters, and jingles for ALS deployment.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchFromSheet}
            disabled={isLoading}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 text-[#002B6D] hover:bg-slate-100 rounded-xl text-xs font-extrabold tracking-tight transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Syncing...' : 'Sync Sheet'}
          </button>
          <a
            href="https://docs.google.com/spreadsheets/d/1McoLOyrv2CoSiGLnWMnLPaMGxKJ4usuZnmgRw17TmNk/edit?usp=drive_link"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#002B6D] text-white rounded-xl text-xs font-extrabold tracking-tight hover:bg-blue-800 transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Advocacy Record
          </a>
        </div>
      </div>

      {/* Action Controls (Search & Filters) */}
      <div className="mt-5 flex flex-col sm:flex-row gap-3 shadow-xs bg-slate-50/50 p-3 rounded-xl border border-slate-200/50">
        <div className="relative grow">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search files, types or authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs text-slate-820 font-medium"
          />
        </div>

        {/* Sidebar Filtering Categories */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider hidden lg:inline">Type:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            {allTypes.map(type => (
              <option key={type} value={type}>
                {type === 'All' ? 'All Types' : type}
              </option>
            ))}
          </select>

          <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider hidden lg:inline">Author:</span>
          <select
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Authors</option>
            {DEVELOPED_BY_AUTHORS.map(author => (
              <option key={author} value={author}>
                {author}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sync Status Banner */}
      {(syncSuccess || errorMsg) && (
        <div className={`mt-3 px-4 py-2 rounded-lg text-[11px] font-bold flex items-center justify-between border ${
          errorMsg ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          <span className="flex items-center gap-1.5">
            {errorMsg ? (
              <>⚠️ {errorMsg}</>
            ) : (
              <>✓ Successfully connected and synchronized with "Advocacy and Social Mobilization" Google Sheet.</>
            )}
          </span>
          {errorMsg && (
            <button 
              onClick={fetchFromSheet}
              className="underline hover:text-amber-950 font-black cursor-pointer"
            >
              Retry Connection
            </button>
          )}
        </div>
      )}

      {/* Advocacy Materials Table */}
      <div className="mt-5 overflow-x-auto border border-slate-200 rounded-xl bg-white">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10.5px] text-slate-500 font-extrabold uppercase tracking-wider">
              <th className="py-3 px-4 w-[60px]">No.</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4 w-[160px]">Advocacy Type</th>
              <th className="py-3 px-4">Link</th>
              <th className="py-3 px-4 w-[130px]">Date Developed</th>
              <th className="py-3 px-4 w-[180px]">Developed by</th>
              <th className="py-3 px-4 w-[100px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredMaterials.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Layers className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-bold">No advocacy records found</p>
                    <p className="text-[10.5px]">Try refining your search text or database filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredMaterials.map((material, idx) => (
                <tr 
                  key={material.id ? `${material.id}-${idx}` : `advocacy-row-${idx}`} 
                  className="hover:bg-slate-50/50 transition duration-150 text-slate-800"
                >
                  {/* Column 1: No. */}
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                    {material.no || (idx + 1)}
                  </td>

                  {/* Column 2: Title */}
                  <td className="py-3.5 px-4">
                    <p className="font-extrabold text-slate-900 group-hover:text-indigo-950 text-xs">
                      {material.title}
                    </p>
                  </td>

                  {/* Column 3: Advocacy Type */}
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getBadgeClass(material.advocacyType)}`}>
                      {material.advocacyType}
                    </span>
                  </td>

                  {/* Column 4: Link */}
                  <td className="py-3.5 px-4 font-mono text-[10.5px]">
                    <div className="flex items-center gap-2">
                      <a 
                        href={material.link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[#002B6D] hover:text-blue-800 font-medium hover:underline truncate max-w-[200px] flex items-center gap-1 cursor-pointer"
                        title={material.link}
                      >
                        <ExternalLink className="w-3 h-3 text-sky-600 shrink-0" />
                        <span>Visit Resource</span>
                      </a>
                      <button
                        onClick={() => handleCopyLink(material.link, material.id)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition tracking-wide cursor-pointer flex items-center justify-center shrink-0"
                        title="Copy Link to Clipboard"
                      >
                        {copiedId === material.id ? (
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Column 5: Date Developed */}
                  <td className="py-3.5 px-4 text-slate-550 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{material.dateDeveloped}</span>
                    </div>
                  </td>

                  {/* Column 6: Developed by */}
                  <td className="py-3.5 px-4 text-slate-650 font-bold">
                    <div className="flex items-center gap-1.5 truncate max-w-[170px]" title={material.developedBy}>
                      <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{material.developedBy}</span>
                    </div>
                  </td>

                  {/* Column 7: Action Buttons */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEditClick(material)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-550 bg-white hover:bg-slate-50 hover:text-slate-800 transition cursor-pointer"
                        title="Edit Record"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(material.id, material.title)}
                        className="p-1.5 rounded-lg border border-slate-200 text-rose-500 bg-white hover:bg-rose-50 hover:border-rose-100 transition cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-[10.5px] text-slate-400">
        <span>Showing <strong>{filteredMaterials.length}</strong> of <strong>{materials.length}</strong> registered materials</span>
        <span className="flex items-center gap-1 opacity-90">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Managed dynamically with persistent state storage.
        </span>
      </div>

      {/* Insert / Edit Custom Modal Dialog */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-fade-in">
            {/* Modal Title */}
            <div className="bg-[#002B6D] text-white p-4.5 px-6 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-black flex items-center gap-2 uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  {editingMaterial ? 'Edit Advocacy Record' : 'Register New Advocacy Resource'}
                </h4>
                <p className="text-[10px] text-sky-200 tracking-wide mt-0.5">Please populate high fidelity properties for verification audits.</p>
              </div>
              <button 
                onClick={() => setShowFormModal(false)}
                className="text-slate-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10.5px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">
                  Title / Name of advocacy material *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Literacy Campaign Poster 2026"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10.5px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">
                    Advocacy Type *
                  </label>
                  <select
                    value={formAdvocacyType}
                    onChange={(e) => setFormAdvocacyType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    {ADVOCACY_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10.5px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">
                    Development Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDateDeveloped}
                    onChange={(e) => setFormDateDeveloped(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">
                  Resource Link / URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://depedtarlaccity.ph/als/advocacy/..."
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">
                  Developed by / Author name *
                </label>
                <select
                  required
                  value={formDevelopedBy}
                  onChange={(e) => setFormDevelopedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800"
                >
                  {!DEVELOPED_BY_AUTHORS.includes(formDevelopedBy) && formDevelopedBy !== '' && (
                    <option value={formDevelopedBy}>{formDevelopedBy}</option>
                  )}
                  {DEVELOPED_BY_AUTHORS.map(author => (
                    <option key={author} value={author}>{author}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 text-xs font-extrabold text-slate-550 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-extrabold text-white bg-[#002B6D] hover:bg-blue-800 rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
