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
            <div style={{ textAlign: "center", padding: "32px 16px", background: verdictBg, borderRadius: 8, marginBottom: 24, border: `1px solid ${verdictColor}33` }}>              <div style={{ fontSize: 13, color: "#666", marginBottom: 12, letterSpacing: 1, textTransform: "uppercase" }}>Application Status</div>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 24px", borderRadius: 30, background: verdictColor, color: "#fff", fontSize: 16, fontWeight: 600 }}>
                {displayVerdict === "SELECTED" ? "✅ Awarded" : displayVerdict === "NOT_SELECTED" ? "❌ Not Selected" : "🔄 Under Review"}
              </div>
              <div style={{ marginTop: 16, fontSize: 14, color: "#555", maxWidth: 400, margin: "16px auto 0", lineHeight: 1.5 }}>
                {displayVerdict === "SELECTED" 
                  ? "Congratulations! Your application has been selected for this tender." 
                  : displayVerdict === "NOT_SELECTED" 
                  ? "Unfortunately, your application was not selected for this tender." 
                  : "Your application has been received and is currently being evaluated by the company. Final results will be declared after the tender closes."}
              </div>
            </div>
        )}

        <button className="btn-primary full" onClick={handleDownload}>
          <Download size={16} /> Download Your Application PDF
        </button>
      </div>
    </>
  );
}
