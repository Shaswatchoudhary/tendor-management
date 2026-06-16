import { Outlet } from "react-router-dom";
import { Search, FileCheck, User, Settings, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { initializeMockData } from "@/lib/mockData";
import { getCurrentUser, syncCurrentUser } from "@/lib/store";
import "../../components/layout/Layout.scss";

export { VendorLayout as default };

function initialsFor(name: string) {
  return name.split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "VS";
}

function VendorLayout() {
  const [initials, setInitials] = useState("VS");
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
          { to: "/vendor", label: "Browse Tenders", icon: Search },
          { to: "/vendor/applications", label: "My Applications", icon: FileCheck },
          { label: "Sign Out", icon: LogOut, action: "signout" },
        ]}
      />
      <div className="app-main">
        <Topbar
          initials={initials}
          nav={[
            { to: "/vendor", label: "Browse Tenders" },
            { to: "/vendor/applications", label: "My Applications" },
          ]}
        />
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
