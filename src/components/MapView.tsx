/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * MapView.tsx - Interactive Leaflet Map for ALS Literacy Baseline Mapping in Tarlac City, Philippines.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Circle,
  CircleMarker,
  useMap, 
  useMapEvents 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  ZoomIn, 
  ZoomOut, 
  MapPin, 
  Plus, 
  Layers, 
  Info, 
  Trash2, 
  HelpCircle, 
  CheckCircle, 
  Users, 
  Bookmark, 
  TrendingUp, 
  Sparkles,
  RefreshCw,
  Flame,
  Compass,
  Activity,
  CheckCircle2,
  Minimize2,
  Maximize2,
  PanelLeft,
  PanelRight,
  X,
  BookOpen
} from 'lucide-react';
import { LearningCenter, LearnerRecord, formatDistrictName } from '../types';
import { barangayGids } from '../data/alsData';
import { BARANGAY_BASELINE_FALLBACK, BarangayBaselineData } from '../data/barangayBaseline';
import { BARANGAY_LIST_WITH_GIDS, isSameBarangay } from './LearnerDataView';
import { LITERACY_MAPPING_COUNTS, OVERALL_TOTAL_MAPPED_LITERACY, getBarangayMappedCount } from '../data/literacyMappingCounts';

// Real geographical lookup database for all Tarlac City Barangays
export const BARANGAY_COORDS: { [key: string]: { lat: number; lng: number; district: string } } = {
  "Aguso": { lat: 15.527891342242905, lng: 120.59599567883049, district: "District A" },
  "Alvindia": { lat: 15.549189499983347, lng: 120.60677554825449, district: "District A" },
  "Amucao": { lat: 15.466077724356108, lng: 120.6841639568218, district: "District A" },
  "Armenia": { lat: 15.435357714695868, lng: 120.56271445011772, district: "District A" },
  "Asturias": { lat: 15.447596642505973, lng: 120.66638574151258, district: "District A" },
  "Atioc": { lat: 15.43074689002513, lng: 120.58760417433977, district: "District A" },
  "Balanti": { lat: 15.452241978136717, lng: 120.5459596346209, district: "District A" },
  "Balete": { lat: 15.442280296952898, lng: 120.63003563907512, district: "District A" },
  "Balibago I": { lat: 15.5227850255943, lng: 120.62016679671316, district: "District A" },
  "Balibago II": { lat: 15.52896577209772, lng: 120.63451815209663, district: "District A" },
  "Balingcanaway": { lat: 15.481936888559474, lng: 120.6846487331019, district: "District A" },
  "Banaba": { lat: 15.517887562903772, lng: 120.62660500883479, district: "District A" },
  "Bantog": { lat: 15.45738424951504, lng: 120.66367154336623, district: "District A" },
  "Baras-baras": { lat: 15.519398262648807, lng: 120.5646724428963, district: "District A" },
  "Baras-Baras": { lat: 15.519398262648807, lng: 120.5646724428963, district: "District A" },
  "Batang-batang": { lat: 15.519323024620899, lng: 120.65874474717097, district: "District A" },
  "Batang-Batang": { lat: 15.519323024620899, lng: 120.65874474717097, district: "District A" },
  "Binauganan": { lat: 15.476419632972663, lng: 120.60316133561662, district: "District A" },
  "Bora": { lat: 15.497964500277122, lng: 120.63189708970538, district: "District A" },
  "Buenavista": { lat: 15.427499571826294, lng: 120.61673621948222, district: "District A" },
  "Buhilit": { lat: 15.512829470788967, lng: 120.61372380488811, district: "District A" },
  "Burot": { lat: 15.412007541143293, lng: 120.6008053345836, district: "District A" },
  "Calingcuan": { lat: 15.489877869745577, lng: 120.62218214488732, district: "District A" },
  "Capehan": { lat: 15.432314666830372, lng: 120.6024167847324, district: "District A" },
  "Carangian": { lat: 15.482473303197771, lng: 120.57160051289056, district: "District A" },
  "Care": { lat: 15.484803644967142, lng: 120.52844724112987, district: "District A" },
  "Central": { lat: 15.433073219274203, lng: 120.64831392766312, district: "Physical Count of Inventories" },
  "Culipat": { lat: 15.500833250643703, lng: 120.61549087291547, district: "District A" },
  "Cut-cut I": { lat: 15.486410892677258, lng: 120.58803240423094, district: "Physical Count of Inventories" },
  "Cut Cut 1": { lat: 15.486410892677258, lng: 120.58803240423094, district: "Physical Count of Inventories" },
  "Cut-cut II": { lat: 15.470552392000462, lng: 120.66037624217233, district: "Physical Count of Inventories" },
  "Cut Cut 2": { lat: 15.470552392000462, lng: 120.66037624217233, district: "Physical Count of Inventories" },
  "Dalayap": { lat: 15.532364718980057, lng: 120.60509007356863, district: "District A" },
  "Dela Paz": { lat: 15.42504391835369, lng: 120.57777973239538, district: "District A" },
  "Dolores": { lat: 15.523627628106606, lng: 120.57906272850599, district: "District A" },
  "Laoang": { lat: 15.546735357489794, lng: 120.54472364821095, district: "District A" },
  "Ligtasan": { lat: 15.485776248997682, lng: 120.59174627670517, district: "Physical Count of Inventories" },
  "Lourdes": { lat: 15.440369771483795, lng: 120.6475919222019, district: "Physical Count of Inventories" },
  "Mabini": { lat: 15.489458463381828, lng: 120.58861663002315, district: "Physical Count of Inventories" },
  "Maligaya": { lat: 15.43804517291584, lng: 120.59990508833651, district: "District A" },
  "Maliwalo": { lat: 15.482188400182205, lng: 120.6180225480449, district: "District A" },
  "Mapalacsiao": { lat: 15.428211058276268, lng: 120.65283701284086, district: "District B" },
  "Mapalad": { lat: 15.537544713968545, lng: 120.5588393288659, district: "District A" },
  "Matadero": { lat: 15.48554623166967, lng: 120.59945779146588, district: "District B" },
  "Matatalaib": { lat: 15.493824206398644, lng: 120.60533922412068, district: "District B" },
  "Paraiso": { lat: 15.44358113689926, lng: 120.5991217069643, district: "District A" },
  "Poblacion": { lat: 15.48960246410764, lng: 120.59072188164919, district: "Physical Count of Inventories" },
  "Salapungan": { lat: 15.510223269356029, lng: 120.59786146783202, district: "District B" },
  "San Carlos": { lat: 15.408762884870717, lng: 120.57739175538562, district: "District B" },
  "San Francisco": { lat: 15.42537084772382, lng: 120.59687956145004, district: "District B" },
  "San Isidro": { lat: 15.496400959454947, lng: 120.58770597608782, district: "District B" },
  "San Jose": { lat: 15.489333862627458, lng: 120.65068722262842, district: "District B" },
  "San Jose de Urquico": { lat: 15.459154893389114, lng: 120.5696156903775, district: "District B" },
  "San Jose De Urquico": { lat: 15.459154893389114, lng: 120.5696156903775, district: "District B" },
  "San Juan de Mata": { lat: 15.534990763756404, lng: 120.5288600177989, district: "District B" },
  "San Juan De Mata": { lat: 15.534990763756404, lng: 120.5288600177989, district: "District B" },
  "San Juan Bautista": { lat: 15.486478188580387, lng: 120.59944464455572, district: "District B" },
  "San Juan de bautista": { lat: 15.486478188580387, lng: 120.59944464455572, district: "District B" },
  "San Juan De Bautista": { lat: 15.486478188580387, lng: 120.59944464455572, district: "District B" },
  "San Luis": { lat: 15.470090709129568, lng: 120.57053231504324, district: "District B" },
  "San Manuel": { lat: 15.491244435060477, lng: 120.66782356106732, district: "District B" },
  "San Miguel": { lat: 15.43281049063674, lng: 120.59648396794991, district: "District B" },
  "San Nicolas": { lat: 15.493799120808001, lng: 120.5955233372858, district: "Physical Count of Inventories" },
  "San Pablo": { lat: 15.476018395990021, lng: 120.5748143213271, district: "District B" },
  "San Pascual": { lat: 15.509256944805228, lng: 120.66727555769002, district: "District B" },
  "San Rafael": { lat: 15.459872771991797, lng: 120.59724609929673, district: "District B" },
  "San Roque": { lat: 15.481213636610553, lng: 120.59255230023665, district: "District B" },
  "San Sebastian": { lat: 15.472065799930853, lng: 120.59644809753996, district: "District B" },
  "San Vicente": { lat: 15.474503550696198, lng: 120.58523057399708, district: "Physical Count of Inventories" },
  "Santa Cruz": { lat: 15.543880021873347, lng: 120.5959268981906, district: "District B" },
  "Santa Maria": { lat: 15.550742878820635, lng: 120.57768120254825, district: "District B" },
  "Santo Cristo": { lat: 15.48737797196133, lng: 120.5932482925868, district: "Physical Count of Inventories" },
  "Sto. Cristo": { lat: 15.48737797196133, lng: 120.5932482925868, district: "Physical Count of Inventories" },
  "Santo Domingo": { lat: 15.53917480631835, lng: 120.51477204307751, district: "District B" },
  "Sto. Domingo": { lat: 15.53917480631835, lng: 120.51477204307751, district: "District B" },
  "Santo Niño": { lat: 15.546924589527693, lng: 120.57039029434486, district: "District B" },
  "Sto. Nino": { lat: 15.546924589527693, lng: 120.57039029434486, district: "District B" },
  "Sapang Maragul": { lat: 15.509824327809891, lng: 120.54482621109996, district: "District B" },
  "Sapang Tagalog": { lat: 15.420420935509235, lng: 120.60468472593033, district: "District B" },
  "Sepung Calzada": { lat: 15.505226184964897, lng: 120.60086122542978, district: "District B" },
  "Sinait": { lat: 15.533765211815213, lng: 120.58355714381607, district: "District B" },
  "Suizo": { lat: 15.464111493685227, lng: 120.60729819294865, district: "District B" },
  "Tariji": { lat: 15.521184040687045, lng: 120.60892193789267, district: "District B" },
  "Tibag": { lat: 15.49260824267174, lng: 120.56882234133177, district: "District B" },
  "Tibagan": { lat: 15.470311469855227, lng: 120.54282982401377, district: "District B" },
  "Trinidad": { lat: 15.509781884024095, lng: 120.63033046879617, district: "District B" },
  "Ungot": { lat: 15.460228306023573, lng: 120.6148157324832, district: "District B" },
  "Villa Bacolor": { lat: 15.505149909186283, lng: 120.67985256950287, district: "District B" },
  "Baras Baras BJMP Male Dorm": { lat: 15.521886544142605, lng: 120.56713697101362, district: "District B" },
  "Baras Baras BJMP Female Dorm": { lat: 15.521886544142605, lng: 120.56713697101362, district: "District B" },
  "Tibag High School ALS SHS": { lat: 15.48775436993164, lng: 120.57267865281352, district: "District B" },
  "Maliwalo National High School ALS SHS": { lat: 15.481650482121342, lng: 120.61958562369314, district: "District A" },
  "San Manuel Parola Santuwaryo": { lat: 15.478824586674873, lng: 120.66524603562135, district: "District B" },
  "San Juan De Mata DSWD Lingap Center": { lat: 15.53276059865022, lng: 120.534770040944, district: "District B" }
};

export const REQUESTED_BARANGAYS_DROPDOWN_ORDER: string[] = [
  "Aguso",
  "Alvindia",
  "Amucao",
  "Asturias",
  "Atioc",
  "Balanti",
  "Balibago I",
  "Balibago II",
  "Balingcanaway",
  "Balete",
  "Banaba",
  "Bantog",
  "Armenia",
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
  "Dela Paz",
  "Dalayap",
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
  "Baras Baras BJMP Female Dorm"
];

const BARANGAYS = REQUESTED_BARANGAYS_DROPDOWN_ORDER;

interface MapViewProps {
  selectedDistrict: string;
  learningCenters: LearningCenter[];
  learners: LearnerRecord[];
  onAddCenter: (center: LearningCenter) => void;
  onDeleteCenter?: (id: string) => void;
  onSetLearners?: React.Dispatch<React.SetStateAction<LearnerRecord[]>>;
}

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

// Controller component to smoothly pan/zoom the Leaflet map statefully
function MapController({ center, zoom, trigger }: { center: [number, number]; zoom: number; trigger?: number }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.setView(center, zoom, { animate: true, duration: 0.8 });
  }, [center, zoom, trigger, map]);
  return null;
}

// Map Click Listener to lock custom coordinates for Center Placements
function MapClickHandler({ onMapClick, isDisabled }: { onMapClick: (lat: number, lng: number) => void; isDisabled: boolean }) {
  useMapEvents({
    click(e) {
      if (isDisabled) return;
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export function MapView({ 
  selectedDistrict, 
  learningCenters, 
  learners, 
  onAddCenter, 
  onDeleteCenter,
  onSetLearners
}: MapViewProps) {
  const tarlacCityCenter: [number, number] = [15.485, 120.595];
  
  // Selection/Panning map states
  const [mapCenter, setMapCenter] = useState<[number, number]>(tarlacCityCenter);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [recenterTrigger, setRecenterTrigger] = useState<number>(0);
  const [selectedBarangayName, setSelectedBarangayName] = useState<string>('all');
  const [hoveredBarangayName, setHoveredBarangayName] = useState<string | null>(null);
  const [showCenterBox, setShowCenterBox] = useState<boolean>(false);
  const [boxDockSide, setBoxDockSide] = useState<'right' | 'left'>('right');
  const [isBoxMinimized, setIsBoxMinimized] = useState<boolean>(false);
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleRecenterMap = () => {
    setMapCenter([15.485, 120.595]);
    setMapZoom(12.5);
    setSelectedBarangayName('all');
    setShowCenterBox(false);
    setIsBoxMinimized(false);
    setHoveredBarangayName(null);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setRecenterTrigger(prev => prev + 1);
  };
  
  // StrictMode/React 19 double-mount workaround using isMounted and a wrapper ref
  const [isMounted, setIsMounted] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = '';
      }
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);
  
  // Helper to reliably lookup population data with fallbacks
  const getPopcenItem = (bName: string, popcenList: BarangayBaselineData[]): BarangayBaselineData | undefined => {
    if (!bName) return undefined;
    const clean = (s: string) => s.toLowerCase()
      .replace(/^barangay\s+/i, '')
      .replace(/^brgy\.?\s+/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const target = clean(bName);
    
    const item = popcenList.find(p => clean(p.barangayName) === target) ||
      popcenList.find(p => clean(p.barangayName).includes(target) || target.includes(clean(p.barangayName)));

    const fallbackItem = BARANGAY_BASELINE_FALLBACK.find(p => clean(p.barangayName) === target) ||
      BARANGAY_BASELINE_FALLBACK.find(p => clean(p.barangayName).includes(target) || target.includes(clean(p.barangayName)));

    if (item) {
      return {
        ...fallbackItem,
        ...item,
        about: (item.about && item.about.trim().length > 0) ? item.about : (fallbackItem?.about || ''),
        logo: (item.logo && item.logo.trim().length > 0) ? item.logo : (fallbackItem?.logo || ''),
        barangayChairman: item.barangayChairman || fallbackItem?.barangayChairman || '',
        basePopulation: item.basePopulation > 0 ? item.basePopulation : (fallbackItem?.basePopulation || 0),
        district: item.district || fallbackItem?.district || 'District A',
        classification: item.classification || fallbackItem?.classification || 'Rural',
        barangayNumber: item.barangayNumber || fallbackItem?.barangayNumber || 1
      };
    }

    return fallbackItem;
  };

  // Dynamic controls
  const [geographicFilter, setGeographicFilter] = useState<'All' | 'Urban' | 'Rural'>('All');
  const [pinFocusType, setPinFocusType] = useState<'all' | 'mapped' | 'unmapped'>('all');
  const [mapTileSource, setMapTileSource] = useState<'standard' | 'sat'>('standard');
  const [mapViewMode, setMapViewMode] = useState<'overview' | 'heatmap'>('overview');

  const handleCityOverviewView = () => {
    setMapViewMode('overview');
    setMapCenter(tarlacCityCenter);
    setMapZoom(12.5);
    setSelectedBarangayName('all');
    setShowCenterBox(false);
    setIsBoxMinimized(false);
    setHoveredBarangayName(null);
    setRecenterTrigger(prev => prev + 1);
  };

  const handleBarangaySelect = (bName: string) => {
    if (bName === 'all') {
      setSelectedBarangayName('all');
      setShowCenterBox(false);
      setIsBoxMinimized(false);
      setHoveredBarangayName(null);
      setMapCenter(tarlacCityCenter);
      setMapZoom(12.5);
      setRecenterTrigger(prev => prev + 1);
    } else {
      setSelectedBarangayName(bName);
      setShowCenterBox(true);
      setIsBoxMinimized(false);
      setHoveredBarangayName(null);
      const coords = getCoordinatesForBarangay(bName);
      setMapCenter([coords[0], coords[1]]);
      setMapZoom(15);
      setRecenterTrigger(prev => prev + 1);
    }
  };

  const handleFocusExactMarker = (bName: string) => {
    const coords = getCoordinatesForBarangay(bName);
    setMapCenter(coords);
    setMapZoom(16);
    setRecenterTrigger(prev => prev + 1);
  };

  const handleHeatmapView = () => {
    setMapViewMode('heatmap');
    setMapCenter(tarlacCityCenter);
    setMapZoom(12.5);
  };

  // Auto-fetch spreadsheet states
  const [fetchLoading, setFetchLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [popcenData, setPopcenData] = useState<BarangayBaselineData[]>(BARANGAY_BASELINE_FALLBACK);
  const [liveMappedCounts, setLiveMappedCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchPopulationData = async () => {
      const sId = localStorage.getItem('spreadsheetId') || '1Z-GsOOh5DV5CSilR7AZFZX_s1K1ktvC7sVVgFcJR3o0';
      
      // 1. Fetch aggregated literacy mapping for all 78 barangay sheets
      try {
        const responseAllMapped = await fetch(`/api/sheets/fetch-all-literacy-mapping?spreadsheetId=${encodeURIComponent(sId)}&_=${Date.now()}`);
        if (responseAllMapped.ok) {
          const resAllJson = await responseAllMapped.json();
          if (resAllJson.success && resAllJson.data && resAllJson.data.length > 1) {
            const headers = (resAllJson.data[0] || []).map((h: any) => String(h || '').toLowerCase().trim());
            let nameIdx = headers.findIndex((h: string) => h.includes('sheet name') || h === 'barangay' || h === 'barangay name' || h === 'name');
            if (nameIdx === -1) nameIdx = 1;
            let mappedIdx = headers.indexOf('total mapped');
            if (mappedIdx === -1) mappedIdx = 4;

            const countsMap: Record<string, number> = {};
            resAllJson.data.slice(1).forEach((row: any) => {
              const bName = String(row[nameIdx] || row[1] || row[0] || '').trim();
              const mapped = parseInt(String(row[mappedIdx] || '0').replace(/,/g, '')) || 0;
              if (bName) {
                countsMap[bName] = mapped;
              }
            });
            if (Object.keys(countsMap).length > 0) {
              setLiveMappedCounts(countsMap);
            }
          }
        }
      } catch (err: any) {
        console.warn("Could not fetch aggregated literacy mapping for MapView, using offline preset counts:", err.message);
      }

      // 2. Fetch population worksheet "Tarlac City Population 2024"
      try {
        console.log(`[MapView] Fetching population worksheet "Tarlac City Population 2024" from spreadsheet: ${sId}`);
        let loaded = false;

        // Try primary /api/sheets/tarlac-city-population endpoint
        try {
          const responsePop = await fetch(`/api/sheets/tarlac-city-population?spreadsheetId=${encodeURIComponent(sId)}&_=${Date.now()}`);
          if (responsePop.ok) {
            const resPopJson = await responsePop.json();
            if (resPopJson.success && Array.isArray(resPopJson.records) && resPopJson.records.length > 0) {
              const parsedPopList: BarangayBaselineData[] = resPopJson.records.map((r: any) => ({
                barangayNumber: r.no,
                barangayName: r.barangay,
                barangayChairman: r.barangayChairman || '',
                logo: r.logo || '',
                district: r.district || 'District A',
                classification: r.classification || 'Rural',
                geographicType: (r.classification?.toLowerCase().includes('urban') ? 'Urban' : 'Rural') as 'Urban' | 'Rural',
                basePopulation: r.population || 0,
                population2024: r.population || 0,
                about: r.about || ''
              }));

              if (parsedPopList.length > 0) {
                setPopcenData(parsedPopList);
                loaded = true;
              }
            }
          }
        } catch (e: any) {
          console.info("[MapView] /api/sheets/tarlac-city-population notice:", e.message || e);
        }

        // Secondary fallback to raw sheet fetch if needed
        if (!loaded) {
          const responsePop = await fetch(`/api/sheets/fetch?spreadsheetId=${encodeURIComponent(sId)}&tabName=${encodeURIComponent('Tarlac City Population 2024')}&_=${Date.now()}`);
          if (responsePop.ok) {
            const resPopJson = await responsePop.json();
            if (resPopJson.success && resPopJson.data && resPopJson.data.length > 1) {
              const popHeaders = (resPopJson.data[0] || []).map((h: any) => String(h || '').toLowerCase().trim());
              const hasChairman = popHeaders.some(h => h.includes('chairman') || h.includes('punong') || h.includes('kapitan'));
              const noColIdx = popHeaders.findIndex(h => h.includes('no.'));
              const logoColIdx = popHeaders.findIndex(h => h.includes('logo'));
              const bgColIdx = popHeaders.findIndex(h => h.includes('barangay'));
              const chairmanColIdx = popHeaders.findIndex(h => h.includes('chairman') || h.includes('punong'));
              const districtColIdx = popHeaders.findIndex(h => h.includes('district'));
              const classColIdx = popHeaders.findIndex(h => h.includes('classification'));
              const popColIdx = popHeaders.findIndex(h => h.includes('population'));
              const aboutColIdx = popHeaders.findIndex(h => h.includes('about'));

              const parsedPopList = resPopJson.data.slice(1).map((row: any, rIdx: number) => {
                const bgIdx = bgColIdx !== -1 ? bgColIdx : 2;
                const bgVal = row[bgIdx] ? String(row[bgIdx]).trim() : '';
                if (!bgVal) return null;
                
                const chairmanIdx = chairmanColIdx !== -1 ? chairmanColIdx : (hasChairman || row.length >= 8 ? 3 : -1);
                const distIdx = districtColIdx !== -1 ? districtColIdx : (hasChairman || row.length >= 8 ? 4 : 3);
                const classIdx = classColIdx !== -1 ? classColIdx : (hasChairman || row.length >= 8 ? 5 : 4);
                const popIdx = popColIdx !== -1 ? popColIdx : (hasChairman || row.length >= 8 ? 6 : 5);
                const aboutIdx = aboutColIdx !== -1 ? aboutColIdx : (hasChairman || row.length >= 8 ? 7 : 6);

                const logoVal = row[logoColIdx !== -1 ? logoColIdx : 1] ? String(row[logoColIdx !== -1 ? logoColIdx : 1]).trim() : '';
                const chairmanVal = chairmanIdx !== -1 && row[chairmanIdx] ? String(row[chairmanIdx]).trim() : '';
                const distVal = row[distIdx] ? String(row[distIdx]).trim() : '';
                const classVal = row[classIdx] ? String(row[classIdx]).trim() : 'Rural';
                const popVal = parseInt(String(row[popIdx] || '0').replace(/[^0-9]/g, '')) || 0;
                const aboutVal = row[aboutIdx] ? String(row[aboutIdx]).trim() : '';
                const bgNo = parseInt(String(row[noColIdx !== -1 ? noColIdx : 0] || '0')) || (rIdx + 1);

                return {
                  barangayNumber: bgNo,
                  barangayName: bgVal,
                  barangayChairman: chairmanVal,
                  logo: getGoogleDriveDirectLink(logoVal),
                  classification: classVal,
                  geographicType: (classVal.toLowerCase().includes('urban') ? 'Urban' : 'Rural') as 'Urban' | 'Rural',
                  basePopulation: popVal,
                  population2024: popVal,
                  about: aboutVal,
                  district: distVal || (bgNo <= 37 ? 'District A' : bgNo === 79 ? 'Central' : 'District B')
                };
              }).filter((item: any): item is BarangayBaselineData => item !== null);

              if (parsedPopList.length > 0) {
                setPopcenData(parsedPopList);
              }
            }
          }
        }
      } catch (err: any) {
        console.warn("Could not fetch Tarlac City Population 2024 from Sheet, relying on high-fidelity preset:", err.message);
      }
    };

    fetchPopulationData();
  }, [learners]);

  const fetchBarangayData = async (bName: string) => {
    if (!bName || bName === 'all') return;
    
    // Check if we already have records for this barangay to avoid duplicate fetches
    const hasRecords = learners.some(l => l.barangay && l.barangay.toLowerCase().trim() === bName.toLowerCase().trim());
    if (hasRecords) {
      console.log(`Already have imported records for ${bName}, skipping auto-fetch`);
      return;
    }

    setFetchLoading(true);
    setFetchError(null);

    const sId = localStorage.getItem('spreadsheetId') || '1Z-GsOOh5DV5CSilR7AZFZX_s1K1ktvC7sVVgFcJR3o0';
    const scriptUrl = localStorage.getItem('appsScriptUrl') || 'https://script.google.com/macros/s/AKfycbzA_aZEgCh_4GKxaS7b98l3zBz-rhwEQp0ZWYZgjdBUMQ5wLSX_aH6mKpo92X7oRMKsIA/exec';
    const gid = barangayGids[bName] || '';

    try {
      const queryUrl = `/api/sheets/fetch?spreadsheetId=${encodeURIComponent(sId)}&gid=${encodeURIComponent(gid)}&tab=${encodeURIComponent(bName)}&_=${Date.now()}`;

      console.log(`[MapView Auto-Fetch] Fetching for tab: ${bName}`);
      const response = await fetch(queryUrl);
      if (!response.ok) {
        throw new Error(`HTTP Error: status ${response.status}`);
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.sheetPopulation && data.sheetPopulation > 0) {
        console.log(`[MapView Auto-Fetch] Updating population for barangay "${bName}" to ${data.sheetPopulation} from sheet Z2 cell.`);
        setPopcenData(prev => prev.map(item => {
          if (item.barangayName.toLowerCase().trim() === bName.toLowerCase().trim()) {
            return {
              ...item,
              basePopulation: data.sheetPopulation
            };
          }
          return item;
        }));
      }

      const importedRecords: LearnerRecord[] = data.records || [];
      if (importedRecords.length === 0) {
        setFetchError(`The sheet tab for "${bName}" is empty or has mismatched headers.`);
        return;
      }

      // Classify district based on barangay name mappings
      const updatedRecords = importedRecords.map((record) => {
        let calculatedDistrict = 'District A';
        const centralBgs = ["poblacion", "central", "ligtasan", "mabini", "san nicolas", "san vicente", "cut cut 1", "cut cut 2", "sto. cristo", "lourdes"];
        const districtBBgs = ["san carlos", "san francisco", "san isidro", "san jose", "san jose de urquico", "san juan bautista", "san juan de bautista", "san juan de mata", "san luis", "san miguel", "san manuel", "san pablo", "san pascual", "san rafael", "san sebastian", "santa cruz", "santa maria", "sto. domingo", "sto. nino", "sapang tagalog", "sapang maragul", "sepung calzada", "sinait", "suizo", "tariji", "tibagan", "trinidad", "ungot", "villa bacolor", "bjmp"];
        
        const bNameLower = record.barangay.toLowerCase();
        if (centralBgs.some(cBg => bNameLower.includes(cBg))) {
          calculatedDistrict = 'Physical Count of Inventories';
        } else if (districtBBgs.some(dBg => bNameLower.includes(dBg))) {
          calculatedDistrict = 'District B';
        }
        
        return {
          ...record,
          district: calculatedDistrict
        };
      });

      if (onSetLearners) {
        onSetLearners((prev: LearnerRecord[]) => {
          // Merge avoiding duplicates by standard generated key
          const existingKeys = new Set(prev.map(l => `${l.lastName}-${l.firstName}-${l.barangay}`.toLowerCase().replace(/\s/g, '')));
          const newUniqueRecords = updatedRecords.filter(r => {
            const key = `${r.lastName}-${r.firstName}-${r.barangay}`.toLowerCase().replace(/\s/g, '');
            return !existingKeys.has(key);
          });
          return [...prev, ...newUniqueRecords];
        });
      }
    } catch (err: any) {
      console.error("Auto fetch error:", err);
      setFetchError(err.message || "Failed to fetch");
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBarangayName && selectedBarangayName !== 'all') {
      fetchBarangayData(selectedBarangayName);
    }
  }, [selectedBarangayName]);

  // Form states for adding CLC
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newClcName, setNewClcName] = useState<string>('');
  const [newClcDistrict, setNewClcDistrict] = useState<'District A' | 'District B' | 'Physical Count of Inventories'>('District A');
  const [newClcTeacher, setNewClcTeacher] = useState<string>('');
  const [newClcEnrolled, setNewClcEnrolled] = useState<number>(25);
  const [newClcStatus, setNewClcStatus] = useState<'active' | 'needs-resources' | 'under-construction'>('active');
  const [newClcFacilities, setNewClcFacilities] = useState<string>('');

  // Handle locating coordinates for a barangay
  const getCoordinatesForBarangay = (bName: string): [number, number] => {
    const found = BARANGAY_COORDS[bName];
    if (found) return [found.lat, found.lng];
    
    // Fallback: case-insensitive match or normalized match
    const matchKey = Object.keys(BARANGAY_COORDS).find(k => 
      k.toLowerCase().trim() === bName.toLowerCase().trim() ||
      isSameBarangay(k, bName)
    );
    if (matchKey) return [BARANGAY_COORDS[matchKey].lat, BARANGAY_COORDS[matchKey].lng];
    
    // Universal center fallback
    return tarlacCityCenter;
  };

  // Convert legacy relative map coordinates to Tarlac regional GPS
  const getCenterCoords = (center: LearningCenter): [number, number] => {
    if (center.lat > 14 && center.lat < 16) {
      return [center.lat, center.lng];
    }
    const name = center.name.toLowerCase();
    if (name.includes('san roque')) return [15.4950, 120.5880];
    if (name.includes('tibag')) return [15.4940, 120.5630];
    if (name.includes('maliwalo')) return [15.4880, 120.6230];
    if (name.includes('san vicente')) return [15.4730, 120.5910];
    if (name.includes('tibigan')) return [15.4790, 120.5610];
    if (name.includes('matatalaib')) return [15.5030, 120.6120];
    if (name.includes('central als') || name.includes('central district')) return [15.4820, 120.5980];
    if (name.includes('ligtasan')) return [15.4862, 120.5912];

    // Percentage conversion fallback
    const calculatedLng = 120.51 + (center.lng / 100) * 0.17;
    const calculatedLat = 15.56 - (center.lat / 100) * 0.16;
    return [calculatedLat, calculatedLng];
  };

  // Compute learners count per barangay for active pins
  const barangayStats = useMemo(() => {
    const stats: { [key: string]: { total: number; males: number; females: number; programCounts: { [p: string]: number } } } = {};
    
    // Initialize standard list
    BARANGAYS.forEach(b => {
      stats[b] = { total: 0, males: 0, females: 0, programCounts: {} };
    });

    // Populate from active Google-synced learners list
    learners.forEach(l => {
      if (!l.barangay) return;
      const parsedBarangay = Object.keys(BARANGAY_COORDS).find(
        b => b.toLowerCase().replace(/\s/g, '') === l.barangay.toLowerCase().replace(/\s/g, '')
      ) || l.barangay;

      if (!stats[parsedBarangay]) {
        stats[parsedBarangay] = { total: 0, males: 0, females: 0, programCounts: {} };
      }
      stats[parsedBarangay].total += 1;
      
      const genderClean = (l.gender || 'male').toLowerCase().trim();
      if (genderClean.startsWith('m')) {
        stats[parsedBarangay].males += 1;
      } else {
        stats[parsedBarangay].females += 1;
      }

      const pName = l.preferredProgram || l.program || 'A&E Secondary';
      stats[parsedBarangay].programCounts[pName] = (stats[parsedBarangay].programCounts[pName] || 0) + 1;
    });

    return stats;
  }, [learners]);

  // Handle map click to drop absolute CLC station
  const handleMapPlacedCoord = (lat: number, lng: number) => {
    const targetName = newClcName.trim() || 'Custom Learning Hub';
    
    const newClc: LearningCenter = {
      id: `clc-custom-${Date.now()}`,
      name: targetName,
      district: newClcDistrict,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      teacher: newClcTeacher.trim() || 'Assigned Mobile Teacher',
      enrolled: Number(newClcEnrolled) || 15,
      status: newClcStatus,
      facilities: newClcFacilities ? newClcFacilities.split(',').map(s => s.trim()) : ['Modular Handouts'],
      established: new Date().toISOString().split('T')[0]
    };

    onAddCenter(newClc);
    setSelectedCenterId(newClc.id);
    setIsAdding(false);
    
    // Clear fields
    setNewClcName('');
    setNewClcTeacher('');
    setNewClcFacilities('');
  };

  // Find currently selected community learning center object
  const activeCenterObj = useMemo(() => {
    return learningCenters.find(c => c.id === selectedCenterId) || null;
  }, [learningCenters, selectedCenterId]);

  // Total metrics of mapped learners counted in the division
  const activeDivisionCount = useMemo(() => {
    return learners.length;
  }, [learners]);

  // Filter learners based on selected district and selected barangay to get baseline metrics
  const selectedLearners = useMemo(() => {
    return learners.filter(l => {
      if (!l.barangay) return false;
      const bNormalized = l.barangay.trim().toLowerCase().replace(/\s/g, '');
      
      // Find matching barangay in BARANGAY_COORDS keys
      const matchedBarangayKey = Object.keys(BARANGAY_COORDS).find(
        key => key.toLowerCase().replace(/\s/g, '') === bNormalized
      );
      
      const bInfo = matchedBarangayKey ? BARANGAY_COORDS[matchedBarangayKey] : null;

      // Filter by district
      const matchesDistrict = selectedDistrict === 'Tarlac City' 
        ? true 
        : bInfo?.district === selectedDistrict;
      if (!matchesDistrict) return false;

      // Filter by selected barangay dropdown
      if (selectedBarangayName !== 'all') {
        const matchesBarangay = matchedBarangayKey 
          ? matchedBarangayKey === selectedBarangayName 
          : l.barangay.toLowerCase().trim() === selectedBarangayName.toLowerCase().trim();
        if (!matchesBarangay) return false;
      }

      return true;
    });
  }, [learners, selectedDistrict, selectedBarangayName]);

  const baselineStats = useMemo(() => {
    const total = selectedLearners.length;
    const males = selectedLearners.filter(l => (l.gender || '').toLowerCase().trim().startsWith('m')).length;
    const females = selectedLearners.filter(l => (l.gender || '').toLowerCase().trim().startsWith('f')).length;

    const ages = selectedLearners.map(l => Number(l.age)).filter(a => !isNaN(a) && a > 0);
    const averageAge = ages.length > 0 ? (ages.reduce((sum, a) => sum + a, 0) / ages.length).toFixed(1) : 'N/A';

    // Top 2 Mother Tongue
    const motherTongueCounts: { [key: string]: number } = {};
    selectedLearners.forEach(l => {
      const val = l.motherTongue?.trim();
      if (val && val !== '-' && val.toLowerCase() !== 'n/a') {
        motherTongueCounts[val] = (motherTongueCounts[val] || 0) + 1;
      }
    });
    const topMotherTongues = Object.entries(motherTongueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(entry => `${entry[0]} (${entry[1]})`);

    // Top 2 Religion
    const religionCounts: { [key: string]: number } = {};
    selectedLearners.forEach(l => {
      const val = l.religion?.trim();
      if (val && val !== '-' && val.toLowerCase() !== 'n/a') {
        religionCounts[val] = (religionCounts[val] || 0) + 1;
      }
    });
    const topReligions = Object.entries(religionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(entry => `${entry[0]} (${entry[1]})`);

    // Top 3 Last Grade Level Completed
    const gradeCounts: { [key: string]: number } = {};
    selectedLearners.forEach(l => {
      const val = l.lastGradeLevelCompleted?.trim();
      if (val && val !== '-' && val.toLowerCase() !== 'n/a') {
        gradeCounts[val] = (gradeCounts[val] || 0) + 1;
      }
    });
    const topGrades = Object.entries(gradeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => `${entry[0]} (${entry[1]})`);

    // Top 3 Reasons for not Attending Formal school
    const reasonCounts: { [key: string]: number } = {};
    selectedLearners.forEach(l => {
      const val = l.reasonsForNotAttending?.trim();
      if (val && val !== '-' && val.toLowerCase() !== 'n/a') {
        reasonCounts[val] = (reasonCounts[val] || 0) + 1;
      }
    });
    const topReasons = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => `${entry[0]} (${entry[1]})`);

    return {
      total,
      males,
      females,
      averageAge,
      topMotherTongues: topMotherTongues.length > 0 ? topMotherTongues.join(', ') : 'N/A',
      topReligions: topReligions.length > 0 ? topReligions.join(', ') : 'N/A',
      topGrades: topGrades.length > 0 ? topGrades.join(', ') : 'N/A',
      topReasons: topReasons.length > 0 ? topReasons.join(', ') : 'N/A'
    };
  }, [selectedLearners]);

  // Dynamic Logo URL fetched from Google Sheet or fallback to City Logo
  const activeLogoUrl = useMemo(() => {
    if (selectedBarangayName !== 'all') {
      const item = popcenData.find(b => b.barangayName.toLowerCase().trim() === selectedBarangayName.toLowerCase().trim());
      if (item?.logo && item.logo.trim().length > 0) {
        return getGoogleDriveDirectLink(item.logo);
      }
    }
    return getGoogleDriveDirectLink("https://drive.google.com/file/d/1auohBcQOz7fZTkbeu-4topUS4i18QiHW/view?usp=drive_link");
  }, [selectedBarangayName, popcenData]);

  // Canonical list of all 78 requested Tarlac City Barangays for the dropdown
  const allBarangaysForDropdown = REQUESTED_BARANGAYS_DROPDOWN_ORDER;

  // Single source of truth for total mapped count of each barangay
  const getEffectiveMappedCount = (bName: string): number => {
    if (!bName) return 0;
    // 1. Live count from sheets API if loaded
    const liveVal = liveMappedCounts[bName];
    if (typeof liveVal === 'number' && liveVal > 0) return liveVal;

    // 2. Count from in-memory learners if any loaded for this barangay
    const loadedCount = learners.filter(l => l.barangay && isSameBarangay(l.barangay, bName)).length;
    if (loadedCount > 0) return loadedCount;

    // 3. Official preset mapped count from literacy mapping baseline
    const presetVal = getBarangayMappedCount(bName);
    if (presetVal > 0) return presetVal;

    return 0;
  };

  // Filter list of displayed barangays based on selection dropdown/scope
  const filteredBarangays = useMemo(() => {
    // If a specific barangay is selected from dropdown, ONLY display that single selected barangay on the map!
    if (selectedBarangayName !== 'all') {
      const match = REQUESTED_BARANGAYS_DROPDOWN_ORDER.find(bName => 
        bName.toLowerCase().trim() === selectedBarangayName.toLowerCase().trim() ||
        isSameBarangay(bName, selectedBarangayName)
      );
      return match ? [match] : [selectedBarangayName];
    }

    const list = BARANGAYS.filter(bName => {
      // 1. Check District Scope Filter
      const bInfo = BARANGAY_COORDS[bName];
      const matchesDistrict = (selectedDistrict === 'District A' || selectedDistrict === 'District B')
        ? bInfo?.district === selectedDistrict
        : true;
      if (!matchesDistrict) return false;

      // 2. Check Mapped vs Unmapped selection toggle
      const mappedCount = getEffectiveMappedCount(bName);
      if (pinFocusType === 'mapped' && mappedCount === 0) return false;
      if (pinFocusType === 'unmapped' && mappedCount > 0) return false;

      // 3. Check Urban/Rural Geographic System Filter (Recommendation 2)
      const baseInfo = popcenData.find(f => f.barangayName.toLowerCase() === bName.toLowerCase());
      const gType = baseInfo ? baseInfo.geographicType : 'Urban';
      if (geographicFilter !== 'All' && gType !== geographicFilter) return false;

      return true;
    });

    // Deduplicate any alias keys
    const seen = new Set<string>();
    return list.filter(bName => {
      const norm = bName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (seen.has(norm)) return false;
      seen.add(norm);
      return true;
    });
  }, [selectedDistrict, selectedBarangayName, pinFocusType, geographicFilter, popcenData, liveMappedCounts, learners]);

  // Handle pan directly to a designated site/target
  const handleSelectBarangayNode = (bName: string) => {
    setSelectedBarangayName(bName);
    setShowCenterBox(true);
    setIsBoxMinimized(false);
    setHoveredBarangayName(null);
    const coords = getCoordinatesForBarangay(bName);
    setMapCenter([coords[0], coords[1]]);
    setMapZoom(15);
    setRecenterTrigger(prev => prev + 1);
  };

  // Style helper for custom HTML markers displaying Barangay Logo with Total Mapped count number below Logo
  const getBarangayMarkerIcon = (bName: string, count: number) => {
    const isSelected = selectedBarangayName === bName;
    const size = isSelected ? 52 : 38;
    
    // Lookup population and logo from baseline
    const baseInfo = popcenData.find(f => f.barangayName.toLowerCase().trim() === bName.toLowerCase().trim());
    
    // Determine logo url
    let logoUrl = '';
    if (baseInfo?.logo && baseInfo.logo.trim().length > 0) {
      logoUrl = getGoogleDriveDirectLink(baseInfo.logo);
    } else {
      logoUrl = getGoogleDriveDirectLink("https://drive.google.com/file/d/1auohBcQOz7fZTkbeu-4topUS4i18QiHW/view?usp=drive_link");
    }

    const borderClass = isSelected ? 'border-4 border-[#002B6D] ring-4 ring-sky-400/60' : 'border-2 border-[#002B6D]';
    const shadowClass = isSelected ? 'shadow-xl shadow-blue-900/40 z-[999]' : 'shadow-slate-900/30 hover:scale-110';

    return L.divIcon({
      className: 'custom-leaflet-pin',
      html: `
        <div class="relative flex flex-col items-center justify-center -translate-y-2">
          <!-- Logo Circle -->
          <div class="relative flex items-center justify-center rounded-full bg-white ${borderClass} ${shadowClass} transition-all duration-300" style="width: ${size}px; height: ${size}px;">
            <img 
              src="${logoUrl}" 
              alt="Logo of Barangay ${bName}" 
              class="w-full h-full object-cover rounded-full"
              onerror="this.onerror=null; this.src='https://lh3.googleusercontent.com/d/1auohBcQOz7fZTkbeu-4topUS4i18QiHW';"
            />
            ${isSelected ? '<span class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm animate-ping"></span><span class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></span>' : ''}
          </div>

          <!-- Total Mapped count number badge directly below each Logo -->
          <div class="mt-1 bg-rose-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full border-2 border-white shadow-md leading-tight text-center tracking-tight min-w-[24px]">
            ${count}
          </div>

          <!-- Selected Barangay Name Label -->
          ${isSelected ? `
            <div class="mt-0.5 bg-[#002B6D] text-white text-[9.5px] font-extrabold px-2.5 py-0.5 rounded-full shadow-lg whitespace-nowrap border border-white/60 pointer-events-none tracking-wide">
              Barangay ${bName}
            </div>
          ` : ''}
        </div>
      `,
      iconSize: [size + 40, size + 50],
      iconAnchor: [(size + 40) / 2, size / 2],
      popupAnchor: [0, -(size / 2) - 8]
    });
  };

  // Style helper for CLC Station marker
  const getClcMarkerIcon = (center: LearningCenter) => {
    const isSelected = selectedCenterId === center.id;
    const size = isSelected ? 38 : 32;
    
    let colorClass = 'bg-[#0ea5e9] border-[#0284c7]'; // Default active Sky
    if (center.status === 'needs-resources') {
      colorClass = 'bg-[#f59e0b] border-[#d97706]';
    } else if (center.status === 'under-construction') {
      colorClass = 'bg-[#ec4899] border-[#db2777]';
    }

    const ringPulse = isSelected ? 'animate-ping opacity-75' : 'animate-pulse opacity-45';
    const activeRing = isSelected ? 'ring-4 ring-sky-500/40 scale-110 border-3' : '';

    return L.divIcon({
      className: 'custom-leaflet-clc',
      html: `
        <div class="relative w-full h-full flex items-center justify-center">
          <span class="absolute inline-flex h-full w-full rounded-full ${colorClass} ${ringPulse}"></span>
          <div class="relative flex items-center justify-center rounded-full ${colorClass} ${activeRing} text-white text-[12px] font-bold w-full h-full border-2 shadow-lg z-10 transition-transform duration-200 hover:scale-110">
            🏠
          </div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -(size / 2) - 6]
    });
  };

  return (
    <div className="w-full font-['Roboto',sans-serif] text-[10pt] font-normal">
      
      {/* 1. MAP AND VIEWPORT CONTROL */}
      <div className="w-full flex flex-col gap-4">
        
        {/* Banner with controls and filters */}
        <div className="bg-white border border-slate-150 p-4.5 rounded-2xl flex flex-col gap-3 shadow-xs">
          <div className="flex items-center gap-4 sm:gap-5 bg-[#002B6D] p-4 sm:p-5 rounded-xl shadow-xs">
            <img 
              src="https://lh3.googleusercontent.com/d/1uRzRgW_7CIad7rdz5gzRAoQzCCWAOlsQ" 
              alt="TCSD ALS Logo" 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-contain shrink-0 bg-white/10 p-1 border border-white/20 shadow-sm"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/d/1uRzRgW_7CIad7rdz5gzRAoQzCCWAOlsQ";
              }}
            />
            <h3 className="font-['Raleway',sans-serif] font-bold text-white text-[18pt] sm:text-[20pt] leading-snug">
              Tarlac City Schools Division ALS Interactive Mapping System
            </h3>
          </div>
          
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              {/* Separate Tile source buttons: Street View & Satellite View on the left side of Heatmap View */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                <button
                  type="button"
                  onClick={() => setMapTileSource('standard')}
                  className={`px-3 py-1.5 rounded-md text-[8pt] font-normal transition flex items-center gap-1.5 cursor-pointer ${
                    mapTileSource === 'standard'
                      ? 'bg-[#002B6D] text-white font-medium shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Street View
                </button>
                <button
                  type="button"
                  onClick={() => setMapTileSource('sat')}
                  className={`px-3 py-1.5 rounded-md text-[8pt] font-normal transition flex items-center gap-1.5 cursor-pointer ${
                    mapTileSource === 'sat'
                      ? 'bg-[#002B6D] text-white font-medium shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Satellite View
                </button>
              </div>

              {/* Heatmap View (Street View & Satellite View are to its left) */}
              <button
                type="button"
                onClick={handleHeatmapView}
                className={`px-3 py-1.5 rounded-lg text-[8pt] font-normal transition flex items-center gap-1.5 border cursor-pointer ${
                  mapViewMode === 'heatmap'
                    ? 'bg-rose-600 border-rose-700 text-white font-medium shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                Heatmap View
              </button>

              {/* City Overview View */}
              <button
                type="button"
                onClick={handleCityOverviewView}
                className={`px-3 py-1.5 rounded-lg text-[8pt] font-normal transition flex items-center gap-1.5 border cursor-pointer ${
                  mapViewMode === 'overview' && selectedBarangayName === 'all'
                    ? 'bg-[#002B6D] border-[#001D4A] text-white font-medium shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                City Overview View
              </button>

              {/* Barangay Dropdown List (Placed at the right side of City Overview View) */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[8pt] shadow-2xs">
                <label htmlFor="map-barangay-select" className="font-bold text-slate-700 whitespace-nowrap flex items-center gap-1 cursor-pointer">
                  <MapPin className="w-3.5 h-3.5 text-[#002B6D]" />
                  Barangay:
                </label>
                <select
                  id="map-barangay-select"
                  value={selectedBarangayName}
                  onChange={(e) => handleBarangaySelect(e.target.value)}
                  className="bg-white border border-slate-300 rounded-md px-2 py-1 text-[8pt] font-bold text-[#002B6D] focus:outline-none focus:ring-1 focus:ring-[#002B6D] cursor-pointer shadow-3xs max-w-[190px] truncate"
                >
                  <option value="all">All Barangays (Overview)</option>
                  {allBarangaysForDropdown.map((bName) => (
                    <option key={bName} value={bName}>
                      {bName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recenter Map button */}
            <button
              type="button"
              onClick={handleRecenterMap}
              className="px-3.5 py-1.5 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition font-normal text-[8pt] bg-slate-50 shadow-2xs cursor-pointer flex items-center gap-1.5"
              title="Recenter Map"
            >
              Recenter Map
            </button>
          </div>
        </div>

        {/* Map and Box Description Split Viewport (Side-by-side on desktop, stacked on mobile) */}
        <div className="flex flex-col lg:flex-row gap-4 items-start w-full">
          {/* Map Container Viewport */}
          <div className="relative border border-slate-150 rounded-2xl bg-[#E2F1FF] overflow-hidden flex flex-col grow shadow-sm w-full min-w-0" style={{ minHeight: 'calc(460px + 12cm)' }}>
          
          {/* Form instructions banner overlay */}
          {isAdding && (
            <div className="absolute top-4 left-4 right-4 z-[1000] bg-indigo-900 border border-indigo-700 text-white text-xs px-4 py-3 rounded-xl shadow-xl font-bold animate-pulse flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <span>CLC placement actively loaded: <b>Click directly on the map</b> to drop your pins!</span>
              </div>
              <button 
                onClick={() => setIsAdding(false)}
                className="bg-white/10 hover:bg-white/20 text-white rounded-md px-2 py-1 text-[10px]"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Real Leaflet Map Render */}
          <div ref={mapContainerRef} className="w-full relative grow" style={{ height: 'calc(450px + 20cm)', minHeight: 'calc(450px + 20cm)' }}>
            {isMounted && (
              <MapContainer 
                center={mapCenter} 
                zoom={mapZoom} 
                className="w-full h-full"
                style={{ height: 'calc(450px + 20cm)', minHeight: 'calc(450px + 20cm)' }}
                zoomControl={false} // Disable default, use visual UI below or default scroll
              >
              {/* Sync map panning dynamically using controller */}
              <MapController center={mapCenter} zoom={mapZoom} trigger={recenterTrigger} />
              
              {/* Event handler for CLC placements */}
              <MapClickHandler onMapClick={handleMapPlacedCoord} isDisabled={!isAdding} />

              {/* Toggle tile provider sources */}
              {mapTileSource === 'standard' ? (
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              ) : (
                <TileLayer
                  attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              )}

              {/* HEATMAP DENSITY LAYER */}
              {mapViewMode === 'heatmap' && filteredBarangays.map((bName) => {
                const coords = getCoordinatesForBarangay(bName);
                const stats = barangayStats[bName] || { total: 0, males: 0, females: 0, programCounts: {} };
                const count = stats.total;
                
                const heatColor = count >= 25 ? '#e11d48' : count >= 10 ? '#f59e0b' : count > 0 ? '#10b981' : '#3b82f6';
                const radiusMeters = Math.max(500, Math.min(2800, count * 100 + 600));

                return (
                  <React.Fragment key={`heat-${bName}`}>
                    <Circle
                      center={coords}
                      radius={radiusMeters * 1.5}
                      pathOptions={{
                        color: heatColor,
                        fillColor: heatColor,
                        fillOpacity: 0.18,
                        weight: 0,
                      }}
                    />
                    <Circle
                      center={coords}
                      radius={radiusMeters}
                      pathOptions={{
                        color: heatColor,
                        fillColor: heatColor,
                        fillOpacity: 0.5,
                        weight: 1.5,
                      }}
                    />
                  </React.Fragment>
                );
              })}

               {/* BARANGAY BASELINE MARKERS FROM GOOGLE SHEET RECORDS */}
              {filteredBarangays.map((bName) => {
                const coords = getCoordinatesForBarangay(bName);
                const stats = barangayStats[bName] || { total: 0, males: 0, females: 0, programCounts: {} };
                const bInfo = BARANGAY_COORDS[bName];
                const popcenItem = getPopcenItem(bName, popcenData);
                const basePopulation = popcenItem ? popcenItem.basePopulation : 0;

                const mappedCount = getEffectiveMappedCount(bName);

                return (
                  <Marker 
                    key={`b-${bName}`}
                    position={coords}
                    icon={getBarangayMarkerIcon(bName, mappedCount)}
                    eventHandlers={{
                      mouseover: (e) => {
                        if (hoverTimeoutRef.current) {
                          clearTimeout(hoverTimeoutRef.current);
                        }
                        const targetMarker = e.target;
                        hoverTimeoutRef.current = setTimeout(() => {
                          targetMarker.openPopup();
                        }, 300);
                      },
                      mouseout: () => {
                        if (hoverTimeoutRef.current) {
                          clearTimeout(hoverTimeoutRef.current);
                          hoverTimeoutRef.current = null;
                        }
                      },
                      click: () => {
                        if (hoverTimeoutRef.current) {
                          clearTimeout(hoverTimeoutRef.current);
                          hoverTimeoutRef.current = null;
                        }
                        handleSelectBarangayNode(bName);
                      }
                    }}
                  >
                    <Popup maxWidth={1050} minWidth={780} autoPan={true} className="custom-expanded-popup">
                      <div 
                        className="p-4 space-y-3.5 text-slate-800 font-sans animate-fade-in"
                        style={{ 
                          width: 'calc(340px + 12cm)', 
                          minWidth: 'calc(330px + 12cm)',
                          minHeight: 'calc(290px + 2cm)' 
                        }}
                      >
                        {/* Header: Logo + Barangay Name + (Below: Badges [#15, Rural, North B] & Chairman) */}
                        <div className="flex items-start gap-4 pb-3 border-b border-slate-200">
                          {(() => {
                            const logoUrl = popcenItem?.logo && popcenItem.logo.trim().length > 0 
                              ? getGoogleDriveDirectLink(popcenItem.logo)
                              : getGoogleDriveDirectLink("https://drive.google.com/file/d/1auohBcQOz7fZTkbeu-4topUS4i18QiHW/view?usp=drive_link");
                            return (
                              <img 
                                src={logoUrl} 
                                alt={`Logo of Barangay ${bName}`} 
                                className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm shrink-0 bg-white"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = getGoogleDriveDirectLink("https://drive.google.com/file/d/1auohBcQOz7fZTkbeu-4topUS4i18QiHW/view?usp=drive_link");
                                }}
                              />
                            );
                          })()}

                          <div className="grow min-w-0 space-y-1.5">
                            <h4 className="font-extrabold text-[#002B6D] text-lg sm:text-xl tracking-tight leading-snug break-words">
                              Barangay {bName}
                            </h4>

                            {/* Badges placed below the Name of Barangay (#15 Rural North B) */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-extrabold bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
                                #{popcenItem?.barangayNumber || 15}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                                {popcenItem?.classification || popcenItem?.geographicType || 'Rural'}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-extrabold bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                                {popcenItem?.district || 'North B'}
                              </span>
                            </div>

                            {popcenItem?.barangayChairman && (
                              <p className="text-[11px] text-slate-600 font-medium truncate pt-0.5" title={`Barangay Chairman: ${popcenItem.barangayChairman}`}>
                                <span className="font-bold text-slate-700">Chairman:</span> {popcenItem.barangayChairman}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Demographics & Literacy Metrics Grid */}
                        <div className="grid grid-cols-2 gap-2.5">
                          {/* Population Census Data 2024 */}
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-600 font-bold text-[10.5px]">
                              <Users className="w-3.5 h-3.5 text-[#002B6D] shrink-0" />
                              <span>Census 2024:</span>
                            </div>
                            <div className="font-mono font-extrabold text-[#002B6D] text-sm sm:text-base">
                              {basePopulation > 0 ? basePopulation.toLocaleString() : 'N/A'}
                            </div>
                          </div>

                          {/* Total Mapped ALS Learners */}
                          <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[10.5px]">
                              <Layers className="w-3.5 h-3.5 text-[#002B6D] shrink-0" />
                              <span>Total Mapped:</span>
                            </div>
                            <div className="font-mono font-extrabold text-[#002B6D] text-sm sm:text-base">
                              {mappedCount.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* ABOUT BARANGAY Section (Expanded height with +2cm) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#002B6D] flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-[#002B6D]" />
                              ABOUT BARANGAY
                            </span>
                            <span className="text-[9.5px] font-mono text-slate-400 font-semibold">
                              Tarlac City Population 2024
                            </span>
                          </div>
                          <div 
                            className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/90 overflow-y-auto"
                            style={{ 
                              maxHeight: 'calc(144px + 2cm)',
                              minHeight: 'calc(80px + 1cm)'
                            }}
                          >
                            <p className="text-[11.5px] text-slate-700 leading-relaxed font-normal text-justify">
                              {popcenItem?.about && popcenItem.about.trim().length > 0 
                                ? popcenItem.about 
                                : `Barangay ${bName} is an official barangay node within Tarlac City Schools Division baseline literacy mapping coverage.`}
                            </p>
                          </div>
                        </div>

                        {mapViewMode === 'heatmap' && (
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Solutions & Interventions:
                            </span>
                            <p className="text-[10.5px] text-slate-700 leading-relaxed bg-emerald-50/60 p-2 rounded-xl border border-emerald-200/80 max-h-20 overflow-y-auto font-normal">
                              Deploy mobile ALS teacher teams to Barangay {bName}, expand satellite CLC instructional centers, and dispatch supplementary SLM kits for ABL literacy intervention.
                            </p>
                          </div>
                        )}

                        {/* Focus / Action Button */}
                        <div className="pt-2 border-t border-slate-100 flex justify-between items-center gap-2 text-[10px]">
                          <span className="text-slate-400 font-mono font-semibold">
                            {stats.total > 0 ? `${stats.total} dossiers mapped` : '0 mapped'}
                          </span>
                          <button 
                            onClick={() => handleSelectBarangayNode(bName)}
                            className="bg-[#002B6D] hover:bg-indigo-900 text-white font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <Info className="w-3.5 h-3.5" /> Focus Node Properties
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              </MapContainer>
            )}
          </div>

          {/* City Overview View HUD Container Overlay - Automatically hidden once barangay content is displayed */}
          {mapViewMode === 'overview' && selectedBarangayName === 'all' && !hoveredBarangayName && (
            <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-md border border-slate-200/90 p-3 rounded-2xl shadow-lg max-w-xs flex items-center gap-3 font-['Roboto',sans-serif]">
              <div className="relative shrink-0">
                {activeLogoUrl ? (
                  <img 
                    src={activeLogoUrl} 
                    alt="City Overview Logo" 
                    className="w-14 h-14 rounded-xl object-cover border-2 border-indigo-100 shadow-2xs"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      const fb = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                      if (fb) fb.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#002B6D] to-indigo-900 text-white font-black text-xs flex items-center justify-center border-2 border-indigo-200 shadow-2xs"
                  style={{ display: activeLogoUrl ? 'none' : 'flex' }}
                >
                  TCSD
                </div>
              </div>

              <div className="space-y-0.5 min-w-0">
                <span className="text-[8.5px] font-mono font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 inline-block">
                  City Overview Node
                </span>
                <h4 className="font-extrabold text-[#002B6D] text-[11pt] leading-tight truncate">
                  {selectedBarangayName === 'all' ? 'Tarlac City' : `Barangay ${selectedBarangayName}`}
                </h4>
                <p className="text-[9.5pt] text-slate-600 font-normal">
                  {selectedBarangayName === 'all' 
                    ? `Population: ${popcenData.reduce((acc, b) => acc + (b.basePopulation || 0), 0).toLocaleString()}` 
                    : `Population: ${(getPopcenItem(selectedBarangayName, popcenData)?.basePopulation || 0).toLocaleString()}`}
                </p>
                <p className="text-[9.5pt] text-[#002B6D] font-bold">
                  {selectedBarangayName === 'all'
                    ? `Total Mapped: ${OVERALL_TOTAL_MAPPED_LITERACY.toLocaleString()}`
                    : `Total Mapped: ${getEffectiveMappedCount(selectedBarangayName).toLocaleString()}`}
                </p>
              </div>
            </div>
          )}

          {/* Floating Pill Trigger to Re-open Box Description when closed */}
          {selectedBarangayName !== 'all' && !showCenterBox && (
            <button
              type="button"
              onClick={() => setShowCenterBox(true)}
              className="absolute bottom-14 left-1/2 -translate-x-1/2 z-[1000] bg-[#002B6D] hover:bg-[#001D4A] text-white px-4 py-2 rounded-xl text-xs font-extrabold shadow-xl flex items-center gap-2 border border-white/20 transition cursor-pointer"
            >
              <Info className="w-4 h-4 text-sky-300" />
              Show Barangay {selectedBarangayName} Box Information
            </button>
          )}

          {/* Heatmap Legend Overlay */}
          {mapViewMode === 'heatmap' && (
            <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-xs border border-slate-200 p-3 rounded-xl shadow-md text-xs space-y-1.5 font-bold text-slate-700">
              <div className="flex items-center gap-1.5 font-black text-rose-600 border-b border-slate-100 pb-1">
                <Flame className="w-4 h-4" /> ALS Literacy Density Heatmap
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="w-3 h-3 rounded-full bg-[#e11d48] inline-block shadow-xs"></span>
                <span>High Density (25+ Learners)</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="w-3 h-3 rounded-full bg-[#f59e0b] inline-block shadow-xs"></span>
                <span>Medium Density (10-24 Learners)</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="w-3 h-3 rounded-full bg-[#10b981] inline-block shadow-xs"></span>
                <span>Low Density (1-9 Learners)</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="w-3 h-3 rounded-full bg-[#3b82f6] inline-block shadow-xs"></span>
                <span>Baseline Station (0 Mapped)</span>
              </div>
            </div>
          )}

          {/* Quick HUD Legends panel */}
          <div className="absolute bottom-4 left-4 right-4 z-[999] bg-white/95 backdrop-blur-xs border border-slate-200/50 rounded-xl px-4 py-2.5 shadow-md flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
              <Info className="w-3.5 h-3.5 text-sky-500" />
              <span>Plotted <b>{filteredBarangays.length} Barangay nodes</b></span>
            </div>
            
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 font-mono">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> 0 records</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 1-10 mapped</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> 11-25 mapped</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span> 25+ mapped</span>
            </div>
          </div>
        </div>

        {/* Dedicated Box Description Panel for Selected Barangay — Rendered alongside map so it NEVER covers the Barangay Logo */}
        {selectedBarangayName !== 'all' && showCenterBox && (() => {
          const activeBoxBarangay = selectedBarangayName;
          const boxPopcenItem = getPopcenItem(activeBoxBarangay, popcenData);
          const boxCoords = getCoordinatesForBarangay(activeBoxBarangay);
          const boxDistrict = BARANGAY_COORDS[activeBoxBarangay]?.district || 'Tarlac City';
          const logoUrl = boxPopcenItem?.logo && boxPopcenItem.logo.trim().length > 0 
            ? getGoogleDriveDirectLink(boxPopcenItem.logo)
            : getGoogleDriveDirectLink("https://drive.google.com/file/d/1auohBcQOz7fZTkbeu-4topUS4i18QiHW/view?usp=drive_link");
          const mappedCount = getEffectiveMappedCount(activeBoxBarangay);

          return (
            <div className="w-full lg:w-[410px] xl:w-[430px] shrink-0 bg-white border-2 border-[#002B6D] p-4 sm:p-5 rounded-2xl shadow-xl font-['Roboto',sans-serif] animate-fade-in flex flex-col gap-3.5 max-h-[calc(450px+20cm)] overflow-y-auto pointer-events-auto">
              <div className="space-y-3.5">
                {/* Header: Official Logo + Barangay Title + Badges + Controls */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-200 gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img 
                        src={logoUrl} 
                        alt={`Official Logo of Barangay ${activeBoxBarangay}`} 
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-indigo-200 shadow-sm shrink-0 bg-white"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getGoogleDriveDirectLink("https://drive.google.com/file/d/1auohBcQOz7fZTkbeu-4topUS4i18QiHW/view?usp=drive_link");
                        }}
                      />
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs"></span>
                    </div>
                    
                    <div className="space-y-1.5 min-w-0">
                      <h3 className="font-extrabold text-[#002B6D] text-[14pt] sm:text-[16pt] leading-tight truncate" title={`Barangay ${activeBoxBarangay}`}>
                        Barangay {activeBoxBarangay}
                      </h3>

                      {/* Badges placed below the Name of Barangay */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                          #{boxPopcenItem?.barangayNumber || 15}
                        </span>
                        <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 shrink-0">
                          {boxPopcenItem?.classification || boxPopcenItem?.geographicType || 'Rural'}
                        </span>
                        <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 shrink-0">
                          {boxPopcenItem?.district || boxDistrict}
                        </span>
                      </div>

                      {boxPopcenItem?.barangayChairman && (
                        <p className="text-[11px] text-slate-600 font-medium truncate pt-0.5" title={`Barangay Chairman: ${boxPopcenItem.barangayChairman}`}>
                          <span className="font-bold text-slate-700">Chairman:</span> {boxPopcenItem.barangayChairman}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-500 font-mono">
                        {boxCoords[0].toFixed(5)}° N, {boxCoords[1].toFixed(5)}° E
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Close Button */}
                    <button 
                      type="button"
                      onClick={() => {
                        setShowCenterBox(false);
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                      title="Close Box Description"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 text-slate-800">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-600 font-bold text-[10.5px]">
                      <Users className="w-3.5 h-3.5 text-[#002B6D] shrink-0" />
                      <span>Census 2024:</span>
                    </div>
                    <div className="font-mono font-extrabold text-[#002B6D] text-sm">
                      {(boxPopcenItem?.basePopulation || 0) > 0 ? (boxPopcenItem?.basePopulation || 0).toLocaleString() : 'N/A'}
                    </div>
                  </div>

                  <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[10.5px]">
                      <Layers className="w-3.5 h-3.5 text-[#002B6D] shrink-0" />
                      <span>Total Mapped:</span>
                    </div>
                    <div className="font-mono font-extrabold text-[#002B6D] text-base">
                      {mappedCount.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* ABOUT BARANGAY Section */}
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] uppercase tracking-wider font-extrabold text-[#002B6D] flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#002B6D]" />
                        ABOUT BARANGAY
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 font-semibold">
                        Tarlac City Population 2024
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/90 max-h-36 overflow-y-auto">
                      <p className="text-[11.5px] text-slate-700 leading-relaxed font-normal text-justify">
                        {boxPopcenItem?.about && boxPopcenItem.about.trim().length > 0 
                          ? boxPopcenItem.about 
                          : `Barangay ${activeBoxBarangay} is an active barangay node under Tarlac City Schools Division ALS baseline literacy mapping with targeted instructional outreach.`}
                      </p>
                    </div>
                  </div>

                  {mapViewMode === 'heatmap' ? (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-700 flex items-center gap-1">
                        <Activity className="w-3 h-3 text-indigo-600" />
                        Heatmap Density Analysis:
                      </span>
                      <p className="text-[11px] text-slate-700 leading-relaxed bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-200/80 max-h-24 overflow-y-auto font-normal">
                        Heatmap Analysis for Barangay {activeBoxBarangay}: Indicates a cluster of {mappedCount > 0 ? `${mappedCount} mapped ALS learners` : 'potential out-of-school youth learners'}. Spatial distribution indicates critical need for functional literacy assessment and localized CLC delivery.
                      </p>
                    </div>
                  ) : null}

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Recommendations & Interventions:
                    </span>
                    <p className="text-[11px] text-slate-700 leading-relaxed bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/80 max-h-24 overflow-y-auto font-normal">
                      {mapViewMode === 'heatmap'
                        ? `1. Dispatch mobile ALS teachers to Barangay ${activeBoxBarangay}. 2. Expand satellite CLC instructional centers. 3. Distribute supplementary learning kits and digital tablets.`
                        : `Establish regular ALS mobile educator visits, expand community mapping of potential learners, and optimize community learning center facilities in Barangay ${activeBoxBarangay}.`}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button 
                    type="button"
                    onClick={handleCityOverviewView}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-[10px] transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Compass className="w-3 h-3" />
                    All Barangays (Overview)
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleFocusExactMarker(activeBoxBarangay)}
                    className="bg-[#002B6D] hover:bg-[#001D4A] text-white font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer text-[10px] shadow-xs"
                    title="Center directly on the Logo Marker"
                  >
                    <MapPin className="w-3 h-3" /> Focus Logo Marker
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
      </div>
    </div>
  );
}
