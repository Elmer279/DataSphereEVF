import { Partner } from '../types';

export interface PartnerActivity {
  id: string;
  partnerName: string;
  partnerLogo?: string;
  activityTitle: string;
  category: 'Community Outreach' | 'Skills Training' | 'MOA Signing' | 'Resource Donation' | 'Volunteer Session';
  date: string;
  location: string;
  participants: number;
  description: string;
  status: 'Completed' | 'Scheduled' | 'In Progress';
}

export const SEED_PARTNERS: Partner[] = [
  {
    id: 1,
    logo: "TS",
    recordId: "TSU-ALS-2024-001",
    registrationDate: "2024-03-12",
    organizationName: "Tarlac State University Extension Services",
    partnerType: "Higher Education Institution",
    address: "Romulo Blvd., San Vicente, Tarlac City",
    status: "Active",
    contactPerson: "Dr. Agnes M. Roxas",
    position: "Director of Extension Services",
    emailAddress: "extension@tsu.edu.ph",
    phoneNumber: "0917-555-0192",
    typeOfSupport: "Educational Extension & Volunteer Teachers",
    learnersSupported: 350,
    yearsOfPartnership: 6,
    partnershipDocument: "MOA-TSU-ALS-25.pdf",
    keyContactPerson: "EPS II - ALS Coordinator",
    moaValidityDate: "2027-03-31",
    moaRenewalStatus: "Valid",
    moaDaysRemaining: 528,
    lat: 15.4862,
    lng: 120.5895,
    clcCoverageAreas: ["San Vicente CLC", "Ligtasan Satellite CLC", "Tibag ALS Learning Hub", "Mabini Community Center"],
    resourceMobilizationSummary: {
      equipment: "30 Lenovo Tablets & 4 EPSON Digital Projectors",
      volunteerHours: 540,
      instructionalMaterials: "850 Specialized ALS Worksheets & SLM Modules",
      financialValuation: "₱320,000 Institutional In-Kind Support"
    }
  },
  {
    id: 2,
    logo: "US",
    recordId: "USAID-ALS-2025-002",
    registrationDate: "2025-01-20",
    organizationName: "USAID Opportunity 2.0 Program",
    partnerType: "International Development Agency",
    address: "Roxas Boulevard, Manila / TCSD Division Link",
    status: "Active",
    contactPerson: "Maria Alyssa Salvador",
    position: "Chief of Party",
    emailAddress: "asalvador@usaid.gov",
    phoneNumber: "0908-112-9083",
    typeOfSupport: "Funds & Instructional Materials",
    learnersSupported: 1200,
    yearsOfPartnership: 3,
    partnershipDocument: "MOU-USAID-O2-TCSD.pdf",
    keyContactPerson: "Livelihood & Education Specialist",
    moaValidityDate: "2026-12-31",
    moaRenewalStatus: "Valid",
    moaDaysRemaining: 438,
    lat: 15.4890,
    lng: 120.5950,
    clcCoverageAreas: ["Division-wide ALS Sites (76 Barangays)", "BJMP Male & Female Dorms", "Baras-Baras Youth Learning Hub"],
    resourceMobilizationSummary: {
      equipment: "85 Acer Chromebooks, 10 Portable WiFi Modems",
      volunteerHours: 420,
      instructionalMaterials: "1,500 Opportunity 2.0 Work-Ready Handbooks & Life Skills Kits",
      financialValuation: "₱750,000 International Grant Support"
    }
  },
  {
    id: 3,
    logo: "RC",
    recordId: "ROT-ALS-2023-003",
    registrationDate: "2023-08-15",
    organizationName: "Rotary Club of Tarlac",
    partnerType: "Civic Organization / NGO",
    address: "F. Tañedo St., Tarlac City",
    status: "Pending Renewal",
    contactPerson: "Engr. Robert L. Tan",
    position: "President",
    emailAddress: "tarlac.rotary@gmail.com",
    phoneNumber: "0920-410-2394",
    typeOfSupport: "Technical Training & Scholarships",
    learnersSupported: 180,
    yearsOfPartnership: 4,
    partnershipDocument: "ROT-MOA-Scholarships.pdf",
    keyContactPerson: "District ALS Focal Person",
    moaValidityDate: "2026-11-30",
    moaRenewalStatus: "Pending Renewal",
    moaDaysRemaining: 42,
    lat: 15.4835,
    lng: 120.5920,
    clcCoverageAreas: ["San Nicolas CLC", "San Roque Learning Node", "Poblacion Central Community Center"],
    resourceMobilizationSummary: {
      equipment: "25 Desktop Workstations & Heavy-Duty Printers",
      volunteerHours: 320,
      instructionalMaterials: "450 Literacy Assessment & ABL Kits",
      financialValuation: "₱180,000 Scholarship Endowment Fund"
    }
  },
  {
    id: 4,
    logo: "TC",
    recordId: "LGU-ALS-2022-004",
    registrationDate: "2022-07-01",
    organizationName: "Tarlac City LGU (Mayor's Office)",
    partnerType: "Local Government Unit",
    address: "City Hall, Poblacion, Tarlac City",
    status: "Active",
    contactPerson: "Hon. Maria Cristina Angeles",
    position: "City Mayor",
    emailAddress: "mayor@tarlaccity.gov.ph",
    phoneNumber: "045-982-1209",
    typeOfSupport: "Facility Donation & General Advocacy",
    learnersSupported: 850,
    yearsOfPartnership: 5,
    partnershipDocument: "LGU-Resolution-2026.pdf",
    keyContactPerson: "City Administrator",
    moaValidityDate: "2027-06-30",
    moaRenewalStatus: "Valid",
    moaDaysRemaining: 619,
    lat: 15.4842,
    lng: 120.5945,
    clcCoverageAreas: ["All 76 Barangay Hall Satellite CLCs", "Tarlac City Public Library E-Learning Zone"],
    resourceMobilizationSummary: {
      equipment: "12 Mobile Speaker Systems, 6 Solar Facility Generators",
      volunteerHours: 250,
      instructionalMaterials: "City Education Subsidy & Free Uniform Packages",
      financialValuation: "₱850,000 Special Education Fund (SEF)"
    }
  },
  {
    id: 5,
    logo: "ST",
    recordId: "SIT-ALS-2025-005",
    registrationDate: "2025-06-10",
    organizationName: "Sitel Philippines - Tarlac Hub",
    partnerType: "Private Sector / Corporate",
    address: "San Rafael, Tarlac City",
    status: "Active",
    contactPerson: "Michael G. Perez",
    position: "Site HR Director",
    emailAddress: "michael.perez@sitel.com",
    phoneNumber: "0915-322-1144",
    typeOfSupport: "Livelihood & Skills Internships",
    learnersSupported: 140,
    yearsOfPartnership: 2,
    partnershipDocument: "MOA-SITEL-TCSD-ALS.pdf",
    keyContactPerson: "Division ALS Liaison",
    moaValidityDate: "2026-12-15",
    moaRenewalStatus: "Valid",
    moaDaysRemaining: 57,
    lat: 15.4610,
    lng: 120.6120,
    clcCoverageAreas: ["San Rafael Community Learning Center", "San Miguel Secondary ALS Hub"],
    resourceMobilizationSummary: {
      equipment: "40 BPO Voice Headsets & Refurbished Call Terminals",
      volunteerHours: 180,
      instructionalMaterials: "English Communication Skills & Interview Prep Handbooks",
      financialValuation: "₱140,000 Corporate CSR Grant"
    }
  },
  {
    id: 6,
    logo: "ALStig.webp",
    recordId: "001 | ALSTIG | 2026-06-25 | TCSDALS",
    registrationDate: "2026-06-25",
    organizationName: "ALSTIG",
    partnerType: "Community-Based Organization",
    address: "San Miguel, Tarlac City",
    status: "Active",
    contactPerson: "Arnold T. Lumba",
    position: "Chairman",
    emailAddress: "arnold.lumba@deped.gov.ph",
    phoneNumber: "9274448798",
    typeOfSupport: "Technical Training",
    learnersSupported: 2130,
    yearsOfPartnership: 2,
    partnershipDocument: "Provisional",
    keyContactPerson: "Melody Anne B. Aquino",
    moaValidityDate: "2027-06-25",
    moaRenewalStatus: "Valid",
    moaDaysRemaining: 614,
    lat: 15.4980,
    lng: 120.5780,
    clcCoverageAreas: ["Central Azucarera de Tarlac CLC", "Maliwalo Community Learning Center", "Sapang Tagalog Skills Center"],
    resourceMobilizationSummary: {
      equipment: "Technical-Vocational Toolkits & Welding Practice Rigs",
      volunteerHours: 140,
      instructionalMaterials: "Technical Livelihood Assessment Manuals & Safety Guides",
      financialValuation: "₱210,000 Community Equipment Mobilization"
    }
  }
];

export const SEED_PARTNER_ACTIVITIES: PartnerActivity[] = [
  {
    id: "act-01",
    partnerName: "Tarlac State University Extension Services",
    partnerLogo: "TS",
    activityTitle: "Pre-Service Volunteer Teachers Deployment & Orientation",
    category: "Volunteer Session",
    date: "2026-10-10",
    location: "TSU Lucinda Campus / San Vicente CLC",
    participants: 45,
    description: "Deployed 25 senior BSEd pre-service volunteer educators across 8 community learning centers to support ABL literacy diagnostics and supplementary modular teaching.",
    status: "Completed"
  },
  {
    id: "act-02",
    partnerName: "USAID Opportunity 2.0 Program",
    partnerLogo: "US",
    activityTitle: "Digital Literacy & Work-Ready Life Skills Toolkit Distribution",
    category: "Resource Donation",
    date: "2026-09-28",
    location: "TCSD Division Training Hall, Tarlac City",
    participants: 120,
    description: "Ceremonial handover of 85 Acer Chromebooks and 1,500 specialized self-paced learning handbooks for out-of-school youth preparing for the A&E Secondary exams.",
    status: "Completed"
  },
  {
    id: "act-03",
    partnerName: "Sitel Philippines - Tarlac Hub",
    partnerLogo: "ST",
    activityTitle: "BPO Foundations & Career Readiness Boot Camp",
    category: "Skills Training",
    date: "2026-09-15",
    location: "Sitel Training Facility, San Rafael",
    participants: 60,
    description: "Three-day intensive customer service and conversational English boot camp for ALS secondary graduates transitioning to IT-BPO employment.",
    status: "Completed"
  },
  {
    id: "act-04",
    partnerName: "Tarlac City LGU (Mayor's Office)",
    partnerLogo: "TC",
    activityTitle: "Barangay ALS Learning Node Facility Upgrade Signing",
    category: "MOA Signing",
    date: "2026-08-20",
    location: "City Hall Executive Lounge, Poblacion",
    participants: 35,
    description: "Signing of multi-year collaborative resolution allocating local Special Education Funds (SEF) for solar-powered satellite CLCs in 10 rural barangays.",
    status: "Completed"
  },
  {
    id: "act-05",
    partnerName: "Rotary Club of Tarlac",
    partnerLogo: "RC",
    activityTitle: "Community Literacy Drive & Vision Health Outreach",
    category: "Community Outreach",
    date: "2026-08-05",
    location: "San Nicolas Barangay Covered Court",
    participants: 180,
    description: "Joint community literacy mobilization drive providing free reading eyeglasses, hygiene packs, and learner recruitment registration booths for out-of-school adults.",
    status: "Completed"
  },
  {
    id: "act-06",
    partnerName: "ALSTIG",
    partnerLogo: "ALStig.webp",
    activityTitle: "Technical-Vocational Welding & Metalcraft Workshop",
    category: "Skills Training",
    date: "2026-07-18",
    location: "Central Azucarera Technical Node",
    participants: 75,
    description: "Hands-on SMAW skills workshop providing certified NC-II preparation for 75 ALS completers seeking immediate industrial employment.",
    status: "Completed"
  }
];
