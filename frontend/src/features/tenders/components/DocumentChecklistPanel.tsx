import { RequiredDocument } from "../types";
import { Plus, X } from "lucide-react";
import { useState } from "react";

interface Props {
  documents: RequiredDocument[];
  onChange: (docs: RequiredDocument[]) => void;
}

export function DocumentChecklistPanel({ documents, onChange }: Props) {
  const [newDocLabel, setNewDocLabel] = useState("");

  const handleAdd = () => {
    if (!newDocLabel.trim()) return;
    const newDoc: RequiredDocument = {
      id: Math.random().toString(36).substr(2, 9),
      label: newDocLabel.trim(),
      required: true,
    };
    onChange([...documents, newDoc]);
    setNewDocLabel("");
  };

  const handleRemove = (id: string) => {
    onChange(documents.filter((d) => d.id !== id));
  };

  const toggleRequired = (id: string) => {
    onChange(
      documents.map((d) =>
        d.id === id ? { ...d, required: !d.required } : d
      )
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#fff", borderLeft: "1px solid #ddd" }}>
      <div style={{ padding: "16px", borderBottom: "1px solid #eee", backgroundColor: "#f9fafb" }}>
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>Document Checklist</h3>
        <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
          {documents.length} documents required from vendor
        </div>
      </div>
      
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {documents.map((doc) => (
          <div key={doc.id} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
            <input 
              type="checkbox" 
              checked={doc.required} 
              onChange={() => toggleRequired(doc.id)} 
              style={{ marginTop: "4px", cursor: "pointer" }}
              title="Mark as mandatory"
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: 500, lineHeight: 1.4, color: doc.required ? "#0f172a" : "#64748b" }}>
                {doc.label}
              </div>
              <div style={{ fontSize: "11px", color: doc.required ? "#ef4444" : "#94a3b8", marginTop: "2px" }}>
                {doc.required ? "Mandatory" : "Optional"}
              </div>
            </div>
            <button 
              onClick={() => handleRemove(doc.id)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "2px" }}
              title="Remove document"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {documents.length === 0 && (
          <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "13px" }}>
            No documents requested.
          </div>
        )}
      </div>

      <div style={{ padding: "16px", borderTop: "1px solid #eee", backgroundColor: "#f9fafb" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            className="form-input"
            style={{ flex: 1, fontSize: "13px", padding: "8px 12px" }}
            placeholder="E.g. PAN Card copy"
            value={newDocLabel}
            onChange={(e) => setNewDocLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button 
            className="btn-primary" 
            style={{ padding: "8px 12px" }}
            onClick={handleAdd}
            disabled={!newDocLabel.trim()}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
