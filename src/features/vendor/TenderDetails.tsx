import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Send } from "lucide-react";
import { toast } from "sonner";
import { generateTenderPDF } from "@/lib/gemini";
import { tenderStore, applicationStore, CURRENT_VENDOR, type StoredTender } from "@/lib/store";

export { TenderDetailPage as default };

function fmtDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function TenderDetailPage() {
  const { id } = useParams() as { id: string };
  const navigate = useNavigate();
  const [tender, setTender] = useState<StoredTender | undefined>();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const existingApp = applicationStore.forTender(id).find(a => a.vendorId === CURRENT_VENDOR.id);
  const hasApplied = !!existingApp;

  useEffect(() => {
    const t = tenderStore.get(id);
    setTender(t);
    if (!t) { setLoading(false); return; }
    (async () => {
      try {
        const doc = await generateTenderPDF(t.pdfForm, t.ai);
        const blob: Blob = doc.output("blob");
        setPdfUrl(URL.createObjectURL(blob));
      } catch (e) {
        console.error(e);
        toast.error("Failed to load tender PDF");
      } finally {
        setLoading(false);
      }
    })();
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!tender) {
    return (
      <>
        <div className="page-header"><div><h1>Tender</h1></div></div>
        <div className="card">
          Tender not found. <Link to="/vendor">Back to Browse</Link>
        </div>
      </>
    );
  }

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `${tender.referenceNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/vendor" className="btn-outline" style={{ marginBottom: 8, display: "inline-flex" }}>
            <ArrowLeft size={14} /> Back to Browse
          </Link>
          <h1>{tender.title}</h1>
          <div className="sub">{tender.referenceNumber}</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          <span className="pill pill-blue">{tender.category}</span>
          <span className="pill pill-amber">
            Budget: Rs.{Number(tender.budgetMin).toLocaleString("en-IN")} – Rs.{Number(tender.budgetMax).toLocaleString("en-IN")}
          </span>
          <span className="pill pill-grey">Deadline: {fmtDate(tender.deadline)}</span>
          <span className="pill pill-grey">Location: {tender.location}</span>
          {tender.status === "closed" && <span className="pill pill-red">Closed</span>}
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 6, background: "#f7f7f7", marginBottom: 14 }}>
          {loading ? (
            <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>
              <span className="loading" /> Loading tender document...
            </div>
          ) : pdfUrl ? (
            <iframe src={pdfUrl} title="Tender PDF" style={{ width: "100%", height: "70vh", border: "none", borderRadius: 6 }} />
          ) : (
            <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#c00" }}>
              Unable to render PDF preview.
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
          <button className="btn-outline" onClick={handleDownload} disabled={!pdfUrl}>
            <Download size={16} /> Download Tender PDF
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              if (hasApplied) navigate(`/vendor/result/$id`.replace('\$id', existingApp!.id));
              else navigate(`/vendor/apply/$id`.replace('\$id', tender.id));
            }}
            disabled={tender.status === "closed" && !hasApplied}
            style={(tender.status === "closed" && !hasApplied) ? { background: "#ccc", cursor: "not-allowed" } : undefined}
          >
            {hasApplied ? "View Application" : tender.status === "closed" ? "Tender Closed" : <>Apply Now <Send size={16} /></>}
          </button>
        </div>
      </div>
    </>
  );
}
