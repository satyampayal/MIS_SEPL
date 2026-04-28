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
import SiteManagementWithProgress from '../SiteManagement/SiteManagementWithProgress'
import ChallanManagement from './challan/ChallanManagement'
import StoreManagementPage from './Store/StoreManagementPage'
function App() {
const { taxInvoiceId } = useParams();

  return (
    <Routes>
{/* <MultiItemExcelEntryUI/> */}
  <Route path="/" element={<ModernDashboardLandingPage />} />

  // Register Tax Invoice 
  <Route path="/add-tax-invoice" element={<TaxInvoiceRegisterPage />} />
  //  Add New Item at site excel Opening Stock 
  <Route path="/add-item-at-site" element={<MultiItemExcelEntryUI />} />

  //Total tax invoice page
  <Route path='TaxInvoiceListPage' element={<TaxInvoiceListPage/>} />

  //Edit Tax Invoice Page 
  <Route path={"/edit-tax-invoice/:taxInvoiceId"} element={<EditTaxInvoicePage/>}/>
  

  /*  Site Management */
  <Route path={'/sites'}  element={<SiteManagementWithProgress/>} />


  
  {/* Challan Routes */}
  <Route  path='/challan' element={<ChallanManagement/>}/>

  {/* Store Management start */}

  <Route  path='/store' element={<StoreManagementPage/>} />

    </Routes>
  )
}

export default App
