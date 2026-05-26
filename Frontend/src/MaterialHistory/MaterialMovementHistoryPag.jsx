import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Search,
  RotateCcw,
  Package,
  ArrowLeft,
  Truck,
  IndianRupee,
  Upload,
  BarChart3,
  Eye,
  Pencil,
  CalendarDays,
  FileText,
  Building2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../../config/api";
import toast from "react-hot-toast";
import { AuthContext } from "../Context/AuthContext";
import UploadMaterialMovementExcelModal from "./UploadMaterialMovementExcelModal";
import ViewEditMaterialMovementModal from "./ViewEditMaterialMovementModal";

const getProjectDirection = (typeOfTransit) => {
  const type = String(typeOfTransit || "").toUpperCase();

  if (["DDC", "DC", "LPN"].includes(type)) return "In";
  if (["MRS"].includes(type)) return "Out";

  return "";
};

const getDirectionStyle = (direction) => {
  if (direction === "In") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (direction === "Out") return "bg-red-500/10 text-red-400 border-red-500/20";
  return "bg-slate-500/10 text-slate-400 border-slate-700";
};

export default function MaterialMovementHistoryPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const role = user?.role || localStorage.getItem("role");
  const canUpload = role === "Super Admin";
  const canAction = ["Super Admin", "Admin"].includes(role);

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

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalMode, setModalMode] = useState("view");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  // Premium Features
   const canSwitchView = ["Super Admin", "Admin"].includes(role);

  const [viewMode, setViewMode] = useState("table");

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

  const formatAmount = (value) => {
    // if (!value) return "₹0";
    // return `₹${Number(value).toLocaleString("en-IN"),{
    //   maximumFractionDigits:0,
    // }}`;

    return Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    });
  };

  const formatNumber = (value) => {


    return Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    });
  };

  const derivedSummary = useMemo(() => {
    let projectIn = 0;
    let projectOut = 0;

    records.forEach((item) => {
      const direction = getProjectDirection(item.typeOfTransit);
      if (direction === "In") projectIn += 1;
      if (direction === "Out") projectOut += 1;
    });

    return { projectIn, projectOut };
  }, [records]);

  const fetchHistory = async () => {
    try {
      setLoading(true);

      const query = new URLSearchParams();
      query.append("page", pagination.currentPage);
      query.append("limit", pagination.limit);

      Object.entries(filters).forEach(([key, value]) => {
        if (value) query.append(key, value);
      });

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

  // Premium features
  //   const user = JSON.parse(localStorage.getItem("user")) || {};
  // const role = user?.role;

 

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mb-4 text-slate-400 hover:text-white"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <p className="text-sm text-blue-400 font-semibold">
                Material Ledger
              </p>
              <h1 className="text-2xl font-bold mt-1">
                Material Transaction History
              </h1>
              <p className="text-slate-400 mt-1 text-sm">
                Compact movement records across projects, vendors, challans and invoices.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportExcel}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm"
              >
                <FileText size={17} />
                Export Excel
              </button>

              {canUpload && (
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm"
                >
                  <Upload size={17} />
                  Upload Excel
                </button>
              )}

              <button
                onClick={() => navigate("/material-movement/analytics")}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm"
              >
                <BarChart3 size={17} />
                View Reports
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          <StatCard title="Records" value={pagination.totalRecords} icon={Package} />
          <StatCard title="Quantity" value={formatNumber(summary.totalQuantity || 0)} icon={Truck} />
          <StatCard title="Amount" value={`₹ ${formatNumber(summary.totalAmount)}`} icon={IndianRupee} />
          {/* <StatCard title="Project In" value={derivedSummary.projectIn} icon={Package} tone="emerald" />
          <StatCard title="Project Out" value={derivedSummary.projectOut} icon={Truck} tone="red" /> */}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5">
          <div className="grid md:grid-cols-4 xl:grid-cols-5 gap-3">
            <FilterInput name="itemName" placeholder="Item name" value={filters.itemName} onChange={handleChange} />
            <FilterInput name="projectName" placeholder="Project name" value={filters.projectName} onChange={handleChange} />
            <FilterInput name="vendorName" placeholder="Vendor name" value={filters.vendorName} onChange={handleChange} />
            <FilterInput name="documentNo" placeholder="Document / Challan no" value={filters.documentNo} onChange={handleChange} />
            <FilterInput name="invoiceNumber" placeholder="Invoice number" value={filters.invoiceNumber} onChange={handleChange} />

            {/* <select
              name="inOut"
              value={filters.inOut}
              onChange={handleChange}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Stored In / Out</option>
              <option value="In">In</option>
              <option value="Out">Out</option>
            </select> */}

            <FilterInput type="date" name="fromDate" value={filters.fromDate} onChange={handleChange} />
            <FilterInput type="date" name="toDate" value={filters.toDate} onChange={handleChange} />

            <button
              onClick={fetchHistory}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 rounded-xl px-4 py-2.5 text-sm"
            >
              <Search size={17} />
              Search
            </button>

            <button
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 rounded-xl px-4 py-2.5 text-sm"
            >
              <RotateCcw size={17} />
              Reset
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Movement Records</h2>
              <p className="text-xs text-slate-500">
                Showing compact cards instead of boring table rows.
              </p>
            </div>

            <select
              value={pagination.limit}
              onChange={(e) => {
                setPagination((prev) => ({
                  ...prev,
                  limit: Number(e.target.value),
                  currentPage: 1,
                }));
              }}
              className="bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-sm"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          {canSwitchView && (
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setViewMode("card")}
                className={`px-4 py-2 rounded-xl text-sm border ${viewMode === "card"
                    ? "bg-blue-600 text-white border-blue-500"
                    : "bg-slate-900 text-slate-400 border-slate-700 hover:text-white"
                  }`}
              >
                Card View
              </button>

              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 rounded-xl text-sm border ${viewMode === "table"
                    ? "bg-blue-600 text-white border-blue-500"
                    : "bg-slate-900 text-slate-400 border-slate-700 hover:text-white"
                  }`}
              >
                Table View
              </button>
            </div>
          )}

          {loading ? (
            <div className="p-10 text-center text-slate-400">
              Loading material history...
            </div>
          ) : records.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              No material movement records found
            </div>
          ) : (
            <div className="">

              
{
  viewMode === "card" ? (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 ">
      {records.map((item) => (
        <MovementCard
          key={item._id}
          item={item}
          canAction={canAction}
          onView={() => openView(item)}
          onEdit={() => openEdit(item)}
          formatAmount={formatAmount}
        />
      ))}
    </div>
  ) : (
    <div className="space-y-3">
      
    <ShowInTable
    records={records}
    canAction={canAction}
    openView={openView}
    openEdit={openEdit}
    formatAmount={formatAmount}
  />
    </div>
  )
}
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-5 bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-sm text-slate-400">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>

          <div className="flex items-center gap-3">
            <button
              disabled={pagination.currentPage === 1}
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  currentPage: prev.currentPage - 1,
                }))
              }
              className="px-4 py-2 border border-slate-700 rounded-xl disabled:opacity-40 hover:bg-slate-800"
            >
              Previous
            </button>

            <button
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  currentPage: prev.currentPage + 1,
                }))
              }
              className="px-4 py-2 border border-slate-700 rounded-xl disabled:opacity-40 hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <UploadMaterialMovementExcelModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        refreshData={fetchHistory}
      />

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

function MovementCard({ item, canAction, onView, onEdit, formatAmount }) {
  const projectDirection = getProjectDirection(item.typeOfTransit);
  const directionClass = getDirectionStyle(projectDirection);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-blue-500 transition">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-sm leading-5 line-clamp-2">
            {item.itemName || "N/A"}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {item.documentName || item.documentNo || "No Document"}
          </p>
        </div>

        <span className={`text-[11px] px-2 py-1 rounded-full border ${directionClass}`}>
          Project {projectDirection || "-"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
        <Mini label="Qty" value={`${item.quantity || 0} ${item.uom || ""}`} />
        <Mini label="Amount" value={`₹ ${formatAmount(item.amount)}`} tone="text-emerald-400" />
        <Mini label="Transit" value={item.typeOfTransit || "-"} tone="text-blue-400" />
        {/* <Mini label="Stored I/O" value={item.inOut || "-"} /> */}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 text-xs">
        <Info icon={Building2} text={item.projectName || "-"} />
        <Info icon={Truck} text={item.vendorName || "-"} />
        <Info
          icon={CalendarDays}
          text={
            item.documentDate
              ? new Date(item.documentDate).toLocaleDateString("en-IN")
              : "-"
          }
        />
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={onView}
          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-600/15 text-blue-400 hover:bg-blue-600/25 px-3 py-2 rounded-lg text-xs"
        >
          <Eye size={14} />
          View
        </button>
      </div>

      {canAction && (
        <div className="flex gap-2 mt-4">
          {/* <button
            onClick={onView}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-600/15 text-blue-400 hover:bg-blue-600/25 px-3 py-2 rounded-lg text-xs"
          >
            <Eye size={14} />
            View
          </button> */}

          <button
            onClick={onEdit}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/25 px-3 py-2 rounded-lg text-xs"
          >
            <Pencil size={14} />
            Edit
          </button>
        </div>
      )}
    </div>
  );
}

function Mini({ label, value, tone = "text-slate-200" }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
      <p className="text-slate-500">{label}</p>
      <p className={`font-semibold mt-0.5 ${tone}`}>{value}</p>
    </div>
  );
}

function Info({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2 text-slate-400">
      <Icon size={14} className="text-slate-500" />
      <span className="truncate">{text}</span>
    </div>
  );
}

function FilterInput({ name, value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500"
    />
  );
}

function StatCard({ title, value, icon: Icon, tone = "blue" }) {
  const toneMap = {
    blue: "text-blue-400 bg-blue-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
    red: "text-red-400 bg-red-500/10",
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-slate-400 text-xs">{title}</p>
          <h2 className="text-lg font-bold mt-1">{value}</h2>
        </div>

        <div
          className={`h-9 w-9 rounded-lg flex items-center justify-center ${toneMap[tone] || toneMap.blue
            }`}
        >
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

//Show in Table 
function ShowInTable({
  records,
  canAction,
  openView,
  openEdit,
  formatAmount,
}) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-slate-900 text-slate-300">
            <tr>
              <th className="p-3 text-left">Item</th>
              <th className="p-3 text-left">Document</th>
              {/* <th className="p-3 text-left">Transit</th> */}
              {/* <th className="p-3 text-left">Direction</th> */}
              <th className="p-3 text-left">Project</th>
              <th className="p-3 text-left">Vendor</th>
              <th className="p-3 text-right">Qty</th>
              <th className="p-3 text-right">Rate</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="11" className="p-8 text-center text-slate-500">
                  No material movement found.
                </td>
              </tr>
            ) : (
              records.map((item) => {
                const projectDirection = getProjectDirection(item.typeOfTransit);
                const directionClass = getDirectionStyle(projectDirection);

                return (
                  <tr
                    key={item._id}
                    className="border-t border-slate-800 hover:bg-slate-900/70"
                  >
                    <td className="p-3 align-top">
                      <p className="font-medium text-white line-clamp-2">
                        {item.itemName || "N/A"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {item.storeItemCode || "-"}
                      </p>
                    </td>

                    <td className="p-3 align-top text-slate-300">
                      <p>{item.documentName || "-"}</p>
                      <p className="text-xs text-slate-500">
                        {item.documentNo || "-"}
                      </p>
                    </td>

                    {/* <td className="p-3 align-top">
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-400">
                        {item.typeOfTransit || "-"}
                      </span>
                    </td> */}
{/* 
                    <td className="p-3 align-top">
                      <span
                        className={`text-[11px] px-2 py-1 rounded-full border ${directionClass}`}
                      >
                        Project {projectDirection || "-"}
                      </span>
                    </td> */}

                    <td className="p-3 align-top text-slate-300">
                      {item.projectName || "-"}
                    </td>

                    <td className="p-3 align-top text-slate-300">
                      {item.vendorName || "-"}
                    </td>

                    <td className="p-3 align-top text-right font-semibold text-purple-400">
                      {Number(item.quantity || 0).toLocaleString("en-IN")}{" "}
                      <span className="text-slate-500 font-normal">
                        {item.uom || ""}
                      </span>
                    </td>

                    <td className="p-3 align-top text-right text-slate-300">
                      ₹ {formatAmount(item.rate || 0)}
                    </td>

                    <td className="p-3 align-top text-right font-semibold text-emerald-400">
                      ₹ {formatAmount(item.amount || 0)}
                    </td>

                    <td className="p-3 align-top text-slate-300">
                      {item.documentDate
                        ? new Date(item.documentDate).toLocaleDateString("en-IN")
                        : "-"}
                    </td>

                    <td className="p-3 align-top">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openView(item)}
                          className="inline-flex items-center gap-1 bg-blue-600/15 text-blue-400 hover:bg-blue-600/25 px-3 py-1.5 rounded-lg text-xs"
                        >
                          <Eye size={14} />
                          View
                        </button>

                        {canAction && (
                          <button
                            onClick={() => openEdit(item)}
                            className="inline-flex items-center gap-1 bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/25 px-3 py-1.5 rounded-lg text-xs"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}