import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Download, ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";
import { tenderStore, applicationStore, type StoredApplication, type StoredTender } from "@/lib/store";
import { generateVendorPDF, type VendorPdfFormData } from "@/lib/gemini";
import "../../vendor/ResultDetails.scss";
import "./CreateTender.scss";
import "../../styles/components/_modals.scss";

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
        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/company/tenders" className="btn-outline"><ArrowLeft size={14} /> Back</Link>
          {tender.status === "active" && (
            <button className="btn-primary" onClick={handleCloseTender} style={{ background: "#d97706" }}>
              Close & Auto-Select
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {apps.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
            No applications received yet for this tender.
          </div>
        ) : (
          <div className="data-table">
            <div className="thead" style={{ gridTemplateColumns: "1.8fr 90px 130px 100px 110px 100px" }}>
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
                  className="trow"
                  style={{ gridTemplateColumns: "1.8fr 90px 130px 100px 110px 100px", cursor: "pointer" }}
                  onClick={() => setSelected(a)}
                >
                  <div style={{ fontWeight: 500 }}>{a.vendorName}</div>
                  <div>{a.match ? `${a.match.totalScore}%` : "—"}</div>
                  <div><span className={verdictPillClass(a.match?.verdict)}>{a.match?.verdict?.replace("_", " ") || "REVIEW"}</span></div>
                  <div>{uploaded}/{totalReq}</div>
                  <div style={{ fontSize: 12 }}>{new Date(a.createdAt).toLocaleDateString("en-IN")}</div>
                  <div><button className="btn-outline" style={{ padding: "4px 8px" }}>View</button></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth: 720, width: "94%" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: 18, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{selected.vendorName}</div>
                <div style={{ fontSize: 12, color: "#777" }}>Submitted {new Date(selected.createdAt).toLocaleString("en-IN")}</div>
              </div>
              <button className="btn-outline" onClick={() => setSelected(null)} style={{ padding: 6 }}>✕</button>
            </div>
            <div style={{ padding: 18, maxHeight: "70vh", overflow: "auto" }}>
              <div style={{ marginBottom: 12 }}>
                <strong>Quoted Price:</strong> Rs.{Number(selected.form.quotedPrice || 0).toLocaleString("en-IN")} •{" "}
                <strong>Timeline:</strong> {selected.form.timeline} days
              </div>
              <div style={{ marginBottom: 12, fontSize: 13 }}>
                <strong>GST:</strong> {selected.form.gst || "—"} • <strong>PAN:</strong> {selected.form.pan || "—"} •{" "}
                <strong>Turnover:</strong> Rs.{selected.form.turnover || "—"} lakhs
              </div>

              {selected.match && (
                <div style={{ marginBottom: 14, padding: 12, background: "#f7f7f7", borderRadius: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 22, fontWeight: 700 }}>{selected.match.totalScore}%</span>
                    <span className={verdictPillClass(selected.match.verdict)}>{selected.match.verdict.replace("_", " ")}</span>
                    <span style={{ fontSize: 12, color: "#666" }}>• {selected.match.priceFit}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, fontSize: 11, marginBottom: 8 }}>
                    {Object.entries(selected.match.breakdown).map(([k, v]) => (
                      <div key={k} style={{ padding: 6, background: "#fff", borderRadius: 4, textAlign: "center" }}>
                        <div style={{ fontWeight: 600, textTransform: "capitalize" }}>{k}</div>
                        <div style={{ fontSize: 14, color: "#1a3060" }}>{v.score}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, fontStyle: "italic", color: "#444" }}>{selected.match.summary}</div>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <button className="btn-primary" onClick={() => downloadAppPdf(selected)} style={{ flex: 1 }}>
                  <FileText size={14} /> Download Application PDF
                </button>
              </div>

              <div style={{ fontWeight: 600, marginBottom: 8 }}>Uploaded Documents</div>
              {selected.documents.length === 0 ? (
                <div style={{ color: "#888", fontSize: 13 }}>No documents uploaded.</div>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {selected.documents.map((d, i) => (
                    <li key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderBottom: "1px solid #f0f0f0" }}>
                      <div style={{ fontSize: 13 }}>
                        <div style={{ fontWeight: 500 }}>{d.docName}</div>
                        <div style={{ color: "#888", fontSize: 12 }}>{d.fileName} • {(d.size / 1024).toFixed(1)} KB</div>
                      </div>
                      <a href={d.dataUrl} download={d.fileName} className="btn-outline" style={{ padding: "4px 10px" }}>
                        <Download size={14} /> Download
                      </a>
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
