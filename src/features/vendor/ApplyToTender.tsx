import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Upload, Check, Send, Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  generateVendorApplication, evaluateVendorMatch,
  type VendorAIInput, type VendorTenderRef,
} from "@/lib/gemini";
import {
  tenderStore, applicationStore, readFileAsDataURL,
  CURRENT_VENDOR,
  type StoredTender, type StoredApplication, type VendorFormData, type ProjectReference, type UploadedDocument,
} from "@/lib/store";
import "../company/CreateTender.scss";

export { ApplyPage as default };

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPT = ".pdf,.jpg,.jpeg,.png,.doc,.docx";

const ORG_TYPES = ["Proprietorship", "Partnership", "Pvt Ltd", "Ltd", "LLP", "Other"];
const EMPLOYEE_RANGES = ["1-10", "11-50", "51-200", "201-500", "500+"];

const LOADER_STEPS = [
  "✨ Reviewing your application...",
  "📝 Generating your application document...",
  "🔍 Comparing with tender requirements...",
  "⚖️ Calculating match score...",
  "✅ Finalizing your result...",
];

function emptyRef(): ProjectReference {
  return { clientName: "", projectValue: "", yearCompleted: "", description: "" };
}

function ApplyPage() {
  const { id } = useParams() as { id: string };
  const navigate = useNavigate();
  const [tender, setTender] = useState<StoredTender | undefined>();

  useEffect(() => { setTender(tenderStore.get(id)); }, [id]);

  const requiredDocs = useMemo(() => tender?.requiredDocuments ?? [], [tender]);

  const [form, setForm] = useState<VendorFormData>({
    companyName: CURRENT_VENDOR.name, orgType: ORG_TYPES[2],
    registrationNumber: "", yearEstablished: "",
    gst: "", pan: "", address: "", city: "", state: "", pin: "",
    yearsInBusiness: "", employees: EMPLOYEE_RANGES[1], turnover: "",
    certifications: "", categoryExperience: "",
    projectCount: "", references: [emptyRef(), emptyRef()],
    technicalCapability: "", qualityStandards: "", equipment: "",
    quotedPrice: "", timeline: "30",
    whyUs: "",
  });

  const [uploaded, setUploaded] = useState<Record<string, UploadedDocument>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loaderMsg, setLoaderMsg] = useState(LOADER_STEPS[0]);

  if (!tender) {
    return (
      <>
        <div className="page-header"><div><h1>Apply for Tender</h1></div></div>
        <div className="card">Tender not found. <Link to="/vendor">Back to Browse</Link></div>
      </>
    );
  }

  const update = (k: keyof VendorFormData, v: any) => setForm((s) => ({ ...s, [k]: v }));

  const updateRef = (idx: number, k: keyof ProjectReference, v: string) => {
    setForm((s) => {
      const refs = [...s.references];
      refs[idx] = { ...refs[idx], [k]: v };
      return { ...s, references: refs };
    });
  };

  const addRef = () => setForm((s) => ({ ...s, references: [...s.references, emptyRef()] }));
  const removeRef = (i: number) => setForm((s) => ({ ...s, references: s.references.filter((_, idx) => idx !== i) }));

  const handleFile = async (docName: string, file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) { toast.error(`${file.name} exceeds 10MB limit`); return; }
    const dataUrl = await readFileAsDataURL(file);
    setUploaded((u) => ({ ...u, [docName]: { docName, fileName: file.name, dataUrl, size: file.size } }));
  };

  const validate = (): string | null => {
    if (!form.companyName.trim()) return "Company name is required";
    if (!form.orgType) return "Organization type is required";
    if (!form.registrationNumber.trim()) return "Registration number is required";
    if (!form.yearEstablished) return "Year of establishment is required";
    if (!form.gst.trim()) return "GST number is required";
    if (!form.pan.trim()) return "PAN number is required";
    if (!form.address.trim()) return "Registered address is required";
    if (!form.yearsInBusiness) return "Years in business is required";
    if (!form.turnover) return "Annual turnover is required";
    if (!form.categoryExperience) return "Category experience is required";
    if (!form.projectCount) return "Number of similar projects is required";
    if (!form.technicalCapability.trim() || form.technicalCapability.trim().length < 50)
      return "Technical capability statement must be at least 50 characters";
    if (!form.quotedPrice) return "Quoted price is required";
    if (!form.timeline) return "Completion timeline is required";
    if (!form.whyUs.trim()) return "Please tell us why you should be selected";
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }

    const missingCount = requiredDocs.filter((d) => !uploaded[d]).length;
    if (missingCount > 0) {
      const ok = confirm(`${missingCount} required document(s) not uploaded. Submit anyway?`);
      if (!ok) return;
    }

    setSubmitting(true);
    let stepIdx = 0;
    setLoaderMsg(LOADER_STEPS[0]);
    const interval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, LOADER_STEPS.length - 1);
      setLoaderMsg(LOADER_STEPS[stepIdx]);
    }, 3000);

    try {
      const tenderRef: VendorTenderRef = {
        id: tender.id,
        title: tender.title,
        category: tender.category,
        budgetMin: tender.budgetMin,
        budgetMax: tender.budgetMax,
        requiredSkills: tender.ai.requiredSkills || [],
        eligibilityCriteria: tender.ai.eligibilityCriteria || [],
        technicalSpecifications: tender.ai.technicalSpecifications || "",
        requiredDocuments: tender.requiredDocuments || [],
        emdAmount: tender.ai.emdAmount || "",
      };
      const vendorAi: VendorAIInput = {
        companyName: form.companyName,
        orgType: form.orgType,
        gst: form.gst,
        pan: form.pan,
        yearEstablished: form.yearEstablished,
        employees: form.employees,
        turnover: form.turnover,
        certifications: form.certifications,
        categoryExperience: form.categoryExperience,
        projectCount: form.projectCount,
        references: form.references,
        technicalCapability: form.technicalCapability,
        qualityStandards: form.qualityStandards,
        quotedPrice: form.quotedPrice,
        timeline: form.timeline,
        whyUs: form.whyUs,
        uploadedDocs: Object.values(uploaded).map((u) => u.docName),
        address: form.address, city: form.city, state: form.state, pin: form.pin,
      };

      setLoaderMsg(LOADER_STEPS[1]);
      const aiContent = await generateVendorApplication(vendorAi, tenderRef);
      setLoaderMsg(LOADER_STEPS[3]);
      const match = await evaluateVendorMatch(vendorAi, tenderRef);

      setLoaderMsg(LOADER_STEPS[4]);
      const appId = `APP-${tender.referenceNumber}-${Date.now().toString().slice(-5)}`;
      const stored: StoredApplication = {
        id: appId,
        tenderId: tender.id,
        vendorId: CURRENT_VENDOR.id,
        vendorName: form.companyName.trim(),
        createdAt: new Date().toISOString(),
        form,
        documents: Object.values(uploaded),
        aiContent,
        match,
      };
      applicationStore.save(stored);

      clearInterval(interval);
      toast.success("Application submitted successfully!");
      navigate(`/vendor/result/$id`.replace('\$id', appId));
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      toast.error(err?.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <Link to={`/vendor/tender/$id`.replace('\$id', tender.id)} className="btn-outline" style={{ marginBottom: 8, display: "inline-flex" }}>
            <ArrowLeft size={14} /> Back to Tender
          </Link>
          <h1>Apply: {tender.title}</h1>
          <div className="sub">{tender.referenceNumber} • Budget Rs.{Number(tender.budgetMin).toLocaleString("en-IN")} – Rs.{Number(tender.budgetMax).toLocaleString("en-IN")}</div>
        </div>
      </div>

      <form className="card" onSubmit={submit}>
        <Section title="A. Company Information">
          <Field label="Company/Firm Name *">
            <input className="form-input" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
          </Field>
          <Row>
            <Field label="Type of Organization *">
              <select className="form-select" value={form.orgType} onChange={(e) => update("orgType", e.target.value)}>
                {ORG_TYPES.map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Year of Establishment *">
              <input className="form-input" type="number" value={form.yearEstablished} onChange={(e) => update("yearEstablished", e.target.value)} />
            </Field>
          </Row>
          <Row>
            <Field label="Registration Number *">
              <input className="form-input" value={form.registrationNumber} onChange={(e) => update("registrationNumber", e.target.value)} />
            </Field>
            <Field label="GST Number *">
              <input className="form-input" value={form.gst} onChange={(e) => update("gst", e.target.value)} />
            </Field>
          </Row>
          <Field label="PAN Number *">
            <input className="form-input" value={form.pan} onChange={(e) => update("pan", e.target.value)} />
          </Field>
          <Field label="Registered Address *">
            <input className="form-input" value={form.address} onChange={(e) => update("address", e.target.value)} />
          </Field>
          <Row>
            <Field label="City"><input className="form-input" value={form.city} onChange={(e) => update("city", e.target.value)} /></Field>
            <Field label="State"><input className="form-input" value={form.state} onChange={(e) => update("state", e.target.value)} /></Field>
            <Field label="PIN"><input className="form-input" value={form.pin} onChange={(e) => update("pin", e.target.value)} /></Field>
          </Row>
        </Section>

        <Section title="B. Experience & Capability">
          <Row>
            <Field label="Years in Business *">
              <input className="form-input" type="number" value={form.yearsInBusiness} onChange={(e) => update("yearsInBusiness", e.target.value)} />
            </Field>
            <Field label="Number of Employees">
              <select className="form-select" value={form.employees} onChange={(e) => update("employees", e.target.value)}>
                {EMPLOYEE_RANGES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
          </Row>
          <Row>
            <Field label="Annual Turnover (₹ lakhs) *">
              <input className="form-input" type="number" value={form.turnover} onChange={(e) => update("turnover", e.target.value)} />
            </Field>
            <Field label="Experience in This Category (years) *">
              <input className="form-input" type="number" value={form.categoryExperience} onChange={(e) => update("categoryExperience", e.target.value)} />
            </Field>
          </Row>
          <Field label="ISO or Quality Certifications">
            <input className="form-input" value={form.certifications} onChange={(e) => update("certifications", e.target.value)} placeholder="e.g. ISO 9001:2015, BIS" />
          </Field>
        </Section>

        <Section title="C. Past Projects">
          <Field label="Similar Projects Completed (last 5 years) *">
            <input className="form-input" type="number" value={form.projectCount} onChange={(e) => update("projectCount", e.target.value)} />
          </Field>
          {form.references.map((ref, i) => (
            <div key={i} style={{ border: "1px dashed #ddd", borderRadius: 6, padding: 12, marginBottom: 10, background: "#fafafa" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <strong style={{ fontSize: 13 }}>Project Reference {i + 1}</strong>
                {form.references.length > 1 && (
                  <button type="button" className="btn-outline" style={{ padding: "2px 8px", color: "#c00" }} onClick={() => removeRef(i)}>
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <Row>
                <Field label="Client Name"><input className="form-input" value={ref.clientName} onChange={(e) => updateRef(i, "clientName", e.target.value)} /></Field>
                <Field label="Project Value (₹)"><input className="form-input" type="number" value={ref.projectValue} onChange={(e) => updateRef(i, "projectValue", e.target.value)} /></Field>
                <Field label="Year"><input className="form-input" type="number" value={ref.yearCompleted} onChange={(e) => updateRef(i, "yearCompleted", e.target.value)} /></Field>
              </Row>
              <Field label="Brief Description"><input className="form-input" value={ref.description} onChange={(e) => updateRef(i, "description", e.target.value)} /></Field>
            </div>
          ))}
          <button type="button" className="btn-outline" onClick={addRef} style={{ marginTop: 4 }}>
            <Plus size={14} /> Add Another Reference
          </button>
        </Section>

        <Section title="D. Technical Capability">
          <Field label="Technical Capability Statement * (how do you meet the requirements?)">
            <textarea className="form-textarea" style={{ minHeight: 120 }} value={form.technicalCapability} onChange={(e) => update("technicalCapability", e.target.value)} />
          </Field>
          <Field label="Quality Standards Followed">
            <input className="form-input" value={form.qualityStandards} onChange={(e) => update("qualityStandards", e.target.value)} />
          </Field>
          <Field label="Machinery / Equipment Available">
            <input className="form-input" value={form.equipment} onChange={(e) => update("equipment", e.target.value)} />
          </Field>
        </Section>

        <Section title="E. Financial Bid">
          <Row>
            <Field label={`Quoted Price (₹) * (Budget: ₹${Number(tender.budgetMin).toLocaleString("en-IN")} – ₹${Number(tender.budgetMax).toLocaleString("en-IN")})`}>
              <input className="form-input" type="number" value={form.quotedPrice} onChange={(e) => update("quotedPrice", e.target.value)} />
            </Field>
            <Field label="Completion Timeline (days from work order) *">
              <input className="form-input" type="number" value={form.timeline} onChange={(e) => update("timeline", e.target.value)} />
            </Field>
          </Row>
        </Section>

        <Section title="F. Why Should We Select You">
          <Field label="Your pitch *">
            <textarea className="form-textarea" style={{ minHeight: 100 }} value={form.whyUs} onChange={(e) => update("whyUs", e.target.value)} placeholder="What makes your company the best choice?" />
          </Field>
        </Section>

        <Section title={`G. Required Documents (${Object.keys(uploaded).length}/${requiredDocs.length} uploaded)`}>
          {requiredDocs.length === 0 ? (
            <div style={{ fontSize: 13, color: "#888", padding: 10 }}>No specific documents requested for this tender.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {requiredDocs.map((d, i) => {
                const up = uploaded[d];
                return (
                  <label key={d} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                    border: "1px dashed #ccc", borderRadius: 6, background: up ? "#f0fdf4" : "#fafafa", cursor: "pointer",
                  }}>
                    {up ? <Check size={16} color="#16a34a" /> : <Upload size={16} color="#666" />}
                    <div style={{ flex: 1, fontSize: 13 }}>
                      <div style={{ fontWeight: 500 }}>{i + 1}. {d} <span style={{ color: "#c00" }}>*</span></div>
                      <div style={{ fontSize: 11, color: up ? "#16a34a" : "#888" }}>
                        {up ? `✅ ${up.fileName} (${(up.size / 1024).toFixed(1)} KB)` : "PDF, JPG, PNG, DOC, DOCX (max 10MB)"}
                      </div>
                    </div>
                    <input type="file" accept={ACCEPT} hidden onChange={(e) => handleFile(d, e.target.files?.[0])} />
                    <span className="pill pill-grey">{up ? "Replace" : "Choose"}</span>
                  </label>
                );
              })}
            </div>
          )}
        </Section>

        <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 16 }}>
          <Link to={`/vendor/tender/$id`.replace('\$id', tender.id)} className="btn-outline">Cancel</Link>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? <><span className="loading" /> Submitting...</> : <><Send size={16} /> Submit Application</>}
          </button>
        </div>
      </form>

      {submitting && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 440, textAlign: "center" }}>
            <div style={{ padding: "32px 28px" }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 18 }}>Processing Application</div>
              <div className="loading" style={{ margin: "0 auto 22px", width: 32, height: 32, borderWidth: 3 }} />
              <div style={{ fontSize: 14, color: "#333", marginBottom: 10, minHeight: 22 }}>{loaderMsg}</div>
              <div style={{ fontSize: 12, color: "#888" }}>
                AI is drafting your bid document and matching it against the tender.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h3 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, color: "#1a3060", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #e5e7eb" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="form-row">{children}</div>;
}
