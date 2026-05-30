import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Eye,
  Pencil,
  Plus,
  Search,
  FileText,
  Loader2,
  RefreshCcw,
  PackageCheck,
  Clock3,
  CheckCircle2,
  XCircle,
  IndianRupee,
} from "lucide-react";
import ChallanModal from "./ChallanModal";
import BASE_URL from "../../config/api";

const API_URL = `${BASE_URL}/challan`;

export default function ChallanManagement() {
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("All Documents");
  const [approvalFilter, setApprovalFilter] = useState("All Approval");
  const [stockFilter, setStockFilter] = useState("All Stock");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedChallan, setSelectedChallan] = useState(null);

  const fetchChallans = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/all`);
      setChallans(res.data.data || []);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to load challans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, []);

  const openAddModal = () => {
    setSelectedChallan(null);
    setModalMode("add");
    setModalOpen(true);
  };

  const openViewModal = (challan) => {
    setSelectedChallan(challan);
    setModalMode("view");
    setModalOpen(true);
  };

  const openEditModal = (challan) => {
    setSelectedChallan(challan);
    setModalMode("edit");
    setModalOpen(true);
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN");
  };

  const getProjectName = (item) => {
    return (
      item.projectName ||
      item.projectRef?.projectName ||
      item.projectRef?.name ||
      item.toSiteRef?.projectName ||
      item.toSiteRef?.name ||
      item.fromSiteRef?.projectName ||
      item.fromSiteRef?.name ||
      "-"
    );
  };

  const getFromText = (item) => {
    if (item.sourceType === "MAIN_STORE") {
      return item.fromMainStoreRef?.storeName || "Main Store";
    }
    if (item.sourceType === "SITE_STORE") {
      return item.fromSiteRef?.projectName || item.fromSiteRef?.name || "Site Store";
    }
    if (item.sourceType === "VENDOR") {
      return item.vendorName || item.vendorRef?.partyName || "Vendor";
    }
    return item.sourceType || "-";
  };

  const getToText = (item) => {
    if (item.destinationType === "MAIN_STORE") {
      return item.toMainStoreRef?.storeName || "Main Store";
    }
    if (item.destinationType === "SITE_STORE") {
      return item.toSiteRef?.projectName || item.toSiteRef?.name || "Site Store";
    }
    if (item.destinationType === "VENDOR") {
      return item.vendorName || item.vendorRef?.partyName || "Vendor";
    }
    return item.destinationType || "-";
  };

  const filteredChallans = useMemo(() => {
    const keyword = search.toLowerCase();

    return challans.filter((item) => {
      const text = [
        item.documentNumber,
        item.documentType,
        item.vendorName,
        getProjectName(item),
        getFromText(item),
        getToText(item),
        item.approvalStatus,
        item.stockStatus,
      ]
        .join(" ")
        .toLowerCase();

      const matchSearch = text.includes(keyword);

      const matchDocument =
        documentTypeFilter === "All Documents" ||
        item.documentType === documentTypeFilter;

      const matchApproval =
        approvalFilter === "All Approval" ||
        item.approvalStatus === approvalFilter;

      const matchStock =
        stockFilter === "All Stock" || item.stockStatus === stockFilter;

      return matchSearch && matchDocument && matchApproval && matchStock;
    });
  }, [challans, search, documentTypeFilter, approvalFilter, stockFilter]);

  const stats = useMemo(() => {
    return {
      total: challans.length,
      pending: challans.filter(
        (c) => c.approvalStatus === "PENDING_SITE_APPROVAL"
      ).length,
      approved: challans.filter((c) => c.approvalStatus === "APPROVED_BY_SITE")
        .length,
      rejected: challans.filter((c) => c.approvalStatus === "REJECTED_BY_SITE")
        .length,
      amount: challans.reduce(
        (sum, item) => sum + Number(item.totalAmount || 0),
        0
      ),
    };
  }, [challans]);

  const getApprovalClass = (status) => {
    switch (status) {
      case "APPROVED_BY_SITE":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
      case "PENDING_SITE_APPROVAL":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case "REJECTED_BY_SITE":
        return "bg-red-500/15 text-red-300 border-red-500/30";
      case "CANCELLED":
        return "bg-slate-500/15 text-slate-300 border-slate-500/30";
      default:
        return "bg-slate-500/15 text-slate-300 border-slate-500/30";
    }
  };

  const getStockClass = (status) => {
    switch (status) {
      case "UPDATED":
        return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
      case "RESERVED":
        return "bg-blue-500/15 text-blue-300 border-blue-500/30";
      case "RELEASED":
        return "bg-purple-500/15 text-purple-300 border-purple-500/30";
      case "FAILED":
        return "bg-red-500/15 text-red-300 border-red-500/30";
      default:
        return "bg-slate-500/15 text-slate-300 border-slate-500/30";
    }
  };

  const StatCard = ({ title, value, icon: Icon, tone }) => (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <h2 className={`mt-2 text-2xl font-bold ${tone}`}>{value}</h2>
        </div>
        <div className="rounded-2xl bg-slate-800 p-3">
          <Icon size={22} className={tone} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5 shadow-xl shadow-slate-950/40 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                <PackageCheck size={14} />
                Digital Challan Control
              </div>

              <h1 className="mt-3 text-2xl font-bold text-white md:text-3xl">
                Challan Management
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-slate-400">
                Manage DC, DDC, LPN, ISTN, MRN, MRS and CN with approval-based
                stock control for main store and site store.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={fetchChallans}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                <RefreshCcw size={17} />
                Refresh
              </button>

              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
              >
                <Plus size={18} />
                Create Challan
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <StatCard
            title="Total Documents"
            value={stats.total}
            icon={FileText}
            tone="text-white"
          />
          <StatCard
            title="Pending Approval"
            value={stats.pending}
            icon={Clock3}
            tone="text-amber-300"
          />
          <StatCard
            title="Approved"
            value={stats.approved}
            icon={CheckCircle2}
            tone="text-emerald-300"
          />
          <StatCard
            title="Rejected"
            value={stats.rejected}
            icon={XCircle}
            tone="text-red-300"
          />
          <StatCard
            title="Material Value"
            value={`₹${stats.amount.toLocaleString("en-IN")}`}
            icon={IndianRupee}
            tone="text-cyan-300"
          />
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/30 md:p-6">
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                placeholder="Search document, project, vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
              />
            </div>

            <select
              value={documentTypeFilter}
              onChange={(e) => setDocumentTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
            >
              <option>All Documents</option>
              <option>DC</option>
              <option>DDC</option>
              <option>LPN</option>
              <option>ISTN</option>
              <option>MRN</option>
              <option>MRS</option>
              <option>CN</option>
            </select>

            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
            >
              <option>All Approval</option>
              <option>PENDING_SITE_APPROVAL</option>
              <option>APPROVED_BY_SITE</option>
              <option>REJECTED_BY_SITE</option>
              <option>CANCELLED</option>
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
            >
              <option>All Stock</option>
              <option>NOT_APPLIED</option>
              <option>RESERVED</option>
              <option>UPDATED</option>
              <option>RELEASED</option>
              <option>FAILED</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-sm">
                <thead className="bg-slate-950 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4 text-left">Document No.</th>
                    <th className="px-5 py-4 text-left">Type</th>
                    <th className="px-5 py-4 text-left">Project / Site</th>
                    <th className="px-5 py-4 text-left">From</th>
                    <th className="px-5 py-4 text-left">To</th>
                    <th className="px-5 py-4 text-left">Date</th>
                    <th className="px-5 py-4 text-left">Items</th>
                    <th className="px-5 py-4 text-left">Amount</th>
                    <th className="px-5 py-4 text-left">Approval</th>
                    <th className="px-5 py-4 text-left">Stock</th>
                    <th className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan="11" className="py-14 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="animate-spin" size={18} />
                          Loading challans...
                        </div>
                      </td>
                    </tr>
                  ) : filteredChallans.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="py-14 text-center text-slate-400">
                        No challans found
                      </td>
                    </tr>
                  ) : (
                    filteredChallans.map((item) => (
                      <tr
                        key={item._id}
                        className="bg-slate-900/40 transition hover:bg-slate-800/70"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">
                            {item.documentNumber || "-"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {item.stockImpact || "-"}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-300">
                            {item.documentType || "-"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-300">
                          {getProjectName(item)}
                        </td>

                        <td className="px-5 py-4 text-slate-300">
                          {getFromText(item)}
                        </td>

                        <td className="px-5 py-4 text-slate-300">
                          {getToText(item)}
                        </td>

                        <td className="px-5 py-4 text-slate-400">
                          {formatDate(item.documentDate)}
                        </td>

                        <td className="px-5 py-4 text-slate-300">
                          {item.items?.length || 0}
                        </td>

                        <td className="px-5 py-4 font-semibold text-white">
                          ₹{Number(item.totalAmount || 0).toLocaleString("en-IN")}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getApprovalClass(
                              item.approvalStatus
                            )}`}
                          >
                            {item.approvalStatus || "PENDING"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStockClass(
                              item.stockStatus
                            )}`}
                          >
                            {item.stockStatus || "NOT_APPLIED"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openViewModal(item)}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-700 hover:text-white"
                              title="View"
                            >
                              <Eye size={18} />
                            </button>

                            <button
                              onClick={() => openEditModal(item)}
                              className="rounded-lg p-2 text-cyan-400 transition hover:bg-cyan-500/10 hover:text-cyan-300"
                              title="Edit"
                            >
                              <Pencil size={18} />
                            </button>

                            {item.challanFile && (
                              <a
                                href={item.challanFile}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg p-2 text-emerald-400 transition hover:bg-emerald-500/10 hover:text-emerald-300"
                                title="Open File"
                              >
                                <FileText size={18} />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <ChallanModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          mode={modalMode}
          challan={selectedChallan}
          refreshChallans={fetchChallans}
        />
      )}
    </div>
  );
}