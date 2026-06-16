import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Check, X as XIcon, Star, AlertTriangle } from "lucide-react";
import { applicationStore, tenderStore, type StoredApplication, type StoredTender } from "@/lib/store";
import { generateVendorPDF, type VendorPdfFormData } from "@/lib/gemini";
import { toast } from "sonner";
import "./ResultDetails.scss";

export { ResultPage as default };

function ResultPage() {
  const { id } = useParams() as { id: string };
  const [app, setApp] = useState<StoredApplication | undefined>();
  const [tender, setTender] = useState<StoredTender | undefined>();

  useEffect(() => {
    const a = applicationStore.get(id);
    setApp(a);
    if (a) setTender(tenderStore.get(a.tenderId));
  }, [id]);

  if (!app || !tender) {
    return (
      <>
        <div className="page-header"><div><h1>Application Result</h1></div></div>
        <div className="card">Application not found. <Link to="/vendor/applications">My Applications</Link></div>
      </>
    );
  }

  const m = app.match;
  const isClosed = tender.status === "closed";
  const displayVerdict = isClosed ? m?.verdict : "UNDER_REVIEW";
  
  const verdictColor = displayVerdict === "SELECTED" ? "#16a34a" : displayVerdict === "NOT_SELECTED" ? "#c00" : "#d97706";
  const verdictBg = displayVerdict === "SELECTED" ? "#f0fdf4" : displayVerdict === "NOT_SELECTED" ? "#fef2f2" : "#fff7ed";

  const handleDownload = async () => {
    try {
      if (!app.aiContent) { toast.error("No application content available"); return; }
      const form: VendorPdfFormData = {
        applicationId: app.id,
        tenderRefNumber: tender.referenceNumber,
        tenderTitle: tender.title,
        tenderCategory: tender.category,
        tenderBudgetMin: tender.budgetMin,
        tenderBudgetMax: tender.budgetMax,
        vendorCompany: app.form.companyName,
        vendorQuotedPrice: app.form.quotedPrice,
        vendorTimeline: app.form.timeline,
        vendorTurnover: app.form.turnover,
        vendorGst: app.form.gst,
        vendorPan: app.form.pan,
        vendorYearEstablished: app.form.yearEstablished,
        vendorEmployees: app.form.employees,
        vendorAddress: [app.form.address, app.form.city, app.form.state, app.form.pin].filter(Boolean).join(", "),
        certifications: app.form.certifications,
        references: app.form.references,
        uploadedDocs: app.documents.map((d) => d.docName),
        tenderEligibility: tender.ai.eligibilityCriteria || [],
      };
      const doc = await generateVendorPDF(form, app.aiContent, app.match);
      doc.save(`Application_${app.id}.pdf`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF");
    }
  };

  const Bar = ({ score, max }: { score: number; max: number }) => {
    const pct = Math.round((score / max) * 100);
    return (
      <div style={{ height: 8, background: "#eee", borderRadius: 4, overflow: "hidden", flex: 1 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: verdictColor }} />
      </div>
    );
  };

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/vendor/applications" className="btn-outline" style={{ marginBottom: 8, display: "inline-flex" }}>
            <ArrowLeft size={14} /> My Applications
          </Link>
          <h1>Application Result</h1>
          <div className="sub">Tender: {tender.title} — {tender.referenceNumber}</div>
        </div>
      </div>

      <div className="card">
        {!m ? (
          <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
            Match evaluation not available for this application.
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center", padding: "24px 8px", background: verdictBg, borderRadius: 8, marginBottom: 18 }}>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 6, letterSpacing: 1 }}>MATCH SCORE</div>
              <div style={{ fontSize: 48, fontWeight: 700, color: verdictColor }}>{m.totalScore}%</div>
              <div style={{ width: 220, margin: "10px auto", height: 10, background: "#e7e7e7", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ width: `${m.totalScore}%`, height: "100%", background: verdictColor }} />
              </div>
              <div style={{ marginTop: 10 }}>
                <span className="pill" style={{ background: verdictColor, color: "#fff", fontSize: 13, padding: "6px 18px" }}>
                  {displayVerdict === "SELECTED" ? "✅ SELECTED" : displayVerdict === "NOT_SELECTED" ? "❌ NOT SELECTED" : "🔄 UNDER REVIEW"}
                </span>
              </div>
            </div>

            <h3 style={{ fontSize: 14, marginBottom: 10 }}>Score Breakdown</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {[
                ["Eligibility", m.breakdown.eligibility, 25],
                ["Technical", m.breakdown.technical, 25],
                ["Experience", m.breakdown.experience, 20],
                ["Financial", m.breakdown.financial, 20],
                ["Documents", m.breakdown.documents, 10],
              ].map(([label, item, max]: any) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span>{label}</span>
                    <span style={{ fontWeight: 600 }}>{item.score}/{max}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Bar score={item.score} max={max} />
                  </div>
                  <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{item.remark}</div>
                </div>
              ))}
            </div>

            {m.matched?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 13, marginBottom: 6 }}>✅ What you matched</h4>
                <ul style={{ paddingLeft: 18, fontSize: 13, color: "#444", margin: 0 }}>
                  {m.matched.map((x, i) => <li key={i} style={{ marginBottom: 3 }}><Check size={12} color="#16a34a" /> {x}</li>)}
                </ul>
              </div>
            )}

            {m.missing?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 13, marginBottom: 6 }}>❌ What's missing</h4>
                <ul style={{ paddingLeft: 18, fontSize: 13, color: "#444", margin: 0 }}>
                  {m.missing.map((x, i) => <li key={i} style={{ marginBottom: 3 }}><XIcon size={12} color="#c00" /> {x}</li>)}
                </ul>
              </div>
            )}

            {m.strengths?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 13, marginBottom: 6 }}>💪 Strengths</h4>
                <ul style={{ paddingLeft: 18, fontSize: 13, color: "#444", margin: 0 }}>
                  {m.strengths.map((x, i) => <li key={i} style={{ marginBottom: 3 }}><Star size={12} color="#d97706" /> {x}</li>)}
                </ul>
              </div>
            )}

            {m.concerns?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 13, marginBottom: 6 }}>⚠️ Concerns</h4>
                <ul style={{ paddingLeft: 18, fontSize: 13, color: "#444", margin: 0 }}>
                  {m.concerns.map((x, i) => <li key={i} style={{ marginBottom: 3 }}><AlertTriangle size={12} color="#d97706" /> {x}</li>)}
                </ul>
              </div>
            )}

            <div style={{ padding: 12, background: "#f7f7f7", borderRadius: 6, fontSize: 13, fontStyle: "italic", color: "#444", marginBottom: 20 }}>
              {m.summary}
            </div>
          </>
        )}

        <button className="btn-primary full" onClick={handleDownload}>
          <Download size={16} /> Download Your Application PDF
        </button>
      </div>
    </>
  );
}
