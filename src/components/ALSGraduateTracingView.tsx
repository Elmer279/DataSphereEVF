import React, { useState, useEffect } from 'react';
import { safeSetJSON } from '../utils/safeStorage';
import { 
  Users, 
  TrendingUp, 
  Briefcase, 
  GraduationCap, 
  Wrench, 
  Store, 
  X, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Calendar,
  Layers,
  MapPin,
  Clock,
  User,
  Heart,
  Phone,
  Bookmark,
  Activity
} from 'lucide-react';

// Define the comprehensive 24-field interface as requested
interface GraduateRecord {
  id: string;
  timestamp: string;                  // 1. Timestamp
  yearGraduated: string;              // 2. Year Graduated
  lastName: string;                   // 3. Last Name
  firstName: string;                  // 4. First Name
  middleName: string;                 // 5. Middle Name
  address: string;                    // 6. Address
  sex: string;                        // 7. Sex
  birthdate: string;                  // 8. Birthdate (New!)
  gender: string;                     // 9. Gender
  age: string;                        // 10. Age
  address2: string;                   // 11. Address 2
  contactNumber: string;              // 12. Contact Number
  alsProgramAttended: string;         // 13. ALS Program Attended
  communityLearningCenter: string;    // 14. Community Learning Center
  addressOfCLC: string;               // 15. Address of Community Learning Center
  alsTeacher: string;                 // 16. ALS Teacher
  currentStatus: string;              // 17. Current Status
  nameOfEmployer: string;             // 18. Name of Employer
  typeOfWork: string;                 // 19. Type of Work
  typeOfBusiness: string;             // 20. Type of Business
  nameOfSchool: string;               // 21. Name of School
  course: string;                     // 22. Course
  dateOfTracingInterview: string;     // 23. Date of Tracing Interview
  methodOfTracing: string;            // 24. Method of Tracing
  conductedBy: string;                // 25. Conducted by
}

const DEFAULT_GRADUATES: GraduateRecord[] = [
  {
    id: "grad-1",
    timestamp: "2026-06-20 08:30:15",
    yearGraduated: "2023",
    lastName: "Ramos",
    firstName: "John Carlo",
    middleName: "Manaloto",
    address: "Brgy. Ligtasan, Tarlac City",
    sex: "Male",
    birthdate: "2002-05-18",
    gender: "Man",
    age: "24",
    address2: "Purok 2, Tarlac City",
    contactNumber: "0917-883-4412",
    alsProgramAttended: "A&E Secondary/Junior High School",
    communityLearningCenter: "San Vicente CLC",
    addressOfCLC: "San Vicente Barangay Hall, Tarlac City",
    alsTeacher: "Mrs. Carina Castro",
    currentStatus: "Employed",
    nameOfEmployer: "Sutherland Global Services",
    typeOfWork: "Customer Service Associate (BPO)",
    typeOfBusiness: "Business Process Outsourcing",
    nameOfSchool: "N/A",
    course: "N/A",
    dateOfTracingInterview: "2026-05-18",
    methodOfTracing: "Phone Call",
    conductedBy: "Mrs. Carina Castro"
  },
  {
    id: "grad-2",
    timestamp: "2026-06-19 14:22:05",
    yearGraduated: "2024",
    lastName: "Santos",
    firstName: "Maria Cecilia",
    middleName: "Pineda",
    address: "Brgy. Tibigan, Tarlac City",
    sex: "Female",
    birthdate: "2005-06-02",
    gender: "Woman",
    age: "21",
    address2: "Purok 1, Tarlac City",
    contactNumber: "0920-551-7890",
    alsProgramAttended: "A&E Secondary/Junior High School",
    communityLearningCenter: "Tibigan CLC",
    addressOfCLC: "Tibigan Barangay Hall, Tarlac City",
    alsTeacher: "Mr. Randy Gomez",
    currentStatus: "Enrolled in College",
    nameOfEmployer: "N/A",
    typeOfWork: "N/A",
    typeOfBusiness: "N/A",
    nameOfSchool: "Tarlac State University",
    course: "Bachelor of Science in Information Technology",
    dateOfTracingInterview: "2026-06-02",
    methodOfTracing: "Social Media Messenger",
    conductedBy: "Mr. Randy Gomez"
  },
  {
    id: "grad-3",
    timestamp: "2026-06-18 10:11:00",
    yearGraduated: "2022",
    lastName: "De Leon",
    firstName: "Rodelio",
    middleName: "Guevarra",
    address: "Brgy. Matatalaib, Tarlac City",
    sex: "Male",
    birthdate: "1998-04-20",
    gender: "Man",
    age: "28",
    address2: "Purok 4, Tarlac City",
    contactNumber: "0908-112-9956",
    alsProgramAttended: "A&E Elementary",
    communityLearningCenter: "Matatalaib CLC",
    addressOfCLC: "Matatalaib Barangay Complex, Tarlac City",
    alsTeacher: "Mrs. Evelyn Soriano",
    currentStatus: "Entrepreneurship",
    nameOfEmployer: "RD Lamination & Printing Services",
    typeOfWork: "Lead Designer / Managing Owner",
    typeOfBusiness: "Lamination & Digital Printing Services",
    nameOfSchool: "N/A",
    course: "N/A",
    dateOfTracingInterview: "2026-04-20",
    methodOfTracing: "In-Person Interview",
    conductedBy: "Mrs. Evelyn Soriano"
  },
  {
    id: "grad-4",
    timestamp: "2026-06-15 09:12:44",
    yearGraduated: "2024",
    lastName: "Pineda",
    firstName: "Angelica Joy",
    middleName: "Dizon",
    address: "Brgy. San Vicente, Tarlac City",
    sex: "Female",
    birthdate: "2003-06-15",
    gender: "Woman",
    age: "23",
    address2: "Sityo Libis, Tarlac City",
    contactNumber: "0935-776-3241",
    alsProgramAttended: "A&E Secondary/Junior High School",
    communityLearningCenter: "San Vicente CLC",
    addressOfCLC: "San Vicente Barangay Compound, Tarlac City",
    alsTeacher: "Mrs. Carina Castro",
    currentStatus: "TVET / Vocational",
    nameOfEmployer: "N/A",
    typeOfWork: "N/A",
    typeOfBusiness: "N/A",
    nameOfSchool: "TESDA Women's Center",
    course: "Bread and Pastry Production NC II",
    dateOfTracingInterview: "2026-06-15",
    methodOfTracing: "SMS Questionnaire",
    conductedBy: "Mrs. Carina Castro"
  },
  {
    id: "grad-5",
    timestamp: "2026-06-10 16:45:12",
    yearGraduated: "2023",
    lastName: "Tugade",
    firstName: "Mark Francis",
    middleName: "Corpuz",
    address: "Central District, Tarlac City",
    sex: "Male",
    birthdate: "2000-03-10",
    gender: "Man",
    age: "26",
    address2: "Sityo Centro, Tarlac City",
    contactNumber: "0949-881-2244",
    alsProgramAttended: "A&E Secondary/Junior High School",
    communityLearningCenter: "Central Hub CLC",
    addressOfCLC: "Division Annex, Tarlac City",
    alsTeacher: "Dr. Manuel De Guzman",
    currentStatus: "Employed",
    nameOfEmployer: "Tarlac Home Builders Supply",
    typeOfWork: "Lead Warehouse & Inventory Clerk",
    typeOfBusiness: "Construction Retail Supply",
    nameOfSchool: "N/A",
    course: "N/A",
    dateOfTracingInterview: "2026-03-10",
    methodOfTracing: "Social Media Messenger",
    conductedBy: "Dr. Manuel De Guzman"
  },
  {
    id: "grad-6",
    timestamp: "2026-06-05 11:15:30",
    yearGraduated: "2024",
    lastName: "Cruz",
    firstName: "Princess May",
    middleName: "Macapagal",
    address: "Brgy. Ligtasan, Tarlac City",
    sex: "Female",
    birthdate: "2006-06-19",
    gender: "Woman",
    age: "20",
    address2: "Purok Maligaya, Tarlac City",
    contactNumber: "0915-332-9011",
    alsProgramAttended: "A&E Secondary/Junior High School",
    communityLearningCenter: "Ligtasan Outreach CLC",
    addressOfCLC: "Ligtasan Barangay Hall, Tarlac City",
    alsTeacher: "Mr. Randy Gomez",
    currentStatus: "Unemployed",
    nameOfEmployer: "N/A",
    typeOfWork: "N/A",
    typeOfBusiness: "N/A",
    nameOfSchool: "N/A",
    course: "N/A",
    dateOfTracingInterview: "2026-06-19",
    methodOfTracing: "Phone Call",
    conductedBy: "Mr. Randy Gomez"
  }
];

// Dropdown batch list from 2004 up to 2025 in order as requested
const BATCHES_FROM_2004_TO_2025 = Array.from(
  { length: 2025 - 2004 + 1 }, 
  (_, idx) => String(2025 - idx) // Descending order: 2025 down to 2004
);

export default function ALSGraduateTracingView() {
  const [graduates, setGraduates] = useState<GraduateRecord[]>(() => {
    try {
      const saved = localStorage.getItem('als_graduate_tracing_records_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error loaded local storage records", e);
    }
    return DEFAULT_GRADUATES;
  });

  useEffect(() => {
    safeSetJSON('als_graduate_tracing_records_v2', graduates);
  }, [graduates]);

  // Refined Filter options (Maghanap ayon sa LRN & CLC filters removed completely as requested)
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [batchFilter, setBatchFilter] = useState<string>('ALL');

  // Modal Dialog Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Set default form values matching the 24 requested fields
  const getInitialFormState = () => ({
    timestamp: '', // Will be computed at submission if empty
    yearGraduated: '2025',
    lastName: '',
    firstName: '',
    middleName: '',
    address: '',
    sex: 'Male',
    birthdate: '2004-01-01',
    gender: 'Man',
    age: '22',
    address2: '',
    contactNumber: '',
    alsProgramAttended: 'A&E Secondary/Junior High School',
    communityLearningCenter: 'San Vicente CLC',
    addressOfCLC: 'San Vicente, Tarlac City',
    alsTeacher: 'Mrs. Carina Castro',
    currentStatus: 'Employed',
    nameOfEmployer: '',
    typeOfWork: '',
    typeOfBusiness: '',
    nameOfSchool: '',
    course: '',
    dateOfTracingInterview: new Date().toISOString().split('T')[0],
    methodOfTracing: 'Phone Call',
    conductedBy: 'Mrs. Carina Castro'
  });

  const [formData, setFormData] = useState(getInitialFormState);

  const [formFeedback, setFormFeedback] = useState<{ status: 'success' | 'error' | 'idle', text: string }>({
    status: 'idle',
    text: ''
  });

  // Calculate Metrics based on current real status (robust handling, default fallback)
  const totalTraced = graduates.length;
  const employedCount = graduates.filter(g => g.currentStatus === 'Employed').length;
  const higherEdCount = graduates.filter(g => g.currentStatus === 'Enrolled in College').length;
  const tvetCount = graduates.filter(g => g.currentStatus === 'TVET / Vocational').length;
  const entrepreneurCount = graduates.filter(g => g.currentStatus === 'Entrepreneurship').length;
  const unemployedCount = graduates.filter(g => g.currentStatus === 'Unemployed').length;

  const productiveCount = totalTraced - unemployedCount;
  const successPathwayRate = totalTraced > 0 ? Math.round((productiveCount / totalTraced) * 100) : 0;
  const employmentRate = totalTraced > 0 ? Math.round((employedCount / totalTraced) * 100) : 0;
  const educationRate = totalTraced > 0 ? Math.round((higherEdCount / totalTraced) * 100) : 0;

  // Filter List (only applying Status and Batch)
  const filteredGraduates = graduates.filter(g => {
    try {
      const matchesStatus = statusFilter === 'ALL' || g.currentStatus === statusFilter;
      const matchesBatch = batchFilter === 'ALL' || g.yearGraduated === batchFilter;
      return matchesStatus && matchesBatch;
    } catch (e) {
      console.error("Filter evaluation error", e);
      return true;
    }
  });

  // Handle new record submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Robust client validations
      if (!formData.lastName.trim() || !formData.firstName.trim()) {
        setFormFeedback({ status: 'error', text: 'Error: Last Name and First Name fields are mandatory.' });
        return;
      }

      // Generate accurate timestamp
      const customTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

      const record: GraduateRecord = {
        id: 'grad-traced-' + Date.now() + Math.random().toString(36).substring(2, 7),
        timestamp: formData.timestamp.trim() || customTimestamp,
        yearGraduated: formData.yearGraduated,
        lastName: formData.lastName.trim(),
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim() || 'N/A',
        address: formData.address.trim() || 'N/A',
        sex: formData.sex,
        birthdate: formData.birthdate || 'N/A',
        gender: formData.gender.trim() || 'N/A',
        age: String(Math.max(1, parseInt(formData.age) || 18)),
        address2: formData.address2.trim() || 'N/A',
        contactNumber: formData.contactNumber.trim() || 'N/A',
        alsProgramAttended: formData.alsProgramAttended,
        communityLearningCenter: formData.communityLearningCenter.trim() || 'N/A',
        addressOfCLC: formData.addressOfCLC.trim() || 'N/A',
        alsTeacher: formData.alsTeacher.trim() || 'N/A',
        currentStatus: formData.currentStatus,
        nameOfEmployer: formData.nameOfEmployer.trim() || 'N/A',
        typeOfWork: formData.typeOfWork.trim() || 'N/A',
        typeOfBusiness: formData.typeOfBusiness.trim() || 'N/A',
        nameOfSchool: formData.nameOfSchool.trim() || 'N/A',
        course: formData.course.trim() || 'N/A',
        dateOfTracingInterview: formData.dateOfTracingInterview || new Date().toISOString().split('T')[0],
        methodOfTracing: formData.methodOfTracing,
        conductedBy: formData.conductedBy.trim() || 'N/A'
      };

      setGraduates(prev => [record, ...prev]);
      setFormFeedback({ status: 'success', text: 'Successful: Candidate tracing record registered!' });
      
      setTimeout(() => {
        setIsAddModalOpen(false);
        setFormData(getInitialFormState());
        setFormFeedback({ status: 'idle', text: '' });
      }, 1000);

    } catch (err) {
      console.error("Submission failed", err);
      setFormFeedback({ status: 'error', text: 'An unexpected processing error occurred. Please try again.' });
    }
  };

  // Remove individual record
  const deleteRecord = (id: string) => {
    try {
      if (window.confirm("Are you sure you want to delete this graduate outcome record permanently?")) {
        setGraduates(prev => prev.filter(g => g.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete record", err);
    }
  };

  return (
    <div className="bg-[#FAFBFD] space-y-6 w-full animate-fade-in text-slate-800">
      
      {/* Upper header section */}
      <div className="bg-white border border-slate-205 rounded-3xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full bg-indigo-50 text-[#002B6D] tracking-wider border border-indigo-100">
              ALS Tarlac City SD Tracing Desk
            </div>
          </div>
          <h1 className="text-xl font-black text-indigo-950 tracking-tight">
            ALS Graduate Tracing & Pathways Data
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Examine system-wide outcomes of ALS graduates. Track indicators for Tertiary Education, 
            Technical-Vocational certification (TVET), local/regional employment, or micro-enterprise pathways.
          </p>
        </div>

        <div className="flex gap-2.5 self-start md:self-center shrink-0">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 bg-[#002B6D] hover:bg-[#002B6D]/95 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Trace New Graduate</span>
          </button>
        </div>
      </div>

      {/* Pathways Stats Blocks */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-3xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-black text-slate-450 tracking-wider">Total Traced</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">{totalTraced}</p>
            <p className="text-[10px] text-emerald-600 font-extrabold mt-1">100% submission health</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-3xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-black text-slate-450 tracking-wider">Productivity Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-black text-emerald-600 tracking-tight leading-none">{successPathwayRate}%</p>
            <p className="text-[10px] text-slate-500 font-bold mt-1">Placed or Enrolled</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-3xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-black text-slate-450 tracking-wider">Employed</span>
            <Briefcase className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">{employedCount}</p>
            <p className="text-[10px] text-sky-600 font-bold mt-1">{employmentRate}% of overall traced</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-3xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-black text-slate-450 tracking-wider">College/Higher Ed</span>
            <GraduationCap className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">{higherEdCount}</p>
            <p className="text-[10px] text-indigo-600 font-bold mt-1">{educationRate}% enrolled</p>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-3xs col-span-2 md:col-span-1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-black text-slate-450 tracking-wider font-sans">TVET / Enterprise</span>
            <div className="flex gap-1 text-amber-500">
              <Wrench className="w-3.5 h-3.5" />
              <Store className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-xl font-black text-slate-800 tracking-tight leading-none">
              {tvetCount + entrepreneurCount} <span className="text-[10px] text-slate-400 font-bold">({tvetCount} / {entrepreneurCount})</span>
            </p>
            <p className="text-[10px] text-slate-500 font-bold mt-1">TVET & Businesses</p>
          </div>
        </div>

      </div>

      {/* Pathway filters row (Search bar and CLC Origin dropdown removed according to instructions) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#002B6D]" />
            <span className="text-xs font-bold text-slate-800 tracking-tight uppercase">
              ALS Graduate Tracking Registry & Outcomes
            </span>
          </div>

          <div className="flex flex-row items-center gap-3.5 flex-wrap sm:flex-nowrap">
            
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">Pathway:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-750 font-bold focus:outline-hidden focus:ring-1 focus:ring-[#002B6D]"
              >
                <option value="ALL">All Status Pathways</option>
                <option value="Employed">Employed (BPO, Sales, etc.)</option>
                <option value="Enrolled in College">Enrolled in College / Higher Education</option>
                <option value="TVET / Vocational">TVET / Vocational Training</option>
                <option value="Entrepreneurship">Entrepreneurship (Self-Employed)</option>
                <option value="Unemployed">Unemployed / Status Native</option>
              </select>
            </div>

            {/* Batch Filter - Years 2004 to 2025 as ordered list */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">Year:</span>
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-750 font-bold focus:outline-hidden focus:ring-1 focus:ring-[#002B6D]"
              >
                <option value="ALL">All Batches</option>
                {BATCHES_FROM_2004_TO_2025.map(year => (
                  <option key={year} value={year}>Batch {year}</option>
                ))}
              </select>
            </div>

          </div>

        </div>

        {/* Dynamic status strip */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-3 mt-3">
          <span>
            Shown: <strong>{filteredGraduates.length}</strong> traced candidate profile(s)
          </span>
          {(statusFilter !== 'ALL' || batchFilter !== 'ALL') && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setBatchFilter('ALL');
              }}
              className="text-indigo-800 font-extrabold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 24 Columns Wide Spreadsheet Grid */}
      <div className="bg-white border border-slate-205 rounded-2xl shadow-3xs overflow-hidden">
        
        {/* Overflow banner informing users they can slide horizontally over the wide 24 columns */}
        <div className="bg-[#FAFBFD] border-b border-slate-150 px-4 py-2.5 flex items-center justify-between text-[10.5px] text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-450" />
            <span>Slide horizontally to observe all 24 authorized columns. Select individual row to view compiled dossiers.</span>
          </span>
          <div className="text-[9.5px] font-bold bg-[#E3EDFA] text-[#002B6D] px-2 py-0.5 rounded-full uppercase">
            Wide Database Matrix
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto whitespace-nowrap min-w-[2800px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[10.5px] uppercase font-black tracking-wider">
                <th className="p-3.5 pl-5 bg-white sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.03)] text-slate-800">Action</th>
                <th className="p-3.5">Year Graduated</th>
                <th className="p-3.5">Last Name</th>
                <th className="p-3.5">First Name</th>
                <th className="p-3.5">Middle Name</th>
                <th className="p-3.5">Address</th>
                <th className="p-3.5">Sex</th>
                <th className="p-3.5">Birthdate</th>
                <th className="p-3.5">Age</th>
                <th className="p-3.5">Contact Number</th>
                <th className="p-3.5">ALS Program Attended</th>
                <th className="p-3.5">Community Learning Center</th>
                <th className="p-3.5">Address of Community Learning Center</th>
                <th className="p-3.5">ALS Teacher</th>
                <th className="p-3.5">Current Status</th>
                <th className="p-3.5">Name of Employer</th>
                <th className="p-3.5">Type of Work</th>
                <th className="p-3.5">Type of Business</th>
                <th className="p-3.5">Name of School</th>
                <th className="p-3.5">Course</th>
                <th className="p-3.5">Date of Tracing Interview</th>
                <th className="p-3.5">Method of Tracing</th>
                <th className="p-3.5 pr-5">Conducted by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-xs">
              {filteredGraduates.length > 0 ? (
                filteredGraduates.map((grad) => {
                  
                  // Style track colors for status highlights
                  let highlightColor = "bg-slate-100 text-slate-700 border-slate-200";
                  if (grad.currentStatus === "Employed") highlightColor = "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold";
                  if (grad.currentStatus === "Enrolled in College") highlightColor = "bg-indigo-50 text-indigo-800 border-indigo-200 font-bold";
                  if (grad.currentStatus === "TVET / Vocational") highlightColor = "bg-sky-50 text-sky-800 border-sky-200 font-bold";
                  if (grad.currentStatus === "Entrepreneurship") highlightColor = "bg-teal-50 text-teal-800 border-teal-200 font-bold";
                  if (grad.currentStatus === "Unemployed") highlightColor = "bg-rose-50 text-rose-800 border-rose-200 font-bold";

                  return (
                    <tr key={grad.id} className="hover:bg-indigo-50/20 transition-all">
                      
                      {/* Stick Action Column */}
                      <td className="p-3 pl-5 bg-white sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              alert(
                                `COMPLETE VERIFIED PROFILE OUTCOME DOSSIER:\n\n` +
                                `1. Year Graduated: ${grad.yearGraduated}\n` +
                                `2. Last Name: ${grad.lastName}\n` +
                                `3. First Name: ${grad.firstName}\n` +
                                `4. Middle Name: ${grad.middleName || 'N/A'}\n` +
                                `5. Address: ${grad.address}\n` +
                                `6. Sex: ${grad.sex}\n` +
                                `7. Birthdate: ${grad.birthdate || 'N/A'}\n` +
                                `8. Age: ${grad.age}\n` +
                                `9. Contact Number: ${grad.contactNumber}\n` +
                                `10. ALS Program Attended: ${grad.alsProgramAttended}\n` +
                                `11. Community Learning Center: ${grad.communityLearningCenter}\n` +
                                `12. Address of Community Learning Center: ${grad.addressOfCLC}\n` +
                                `13. ALS Teacher: ${grad.alsTeacher}\n` +
                                `14. Current Status: ${grad.currentStatus}\n` +
                                `15. Name of Employer: ${grad.nameOfEmployer}\n` +
                                `16. Type of Work: ${grad.typeOfWork}\n` +
                                `17. Type of Business: ${grad.typeOfBusiness}\n` +
                                `18. Name of School: ${grad.nameOfSchool}\n` +
                                `19. Course: ${grad.course}\n` +
                                `20. Date of Tracing Interview: ${grad.dateOfTracingInterview}\n` +
                                `21. Method of Tracing: ${grad.methodOfTracing}\n` +
                                `22. Conducted by: ${grad.conductedBy}\n\n` +
                                `Internal Record UID: ${grad.id}`
                              );
                            }}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-[#002B6D] hover:text-white border border-indigo-150 rounded text-[10px] font-black uppercase text-[#002B6D] transition duration-200 cursor-pointer"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => deleteRecord(grad.id)}
                            className="p-1 border border-rose-100 hover:bg-rose-50 text-rose-600 rounded flex items-center transition cursor-pointer"
                            title="Delete record profile"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Year Graduated */}
                      <td className="p-3 font-semibold text-slate-800">
                        {grad.yearGraduated}
                      </td>

                      {/* Last Name */}
                      <td className="p-3 font-extrabold text-slate-900 text-sm">
                        {grad.lastName}
                      </td>

                      {/* First Name */}
                      <td className="p-3 font-extrabold text-slate-900 text-sm">
                        {grad.firstName}
                      </td>

                      {/* Middle Name */}
                      <td className="p-3 font-medium text-slate-600">
                        {grad.middleName || <span className="text-slate-350 italic">Null</span>}
                      </td>

                      {/* Address */}
                      <td className="p-3 max-w-sm truncate text-slate-700" title={grad.address}>
                        {grad.address}
                      </td>

                      {/* Sex */}
                      <td className="p-3">
                        <span className="font-semibold text-slate-700">{grad.sex}</span>
                      </td>

                      {/* Birthdate */}
                      <td className="p-3 font-mono text-slate-750">
                        {grad.birthdate || 'N/A'}
                      </td>

                      {/* Age */}
                      <td className="p-3 font-bold font-mono text-slate-850">
                        {grad.age}
                      </td>

                      {/* Contact Number */}
                      <td className="p-3 font-mono text-xs font-semibold text-slate-800">
                        {grad.contactNumber}
                      </td>

                      {/* ALS Program Attended */}
                      <td className="p-3">
                        <span className="px-1.5 py-0.5 bg-slate-100 border rounded text-[10px] font-semibold text-slate-700">
                          {grad.alsProgramAttended}
                        </span>
                      </td>

                      {/* Community Learning Center */}
                      <td className="p-3 font-bold text-slate-700">
                        {grad.communityLearningCenter}
                      </td>

                      {/* Address of Community Learning Center */}
                      <td className="p-3 text-slate-500 max-w-xs truncate" title={grad.addressOfCLC}>
                        {grad.addressOfCLC}
                      </td>

                      {/* ALS Teacher */}
                      <td className="p-3 font-semibold text-[#002B6D]">
                        {grad.alsTeacher}
                      </td>

                      {/* Current Status */}
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black border ${highlightColor}`}>
                          {grad.currentStatus}
                        </span>
                      </td>

                      {/* Name of Employer */}
                      <td className="p-3 font-bold text-slate-800">
                        {grad.nameOfEmployer}
                      </td>

                      {/* Type of Work */}
                      <td className="p-3 text-slate-650">
                        {grad.typeOfWork}
                      </td>

                      {/* Type of Business */}
                      <td className="p-3 text-slate-500">
                        {grad.typeOfBusiness}
                      </td>

                      {/* Name of School */}
                      <td className="p-3 font-semibold text-indigo-950">
                        {grad.nameOfSchool}
                      </td>

                      {/* Course */}
                      <td className="p-3 text-indigo-900 font-semibold text-xs">
                        {grad.course}
                      </td>

                      {/* Date of Tracing Interview */}
                      <td className="p-3 text-slate-600 font-mono">
                        {grad.dateOfTracingInterview}
                      </td>

                      {/* Method of Tracing */}
                      <td className="p-3 text-slate-650 font-medium">
                        {grad.methodOfTracing}
                      </td>

                      {/* Conducted by */}
                      <td className="p-3 pr-5 font-semibold text-emerald-950">
                        {grad.conductedBy}
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={23} className="p-12 text-center text-slate-400 space-y-2">
                    <AlertCircle className="w-9 h-9 text-slate-350 mx-auto" />
                    <p className="text-xs font-bold text-slate-500">No outcomes found matching the current selections.</p>
                    <p className="text-[11px] text-slate-400">Try re-programming the Pathway filtering options.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 24-Field High-Fidelity Add Record Modal Dialog */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-205 shadow-2xl w-full max-w-4xl my-8 flex flex-col max-h-[92vh]">
            
            {/* Modal sticky layout header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-950 text-white rounded-t-3xl shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-300" />
                <div>
                  <h2 className="font-black text-xs uppercase tracking-wider text-indigo-150">
                    Graduate Tracing Registry
                  </h2>
                  <p className="text-[10px] text-indigo-350 font-semibold">Please populate all 24 required profile markers accurately.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal scrollable body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-left">
              
              {formFeedback.status !== 'idle' && (
                <div className={`p-4 rounded-xl text-xs font-black border flex items-center gap-2 ${
                  formFeedback.status === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 animate-slide-in' 
                    : 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse'
                }`}>
                  {formFeedback.status === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{formFeedback.text}</span>
                </div>
              )}

              {/* SECTION 1: Personal Profile Information */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-1.5 border-b border-slate-150 pb-1">
                  <User className="w-4 h-4 text-[#002B6D]" />
                  <span className="text-[11px] font-black uppercase text-[#002B6D] tracking-wide">1. Personal Profile</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Last Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramos"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-800 focus:outline-[#002B6D]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">First Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Carlo"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-800 focus:outline-[#002B6D]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Middle Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Manaloto"
                      value={formData.middleName}
                      onChange={(e) => setFormData({...formData, middleName: e.target.value})}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 rounded-xl text-slate-750 focus:outline-[#002B6D]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Sex</label>
                    <select
                      value={formData.sex}
                      onChange={(e) => setFormData({...formData, sex: e.target.value})}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-700"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1"></label>
                    <input
                      type="text"
                      placeholder="e.g. Man / Woman"
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 rounded-xl text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Age</label>
                    <input
                      type="number"
                      min={5}
                      max={120}
                      placeholder="e.g. 24"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Contact Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 0917-883-4412"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Permanent Address Parameters */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-1.5 border-b border-slate-150 pb-1">
                  <MapPin className="w-4 h-4 text-[#002B6D]" />
                  <span className="text-[11px] font-black uppercase text-[#002B6D] tracking-wide">2. Address & Birthdate Parameters</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Address <span className="text-slate-400 font-normal">(Primary Barangay/City)</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Brgy. Ligtasan, Tarlac City"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 rounded-xl text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Birthdate <span className="text-slate-400 font-normal">(YYYY-MM-DD)</span></label>
                    <input
                      type="date"
                      value={formData.birthdate}
                      onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 rounded-xl text-slate-800 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: ALS Academic Information */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-1.5 border-b border-slate-150 pb-1">
                  <Bookmark className="w-4 h-4 text-[#002B6D]" />
                  <span className="text-[11px] font-black uppercase text-[#002B6D] tracking-wide">3. ALS Academic Background</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Year Graduated</label>
                    <select
                      value={formData.yearGraduated}
                      onChange={(e) => setFormData({...formData, yearGraduated: e.target.value})}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-700 focus:outline-[#002B6D]"
                    >
                      {BATCHES_FROM_2004_TO_2025.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">ALS Program Attended</label>
                    <select
                      value={formData.alsProgramAttended}
                      onChange={(e) => setFormData({...formData, alsProgramAttended: e.target.value})}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-700"
                    >
                      <option value="Basic Literacy Program">Basic Literacy Program</option>
                      <option value="A&E Elementary">A&E Elementary</option>
                      <option value="A&E Secondary/Junior High School">A&E Secondary/Junior High School</option>
                      <option value="ALS Senior High School">ALS Senior High School</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Community Learning Center</label>
                    <input
                      type="text"
                      placeholder="e.g. San Vicente CLC"
                      value={formData.communityLearningCenter}
                      onChange={(e) => setFormData({...formData, communityLearningCenter: e.target.value})}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-semibold text-slate-750"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Address of CLC</label>
                    <input
                      type="text"
                      placeholder="e.g. San Vicente Barangay Hall, Tarlac City"
                      value={formData.addressOfCLC}
                      onChange={(e) => setFormData({...formData, addressOfCLC: e.target.value})}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 rounded-xl text-slate-750"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">ALS Teacher</label>
                    <input
                      type="text"
                      placeholder="e.g. Mrs. Carina Castro"
                      value={formData.alsTeacher}
                      onChange={(e) => setFormData({...formData, alsTeacher: e.target.value})}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-bold text-[#002B6D]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Placement Status Outcome */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-1.5 border-b border-slate-150 pb-1">
                  <Heart className="w-4 h-4 text-[#002B6D]" />
                  <span className="text-[11px] font-black uppercase text-[#002B6D] tracking-wide">4. Path Outcomes Placement</span>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1.5">Current Placement Status</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {[
                        { val: 'Employed', label: 'Employed', icon: Briefcase },
                        { val: 'Enrolled in College', label: 'SELF EMPLOYED', icon: GraduationCap },
                        { val: 'TVET / Vocational', label: 'STUDYING', icon: Wrench },
                        { val: 'Entrepreneurship', label: 'Business Owner', icon: Store },
                        { val: 'Unemployed', label: 'Unemployed', icon: AlertCircle }
                      ].map(st => {
                        const SIcon = st.icon;
                        const isSel = formData.currentStatus === st.val;
                        return (
                          <button
                            key={st.val}
                            type="button"
                            onClick={() => setFormData({...formData, currentStatus: st.val})}
                            className={`p-3 rounded-xl text-center border text-[10px] font-black uppercase flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              isSel 
                                ? 'bg-[#002B6D] border-[#002B6D] text-white shadow-md scale-102' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/40'
                            }`}
                          >
                            <SIcon className="w-4 h-4 shrink-0" />
                            <span>{st.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200/60 pt-3">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 block mb-1 uppercase">Name of Employer</label>
                      <input
                        type="text"
                        placeholder="e.g. Sutherland, Concentrix, etc."
                        value={formData.nameOfEmployer}
                        onChange={(e) => setFormData({...formData, nameOfEmployer: e.target.value})}
                        className="w-full text-xs p-2.5 bg-white border border-slate-220 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 block mb-1 uppercase">Type of Work</label>
                      <input
                        type="text"
                        placeholder="e.g. Support Associate, Clerk"
                        value={formData.typeOfWork}
                        onChange={(e) => setFormData({...formData, typeOfWork: e.target.value})}
                        className="w-full text-xs p-2.5 bg-white border border-slate-220 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 block mb-1 uppercase">Type of Business</label>
                      <input
                        type="text"
                        placeholder="e.g. Retail, BPO, Manufacturing"
                        value={formData.typeOfBusiness}
                        onChange={(e) => setFormData({...formData, typeOfBusiness: e.target.value})}
                        className="w-full text-xs p-2.5 bg-white border border-slate-220 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 block mb-1 uppercase">Name of School</label>
                      <input
                        type="text"
                        placeholder="e.g. Tarlac State University"
                        value={formData.nameOfSchool}
                        onChange={(e) => setFormData({...formData, nameOfSchool: e.target.value})}
                        className="w-full text-xs p-2.5 bg-white border border-slate-220 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 block mb-1 uppercase">Course</label>
                      <input
                        type="text"
                        placeholder="e.g. BS Information Technology"
                        value={formData.course}
                        onChange={(e) => setFormData({...formData, course: e.target.value})}
                        className="w-full text-xs p-2.5 bg-white border border-slate-220 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: Interview Metadata */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-1.5 border-b border-slate-150 pb-1">
                  <Clock className="w-4 h-4 text-[#002B6D]" />
                  <span className="text-[11px] font-black uppercase text-[#002B6D] tracking-wide">5. Tracing Metadata Parameters</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Timestamp</label>
                    <input
                      type="text"
                      placeholder="Auto-filled on dispatch"
                      value={formData.timestamp}
                      onChange={(e) => setFormData({...formData, timestamp: e.target.value})}
                      className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-450"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Date of Tracing Interview</label>
                    <input
                      type="date"
                      value={formData.dateOfTracingInterview}
                      onChange={(e) => setFormData({...formData, dateOfTracingInterview: e.target.value})}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-mono font-bold text-slate-750"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Method of Tracing</label>
                    <select
                      value={formData.methodOfTracing}
                      onChange={(e) => setFormData({...formData, methodOfTracing: e.target.value})}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-700"
                    >
                      <option value="Phone Call">Phone Call</option>
                      <option value="Social Media Messenger">Social Media Messenger</option>
                      <option value="SMS Questionnaire">SMS Questionnaire</option>
                      <option value="In-Person Interview">In-Person Interview</option>
                      <option value="Email Response">Email Response</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Conducted by</label>
                    <input
                      type="text"
                      placeholder="e.g. Mrs. Carina Castro"
                      value={formData.conductedBy}
                      onChange={(e) => setFormData({...formData, conductedBy: e.target.value})}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex gap-2.5 justify-end border-t border-slate-150 pt-4.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4.5 py-2 border border-slate-250 bg-white text-slate-650 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-650 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                >
                  Save Tracing Record
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
