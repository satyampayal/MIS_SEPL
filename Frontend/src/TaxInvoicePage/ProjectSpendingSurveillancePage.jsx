// src/pages/TaxInvoice/ProjectSpendingSurveillancePage.jsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  IndianRupee,
  FileWarning,
  Receipt,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import BASE_URL from "../../config/api";

export default function ProjectSpendingSurveillancePage() {
  const navigate = useNavigate();
  const pendingSectionRef = useRef(null);

  const [spending, setSpending] = useState([]);
  const [pendingChallans, setPendingChallans] = useState([]);
  const [pendingProjects, setPendingProjects] = useState([]);
  const [vendorSpending, setVendorSpending] = useState([]);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  const [showVendorSpending, setShowVendorSpending] = useState(false);

  const [vendorPage, setVendorPage] = useState(1);
  const [vendorLimit, setVendorLimit] = useState(10);

  const [pendingPage, setPendingPage] = useState(1);
  const [pendingLimit, setPendingLimit] = useState(10);

  const [filters, setFilters] = useState({
    projectSite: "",
    vendorName: "",
    challanNumber: "",
  });

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
    "bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/10";

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
        { headers: authHeaders }
      );

      const data = await res.json();

      if (data.success) {
        const pendingData = data.data || [];

        setPendingChallans(pendingData);
        setPendingPage(1);

        const delivered = pendingData.filter(
          (item) => item.deliveryStatus === "Delivered"
        ).length;

        const partial = pendingData.filter(
          (item) => item.deliveryStatus === "Partial"
        ).length;

        const pending = pendingData.filter(
          (item) =>
            item.deliveryStatus === "Pending" || item.deliveryStatus === ""
        ).length;

        const uniqueVendors = new Set(
          pendingData.map((item) => item.vendorName).filter(Boolean)
        );

        setProjectStats({
          delivered,
          partial,
          pending,
          totalVendors: uniqueVendors.size,
        });

        if (!filters.projectSite) {
          const uniqueProjects = [
            ...new Set(
              pendingData.map((item) => item.projectSite).filter(Boolean)
            ),
          ];

          setPendingProjects(uniqueProjects);
        }
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

  const loadPage = async () => {
    try {
      setPageLoading(true);
      await Promise.all([
        fetchProjectSpending(),
        fetchPendingChallans(),
        fetchVendorSpending(),
      ]);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
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

  const vendorTotalPages = Math.ceil(vendorSpending.length / vendorLimit) || 1;

  const paginatedVendorSpending = useMemo(() => {
    const start = (vendorPage - 1) * vendorLimit;
    return vendorSpending.slice(start, start + vendorLimit);
  }, [vendorSpending, vendorPage, vendorLimit]);

  const pendingTotalPages =
    Math.ceil(pendingChallans.length / pendingLimit) || 1;

  const paginatedPendingChallans = useMemo(() => {
    const start = (pendingPage - 1) * pendingLimit;
    return pendingChallans.slice(start, start + pendingLimit);
  }, [pendingChallans, pendingPage, pendingLimit]);

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 shadow-xl shadow-slate-950/40">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 rounded-xl px-4 py-2 text-slate-300 hover:bg-slate-800"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          <div>
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              Project Spending & Pending Challan Surveillance
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Track project spending and monitor challans where material is pending,
              partial, or not delivered.
            </p>
          </div>
        </div>

        {pageLoading ? (
          <>
            <SummarySkeleton />
            <SectionSkeleton />
            <SectionSkeleton />
          </>
        ) : (
          <>
            <div className="mb-6 grid gap-5 md:grid-cols-5">
              <SummaryCard
                title="Total Project Spend"
                value={`₹ ${formatAmount(totalSpend)}`}
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
                className="rounded-3xl border border-red-500/30 bg-slate-900 p-6 text-left shadow transition hover:border-red-400 hover:bg-red-500/10"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500">Pending Challans</p>
                    <h2 className="mt-2 text-3xl font-bold text-red-400">
                      {pendingChallans.length}
                    </h2>
                    <p className="mt-2 text-xs text-slate-500">
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

            <DarkSection
              title="Vendor Wise Spending"
              rightContent={
                <button
                  onClick={() => setShowVendorSpending((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20"
                >
                  {showVendorSpending ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showVendorSpending ? "Hide" : "Show"}
                </button>
              }
            >
              {!showVendorSpending ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center text-slate-400">
                To see vendor wise spending click on show Btn .
                </div>
              ) : (
                <>
                  <DarkTable
                    headers={["Vendor Name", "Total Spend", "Invoice Count"]}
                    empty={vendorSpending.length === 0}
                    emptyText="No vendor spending data found"
                  >
                    {paginatedVendorSpending.map((item, index) => (
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
                        <td className="p-4 text-slate-300">
                          {item.totalInvoices}
                        </td>
                      </tr>
                    ))}
                  </DarkTable>

                  <PaginationBar
                    page={vendorPage}
                    totalPages={vendorTotalPages}
                    totalRecords={vendorSpending.length}
                    limit={vendorLimit}
                    setLimit={setVendorLimit}
                    setPage={setVendorPage}
                    options={[5, 10, 20, 50]}
                  />
                </>
              )}
            </DarkSection>

            <DarkSection title="Project Wise Spending">
              {spending.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center text-slate-400">
                  No spending data found
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {spending.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-5 transition hover:border-emerald-500/40 hover:bg-slate-900"
                    >
                      <p className="text-sm text-slate-500">Project Site</p>
                      <h3 className="mt-1 line-clamp-2 font-semibold text-white">
                        {item._id || "Unknown Project"}
                      </h3>

                      <p className="mt-4 text-2xl font-bold text-emerald-400">
                        ₹ {formatAmount(item.totalAmount)}
                      </p>

                      <p className="mt-2 text-sm text-slate-400">
                        {item.totalInvoices} Invoices
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </DarkSection>

            <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">
                Pending Challan Filter
              </h2>

              <div className="grid gap-4 md:grid-cols-5">
                <select
                  name="projectSite"
                  value={filters.projectSite}
                  onChange={handleFilterChange}
                  className={inputClass}
                >
                  <option value="">All Pending Projects</option>
                  {pendingProjects.map((project) => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </select>

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
                  className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 font-bold text-slate-950 hover:bg-cyan-400"
                >
                  <Search size={18} />
                  Search
                </button>

                <button
                  onClick={resetFilters}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-700 px-4 py-3 text-white hover:bg-slate-600"
                >
                  <RotateCcw size={18} />
                  Reset
                </button>
              </div>
            </div>

            <div
              ref={pendingSectionRef}
              className="overflow-hidden rounded-3xl border border-red-500/20 bg-slate-900 scroll-mt-6"
            >
              <div className="border-b border-slate-800 bg-red-500/5 p-6">
                <h2 className="text-xl font-semibold text-red-400">
                  Pending Challan Surveillance
                </h2>
                <p className="mt-1 text-slate-400">
                  These challans are created but material is still pending, partial,
                  or not delivered.
                </p>
              </div>

              {loading ? (
                <TableSkeleton rows={pendingLimit} cols={9} />
              ) : pendingChallans.length === 0 ? (
                <div className="p-8 text-center text-lg font-medium text-slate-400">
                  No pending challans found
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-800 bg-slate-950">
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
                        {paginatedPendingChallans.map((item) => (
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

                  <PaginationBar
                    page={pendingPage}
                    totalPages={pendingTotalPages}
                    totalRecords={pendingChallans.length}
                    limit={pendingLimit}
                    setLimit={setPendingLimit}
                    setPage={setPendingPage}
                    options={[10, 20, 50, 100]}
                  />
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon, valueClass = "text-white" }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500">{title}</p>
          <h2 className={`mt-2 text-3xl font-bold ${valueClass}`}>{value}</h2>
        </div>
        {icon}
      </div>
    </div>
  );
}

function DarkSection({ title, children, rightContent }) {
  return (
    <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {rightContent}
      </div>
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

function PaginationBar({
  page,
  totalPages,
  totalRecords,
  limit,
  setLimit,
  setPage,
  options,
}) {
  const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-800 px-4 py-4 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-slate-400">
        Showing <span className="font-semibold text-white">{start}</span> to{" "}
        <span className="font-semibold text-white">{end}</span> of{" "}
        <span className="font-semibold text-white">{totalRecords}</span>
      </p>

      <div className="flex items-center gap-2">
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option} / page
            </option>
          ))}
        </select>

        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft size={16} />
          Prev
        </button>

        <span className="text-sm text-slate-300">
          {page} / {totalPages}
        </span>

        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="whitespace-nowrap p-4 text-left font-semibold text-slate-300">
      {children}
    </th>
  );
}

function StatusBadge({ status }) {
  const currentStatus = status?.toLowerCase();

  if (currentStatus === "partial") {
    return (
      <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
        Partial
      </span>
    );
  }

  if (currentStatus === "delivered") {
    return (
      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
        Delivered
      </span>
    );
  }

  return (
    <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
      {status || "Pending"}
    </span>
  );
}

function SummarySkeleton() {
  return (
    <div className="mb-6 grid gap-5 md:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-36 animate-pulse rounded-3xl border border-slate-800 bg-slate-900"
        >
          <div className="p-6">
            <div className="h-4 w-28 rounded bg-slate-800" />
            <div className="mt-5 h-8 w-20 rounded bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-5 h-6 w-52 animate-pulse rounded bg-slate-800" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl bg-slate-800"
          />
        ))}
      </div>
    </div>
  );
}

function TableSkeleton({ rows = 10, cols = 9 }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-800 bg-slate-950">
          <tr>
            {Array.from({ length: cols }).map((_, index) => (
              <th key={index} className="p-4">
                <div className="h-4 w-24 animate-pulse rounded bg-slate-800" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-slate-800">
              {Array.from({ length: cols }).map((_, colIndex) => (
                <td key={colIndex} className="p-4">
                  <div className="h-4 w-28 animate-pulse rounded bg-slate-800" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}