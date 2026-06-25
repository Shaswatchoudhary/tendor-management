import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Download, ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";
import { tenderStore, applicationStore, type StoredApplication, type StoredTender } from "@/lib/store";
import { generateVendorPDF, type VendorPdfFormData } from "@/lib/gemini";
import "../vendor/ResultDetails.scss";
import "./CreateTender.scss";
import "../../styles/components/_modals.scss";
import "./ApplicationDetails.scss";

export { ApplicationsPage as default };

function verdictPillClass(v?: string) {
  if (v === "SELECTED") return "pill pill-green";
  if (v === "NOT_SELECTED") return "pill pill-red";
  return "pill pill-amber";
}

function ApplicationsPage() {
  const { id } = useParams() as { id: string };
  const [tender, setTender] = useState<StoredTender | undefined>();
  const [apps, setApps] = useState<StoredApplication[]>([]);
  const [selected, setSelected] = useState<StoredApplication | null>(null);

  useEffect(() => {
    const refresh = () => {
      setTender(tenderStore.get(id));
      setApps(applicationStore.forTender(id));
    };
    refresh();
    window.addEventListener("tms-store-change", refresh);
    return () => window.removeEventListener("tms-store-change", refresh);
  }, [id]);

  const handleCloseTender = () => {
    if (!tender) return;
    if (apps.length > 0) {
      let maxScore = -1;
      let winnerId = "";
      apps.forEach(a => {
        const score = a.match?.totalScore || 0;
        if (score > maxScore) {
          maxScore = score;
          winnerId = a.id;
        }
      });
      apps.forEach(a => {
        if (a.match) {
          const isWinner = a.id === winnerId;
          const updatedApp: StoredApplication = {
            ...a,
            match: {
              ...a.match,
              verdict: isWinner ? "SELECTED" : "NOT_SELECTED"
            }
          };
          applicationStore.save(updatedApp);
        }
      });
    }
    const updatedTender: StoredTender = { ...tender, status: "closed" };
    tenderStore.save(updatedTender);
    toast.success("Tender closed. Winner auto-selected based on highest score.");
  };

  const downloadAppPdf = async (a: StoredApplication) => {
    if (!tender) return;
    if (!a.aiContent) { toast.error("No application content stored"); return; }
    try {
      const form: VendorPdfFormData = {
        applicationId: a.id,
        tenderRefNumber: tender.referenceNumber,
        tenderTitle: tender.title,
        tenderCategory: tender.category,
        tenderBudgetMin: tender.budgetMin,
        tenderBudgetMax: tender.budgetMax,
        vendorCompany: a.form.companyName,
        vendorQuotedPrice: a.form.quotedPrice,
        vendorTimeline: a.form.timeline,
        vendorTurnover: a.form.turnover,
        vendorGst: a.form.gst,
        vendorPan: a.form.pan,
        vendorYearEstablished: a.form.yearEstablished,
        vendorEmployees: a.form.employees,
        vendorAddress: [a.form.address, a.form.city, a.form.state, a.form.pin].filter(Boolean).join(", "),
        certifications: a.form.certifications,
        references: a.form.references,
        uploadedDocs: a.documents.map((d) => d.docName),
        tenderEligibility: tender.ai.eligibilityCriteria || [],
      };
      const doc = await generateVendorPDF(form, a.aiContent, a.match);
      doc.save(`Application_${a.id}.pdf`);
    } catch (e) { console.error(e); toast.error("Failed to generate PDF"); }
  };

  if (!tender) {
    return (
      <>
        <div className="page-header"><div><h1>Applications</h1></div></div>
        <div className="card">Tender not found. <Link to="/company/tenders">Back to My Tenders</Link></div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Applications for: {tender.title}</h1>
          <div className="sub">{tender.referenceNumber} • {apps.length} {apps.length === 1 ? "application" : "applications"}</div>
        </div>
        <div className="header-actions">
          <Link to="/company/tenders" className="btn-outline"><ArrowLeft size={14} /> Back</Link>
          {tender.status === "active" && (
            <button className="btn-primary btn-close-tender" onClick={handleCloseTender}>
              Close & Auto-Select
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {apps.length === 0 ? (
          <div className="empty-state">
            No applications received yet for this tender.
          </div>
        ) : (
          <div className="data-table">
            <div className="thead app-grid">
              <div>Vendor Name</div>
              <div>Score</div>
              <div>Verdict</div>
              <div>Docs</div>
              <div>Date</div>
              <div>Action</div>
            </div>
            {apps.map((a) => {
              const totalReq = tender.requiredDocuments?.length || 0;
              const uploaded = a.documents?.length || 0;
              return (
                <div
                  key={a.id}
                  className="trow app-grid"
                  onClick={() => setSelected(a)}
                >
                  <div className="vendor-name">{a.vendorName}</div>
                  <div>{a.match ? `${a.match.totalScore}%` : "—"}</div>
                  <div><span className={verdictPillClass(a.match?.verdict)}>{a.match?.verdict?.replace("_", " ") || "REVIEW"}</span></div>
                  <div>{uploaded}/{totalReq}</div>
                  <div className="date">{new Date(a.createdAt).toLocaleDateString("en-IN")}</div>
                  <div><button className="btn-outline btn-view">View</button></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal app-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-flex">
              <div>
                <div className="vendor-title">{selected.vendorName}</div>
                <div className="submission-time">Submitted {new Date(selected.createdAt).toLocaleString("en-IN")}</div>
              </div>
              <button className="btn-outline btn-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body-scroll">
              <div className="info-row">
                <strong>Quoted Price:</strong> Rs.{Number(selected.form.quotedPrice || 0).toLocaleString("en-IN")} •{" "}
                <strong>Timeline:</strong> {selected.form.timeline} days
              </div>
              <div className="info-row small">
                <strong>GST:</strong> {selected.form.gst || "—"} • <strong>PAN:</strong> {selected.form.pan || "—"} •{" "}
                <strong>Turnover:</strong> Rs.{selected.form.turnover || "—"} lakhs
              </div>

              {selected.match && (
                <div className="match-summary-block">
                  <div className="match-header">
                    <span className="score-val">{selected.match.totalScore}%</span>
                    <span className={verdictPillClass(selected.match.verdict)}>{selected.match.verdict.replace("_", " ")}</span>
                    <span className="price-fit">• {selected.match.priceFit}</span>
                  </div>
                  <div className="match-breakdown">
                    {Object.entries(selected.match.breakdown).map(([k, v]) => (
                      <div key={k} className="breakdown-item">
                        <div className="label">{k}</div>
                        <div className="val">{v.score}</div>
                      </div>
                    ))}
                  </div>
                  <div className="match-summary-text">{selected.match.summary}</div>
                </div>
              )}

              <div className="action-row">
                <button className="btn-primary btn-pdf" onClick={() => downloadAppPdf(selected)}>
                  <FileText size={14} /> Download Application PDF
                </button>
              </div>

              <div className="docs-title">Uploaded Documents</div>
              {selected.documents.length === 0 ? (
                <div className="docs-empty">No documents uploaded.</div>
              ) : (
                <ul className="docs-list">
                  {selected.documents.map((d, i) => (
                    <li key={i} className="doc-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                        <div className="doc-info">
                          <div className="doc-name">{d.docName}</div>
                          <div className="doc-meta">{d.fileName} • {(d.size / 1024).toFixed(1)} KB</div>
                        </div>
                        {d.dataUrl && (
                          <a href={d.dataUrl} download={d.fileName} className="btn-outline btn-download">
                            <Download size={14} /> Download
                          </a>
                        )}
                      </div>
                      {d.verification && (
                        <div style={{ padding: "10px 14px", backgroundColor: d.verification.verified ? "#f0fdf4" : "#fef2f2", border: `1px solid ${d.verification.verified ? "#bbf7d0" : "#fecaca"}`, borderRadius: 6, width: "100%" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: d.verification.verified ? "#166534" : "#991b1b", marginBottom: 4 }}>
                            <span>{d.verification.verified ? "✓ Matched" : "✗ Mismatch"}</span>
                            <span style={{ fontSize: 12, opacity: 0.8 }}>— Confidence: {d.verification.confidence}%</span>
                          </div>
                          <div style={{ fontSize: 13, color: d.verification.verified ? "#14532d" : "#7f1d1d" }}>
                            {d.verification.message}
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
