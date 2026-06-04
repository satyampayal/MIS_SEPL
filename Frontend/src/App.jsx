import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";

import "./App.css";

import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layout/MainLayout";
import LoginPage from "./User/LoginPage";
import SuperAdminDashboard from "./pages/Dashboard/SuperAdminDashboard";

// Lazy loaded pages
const MultiItemExcelEntryUI = lazy(() => import("./MultipleItemExcelEntryUI"));
const TaxInvoiceRegisterPage = lazy(() => import("./TaxInvoiceRegisterPage"));
const TaxInvoiceListPage = lazy(() =>
  import("./TaxInvoicePage/TaxInvoiceListPage")
);
const EditTaxInvoicePage = lazy(() =>
  import("./TaxInvoicePage/EditTaxInvoicePage")
);
const ChallanManagement = lazy(() => import("./challan/ChallanManagement"));
const ChallanApprovalPage = lazy(() =>
  import("./challan/ChallanApprovalPage")
);

const StoreManagementPage = lazy(() => import("./Store/StoreManagementPage"));
const StoreInventoryPage = lazy(() => import("./Store/StoreInventoryPage"));
const ItemIdentityPage = lazy(() => import("./Store/ItemIdentityPage"));
const MainStoreLiveStockPage = lazy(() =>
  import("./Store/MainStoreLiveStockPage")
);
const SiteStoreLiveStockPage = lazy(() =>
  import("./Store/SiteStoreLiveStockPage")
);

const ProjectMasterManagementWithProgress = lazy(() =>
  import("../ProjectMasterManagement/ProjectMasterManagementWithProgress")
);
const ProjectDetailPage = lazy(() =>
  import("../ProjectMasterManagement/ProjectDetailPage")
);
const EditProjectPage = lazy(() =>
  import("../ProjectMasterManagement/EditProjectPage")
);

const DailyProgressReportPage = lazy(() =>
  import("./DPR/DailyProgressReportPage")
);

const UserManagementPage = lazy(() => import("./User/UserManagementPage"));

const BOQManagementPage = lazy(() => import("./boq/BOQManagementPage"));
const BOQDetailPage = lazy(() => import("./boq/BOQDetailPage"));

const PartyListPage = lazy(() => import("./Party/PartyListPage"));

const ProjectSpendingSurveillancePage = lazy(() =>
  import("./TaxInvoicePage/ProjectSpendingSurveillancePage")
);

const MaterialMovementHistoryPage = lazy(() =>
  import("./MaterialHistory/MaterialMovementHistoryPag")
);

const MaterialMovementAnalyticsPage = lazy(() =>
  import("./MaterialHistory/MaterialMovementAnalyticsPage")
);

const TaxInvoiceAnalyticsPage = lazy(() =>
  import("./pages/Analytics/TaxInvoiceAnalyticsPage")
);

const MaterialAnalyticsCenter = lazy(() =>
  import("./reports/MaterialAnalyticsCenter")
);
const MaterialSummaryReport = lazy(() =>
  import("./pages/Reports/MaterialSummaryReport")
);
const ProjectWiseMaterialHistory = lazy(() =>
  import("./pages/Reports/ProjectWiseMaterialHistory")
);
const ProjectMaterialDetail = lazy(() =>
  import("./pages/Reports/ProjectMaterialDetail")
);
const ProjectLiveStockReport = lazy(() =>
  import("./pages/Reports/ProjectLiveStockReport")
);
const HeadStoreLiveStockReport = lazy(() =>
  import("./pages/Reports/HeadStoreLiveStockReport")
);

const ProjectMaterialPlanningPage = lazy(() =>
  import("./pages/ProjectMaterialPlanning/ProjectMaterialPlanningPage")
);

const StockTransactionPage = lazy(() =>
  import("./pages/StockTransaction/StockTransactionPage")
);
const LowStockDashboardPage=lazy(()=>
import("./Store/LowStockDashboardPage")
);

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6 animate-pulse">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="h-6 w-40 rounded bg-slate-800" />
          <div className="mt-4 h-9 w-96 rounded bg-slate-800" />
          <div className="mt-3 h-4 w-[520px] rounded bg-slate-800" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-3xl border border-slate-800 bg-slate-900/80"
            />
          ))}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="h-12 rounded-xl bg-slate-800" />
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-slate-800" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Main Layout */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={["Super Admin", "Admin"]}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Reports */}
          <Route
            path="/reports/material-analytics"
            element={
              <ProtectedRoute allowedRoles={["Super Admin", "Admin"]}>
                <MaterialAnalyticsCenter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports/material-summary"
            element={
              <ProtectedRoute allowedRoles={["Super Admin", "Admin"]}>
                <MaterialSummaryReport />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports/material-history/projects"
            element={
              <ProtectedRoute allowedRoles={["Super Admin", "Admin"]}>
                <ProjectWiseMaterialHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports/material-history/projects/:projectName"
            element={
              <ProtectedRoute allowedRoles={["Super Admin", "Admin"]}>
                <ProjectMaterialDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports/material-history/project-stock"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "Super Admin",
                  "Admin",
                  "MIS User",
                  "Store Manager",
                  "Project Manager",
                ]}
              >
                <ProjectLiveStockReport />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports/material-history/head-store-stock"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "Super Admin",
                  "Admin",
                  "MIS User",
                  "Store Manager",
                  "Project Manager",
                ]}
              >
                <HeadStoreLiveStockReport />
              </ProtectedRoute>
            }
          />

          {/* Item Identity */}
          <Route
            path="/item-identity"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "MIS User",
                  "Store Manager",
                  "Project Manager",
                  "Super Admin",
                  "Admin",
                ]}
              >
                <ItemIdentityPage />
              </ProtectedRoute>
            }
          />

          {/* Main Store Stock */}
          <Route
            path="/main-store-stock"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "MIS User",
                  "Store Manager",
                  "Project Manager",
                  "Super Admin",
                  "Admin",
                ]}
              >
                <MainStoreLiveStockPage />
              </ProtectedRoute>
            }
          />

          {/* Site Store Stock */}
          <Route
            path="/site-store-stock"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "MIS User",
                  "Store Manager",
                  "Project Manager",
                  "Super Admin",
                  "Admin",
                ]}
              >
                <SiteStoreLiveStockPage />
              </ProtectedRoute>
            }
          />

          {/* Tax Invoice */}
          <Route
            path="/add-tax-invoice"
            element={
              <ProtectedRoute allowedRoles={["MIS User", "Accountant"]}>
                <TaxInvoiceRegisterPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/TaxInvoiceListPage"
            element={
              <ProtectedRoute allowedRoles={["MIS User", "Accountant"]}>
                <TaxInvoiceListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/edit-tax-invoice/:taxInvoiceId"
            element={
              <ProtectedRoute allowedRoles={["MIS User", "Accountant"]}>
                <EditTaxInvoicePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tax-invoice/project-surveillance"
            element={
              <ProtectedRoute allowedRoles={["MIS User", "Accountant"]}>
                <ProjectSpendingSurveillancePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics/tax-invoice"
            element={
              <ProtectedRoute allowedRoles={["MIS User", "Accountant"]}>
                <TaxInvoiceAnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* Store */}
          <Route
            path="/store"
            element={
              <ProtectedRoute allowedRoles={["Store Manager", "MIS User"]}>
                <StoreManagementPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/store/:storeId"
            element={
              <ProtectedRoute allowedRoles={["Store Manager", "MIS User"]}>
                <StoreInventoryPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/material-movement/history"
            element={
              <ProtectedRoute allowedRoles={["Store Manager", "MIS User"]}>
                <MaterialMovementHistoryPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/material-movement/analytics"
            element={
              <ProtectedRoute allowedRoles={["Store Manager", "MIS User"]}>
                <MaterialMovementAnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* DPR */}
          <Route
            path="/dpr"
            element={
              <ProtectedRoute
                allowedRoles={["MIS User", "Site Engineer", "Project Manager"]}
              >
                <DailyProgressReportPage />
              </ProtectedRoute>
            }
          />

          {/* Projects */}
          <Route
            path="/projects"
            element={
              <ProtectedRoute
                allowedRoles={["MIS User", "Project Manager", "Site Engineer"]}
              >
                <ProjectMasterManagementWithProgress />
              </ProtectedRoute>
            }
          />

          <Route
            path="/project/:projectId"
            element={
              <ProtectedRoute
                allowedRoles={["MIS User", "Project Manager", "Site Engineer"]}
              >
                <ProjectDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/project/update/:projectId"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "Super Admin",
                  "Admin",
                  "Manager",
                  "Project Manager",
                ]}
              >
                <EditProjectPage />
              </ProtectedRoute>
            }
          />

          {/* Challan */}
          <Route
            path="/challan"
            element={
              <ProtectedRoute allowedRoles={["MIS User", "Store Manager"]}>
                <ChallanManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/challan-approval"
            element={
              <ProtectedRoute
                allowedRoles={["MIS User", "Store Manager", "Project Manager"]}
              >
                <ChallanApprovalPage />
              </ProtectedRoute>
            }
          />

          {/* Party / Vendor */}
          <Route
            path="/party"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "MIS User",
                  "Site Engineer",
                  "Store Manager",
                  "Accountant",
                  "Project Manager",
                ]}
              >
                <PartyListPage />
              </ProtectedRoute>
            }
          />

          {/* Item Entry */}
          <Route
            path="/add-item-at-site"
            element={
              <ProtectedRoute allowedRoles={["Store Manager", "MIS User"]}>
                <MultiItemExcelEntryUI />
              </ProtectedRoute>
            }
          />

          {/* User Management */}
          <Route
            path="/user/mang"
            element={
              <ProtectedRoute allowedRoles={["Super Admin", "Admin"]}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />

          {/* BOQ */}
          <Route
            path="/project/:projectId/boq"
            element={
              <ProtectedRoute allowedRoles={["Super Admin", "Admin"]}>
                <BOQManagementPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/boq/:boqId"
            element={
              <ProtectedRoute allowedRoles={["Super Admin", "Admin"]}>
                <BOQDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Project Material Planning */}
          <Route
            path="/project-material-planning"
            element={
              <ProtectedRoute
                allowedRoles={["Super Admin", "Admin", "Manager", "MIS"]}
              >
                <ProjectMaterialPlanningPage />
              </ProtectedRoute>
            }
          />

          {/* Stock Transaction */}
          <Route
            path="/stock-transactions"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "Super Admin",
                  "Admin",
                  "MIS User",
                  "Store Manager",
                  "Project Manager",
                ]}
              >
                <StockTransactionPage />
              </ProtectedRoute>
            }
          />

          {/* Low Stock Dashboard */}
          <Route
            path="/low-stock-dashboard"
            element={
              <ProtectedRoute allowedRoles={["Super Admin", "Admin", "Manager"]}>
                <LowStockDashboardPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;