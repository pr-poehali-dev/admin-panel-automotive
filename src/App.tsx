import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import AdminLayout from "./components/admin/AdminLayout";
import DashboardSection from "./components/admin/sections/DashboardSection";
import ClientsSection from "./components/admin/sections/ClientsSection";
import CarsSection from "./components/admin/sections/CarsSection";
import OrdersSection from "./components/admin/sections/OrdersSection";
import ServicesSection from "./components/admin/sections/ServicesSection";
import MastersSection from "./components/admin/sections/MastersSection";
import SparePartsSection from "./components/admin/sections/SparePartsSection";
import WarehousesSection from "./components/admin/sections/WarehousesSection";
import FinancesSection from "./components/admin/sections/FinancesSection";
import AppointmentsSection from "./components/admin/sections/AppointmentsSection";
import ReviewsSection from "./components/admin/sections/ReviewsSection";
import PromotionsSection from "./components/admin/sections/PromotionsSection";
import EmployeesSection from "./components/admin/sections/EmployeesSection";
import SuppliersSection from "./components/admin/sections/SuppliersSection";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardSection />} />
            <Route path="clients" element={<ClientsSection />} />
            <Route path="cars" element={<CarsSection />} />
            <Route path="orders" element={<OrdersSection />} />
            <Route path="services" element={<ServicesSection />} />
            <Route path="masters" element={<MastersSection />} />
            <Route path="spare-parts" element={<SparePartsSection />} />
            <Route path="warehouses" element={<WarehousesSection />} />
            <Route path="finances" element={<FinancesSection />} />
            <Route path="appointments" element={<AppointmentsSection />} />
            <Route path="reviews" element={<ReviewsSection />} />
            <Route path="promotions" element={<PromotionsSection />} />
            <Route path="employees" element={<EmployeesSection />} />
            <Route path="suppliers" element={<SuppliersSection />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
