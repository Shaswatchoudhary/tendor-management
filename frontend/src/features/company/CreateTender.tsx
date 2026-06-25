import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Sparkles, Download, Rocket, X } from "lucide-react";
import { toast } from "sonner";
import { generateFullTender, type GeminiProgress, type AIGeneratedTender, type PdfFormData } from "@/lib/gemini";
import { tenderStore, CURRENT_COMPANY, type StoredTender } from "@/lib/store";
import "./CreateTender.scss";

export { CreateTender as default };

const CATEGORIES = [
  "IT/Software", "Civil/Construction", "Furniture", "Maintenance",
  "Security", "Transport", "Catering", "Consulting", "Other",
];

const LOADER_STEPS = [
  "✨ Reading your requirements...",
  "📝 Generating project description...",
  "📋 Creating eligibility criteria...",
  "⚖️ Adding terms and conditions...",
  "🔍 Building technical specifications...",
  "✅ Finalizing all sections...",
  "📄 Generating PDF...",
];

function CreateTender() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [deadline, setDeadline] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState(LOADER_STEPS[0]);

  const referenceNumber = useMemo(
    () => `TND-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    [],
  );

  const validate = () => {
    if (!title.trim()) return "Tender title is required";
    if (!budgetMin || !budgetMax) return "Budget range is required";
    if (Number(budgetMin) > Number(budgetMax)) return "Min budget cannot exceed max budget";
    if (!deadline) return "Submission deadline is required";
    if (!location.trim()) return "Location is required";
    if (!description.trim() || description.trim().length < 10)
      return "Please describe what you need (at least 10 characters)";
    return null;
  };

  const handleGenerate = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }

    setLoading(true);
    let stepIdx = 0;
    setLoaderMessage(LOADER_STEPS[0]);
    const interval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, LOADER_STEPS.length - 1);
      setLoaderMessage(LOADER_STEPS[stepIdx]);
    }, 3000);

    const onProgress: GeminiProgress = (m) => setLoaderMessage(m);

    try {
      const ai = await generateFullTender(
        {
          title: title.trim(), category, budgetMin, budgetMax, deadline,
          location: location.trim(), description: description.trim(),
          companyName: CURRENT_COMPANY.name, referenceNumber,
        },
        onProgress,
      );

      clearInterval(interval);
      setLoaderMessage("📄 Generating PDF...");

      const pdfForm: PdfFormData = {
        referenceNumber,
        companyName: CURRENT_COMPANY.name,
        title: title.trim(),
        category, budgetMin, budgetMax,
        currency: "INR",
        deadline,
        location: location.trim(),
        completionDays: 30,
        contactName: CURRENT_COMPANY.name,
        contactEmail: CURRENT_COMPANY.email,
        contactPhone: CURRENT_COMPANY.phone,
      };
      
      const stored: StoredTender = {
        id: referenceNumber,
        referenceNumber,
        companyId: CURRENT_COMPANY.id,
        companyName: CURRENT_COMPANY.name,
        title: title.trim(),
        category,
        budgetMin, budgetMax,
        deadline,
        location: location.trim(),
        description: description.trim(),
        status: "draft",
        createdAt: new Date().toISOString(),
        ai,
        pdfForm,
        requiredDocuments: ai.requiredDocuments || [],
      };
      tenderStore.save(stored);
      
      navigate(`/company/tenders/edit/${referenceNumber}`);

    } catch (e: any) {
      clearInterval(interval);
      console.error("Generation failed:", e);
      toast.error("AI generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Create Tender</h1>
          <div className="sub">
            Fill the basics — AI will draft the full professional tender document
          </div>
        </div>
      </div>

      <div className="card">
        <div className="form-group">
          <label className="form-label">Tender Title *</label>
          <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Supply of Office Computers" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Submission Deadline *</label>
            <input className="form-input" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Tender automatically closes at this time</div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Budget Min (₹) *</label>
            <input className="form-input" type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="100000" />
          </div>
          <div className="form-group">
            <label className="form-label">Budget Max (₹) *</label>
            <input className="form-input" type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="500000" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Location *</label>
          <input className="form-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. New Delhi" />
        </div>

        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea
            className="form-textarea"
            style={{ minHeight: 120 }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly describe what you need — even 2–3 lines are fine. AI will expand this into a full professional tender."
          />
        </div>

        <button className="btn-primary full" onClick={handleGenerate} disabled={loading} style={{ marginTop: 8 }}>
          {loading ? <><span className="loading" /> Generating...</> : <><Sparkles size={16} /> Generate Tender with AI</>}
        </button>
      </div>

      {loading && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 440, textAlign: "center" }}>
            <div style={{ padding: "32px 28px" }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 18 }}>✨ AI Generation</div>
              <div className="loading" style={{ margin: "0 auto 22px", width: 32, height: 32, borderWidth: 3 }} />
              <div style={{ fontSize: 14, color: "#333", marginBottom: 10, minHeight: 22 }}>{loaderMessage}</div>
              <div style={{ fontSize: 12, color: "#888" }}>
                Gemini is writing a complete professional tender from your description.<br />
                This usually takes 10–15 seconds.
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
