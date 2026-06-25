import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { tenderStore, type StoredTender } from "@/lib/store";
import { fmtDate } from "@/lib/utils";
import "./BrowseTenders.scss";

export { VendorDashboard as default };

function VendorDashboard() {
  const [tenders, setTenders] = useState<StoredTender[]>([]);
  useEffect(() => {
    const refresh = () => setTenders(tenderStore.list().filter((t) => t.status === "active"));
    refresh();
    window.addEventListener("tms-store-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("tms-store-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Browse Tenders</h1>
          <div className="sub">Discover opportunities and submit applications</div>
        </div>
        <Link to="/vendor/applications" className="btn-outline">My Applications</Link>
      </div>

      <div className="card">
        <div className="card-title">
          <span>Open Tenders</span>
          <span className="pill pill-amber">{tenders.length} available</span>
        </div>

        {tenders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
            No tenders have been published yet. Check back soon.
          </div>
        ) : (
          <div className="tender-grid">
            {tenders.map((t) => (
              <div key={t.id} className="tender-card">
                <div className="tc-row">
                  <span className="pill pill-blue">{t.category}</span>
                  <span className="tc-meta">{t.referenceNumber}</span>
                </div>
                <div className="tc-title">{t.title}</div>
                <div className="tc-meta">{t.companyName} • {t.location}</div>
                <div className="tc-row">
                  <span className="tc-budget">
                    Rs.{Number(t.budgetMin).toLocaleString("en-IN")} – Rs.{Number(t.budgetMax).toLocaleString("en-IN")}
                  </span>
                  <span className="tc-meta">Due {fmtDate(t.deadline)}</span>
                </div>
                <Link to={`/vendor/tender/$id`.replace('\$id', t.id)} className="btn-primary" style={{ marginTop: 6 }}>
                  View Tender
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
