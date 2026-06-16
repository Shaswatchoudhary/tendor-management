import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import "./Home.scss";

export function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("vendor"); // default to vendor
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.register({
        name,
        email,
        password,
        role,
        company_name: role === 'company' ? companyName : undefined,
      });
      toast.success("Registration successful! You can now log in.");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">T</div>
          <span>TenderHub</span>
        </div>

        <h2>Create an Account</h2>
        <div className="sub">Register as a Company or Vendor</div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="vendor">Vendor / Contractor</option>
              <option value="company">Tendering Company</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} required />
          </div>
          {role === 'company' && (
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input className="form-input" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </div>
          )}
          <button type="submit" className="btn-primary full" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center", fontSize: 14 }}>
          Already have an account? <Link to="/" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>Sign in here</Link>
        </div>
      </div>
    </div>
  );
}
