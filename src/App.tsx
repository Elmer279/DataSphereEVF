/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { initAuth, googleSignIn, logout, getAccessToken, User } from './firebase';
import { useRealtimeLearners } from './hooks/useFirestoreRealtime';
import { saveLearnerToFirestore, deleteLearnerFromFirestore } from './services/firestoreSyncService';
import {
  Globe,
  LayoutDashboard,
  Map,
  Users,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Bookmark,
  Bell,
  BookOpen,
  FolderOpen,
  Award,
  ClipboardCheck,
  TrendingUp,
  RefreshCw,
  FileSpreadsheet,
  BarChart2,
  Building2,
  Handshake,
  Hash,
  Menu,
  Sliders,
  X,
  Bot,
  Search,
  Home,
  MapPin
} from 'lucide-react';
import { LearningCenter, LearnerRecord, IntelAlert, districtMetrics, formatDistrictName, Partner } from './types';
import {
  initialLearningCenters,
  initialLearners,
  initialIntelAlerts,
  initialDistrictMetrics
} from './data/alsData';
import { SEED_PARTNERS } from './data/partnersData';
import {
  SHEET_ENROLMENT_ID,
  SHEET_TAB_NAME,
  mapLearnerToSheetRow,
  mapSheetRowToLearner
} from './utils/sheetsSync';
import { safeJsonParse } from './utils/api';
import { safeSetItem, safeSetJSON } from './utils/safeStorage';

// Import views
import { DashboardView } from './components/DashboardView';
import { MapView } from './components/MapView';
import { BarangayLiteracyProfileDiagnosticView } from './components/BarangayLiteracyProfileDiagnosticView';
import { LearnerDataView } from './components/LearnerDataView';
import { ReportsView } from './components/ReportsView';
import { AdminHubView } from './components/AdminHubView';
import { PartnersInfoView } from './components/PartnersInfoView';
import { PartnersRegistryView } from './components/PartnersRegistryView';
import { PhysicalCountPropEquipView } from './components/PhysicalCountPropEquipView';
import { PhysicalCountLearningMaterialsView } from './components/PhysicalCountLearningMaterialsView';
import { PersonnelRecordView } from './components/PersonnelRecordView';
import { ClassProgramView } from './components/ClassProgramView';
import { ClassProgramDashboardView } from './components/ClassProgramDashboardView';
import { Teacher201FileView } from './components/Teacher201FileView';
import { PerformanceRatingView } from './components/PerformanceRatingView';
import CLCProfileDirectoryView from './components/CLCProfileDirectoryView';
import CLCDirectoryTableView from './components/CLCDirectoryTableView';
import CLCPrepChecklistView from './components/CLCPrepChecklistView';
import CLCDashboardView from './components/CLCDashboardView';
import { TcsdAlsListOfPassersView } from './components/TcsdAlsListOfPassersView';
import OverallAnalyticsView from './components/OverallAnalyticsView';
import ALSGraduateTracingView from './components/ALSGraduateTracingView';
import { LearnerReferenceNumberView } from './components/LearnerReferenceNumberView';
import { SettingsView } from './components/SettingsView';
import { ElFabriXFloatingDrawer } from './components/ElFabriXFloatingDrawer';
import { TarlacCityPopulation2024View } from './components/TarlacCityPopulation2024View';
import { ElFabriXConsole } from './components/ElFabriXConsole';
import { GeographicalLocationPartnersView } from './components/GeographicalLocationPartnersView';

export const DISTRICTS_WITHOUT_SETTINGS = new Set([
  'Tarlac City',
  'Data on Tarlac City ALS Literacy Mapping',
  'District B',
  'Tarlac District B',
  'Database on Partners and Linkage',
  'Database on Partners and Linkages',
  'Physical Count of Inventories',
  'Personnel Record',
  'Class Program',
  'TCSD ALS List Of Passers',
  'TCSD ALS Passer',
  'TCSD ALS Passers',
  'CLC Profile and Directory',
  'Community Learning Profile and Directory',
  'ALS Graduate Tracing Data',
]);

export const DISTRICTS_WITHOUT_ADMIN_HUB = new Set([
  'Tarlac City',
  'Data on Tarlac City ALS Literacy Mapping',
  'District B',
  'Tarlac District B',
  'Database on Partners and Linkage',
  'Database on Partners and Linkages',
]);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // States to keep track of a programmatically created Google Sheet for AF2 Form submissions
  const [customSpreadsheetId, setCustomSpreadsheetId] = useState<string | null>(localStorage.getItem('custom_enrolment_sheet_id') || null);
  const [customSpreadsheetUrl, setCustomSpreadsheetUrl] = useState<string | null>(localStorage.getItem('custom_enrolment_sheet_url') || null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setAuthLoading(false);
      },
      () => {
        setAccessToken(null);
        setAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async (customClientId?: string, customClientSecret?: string) => {
    try {
      const res = await googleSignIn(customClientId, customClientSecret);
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch (e) {
      console.error("Google Sign In error:", e);
      alert("Sign In failed: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'learner' | 'identified-learners-af1' | 'population-2024' | 'barangay-profile' | 'reports' | 'admin' | 'settings' | 'learning-materials' | '201-file' | 'performance-rating' | 'clc-profile' | 'clc-prep' | 'class-program' | 'registration-af2' | 'data-enrollment' | 'tcsd-passers' | 'tcsd-lrn' | 'als-graduate-tracing' | 'partners-registry' | 'partners-geo-map' | 'elfabrix-console'>('dashboard');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Overall Analytics');
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isElFabriXDrawerOpen, setIsElFabriXDrawerOpen] = useState<boolean>(false);

  // Automatically switch away from Settings tab if active for a district that disables Settings
  useEffect(() => {
    if (activeTab === 'settings' && DISTRICTS_WITHOUT_SETTINGS.has(selectedDistrict)) {
      setActiveTab('dashboard');
    }
  }, [selectedDistrict, activeTab]);

  // Automatically switch away from Admin Hub tab if active for a district that disables Admin Hub
  useEffect(() => {
    if (activeTab === 'admin' && DISTRICTS_WITHOUT_ADMIN_HUB.has(selectedDistrict)) {
      setActiveTab('dashboard');
    }
  }, [selectedDistrict, activeTab]);

  // Automatically switch away from removed or deprecated districts
  useEffect(() => {
    if (selectedDistrict === 'District A' || selectedDistrict === 'Data on Advocacy and Social Mobilization' || selectedDistrict === 'Tarlac District A') {
      setSelectedDistrict('Overall Analytics');
    }
  }, [selectedDistrict]);

  const handleSelectDistrict = (district: string) => {
    setSelectedDistrict(district);
    if (activeTab === 'settings' && DISTRICTS_WITHOUT_SETTINGS.has(district)) {
      setActiveTab('dashboard');
    }
  };

  // Quick-Search Filter State for Sidebar Modules
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState<string>('');

  const ALL_SIDEBAR_MODULES = [
    {
      id: 'Overall Analytics',
      label: 'Overall Analytics & KPIs',
      shortLabel: 'Analytics',
      category: 'Analytics',
      keywords: 'analytics kpi division metrics overview statistics charts',
      onSelect: () => { setSelectedDistrict('Overall Analytics'); setActiveTab('dashboard'); }
    },
    {
      id: 'Tarlac City',
      label: 'Data on Tarlac City ALS Literacy Mapping',
      shortLabel: 'Literacy Mapping',
      category: 'Mapping',
      keywords: 'literacy mapping tarlac city barangay learners census demographics map',
      onSelect: () => handleSelectDistrict('Tarlac City')
    },
    {
      id: 'District B',
      label: 'Database on Partners and Linkages',
      shortLabel: 'Partners & Linkages',
      category: 'Partnerships',
      keywords: 'partners linkages moa stakeholders alliances donors organizations heis ngos lgu',
      onSelect: () => handleSelectDistrict('District B')
    },
    {
      id: 'Physical Count of Inventories',
      label: 'Physical Count of Inventories',
      shortLabel: 'Inventories',
      category: 'Logistics',
      keywords: 'inventories physical count property plant equipment learning materials supplies logistics',
      onSelect: () => handleSelectDistrict('Physical Count of Inventories')
    },
    {
      id: 'Personnel Record',
      label: 'Personnel Record',
      shortLabel: 'Personnel',
      category: 'HR / Personnel',
      keywords: 'personnel record teacher profile 201 file performance rating teachers mobile staff',
      onSelect: () => handleSelectDistrict('Personnel Record')
    },
    {
      id: 'Class Program',
      label: 'Class Program',
      shortLabel: 'Class Program',
      category: 'Instruction',
      keywords: 'class program schedule matrix learning sessions instruction calendar timetable',
      onSelect: () => handleSelectDistrict('Class Program')
    },
    {
      id: 'TCSD ALS List Of Passers',
      label: 'TCSD ALS Passers',
      shortLabel: 'ALS Passers',
      category: 'Outcomes',
      keywords: 'passers ae test accreditation equivalency graduates passers list certificates',
      onSelect: () => handleSelectDistrict('TCSD ALS List Of Passers')
    },
    {
      id: 'CLC Profile and Directory',
      label: 'Community Learning Center Profile and Directory',
      shortLabel: 'CLCs',
      category: 'Centers',
      keywords: 'clc community learning center profile directory checklist facilities locations hubs',
      onSelect: () => handleSelectDistrict('CLC Profile and Directory')
    },
    {
      id: 'ALS Graduate Tracing Data',
      label: 'ALS Graduate Tracing Data',
      shortLabel: 'Graduate Tracing',
      category: 'Tracer',
      keywords: 'graduate tracing employment higher education alumni career tracking tracer study',
      onSelect: () => handleSelectDistrict('ALS Graduate Tracing Data')
    }
  ];

  const filteredSidebarModules = ALL_SIDEBAR_MODULES.filter(mod => {
    if (!sidebarSearchQuery.trim()) return true;
    const q = sidebarSearchQuery.toLowerCase();
    return (
      mod.label.toLowerCase().includes(q) ||
      mod.shortLabel.toLowerCase().includes(q) ||
      mod.category.toLowerCase().includes(q) ||
      mod.keywords.toLowerCase().includes(q)
    );
  });

  const getBreadcrumbInfo = () => {
    let moduleLabel = 'Overall Analytics & KPIs';
    let subTabLabel: string | null = null;

    if (selectedDistrict === 'Tarlac City') {
      moduleLabel = 'Data on Tarlac City ALS Literacy Mapping';
      if (activeTab === 'map') subTabLabel = 'TCSD ALS Interactive Map';
      else if (activeTab === 'learner') subTabLabel = 'Masterlist of Learners';
      else if (activeTab === 'population-2024') subTabLabel = 'Official Population Census 2024';
      else if (activeTab === 'identified-learners-af1') subTabLabel = 'Identified Learners AF-1';
      else if (activeTab === 'barangay-profile') subTabLabel = 'Barangay Profile & Diagnostics';
      else if (activeTab === 'reports') subTabLabel = 'Analytics & Reports';
      else if (activeTab === 'admin') subTabLabel = 'Division Admin Hub';
      else if (activeTab !== 'dashboard') subTabLabel = String(activeTab);
    } else if (selectedDistrict === 'District B') {
      moduleLabel = 'Database on Partners and Linkages';
      if (activeTab === 'map') subTabLabel = 'Partners and Linkages Information';
      else if (activeTab === 'partners-registry') subTabLabel = 'Data Registry of Partners and Linkages';
      else if (activeTab === 'partners-geo-map') subTabLabel = 'Geographical Location of Partners and Linkages';
      else if (activeTab === 'dashboard') subTabLabel = 'Partnership Dashboard & Metrics';
      else if (activeTab !== 'dashboard') subTabLabel = String(activeTab);
    } else if (selectedDistrict === 'Physical Count of Inventories') {
      moduleLabel = 'Physical Count of Inventories';
      if (activeTab === 'map') subTabLabel = 'Property, Plant & Equipment';
      else if (activeTab === 'learning-materials') subTabLabel = 'Learning Materials Count';
    } else if (selectedDistrict === 'Personnel Record') {
      moduleLabel = 'Personnel Record';
      if (activeTab === 'map') subTabLabel = 'Teacher Profile';
      else if (activeTab === '201-file') subTabLabel = '201 File Registry';
      else if (activeTab === 'performance-rating') subTabLabel = 'Performance Rating';
    } else if (selectedDistrict === 'Class Program') {
      moduleLabel = 'Class Program';
      if (activeTab === 'map') subTabLabel = 'Class Schedule Matrix';
    } else if (selectedDistrict === 'TCSD ALS List Of Passers') {
      moduleLabel = 'TCSD ALS Passers';
      if (activeTab === 'tcsd-passers') subTabLabel = 'Certified A&E Passers';
      else if (activeTab === 'tcsd-lrn') subTabLabel = 'LRN Validation';
    } else if (selectedDistrict === 'CLC Profile and Directory') {
      moduleLabel = 'Community Learning Center Profile and Directory';
      if (activeTab === 'map') subTabLabel = 'CLC Directory';
      else if (activeTab === 'clc-profile') subTabLabel = 'CLC Profile';
      else if (activeTab === 'clc-prep') subTabLabel = 'Preparedness Checklist';
    } else if (selectedDistrict === 'ALS Graduate Tracing Data') {
      moduleLabel = 'ALS Graduate Tracing Data';
      if (activeTab === 'als-graduate-tracing') subTabLabel = 'Graduate Tracing Registry';
    }

    return { moduleLabel, subTabLabel };
  };

  // Core synchronized application state
  const [learningCenters, setLearningCenters] = useState<LearningCenter[]>(() => {
    const saved = localStorage.getItem('tcsd_synced_learning_centers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse cached learning centers, using defaults", e);
      }
    }
    return initialLearningCenters;
  });

  // Real-time Cloud Firestore synchronization listener
  const { learners: realtimeLearners } = useRealtimeLearners(initialLearners);
  const [learners, setLearners] = useState<LearnerRecord[]>(initialLearners);

  // Synchronize state instantaneously whenever Firestore onSnapshot triggers
  useEffect(() => {
    if (realtimeLearners && realtimeLearners.length > 0) {
      setLearners(realtimeLearners);
    }
  }, [realtimeLearners]);
  const [alerts, setAlerts] = useState<IntelAlert[]>(initialIntelAlerts);
  const [metrics, setMetrics] = useState<districtMetrics[]>(initialDistrictMetrics);

  // CLC Google Sheets Sync states
  const [isClcSyncing, setIsClcSyncing] = useState(false);
  const [clcSyncTime, setClcSyncTime] = useState<string | null>(() => localStorage.getItem('tcsd_clc_sync_last_time'));

  // Save learningCenters to localStorage
  useEffect(() => {
    safeSetJSON('tcsd_synced_learning_centers', learningCenters);
  }, [learningCenters]);

  // Google Sheet Synchronize function
  const handleSyncCLCSheets = async () => {
    setIsClcSyncing(true);
    try {
      const { syncAllCLCSheets } = await import('./utils/clcSheetsSync');
      const { centers, compliance } = await syncAllCLCSheets();
      
      if (centers && centers.length > 0) {
        setLearningCenters(centers);
        safeSetJSON('clc_preparedness_checklist_compliance', compliance);
        
        const now = new Date().toLocaleString('en-US', { hour12: true, dateStyle: 'medium', timeStyle: 'short' });
        setClcSyncTime(now);
        safeSetItem('tcsd_clc_sync_last_time', now);
        
        // Add Intel alert
        const newAlert = {
          id: `alert-clc-sync-${Date.now()}`,
          title: "CLC Register Synchronized",
          description: `Successfully loaded ${centers.length} CLC Profiles, directories and checklists.`,
          severity: 'info' as const,
          district: 'CLC Profile and Directory',
          timestamp: 'Just now'
        };
        setAlerts(prev => [newAlert, ...prev]);
        return { success: true, count: centers.length };
      } else {
        throw new Error("No centers loaded from Sheet.");
      }
    } catch (err: any) {
      console.error('[CLC Sheets Sync failure]', err);
      // Add alert
      const newAlert = {
        id: `alert-clc-sync-err-${Date.now()}`,
        title: "CLC Sheet Sync Offline",
        description: err.message || "Failed to reach remote Google Sheet.",
        severity: 'critical' as const,
        district: 'CLC Profile and Directory',
        timestamp: 'Just now'
      };
      setAlerts(prev => [newAlert, ...prev]);
      throw err;
    } finally {
      setIsClcSyncing(false);
    }
  };

  // Auto sync on mount to ensure fresh real-time directory synchronization from Google Sheet
  useEffect(() => {
    console.log('[CLC Auto-Sync] Automatically synchronizing Google Sheets data on application mount...');
    handleSyncCLCSheets().catch((err) => {
      console.warn('Auto-sync on mount failed, using cached offline registry:', err);
    });
  }, []);

  const [partnersSyncLoading, setPartnersSyncLoading] = useState(false);
  const [partnersSyncError, setPartnersSyncError] = useState<string | null>(null);

  const handleSyncPartners = async () => {
    setPartnersSyncLoading(true);
    setPartnersSyncError(null);
    try {
      const response = await fetch(`/api/partners/sync?_=${Date.now()}`);
      const result = await safeJsonParse(response);
      if (result.success && result.partners) {
        const seenIds = new Set<number>();
        const sanitizedPartners: Partner[] = result.partners.map((p: any, idx: number) => {
          let cid = Number(p.id);
          if (!cid || seenIds.has(cid)) {
            cid = idx + 1;
            while (seenIds.has(cid)) cid++;
          }
          seenIds.add(cid);
          return { ...p, id: cid };
        });
        setPartners(sanitizedPartners);
        console.log(`[Partners Sync] Successfully loaded ${sanitizedPartners.length} records from Google Sheets`);
      } else {
        throw new Error(result.error || "Failed to retrieve partners list");
      }
    } catch (err: any) {
      console.warn("[Partners Sync Warning] Sheet sync inactive:", err.message || err);
      setPartnersSyncError(err.message || String(err));
    } finally {
      setPartnersSyncLoading(false);
    }
  };

  // Local storage state for Partners and Linkages
  const [partners, setPartners] = useState<Partner[]>(() => {
    const saved = localStorage.getItem('tcsd_partners_database');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seenIds = new Set();
          return parsed.map((p: any, idx: number) => {
            let cid = p.id;
            if (!cid || seenIds.has(cid)) {
              cid = idx + 1;
            }
            seenIds.add(cid);
            return {
              ...p,
              id: cid
            };
          });
        }
      } catch (e) {
        console.error("Failed to parse partners data. Seeding defaults.", e);
      }
    }
    return SEED_PARTNERS;
  });

  // Save to local storage when changed
  useEffect(() => {
    safeSetJSON('tcsd_partners_database', partners);
  }, [partners]);

  // Auto-sync partners on app load
  useEffect(() => {
    handleSyncPartners().catch((err) => {
      console.warn('Auto partners sync failed, using cache:', err);
    });
  }, []);

  // Handle auto tab shifting away from Learner Data when in Partners and Linkages database view
  useEffect(() => {
    if (activeTab === 'settings' && DISTRICTS_WITHOUT_SETTINGS.has(selectedDistrict)) {
      setActiveTab('dashboard');
      return;
    }
    if (selectedDistrict === 'District B' && (activeTab === 'learner' || activeTab === 'identified-learners-af1')) {
      setActiveTab('map');
    }
    if ((activeTab === '201-file' || activeTab === 'performance-rating') && selectedDistrict !== 'Personnel Record') {
      setActiveTab('dashboard');
    }
    if (selectedDistrict === 'Tarlac City') {
      if (activeTab !== 'learner' && activeTab !== 'identified-learners-af1' && activeTab !== 'population-2024' && activeTab !== 'elfabrix-console' && activeTab !== 'dashboard' && activeTab !== 'map') {
        setActiveTab('learner');
      }
    }
    if (selectedDistrict === 'CLC Profile and Directory') {
      if (activeTab !== 'clc-profile' && activeTab !== 'clc-prep' && activeTab !== 'map' && activeTab !== 'dashboard' && activeTab !== 'admin') {
        setActiveTab('clc-profile');
      }
    } else if (selectedDistrict === 'TCSD ALS List Of Passers') {
      if (activeTab !== 'tcsd-lrn' && activeTab !== 'dashboard' && activeTab !== 'admin') {
        setActiveTab('tcsd-lrn');
      }
    } else if (selectedDistrict === 'ALS Graduate Tracing Data') {
      if (activeTab !== 'als-graduate-tracing' && activeTab !== 'admin') {
        setActiveTab('als-graduate-tracing');
      }
    } else if (activeTab === 'clc-profile' || activeTab === 'clc-prep' || activeTab === 'class-program' || activeTab === 'tcsd-passers' || activeTab === 'tcsd-lrn' || activeTab === 'als-graduate-tracing') {
      setActiveTab('dashboard');
    }
  }, [selectedDistrict, activeTab]);

  const handleResetPartners = () => {
    if (confirm("Are you sure you want to reset the partners database to system defaults? Any manual edits will be overwritten.")) {
      setPartners(SEED_PARTNERS);
    }
  };

  // States for subview interactions
  const [forceTriggerAddForm, setForceTriggerAddForm] = useState<boolean>(false);


  // Handler to add a new Learning Center representing mapped plots
  const handleAddLearningCenter = (newCenter: LearningCenter) => {
    setLearningCenters(prev => [newCenter, ...prev]);

    // Construct a matching alert
    const newAlert: IntelAlert = {
      id: `alert-custom-${Date.now()}`,
      type: 'info',
      title: `New learning CLC Registered: ${newCenter.name}`,
      description: `A brand-new mobile teaching site was plotted at coordinates X:${newCenter.lng}%, Y:${newCenter.lat}% under ${newCenter.teacher}.`,
      district: newCenter.district,
      timestamp: 'Just now'
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const handleDeleteLearningCenter = (id: string) => {
    setLearningCenters(prev => prev.filter(c => c.id !== id));
  };

  const handleUpdateLearningCenter = (id: string, updatedFields: Partial<LearningCenter>) => {
    setLearningCenters(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
  };

  // Auto-fetch existing baseline mapping and enrollment records from Google Sheet on mount
  useEffect(() => {
    let isMounted = true;
    const fetchRemoteSpreadsheetData = async () => {
      try {
        const defaultSheetId = (customSpreadsheetId && customSpreadsheetId !== '1YfXfPT7NvehXaRvN8a9GDbyvG3IxHxUAUgcVLObRxkc' && !customSpreadsheetId.includes('1YfXfPT7NvehXaRvN8a9GDbyvG3IxHxUAUgcVLObRxkc'))
          ? customSpreadsheetId
          : '1Z-GsOOh5DV5CSilR7AZFZX_s1K1ktvC7sVVgFcJR3o0';
        
        // 1. Fetch primary Literacy Mapping records (Aguso tab)
        let baselineLearners: LearnerRecord[] = [];
        try {
          const mappingUrl = `/api/sheets/fetch?spreadsheetId=${encodeURIComponent(defaultSheetId)}&gid=1177420101&tab=Aguso&_=${Date.now()}`;
          const mappingRes = await fetch(mappingUrl);
          if (mappingRes.ok) {
            const mappingJson = await safeJsonParse(mappingRes);
            if (mappingJson.records && Array.isArray(mappingJson.records) && mappingJson.records.length > 0) {
              baselineLearners = mappingJson.records.filter((r: any) => {
                const lName = (r.lastName || '').toLowerCase();
                return !lName.includes('learning center') && !lName.includes('community based');
              });
              console.log(`[Google Sheets Auto-Sync] Successfully loaded ${baselineLearners.length} baseline mapping records from Aguso tab.`);
            }
          }
        } catch (mErr) {
          console.warn(`[Google Sheets Auto-Sync] Baseline mapping tab fetch warning:`, mErr);
        }

        // 2. Fetch remote Enrollment_AF2 records
        let af2Learners: LearnerRecord[] = [];
        try {
          const fetchUrl = `/api/sheets/fetch-enrolment-af2?_=${Date.now()}`;
          const response = await fetch(fetchUrl, {
            headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}
          });
          const resJson = await safeJsonParse(response);
          if (resJson.success && Array.isArray(resJson.data) && resJson.data.length > 0) {
            resJson.data.forEach((item: any, i: number) => {
              const row = item.row;
              if (row && Array.isArray(row) && row.length > 3) {
                try {
                  const l = mapSheetRowToLearner(row, i + 1);
                  if (item.sheetName) {
                    l.communityLearningCenter = item.sheetName;
                    l.clcName = item.sheetName;
                  }
                  if (l.firstName || l.lastName) {
                    af2Learners.push(l);
                  }
                } catch (rowErr) {
                  console.warn(`[Google Sheets Auto-Sync] Error parsing row ${i + 1}:`, rowErr);
                }
              }
            });
          }
        } catch (af2Err) {
          console.warn(`[Google Sheets Auto-Sync] AF2 fetch warning:`, af2Err);
        }

        if (!isMounted) return;

        // Merge baseline mapping learners and AF2 learners
        const combined = [...baselineLearners, ...af2Learners];
        if (combined.length > 0) {
          setLearners(combined);
        }
      } catch (err: any) {
        console.warn(`[Google Sheets Auto-Sync Alert] Remote spreadsheet fetch offline:`, err.message || err);
      }
    };

    fetchRemoteSpreadsheetData();
    return () => {
      isMounted = false;
    };
  }, [customSpreadsheetId, accessToken]);

  // Handlers for registered learners
  const handleRegisterLearner = (newLearner: LearnerRecord): Promise<any> => {
    setLearners(prev => [newLearner, ...prev]);
    
    // Save to Cloud Firestore
    saveLearnerToFirestore(newLearner).catch(err => {
      console.warn('[Cloud Firestore] Real-time persistence notice:', err.message || err);
    });

    // Log matching info alerts
    const newAlert: IntelAlert = {
      id: `alert-custom-${Date.now()}`,
      type: 'info',
      title: `Registration on file: ${newLearner.name}`,
      description: `Learner successfully admitted to the "${newLearner.program}" program stack in ${newLearner.district}.`,
      district: newLearner.district,
      timestamp: 'Just now'
    };
    setAlerts(prev => [newAlert, ...prev]);

    // Automatically append to Google Sheet: Enrolment (or newly created custom sheet)
    try {
      const row = mapLearnerToSheetRow(newLearner, 0); // 0 triggers auto-index formula `=ROW()-1`
      const activeSpreadsheetId = customSpreadsheetId || SHEET_ENROLMENT_ID;
      const activeTabName = customSpreadsheetId ? 'Sheet1' : SHEET_TAB_NAME;
      return fetch('/api/sheets/append', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          spreadsheetId: activeSpreadsheetId,
          tabName: activeTabName,
          rowData: row
        })
      })
      .then(safeJsonParse)
      .then(data => {
        if (data.success) {
          console.log(`[Google Sheets Sync SUCCESS] Automatically saved ${newLearner.name} record to remote database.`);
          return data;
        } else {
          console.error(`[Google Sheets Sync ERROR] Server rejected save: ${data.error}`);
          return data;
        }
      })
      .catch(fetchErr => {
        console.warn(`[Google Sheets Sync FAIL] Network error attempting to save to sheet:`, fetchErr);
        throw fetchErr;
      });
    } catch (err: any) {
      console.error(`[Google Sheets Sync FAIL] Mapping formatter failed:`, err.message || err);
      return Promise.reject(err);
    }
  };

  const handleUpdateLearner = (id: string, updatedFields: Partial<LearnerRecord>): Promise<any> => {
    let mergedRecord: LearnerRecord | null = null;
    setLearners(prev => prev.map(l => {
      if (l.id === id) {
        mergedRecord = { ...l, ...updatedFields };
        return mergedRecord;
      }
      return l;
    }));

    if (mergedRecord) {
      const merged: LearnerRecord = mergedRecord;
      
      // Update in Cloud Firestore
      saveLearnerToFirestore(merged).catch(err => {
        console.warn('[Cloud Firestore] Real-time update notice:', err.message || err);
      });

      // Sync updated fields as a new row or update in active Google Sheet
      try {
        const row = mapLearnerToSheetRow(merged, 0); // 0 triggers auto-index formula `=ROW()-1`
        const activeSpreadsheetId = customSpreadsheetId || SHEET_ENROLMENT_ID;
        const activeTabName = customSpreadsheetId ? 'Sheet1' : SHEET_TAB_NAME;
        return fetch('/api/sheets/append', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
          },
          body: JSON.stringify({
            spreadsheetId: activeSpreadsheetId,
            tabName: activeTabName,
            rowData: row
          })
        })
        .then(safeJsonParse)
        .then(data => {
          if (data.success) {
            console.log(`[Google Sheets Sync SUCCESS] Automatically saved updated ${merged.name} record to remote database.`);
            return data;
          } else {
            console.error(`[Google Sheets Sync ERROR] Server rejected save: ${data.error}`);
            return data;
          }
        })
        .catch(fetchErr => {
          console.warn(`[Google Sheets Sync FAIL] Network error attempting to save updated row:`, fetchErr);
          throw fetchErr;
        });
      } catch (err: any) {
        console.error(`[Google Sheets Sync FAIL] Mapping formatter failed for updated fields:`, err.message || err);
        return Promise.reject(err);
      }
    }
    return Promise.resolve({ success: false, error: 'No record found to update' });
  };

  const handleDeleteLearner = (id: string) => {
    setLearners(prev => prev.filter(l => l.id !== id));
    deleteLearnerFromFirestore(id).catch(err => {
      console.warn('[Cloud Firestore] Real-time delete notice:', err.message || err);
    });
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col font-sans text-slate-800 antialiased overflow-x-hidden">
      
      {/* 1. Global Navigation Header Bar (Matching mock) */}
      <header className="bg-[#002B6D] text-white px-4 sm:px-6 py-3.5 sm:py-4.5 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Mobile Navigation Drawer Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer flex items-center justify-center shrink-0"
            title="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-amber-300" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex items-center justify-center border border-white/15 bg-white shrink-0">
            <img 
              src="https://lh3.googleusercontent.com/d/1VFOWXkbY1l9VBvvQXAETZ3gTDmVHUhNB" 
              alt="TCSD ALS Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="font-black text-sm sm:text-lg tracking-tight flex items-baseline gap-1.5 uppercase">
              TCSD ALS DataSphere
              <span className="text-[8px] sm:text-[9px] font-mono font-bold tracking-widest text-sky-400 px-1.5 py-0.5 rounded-sm bg-sky-950/50 normal-case hidden xs:inline-block">
                v2026.1
              </span>
            </h1>
            <p className="text-[9px] sm:text-[10px] text-sky-200/80 font-medium truncate max-w-[180px] sm:max-w-none">Alternative Learning System • Division of Tarlac City</p>
          </div>
        </div>

        {/* User profile dropdown and metadata indicators */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Global ElFabriX Launcher Button in Header */}
          <button
            id="header-elfabrix-trigger-btn"
            onClick={() => setIsElFabriXDrawerOpen(prev => !prev)}
            title="Open ElFabriX AI Orchestrator"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500/20 to-indigo-500/20 hover:from-sky-500/30 hover:to-indigo-500/30 border border-sky-400/40 text-sky-200 hover:text-white transition-all shadow-sm cursor-pointer select-none group"
          >
            <div className="relative flex items-center justify-center">
              <Bot className="w-4 h-4 text-sky-300 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
            </div>
            <span className="text-xs font-black tracking-tight font-mono hidden sm:inline">ElFabriX</span>
          </button>

          {authLoading ? (
            <div className="text-xs text-sky-200 animate-pulse font-mono">Verifying...</div>
          ) : user ? (
            <>
              <div className="hidden lg:flex flex-col text-right">
                <p className="text-xs font-bold text-slate-100">{user.displayName || "DepEd ALS Admin"}</p>
                <p className="text-[9px] text-sky-300 font-mono">{user.email}</p>
              </div>
              
              <div 
                onClick={async () => {
                  if (confirm("Would you like to sign out of TCSD ALS DataSphere?")) {
                    await logout();
                  }
                }}
                className="flex items-center gap-2 sm:gap-3 bg-emerald-500/20 hover:bg-emerald-600/30 px-2.5 sm:px-3 py-1.5 rounded-xl border border-emerald-500/30 hover:border-emerald-500/50 transition cursor-pointer"
                title="Click to Sign Out"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-650 overflow-hidden flex items-center justify-center border border-white/10 shrink-0">
                  <img 
                    src={user.photoURL || "https://lh3.googleusercontent.com/d/1RMiZninylXhyjgIjOKQC_9F7trv8EuQm"} 
                    alt={user.displayName || "User"} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] sm:text-[10px] font-black text-emerald-400 font-mono tracking-widest uppercase">SECURED</span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-slate-200 hidden sm:inline">Log Out</span>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </header>

      {/* Mobile Active Module Quick-Bar (Tablet & Phone Viewports) */}
      <div className="md:hidden bg-[#001D4A] text-white px-4 py-2.5 flex items-center justify-between border-t border-white/10 z-40 sticky top-[57px] shadow-xs print:hidden">
        <div className="flex items-center gap-2 overflow-hidden pr-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
          <span className="text-[10px] uppercase font-mono tracking-wider text-sky-300 shrink-0">Active:</span>
          <span className="text-xs font-extrabold truncate text-white">{selectedDistrict}</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="px-3 py-1 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30 rounded-lg text-[10px] font-extrabold uppercase tracking-wide text-sky-200 shrink-0 flex items-center gap-1 cursor-pointer"
        >
          <Menu className="w-3.5 h-3.5" />
          Switch Module
        </button>
      </div>

      {/* 2. Main Content Split Panel Grid */}
      <div className="grow flex flex-col md:flex-row relative">
        
        {/* Mobile Backdrop Overlay */}
        {isMobileMenuOpen && (
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden animate-fade-in"
          />
        )}

        {/* Left Interactive Scope Panel (Desktop Sidebar & Mobile Drawer) */}
        <aside className={`bg-white border-r border-slate-200 p-4 sm:p-5 shrink-0 flex-col justify-between transition-all duration-200 ${
          isMobileMenuOpen
            ? 'fixed inset-y-0 left-0 z-50 w-[85%] max-w-[320px] shadow-2xl overflow-y-auto flex'
            : 'hidden md:flex md:w-80'
        }`}>
          <div className="space-y-6">
            {/* Mobile Drawer Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 md:hidden">
              <span className="text-xs font-black uppercase font-mono text-[#002B6D] tracking-widest">
                Navigation Directory
              </span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sidebar Quick-Search Bar & Module List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-['Raleway',sans-serif] font-bold text-black text-[18pt] block">
                  MAIN DASHBOARD
                </span>
                {sidebarSearchQuery && (
                  <span className="text-[10px] font-mono font-bold text-[#002B6D] bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    {filteredSidebarModules.length} of {ALL_SIDEBAR_MODULES.length}
                  </span>
                )}
              </div>

              {/* Quick-filter search box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Quick-filter modules..."
                  value={sidebarSearchQuery}
                  onChange={(e) => setSidebarSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs font-medium text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] transition"
                />
                {sidebarSearchQuery && (
                  <button
                    onClick={() => setSidebarSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                    title="Clear filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Module Buttons */}
              <div className="space-y-2">
                {filteredSidebarModules.map((mod) => {
                  const isSelected = selectedDistrict === mod.id;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => {
                        mod.onSelect();
                        if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#002B6D] border-[#002B6D] text-white shadow-sm'
                          : 'bg-[#F8FAFC] border-slate-200/75 hover:bg-slate-100 text-black'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-white' : 'bg-slate-400'}`} />
                        <span className={`font-['Roboto',sans-serif] text-[14pt] leading-snug ${
                          isSelected
                            ? 'text-white font-bold'
                            : 'text-black font-normal'
                        }`}>
                          {mod.label}
                        </span>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 ml-1 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    </button>
                  );
                })}

                {filteredSidebarModules.length === 0 && (
                  <div className="p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1.5 animate-fade-in">
                    <p className="text-xs font-bold text-slate-700">No matching modules</p>
                    <p className="text-[10px] text-slate-400">
                      No results for "{sidebarSearchQuery}". Try "partners", "map", "clc", or "inventories".
                    </p>
                    <button
                      onClick={() => setSidebarSearchQuery('')}
                      className="mt-1 text-xs font-bold text-[#002B6D] hover:underline cursor-pointer"
                    >
                      Clear search filter
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>


        </aside>

        {/* Right Main Interface Content Panel */}
        <main className="grow p-3 sm:p-4 md:p-6 flex flex-col gap-4 sm:gap-6 min-w-0 max-w-full overflow-hidden">
          
          {/* Breadcrumb Trail Navigation */}
          {(() => {
            const { moduleLabel, subTabLabel } = getBreadcrumbInfo();
            return (
              <nav aria-label="Breadcrumb Trail" className="flex items-center gap-1.5 text-xs text-slate-500 font-medium px-1 flex-wrap font-sans">
                <button
                  type="button"
                  onClick={() => { setSelectedDistrict('Overall Analytics'); setActiveTab('dashboard'); }}
                  className="hover:text-[#002B6D] transition flex items-center gap-1 text-slate-500 hover:underline cursor-pointer group"
                >
                  <Home className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#002B6D]" />
                  <span>Dashboard</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className={`hover:text-[#002B6D] transition flex items-center gap-1 cursor-pointer ${
                    activeTab === 'dashboard' ? 'font-bold text-[#002B6D]' : 'text-slate-600 hover:underline'
                  }`}
                >
                  {moduleLabel}
                </button>
                {activeTab !== 'dashboard' && subTabLabel && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <span className="font-extrabold text-[#002B6D] bg-sky-50 text-sky-900 border border-sky-200/80 px-2 py-0.5 rounded-md text-[11px] truncate max-w-[280px]">
                      {subTabLabel}
                    </span>
                  </>
                )}
              </nav>
            );
          })()}

          {/* Google Sheets CLC Synchronization Banner */}
          {selectedDistrict === 'CLC Profile and Directory' && (
            <div className="bg-[#002B6D]/5 border border-[#002B6D]/10 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in print:hidden text-left">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#002B6D]/15 text-[#002B6D] shrink-0">
                  <RefreshCw className={`w-5 h-5 ${isClcSyncing ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h4 className="text-[13px] font-[#002B6D] font-extrabold uppercase tracking-wide">
                    Google Sheets Auto-Sync registry
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {clcSyncTime 
                      ? `Active spreadsheet integration • Last synced on: ${clcSyncTime}` 
                      : 'Operational • Dynamically synchronizing Directory, Profile, and Preparedness Checklist from Google Sheets'}
                  </p>
                </div>
              </div>
              
              <button
                disabled={isClcSyncing}
                onClick={handleSyncCLCSheets}
                className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-wide select-none cursor-pointer transition flex items-center gap-2 shrink-0 ${
                  isClcSyncing 
                    ? 'bg-slate-100 text-slate-400 border border-slate-200' 
                    : 'bg-[#002B6D] text-white hover:bg-[#001D4A] shadow-xs active:scale-[0.98]'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isClcSyncing ? 'animate-spin' : ''}`} />
                {isClcSyncing ? 'Syncing spreadsheet data...' : 'Sync Google Sheets Data'}
              </button>
            </div>
          )}
          
          {/* A. Horizontal Tab Bar Navigation (Identical to top menu in image) */}
          {selectedDistrict !== 'Overall Analytics' && (
            <nav className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/80 rounded-2xl w-full select-none self-start shadow-2xs overflow-x-auto scrollbar-none whitespace-nowrap flex-nowrap font-montserrat">
            <button
              onClick={() => { setActiveTab('dashboard'); setForceTriggerAddForm(false); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-tight transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#002B6D] text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>

            {selectedDistrict !== 'TCSD ALS List Of Passers' && selectedDistrict !== 'ALS Graduate Tracing Data' && (
              <button
                onClick={() => { setActiveTab('map'); setForceTriggerAddForm(false); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-tight transition-all ${
                  activeTab === 'map'
                    ? 'bg-[#002B6D] text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Map className="w-4 h-4" />
                {selectedDistrict === 'District B' 
                  ? 'Partners and Linkages information' 
                  : selectedDistrict === 'Physical Count of Inventories'
                      ? 'Registry of Physical Count of Property, Plant, and Equipment'
                      : selectedDistrict === 'Personnel Record'
                        ? 'Teacher Profile'
                        : selectedDistrict === 'Class Program'
                          ? 'Class Program Schedule Matrix'
                          : selectedDistrict === 'CLC Profile and Directory'
                          ? 'Community Learning Center Directory'
                          : 'TCSD ALS Interactive Map'}
              </button>
            )}

            {selectedDistrict === 'District B' && (
              <>
                <button
                  onClick={() => { setActiveTab('partners-registry'); setForceTriggerAddForm(false); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-tight transition-all cursor-pointer ${
                    activeTab === 'partners-registry'
                      ? 'bg-[#002B6D] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Data Registry of Partners and Linkages
                </button>

                <button
                  onClick={() => { setActiveTab('partners-geo-map'); setForceTriggerAddForm(false); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-tight transition-all cursor-pointer ${
                    activeTab === 'partners-geo-map'
                      ? 'bg-[#002B6D] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-rose-500" />
                  Geographical Location of Partners and Linkages
                </button>
              </>
            )}

            {selectedDistrict === 'Tarlac City' && (
              <>
                <button
                  onClick={() => { setActiveTab('learner'); setForceTriggerAddForm(false); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-tight transition-all ${
                    activeTab === 'learner'
                      ? 'bg-[#002B6D] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Masterlist of Mapped and Potential Learners
                </button>

                <button
                  onClick={() => { setActiveTab('identified-learners-af1'); setForceTriggerAddForm(false); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-tight transition-all ${
                    activeTab === 'identified-learners-af1'
                      ? 'bg-[#002B6D] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Masterlist of Identified ALS Learners from AF1
                </button>

                <button
                  onClick={() => { setActiveTab('population-2024'); setForceTriggerAddForm(false); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-tight transition-all ${
                    activeTab === 'population-2024'
                      ? 'bg-[#002B6D] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Tarlac City Population 2024
                </button>

                <button
                  id="nav-tab-elfabrix-console"
                  onClick={() => { setActiveTab('elfabrix-console'); setForceTriggerAddForm(false); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-tight transition-all ${
                    activeTab === 'elfabrix-console'
                      ? 'bg-[#002B6D] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Bot className="w-4 h-4 text-sky-500" />
                  ElFabriX Console
                </button>
              </>
            )}

            {selectedDistrict === 'Physical Count of Inventories' && (
              <button
                onClick={() => { setActiveTab('learning-materials'); setForceTriggerAddForm(false); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-tight transition-all ${
                  activeTab === 'learning-materials'
                    ? 'bg-[#002B6D] text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Registry of Physical Count of Learning Materials
              </button>
            )}

            {selectedDistrict === 'Personnel Record' && (
              <button
                onClick={() => { setActiveTab('201-file'); setForceTriggerAddForm(false); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-tight transition-all ${
                  activeTab === '201-file'
                    ? 'bg-[#002B6D] text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                201 File
              </button>
            )}

            {selectedDistrict === 'Personnel Record' && (
              <button
                onClick={() => { setActiveTab('performance-rating'); setForceTriggerAddForm(false); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-tight transition-all ${
                  activeTab === 'performance-rating'
                    ? 'bg-[#002B6D] text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Award className="w-4 h-4" />
                Performance Rating
              </button>
            )}

            {selectedDistrict === 'CLC Profile and Directory' && (
              <button
                onClick={() => { setActiveTab('clc-profile'); setForceTriggerAddForm(false); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-tight transition-all ${
                  activeTab === 'clc-profile'
                    ? 'bg-[#002B6D] text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Community Learning Center Profile
              </button>
            )}

            {selectedDistrict === 'CLC Profile and Directory' && (
              <button
                onClick={() => { setActiveTab('clc-prep'); setForceTriggerAddForm(false); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-tight transition-all ${
                  activeTab === 'clc-prep'
                    ? 'bg-[#002B6D] text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <ClipboardCheck className="w-4 h-4" />
                Community Learning Center Preparedness Checklist
              </button>
            )}

            {selectedDistrict === 'TCSD ALS List Of Passers' && (
              <button
                onClick={() => { setActiveTab('tcsd-lrn'); setForceTriggerAddForm(false); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-tight transition-all ${
                  activeTab === 'tcsd-lrn'
                    ? 'bg-[#002B6D] text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Hash className="w-4 h-4" />
                Learner Reference Number
              </button>
            )}

            {selectedDistrict === 'ALS Graduate Tracing Data' && (
              <>
                <button
                  onClick={() => { setActiveTab('als-graduate-tracing'); setForceTriggerAddForm(false); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-tight transition-all ${
                    activeTab === 'als-graduate-tracing'
                      ? 'bg-[#002B6D] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-55'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  ALS Graduate Tracing Registry & Outcomes
                </button>
              </>
            )}

            {!DISTRICTS_WITHOUT_ADMIN_HUB.has(selectedDistrict) && (
              <button
                onClick={() => { setActiveTab('admin'); setForceTriggerAddForm(false); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-tight transition-all ${
                  activeTab === 'admin'
                    ? 'bg-[#002B6D] text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Settings className="w-4 h-4" />
                Admin Hub
              </button>
            )}

            {!DISTRICTS_WITHOUT_SETTINGS.has(selectedDistrict) && (
              <button
                onClick={() => { setActiveTab('settings'); setForceTriggerAddForm(false); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-tight transition-all ${
                  activeTab === 'settings'
                    ? 'bg-[#002B6D] text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Sliders className="w-4 h-4" />
                Settings
              </button>
            )}

            {/* ElFabriX AI Orchestrator Navigation Item - Excluded for Tarlac City Literacy Mapping so ElFabriX Console is the final item */}
            {selectedDistrict !== 'Tarlac City' && selectedDistrict !== 'Data on Tarlac City ALS Literacy Mapping' && (
              <button
                id="nav-tab-elfabrix-btn"
                onClick={() => setIsElFabriXDrawerOpen(true)}
                title="Launch ElFabriX AI Orchestrator Drawer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black tracking-tight transition-all bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200/80 text-sky-800 hover:from-sky-100 hover:to-indigo-100 hover:border-sky-300 ml-auto shadow-2xs cursor-pointer"
              >
                <div className="relative flex items-center justify-center">
                  <Bot className="w-4 h-4 text-sky-600" />
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                </div>
                <span>ElFabriX AI</span>
              </button>
            )}
          </nav>
          )}

          {/* B. Conditional Tab Content Rendering */}
          <div className="grow min-h-0 w-full min-w-0 overflow-hidden">
            {activeTab === 'barangay-profile' ? (
              <BarangayLiteracyProfileDiagnosticView
                selectedDistrict={selectedDistrict}
                learners={learners}
                onSetLearners={setLearners}
                learningCenters={learningCenters}
              />
            ) : activeTab === 'population-2024' ? (
              <TarlacCityPopulation2024View />
            ) : activeTab === 'elfabrix-console' ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <ElFabriXConsole />
              </div>
            ) : activeTab === 'dashboard' && (
              selectedDistrict === 'Overall Analytics' ? (
                <OverallAnalyticsView
                  learningCenters={learningCenters}
                  learners={learners}
                  partners={partners}
                />
              ) : selectedDistrict === 'Personnel Record' ? (
                <PersonnelRecordView viewMode="dashboard" />
              ) : selectedDistrict === 'Class Program' ? (
                <ClassProgramDashboardView onNavigateToMatrix={() => setActiveTab('map')} />
              ) : selectedDistrict === 'CLC Profile and Directory' ? (
                <CLCDashboardView
                  learningCenters={learningCenters}
                  learners={learners}
                  partners={partners}
                  onNavigateToDirectory={() => setActiveTab('map')}
                  onNavigateToProfile={() => setActiveTab('clc-profile')}
                  onNavigateToChecklist={() => setActiveTab('clc-prep')}
                />
              ) : (
                <DashboardView
                  selectedDistrict={selectedDistrict}
                  districts={['District B', 'Physical Count of Inventories', 'Personnel Record']}
                  learningCenters={learningCenters}
                  learners={learners}
                  alerts={alerts}
                  metrics={metrics}
                  onAddLearnerClick={() => {
                    setActiveTab('learner');
                    setForceTriggerAddForm(true);
                  }}
                  partners={partners}
                  setPartners={setPartners}
                  onResetPartners={handleResetPartners}
                  onSyncPartners={handleSyncPartners}
                  syncLoading={partnersSyncLoading}
                  syncError={partnersSyncError}
                  onNavigateToPartnersInfo={() => setActiveTab('map')}
                  onNavigateToPartnersRegistry={() => setActiveTab('partners-registry')}
                />
              )
            )}

            {activeTab === 'map' && (
              selectedDistrict === 'District B' ? (
                <PartnersInfoView
                  partners={partners}
                  setPartners={setPartners}
                  onResetPartners={handleResetPartners}
                  onSyncPartners={handleSyncPartners}
                  syncLoading={partnersSyncLoading}
                  syncError={partnersSyncError}
                />
              ) : selectedDistrict === 'Physical Count of Inventories' ? (
                <PhysicalCountPropEquipView />
              ) : selectedDistrict === 'Personnel Record' ? (
                <PersonnelRecordView viewMode="profile" />
              ) : selectedDistrict === 'Class Program' ? (
                <ClassProgramView learningCenters={learningCenters} learners={learners} />
              ) : selectedDistrict === 'CLC Profile and Directory' ? (
                <CLCDirectoryTableView learningCenters={learningCenters} />
              ) : (
                <MapView
                  selectedDistrict={selectedDistrict}
                  learningCenters={learningCenters}
                  learners={learners}
                  onAddCenter={handleAddLearningCenter}
                  onDeleteCenter={handleDeleteLearningCenter}
                  onSetLearners={setLearners}
                />
              )
            )}

            {activeTab === 'partners-registry' && (
              <PartnersRegistryView
                partners={partners}
                setPartners={setPartners}
                onResetPartners={handleResetPartners}
                onSyncPartners={handleSyncPartners}
                syncLoading={partnersSyncLoading}
                syncError={partnersSyncError}
              />
            )}

            {activeTab === 'partners-geo-map' && (
              <GeographicalLocationPartnersView
                partners={partners}
              />
            )}

            {activeTab === 'learning-materials' && (
              <PhysicalCountLearningMaterialsView />
            )}

            {activeTab === 'learner' && (
              <LearnerDataView
                selectedDistrict={selectedDistrict}
                learners={learners}
                onAddLearner={handleRegisterLearner}
                onUpdateLearner={handleUpdateLearner}
                onDeleteLearner={handleDeleteLearner}
                onSetLearners={setLearners}
                forceShowAddForm={forceTriggerAddForm}
              />
            )}

            {activeTab === 'identified-learners-af1' && (
              <LearnerDataView
                selectedDistrict={selectedDistrict}
                learners={learners}
                onAddLearner={handleRegisterLearner}
                onUpdateLearner={handleUpdateLearner}
                onDeleteLearner={handleDeleteLearner}
                onSetLearners={setLearners}
                forceShowAddForm={forceTriggerAddForm}
                isAf1Mode={true}
                customTitle="Masterlist of Identified ALS Learners from AF1"
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                selectedDistrict={selectedDistrict}
                learningCenters={learningCenters}
                learners={learners}
              />
            )}

            {activeTab === '201-file' && (
              <Teacher201FileView />
            )}

            {activeTab === 'performance-rating' && (
              <PerformanceRatingView />
            )}

            {activeTab === 'clc-profile' && (
              <CLCProfileDirectoryView
                learningCenters={learningCenters}
                onAddCenter={handleAddLearningCenter}
                onDeleteCenter={handleDeleteLearningCenter}
                onUpdateCenter={handleUpdateLearningCenter}
              />
            )}

            {activeTab === 'clc-prep' && (
              <CLCPrepChecklistView
                learningCenters={learningCenters}
              />
            )}

            {activeTab === 'tcsd-passers' && (
              <TcsdAlsListOfPassersView learningCenters={learningCenters} />
            )}

            {activeTab === 'tcsd-lrn' && (
              <LearnerReferenceNumberView learningCenters={learningCenters} />
            )}

            {activeTab === 'als-graduate-tracing' && (
              <ALSGraduateTracingView />
            )}

            {activeTab === 'admin' && (
              <AdminHubView
                selectedDistrict={selectedDistrict}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                selectedDistrict={selectedDistrict}
              />
            )}
          </div>

        </main>

      </div>

      {/* 3. Humble Legal Footer bar */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 text-center text-slate-400 text-[10px] sm:flex sm:items-center sm:justify-between">
        <p>© 2026 TCSD Alternative Learning System Operations DataSphere. All Rights Committed.</p>
        <p className="mt-2 sm:mt-0">DepEd Tarlac City schools division • Republic of the Philippines</p>
      </footer>

      {/* Global Persistent ElFabriX AI Orchestrator Floating Action Button & Drawer */}
      <ElFabriXFloatingDrawer
        isOpen={isElFabriXDrawerOpen}
        onOpen={() => setIsElFabriXDrawerOpen(true)}
        onClose={() => setIsElFabriXDrawerOpen(false)}
      />

    </div>
  );
}
