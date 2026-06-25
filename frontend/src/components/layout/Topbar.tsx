import { Link, useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { getCurrentUser } from "@/lib/store";
import "./Topbar.scss";

type NavItem = { to: string; label: string };

export function Topbar({ nav, initials = "AB" }: { nav: NavItem[]; initials?: string }) {
  const pathname = useLocation().pathname;
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const user = getCurrentUser();

  const notifs = user?.role === "company"
    ? [
      { id: 1, text: "New application received for Tender #T-1024", time: "10 mins ago" },
      { id: 2, text: "Tender #T-1023 deadline approaching in 2 days", time: "1 hour ago" }
    ]
    : user?.role === "vendor"
      ? [
        { id: 3, text: "Tender #T-1022 has closed. Check your results!", time: "2 hours ago" },
        { id: 4, text: "New tender posted in Construction category", time: "1 day ago" }
      ]
      : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="topbar">
      <div className="logo">
        <div className="logo-icon">T</div>
        <span>Tender Management</span>
      </div>
      <nav className="nav">
        {nav.map((n, i) => (
          <Link key={`${n.to}-${i}`} to={n.to} className={pathname === n.to ? "on" : ""}>
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="spacer" />
      <div className="top-actions">
        <div ref={notifRef} style={{ position: "relative" }}>
          <button className="bell" aria-label="Notifications" onClick={() => setShowNotifs(!showNotifs)}>
            <Bell size={16} />
            {notifs.length > 0 && <span className="badge" />}
          </button>

          {showNotifs && (
            <div className="notification-dropdown">
              <div className="nd-header">
                <span>Notifications</span>
              </div>
              <div className="nd-body">
                {notifs.length > 0 ? (
                  notifs.map(n => (
                    <div key={n.id} className="nd-item">
                      <div>{n.text}</div>
                      <div className="nd-time">{n.time}</div>
                    </div>
                  ))
                ) : (
                  <div className="nd-empty">No new notifications</div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="avatar">{initials}</div>
      </div>
    </header>
  );
}
