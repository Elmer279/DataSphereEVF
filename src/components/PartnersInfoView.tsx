/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  MapPin, 
  Users, 
  ShieldCheck, 
  ExternalLink, 
  Calendar, 
  Phone, 
  Mail, 
  ChevronLeft, 
  ChevronRight, 
  FileCheck2, 
  Search, 
  SlidersHorizontal, 
  Sparkles,
  LayoutGrid,
  Clock,
  Play,
  Pause,
  ArrowRight,
  TrendingUp,
  UserCheck,
  CheckCircle,
  AlertTriangle,
  Bot,
  Layers,
  ArrowLeftRight,
  Handshake
} from 'lucide-react';
import { Partner } from '../types';
import { PartnerActivityTimeline } from './PartnerActivityTimeline';
import { PartnerCarouselCard, renderPartnerStatusBadge, getResolvedPartnerLogoUrl } from './PartnerCarouselCard';

interface PartnersInfoViewProps {
  partners: Partner[];
  setPartners?: React.Dispatch<React.SetStateAction<Partner[]>>;
  onResetPartners?: () => void;
  onSyncPartners?: () => void;
  syncLoading?: boolean;
  syncError?: string;
}

// Contextual AI Prompt Chips for ElFabriX
const CONTEXTUAL_AI_PROMPTS = [
  {
    label: "Evaluate MOA expiration risks (next 90 days)",
    prompt: "Scan our entire Database on Partners and Linkages for any MOAs that expire within the next 90 days or are currently under Pending Renewal, and provide an executive renewal action plan for Division ALS Coordinator."
  },
  {
    label: "Highest student reach partners",
    prompt: "Identify the top 3 partner organizations providing the highest student reach and logistical support to ALS learners across Tarlac City Community Learning Centers."
  },
  {
    label: "Corporate & skills training pathways",
    prompt: "Analyze private corporate partnerships (such as Sitel and ALSTIG) offering technical-vocational skills, internships, and direct employment pathways for ALS graduates."
  }
];

export function PartnersInfoView({ 
  partners,
  onSyncPartners,
  syncLoading,
  syncError
}: PartnersInfoViewProps) {
  // Navigation & View Mode: 'carousel' | 'grid' | 'timeline' (GIS Map & CLCs removed per user request)
  const [viewMode, setViewMode] = useState<'carousel' | 'grid' | 'timeline'>('carousel');
  
  // Top Carousel: moves left (advancing forward)
  const [topIndex, setTopIndex] = useState<number>(0);
  const [topDirection, setTopDirection] = useState<number>(1);

  // Bottom Carousel: moves right (advancing in opposite movement)
  const [bottomIndex, setBottomIndex] = useState<number>(() => {
    return partners && partners.length > 1 ? Math.floor(partners.length / 2) : 0;
  });
  const [bottomDirection, setBottomDirection] = useState<number>(-1);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [gridSearchQuery, setGridSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Coordinated advancement ensuring the two carousels always display DIFFERENT containers
  const handleNext = useCallback(() => {
    if (!partners || partners.length <= 1) return;
    setTopDirection(1);
    setBottomDirection(-1);

    setTopIndex((prevTop) => {
      const nextTop = (prevTop + 1) % partners.length;
      return nextTop;
    });

    setBottomIndex((prevBottom) => {
      let nextBottom = (prevBottom - 1 + partners.length) % partners.length;
      const futureTop = (topIndex + 1) % partners.length;
      if (nextBottom === futureTop && partners.length > 1) {
        nextBottom = (nextBottom - 1 + partners.length) % partners.length;
      }
      return nextBottom;
    });
  }, [partners, topIndex]);

  const handlePrev = useCallback(() => {
    if (!partners || partners.length <= 1) return;
    setTopDirection(-1);
    setBottomDirection(1);

    setTopIndex((prevTop) => {
      const nextTop = (prevTop - 1 + partners.length) % partners.length;
      return nextTop;
    });

    setBottomIndex((prevBottom) => {
      let nextBottom = (prevBottom + 1) % partners.length;
      const futureTop = (topIndex - 1 + partners.length) % partners.length;
      if (nextBottom === futureTop && partners.length > 1) {
        nextBottom = (nextBottom + 1) % partners.length;
      }
      return nextBottom;
    });
  }, [partners, topIndex]);

  // Jump to specific index on Top carousel, keeping Bottom carousel on a distinct container
  const handleGoToTop = useCallback((targetIndex: number) => {
    if (!partners || targetIndex === topIndex) return;
    setTopDirection(targetIndex > topIndex ? 1 : -1);
    setTopIndex(targetIndex);

    // Keep bottom carousel different
    if (targetIndex === bottomIndex && partners.length > 1) {
      setBottomIndex((targetIndex + 1) % partners.length);
    }
  }, [partners, topIndex, bottomIndex]);

  // Jump to specific index on Bottom carousel, keeping Top carousel on a distinct container
  const handleGoToBottom = useCallback((targetIndex: number) => {
    if (!partners || targetIndex === bottomIndex) return;
    setBottomDirection(targetIndex > bottomIndex ? -1 : 1);
    setBottomIndex(targetIndex);

    // Keep top carousel different
    if (targetIndex === topIndex && partners.length > 1) {
      setTopIndex((targetIndex + 1) % partners.length);
    }
  }, [partners, topIndex, bottomIndex]);

  // Auto rotation effect: Top moves left, Bottom moves right (opposite movement)
  useEffect(() => {
    if (viewMode !== 'carousel' || isPaused || !partners || partners.length <= 1) return;

    const timer = setInterval(() => {
      handleNext();
    }, 7000);

    return () => clearInterval(timer);
  }, [viewMode, isPaused, partners, handleNext]);

  // Ensure safe bounds and distinct containers
  useEffect(() => {
    if (!partners || partners.length === 0) return;
    if (topIndex >= partners.length) setTopIndex(0);
    if (bottomIndex >= partners.length || (bottomIndex === topIndex && partners.length > 1)) {
      setBottomIndex((topIndex + Math.max(1, Math.floor(partners.length / 2))) % partners.length);
    }
  }, [partners, topIndex, bottomIndex]);

  // Handle launching ElFabriX AI with contextual prompt
  const handleTriggerAIPrompt = (promptText: string) => {
    window.dispatchEvent(new CustomEvent('open-elfabrix-prompt', { detail: { prompt: promptText } }));
  };

  // Filtered partners for Grid view
  const filteredGridPartners = useMemo(() => {
    return partners.filter(p => {
      const matchesSearch = !gridSearchQuery || 
        p.organizationName.toLowerCase().includes(gridSearchQuery.toLowerCase()) ||
        p.contactPerson.toLowerCase().includes(gridSearchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(gridSearchQuery.toLowerCase()) ||
        p.partnerType.toLowerCase().includes(gridSearchQuery.toLowerCase()) ||
        p.typeOfSupport.toLowerCase().includes(gridSearchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'All' || p.partnerType === typeFilter;
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [partners, gridSearchQuery, typeFilter, statusFilter]);

  // Partner Types
  const partnerTypes = useMemo(() => {
    return ['All', ...Array.from(new Set(partners.map(p => p.partnerType))).filter(Boolean)];
  }, [partners]);

  if (!partners || partners.length === 0) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl font-sans">
        <span className="text-sm font-semibold text-slate-500">No partner records available.</span>
      </div>
    );
  }

  // Active cards for both carousels
  const activeTopPartner = partners[topIndex] || partners[0];
  const activeBottomPartner = partners[bottomIndex] || partners[(topIndex + 1) % partners.length];

  // Top Carousel Slide Variants (moves towards the left)
  const topSlideVariants = {
    enter: (dir: number) => ({
      x: dir >= 0 ? 320 : -320,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 350, damping: 30 },
        opacity: { duration: 0.25 }
      }
    },
    exit: (dir: number) => ({
      x: dir >= 0 ? -320 : 320,
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring', stiffness: 350, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  // Bottom Carousel Slide Variants (movement going to the right)
  const bottomSlideVariants = {
    enter: (dir: number) => ({
      x: dir <= 0 ? -320 : 320,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 350, damping: 30 },
        opacity: { duration: 0.25 }
      }
    },
    exit: (dir: number) => ({
      x: dir <= 0 ? 320 : -320,
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring', stiffness: 350, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  return (
    <div className="space-y-5 font-sans select-none">
      {/* 1. Header Bar with Ecosystem Metrics and View Selectors */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#002B6D] text-white flex items-center justify-center shadow-xs shrink-0">
            <Handshake className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#002B6D] tracking-tight">ALS Linkages Ecosystem</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-500 font-mono">Live Google Sheets Sync</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {partners.length} DepEd-recognized organizations supporting {partners.reduce((sum, p) => sum + (p.learnersSupported || 0), 0).toLocaleString()} learners
            </p>
          </div>
        </div>

        {/* View Mode Toggle Buttons (GIS Map & CLCs removed per user request) */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80 self-start lg:self-auto text-xs">
          <button
            type="button"
            onClick={() => setViewMode('carousel')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              viewMode === 'carousel'
                ? 'bg-white text-[#002B6D] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Dual Slide Carousel</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-[#002B6D] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#002B6D]" />
            <span>Searchable Grid</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              viewMode === 'timeline'
                ? 'bg-white text-[#002B6D] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Activity & MOA Log</span>
          </button>
        </div>
      </div>

      {/* 2. Contextual AI Quick-Prompt Chips (ElFabriX Integration) */}
      <div className="bg-sky-50/70 border border-sky-100 p-3 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 shrink-0">
          <Bot className="w-4 h-4 text-sky-700" />
          <span className="text-[11px] font-extrabold text-sky-950 uppercase tracking-wider">
            ElFabriX AI Contextual Prompts:
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none w-full sm:w-auto py-0.5">
          {CONTEXTUAL_AI_PROMPTS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleTriggerAIPrompt(chip.prompt)}
              className="px-2.5 py-1 rounded-lg bg-white border border-sky-200 hover:border-sky-400 text-sky-900 hover:text-[#002B6D] text-[11px] font-bold whitespace-nowrap shadow-2xs hover:shadow-xs transition-all flex items-center gap-1 cursor-pointer"
              title={chip.prompt}
            >
              <span>{chip.label}</span>
              <ArrowRight className="w-2.5 h-2.5 opacity-60" />
            </button>
          ))}
        </div>
      </div>

      {/* 3. VIEW MODE A: DUAL SLIDE CAROUSEL (TOP & BOTTOM WITH OPPOSITE MOVEMENT) */}
      {viewMode === 'carousel' && (
        <div 
          className="flex flex-col w-full gap-5 pb-4"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Controls Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-[#002B6D] text-white flex items-center gap-1 shadow-2xs">
                <ArrowLeftRight className="w-3 h-3 text-amber-300" />
                Synchronized Dual Carousel
              </span>
              <span className="text-[11px] font-bold text-slate-600">
                Opposite Movement Feeds • Displaying Independent Partner Profiles
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-[#002B6D] bg-white border border-slate-200 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title={isPaused ? "Resume Auto-Slide" : "Pause Auto-Slide"}
              >
                {isPaused ? (
                  <>
                    <Play className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                    <span>Resume Auto</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 text-amber-600 fill-amber-600" />
                    <span>Pause Auto</span>
                  </>
                )}
              </button>

              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                {isPaused ? "Paused" : "Auto-rotating in opposite directions every 7s"}
              </span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* CAROUSEL 1 (TOP): Movement Going to the LEFT             */}
          {/* ======================================================== */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="font-extrabold text-[#002B6D] text-[11px] uppercase tracking-wider">
                  Partner Showcase Stream 1 • Movement: Leftward
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  (Showing Partner {topIndex + 1} of {partners.length}: {activeTopPartner.organizationName})
                </span>
              </div>
            </div>

            <div className="relative w-full flex items-center">
              {/* Prev Button */}
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2 z-30 p-2.5 rounded-full bg-slate-900/60 hover:bg-[#002B6D] text-white backdrop-blur-md border border-white/20 transition-all duration-200 shadow-lg cursor-pointer hover:scale-105 active:scale-95 focus:outline-hidden"
                title="Slide Previous (Opposite movement across both carousels)"
                aria-label="Previous partner slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Top Carousel Box */}
              <div 
                className="w-full relative overflow-hidden rounded-2xl shadow-xl border border-sky-950/20 bg-slate-950"
                style={{ height: '5.2cm' }}
              >
                <AnimatePresence initial={false} custom={topDirection} mode="popLayout">
                  <motion.div
                    key={`top-slide-${activeTopPartner.id || activeTopPartner.recordId || topIndex}`}
                    custom={topDirection}
                    variants={topSlideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(_e, { offset, velocity }) => {
                      const swipePower = Math.abs(offset.x) * velocity.x;
                      if (swipePower < -10000 || offset.x < -60) {
                        handleNext();
                      } else if (swipePower > 10000 || offset.x > 60) {
                        handlePrev();
                      }
                    }}
                    style={{ 
                      width: '100%', 
                      height: '5.2cm', 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      zIndex: 20,
                    }}
                  >
                    <PartnerCarouselCard partner={activeTopPartner} />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2 z-30 p-2.5 rounded-full bg-slate-900/60 hover:bg-[#002B6D] text-white backdrop-blur-md border border-white/20 transition-all duration-200 shadow-lg cursor-pointer hover:scale-105 active:scale-95 focus:outline-hidden"
                title="Slide Next (Opposite movement across both carousels)"
                aria-label="Next partner slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Pagination Dots for Top Carousel */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              {partners.map((p, idx) => (
                <button
                  key={`top-dot-${p.id || p.recordId || idx}`}
                  type="button"
                  onClick={() => handleGoToTop(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer focus:outline-hidden ${
                    idx === topIndex
                      ? 'w-7 h-2 bg-[#002B6D] shadow-xs'
                      : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                  title={`Stream 1: Jump to ${p.organizationName} (${idx + 1}/${partners.length})`}
                />
              ))}
            </div>
          </div>

          {/* ======================================================== */}
          {/* CAROUSEL 2 (BOTTOM): Movement Going to the RIGHT         */}
          {/* ======================================================== */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between px-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-extrabold text-[#002B6D] text-[11px] uppercase tracking-wider">
                  Partner Showcase Stream 2 • Movement: Rightward
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  (Showing Partner {bottomIndex + 1} of {partners.length}: {activeBottomPartner.organizationName})
                </span>
              </div>
            </div>

            <div className="relative w-full flex items-center">
              {/* Prev Button for Bottom Carousel */}
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2 z-30 p-2.5 rounded-full bg-slate-900/60 hover:bg-[#002B6D] text-white backdrop-blur-md border border-white/20 transition-all duration-200 shadow-lg cursor-pointer hover:scale-105 active:scale-95 focus:outline-hidden"
                title="Slide Previous (Moving rightward)"
                aria-label="Previous partner slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Bottom Carousel Box */}
              <div 
                className="w-full relative overflow-hidden rounded-2xl shadow-xl border border-emerald-950/20 bg-slate-950"
                style={{ height: '5.2cm' }}
              >
                <AnimatePresence initial={false} custom={bottomDirection} mode="popLayout">
                  <motion.div
                    key={`bottom-slide-${activeBottomPartner.id || activeBottomPartner.recordId || bottomIndex}`}
                    custom={bottomDirection}
                    variants={bottomSlideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(_e, { offset, velocity }) => {
                      const swipePower = Math.abs(offset.x) * velocity.x;
                      if (swipePower < -10000 || offset.x < -60) {
                        handleNext();
                      } else if (swipePower > 10000 || offset.x > 60) {
                        handlePrev();
                      }
                    }}
                    style={{ 
                      width: '100%', 
                      height: '5.2cm', 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      zIndex: 20,
                    }}
                  >
                    <PartnerCarouselCard partner={activeBottomPartner} />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Next Button for Bottom Carousel */}
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2 z-30 p-2.5 rounded-full bg-slate-900/60 hover:bg-[#002B6D] text-white backdrop-blur-md border border-white/20 transition-all duration-200 shadow-lg cursor-pointer hover:scale-105 active:scale-95 focus:outline-hidden"
                title="Slide Next (Moving rightward)"
                aria-label="Next partner slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Pagination Dots for Bottom Carousel */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              {partners.map((p, idx) => (
                <button
                  key={`bottom-dot-${p.id || p.recordId || idx}`}
                  type="button"
                  onClick={() => handleGoToBottom(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer focus:outline-hidden ${
                    idx === bottomIndex
                      ? 'w-7 h-2 bg-emerald-600 shadow-xs'
                      : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                  title={`Stream 2: Jump to ${p.organizationName} (${idx + 1}/${partners.length})`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. VIEW MODE B: SEARCHABLE DATA GRID (Modernized Cards with Elevation) */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={gridSearchQuery}
                onChange={(e) => setGridSearchQuery(e.target.value)}
                placeholder="Search by organization name, contact person, modality..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#002B6D] focus:bg-white transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                {partnerTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Pending Renewal">Pending Renewal</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGridPartners.map((p) => {
              const logoUrl = getResolvedPartnerLogoUrl(p.logo);
              return (
                <div 
                  key={p.id || p.recordId}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#002B6D] to-[#043d93] text-white flex items-center justify-center font-black text-sm uppercase shadow-sm shrink-0 border border-indigo-100 overflow-hidden">
                          {logoUrl ? (
                            <img 
                              src={logoUrl} 
                              alt={p.organizationName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span>{p.logo || 'PT'}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono font-extrabold text-[#002B6D] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 block truncate mb-1">
                            {p.recordId}
                          </span>
                          <h4 className="font-extrabold text-slate-900 text-sm leading-snug group-hover:text-[#002B6D] transition-colors line-clamp-1" title={p.organizationName}>
                            {p.organizationName}
                          </h4>
                          <span className="text-[10.5px] text-slate-500 font-semibold block truncate">
                            {p.partnerType}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {renderPartnerStatusBadge(p.status, p.moaDaysRemaining)}
                      <span className="text-[10.5px] font-mono text-slate-500 font-bold">
                        {p.yearsOfPartnership} Yrs Allied
                      </span>
                    </div>
                  </div>

                  {/* Contact Details Grouping with Distinct Icons */}
                  <div className="bg-slate-50/80 rounded-xl p-3.5 space-y-2 border border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-[#002B6D] shrink-0" />
                      <div className="min-w-0 truncate">
                        <span className="font-bold text-slate-800">{p.contactPerson}</span>
                        <span className="text-slate-400 text-[10px] block truncate">{p.position}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-mono font-bold text-slate-800 truncate">{p.phoneNumber || 'N/A'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span className="font-medium text-slate-700 truncate">{p.emailAddress}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span className="text-[11px] text-slate-600 line-clamp-1">{p.address}</span>
                    </div>
                  </div>

                  {/* Support Modality & Metrics */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10.5px] font-bold text-slate-500">Learners Supported:</span>
                      <span className="font-mono font-black text-[#002B6D] text-sm">
                        {p.learnersSupported.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-2 bg-blue-50/60 rounded-lg text-[10.5px] text-[#002B6D] font-semibold truncate border border-blue-100">
                      Modality: {p.typeOfSupport}
                    </div>

                    {/* AI Prompt Button for Specific Partner */}
                    <button
                      type="button"
                      onClick={() => handleTriggerAIPrompt(`Synthesize all collaborative linkages, accomplishments, and resource donations provided by ${p.organizationName} to Tarlac City Schools Division ALS.`)}
                      className="w-full mt-2 py-1.5 px-3 rounded-lg bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-[#002B6D] border border-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Bot className="w-3.5 h-3.5 text-sky-600" />
                      <span>Ask ElFabriX about {p.organizationName.split(' ')[0]}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. VIEW MODE C: ACTIVITY TIMELINE & MOA TRACKER */}
      {viewMode === 'timeline' && (
        <PartnerActivityTimeline 
          partners={partners} 
          onOpenElFabriXPrompt={handleTriggerAIPrompt}
        />
      )}
    </div>
  );
}
