import { Link, useLocation, useNavigate } from "react-router-dom";
import type { ComponentType } from "react";
import { LogOut } from "lucide-react";
import { clearCurrentUser } from "@/lib/store";
import "./Sidebar.scss";

export type SidebarItem = {
  to?: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  action?: "signout";
};

export function Sidebar({ items }: { items: SidebarItem[] }) {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="side-label">Menu</div>
      {items.map((it) => {
        const Icon = it.icon;
        if (it.action === "signout") {
          return (
            <button key={it.label} className="sitem" onClick={() => { clearCurrentUser(); navigate("/"); }}>
              <LogOut size={16} />
              <span>{it.label}</span>
            </button>
          );
        }
        const active = pathname === it.to;
        return (
          <Link key={it.label} to={it.to!} className={`sitem ${active ? "on" : ""}`}>
            <Icon size={16} />
            <span>{it.label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
