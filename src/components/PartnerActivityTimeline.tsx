/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  FileText, 
  Download, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Filter, 
  Users, 
  MapPin, 
  Handshake, 
  Sparkles,
  Bot,
  Award,
  ShieldCheck,
  Search
} from 'lucide-react';
import { Partner } from '../types';
import { PartnerActivity, SEED_PARTNER_ACTIVITIES } from '../data/partnersData';

interface PartnerActivityTimelineProps {
  partners: Partner[];
  onOpenElFabriXPrompt?: (prompt: string) => void;
}

export const PartnerActivityTimeline: React.FC<PartnerActivityTimelineProps> = ({ 
  partners,
  onOpenElFabriXPrompt
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'moa'>('timeline');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [partnerFilter, setPartnerFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract activity categories
  const categories = ['All', 'Community Outreach', 'Skills Training', 'MOA Signing', 'Resource Donation', 'Volunteer Session'];

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return SEED_PARTNER_ACTIVITIES.filter(act => {
      const matchesCat = categoryFilter === 'All' || act.category === categoryFilter;
      const matchesPartner = partnerFilter === 'All' || act.partnerName.toLowerCase().includes(partnerFilter.toLowerCase());
      const matchesSearch = !searchQuery || 
        act.activityTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.location.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCat && matchesPartner && matchesSearch;
    });
  }, [categoryFilter, partnerFilter, searchQuery]);

  // MOA Tracker stats
  const moaStats = useMemo(() => {
    const validCount = partners.filter(p => (p.moaRenewalStatus || p.status) === 'Valid' || p.status === 'Active').length;
    const pendingRenewalCount = partners.filter(p => (p.moaRenewalStatus || p.status) === 'Pending Renewal').length;
    const expiringSoonCount = partners.filter(p => p.moaDaysRemaining && p.moaDaysRemaining <= 90).length;

    return { validCount, pendingRenewalCount, expiringSoonCount };
  }, [partners]);

  const handleLaunchAIPrompt = (promptText: string) => {
    if (onOpenElFabriXPrompt) {
      onOpenElFabriXPrompt(promptText);
    } else {
      window.dispatchEvent(new CustomEvent('open-elfabrix-prompt', { detail: { prompt: promptText } }));
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden font-sans space-y-0">
      {/* Tab Switcher Header */}
      <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/90 rounded-xl shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('timeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'timeline'
                ? 'bg-[#002B6D] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Activity & Engagement Timeline</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeSubTab === 'timeline' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {SEED_PARTNER_ACTIVITIES.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('moa')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'moa'
                ? 'bg-[#002B6D] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>MOA & Legal Document Tracker</span>
            {moaStats.pendingRenewalCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* AI Action Quick Trigger */}
        <button
          type="button"
          onClick={() => handleLaunchAIPrompt("Provide an executive synthesis of recent partner activities and MOA renewals scheduled for next quarter.")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 font-bold text-xs transition cursor-pointer shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Ask ElFabriX to summarize timeline</span>
        </button>
      </div>

      {/* SUB-TAB 1: ACTIVITY & ENGAGEMENT TIMELINE */}
      {activeSubTab === 'timeline' && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search joint events, workshops, drives..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#002B6D]/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent text-slate-700 font-bold text-xs focus:outline-hidden cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                <Handshake className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={partnerFilter}
                  onChange={(e) => setPartnerFilter(e.target.value)}
                  className="bg-transparent text-slate-700 font-bold text-xs focus:outline-hidden cursor-pointer max-w-[160px] truncate"
                >
                  <option value="All">All Partners</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.organizationName}>{p.organizationName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Timeline Feed Container */}
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {filteredActivities.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
                No partner activities found matching your filters.
              </div>
            ) : (
              filteredActivities.map((act) => {
                const isVolunteer = act.category === 'Volunteer Session';
                const isDonation = act.category === 'Resource Donation';
                const isTraining = act.category === 'Skills Training';
                const isMOA = act.category === 'MOA Signing';

                let dotColor = 'bg-sky-500';
                if (isVolunteer) dotColor = 'bg-amber-500';
                if (isDonation) dotColor = 'bg-emerald-500';
                if (isTraining) dotColor = 'bg-indigo-600';
                if (isMOA) dotColor = 'bg-[#002B6D]';

                return (
                  <div key={act.id} className="relative group">
                    {/* Timeline Node Point */}
                    <div className={`absolute -left-[27px] sm:-left-[35px] top-1.5 w-4 h-4 rounded-full ${dotColor} border-2 border-white shadow-xs group-hover:scale-125 transition-transform`} />

                    {/* Card Body */}
                    <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-[#002B6D]/40 hover:shadow-md transition-all space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-extrabold uppercase border ${
                            isDonation ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            isTraining ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            isVolunteer ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {act.category}
                          </span>
                          <span className="text-[11px] font-extrabold text-[#002B6D]">
                            {act.partnerName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {act.date}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700">
                            {act.status}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-slate-900 tracking-tight leading-snug">
                          {act.activityTitle}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed mt-1">
                          {act.description}
                        </p>
                      </div>

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-100">
                        <div className="flex items-center gap-4 text-slate-500 text-[11px]">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            {act.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-[#002B6D] shrink-0" />
                            {act.participants} Participants Involved
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleLaunchAIPrompt(`Draft a press release and DepEd Division memo briefing for the event "${act.activityTitle}" conducted with ${act.partnerName}.`)}
                          className="text-[11px] font-bold text-sky-700 hover:text-[#002B6D] flex items-center gap-1 cursor-pointer"
                        >
                          <Bot className="w-3.5 h-3.5 text-sky-600" />
                          <span>Draft Memo Briefing</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MOA & DOCUMENT TRACKER */}
      {activeSubTab === 'moa' && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Overview Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">
                  Active & Compliant MOAs
                </span>
                <span className="text-2xl font-black text-emerald-950 font-mono">
                  {moaStats.validCount} Alliances
                </span>
                <span className="text-[10.5px] text-emerald-600 block">100% legal validity standing</span>
              </div>
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 block">
                  Pending Renewal / Expiring
                </span>
                <span className="text-2xl font-black text-amber-950 font-mono">
                  {moaStats.pendingRenewalCount} Document
                </span>
                <span className="text-[10.5px] text-amber-600 block">Within 60-day action window</span>
              </div>
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 block">
                  Repository Audit
                </span>
                <span className="text-2xl font-black text-blue-950 font-mono">
                  {partners.length} Documents
                </span>
                <span className="text-[10.5px] text-blue-600 block">Digitally indexed in Google Drive</span>
              </div>
              <div className="p-2.5 bg-blue-100 text-[#002B6D] rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* MOA Matrix Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-[#002B6D] text-white uppercase text-[10px] font-black tracking-wider">
                <tr>
                  <th className="py-3 px-4">Organization & Record ID</th>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Effective Date</th>
                  <th className="py-3 px-4">Validity Expiry</th>
                  <th className="py-3 px-4 text-center">Status / Countdown</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {partners.map((p) => {
                  const isExpiring = p.moaDaysRemaining && p.moaDaysRemaining <= 60;
                  const status = p.moaRenewalStatus || (p.status === 'Active' ? 'Valid' : 'Pending Renewal');

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#002B6D] text-white flex items-center justify-center font-black text-xs uppercase shrink-0">
                            {p.logo?.includes('.webp') ? 'ALS' : (p.logo?.substring(0, 3) || 'PT')}
                          </div>
                          <div>
                            <span className="font-extrabold text-[#002B6D] block">{p.organizationName}</span>
                            <span className="text-[10px] font-mono text-slate-400">{p.recordId}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          {p.partnershipDocument || `MOA-${p.recordId}.pdf`}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600">
                        {p.registrationDate || '2024-01-15'}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {p.moaValidityDate || '2027-06-30'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-extrabold uppercase border ${
                            status === 'Valid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {status}
                          </span>
                          <span className={`text-[10px] font-mono mt-0.5 ${isExpiring ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                            {p.moaDaysRemaining ? `${p.moaDaysRemaining} days remaining` : 'Active Term'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => alert(`Opening digital copy of ${p.partnershipDocument || 'MOA Document'} from DepEd Cloud Storage.`)}
                            className="p-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition cursor-pointer"
                            title="Download/Preview Document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleLaunchAIPrompt(`Generate a formal DepEd Memorandum of Agreement renewal letter addressed to ${p.contactPerson}, ${p.position} of ${p.organizationName}.`)}
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition cursor-pointer"
                            title="Draft Renewal Letter with ElFabriX AI"
                          >
                            <Bot className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
