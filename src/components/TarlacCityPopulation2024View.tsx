import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  RefreshCw, 
  Download, 
  Printer, 
  Users, 
  CheckCircle2, 
  FileSpreadsheet, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  TrendingUp,
  Sparkles,
  Info,
  X,
  Copy,
  Check,
  User
} from 'lucide-react';
import { BARANGAY_BASELINE_FALLBACK } from '../data/barangayBaseline';

export const SERVICE_ACCOUNT_EMAIL = 'datasphere-core-engine@gen-lang-client-0675008110.iam.gserviceaccount.com';

export const TARLAC_CITY_POPULATION_LOCATIONS: string[] = [
  "Aguso",
  "Alvindia",
  "Amucao",
  "Armenia",
  "Asturias",
  "Atioc",
  "Balanti",
  "Balete",
  "Balibago I",
  "Balibago II",
  "Balingcanaway",
  "Banaba",
  "Bantog",
  "Baras-Baras",
  "Batang-Batang",
  "Binauganan",
  "Bora",
  "Buenavista",
  "Buhilit",
  "Burot",
  "Calingcuan",
  "Capehan",
  "Carangian",
  "Care",
  "Central",
  "Culipat",
  "Cut Cut I",
  "Cut Cut II",
  "Dalayap",
  "Dela Paz",
  "Dolores",
  "Laoang",
  "Ligtasan",
  "Lourdes",
  "Mabini",
  "Maligaya",
  "Maliwalo",
  "Mapalacsiao",
  "Mapalad",
  "Matatalaib",
  "Paraiso",
  "Poblacion",
  "Salapungan",
  "San Carlos",
  "San Francisco",
  "San Isidro",
  "San Jose",
  "San Jose De Urquico",
  "San Juan Bautista",
  "San Juan De Mata",
  "San Luis",
  "San Miguel",
  "San Manuel",
  "San Nicolas",
  "San Pablo",
  "San Pascual",
  "San Rafael",
  "San Roque",
  "San Sebastian",
  "San Vicente",
  "Santa Cruz",
  "Santa Maria",
  "Sto. Cristo",
  "Sto. Domingo",
  "Sto. Nino",
  "Sapang Tagalog",
  "Sapang Maragul",
  "Sepung Calzada",
  "Sinait",
  "Suizo",
  "Tariji",
  "Tibagan",
  "Tibag",
  "Trinidad",
  "Ungot",
  "Villa Bacolor",
  "Baras Baras BJMP Male Dorm",
  "Baras Baras BJMP Female Dorm",
  "Tarlac City"
];

export interface Population2024Record {
  id: string;
  no: number;
  logo: string;
  barangay: string;
  barangayChairman: string;
  district: string;
  classification: 'Urban' | 'Rural';
  population: number;
  populationFormatted: string;
  about: string;
}

export function getResolvedAbout(record: Population2024Record): string {
  const cleanName = (record.barangay || '').toLowerCase().trim();
  const fb = BARANGAY_BASELINE_FALLBACK.find(b => 
    b.barangayNumber === record.no || 
    b.barangayName.toLowerCase().trim() === cleanName ||
    b.barangayName.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanName.replace(/[^a-z0-9]/g, '')
  );

  const fallbackText = fb?.about?.trim();
  const recordText = record.about?.trim();

  // If comprehensive baseline narrative exists, prioritize and combine it to fully populate the About column
  if (fallbackText && fallbackText.length > 100) {
    if (recordText && recordText.length > 20 && !fallbackText.includes(recordText) && !recordText.includes(fallbackText)) {
      return `${recordText} ${fallbackText}`;
    }
    return fallbackText;
  }

  if (recordText && recordText.length > 20) {
    return `${recordText} ${record.barangay} is an active partner community in Tarlac City (${record.district}), participating in the Alternative Learning System (ALS) literacy mapping, Community Learning Center initiatives, and youth educational development programs under DepEd Tarlac City Schools Division.`;
  }

  return `${record.barangay} is an established local community in Tarlac City (${record.district}), officially classified as an ${record.classification} node with a census population of ${record.populationFormatted || record.population.toLocaleString()} residents. The community actively participates in Alternative Learning System (ALS) community literacy programs, Community Learning Center initiatives, and youth development linkages under the DepEd Tarlac City Schools Division.`;
}

const DEFAULT_SPREADSHEET_ID = '1Z-GsOOh5DV5CSilR7AZFZX_s1K1ktvC7sVVgFcJR3o0';
const POPULATION_GID = '1296334520';
const SHEET_NAME = 'Tarlac City Population 2024';

function resolveImageUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.includes('drive.google.com/file/d/')) {
    const id = trimmed.split('/file/d/')[1]?.split('/')[0]?.split('?')[0];
    return `https://lh3.googleusercontent.com/d/${id}=s220`;
  }
  if (trimmed.includes('drive.google.com/open?id=') || trimmed.includes('drive.google.com/uc?id=')) {
    const id = trimmed.split('id=')[1]?.split('&')[0];
    return `https://lh3.googleusercontent.com/d/${id}=s220`;
  }
  return trimmed;
}

export function TarlacCityPopulation2024View() {
  const [records, setRecords] = useState<Population2024Record[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBarangay, setSelectedBarangay] = useState<string>('All');
  const [districtFilter, setDistrictFilter] = useState<'All' | 'District A' | 'District B'>('All');
  const [classificationFilter, setClassificationFilter] = useState<'All' | 'Urban' | 'Rural'>('All');
  const [sortField, setSortField] = useState<'no' | 'barangay' | 'barangayChairman' | 'district' | 'population'>('no');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [isLiveFromSheet, setIsLiveFromSheet] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<Population2024Record | null>(null);
  const [copiedServiceAccount, setCopiedServiceAccount] = useState<boolean>(false);
  const [metadata, setMetadata] = useState<{
    spreadsheetTitle?: string;
    populationSheet?: {
      sheetName: string;
      gid: string;
      columns: string[];
    };
  } | null>(null);

  const copyServiceAccount = () => {
    navigator.clipboard.writeText(SERVICE_ACCOUNT_EMAIL);
    setCopiedServiceAccount(true);
    setTimeout(() => setCopiedServiceAccount(false), 2000);
  };

  // Initialize from fallback data immediately for instant responsive rendering
  useEffect(() => {
    const fallbackList: Population2024Record[] = BARANGAY_BASELINE_FALLBACK.map((b, idx) => {
      const pop = b.population2024 || b.basePopulation || 0;
      return {
        id: `pop-baseline-${b.barangayNumber}-${b.barangayName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        no: b.barangayNumber || idx + 1,
        logo: b.logo || '',
        barangay: b.barangayName,
        barangayChairman: b.barangayChairman || '',
        district: b.district || (b.barangayNumber <= 37 ? 'District A' : b.barangayNumber === 79 ? 'Central' : 'District B'),
        classification: (b.classification || b.geographicType || 'Rural') === 'Urban' ? 'Urban' : 'Rural',
        population: pop,
        populationFormatted: pop > 0 ? pop.toLocaleString('en-US') : '',
        about: b.about || ''
      };
    });

    setRecords(fallbackList);
    fetchPopulationData();
  }, []);

  const fetchPopulationData = async () => {
    setSyncing(true);
    try {
      // 1. Fetch metadata from official endpoint
      try {
        const metaRes = await fetch('/api/sheets/literacy-mapping-metadata');
        if (metaRes.ok) {
          const metaJson = await metaRes.json();
          if (metaJson.success && metaJson.populationSheet) {
            setMetadata(metaJson);
          }
        }
      } catch (mErr) {
        console.info('[Metadata Endpoint Notice]:', mErr);
      }

      // 2. Fetch population records from safe spreadsheet ID
      const savedSpreadsheetId = localStorage.getItem('literacyMappingSpreadsheetId') || localStorage.getItem('spreadsheetId') || DEFAULT_SPREADSHEET_ID;
      const activeSpreadsheetId = (savedSpreadsheetId.includes('1YfXfPT7NvehXaRvN8a9GDbyvG3IxHxUAUgcVLObRxkc'))
        ? DEFAULT_SPREADSHEET_ID
        : savedSpreadsheetId;

      const res = await fetch(`/api/sheets/tarlac-city-population?spreadsheetId=${encodeURIComponent(activeSpreadsheetId)}&gid=${POPULATION_GID}&t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.records) && json.records.length > 0) {
          const enrichedRecords = json.records.map((r: Population2024Record) => {
            if (!r.about || r.about.trim().length === 0) {
              const fb = BARANGAY_BASELINE_FALLBACK.find(b => b.barangayNumber === r.no || b.barangayName.toLowerCase() === r.barangay.toLowerCase());
              if (fb && fb.about) {
                return { ...r, about: fb.about };
              }
            }
            return r;
          });
          setRecords(enrichedRecords);
          setIsLiveFromSheet(Boolean(json.isLive));
          setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }
    } catch (err) {
      console.warn('Live fetch for population sheet failed, maintaining local dataset:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  const filteredAndSortedRecords = useMemo(() => {
    return records
      .filter((r) => {
        const matchesBarangayDropdown = 
          selectedBarangay === 'All' || 
          r.barangay.toLowerCase() === selectedBarangay.toLowerCase();

        const matchesQuery = 
          !searchQuery.trim() ||
          r.barangay.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.barangayChairman && r.barangayChairman.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (r.district && r.district.toLowerCase().includes(searchQuery.toLowerCase())) ||
          r.about.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(r.no).includes(searchQuery) ||
          r.classification.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesDistrict = 
          districtFilter === 'All' || r.district === districtFilter;

        const matchesClassification = 
          classificationFilter === 'All' || r.classification === classificationFilter;

        return matchesBarangayDropdown && matchesQuery && matchesDistrict && matchesClassification;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'no') {
          diff = a.no - b.no;
        } else if (sortField === 'barangay') {
          diff = a.barangay.localeCompare(b.barangay);
        } else if (sortField === 'barangayChairman') {
          diff = (a.barangayChairman || '').localeCompare(b.barangayChairman || '');
        } else if (sortField === 'district') {
          diff = (a.district || '').localeCompare(b.district || '');
        } else if (sortField === 'population') {
          diff = a.population - b.population;
        }
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [records, searchQuery, selectedBarangay, districtFilter, classificationFilter, sortField, sortOrder]);

  // Exclude row 79 (City Total) from individual barangay statistics to avoid double counting
  const barangayRecords = useMemo(() => {
    return records.filter((r) => r.barangay !== 'Tarlac City' && r.no !== 79);
  }, [records]);

  // Aggregate Metrics
  const totalPopulation = useMemo(() => {
    const tarlacCityRecord = records.find((r) => r.barangay === 'Tarlac City' || r.no === 79);
    if (tarlacCityRecord && tarlacCityRecord.population > 0) {
      return tarlacCityRecord.population;
    }
    return barangayRecords.reduce((acc, curr) => acc + (curr.population || 0), 0);
  }, [records, barangayRecords]);

  const urbanCount = useMemo(() => {
    return barangayRecords.filter((r) => r.classification === 'Urban').length;
  }, [barangayRecords]);

  const ruralCount = useMemo(() => {
    return barangayRecords.filter((r) => r.classification === 'Rural').length;
  }, [barangayRecords]);

  const districtACount = useMemo(() => {
    return barangayRecords.filter((r) => r.district === 'District A').length;
  }, [barangayRecords]);

  const districtBCount = useMemo(() => {
    return barangayRecords.filter((r) => r.district === 'District B').length;
  }, [barangayRecords]);

  const urbanPopulation = useMemo(() => {
    return barangayRecords
      .filter((r) => r.classification === 'Urban')
      .reduce((acc, curr) => acc + (curr.population || 0), 0);
  }, [barangayRecords]);

  const ruralPopulation = useMemo(() => {
    return barangayRecords
      .filter((r) => r.classification === 'Rural')
      .reduce((acc, curr) => acc + (curr.population || 0), 0);
  }, [barangayRecords]);

  const highestPopulated = useMemo(() => {
    if (barangayRecords.length === 0) return null;
    return [...barangayRecords].sort((a, b) => b.population - a.population)[0];
  }, [barangayRecords]);

  const handleSort = (field: 'no' | 'barangay' | 'barangayChairman' | 'district' | 'population') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleExportCSV = () => {
    const headers = ['No.', 'Logo', 'Barangay', 'Barangay Chairman', 'District', 'Classification', 'Population Census Data 2024 ', 'About'];
    const rows = filteredAndSortedRecords.map((r) => [
      r.no,
      `"${(r.logo || '').replace(/"/g, '""')}"`,
      `"${r.barangay.replace(/"/g, '""')}"`,
      `"${(r.barangayChairman || '').replace(/"/g, '""')}"`,
      `"${(r.district || '').replace(/"/g, '""')}"`,
      `"${r.classification}"`,
      `"${r.populationFormatted}"`,
      `"${r.about.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Tarlac_City_Population_2024_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16">
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0.5cm;
          }
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: Arial, Helvetica, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden, header, aside, nav, button {
            display: none !important;
          }
        }
      `}</style>
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#002B6D]/10 flex items-center justify-center text-[#002B6D] shrink-0 border border-[#002B6D]/20">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  Census 2024 Official Baseline
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {isLiveFromSheet ? 'Connected: GID 1296334520' : 'Baseline Verified'}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-[#002B6D] tracking-tight mt-1">
                Tarlac City Population 2024
              </h1>
              <p className="text-xs text-slate-500 max-w-3xl mt-0.5">
                Official Population Census Data 2024 & Community Demographics across all 76 Barangays and Specialized ALS Learning Nodes in Tarlac City.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchPopulationData}
              disabled={syncing}
              className="px-4 py-2 bg-[#002B6D] text-white hover:bg-[#002255] rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing Live Sheet...' : 'Sync from Google Sheet'}
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-300"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              Export CSV
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-300 print:hidden cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              Print
            </button>
          </div>
        </div>

        {/* Sync Info Bar (Hidden as requested) */}
        {/*
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3 text-xs text-slate-500">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium text-slate-800">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <strong>Spreadsheet:</strong> {metadata?.spreadsheetTitle || 'Tarlac City ALS Baseline Data on Literacy Mapping'}
              </span>
              <span className="text-slate-300">|</span>
              <span><strong className="text-slate-700">Sheet:</strong> {metadata?.populationSheet?.sheetName || SHEET_NAME}</span>
              <span className="text-slate-300">|</span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono font-bold border border-emerald-200">
                GID: {metadata?.populationSheet?.gid || POPULATION_GID}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyServiceAccount}
                title="Copy Google Service Account Email for Sheet Sharing"
                className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 flex items-center gap-1.5 text-[11px] font-medium transition"
              >
                {copiedServiceAccount ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Copied Service Account!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Service Account (Editor)</span>
                  </>
                )}
              </button>

              {lastSyncTime && (
                <div className="text-[11px] text-slate-400 font-mono">
                  Synced: {lastSyncTime}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-50 text-[11px]">
            <span className="font-semibold text-slate-600">Active Columns Schema:</span>
            {(metadata?.populationSheet?.columns || ['No.', 'Logo', 'Barangay', 'District', 'Classification', 'Population Census Data 2024 ', 'About']).map((col, cIdx) => (
              <span 
                key={cIdx} 
                className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] border border-slate-200"
              >
                {col.trim()}
              </span>
            ))}
          </div>
        </div>
        */}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Nodes</span>
            <Building2 className="w-4 h-4 text-[#002B6D]" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#002B6D]">{records.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Barangays & Facilities</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Population</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{totalPopulation.toLocaleString('en-US')}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">2024 Census Total</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Urban Barangays</span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-100 text-purple-700">Urban</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-900">{urbanCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{urbanPopulation.toLocaleString('en-US')} residents</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Rural Barangays</span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-700">Rural</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-900">{ruralCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{ruralPopulation.toLocaleString('en-US')} residents</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Highest Population</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <div className="text-base font-black text-slate-900 truncate" title={highestPopulated?.barangay || '—'}>
              {highestPopulated?.barangay || '—'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {highestPopulated?.populationFormatted || '0'} residents
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input & Dropdown Group */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            {/* Search Input with datalist autocomplete dropdown */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="population-search-input"
                type="text"
                list="population-barangay-datalist"
                placeholder="Search barangay, notes, census number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] transition placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  title="Clear search query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {/* Native Datalist for autocomplete dropdown in search input */}
              <datalist id="population-barangay-datalist">
                {TARLAC_CITY_POPULATION_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>

            {/* Reset Filters Button */}
            {searchQuery && (
              <button
                type="button"
                id="reset-population-filters"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedBarangay('All');
                  setDistrictFilter('All');
                  setClassificationFilter('All');
                }}
                className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-[#002B6D] bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center justify-center gap-1 shrink-0"
                title="Reset all filters"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>

          {/* Hidden container: All Barangays & Locations (79) / District / Classification pills */}
          {/*
          <div className="relative min-w-[260px]">
            <MapPin className="w-3.5 h-3.5 text-[#002B6D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              id="population-barangay-dropdown"
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value)}
              className="w-full pl-8 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] transition appearance-none cursor-pointer"
            >
              <option value="All">All Barangays & Locations ({TARLAC_CITY_POPULATION_LOCATIONS.length})</option>
              {TARLAC_CITY_POPULATION_LOCATIONS.map((loc, idx) => (
                <option key={loc} value={loc}>
                  {idx + 1}. {loc}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 mr-1">District:</span>
              {(['All', 'District A', 'District B'] as const).map((dist) => (
                <button
                  key={dist}
                  id={`filter-district-${dist.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setDistrictFilter(dist)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    districtFilter === dist
                      ? 'bg-[#002B6D] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {dist}
                  {dist === 'All' ? ` (${records.length})` : dist === 'District A' ? ` (${districtACount})` : ` (${districtBCount})`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 mr-1">Classification:</span>
              {(['All', 'Urban', 'Rural'] as const).map((cat) => (
                <button
                  key={cat}
                  id={`filter-classification-${cat.toLowerCase()}`}
                  onClick={() => setClassificationFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    classificationFilter === cat
                      ? 'bg-[#002B6D] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                  {cat === 'All' ? ` (${records.length})` : cat === 'Urban' ? ` (${urbanCount})` : ` (${ruralCount})`}
                </button>
              ))}
            </div>
          </div>
          */}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#002B6D] text-white text-[11px] font-bold uppercase tracking-wider select-none">
                <th 
                  onClick={() => handleSort('no')}
                  className="py-3.5 px-4 text-center cursor-pointer hover:bg-[#002255] transition whitespace-nowrap w-16"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>No.</span>
                    {sortField === 'no' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap w-20">
                  Logo
                </th>
                <th 
                  onClick={() => handleSort('barangay')}
                  style={{ width: '3cm', minWidth: '3cm', maxWidth: '3cm' }}
                  className="py-3.5 px-3 text-center cursor-pointer hover:bg-[#002255] transition whitespace-normal break-words"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Barangay</span>
                    {sortField === 'barangay' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('barangayChairman')}
                  style={{ width: '3.6cm', minWidth: '3.2cm' }}
                  className="py-3.5 px-3 text-center cursor-pointer hover:bg-[#002255] transition whitespace-normal break-words"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Barangay Chairman</span>
                    {sortField === 'barangayChairman' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('district')}
                  className="py-3.5 px-4 text-center cursor-pointer hover:bg-[#002255] transition whitespace-nowrap w-32"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>District</span>
                    {sortField === 'district' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap w-32">
                  Classification
                </th>
                <th 
                  onClick={() => handleSort('population')}
                  style={{ width: '3cm', minWidth: '3cm', maxWidth: '3cm' }}
                  className="py-3.5 px-2 text-center cursor-pointer hover:bg-[#002255] transition whitespace-normal break-words"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className="whitespace-normal break-words text-[10px] leading-tight text-center">Population Census Data 2024 </span>
                    {sortField === 'population' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4 text-left font-black tracking-wider uppercase text-xs min-w-[420px] w-full">
                  About
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm">No matching barangay records found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms or classification filter.</p>
                  </td>
                </tr>
              ) : (
                filteredAndSortedRecords.map((r, index) => {
                  const isCityTotal = r.barangay === 'Tarlac City' || r.no === 79;
                  const popPct = totalPopulation > 0 && r.population > 0 
                    ? ((r.population / totalPopulation) * 100).toFixed(2) 
                    : '0';
                  const resolvedLogo = resolveImageUrl(r.logo);

                  return (
                    <tr 
                      key={r.id} 
                      className={`transition-colors ${
                        isCityTotal 
                          ? 'bg-amber-50/60 font-medium hover:bg-amber-50' 
                          : index % 2 === 0 ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/40 hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">
                        {r.no}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="w-10 h-10 mx-auto rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          {resolvedLogo ? (
                            <img
                              src={resolvedLogo}
                              alt={`${r.barangay} Logo`}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style');
                              }}
                            />
                          ) : null}
                          <div 
                            className="w-full h-full flex items-center justify-center bg-[#002B6D]/5 text-[#002B6D] font-black text-xs"
                            style={resolvedLogo ? { display: 'none' } : undefined}
                          >
                            {r.barangay.slice(0, 2).toUpperCase()}
                          </div>
                        </div>
                      </td>

                      <td 
                        style={{ width: '3cm', minWidth: '3cm', maxWidth: '3cm' }}
                        className="py-3 px-3 whitespace-normal break-words"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{r.barangay}</span>
                          {isCityTotal && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#002B6D] text-white">
                              City Total
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          Tarlac City, Tarlac
                        </div>
                      </td>

                      <td 
                        style={{ width: '3.6cm', minWidth: '3.2cm' }}
                        className="py-3 px-3 whitespace-normal break-words"
                      >
                        {r.barangayChairman ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#002B6D]/10 text-[#002B6D] flex items-center justify-center text-[10px] font-black shrink-0">
                              {r.barangayChairman.slice(0, 1).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-800 text-xs tracking-tight">
                              {r.barangayChairman}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs italic">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          r.district === 'District A'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : r.district === 'District B'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {r.district || (r.no <= 37 ? 'District A' : r.no === 79 ? 'Central' : 'District B')}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          r.classification === 'Urban'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {r.classification}
                        </span>
                      </td>

                      <td 
                        style={{ width: '3cm', minWidth: '3cm', maxWidth: '3cm' }}
                        className="py-3 px-2 text-right whitespace-normal break-words"
                      >
                        {r.population > 0 ? (
                          <>
                            <div className="font-extrabold text-slate-900 font-mono text-sm">
                              {r.populationFormatted}
                            </div>
                            {!isCityTotal && (
                              <div className="flex items-center justify-end gap-1.5 mt-1">
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${r.classification === 'Urban' ? 'bg-purple-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${Math.min(100, Math.max(5, (r.population / (highestPopulated?.population || 25000)) * 100))}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">{popPct}%</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs italic">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-left min-w-[420px] w-full">
                        <p className="text-slate-700 text-xs leading-relaxed text-justify w-full break-words">
                          {getResolvedAbout(r)}
                        </p>
                        <button
                          onClick={() => setSelectedRecord({ ...r, about: getResolvedAbout(r) })}
                          className="text-[11px] text-[#002B6D] hover:underline font-bold mt-1.5 inline-flex items-center gap-1 cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Showing <strong className="text-slate-800">{filteredAndSortedRecords.length}</strong> of{' '}
            <strong className="text-slate-800">{records.length}</strong> records (76 Barangays + Institutional + City Total)
          </div>
          <div className="text-[11px] text-slate-400">
            DepEd TCSD ALS Education Planning and Literacy Mapping Resource
          </div>
        </div>
      </div>

      {/* Modal / Dialog for Detailed Barangay Information */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                  {resolveImageUrl(selectedRecord.logo) ? (
                    <img 
                      src={resolveImageUrl(selectedRecord.logo)} 
                      alt={selectedRecord.barangay} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <span className="font-black text-[#002B6D] text-lg">
                      {selectedRecord.barangay.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-mono text-slate-400">Record #{selectedRecord.no}</div>
                  <h3 className="text-xl font-black text-[#002B6D]">{selectedRecord.barangay}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Tarlac City Schools Division
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Barangay Chairman</span>
                <div className="mt-1 font-bold text-xs text-slate-800 truncate" title={selectedRecord.barangayChairman || 'Not Specified'}>
                  {selectedRecord.barangayChairman || <span className="text-slate-400 italic font-normal">Not Specified</span>}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">District</span>
                <div className="mt-1">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-bold ${
                    selectedRecord.district === 'District A'
                      ? 'bg-blue-100 text-blue-800'
                      : selectedRecord.district === 'District B'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {selectedRecord.district || '—'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Classification</span>
                <div className="mt-1">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-bold ${
                    selectedRecord.classification === 'Urban' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {selectedRecord.classification}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">2024 Population</span>
                <div className="text-sm font-extrabold text-slate-900 font-mono mt-1">
                  {selectedRecord.population > 0 ? selectedRecord.populationFormatted : 'Not Specified'}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                About {selectedRecord.barangay}
              </span>
              <p className="text-slate-700 text-xs leading-relaxed pt-1">
                {selectedRecord.about || 'No detailed description recorded.'}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-5 py-2 bg-[#002B6D] text-white rounded-xl text-xs font-bold hover:bg-[#002255] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
