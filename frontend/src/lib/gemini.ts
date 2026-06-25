// jsPDF is dynamically imported inside textToPdf to avoid SSR issues

const API_BASE = 'http://localhost:3001/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('tms_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type GeminiProgress = (msg: string) => void;

async function callGeminiWithRetry(prompt: string, onProgress?: GeminiProgress): Promise<string> {
  let lastErr: any;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      if (attempt > 1) {
        onProgress?.(` Server busy, retrying (${attempt}/3) via Groq...`);
      } else {
        onProgress?.(`✨ AI generating with Groq...`);
      }

      const res = await fetch(`${API_BASE}/ai/generate`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const txt = await res.text();
        let message = txt;
        try {
          message = JSON.parse(txt)?.error || txt;
        } catch {}
        const err: any = new Error(`Groq proxy error ${res.status}: ${message}`);
        err.status = res.status;
        throw err;
      }

      const data = await res.json();
      const text = data?.text || "";
      if (!text) throw new Error("Empty response from AI proxy");
      return text;
    } catch (err: any) {
      lastErr = err;
      console.warn(`Groq attempt ${attempt} failed:`, err?.message);
      const retriable = err?.status === 503 || err?.status === 429 || err?.status === 500 || !err?.status;
      if (!retriable) break;
      if (attempt < 3) await sleep(attempt * 2000);
    }
  }
  throw lastErr || new Error("Groq generation failed after retries");
}

export async function callGemini(prompt: string): Promise<string> {
  return callGeminiWithRetry(prompt);
}


export interface TenderData {
  title: string;
  refNumber: string;
  category: string;
  subCategory: string;
  budgetMin: string;
  budgetMax: string;
  currency: string;
  deadline: string;
  completionDate: string;
  city: string;
  state: string;
  address: string;
  description: string;
  scope: string;
  techSpecs: string;
  qualityStandards: string;
  warrantyRequired: boolean;
  warrantyDuration: string;
  paymentTerms: string;
  emd: string;
  performanceSecurity: string;
  skills: string[];
  eligibility: string[];
  documents: string[];
  contactName: string;
  designation: string;
  email: string;
  phone: string;
  altPhone: string;
}

export interface EnhancedTender {
  enhancedTitle: string;
  enhancedDescription: string;
  enhancedScope: string;
  enhancedTechnicalSpecs: string;
  enhancedEligibility: string[];
  enhancedDocs: string[];
  enhancedPaymentTerms: string;
  enhancedTermsAndConditions: string[];
  enhancedEvaluationCriteria: string;
  basisOfTender: string;
  nitIntroduction: string;
}

export function buildEnhancePrompt(t: TenderData): string {
  const location = [t.address, t.city, t.state].filter(Boolean).join(", ");
  return `You are a senior government procurement officer with 20 years of experience writing official tender documents in India.

A company has submitted basic tender information. Transform this basic input into complete, professional, formal government tender language.

RULES:
- Keep ALL facts exactly the same (budget, dates, location, company name, contact details — never change these)
- Only enhance the language and add missing professional content
- Write in formal Indian government procurement style
- Plain text only — absolutely NO markdown, NO **, NO ##, NO *
- If a field is empty or too short, write appropriate professional content based on context of other fields
- Make every section complete and detailed
- Add relevant legal and technical language naturally

RAW TENDER DATA:
Title: ${t.title}
Category: ${t.category}${t.subCategory ? " / " + t.subCategory : ""}
Description: ${t.description}
Scope of Work: ${t.scope}
Technical Specifications: ${t.techSpecs}
Quality Standards: ${t.qualityStandards}
Warranty: ${t.warrantyRequired ? "Required - " + t.warrantyDuration : "Not required"}
Budget: ${t.currency} ${t.budgetMin} to ${t.currency} ${t.budgetMax}
Deadline: ${t.deadline}
Location: ${location}
Eligibility Criteria: ${(t.eligibility || []).join(", ")}
Required Skills: ${(t.skills || []).join(", ")}
Payment Terms: ${t.paymentTerms}
Required Documents: ${(t.documents || []).join(", ")}
EMD: ${t.emd || "Not applicable"}
Performance Security: ${t.performanceSecurity ? t.performanceSecurity + "%" : "Not applicable"}
Contact: ${t.contactName}, ${t.email}, ${t.phone}

Return ONLY a valid JSON object. No text before or after. No markdown. Just the raw JSON:
{
  "enhancedTitle": "professional version of tender title",
  "enhancedDescription": "3-4 paragraph professional project overview written in formal government language explaining the procurement need, its importance, and objectives",
  "enhancedScope": "detailed scope of work with numbered points covering supply, delivery, installation, quality checks, site cleanup, and handover — written formally",
  "enhancedTechnicalSpecs": "complete technical specifications with material standards, quality requirements, compliance with BIS or relevant Indian Standards, dimensions, capacity, warranty details — written as formal specs",
  "enhancedEligibility": ["criterion 1", "criterion 2", "criterion 3", "criterion 4", "criterion 5"],
  "enhancedDocs": ["Document 1 with exact requirement details", "Document 2", "Document 3"],
  "enhancedPaymentTerms": "full professional payment terms paragraph",
  "enhancedTermsAndConditions": ["term 1", "term 2", "term 3", "term 4", "term 5", "term 6", "term 7", "term 8"],
  "enhancedEvaluationCriteria": "complete evaluation methodology paragraph in formal language",
  "basisOfTender": "item rate basis / percentage rate basis / lump sum basis",
  "nitIntroduction": "formal 2-3 sentence NIT introduction paragraph inviting sealed tenders from eligible contractors"
}`;
}

function stripMarkdown(s: string): string {
  if (!s) return s;
  return String(s)
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[\*\-]\s+/gm, "")
    .replace(/`{1,3}/g, "")
    .trim();
}

function fallbackFor(field: "description" | "scope" | "techSpecs", t: TenderData): string {
  const loc = [t.address, t.city, t.state].filter(Boolean).join(", ") || "the specified location";
  const who = t.contactName || "The tendering authority";
  switch (field) {
    case "description":
      return `${who} invites tenders for ${t.title || "the procurement"} at ${loc}. The procurement is essential for operational requirements and shall be executed strictly as per the specifications, terms, and conditions outlined in this tender document.`;
    case "scope":
      return `1. Supply of ${t.title || "items"} as per specifications.\n2. Delivery to ${loc}.\n3. Installation and commissioning at site.\n4. Quality inspection and testing.\n5. Site cleanup and handover documentation.`;
    case "techSpecs":
      return `All items shall comply with the relevant Bureau of Indian Standards (BIS). Quality inspection shall be carried out before acceptance. A minimum warranty of 12 months from the date of installation is required.`;
  }
}

export async function enhanceTenderWithAI(t: TenderData, onProgress?: GeminiProgress): Promise<EnhancedTender> {
  const text = await callGeminiWithRetry(buildEnhancePrompt(t), onProgress);
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Gemini returned no JSON");
  const obj = JSON.parse(match[0]) as EnhancedTender;
  obj.enhancedTitle = stripMarkdown(obj.enhancedTitle || t.title);
  obj.enhancedDescription = stripMarkdown(obj.enhancedDescription || t.description) || fallbackFor("description", t);
  obj.enhancedScope = stripMarkdown(obj.enhancedScope || t.scope) || fallbackFor("scope", t);
  obj.enhancedTechnicalSpecs = stripMarkdown(obj.enhancedTechnicalSpecs || t.techSpecs) || fallbackFor("techSpecs", t);
  obj.enhancedPaymentTerms = stripMarkdown(obj.enhancedPaymentTerms || t.paymentTerms);
  obj.enhancedEvaluationCriteria = stripMarkdown(obj.enhancedEvaluationCriteria || "");
  obj.basisOfTender = stripMarkdown(obj.basisOfTender || "item rate basis");
  obj.nitIntroduction = stripMarkdown(obj.nitIntroduction || "");
  obj.enhancedEligibility = (obj.enhancedEligibility || t.eligibility || []).map(stripMarkdown);
  obj.enhancedDocs = (obj.enhancedDocs || t.documents || []).map(stripMarkdown);
  obj.enhancedTermsAndConditions = (obj.enhancedTermsAndConditions || []).map(stripMarkdown);
  return obj;
}

export function mergeEnhanced(t: TenderData, e: EnhancedTender): TenderData {
  return {
    ...t,
    // Keep facts (budget, dates, contacts, refNumber, location) untouched
    title: e.enhancedTitle || t.title,
    description: e.enhancedDescription || t.description,
    scope: e.enhancedScope || t.scope,
    techSpecs: e.enhancedTechnicalSpecs || t.techSpecs,
    paymentTerms: e.enhancedPaymentTerms || t.paymentTerms,
    eligibility: e.enhancedEligibility?.length ? e.enhancedEligibility : t.eligibility,
    documents: e.enhancedDocs?.length ? e.enhancedDocs : t.documents,
  };
}



export function buildTenderPrompt(t: TenderData): string {
  return `You are a professional tender document writer. Return ONLY clean HTML — no markdown, no **, no ##, no * bullets. Use proper HTML tags only: <h2 class="section-title">, <h3>, <p>, <ul>, <li>, <strong>, <table>, <thead>, <tbody>, <tr>, <th>, <td>, <div class="highlight-box">.
Do NOT include <html>, <head>, <body>, <style>, or <script> tags. Do not wrap output in code fences. Start directly with the first <h2 class="section-title"> tag.

If any specific detail is not provided, write a professionally drafted placeholder sentence appropriate for a real tender document. Never write instructions to yourself in brackets like [Insert Ministry Name]. Never say "this section requires more detail". Always write complete, professional sentences.

TENDER DETAILS:
- Title: ${t.title}
- Reference: ${t.refNumber}
- Category: ${t.category}${t.subCategory ? " / " + t.subCategory : ""}
- Budget: ${t.currency} ${t.budgetMin} to ${t.currency} ${t.budgetMax}
- Submission Deadline: ${t.deadline}
- Work Completion: ${t.completionDate}
- Location: ${t.address}, ${t.city}, ${t.state}

PROJECT DESCRIPTION:
${t.description}

SCOPE OF WORK:
${t.scope}

TECHNICAL SPECIFICATIONS:
${t.techSpecs}
Quality Standards: ${t.qualityStandards}
Warranty: ${t.warrantyRequired ? `Required - ${t.warrantyDuration}` : "Not required"}

ELIGIBILITY CRITERIA:
${t.eligibility.map((e) => "- " + e).join("\n")}

REQUIRED SKILLS:
${t.skills.join(", ")}

DOCUMENTS REQUIRED FROM VENDOR:
${t.documents.map((d) => "- " + d).join("\n")}

PAYMENT TERMS: ${t.paymentTerms}
EMD AMOUNT: ${t.currency} ${t.emd || "Not applicable"}
PERFORMANCE SECURITY: ${t.performanceSecurity ? t.performanceSecurity + "%" : "Not applicable"}

CONTACT: ${t.contactName}, ${t.designation}, ${t.email}, ${t.phone}${t.altPhone ? ", " + t.altPhone : ""}

Generate a complete tender document with these numbered sections, each starting with <h2 class="section-title">SECTION TITLE</h2>:
1. PROJECT OVERVIEW
2. SCOPE OF WORK
3. TECHNICAL REQUIREMENTS AND SPECIFICATIONS
4. ELIGIBILITY CRITERIA
5. FINANCIAL REQUIREMENTS
6. DOCUMENTS TO BE SUBMITTED
7. EVALUATION CRITERIA
8. GENERAL TERMS AND CONDITIONS
9. SUBMISSION INSTRUCTIONS
10. CONTACT DETAILS

Use <ul><li> for any lists. Use <table> with <thead>/<tbody> for tabular data (e.g. evaluation weightage, payment schedule). Use <strong> for emphasis. Use formal legal language.`;
}

const TENDER_STYLES = `
  body { font-family: Arial, sans-serif; font-size: 11pt; color: #000; line-height: 1.6; margin: 0; padding: 0; }
  .tender-header { text-align: center; border-bottom: 3px double #000; padding-bottom: 20px; margin-bottom: 30px; }
  .tender-header h1 { font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 4px 0; letter-spacing: 1px; }
  .tender-header h2 { font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 10px 0 4px; border: 2px solid #000; padding: 6px 16px; display: inline-block; }
  .tender-header p { font-size: 10pt; margin: 2px 0; }
  .meta-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 10.5pt; }
  .meta-table td { padding: 6px 10px; border: 1px solid #999; }
  .meta-table td:first-child { font-weight: bold; background-color: #f0f0f0; width: 35%; }
  h2.section-title { font-size: 12pt; font-weight: bold; text-transform: uppercase; background-color: #1a1a2e; color: #fff; padding: 8px 12px; margin-top: 28px; margin-bottom: 12px; letter-spacing: 0.5px; }
  h3 { font-size: 11pt; font-weight: bold; margin-top: 16px; margin-bottom: 6px; text-decoration: underline; }
  p { margin: 8px 0; text-align: justify; }
  ul { margin: 8px 0 8px 20px; padding: 0; }
  li { margin: 5px 0; line-height: 1.5; }
  .highlight-box { border: 1px solid #333; padding: 10px 14px; margin: 12px 0; background-color: #fafafa; }
  .footer-line { border-top: 2px solid #000; text-align: center; padding-top: 10px; margin-top: 40px; font-size: 9pt; color: #444; }
  strong { font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  table td, table th { border: 1px solid #aaa; padding: 7px 10px; font-size: 10pt; }
  table th { background-color: #e0e0e0; font-weight: bold; }
`;

function escapeHtml(s: string): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

function sanitizeGeminiHtml(raw: string): string {
  let html = raw.trim();
  html = html.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trim();
  html = html.replace(/<\/?(html|body|head)[^>]*>/gi, "");
  html = html.replace(/<style[\s\S]*?<\/style>/gi, "");
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  // Strip residual markdown if the model slipped
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/^\s*#{1,6}\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^\s*[\*\-]\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/\[(insert|add|specify|enter|tbd)[^\]]*\]/gi, "");
  return html;
}

export function buildTenderHtml(t: TenderData, geminiHtml: string): string {
  const issuanceDate = new Date().toLocaleDateString("en-IN");
  const deadlineStr = t.deadline ? new Date(t.deadline).toLocaleString("en-IN") : "As notified";
  const location = [t.address, t.city, t.state].filter(Boolean).join(", ");
  const body = sanitizeGeminiHtml(geminiHtml);

  return `<div><style>${TENDER_STYLES}</style>
    <div class="tender-header">
      <h1>Government of India</h1>
      <p>Issuing Authority / Department</p>
      <h2>Tender for ${escapeHtml(t.title)}</h2>
    </div>
    <table class="meta-table">
      <tr><td>Tender Reference No.</td><td>${escapeHtml(t.refNumber)}</td></tr>
      <tr><td>Tender Title</td><td>${escapeHtml(t.title)}</td></tr>
      <tr><td>Category</td><td>${escapeHtml(t.category)}${t.subCategory ? " / " + escapeHtml(t.subCategory) : ""}</td></tr>
      <tr><td>Issuance Date</td><td>${issuanceDate}</td></tr>
      <tr><td>Submission Deadline</td><td>${escapeHtml(deadlineStr)}</td></tr>
      <tr><td>Location</td><td>${escapeHtml(location)}</td></tr>
      <tr><td>Estimated Budget</td><td>${escapeHtml(t.currency)} ${escapeHtml(t.budgetMin)} to ${escapeHtml(t.currency)} ${escapeHtml(t.budgetMax)}</td></tr>
    </table>
    ${body}
    <div class="footer-line">End of Tender Document — ${escapeHtml(t.refNumber)} — Confidential</div>
  </div>`;
}

function daysBetween(fromIso: string, toIso: string): number {
  if (!fromIso || !toIso) return 30;
  const a = new Date(fromIso).getTime();
  const b = new Date(toIso).getTime();
  if (isNaN(a) || isNaN(b)) return 30;
  return Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

async function buildTenderJsPdf(t: TenderData, e?: EnhancedTender) {
  const { default: jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = 15;

  const addBorder = () => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, pageW - 20, pageH - 20);
    doc.setLineWidth(0.2);
    doc.rect(11, 11, pageW - 22, pageH - 22);
  };

  const addPageNumber = () => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Page ${(doc.internal as any).getCurrentPageInfo().pageNumber}`, pageW / 2, pageH - 12, { align: "center" });
    doc.setTextColor(0);
  };

  const addPage = () => {
    addPageNumber();
    doc.addPage();
    y = 15;
    addBorder();
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageH - 20) addPage();
  };

  const justifyParagraph = (text: string, x: number, width: number, lineHeight = 4.5) => {
    const lines = doc.splitTextToSize(text, width) as string[];
    lines.forEach((line, idx) => {
      checkPageBreak(lineHeight);
      const isLast = idx === lines.length - 1;
      const words = line.split(/\s+/).filter(Boolean);
      if (!isLast && words.length > 1) {
        const wordsWidth = words.reduce((s, w) => s + doc.getTextWidth(w), 0);
        const gap = (width - wordsWidth) / (words.length - 1);
        let cx = x;
        words.forEach((w, i) => {
          doc.text(w, cx, y);
          cx += doc.getTextWidth(w) + (i < words.length - 1 ? gap : 0);
        });
      } else {
        doc.text(line, x, y);
      }
      y += lineHeight;
    });
  };

  const location = [t.address, t.city, t.state].filter(Boolean).join(", ");
  const companyName = t.contactName ? `${t.contactName.toUpperCase()} PROCUREMENT OFFICE` : "TENDER ISSUING AUTHORITY";
  const inr = (v: string | number) => `Rs. ${Number(v || 0).toLocaleString("en-IN")}`;
  const completionDays = t.completionDate && t.deadline ? daysBetween(t.deadline, t.completionDate) : 30;

  // PAGE 1
  addBorder();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(companyName, pageW / 2, y + 6, { align: "center" });
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(location || "Address not specified", pageW / 2, y + 2, { align: "center" });
  y += 8;
  doc.setDrawColor(0);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageW - margin, y);
  y += 1.5;
  doc.line(margin, y, pageW - margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Ref No: ${t.refNumber}`, margin, y);
  doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, pageW - margin, y, { align: "right" });
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("NOTICE INVITING TENDER", pageW / 2, y, { align: "center" });
  y += 4;
  doc.setLineWidth(0.3);
  doc.line(pageW / 2 - 38, y, pageW / 2 + 38, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  justifyParagraph(
    e?.nitIntroduction
    || `${companyName} invites tenders on ${e?.basisOfTender || "item rate basis"} from eligible contractors for the following work at ${location || "the specified location"}:`,
    margin, contentW, 4.5
  );
  y += 4;

  // Details table
  doc.setLineWidth(0.3);
  const tableTop = y;
  const colWidths = [10, 60, 25, 25, 25, 35];
  const headers = ["S.No", "Name of Work", "EMD (Rs.)", "Budget (Rs.)", "Completion Period", "Last Date of Submission"];
  const headerHeight = 12;
  doc.setFillColor(220, 220, 220);
  doc.rect(margin, tableTop, contentW, headerHeight, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  let xPos = margin;
  headers.forEach((h, i) => {
    doc.rect(xPos, tableTop, colWidths[i], headerHeight);
    const lines = doc.splitTextToSize(h, colWidths[i] - 2);
    doc.text(lines, xPos + colWidths[i] / 2, tableTop + headerHeight / 2, { align: "center", baseline: "middle" });
    xPos += colWidths[i];
  });
  y = tableTop + headerHeight;
  const rowData = [
    "1",
    t.title || "Work as per specifications",
    t.emd ? inr(t.emd) : "Nil",
    inr(t.budgetMax),
    `${completionDays} Days`,
    t.deadline ? new Date(t.deadline).toLocaleDateString("en-IN") : "As per NIT",
  ];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  xPos = margin;
  const maxRowH = 14;
  rowData.forEach((d, i) => {
    doc.rect(xPos, y, colWidths[i], maxRowH);
    const lines = doc.splitTextToSize(d, colWidths[i] - 2);
    doc.text(lines, xPos + colWidths[i] / 2, y + maxRowH / 2, { align: "center", baseline: "middle" });
    xPos += colWidths[i];
  });
  y += maxRowH + 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("1. Scope of Work:", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  justifyParagraph(t.scope || t.description || "Detailed scope as per specifications.", margin + 3, contentW - 5, 4.2);

  // PAGE 2
  addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("I. Time Schedule of Tender Activities:", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const deadlineDate = t.deadline ? new Date(t.deadline) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const downloadDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const openingDate = new Date(deadlineDate.getTime() + 24 * 60 * 60 * 1000);
  const scheduleItems = [
    `a) Last Date & Time for downloading tender documents: ${downloadDeadline.toLocaleDateString("en-IN")} from 09:00 AM`,
    `b) Last Date & Time for submission of Tender: ${deadlineDate.toLocaleDateString("en-IN")} at 05:00 PM`,
    `c) Date & Time of opening of Tender: ${openingDate.toLocaleDateString("en-IN")} at 03:00 PM`,
  ];
  scheduleItems.forEach((item) => {
    checkPageBreak(8);
    const lines = doc.splitTextToSize(item, contentW - 3) as string[];
    doc.text(lines, margin + 3, y);
    y += lines.length * 4.5 + 3;
  });
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("II. Qualification Criteria:", margin, y);
  y += 7;
  (t.eligibility || []).forEach((c, idx) => {
    checkPageBreak(12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const label = String.fromCharCode(97 + idx) + ") ";
    const lines = doc.splitTextToSize(label + c, contentW - 5) as string[];
    doc.text(lines, margin + 3, y);
    y += lines.length * 4.5 + 4;
  });
  y += 4;

  if (t.skills && t.skills.length > 0) {
    checkPageBreak(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("III. Required Skills / Qualifications:", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    t.skills.forEach((s, i) => {
      checkPageBreak(6);
      doc.text(`(${i + 1})  ${s}`, margin + 5, y);
      y += 5;
    });
    y += 4;
  }

  if (t.techSpecs) {
    checkPageBreak(15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("IV. Technical Specifications:", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    justifyParagraph(t.techSpecs, margin + 3, contentW - 5, 4.2);
    y += 4;
  }

  // PAGE 3
  addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("V. Financial Requirements:", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const financialItems = [
    `a) Estimated Cost: ${inr(t.budgetMin)} to ${inr(t.budgetMax)} (${t.currency || "INR"})`,
    `b) Earnest Money Deposit (EMD): ${t.emd ? inr(t.emd) : "Not Applicable"}`,
    `c) Performance Security: ${t.performanceSecurity ? t.performanceSecurity + "% of Contract Value" : "Not Applicable"}`,
    `d) Payment Terms: ${t.paymentTerms || "As per contract agreement"}`,
  ];
  financialItems.forEach((item) => {
    checkPageBreak(6);
    const lines = doc.splitTextToSize(item, contentW - 3) as string[];
    doc.text(lines, margin + 3, y);
    y += lines.length * 4.5 + 3;
  });
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("VI. Documents to be Submitted:", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const docsList = (t.documents && t.documents.length > 0)
    ? t.documents
    : ["Company Registration Certificate", "GST Certificate", "PAN Card"];
  docsList.forEach((d, i) => {
    checkPageBreak(6);
    const lines = doc.splitTextToSize(`${i + 1}.  ${d}`, contentW - 5) as string[];
    doc.text(lines, margin + 5, y);
    y += lines.length * 5;
  });
  y += 6;

  checkPageBreak(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("VII. Evaluation Criteria:", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  if (e?.enhancedEvaluationCriteria) {
    justifyParagraph(e.enhancedEvaluationCriteria, margin + 3, contentW - 5, 4.5);
  } else {
    const evalItems = [
      "Stage 1: Preliminary Scrutiny - Verification of all mandatory eligibility criteria and required documents. Vendors failing to meet criteria will be disqualified.",
      "Stage 2: Technical Evaluation - Assessment of technical proposal, compliance with specifications, experience, qualifications, and quality certifications.",
      "Stage 3: Financial Evaluation - Only technically qualified vendors will proceed. The lowest technically qualified bid will generally be preferred.",
    ];
    evalItems.forEach((item, i) => {
      checkPageBreak(12);
      const lines = doc.splitTextToSize(`${String.fromCharCode(97 + i)})  ${item}`, contentW - 5) as string[];
      doc.text(lines, margin + 3, y);
      y += lines.length * 4.5 + 4;
    });
  }

  // PAGE 4
  addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("VIII. General Terms & Conditions:", margin, y);
  y += 7;
  const defaultTerms = [
    "The tendering authority reserves the right to accept or reject any or all tenders without assigning any reason whatsoever.",
    "Bids shall remain valid for a period of 90 days from the tender submission deadline.",
    `The contract shall be governed by the laws of India. The courts in ${location || "the project location"} shall have exclusive jurisdiction.`,
    "Neither party shall be liable for any failure or delay in performance due to Force Majeure events including acts of God, war, floods, or strikes.",
    "Any dispute shall first be resolved amicably within 30 days. Failing which, the matter shall be referred to arbitration under the Arbitration and Conciliation Act, 1996.",
    "All information provided in this document is confidential and shall not be disclosed to any third party without prior written consent.",
    "Late submissions will be summarily rejected. No extension of deadline shall be granted under any circumstances.",
    "Canvassing in any form will disqualify the vendor.",
    "The vendor shall bear all costs associated with the preparation and submission of their tender.",
    `All correspondence must be addressed to: ${t.contactName || "The Authorized Officer"}, Email: ${t.email || "N/A"}, Phone: ${t.phone || "N/A"}`,
  ];
  const terms = (e?.enhancedTermsAndConditions && e.enhancedTermsAndConditions.length > 0)
    ? [...e.enhancedTermsAndConditions, `All correspondence must be addressed to: ${t.contactName || "The Authorized Officer"}, Email: ${t.email || "N/A"}, Phone: ${t.phone || "N/A"}`]
    : defaultTerms;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  terms.forEach((term, i) => {
    checkPageBreak(14);
    const lines = doc.splitTextToSize(`${i + 1}.  ${term}`, contentW - 5) as string[];
    doc.text(lines, margin + 3, y);
    y += lines.length * 4.5 + 4;
  });
  y += 8;

  checkPageBreak(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("IX. Submission Instructions:", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const subInstructions = [
    `a)  Mode: Tenders must be submitted electronically through the designated e-procurement portal or in a sealed envelope clearly marked "Tender for ${t.title} - ${t.refNumber}".`,
    "b)  Format: All documents must be submitted in PDF format. Financial bids must be submitted separately from technical bids.",
    "c)  Language: All documents and correspondence must be in English.",
    "d)  Clarifications: Vendors may seek clarifications in writing to the contact person no later than 7 days before the submission deadline.",
  ];
  subInstructions.forEach((item) => {
    checkPageBreak(12);
    const lines = doc.splitTextToSize(item, contentW - 3) as string[];
    doc.text(lines, margin + 3, y);
    y += lines.length * 4.5 + 3;
  });

  addPageNumber();
  return doc;
}

export async function downloadTenderPdf(t: TenderData, enhanced?: EnhancedTender) {
  const doc = await buildTenderJsPdf(t, enhanced);
  doc.save(`${t.refNumber}.pdf`);
}

export async function buildTenderPdfBlobUrl(t: TenderData, enhanced?: EnhancedTender): Promise<string> {
  const doc = await buildTenderJsPdf(t, enhanced);
  const blob: Blob = doc.output("blob");
  return URL.createObjectURL(blob);
}

// Legacy fallback
export async function textToPdf(title: string, body: string) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 40, 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(body.replace(/<[^>]+>/g, ""), 515);
  doc.text(lines, 40, 90);
  return doc;
}

export interface MatchResult {
  score: number;
  verdict: "SELECTED" | "NOT_SELECTED";
  matched: string[];
  missing: string[];
  strengths: string[];
  concerns: string[];
  price_fit: string;
  recommendation: string;
}

export function buildMatchPrompt(tender: any, vendor: any): string {
  return `You are a procurement expert. Compare this tender's requirements against the vendor's profile and give an objective match score.

TENDER REQUIREMENTS:
- Category: ${tender.category}
- Required Skills: ${(tender.skills || []).join(", ")}
- Eligibility Criteria: ${(tender.eligibility || []).join("; ")}
- Technical Requirements: ${tender.techSpecs || tender.description}
- Minimum Experience: ${tender.minExperience || "N/A"}
- Minimum Turnover: ${tender.minTurnover || "N/A"}
- Required Documents: ${(tender.documents || []).join(", ")}
- Budget Range: ${tender.budgetMin} to ${tender.budgetMax}
- Quoted Price from Vendor: ${vendor.quotedPrice}

VENDOR PROFILE:
- Company: ${vendor.company}
- GST: ${vendor.gst}
- Established: ${vendor.established}
- Employees: ${vendor.employees}
- Annual Turnover: ₹${vendor.turnover} lakhs
- Certifications: ${vendor.certifications}
- Experience in category: ${vendor.experience} years
- Similar projects: ${vendor.similarProjects}
- Technical capability: ${vendor.techCapability}
- Quality Standards: ${vendor.qualityStandards}
- Equipment/Machinery: ${vendor.equipment}
- Why Us / Pitch: ${vendor.whyUs}
- References: ${vendor.references}

CRITICAL AUTHENTICITY CHECK:
Analyze the vendor's descriptive responses (Similar projects, Technical capability, Quality Standards, Equipment/Machinery, Why Us / Pitch, References) for signs of being copy-pasted from the internet, generic marketing fluff, or AI-generated writing. We strictly require authentic, human-written responses detailing specific, real-world experience. If the text appears copied, lacks specific human detail, or sounds like an AI wrote it, severely penalize the match score (deduct at least 20-30 points) and flag this as a critical concern in the "concerns" array.

Return ONLY a valid JSON object (no markdown, no code fences):
{
  "score": number (0-100),
  "verdict": "SELECTED" or "NOT_SELECTED",
  "matched": ["requirement 1 matched", "requirement 2 matched"],
  "missing": ["requirement 1 missing"],
  "strengths": ["key strength 1"],
  "concerns": ["concern 1"],
  "price_fit": "Within budget" or "Exceeds budget" or "Well within budget",
  "recommendation": "One line summary"
}`;
}

export async function getMatchResult(tender: any, vendor: any): Promise<MatchResult> {
  const text = await callGemini(buildMatchPrompt(tender, vendor));
  const cleaned = text.replace(/```json|```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in response");
  return JSON.parse(match[0]);
}

// ============================================================
// SIMPLE FLOW: 7-field form -> generateFullTender -> generateTenderPDF
// ============================================================

export interface SimpleTenderInput {
  title: string;
  category: string;
  budgetMin: string;
  budgetMax: string;
  deadline: string; // ISO yyyy-mm-dd
  location: string;
  description: string;
  companyName?: string;
  referenceNumber?: string;
}

export interface AIGeneratedTender {
  projectDescription: string;
  scopeOfWork: string[];
  technicalSpecifications: string;
  eligibilityCriteria: string[];
  requiredSkills: string[];
  emdAmount: string;
  paymentTerms: string;
  requiredDocuments: string[];
  qualificationSummary: string;
  evaluationMethod: string;
  generalConditions: string[];
  timeSchedule: {
    documentDownloadEnd: string;
    submissionDeadline: string;
    openingDate: string;
  };
}

const inr = (n: number | string) => {
  const v = Number(n) || 0;
  return v.toLocaleString("en-IN");
};
const fmtDDMMYYYY = (iso: string) => {
  const d = iso ? new Date(iso) : new Date();
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
};
const addDays = (iso: string, days: number) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return fmtDDMMYYYY(d.toISOString());
};

function buildFullTenderPrompt(input: SimpleTenderInput): string {
  const companyName = input.companyName || "The Company";
  return `You are an expert Indian procurement specialist with 20 years of experience writing official tender documents. A private company has described their procurement need in simple words. Read their description carefully and generate ALL required tender content professionally based on it.

COMPANY INPUT:
Tender Title: ${input.title}
Category: ${input.category}
Budget: Rs.${input.budgetMin} to Rs.${input.budgetMax}
Deadline: ${input.deadline}
Location: ${input.location}
Company Description (what they need): ${input.description}

Even if the title seems incomplete or unclear, create the most professional version possible based on the category selected. Everything must be SPECIFIC to what they described. Do NOT write generic or unrelated content.

GENERATE:
1. projectDescription: 3-4 professional paragraphs explaining this procurement, based entirely on what the company described. Explain the need, objective, expected outcome and importance.
2. scopeOfWork: array of 6-8 specific work items directly related to what was described. Include supply, delivery, installation, testing, handover as relevant.
3. technicalSpecifications: detailed technical specs relevant to this specific procurement. Materials, standards, quality, compliance with BIS or Indian Standards, warranty requirements.
4. eligibilityCriteria: array of 6 criteria appropriate for this category and budget. Include GST, experience years, turnover requirement (set as 3x of max budget), certifications, similar projects completed.
5. requiredSkills: array of 6-8 skill tags/keywords relevant to this specific tender.
6. emdAmount: 2% of max budget as string "Rs. X,XXX" in Indian format. If max budget under Rs.50000 write "Nil".
7. paymentTerms: full formal payment terms paragraph appropriate for this budget and category.
8. requiredDocuments: array of 8-10 documents vendor must submit, specific to this category.
9. qualificationSummary: one paragraph summarizing who is eligible.
10. evaluationMethod: one paragraph explaining the 3-stage evaluation process.
11. generalConditions: array of exactly 10 formal legal conditions, standard Indian procurement terms.
12. timeSchedule: object with documentDownloadEnd (7 days before deadline), submissionDeadline (the deadline), openingDate (1 day after deadline). All DD/MM/YYYY.

STRICT RULES:
- Plain text ONLY
- NO markdown symbols: no **, no ##, no *, no --
- NO placeholder text like [insert here]
- All content must relate to: "${input.title}"
- Amounts in Indian format with Rs. prefix
- NEVER write "Government of India" anywhere in any field
- NEVER write "designated procurement entity" 
- NEVER write "government" or "ministry" references
- The company is a PRIVATE company, not a government body
- In projectDescription, start with the company name directly
  Example: "${companyName} invites bids from eligible suppliers for..."
- Write as if a private Indian company is procuring this
- Do not use government-style opening lines anywhere in content
- NEVER use the word "bidder" anywhere. Always use "vendor" instead of "bidder" throughout all content.
- Return ONLY valid JSON, nothing else before or after

{
  "projectDescription": "paragraphs here",
  "scopeOfWork": ["item 1","item 2","item 3","item 4","item 5","item 6","item 7","item 8"],
  "technicalSpecifications": "full specs paragraph",
  "eligibilityCriteria": ["criterion 1","criterion 2","criterion 3","criterion 4","criterion 5","criterion 6"],
  "requiredSkills": ["skill 1","skill 2","skill 3","skill 4","skill 5","skill 6"],
  "emdAmount": "Rs. X,XXX or Nil",
  "paymentTerms": "full payment terms paragraph",
  "requiredDocuments": ["doc 1","doc 2","doc 3","doc 4","doc 5","doc 6","doc 7","doc 8"],
  "qualificationSummary": "paragraph",
  "evaluationMethod": "paragraph",
  "generalConditions": ["c1","c2","c3","c4","c5","c6","c7","c8","c9","c10"],
  "timeSchedule": { "documentDownloadEnd": "DD/MM/YYYY", "submissionDeadline": "DD/MM/YYYY", "openingDate": "DD/MM/YYYY" }
}`;
}

function fallbackAITender(input: SimpleTenderInput): AIGeneratedTender {
  const maxB = Number(input.budgetMax) || 0;
  const emd = maxB < 50000 ? "Nil" : `Rs. ${inr(Math.round(maxB * 0.02))}`;
  const turnover = `Rs. ${inr(Math.round(maxB * 3))}`;
  return {
    projectDescription: `The tendering authority invites sealed tenders for ${input.title} under the category of ${input.category} to be executed at ${input.location}. ${input.description}\n\nThe procurement is essential to fulfil the operational requirements of the office and shall be executed strictly in accordance with the specifications, terms and conditions set forth in this tender document. Vendors shall ensure that the supplied goods and services meet the prescribed Indian Standards and quality benchmarks.\n\nThe objective of this tender is to identify a competent and experienced vendor capable of delivering the work within the stipulated budget and time-frame, while maintaining the highest standards of quality, transparency and compliance with applicable regulations.`,
    scopeOfWork: [
      `Supply of all items required for ${input.title} as per the specifications.`,
      `Transportation and safe delivery of materials to ${input.location}.`,
      `Installation and commissioning at the designated site.`,
      `Quality inspection and functional testing of all delivered items.`,
      `Training of designated personnel where applicable.`,
      `Submission of warranty and operation manuals.`,
      `Site cleanup and removal of packaging materials.`,
      `Handover of completed work with all supporting documentation.`,
    ],
    technicalSpecifications: `All goods and services supplied shall conform to the relevant Bureau of Indian Standards (BIS) and other applicable Indian Standards for the ${input.category} category. Materials used shall be of first quality, free from defects, and procured from reputed manufacturers. Quality inspection shall be carried out by the tendering authority at any stage and rejected items shall be replaced by the vendor at no additional cost. A minimum warranty of twelve (12) months from the date of successful installation and acceptance is required, covering all manufacturing and workmanship defects. The vendor shall provide test certificates, compliance certificates and any other documentary evidence of quality.`,
    eligibilityCriteria: [
      "The vendor must be a legally registered entity in India and possess a valid GST registration.",
      "The vendor must have a minimum of three (3) years of relevant experience in the same category of work.",
      `The vendor must have an average annual turnover of at least ${turnover} over the last three financial years.`,
      "The vendor must possess valid PAN and applicable statutory registrations.",
      "The vendor must have successfully completed at least two similar projects of comparable value within the last five years.",
      "The vendor must not be blacklisted or debarred by any Central or State Government department or PSU.",
    ],
    requiredSkills: [input.category, "Project Management", "Quality Assurance", "Indian Standards Compliance", "After-Sales Support", "Documentation"],
    emdAmount: emd,
    paymentTerms: `Payment shall be released in stages: ten percent (10%) as mobilisation advance against an equivalent bank guarantee, seventy percent (70%) on successful delivery and installation, ten percent (10%) on satisfactory testing and commissioning, and the balance ten percent (10%) on submission of performance security and completion of warranty obligations. All payments shall be subject to deduction of applicable taxes at source and shall be made through electronic transfer within thirty (30) working days of receipt of a duly verified invoice.`,
    requiredDocuments: [
      "Company registration certificate",
      "GST registration certificate",
      "PAN card copy",
      "Income tax returns for the last three financial years",
      "Audited financial statements for the last three years",
      "Bank solvency certificate",
      "List of similar completed projects with client references",
      "Power of attorney / authorisation letter of the signatory",
      "Self-declaration of non-blacklisting",
      "Technical compliance sheet duly signed and stamped",
    ],
    qualificationSummary: `Only those vendors who meet all the eligibility criteria stated herein, possess the requisite technical capability, financial strength and prior experience in the ${input.category} category, and are able to execute the work at ${input.location} within the prescribed time-frame, shall be considered qualified to participate in this tender.`,
    evaluationMethod: `The evaluation shall be carried out in three stages. In the first stage, the preliminary eligibility documents shall be examined for completeness and compliance. In the second stage, the technical bids of eligible vendors shall be evaluated against the technical specifications and qualification criteria. In the third stage, the financial bids of only the technically qualified vendors shall be opened, and the contract shall be awarded to the lowest evaluated responsive vendor (L1).`,
    generalConditions: [
      "The tendering authority reserves the right to accept or reject any or all tenders without assigning any reason.",
      "Tenders received after the prescribed submission deadline shall be summarily rejected.",
      "Conditional tenders or tenders with deviations from the prescribed terms are liable to be rejected.",
      "The successful vendor shall furnish a performance security equivalent to five percent (5%) of the contract value.",
      "All disputes shall be subject to the exclusive jurisdiction of the courts at the location of the tendering authority.",
      "The contract shall be governed by the laws of India and the Indian Contract Act, 1872.",
      "Force majeure events shall be governed as per the applicable provisions of Indian law.",
      "The vendor shall comply with all statutory obligations including labour, safety and environmental regulations.",
      "Liquidated damages at the rate of half percent (0.5%) per week of delay, subject to a maximum of ten percent (10%) of the contract value, shall be levied for delays attributable to the vendor.",
      "The vendor shall not sub-contract the work in whole or in part without the prior written consent of the tendering authority.",
    ],
    timeSchedule: {
      documentDownloadEnd: addDays(input.deadline, -7),
      submissionDeadline: fmtDDMMYYYY(input.deadline),
      openingDate: addDays(input.deadline, 1),
    },
  };
}

export async function generateFullTender(
  input: SimpleTenderInput,
  onProgress?: GeminiProgress,
): Promise<AIGeneratedTender> {
  try {
    const raw = await callGeminiWithRetry(buildFullTenderPrompt(input), onProgress);
    const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");
    const obj = JSON.parse(match[0]) as AIGeneratedTender;
    // Sanitize strings
    const clean = (s: any) => (typeof s === "string" ? stripMarkdown(s) : s);
    obj.projectDescription = clean(obj.projectDescription);
    obj.technicalSpecifications = clean(obj.technicalSpecifications);
    obj.paymentTerms = clean(obj.paymentTerms);
    obj.qualificationSummary = clean(obj.qualificationSummary);
    obj.evaluationMethod = clean(obj.evaluationMethod);
    obj.emdAmount = clean(obj.emdAmount);
    obj.scopeOfWork = (obj.scopeOfWork || []).map(clean);
    obj.eligibilityCriteria = (obj.eligibilityCriteria || []).map(clean);
    obj.requiredSkills = (obj.requiredSkills || []).map(clean);
    obj.requiredDocuments = (obj.requiredDocuments || []).map(clean);
    obj.generalConditions = (obj.generalConditions || []).map(clean);
    // Ensure timeSchedule defaults
    const fb = fallbackAITender(input).timeSchedule;
    obj.timeSchedule = {
      documentDownloadEnd: clean(obj.timeSchedule?.documentDownloadEnd) || fb.documentDownloadEnd,
      submissionDeadline: clean(obj.timeSchedule?.submissionDeadline) || fb.submissionDeadline,
      openingDate: clean(obj.timeSchedule?.openingDate) || fb.openingDate,
    };
    return obj;
  } catch (err) {
    console.error("generateFullTender failed, using fallback:", err);
    return fallbackAITender(input);
  }
}

export interface PdfFormData {
  referenceNumber: string;
  companyName: string;
  title: string;
  category: string;
  budgetMin: string;
  budgetMax: string;
  currency: string;
  deadline: string;
  location: string;
  completionDays?: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export async function generateTenderPDF(formData: PdfFormData, ai: AIGeneratedTender) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = 210, ph = 297, ml = 18, mr = 18;
  const cw = pw - ml - mr;
  let y = 20;
  let pageNum = 1;

  const drawBorder = () => {
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.8);
    doc.rect(12, 12, pw - 24, ph - 24);
    doc.setLineWidth(0.25);
    doc.rect(14, 14, pw - 28, ph - 28);
  };
  const addFooter = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(130);
    doc.line(ml, ph - 16, pw - mr, ph - 16);
    doc.text(formData.referenceNumber, ml, ph - 11);
    doc.text("Confidential Document", pw / 2, ph - 11, { align: "center" });
    doc.text(`Page ${pageNum}`, pw - mr, ph - 11, { align: "right" });
    doc.setTextColor(0);
  };
  const checkSpace = (need: number) => {
    if (y + need > ph - 25) {
      addFooter();
      doc.addPage();
      pageNum++;
      y = 20;
      drawBorder();
    }
  };
  const sectionBar = (title: string) => {
    checkSpace(16);
    y += 3;
    doc.setFillColor(20, 50, 100);
    doc.roundedRect(ml, y, cw, 8.5, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(title, ml + 4, y + 5.8);
    doc.setTextColor(0);
    y += 12;
  };
  const bodyPara = (text: string, indent = 0) => {
    if (!text || !text.trim()) return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.8);
    doc.setTextColor(30, 30, 30);
    const paragraphs = text.split(/\n+/);
    paragraphs.forEach((para) => {
      const lines = doc.splitTextToSize(para, cw - indent);
      lines.forEach((line: string) => {
        checkSpace(5);
        doc.text(line, ml + indent, y);
        y += 4.8;
      });
      y += 1.5;
    });
    y += 1;
  };
  const numberedList = (items: string[]) => {
    if (!items || !items.length) return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.8);
    items.forEach((item, i) => {
      const label = `${i + 1}.`;
      const lines = doc.splitTextToSize(`${label}  ${item}`, cw - 6);
      lines.forEach((line: string, li: number) => {
        checkSpace(5);
        doc.text(line, ml + (li === 0 ? 0 : 6), y);
        y += 4.8;
      });
      y += 1;
    });
    y += 2;
  };
  const alphaList = (items: string[]) => {
    if (!items || !items.length) return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.8);
    items.forEach((item, i) => {
      const label = `${String.fromCharCode(97 + i)})`;
      const lines = doc.splitTextToSize(`${label}  ${item}`, cw - 6);
      lines.forEach((line: string, li: number) => {
        checkSpace(5);
        doc.text(line, ml + (li === 0 ? 0 : 6), y);
        y += 4.8;
      });
      y += 1;
    });
    y += 2;
  };
  const infoRow = (label: string, value: string) => {
    checkSpace(6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.8);
    doc.text(`${label}:`, ml, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value || "", cw - 44);
    lines.forEach((line: string, i: number) => {
      if (i > 0) {
        checkSpace(5);
        y += 4.8;
      }
      doc.text(line, ml + 44, y);
    });
    y += 5.5;
  };
  const divider = () => {
    checkSpace(5);
    doc.setDrawColor(200);
    doc.setLineWidth(0.2);
    doc.line(ml, y, pw - mr, y);
    y += 4;
    doc.setDrawColor(0);
  };
  const skillPills = (skills: string[]) => {
    if (!skills || !skills.length) return;
    let x = ml;
    const pillH = 6;
    const padding = 4;
    doc.setFontSize(8);
    skills.forEach((skill) => {
      const w = doc.getTextWidth(skill) + padding * 2;
      if (x + w > pw - mr) { x = ml; y += pillH + 3; }
      checkSpace(pillH + 3);
      doc.setFillColor(235, 242, 255);
      doc.setDrawColor(100, 140, 200);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y - 4.5, w, pillH, 1.5, 1.5, "FD");
      doc.setTextColor(20, 60, 140);
      doc.text(skill, x + padding, y);
      doc.setTextColor(0);
      x += w + 3;
    });
    y += pillH + 4;
  };
  const metaTable = () => {
    const rows = [
      ["Tender Reference No.", formData.referenceNumber, "Issuance Date", new Date().toLocaleDateString("en-IN")],
      ["Tender Title", formData.title, "Category", formData.category],
      ["Budget Range", `Rs.${inr(formData.budgetMin)} to Rs.${inr(formData.budgetMax)}`, "Currency", formData.currency || "INR"],
      ["Submission Deadline", ai.timeSchedule?.submissionDeadline || "", "EMD Amount", ai.emdAmount || "Nil"],
      ["Project Location", formData.location, "Completion Period", `${formData.completionDays || 30} Days`],
    ];
    const colW = [38, 52, 38, 46];
    const rowH = 8;
    doc.setFontSize(8);
    rows.forEach((row) => {
      checkSpace(rowH + 2);
      let x = ml;
      [0, 2].forEach((idx, i) => {
        const lw = colW[idx];
        const vw = colW[idx + 1];
        doc.setFillColor(235, 240, 250);
        doc.setDrawColor(180);
        doc.setLineWidth(0.2);
        doc.rect(x, y, lw, rowH, "FD");
        doc.setFont("helvetica", "bold");
        doc.setTextColor(20, 50, 100);
        doc.text(String(row[idx]), x + 2, y + 5.5);
        x += lw;
        doc.setFillColor(255, 255, 255);
        doc.rect(x, y, vw, rowH, "FD");
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 30, 30);
        const v = doc.splitTextToSize(String(row[idx + 1] || ""), vw - 3);
        doc.text(v[0] || "", x + 2, y + 5.5);
        x += vw;
      });
      y += rowH;
    });
    y += 6;
    doc.setDrawColor(0);
  };

  // BUILD
  drawBorder();

  // HEADER
  doc.setFillColor(20, 50, 100);
  doc.rect(ml, y, cw, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(formData.companyName || "PROCUREMENT OFFICE", pw / 2, y + 6, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(formData.location || "", pw / 2, y + 11, { align: "center" });
  doc.setTextColor(0);
  y += 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 50, 100);
  doc.text("NOTICE INVITING TENDER", pw / 2, y, { align: "center" });
  y += 3;
  doc.setDrawColor(20, 50, 100);
  doc.setLineWidth(0.5);
  doc.line(pw / 2 - 30, y, pw / 2 + 30, y);
  doc.setTextColor(0);
  doc.setDrawColor(0);
  y += 7;

  metaTable();
  divider();

  bodyPara(
    `This office invites sealed tenders on item rate basis from eligible contractors for the work described herein at ${formData.location}. Interested vendors are requested to carefully read all terms, conditions, and specifications before submitting their tender.`,
  );

  let sectionIndex = 1;
  const renderSectionBar = (title: string) => {
    sectionBar(`${sectionIndex}.  ${title}`);
    sectionIndex++;
  };

  if (ai.projectDescription && ai.projectDescription.trim() !== "") {
    renderSectionBar("PROJECT DESCRIPTION");
    bodyPara(ai.projectDescription);
  }

  if (ai.scopeOfWork && ai.scopeOfWork.length > 0) {
    renderSectionBar("SCOPE OF WORK");
    numberedList(ai.scopeOfWork);
  }

  if (ai.technicalSpecifications && ai.technicalSpecifications.trim() !== "") {
    renderSectionBar("TECHNICAL SPECIFICATIONS");
    bodyPara(ai.technicalSpecifications);
  }

  const hasTimeSchedule = ai.timeSchedule && (ai.timeSchedule.documentDownloadEnd || ai.timeSchedule.submissionDeadline || ai.timeSchedule.openingDate);
  if (hasTimeSchedule) {
    renderSectionBar("TIME SCHEDULE OF TENDER ACTIVITIES");
    alphaList([
      `Last date for downloading tender documents: ${ai.timeSchedule.documentDownloadEnd || ""} upto 05:00 PM`,
      `Last date and time for submission of tender: ${ai.timeSchedule.submissionDeadline || ""} upto 05:00 PM`,
      `Date and time of opening of tenders: ${ai.timeSchedule.openingDate || ""} at 03:00 PM`,
    ]);
  }

  const hasEligibility = (ai.qualificationSummary && ai.qualificationSummary.trim() !== "") || (ai.eligibilityCriteria && ai.eligibilityCriteria.length > 0);
  if (hasEligibility) {
    renderSectionBar("ELIGIBILITY CRITERIA");
    if (ai.qualificationSummary && ai.qualificationSummary.trim() !== "") bodyPara(ai.qualificationSummary);
    if (ai.qualificationSummary && ai.qualificationSummary.trim() !== "" && ai.eligibilityCriteria && ai.eligibilityCriteria.length > 0) y += 2;
    if (ai.eligibilityCriteria && ai.eligibilityCriteria.length > 0) alphaList(ai.eligibilityCriteria);
  }

  if (ai.requiredSkills && ai.requiredSkills.length > 0) {
    renderSectionBar("REQUIRED SKILLS & EXPERTISE");
    skillPills(ai.requiredSkills);
  }

  renderSectionBar("FINANCIAL REQUIREMENTS");
  infoRow("Estimated Budget", `Rs.${inr(formData.budgetMin)} to Rs.${inr(formData.budgetMax)}`);
  infoRow("Earnest Money Deposit", ai.emdAmount || "Nil");
  infoRow("Performance Security", "5% of contract value");
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.8);
  checkSpace(6);
  doc.text("Payment Terms:", ml, y);
  y += 5;
  bodyPara(ai.paymentTerms || "As per standard government norms.");

  if (ai.requiredDocuments && ai.requiredDocuments.length > 0) {
    renderSectionBar("DOCUMENTS TO BE SUBMITTED BY VENDOR");
    numberedList(ai.requiredDocuments);
  }

  if (ai.evaluationMethod && ai.evaluationMethod.trim() !== "") {
    renderSectionBar("EVALUATION CRITERIA");
    bodyPara(ai.evaluationMethod);
  }

  if (ai.generalConditions && ai.generalConditions.length > 0) {
    renderSectionBar("GENERAL TERMS & CONDITIONS");
    numberedList(ai.generalConditions);
  }

  renderSectionBar("SUBMISSION INSTRUCTIONS");
  alphaList([
    `Tenders must be submitted in a sealed envelope clearly marked "Tender for ${formData.title} - ${formData.referenceNumber}" to the address mentioned above.`,
    "All documents must be submitted in PDF format. Technical and financial bids must be submitted in separate sealed envelopes.",
    "All documents and correspondence must be in English only.",
    "Vendors may seek clarifications in writing no later than 7 days before the submission deadline.",
    "Late submissions will be summarily rejected without any consideration.",
  ]);

  renderSectionBar("CONTACT DETAILS");
  infoRow("Contact Person", formData.contactName || "");
  infoRow("Email Address", formData.contactEmail || "");
  infoRow("Phone Number", formData.contactPhone || "");
  infoRow("Office Address", formData.location || "");

  addFooter();
  return doc;
}

// ============================================================
// VENDOR APPLICATION: AI content + PDF + Match evaluation
// ============================================================

export interface VendorAIContent {
  executiveSummary: string;
  companyProfile: string;
  technicalProposal: string;
  experienceStatement: string;
  qualityAssurance: string;
  financialStatement: string;
  projectPlan: string[];
  complianceStatement: string;
  declaration: string;
}

export interface MatchBreakdownItem { score: number; remark: string; }
export interface MatchEvaluation {
  totalScore: number;
  verdict: "SELECTED" | "UNDER_REVIEW" | "NOT_SELECTED";
  breakdown: {
    eligibility: MatchBreakdownItem;
    technical: MatchBreakdownItem;
    experience: MatchBreakdownItem;
    financial: MatchBreakdownItem;
    documents: MatchBreakdownItem;
  };
  matched: string[];
  missing: string[];
  strengths: string[];
  concerns: string[];
  priceFit: string;
  summary: string;
}

export interface VendorAIInput {
  companyName: string;
  orgType: string;
  gst: string;
  pan: string;
  yearEstablished: string;
  employees: string;
  turnover: string;
  certifications: string;
  categoryExperience: string;
  projectCount: string;
  references: Array<{ clientName: string; projectValue: string; yearCompleted: string; description: string }>;
  technicalCapability: string;
  qualityStandards: string;
  quotedPrice: string;
  timeline: string;
  whyUs: string;
  uploadedDocs: string[];
  address: string;
  city: string;
  state: string;
  pin: string;
}

export interface VendorTenderRef {
  id: string;
  title: string;
  category: string;
  budgetMin: string;
  budgetMax: string;
  requiredSkills: string[];
  eligibilityCriteria: string[];
  technicalSpecifications: string;
  requiredDocuments: string[];
  emdAmount: string;
}

function buildVendorContentPrompt(vendor: VendorAIInput, tender: VendorTenderRef): string {
  return `You are a professional bid writer helping a vendor create a formal tender application document for a PRIVATE Indian company procurement.

TENDER THEY ARE APPLYING FOR:
Title: ${tender.title}
Category: ${tender.category}
Budget: Rs.${tender.budgetMin} to Rs.${tender.budgetMax}
Required Skills: ${(tender.requiredSkills || []).join(", ")}
Eligibility Criteria: ${(tender.eligibilityCriteria || []).join(" | ")}
Technical Specs Required: ${tender.technicalSpecifications}
Required Documents: ${(tender.requiredDocuments || []).join(", ")}

VENDOR DETAILS:
Company: ${vendor.companyName}
Type: ${vendor.orgType}
GST: ${vendor.gst}
PAN: ${vendor.pan}
Established: ${vendor.yearEstablished}
Employees: ${vendor.employees}
Annual Turnover: Rs.${vendor.turnover} lakhs
Certifications: ${vendor.certifications}
Experience in category: ${vendor.categoryExperience} years
Similar projects: ${vendor.projectCount}
Project References: ${JSON.stringify(vendor.references)}
Technical Capability: ${vendor.technicalCapability}
Quality Standards: ${vendor.qualityStandards}
Quoted Price: Rs.${vendor.quotedPrice}
Completion Timeline: ${vendor.timeline} days
Why select us: ${vendor.whyUs}

Generate a formal vendor application/bid document. Never use the word "bidder" — always use "vendor". Never reference government/ministry. Plain text only — no markdown.

Return ONLY valid JSON, nothing else:
{
  "executiveSummary": "2-3 paragraph professional introduction of the vendor and why they are applying",
  "companyProfile": "detailed paragraph about the company, history, capabilities, expertise relevant to this tender",
  "technicalProposal": "detailed paragraph explaining how vendor meets each technical requirement of the tender",
  "experienceStatement": "paragraph about relevant past projects and experience in this category",
  "qualityAssurance": "paragraph about quality standards, certifications and processes",
  "financialStatement": "formal paragraph about financial capability, turnover, and bid amount justification",
  "projectPlan": ["milestone 1 with timeline","milestone 2 with timeline","milestone 3 with timeline","milestone 4 with timeline","milestone 5 with timeline"],
  "complianceStatement": "paragraph confirming vendor meets all eligibility criteria",
  "declaration": "formal declaration that all info is true and vendor agrees to tender terms"
}`;
}

function fallbackVendorContent(v: VendorAIInput, t: VendorTenderRef): VendorAIContent {
  return {
    executiveSummary: `${v.companyName} is pleased to submit this formal application for the tender titled "${t.title}". With ${v.categoryExperience || "several"} years of dedicated experience in the ${t.category} category and a proven track record of ${v.projectCount || "multiple"} successfully completed projects, our organisation is well-positioned to deliver the scope of work to the highest professional standards.\n\nWe have carefully reviewed the tender documents and confirm our complete understanding of and compliance with the requirements set forth.`,
    companyProfile: `${v.companyName} is a ${v.orgType || "registered"} entity established in ${v.yearEstablished || "the recent past"}, with an annual turnover of Rs.${v.turnover || "—"} lakhs and a workforce of ${v.employees || "qualified"} personnel. The company holds the following certifications: ${v.certifications || "Standard industry certifications"}. We operate from ${[v.address, v.city, v.state, v.pin].filter(Boolean).join(", ")}.`,
    technicalProposal: v.technicalCapability || `Our team will execute the work in strict accordance with the technical specifications laid down in the tender. We will deploy qualified personnel, appropriate machinery and quality materials conforming to relevant Indian Standards.`,
    experienceStatement: `Over the last five years our company has successfully completed ${v.projectCount || "several"} similar projects, including engagements with respected clients in the ${t.category} domain. Detailed references are provided in the annexure of this application.`,
    qualityAssurance: `${v.qualityStandards || "Our quality processes are aligned with industry best practices."} All deliverables undergo multi-stage inspection, and our organisation follows documented standard operating procedures backed by ${v.certifications || "applicable certifications"}.`,
    financialStatement: `With an audited annual turnover of Rs.${v.turnover || "—"} lakhs, the company has the requisite financial strength to undertake this engagement. Our quoted price of Rs.${Number(v.quotedPrice || 0).toLocaleString("en-IN")} has been arrived at after careful estimation of materials, labour, statutory levies and a reasonable margin.`,
    projectPlan: [
      "Week 1: Project kick-off, site survey and detailed planning",
      "Week 2-3: Procurement of materials and resource mobilisation",
      "Week 4-6: Execution of core scope as per specifications",
      `Week ${Math.max(7, Math.round(Number(v.timeline || 30) / 7) - 1)}: Quality inspection and testing`,
      `Week ${Math.max(8, Math.round(Number(v.timeline || 30) / 7))}: Handover, documentation and warranty activation`,
    ],
    complianceStatement: `We confirm that our organisation meets all the eligibility criteria stated in the tender, including registration, financial turnover, prior experience and statutory compliance requirements.`,
    declaration: `I hereby declare that all the information provided in this application is true and correct to the best of my knowledge. We unconditionally accept all the terms and conditions of this tender. Signed for and on behalf of ${v.companyName}.`,
  };
}

export async function generateVendorApplication(
  vendor: VendorAIInput,
  tender: VendorTenderRef,
  onProgress?: GeminiProgress,
): Promise<VendorAIContent> {
  try {
    const raw = await callGeminiWithRetry(buildVendorContentPrompt(vendor, tender), onProgress);
    const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("No JSON in vendor content response");
    const obj = JSON.parse(m[0]) as VendorAIContent;
    const clean = (s: any) => (typeof s === "string" ? stripMarkdown(s) : s);
    obj.executiveSummary = clean(obj.executiveSummary);
    obj.companyProfile = clean(obj.companyProfile);
    obj.technicalProposal = clean(obj.technicalProposal);
    obj.experienceStatement = clean(obj.experienceStatement);
    obj.qualityAssurance = clean(obj.qualityAssurance);
    obj.financialStatement = clean(obj.financialStatement);
    obj.complianceStatement = clean(obj.complianceStatement);
    obj.declaration = clean(obj.declaration);
    obj.projectPlan = (obj.projectPlan || []).map(clean);
    return obj;
  } catch (err) {
    console.error("generateVendorApplication failed, using fallback:", err);
    return fallbackVendorContent(vendor, tender);
  }
}

function buildMatchEvalPrompt(vendor: VendorAIInput, tender: VendorTenderRef): string {
  return `You are a senior procurement evaluation officer. Compare this vendor's application against the tender requirements and give an objective evaluation score.

TENDER REQUIREMENTS:
Title: ${tender.title}
Category: ${tender.category}
Budget Range: Rs.${tender.budgetMin} to Rs.${tender.budgetMax}
Required Skills: ${(tender.requiredSkills || []).join(", ")}
Eligibility Criteria: ${(tender.eligibilityCriteria || []).join(" | ")}
Technical Specifications: ${tender.technicalSpecifications}
Required Documents: ${(tender.requiredDocuments || []).join(", ")}
EMD Required: ${tender.emdAmount}

VENDOR APPLICATION:
Company: ${vendor.companyName}
Experience in Category: ${vendor.categoryExperience} years
Annual Turnover: Rs.${vendor.turnover} lakhs
Certifications: ${vendor.certifications}
Similar Projects Completed: ${vendor.projectCount}
Technical Capability: ${vendor.technicalCapability}
Quoted Price: Rs.${vendor.quotedPrice}
Documents Uploaded: ${(vendor.uploadedDocs || []).join(", ")}
Quality Standards: ${vendor.qualityStandards}

Evaluate on 5 parameters (use the word "vendor", never "bidder"):
1. Eligibility Match (25 points)
2. Technical Match (25 points)
3. Experience Match (20 points)
4. Financial Match (20 points)
5. Document Match (10 points)

Verdict rules:
- SELECTED: total >= 75
- UNDER_REVIEW: 50-74
- NOT_SELECTED: < 50

Return ONLY valid JSON:
{
  "totalScore": 0-100,
  "verdict": "SELECTED" | "UNDER_REVIEW" | "NOT_SELECTED",
  "breakdown": {
    "eligibility": { "score": 0, "remark": "one line" },
    "technical": { "score": 0, "remark": "one line" },
    "experience": { "score": 0, "remark": "one line" },
    "financial": { "score": 0, "remark": "one line" },
    "documents": { "score": 0, "remark": "one line" }
  },
  "matched": ["...","...","..."],
  "missing": ["...","..."],
  "strengths": ["...","...","..."],
  "concerns": ["...","..."],
  "priceFit": "Within Budget" | "Below Budget" | "Exceeds Budget",
  "summary": "2-3 sentence overall evaluation"
}`;
}

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

function fallbackMatch(v: VendorAIInput, t: VendorTenderRef): MatchEvaluation {
  const quoted = Number(v.quotedPrice) || 0;
  const bMin = Number(t.budgetMin) || 0;
  const bMax = Number(t.budgetMax) || 0;
  const inBudget = quoted >= bMin && quoted <= bMax;
  const overBudget = quoted > bMax;
  const exp = Number(v.categoryExperience) || 0;
  const eligibility = clamp((exp >= 3 ? 18 : 12) + (v.gst ? 4 : 0) + (v.pan ? 3 : 0), 0, 25);
  const technical = clamp((v.technicalCapability ? 18 : 8) + (v.certifications ? 5 : 0), 0, 25);
  const experience = clamp(Math.min(exp * 3, 15) + (Number(v.projectCount) > 0 ? 5 : 0), 0, 20);
  const financial = clamp((inBudget ? 14 : overBudget ? 6 : 10) + (Number(v.turnover) > 0 ? 6 : 0), 0, 20);
  const documents = clamp(Math.round(((v.uploadedDocs?.length || 0) / Math.max(1, t.requiredDocuments.length)) * 10), 0, 10);
  const total = eligibility + technical + experience + financial + documents;
  const verdict: MatchEvaluation["verdict"] = total >= 75 ? "SELECTED" : total >= 50 ? "UNDER_REVIEW" : "NOT_SELECTED";
  return {
    totalScore: total,
    verdict,
    breakdown: {
      eligibility: { score: eligibility, remark: v.gst ? "Core registrations available" : "GST/PAN details incomplete" },
      technical: { score: technical, remark: v.technicalCapability ? "Technical capability described" : "Technical capability statement weak" },
      experience: { score: experience, remark: `${exp} years of category experience reported` },
      financial: { score: financial, remark: inBudget ? "Quoted price within budget" : overBudget ? "Quoted price exceeds budget" : "Quoted price below budget" },
      documents: { score: documents, remark: `${v.uploadedDocs?.length || 0} of ${t.requiredDocuments.length} documents uploaded` },
    },
    matched: [
      v.gst ? "GST registered" : "Registered entity",
      `${exp} years of experience in ${t.category}`,
      inBudget ? "Quoted price within budget" : "Bid submitted",
    ],
    missing: [
      v.certifications ? "" : "Quality certifications not provided",
      (v.uploadedDocs?.length || 0) < t.requiredDocuments.length ? `${t.requiredDocuments.length - (v.uploadedDocs?.length || 0)} required documents not uploaded` : "",
    ].filter(Boolean),
    strengths: [v.technicalCapability ? "Clear technical capability statement" : "Application submitted on time", v.projectCount ? "Relevant past project track record" : "Vendor profile established"],
    concerns: [overBudget ? "Quoted price exceeds the tender budget" : ""].filter(Boolean),
    priceFit: inBudget ? "Within Budget" : overBudget ? "Exceeds Budget" : "Below Budget",
    summary: verdict === "SELECTED"
      ? "Strong overall match with the tender requirements. Recommend proceeding with this vendor."
      : verdict === "UNDER_REVIEW"
        ? "Vendor meets most requirements but a few gaps need clarification before selection."
        : "Application does not meet several critical requirements and is unlikely to be selected.",
  };
}

export async function evaluateVendorMatch(
  vendor: VendorAIInput,
  tender: VendorTenderRef,
  onProgress?: GeminiProgress,
): Promise<MatchEvaluation> {
  try {
    const raw = await callGeminiWithRetry(buildMatchEvalPrompt(vendor, tender), onProgress);
    const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("No JSON in match response");
    const obj = JSON.parse(m[0]) as MatchEvaluation;
    return obj;
  } catch (err) {
    console.error("evaluateVendorMatch failed, using fallback:", err);
    return fallbackMatch(vendor, tender);
  }
}

export interface VendorPdfFormData {
  applicationId: string;
  tenderRefNumber: string;
  tenderTitle: string;
  tenderCategory: string;
  tenderBudgetMin: string;
  tenderBudgetMax: string;
  vendorCompany: string;
  vendorQuotedPrice: string;
  vendorTimeline: string;
  vendorTurnover: string;
  vendorGst: string;
  vendorPan: string;
  vendorYearEstablished: string;
  vendorEmployees: string;
  vendorAddress: string;
  certifications: string;
  references: Array<{ clientName: string; projectValue: string; yearCompleted: string; description: string }>;
  uploadedDocs: string[];
  tenderEligibility: string[];
}

export async function generateVendorPDF(form: VendorPdfFormData, ai: VendorAIContent, match?: MatchEvaluation) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = 210, ph = 297, ml = 18, mr = 18;
  const cw = pw - ml - mr;
  let y = 20;
  let pageNum = 1;

  const drawBorder = () => {
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.8);
    doc.rect(12, 12, pw - 24, ph - 24);
    doc.setLineWidth(0.25);
    doc.rect(14, 14, pw - 28, ph - 28);
  };
  const addFooter = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(130);
    doc.line(ml, ph - 16, pw - mr, ph - 16);
    doc.text(form.applicationId, ml, ph - 11);
    doc.text("Vendor Application — Confidential", pw / 2, ph - 11, { align: "center" });
    doc.text(`Page ${pageNum}`, pw - mr, ph - 11, { align: "right" });
    doc.setTextColor(0);
  };
  const checkSpace = (need: number) => {
    if (y + need > ph - 25) {
      addFooter();
      doc.addPage();
      pageNum++;
      y = 20;
      drawBorder();
    }
  };
  const sectionBar = (title: string) => {
    checkSpace(16);
    y += 3;
    doc.setFillColor(20, 50, 100);
    doc.roundedRect(ml, y, cw, 8.5, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(title, ml + 4, y + 5.8);
    doc.setTextColor(0);
    y += 12;
  };
  const bodyPara = (text: string, indent = 0) => {
    if (!text || !text.trim()) return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.8);
    doc.setTextColor(30, 30, 30);
    text.split(/\n+/).forEach((para) => {
      const lines = doc.splitTextToSize(para, cw - indent);
      lines.forEach((line: string) => {
        checkSpace(5);
        doc.text(line, ml + indent, y);
        y += 4.8;
      });
      y += 1.5;
    });
    y += 1;
  };
  const numberedList = (items: string[]) => {
    if (!items || !items.length) return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.8);
    items.forEach((item, i) => {
      const lines = doc.splitTextToSize(`${i + 1}.  ${item}`, cw - 6);
      lines.forEach((line: string, li: number) => {
        checkSpace(5);
        doc.text(line, ml + (li === 0 ? 0 : 6), y);
        y += 4.8;
      });
      y += 1;
    });
    y += 2;
  };
  const infoRow = (label: string, value: string) => {
    checkSpace(6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.8);
    doc.text(`${label}:`, ml, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value || "—", cw - 50);
    lines.forEach((line: string, i: number) => {
      if (i > 0) { checkSpace(5); y += 4.8; }
      doc.text(line, ml + 50, y);
    });
    y += 5.5;
  };

  drawBorder();

  // Header
  doc.setFillColor(20, 50, 100);
  doc.rect(ml, y, cw, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(form.vendorCompany || "VENDOR", pw / 2, y + 6, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(form.vendorAddress || "", pw / 2, y + 11, { align: "center" });
  doc.setTextColor(0);
  y += 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 50, 100);
  doc.text("TENDER APPLICATION DOCUMENT", pw / 2, y, { align: "center" });
  y += 3;
  doc.setDrawColor(20, 50, 100);
  doc.setLineWidth(0.5);
  doc.line(pw / 2 - 38, y, pw / 2 + 38, y);
  doc.setTextColor(0);
  doc.setDrawColor(0);
  y += 7;

  // Meta
  const rows: [string, string][] = [
    ["Application Ref.", form.applicationId],
    ["Tender Ref No.", form.tenderRefNumber],
    ["Tender Title", form.tenderTitle],
    ["Category", form.tenderCategory],
    ["Tender Budget", `Rs.${Number(form.tenderBudgetMin).toLocaleString("en-IN")} – Rs.${Number(form.tenderBudgetMax).toLocaleString("en-IN")}`],
    ["Vendor Company", form.vendorCompany],
    ["Quoted Price", `Rs.${Number(form.vendorQuotedPrice).toLocaleString("en-IN")}`],
    ["Proposed Timeline", `${form.vendorTimeline} days`],
    ["Submission Date", new Date().toLocaleDateString("en-IN")],
  ];
  doc.setFontSize(8);
  rows.forEach(([k, v]) => {
    checkSpace(8);
    doc.setFillColor(235, 240, 250);
    doc.setDrawColor(180);
    doc.setLineWidth(0.2);
    doc.rect(ml, y, 60, 7, "FD");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 50, 100);
    doc.text(k, ml + 2, y + 4.8);
    doc.setFillColor(255, 255, 255);
    doc.rect(ml + 60, y, cw - 60, 7, "FD");
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    const vl = doc.splitTextToSize(String(v || "—"), cw - 62);
    doc.text(vl[0] || "", ml + 62, y + 4.8);
    y += 7;
  });
  y += 6;

  sectionBar("1.  EXECUTIVE SUMMARY");
  bodyPara(ai.executiveSummary);

  sectionBar("2.  COMPANY PROFILE");
  bodyPara(ai.companyProfile);
  infoRow("GST Number", form.vendorGst);
  infoRow("PAN Number", form.vendorPan);
  infoRow("Year of Establishment", form.vendorYearEstablished);
  infoRow("Employees", form.vendorEmployees);
  infoRow("Registered Address", form.vendorAddress);

  sectionBar("3.  TECHNICAL PROPOSAL");
  bodyPara(ai.technicalProposal);

  sectionBar("4.  RELEVANT EXPERIENCE");
  bodyPara(ai.experienceStatement);
  if (form.references?.length) {
    checkSpace(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Project References:", ml, y);
    y += 5;
    form.references.forEach((r, i) => {
      checkSpace(14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(`${i + 1}. ${r.clientName || "—"}`, ml + 2, y);
      y += 4.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.3);
      doc.text(`Value: Rs.${Number(r.projectValue || 0).toLocaleString("en-IN")}  |  Year: ${r.yearCompleted || "—"}`, ml + 4, y);
      y += 4.2;
      const desc = doc.splitTextToSize(r.description || "", cw - 8);
      desc.forEach((line: string) => { checkSpace(5); doc.text(line, ml + 4, y); y += 4.3; });
      y += 2;
    });
  }

  sectionBar("5.  QUALITY ASSURANCE");
  bodyPara(ai.qualityAssurance);
  infoRow("Certifications", form.certifications);

  sectionBar("6.  PROJECT PLAN & TIMELINE");
  numberedList(ai.projectPlan);

  sectionBar("7.  FINANCIAL BID");
  bodyPara(ai.financialStatement);
  // Highlight box for quoted price
  checkSpace(28);
  y += 2;
  doc.setFillColor(252, 246, 220);
  doc.setDrawColor(180, 140, 30);
  doc.setLineWidth(0.6);
  doc.roundedRect(ml + 30, y, cw - 60, 22, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(120, 80, 0);
  doc.text("QUOTED PRICE", pw / 2, y + 6, { align: "center" });
  doc.setFontSize(14);
  doc.setTextColor(20, 50, 100);
  doc.text(`Rs.${Number(form.vendorQuotedPrice).toLocaleString("en-IN")}`, pw / 2, y + 14, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80);
  doc.text(`Timeline: ${form.vendorTimeline} days from work order`, pw / 2, y + 19, { align: "center" });
  doc.setTextColor(0);
  doc.setDrawColor(0);
  y += 26;

  sectionBar("8.  ELIGIBILITY COMPLIANCE");
  bodyPara(ai.complianceStatement);
  if (form.tenderEligibility?.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.8);
    form.tenderEligibility.forEach((c, i) => {
      const lines = doc.splitTextToSize(`✓  ${i + 1}. ${c}`, cw - 6);
      lines.forEach((line: string, li: number) => {
        checkSpace(5);
        doc.text(line, ml + (li === 0 ? 0 : 7), y);
        y += 4.8;
      });
      y += 1.5;
    });
    y += 2;
  }

  if (form.uploadedDocs?.length) {
    sectionBar("9.  DOCUMENTS SUBMITTED");
    numberedList(form.uploadedDocs);
  }

  sectionBar(`${form.uploadedDocs?.length ? "10" : "9"}.  DECLARATION`);
  bodyPara(ai.declaration);
  y += 4;
  checkSpace(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(form.vendorCompany, ml, y); y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, ml, y);

  addFooter();
  return doc;
}

export async function generateHtmlTenderPDF(formData: PdfFormData, htmlContent: string): Promise<Blob> {
  const m = await import("html2pdf.js");
  const html2pdf = m.default || m;
  
  const container = document.createElement("div");
  const issuanceDate = new Date().toLocaleDateString("en-IN");
  const deadlineStr = formData.deadline ? new Date(formData.deadline).toLocaleString("en-IN") : "As notified";
  
  container.innerHTML = `
    <div style="font-family: Arial, sans-serif; font-size: 11pt; color: #000; line-height: 1.6; padding: 20px;">
      <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 4px 0; letter-spacing: 1px;">Tender Management</h1>
        <p style="font-size: 10pt; margin: 2px 0;">${formData.companyName || "Issuing Authority"}</p>
        <h2 style="font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 10px 0 4px; border: 2px solid #000; padding: 6px 16px; display: inline-block;">Tender for ${formData.title}</h2>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 10.5pt;">
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f8fafc; width: 35%; color: #333;">Tender Reference No.</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; color: #111; font-weight: 500;">${formData.referenceNumber || ""}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f8fafc; color: #333;">Tender Title</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; color: #111; font-weight: 500;">${formData.title || ""}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f8fafc; color: #333;">Category</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; color: #111; font-weight: 500;">${formData.category || ""}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f8fafc; color: #333;">Issuance Date</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; color: #111; font-weight: 500;">${issuanceDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f8fafc; color: #333;">Submission Deadline</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; color: #111; font-weight: 500;">${deadlineStr}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f8fafc; color: #333;">Location</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; color: #111; font-weight: 500;">${formData.location || ""}</td>
        </tr>
      </table>
      
      <div class="tender-body">
        ${htmlContent}
      </div>
      
      <div style="border-top: 2px solid #000; text-align: center; padding-top: 10px; margin-top: 40px; font-size: 9pt; color: #444;">
        End of Tender Document — ${formData.referenceNumber || ""} — Confidential
      </div>
    </div>
  `;
  
  const style = document.createElement("style");
  style.innerHTML = `
    .tender-body h1, .tender-body h2 { 
      font-size: 12pt; font-weight: bold; text-transform: uppercase; 
      background-color: #1e3a8a; color: #fff; padding: 8px 12px; 
      margin-top: 24px; margin-bottom: 12px; border-radius: 4px; 
      page-break-after: avoid; break-after: avoid;
    }
    .tender-body h3 { 
      font-size: 11pt; font-weight: bold; margin-top: 18px; margin-bottom: 10px; 
      page-break-after: avoid; break-after: avoid;
    }
    .tender-body section, .tender-body p, .tender-body ul, .tender-body ol, .tender-body li, .tender-body table, .tender-body tr { 
      page-break-inside: avoid; break-inside: avoid; 
    }
    .tender-body p { margin-bottom: 12px; text-align: justify; }
    .tender-body ul, .tender-body ol { margin-left: 24px; margin-bottom: 16px; }
    .tender-body li { margin-bottom: 6px; }
    .tender-body table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .tender-body th, .tender-body td { border: 1px solid #cbd5e1; padding: 8px 12px; }
    .tender-body th { background-color: #f8fafc; font-weight: bold; text-align: left; color: #333; }
  `;
  container.appendChild(style);

  const opt = {
    margin: [15, 10, 15, 10],
    filename: `${formData.referenceNumber || "Tender"}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
    pagebreak: { mode: ['css', 'legacy'] }
  };

  return await html2pdf().set(opt).from(container).outputPdf('blob');
}

