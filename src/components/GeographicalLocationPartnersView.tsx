/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { 
  Building2, 
  MapPin, 
  Users, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Layers, 
  Filter, 
  Sparkles,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Navigation,
  Handshake,
  Compass,
  Search
} from 'lucide-react';
import { Partner } from '../types';
import { PartnerCarouselCard, getResolvedPartnerLogoUrl } from './PartnerCarouselCard';

interface GeographicalLocationPartnersViewProps {
  partners: Partner[];
}

// Fixed coordinates for linked Community Learning Center hubs across Tarlac City
const LINKED_CLC_HUBS: { [key: string]: { name: string; lat: number; lng: number; barangay: string } } = {
  "San Vicente CLC": { name: "San Vicente Community Learning Center", lat: 15.4860, lng: 120.5910, barangay: "San Vicente" },
  "Ligtasan Satellite CLC": { name: "Ligtasan Satellite Learning Node", lat: 15.4920, lng: 120.5940, barangay: "Ligtasan" },
  "Tibag ALS Learning Hub": { name: "Tibag Secondary ALS Center", lat: 15.4790, lng: 120.5820, barangay: "Tibag" },
  "Mabini Community Center": { name: "Mabini Literacy Node", lat: 15.4855, lng: 120.5975, barangay: "Mabini" },
  "BJMP Male & Female Dorms": { name: "BJMP Correctional ALS Learning Center", lat: 15.4740, lng: 120.5690, barangay: "Baras-Baras" },
  "Baras-Baras Youth Learning Hub": { name: "Baras-Baras Community Center", lat: 15.4710, lng: 120.5720, barangay: "Baras-Baras" },
  "San Nicolas CLC": { name: "San Nicolas ALS Community Center", lat: 15.4830, lng: 120.5890, barangay: "San Nicolas" },
  "San Roque Learning Node": { name: "San Roque Barangay Learning Center", lat: 15.4780, lng: 120.6010, barangay: "San Roque" },
  "Poblacion Central Community Center": { name: "Poblacion Central ALS Hub", lat: 15.4840, lng: 120.5930, barangay: "Poblacion" },
  "Tarlac City Public Library E-Learning Zone": { name: "City Library ALS E-Learning Center", lat: 15.4845, lng: 120.5955, barangay: "Poblacion" },
  "San Rafael Community Learning Center": { name: "San Rafael Literacy Center", lat: 15.4620, lng: 120.6110, barangay: "San Rafael" },
  "San Miguel Secondary ALS Hub": { name: "San Miguel Technical Learning Center", lat: 15.4580, lng: 120.6180, barangay: "San Miguel" },
  "Central Azucarera de Tarlac CLC": { name: "Central Azucarera Community Learning Hub", lat: 15.4990, lng: 120.5760, barangay: "Central" },
  "Maliwalo Community Learning Center": { name: "Maliwalo Community Center", lat: 15.4950, lng: 120.6150, barangay: "Maliwalo" },
  "Sapang Tagalog Skills Center": { name: "Sapang Tagalog Vocational Center", lat: 15.5120, lng: 120.5920, barangay: "Sapang Tagalog" }
};

export function GeographicalLocationPartnersView({ partners }: GeographicalLocationPartnersViewProps) {
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showLinkageLines, setShowLinkageLines] = useState<boolean>(true);
  const [focusedPartnerId, setFocusedPartnerId] = useState<number | null>(null);

  // Partner Types
  const partnerTypes = useMemo(() => {
    const types = new Set(partners.map(p => p.partnerType));
    return ['All', ...Array.from(types).filter(Boolean)];
  }, [partners]);

  // Filtered partner list with coordinates
  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      const matchesType = selectedType === 'All' || p.partnerType === selectedType;
      const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
      const matchesSearch = !searchQuery.trim() || 
        p.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.typeOfSupport.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesStatus && matchesSearch && p.lat && p.lng;
    });
  }, [partners, selectedType, selectedStatus, searchQuery]);

  // Generate custom Leaflet marker icon using the Partner's Logo as requested
  const createPartnerLogoMarkerIcon = (partner: Partner, isFocused: boolean) => {
    const logoUrl = getResolvedPartnerLogoUrl(partner.logo);
    const statusBg = partner.status === 'Active' ? '#10b981' : '#f59e0b';
    const ringClass = isFocused 
      ? 'ring-4 ring-amber-400 scale-120 z-50' 
      : 'ring-2 ring-white hover:scale-115 hover:ring-amber-300';

    const htmlString = `
      <div class="relative group cursor-pointer transition-all duration-200 ${ringClass} rounded-full shadow-2xl flex items-center justify-center bg-[#002B6D]" style="width: 52px; height: 52px; padding: 2px;">
        <div class="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center border border-white">
          <img 
            src="${logoUrl}" 
            alt="${partner.organizationName}" 
            style="width: 100%; height: 100%; object-fit: cover;"
            onerror="this.onerror=null;this.src='https://lh3.googleusercontent.com/d/12sloaEcJJjrCFsGfpORhLVDPomErGWp0';"
          />
        </div>
        <span style="position: absolute; bottom: -2px; right: -2px; width: 14px; height: 14px; border-radius: 9999px; background-color: ${statusBg}; border: 2.5px solid #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></span>
      </div>
    `;

    return L.divIcon({
      html: htmlString,
      className: 'custom-partner-logo-marker',
      iconSize: [52, 52],
      iconAnchor: [26, 26],
      popupAnchor: [0, -30]
    });
  };

  return (
    <div className="space-y-5 font-sans select-none">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#002B6D] via-[#023b93] to-[#011d4d] text-white p-6 rounded-3xl shadow-sm border border-sky-900/30 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] uppercase font-mono tracking-wider font-extrabold bg-sky-200/20 text-sky-200 border border-sky-300/30 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-sky-300" />
              DepEd Tarlac City Schools Division • Database on Partners and Linkages
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] uppercase font-mono tracking-wider font-extrabold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              Geolocation Registry Active
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <MapPin className="w-7 h-7 text-amber-400 shrink-0" />
            Geographical Location of Partners and Linkages
          </h1>

          <p className="text-xs sm:text-[13px] text-sky-100/90 leading-relaxed max-w-3xl font-medium">
            Spatial distribution map displaying the physical location and institutional headquarters of DepEd-recognized ALS partners across Tarlac City. Hover over any partner logo to display its comprehensive credentials, MOA status, and active Community Learning Center linkages.
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-center">
            <span className="text-[10px] uppercase font-mono text-sky-200 font-bold block">Mapped Partners</span>
            <span className="text-xl font-extrabold text-white">{filteredPartners.length}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-center">
            <span className="text-[10px] uppercase font-mono text-sky-200 font-bold block">Total Learners Supported</span>
            <span className="text-xl font-extrabold text-amber-300">
              {filteredPartners.reduce((acc, p) => acc + (p.learnersSupported || 0), 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Map Control Ribbon */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search partner name, address, support type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#002B6D] text-xs transition"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 text-xs focus:outline-none"
            >
              {partnerTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 text-xs focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending Renewal">Pending Renewal</option>
            </select>
          </div>
        </div>

        {/* CLC Linkage Rays Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={showLinkageLines}
              onChange={(e) => setShowLinkageLines(e.target.checked)}
              className="w-3.5 h-3.5 text-[#002B6D] rounded border-slate-300 focus:ring-[#002B6D]"
            />
            <span className="text-[11px] font-bold text-slate-700">Display CLC Linkage Rays</span>
          </label>
        </div>
      </div>

      {/* 3. Interactive Leaflet Map Container */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-slate-100" style={{ height: '620px' }}>
        <MapContainer
          center={[15.4850, 120.5930]}
          zoom={13}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filteredPartners.map((partner) => {
            const isFocused = focusedPartnerId === partner.id;

            return (
              <React.Fragment key={`geo-partner-${partner.id || partner.recordId}`}>
                <Marker
                  position={[partner.lat!, partner.lng!]}
                  icon={createPartnerLogoMarkerIcon(partner, isFocused)}
                  eventHandlers={{
                    mouseover: (e) => {
                      e.target.openPopup();
                      setFocusedPartnerId(partner.id);
                    },
                    click: () => {
                      setFocusedPartnerId(partner.id);
                    }
                  }}
                >
                  <Popup 
                    maxWidth={680} 
                    minWidth={540} 
                    className="custom-partner-card-popup"
                    autoPan={true}
                  >
                    <div className="overflow-hidden rounded-2xl shadow-2xl">
                      <PartnerCarouselCard partner={partner} />
                    </div>
                  </Popup>
                </Marker>

                {/* Draw Linkage lines to connected Community Learning Centers */}
                {showLinkageLines && partner.clcCoverageAreas && partner.clcCoverageAreas.map((areaName, aIdx) => {
                  const targetHub = LINKED_CLC_HUBS[areaName];
                  if (!targetHub) return null;

                  return (
                    <React.Fragment key={`linkage-line-${partner.id}-${aIdx}`}>
                      <Polyline
                        positions={[
                          [partner.lat!, partner.lng!],
                          [targetHub.lat, targetHub.lng]
                        ]}
                        color={partner.id === 1 ? '#d97706' : partner.id === 2 ? '#0284c7' : partner.id === 4 ? '#059669' : '#002B6D'}
                        weight={isFocused ? 3 : 1.5}
                        dashArray="4, 6"
                        opacity={isFocused ? 0.9 : 0.45}
                      />
                      <CircleMarker
                        center={[targetHub.lat, targetHub.lng]}
                        radius={4}
                        fillColor="#002B6D"
                        fillOpacity={0.85}
                        color="#ffffff"
                        weight={1.5}
                      >
                        <Popup>
                          <div className="p-2 space-y-1 text-slate-800 text-xs font-sans">
                            <h5 className="font-extrabold text-[#002B6D]">{targetHub.name}</h5>
                            <p className="text-[10px] text-slate-500">Barangay: <strong>{targetHub.barangay}</strong></p>
                            <p className="text-[10px] text-sky-700 font-semibold">Partner: {partner.organizationName}</p>
                          </div>
                        </Popup>
                      </CircleMarker>
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Hover Hint Overlay Pill */}
        <div className="absolute top-4 right-4 z-400 bg-slate-900/80 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-[11px] font-bold border border-white/20 shadow-lg flex items-center gap-2 pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Hover mouse over any logo marker to preview Partner card</span>
        </div>
      </div>
    </div>
  );
}
