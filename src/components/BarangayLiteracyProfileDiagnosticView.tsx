import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCw,
  Cpu,
  Server,
  HardDrive,
  Radio,
  Activity,
  ShieldCheck,
  Zap,
  Layers,
  Network,
  BarChart3,
  RefreshCw,
  Award,
  GraduationCap,
  CheckCircle2,
  FileCheck,
  BookOpen
} from 'lucide-react';
import { LearnerRecord, LearningCenter } from '../types';
import { BARANGAY_COORDS } from './MapView';
import { BARANGAY_LIST_WITH_GIDS } from './LearnerDataView';
import { BARANGAY_BASELINE_FALLBACK, BarangayBaselineData } from '../data/barangayBaseline';
import { mapSheetRowToLearner } from '../utils/sheetsSync';
import { barangayGids } from '../data/alsData';

interface BarangayLiteracyProfileDiagnosticViewProps {
  learningCenters?: LearningCenter[];
  learners?: LearnerRecord[];
  onSetLearners?: React.Dispatch<React.SetStateAction<LearnerRecord[]>>;
  selectedDistrict?: string;
}

interface DiagnosticCard {
  id: string;
  categoryName: string;
  categoryValue: string;
  issueFound: string;
  actionTaken: string;
  statusValue: string;
  statusType: 'optimal' | 'active' | 'verified' | 'synchronized' | 'monitored' | 'stable';
  recommendation: string;
  hardwareIconName: 'cpu' | 'server' | 'harddrive' | 'radio' | 'activity' | 'shield' | 'zap' | 'layers' | 'network';
  waveformSvg: string;
}

const BARANGAYS = Object.keys(BARANGAY_COORDS).sort();

function getGoogleDriveDirectLink(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.includes('drive.google.com/file/d/')) {
    const match = trimmed.match(/\/file\/d\/([^\/]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
  }
  if (trimmed.includes('drive.google.com/open?id=')) {
    const match = trimmed.match(/id=([^&]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
  }
  if (trimmed.includes('drive.google.com/uc?id=')) {
    const match = trimmed.match(/id=([^&]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
  }
  return trimmed;
}

const INITIAL_CARDS: DiagnosticCard[] = [
  {
    id: 'diag-1',
    categoryName: 'Average Age',
    categoryValue: 'Age Bracket Demographics',
    issueFound: '',
    actionTaken: '',
    statusValue: 'OPTIMAL',
    statusType: 'optimal',
    recommendation: '',
    hardwareIconName: 'cpu',
    waveformSvg: 'M0 20 Q 20 5, 40 20 T 80 20 T 120 5 T 160 30 T 200 15 T 240 20 T 280 10 T 320 20'
  },
  {
    id: 'diag-2',
    categoryName: 'Mother Tongue',
    categoryValue: 'Language Distribution',
    issueFound: '',
    actionTaken: '',
    statusValue: 'ACTIVE',
    statusType: 'active',
    recommendation: '',
    hardwareIconName: 'activity',
    waveformSvg: 'M0 20 L 30 20 L 40 5 L 50 35 L 60 10 L 70 25 L 80 20 L 120 20 L 130 0 L 140 40 L 150 20 L 320 20'
  },
  {
    id: 'diag-3',
    categoryName: 'Religion',
    categoryValue: 'Religious Affiliation Index',
    issueFound: '',
    actionTaken: '',
    statusValue: 'SYNCHRONIZED',
    statusType: 'synchronized',
    recommendation: '',
    hardwareIconName: 'layers',
    waveformSvg: 'M0 25 Q 30 30, 60 15 T 120 20 T 180 10 T 240 25 T 320 15'
  },
  {
    id: 'diag-4',
    categoryName: 'LAST GRADE LEVEL',
    categoryValue: 'Educational Attainment',
    issueFound: '',
    actionTaken: '',
    statusValue: 'VERIFIED',
    statusType: 'verified',
    recommendation: '',
    hardwareIconName: 'server',
    waveformSvg: 'M0 15 C 40 0, 80 35, 120 15 C 160 -5, 200 30, 240 15 C 280 0, 300 25, 320 15'
  },
  {
    id: 'diag-5',
    categoryName: 'REASONS NOT ATTENDING FORMAL SCHOOLING',
    categoryValue: 'Barriers to Education',
    issueFound: '',
    actionTaken: '',
    statusValue: 'OPTIMAL',
    statusType: 'optimal',
    recommendation: '',
    hardwareIconName: 'harddrive',
    waveformSvg: 'M0 20 L 40 20 L 50 8 L 65 32 L 80 20 L 160 20 L 170 12 L 180 28 L 190 20 L 320 20'
  }
];

export const BarangayLiteracyProfileDiagnosticView: React.FC<BarangayLiteracyProfileDiagnosticViewProps> = ({
  learners = [],
  onSetLearners,
  selectedDistrict = 'Tarlac City'
}) => {
  const [cards, setCards] = useState<DiagnosticCard[]>(INITIAL_CARDS);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [selectedBarangayName, setSelectedBarangayName] = useState<string>('all');
  const [popcenData, setPopcenData] = useState<BarangayBaselineData[]>(BARANGAY_BASELINE_FALLBACK);
  const [fetchedLearners, setFetchedLearners] = useState<LearnerRecord[]>([]);
  const [fetchLoading, setFetchLoading] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const cleanBarangay = (s: string) => (s || '').toLowerCase()
    .replace(/^barangay\s+/i, '')
    .replace(/^brgy\.?\s+/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Helper to fetch single barangay baseline tab directly from Google Sheet
  const fetchBarangayBaselineTab = async (bName: string): Promise<LearnerRecord[]> => {
    if (!bName || bName === 'all') return [];
    
    let matchedGid = barangayGids[bName];
    if (!matchedGid) {
      const cleanTarget = cleanBarangay(bName);
      const foundKey = Object.keys(barangayGids).find(k => {
        const cK = cleanBarangay(k);
        return cK === cleanTarget || cK.includes(cleanTarget) || cleanTarget.includes(cK);
      });
      if (foundKey) matchedGid = barangayGids[foundKey];
    }

    if (!matchedGid) return [];

    const sId = localStorage.getItem('spreadsheetId') || '1Z-GsOOh5DV5CSilR7AZFZX_s1K1ktvC7sVVgFcJR3o0';
    try {
      const url = `/api/sheets/fetch?spreadsheetId=${encodeURIComponent(sId)}&gid=${encodeURIComponent(matchedGid)}&tab=${encodeURIComponent(bName)}&_=${Date.now()}`;
      const res = await fetch(url);
      if (res.ok) {
        const resJson = await res.json();
        if (resJson.records && Array.isArray(resJson.records) && resJson.records.length > 0) {
          return resJson.records as LearnerRecord[];
        }
      }
    } catch (err) {
      console.warn(`Error fetching baseline tab for ${bName}:`, err);
    }
    return [];
  };

  const syncNewRecords = (newRecords: LearnerRecord[]) => {
    if (!newRecords || newRecords.length === 0) return;

    setFetchedLearners(prev => {
      const map = new Map<string, LearnerRecord>();
      prev.forEach(l => {
        const k = (l.id || `${l.lastName}-${l.firstName}-${l.barangay}`).toLowerCase();
        map.set(k, l);
      });
      newRecords.forEach(l => {
        const k = (l.id || `${l.lastName}-${l.firstName}-${l.barangay}`).toLowerCase();
        map.set(k, l);
      });
      return Array.from(map.values());
    });

    if (onSetLearners) {
      onSetLearners(prev => {
        const prevArr = Array.isArray(prev) ? prev : [];
        const map = new Map<string, LearnerRecord>();
        prevArr.forEach(l => {
          const k = (l.id || `${l.lastName}-${l.firstName}-${l.barangay}`).toLowerCase();
          map.set(k, l);
        });
        newRecords.forEach(l => {
          const k = (l.id || `${l.lastName}-${l.firstName}-${l.barangay}`).toLowerCase();
          map.set(k, l);
        });
        return Array.from(map.values());
      });
    }

    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const fetchRemoteEnrolments = async () => {
    setFetchLoading(true);
    try {
      // 1. Fetch remote enrolment AF2 sheets
      const res = await fetch(`/api/sheets/fetch-enrolment-af2?_=${Date.now()}`);
      if (res.ok) {
        const resJson = await res.json();
        if (resJson.success && Array.isArray(resJson.data) && resJson.data.length > 0) {
          const parsed: LearnerRecord[] = [];
          resJson.data.forEach((item: any, i: number) => {
            if (item.row && Array.isArray(item.row) && item.row.length > 3) {
              try {
                const l = mapSheetRowToLearner(item.row, i + 1);
                if (item.sheetName) {
                  l.clcName = item.sheetName;
                  l.communityLearningCenter = item.sheetName;
                }
                if (l.firstName || l.lastName || l.barangay) {
                  parsed.push(l);
                }
              } catch (err) {
                console.warn("Error mapping learner row:", err);
              }
            }
          });
          if (parsed.length > 0) {
            syncNewRecords(parsed);
          }
        }
      }

      // 2. Fetch baseline barangay tabs in background batches
      const bgEntries = Object.entries(barangayGids).filter(([name]) => name !== "Tarlac City Population 2024");
      const batchSize = 6;
      for (let i = 0; i < bgEntries.length; i += batchSize) {
        const batch = bgEntries.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(([bName]) => fetchBarangayBaselineTab(bName))
        );
        const combined = batchResults.flat();
        if (combined.length > 0) {
          syncNewRecords(combined);
        }
      }
    } catch (err: any) {
      console.warn("Could not fetch remote enrolment / baseline records:", err);
    } finally {
      setFetchLoading(false);
    }
  };

  // Effect when selectedBarangayName changes -> instantly fetch that specific barangay tab
  useEffect(() => {
    if (!selectedBarangayName || selectedBarangayName === 'all') return;

    let isMounted = true;
    setFetchLoading(true);

    fetchBarangayBaselineTab(selectedBarangayName).then((records) => {
      if (!isMounted) return;
      setFetchLoading(false);
      if (records && records.length > 0) {
        syncNewRecords(records);
      }
    });

    return () => { isMounted = false; };
  }, [selectedBarangayName]);

  useEffect(() => {
    const fetchPopulationData = async () => {
      const sId = localStorage.getItem('spreadsheetId') || '1Z-GsOOh5DV5CSilR7AZFZX_s1K1ktvC7sVVgFcJR3o0';
      try {
        const responsePop = await fetch(`/api/sheets/fetch?spreadsheetId=${encodeURIComponent(sId)}&gid=1296334520&tabName=${encodeURIComponent('Tarlac City Population 2024')}&_=${Date.now()}`);
        if (responsePop.ok) {
          const resPopJson = await responsePop.json();
          if (resPopJson.success && resPopJson.data && resPopJson.data.length > 1) {
            const popHeaders = (resPopJson.data[0] || []).map((h: any) => String(h || '').toLowerCase().trim());
            const hasChairman = popHeaders.some(h => h.includes('chairman') || h.includes('punong'));
            const noColIdx = popHeaders.findIndex(h => h.includes('no.'));
            const logoColIdx = popHeaders.findIndex(h => h.includes('logo'));
            const bgColIdx = popHeaders.findIndex(h => h.includes('barangay'));
            const classColIdx = popHeaders.findIndex(h => h.includes('classification'));
            const popColIdx = popHeaders.findIndex(h => h.includes('population'));
            const aboutColIdx = popHeaders.findIndex(h => h.includes('about'));

            const parsedPopList = resPopJson.data.slice(1).map((row: any, rIdx: number) => {
              const bgVal = row[bgColIdx !== -1 ? bgColIdx : 2] ? String(row[bgColIdx !== -1 ? bgColIdx : 2]).trim() : '';
              if (!bgVal) return null;
              
              const classIdx = classColIdx !== -1 ? classColIdx : (hasChairman || row.length >= 8 ? 5 : 3);
              const popIdx = popColIdx !== -1 ? popColIdx : (hasChairman || row.length >= 8 ? 6 : 4);
              const aboutIdx = aboutColIdx !== -1 ? aboutColIdx : (hasChairman || row.length >= 8 ? 7 : 5);
              const logoVal = row[logoColIdx !== -1 ? logoColIdx : 1] ? String(row[logoColIdx !== -1 ? logoColIdx : 1]).trim() : '';
              const classVal = row[classIdx] ? String(row[classIdx]).trim() : 'Rural';
              const popVal = parseInt(String(row[popIdx] || '0').replace(/,/g, '')) || 0;
              const aboutVal = row[aboutIdx] ? String(row[aboutIdx]).trim() : '';
              const bgNo = parseInt(String(row[noColIdx !== -1 ? noColIdx : 0] || '0')) || (rIdx + 1);

              let calculatedDistrict = 'District A';
              const centralBgs = ["poblacion", "central", "ligtasan", "mabini", "san nicolas", "san vicente", "cut cut 1", "cut cut 2", "sto. cristo", "lourdes"];
              const districtBBgs = ["san carlos", "san francisco", "san isidro", "san jose", "san jose de urquico", "san juan bautista", "san juan de bautista", "san juan de mata", "san luis", "san miguel", "san manuel", "san pablo", "san pascual", "san rafael", "san roque", "san sebastian", "santa cruz", "santa maria", "sto. domingo", "sto. nino", "sapang tagalog", "sapang maragul", "sepung calzada", "sinait", "suizo", "tariji", "tibagan", "trinidad", "ungot", "villa bacolor", "bjmp"];
              const bNameLower = bgVal.toLowerCase();
              if (centralBgs.some(cBg => bNameLower.includes(cBg))) {
                calculatedDistrict = 'Physical Count of Inventories';
              } else if (districtBBgs.some(dBg => bNameLower.includes(dBg))) {
                calculatedDistrict = 'District B';
              }

              return {
                barangayNumber: bgNo,
                barangayName: bgVal,
                logo: getGoogleDriveDirectLink(logoVal),
                classification: classVal,
                geographicType: (classVal.toLowerCase().includes('urban') ? 'Urban' : 'Rural') as 'Urban' | 'Rural',
                basePopulation: popVal,
                about: aboutVal,
                district: calculatedDistrict
              };
            }).filter((item: any): item is BarangayBaselineData => item !== null);

            if (parsedPopList.length > 0) {
              setPopcenData(parsedPopList);
            }
          }
        }
      } catch (err: any) {
        console.warn("Could not fetch population data, using fallback:", err);
      }
    };

    fetchPopulationData();
    fetchRemoteEnrolments();
  }, []);

  const allLearners = useMemo(() => {
    const map = new Map<string, LearnerRecord>();
    (learners || []).forEach((l, idx) => {
      const key = l.id || `prop-${l.lastName}-${l.firstName}-${l.barangay}-${idx}`.toLowerCase();
      map.set(key, l);
    });
    fetchedLearners.forEach((l, idx) => {
      const key = l.id || `fetched-${l.lastName}-${l.firstName}-${l.barangay}-${idx}`.toLowerCase();
      map.set(key, l);
    });
    return Array.from(map.values());
  }, [learners, fetchedLearners]);

  const selectedLearners = useMemo(() => {
    if (!allLearners || allLearners.length === 0) return [];
    if (selectedBarangayName === 'all') {
      return allLearners.filter(l => {
        const bInfo = BARANGAY_COORDS[l.barangay || ''];
        return selectedDistrict === 'Tarlac City' ? true : bInfo?.district === selectedDistrict;
      });
    }
    const targetClean = cleanBarangay(selectedBarangayName);
    return allLearners.filter(l => {
      const lClean = cleanBarangay(l.barangay || '');
      if (!lClean) return false;
      return lClean === targetClean || lClean.includes(targetClean) || targetClean.includes(lClean);
    });
  }, [allLearners, selectedBarangayName, selectedDistrict]);

  const barangayStats = useMemo(() => {
    const stats: { [key: string]: { total: number; males: number; females: number } } = {};
    BARANGAYS.forEach(b => {
      stats[b] = { total: 0, males: 0, females: 0 };
    });
    if (allLearners) {
      allLearners.forEach(l => {
        const lClean = cleanBarangay(l.barangay || '');
        if (!lClean) return;
        const matchedB = BARANGAYS.find(b => {
          const bClean = cleanBarangay(b);
          return bClean === lClean || bClean.includes(lClean) || lClean.includes(bClean);
        });
        if (matchedB && stats[matchedB]) {
          stats[matchedB].total += 1;
          if ((l.gender || '').toLowerCase().startsWith('m')) stats[matchedB].males += 1;
          if ((l.gender || '').toLowerCase().startsWith('f')) stats[matchedB].females += 1;
        }
      });
    }
    return stats;
  }, [allLearners]);

  const baselineStats = useMemo(() => {
    const total = selectedLearners.length;
    const males = selectedLearners.filter(l => (l.gender || '').toLowerCase().trim().startsWith('m')).length;
    const females = selectedLearners.filter(l => (l.gender || '').toLowerCase().trim().startsWith('f')).length;

    const ages = selectedLearners.map(l => Number(l.age)).filter(a => !isNaN(a) && a > 0);
    const averageAge = ages.length > 0 ? (ages.reduce((sum, a) => sum + a, 0) / ages.length).toFixed(1) : '0';

    const motherTongueCounts: { [key: string]: number } = {};
    selectedLearners.forEach(l => {
      const val = l.motherTongue?.trim();
      if (val && val !== '-' && val.toLowerCase() !== 'n/a') {
        motherTongueCounts[val] = (motherTongueCounts[val] || 0) + 1;
      }
    });
    const topMotherTonguesList = Object.entries(motherTongueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(entry => `${entry[0]} (${entry[1]})`);

    const religionCounts: { [key: string]: number } = {};
    selectedLearners.forEach(l => {
      const val = l.religion?.trim();
      if (val && val !== '-' && val.toLowerCase() !== 'n/a') {
        religionCounts[val] = (religionCounts[val] || 0) + 1;
      }
    });
    const topReligionsList = Object.entries(religionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(entry => `${entry[0]} (${entry[1]})`);

    const gradeCounts: { [key: string]: number } = {};
    selectedLearners.forEach(l => {
      const val = l.lastGradeLevelCompleted?.trim();
      if (val && val !== '-' && val.toLowerCase() !== 'n/a') {
        gradeCounts[val] = (gradeCounts[val] || 0) + 1;
      }
    });
    const topGradesList = Object.entries(gradeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => `${entry[0]} (${entry[1]})`);

    const reasonCounts: { [key: string]: number } = {};
    selectedLearners.forEach(l => {
      const val = l.reasonsForNotAttending?.trim();
      if (val && val !== '-' && val.toLowerCase() !== 'n/a') {
        reasonCounts[val] = (reasonCounts[val] || 0) + 1;
      }
    });
    const topReasonsList = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => `${entry[0]} (${entry[1]})`);

    // Dynamic calculation of ALS Certification and Completion Status metrics
    // Reference column: "ALS CERTIFICATION AND COMPLETION STATUS" in Masterlist of Mapped and Potential Learners Per Barangay
    let blpBeginning = 0;
    let blpDeveloping = 0;
    let aeElemIntermediate = 0;
    let aeJhsUpperIntermediate = 0;
    let aeJhsProficient = 0;
    let alsShsGraduates = 0;

    selectedLearners.forEach(l => {
      const rawCert = (l.alsCertificationStatus || '').toLowerCase().trim();
      const remarks = (l.remarks || '').toLowerCase().trim();

      // Look at the official ALS CERTIFICATION AND COMPLETION STATUS column first, then check remarks if it holds the credential
      let statusText = rawCert;
      if (!statusText && (remarks.includes('completer') || remarks.includes('graduate') || remarks.includes('passer'))) {
        statusText = remarks;
      }

      if (!statusText || statusText === '—' || statusText === '-' || statusText === 'n/a' || statusText === 'none' || statusText === 'no' || statusText === 'empty') {
        return;
      }

      // 1. BLP Beginning Level Completer
      if (
        statusText.includes('blp beginning') || 
        statusText.includes('beginning level completer') || 
        (statusText.includes('beginning') && (statusText.includes('completer') || statusText.includes('level') || statusText.includes('blp'))) ||
        statusText.includes('basic literacy beginning')
      ) {
        blpBeginning++;
      }
      // 2. BLP Developing Level Completer
      else if (
        statusText.includes('blp developing') || 
        statusText.includes('developing level completer') || 
        (statusText.includes('developing') && (statusText.includes('completer') || statusText.includes('level') || statusText.includes('blp'))) ||
        statusText.includes('basic literacy developing')
      ) {
        blpDeveloping++;
      }
      // 3. A&E Elementary Intermediate Graduates
      else if (
        statusText.includes('elementary intermediate') || 
        (statusText.includes('a&e elementary') && (statusText.includes('graduate') || statusText.includes('grad') || statusText.includes('completer') || statusText.includes('passer') || statusText.includes('intermediate'))) ||
        (statusText.includes('elementary') && (statusText.includes('graduate') || statusText.includes('graduates') || statusText.includes('intermediate')))
      ) {
        aeElemIntermediate++;
      }
      // 4. A&E JHS Upper Intermediate Level Completer
      else if (
        statusText.includes('upper intermediate') || 
        statusText.includes('jhs upper') || 
        statusText.includes('secondary upper') ||
        (statusText.includes('upper') && (statusText.includes('jhs') || statusText.includes('secondary') || statusText.includes('intermediate')))
      ) {
        aeJhsUpperIntermediate++;
      }
      // 5. A&E JHS Proficient Level Passer
      else if (
        statusText.includes('proficient') || 
        statusText.includes('jhs proficient') || 
        statusText.includes('jhs passer') || 
        statusText.includes('secondary passer') ||
        (statusText.includes('jhs') && (statusText.includes('passer') || statusText.includes('completer') || statusText.includes('graduate'))) ||
        (statusText.includes('a&e secondary') && (statusText.includes('passer') || statusText.includes('completer'))) ||
        (statusText.includes('secondary') && (statusText.includes('passer') || statusText.includes('completer')))
      ) {
        aeJhsProficient++;
      }
      // 6. ALS SHS Graduates
      else if (
        statusText.includes('shs') || 
        statusText.includes('senior high') || 
        statusText.includes('grade 12') ||
        (statusText.includes('senior') && statusText.includes('graduate'))
      ) {
        alsShsGraduates++;
      }
    });

    return {
      total,
      males,
      females,
      averageAge,
      topMotherTongues: topMotherTonguesList.length > 0 ? topMotherTonguesList.join(', ') : 'None Recorded',
      topReligions: topReligionsList.length > 0 ? topReligionsList.join(', ') : 'None Recorded',
      topGrades: topGradesList.length > 0 ? topGradesList.join(', ') : 'None Recorded',
      topReasons: topReasonsList.length > 0 ? topReasonsList.join(', ') : 'None Recorded',
      // ALS Certification & Completion Status
      blpBeginning,
      blpDeveloping,
      aeElemIntermediate,
      aeJhsUpperIntermediate,
      aeJhsProficient,
      alsShsGraduates
    };
  }, [selectedLearners]);

  const activeLogoUrl = useMemo(() => {
    if (selectedBarangayName !== 'all') {
      const item = popcenData.find(b => cleanBarangay(b.barangayName) === cleanBarangay(selectedBarangayName));
      if (item?.logo && item.logo.trim().length > 0) {
        return getGoogleDriveDirectLink(item.logo);
      }
    }
    return getGoogleDriveDirectLink("https://drive.google.com/file/d/1auohBcQOz7fZTkbeu-4topUS4i18QiHW/view?usp=drive_link");
  }, [selectedBarangayName, popcenData]);

  const filteredBarangays = useMemo(() => {
    return BARANGAYS.filter(bName => {
      const bInfo = BARANGAY_COORDS[bName];
      const matchesDistrict = selectedDistrict === 'Tarlac City' ? true : bInfo?.district === selectedDistrict;
      if (!matchesDistrict) return false;
      if (selectedBarangayName !== 'all' && bName !== selectedBarangayName) return false;
      return true;
    });
  }, [selectedDistrict, selectedBarangayName]);

  const handleRefreshCard = (id: string) => {
    setRefreshingId(id);
    setTimeout(() => {
      setRefreshingId(null);
    }, 600);
  };

  const getHardwareIcon = (iconName: DiagnosticCard['hardwareIconName']) => {
    const props = { className: "w-6 h-6 text-cyan-400 stroke-[1.75]" };
    switch (iconName) {
      case 'cpu': return <Cpu {...props} />;
      case 'server': return <Server {...props} />;
      case 'harddrive': return <HardDrive {...props} />;
      case 'radio': return <Radio {...props} />;
      case 'activity': return <Activity {...props} />;
      case 'shield': return <ShieldCheck {...props} />;
      case 'zap': return <Zap {...props} />;
      case 'layers': return <Layers {...props} />;
      case 'network': return <Network {...props} />;
      default: return <Cpu {...props} />;
    }
  };

  const getStatusBadge = (statusType: DiagnosticCard['statusType'], value: string) => {
    switch (statusType) {
      case 'optimal':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {value}
          </span>
        );
      case 'active':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            {value}
          </span>
        );
      case 'synchronized':
      case 'verified':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {value}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {value}
          </span>
        );
    }
  };

  const getRankingsForCategory = (cardId: string) => {
    if (cardId === 'diag-1') {
      const brackets = [
        { label: '15 – 24 yrs old (Youth)', count: 0 },
        { label: '25 – 34 yrs old (Young Adult)', count: 0 },
        { label: '12 – 14 yrs old (JHS Age)', count: 0 },
        { label: '35 – 44 yrs old (Adult)', count: 0 },
        { label: '45+ yrs old (Senior Adult)', count: 0 },
      ];
      selectedLearners.forEach(l => {
        const a = Number(l.age);
        if (!isNaN(a) && a > 0) {
          if (a >= 12 && a <= 14) brackets[2].count++;
          else if (a >= 15 && a <= 24) brackets[0].count++;
          else if (a >= 25 && a <= 34) brackets[1].count++;
          else if (a >= 35 && a <= 44) brackets[3].count++;
          else if (a >= 45) brackets[4].count++;
        }
      });
      const totalAges = brackets.reduce((s, item) => s + item.count, 0);
      if (totalAges === 0) {
        return [
          { name: '15 – 24 yrs old (Youth)', stat: '0 learners (0%)' },
          { name: '25 – 34 yrs old (Young Adult)', stat: '0 learners (0%)' },
          { name: '12 – 14 yrs old (JHS Age)', stat: '0 learners (0%)' },
          { name: '35 – 44 yrs old (Adult)', stat: '0 learners (0%)' },
          { name: '45+ yrs old (Senior Adult)', stat: '0 learners (0%)' },
        ];
      }
      const sorted = [...brackets].sort((a, b) => b.count - a.count);
      return sorted.map((item) => ({
        name: item.label,
        stat: `${item.count} learners (${Math.round((item.count / totalAges) * 100)}%)`
      }));
    }

    if (cardId === 'diag-2') {
      const counts: { [k: string]: number } = {};
      selectedLearners.forEach(l => {
        const val = l.motherTongue?.trim();
        if (val && val !== '-' && val.toLowerCase() !== 'n/a') {
          counts[val] = (counts[val] || 0) + 1;
        }
      });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const total = selectedLearners.length || 1;
      const res = [];
      const defaultLangs = ['Tagalog', 'Kapampangan', 'Ilocano', 'Pangasinan', 'English / Others'];
      for (let i = 0; i < 5; i++) {
        if (sorted[i]) {
          res.push({
            name: sorted[i][0],
            stat: `${sorted[i][1]} (${Math.round((sorted[i][1] / total) * 100)}%)`
          });
        } else if (sorted.length === 0) {
          res.push({ name: defaultLangs[i], stat: '0 learners (0%)' });
        } else {
          res.push({ name: `Other Language ${i + 1}`, stat: '0 learners (0%)' });
        }
      }
      return res;
    }

    if (cardId === 'diag-3') {
      const counts: { [k: string]: number } = {};
      selectedLearners.forEach(l => {
        const val = l.religion?.trim();
        if (val && val !== '-' && val.toLowerCase() !== 'n/a') {
          counts[val] = (counts[val] || 0) + 1;
        }
      });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const total = selectedLearners.length || 1;
      const res = [];
      const defaultReligions = ['Roman Catholic', 'Iglesia ni Cristo', 'Islam', 'Born Again Christian', 'Seventh-day Adventist'];
      for (let i = 0; i < 5; i++) {
        if (sorted[i]) {
          res.push({
            name: sorted[i][0],
            stat: `${sorted[i][1]} (${Math.round((sorted[i][1] / total) * 100)}%)`
          });
        } else if (sorted.length === 0) {
          res.push({ name: defaultReligions[i], stat: '0 learners (0%)' });
        } else {
          res.push({ name: `Other Religion ${i + 1}`, stat: '0 learners (0%)' });
        }
      }
      return res;
    }

    if (cardId === 'diag-4') {
      const counts: { [k: string]: number } = {};
      selectedLearners.forEach(l => {
        const val = l.lastGradeLevelCompleted?.trim();
        if (val && val !== '-' && val.toLowerCase() !== 'n/a') {
          counts[val] = (counts[val] || 0) + 1;
        }
      });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const total = selectedLearners.length || 1;
      const res = [];
      const defaultGrades = ['Grade 8 (JHS Undergraduate)', 'Grade 6 (Elementary Graduate)', 'Grade 10 (JHS Completer)', 'Grade 7', 'Grade 9'];
      for (let i = 0; i < 5; i++) {
        if (sorted[i]) {
          res.push({
            name: sorted[i][0],
            stat: `${sorted[i][1]} (${Math.round((sorted[i][1] / total) * 100)}%)`
          });
        } else if (sorted.length === 0) {
          res.push({ name: defaultGrades[i], stat: '0 learners (0%)' });
        } else {
          res.push({ name: `Other Grade ${i + 1}`, stat: '0 learners (0%)' });
        }
      }
      return res;
    }

    if (cardId === 'diag-5') {
      const counts: { [k: string]: number } = {};
      selectedLearners.forEach(l => {
        const val = l.reasonsForNotAttending?.trim();
        if (val && val !== '-' && val.toLowerCase() !== 'n/a') {
          counts[val] = (counts[val] || 0) + 1;
        }
      });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const total = selectedLearners.length || 1;
      const res = [];
      const defaultReasons = [
        'High Cost of Education / Poverty',
        'Employment / Early Work',
        'Family Matters / Early Marriage',
        'Distance of School from Home',
        'Lack of Personal Interest'
      ];
      for (let i = 0; i < 5; i++) {
        if (sorted[i]) {
          res.push({
            name: sorted[i][0],
            stat: `${sorted[i][1]} (${Math.round((sorted[i][1] / total) * 100)}%)`
          });
        } else if (sorted.length === 0) {
          res.push({ name: defaultReasons[i], stat: '0 reported (0%)' });
        } else {
          res.push({ name: `Other Barrier ${i + 1}`, stat: '0 reported (0%)' });
        }
      }
      return res;
    }

    return [];
  };

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 bg-slate-950 text-slate-100 font-['Roboto',sans-serif] min-h-screen">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#002B6D] to-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Barangay Literacy Mapping Profile and Demographic Data
          </h2>
        </div>

        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
          <div className="text-right">
            <p className="text-[10px] uppercase font-mono font-bold text-slate-400">Diagnostic Health</p>
            <p className="text-lg font-black text-emerald-400 font-mono">99.4% OPTIMAL</p>
          </div>
          <button 
            onClick={() => setCards([...INITIAL_CARDS])}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-mono font-bold transition shadow-sm"
          >
            <RotateCw className="w-3.5 h-3.5" /> Re-Scan All Nodes
          </button>
        </div>
      </div>

      {/* 2. BARANGAY NODE SEARCH & BASELINE LITERACY MAPPING CONTAINERS */}
      <div className="flex flex-col gap-6">
        
        {/* Top Container: 🔍 Search Specific Barangay Node */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="space-y-3">
            <label className="block font-['Raleway',sans-serif] font-bold text-white text-[16pt] leading-snug">
              🔍 Search Specific Barangay Node
            </label>

            <select
              value={selectedBarangayName}
              onChange={(e) => setSelectedBarangayName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold focus:outline-none text-slate-100 focus:ring-2 focus:ring-cyan-500/50 transition"
            >
              <option value="all">-- All Barangay Nodes ({BARANGAY_LIST_WITH_GIDS.length}) --</option>
              {BARANGAY_LIST_WITH_GIDS.filter(bg => {
                const bInfo = BARANGAY_COORDS[bg.name];
                return selectedDistrict === 'Tarlac City' ? true : bInfo?.district === selectedDistrict;
              }).map((bg) => (
                <option key={bg.name} value={bg.name}>
                  {bg.name}
                </option>
              ))}
            </select>

            {/* Scrollable grid/list of barangays */}
            <div 
              style={{ height: '3cm', maxHeight: '3cm' }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 h-[3cm] max-h-[3cm] overflow-y-auto pr-1 border border-slate-800 rounded-xl p-3 bg-slate-950/60"
            >
              {BARANGAYS.filter(bName => {
                const bInfo = BARANGAY_COORDS[bName];
                return selectedDistrict === 'Tarlac City' ? true : bInfo?.district === selectedDistrict;
              }).map((bName) => {
                const count = barangayStats[bName]?.total || 0;
                const isSelected = selectedBarangayName === bName;
                const bInfo = BARANGAY_COORDS[bName];

                return (
                  <button
                    key={bName}
                    onClick={() => setSelectedBarangayName(bName)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex justify-between items-center text-xs ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md'
                        : 'bg-slate-900 border-slate-800 hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div>
                      <p className="font-bold flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          count > 25 ? 'bg-rose-500' :
                          count > 10 ? 'bg-amber-400' :
                          count > 0 ? 'bg-emerald-400' : 'bg-slate-600'
                        }`} />
                        <span className="truncate">{bName}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                        count > 0 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {count > 0 ? `${count} rows` : '0'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Container: 📚 Baseline Data on Literacy Mapping & Demographic */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <h3 className="font-['Raleway',sans-serif] font-bold text-white text-[16pt] leading-snug flex items-center gap-2">
              📚 Baseline Data on Literacy Mapping & Demographic
            </h3>
            <div className="flex items-center gap-2">
              {lastSyncTime && (
                <span className="text-[10px] text-slate-400 font-mono">
                  Synced: {lastSyncTime}
                </span>
              )}
              <button
                onClick={async () => {
                  setFetchLoading(true);
                  try {
                    if (selectedBarangayName && selectedBarangayName !== 'all') {
                      const records = await fetchBarangayBaselineTab(selectedBarangayName);
                      if (records && records.length > 0) {
                        syncNewRecords(records);
                      }
                    } else {
                      await fetchRemoteEnrolments();
                    }
                  } finally {
                    setFetchLoading(false);
                  }
                }}
                disabled={fetchLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-mono font-bold transition shadow-sm cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${fetchLoading ? 'animate-spin' : ''}`} />
                {fetchLoading ? 'Syncing...' : 'Sync Data'}
              </button>
            </div>
          </div>

          {/* Dynamic Node Logo Banner */}
          <div className="flex items-center gap-3.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800 shadow-inner">
            {activeLogoUrl ? (
              <img 
                src={activeLogoUrl} 
                alt="Dynamic Node Logo" 
                className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-xs shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  const fb = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                  if (fb) fb.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="w-12 h-12 rounded-xl bg-[#002B6D] text-white font-extrabold text-[11px] flex items-center justify-center border border-slate-700 shrink-0"
              style={{ display: activeLogoUrl ? 'none' : 'flex' }}
            >
              TCSD
            </div>

            <div className="grow min-w-0">
              <h4 className="font-['Raleway',sans-serif] font-bold text-white text-[16pt] truncate">
                {selectedBarangayName === 'all' ? 'Tarlac City' : `Barangay ${selectedBarangayName}`}
              </h4>
              <p className="text-[9pt] text-slate-400 font-normal mt-0.5">
                Synced from Google Sheet
              </p>
            </div>
          </div>

          {/* Male / Female / Total / Pop Stat Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
            <div className="bg-blue-950/50 border border-blue-800/60 rounded-xl py-2.5 px-2">
              <span className="text-[10px] uppercase font-bold text-blue-400 block">Male</span>
              <span className="text-base font-black text-blue-200">{baselineStats.males}</span>
            </div>
            <div className="bg-pink-950/50 border border-pink-800/60 rounded-xl py-2.5 px-2">
              <span className="text-[10px] uppercase font-bold text-pink-400 block">Female</span>
              <span className="text-base font-black text-pink-200">{baselineStats.females}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl py-2.5 px-2">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Total Mapped</span>
              <span className="text-base font-black text-white">{baselineStats.total}</span>
            </div>
            <div className="bg-violet-950/50 border border-violet-800/60 rounded-xl py-2.5 px-2">
              <span className="text-[10px] uppercase font-bold text-violet-400 block">Barangay Population</span>
              <span className="text-base font-black text-violet-200">
                {selectedBarangayName === 'all' 
                  ? popcenData.reduce((acc, b) => acc + b.basePopulation, 0).toLocaleString()
                  : (popcenData.find(b => cleanBarangay(b.barangayName) === cleanBarangay(selectedBarangayName))?.basePopulation?.toLocaleString() || 'N/A')}
              </span>
            </div>
          </div>

          {/* ALS Certification and Completion Status Container */}
          <div className="bg-slate-950/90 border border-cyan-900/40 rounded-xl p-4 sm:p-5 shadow-lg space-y-3.5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-['Raleway',sans-serif] font-bold text-white text-sm sm:text-base tracking-wide flex items-center gap-2">
                    ALS Certification and Completion Status
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Official ALS K-12 Program Level Attainment & Equivalency Metrics
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  Total Certified / Completers: {
                    baselineStats.blpBeginning +
                    baselineStats.blpDeveloping +
                    baselineStats.aeElemIntermediate +
                    baselineStats.aeJhsUpperIntermediate +
                    baselineStats.aeJhsProficient +
                    baselineStats.alsShsGraduates
                  }
                </span>
              </div>
            </div>

            {/* Metric Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono">
              
              {/* 1. BLP Beginning Level Completer */}
              <div className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-3 flex items-center justify-between gap-3 transition-all">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-[11px] font-semibold text-slate-200 truncate">
                      BLP Beginning Level Completer :
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-sans">Basic Literacy • Entry & Alphabetical Stage</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base font-extrabold text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800/60">
                    {baselineStats.blpBeginning}
                  </span>
                </div>
              </div>

              {/* 2. BLP Developing Level Completer */}
              <div className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-3 flex items-center justify-between gap-3 transition-all">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[11px] font-semibold text-slate-200 truncate">
                      BLP Developing Level Completer :
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-sans">Basic Literacy • Reading & Writing Mastery</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base font-extrabold text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/60">
                    {baselineStats.blpDeveloping}
                  </span>
                </div>
              </div>

              {/* 3. A&E Elementary Intermediate Graduates */}
              <div className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-3 flex items-center justify-between gap-3 transition-all">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-[11px] font-semibold text-slate-200 truncate">
                      A&E Elementary Intermediate Graduates :
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-sans">A&E Elementary • Grade 6 Equivalency</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base font-extrabold text-blue-300 bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-800/60">
                    {baselineStats.aeElemIntermediate}
                  </span>
                </div>
              </div>

              {/* 4. A&E JHS Upper Intermediate Level Completer */}
              <div className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-3 flex items-center justify-between gap-3 transition-all">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-[11px] font-semibold text-slate-200 truncate">
                      A&E JHS Upper Intermediate Level Completer :
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-sans">Junior High • Intermediate Stage (Grades 7-9)</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base font-extrabold text-indigo-300 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800/60">
                    {baselineStats.aeJhsUpperIntermediate}
                  </span>
                </div>
              </div>

              {/* 5. A&E JHS Proficient Level Passer */}
              <div className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-3 flex items-center justify-between gap-3 transition-all">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-[11px] font-semibold text-slate-200 truncate">
                      A&E JHS Proficient Level Passer :
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-sans">Junior High • Grade 10 A&E Passer/Completer</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base font-extrabold text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/60">
                    {baselineStats.aeJhsProficient}
                  </span>
                </div>
              </div>

              {/* 6. ALS SHS Graduates */}
              <div className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-3 flex items-center justify-between gap-3 transition-all">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="text-[11px] font-semibold text-slate-200 truncate">
                      ALS SHS Graduates :
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-sans">Senior High • Grade 12 ALS Track Graduate</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base font-extrabold text-purple-300 bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-800/60">
                    {baselineStats.alsShsGraduates}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* 3. Dynamic Diagnostic Grid (Grid of 5 Dark Rounded Cards in a 2x2 Layout) */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map((card) => {
            const ranks = getRankingsForCategory(card.id);

            return (
              <div
                key={card.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden transition-all duration-300 flex flex-col justify-between gap-3 group"
              >
                {/* Background Subtle Gradient Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition" />

                {/* Card Top Row: Left Category, Right Line-Art Hardware Icon */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-mono font-extrabold text-white truncate">
                      {card.categoryName}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-xs shrink-0">
                    {getHardwareIcon(card.hardwareIconName)}
                  </div>
                </div>

                {/* Waveform Chart (Stylized Diagnostic Test Graphic) */}
                <div className="w-full h-8 my-0.5 relative flex items-center overflow-hidden bg-slate-950/60 rounded-lg border border-slate-800/50 px-2">
                  <svg className="w-full h-full" viewBox="0 0 320 40" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id={`grad-${card.id}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                        <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                      </linearGradient>
                    </defs>
                    <path
                      d={card.waveformSvg}
                      fill="none"
                      stroke={`url(#grad-${card.id})`}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* Rank 1 to Rank 5 Data Layout */}
                <div className="space-y-1.5 text-xs font-mono pt-1">
                  {ranks.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`grid grid-cols-12 gap-2 items-center py-1.5 px-2 rounded-lg border transition ${
                        idx === 0 
                          ? 'bg-cyan-950/40 border-cyan-500/30 text-white' 
                          : 'bg-slate-950/40 border-slate-800/60 text-slate-200'
                      }`}
                    >
                      <span className={`col-span-3 font-extrabold text-[11px] ${
                        idx === 0 ? 'text-cyan-300' : idx === 1 ? 'text-blue-300' : 'text-slate-400'
                      }`}>
                        Rank {idx + 1}:
                      </span>
                      <div className="col-span-9 font-semibold text-[11px] truncate flex items-center justify-between gap-1.5 min-w-0">
                        <span className="truncate">{item.name}</span>
                        <span className="px-1.5 py-0.5 text-[9.5px] rounded bg-slate-800 text-cyan-200 border border-slate-700/80 shrink-0 font-extrabold">
                          {item.stat}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BarangayLiteracyProfileDiagnosticView;
