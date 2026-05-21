import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import MultiItemExcelEntryUI from './MultipleItemExcelEntryUI'
import ModernDashboardLandingPage from './ModernDashboardLandingPage'
import { Routes, Route } from "react-router-dom";
import TaxInvoiceRegisterPage from './TaxInvoiceRegisterPage'
import TaxInvoiceListPage from './TaxInvoicePage/TaxInvoiceListPage'
import { useParams } from "react-router-dom";
import EditTaxInvoicePage from './TaxInvoicePage/EditTaxInvoicePage'
import ChallanManagement from './challan/ChallanManagement'
import StoreManagementPage from './Store/StoreManagementPage'
import StoreInventoryPage from './Store/StoreInventoryPage'
import ProjectMasterManagementWithProgress from '../ProjectMasterManagement/ProjectMasterManagementWithProgress'
import ProjectBillingProgressPage from '../ProjectMasterManagement/ProjectBillingProgressPage'
import ProjectDetailPage from '../ProjectMasterManagement/ProjectDetailPage'
import EditProjectPage from '../ProjectMasterManagement/EditProjectPage'
import DailyProgressReportPage from './DPR/DailyProgressReportPage'
import LoginPage from './User/LoginPage'
import UserManagementPage from './User/UserManagementPage'
import ProtectedRoute from './components/ProtectedRoute'
import BOQManagementPage from './boq/BOQManagementPage'
import BOQDetailPage from './boq/BOQDetailPage'
import PartyListPage from './Party/PartyListPage'
import ProjectSpendingSurveillancePage from './TaxInvoicePage/ProjectSpendingSurveillancePage'
import MaterialMovementHistoryPage from './MaterialHistory/MaterialMovementHistoryPag'
function App() {
  const { taxInvoiceId } = useParams();

  return (
    <Routes>

      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />



      {/* Dashboard */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ModernDashboardLandingPage />
          </ProtectedRoute>
        }
      />



      {/* TAX INVOICE */}

      <Route
        path="/add-tax-invoice"
        element={
          <ProtectedRoute
            allowedRoles={[
              "MIS User",
              "Accountant"
            ]}
          >
            <TaxInvoiceRegisterPage />
          </ProtectedRoute>
        }
      />



      <Route
        path="/TaxInvoiceListPage"
        element={
          <ProtectedRoute
            allowedRoles={[
              "MIS User",
              "Accountant"
            ]}
          >
            <TaxInvoiceListPage />
          </ProtectedRoute>
        }
      />



      <Route
        path="/edit-tax-invoice/:taxInvoiceId"
        element={
          <ProtectedRoute
            allowedRoles={[
              "MIS User",
              "Accountant"
            ]}
          >
            <EditTaxInvoicePage />
          </ProtectedRoute>
        }
      />

  <Route
         path="/tax-invoice/project-surveillance"
        element={
          <ProtectedRoute
            allowedRoles={[
              "MIS User",
              "Accountant"
            ]}
          >
            <ProjectSpendingSurveillancePage />
          </ProtectedRoute>
        }
      />



      {/* STORE */}

      <Route
        path="/store"
        element={
          <ProtectedRoute
            allowedRoles={[
              "Store Manager",
              "MIS User"
            ]}
          >
            <StoreManagementPage />
          </ProtectedRoute>
        }
      />



      <Route
        path="/store/:storeId"
        element={
          <ProtectedRoute
            allowedRoles={[
              "Store Manager",
              "MIS User"
            ]}
          >
            <StoreInventoryPage />
          </ProtectedRoute>
        }
      />
  <Route
          path="/material-movement/history"
        element={
          <ProtectedRoute
            allowedRoles={[
              "Store Manager",
              "MIS User"
            ]}
          >
            <MaterialMovementHistoryPage/>
          </ProtectedRoute>
        }
      />


      {/* DPR */}

      <Route
        path="/dpr"
        element={
          <ProtectedRoute
            allowedRoles={[
              "MIS User",
              "Site Engineer",
              "Project Manager"
            ]}
          >
            <DailyProgressReportPage />
          </ProtectedRoute>
        }
      />



      {/* PROJECTS */}

      <Route
        path="/projects"
        element={
          <ProtectedRoute
            allowedRoles={[
              "MIS User",
              "Project Manager",
              "Site Engineer"
            ]}
          >
            <ProjectMasterManagementWithProgress />
          </ProtectedRoute>
        }
      />



      <Route
        path="/project/:projectId"
        element={
          <ProtectedRoute
            allowedRoles={[
              "MIS User",
              "Project Manager",
              "Site Engineer"
            ]}
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
              "MIS User",
              "Project Manager"
            ]}
          >
            <EditProjectPage />
          </ProtectedRoute>
        }
      />



      {/* CHALLAN */}

      <Route
        path="/challan"
        element={
          <ProtectedRoute
            allowedRoles={[
              "MIS User",
              "Store Manager",
              "Accountant"
            ]}
          >
            <ChallanManagement />
          </ProtectedRoute>
        }
      />
      {/* PARTY/VENDOR MASTER */}

      <Route
        path="/party"
        element={
          <ProtectedRoute
            allowedRoles={[
              "MIS User",
              "Site Engineer",
              "Store Manager",
              "Accountant",
              "Project Manager"
            ]}
          >
            <PartyListPage />
          </ProtectedRoute>
        }
      />



      {/* ITEM ENTRY */}

      <Route
        path="/add-item-at-site"
        element={
          <ProtectedRoute
            allowedRoles={[
              "Store Manager",
              "MIS User"
            ]}
          >
            <MultiItemExcelEntryUI />
          </ProtectedRoute>
        }
      />



      {/* USER MANAGEMENT */}

      <Route
        path="/user/mang"
        element={
          <ProtectedRoute
            allowedRoles={[
              "Super Admin",
              "Admin"
            ]}
          >
            <UserManagementPage />
          </ProtectedRoute>
        }
      />
      {/* Boq  */}
      <Route
        path="/project/:projectId/boq"
        element={
          <ProtectedRoute
            allowedRoles={[
              "Super Admin",
              "Admin"
            ]}
          >
            <BOQManagementPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/boq/:boqId"
        element={
          <ProtectedRoute
            allowedRoles={[
              "Super Admin",
              "Admin"
            ]}
          >
            <BOQDetailPage />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}

export default App
