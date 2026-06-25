import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Eye, Users, Trash2, FilePlus, X, Rocket } from "lucide-react";
import { toast } from "sonner";
import { tenderStore, applicationStore, type StoredTender } from "@/lib/store";
import { generateHtmlTenderPDF } from "@/lib/gemini";

import { fmtDate } from "@/lib/utils";

export { MyTendersPage as default };

function useTenders() {
  const [tenders, setTenders] = useState<StoredTender[]>([]);
  useEffect(() => {
    const refresh = () => setTenders(tenderStore.list());
    refresh();
    window.addEventListener("tms-store-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("tms-store-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return [tenders, setTenders] as const;
}

function tenderStatus(t: StoredTender): { label: string; cls: string } {
  if (t.status === "draft") return { label: "Draft", cls: "pill pill-blue" };
  if (t.status === "closed") return { label: "Closed", cls: "pill pill-grey" };
  const past = new Date(t.deadline).getTime() < Date.now();
  if (past) return { label: "Deadline Passed", cls: "pill pill-amber" };
  return { label: "Active", cls: "pill pill-green" };
}

function MyTendersPage() {
  const [tenders] = useTenders();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ type: "publish" | "delete" | "close", tender: StoredTender } | null>(null);
  const navigate = useNavigate();

  const openPdf = async (t: StoredTender) => {
    try {
      const doc = await generateHtmlTenderPDF(t.pdfForm, t.htmlContent || "<p>No content available</p>");
      const blob: Blob = doc;
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewTitle(`${t.referenceNumber} — ${t.title}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to open PDF");
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const executeConfirmAction = () => {
    if (!confirmAction) return;
    const { type, tender } = confirmAction;
    if (type === "delete") {
      tenderStore.delete(tender.id);
      toast.success("Tender deleted");
    } else if (type === "publish") {
      const t2 = { ...tender, status: "active" as const };
      tenderStore.save(t2);
      toast.success("Draft published successfully!");
    } else if (type === "close") {
      const t2 = { ...tender, status: "closed" as const };
      tenderStore.save(t2);
      toast.success("Tender closed early.");
    }
    setConfirmAction(null);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My Tenders</h1>
          <div className="sub">All tenders you have published</div>
        </div>
        <Link to="/company/create" className="btn-primary">
          <FilePlus size={16} /> New Tender
        </Link>
      </div>

      <div className="card">
        {tenders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
            <div style={{ fontSize: 14, marginBottom: 12 }}>You haven't published any tenders yet.</div>
            <Link to="/company/create" className="btn-primary">
              <FilePlus size={16} /> Create your first tender
            </Link>
          </div>
        ) : (
          <div className="data-table" style={{ gridTemplateColumns: undefined }}>
            <div className="thead" style={{ gridTemplateColumns: "120px 1.6fr 1fr 1.2fr 110px 110px 130px 180px" }}>
              <div>Ref No.</div>
              <div>Title</div>
              <div>Category</div>
              <div>Budget</div>
              <div>Deadline</div>
              <div>Status</div>
              <div>Applications</div>
              <div>Actions</div>
            </div>
            {tenders.map((t) => {
              const st = tenderStatus(t);
              const deadlinePast = new Date(t.deadline).getTime() < Date.now();
              const count = applicationStore.countByTender(t.id);
              return (
                <div key={t.id} className="trow" style={{ gridTemplateColumns: "120px 1.6fr 1fr 1.2fr 110px 110px 130px 180px" }}>
                  <div style={{ color: "#666", fontSize: 12 }}>{t.referenceNumber}</div>
                  <div style={{ fontWeight: 500 }}>{t.title}</div>
                  <div><span className="pill pill-blue">{t.category}</span></div>
                  <div style={{ fontSize: 12 }}>
                    Rs.{Number(t.budgetMin).toLocaleString("en-IN")} – Rs.{Number(t.budgetMax).toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: 12, color: deadlinePast ? "#c00" : "#333" }}>{fmtDate(t.deadline)}</div>
                  <div><span className={st.cls}>{st.label}</span></div>
                  <div>
                    <button
                      className="pill pill-amber"
                      style={{ cursor: "pointer", border: "none" }}
                      onClick={() => navigate(`/company/applications/$id`.replace('\$id', t.id))}
                    >
                      {count} {count === 1 ? "Application" : "Applications"}
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {t.status === "draft" && (
                      <button
                        className="btn-outline"
                        title="Publish Draft"
                        onClick={() => setConfirmAction({ type: "publish", tender: t })}
                        style={{ padding: "4px 8px", color: "#16A34A" }}
                      >
                        <Rocket size={14} />
                      </button>
                    )}
                    <button className="btn-outline" title="View PDF" onClick={() => openPdf(t)} style={{ padding: "4px 8px" }}>
                      <Eye size={14} />
                    </button>
                    {t.status === "active" && !deadlinePast && (
                      <button
                        className="btn-outline"
                        title="Close Early"
                        onClick={() => setConfirmAction({ type: "close", tender: t })}
                        style={{ padding: "4px 8px", color: "#F59E0B" }}
                      >
                        <X size={14} />
                      </button>
                    )}
                    <button
                      className="btn-outline"
                      title="Applications"
                      onClick={() => navigate(`/company/applications/$id`.replace('\$id', t.id))}
                      style={{ padding: "4px 8px" }}
                    >
                      <Users size={14} />
                    </button>
                    <button
                      className="btn-outline"
                      title="Delete"
                      onClick={() => setConfirmAction({ type: "delete", tender: t })}
                      style={{ padding: "4px 8px", color: "#c00" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {previewUrl && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 980, width: "94%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #eee" }}>
              <div style={{ fontWeight: 600 }}>{previewTitle}</div>
              <button className="btn-outline" style={{ padding: 6 }} onClick={closePreview}><X size={16} /></button>
            </div>
            <div style={{ padding: 14 }}>
              <iframe src={previewUrl} title="PDF" style={{ width: "100%", height: "65vh", border: "1px solid #ddd", borderRadius: 6 }} />
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400, textAlign: "center", padding: "24px" }}>
            <h3 style={{ marginBottom: 12, fontSize: 18 }}>
              {confirmAction.type === "publish" ? "Publish Tender" : confirmAction.type === "close" ? "Close Tender" : "Delete Tender"}
            </h3>
            <p style={{ color: "#666", marginBottom: 20, fontSize: 14 }}>
              {confirmAction.type === "publish"
                ? <>Are you sure you want to publish <strong>{confirmAction.tender.referenceNumber}</strong>? It will become visible to all vendors.</>
                : confirmAction.type === "close"
                ? <>Are you sure you want to close <strong>{confirmAction.tender.referenceNumber}</strong> early? Vendors will no longer be able to apply.</>
                : <>Are you sure you want to delete <strong>{confirmAction.tender.referenceNumber}</strong>? This also removes all applications.</>}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button className="btn-outline" onClick={() => setConfirmAction(null)}>Cancel</button>
              <button
                className="btn-primary"
                style={confirmAction.type === "delete" ? { background: "#DC2626" } : confirmAction.type === "close" ? { background: "#F59E0B" } : { background: "#16A34A" }}
                onClick={executeConfirmAction}
              >
                {confirmAction.type === "publish" ? "Publish" : confirmAction.type === "close" ? "Close Early" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
