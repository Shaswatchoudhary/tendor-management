// Mock seed data: users, tenders, applications. Runs once on app load.
import type { StoredTender, StoredApplication, VendorFormData } from "@/lib/store";
import type { AIGeneratedTender, PdfFormData, MatchEvaluation } from "@/lib/gemini";

export interface MockUser {
  id: string;
  email: string;
  password: string;
  role: "company" | "vendor";
  name: string;
  companyName: string;
  address: string;
  phone: string;
}

export const MOCK_USERS: Record<string, MockUser> = {
  "company1@demo.com": {
    id: "comp-001", email: "company1@demo.com", password: "demo123", role: "company",
    name: "Rajesh Sharma", companyName: "TechCorp India Pvt Ltd",
    address: "Plot 45, Sector 62, Noida, UP - 201309", phone: "9876543210",
  },
  "company2@demo.com": {
    id: "comp-002", email: "company2@demo.com", password: "demo123", role: "company",
    name: "Priya Mehta", companyName: "BuildRight Pvt Ltd",
    address: "12, Industrial Area, Phase 2, Gurugram, HR", phone: "9871234560",
  },
  "vendor1@demo.com": {
    id: "vend-001", email: "vendor1@demo.com", password: "demo123", role: "vendor",
    name: "Amit Kumar", companyName: "Sharma Enterprises",
    address: "Shop 3, Laxmi Nagar, Delhi - 110092", phone: "9988776655",
  },
  "vendor2@demo.com": {
    id: "vend-002", email: "vendor2@demo.com", password: "demo123", role: "vendor",
    name: "Suresh Patel", companyName: "NextGen Solutions Pvt Ltd",
    address: "7B, Nariman Point, Mumbai - 400021", phone: "9123456789",
  },
  "vendor3@demo.com": {
    id: "vend-003", email: "vendor3@demo.com", password: "demo123", role: "vendor",
    name: "Deepak Singh", companyName: "RapidBuild Co.",
    address: "23, MG Road, Pune - 411001", phone: "9876012345",
  },
};

const TENDERS_KEY = "tms.tenders.v1";
const APPS_KEY = "tms.applications.v2";
const USERS_KEY = "mock_users";
const INIT_KEY = "mock_initialized_v2";

function buildPdfForm(t: {
  referenceNumber: string; companyName: string; title: string; category: string;
  budgetMin: string; budgetMax: string; deadline: string; location: string;
  contactName: string; contactEmail: string; contactPhone: string;
}): PdfFormData {
  return {
    referenceNumber: t.referenceNumber, companyName: t.companyName, title: t.title,
    category: t.category, budgetMin: t.budgetMin, budgetMax: t.budgetMax,
    currency: "INR", deadline: t.deadline, location: t.location, completionDays: 30,
    contactName: t.contactName, contactEmail: t.contactEmail, contactPhone: t.contactPhone,
  };
}

function ai(partial: Partial<AIGeneratedTender>): AIGeneratedTender {
  return {
    projectDescription: "", scopeOfWork: [], technicalSpecifications: "",
    eligibilityCriteria: [], requiredSkills: [], emdAmount: "Nil", paymentTerms: "",
    requiredDocuments: [], qualificationSummary:
      "Vendors meeting the eligibility criteria including valid GST registration, minimum turnover, relevant experience, and required certifications are eligible to apply.",
    evaluationMethod:
      "Applications will be evaluated in three stages: (1) Eligibility verification of documents, (2) Technical evaluation of capability and quality compliance, and (3) Financial bid comparison among technically qualified vendors. Award will be made to the most advantageous bid.",
    generalConditions: [],
    timeSchedule: { documentDownloadEnd: "", submissionDeadline: "", openingDate: "" },
    ...partial,
  };
}

function buildTenders(): StoredTender[] {
  const t1ai = ai({
    projectDescription:
      "TechCorp India Pvt Ltd invites sealed tenders from eligible and qualified vendors for the comprehensive supply, delivery, and installation of premium office furniture at their new headquarters located in Sector 62, Noida. This procurement initiative is aimed at creating a modern, ergonomic, and productive work environment for approximately 150 employees. The furniture to be procured includes high-quality ergonomic office chairs, height-adjustable standing desks, and premium conference tables that meet international quality and durability standards. The successful vendor shall be responsible for complete delivery, professional installation, and post-installation quality verification at the designated premises.",
    scopeOfWork: [
      "Supply and delivery of 50 premium ergonomic office chairs with lumbar support, adjustable armrests, and minimum 5-year warranty",
      "Supply and delivery of 30 height-adjustable standing desks with smooth electric or manual adjustment mechanism",
      "Supply and delivery of 5 conference tables (10-seater each) with cable management provisions",
      "Professional installation and assembly of all furniture items at designated locations within the premises",
      "Quality inspection and demonstration of all items prior to final acceptance",
      "Removal and disposal of all packaging materials and debris from premises",
      "Provision of user manuals, warranty cards, and after-sales service contact details",
      "Final handover documentation including delivery challans and installation certificates",
    ],
    technicalSpecifications:
      "Office chairs shall be ergonomic design with high-density foam cushioning, breathable mesh backrest, 360-degree swivel mechanism, pneumatic height adjustment (42-52cm), adjustable lumbar support, and 3D adjustable armrests. Frame shall be powder-coated steel with minimum 150kg weight capacity. Desks shall be MFC/laminated top (25mm thickness), steel frame, scratch and stain resistant surface. Conference tables shall be premium laminated finish with inbuilt cable management and modular connectivity. All furniture must comply with IS:7174 standards and carry minimum BIS certification.",
    eligibilityCriteria: [
      "The vendor must possess a valid GST Registration Certificate issued by the competent authority under GST Act 2017.",
      "The vendor must have a minimum of 5 years of proven experience in supply and installation of commercial office furniture.",
      "The vendor must have achieved a minimum annual turnover of Rs. 15,00,000 (Fifteen Lakhs) in each of the last two financial years, supported by CA-certified audited statements.",
      "The vendor must hold a valid ISO 9001:2015 or equivalent quality management system certification for furniture manufacturing or supply.",
      "The vendor must have successfully completed a minimum of 3 similar office furniture supply projects in the last 5 years, each with a value not less than Rs. 1,00,000.",
      "The vendor must possess a valid PAN Card issued by the Income Tax Department of India.",
    ],
    requiredSkills: [
      "Office Furniture Supply", "Installation & Assembly", "ISO 9001:2015 Certified",
      "GST Registered", "BIS Compliant Products", "Commercial Interior Projects",
      "Post-sales Support", "Pan India Delivery",
    ],
    emdAmount: "Rs. 10,000",
    paymentTerms:
      "Payment shall be made on milestone basis. An advance payment of 20% of total contract value shall be released upon execution of agreement and submission of Bank Guarantee. 60% payment shall be released upon successful delivery and installation of all furniture items as per inspection report. Balance 20% shall be released after 30 days of satisfactory performance and submission of all warranty documents and completion certificate.",
    requiredDocuments: [
      "Company Registration Certificate duly self-attested by authorized signatory",
      "Valid GST Registration Certificate", "PAN Card copy duly self-attested",
      "Audited Financial Statements for FY 2023-24 and FY 2024-25 certified by Chartered Accountant",
      "Bank Solvency Certificate from a scheduled commercial bank",
      "Minimum 3 work orders and completion certificates of similar furniture supply projects",
      "Valid ISO 9001:2015 certification copy",
      "Product catalogue and technical specifications brochure",
      "Sample photos or portfolio of past similar installations",
      "Undertaking on company letterhead confirming acceptance of all tender terms",
    ],
    generalConditions: [
      "TechCorp India Pvt Ltd reserves the right to accept or reject any or all tenders without assigning any reason whatsoever.",
      "The vendor shall remain bound by their quoted price for a period of 90 days from the tender submission deadline.",
      "Any dispute arising from this tender shall be subject to exclusive jurisdiction of courts in Noida, Uttar Pradesh.",
      "Force majeure events including natural disasters, strikes, or government restrictions shall excuse performance delays.",
      "Canvassing or lobbying in any form by the vendor or their representatives shall result in immediate disqualification.",
      "The vendor shall bear all costs related to preparation, submission, and presentation of their tender application.",
      "TechCorp India reserves the right to verify all submitted documents and disqualify vendors providing false information.",
      "The successful vendor must commence delivery within 7 working days of receiving the work order.",
      "Liquidated damages at 0.5% per week subject to maximum 5% of contract value shall apply for delayed delivery.",
      "All furniture must carry minimum manufacturer warranty of 3 years with on-site service support.",
    ],
    timeSchedule: { documentDownloadEnd: "08/07/2026", submissionDeadline: "15/07/2026", openingDate: "16/07/2026" },
  });

  const t2ai = ai({
    projectDescription:
      "TechCorp India Pvt Ltd invites tenders from experienced IT service providers for a comprehensive Annual Maintenance Contract covering complete IT infrastructure support at their Noida headquarters. The contract encompasses preventive and corrective maintenance of 200 desktop computers and laptops, 50 multifunction printers, complete network infrastructure including core switches, edge switches, routers, and wireless access points. The scope also includes dedicated 24x7 helpdesk support with defined SLAs, quarterly health audits, and proactive performance monitoring.",
    scopeOfWork: [
      "Preventive maintenance of 200 desktop computers and laptops on quarterly basis including hardware cleaning, software updates, and performance optimization",
      "Corrective maintenance and repair of all IT hardware with maximum 4-hour response time for critical issues",
      "Maintenance of 50 multifunction printers including consumable management and drum replacement coordination",
      "Network infrastructure maintenance including switches, routers, firewalls, and wireless access points",
      "24x7 IT helpdesk support via phone, email, and remote desktop with ticketing system",
      "Quarterly IT health audit and detailed report submission to management",
      "Antivirus and security patch management across all endpoints",
      "Data backup verification and disaster recovery testing on monthly basis",
    ],
    technicalSpecifications:
      "Service provider must have certified engineers (CompTIA A+, Network+, or equivalent) on-site minimum 8 hours daily on working days. Remote support availability 24x7x365. Maximum resolution time: P1 Critical - 4 hours, P2 High - 8 hours, P3 Medium - 24 hours, P4 Low - 72 hours. Monthly uptime guarantee of 99.5% for network infrastructure. All spare parts used must be OEM certified. Service reports to be submitted within 24 hours of each maintenance activity.",
    eligibilityCriteria: [
      "The vendor must be a registered IT services company with valid GST Registration and minimum 5 years in IT support services.",
      "The vendor must have handled similar AMC contracts for minimum 100+ endpoints in a single organization.",
      "Annual turnover must be minimum Rs. 50,00,000 in each of last 2 financial years.",
      "Must have minimum 5 certified IT engineers (CompTIA/Microsoft/Cisco certified) on payroll.",
      "ISO 27001 or ISO 20000 certification preferred, ISO 9001:2015 mandatory.",
      "Must have completed minimum 3 similar IT AMC projects with documentary evidence.",
    ],
    requiredSkills: [
      "IT Infrastructure Support", "Network Administration", "Hardware Maintenance AMC",
      "24x7 Helpdesk", "Certified IT Engineers", "Endpoint Management", "Cybersecurity", "SLA Management",
    ],
    emdAmount: "Rs. 25,000",
    paymentTerms:
      "Contract value to be paid in 12 equal monthly installments. Each installment released by 7th of following month against submission of monthly service report and uptime certificate. Performance security of 10% of annual contract value to be submitted as bank guarantee before commencement.",
    requiredDocuments: [
      "Company incorporation certificate and MoA/AoA", "Valid GST Registration Certificate", "PAN Card",
      "Audited P&L and Balance Sheet for last 2 years", "List of certified engineers with certificates",
      "Minimum 3 client references for similar AMC contracts", "ISO certification copies",
      "Sample SLA document and escalation matrix", "Tool and software inventory used for support",
      "EPFO/ESIC registration proof confirming employee strength",
    ],
    generalConditions: [
      "TechCorp India reserves the right to terminate the contract with 30 days notice if service levels are consistently not met.",
      "Vendor must maintain confidentiality of all company data and systems accessed during the contract period.",
      "All engineers deployed must undergo background verification before being granted access to company premises.",
      "Vendor cannot subcontract any part of this AMC without prior written approval.",
      "Monthly SLA reports must be submitted by 5th of every month.",
      "Penalty of 2% of monthly contract value per SLA breach subject to maximum 10% per month.",
      "All tools, software licenses used for maintenance must be legally licensed.",
      "Vendor must provide dedicated account manager as single point of contact.",
      "Any data breach or security incident caused by vendor negligence will result in immediate termination.",
      "Contract auto-renewal clause subject to satisfactory performance review at end of year.",
    ],
    timeSchedule: { documentDownloadEnd: "23/07/2026", submissionDeadline: "30/07/2026", openingDate: "31/07/2026" },
  });

  const t3ai = ai({
    projectDescription:
      "BuildRight Pvt Ltd invites tenders from qualified civil contractors for comprehensive renovation of three floors of their office building in Gurugram. The renovation scope includes complete dismantling and replacement of existing false ceiling with modern grid ceiling, flooring replacement with vitrified tiles, installation of modular glass partition walls, complete electrical rewiring with LED lighting, and premium interior painting.",
    scopeOfWork: [
      "Dismantling of existing false ceiling and installation of Armstrong or equivalent grid ceiling across 3 floors (approx 8000 sq ft)",
      "Removal of existing flooring and installation of 600x600mm vitrified tiles with proper leveling and grouting",
      "Installation of modular glass partition walls with aluminum framing for cabin and meeting room creation",
      "Complete electrical rewiring including main distribution boards, sub-panels, and LED lighting fixtures",
      "Interior painting with premium washable emulsion paint (minimum 2 coats) on all walls and ceilings",
      "Plumbing work for washrooms on all 3 floors including sanitary fittings replacement",
      "Fire safety compliance work including smoke detectors, fire extinguisher points, and emergency lighting",
      "Final cleaning, snagging, and handover with completion certificate",
    ],
    technicalSpecifications:
      "All materials must be from approved brands (Asian Paints/Berger for paint, Kajaria/Somany for tiles, Armstrong/Saint-Gobain for ceiling). Electrical work must comply with IS 732 and IE Rules 1956. Contractor must have licensed electrical contractor certificate. Structural modifications require prior approval. Work to be carried out in phases to ensure business continuity. Site engineer must be present during all working hours.",
    eligibilityCriteria: [
      "Valid contractor license from competent authority with civil and interior works classification.",
      "Minimum 7 years experience in commercial interior renovation projects.",
      "Annual turnover minimum Rs. 1,00,00,000 in last 2 financial years.",
      "Must have completed minimum 2 similar commercial renovation projects of value Rs. 10 lakhs or above.",
      "Valid GST registration, PAN, ESI and PF registration mandatory.",
      "Licensed electrical sub-contractor empanelment mandatory for electrical scope.",
    ],
    requiredSkills: [
      "Civil Interior Renovation", "False Ceiling Installation", "Vitrified Tile Flooring",
      "Glass Partition Works", "Electrical Rewiring", "Licensed Contractor", "Commercial Projects", "Site Management",
    ],
    emdAmount: "Rs. 50,000",
    paymentTerms:
      "Running bill payment on monthly basis against certified work completion. 10% retention money to be withheld from each bill to be released after defect liability period of 6 months from project completion. Mobilization advance of 10% against bank guarantee.",
    requiredDocuments: [
      "Contractor license copy from PWD or equivalent authority", "Company registration certificate",
      "GST and PAN certificates", "ESI and EPF registration certificates",
      "Audited financial statements last 2 years", "Completion certificates of minimum 2 similar renovation projects",
      "List of key personnel with qualifications", "List of machinery and equipment owned",
      "Licensed electrical contractor certificate", "Work method statement and project schedule",
    ],
    generalConditions: [
      "Work must be carried out during non-business hours (7PM to 7AM on weekdays, full day on weekends) to avoid disruption.",
      "Contractor is responsible for all safety measures and must provide safety equipment to all workers.",
      "Any damage to existing property during renovation must be rectified at contractor cost.",
      "BuildRight Pvt Ltd reserves right to reject non-conforming materials and insist on replacement.",
      "Progress must be reported weekly in prescribed format to the project coordinator.",
      "Liquidated damages of 1% per week subject to maximum 10% of contract value for delays.",
      "All debris and waste material must be disposed of as per local municipal regulations.",
      "Contractor must maintain valid workmen compensation insurance for all deployed workers.",
      "Subcontracting allowed only for specialized electrical and plumbing works with prior approval.",
      "Defect liability period of 6 months from date of completion certificate applies to all works.",
    ],
    timeSchedule: { documentDownloadEnd: "25/07/2026", submissionDeadline: "01/08/2026", openingDate: "02/08/2026" },
  });

  const c1 = MOCK_USERS["company1@demo.com"];
  const c2 = MOCK_USERS["company2@demo.com"];

  return [
    {
      id: "TND-2026-1001", referenceNumber: "TND-2026-1001",
      companyId: c1.id, companyName: c1.companyName,
      title: "Supply of Office Furniture for HQ", category: "Furniture",
      budgetMin: "200000", budgetMax: "500000", deadline: "2026-07-15",
      location: "Sector 62, Noida, UP",
      description: "We need ergonomic office chairs, standing desks, and conference tables for our new headquarters. Total 50 chairs, 30 desks, 5 conference tables.",
      status: "active", createdAt: "2026-06-10T09:00:00.000Z",
      ai: t1ai,
      pdfForm: buildPdfForm({
        referenceNumber: "TND-2026-1001", companyName: c1.companyName,
        title: "Supply of Office Furniture for HQ", category: "Furniture",
        budgetMin: "200000", budgetMax: "500000", deadline: "2026-07-15",
        location: "Sector 62, Noida, UP",
        contactName: c1.name, contactEmail: c1.email, contactPhone: c1.phone,
      }),
      requiredDocuments: t1ai.requiredDocuments,
    },
    {
      id: "TND-2026-1002", referenceNumber: "TND-2026-1002",
      companyId: c1.id, companyName: c1.companyName,
      title: "Annual IT Support and Maintenance Contract", category: "IT/Software",
      budgetMin: "500000", budgetMax: "1200000", deadline: "2026-07-30",
      location: "Sector 62, Noida, UP",
      description: "We require a vendor for annual AMC of 200 computers, 50 printers, network infrastructure including switches and routers, and 24x7 helpdesk support for our Noida office.",
      status: "active", createdAt: "2026-06-12T09:00:00.000Z",
      ai: t2ai,
      pdfForm: buildPdfForm({
        referenceNumber: "TND-2026-1002", companyName: c1.companyName,
        title: "Annual IT Support and Maintenance Contract", category: "IT/Software",
        budgetMin: "500000", budgetMax: "1200000", deadline: "2026-07-30",
        location: "Sector 62, Noida, UP",
        contactName: c1.name, contactEmail: c1.email, contactPhone: c1.phone,
      }),
      requiredDocuments: t2ai.requiredDocuments,
    },
    {
      id: "TND-2026-2001", referenceNumber: "TND-2026-2001",
      companyId: c2.id, companyName: c2.companyName,
      title: "Civil Renovation Work for Office Building", category: "Civil/Construction",
      budgetMin: "1500000", budgetMax: "3000000", deadline: "2026-08-01",
      location: "Industrial Area Phase 2, Gurugram",
      description: "Complete renovation of 3 floors of our office building including false ceiling, flooring, partition walls, electrical rewiring, and painting work.",
      status: "active", createdAt: "2026-06-11T09:00:00.000Z",
      ai: t3ai,
      pdfForm: buildPdfForm({
        referenceNumber: "TND-2026-2001", companyName: c2.companyName,
        title: "Civil Renovation Work for Office Building", category: "Civil/Construction",
        budgetMin: "1500000", budgetMax: "3000000", deadline: "2026-08-01",
        location: "Industrial Area Phase 2, Gurugram",
        contactName: c2.name, contactEmail: c2.email, contactPhone: c2.phone,
      }),
      requiredDocuments: t3ai.requiredDocuments,
    },
  ];
}

function vendorForm(user: MockUser, overrides: Partial<VendorFormData>): VendorFormData {
  const [city, pin] = (() => {
    const m = user.address.match(/([A-Za-z]+)[\s,-]+(\d{6})/);
    return m ? [m[1], m[2]] : ["", ""];
  })();
  return {
    companyName: user.companyName, orgType: "Pvt Ltd", registrationNumber: "U74999XX2018PTC000000",
    yearEstablished: "2018", gst: "", pan: "", address: user.address,
    city, state: "India", pin,
    yearsInBusiness: "5", employees: "11-50", turnover: "25", certifications: "",
    categoryExperience: "5", projectCount: "10",
    references: [
      { clientName: "ABC Corp", projectValue: "300000", yearCompleted: "2024", description: "Similar project delivered successfully." },
      { clientName: "XYZ Ltd", projectValue: "450000", yearCompleted: "2023", description: "On-time delivery with positive feedback." },
    ],
    technicalCapability: "", qualityStandards: "", equipment: "Standard tools and trained personnel",
    quotedPrice: "", timeline: "30", whyUs: "",
    ...overrides,
  };
}

function buildApplications(): StoredApplication[] {
  const v1 = MOCK_USERS["vendor1@demo.com"];
  const v2 = MOCK_USERS["vendor2@demo.com"];
  const v3 = MOCK_USERS["vendor3@demo.com"];

  const apps: StoredApplication[] = [
    {
      id: "app-001", tenderId: "TND-2026-1001",
      vendorId: v1.id, vendorName: v1.companyName,
      createdAt: "2026-06-13T10:30:00.000Z",
      form: vendorForm(v1, {
        orgType: "Proprietorship", gst: "09ABCDE1234F1Z5", pan: "ABCDE1234F",
        yearEstablished: "2015", yearsInBusiness: "9", employees: "11-50",
        turnover: "25", certifications: "ISO 9001:2015",
        categoryExperience: "8", projectCount: "15",
        technicalCapability: "We specialize in ergonomic and commercial office furniture supply with 8 years experience. We are authorized dealers of leading brands and have completed over 15 projects.",
        qualityStandards: "ISO 9001:2015, BIS certified products only",
        quotedPrice: "425000", timeline: "21",
        whyUs: "We offer the best quality ergonomic furniture at competitive prices with proven track record of on-time delivery and after-sales support.",
      }),
      documents: [],
      match: {
        totalScore: 82, verdict: "SELECTED",
        breakdown: {
          eligibility: { score: 22, remark: "Meets all eligibility criteria" },
          technical: { score: 20, remark: "Strong technical capability" },
          experience: { score: 17, remark: "8 years relevant experience" },
          financial: { score: 16, remark: "Price within budget range" },
          documents: { score: 7, remark: "Most documents provided" },
        },
        matched: [
          "GST registration valid and provided", "ISO 9001:2015 certification confirmed",
          "8 years experience exceeds 5 year requirement", "Quoted price Rs.4,25,000 is within budget",
          "More than 3 similar projects completed",
        ],
        missing: ["BIS certification for products not explicitly confirmed", "2 supporting documents pending upload"],
        strengths: ["Extensive experience of 8 years in office furniture", "Competitive pricing at Rs.4,25,000", "ISO certified quality management"],
        concerns: ["Turnover of Rs.25 lakhs is marginally above minimum requirement"],
        priceFit: "Within Budget",
        summary: "Sharma Enterprises presents a strong application with relevant experience and certifications. The quoted price is competitive and within budget. Recommended for selection subject to document verification.",
      } satisfies MatchEvaluation,
    },
    {
      id: "app-002", tenderId: "TND-2026-1001",
      vendorId: v2.id, vendorName: v2.companyName,
      createdAt: "2026-06-14T14:15:00.000Z",
      form: vendorForm(v2, {
        orgType: "Pvt Ltd", gst: "27FGHIJ5678K2L6", pan: "FGHIJ5678K",
        yearEstablished: "2018", yearsInBusiness: "6", employees: "51-200",
        turnover: "85", certifications: "ISO 9001:2015, ISO 14001",
        categoryExperience: "6", projectCount: "22",
        technicalCapability: "NextGen Solutions is a premium furniture solutions provider with pan-India presence. We supply and install internationally sourced ergonomic furniture for Fortune 500 companies.",
        qualityStandards: "ISO 9001:2015, ISO 14001, BIFMA certified products",
        quotedPrice: "498000", timeline: "18",
        whyUs: "We bring international quality furniture brands with local service network. Our products come with 5 year warranty and dedicated account manager.",
      }),
      documents: [],
      match: {
        totalScore: 71, verdict: "UNDER_REVIEW",
        breakdown: {
          eligibility: { score: 23, remark: "Exceeds eligibility criteria" },
          technical: { score: 19, remark: "Good technical proposal" },
          experience: { score: 14, remark: "Good experience but newer company" },
          financial: { score: 10, remark: "Price near upper budget limit" },
          documents: { score: 5, remark: "Several documents missing" },
        },
        matched: [
          "GST and PAN registration confirmed", "Multiple ISO certifications exceed requirements",
          "High turnover of Rs.85 lakhs", "22 projects exceeds minimum requirement", "BIFMA certified products",
        ],
        missing: [
          "Quoted price Rs.4,98,000 is very close to maximum budget",
          "BIS certification not mentioned", "Several required documents not uploaded",
        ],
        strengths: ["Strong company profile with ISO and BIFMA certifications", "Large employee base ensuring service capability", "Impressive portfolio of 22 projects"],
        concerns: ["Quoted price is very close to budget ceiling", "Company established only in 2018 - 6 years experience", "Multiple documents not submitted"],
        priceFit: "Within Budget",
        summary: "NextGen Solutions has strong credentials but their pricing is near the budget ceiling and several documents are pending. Application placed under review pending document submission.",
      } satisfies MatchEvaluation,
    },
    {
      id: "app-003", tenderId: "TND-2026-1001",
      vendorId: v3.id, vendorName: v3.companyName,
      createdAt: "2026-06-15T09:00:00.000Z",
      form: vendorForm(v3, {
        orgType: "Partnership", gst: "27KLMNO9012P3Q7", pan: "KLMNO9012P",
        yearEstablished: "2020", yearsInBusiness: "4", employees: "1-10",
        turnover: "8", certifications: "None",
        categoryExperience: "3", projectCount: "4",
        technicalCapability: "We supply basic office furniture at affordable prices. Small team but dedicated service.",
        qualityStandards: "Standard quality",
        quotedPrice: "185000", timeline: "45",
        whyUs: "We offer lowest price in the market.",
      }),
      documents: [],
      match: {
        totalScore: 38, verdict: "NOT_SELECTED",
        breakdown: {
          eligibility: { score: 10, remark: "Does not meet key criteria" },
          technical: { score: 8, remark: "Weak technical proposal" },
          experience: { score: 8, remark: "Insufficient experience" },
          financial: { score: 9, remark: "Price suspiciously low" },
          documents: { score: 3, remark: "Most documents missing" },
        },
        matched: ["GST registration provided", "Price within budget range"],
        missing: [
          "ISO certification not held - mandatory requirement",
          "Annual turnover Rs.8 lakhs is below Rs.15 lakh minimum",
          "Only 3 years experience against 5 years requirement",
          "Only 4 projects against minimum 3 but value unknown",
          "Most required documents not uploaded",
        ],
        strengths: ["Very competitive pricing", "GST registered"],
        concerns: [
          "Does not meet minimum turnover requirement", "No quality certifications",
          "Very small team of less than 10 employees", "Price may indicate quality compromise",
          "Insufficient experience",
        ],
        priceFit: "Below Budget",
        summary: "RapidBuild Co. does not meet the minimum eligibility criteria for this tender. The vendor lacks required ISO certification, has insufficient turnover, and limited experience. Application is rejected at the eligibility stage.",
      } satisfies MatchEvaluation,
    },
    {
      id: "app-004", tenderId: "TND-2026-1002",
      vendorId: v2.id, vendorName: v2.companyName,
      createdAt: "2026-06-14T16:00:00.000Z",
      form: vendorForm(v2, {
        orgType: "Pvt Ltd", gst: "27FGHIJ5678K2L6", pan: "FGHIJ5678K",
        yearEstablished: "2018", yearsInBusiness: "6", employees: "51-200",
        turnover: "85", certifications: "ISO 9001:2015, ISO 27001, Microsoft Partner",
        categoryExperience: "6", projectCount: "18",
        technicalCapability: "We provide comprehensive IT support services with 24x7 NOC center, certified engineers, and proven SLA management.",
        qualityStandards: "ISO 27001 certified, ITIL framework",
        quotedPrice: "980000", timeline: "365",
        whyUs: "ISO 27001 certified IT company with dedicated NOC center and 50+ certified engineers available for this contract.",
      }),
      documents: [],
      match: {
        totalScore: 88, verdict: "SELECTED",
        breakdown: {
          eligibility: { score: 24, remark: "Exceeds all eligibility criteria" },
          technical: { score: 23, remark: "Excellent technical capability" },
          experience: { score: 18, remark: "Strong relevant experience" },
          financial: { score: 17, remark: "Competitive pricing within budget" },
          documents: { score: 6, remark: "Most documents submitted" },
        },
        matched: [
          "ISO 27001 and ISO 9001:2015 both certified", "Microsoft Partner status confirmed",
          "18 similar AMC projects completed", "Quoted price within budget",
          "51-200 employees confirms team strength", "24x7 support capability confirmed",
        ],
        missing: ["ITIL certification evidence not uploaded", "Sample SLA document not provided"],
        strengths: ["ISO 27001 certification ideal for IT security work", "Dedicated NOC center for 24x7 monitoring", "Strong portfolio of 18 AMC projects"],
        concerns: ["Company is 6 years old, relatively newer"],
        priceFit: "Within Budget",
        summary: "NextGen Solutions presents an excellent application with ISO 27001 certification, strong team, and 24x7 support capability. Highly recommended for selection for this IT AMC contract.",
      } satisfies MatchEvaluation,
    },
  ];
  return apps;
}

export function initializeMockData() {
  if (typeof localStorage === "undefined") return;
  // Always (re)write the users dict so quick logins keep working even if user clears partial keys.
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(MOCK_USERS));
  } catch {}
  if (localStorage.getItem(INIT_KEY)) return;
  try {
    localStorage.setItem(TENDERS_KEY, JSON.stringify(buildTenders()));
    localStorage.setItem(APPS_KEY, JSON.stringify(buildApplications()));
    localStorage.setItem(INIT_KEY, "true");
    window.dispatchEvent(new Event("tms-store-change"));
  } catch (e) {
    console.error("initializeMockData failed", e);
  }
}

export function getMockUsers(): Record<string, MockUser> {
  if (typeof localStorage === "undefined") return MOCK_USERS;
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : MOCK_USERS;
  } catch {
    return MOCK_USERS;
  }
}
