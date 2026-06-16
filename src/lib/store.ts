// LocalStorage-backed store for tenders + applications (mock backend)
import type { AIGeneratedTender, PdfFormData } from "@/lib/gemini";
import type { VendorAIContent, MatchEvaluation } from "@/lib/gemini";

const TENDERS_KEY = "tms.tenders.v1";
const APPS_KEY = "tms.applications.v2";

export interface StoredTender {
  id: string;
  referenceNumber: string;
  companyId: string;
  companyName: string;
  title: string;
  category: string;
  budgetMin: string;
  budgetMax: string;
  deadline: string;
  location: string;
  description: string;
  status: "active" | "closed" | "draft";
  createdAt: string;
  ai: AIGeneratedTender;
  pdfForm: PdfFormData;
  requiredDocuments: string[];
}

export interface ProjectReference {
  clientName: string;
  projectValue: string;
  yearCompleted: string;
  description: string;
}

export interface VendorFormData {
  // Section A
  companyName: string;
  orgType: string;
  registrationNumber: string;
  yearEstablished: string;
  gst: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  // Section B
  yearsInBusiness: string;
  employees: string;
  turnover: string;
  certifications: string;
  categoryExperience: string;
  // Section C
  projectCount: string;
  references: ProjectReference[];
  // Section D
  technicalCapability: string;
  qualityStandards: string;
  equipment: string;
  // Section E
  quotedPrice: string;
  timeline: string;
  // Section F
  whyUs: string;
}

export interface UploadedDocument {
  docName: string;
  fileName: string;
  dataUrl: string;
  size: number;
}

export interface StoredApplication {
  id: string;
  tenderId: string;
  vendorId: string;
  vendorName: string;
  createdAt: string;
  form: VendorFormData;
  documents: UploadedDocument[];
  aiContent?: VendorAIContent;
  match?: MatchEvaluation;
  vendorPdfDataUrl?: string;
}

function read<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("tms-store-change"));
    return true;
  } catch (e) {
    console.error("store write failed", e);
    return false;
  }
}

export const tenderStore = {
  list(): StoredTender[] {
    const tenders = read<StoredTender[]>(TENDERS_KEY, []);
    let changed = false;
    const now = new Date();

    tenders.forEach(t => {
      if (t.status === "active" && t.deadline && new Date(t.deadline) <= now) {
        t.status = "closed";
        changed = true;
      }
    });

    if (changed) {
      write(TENDERS_KEY, tenders);
    }
    return tenders;
  },
  get(id: string): StoredTender | undefined {
    return tenderStore.list().find((t) => t.id === id);
  },
  save(t: StoredTender) {
    const all = tenderStore.list().filter((x) => x.id !== t.id);
    all.unshift(t);
    write(TENDERS_KEY, all);
  },
  delete(id: string) {
    write(TENDERS_KEY, tenderStore.list().filter((t) => t.id !== id));
    write(APPS_KEY, applicationStore.list().filter((a) => a.tenderId !== id));
  },
};

export const applicationStore = {
  list(): StoredApplication[] {
    return read<StoredApplication[]>(APPS_KEY, []);
  },
  get(id: string): StoredApplication | undefined {
    return applicationStore.list().find((a) => a.id === id);
  },
  forTender(tenderId: string): StoredApplication[] {
    return applicationStore.list().filter((a) => a.tenderId === tenderId);
  },
  forVendor(vendorId: string): StoredApplication[] {
    return applicationStore.list().filter((a) => a.vendorId === vendorId);
  },
  save(a: StoredApplication) {
    const all = applicationStore.list().filter((x) => x.id !== a.id);
    all.unshift(a);
    if (write(APPS_KEY, all)) return;
    // Quota exceeded — retry without document dataUrls (keep metadata only)
    const slim: StoredApplication = {
      ...a,
      documents: a.documents.map((d) => ({ ...d, dataUrl: "" })),
      vendorPdfDataUrl: undefined,
    };
    const slimAll = applicationStore.list().filter((x) => x.id !== a.id);
    slimAll.unshift(slim);
    if (!write(APPS_KEY, slimAll)) {
      // Last resort — store just this app without others
      write(APPS_KEY, [slim]);
    }
  },
  countByTender(tenderId: string): number {
    return applicationStore.forTender(tenderId).length;
  },
};

// Mutable singletons — populated by syncCurrentUser() on app boot and after login.
export const CURRENT_COMPANY: { id: string; name: string; email: string; phone: string } = {
  id: "company-demo",
  name: "Procurement Office",
  email: "procurement@office.in",
  phone: "+91 11 2345 6789",
};
export const CURRENT_VENDOR: { id: string; name: string; email: string; phone: string } = {
  id: "vendor-demo",
  name: "Demo Vendor Pvt Ltd",
  email: "vendor@demo.in",
  phone: "+91 99 9999 9999",
};

export interface LoggedInUser {
  id: string;
  email: string;
  role: "company" | "vendor";
  name: string;
  companyName: string;
  address: string;
  phone: string;
}

const CURRENT_USER_KEY = "current_user";

export function getCurrentUser(): LoggedInUser | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? (JSON.parse(raw) as LoggedInUser) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: LoggedInUser) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
  syncCurrentUser();
}

export function clearCurrentUser() {
  if (typeof localStorage !== "undefined") localStorage.removeItem(CURRENT_USER_KEY);
  syncCurrentUser();
}

export function syncCurrentUser() {
  const u = getCurrentUser();
  if (u?.role === "company") {
    CURRENT_COMPANY.id = u.id;
    CURRENT_COMPANY.name = u.companyName;
    CURRENT_COMPANY.email = u.email;
    CURRENT_COMPANY.phone = u.phone;
  }
  if (u?.role === "vendor") {
    CURRENT_VENDOR.id = u.id;
    CURRENT_VENDOR.name = u.companyName;
    CURRENT_VENDOR.email = u.email;
    CURRENT_VENDOR.phone = u.phone;
  }
}

// Initialize at module load (no-op on server).
syncCurrentUser();

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
