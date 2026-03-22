import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ShiftProvider } from "@/contexts/ShiftContext";
import { OrderProvider } from "@/contexts/OrderContext";
import { RestaurantProvider } from "@/contexts/RestaurantContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/components/MainLayout";

import { lazy, Suspense } from "react";
import LoginPage from "./pages/LoginPage";
import OpenShiftPage from "./pages/OpenShiftPage";
import OrderPage from "./pages/OrderPage";
import CloseShiftPage from "./pages/CloseShiftPage";

// Lazy load admin pages for code splitting
const DashboardPage = lazy(() => import("./pages/admin/DashboardPage"));
const InvoicesPage = lazy(() => import("./pages/admin/InvoicesPage"));
const StaffPage = lazy(() => import("./pages/admin/StaffPage"));
const RestaurantPage = lazy(() => import("./pages/admin/RestaurantPage"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <RestaurantProvider>
          <ShiftProvider>
            <OrderProvider>
              <Toaster />
              <Sonner />
              <HashRouter>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  
                  <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                    <Route path="/open-shift" element={<OpenShiftPage />} />
                    <Route path="/orders" element={<OrderPage />} />
                    <Route path="/close-shift" element={<CloseShiftPage />} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><Suspense fallback={<div className="flex items-center justify-center h-screen">Đang tải...</div>}><DashboardPage /></Suspense></ProtectedRoute>} />
                    <Route path="/admin/invoices" element={<ProtectedRoute allowedRoles={['ADMIN']}><Suspense fallback={<div className="flex items-center justify-center h-screen">Đang tải...</div>}><InvoicesPage /></Suspense></ProtectedRoute>} />
                    <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={['ADMIN']}><Suspense fallback={<div className="flex items-center justify-center h-screen">Đang tải...</div>}><StaffPage /></Suspense></ProtectedRoute>} />
                    <Route path="/admin/restaurant" element={<ProtectedRoute allowedRoles={['ADMIN']}><Suspense fallback={<div className="flex items-center justify-center h-screen">Đang tải...</div>}><RestaurantPage /></Suspense></ProtectedRoute>} />
                  </Route>
                  
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </HashRouter>
            </OrderProvider>
          </ShiftProvider>
        </RestaurantProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
