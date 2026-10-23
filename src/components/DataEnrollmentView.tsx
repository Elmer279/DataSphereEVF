import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  Edit3, 
  Trash2, 
  Filter, 
  Check, 
  X, 
  Plus, 
  AlertCircle,
  Eye,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Printer
} from 'lucide-react';
import { LearnerRecord, LearningCenter } from '../types';
import { COMMUNITY_LEARNING_CENTERS, getClcCode } from '../utils/clcMap';
import { getRemarksForGrade, SHEET_COLUMNS, mapLearnerToSheetRow } from '../utils/sheetsSync';

interface DataEnrollmentViewProps {
  learners: LearnerRecord[];
  learningCenters: LearningCenter[];
  onAddLearner: (newLearner: LearnerRecord) => void;
  onUpdateLearner: (id: string, updatedFields: Partial<LearnerRecord>) => void;
  onDeleteLearner: (id: string) => void;
  onSyncGoogleSheets?: (fetchedLearners: LearnerRecord[]) => void;
  onGoToDashboard?: () => void;
  accessToken?: string | null;
  customSpreadsheetId?: string;
}

export function DataEnrollmentView({ 
  learners, 
  learningCenters, 
  onAddLearner, 
  onUpdateLearner, 
  onDeleteLearner,
  onSyncGoogleSheets,
  onGoToDashboard,
  accessToken = null,
  customSpreadsheetId = ''
}: DataEnrollmentViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('All');
  const [selectedClc, setSelectedClc] = useState<string>('All');
  const [clcSearchQuery, setClcSearchQuery] = useState('');
  const [isClcDropdownOpen, setIsClcDropdownOpen] = useState(false);
  const [isSavingToSheet, setIsSavingToSheet] = useState(false);
  const [isFetchingFromSheet, setIsFetchingFromSheet] = useState(false);
  const selectedGender = 'All';
  const selectedPwd = 'All';
  const selected4Ps = 'All';

  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollTable = (direction: 'left' | 'right') => {
    if (tableContainerRef.current) {
      const scrollAmount = 800;
      tableContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const formatDaysAvail = (days: any) => {
    if (!days) return '—';
    const active = Object.entries(days)
      .filter(([_, val]) => !!val)
      .map(([day, val]) => `${day}: ${val}`);
    return active.length > 0 ? active.join(', ') : '—';
  };

  // Currently editing row or detail modal state
  const [editingLearnerId, setEditingLearnerId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<LearnerRecord>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'edit' | 'add' | 'view'>('view');

  // Delete confirmation and toast notification states
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Helper helper to split father name safely into Last, First, Middle Names
  const splitFatherName = (fullName: string | undefined): { last: string; first: string; middle: string } => {
    if (!fullName || fullName === 'Unknown Father' || fullName === 'N/A') return { last: '', first: '', middle: '' };
    const clean = fullName.includes(',') ? fullName.split(',') : [fullName];
    if (clean.length === 2) {
      // Last, First Middle format
      const last = clean[0].trim();
      const firstMiddle = clean[1].trim().split(' ');
      const first = firstMiddle[0] || '';
      const middle = firstMiddle.slice(1).join(' ') || '';
      return { last, first, middle };
    } else {
      // First Middle Last format
      const parts = fullName.trim().split(/\s+/);
      const last = parts.length > 1 ? parts[parts.length - 1] : '';
      const first = parts[0] || '';
      const middle = parts.slice(1, -1).join(' ') || '';
      return { last, first, middle };
    }
  };

  // Helper to split mother name safely into Last (Maiden), First, Middle Names
  const splitMotherName = (fullName: string | undefined): { last: string; first: string; middle: string } => {
    if (!fullName || fullName === 'Unknown Mother' || fullName === 'N/A') return { last: '', first: '', middle: '' };
    const clean = fullName.includes(',') ? fullName.split(',') : [fullName];
    if (clean.length === 2) {
      const last = clean[0].trim();
      const firstMiddle = clean[1].trim().split(' ');
      const first = firstMiddle[0] || '';
      const middle = firstMiddle.slice(1).join(' ') || '';
      return { last, first, middle };
    } else {
      const parts = fullName.trim().split(/\s+/);
      const last = parts.length > 1 ? parts[parts.length - 1] : '';
      const first = parts[0] || '';
      const middle = parts.slice(1, -1).join(' ') || '';
      return { last, first, middle };
    }
  };

  // Get dynamic CLC & Teacher values for learners who don't have them explicitly
  const getClcDetailsObj = useMemo(() => {
    return (learner: LearnerRecord) => {
      // Match by district
      let clc = learningCenters.find(c => c.district === learner.district);
      if (!clc) {
        clc = learningCenters.find(c => c.district === 'District A') || learningCenters[0];
      }
      return {
        clcName: learner.clcName || clc?.name || 'San Roque Community Learning Center',
        clcCode: learner.clcCode || (clc ? `CLC-${clc.id.replace(/\D/g, '') || '01'}` : 'CLC-091'),
        teacher: learner.teacher || clc?.teacher || 'Mrs. Maria Elena Santos'
      };
    };
  }, [learningCenters]);

  // Map each learner to comprehensive data rows matching the requested 40 columns
  const mappedLearners = useMemo(() => {
    return learners.map((l, index) => {
      const parentFather = splitFatherName(l.fatherName);
      const parentMother = splitMotherName(l.motherName);
      const clcInfo = getClcDetailsObj(l);

      return {
        original: l,
        no: index + 1,
        id: l.id,
        lastName: l.lastName || l.name.split(' ').slice(-1)[0] || '',
        firstName: l.firstName || l.name.split(' ')[0] || '',
        middleName: l.middleName || l.name.split(' ').slice(1, -1).join(' ') || '',
        nameExtension: l.nameExtension || '',
        birthdate: l.dateOfBirth || '',
        age: l.age || 0,
        sex: l.gender || 'Male',
        contactNumber: l.contactNumber || l.contact || 'N/A',
        religion: l.religion || 'Roman Catholic',
        ip: l.indigenousPeople === 'Yes' || (l.indigenousPeople && l.indigenousPeople !== 'No') ? 'Yes' : 'No',
        ipCommunity: l.indigenousPeople && l.indigenousPeople !== 'Yes' && l.indigenousPeople !== 'No' ? l.indigenousPeople : (l.ipCommunity || ''),
        motherTongue: l.motherTongue || 'Tagalog',
        fourPs: l.is4Ps || 'No',
        householdId: l.householdId || '',
        civilStatus: l.civilStatus || 'Single',
        houseNo: l.houseNo || '',
        sitioStreet: l.street || '',
        barangay: l.barangay || '',
        municipalityCity: l.city || 'Tarlac City',
        province: l.province || 'Tarlac',
        country: l.country || 'Philippines',
        zipCode: l.zipCode || '2300',
        fatherLastName: l.fatherLastName || parentFather.last,
        fatherFirstName: l.fatherFirstName || parentFather.first,
        fatherMiddleName: l.fatherMiddleName || parentFather.middle,
        fatherOccupation: l.fatherOccupation || 'N/A',
        motherLastName: l.motherLastName || parentMother.last,
        motherFirstName: l.motherFirstName || parentMother.first,
        middleNameMother: parentMother.middle, // Backward compatible mapping
        motherMiddleName: l.motherMiddleName || parentMother.middle,
        motherOccupation: l.motherOccupation || 'N/A',
        guardianLastName: l.guardianLastName || '',
        guardianFirstName: l.guardianFirstName || '',
        guardianMiddleName: l.guardianMiddleName || '',
        guardianOccupation: l.guardianOccupation || '',
        pwd: l.isPWD || 'No',
        disability: Array.isArray(l.pwdDisabilityType) ? l.pwdDisabilityType.join(', ') : (l.pwdDisabilityType || ''),
        pwdID: l.pwdID || '',
        lastGradeCompleted: l.lastGradeLevelCompleted || 'Grade 6',
        communityLearningCenter: clcInfo.clcName,
        clcCode: clcInfo.clcCode,
        teacher: clcInfo.teacher,
        whyNotAttend: l.whyNotAttend || l.reasonsForNotAttending || 'N/A',
        attendedALSBef: (l as any).attendedALSBef || 'No',
        completedALSBef: (l as any).completedALSBef || 'No',
        clcDistanceKms: (l as any).clcDistanceKms || '',
        howGetToClc: (l as any).howGetToClc || 'Walking',
        clcDaysAvailability: (l as any).clcDaysAvailability || {},
        preferredModalities: (l as any).preferredModalities || [],
        district: l.district || 'CENTRAL DISTRICT'
      };
    });
  }, [learners, getClcDetailsObj]);

  // Filter list based on search and selected filter scopes
  const filteredLearners = useMemo(() => {
    return mappedLearners.filter(row => {
      const matchSearch = (
        row.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.middleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.barangay.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.communityLearningCenter.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.teacher.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const matchTeacher = selectedTeacher === 'All' || row.teacher.trim().toLowerCase() === selectedTeacher.trim().toLowerCase();
      const matchClc = selectedClc === 'All' || row.communityLearningCenter.trim().toLowerCase() === selectedClc.trim().toLowerCase();

      return matchSearch && matchTeacher && matchClc;
    });
  }, [mappedLearners, searchQuery, selectedTeacher, selectedClc]);

  // Compute metrics summaries
  const stats = useMemo(() => {
    const total = filteredLearners.length;
    const male = filteredLearners.filter(l => l.sex === 'Male').length;
    const female = filteredLearners.filter(l => l.sex === 'Female').length;
    const pwdCount = filteredLearners.filter(l => l.pwd === 'Yes').length;
    const fourPsCount = filteredLearners.filter(l => l.fourPs === 'Yes').length;
    const ipCount = filteredLearners.filter(l => l.ip === 'Yes').length;

    return { total, male, female, pwdCount, fourPsCount, ipCount };
  }, [filteredLearners]);

  // Start edit flow
  const handleStartEdit = (learner: any) => {
    setEditForm({ ...learner.original });
    setEditingLearnerId(learner.id);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  // Open view modal
  const handleOpenView = (learner: any) => {
    setEditForm({ ...learner.original });
    setModalMode('view');
    setIsModalOpen(true);
  };

  // Save edit flow
  const handleSaveModal = () => {
    if (!editForm.id) return;
    
    // Process names and full details
    const fatherFull = `${editForm.fatherLastName || ''}, ${editForm.fatherFirstName || ''} ${editForm.fatherMiddleName || ''}`.trim();
    const motherFull = `${editForm.motherLastName || ''}, ${editForm.motherFirstName || ''} ${editForm.motherMiddleName || ''}`.trim();

    const updatedData: Partial<LearnerRecord> = {
      ...editForm,
      name: `${editForm.firstName || ''} ${editForm.middleName ? editForm.middleName[0] + '. ' : ''}${editForm.lastName || ''}`.trim(),
      fatherName: fatherFull || editForm.fatherName || 'Unknown Father',
      motherName: motherFull || editForm.motherName || 'Unknown Mother',
    };

    onUpdateLearner(editForm.id, updatedData);
    setIsModalOpen(false);
    setEditingLearnerId(null);
  };

  // Handle adding new learner
  const handleOpenAdd = () => {
    const nextId = `ALS-RF-${Date.now()}`;
    setEditForm({
      id: nextId,
      recordNumber: `11774201${Math.floor(100000 + Math.random() * 900000)}`,
      lastName: '',
      firstName: '',
      middleName: '',
      nameExtension: '',
      gender: 'Male',
      dateOfBirth: '2005-01-01',
      age: 18,
      motherTongue: 'Tagalog',
      indigenousPeople: 'No',
      religion: 'Roman Catholic',
      houseNo: '',
      street: '',
      barangay: 'San Vicente',
      city: 'Tarlac City',
      province: 'Tarlac',
      fatherName: '',
      motherName: '',
      contactNumber: '',
      lastGradeLevelCompleted: 'Grade 6',
      program: 'A&E Secondary',
      status: 'Enrolled',
      district: 'District A',
      admissionDate: new Date().toISOString().split('T')[0]
    });
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleAddNewLearner = () => {
    if (!editForm.firstName || !editForm.lastName) {
      alert("Please fill in First Name and Last Name.");
      return;
    }

    const fatherFull = `${editForm.fatherLastName || ''}, ${editForm.fatherFirstName || ''} ${editForm.fatherMiddleName || ''}`.trim();
    const motherFull = `${editForm.motherLastName || ''}, ${editForm.motherFirstName || ''} ${editForm.motherMiddleName || ''}`.trim();

    const newRecord: LearnerRecord = {
      ...(editForm as LearnerRecord),
      id: editForm.id || `ALS-RF-${Date.now()}`,
      name: `${editForm.firstName || ''} ${editForm.middleName ? editForm.middleName[0] + '. ' : ''}${editForm.lastName || ''}`.trim(),
      fatherName: fatherFull || 'Unknown Father',
      motherName: motherFull || 'Unknown Mother',
      contact: editForm.contactNumber || 'N/A',
      reasonsForNotAttending: editForm.reasonsForNotAttending || 'N/A'
    };

    onAddLearner(newRecord);
    setIsModalOpen(false);
  };

  // Handle Master Enrollment List Printing
  const handlePrint = () => {
    const listToPrint = filteredLearners.length > 0 ? filteredLearners : learners;
    const maleCount = listToPrint.filter(l => (l.sex || l.gender || '').toLowerCase() === 'male').length;
    const femaleCount = listToPrint.filter(l => (l.sex || l.gender || '').toLowerCase() === 'female').length;

    const teacherName = (selectedTeacher && selectedTeacher !== 'All')
      ? selectedTeacher
      : (listToPrint.find(l => l.teacher && l.teacher !== '—' && l.teacher.trim() !== '')?.teacher || (listToPrint[0] as any)?.teacher || 'ALS TEACHER');

    const depedLogoUrl = "https://lh3.googleusercontent.com/d/16PpvyVKWmD0yRY2dYB4KJb_O4XYNScqc";
    const alsLogoUrl = "https://lh3.googleusercontent.com/d/1ejc20VJNmBbf5mJQeY68t0H-Z1XWa-6g";

    const rowsHtml = listToPrint.map((l, idx) => {
      const row = l.original ? l : {
        ...l,
        original: l,
        no: idx + 1,
        lastName: l.lastName || l.name?.split(' ').slice(-1)[0] || '',
        firstName: l.firstName || l.name?.split(' ')[0] || '',
        middleName: l.middleName || l.name?.split(' ').slice(1, -1).join(' ') || '',
        nameExtension: l.nameExtension || '',
        birthdate: l.dateOfBirth || l.birthdate || '',
        age: l.age || 0,
        sex: l.gender || l.sex || 'Male',
        communityLearningCenter: l.clcName || l.communityLearningCenter || selectedClc,
        clcCode: l.clcCode || getClcCode(l.clcName || l.communityLearningCenter || selectedClc) || '—',
        teacher: l.teacher || '—',
        preferredModalities: (l as any).preferredModalities || [],
        district: l.district || 'CENTRAL DISTRICT'
      };

      const firstAtt = row.original.dateOfFirstAttendance || row.original.enrollmentDate || '2025-06-02';
      const program = row.original.programEnrolled || row.original.typeOfProgram || 'Basic Literacy Program';
      const modality = row.original.actualModality || (Array.isArray(row.preferredModalities) && row.preferredModalities.length > 0 ? row.preferredModalities.join(', ') : 'Face-to-Face');

      const nameParts = [row.lastName, row.firstName, row.middleName].filter(Boolean).join(', ');
      const fullNameDisplay = row.nameExtension && row.nameExtension !== '—' ? `${nameParts}, ${row.nameExtension}` : nameParts;

      return `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="font-family: monospace; text-align: center; font-weight: bold;">${row.original.recordNumber || row.original.lrn || row.id}</td>
          <td style="font-weight: bold; text-transform: uppercase;">${fullNameDisplay || '—'}</td>
          <td style="text-align: center;">${row.sex || '—'}</td>
          <td style="text-align: center; font-family: monospace;">${row.birthdate || '—'}</td>
          <td style="text-align: center; font-weight: bold;">${row.age || '—'}</td>
          <td style="text-align: center; font-family: monospace;">${firstAtt}</td>
          <td style="font-weight: 600;">${program}</td>
          <td>${modality}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ALS Enrollment Masterlist - Tarlac City Division</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: Arial, sans-serif; color: #1e293b; padding: 12px; font-size: 10px; line-height: 1.4; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            .title-section { text-align: center; }
            .title-section h1 { font-size: 14px; margin: 0 0 2px 0; color: #0f172a; text-transform: uppercase; font-weight: bold; }
            .title-section h2 { font-size: 12px; margin: 0 0 2px 0; color: #334155; font-weight: bold; }
            .title-section h3 { font-size: 13px; margin: 0 0 2px 0; color: #002b6d; text-transform: uppercase; font-weight: 900; }
            .title-section p { font-size: 10px; margin: 0; color: #475569; font-weight: 600; }
            .meta-bar { display: flex; justify-content: space-between; font-size: 10px; color: #334155; border-bottom: 2px solid #002b6d; padding-bottom: 6px; margin-bottom: 12px; font-weight: 600; }
            table.data-table { width: 100%; border-collapse: collapse; font-size: 10px; page-break-inside: auto; border: 1px solid #94a3b8; }
            table.data-table tr { page-break-inside: avoid; page-break-after: auto; }
            table.data-table th { background-color: #002b6d !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-weight: bold; text-transform: uppercase; border: 1px solid #64748b; padding: 6px 8px; font-size: 9px; text-align: center; }
            table.data-table td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: middle; }
            table.data-table tr:nth-child(even) { background-color: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .signature-section { margin-top: 25px; width: 100%; page-break-inside: avoid; }
            .footer { margin-top: 20px; font-size: 8px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td style="width: 12%; text-align: left;">
                <img src="${depedLogoUrl}" alt="Logo" style="height: 55px; width: auto; max-width: 80px; object-fit: contain;" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Department_of_Education_%28DepEd%29.svg/1200px-Department_of_Education_%28DepEd%29.svg.png';" />
              </td>
              <td class="title-section">
                <h1>Republic of the Philippines</h1>
                <h2>Department of Education</h2>
                <h2>REGION III - CENTRAL LUZON</h2>
                <h3>TARLAC CITY SCHOOLS DIVISION</h3>
                <p>ALTERNATIVE LEARNING SYSTEM (ALS) ENROLLMENT MASTERLIST</p>
              </td>
              <td style="width: 12%; text-align: right;">
                <img src="${alsLogoUrl}" alt="ALS Logo" style="height: 55px; width: auto; max-width: 80px; object-fit: contain; float: right;" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='https://raw.githubusercontent.com/google/material-design-icons/master/png/social/school/materialiconstwotone/24px/2x/baseline_school_twotone_black_24dp.png';" />
              </td>
            </tr>
          </table>

          <div class="meta-bar">
            <div>
              <strong>CLC:</strong> ${selectedClc} &nbsp;|&nbsp; 
              <strong>Assigned Teacher:</strong> ${selectedTeacher}
            </div>
            <div>
              <strong>Total Records:</strong> ${listToPrint.length} (Male: ${maleCount}, Female: ${femaleCount}) &nbsp;|&nbsp;
              <strong>Date Printed:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 35px;">NO.</th>
                <th>LEARNER REFERENCE NUMBER</th>
                <th>NAME<br/><span style="font-size: 7.5px; font-weight: normal; text-transform: none; display: block; margin-top: 1px;">(Lastname, Firstname, Middlename, Ext)</span></th>
                <th style="width: 50px;">SEX</th>
                <th style="width: 80px;">BIRTHDATE</th>
                <th style="width: 40px;">AGE</th>
                <th style="width: 100px;">DATE OF FIRST ATTENDANCE</th>
                <th>TYPE OF PROGRAM</th>
                <th>ACTUAL MODALITY</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <table class="signature-section" style="width: 100%; border-collapse: collapse; margin-top: 25px;">
            <tr>
              <td style="width: 50%; vertical-align: top;">
                <p style="margin: 0 0 30px 0; font-size: 9px; font-weight: bold; text-transform: uppercase;">PREPARED BY:</p>
                <p style="margin: 0; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #0f172a;">${teacherName}</p>
                <p style="margin: 2px 0 0 0; font-size: 9px; color: #475569; text-transform: uppercase;">ALS TEACHER</p>
              </td>
              <td style="width: 50%; vertical-align: top; padding-left: 7.5cm;">
                <p style="margin: 0 0 30px 0; font-size: 9px; font-weight: bold; text-transform: uppercase;">CHECKED BY:</p>
                <p style="margin: 0; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #0f172a; white-space: nowrap;">ELMER V. FABROS</p>
                <p style="margin: 2px 0 0 0; font-size: 9px; color: #475569; text-transform: uppercase; white-space: nowrap;">EDUCATION PROGRAM SPECIALIST II</p>
              </td>
            </tr>
          </table>

          <div class="footer">
            Official Record — Schools Division Office of Tarlac City • Alternative Learning System (ALS) Enrollment Registry
          </div>
        </body>
      </html>
    `;

    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 300);
        };
        setTimeout(() => {
          try {
            printWindow.print();
          } catch (e) {
            // ignore
          }
        }, 800);
        return;
      }
    } catch (e) {
      console.warn('Popup print window failed, falling back to direct window.print()', e);
    }

    // Direct fallback if popup window was blocked
    window.print();
  };

  // Fetch from Google Sheet Functionality (Enrollment_AF2)
  const handleFetchFromGoogleSheet = async () => {
    setIsFetchingFromSheet(true);
    try {
      const activeTab = selectedClc !== 'All' ? selectedClc : 'All';
      const response = await fetch(`/api/sheets/fetch-enrolment-af2?tabName=${encodeURIComponent(activeTab)}&_=${Date.now()}`, {
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}
      });
      const result = await response.json();

      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        const { mapSheetRowToLearner } = await import('../utils/sheetsSync');
        const fetchedLearners: LearnerRecord[] = [];

        result.data.forEach((item: any, i: number) => {
          if (item.row && Array.isArray(item.row)) {
            try {
              const learner = mapSheetRowToLearner(item.row, i + 1);
              if (item.sheetName) {
                learner.communityLearningCenter = item.sheetName;
                learner.clcName = item.sheetName;
              }
              if (learner.firstName || learner.lastName) {
                fetchedLearners.push(learner);
              }
            } catch (err) {
              console.warn(`[AF2 Parse Error] Row ${i + 1}:`, err);
            }
          }
        });

        if (fetchedLearners.length > 0) {
          if (onSyncGoogleSheets) {
            onSyncGoogleSheets(fetchedLearners);
          }
          setToastMessage({
            text: `Successfully fetched ${fetchedLearners.length} records from Google Sheet Enrollment_AF2!`,
            type: "success"
          });
        } else {
          setToastMessage({
            text: "No valid learner records found in Google Sheet.",
            type: "error"
          });
        }
      } else {
        setToastMessage({
          text: `Fetch Failed: ${result.error || "No data returned from Google Sheet"}`,
          type: "error"
        });
      }
    } catch (err: any) {
      console.error("[Fetch AF2 Error]", err);
      setToastMessage({
        text: `Fetch Error: ${err.message || String(err)}`,
        type: "error"
      });
    } finally {
      setIsFetchingFromSheet(false);
    }
  };

  // Save to Google Sheet Functionality
  const handleSaveToGoogleSheet = async () => {
    setIsSavingToSheet(true);
    try {
      const headers = SHEET_COLUMNS;
      const rows = filteredLearners.map((row, idx) => mapLearnerToSheetRow(row.original, idx + 1));
      const targetTab = customSpreadsheetId ? 'Sheet1' : (selectedClc !== 'All' ? selectedClc : 'BUROT CLC');

      const bodyData = {
        spreadsheetId: customSpreadsheetId || '1PeADwiI7RtOKmcthX7EM9vmMnn5hVMrgw1Ng_bfyBmA',
        tabName: targetTab,
        rows: [headers, ...rows]
      };

      const response = await fetch('/api/sheets/save-all-enrolments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify(bodyData)
      });

      const data = await response.json();
      if (data.success) {
        setToastMessage({ text: data.message || "Successfully saved all records to Google Sheets!", type: "success" });
      } else {
        setToastMessage({ text: `Google Sheet Sync Failed: ${data.error || "Unknown error"}`, type: "error" });
      }
    } catch (err: any) {
      console.error(err);
      setToastMessage({ text: `Save Failed: ${err.message || err}`, type: "error" });
    } finally {
      setIsSavingToSheet(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-205 shadow-xs overflow-hidden h-full flex flex-col p-6 gap-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5 uppercase tracking-wide">
            <span className="p-1.5 bg-[#002B6D] text-white rounded-lg block">
              <Download className="w-5 h-5" />
            </span>
            Data on Enrollment Portal
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Consolidated master sheet representing comprehensive demographics, familial mapping profiles, physical accessibility vectors, and designated Community Learning Centers.
          </p>
        </div>

        <div className="flex gap-2.5 shrink-0 flex-wrap">
          {onGoToDashboard && (
            <button 
              type="button"
              onClick={onGoToDashboard}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition shadow-xs active:scale-[98%] cursor-pointer print:hidden"
            >
              <span>🔙</span>
              <span>Go to Dashboard</span>
            </button>
          )}
          <button 
            type="button"
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-xs active:scale-[98%] cursor-pointer print:hidden"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            Print
          </button>
          <button 
            type="button"
            onClick={handleFetchFromGoogleSheet}
            disabled={isFetchingFromSheet}
            className="bg-[#002B6D] hover:bg-[#001D4A] disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-xs active:scale-[98%] cursor-pointer print:hidden"
          >
            <Cloud className={`w-4 h-4 ${isFetchingFromSheet ? 'animate-spin' : ''}`} />
            {isFetchingFromSheet ? 'Fetching...' : 'Fetch from Google Sheet'}
          </button>
          <button 
            type="button"
            onClick={handleSaveToGoogleSheet}
            disabled={isSavingToSheet}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-xs active:scale-[98%] cursor-pointer print:hidden"
          >
            <Cloud className={`w-4 h-4 ${isSavingToSheet ? 'animate-spin' : ''}`} />
            {isSavingToSheet ? 'Saving...' : 'Save to Google Sheet'}
          </button>
        </div>
      </div>

      {/* Aggregate Statistics Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 bg-slate-50/75 p-4 rounded-2xl border border-slate-200/50">
        <div className="p-3 bg-white rounded-xl border border-slate-200/40 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block">Total Enrolments</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">{stats.total}</span>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200/40 text-center">
          <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wide block">Total Males</span>
          <span className="text-xl font-black text-[#002B6D] mt-1 block">{stats.male}</span>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200/40 text-center">
          <span className="text-[10px] text-pink-550 font-bold uppercase tracking-wide block">Total Females</span>
          <span className="text-xl font-black text-pink-600 mt-1 block">{stats.female}</span>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200/40 text-center">
          <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wide block">PWD Enrolled</span>
          <span className="text-xl font-black text-amber-600 mt-1 block">{stats.pwdCount}</span>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200/40 text-center">
          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide block">4Ps Beneficiaries</span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">{stats.fourPsCount}</span>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200/40 text-center">
          <span className="text-[10px] text-cyan-600 font-bold uppercase tracking-wide block">IP Communities</span>
          <span className="text-xl font-black text-cyan-700 mt-1 block">{stats.ipCount}</span>
        </div>
      </div>

      {/* Control Panels: Search, Teacher, and CLC filters */}
      <div className="flex flex-col lg:flex-row gap-3.5 max-w-full print:hidden">
        <div className="relative flex-1 min-w-[280px]">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </span>
          <input 
            type="text"
            placeholder="Search by name, barangay, clc..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl py-2.5 pl-9.5 pr-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#002B6D] focus:bg-white transition"
          />
        </div>

        <div className="w-full lg:w-48 xl:w-60">
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#002B6D] focus:bg-white transition text-slate-700"
          >
            <option value="All">All Teachers</option>
            <option value="Melody Anne B. Aquino">Melody Anne B. Aquino</option>
            <option value="Mervin C. Caldoza">Mervin C. Caldoza</option>
            <option value="Angelica G. Canlas">Angelica G. Canlas</option>
            <option value="Ranielle Paolo D. Capiendo">Ranielle Paolo D. Capiendo</option>
            <option value="Russel M. Dionisio">Russel M. Dionisio</option>
            <option value="Reynaldo M. Domingo Jr.">Reynaldo M. Domingo Jr.</option>
            <option value="Jenny I. Dueñas">Jenny I. Dueñas</option>
            <option value="Celeste R. Espinosa">Celeste R. Espinosa</option>
            <option value="Antonio B. Guban">Antonio B. Guban</option>
            <option value="Arnold T. Lumba">Arnold T. Lumba</option>
            <option value="Jennilyn D. Martinez">Jennilyn D. Martinez</option>
            <option value="Jumar M. Mendoza">Jumar M. Mendoza</option>
            <option value="Ricardo S. Morales">Ricardo S. Morales</option>
            <option value="Julius C. Pangilinan">Julius C. Pangilinan</option>
            <option value="Mariella A. Pornillosa">Mariella A. Pornillosa</option>
            <option value="Heizel B. Pucate">Heizel B. Pucate</option>
            <option value="Ramil H. Valentino">Ramil H. Valentino</option>
            <option value="Joel D. Baquing">Joel D. Baquing</option>
          </select>
        </div>

        <div className="w-full lg:w-80 xl:w-96 relative z-30">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsClcDropdownOpen(!isClcDropdownOpen)}
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl py-2.5 px-3.5 pr-10 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#002B6D] transition text-left text-slate-800 font-bold flex items-center justify-between cursor-pointer min-h-[38px] shadow-sm"
            >
              <span className="truncate">{selectedClc === 'All' ? 'All Community Learning Centers' : selectedClc}</span>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            </button>

            {isClcDropdownOpen && (
              <>
                {/* Backdrop area to close drop-down onClick outside */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => {
                    setIsClcDropdownOpen(false);
                    setClcSearchQuery('');
                  }} 
                />
                
                {/* Scrollable search suggestions element container */}
                <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 animate-fade-in flex flex-col max-h-[300px]">
                  <div className="relative mb-2 shrink-0">
                    <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                    </span>
                    <input
                      type="text"
                      className="w-full pl-8.5 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#002B6D] focus:bg-white"
                      placeholder="Search learning center..."
                      value={clcSearchQuery}
                      onChange={(e) => setClcSearchQuery(e.target.value)}
                      autoFocus
                    />
                    {clcSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setClcSearchQuery('')}
                        className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 p-1 rounded-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  
                  <div className="overflow-y-auto grow space-y-0.5 max-h-56">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClc('All');
                        setIsClcDropdownOpen(false);
                        setClcSearchQuery('');
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                        selectedClc === 'All'
                          ? 'bg-[#E3EDFA] text-[#002B6D]'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>All Community Learning Centers</span>
                      {selectedClc === 'All' && <Check className="w-3.5 h-3.5" />}
                    </button>
                    
                    {COMMUNITY_LEARNING_CENTERS
                      .filter(clc => clc.toLowerCase().includes(clcSearchQuery.toLowerCase()))
                      .map(clc => {
                        const isSelected = selectedClc.trim().toLowerCase() === clc.trim().toLowerCase();
                        return (
                          <button
                            key={clc}
                            type="button"
                            onClick={() => {
                              setSelectedClc(clc);
                              setIsClcDropdownOpen(false);
                              setClcSearchQuery('');
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                              isSelected
                                ? 'bg-[#E3EDFA] text-[#002B6D]'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate">{clc}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#002B6D]" />}
                          </button>
                        );
                      })}
                    {COMMUNITY_LEARNING_CENTERS.filter(clc => clc.toLowerCase().includes(clcSearchQuery.toLowerCase())).length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-400 italic">
                        No matches found
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Master 57-Column Desktop Table Component (Scrollable horizontally) */}
      <div className="grow overflow-hidden flex flex-col min-h-[300px]">
        
        {/* Helper visual indicator for extreme scroll with navigation controls */}
        <div className="mb-3.5 text-[#002B6D] bg-[#E3EDFA] px-4 py-2.5 rounded-xl border border-[#002B6D]/20 text-[11px] font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs print:hidden">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#002B6D] shrink-0" />
            <span>Enrollment table possesses exactly 57 standard structured columns. Click and drag, shift-scroll, or use the navigation arrows here.</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => scrollTable('left')}
              title="Scroll Left"
              className="bg-white hover:bg-slate-100 hover:border-slate-300 border border-slate-200 text-slate-700 p-1.5 rounded-lg shadow-2xs transition active:scale-95 cursor-pointer flex items-center gap-1.5 text-[10px] px-3 font-black uppercase tracking-wider"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-[#002B6D]" /> Prev Columns
            </button>
            <button
              type="button"
              onClick={() => scrollTable('right')}
              title="Scroll Right"
              className="bg-[#002B6D] hover:bg-[#001e4d] text-white p-1.5 rounded-lg shadow-2xs transition active:scale-95 cursor-pointer flex items-center gap-1.5 text-[10px] px-3 font-black uppercase tracking-wider"
            >
              Next Columns <ChevronRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>

        <div 
          ref={tableContainerRef}
          className="grow overflow-auto border border-slate-200 rounded-2xl relative scrollbar-thin scrollbar-thumb-slate-250 scrollbar-track-transparent"
        >
          <table className="min-w-[7200px] border-collapse text-left relative bg-white">
            <thead className="sticky top-0 z-10 bg-slate-900 text-white text-[10px] tracking-wider uppercase font-extrabold select-none">
              <tr>
                {/* 58 Structured Column Headers */}
                <th className="px-3 py-3.5 border-r border-slate-800 text-center sticky left-0 z-20 bg-slate-950 min-w-[130px]">
                  {onGoToDashboard ? (
                    <button type="button" onClick={onGoToDashboard} className="hover:underline text-amber-400 font-extrabold cursor-pointer flex items-center justify-center gap-1 mx-auto text-[10px]">
                      🔙 GO TO DASHBOARD
                    </button>
                  ) : (
                    <span>🔙 GO TO DASHBOARD</span>
                  )}
                </th>
                <th className="px-4 py-3.5 border-r border-slate-800 sticky left-[130px] z-20 bg-slate-950 min-w-[240px]">COMMUNITY LEARNING CENTER</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[150px]">COMMUNITY LEARNING CENTER CODE</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[140px]">DISTRICT</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[180px]">TEACHER</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[160px]">DATE OF FIRST ATTENDANCE</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[160px]">TYPE OF PROGRAM</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[160px]">ACTUAL MODALITY</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[180px]">LEARNER REFERENCE NUMBER</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[200px]">NAME</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[140px]">LAST NAME</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[140px]">FIRST NAME</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[140px]">MIDDLE NAME</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[110px]">EXTENSION NAME</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[140px]">CONTACT NUMBER</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[110px]">BIRTHDATE</th>
                <th className="px-3 py-3.5 border-r border-slate-800 text-center min-w-[70px]">AGE</th>
                <th className="px-3 py-3.5 border-r border-slate-800 text-center min-w-[80px]">SEX</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[150px]">PLACE OF BIRTH</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[130px]">RELIGION</th>
                <th className="px-4 py-3.5 border-r border-slate-800 text-center min-w-[80px]">IP</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[130px]">MOTHER TONGUE</th>
                <th className="px-4 py-3.5 border-r border-slate-800 text-center min-w-[130px]">4P's BENEFICIARY</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[140px]">4PS HOUSEHOLD ID</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[125px]">CIVIL STATUS</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[100px]">HOUSE NO.</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[180px]">SITIO/STREET NAME</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[140px]">BARANGAY</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[150px]">MUNICIPALITY/CITY</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[130px]">PROVINCE</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[120px]">COUNTRY</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[90px]">ZIP CODE</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[150px]">LAST NAME (FATHER)</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[150px]">FIRST NAME (FATHER)</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[150px]">MIDDLE NAME (FATHER)</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[150px]">OCCUPATION (FATHER)</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[150px]">LAST NAME (MOTHER)</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[150px]">FIRST NAME (MOTHER)</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[150px]">MIDDLE NAME (MOTHER)</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[150px]">OCCUPATION (MOTHER)</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[150px]">LAST NAME (GUARDIAN)</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[150px]">FIRST NAME (GUARDIAN)</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[150px]">MIDDLE NAME (GUARDIAN)</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[150px]">OCCUPATION (GUARDIAN)</th>
                <th className="px-4 py-3.5 border-r border-slate-800 text-center min-w-[80px]">PWD</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[180px]">TYPE OF DISABILITY</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[120px]">PWD ID</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[200px]">LAST GRADE LEVEL COMPLETED</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[280px]">WHY DID YOU NOT ATTEND/COMPLETE SCHOOLING</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[220px]">HAVE YOU ATTENDED ALS LEARNING SESSIONS BEFORE?</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[200px]">IF YES, CHECK THE APPROPRIATE PROGRAM</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[180px]">HAVE YOU COMPLETED THE PROGRAM?</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[220px]">1. HOW FAR IS YOUR HOME TO YOUR LEARNING CENTER?</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[240px]">2. HOW DO YOU GET FROM YOUR HOME TO YOUR LEARNING CENTER?</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[260px]">3. PLEASE PROVIDE THE SPECIFIC DAY AND TIME YOU CAN BE AT YOUR LEARNING CENTER: (DAYS)</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[260px]">3. PLEASE PROVIDE THE SPECIFIC DAY AND TIME YOU CAN BE AT YOUR LEARNING CENTER: (TIME)</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[300px]">IF THE SCHOOL WILL IMPLEMENT OTHER DISTANCE LEARNING MODALITIES ASIDE FROM FACE-TO-FACE INSTRUCTION, WHAT WOULD YOU PREFER FOR THE LEARNER:</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[260px]">BIRTH CERTIFICATE LINK (PDF, IMAGE)</th>
                <th className="px-4 py-3.5 min-w-[130px] text-center bg-slate-950 sticky right-0 z-20 font-bold border-l border-slate-800 print:hidden">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px] font-medium text-slate-700">
              {filteredLearners.length === 0 ? (
                <tr>
                  <td colSpan={59} className="py-20 text-center text-slate-400 font-bold leading-relaxed text-sm">
                    No matching registry records discovered in current filter parameters.
                  </td>
                </tr>
              ) : (
                filteredLearners.map((row, index) => {
                  const daysList = Object.entries(row.clcDaysAvailability || {}).filter(([_, val]) => !!val);
                  const daysVal = daysList.map(([day]) => day).join(', ') || '—';
                  const timesVal = daysList.map(([day, val]) => `${day}: ${val}`).join(', ') || '—';
                  const fullName = `${row.lastName || ''}, ${row.firstName || ''} ${row.middleName ? row.middleName[0] + '.' : ''}`.trim();
                  const firstAtt = row.original.dateOfFirstAttendance || row.original.enrollmentDate || '2025-06-02';
                  const program = row.original.programEnrolled || row.original.typeOfProgram || 'Basic Literacy Program';
                  const modality = row.original.actualModality || (Array.isArray(row.preferredModalities) && row.preferredModalities.length > 0 ? row.preferredModalities.join(', ') : 'Face-to-Face');
                  const placeOfBirth = row.original.placeOfBirth || row.original.birthplace || 'Tarlac City';
                  const contactNo = row.original.contactNumber || row.original.contact || (row as any).contactNumber || '—';

                  return (
                    <tr key={`${row.id || 'row'}-${index}`} className="hover:bg-[#F3F8FC]/50 transition border-b border-l border-r border-slate-200">
                      <td className="px-3 py-2 border-r border-slate-200 text-center sticky left-0 z-10 bg-slate-50 font-bold font-mono">
                        {onGoToDashboard ? (
                          <button type="button" onClick={onGoToDashboard} title="Go to Dashboard" className="text-amber-600 hover:underline font-extrabold flex items-center justify-center gap-1 mx-auto">
                            {index + 1}
                          </button>
                        ) : (
                          index + 1
                        )}
                      </td>
                      <td className="px-4 py-2 border-r border-slate-200 sticky left-[130px] z-10 bg-slate-50 font-black text-[#002B6D] uppercase">{row.communityLearningCenter}</td>
                      <td className="px-4 py-2 border-r border-slate-200 font-mono font-bold text-slate-600">{row.clcCode}</td>
                      <td className="px-4 py-2 border-r border-slate-200 font-bold text-slate-800 uppercase">{row.district}</td>
                      <td className="px-4 py-2 border-r border-slate-200 font-bold text-slate-800">{row.teacher}</td>
                      <td className="px-4 py-2 border-r border-slate-200 font-mono text-slate-600">{firstAtt}</td>
                      <td className="px-4 py-2 border-r border-slate-200 font-semibold text-slate-800">{program}</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-slate-700">{modality}</td>
                      <td className="px-4 py-2 border-r border-slate-200 font-mono text-slate-600">{row.original.recordNumber || row.id}</td>
                      <td className="px-4 py-2 border-r border-slate-200 font-black text-slate-950 uppercase">{fullName}</td>
                      <td className="px-4 py-2 border-r border-slate-200 font-black text-slate-950 uppercase">{row.lastName}</td>
                      <td className="px-4 py-2 border-r border-slate-200 font-black text-slate-950 uppercase">{row.firstName}</td>
                      <td className="px-4 py-2 border-r border-slate-200 uppercase">{row.middleName || '—'}</td>
                      <td className="px-4 py-2 border-r border-slate-200 font-bold uppercase">{row.nameExtension || '—'}</td>
                      <td className="px-4 py-2 border-r border-slate-200 font-mono text-slate-600">{contactNo}</td>
                      <td className="px-4 py-2 border-r border-slate-200 font-mono text-slate-600">{row.birthdate}</td>
                      <td className="px-3 py-2 border-r border-slate-200 text-center font-bold font-mono">{row.age}</td>
                      <td className="px-3 py-2 border-r border-slate-200 text-center font-bold text-slate-800">{row.sex}</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-slate-800">{placeOfBirth}</td>
                      <td className="px-4 py-2 border-r border-slate-200">{row.religion}</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${row.ip === 'Yes' ? 'bg-[#E0F7FA] text-[#00838F]' : 'bg-slate-100/50 text-slate-400'}`}>
                          {row.ip}
                        </span>
                      </td>
                      <td className="px-4 py-2 border-r border-slate-200">{row.motherTongue}</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${row.fourPs === 'Yes' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-slate-100/50 text-slate-400'}`}>
                          {row.fourPs}
                        </span>
                      </td>
                      <td className="px-4 py-2 border-r border-slate-200 font-mono text-slate-600">{row.householdId || '—'}</td>
                      <td className="px-4 py-2 border-r border-slate-200">{row.civilStatus}</td>
                      <td className="px-4 py-2 border-r border-slate-200">{row.houseNo || '—'}</td>
                      <td className="px-4 py-2 border-r border-slate-200 uppercase">{row.sitioStreet || '—'}</td>
                      <td className="px-4 py-2 border-r border-slate-200">{row.barangay}</td>
                      <td className="px-4 py-2 border-r border-slate-200">{row.municipalityCity}</td>
                      <td className="px-4 py-2 border-r border-slate-200">{row.province}</td>
                      <td className="px-4 py-2 border-r border-slate-200">{row.country}</td>
                      <td className="px-4 py-2 border-r border-slate-200 font-mono">{row.zipCode}</td>
                      
                      {/* Father Columns */}
                      <td className="px-4 py-2 border-r border-slate-200 uppercase">{row.fatherLastName || '—'}</td>
                      <td className="px-4 py-2 border-r border-slate-200 uppercase">{row.fatherFirstName || '—'}</td>
                      <td className="px-4 py-2 border-r border-slate-200 uppercase">{row.fatherMiddleName || '—'}</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-slate-600">{row.fatherOccupation || '—'}</td>
                      
                      {/* Mother Columns */}
                      <td className="px-4 py-2 border-r border-slate-200 uppercase">{row.motherLastName || '—'}</td>
                      <td className="px-4 py-2 border-r border-slate-200 uppercase">{row.motherFirstName || '—'}</td>
                      <td className="px-4 py-2 border-r border-slate-200 uppercase">{row.motherMiddleName || '—'}</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-slate-600">{row.motherOccupation || '—'}</td>
                      
                      {/* Guardian Columns */}
                      <td className="px-4 py-2 border-r border-slate-200 uppercase">{row.guardianLastName || '—'}</td>
                      <td className="px-4 py-2 border-r border-slate-200 uppercase">{row.guardianFirstName || '—'}</td>
                      <td className="px-4 py-2 border-r border-slate-200 uppercase">{row.guardianMiddleName || '—'}</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-slate-600">{row.guardianOccupation || '—'}</td>

                      {/* PWD Columns */}
                      <td className="px-4 py-2 border-r border-slate-200 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${row.pwd === 'Yes' ? 'bg-[#FFF3E0] text-[#E65100]' : 'bg-slate-100/50 text-slate-400'}`}>
                          {row.pwd}
                        </span>
                      </td>
                      <td className="px-4 py-2 border-r border-slate-200 text-slate-600">{row.disability || '—'}</td>
                      <td className="px-4 py-2 border-r border-slate-200 font-mono">{row.pwdID || '—'}</td>
                      
                      {/* Education and CLC */}
                      <td className="px-4 py-2 border-r border-slate-200 font-bold text-slate-800">{row.lastGradeCompleted}</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-slate-600">{row.whyNotAttend || '—'}</td>
                      
                      {/* Attendance status */}
                      <td className="px-4 py-2 border-r border-slate-200 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${row.attendedALSBef === 'Yes' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100/50 text-slate-400'}`}>
                          {row.attendedALSBef}
                        </span>
                      </td>
                      <td className="px-4 py-2 border-r border-slate-200 text-slate-600">{(row.original as any).attendedALSBefPrg || row.original.preferredProgram || '—'}</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${row.completedALSBef === 'Yes' ? 'bg-[#E3EDFA] text-[#002B6D]' : 'bg-slate-100/50 text-slate-400'}`}>
                          {row.completedALSBef}
                        </span>
                      </td>

                      {/* Accessibility questions */}
                      <td className="px-4 py-2 border-r border-slate-200 text-slate-600 font-mono">{row.clcDistanceKms ? `${row.clcDistanceKms} kms` : '—'}</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-slate-600">{row.howGetToClc || 'Walking'}</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-slate-600 text-xs truncate max-w-[200px]" title={daysVal}>{daysVal}</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-slate-600 text-xs truncate max-w-[200px]" title={timesVal}>{timesVal}</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-slate-600 text-xs truncate max-w-[200px]" title={Array.isArray(row.preferredModalities) ? row.preferredModalities.join(', ') : '—'}>
                        {Array.isArray(row.preferredModalities) && row.preferredModalities.length > 0 ? row.preferredModalities.join(', ') : '—'}
                      </td>
                      <td className="px-4 py-2 border-r border-slate-200 text-slate-600 text-[11px] truncate max-w-[250px]">
                        {row.original.birthCertificateLink ? (
                          row.original.birthCertificateLink.startsWith('http') ? (
                            <a 
                              href={row.original.birthCertificateLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[#002B6D] hover:underline font-bold flex items-center gap-1"
                            >
                              <span>View File</span>
                            </a>
                          ) : (
                            <span>{row.original.birthCertificateLink}</span>
                          )
                        ) : (
                          <span>{row.lastGradeCompleted ? getRemarksForGrade(row.lastGradeCompleted) : '—'}</span>
                        )}
                      </td>

                      {/* Quick Row Actions Stickied on Right */}
                      <td className="px-4 py-2 text-center bg-white sticky right-0 z-10 border-l border-slate-200 flex items-center justify-center gap-2 print:hidden">
                        <button 
                          type="button"
                          onClick={() => handleOpenView(row)}
                          title="View Full Profile Details"
                          className="p-1.5 text-[#002B6D] hover:bg-slate-100 rounded-md transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button 
                          type="button"
                          onClick={() => handleStartEdit(row)}
                          title="Edit Row Data"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button 
                          type="button"
                          onClick={() => {
                            setDeleteConfirmationId(row.id);
                            setDeleteConfirmationName(`${row.firstName || ''} ${row.lastName || ''}`);
                          }}
                          title="Delete Record"
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Edit / Add View Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-55 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-slate-900 text-white flex justify-between items-center sticky top-0 z-10">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">
                  {modalMode === 'add' ? 'Admit Learner Profile (Form AF-2)' : modalMode === 'edit' ? 'Modify Registry Record' : 'Learner Comprehensive Ledger Info'}
                </h3>
                <p className="text-[10px] text-slate-300 mt-0.5">
                  ID: {editForm.id || 'NEW'} | LRN (Record Number): {editForm.recordNumber || 'N/A'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* PAGE 1: Personal Information */}
              <div>
                <h4 className="border-b border-slate-100 pb-2 text-[11px] font-black text-[#002B6D] uppercase tracking-wider mb-4">
                  1. Learner Personal Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">LAST NAME</label>
                    <input 
                      type="text"
                      disabled={modalMode === 'view'}
                      value={editForm.lastName || ''}
                      onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100 uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">FIRST NAME</label>
                    <input 
                      type="text"
                      disabled={modalMode === 'view'}
                      value={editForm.firstName || ''}
                      onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100 uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">MIDDLE NAME</label>
                    <input 
                      type="text"
                      disabled={modalMode === 'view'}
                      value={editForm.middleName || ''}
                      onChange={(e) => setEditForm({...editForm, middleName: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100 uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">NAME EXTENSION</label>
                    <input 
                      type="text"
                      disabled={modalMode === 'view'}
                      placeholder="Jr., III, etc."
                      value={editForm.nameExtension || ''}
                      onChange={(e) => setEditForm({...editForm, nameExtension: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100 uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">BIRTHDATE</label>
                    <input 
                      type="date"
                      disabled={modalMode === 'view'}
                      value={editForm.dateOfBirth || ''}
                      onChange={(e) => setEditForm({...editForm, dateOfBirth: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">AGE</label>
                    <input 
                      type="number"
                      disabled={modalMode === 'view'}
                      value={editForm.age || ''}
                      onChange={(e) => setEditForm({...editForm, age: parseInt(e.target.value) || 0})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">SEX</label>
                    <select 
                      disabled={modalMode === 'view'}
                      value={editForm.gender || 'Male'}
                      onChange={(e) => setEditForm({...editForm, gender: e.target.value as 'Male' | 'Female'})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">CONTACT NUMBER</label>
                    <input 
                      type="text"
                      disabled={modalMode === 'view'}
                      value={editForm.contactNumber || editForm.contact || ''}
                      onChange={(e) => setEditForm({...editForm, contactNumber: e.target.value, contact: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">RELIGION</label>
                    <input 
                      type="text"
                      disabled={modalMode === 'view'}
                      value={editForm.religion || ''}
                      onChange={(e) => setEditForm({...editForm, religion: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">MOTHER TONGUE</label>
                    <input 
                      type="text"
                      disabled={modalMode === 'view'}
                      value={editForm.motherTongue || ''}
                      onChange={(e) => setEditForm({...editForm, motherTongue: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">IS IP BENEFICIARY?</label>
                    <select 
                      disabled={modalMode === 'view'}
                      value={editForm.indigenousPeople === 'Yes' || (editForm.indigenousPeople && editForm.indigenousPeople !== 'No') ? 'Yes' : 'No'}
                      onChange={(e) => setEditForm({...editForm, indigenousPeople: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100"
                    >
                      <option value="No">No (Non-IP)</option>
                      <option value="Yes">Yes (IP Member)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">CIVIL STATUS</label>
                    <select 
                      disabled={modalMode === 'view'}
                      value={editForm.civilStatus || 'Single'}
                      onChange={(e) => setEditForm({...editForm, civilStatus: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widow/er">Widow/er</option>
                      <option value="Separated">Separated</option>
                      <option value="Solo Parent">Solo Parent</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ADDRESS DETAILS */}
              <div>
                <h4 className="border-b border-slate-100 pb-2 text-[11px] font-black text-[#002B6D] uppercase tracking-wider mb-4">
                  2. Addresses & Demographic Geographics
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">HOUSE NO.</label>
                    <input 
                      type="text"
                      disabled={modalMode === 'view'}
                      value={editForm.houseNo || ''}
                      onChange={(e) => setEditForm({...editForm, houseNo: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">SITIO / STREET NAME</label>
                    <input 
                      type="text"
                      disabled={modalMode === 'view'}
                      value={editForm.street || ''}
                      onChange={(e) => setEditForm({...editForm, street: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">BARANGAY</label>
                    <input 
                      type="text"
                      disabled={modalMode === 'view'}
                      value={editForm.barangay || ''}
                      onChange={(e) => setEditForm({...editForm, barangay: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">MUNICIPALITY/CITY</label>
                    <input 
                      type="text"
                      disabled={modalMode === 'view'}
                      value={editForm.city || 'Tarlac City'}
                      onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">PROVINCE</label>
                    <input 
                      type="text"
                      disabled={modalMode === 'view'}
                      value={editForm.province || 'Tarlac'}
                      onChange={(e) => setEditForm({...editForm, province: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* 4Ps BENEFICIARY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-xl border border-slate-200/50">
                <div>
                  <label className="text-[10px] font-black text-[#002B6D] block mb-1.5 uppercase">Is 4Ps Beneficiary?</label>
                  <select 
                    disabled={modalMode === 'view'}
                    value={editForm.is4Ps || 'No'}
                    onChange={(e) => setEditForm({...editForm, is4Ps: e.target.value as 'Yes' | 'No'})}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100"
                  >
                    <option value="No">No (Non-4Ps)</option>
                    <option value="Yes">Yes (4Ps Beneficiary Household)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#002B6D] block mb-1.5 uppercase">Household ID Number (if 4Ps)</label>
                  <input 
                    type="text"
                    disabled={modalMode === 'view' || editForm.is4Ps !== 'Yes'}
                    placeholder="14-digit Alphanumeric ID"
                    value={editForm.householdId || ''}
                    onChange={(e) => setEditForm({...editForm, householdId: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* PARENTS INFORMATION */}
              <div>
                <h4 className="border-b border-slate-100 pb-2 text-[11px] font-black text-[#002B6D] uppercase tracking-wider mb-4">
                  3. Parents & Guardian Details
                </h4>
                
                {/* Father Detail Blocks */}
                <div className="bg-sky-50/15 border border-sky-100 p-4 rounded-xl mb-4 space-y-3">
                  <span className="text-[10px] font-extrabold text-[#002B6D] block relative mb-1.5 uppercase">Father Details</span>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-1">LAST NAME</label>
                      <input 
                        type="text"
                        disabled={modalMode === 'view'}
                        value={editForm.fatherLastName || ''}
                        onChange={(e) => setEditForm({...editForm, fatherLastName: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100 uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-1">FIRST NAME</label>
                      <input 
                        type="text"
                        disabled={modalMode === 'view'}
                        value={editForm.fatherFirstName || ''}
                        onChange={(e) => setEditForm({...editForm, fatherFirstName: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100 uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-1">MIDDLE NAME</label>
                      <input 
                        type="text"
                        disabled={modalMode === 'view'}
                        value={editForm.fatherMiddleName || ''}
                        onChange={(e) => setEditForm({...editForm, fatherMiddleName: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100 uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-1">OCCUPATION</label>
                      <input 
                        type="text"
                        disabled={modalMode === 'view'}
                        value={editForm.fatherOccupation || ''}
                        onChange={(e) => setEditForm({...editForm, fatherOccupation: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Mother Detail Blocks */}
                <div className="bg-pink-50/15 border border-pink-100 p-4 rounded-xl mb-4 space-y-3">
                  <span className="text-[10px] font-extrabold text-pink-600 block relative mb-1.5 uppercase">Mother Details (Maiden Name)</span>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-1">LAST NAME</label>
                      <input 
                        type="text"
                        disabled={modalMode === 'view'}
                        value={editForm.motherLastName || ''}
                        onChange={(e) => setEditForm({...editForm, motherLastName: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100 uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-1">FIRST NAME</label>
                      <input 
                        type="text"
                        disabled={modalMode === 'view'}
                        value={editForm.motherFirstName || ''}
                        onChange={(e) => setEditForm({...editForm, motherFirstName: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100 uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-1">MIDDLE NAME</label>
                      <input 
                        type="text"
                        disabled={modalMode === 'view'}
                        value={editForm.motherMiddleName || ''}
                        onChange={(e) => setEditForm({...editForm, motherMiddleName: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100 uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-1">OCCUPATION</label>
                      <input 
                        type="text"
                        disabled={modalMode === 'view'}
                        value={editForm.motherOccupation || ''}
                        onChange={(e) => setEditForm({...editForm, motherOccupation: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Guardian Detail Blocks */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                  <span className="text-[10px] font-extrabold text-slate-700 block relative mb-1.5 uppercase font-mono">Guardian Details (If applicable)</span>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-1">LAST NAME</label>
                      <input 
                        type="text"
                        disabled={modalMode === 'view'}
                        value={editForm.guardianLastName || ''}
                        onChange={(e) => setEditForm({...editForm, guardianLastName: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100 uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-1">FIRST NAME</label>
                      <input 
                        type="text"
                        disabled={modalMode === 'view'}
                        value={editForm.guardianFirstName || ''}
                        onChange={(e) => setEditForm({...editForm, guardianFirstName: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100 uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-1">MIDDLE NAME</label>
                      <input 
                        type="text"
                        disabled={modalMode === 'view'}
                        value={editForm.guardianMiddleName || ''}
                        onChange={(e) => setEditForm({...editForm, guardianMiddleName: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100 uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-1">OCCUPATION</label>
                      <input 
                        type="text"
                        disabled={modalMode === 'view'}
                        value={editForm.guardianOccupation || ''}
                        onChange={(e) => setEditForm({...editForm, guardianOccupation: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PWD DETAILS */}
              <div className="bg-amber-50/15 border border-amber-200/50 p-4 rounded-xl space-y-4">
                <span className="text-[10px] font-extrabold text-amber-700 block relative mb-1.5 uppercase font-mono">4. PWD & Physical Accessibility Ledger</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 block mb-1">IS PWD?</label>
                    <select 
                      disabled={modalMode === 'view'}
                      value={editForm.isPWD || 'No'}
                      onChange={(e) => setEditForm({...editForm, isPWD: e.target.value as 'Yes' | 'No'})}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes (Person with Disability)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 block mb-1">SPECIFIC DISABILITY TYPE</label>
                    <input 
                      type="text"
                      disabled={modalMode === 'view' || editForm.isPWD !== 'Yes'}
                      placeholder="e.g. Visual Impairment, Hearing, etc."
                      value={Array.isArray(editForm.pwdDisabilityType) ? editForm.pwdDisabilityType?.join(', ') : (editForm.pwdDisabilityType as any || '')}
                      onChange={(e) => setEditForm({...editForm, pwdDisabilityType: e.target.value.split(',').map(s => s.trim())})}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 block mb-1">PWD ID CARD NUMBER (IF APPLICABLE)</label>
                    <input 
                      type="text"
                      disabled={modalMode === 'view' || editForm.isPWD !== 'Yes'}
                      placeholder="PWD-GTC-2025-XXXX"
                      value={editForm.pwdID || ''}
                      onChange={(e) => setEditForm({...editForm, pwdID: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* EDUCATIONAL DETAILS, PROGRAM, CLC */}
              <div>
                <h4 className="border-b border-slate-100 pb-2 text-[11px] font-black text-[#002B6D] uppercase tracking-wider mb-4">
                  5. ALS Educational Mapping and CLC Assignment
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1 font-mono">LAST GRADE COMPLETED</label>
                    <select 
                      disabled={modalMode === 'view'}
                      value={editForm.lastGradeLevelCompleted || 'Grade 6'}
                      onChange={(e) => setEditForm({...editForm, lastGradeLevelCompleted: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100"
                    >
                      <option value="No Formal Schooling">No Formal Schooling</option>
                      <option value="Grade 1">Grade 1</option>
                      <option value="Grade 2">Grade 2</option>
                      <option value="Grade 3">Grade 3</option>
                      <option value="Grade 4">Grade 4</option>
                      <option value="Grade 5">Grade 5</option>
                      <option value="Grade 6">Grade 6</option>
                      <option value="Grade 7">Grade 7</option>
                      <option value="Grade 8">Grade 8</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">LEARNING BLOCKS PROGRAM</label>
                    <select 
                      disabled={modalMode === 'view'}
                      value={editForm.program || 'A&E Secondary'}
                      onChange={(e) => setEditForm({...editForm, program: e.target.value as any})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100"
                    >
                      <option value="Basic Literacy">Basic Literacy (BLP)</option>
                      <option value="A&E Elementary">A&E Elementary (A&E)</option>
                      <option value="A&E Secondary">A&E Secondary (A&E)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">REGISTRY STATUS</label>
                    <select 
                      disabled={modalMode === 'view'}
                      value={editForm.status || 'Enrolled'}
                      onChange={(e) => setEditForm({...editForm, status: e.target.value as any})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100 font-bold"
                    >
                      <option value="Enrolled">Enrolled</option>
                      <option value="In Processing">In Processing</option>
                      <option value="Completed">Completed</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">DISTRICT UNIT OFFICE</label>
                    <select 
                      disabled={modalMode === 'view'}
                      value={editForm.district || 'District A'}
                      onChange={(e) => setEditForm({...editForm, district: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100"
                    >
                      <option value="District A">Tarlac District A</option>
                      <option value="District B">Tarlac District B</option>
                      <option value="Physical Count of Inventories">Central Hub Office</option>
                    </select>
                  </div>
                </div>

                {/* Explicit CLC overrides if desired */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase">Community Learning Center Title (Override)</label>
                    {modalMode === 'view' ? (
                      <input 
                        type="text"
                        disabled={true}
                        value={editForm.clcName || ''}
                        className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                      />
                    ) : (
                      <select
                        value={editForm.clcName || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const rCode = getClcCode(val);
                          setEditForm({
                            ...editForm,
                            clcName: val,
                            clcCode: rCode
                          });
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-[#002B6D] focus:border-[#002B6D] outline-none"
                      >
                        <option value="">-- Select Community Learning Center --</option>
                        {COMMUNITY_LEARNING_CENTERS.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase">CLC Core Registry Code (Override)</label>
                    <input 
                      type="text"
                      disabled={modalMode === 'view'}
                      placeholder="Implicitly calculated"
                      value={editForm.clcCode || ''}
                      onChange={(e) => setEditForm({...editForm, clcCode: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase">Designated Teacher (Override)</label>
                    <input 
                      type="text"
                      disabled={modalMode === 'view'}
                      placeholder="Implicit ly designated"
                      value={editForm.teacher || ''}
                      onChange={(e) => setEditForm({...editForm, teacher: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100 font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 text-xs font-bold rounded-b-3xl">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-white border border-slate-205 text-slate-500 px-4.5 py-2 hover:bg-slate-100 rounded-xl transition cursor-pointer active:scale-[98%]"
              >
                Cancel / Close
              </button>
              
              {modalMode !== 'view' && (
                <button 
                  onClick={modalMode === 'add' ? handleAddNewLearner : handleSaveModal}
                  className="bg-[#002B6D] text-white px-5 py-2 hover:bg-[#001e4d] rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-[98%]"
                >
                  <Check className="w-4 h-4" />
                  {modalMode === 'add' ? 'Admit Record' : 'Save Update'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Custom Confirmation Modal for Deletion */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden p-6 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 shrink-0">
                <Trash2 className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  Confirm Permanent Deletion
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete <strong className="text-slate-950">{deleteConfirmationName}</strong> from the Alternative Learning System (ALS) registry records?
                </p>
                <div className="mt-2.5 bg-rose-50/50 p-2.5 rounded-lg border border-rose-100 text-[10.5px] text-rose-800 leading-tight font-medium">
                  Warning: This action will completely remove this learner from your active local roster. This cannot be undone.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 text-xs font-bold mt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmationId(null);
                  setDeleteConfirmationName('');
                }}
                className="bg-white border border-slate-200 text-slate-500 px-4 py-2 hover:bg-slate-100 rounded-xl transition cursor-pointer active:scale-[98%]"
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirmationId) {
                    onDeleteLearner(deleteConfirmationId);
                    setToastMessage({
                      text: `Successfully deleted ${deleteConfirmationName}'s record from the ALS database!`,
                      type: 'success'
                    });
                    setTimeout(() => {
                      setToastMessage(null);
                    }, 4000);
                  }
                  setDeleteConfirmationId(null);
                  setDeleteConfirmationName('');
                }}
                className="bg-rose-600 text-white px-5 py-2 hover:bg-rose-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-[98%]"
              >
                <Trash2 className="w-4 h-4" />
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Success/Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-55 max-w-sm w-full animate-fade-in">
          <div className={`p-4 rounded-2xl border shadow-xl flex items-center justify-between gap-3 text-xs font-bold leading-normal ${
            toastMessage.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-rose-600 border-rose-500 text-white'
          }`}>
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-100" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-100 animate-bounce" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="hover:bg-white/15 p-1 rounded-full transition cursor-pointer"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
