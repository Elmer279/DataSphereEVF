/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Handshake, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  SlidersHorizontal,
  X,
  PlusCircle,
  TrendingUp,
  Award,
  Users,
  RefreshCw
} from 'lucide-react';
import { Partner } from '../types';

interface PartnersRegistryViewProps {
  partners: Partner[];
  setPartners: React.Dispatch<React.SetStateAction<Partner[]>>;
  onResetPartners: () => void;
  onSyncPartners?: () => Promise<void>;
  syncLoading?: boolean;
  syncError?: string | null;
}

export function PartnersRegistryView({ 
  partners,
  setPartners,
  onResetPartners,
  onSyncPartners,
  syncLoading,
  syncError
}: PartnersRegistryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  
  // Modal states for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  // Form states
  const [logo, setLogo] = useState('');
  const [recordId, setRecordId] = useState('');
  const [registrationDate, setRegistrationDate] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [partnerType, setPartnerType] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'Active' | 'Pending Renewal' | 'Inactive'>('Active');
  const [contactPerson, setContactPerson] = useState('');
  const [position, setPosition] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [typeOfSupport, setTypeOfSupport] = useState('');
  const [learnersSupported, setLearnersSupported] = useState(0);
  const [yearsOfPartnership, setYearsOfPartnership] = useState(1);
  const [partnershipDocument, setPartnershipDocument] = useState('');
  const [keyContactPerson, setKeyContactPerson] = useState('');

  // Extract unique partner types for filtering
  const partnerTypes = useMemo(() => {
    const types = new Set(partners.map(p => p.partnerType));
    return Array.from(types).filter(Boolean);
  }, [partners]);

  // Filtered partners
  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      const matchesSearch = 
        p.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.recordId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.keyContactPerson && p.keyContactPerson.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchesType = typeFilter === 'All' || p.partnerType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [partners, searchTerm, statusFilter, typeFilter]);

  // Open modal for adding a new partner
  const handleAddClick = () => {
    setEditingPartner(null);
    setLogo('');
    setRecordId(`PART-ALS-${new Date().getFullYear()}-${String(partners.length + 1).padStart(3, '0')}`);
    setRegistrationDate(new Date().toISOString().split('T')[0]);
    setOrganizationName('');
    setPartnerType('');
    setAddress('');
    setStatus('Active');
    setContactPerson('');
    setPosition('');
    setEmailAddress('');
    setPhoneNumber('');
    setTypeOfSupport('');
    setLearnersSupported(0);
    setYearsOfPartnership(1);
    setPartnershipDocument('');
    setKeyContactPerson('');
    setIsModalOpen(true);
  };

  // Open modal for editing a partner
  const handleEditClick = (p: Partner) => {
    setEditingPartner(p);
    setLogo(p.logo);
    setRecordId(p.recordId);
    setRegistrationDate(p.registrationDate || '');
    setOrganizationName(p.organizationName);
    setPartnerType(p.partnerType);
    setAddress(p.address);
    setStatus(p.status);
    setContactPerson(p.contactPerson);
    setPosition(p.position);
    setEmailAddress(p.emailAddress);
    setPhoneNumber(p.phoneNumber);
    setTypeOfSupport(p.typeOfSupport);
    setLearnersSupported(p.learnersSupported);
    setYearsOfPartnership(p.yearsOfPartnership);
    setPartnershipDocument(p.partnershipDocument);
    setKeyContactPerson(p.keyContactPerson || '');
    setIsModalOpen(true);
  };

  // Handle delete partner
  const handleDeleteClick = async (id: number) => {
    const targetPartner = partners.find(p => p.id === id);
    if (!targetPartner) return;

    if (confirm(`Are you sure you want to remove the partner record "${targetPartner.organizationName}" from the registry?`)) {
      // Optimistic delete
      setPartners(prev => prev.filter(p => p.id !== id));

      const currentTimestamp = new Date().toISOString();
      const recId = targetPartner.recordId ? `part-${targetPartner.recordId}` : `part-${id}`;

      const syncPayload = {
        record_id: recId,
        action: 'DELETE',
        payload: {
          no: String(targetPartner.id),
          logo: targetPartner.logo,
          recordId: targetPartner.recordId,
          registrationDate: targetPartner.registrationDate,
          organizationName: targetPartner.organizationName,
          partnerType: targetPartner.partnerType,
          address: targetPartner.address,
          status: targetPartner.status,
          contactPerson: targetPartner.contactPerson,
          position: targetPartner.position,
          emailAddress: targetPartner.emailAddress,
          phoneNumber: targetPartner.phoneNumber,
          typeOfSupport: targetPartner.typeOfSupport,
          learnersSupported: targetPartner.learnersSupported,
          yearsOfPartnership: targetPartner.yearsOfPartnership,
          partnershipDocument: targetPartner.partnershipDocument,
          keyContactPerson: targetPartner.keyContactPerson || ''
        },
        timestamp: currentTimestamp
      };

      try {
        const response = await fetch('/api/partners/sync', {
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
          console.log('[Partners Sync] Success deleting partner row');
          if (onSyncPartners) {
            onSyncPartners();
          }
        } else {
          throw new Error(result.error || 'Failed to sync delete with controller');
        }
      } catch (err: any) {
        console.warn('Failed to sync delete, record removed locally (offline fallback mode).', err);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName || !contactPerson) {
      alert("Please fill in Organization Name and Contact Person.");
      return;
    }

    const computedLogo = logo || organizationName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const action = editingPartner ? 'UPDATE' : 'CREATE';
    const currentTimestamp = new Date().toISOString();

    let newNo = '';
    let partnerId = 0;
    if (!editingPartner) {
      partnerId = Math.max(0, ...partners.map(p => p.id)) + 1;
      newNo = partnerId.toString();
    } else {
      partnerId = editingPartner.id;
      newNo = editingPartner.id.toString();
    }

    const finalRecordId = recordId || `PART-ALS-2025-${String(partnerId).padStart(3, '0')}`;
    const recId = `part-${finalRecordId}`;

    const newPartner: Partner = {
      id: partnerId,
      logo: computedLogo,
      recordId: finalRecordId,
      registrationDate: registrationDate || new Date().toISOString().split('T')[0],
      organizationName,
      partnerType: partnerType || "Stakeholder Partner",
      address: address || "Tarlac City, Philippines",
      status: status || 'Active',
      contactPerson,
      position: position || 'Representative',
      emailAddress: emailAddress || 'info@partner.org',
      phoneNumber: phoneNumber || 'N/A',
      typeOfSupport: typeOfSupport || 'General Support',
      learnersSupported: Number(learnersSupported) || 0,
      yearsOfPartnership: Number(yearsOfPartnership) || 0,
      partnershipDocument: partnershipDocument || 'MOU-Pending.pdf',
      keyContactPerson: keyContactPerson || 'District Coordinator'
    };

    // Optimistically update locally
    if (editingPartner) {
      setPartners(prev => prev.map(p => p.id === editingPartner.id ? newPartner : p));
    } else {
      setPartners(prev => [...prev, newPartner]);
    }

    setIsModalOpen(false);

    // Sync with Dual-Sync Controller
    const syncPayload = {
      record_id: recId,
      action: action,
      payload: {
        no: newNo,
        logo: newPartner.logo,
        recordId: newPartner.recordId,
        registrationDate: newPartner.registrationDate,
        organizationName: newPartner.organizationName,
        partnerType: newPartner.partnerType,
        address: newPartner.address,
        status: newPartner.status,
        contactPerson: newPartner.contactPerson,
        position: newPartner.position,
        emailAddress: newPartner.emailAddress,
        phoneNumber: newPartner.phoneNumber,
        typeOfSupport: newPartner.typeOfSupport,
        learnersSupported: newPartner.learnersSupported,
        yearsOfPartnership: newPartner.yearsOfPartnership,
        partnershipDocument: newPartner.partnershipDocument,
        keyContactPerson: newPartner.keyContactPerson
      },
      timestamp: currentTimestamp
    };

    try {
      const response = await fetch('/api/partners/sync', {
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
        console.log('[Partners Sync] Success syncing partner save');
        if (onSyncPartners) {
          onSyncPartners();
        }
      } else {
        throw new Error(result.error || 'Failed to sync partner save with controller');
      }
    } catch (err: any) {
      console.warn('Failed to sync partner save, updated locally (offline fallback mode).', err);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "No.", "Logo", "Partner Record ID", "Registration Date", "Organization Name", 
      "Partner Type", "Address", "Status", "Contact Person", "Position", 
      "Email Address", "Phone Number", "Type of Support", "Number of ALS Learners Supported", 
      "Years of Partnership", "Partnership Document", "Key Contact Person"
    ];
    
    const rows = filteredPartners.map((p, idx) => [
      idx + 1,
      p.logo,
      p.recordId,
      p.registrationDate || '',
      p.organizationName,
      p.partnerType,
      p.address,
      p.status,
      p.contactPerson,
      p.position,
      p.emailAddress,
      p.phoneNumber,
      p.typeOfSupport,
      p.learnersSupported,
      p.yearsOfPartnership,
      p.partnershipDocument,
      p.keyContactPerson || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Registry_Partners_Linkages_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics calculations
  const totalPartnersCount = partners.length;
  const activePartnersCount = partners.filter(p => p.status === 'Active').length;
  const totalLearnersSupported = partners.reduce((acc, p) => acc + (p.learnersSupported || 0), 0);
  const avgPartnershipYears = totalPartnersCount > 0 
    ? (partners.reduce((acc, p) => acc + (p.yearsOfPartnership || 0), 0) / totalPartnersCount).toFixed(1)
    : '0';

  return (
    <div id="partners-registry-view" className="flex flex-col h-full bg-[#f8fafc] text-slate-800 animate-fade-in font-sans">
      {/* 1. Header Banner & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#002B6D]/10 rounded-xl text-[#002B6D]">
              <Handshake className="w-5.5 h-5.5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#002B6D] tracking-tight">Data Registry of Partners and Linkages</h2>
              <p className="text-xs text-slate-550 font-medium">Standard registry of active stakeholders, resources, and corporate-social responsibility partnerships.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto shrink-0">
          {onSyncPartners && (
            <button
              onClick={onSyncPartners}
              disabled={syncLoading}
              title="Synchronize baseline database directly from ALS Partner Ecosystem Directory"
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl border transition cursor-pointer ${
                syncLoading
                  ? "bg-slate-100 text-slate-400 border-slate-200"
                  : "bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
              {syncLoading ? "Syncing..." : "Sync Google Sheet"}
            </button>
          )}
          {/* Google Sheets Live Add Link */}
          <a
            href="https://docs.google.com/spreadsheets/d/1eXUy38dZQXjsAW_Bx0rqq_Vrso8GLukyrDwAtGz2gbA/edit?usp=drive_link"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Partner
          </a>
        </div>
      </div>

      {syncError && (
        <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-medium flex items-center justify-between">
          <span>Failed to sync from Sheets: {syncError}. Showing last cached/default dataset.</span>
        </div>
      )}

      {/* 2. Stakeholder Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
        <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-blue-50 text-blue-800 rounded-xl">
            <Handshake className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Total Partners Registered</p>
            <h3 className="text-2xl font-black text-[#002B6D]">{totalPartnersCount}</h3>
            <p className="text-[9px] font-semibold text-slate-500">Across divisions & offices</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Active MoA Status</p>
            <h3 className="text-2xl font-black text-emerald-700">{activePartnersCount}</h3>
            <p className="text-[9px] font-semibold text-slate-500">In good standing</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-[#002B6D]/5 text-[#002B6D] rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">ALS Learners Supported</p>
            <h3 className="text-2xl font-black text-[#002B6D]">{totalLearnersSupported.toLocaleString()}</h3>
            <p className="text-[9px] font-semibold text-slate-500">Recipients of support</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-amber-50 text-amber-800 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Average Partnership</p>
            <h3 className="text-2xl font-black text-amber-700">{avgPartnershipYears} Years</h3>
            <p className="text-[9px] font-semibold text-slate-500">Sustained collaborations</p>
          </div>
        </div>
      </div>

      {/* 3. Search and Filters Toolbar */}
      <div className="px-6 pb-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Org name, contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#002B6D] font-medium"
          />
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto w-full sm:w-auto">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-40 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#002B6D] font-semibold"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending Renewal">Pending Renewal</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#002B6D] font-semibold"
          >
            <option value="All">All Partner Types</option>
            {partnerTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {filteredPartners.length !== partners.length && (
          <span className="text-[11px] font-medium text-slate-500 ml-auto bg-slate-100 px-2.5 py-1 rounded-full">
            Showing {filteredPartners.length} of {partners.length} records
          </span>
        )}
      </div>

      {/* 4. Scrollable Table Section */}
      <div className="flex-1 overflow-x-auto px-6 pb-6 min-h-[300px]">
        <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-2xs min-w-[2000px]">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-black text-center">
                <th className="py-3 px-3 w-14 text-center border-r border-slate-200">No.</th>
                <th className="py-3 px-3 w-16 text-center border-r border-slate-200">Logo</th>
                <th className="py-3 px-4 w-44 text-center border-r border-slate-200">Partner Record ID</th>
                <th className="py-3 px-3 w-36 text-center border-r border-slate-200">Registration Date</th>
                <th className="py-3 px-4 text-center w-72 border-r border-slate-200">Organization Name</th>
                <th className="py-3 px-4 text-center w-56 border-r border-slate-200">Partner Type</th>
                <th className="py-3 px-4 text-center w-72 border-r border-slate-200">Address</th>
                <th className="py-3 px-3 w-36 text-center border-r border-slate-200">Status</th>
                <th className="py-3 px-4 text-center w-52 border-r border-slate-200">Contact Person</th>
                <th className="py-3 px-4 text-center w-48 border-r border-slate-200">Position</th>
                <th className="py-3 px-4 text-center w-52 border-r border-slate-200">Email Address</th>
                <th className="py-3 px-4 text-center w-40 border-r border-slate-200">Phone Number</th>
                <th className="py-3 px-4 text-center w-64 border-r border-slate-200">Type of Support</th>
                <th className="py-3 px-3 w-40 text-center border-r border-slate-200">ALS Learners Supported</th>
                <th className="py-3 px-3 w-32 text-center border-r border-slate-200">Years of Partnership</th>
                <th className="py-3 px-4 text-center w-52 border-r border-slate-200">Partnership Document</th>
                <th className="py-3 px-4 text-center w-52 border-r border-slate-200">Key Contact Person</th>
                <th className="py-3 px-4 w-28 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={18} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Handshake className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                      <p className="font-extrabold text-xs uppercase tracking-wider text-slate-500">No partner records found matching filters.</p>
                      <p className="text-[10px] text-slate-400">Try adjusting your filters or search criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPartners.map((p, idx) => (
                  <tr key={`partner-row-${p.recordId || p.id || idx}-${idx}`} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3 text-center border-r border-slate-100 font-mono font-black text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3 text-center border-r border-slate-100">
                      <div className="w-8 h-8 rounded-full bg-[#002B6D]/5 border border-slate-200 flex items-center justify-center mx-auto text-[10px] font-black text-[#002B6D] shadow-inner uppercase">
                        {p.logo || 'PT'}
                      </div>
                    </td>
                    <td className="py-3 px-4 border-r border-slate-100 font-mono font-bold text-slate-600">{p.recordId}</td>
                    <td className="py-3 px-3 text-center border-r border-slate-100 font-mono text-slate-500">{p.registrationDate || '—'}</td>
                    <td className="py-3 px-4 border-r border-slate-100 font-extrabold text-[#002B6D]" title={p.organizationName}>{p.organizationName}</td>
                    <td className="py-3 px-4 border-r border-slate-100 text-slate-650" title={p.partnerType}>{p.partnerType}</td>
                    <td className="py-3 px-4 border-r border-slate-100 text-slate-500 truncate max-w-xs" title={p.address}>{p.address || '—'}</td>
                    <td className="py-3 px-3 text-center border-r border-slate-100">
                      <span className={`inline-block px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wider ${
                        p.status === 'Active' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' :
                        p.status === 'Pending Renewal' ? 'text-amber-700 bg-amber-50 border-amber-100' :
                        'text-slate-600 bg-slate-50 border-slate-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-r border-slate-100 font-bold text-slate-900" title={p.contactPerson}>{p.contactPerson}</td>
                    <td className="py-3 px-4 border-r border-slate-100 text-slate-500" title={p.position}>{p.position}</td>
                    <td className="py-3 px-4 border-r border-slate-100 font-mono text-slate-500" title={p.emailAddress}>{p.emailAddress}</td>
                    <td className="py-3 px-4 border-r border-slate-100 font-mono font-semibold text-slate-600">{p.phoneNumber || '—'}</td>
                    <td className="py-3 px-4 border-r border-slate-100 text-slate-600 truncate max-w-xs" title={p.typeOfSupport}>{p.typeOfSupport}</td>
                    <td className="py-3 px-3 text-center border-r border-slate-100 font-mono font-bold text-[#002B6D]">{p.learnersSupported ? p.learnersSupported.toLocaleString() : '0'}</td>
                    <td className="py-3 px-3 text-center border-r border-slate-100 font-mono font-bold text-amber-700">{p.yearsOfPartnership || '0'} Yrs</td>
                    <td className="py-3 px-4 border-r border-slate-100 font-mono text-[10px] text-slate-450" title={p.partnershipDocument}>
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {p.partnershipDocument}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-r border-slate-100 text-slate-650" title={p.keyContactPerson}>{p.keyContactPerson || '—'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditClick(p)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Edit Partner"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(p.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete Partner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* 5. Add / Edit Partner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-fade-in">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-900 text-sm tracking-tight uppercase">
                  {editingPartner ? 'Update Stakeholder Linkage Record' : 'Register New Stakeholder Linkage'}
                </h3>
                <p className="text-[10px] text-slate-550 mt-0.5">Please provide accurate organizational registration details.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            {editingPartner ? (
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs font-semibold">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 mb-1">Organization Name *</label>
                    <input
                      type="text"
                      required
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B6D]"
                      placeholder="e.g. Rotary Club of Tarlac"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Partner Record ID *</label>
                    <input
                      type="text"
                      required
                      value={recordId}
                      onChange={(e) => setRecordId(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B6D] font-mono"
                      placeholder="e.g. ROT-ALS-2024-001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 mb-1">Partner Type</label>
                    <input
                      type="text"
                      value={partnerType}
                      onChange={(e) => setPartnerType(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B6D]"
                      placeholder="e.g. Civic Organization / NGO"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Registration Date</label>
                    <input
                      type="date"
                      value={registrationDate}
                      onChange={(e) => setRegistrationDate(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B6D] font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B6D] font-bold"
                    >
                      <option value="Active">Active</option>
                      <option value="Pending Renewal">Pending Renewal</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Logo / Initials</label>
                    <input
                      type="text"
                      value={logo}
                      onChange={(e) => setLogo(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B6D]"
                      placeholder="e.g. RC (Leave blank to generate)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B6D]"
                    placeholder="Street name, Barangay, City/Municipality, Province"
                  />
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <h4 className="font-black text-[10px] uppercase text-[#002B6D] tracking-wider mb-2">Primary Contact Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 mb-1">Contact Person Name *</label>
                      <input
                        type="text"
                        required
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B6D] font-bold"
                        placeholder="Full Name"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1">Position / Designation</label>
                      <input
                        type="text"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B6D]"
                        placeholder="e.g. Division President"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B6D] font-mono"
                        placeholder="e.g. representative@org.com"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1">Phone / Mobile Number</label>
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B6D] font-mono"
                        placeholder="e.g. 0917-XXX-XXXX"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <h4 className="font-black text-[10px] uppercase text-[#002B6D] tracking-wider mb-2">Scope of Partnership & Deliverables</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 mb-1">Type of Support</label>
                      <input
                        type="text"
                        value={typeOfSupport}
                        onChange={(e) => setTypeOfSupport(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B6D]"
                        placeholder="e.g. Tech training, scholarships"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1">Number of ALS Learners Supported</label>
                      <input
                        type="number"
                        value={learnersSupported}
                        onChange={(e) => setLearnersSupported(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B6D] font-mono"
                        placeholder="e.g. 250"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Years of Active Partnership</label>
                      <input
                        type="number"
                        value={yearsOfPartnership}
                        onChange={(e) => setYearsOfPartnership(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B6D] font-mono"
                        placeholder="e.g. 4"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1">Partnership MOA Document</label>
                      <input
                        type="text"
                        value={partnershipDocument}
                        onChange={(e) => setPartnershipDocument(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B6D] font-mono"
                        placeholder="e.g. MOA-RO-Scholarship-25.pdf"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-slate-500 mb-1">Key Contact Person / ALS Liaison Focal</label>
                    <input
                      type="text"
                      value={keyContactPerson}
                      onChange={(e) => setKeyContactPerson(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B6D]"
                      placeholder="e.g. District ALS Focal Person"
                    />
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#002B6D] hover:bg-[#001D4A] text-white rounded-lg shadow-sm cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                  <Handshake className="w-8 h-8" />
                </div>
                
                <div className="max-w-md space-y-2">
                  <h4 className="text-base font-black text-slate-900 tracking-tight">Ecosystem Directory Managed via Google Sheets</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    To maintain real-time database integrity and synchronized record-keeping across all dashboards, new partners and linkages are managed directly within the secure master Google Sheets spreadsheet.
                  </p>
                </div>

                <div className="w-full max-w-md p-5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ALS Master Partner Database</span>
                  <a 
                    href="https://docs.google.com/spreadsheets/d/1eXUy38dZQXjsAW_Bx0rqq_Vrso8GLukyrDwAtGz2gbA/edit?usp=drive_link"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md hover:shadow-emerald-600/10 transition cursor-pointer"
                  >
                    Open Master Google Sheet
                    <svg className="w-3.5 h-3.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <p className="text-[10px] font-medium text-slate-400 text-center px-4">
                    Note: Adding rows directly to the master spreadsheet will automatically populate this registry upon triggering a fresh Google Sheets Sync.
                  </p>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end w-full max-w-md pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
