import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { FilePlus, Users, Eye, FileText } from "lucide-react";
import { tenderStore, applicationStore, type StoredTender } from "@/lib/store";

export { CompanyDashboard as default };

function CompanyDashboard() {
  const [tenders, setTenders] = useState<StoredTender[]>([]);
  const [appsCount, setAppsCount] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setTenders(tenderStore.list());
      setAppsCount(applicationStore.list().length);
    };
    refresh();
    window.addEventListener("tms-store-change", refresh);
    return () => window.removeEventListener("tms-store-change", refresh);
  }, []);

  const active = tenders.filter((t) => t.status === "active");
  const closed = tenders.filter((t) => t.status === "closed");
  const drafts = tenders.filter((t) => t.status === "draft");

  const getStatus = (t: StoredTender) => {
    if (t.status === "draft") return <span className="pill pill-blue">Draft</span>;
    if (t.status === "closed") return <span className="pill pill-grey">Closed</span>;
    return <span className="pill pill-green">Active</span>;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <div className="sub">Overview of your tender activity</div>
        </div>
        <Link to="/company/create" className="btn-primary"><FilePlus size={16} /> New Tender</Link>
      </div>

      <div className="stats-row">
        <Stat label="Total Tenders" value={String(tenders.length)} />
        <Stat label="Active" value={String(active.length)} />
        <Stat label="Closed" value={String(closed.length)} />
        <Stat label="Drafts" value={String(drafts.length)} />
        <Stat label="Vendor Applications" value={String(appsCount)} />
      </div>

      <div className="card">
        <div className="card-title">
          <span>Recent Tenders</span>
          <Link to="/company/tenders" className="btn-outline">View all</Link>
        </div>

        {tenders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 30, color: "#888" }}>
            <FileText size={28} style={{ marginBottom: 8 }} />
            <div style={{ marginBottom: 12 }}>You haven't published any tenders yet.</div>
            <Link to="/company/create" className="btn-primary"><FilePlus size={16} /> Create your first tender</Link>
          </div>
        ) : (
          <div className="data-table">
            <div className="thead" style={{ gridTemplateColumns: "120px 1.5fr 1fr 110px 100px 130px" }}>
              <div>Ref</div><div>Title</div><div>Category</div><div>Deadline</div><div>Status</div><div>Applications</div>
            </div>
            {tenders.slice(0, 6).map((t) => (
              <div key={t.id} className="trow" style={{ gridTemplateColumns: "120px 1.5fr 1fr 110px 100px 130px" }}>
                <div style={{ color: "#888", fontSize: 12 }}>{t.referenceNumber}</div>
                <div style={{ fontWeight: 500 }}>{t.title}</div>
                <div>{t.category}</div>
                <div style={{ fontSize: 12 }}>{t.deadline.split("T")[0]}</div>
                <div>{getStatus(t)}</div>
                <div>{applicationStore.countByTender(t.id)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title"><span>Quick Actions</span></div>
        <div className="quick-actions">
          <Link to="/company/create" className="qa"><FilePlus size={20} />New Tender</Link>
          <Link to="/company/tenders" className="qa"><FileText size={20} />My Tenders</Link>
          <Link to="/company/tenders" className="qa"><Users size={20} />Applications</Link>
          <Link to="/company/tenders" className="qa"><Eye size={20} />Review</Link>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, delta }: { label: string; value: string; delta?: string }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {delta && <div className="stat-delta">{delta}</div>}
    </div>
  );
}
