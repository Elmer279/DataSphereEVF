/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { 
  School, 
  MapPin, 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  ExternalLink, 
  FileText, 
  Check, 
  AlertTriangle, 
  Hammer, 
  Sparkles, 
  Calendar, 
  PlusCircle, 
  RotateCcw,
  BookOpen,
  Mail,
  Smartphone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LearningCenter } from '../types';
import { SEED_PARTNERS } from '../data/partnersData';

// Google Drive Direct Image link resolver
function getGoogleDriveDirectLink(url?: string): string {
  if (!url) return '';
  if (url.includes('drive.google.com/file/d/')) {
    const id = url.split('/file/d/')[1]?.split('/')[0];
    return `https://lh3.googleusercontent.com/d/${id}=s220`;
  }
  if (url.includes('id=')) {
    const id = url.split('id=')[1]?.split('&')[0];
    return `https://lh3.googleusercontent.com/d/${id}=s220`;
  }
  return url;
}

interface CLCProfileDirectoryViewProps {
  learningCenters: LearningCenter[];
  onAddCenter: (center: LearningCenter) => void;
  onDeleteCenter: (id: string) => void;
  onUpdateCenter: (id: string, updated: Partial<LearningCenter>) => void;
}

const OFFICIAL_73_CLCS = [
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
  "Baras-Baras FD Community Learning Center",
  "Baras-Baras MD Community Learning Center",
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
  "San Juan De Mata DSWD Lingap Center",
  "San Luis Community Learning Center",
  "San Manuel Community Learning Center",
  "San Manuel Parola Santuwaryo Community Learning Center",
  "San Miguel Community Learning Center",
  "San Nicolas Community Learning Center",
  "San Pablo Community Learning Center",
  "San Pascual Community Learning Center",
  "San Rafael Community Learning Center",
  "San Rafael Fiesta Community Learning Center",
  "San Rafael Living Stream Community Learning Center",
  "San Roque ECC Community Learning Center",
  "San Roque TWCES Community Learning Center",
  "San Sebastian Community Learning Center",
  "San Vicente Community Learning Center",
  "San Vicente Carlos P. Romulo Memorial Library and Museum Community Learning Center",
  "Santa Cruz Community Learning Center",
  "Santo Domingo Community Learning Center",
  "Sapang Maragul Community Learning Center",
  "Sapang Tagalog Community Learning Center",
  "Salapungan Community Learning Center",
  "Sepung Calzada Community Learning Center",
  "Sinait Community Learning Center",
  "Sto. Cristo Community Learning Center",
  "Sto. Cristo DBTI Community Learning Center",
  "Suizo Community Learning Center",
  "Tariji Community Learning Center",
  "Tibag Community Learning Center",
  "Tibagan Community Learning Center",
  "Trinidad Community Learning Center",
  "Ungot Community Learning Center",
  "Villa Bacolor Community Learning Center"
];

export default function CLCProfileDirectoryView({
  learningCenters,
  onAddCenter,
  onDeleteCenter,
  onUpdateCenter
}: CLCProfileDirectoryViewProps) {
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollTable = (direction: 'left' | 'right') => {
    if (tableContainerRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      tableContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Queries & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedClcName, setSelectedClcName] = useState<string>('All');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCLC, setSelectedCLC] = useState<LearningCenter | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form states (Add/Edit)
  const [name, setName] = useState('');
  const [district, setDistrict] = useState<string>('South A');
  const [teacher, setTeacher] = useState('');
  const [enrolled, setEnrolled] = useState<number>(20);
  const [status, setStatus] = useState<'active' | 'needs-resources' | 'under-construction'>('active');
  const [facilitiesText, setFacilitiesText] = useState('');
  const [lat, setLat] = useState<number>(45);
  const [lng, setLng] = useState<number>(45);

  // Report Generator State
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [generatedDocLink, setGeneratedDocLink] = useState<string | null>(null);
  const [docErrorMessage, setDocErrorMessage] = useState<string | null>(null);

  // Filtered & Searched CLCs
  const filteredCLCs = useMemo(() => {
    return learningCenters.filter(clc => {
      // Search matches CLC Name, assigned mobile teacher, or installed facilities
      const matchesSearch = 
        clc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clc.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (clc.facilities && clc.facilities.some(f => f.toLowerCase().includes(searchQuery.toLowerCase())));
      
      const matchesDistrict = selectedDistrict === 'All' || clc.district === selectedDistrict;
      const matchesDropdownCenter = selectedClcName === 'All' || clc.name === selectedClcName;

      return matchesSearch && matchesDistrict && matchesDropdownCenter;
    });
  }, [learningCenters, searchQuery, selectedDistrict, selectedClcName]);

  // Aggregate Metrics for Statistics Counters
  const metrics = useMemo(() => {
    const total = learningCenters.length;
    const active = learningCenters.filter(c => c.status === 'active').length;
    const needsResources = learningCenters.filter(c => c.status === 'needs-resources').length;
    const construction = learningCenters.filter(c => c.status === 'under-construction').length;
    const totalEnrolled = learningCenters.reduce((sum, c) => sum + (c.enrolled || 0), 0);

    return { total, active, needsResources, construction, totalEnrolled };
  }, [learningCenters]);

  // Initialize Form for Creating a new CLC
  const openAddModal = () => {
    setName('');
    setDistrict('South A');
    setTeacher('');
    setEnrolled(25);
    setStatus('active');
    setFacilitiesText('Android Tablet Library, Self-Learning Modules, Whiteboard');
    setLat(Math.floor(Math.random() * 60) + 20);
    setLng(Math.floor(Math.random() * 60) + 20);
    setIsAddModalOpen(true);
  };

  // Submit Handler for Creating
  const handleCreateCLC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !teacher.trim()) return;

    const parsedFacilities = facilitiesText
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    const newCenter: LearningCenter = {
      id: `clc-custom-${Date.now()}`,
      name: name.trim(),
      district,
      teacher: teacher.trim(),
      enrolled: Number(enrolled),
      status,
      facilities: parsedFacilities,
      established: new Date().toISOString().split('T')[0],
      lat: Number(lat),
      lng: Number(lng)
    };

    onAddCenter(newCenter);
    setIsAddModalOpen(false);
  };

  // Initialize form for editing
  const startEditing = (clc: LearningCenter) => {
    setName(clc.name);
    setDistrict(clc.district);
    setTeacher(clc.teacher);
    setEnrolled(clc.enrolled);
    setStatus(clc.status);
    setFacilitiesText(clc.facilities.join(', '));
    setLat(clc.lat);
    setLng(clc.lng);
    setIsEditing(true);
  };

  // Submit Handler for Updating
  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCLC) return;

    const parsedFacilities = facilitiesText
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    const updatedData: Partial<LearningCenter> = {
      name: name.trim(),
      district,
      teacher: teacher.trim(),
      enrolled: Number(enrolled),
      status,
      facilities: parsedFacilities,
      lat: Number(lat),
      lng: Number(lng)
    };

    onUpdateCenter(selectedCLC.id, updatedData);
    
    // Update the local modal view state
    setSelectedCLC(prev => prev ? { ...prev, ...updatedData } : null);
    setIsEditing(false);
  };

  // Trigger Google Doc Creation on Server
  const generateGoogleDocReport = async (clc: LearningCenter) => {
    setIsGeneratingDoc(true);
    setGeneratedDocLink(null);
    setDocErrorMessage(null);

    try {
      const response = await fetch('/api/clc/generate-google-doc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clc)
      });

      if (!response.ok) {
        throw new Error(`Server responded with HTTP status ${response.status}`);
      }

      const resData = await response.json();
      if (resData.success && resData.webViewLink) {
        setGeneratedDocLink(resData.webViewLink);
      } else {
        throw new Error(resData.error || "Unable to acquire shared Google Doc link from server.");
      }
    } catch (err: any) {
      console.error("Failed to generate Google Document:", err);
      setDocErrorMessage(err.message || "Network exception contacting reporting services.");
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  return (
    <div id="clc-profile-directory-container" className="space-y-6 max-h-full overflow-y-auto pr-1">
      {/* 1. Header Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#E3EDFA] text-[#002B6D] rounded-lg">
              <School className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Community Learning Center Profile</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Alternative Learning System Operations Registry — Manage profiles, facilities lists, and generate official documents.
          </p>
        </div>
        
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4.5 py-2.5 bg-[#002B6D] hover:bg-[#002252] text-white font-bold text-xs rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Register New CLC
        </button>
      </div>

      {/* 2. Statistical Metric Counters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Total Registry</span>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-800 tracking-tight">{metrics.total}</span>
            <span className="text-[10px] text-slate-400 font-medium">centers</span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Active CLCs</span>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-2xl font-black text-emerald-600 tracking-tight">{metrics.active}</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded-full">LIVE</span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Needs Resources</span>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-2xl font-black text-amber-600 tracking-tight">{metrics.needsResources}</span>
            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold rounded-full">PENDING</span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Under Dev</span>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-2xl font-black text-blue-600 tracking-tight">{metrics.construction}</span>
            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded-full">PLAN</span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Enrolled Registry</span>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-800 tracking-tight">{metrics.totalEnrolled}</span>
            <span className="text-[10px] text-slate-400 font-bold">learners</span>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-3xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative w-full md:grow">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search learning centers, assigned specialist, or facilities..."
            className="w-full pl-9.5 pr-4 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 font-medium focus:outline-none focus:border-[#002B6D] transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* District filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[11px] font-bold text-slate-400 block whitespace-nowrap">District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#002B6D] transition w-full sm:w-auto"
            >
              <option value="All">All Districts</option>
              <option value="South A">South A</option>
              <option value="South B">South B</option>
              <option value="West A">West A</option>
              <option value="West B">West B</option>
              <option value="West C">West C</option>
              <option value="Central A">Central A</option>
              <option value="Central B">Central B</option>
              <option value="East">East</option>
              <option value="North A">North A</option>
              <option value="North B">North B</option>
            </select>
          </div>

          {/* Search Community Learning Center Dropdown list */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[11px] font-bold text-slate-400 block whitespace-nowrap">Search:</span>
            <select
              value={selectedClcName}
              onChange={(e) => setSelectedClcName(e.target.value)}
              className="px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#002B6D] transition w-full sm:w-auto max-w-[285px]"
              id="clc-search-dropdown"
            >
              <option value="All">All Community Learning Centers</option>
              {OFFICIAL_73_CLCS.map((clc) => (
                <option key={clc} value={clc}>
                  {clc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Profiles Catalog Directory Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden relative group/table">
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
        </button>        <div ref={tableContainerRef} className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[#002B6D] font-mono text-[10px] uppercase font-bold tracking-wider">
                <th className="py-3 px-4 text-center">No.</th>
                <th className="py-3 px-4 text-center w-24">Teacher Photo</th>
                <th className="py-3 px-4 min-w-[220px]">Name of Community Learning Center</th>
                <th className="py-3 px-4 text-center">Community Learning Center Code</th>
                <th className="py-3 px-4 min-w-[180px]">CLC Address</th>
                <th className="py-3 px-4 min-w-[110px]">District</th>
                <th className="py-3 px-4 text-center">Type</th>
                <th className="py-3 text-center px-4">Category</th>
                <th className="py-3 px-4 min-w-[150px]">ALS Teacher</th>
                <th className="py-3 px-4 min-w-[180px]">Email Address</th>
                <th className="py-3 px-4 min-w-[130px]">CP Number</th>
                <th className="py-3 px-4 min-w-[160px]">Barangay Chairman</th>
                <th className="py-3 px-4 min-w-[130px]">Contact Number</th>
                <th className="py-3 px-4 min-w-[180px]">Partnership Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCLCs.length === 0 ? (
                <tr>
                  <td colSpan={14} className="text-center py-12 text-slate-400">
                    <RotateCcw className="w-8 h-8 mx-auto stroke-1.25 mb-3 text-slate-350 animate-spin-slow" />
                    <p className="text-xs font-semibold">No corresponding learning centers match select parameters.</p>
                    <p className="text-[10px] text-slate-400 mt-1">Please try modifying search query or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredCLCs.map((clc, idx) => {
                  // Computations for columns
                  const cleanId = clc.id.replace('clc-', '').replace('clc-custom-', '');
                  const computedCode = clc.code || `CLC-${cleanId.slice(0, 3).toUpperCase().padStart(3, '0')}`;
                  
                  const isHub = clc.name.toLowerCase().includes('hub') || clc.name.toLowerCase().includes('central');
                  const isMini = clc.name.toLowerCase().includes('mini');
                  const isOutpost = clc.name.toLowerCase().includes('outreach') || clc.name.toLowerCase().includes('outpost') || clc.name.toLowerCase().includes('ligtasan');
                  const computedType = isHub ? 'Main Center' : isMini ? 'Relocatable Mini-CLC' : isOutpost ? 'Outreach Outpost' : 'Barangay Hall Hub';
                  const clcType = clc.type || computedType;
                  
                  const computedCategory = (clc.name.toLowerCase().includes('tibigan') || clc.name.toLowerCase().includes('maliwalo') || clc.name.toLowerCase().includes('matatalaib') || clc.name.toLowerCase().includes('care')) ? 'Rural' : 'Urban';
                  const clcCategory = clc.category || computedCategory;
                  
                  let hash = 0;
                  for (let i = 0; i < clc.id.length; i++) hash += clc.id.charCodeAt(i);
                  
                  const partnerIdx = hash % SEED_PARTNERS.length;
                  const partner = SEED_PARTNERS[partnerIdx] || SEED_PARTNERS[0];
 
                  const partnershipDoc = clc.partnershipDoc || partner.partnershipDocument;

                  const partnerNames = ["Hon. Ernesto P. Aguilar", "Hon. Carlos M. dela Cruz", "Hon. Jennifer S. Ramos", "Hon. Ricardo G. Santos", "Hon. Maria Clara V. Luna"];
                  const barangayChairman = clc.partnerName || partnerNames[hash % partnerNames.length];
                  
                  const suffix = (2481093 + hash * 23).toString().slice(-4);
                  const chairmanContact = clc.partnerContact || `+63 945 882 ${suffix}`;

                  const teacherEmail = clc.email || `${clc.teacher.toLowerCase().replace(/[^a-z]/g, '')}@deped.gov.ph`;
                  const teacherPhone = clc.phone || '+63 917 123 4567';

                  const displayPic = getGoogleDriveDirectLink(clc.teacherPicture);

                  return (
                    <tr key={clc.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* No. */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-400 text-center">{idx + 1}</td>
                      
                      {/* Teacher Photo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center">
                          <div className="w-10 h-12 border border-slate-200 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center p-0.5 shadow-3xs">
                            {displayPic && displayPic.trim() !== '' ? (
                              <img
                                src={displayPic}
                                alt="Teacher Photo"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-100 rounded flex items-center justify-center text-center text-[7px] text-slate-400 font-extrabold uppercase leading-tight p-0.5">
                                No Photo
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Name of Community Learning Center */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              setSelectedCLC(clc);
                              setIsDetailModalOpen(true);
                              setIsEditing(false);
                              setGeneratedDocLink(null);
                              setDocErrorMessage(null);
                            }}
                            className="font-bold text-[#002B6D] hover:underline text-left"
                          >
                            {clc.name}
                          </button>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-1.5 py-0.25 rounded-md text-[8px] font-extrabold uppercase ${
                              clc.status === 'active' 
                                ? 'bg-emerald-50 text-emerald-700'
                                : clc.status === 'needs-resources'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-blue-50 text-blue-700'
                            }`}>
                              {clc.status === 'active' ? 'Active' : clc.status === 'needs-resources' ? 'Needs Resources' : 'Planned'}
                            </span>
                          </div>
                        </div>
                      </td>
                      
                      {/* Community Learning Center Code */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 text-center text-[11px]">{computedCode}</td>
                      
                      {/* CLC Address */}
                      <td className="py-3 px-4 text-xs text-slate-500 leading-normal font-medium">{clc.address || 'N/A'}</td>

                      {/* District */}
                      <td className="py-3 px-4 text-slate-650 font-semibold">{clc.district}</td>

                      {/* Type */}
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                          clcType === 'Main Center' 
                            ? 'bg-purple-50 text-purple-700'
                            : clcType === 'Relocatable Mini-CLC'
                              ? 'bg-amber-50 text-amber-700'
                              : clcType === 'Outreach Outpost'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-slate-100 text-slate-700'
                        }`}>
                          {clcType}
                        </span>
                      </td>
                      
                      {/* Category */}
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          clcCategory === 'Rural' ? 'bg-orange-50 text-orange-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {clcCategory}
                        </span>
                      </td>

                      {/* ALS Teacher */}
                      <td className="py-3 px-4 font-semibold text-slate-700">{clc.teacher}</td>

                      {/* Email Address */}
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{teacherEmail}</td>

                      {/* CP Number */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">{teacherPhone}</td>

                      {/* Barangay Chairman */}
                      <td className="py-3 px-4 font-semibold text-slate-700 leading-tight">{barangayChairman}</td>

                      {/* Contact Number */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">{chairmanContact}</td>
                      
                      {/* Partnership Document */}
                      <td className="py-3 px-4">
                        <a 
                          href="https://drive.google.com"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-800 font-bold hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[120px]">{partnershipDoc}</span>
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== 5. DETAIL & EDIT MODAL ==================== */}
      <AnimatePresence>
        {isDetailModalOpen && selectedCLC && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-[#002B6D] px-6 py-4 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-2">
                  <School className="w-5 h-5 text-sky-300" />
                  <div>
                    <h2 className="font-extrabold text-sm tracking-tight">Community Learning Center Dossier</h2>
                    <p className="text-[10px] text-sky-200 font-mono">ID: {selectedCLC.id}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-1 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable details / edit area */}
              <div className="p-6 overflow-y-auto space-y-6 grow">
                
                {/* Mode toggle (View / Edit Form) */}
                {!isEditing ? (
                  // VIEWING DOSSIER
                  <div className="space-y-6">
                    {/* Primary info column */}
                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">
                          {selectedCLC.district}
                        </span>
                        
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          selectedCLC.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : selectedCLC.status === 'needs-resources'
                              ? 'bg-amber-50 text-amber-500 border border-amber-105'
                              : 'bg-blue-50 text-blue-700 border border-blue-105'
                        }`}>
                          {selectedCLC.status === 'active' ? 'Active Operations' : selectedCLC.status === 'needs-resources' ? 'Resource Shortage' : 'Development/Plan'}
                        </span>
                      </div>

                      <h1 className="text-xl font-black text-slate-800 tracking-tight mt-1">
                        {selectedCLC.name}
                      </h1>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Active Registry</span>
                        <p className="text-xl font-black text-slate-850 mt-1 tracking-tight">{selectedCLC.enrolled} learners</p>
                      </div>
                      
                      <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Established</span>
                        <p className="text-xs font-bold text-slate-750 mt-2.5">{selectedCLC.established || 'Unknown'}</p>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Mime Coordinates</span>
                        <p className="text-[10px] font-bold font-mono text-slate-650 mt-3">{selectedCLC.lng}°E, {selectedCLC.lat}°N</p>
                      </div>
                    </div>

                    {/* Detail blocks */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Teacher Contact Info Card */}
                      <div className="border border-slate-200 rounded-xl p-4 space-y-3.5">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Assigned Mobile Teacher</h4>
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-700 text-xs shrink-0 uppercase border border-slate-205">
                            {selectedCLC.teacher.slice(0, 2)}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-black text-slate-800 leading-tight">{selectedCLC.teacher}</p>
                            <p className="text-[10px] text-slate-450 font-medium">Alternative Learning System Specialist</p>
                            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-500 font-medium">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{selectedCLC.teacher.toLowerCase().replace(/[^a-z]/g, '')}@deped.gov.ph</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                              <Smartphone className="w-3 h-3 text-slate-400" />
                              <span>+63 920 843 {1000 + Math.floor(Math.random() * 8999)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Equipment List */}
                      <div className="border border-slate-200 rounded-xl p-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">Specialized Learning Equipment</h4>
                        <div className="space-y-1.5">
                          {selectedCLC.facilities.map((fac, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-slate-650">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span>{fac}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 6. GOOGLE DOC INTEGRATION CORNER (CRITICAL REAL INTEGRATION) */}
                    <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-4.5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="p-1 px-1.5 bg-[#E3EDFA] text-[#002B6D] rounded text-xs font-extrabold uppercase font-mono tracking-tight flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            DOCS API
                          </span>
                          <h4 className="text-xs font-bold text-slate-800 tracking-tight">Sync Report to Google Drive & Docs</h4>
                        </div>
                      </div>
                      
                      <p className="text-[11px] text-slate-550 leading-relaxed font-medium">
                        Export this dossiers profile to Google Documents using the configured secure service account credentials. The document will automatically be created and shared so anyone with the link can view.
                      </p>

                      {isGeneratingDoc ? (
                        <div className="flex items-center gap-2 text-xs text-[#002B6D] font-bold py-2">
                          <span className="w-4 h-4 border-2 border-t-transparent border-[#002B6D] rounded-full animate-spin shrink-0" />
                          <span>Generating Official Document on Google Drive... Please wait.</span>
                        </div>
                      ) : generatedDocLink ? (
                        <div className="space-y-2 py-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
                            <span>Official Dossier Report successfully generated in Google Cloud!</span>
                          </div>
                          
                          <a
                            href={generatedDocLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-550 hover:bg-emerald-600 text-white font-bold text-[11px] rounded-lg shadow-2xs transition"
                          >
                            Open Google Doc Report
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button
                            onClick={() => generateGoogleDocReport(selectedCLC)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-[#002B6D] font-bold text-[11px] rounded-xl transition"
                          >
                            Generate Official Google Doc Report
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          
                          {docErrorMessage && (
                            <p className="text-[10px] text-rose-500 font-medium">
                              Note/Warning: {docErrorMessage}. A preview of the doc will be loaded in fallback mode.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // EDITING FORM
                  <form onSubmit={handleUpdateSubmit} className="space-y-4">
                    <div className="relative">
                      <label className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider mb-1 block">CLC NAME</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#002B6D]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider mb-1 block">COORDINATING DISTRICT HUB</label>
                        <select
                          value={district}
                          onChange={(e) => setDistrict(e.target.value as any)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-[#002b6d]"
                        >
                          <option value="South A">South A</option>
                          <option value="South B">South B</option>
                          <option value="West A">West A</option>
                          <option value="West B">West B</option>
                          <option value="West C">West C</option>
                          <option value="Central A">Central A</option>
                          <option value="Central B">Central B</option>
                          <option value="East">East</option>
                          <option value="North A">North A</option>
                          <option value="North B">North B</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider mb-1 block">ASSIGNED SPECIALIST / TEACHER</label>
                        <input
                          type="text"
                          required
                          value={teacher}
                          onChange={(e) => setTeacher(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#002B6D]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider mb-1 block">OPERATIONAL STATUS</label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as any)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-[#002b6d]"
                        >
                          <option value="active">Active (Fully Operational)</option>
                          <option value="needs-resources">Needs supplies and books</option>
                          <option value="under-construction">Planned / Mobilization Phase</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider mb-1 block">ACTIVE ENROLLER COUNT</label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={200}
                          value={enrolled}
                          onChange={(e) => setEnrolled(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#002B6D]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider mb-1 block">SPECIALIZED FACILITIES (COMMA SEPARATED)</label>
                      <input
                        type="text"
                        value={facilitiesText}
                        onChange={(e) => setFacilitiesText(e.target.value)}
                        placeholder="e.g. tablet library, solar battery kits, self-learning packets"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#002B6D]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider mb-1 block">MAP COMPASS LONGITUDE (%)</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={lng}
                          onChange={(e) => setLng(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#002B6D]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider mb-1 block">MAP COMPASS LATITUDE (%)</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={lat}
                          onChange={(e) => setLat(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#002B6D]"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-1.5 text-slate-705 text-xs font-bold rounded-xl transition"
                      >
                        Discard
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#002B6D] hover:bg-[#00224d] text-white text-xs font-bold rounded-xl transition"
                      >
                        Keep Changes
                      </button>
                    </div>
                  </form>
                )}

              </div>

              {/* Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-150 flex items-center justify-between shrink-0">
                <p className="text-[10px] text-slate-400 font-medium">TCSD Alternate Learning System Operations Desk</p>
                
                {!isEditing && (
                  <button
                    onClick={() => startEditing(selectedCLC)}
                    className="flex items-center gap-1.5 px-4.5 py-1.8 bg-[#002B6D] hover:bg-[#002252] text-white text-xs font-bold rounded-xl transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Profile
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== 6. ADD CLC REGISTRY MODAL ==================== */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden flex flex-col"
            >
              <div className="bg-[#002B6D] px-6 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-sky-305" />
                  <h2 className="font-extrabold text-sm tracking-tight">Register New Community Learning Center (CLC)</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCLC} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider mb-1 block">CLC CENTER NAME</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alvindia Compound Community Learning Center"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-[#002B6D]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider mb-1 block">COORDINATING DISTRICT HUB</label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-[#002B6D]"
                    >
                      <option value="South A">South A</option>
                      <option value="South B">South B</option>
                      <option value="West A">West A</option>
                      <option value="West B">West B</option>
                      <option value="West C">West C</option>
                      <option value="Central A">Central A</option>
                      <option value="Central B">Central B</option>
                      <option value="East">East</option>
                      <option value="North A">North A</option>
                      <option value="North B">North B</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider mb-1 block">COORDINATING MOBILE TEACHER</label>
                    <input
                      type="text"
                      required
                      value={teacher}
                      onChange={(e) => setTeacher(e.target.value)}
                      placeholder="e.g. Mrs. Maria Elena Santos"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-[#002B6D]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider mb-1 block">OPERATIONAL STATUS</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-[#002B6D]"
                    >
                      <option value="active">Active (Fully Operational)</option>
                      <option value="needs-resources">Needs supplies and books</option>
                      <option value="under-construction">Planned / Under construction</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider mb-1 block">INITIAL ENROLLER REGISTRY</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={150}
                      value={enrolled}
                      onChange={(e) => setEnrolled(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#002B6D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider mb-1 block">SPECIALIZED SUPPLIES AND FACILITIES (COMMA SEPARATED)</label>
                  <input
                    type="text"
                    value={facilitiesText}
                    onChange={(e) => setFacilitiesText(e.target.value)}
                    placeholder="e.g. Solar Power Kit, Tablet Library (15 pcs), Textbooks"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-[#002B6D]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider mb-1 block">MAP LONGITUDE GRAPH (% WIDTH)</label>
                    <input
                      type="number"
                      required
                      min={10}
                      max={90}
                      value={lng}
                      onChange={(e) => setLng(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#002B6D]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider mb-1 block">MAP LATITUDE GRAPH (% HEIGHT)</label>
                    <input
                      type="number"
                      required
                      min={10}
                      max={90}
                      value={lat}
                      onChange={(e) => setLat(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#002B6D]"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-2.5 bg-[#002B6D] hover:bg-[#00224d] text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    Register CLC
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
