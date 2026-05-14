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
} from "lucide-react";
import ChallanModal from "./ChallanModal";
import BASE_URL from "../../config/api";


const API_URL = `${BASE_URL}/challan`;

export default function ChallanManagement() {
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState("All Sites");
  const [statusFilter, setStatusFilter] = useState("All Status");

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
    console.log("Opening add modal");
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

  const filteredChallans = useMemo(() => {
    return challans.filter((item) => {
      const keyword = search.toLowerCase();

      const matchSearch =
        item.challanNumber?.toLowerCase().includes(keyword) ||
        item.vendorName?.toLowerCase().includes(keyword) ||
        item.site?.toLowerCase().includes(keyword);

      const matchSite = siteFilter === "All Sites" || item.site === siteFilter;

      const matchStatus =
        statusFilter === "All Status" || item.deliveryStatus === statusFilter;

      return matchSearch && matchSite && matchStatus;
    });
  }, [challans, search, siteFilter, statusFilter]);

  const uniqueSites = useMemo(() => {
    return ["All Sites", ...new Set(challans.map((item) => item.site).filter(Boolean))];
  }, [challans]);

  const getStatusClass = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-700";
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      case "In Transit":
        return "bg-blue-100 text-blue-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const totalAmount = challans.reduce(
    (sum, item) => sum + Number(item.totalAmount || 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Challan Management
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage delivery challans, vendor dispatches, item details and document flow.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={fetchChallans}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <RefreshCcw size={17} />
                Refresh
              </button>

              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              >
                <Plus size={18} />
                Create Challan
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-sm text-slate-500">Total Challans</p>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              {challans.length}
            </h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-sm text-slate-500">Delivered</p>
            <h2 className="text-2xl font-bold text-green-600 mt-1">
              {challans.filter((c) => c.deliveryStatus === "Delivered").length}
            </h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-sm text-slate-500">Pending</p>
            <h2 className="text-2xl font-bold text-yellow-600 mt-1">
              {challans.filter((c) => c.deliveryStatus === "Pending").length}
            </h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-sm text-slate-500">Total Amount</p>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              ₹{totalAmount.toLocaleString("en-IN")}
            </h2>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search challan, vendor, site..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-slate-300 rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>

            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100"
            >
              {uniqueSites.map((site, index) => (
                <option key={index} value={site}>
                  {site}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option>All Status</option>
              <option>Pending</option>
              <option>In Transit</option>
              <option>Delivered</option>
              <option>Cancelled</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="text-left px-5 py-4">Challan No.</th>
                  <th className="text-left px-5 py-4">Site</th>
                  <th className="text-left px-5 py-4">Vendor</th>
                  <th className="text-left px-5 py-4">Date</th>
                  <th className="text-left px-5 py-4">Items</th>
                  <th className="text-left px-5 py-4">Amount</th>
                  <th className="text-left px-5 py-4">Status</th>
                  <th className="text-center px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-500">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="animate-spin" size={18} />
                        Loading challans...
                      </div>
                    </td>
                  </tr>
                ) : filteredChallans.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-500">
                      No challans found
                    </td>
                  </tr>
                ) : (
                  filteredChallans.map((item) => (
                    <tr key={item._id} className="border-t hover:bg-slate-50">
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {item.challanNumber || "-"}
                      </td>

                      <td className="px-5 py-4">{item.site || "-"}</td>
                      <td className="px-5 py-4">{item.vendorName || "-"}</td>

                      <td className="px-5 py-4">
                        {item.dispatchDate
                          ? new Date(item.dispatchDate).toLocaleDateString("en-IN")
                          : "-"}
                      </td>

                      <td className="px-5 py-4">
                        {item.items?.length || item.quantity || 0}
                      </td>

                      <td className="px-5 py-4 font-medium">
                        ₹{Number(item.totalAmount || 0).toLocaleString("en-IN")}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                            item.deliveryStatus
                          )}`}
                        >
                          {item.deliveryStatus || "Pending"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => openViewModal(item)}
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            title="View"
                          >
                            <Eye size={18} />
                          </button>

                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            title="Edit"
                          >
                            <Pencil size={18} />
                          </button>

                          {item.challanFile && (
                            <a
                              href={item.challanFile}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-lg text-green-600 hover:text-green-800 hover:bg-green-50"
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