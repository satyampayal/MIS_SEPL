import React, { useEffect, useState } from "react";
import {
  Search,
  RotateCcw,
  Package,
  ArrowLeft,
  Truck,
  IndianRupee,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../../config/api";
import toast from "react-hot-toast";
import { AuthContext } from "../Context/AuthContext";
import { useContext } from "react";
import UploadMaterialMovementExcelModal from "./UploadMaterialMovementExcelModal";
import ViewEditMaterialMovementModal from "./ViewEditMaterialMovementModal";

export default function MaterialMovementHistoryPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [summary, setSummary] = useState({
    totalQuantity: 0,
    totalAmount: 0,
    inCount: 0,
    outCount: 0,
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 20,
  });

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  // const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || localStorage.getItem("role");

  const canUpload = role === "Super Admin";
  const canAction = ["Super Admin", "Admin"].includes(role);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalMode, setModalMode] = useState("view");
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    itemName: "",
    projectName: "",
    vendorName: "",
    documentNo: "",
    invoiceNumber: "",
    inOut: "",
    fromDate: "",
    toDate: "",
  });

  const formatAmount = (amount) =>
    Number(amount || 0).toLocaleString("en-IN");

  const totalQty = records.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const totalAmount = records.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const fetchHistory = async () => {
    try {
      setLoading(true);

      const query = new URLSearchParams();
      query.append("page", pagination.currentPage);
      query.append("limit", pagination.limit);

      Object.entries(filters).forEach(([key, value]) => {
        if (value) query.append(key, value);
      });
      // toast.loading("fetch records")
      const res = await fetch(
        `${BASE_URL}/material-movement/history?${query.toString()}`
      );

      const data = await res.json();

      if (data.success) {
        setRecords(data.data || []);
        setSummary(data.summary || {});
        setPagination(data.pagination || pagination);

      } else {
        toast.error(data.message || "Failed to load history");
      }
    } catch (error) {
      console.log(error);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [pagination.currentPage, pagination.limit]);

  const handleChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      itemName: "",
      projectName: "",
      vendorName: "",
      documentNo: "",
      invoiceNumber: "",
      inOut: "",
      fromDate: "",
      toDate: "",
    });

    setTimeout(fetchHistory, 100);
  };

 const exportExcel = async () => {
  const loadingToast = toast.loading("Exporting Excel...");

  try {
    const query = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) query.append(key, value);
    });

    const token = localStorage.getItem("token");

    const res = await fetch(
      `${BASE_URL}/material-movement/export-excel?${query.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Export failed");
    }

    const blob = await res.blob();

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `MaterialMovementHistory-${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);

    toast.success("Excel exported successfully");
  } catch (error) {
    toast.error(error?.message || "Export failed");
  } finally {
    toast.dismiss(loadingToast);
  }
};
  const openView = (record) => {
    setSelectedRecord(record);
    setModalMode("view");
    setViewModalOpen(true);
  };

  const openEdit = (record) => {
    setSelectedRecord(record);
    setModalMode("edit");
    setViewModalOpen(true);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">

        <div className="bg-white rounded-3xl shadow p-6 mb-6 border">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mb-4 text-gray-600 hover:text-black"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <h1 className="text-3xl font-bold">Material Movement History</h1>
          <p className="text-gray-500 mt-2">
            Search item history across projects, vendors, challans and invoices.
          </p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={exportExcel}
              className="bg-green-600 text-white px-5 py-3 rounded-xl"
            >
              Export Excel
            </button>

            {canUpload && (
              <button
                onClick={() => setUploadModalOpen(true)}
                className="bg-purple-600 text-white px-5 py-3 rounded-xl"
              >
                Upload Bulk Excel
              </button>
            )}

            <button
              onClick={() => navigate("/material-movement/analytics")}
              className="bg-indigo-600 text-white px-5 py-3 rounded-xl"
            >
              View Reports
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-5 mb-6">
          <StatCard
            title="Total Records"
            value={pagination.totalRecords}
            icon={<Package size={30} />}
            color="blue"
          />

          <StatCard
            title="Total Quantity"
            value={summary.totalQuantity || 0}
            icon={<Truck size={30} />}
            color="orange"
          />

          <StatCard
            title="Total Amount"
            value={`₹ ${formatAmount(summary.totalAmount)}`}
            icon={<IndianRupee size={30} />}
            color="green"
          />

          <StatCard
            title="In Records"
            value={summary.inCount || 0}
            icon={<Package size={30} />}
            color="emerald"
          />

          <StatCard
            title="Out Records"
            value={summary.outCount || 0}
            icon={<Truck size={30} />}
            color="red"
          />
        </div>

        <div className="bg-white rounded-3xl shadow p-6 mb-6 border">
          <h2 className="text-xl font-semibold mb-4">Search Filters</h2>

          <div className="grid md:grid-cols-4 gap-4">
            <input
              name="itemName"
              placeholder="Search Item Name"
              value={filters.itemName}
              onChange={handleChange}
              className="border rounded-xl px-4 py-3"
            />

            <input
              name="projectName"
              placeholder="Project Name"
              value={filters.projectName}
              onChange={handleChange}
              className="border rounded-xl px-4 py-3"
            />

            <input
              name="vendorName"
              placeholder="Vendor Name"
              value={filters.vendorName}
              onChange={handleChange}
              className="border rounded-xl px-4 py-3"
            />

            <input
              name="documentNo"
              placeholder="Document / Challan No"
              value={filters.documentNo}
              onChange={handleChange}
              className="border rounded-xl px-4 py-3"
            />

            <input
              name="invoiceNumber"
              placeholder="Invoice Number"
              value={filters.invoiceNumber}
              onChange={handleChange}
              className="border rounded-xl px-4 py-3"
            />

            <select
              name="inOut"
              value={filters.inOut}
              onChange={handleChange}
              className="border rounded-xl px-4 py-3"
            >
              <option value="">In / Out</option>
              <option value="In">In</option>
              <option value="Out">Out</option>
            </select>

            <input
              type="date"
              name="fromDate"
              value={filters.fromDate}
              onChange={handleChange}
              className="border rounded-xl px-4 py-3"
            />

            <input
              type="date"
              name="toDate"
              value={filters.toDate}
              onChange={handleChange}
              className="border rounded-xl px-4 py-3"
            />

            <button
              onClick={fetchHistory}
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

        <div className="bg-white rounded-3xl shadow overflow-hidden border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Movement Records</h2>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-500">
              Loading material history...
            </div>
          ) : records.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              No material movement records found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4 text-left">Date</th>
                    <th className="p-4 text-left">Item</th>
                    <th className="p-4 text-left">Qty</th>
                    <th className="p-4 text-left">UOM</th>
                    <th className="p-4 text-left">Project</th>
                    <th className="p-4 text-left">Vendor</th>
                    <th className="p-4 text-left">Document</th>
                    <th className="p-4 text-left">Invoice</th>
                    <th className="p-4 text-left">In/Out</th>
                    <th className="p-4 text-left">Amount</th>
                    {canAction && <th className="p-4 text-left">Actions</th>}
                  </tr>
                </thead>

                <tbody>
                  {records.map((item) => (
                    <tr key={item._id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        {item.documentDate
                          ? new Date(item.documentDate).toLocaleDateString("en-IN")
                          : "-"}
                      </td>

                      <td className="p-4 font-medium">{item.itemName}</td>
                      <td className="p-4">{item.quantity}</td>
                      <td className="p-4">{item.uom || "-"}</td>
                      <td className="p-4">{item.projectName || "-"}</td>
                      <td className="p-4">{item.vendorName || "-"}</td>
                      <td className="p-4">{item.documentNo || "-"}</td>
                      <td className="p-4">{item.invoiceNumber || "-"}</td>

                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${item.inOut === "In"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}
                        >
                          {item.inOut || "-"}
                        </span>
                      </td>

                      <td className="p-4 font-semibold">
                        ₹ {formatAmount(item.amount)}
                      </td>

                      {canAction && (
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openView(item)}
                              className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700"
                            >
                              View
                            </button>

                            <button
                              onClick={() => openEdit(item)}
                              className="px-3 py-1 rounded-lg bg-green-50 text-green-700"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
      <div className="flex items-center justify-between p-4 border-t">
        <select
          value={pagination.limit}
          onChange={(e) => {
            setPagination((prev) => ({
              ...prev,
              limit: Number(e.target.value),
              currentPage: 1,
            }));
          }}
          className="border px-3 py-2 rounded-xl"
        >
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>

        <div className="flex items-center gap-3">
          <button
            disabled={pagination.currentPage === 1}
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                currentPage: prev.currentPage - 1,
              }))
            }
            className="px-4 py-2 border rounded-xl disabled:opacity-50"
          >
            Previous
          </button>

          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>

          <button
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                currentPage: prev.currentPage + 1,
              }))
            }
            className="px-4 py-2 border rounded-xl disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
      <UploadMaterialMovementExcelModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        refreshData={fetchHistory}
      />

      {/*  View, Edit  */}
      <ViewEditMaterialMovementModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        selectedRecord={selectedRecord}
        mode={modalMode}
        refreshData={fetchHistory}
      />
    </div>
  );
}



function StatCard({ title, value, icon, color = "blue", subtitle }) {
  const colorMap = {
    blue: "from-blue-500 to-blue-700",
    green: "from-green-500 to-green-700",
    orange: "from-orange-500 to-orange-700",
    red: "from-red-500 to-red-700",
    purple: "from-purple-500 to-purple-700",
    emerald: "from-emerald-500 to-emerald-700",
  };

  return (
    <div className={`rounded-3xl p-6 text-white shadow-lg bg-gradient-to-br ${colorMap[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/80 text-sm">{title}</p>
          <h2 className="text-3xl font-bold mt-2">{value}</h2>
          {subtitle && <p className="text-white/70 text-xs mt-2">{subtitle}</p>}
        </div>

        <div className="bg-white/20 p-3 rounded-2xl">
          {icon}
        </div>
      </div>
    </div>
  );
}