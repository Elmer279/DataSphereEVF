/**
 * Utility for managing Class Program schedules linked to Google Sheets.
 * Each teacher has a dedicated sheet name and GID in the Google Spreadsheet.
 */

import {
  OFFICIAL_CLC_DETAILS_LIST,
  CLC_DETAILS_GID,
  CLC_DETAILS_SHEET_NAME,
  CLC_DETAILS_VERSION,
  SERVICE_ACCOUNT_EMAIL,
  getOfficialCLCsByTeacher,
  getOfficialTeacherForCLC,
  getOfficialDistrictForCLC,
  getOfficialDistrictForTeacher,
  getAllOfficialDistricts,
  normalizeClcName,
  SIGNATORY_SHEET_NAMES,
  hasOfficialSignatories,
  isFiveSignatorySheet,
  getDefaultSignatoriesForTeacher,
  ClassProgramSignatory,
  ClassProgramSignaturesData,
  CLCDetailItem
} from '../data/clcDetailsData';

export {
  OFFICIAL_CLC_DETAILS_LIST,
  CLC_DETAILS_GID,
  CLC_DETAILS_SHEET_NAME,
  CLC_DETAILS_VERSION,
  SERVICE_ACCOUNT_EMAIL,
  getOfficialCLCsByTeacher,
  getOfficialTeacherForCLC,
  getOfficialDistrictForCLC,
  getOfficialDistrictForTeacher,
  getAllOfficialDistricts,
  normalizeClcName,
  SIGNATORY_SHEET_NAMES,
  hasOfficialSignatories,
  isFiveSignatorySheet,
  getDefaultSignatoriesForTeacher
};
export type { CLCDetailItem, ClassProgramSignatory, ClassProgramSignaturesData };

export const CLASS_PROGRAM_SPREADSHEET_ID = '1YfXfPT7NvehXaRvN8a9GDbyvG3IxHxUAUgcVLObRxkc';

export const CLC_DETAILS_SHEET_INFO = {
  name: CLC_DETAILS_SHEET_NAME,
  gid: CLC_DETAILS_GID,
  directLink: (spreadsheetId: string = CLASS_PROGRAM_SPREADSHEET_ID) => `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${CLC_DETAILS_GID}`
};

export interface SheetRegistryEntry {
  name: string;
  gid: string;
  isClcDetails?: boolean;
  isMetadata?: boolean;
}

export const OFFICIAL_CLASS_PROGRAM_SHEET_REGISTRY: SheetRegistryEntry[] = [
  { name: 'CLC DETAILS (CHECK THIS & UPDATE)', gid: '279279947', isClcDetails: true },
  { name: 'Sheet List & GIDs', gid: '1668923940', isMetadata: true },
  { name: 'MELODY ANNE B. AQUINO', gid: '1375844621' },
  { name: 'MERVIN C. CALDOZA', gid: '93349761' },
  { name: 'ANGELICA G. CANLAS', gid: '1044633394' },
  { name: 'RANIELLE PAOLO D. CAPIENDO', gid: '1950124932' },
  { name: 'RUSSEL M. DIONISIO', gid: '697736841' },
  { name: 'REYNALDO M. DOMINGO JR.', gid: '192199462' },
  { name: 'JENNY I. DUENAS', gid: '1728886317' },
  { name: 'CELESTE R. ESPINOSA', gid: '773441027' },
  { name: 'ANTONIO B. GUBAN', gid: '552317122' },
  { name: 'ARNOLD T. LUMBA', gid: '1437301840' },
  { name: 'JENNILYN D. MARTINEZ', gid: '15867508' },
  { name: 'JUMAR M. MENDOZA', gid: '1564638800' },
  { name: 'RICARDO S. MORALES', gid: '1321334981' },
  { name: 'JULIUS C. PANGILINAN', gid: '521614161' },
  { name: 'MARIELLA A. PORNILLOSA', gid: '1599409372' },
  { name: 'HEIZEL P. PANGILINAN', gid: '953364763' },
  { name: 'RAMIL H. VALENTINO', gid: '1371387122' }
];

export interface ClassProgramTeacher {
  name: string;
  gid: string;
  clcName: string;
  programLevel: string;
}

export interface ClassProgramRow {
  id: string;
  time: string;
  minutes: number | string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  isHeaderRow?: boolean;
  isSpecialRow?: boolean;
  bgType?: 'header' | 'flag' | 'subject' | 'lunch' | 'ancillary';
  notes?: string;
}

export interface ClassProgramSyncDiagnostics {
  teacher: string;
  gid: string;
  spreadsheetId: string;
  appsScriptUrl?: string;
  serviceAccount?: string;
  source: 'google_sheets_live' | 'local_storage_cache' | 'deped_default_template';
  isFromSheet: boolean;
  rowCount: number;
  durationMs: number;
  timestamp: string;
  endpointUrl?: string;
  error?: string;
}

export interface ClassProgramSyncResult {
  success: boolean;
  data: ClassProgramRow[];
  isFromSheet: boolean;
  signatures?: ClassProgramSignaturesData;
  source: 'google_sheets_live' | 'local_storage_cache' | 'deped_default_template';
  diagnostics: ClassProgramSyncDiagnostics;
}

export const CLASS_PROGRAM_TEACHERS: ClassProgramTeacher[] = [
  { name: 'MELODY ANNE B. AQUINO', gid: '1375844621', clcName: 'Sapang Tagalog Community Learning Center', programLevel: 'Basic Literacy Program, A&E Elementary & A&E Junior High School' },
  { name: 'MERVIN C. CALDOZA', gid: '93349761', clcName: 'Carangian Community Learning Center', programLevel: 'Basic Literacy Program, A&E Elementary & A&E Junior High School' },
  { name: 'ANGELICA G. CANLAS', gid: '1044633394', clcName: 'Matatalaib Community Learning Center', programLevel: 'Basic Literacy Program, A&E Elementary & A&E Junior High School' },
  { name: 'RANIELLE PAOLO D. CAPIENDO', gid: '1950124932', clcName: 'San Roque TWCES Community Learning Center', programLevel: 'Basic Literacy Program, A&E Elementary & A&E Junior High School' },
  { name: 'RUSSEL M. DIONISIO', gid: '697736841', clcName: 'Buhilit Community Learning Center', programLevel: 'Basic Literacy Program, A&E Elementary & A&E Junior High School' },
  { name: 'REYNALDO M. DOMINGO JR.', gid: '192199462', clcName: 'Maligaya Community Learning Center', programLevel: 'Basic Literacy Program, A&E Elementary & A&E Junior High School' },
  { name: 'JENNY I. DUENAS', gid: '1728886317', clcName: 'Balingcanaway Community Learning Center', programLevel: 'Basic Literacy Program, A&E Elementary & A&E Junior High School' },
  { name: 'CELESTE R. ESPINOSA', gid: '773441027', clcName: 'Ligtasan Community Learning Center', programLevel: 'Basic Literacy Program, A&E Elementary & A&E Junior High School' },
  { name: 'ANTONIO B. GUBAN', gid: '552317122', clcName: 'Salapungan Community Learning Center', programLevel: 'Basic Literacy Program, A&E Elementary & A&E Junior High School' },
  { name: 'ARNOLD T. LUMBA', gid: '1437301840', clcName: 'San Miguel Community Learning Center', programLevel: 'Basic Literacy Program, A&E Elementary & A&E Junior High School' },
  { name: 'JENNILYN D. MARTINEZ', gid: '15867508', clcName: 'Atioc Community Learning Center', programLevel: 'Basic Literacy Program, A&E Elementary & A&E Junior High School' },
  { name: 'JUMAR M. MENDOZA', gid: '1564638800', clcName: 'Carlos P. Romulo Community Learning Center', programLevel: 'Basic Literacy Program, A&E Elementary & A&E Junior High School' },
  { name: 'RICARDO S. MORALES', gid: '1321334981', clcName: 'San Isidro Community Learning Center', programLevel: 'Basic Literacy Program, A&E Elementary & A&E Junior High School' },
  { name: 'JULIUS C. PANGILINAN', gid: '521614161', clcName: 'Care Community Learning Center', programLevel: 'Basic Literacy Program, A&E Elementary & A&E Junior High School' },
  { name: 'MARIELLA A. PORNILLOSA', gid: '1599409372', clcName: 'Baras Baras Community Learning Center', programLevel: 'Basic Literacy Program, A&E Elementary & A&E Junior High School' },
  { name: 'HEIZEL P. PANGILINAN', gid: '953364763', clcName: 'San Manuel Community Learning Center', programLevel: 'Basic Literacy Program, A&E Elementary & A&E Junior High School' },
  { name: 'RAMIL H. VALENTINO', gid: '1371387122', clcName: 'Lourdes Community Learning Center', programLevel: 'Basic Literacy Program, A&E Elementary & A&E Junior High School' }
];

export function findClassProgramTeacher(teacherName: string): ClassProgramTeacher | undefined {
  if (!teacherName) return undefined;
  const normalized = teacherName.trim().toUpperCase().replace(/Ň|Ñ/g, 'N');
  return CLASS_PROGRAM_TEACHERS.find(t => {
    const tNorm = t.name.trim().toUpperCase().replace(/Ň|Ñ/g, 'N');
    return tNorm === normalized || t.name.trim().toUpperCase() === teacherName.trim().toUpperCase();
  });
}

export function getDefaultClassProgramForTeacher(teacherName: string): ClassProgramRow[] {
  const teacher = findClassProgramTeacher(teacherName) || CLASS_PROGRAM_TEACHERS[0];
  const programLevel = teacher?.programLevel || 'A&E Junior High School';

  // Specific CLC allocations per teacher derived from CLC Details and official schedule bindings
  let morningCLCs = {
    monday: teacher.clcName,
    tuesday: teacher.clcName,
    wednesday: teacher.clcName,
    thursday: teacher.clcName,
    friday: teacher.clcName
  };
  let afternoonCLCs = { ...morningCLCs };

  if (teacherName.includes('AQUINO') || teacherName === 'MELODY ANNE B. AQUINO') {
    morningCLCs = {
      monday: 'San Sebastian Community Based Learning Center',
      tuesday: 'Sapang Tagalog Community Based Learning Center',
      wednesday: 'Sapang Tagalog Community Based Learning Center',
      thursday: 'San Francisco Community Based Learning Center',
      friday: 'Burot Community Based Learning Center'
    };
    afternoonCLCs = { ...morningCLCs };
  } else if (teacherName.includes('CALDOZA') || teacherName === 'MERVIN C. CALDOZA') {
    morningCLCs = {
      monday: 'Carangian Community Learning Center',
      tuesday: 'San Vicente Community Learning Center',
      wednesday: 'Tibagan Community Learning Center',
      thursday: 'San Pablo Community Learning Center',
      friday: 'San Vicente Community Learning Center'
    };
    afternoonCLCs = { ...morningCLCs };
  } else if (teacherName.includes('CANLAS') || teacherName === 'ANGELICA G. CANLAS') {
    morningCLCs = {
      monday: 'Matatalaib Community Learning Center',
      tuesday: 'Baras Baras FD Community Learning Center',
      wednesday: 'Matatalaib Community Learning Center',
      thursday: 'Matatalaib Community Learning Center',
      friday: 'Balibago II Community Learning Center'
    };
    afternoonCLCs = { ...morningCLCs };
  } else if (teacherName.includes('CAPIENDO') || teacherName === 'RANIELLE PAOLO D. CAPIENDO') {
    morningCLCs = {
      monday: 'San Roque TWCES Community Learning Center',
      tuesday: 'San Roque TWCES Community Learning Center',
      wednesday: 'Cut Cut I Community Learning Center',
      thursday: 'Cut Cut I Community Learning Center',
      friday: 'Sto. Cristo SNED Community Learning Center'
    };
    afternoonCLCs = {
      monday: 'San Roque TWCES Community Learning Center',
      tuesday: 'San Roque TWCES Community Learning Center',
      wednesday: 'Cut Cut I Community Learning Center',
      thursday: 'Cut Cut I Community Learning Center',
      friday: 'San Roque ECC Community Learning Center'
    };
  } else if (teacherName.includes('DIONISIO') || teacherName === 'RUSSEL M. DIONISIO') {
    morningCLCs = {
      monday: 'Buhilit Community Learning Center',
      tuesday: 'Santa Cruz Community Learning Center',
      wednesday: 'Dalayap Community Learning Center',
      thursday: 'Santa Cruz Community Learning Center',
      friday: 'Buhilit Community Learning Center'
    };
    afternoonCLCs = { ...morningCLCs };
  } else if (teacherName.includes('DOMINGO') || teacherName === 'REYNALDO M. DOMINGO JR.') {
    morningCLCs = {
      monday: 'Maligaya Community Learning Center',
      tuesday: 'Suizo Community Learning Center',
      wednesday: 'Ungot Community Learning Center',
      thursday: 'Tariji Community Learning Center',
      friday: 'Maligaya Community Learning Center'
    };
    afternoonCLCs = { ...morningCLCs };
  } else if (teacherName.includes('DUENAS') || teacherName.includes('DUEŇAS') || teacherName.includes('DUEÑAS') || teacherName === 'JENNY I. DUENAS' || teacherName === 'JENNY I. DUEŇAS') {
    morningCLCs = {
      monday: 'Balingcanaway Community Learning Center',
      tuesday: 'San Nicolas Community Learning Center',
      wednesday: 'Maliwalo Community Learning Center',
      thursday: 'San Nicolas Community Learning Center',
      friday: 'Maliwalo Community Learning Center'
    };
    afternoonCLCs = { ...morningCLCs };
  } else if (teacherName.includes('ESPINOSA') || teacherName === 'CELESTE R. ESPINOSA') {
    morningCLCs = {
      monday: 'Ligtasan Community Learning Center',
      tuesday: 'Calingcuan Community Learning Center',
      wednesday: 'San Jose Community Learning Center',
      thursday: 'Bora Community Learning Center',
      friday: 'Calingcuan Community Learning Center'
    };
    afternoonCLCs = { ...morningCLCs };
  } else if (teacherName.includes('GUBAN') || teacherName === 'ANTONIO B. GUBAN') {
    morningCLCs = {
      monday: 'Salapungan Community Learning Center',
      tuesday: 'San Rafael Community Learning Center',
      wednesday: 'San Rafael Community Learning Center',
      thursday: 'Binauganan Community Learning Center',
      friday: 'Sepung Calzada Community Learning Center'
    };
    afternoonCLCs = { ...morningCLCs };
  } else if (teacherName.includes('LUMBA') || teacherName === 'ARNOLD T. LUMBA') {
    morningCLCs = {
      monday: 'San Miguel Community Learning Center',
      tuesday: 'Balete Community Learning Center',
      wednesday: 'Mapalacsiao Community Learning Center',
      thursday: 'Armenia Sitio Dam Community Learning Center',
      friday: 'San Miguel Community Learning Center'
    };
    afternoonCLCs = { ...morningCLCs };
  } else if (teacherName.includes('MARTINEZ') || teacherName === 'JENNILYN D. MARTINEZ') {
    morningCLCs = {
      monday: 'Atioc Community Learning Center',
      tuesday: 'Dela Paz Community Learning Center',
      wednesday: 'Buenavista Community Learning Center',
      thursday: 'Capehan Community Learning Center',
      friday: 'Capehan Community Learning Center'
    };
    afternoonCLCs = { ...morningCLCs };
  } else if (teacherName.includes('MENDOZA') || teacherName === 'JUMAR M. MENDOZA') {
    morningCLCs = {
      monday: 'Carlos P. Romulo Community Learning Center',
      tuesday: 'San Rafael Living Stream Community Learning Center',
      wednesday: 'Sto. Cristo DBTI Community Learning Center',
      thursday: 'San Rafael Fiesta Community Learning Center',
      friday: 'San Rafael Fiesta Community Learning Center'
    };
    afternoonCLCs = { ...morningCLCs };
  } else if (teacherName.includes('MORALES') || teacherName === 'RICARDO S. MORALES') {
    morningCLCs = {
      monday: 'San Isidro Community Learning Center',
      tuesday: 'San Jose De Urquico Community Learning Center',
      wednesday: 'Tibag Community Learning Center',
      thursday: 'San Juan De Mata DSWD Lingap Center Community Learning Center',
      friday: 'San Isidro Community Learning Center'
    };
    afternoonCLCs = {
      monday: 'San Isidro Community Learning Center',
      tuesday: 'San Jose De Urquico Community Learning Center',
      wednesday: 'Tibag Community Learning Center',
      thursday: 'San Juan De Mata Community Learning Center',
      friday: 'San Isidro Community Learning Center'
    };
  } else if (teacherName.includes('JULIUS') || teacherName === 'JULIUS C. PANGILINAN') {
    morningCLCs = {
      monday: 'Care Community Learning Center',
      tuesday: 'Sapang Maragul Community Learning Center',
      wednesday: 'San Juan Bautista Community Learning Center',
      thursday: 'San Luis Community Learning Center',
      friday: 'San Luis Community Learning Center'
    };
    afternoonCLCs = { ...morningCLCs };
  } else if (teacherName.includes('PORNILLOSA') || teacherName === 'MARIELLA A. PORNILLOSA') {
    morningCLCs = {
      monday: 'Baras Baras Community Learning Center',
      tuesday: 'Balanti Community Learning Center',
      wednesday: 'Armenia Community Learning Center',
      thursday: 'Armenia Sitio Apalang Community Learning Center',
      friday: 'Armenia Sitio Apalang Community Learning Center'
    };
    afternoonCLCs = { ...morningCLCs };
  } else if (teacherName.includes('HEIZEL') || teacherName === 'HEIZEL P. PANGILINAN') {
    morningCLCs = {
      monday: 'San Manuel Community Learning Center',
      tuesday: 'San Manuel Parola Santuwaryo Community Learning Center',
      wednesday: 'Villa Bacolor Community Learning Center',
      thursday: 'Amucao Community Learning Center',
      friday: 'San Pascual Community Learning Center'
    };
    afternoonCLCs = { ...morningCLCs };
  } else if (teacherName.includes('VALENTINO') || teacherName === 'RAMIL H. VALENTINO') {
    morningCLCs = {
      monday: 'Lourdes Community Learning Center',
      tuesday: 'Cut Cut II Community Learning Center',
      wednesday: 'Baras Baras MD Community Learning Center',
      thursday: 'Cut Cut II Community Learning Center',
      friday: 'Baras Baras MD Community Learning Center'
    };
    afternoonCLCs = { ...morningCLCs };
  } else if (teacherName.includes('BAQUING') || teacherName === 'JOEL D. BAQUING') {
    morningCLCs = {
      monday: 'ALS SHS Maliwalo National High School',
      tuesday: 'ALS SHS Tibag High School',
      wednesday: 'ALS SHS Maliwalo National High School',
      thursday: 'ALS SHS Tibag High School',
      friday: 'ALS SHS Maliwalo National High School'
    };
    afternoonCLCs = { ...morningCLCs };
  } else if (teacherName.includes('ABAD') || teacherName === 'JOHN L. ABAD') {
    morningCLCs = {
      monday: 'ALS SHS Tibag High School',
      tuesday: 'ALS SHS Maliwalo National High School',
      wednesday: 'ALS SHS Tibag High School',
      thursday: 'ALS SHS Maliwalo National High School',
      friday: 'ALS SHS Tibag High School'
    };
    afternoonCLCs = { ...morningCLCs };
  } else if (teacherName.includes('FRANCISCO') || teacherName === 'MA. MONIQUE A. FRANCISCO') {
    morningCLCs = {
      monday: 'ALS SHS Maliwalo National High School',
      tuesday: 'ALS SHS Tibag High School',
      wednesday: 'ALS SHS Maliwalo National High School',
      thursday: 'ALS SHS Tibag High School',
      friday: 'ALS SHS Maliwalo National High School'
    };
    afternoonCLCs = { ...morningCLCs };
  } else if (teacherName.includes('GAMIS') || teacherName === 'JANICE J. GAMIS') {
    morningCLCs = {
      monday: 'ALS SHS Tibag High School',
      tuesday: 'ALS SHS Maliwalo National High School',
      wednesday: 'ALS SHS Tibag High School',
      thursday: 'ALS SHS Maliwalo National High School',
      friday: 'ALS SHS Tibag High School'
    };
    afternoonCLCs = { ...morningCLCs };
  } else if (teacherName.includes('VALETE') || teacherName === 'CINDY M. VALETE') {
    morningCLCs = {
      monday: 'ALS SHS Maliwalo National High School',
      tuesday: 'ALS SHS Tibag High School',
      wednesday: 'ALS SHS Maliwalo National High School',
      thursday: 'ALS SHS Tibag High School',
      friday: 'ALS SHS Maliwalo National High School'
    };
    afternoonCLCs = { ...morningCLCs };
  }

  // 1. BLP (Basic Literacy Program)
  if (programLevel === 'BLP') {
    return [
      {
        id: 'cp-row-1-flag',
        time: '7:00 - 8:00',
        minutes: '',
        monday: 'Every Monday: Attendance at the Ceremonial Hoisting of the National Flag during Morning Assembly',
        tuesday: '',
        wednesday: '',
        thursday: '',
        friday: '',
        isSpecialRow: true,
        bgType: 'flag'
      },
      {
        id: 'cp-row-clc-morning',
        time: '',
        minutes: '',
        monday: morningCLCs.monday,
        tuesday: morningCLCs.tuesday,
        wednesday: morningCLCs.wednesday,
        thursday: morningCLCs.thursday,
        friday: morningCLCs.friday,
        isHeaderRow: true,
        bgType: 'header'
      },
      {
        id: 'cp-row-2-blp1',
        time: '8:00 – 10:00',
        minutes: 120,
        monday: 'Basic Literacy: Reading & Writing Skills (Filipino & English)',
        tuesday: 'Basic Literacy: Reading & Writing Skills (Filipino & English)',
        wednesday: 'Basic Literacy: Reading & Writing Skills (Filipino & English)',
        thursday: 'Basic Literacy: Reading & Writing Skills (Filipino & English)',
        friday: 'Basic Literacy: Reading & Writing Skills (Filipino & English)',
        bgType: 'subject'
      },
      {
        id: 'cp-row-3-blp2',
        time: '10:00 – 11:00',
        minutes: 60,
        monday: 'Basic Numeracy: Arithmetic & Computational Skills',
        tuesday: 'Basic Numeracy: Arithmetic & Computational Skills',
        wednesday: 'Basic Numeracy: Arithmetic & Computational Skills',
        thursday: 'Basic Numeracy: Arithmetic & Computational Skills',
        friday: 'Basic Numeracy: Arithmetic & Computational Skills',
        bgType: 'subject'
      },
      {
        id: 'cp-row-4-blp3',
        time: '11:00 – 12:00',
        minutes: 60,
        monday: 'Psycho-social & Daily Living Skills / Health & Hygiene',
        tuesday: 'Psycho-social & Daily Living Skills / Health & Hygiene',
        wednesday: 'Psycho-social & Daily Living Skills / Health & Hygiene',
        thursday: 'Psycho-social & Daily Living Skills / Health & Hygiene',
        friday: 'Psycho-social & Daily Living Skills / Health & Hygiene',
        bgType: 'subject'
      },
      {
        id: 'cp-row-5-lunch',
        time: '12:00 - 1:00',
        minutes: '',
        monday: 'Daily: Lunch Break / Midday Meal Period',
        tuesday: '',
        wednesday: '',
        thursday: '',
        friday: '',
        isSpecialRow: true,
        bgType: 'lunch'
      },
      {
        id: 'cp-row-clc-afternoon',
        time: '',
        minutes: '',
        monday: afternoonCLCs.monday,
        tuesday: afternoonCLCs.tuesday,
        wednesday: afternoonCLCs.wednesday,
        thursday: afternoonCLCs.thursday,
        friday: afternoonCLCs.friday,
        isHeaderRow: true,
        bgType: 'header'
      },
      {
        id: 'cp-row-6-blp4',
        time: '1:00 – 2:00',
        minutes: 60,
        monday: 'Community Integration & Civic Values (Pag-unawa sa Sarili at Pamayanan)',
        tuesday: 'Community Integration & Civic Values (Pag-unawa sa Sarili at Pamayanan)',
        wednesday: 'Community Integration & Civic Values (Pag-unawa sa Sarili at Pamayanan)',
        thursday: 'Community Integration & Civic Values (Pag-unawa sa Sarili at Pamayanan)',
        friday: 'Community Integration & Civic Values (Pag-unawa sa Sarili at Pamayanan)',
        bgType: 'subject'
      },
      {
        id: 'cp-row-7-blp5',
        time: '2:00 – 3:00',
        minutes: 60,
        monday: 'Practical Technology & Everyday Livelihood Preparation',
        tuesday: 'Practical Technology & Everyday Livelihood Preparation',
        wednesday: 'Practical Technology & Everyday Livelihood Preparation',
        thursday: 'Practical Technology & Everyday Livelihood Preparation',
        friday: 'Practical Technology & Everyday Livelihood Preparation',
        bgType: 'subject'
      },
      {
        id: 'cp-row-8-ancillary',
        time: '3:00 - 5:00',
        minutes: 120,
        monday: 'Ancillary Task: Rotation Basis\nCommunity Mapping & Advocacy\nCommunity Learning Center Management\nDiagnostic Assessment & Individualized Planning\nPortfolio Assessment',
        tuesday: 'Ancillary Task: Rotation Basis\nCommunity Mapping & Advocacy\nCommunity Learning Center Management\nDiagnostic Assessment & Individualized Planning\nPortfolio Assessment',
        wednesday: 'Ancillary Task: Rotation Basis\nCommunity Mapping & Advocacy\nCommunity Learning Center Management\nDiagnostic Assessment & Individualized Planning\nPortfolio Assessment',
        thursday: 'Ancillary Task: Rotation Basis\nCommunity Mapping & Advocacy\nCommunity Learning Center Management\nDiagnostic Assessment & Individualized Planning\nPortfolio Assessment',
        friday: 'Ancillary Task: Rotation Basis\nCommunity Mapping & Advocacy\nCommunity Learning Center Management\nDiagnostic Assessment & Individualized Planning\nPortfolio Assessment',
        isSpecialRow: true,
        bgType: 'ancillary'
      }
    ];
  }

  // 2. A&E Elementary
  if (programLevel === 'A&E Elementary') {
    return [
      {
        id: 'cp-row-1-flag',
        time: '7:00 - 8:00',
        minutes: '',
        monday: 'Every Monday: Attendance at the Ceremonial Hoisting of the National Flag during Morning Assembly',
        tuesday: '',
        wednesday: '',
        thursday: '',
        friday: '',
        isSpecialRow: true,
        bgType: 'flag'
      },
      {
        id: 'cp-row-clc-morning',
        time: '',
        minutes: '',
        monday: morningCLCs.monday,
        tuesday: morningCLCs.tuesday,
        wednesday: morningCLCs.wednesday,
        thursday: morningCLCs.thursday,
        friday: morningCLCs.friday,
        isHeaderRow: true,
        bgType: 'header'
      },
      {
        id: 'cp-row-2-ls1',
        time: '8:00 – 9:00',
        minutes: 60,
        monday: 'LS1: Communication Skills in English & Filipino (Elementary)',
        tuesday: 'LS1: Communication Skills in English & Filipino (Elementary)',
        wednesday: 'LS1: Communication Skills in English & Filipino (Elementary)',
        thursday: 'LS1: Communication Skills in English & Filipino (Elementary)',
        friday: 'LS1: Communication Skills in English & Filipino (Elementary)',
        bgType: 'subject'
      },
      {
        id: 'cp-row-3-ls2',
        time: '9:00 – 10:00',
        minutes: 60,
        monday: 'LS2: Scientific & Critical Thinking Skills (Elementary)',
        tuesday: 'LS2: Scientific & Critical Thinking Skills (Elementary)',
        wednesday: 'LS2: Scientific & Critical Thinking Skills (Elementary)',
        thursday: 'LS2: Scientific & Critical Thinking Skills (Elementary)',
        friday: 'LS2: Scientific & Critical Thinking Skills (Elementary)',
        bgType: 'subject'
      },
      {
        id: 'cp-row-4-ls3',
        time: '10:00 – 11:00',
        minutes: 60,
        monday: 'LS3: Mathematical and Problem-Solving Skills (Elementary)',
        tuesday: 'LS3: Mathematical and Problem-Solving Skills (Elementary)',
        wednesday: 'LS3: Mathematical and Problem-Solving Skills (Elementary)',
        thursday: 'LS3: Mathematical and Problem-Solving Skills (Elementary)',
        friday: 'LS3: Mathematical and Problem-Solving Skills (Elementary)',
        bgType: 'subject'
      },
      {
        id: 'cp-row-5-ls4',
        time: '11:00 – 12:00',
        minutes: 60,
        monday: 'LS4: Life and Career Skills (Elementary)',
        tuesday: 'LS4: Life and Career Skills (Elementary)',
        wednesday: 'LS4: Life and Career Skills (Elementary)',
        thursday: 'LS4: Life and Career Skills (Elementary)',
        friday: 'LS4: Life and Career Skills (Elementary)',
        bgType: 'subject'
      },
      {
        id: 'cp-row-6-lunch',
        time: '12:00 - 1:00',
        minutes: '',
        monday: 'Daily: Lunch Break / Midday Meal Period',
        tuesday: '',
        wednesday: '',
        thursday: '',
        friday: '',
        isSpecialRow: true,
        bgType: 'lunch'
      },
      {
        id: 'cp-row-clc-afternoon',
        time: '',
        minutes: '',
        monday: afternoonCLCs.monday,
        tuesday: afternoonCLCs.tuesday,
        wednesday: afternoonCLCs.wednesday,
        thursday: afternoonCLCs.thursday,
        friday: afternoonCLCs.friday,
        isHeaderRow: true,
        bgType: 'header'
      },
      {
        id: 'cp-row-7-ls5',
        time: '1:00 – 2:00',
        minutes: 60,
        monday: 'LS 5: Understanding the Self and Society (Makabayan at Lipunan)',
        tuesday: 'LS 5: Understanding the Self and Society (Makabayan at Lipunan)',
        wednesday: 'LS 5: Understanding the Self and Society (Makabayan at Lipunan)',
        thursday: 'LS 5: Understanding the Self and Society (Makabayan at Lipunan)',
        friday: 'LS 5: Understanding the Self and Society (Makabayan at Lipunan)',
        bgType: 'subject'
      },
      {
        id: 'cp-row-8-ls6',
        time: '2:00 – 3:00',
        minutes: 60,
        monday: 'LS6: Digital Citizenship (Basic ICT Skills)',
        tuesday: 'LS6: Digital Citizenship (Basic ICT Skills)',
        wednesday: 'LS6: Digital Citizenship (Basic ICT Skills)',
        thursday: 'LS6: Digital Citizenship (Basic ICT Skills)',
        friday: 'LS6: Digital Citizenship (Basic ICT Skills)',
        bgType: 'subject'
      },
      {
        id: 'cp-row-9-ancillary',
        time: '3:00 - 5:00',
        minutes: 120,
        monday: 'Ancillary Task: Rotation Basis\nCommunity Mapping & Advocacy\nCommunity Learning Center Management\nDiagnostic Assessment & Individualized Planning\nPortfolio Assessment',
        tuesday: 'Ancillary Task: Rotation Basis\nCommunity Mapping & Advocacy\nCommunity Learning Center Management\nDiagnostic Assessment & Individualized Planning\nPortfolio Assessment',
        wednesday: 'Ancillary Task: Rotation Basis\nCommunity Mapping & Advocacy\nCommunity Learning Center Management\nDiagnostic Assessment & Individualized Planning\nPortfolio Assessment',
        thursday: 'Ancillary Task: Rotation Basis\nCommunity Mapping & Advocacy\nCommunity Learning Center Management\nDiagnostic Assessment & Individualized Planning\nPortfolio Assessment',
        friday: 'Ancillary Task: Rotation Basis\nCommunity Mapping & Advocacy\nCommunity Learning Center Management\nDiagnostic Assessment & Individualized Planning\nPortfolio Assessment',
        isSpecialRow: true,
        bgType: 'ancillary'
      }
    ];
  }

  // 3. A&E Senior High School
  if (programLevel === 'A&E Senior High School') {
    return [
      {
        id: 'cp-row-1-flag',
        time: '7:00 - 8:00',
        minutes: '',
        monday: 'Every Monday: Attendance at the Ceremonial Hoisting of the National Flag during Morning Assembly',
        tuesday: '',
        wednesday: '',
        thursday: '',
        friday: '',
        isSpecialRow: true,
        bgType: 'flag'
      },
      {
        id: 'cp-row-clc-morning',
        time: '',
        minutes: '',
        monday: morningCLCs.monday,
        tuesday: morningCLCs.tuesday,
        wednesday: morningCLCs.wednesday,
        thursday: morningCLCs.thursday,
        friday: morningCLCs.friday,
        isHeaderRow: true,
        bgType: 'header'
      },
      {
        id: 'cp-row-2-ls1',
        time: '8:00 – 9:00',
        minutes: 60,
        monday: 'LS1: Advanced Communication Skills (Oral Communication / Reading & Writing)',
        tuesday: 'LS1: Advanced Communication Skills (Oral Communication / Reading & Writing)',
        wednesday: 'LS1: Advanced Communication Skills (Oral Communication / Reading & Writing)',
        thursday: 'LS1: Advanced Communication Skills (Oral Communication / Reading & Writing)',
        friday: 'LS1: Advanced Communication Skills (Oral Communication / Reading & Writing)',
        bgType: 'subject'
      },
      {
        id: 'cp-row-3-ls2',
        time: '9:00 – 10:00',
        minutes: 60,
        monday: 'LS2: Scientific & Critical Thinking (Earth, Physical & Life Sciences)',
        tuesday: 'LS2: Scientific & Critical Thinking (Earth, Physical & Life Sciences)',
        wednesday: 'LS2: Scientific & Critical Thinking (Earth, Physical & Life Sciences)',
        thursday: 'LS2: Scientific & Critical Thinking (Earth, Physical & Life Sciences)',
        friday: 'LS2: Scientific & Critical Thinking (Earth, Physical & Life Sciences)',
        bgType: 'subject'
      },
      {
        id: 'cp-row-4-ls3',
        time: '10:00 – 11:00',
        minutes: 60,
        monday: 'LS3: General Mathematics, Statistics & Quantitative Reasoning',
        tuesday: 'LS3: General Mathematics, Statistics & Quantitative Reasoning',
        wednesday: 'LS3: General Mathematics, Statistics & Quantitative Reasoning',
        thursday: 'LS3: General Mathematics, Statistics & Quantitative Reasoning',
        friday: 'LS3: General Mathematics, Statistics & Quantitative Reasoning',
        bgType: 'subject'
      },
      {
        id: 'cp-row-5-ls4',
        time: '11:00 – 12:00',
        minutes: 60,
        monday: 'LS4: Entrepreneurship, Career Development & Work Immersion Preparation',
        tuesday: 'LS4: Entrepreneurship, Career Development & Work Immersion Preparation',
        wednesday: 'LS4: Entrepreneurship, Career Development & Work Immersion Preparation',
        thursday: 'LS4: Entrepreneurship, Career Development & Work Immersion Preparation',
        friday: 'LS4: Entrepreneurship, Career Development & Work Immersion Preparation',
        bgType: 'subject'
      },
      {
        id: 'cp-row-6-lunch',
        time: '12:00 - 1:00',
        minutes: '',
        monday: 'Daily: Lunch Break / Midday Meal Period',
        tuesday: '',
        wednesday: '',
        thursday: '',
        friday: '',
        isSpecialRow: true,
        bgType: 'lunch'
      },
      {
        id: 'cp-row-clc-afternoon',
        time: '',
        minutes: '',
        monday: afternoonCLCs.monday,
        tuesday: afternoonCLCs.tuesday,
        wednesday: afternoonCLCs.wednesday,
        thursday: afternoonCLCs.thursday,
        friday: afternoonCLCs.friday,
        isHeaderRow: true,
        bgType: 'header'
      },
      {
        id: 'cp-row-7-ls5',
        time: '1:00 – 2:00',
        minutes: 60,
        monday: 'LS 5: Contemporary Philippine Arts & Community Engagement',
        tuesday: 'LS 5: Contemporary Philippine Arts & Community Engagement',
        wednesday: 'LS 5: Contemporary Philippine Arts & Community Engagement',
        thursday: 'LS 5: Contemporary Philippine Arts & Community Engagement',
        friday: 'LS 5: Contemporary Philippine Arts & Community Engagement',
        bgType: 'subject'
      },
      {
        id: 'cp-row-8-ls6',
        time: '2:00 – 3:00',
        minutes: 60,
        monday: 'LS6: Media and Information Literacy & Empowerment Technologies',
        tuesday: 'LS6: Media and Information Literacy & Empowerment Technologies',
        wednesday: 'LS6: Media and Information Literacy & Empowerment Technologies',
        thursday: 'LS6: Media and Information Literacy & Empowerment Technologies',
        friday: 'LS6: Media and Information Literacy & Empowerment Technologies',
        bgType: 'subject'
      },
      {
        id: 'cp-row-9-ancillary',
        time: '3:00 - 5:00',
        minutes: 120,
        monday: 'Ancillary Task: Rotation Basis\nCommunity Mapping & Advocacy\nCommunity Learning Center Management\nDiagnostic Assessment & Individualized Planning\nPortfolio Assessment',
        tuesday: 'Ancillary Task: Rotation Basis\nCommunity Mapping & Advocacy\nCommunity Learning Center Management\nDiagnostic Assessment & Individualized Planning\nPortfolio Assessment',
        wednesday: 'Ancillary Task: Rotation Basis\nCommunity Mapping & Advocacy\nCommunity Learning Center Management\nDiagnostic Assessment & Individualized Planning\nPortfolio Assessment',
        thursday: 'Ancillary Task: Rotation Basis\nCommunity Mapping & Advocacy\nCommunity Learning Center Management\nDiagnostic Assessment & Individualized Planning\nPortfolio Assessment',
        friday: 'Ancillary Task: Rotation Basis\nCommunity Mapping & Advocacy\nCommunity Learning Center Management\nDiagnostic Assessment & Individualized Planning\nPortfolio Assessment',
        isSpecialRow: true,
        bgType: 'ancillary'
      }
    ];
  }

  // 4. Default: A&E Junior High School (as defined for Mervin Caldoza / Melody Anne Aquino / Jenny Dueñas)
  const isDuenas = teacherName.includes('DUENAS') || teacherName.includes('DUEŇAS') || teacherName.includes('DUEÑAS');

  const ls1Time = isDuenas ? '8:00 – 9:30' : '8:00 – 9:00';
  const ls1Minutes: number = isDuenas ? 90 : 60;
  const ls2Time = isDuenas ? '9:30 – 10:24' : '9:00 – 10:00';
  const ls2Minutes: number = isDuenas ? 54 : 60;
  const ls3Time = isDuenas ? '10:24 – 11:18' : '10:00 – 11:00';
  const ls3Minutes: number = isDuenas ? 54 : 60;
  const ls4Time = isDuenas ? '11:18 – 12:00' : '11:00 – 12:00';
  const ls4Minutes: number = isDuenas ? 42 : 60;

  return [
    {
      id: 'cp-row-1-flag',
      time: '7:00 - 8:00',
      minutes: '',
      monday: 'Every Monday: Attendance at the Ceremonial Hoisting of the National Flag during Morning Assembly',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      isSpecialRow: true,
      bgType: 'flag'
    },
    {
      id: 'cp-row-clc-morning',
      time: '',
      minutes: '',
      monday: morningCLCs.monday,
      tuesday: morningCLCs.tuesday,
      wednesday: morningCLCs.wednesday,
      thursday: morningCLCs.thursday,
      friday: morningCLCs.friday,
      isHeaderRow: true,
      bgType: 'header'
    },
    {
      id: 'cp-row-2-ls1',
      time: ls1Time,
      minutes: ls1Minutes,
      monday: 'LS1: Communication Skills in English & Filipino',
      tuesday: 'LS1: Communication Skills in English & Filipino',
      wednesday: 'LS1: Communication Skills in English & Filipino',
      thursday: 'LS1: Communication Skills in English & Filipino',
      friday: 'LS1: Communication Skills in English & Filipino',
      bgType: 'subject'
    },
    {
      id: 'cp-row-3-ls2',
      time: ls2Time,
      minutes: ls2Minutes,
      monday: 'LS2: Scientific & Critical Thinking Skills',
      tuesday: 'LS2: Scientific & Critical Thinking Skills',
      wednesday: 'LS2: Scientific & Critical Thinking Skills',
      thursday: 'LS2: Scientific & Critical Thinking Skills',
      friday: 'LS2: Scientific & Critical Thinking Skills',
      bgType: 'subject'
    },
    {
      id: 'cp-row-4-ls3',
      time: ls3Time,
      minutes: ls3Minutes,
      monday: 'LS3: Mathematical and Problem-Solving Skills',
      tuesday: 'LS3: Mathematical and Problem-Solving Skills',
      wednesday: 'LS3: Mathematical and Problem-Solving Skills',
      thursday: 'LS3: Mathematical and Problem-Solving Skills',
      friday: 'LS3: Mathematical and Problem-Solving Skills',
      bgType: 'subject'
    },
    {
      id: 'cp-row-5-ls4',
      time: ls4Time,
      minutes: ls4Minutes,
      monday: 'LS4: Life and Career Skills',
      tuesday: 'LS4: Life and Career Skills',
      wednesday: 'LS4: Life and Career Skills',
      thursday: 'LS4: Life and Career Skills',
      friday: 'LS4: Life and Career Skills',
      bgType: 'subject'
    },
    {
      id: 'cp-row-6-lunch',
      time: '12:00 - 1:00',
      minutes: '',
      monday: 'Daily: Lunch Break / Midday Meal Period',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      isSpecialRow: true,
      bgType: 'lunch'
    },
    {
      id: 'cp-row-clc-afternoon',
      time: '',
      minutes: '',
      monday: afternoonCLCs.monday,
      tuesday: afternoonCLCs.tuesday,
      wednesday: afternoonCLCs.wednesday,
      thursday: afternoonCLCs.thursday,
      friday: afternoonCLCs.friday,
      isHeaderRow: true,
      bgType: 'header'
    },
    {
      id: 'cp-row-7-ls5',
      time: '1:00 – 2:00',
      minutes: 60,
      monday: 'LS 5: Understanding the Self and Society (Pag-unawa sa Sarili at Lipunan)',
      tuesday: 'LS 5: Understanding the Self and Society (Pag-unawa sa Sarili at Lipunan)',
      wednesday: 'LS 5: Understanding the Self and Society (Pag-unawa sa Sarili at Lipunan)',
      thursday: 'LS 5: Understanding the Self and Society (Pag-unawa sa Sarili at Lipunan)',
      friday: 'LS 5: Understanding the Self and Society (Pag-unawa sa Sarili at Lipunan)',
      bgType: 'subject'
    },
    {
      id: 'cp-row-8-ls6',
      time: '2:00 – 3:00',
      minutes: 60,
      monday: 'LS6: Digital Citizenship',
      tuesday: 'LS6: Digital Citizenship',
      wednesday: 'LS6: Digital Citizenship',
      thursday: 'LS6: Digital Citizenship',
      friday: 'LS6: Digital Citizenship',
      bgType: 'subject'
    },
    {
      id: 'cp-row-9-ancillary',
      time: '3:00 - 5:00',
      minutes: 120,
      monday: 'Ancillary Task: Rotation Basis\nCommunity Mapping & Advocacy\nCommunity Learning Center Management\nDiagnostic Assessment & Individualized Planning\nPortfolio Assessment',
      tuesday: 'Ancillary Task: Rotation Basis\nCommunity Mapping & Advocacy\nCommunity Learning Center Management\nDiagnostic Assessment & Individualized Planning\nPortfolio Assessment',
      wednesday: 'Ancillary Task: Rotation Basis\nCommunity Mapping & Advocacy\nCommunity Learning Center Management\nDiagnostic Assessment & Individualized Planning\nPortfolio Assessment',
      thursday: 'Ancillary Task: Rotation Basis\nCommunity Mapping & Advocacy\nCommunity Learning Center Management\nDiagnostic Assessment & Individualized Planning\nPortfolio Assessment',
      friday: 'Ancillary Task: Rotation Basis\nCommunity Mapping & Advocacy\nCommunity Learning Center Management\nDiagnostic Assessment & Individualized Planning\nPortfolio Assessment',
      isSpecialRow: true,
      bgType: 'ancillary'
    }
  ];
}

export const CLASS_PROGRAM_CACHE_PREFIX = 'tcsd_class_program_';

/**
 * Retrieves cached local edits for a teacher if present
 */
export function getStoredClassProgram(teacherName: string): ClassProgramRow[] | null {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(`${CLASS_PROGRAM_CACHE_PREFIX}${teacherName}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch (err) {
    console.warn(`[ClassProgramSync] Failed to read localStorage cache for "${teacherName}":`, err);
    return null;
  }
}

/**
 * Saves teacher matrix rows to localStorage
 */
export function saveStoredClassProgram(teacherName: string, rows: ClassProgramRow[]): void {
  try {
    localStorage.setItem(`${CLASS_PROGRAM_CACHE_PREFIX}${teacherName}`, JSON.stringify(rows));
  } catch (err) {
    console.error(`[ClassProgramSync] Failed to save rows to localStorage for "${teacherName}":`, err);
  }
}

/**
 * Checks if a teacher has local unsynced edits in cache
 */
export function hasClassProgramLocalCache(teacherName: string): boolean {
  return localStorage.getItem(`${CLASS_PROGRAM_CACHE_PREFIX}${teacherName}`) !== null;
}

/**
 * Clears cached rows for a specific teacher, or all facilitators if unspecified
 */
export function clearClassProgramLocalCache(teacherName?: string): void {
  if (teacherName) {
    try {
      localStorage.removeItem(`${CLASS_PROGRAM_CACHE_PREFIX}${teacherName}`);
      sessionStorage.removeItem(`classProgram_sheet_${teacherName}`);
    } catch (e) {}
    console.log(`[ClassProgramSync] Purged cache for facilitator: "${teacherName}"`);
  } else {
    try {
      CLASS_PROGRAM_TEACHERS.forEach(t => {
        localStorage.removeItem(`${CLASS_PROGRAM_CACHE_PREFIX}${t.name}`);
        sessionStorage.removeItem(`classProgram_sheet_${t.name}`);
      });
    } catch (e) {}
    console.log(`[ClassProgramSync] Purged cache for all ${CLASS_PROGRAM_TEACHERS.length} facilitators.`);
  }
}

/**
 * Fetches Class Program Matrix for a given facilitator with structured diagnostics,
 * explicit timeout prevention, and comprehensive error logging.
 */
export async function fetchClassProgramFromApi(
  teacherName: string, 
  gid?: string,
  customSpreadsheetId?: string,
  customAppsScriptUrl?: string
): Promise<ClassProgramSyncResult> {
  const startTime = performance.now();
  const rawStored = localStorage.getItem('classProgramSpreadsheetId');
  const OFFICIAL_CLASS_PROGRAM_ID = '1YfXfPT7NvehXaRvN8a9GDbyvG3IxHxUAUgcVLObRxkc';
  const cleanId = (id?: string | null) => {
    if (!id) return null;
    const clean = id.trim().replace(/^.*\/d\//, '').replace(/\/.*$/, '');
    if (!clean || clean === '1DJDJRfQzgkl_gtGcCDVv1uuyLGAZC-c9F-tRYI_jFPw' || clean === '1Z-GsOOh5DV5CSilR7AZFZX_s1K1ktvC7sVVgFcJR3o0') {
      return null;
    }
    return clean;
  };
  
  const sId = cleanId(customSpreadsheetId) || cleanId(rawStored) || OFFICIAL_CLASS_PROGRAM_ID;
  const appsUrl = customAppsScriptUrl || localStorage.getItem('classProgramAppsScriptUrl') || '';
  const targetGid = gid || findClassProgramTeacher(teacherName)?.gid || '';
  const url = `/api/sheets/fetch-class-program?teacher=${encodeURIComponent(teacherName)}&gid=${encodeURIComponent(targetGid)}${sId ? `&spreadsheetId=${encodeURIComponent(sId)}` : ''}${appsUrl ? `&appsScriptUrl=${encodeURIComponent(appsUrl)}` : ''}&_=${Date.now()}`;

  console.log(`[ClassProgramSync] 🔄 Initiating sync for: "${teacherName}" (GID: ${targetGid}) | Sheet: ${sId}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    const durationMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      throw new Error(`HTTP status ${res.status} (${res.statusText || 'Server Error'})`);
    }

    const json = await res.json();

    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      const isFromSheet = Boolean(json.isFromSheet);
      console.log(`[ClassProgramSync] ✅ Successfully fetched ${json.data.length} matrix rows for "${teacherName}" from ${isFromSheet ? 'Google Sheets (Live)' : 'Default Matrix'} in ${durationMs}ms`);

      const signaturesData: ClassProgramSignaturesData = json.signatures && json.signatures.signatoriesList
        ? json.signatures
        : getDefaultSignatoriesForTeacher(teacherName);

      return {
        success: true,
        data: json.data,
        isFromSheet,
        signatures: signaturesData,
        source: isFromSheet ? 'google_sheets_live' : 'deped_default_template',
        diagnostics: {
          teacher: teacherName,
          gid: targetGid,
          spreadsheetId: json.matchedSpreadsheetId || sId,
          appsScriptUrl: json.appsScriptUrl || appsUrl,
          serviceAccount: json.serviceAccount || SERVICE_ACCOUNT_EMAIL,
          source: isFromSheet ? 'google_sheets_live' : 'deped_default_template',
          isFromSheet,
          rowCount: json.data.length,
          durationMs,
          timestamp: new Date().toLocaleTimeString(),
          endpointUrl: url
        }
      };
    } else {
      console.warn(`[ClassProgramSync] ⚠️ API returned empty or unsuccessful payload for "${teacherName}":`, json);
      throw new Error(json.error || 'Empty matrix rows returned from sheet endpoint');
    }
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - startTime);
    const errorMsg = err.name === 'AbortError' ? 'Fetch request timed out after 9 seconds' : (err.message || String(err));
    console.warn(`[ClassProgramSync] ❌ Live Google Sheets sync failed for "${teacherName}" (${errorMsg}). Activating DepEd Standard Template fallback.`);

    const defaults = getDefaultClassProgramForTeacher(teacherName);
    return {
      success: true,
      data: defaults,
      isFromSheet: false,
      signatures: getDefaultSignatoriesForTeacher(teacherName),
      source: 'deped_default_template',
      diagnostics: {
        teacher: teacherName,
        gid: targetGid,
        spreadsheetId: sId,
        appsScriptUrl: appsUrl,
        serviceAccount: SERVICE_ACCOUNT_EMAIL,
        source: 'deped_default_template',
        isFromSheet: false,
        rowCount: defaults.length,
        durationMs,
        timestamp: new Date().toLocaleTimeString(),
        endpointUrl: url,
        error: errorMsg
      }
    };
  }
}

/**
 * Aggregates and returns all unique Community Learning Centers (CLCs) assigned to a teacher.
 * Scans both active schedule rows (header rows), default schedule rows, and primary profile.
 */
export function getAllAssignedCLCsForTeacher(teacherName: string, activeRows?: ClassProgramRow[]): string[] {
  const teacher = findClassProgramTeacher(teacherName);
  const clcSet = new Set<string>();

  // 1. Scan active/synced schedule rows for header rows or cell entries mentioning centers
  if (activeRows && activeRows.length > 0) {
    activeRows.forEach(row => {
      const isHeader = row.isHeaderRow || row.bgType === 'header' ||
        (!row.time && row.monday && (row.monday.includes('Center') || row.monday.includes('CLC') || row.monday.includes('School'))) ||
        (row.monday && row.monday.toLowerCase().includes('community learning center'));

      if (isHeader) {
        [row.monday, row.tuesday, row.wednesday, row.thursday, row.friday].forEach(val => {
          if (val && typeof val === 'string') {
            const clean = val.trim();
            if (
              clean.length > 0 && 
              !clean.includes('—') && 
              !clean.toLowerCase().includes('time') && 
              !clean.toLowerCase().includes('minutes') &&
              !clean.toLowerCase().includes('ancillary')
            ) {
              clcSet.add(clean);
            }
          }
        });
      }
    });

    if (clcSet.size > 0) {
      return Array.from(clcSet);
    }
  }

  // 2. Official CLC Details registry assignments for this teacher
  const officialClcs = getOfficialCLCsByTeacher(teacherName);
  if (officialClcs && officialClcs.length > 0) {
    officialClcs.forEach(c => {
      if (c && c.clcName) {
        clcSet.add(c.clcName.trim());
      }
    });
    return Array.from(clcSet);
  }

  // 3. Scan default template rows for the teacher
  const defaultRows = getDefaultClassProgramForTeacher(teacherName);
  defaultRows.forEach(row => {
    if (row.isHeaderRow || row.bgType === 'header') {
      [row.monday, row.tuesday, row.wednesday, row.thursday, row.friday].forEach(val => {
        if (val && typeof val === 'string' && val.trim().length > 0) {
          clcSet.add(val.trim());
        }
      });
    }
  });

  // 4. Primary profile CLC if defined
  if (teacher?.clcName) {
    clcSet.add(teacher.clcName.trim());
  }

  const list = Array.from(clcSet).filter(Boolean);
  return list.length > 0 ? list : [teacher?.clcName || 'Community Learning Center'];
}

export interface TeacherConsolidatedDay {
  dayKey: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  dayName: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  morningClc: string;
  afternoonClc: string;
  morningTime: string;
  morningActivities: string;
  afternoonTime: string;
  afternoonActivities: string;
  ancillaryTime: string;
  ancillaryActivities: string;
  teachingMinutes: number;
  ancillaryMinutes: number;
  totalMinutes: number;
  district: string;
  morningDistrict: string;
  afternoonDistrict: string;
}

export interface TeacherConsolidatedWeeklySchedule {
  name: string;
  gid: string;
  clcName: string;
  primaryDistrict: string;
  allAssignedClcs: string[];
  programLevel: string;
  days: {
    monday: TeacherConsolidatedDay;
    tuesday: TeacherConsolidatedDay;
    wednesday: TeacherConsolidatedDay;
    thursday: TeacherConsolidatedDay;
    friday: TeacherConsolidatedDay;
  };
  totalWeeklyTeachingHours: number; // 30.0
  totalWeeklyAncillaryHours: number; // 10.0
  totalWeeklyHours: number; // 40.0
  status: string;
}

/**
 * Ensures the Morning Session CLC header row is positioned at the second row (Index 1),
 * immediately following the Flag Ceremony row (7:00 - 8:00 AM) at row 1.
 */
export function ensureMorningSessionAtSecondRow(rows: ClassProgramRow[]): ClassProgramRow[] {
  if (!rows || rows.length < 2) return rows;
  const flagIdx = rows.findIndex(
    r => r.bgType === 'flag' || r.time?.includes('7:00') || r.monday?.toLowerCase().includes('flag') || r.monday?.toLowerCase().includes('hoisting')
  );
  const morningIdx = rows.findIndex(
    r => r.id === 'cp-row-clc-morning' || (r.isHeaderRow && !r.time && !r.id?.includes('afternoon'))
  );

  if (flagIdx !== -1 && morningIdx !== -1 && flagIdx > morningIdx) {
    const copy = [...rows];
    const [morningRow] = copy.splice(morningIdx, 1);
    const newFlagIdx = copy.findIndex(
      r => r.bgType === 'flag' || r.time?.includes('7:00') || r.monday?.toLowerCase().includes('flag') || r.monday?.toLowerCase().includes('hoisting')
    );
    copy.splice(newFlagIdx + 1, 0, morningRow);
    return copy;
  }
  return rows;
}

/**
 * Resolves the District for a given CLC and teacher name, using dynamic sheet map with resilient fallback.
 * Strictly excludes obsolete 'Central' district value.
 */
export function resolveClcDistrict(
  clcName: string,
  teacherName?: string,
  dynamicClcMap?: Record<string, string>
): string {
  if (clcName) {
    const lower = clcName.toLowerCase();
    if (lower.includes('sebastian')) return 'Central A';
    if (lower.includes('sapang tagalog') || lower.includes('tagalog')) return 'South A';
    if (lower.includes('san francisco') || lower.includes('francisco')) return 'South A';
    if (lower.includes('burot')) return 'South A';
  }
  if (dynamicClcMap && clcName) {
    const direct = dynamicClcMap[clcName.toLowerCase().trim()];
    if (direct && direct.toLowerCase() !== 'central' && direct !== 'District') return direct;
    
    // Check normalized
    const norm = normalizeClcName(clcName);
    if (norm.length >= 3) {
      for (const [key, dist] of Object.entries(dynamicClcMap)) {
        if (dist && dist.toLowerCase() !== 'central' && dist !== 'District') {
          const normKey = normalizeClcName(key);
          if (normKey === norm || normKey.includes(norm) || norm.includes(normKey)) {
            return dist;
          }
        }
      }
    }
  }

  // Fallback to official static registry
  const official = getOfficialDistrictForCLC(clcName);
  if (official && official.toLowerCase() !== 'central' && official !== 'District') return official;

  if (teacherName) {
    const teacherDist = getOfficialDistrictForTeacher(teacherName);
    if (teacherDist && teacherDist.toLowerCase() !== 'central' && teacherDist !== 'District') return teacherDist;
  }

  return 'District';
}

/**
 * Builds consolidated weekly schedules for all 17 mobile teachers with District mapping
 */
export function getConsolidatedWeeklySchedules(
  customClcMap?: Record<string, string>
): TeacherConsolidatedWeeklySchedule[] {
  return CLASS_PROGRAM_TEACHERS.map(teacher => {
    let activeRows: ClassProgramRow[] | null = null;
    if (typeof window !== 'undefined') {
      try {
        const sessionRaw = sessionStorage.getItem(`classProgram_sheet_${teacher.name}`);
        if (sessionRaw) {
          const parsed = JSON.parse(sessionRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            activeRows = parsed;
          }
        }
      } catch (e) {}
    }
    if (!activeRows || activeRows.length === 0) {
      activeRows = getStoredClassProgram(teacher.name);
    }
    const defaultRows = (activeRows && activeRows.length > 0) ? activeRows : getDefaultClassProgramForTeacher(teacher.name);
    const allAssignedClcs = getAllAssignedCLCsForTeacher(teacher.name, defaultRows);

    const morningHeaderRow = defaultRows.find(r => r.id === 'cp-row-clc-morning' || (r.isHeaderRow && !r.time)) || defaultRows[0];
    const afternoonHeaderRow = defaultRows.find(r => r.id === 'cp-row-clc-afternoon') || morningHeaderRow;

    const dayKeys: Array<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'> = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const dayNames: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const daysMap = {} as TeacherConsolidatedWeeklySchedule['days'];
    const primaryDistrict = resolveClcDistrict(teacher.clcName, teacher.name, customClcMap);

    dayKeys.forEach((key, idx) => {
      const morningClc = (morningHeaderRow && morningHeaderRow[key]) || teacher.clcName;
      const afternoonClc = (afternoonHeaderRow && afternoonHeaderRow[key]) || morningClc;

      const trimmedMorningClc = morningClc.trim() || teacher.clcName;
      const trimmedAfternoonClc = afternoonClc.trim() || trimmedMorningClc;

      const morningDistrict = resolveClcDistrict(trimmedMorningClc, teacher.name, customClcMap);
      const afternoonDistrict = resolveClcDistrict(trimmedAfternoonClc, teacher.name, customClcMap);

      const district = morningDistrict === afternoonDistrict
        ? morningDistrict
        : `${morningDistrict} / ${afternoonDistrict}`;

      daysMap[key] = {
        dayKey: key,
        dayName: dayNames[idx],
        morningClc: trimmedMorningClc,
        afternoonClc: trimmedAfternoonClc,
        morningTime: '08:00 AM – 12:00 PM',
        morningActivities: key === 'monday'
          ? 'Morning Assembly & Flag Hoisting • LS1 (Eng/Fil) • LS2 (Science) • LS3 (Math) • LS4 (Life/Career)'
          : 'LS1: Communication Skills • LS2: Scientific Thinking • LS3: Mathematical Problem Solving • LS4: Life Skills',
        afternoonTime: '01:00 PM – 03:00 PM',
        afternoonActivities: 'LS5: Understanding Self & Society • LS6: Digital Citizenship & ICT Empowerment',
        ancillaryTime: '03:00 PM – 05:00 PM',
        ancillaryActivities: 'Community Literacy Mapping • CLC Management • Diagnostic Assessment & Portfolio Review',
        teachingMinutes: 360,
        ancillaryMinutes: 120,
        totalMinutes: 480,
        district,
        morningDistrict,
        afternoonDistrict
      };
    });

    return {
      name: teacher.name,
      gid: teacher.gid,
      clcName: teacher.clcName,
      primaryDistrict,
      allAssignedClcs,
      programLevel: teacher.programLevel,
      days: daysMap,
      totalWeeklyTeachingHours: 30.0,
      totalWeeklyAncillaryHours: 10.0,
      totalWeeklyHours: 40.0,
      status: '40.0 Hrs / Wk (DepEd Magna Carta Compliant)'
    };
  });
}

export interface LiveClcDetailsResponse {
  success: boolean;
  sheetName: string;
  gid: string;
  isFromSheet: boolean;
  source: string;
  matchedSpreadsheetId?: string;
  totalItems: number;
  data: CLCDetailItem[];
  clcToDistrictMap: Record<string, string>;
  teacherToDistrictsMap: Record<string, string[]>;
}

/**
 * Fetches CLC Details from Google Sheet:
 * Sheet Name: "CLC DETAILS (CHECK THIS & UPDATE)"
 * GID: 279279947
 * Columns: NO., COMMUNITY LEARNING CENTER, COMMUNITY LEARNING CENTER CODE, Address, DISTRICT, PUBLIC SCHOOLS' DISTRICT SUPERVISOR, CATEGORY, TYPE, MODALITY, PROGRAM, NAME OF TEACHER, Contact Number
 */
export async function fetchLiveClcDetails(spreadsheetId?: string): Promise<LiveClcDetailsResponse> {
  const targetId = spreadsheetId || localStorage.getItem('classProgramSpreadsheetId') || '1YfXfPT7NvehXaRvN8a9GDbyvG3IxHxUAUgcVLObRxkc';
  const appsScriptUrl = localStorage.getItem('classProgramAppsScriptUrl') || '';

  try {
    const url = `/api/sheets/fetch-clc-details?spreadsheetId=${encodeURIComponent(targetId)}&gid=279279947${appsScriptUrl ? `&appsScriptUrl=${encodeURIComponent(appsScriptUrl)}` : ''}&_t=${Date.now()}`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json && json.success) {
        localStorage.setItem('classProgramClcDetailsCache', JSON.stringify({
          timestamp: Date.now(),
          clcToDistrictMap: json.clcToDistrictMap,
          teacherToDistrictsMap: json.teacherToDistrictsMap,
          totalItems: json.totalItems,
          isFromSheet: json.isFromSheet,
          data: json.data && json.data.length > 0 ? json.data : undefined,
          sheetName: json.sheetName || CLC_DETAILS_SHEET_NAME
        }));
        return {
          success: true,
          sheetName: json.sheetName || CLC_DETAILS_SHEET_NAME,
          gid: '279279947',
          isFromSheet: Boolean(json.isFromSheet),
          source: json.source || (json.isFromSheet ? 'google_sheets_live' : 'deped_default_template'),
          matchedSpreadsheetId: json.matchedSpreadsheetId,
          totalItems: json.totalItems || OFFICIAL_CLC_DETAILS_LIST.length,
          data: json.data && json.data.length > 0 ? json.data : OFFICIAL_CLC_DETAILS_LIST,
          clcToDistrictMap: json.clcToDistrictMap || {},
          teacherToDistrictsMap: json.teacherToDistrictsMap || {}
        };
      }
    }
  } catch (err) {
    console.warn('[ClassProgramSync] fetchLiveClcDetails network error, falling back to local registry:', err);
  }

  // Fallback to cache if available
  const cached = localStorage.getItem('classProgramClcDetailsCache');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed.version === CLC_DETAILS_VERSION && Array.isArray(parsed.data) && parsed.data.length === OFFICIAL_CLC_DETAILS_LIST.length) {
        return {
          success: true,
          sheetName: parsed.sheetName || CLC_DETAILS_SHEET_NAME,
          gid: CLC_DETAILS_GID,
          isFromSheet: Boolean(parsed.isFromSheet),
          source: 'local_storage_cache',
          totalItems: parsed.totalItems || OFFICIAL_CLC_DETAILS_LIST.length,
          data: parsed.data,
          clcToDistrictMap: parsed.clcToDistrictMap || {},
          teacherToDistrictsMap: parsed.teacherToDistrictsMap || {}
        };
      }
    } catch (e) {}
  }

  // Generate fallback maps from OFFICIAL_CLC_DETAILS_LIST
  const clcMap: Record<string, string> = {};
  const teacherMap: Record<string, string[]> = {};
  OFFICIAL_CLC_DETAILS_LIST.forEach(item => {
    if (item.clcName && item.district) {
      clcMap[item.clcName.toLowerCase().trim()] = item.district;
    }
    if (item.teacherName && item.district) {
      const tNorm = item.teacherName.toUpperCase().replace(/Ň|Ñ/g, 'N').trim();
      if (!teacherMap[tNorm]) teacherMap[tNorm] = [];
      if (!teacherMap[tNorm].includes(item.district)) teacherMap[tNorm].push(item.district);
    }
  });

  return {
    success: true,
    sheetName: CLC_DETAILS_SHEET_NAME,
    gid: '279279947',
    isFromSheet: false,
    source: 'deped_default_template',
    totalItems: OFFICIAL_CLC_DETAILS_LIST.length,
    data: OFFICIAL_CLC_DETAILS_LIST,
    clcToDistrictMap: clcMap,
    teacherToDistrictsMap: teacherMap
  };
}
