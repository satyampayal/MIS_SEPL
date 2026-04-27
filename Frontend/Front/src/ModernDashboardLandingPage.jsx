import React from "react";
import {
  LayoutDashboard,
  Building2,
  Warehouse,
  Users,
  FileText,
  Package,
  TrendingUp,
  IndianRupee,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useState } from "react";



const quickActions = [
  "Add Tax Invoice",
  "Create Challan",
  "Add Vendor",
  "Register Store",
];


export default function ModernDashboardLandingPage() {
const [totalTaxRegister, setTotalTaxRegister] = useState(0);
const [totalSitesRegister,setTotalSitesRegister]=useState(0);

const stats = [
  {
    title: "Active Sites",
    value: totalSitesRegister,
    icon: Building2,
  },
  {
    title: "Total Stores",
    value: "4",
    icon: Warehouse,
  },
  {
    title: "Total Vendors",
    value: "3",
    icon: Users,
  },
  {
    title: "Total Challans",
    value: "4",
    icon: FileText,
  },
  {
    title: "Total Tax Invoice Register",
    value: totalTaxRegister,
    icon: FileText,// package
  },
  {
    title: "Total Value",
    value: "₹330,000",
    icon: TrendingUp,
  },
];

// Fetch Total Tax Invoice Register to show in STATS

  const fetchTotalTaxRegister = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/total-tax-invoice-register",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      console.log(result);

      setTotalTaxRegister(()=>result.total);
      console.log(totalTaxRegister)

    } catch (error) {
      console.log(error);
    }
  };

    const fetchTotalSitesRegister = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/sites",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      console.log(result);

      setTotalSitesRegister(()=>result.data.length);
      console.log(totalSitesRegister)

    } catch (error) {
      console.log(error);
    }
  };


 useEffect(() => {

  fetchTotalTaxRegister();
  fetchTotalSitesRegister();
  
}, []);
  const navigate = useNavigate();
  const handleClick=(actionName)=>{
    // console.log(actionName)
  if(actionName=="Add Tax Invoice")  navigate("/add-tax-invoice")
  else if(actionName=="Total Tax Invoice Register")  navigate("/TaxInvoiceListPage")
else if(actionName=="Active Sites") navigate('/sites')
}
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navbar */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap gap-6 items-center">
          <div className="text-xl font-bold text-blue-600">
            Material Register
          </div>

          <nav className="flex flex-wrap gap-6 text-sm font-medium text-slate-700">
            <div className="flex items-center gap-2 border-b-2 border-blue-500 pb-1 text-blue-600">
              <LayoutDashboard size={18} /> Dashboard
            </div>
            <div className="flex items-center gap-2">
              <Building2 size={18} /> Sites
            </div>
            <div className="flex items-center gap-2">
              <Warehouse size={18} /> Stores
            </div>
            <div className="flex items-center gap-2">
              <Users size={18} /> Vendors
            </div>
            <div className="flex items-center gap-2">
              <FileText size={18} /> Challans
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Hero */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-3">
            Dashboard Overview
          </h1>
          <p className="text-sm md:text-base opacity-90 max-w-2xl">
            Track invoices, challans, vendors, stores and material movement in one
            place. Clean records save more time than meetings ever will.
          </p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
              onClick={()=>handleClick(item.title)}
                key={index}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-slate-500 mb-2">{item.title}</p>
                  <h2 className="text-2xl font-bold text-slate-800">
                    
                    {item.value}
                  </h2>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Icon size={28} />
                </div>
              </div>
            );
          })}
        </section>

        {/* Quick Actions + Alerts */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={()=>handleClick(action)}
                  className="rounded-xl border border-slate-200 p-4 text-left hover:shadow-md transition"
                >
                  <p className="font-medium">{action}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Fast entry for daily operations
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Alerts</h2>
            <div className="space-y-4 text-sm">
              <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200">
                3 pending challans need approval
              </div>
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 font-medium">
                Material mismatch found in 1 delivery
              </div>
              <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                Vendor payment updated successfully
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
