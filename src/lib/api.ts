import { LoggedInUser, VendorFormData } from './store';

const API_BASE = 'http://localhost:3001/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('tms_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res: Response) => {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Request failed with status ${res.status}`);
  }
  return data;
};

// --------------------------------------------------
// Auth Service
// --------------------------------------------------
export const authApi = {
  async register(data: any) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async login(data: any) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await handleResponse(res);
    if (result.token) {
      localStorage.setItem('tms_token', result.token);
    }
    return result;
  },
  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  logout() {
    localStorage.removeItem('tms_token');
  }
};

// --------------------------------------------------
// Tenders Service
// --------------------------------------------------
export const tendersApi = {
  async list(status?: string) {
    const url = status ? `${API_BASE}/tenders?status=${status}` : `${API_BASE}/tenders`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(res);
  },
  async create(data: any) {
    const res = await fetch(`${API_BASE}/tenders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async getApplications(tenderId: string) {
    const res = await fetch(`${API_BASE}/tenders/${tenderId}/applications`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  }
};

// --------------------------------------------------
// Applications Service
// --------------------------------------------------
export const applicationsApi = {
  async create(data: VendorFormData & { tender_id: string }) {
    const res = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async get(applicationId: string) {
    const res = await fetch(`${API_BASE}/applications/${applicationId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  async updateVerdict(applicationId: string, verdict: string) {
    const res = await fetch(`${API_BASE}/applications/${applicationId}/verdict`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ verdict }),
    });
    return handleResponse(res);
  }
};

// --------------------------------------------------
// Documents Service
// --------------------------------------------------
export const documentsApi = {
  async upload(docName: string, file: File, applicationId?: string) {
    const formData = new FormData();
    if (applicationId) {
      formData.append('application_id', applicationId);
    }
    formData.append('doc_name', docName);
    formData.append('document', file);

    const token = localStorage.getItem('tms_token');
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData, // FormData automatically sets multipart/form-data boundary
    });
    return handleResponse(res);
  },
  async getOcr(documentId: string) {
    const res = await fetch(`${API_BASE}/documents/${documentId}/ocr`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  }
};

// --------------------------------------------------
// Admin Service
// --------------------------------------------------
export const adminApi = {
  async getDashboard() {
    const res = await fetch(`${API_BASE}/admin/dashboard`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  async updateTenderStatus(tenderId: string, status: string) {
    const res = await fetch(`${API_BASE}/admin/tenders/${tenderId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  }
};
