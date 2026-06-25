import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { applicationStore, tenderStore, CURRENT_VENDOR, type StoredApplication } from "@/lib/store";

export { MyApplications as default };

function verdictPill(v?: string) {
  if (v === "SELECTED") return "pill pill-green";
  if (v === "NOT_SELECTED") return "pill pill-red";
  if (v === "SHORTLISTED") return "pill pill-blue";
  return "pill pill-amber";
}

function formatVerdict(v?: string) {
  if (v === "SELECTED") return "Selected";
  if (v === "NOT_SELECTED") return "Not Selected";
  if (v === "SHORTLISTED") return "Shortlisted";
  return "Under Review";
}

function MyApplications() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<StoredApplication[]>([]);

  useEffect(() => {
    const refresh = () => setApps(applicationStore.forVendor(CURRENT_VENDOR.id));
    refresh();
    window.addEventListener("tms-store-change", refresh);
    return () => window.removeEventListener("tms-store-change", refresh);
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My Applications</h1>
          <div className="sub">All tender applications you have submitted</div>
        </div>
      </div>

      <div className="card">
        {apps.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
            You haven't applied to any tenders yet. <Link to="/vendor">Browse open tenders</Link>
          </div>
        ) : (
          <div className="data-table">
            <div className="thead" style={{ gridTemplateColumns: "1.8fr 130px 110px 100px" }}>
              <div>Tender Title</div>
              <div>Verdict</div>
              <div>Submitted</div>
              <div>Action</div>
            </div>
            {apps.map((a) => {
              const t = tenderStore.get(a.tenderId);
              return (
                <div
                  key={a.id}
                  className="trow"
                  style={{ gridTemplateColumns: "1.8fr 130px 110px 100px", cursor: "pointer" }}
                  onClick={() => navigate(`/vendor/result/$id`.replace('$id', a.id))}
                >
                  <div style={{ fontWeight: 500 }}>{t?.title || "Tender removed"}</div>
                  <div><span className={verdictPill(a.match?.verdict)}>{formatVerdict(a.match?.verdict)}</span></div>
                  <div style={{ fontSize: 12 }}>{new Date(a.createdAt).toLocaleDateString("en-IN")}</div>
                  <div><button className="btn-outline" style={{ padding: "4px 8px" }}>View</button></div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
