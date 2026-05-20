// src/pages/TaxInvoice/ProjectSpendingSurveillancePage.jsx

import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  IndianRupee,
  FileWarning,
  Receipt,
  Loader2,
  Search,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import BASE_URL from "../../config/api";

export default function ProjectSpendingSurveillancePage() {
  const navigate = useNavigate();

  const [spending, setSpending] = useState([]);
  const [pendingChallans, setPendingChallans] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    projectSite: "",
    vendorName: "",
    challanNumber: "",
  });

  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN");
  };

  const fetchProjectSpending = async () => {
    try {
      const res = await fetch(`${BASE_URL}/tax-invoice/project-spending`, {
        headers: authHeaders,
      });

      const data = await res.json();

      if (data.success) {
        setSpending(data.data || []);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to load project spending");
    }
  };

  const fetchPendingChallans = async () => {
    try {
      setLoading(true);

      const query = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) query.append(key, value);
      });

      const res = await fetch(
        `${BASE_URL}/tax-invoice/pending-challans?${query.toString()}`,
        {
          headers: authHeaders,
        }
      );

      const data = await res.json();

      if (data.success) {
        setPendingChallans(data.data || []);
      } else {
        toast.error(data.message || "Failed to load pending challans");
      }
    } catch (error) {
      console.log(error);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectSpending();
    fetchPendingChallans();
  }, []);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const applyFilters = () => {
    fetchPendingChallans();
  };

  const resetFilters = () => {
    setFilters({
      projectSite: "",
      vendorName: "",
      challanNumber: "",
    });

    setTimeout(() => {
      fetchPendingChallans();
    }, 100);
  };

  const totalSpend = spending.reduce(
    (sum, item) => sum + Number(item.totalAmount || 0),
    0
  );

  const totalInvoices = spending.reduce(
    (sum, item) => sum + Number(item.totalInvoices || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-100">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-xl mb-4"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          <div>
            <h1 className="text-3xl font-bold">
              Project Spending & Pending Challan Surveillance
            </h1>
            <p className="text-gray-500 mt-2">
              Track how much amount is spent on each project and monitor challans where material is not fully delivered.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-6">
          <div className="bg-white rounded-3xl p-6 shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Total Project Spend</p>
                <h2 className="text-3xl font-bold mt-2">
                  ₹ {formatAmount(totalSpend)}
                </h2>
              </div>
              <IndianRupee className="text-green-600" size={38} />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Total Invoices</p>
                <h2 className="text-3xl font-bold mt-2">{totalInvoices}</h2>
              </div>
              <Receipt className="text-blue-600" size={38} />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Pending Challans</p>
                <h2 className="text-3xl font-bold mt-2">
                  {pendingChallans.length}
                </h2>
              </div>
              <FileWarning className="text-red-600" size={38} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">
            Project Wise Spending
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-left">Project Site</th>
                  <th className="p-4 text-left">Total Spend</th>
                  <th className="p-4 text-left">Total Invoices</th>
                </tr>
              </thead>

              <tbody>
                {spending.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-5 text-center text-gray-500">
                      No spending data found
                    </td>
                  </tr>
                ) : (
                  spending.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">
                        {item._id || "Unknown Project"}
                      </td>
                      <td className="p-4 font-bold text-green-700">
                        ₹ {formatAmount(item.totalAmount)}
                      </td>
                      <td className="p-4">{item.totalInvoices}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">
            Pending Challan Filter
          </h2>

          <div className="grid md:grid-cols-5 gap-4">
            <input
              type="text"
              name="projectSite"
              placeholder="Project Site"
              value={filters.projectSite}
              onChange={handleFilterChange}
              className="border rounded-xl px-4 py-3"
            />

            <input
              type="text"
              name="vendorName"
              placeholder="Vendor Name"
              value={filters.vendorName}
              onChange={handleFilterChange}
              className="border rounded-xl px-4 py-3"
            />

            <input
              type="text"
              name="challanNumber"
              placeholder="Challan Number"
              value={filters.challanNumber}
              onChange={handleFilterChange}
              className="border rounded-xl px-4 py-3"
            />

            <button
              onClick={applyFilters}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl px-4 py-3"
            >
              <Search size={18} />
              Search
            </button>

            <button
              onClick={resetFilters}
              className="flex items-center justify-center gap-2 bg-gray-600 text-white rounded-xl px-4 py-3"
            >
              <RotateCcw size={18} />
              Reset
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-red-600">
              Pending Challan Surveillance
            </h2>
            <p className="text-gray-500 mt-1">
              These challans are created but material is still pending, partial, or not delivered.
            </p>
          </div>

          {loading ? (
            <div className="p-10 flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={36} />
              <p className="text-gray-500 mt-3">Loading pending challans...</p>
            </div>
          ) : pendingChallans.length === 0 ? (
            <div className="p-8 text-center text-lg font-medium">
              No pending challans found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-red-50">
                  <tr>
                    <th className="p-4 text-left">Challan No.</th>
                    <th className="p-4 text-left">Type</th>
                    <th className="p-4 text-left">Invoice No.</th>
                    <th className="p-4 text-left">Vendor</th>
                    <th className="p-4 text-left">Project</th>
                    <th className="p-4 text-left">Qty Sent</th>
                    <th className="p-4 text-left">Qty Received</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {pendingChallans.map((item) => (
                    <tr key={item._id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">
                        {item.challanNumber || "-"}
                      </td>
                      <td className="p-4">{item.typeOfChallan || "-"}</td>
                      <td className="p-4">{item.invoiceNumber}</td>
                      <td className="p-4">{item.vendorName}</td>
                      <td className="p-4">{item.projectSite}</td>
                      <td className="p-4">{item.quantitySent || 0}</td>
                      <td className="p-4">{item.quantityReceived || 0}</td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                          {item.deliveryStatus || "Pending"}
                        </span>
                      </td>
                      <td className="p-4 font-semibold">
                        ₹ {formatAmount(item.invoiceAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}