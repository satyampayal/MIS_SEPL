// src/pages/TaxInvoice/ProjectSpendingSurveillancePage.jsx

import React, { useEffect, useRef, useState } from "react";
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
  const pendingSectionRef = useRef(null);

  const [spending, setSpending] = useState([]);
  const [pendingChallans, setPendingChallans] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    projectSite: "",
    vendorName: "",
    challanNumber: "",
  });

  const [vendorSpending, setVendorSpending] = useState([]);
  const [projectStats, setProjectStats] = useState({
    delivered: 0,
    partial: 0,
    pending: 0,
    totalVendors: 0,
  });

  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const inputClass =
    "bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400";

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    });
  };

  const scrollToPendingSection = () => {
    pendingSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
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

  const fetchVendorSpending = async () => {
    try {
      const res = await fetch(`${BASE_URL}/tax-invoice/vendor-wise-spending`, {
        headers: authHeaders,
      });

      const data = await res.json();

      if (data.success) {
        setVendorSpending(data.data || []);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to load vendor spending");
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
        const pendingData = data.data || [];

        setPendingChallans(pendingData);

        const delivered = pendingData.filter(
          (item) => item.deliveryStatus === "Delivered"
        ).length;

        const partial = pendingData.filter(
          (item) => item.deliveryStatus === "Partial"
        ).length;

        const pending = pendingData.filter(
          (item) => item.deliveryStatus === "Pending" || item.deliveryStatus === ""
        ).length;

        const uniqueVendors = new Set(pendingData.map((item) => item.vendorName));

        setProjectStats({
          delivered,
          partial,
          pending,
          totalVendors: uniqueVendors.size,
        });
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
    fetchVendorSpending();
  }, []);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const applyFilters = () => {
    fetchPendingChallans();
    setTimeout(scrollToPendingSection, 300);
  };

  const resetFilters = () => {
    setFilters({
      projectSite: "",
      vendorName: "",
      challanNumber: "",
    });

    setTimeout(() => {
      fetchPendingChallans();
      scrollToPendingSection();
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-6 shadow-xl">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 rounded-xl mb-4 text-slate-300"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          <div>
            <h1 className="text-3xl font-bold text-white">
              Project Spending & Pending Challan Surveillance
            </h1>
            <p className="text-slate-400 mt-2">
              Track project spending and monitor challans where material is pending, partial, or not delivered.
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-5 gap-5 mb-6">
          <SummaryCard
            title="Total Project Spend"
            value={` ${formatAmount(totalSpend)}`}
            icon={<IndianRupee className="text-emerald-400" size={38} />}
          />

          <SummaryCard
            title="Total Invoices"
            value={totalInvoices}
            icon={<Receipt className="text-cyan-400" size={38} />}
          />

          <button
            type="button"
            onClick={scrollToPendingSection}
            className="text-left bg-slate-900 border border-red-500/30 rounded-3xl p-6 shadow hover:border-red-400 hover:bg-red-500/10 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500">Pending Challans</p>
                <h2 className="text-3xl font-bold mt-2 text-red-400">
                  {pendingChallans.length}
                </h2>
                <p className="text-xs text-slate-500 mt-2">
                  Click to jump to pending section
                </p>
              </div>
              <FileWarning className="text-red-400" size={38} />
            </div>
          </button>

          <SummaryCard
            title="Partial Challans"
            value={projectStats.partial}
            valueClass="text-amber-400"
            icon={<Receipt className="text-amber-400" size={38} />}
          />

          <SummaryCard
            title="Total Vendors"
            value={projectStats.totalVendors}
            valueClass="text-purple-400"
            icon={<Receipt className="text-purple-400" size={38} />}
          />
        </div>

        {/* Vendor Wise Spending */}
        <DarkSection title="Vendor Wise Spending">
          <DarkTable
            headers={["Vendor Name", "Total Spend", "Invoice Count"]}
            empty={vendorSpending.length === 0}
            emptyText="No vendor spending data found"
          >
            {vendorSpending.map((item, index) => (
              <tr
                key={index}
                className="border-b border-slate-800 hover:bg-slate-800/40"
              >
                <td className="p-4 font-medium text-white">
                  {item._id || "Unknown Vendor"}
                </td>
                <td className="p-4 font-bold text-cyan-400">
                  ₹ {formatAmount(item.totalAmount)}
                </td>
                <td className="p-4 text-slate-300">{item.totalInvoices}</td>
              </tr>
            ))}
          </DarkTable>
        </DarkSection>

        {/* Project Wise Spending */}
        <DarkSection title="Project Wise Spending">
          <DarkTable
            headers={["Project Site", "Total Spend", "Total Invoices"]}
            empty={spending.length === 0}
            emptyText="No spending data found"
          >
            {spending.map((item, index) => (
              <tr
                key={index}
                className="border-b border-slate-800 hover:bg-slate-800/40"
              >
                <td className="p-4 font-medium text-white">
                  {item._id || "Unknown Project"}
                </td>
                <td className="p-4 font-bold text-emerald-400">
                  ₹ {formatAmount(item.totalAmount)}
                </td>
                <td className="p-4 text-slate-300">{item.totalInvoices}</td>
              </tr>
            ))}
          </DarkTable>
        </DarkSection>

        {/* Filter */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white">
            Pending Challan Filter
          </h2>

          <div className="grid md:grid-cols-5 gap-4">
            <input
              type="text"
              name="projectSite"
              placeholder="Project Site"
              value={filters.projectSite}
              onChange={handleFilterChange}
              className={inputClass}
            />

            <input
              type="text"
              name="vendorName"
              placeholder="Vendor Name"
              value={filters.vendorName}
              onChange={handleFilterChange}
              className={inputClass}
            />

            <input
              type="text"
              name="challanNumber"
              placeholder="Challan Number"
              value={filters.challanNumber}
              onChange={handleFilterChange}
              className={inputClass}
            />

            <button
              onClick={applyFilters}
              className="flex items-center justify-center gap-2 bg-cyan-500 text-slate-950 font-bold rounded-xl px-4 py-3 hover:bg-cyan-400"
            >
              <Search size={18} />
              Search
            </button>

            <button
              onClick={resetFilters}
              className="flex items-center justify-center gap-2 bg-slate-700 text-white rounded-xl px-4 py-3 hover:bg-slate-600"
            >
              <RotateCcw size={18} />
              Reset
            </button>
          </div>
        </div>

        {/* Pending Section */}
        <div
          ref={pendingSectionRef}
          className="bg-slate-900 border border-red-500/20 rounded-3xl overflow-hidden scroll-mt-6"
        >
          <div className="p-6 border-b border-slate-800 bg-red-500/5">
            <h2 className="text-xl font-semibold text-red-400">
              Pending Challan Surveillance
            </h2>
            <p className="text-slate-400 mt-1">
              These challans are created but material is still pending, partial, or not delivered.
            </p>
          </div>

          {loading ? (
            <div className="p-10 flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-cyan-400" size={36} />
              <p className="text-slate-400 mt-3">Loading pending challans...</p>
            </div>
          ) : pendingChallans.length === 0 ? (
            <div className="p-8 text-center text-lg font-medium text-slate-400">
              No pending challans found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-950 border-b border-slate-800">
                  <tr>
                    <Th>Challan No.</Th>
                    <Th>Type</Th>
                    <Th>Invoice No.</Th>
                    <Th>Vendor</Th>
                    <Th>Project</Th>
                    <Th>Qty Sent</Th>
                    <Th>Qty Received</Th>
                    <Th>Status</Th>
                    <Th>Amount</Th>
                  </tr>
                </thead>

                <tbody>
                  {pendingChallans.map((item) => (
                     
                    <tr
                      key={item._id}
                      className="border-b border-slate-800 hover:bg-slate-800/40"
                    >
                      <td className="p-4 font-medium text-white">
                        {item.challanNumber || "-"}
                      </td>
                      <td className="p-4 text-slate-300">
                        {item.typeOfChallan || "-"}
                      </td>
                      <td className="p-4 text-slate-300">
                        {item.invoiceNumber}
                      </td>
                      <td className="p-4 text-slate-300">
                        {item.vendorName}
                      </td>
                      <td className="p-4 text-slate-300">
                        {item.projectSite}
                      </td>
                      <td className="p-4 text-slate-300">
                        {item.quantitySent || 0}
                      </td>
                      <td className="p-4 text-slate-300">
                        {item.quantityReceived || 0}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={item.deliveryStatus} />
                      </td>
                      <td className="p-4 font-semibold text-cyan-400">
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

function SummaryCard({ title, value, icon, valueClass = "text-white" }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500">{title}</p>
          <h2 className={`text-3xl font-bold mt-2 ${valueClass}`}>{value}</h2>
        </div>
        {icon}
      </div>
    </div>
  );
}

function DarkSection({ title, children }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-white">{title}</h2>
      {children}
    </div>
  );
}

function DarkTable({ headers, empty, emptyText, children }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800">
      <table className="w-full text-sm">
        <thead className="bg-slate-950">
          <tr>
            {headers.map((header) => (
              <Th key={header}>{header}</Th>
            ))}
          </tr>
        </thead>

        <tbody>
          {empty ? (
            <tr>
              <td
                colSpan={headers.length}
                className="p-5 text-center text-slate-500"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="p-4 text-left text-slate-300 font-semibold whitespace-nowrap">
      {children}
    </th>
  );
}

function StatusBadge({ status }) {
  const currentStatus = status?.toLowerCase();

  if (currentStatus === "partial") {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        Partial
      </span>
    );
  }

  if (currentStatus === "delivered") {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        Delivered
      </span>
    );
  }

  return (
    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
      {status || "Pending"}
    </span>
  );
}