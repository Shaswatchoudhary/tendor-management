import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Eye, Users, Trash2, FilePlus, X } from "lucide-react";
import { toast } from "sonner";
import { tenderStore, applicationStore, type StoredTender } from "@/lib/store";
import { generateTenderPDF } from "@/lib/gemini";

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

function fmtDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
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
  const navigate = useNavigate();

  const openPdf = async (t: StoredTender) => {
    try {
      const doc = await generateTenderPDF(t.pdfForm, t.ai);
      const blob: Blob = doc.output("blob");
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

  const onDelete = (t: StoredTender) => {
    if (!confirm(`Delete ${t.referenceNumber}? This also removes all applications.`)) return;
    tenderStore.delete(t.id);
    toast.success("Tender deleted");
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
                    <button className="btn-outline" title="View PDF" onClick={() => openPdf(t)} style={{ padding: "4px 8px" }}>
                      <Eye size={14} />
                    </button>
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
                      onClick={() => onDelete(t)}
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
    </>
  );
}
