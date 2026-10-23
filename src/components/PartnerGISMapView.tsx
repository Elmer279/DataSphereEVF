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
  Navigation
} from 'lucide-react';
import { Partner } from '../types';

interface PartnerGISMapViewProps {
  partners: Partner[];
  onSelectPartner?: (partner: Partner) => void;
}

// Fixed coordinates for linked CLC hubs across Tarlac City
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

export const PartnerGISMapView: React.FC<PartnerGISMapViewProps> = ({ partners }) => {
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [showLinkageLines, setShowLinkageLines] = useState<boolean>(true);
  const [focusedPartnerId, setFocusedPartnerId] = useState<number | null>(null);

  // Extract partner types
  const partnerTypes = useMemo(() => {
    const types = new Set(partners.map(p => p.partnerType));
    return ['All', ...Array.from(types).filter(Boolean)];
  }, [partners]);

  // Filtered partner list
  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      const matchesType = selectedType === 'All' || p.partnerType === selectedType;
      const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
      return matchesType && matchesStatus && p.lat && p.lng;
    });
  }, [partners, selectedType, selectedStatus]);

  // Generate dynamic custom Leaflet icons for each partner
  const getPartnerMarkerIcon = (p: Partner, isFocused: boolean) => {
    const isALSTIG = p.organizationName.toLowerCase().includes('alstig');
    const isTSU = p.organizationName.toLowerCase().includes('tsu') || p.organizationName.toLowerCase().includes('tarlac state');
    const isUSAID = p.organizationName.toLowerCase().includes('usaid');
    const isLGU = p.organizationName.toLowerCase().includes('lgu') || p.organizationName.toLowerCase().includes('city hall');
    
    let badgeBg = 'bg-[#002B6D] text-white';
    if (isTSU) badgeBg = 'bg-amber-600 text-white';
    if (isUSAID) badgeBg = 'bg-sky-600 text-white';
    if (isLGU) badgeBg = 'bg-emerald-600 text-white';
    if (isALSTIG) badgeBg = 'bg-indigo-700 text-white';

    const ringEffect = isFocused ? 'ring-4 ring-amber-400 scale-110 z-50' : 'ring-2 ring-white hover:scale-105';

    const htmlString = `
      <div class="relative group cursor-pointer transition-transform duration-200 ${ringEffect} rounded-2xl shadow-xl flex items-center justify-center ${badgeBg}" style="width: 44px; height: 44px;">
        <span class="text-xs font-black tracking-tight uppercase">${p.logo?.includes('.webp') ? 'ALS' : (p.logo?.substring(0, 3) || 'PTR')}</span>
        <span class="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ${p.status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'} border-2 border-white shadow-xs"></span>
      </div>
    `;

    return L.divIcon({
      html: htmlString,
      className: 'custom-partner-marker',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -24]
    });
  };

  // Center on Tarlac City
  const centerCoords: [number, number] = [15.4862, 120.5950];

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col font-sans">
      {/* Header bar with filters */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#002B6D] to-[#011e4d] text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-mono font-extrabold uppercase tracking-wider bg-white/20 text-sky-200 backdrop-blur-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              GIS Geospatial Integration
            </span>
            <span className="text-[10px] text-sky-200/80 font-mono">• {filteredPartners.length} Mapped Stakeholders</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-300" />
            Tarlac City Partner Locations & CLC Coverage Map
          </h3>
          <p className="text-xs text-sky-100/80 max-w-2xl leading-relaxed">
            Geographic footprint of DepEd-recognized higher education institutions, local government units, NGOs, and corporate partners alongside connected Community Learning Centers (CLCs).
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0 text-xs">
          {/* Sector Type Filter */}
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
            <Filter className="w-3.5 h-3.5 text-sky-300" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-white font-bold text-xs focus:outline-hidden cursor-pointer"
            >
              {partnerTypes.map(t => (
                <option key={t} value={t} className="bg-slate-900 text-white">{t}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
            <span className="text-slate-300 text-[11px] font-semibold">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-white font-bold text-xs focus:outline-hidden cursor-pointer"
            >
              <option value="All" className="bg-slate-900 text-white">All States</option>
              <option value="Active" className="bg-slate-900 text-white">Active Only</option>
              <option value="Pending Renewal" className="bg-slate-900 text-white">Pending Renewal</option>
            </select>
          </div>

          {/* Linkage lines toggle */}
          <button
            type="button"
            onClick={() => setShowLinkageLines(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
              showLinkageLines 
                ? 'bg-sky-500/30 text-sky-200 border-sky-400/50' 
                : 'bg-white/10 text-slate-300 border-white/20 hover:bg-white/20'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>CLC Linkage Rays: {showLinkageLines ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Map Viewport */}
      <div className="relative w-full h-[520px] bg-slate-100 z-10">
        <MapContainer
          center={centerCoords}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Plot Partner HQ Markers */}
          {filteredPartners.map((p) => {
            if (!p.lat || !p.lng) return null;
            const isFocused = focusedPartnerId === p.id;
            const customIcon = getPartnerMarkerIcon(p, isFocused);

            return (
              <React.Fragment key={`partner-marker-${p.id}`}>
                <Marker
                  position={[p.lat, p.lng]}
                  icon={customIcon}
                  eventHandlers={{
                    click: () => setFocusedPartnerId(p.id)
                  }}
                >
                  <Popup minWidth={340} maxWidth={420}>
                    <div className="p-3.5 space-y-3 font-sans text-slate-800">
                      {/* Header */}
                      <div className="flex items-start gap-3 pb-2.5 border-b border-slate-200">
                        <div className="w-12 h-12 rounded-xl bg-[#002B6D] text-white flex items-center justify-center font-black text-sm uppercase shrink-0 shadow-sm">
                          {p.logo?.includes('.webp') ? 'ALS' : (p.logo?.substring(0, 3) || 'PT')}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <span className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-extrabold uppercase border inline-block ${
                            p.status === 'Active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {p.status} • {p.partnerType}
                          </span>
                          <h4 className="font-extrabold text-[#002B6D] text-sm leading-snug">
                            {p.organizationName}
                          </h4>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            {p.address}
                          </p>
                        </div>
                      </div>

                      {/* Metrics Snapshot */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold block">Learners Supported:</span>
                          <span className="font-mono font-black text-[#002B6D] text-sm">{p.learnersSupported.toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold block">MOA Validity:</span>
                          <span className="font-mono font-bold text-emerald-700 text-xs">{p.moaValidityDate || 'Active Multi-Year'}</span>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-1 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <p className="flex items-center gap-1.5 truncate">
                          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="font-bold text-slate-700">Contact:</span> {p.contactPerson} ({p.phoneNumber || 'N/A'})
                        </p>
                        <p className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3 h-3 text-sky-600 shrink-0" />
                          <span className="font-bold text-slate-700">Email:</span> {p.emailAddress}
                        </p>
                      </div>

                      {/* Connected CLC Hubs */}
                      {p.clcCoverageAreas && p.clcCoverageAreas.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                            Connected CLC Learning Hubs ({p.clcCoverageAreas.length}):
                          </span>
                          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                            {p.clcCoverageAreas.map((area, aIdx) => (
                              <span key={aIdx} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-50 text-sky-800 border border-sky-100">
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>

                {/* Draw Linkage Rays connecting Partner HQ to linked Community Learning Centers */}
                {showLinkageLines && p.clcCoverageAreas && p.clcCoverageAreas.map((areaName, aIdx) => {
                  const targetHub = LINKED_CLC_HUBS[areaName];
                  if (!targetHub) return null;

                  return (
                    <React.Fragment key={`linkage-${p.id}-${aIdx}`}>
                      <Polyline
                        positions={[
                          [p.lat!, p.lng!],
                          [targetHub.lat, targetHub.lng]
                        ]}
                        color={p.id === 1 ? '#d97706' : p.id === 2 ? '#0284c7' : p.id === 4 ? '#059669' : '#002B6D'}
                        weight={isFocused ? 3 : 1.5}
                        dashArray="4, 6"
                        opacity={isFocused ? 0.9 : 0.45}
                      />
                      <CircleMarker
                        center={[targetHub.lat, targetHub.lng]}
                        radius={4}
                        fillColor="#002B6D"
                        fillOpacity={0.8}
                        color="#ffffff"
                        weight={1.5}
                      >
                        <Popup>
                          <div className="p-2 space-y-1 text-slate-800 text-xs">
                            <h5 className="font-bold text-[#002B6D]">{targetHub.name}</h5>
                            <p className="text-[10px] text-slate-500">Barangay: {targetHub.barangay}</p>
                            <p className="text-[10px] text-sky-700 font-semibold">Linked with: {p.organizationName}</p>
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

        {/* Floating Map Legend & Summary HUD */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/90 shadow-lg text-xs max-w-xs space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <span className="font-extrabold text-[#002B6D] flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-sky-600" />
              GIS Linkage Radar
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400">TCSD Alliance</span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#002B6D] shrink-0 border border-white shadow-2xs"></span>
              <span>Partner Headquarters / Regional Hub</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0 border border-white"></span>
              <span>Linked Community Learning Center (CLC)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 border-b border-dashed border-sky-600 shrink-0"></span>
              <span>Inter-Barangay Resource Mobilization Link</span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Coverage: 76 Barangays</span>
            <span className="font-bold text-emerald-600">4,850+ Learners Linked</span>
          </div>
        </div>
      </div>
    </div>
  );
};
