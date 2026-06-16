import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { Toaster } from "sonner";

// Home
import { Home } from "./pages/Home";
import { Register } from "./pages/Register";

// Company Layout & Routes
import CompanyLayout from "./features/company/CompanyLayout";
import CompanyDashboard from "./features/company/CompanyDashboard";
import CreateTender from "./features/company/CreateTender";
import TenderList from "./features/company/TenderList";
import ApplicationDetails from "./features/company/ApplicationDetails";

// Vendor Layout & Routes
import VendorLayout from "./features/vendor/VendorLayout";
import VendorDashboard from "./features/vendor/VendorDashboard";
import VendorApplications from "./features/vendor/VendorApplications";
import ApplyToTender from "./features/vendor/ApplyToTender";
import TenderDetails from "./features/vendor/TenderDetails";
import ResultDetails from "./features/vendor/ResultDetails";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/company" element={<CompanyLayout />}>
          <Route index element={<CompanyDashboard />} />
          <Route path="create" element={<CreateTender />} />
          <Route path="tenders" element={<TenderList />} />
          <Route path="applications/:id" element={<ApplicationDetails />} />
        </Route>

        <Route path="/vendor" element={<VendorLayout />}>
          <Route index element={<VendorDashboard />} />
          <Route path="applications" element={<VendorApplications />} />
          <Route path="apply/:id" element={<ApplyToTender />} />
          <Route path="tender/:id" element={<TenderDetails />} />
          <Route path="result/:id" element={<ResultDetails />} />
        </Route>
      </Routes>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}
