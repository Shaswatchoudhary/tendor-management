import { TenderHeader } from "../types";

interface Props {
  header: TenderHeader;
  onChange: (header: TenderHeader) => void;
}

export function TenderHeaderCard({ header, onChange }: Props) {
  const update = (field: keyof TenderHeader, value: string) => {
    onChange({ ...header, [field]: value });
  };

  return (
    <div style={{ padding: "16px 20px", backgroundColor: "#fafafa", borderBottom: "1px solid #eee" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 12 }}>Tender Title</label>
          <input 
            className="form-input" 
            value={header.title} 
            onChange={(e) => update("title", e.target.value)} 
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 12 }}>Reference Number</label>
          <input 
            className="form-input" 
            value={header.refNo} 
            readOnly 
            style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed" }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 12 }}>Category</label>
          <input 
            className="form-input" 
            value={header.category} 
            onChange={(e) => update("category", e.target.value)} 
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 12 }}>Location</label>
          <input 
            className="form-input" 
            value={header.location} 
            onChange={(e) => update("location", e.target.value)} 
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 12 }}>Min Budget ({header.currency})</label>
            <input 
              className="form-input" 
              type="number"
              value={header.budgetMin} 
              onChange={(e) => update("budgetMin", e.target.value)} 
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 12 }}>Max Budget ({header.currency})</label>
            <input 
              className="form-input" 
              type="number"
              value={header.budgetMax} 
              onChange={(e) => update("budgetMax", e.target.value)} 
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 12 }}>Submission Deadline</label>
          <input 
            className="form-input" 
            type="datetime-local"
            value={header.submissionDeadline} 
            onChange={(e) => update("submissionDeadline", e.target.value)} 
          />
        </div>

      </div>
    </div>
  );
}
