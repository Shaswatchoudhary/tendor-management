import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Building2, Briefcase } from "lucide-react";
import { initializeMockData, getMockUsers } from "@/lib/mockData";
import { setCurrentUser, type LoggedInUser } from "@/lib/store";
import { authApi } from "@/lib/api";
import "./Home.scss";

export function Home() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    initializeMockData();
  }, []);

  const loginAs = async (em: string, pw: string) => {
    setError("");
    try {
      // First try real backend login
      const result = await authApi.login({ email: em, password: pw });
      const u = result.user;

      const logged: LoggedInUser = {
        id: u.id,
        email: u.email,
        role: u.role as any,
        name: u.name,
        companyName: u.company_name || u.name,
        address: "N/A",
        phone: "N/A",
      };
      setCurrentUser(logged);
      navigate(u.role === "company" ? "/company" : "/vendor");
    } catch (err: any) {
      // Fallback to mock users for the quick demo buttons if backend fails
      const users = getMockUsers();
      const u = users[em];
      if (!u || u.password !== pw) {
        setError(err.message || "Invalid email or password");
        return;
      }

      const logged: LoggedInUser = {
        id: u.id, email: u.email, role: u.role, name: u.name,
        companyName: u.companyName, address: u.address, phone: u.phone,
      };
      setCurrentUser(logged);
      navigate(u.role === "company" ? "/company" : "/vendor");
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAs(email.trim().toLowerCase(), password);
  };

  const quick = (em: string) => loginAs(em, "demo123");

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">T</div>
          <span>Tender Management</span>
        </div>

        <h2>Welcome back</h2>
        <div className="sub">Sign in to continue</div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && (
            <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 10 }}>{error}</div>
          )}
          <button type="submit" className="btn-primary full">Sign In</button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center", fontSize: 14 }}>
          Don't have an account? <Link to="/register" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>Register here</Link>
        </div>

        <div style={{
          marginTop: 22, paddingTop: 18, borderTop: "1px solid #e5e7eb",
        }}>
          <div style={{ textAlign: "center", fontSize: 12, color: "#6b7280", marginBottom: 12, letterSpacing: 0.5 }}>
            QUICK DEMO LOGIN
          </div>

          <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <Building2 size={13} /> COMPANY ACCOUNTS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
            <button type="button" className="btn-outline" onClick={() => quick("company1@demo.com")}>
              Login as TechCorp India
            </button>
            <button type="button" className="btn-outline" onClick={() => quick("company2@demo.com")}>
              Login as BuildRight Pvt Ltd
            </button>
          </div>

          <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <Briefcase size={13} /> VENDOR ACCOUNTS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button type="button" className="btn-outline" onClick={() => quick("vendor1@demo.com")}>
              Login as Sharma Enterprises
            </button>
            <button type="button" className="btn-outline" onClick={() => quick("vendor2@demo.com")}>
              Login as NextGen Solutions
            </button>
            <button type="button" className="btn-outline" onClick={() => quick("vendor3@demo.com")}>
              Login as RapidBuild Co.
            </button>
          </div>

          <div style={{ marginTop: 14, fontSize: 11, color: "#9ca3af", textAlign: "center", lineHeight: 1.6 }}>
            Or use any demo email with password <code style={{ background: "#f3f4f6", padding: "1px 6px", borderRadius: 4 }}>demo123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
