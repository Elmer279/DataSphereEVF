/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Partner } from '../types';

export function getResolvedPartnerLogoUrl(logoStr?: string): string {
  const defaultLogoUrl = "https://lh3.googleusercontent.com/d/12sloaEcJJjrCFsGfpORhLVDPomErGWp0";
  if (!logoStr) return defaultLogoUrl;
  
  const trimmed = logoStr.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
    }
    const ucMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (ucMatch && ucMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`;
    }
    return trimmed;
  }
  return defaultLogoUrl;
}

export function renderPartnerStatusBadge(status?: string, daysRemaining?: number) {
  const isExpiringSoon = daysRemaining !== undefined && daysRemaining <= 90 && daysRemaining > 0;
  
  if (status === 'Active' && !isExpiringSoon) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[7.5pt] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        ACTIVE MOA
      </span>
    );
  }
  
  if (status === 'Pending Renewal' || isExpiringSoon) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[7.5pt] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        RENEWAL ACTIVE ({daysRemaining || 42}D)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[7.5pt] font-mono font-bold bg-slate-500/20 text-slate-300 border border-slate-500/40">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      ON FILE
    </span>
  );
}

interface PartnerCarouselCardProps {
  partner: Partner;
  className?: string;
}

export const PartnerCarouselCard: React.FC<PartnerCarouselCardProps> = ({ partner, className = '' }) => {
  const logoUrl = getResolvedPartnerLogoUrl(partner.logo);

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '5.2cm', 
        fontFamily: '"Roboto", sans-serif'
      }}
      className={`bg-gradient-to-br from-[#002B6D] via-[#032356] to-[#011432] text-slate-100 rounded-2xl border border-sky-400/40 overflow-hidden shadow-2xl select-none p-4 ${className}`}
    >
      <div className="relative w-full h-full flex flex-row gap-5 select-none">
        {/* Left Column: Logo */}
        <div className="flex flex-col items-center justify-center shrink-0 z-10">
          <div 
            style={{ width: '2.5cm', height: '2.5cm' }}
            className="rounded-full bg-[#02132d] border border-sky-400/30 flex items-center justify-center shadow-inner transition-colors overflow-hidden ring-2 ring-sky-500/10"
          >
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={partner.organizationName} 
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="text-[14pt] font-black text-white">{partner.logo || 'PT'}</span>
            )}
          </div>
        </div>

        {/* Right Column: Refined Contact & Credential Fields */}
        <div className="flex-1 flex flex-col justify-between h-full min-w-0 z-10">
          <div className="flex items-start justify-between gap-2 border-b border-sky-800/40 pb-1.5">
            <div className="min-w-0">
              <h4 className="text-[11pt] font-black text-white truncate leading-tight" title={partner.organizationName}>
                {partner.organizationName}
              </h4>
              <span className="text-[8pt] font-bold text-sky-300 uppercase tracking-wide block truncate mt-0.5">
                {partner.partnerType}
              </span>
            </div>
            {renderPartnerStatusBadge(partner.status, partner.moaDaysRemaining)}
          </div>

          {/* Dense credential grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5 py-1 text-[8pt] grow overflow-y-auto scrollbar-none pr-1 mt-1">
            <div>
              <span className="block text-[6.5pt] font-extrabold text-[#94a3b8] uppercase tracking-wider">Partner Record ID</span>
              <span className="font-mono font-bold text-sky-100 block truncate">{partner.recordId}</span>
            </div>
            <div>
              <span className="block text-[6.5pt] font-extrabold text-[#94a3b8] uppercase tracking-wider">MOA Validity</span>
              <span className="font-bold text-emerald-400 block truncate">{partner.moaValidityDate || 'Multi-Year Active'}</span>
            </div>
            <div>
              <span className="block text-[6.5pt] font-extrabold text-[#94a3b8] uppercase tracking-wider">Learners Supported</span>
              <span className="font-black text-white block truncate">{(partner.learnersSupported || 0).toLocaleString()} learners</span>
            </div>
            <div>
              <span className="block text-[6.5pt] font-extrabold text-[#94a3b8] uppercase tracking-wider">Contact Person</span>
              <span className="font-bold text-white block truncate">{partner.contactPerson} {partner.position ? `(${partner.position})` : ''}</span>
            </div>
            <div>
              <span className="block text-[6.5pt] font-extrabold text-[#94a3b8] uppercase tracking-wider">Direct Phone</span>
              <span className="font-extrabold text-emerald-400 block truncate">{partner.phoneNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-[6.5pt] font-extrabold text-[#94a3b8] uppercase tracking-wider">Type of Support</span>
              <span className="font-bold text-sky-300 block truncate">{partner.typeOfSupport}</span>
            </div>
          </div>

          {partner.address && (
            <div className="text-[7pt] text-slate-300 border-t border-sky-800/30 pt-1 flex items-center justify-between">
              <span className="truncate"><strong>Location:</strong> {partner.address}</span>
              {partner.clcCoverageAreas && partner.clcCoverageAreas.length > 0 && (
                <span className="text-sky-300 shrink-0 font-medium ml-2">
                  {partner.clcCoverageAreas.length} CLC Hubs Connected
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
