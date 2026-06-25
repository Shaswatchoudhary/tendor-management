import { Outlet } from "react-router-dom";
import { LayoutDashboard, FilePlus, FileText, User, Settings, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { initializeMockData } from "@/lib/mockData";
import { getCurrentUser, syncCurrentUser } from "@/lib/store";
import "../../components/layout/Layout.scss";

export { CompanyLayout as default };

function initialsFor(name: string) {
  return name.split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "AC";
}

function CompanyLayout() {
  const [initials, setInitials] = useState("AC");
  useEffect(() => {
    initializeMockData();
    syncCurrentUser();
    const u = getCurrentUser();
    if (u) setInitials(initialsFor(u.companyName || u.name));
  }, []);

  return (
    <div className="app-shell">
      <Sidebar
        items={[
          { to: "/company", label: "Dashboard", icon: LayoutDashboard },
          { to: "/company/create", label: "Create Tender", icon: FilePlus },
          { to: "/company/tenders", label: "My Tenders", icon: FileText },
          { label: "Sign Out", icon: LogOut, action: "signout" },
        ]}
      />
      <div className="app-main">
        <Topbar
          initials={initials}
          nav={[
            { to: "/company", label: "Dashboard" },
            { to: "/company/create", label: "Create Tender" },
            { to: "/company/tenders", label: "My Tenders" },
          ]}
        />
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
