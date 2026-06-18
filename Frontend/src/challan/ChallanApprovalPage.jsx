import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Clock3,
  PackageCheck,
  IndianRupee,
} from "lucide-react";
import BASE_URL from "../../config/api";

const API_URL = `${BASE_URL}/challan`;

export default function ChallanApprovalPage() {
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  const [search, setSearch] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("All");

  const [viewModal, setViewModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [correctionModal, setCorrectionModal] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [correctionReason, setCorrectionReason] = useState("");



  const authHeader = {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  };

  const fetchPendingChallans = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_URL}/all?approvalStatus=PENDING_SITE_APPROVAL`, authHeader
      );
      setChallans(res.data.data || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingChallans();
  }, []);

  const filteredChallans = useMemo(() => {
    const keyword = search.toLowerCase();

    return challans.filter((challan) => {
      const text = [
        challan.documentNumber,
        challan.documentType,
        challan.projectName,
        challan.vendorName,
        challan.toSiteRef?.projectName,
        challan.toSiteRef?.name,
        challan.fromSiteRef?.projectName,
        challan.fromSiteRef?.name,
        challan.fromMainStoreRef?.storeName,
        challan.toMainStoreRef?.storeName,
      ]
        .join(" ")
        .toLowerCase();

      const matchSearch = text.includes(keyword);
      const matchType =
        documentTypeFilter === "All" ||
        challan.documentType === documentTypeFilter;

      return matchSearch && matchType;
    });
  }, [challans, search, documentTypeFilter]);

  const stats = useMemo(() => {
    return {
      pending: challans.length,
      totalItems: challans.reduce(
        (sum, c) => sum + Number(c.items?.length || 0),
        0
      ),
      totalQty: challans.reduce(
        (sum, c) => sum + Number(c.totalQuantity || 0),
        0
      ),
      totalValue: challans.reduce(
        (sum, c) => sum + Number(c.totalAmount || 0),
        0
      ),
    };
  }, [challans]);

  const approveChallan = async (id) => {
    if (!window.confirm("Approve this challan and update stock?")) return;

    try {
      setActionLoading(id);
      await axios.put(`${API_URL}/approve/${id}`, {}, authHeader);
      toast.success("Challan approved and stock updated");
      fetchPendingChallans();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Approval failed");
    } finally {
      setActionLoading("");
    }
  };

  const rejectChallan = async () => {
    if (!rejectModal) return;

    try {
      setActionLoading(rejectModal._id);

      await axios.put(`${API_URL}/reject/${rejectModal._id}`, {
        rejectionReason: rejectionReason || "Rejected by site",
      }, authHeader

      );

      toast.success("Challan rejected and reserved stock released");
      setRejectModal(null);
      setRejectionReason("");
      fetchPendingChallans();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Reject failed");
    } finally {
      setActionLoading("");
    }
  };

  const getProjectName = (c) =>
    c.projectName ||
    c.toSiteRef?.projectName ||
    c.toSiteRef?.name ||
    c.fromSiteRef?.projectName ||
    c.fromSiteRef?.name ||
    "-";

  const getFromText = (c) => {
    if (c.sourceType === "MAIN_STORE") return c.fromMainStoreRef?.storeName || "Main Store";
    if (c.sourceType === "SITE_STORE") return c.fromSiteRef?.projectName || c.fromSiteRef?.name || "Site";
    if (c.sourceType === "VENDOR") return c.vendorName || "Vendor";
    return c.sourceType || "-";
  };

  const getToText = (c) => {
    if (c.destinationType === "MAIN_STORE") return c.toMainStoreRef?.storeName || "Main Store";
    if (c.destinationType === "SITE_STORE") return c.toSiteRef?.projectName || c.toSiteRef?.name || "Site";
    if (c.destinationType === "VENDOR") return c.vendorName || "Vendor";
    return c.destinationType || "-";
  };

  const openCorrectionModal = (challan) => {
    setSelectedChallan(challan);
    setCorrectionReason(
      challan?.correctionReason || ""
    );
    setCorrectionModal(true);
  };

  const closeCorrectionModal = () => {
    setSelectedChallan(null);
    setCorrectionReason("");
    setCorrectionModal(false);
  };

  const submitCorrectionRequest = async () => {
    try {
      if (!correctionReason.trim()) {
        return toast.error(
          "Please enter correction reason"
        );
      }
      await axios.put(
        `${API_URL}/request-correction/${selectedChallan._id}`,
        {
          correctionReason,
        },
        authHeader
      );

      toast.success(
        "Correction request sent successfully"
      );

      closeCorrectionModal();

      fetchPendingChallans();
    } catch (error) {
      // console.log(correctionReason)
      toast.error(
        error?.response?.data?.message ||
        "Failed to request correction"
      );
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
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                <ShieldCheck size={14} />
                Site Approval Control
              </div>

              <h1 className="mt-3 text-2xl font-bold text-white md:text-3xl">
                Challan Approval
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-slate-400">
                Approve or reject pending challans. Approval updates stock,
                rejection releases reserved stock.
              </p>
            </div>

            <button
              onClick={fetchPendingChallans}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <RefreshCcw size={17} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard
            title="Pending Approvals"
            value={stats.pending}
            icon={Clock3}
            tone="text-amber-300"
          />
          <StatCard
            title="Total Item Lines"
            value={stats.totalItems}
            icon={PackageCheck}
            tone="text-cyan-300"
          />
          <StatCard
            title="Total Quantity"
            value={stats.totalQty}
            icon={PackageCheck}
            tone="text-blue-300"
          />
          <StatCard
            title="Material Value"
            value={`₹${stats.totalValue.toLocaleString("en-IN")}`}
            icon={IndianRupee}
            tone="text-emerald-300"
          />
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search document, project, vendor..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={documentTypeFilter}
              onChange={(e) => setDocumentTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
            >
              <option>All</option>
              <option>DC</option>
              <option>DDC</option>
              <option>LPN</option>
              <option>ISTN</option>
              <option>MRN</option>
              <option>MRS</option>
              <option>CN</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-sm">
              <thead className="bg-slate-950 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4 text-left">Document</th>
                  <th className="px-5 py-4 text-left">Project/Site</th>
                  <th className="px-5 py-4 text-left">From</th>
                  <th className="px-5 py-4 text-left">To</th>
                  <th className="px-5 py-4 text-left">Date</th>
                  <th className="px-5 py-4 text-left">Items</th>
                  <th className="px-5 py-4 text-left">Amount</th>
                  <th className="px-5 py-4 text-left">Stock</th>
                  <th className="px-5 py-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="py-14 text-center text-slate-400">
                      <Loader2 className="mx-auto mb-2 animate-spin" />
                      Loading pending approvals...
                    </td>
                  </tr>
                ) : filteredChallans.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-14 text-center text-slate-400">
                      No pending challan approval found
                    </td>
                  </tr>
                ) : (
                  filteredChallans.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-800/60">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">
                          {c.documentNumber}
                        </div>
                        <div className="text-xs text-cyan-300">
                          {c.documentType} · {c.stockImpact}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {getProjectName(c)}
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {getFromText(c)}
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {getToText(c)}
                      </td>

                      <td className="px-5 py-4 text-slate-400">
                        {c.documentDate
                          ? new Date(c.documentDate).toLocaleDateString("en-IN")
                          : "-"}
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {c.items?.length || 0}
                      </td>

                      <td className="px-5 py-4 font-semibold text-emerald-300">
                        ₹{Number(c.totalAmount || 0).toLocaleString("en-IN")}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                          {c.stockStatus || "NOT_APPLIED"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => setViewModal(c)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white"
                            title="View"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => openCorrectionModal(c)}
                            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-300"
                          >
                            Request Correction
                          </button>

                          <button
                            onClick={() => approveChallan(c._id)}
                            disabled={actionLoading === c._id}
                            className="rounded-lg p-2 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
                            title="Approve"
                          >
                            {actionLoading === c._id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={18} />
                            )}
                          </button>

                          <button
                            onClick={() => setRejectModal(c)}
                            disabled={actionLoading === c._id}
                            className="rounded-lg p-2 text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
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

      {viewModal && (
        <ViewApprovalModal
          challan={viewModal}
          onClose={() => setViewModal(null)}
          getFromText={getFromText}
          getToText={getToText}
          getProjectName={getProjectName}
        />
      )}

      {rejectModal && (
        <RejectModal
          challan={rejectModal}
          rejectionReason={rejectionReason}
          setRejectionReason={setRejectionReason}
          onClose={() => {
            setRejectModal(null);
            setRejectionReason("");
          }}
          onReject={rejectChallan}
          loading={actionLoading === rejectModal._id}
        />
      )}

      {correctionModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-950">

            <div className="border-b border-slate-800 px-6 py-4">
              <h2 className="text-xl font-bold text-white">
                Request Correction
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Send challan back to creator for correction.
              </p>
            </div>

            <div className="p-6">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Correction Reason *
              </label>

              <textarea
                rows={5}
                value={correctionReason}
                onChange={(e) =>
                  setCorrectionReason(e.target.value)
                }
                placeholder="Example: Please remove cable item and update dispatch location."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">
              <button
                onClick={closeCorrectionModal}
                className="rounded-xl border border-slate-700 px-5 py-3 text-slate-300"
              >
                Cancel
              </button>

              <button
                onClick={submitCorrectionRequest}
                className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-slate-950"
              >
                Send Back For Correction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ViewApprovalModal({ challan, onClose, getFromText, getToText, getProjectName }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase text-cyan-300">
              Approval Detail
            </p>
            <h2 className="text-xl font-bold text-white">
              {challan.documentNumber}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-4">
          <Info label="Type" value={challan.documentType} />
          <Info label="Project" value={getProjectName(challan)} />
          <Info label="From" value={getFromText(challan)} />
          <Info label="To" value={getToText(challan)} />
          <Info label="Stock Status" value={challan.stockStatus} />
          <Info label="Approval" value={challan.approvalStatus} />
          <Info
            label="Date"
            value={
              challan.documentDate
                ? new Date(challan.documentDate).toLocaleDateString("en-IN")
                : "-"
            }
          />
          <Info
            label="Amount"
            value={`₹${Number(challan.totalAmount || 0).toLocaleString("en-IN")}`}
          />
        </div>

        <div className="px-6 pb-6">
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full min-w-[850px] text-sm">
              <thead className="bg-slate-900 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-3 text-left">Item</th>
                  <th className="p-3 text-left">Purpose</th>
                  <th className="p-3 text-left">Qty</th>
                  <th className="p-3 text-left">Unit</th>
                  <th className="p-3 text-left">Rate</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Returnable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {challan.items?.map((item, index) => (
                  <tr key={index}>
                    <td className="p-3 text-white">
                      {item.itemName}
                      <div className="text-xs text-cyan-300">
                        {item.itemCode}
                      </div>
                    </td>
                    <td className="p-3 text-slate-300">{item.itemPurpose}</td>
                    <td className="p-3 text-slate-300">{item.quantity}</td>
                    <td className="p-3 text-slate-300">{item.unit}</td>
                    <td className="p-3 text-slate-300">₹{item.rate}</td>
                    <td className="p-3 text-emerald-300">₹{item.amount}</td>
                    <td className="p-3 text-slate-300">
                      {item.isReturnable ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function RejectModal({
  challan,
  rejectionReason,
  setRejectionReason,
  onClose,
  onReject,
  loading,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
        <div className="border-b border-slate-800 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Reject Challan</h2>
          <p className="text-sm text-slate-400">{challan.documentNumber}</p>
        </div>

        <div className="p-6">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Rejection Reason
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
            placeholder="Write reason..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-red-500"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-5 py-3 text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            onClick={onReject}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-white">{value || "-"}</p>
    </div>
  );
}