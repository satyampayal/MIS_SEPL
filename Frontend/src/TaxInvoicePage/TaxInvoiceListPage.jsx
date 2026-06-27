import React, { useEffect, useMemo, useState } from "react";
import {
  Pencil,
  Trash2,
  Receipt,
  ArrowLeft,
  Eye,
  Plus,
  Download,
  Loader2,
  RotateCcw,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import TaxInvoiceModal from "./TaxInvoiceModal";
import BASE_URL from "../../config/api";
import BulkTaxInvoiceUpload from "./BulkTaxInvoiceUpload";

export default function TaxInvoiceListPage() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("add");

  const [filters, setFilters] = useState({
    invoiceNumber: "",
    vendorName: "",
    projectSite: "",
    deliveryStatus: "",
    approvalChallanStatus: "",
    invoiceDate: "",
    challanDate: "",
    challanNumber: "",
    typeOfChallan: "",
  });

  const [partys, setPartys] = useState([]);
  const [projects, setProjects] = useState([]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  const token = localStorage.getItem("token");
  const loggedInUser = JSON.parse(localStorage.getItem("user")) || {};
  const userRole = loggedInUser?.role;

  const canManageInvoices = ["Super Admin", "Admin", "Manager", "MIS"].includes(
    userRole
  );

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const inputClass =
    "bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400";

  const totalPages = Math.max(1, Math.ceil(invoices.length / itemsPerPage));

  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return invoices.slice(startIndex, startIndex + itemsPerPage);
  }, [invoices, currentPage, itemsPerPage]);

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN");
  };

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN",{maximumFractionDigits:0});
  };

  const calculateDelayDays = (invoice) => {
    if (!invoice?.invoiceDate) return 0;

    const invoiceDate = new Date(invoice.invoiceDate);
    const isDelivered =
      invoice?.approvalChallanStatus?.toLowerCase() === "delivered";

    const endDate =
      isDelivered && invoice?.challanDate
        ? new Date(invoice.challanDate)
        : new Date();

    const diffTime = endDate - invoiceDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  const pendingInvoices = invoices.filter(
    (i) => i.deliveryStatus?.toLowerCase() !== "delivered"
  ).length;

  const deliveredInvoices = invoices.filter(
    (i) => i.deliveryStatus?.toLowerCase() === "delivered"
  ).length;

    const pendingApprovedChallan= invoices.filter(
    (i) => i.approvalChallanStatus?.toLowerCase() !== "delivered"
  ).length;

  const delayedInvoices = invoices.filter(
    (i) =>
      i.deliveryStatus?.toLowerCase() !== "delivered" &&
      calculateDelayDays(i) > 30
  ).length;

  const totalInvoiceAmount = invoices.reduce(
    (sum, item) => sum + Number(item.invoiceAmount || 0),
    0
  );

  const fetchInvoices = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${BASE_URL}/tax-invoice/all`, {
        headers: authHeaders,
      });

      const result = await response.json();

      if (result.success || result.taxInvoiceList) {
        setInvoices(result.taxInvoiceList || result.data || []);
      } else {
        toast.error(result.message || "Failed to load tax invoices");
      }
    } catch (error) {
      console.log(error);
      toast.error("Server error while loading invoices");
    } finally {
      setLoading(false);
    }
  };

  const fetchPartys = async () => {
    try {
      const res = await fetch(`${BASE_URL}/party/search?type=Vendor&limit=100`, {
        headers: authHeaders,
      });

      const data = await res.json();
      setPartys(data.data || []);
    } catch (error) {
      console.error("Error fetching parties:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${BASE_URL}/project-master/all`, {
        headers: authHeaders,
      });

      const data = await res.json();

      const uniqueProjects = Array.from(
        new Set((data.data || []).map((project) => project.name))
      ).map((name) => {
        return data.data.find((project) => project.name === name);
      });

      setProjects(uniqueProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchPartys();
    fetchProjects();
  }, []);

  const openAddModal = () => {
    setSelectedInvoice(null);
    setMode("add");
    setShowModal(true);
  };

  const openViewModal = (invoice) => {
    setSelectedInvoice(invoice);
    setMode("view");
    setShowModal(true);
  };

  const openEditModal = (invoice) => {
    setSelectedInvoice(invoice);
    setMode("edit");
    setShowModal(true);
  };

  const handleDelete = async (taxInvoiceId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this Tax Invoice?"
    );

    if (!confirmDelete) {
      toast("Delete cancelled");
      return;
    }

    try {
      setDeleteLoadingId(taxInvoiceId);
      const loadingToast = toast.loading("Deleting tax invoice...");

      const response = await fetch(
        `${BASE_URL}/tax-invoice/delete/${taxInvoiceId}`,
        {
          method: "DELETE",
          headers: authHeaders,
        }
      );

      const result = await response.json();
      toast.dismiss(loadingToast);

      if (result.success) {
        toast.success(result.message || "Tax invoice deleted successfully");
        fetchInvoices();
      } else {
        toast.error(result.message || "Delete failed");
      }
    } catch (error) {
      console.log(error);
      toast.error("Server error while deleting invoice");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleExportExcel = () => {
    try {
      const exportData = invoices.map((invoice, index) => ({
        "S.No": index + 1,
        "Invoice Number": invoice.invoiceNumber || "",
        "Invoice Date": formatDate(invoice.invoiceDate),
        "Vendor Name": invoice.vendorName || "",
        "Invoice Amount": invoice.invoiceAmount || "",
        "Project Site": invoice.projectSite || "",
        "Challan Created": invoice.challanCreated || "",
        "Type Of Challan": invoice.typeOfChallan || "",
        "Challan Number": invoice.challanNumber || "",
        "Challan Date": formatDate(invoice.challanDate),
        "Delivery Status": invoice.deliveryStatus || "",
        "Quantity Sent": invoice.quantitySent || "",
        "Quantity Received": invoice.quantityReceived || "",
        "Material Difference": invoice.materialDifference || "",
        "Delay Days": calculateDelayDays(invoice),
        "Invoice File": invoice.invoiceFile || "",
        "Challan File": invoice.challanFile || "",
        "Created At": invoice.createdAt
          ? new Date(invoice.createdAt).toLocaleString("en-IN")
          : "",
        "Updated At": invoice.updatedAt
          ? new Date(invoice.updatedAt).toLocaleString("en-IN")
          : "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Tax Invoice Register");
      XLSX.writeFile(workbook, "Tax_Invoice_Register_All_Fields.xlsx");

      toast.success("Excel exported successfully");
    } catch (error) {
      console.log(error);
      toast.error("Excel export failed");
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyFilters = async () => {
    try {
      const loadingToast = toast.loading("Applying filters...");

      const query = new URLSearchParams(filters).toString();

      const response = await fetch(`${BASE_URL}/tax-invoice/filter?${query}`, {
        headers: authHeaders,
      });

      const result = await response.json();

      setInvoices(result.data || []);
      setCurrentPage(1);

      toast.dismiss(loadingToast);
      toast.success("Filters applied");
    } catch (error) {
      console.log(error);
      toast.error("Filter failed");
    }
  };

  const resetFilters = () => {
    setFilters({
      invoiceNumber: "",
      vendorName: "",
      projectSite: "",
      deliveryStatus: "",
      approvalChallanStatus:"",
      invoiceDate: "",
      challanDate: "",
      challanNumber: "",
      typeOfChallan: "",
    });

    setCurrentPage(1);
    fetchInvoices();
    toast.success("Filters reset");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-6 shadow-xl">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 rounded-xl mb-4 text-slate-300"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-cyan-500/10 border border-cyan-500/20 p-3 rounded-2xl">
                  <Receipt size={30} className="text-cyan-400" />
                </div>
                <h1 className="text-3xl font-bold text-white">
                  Tax Invoice Register List
                </h1>
              </div>

              <p className="text-slate-400">
                View, edit, export and track invoice delivery delays.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => navigate("/analytics/tax-invoice")}
                className="rounded-xl bg-indigo-500/20 border border-indigo-500/30 px-4 py-3 text-indigo-300 hover:bg-indigo-500/30"
              >
                View Analytics
              </button>

              <button
                onClick={() => navigate("/tax-invoice/project-surveillance")}
                className="flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 px-5 py-3 rounded-xl hover:bg-purple-500/30 transition"
              >
                <Receipt size={18} />
                Project Surveillance
              </button>

              <button
                onClick={() => setBulkModalOpen(true)}
                className="px-4 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-medium hover:bg-emerald-500/30"
              >
                Bulk Upload Excel
              </button>

              {canManageInvoices && (
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 py-3 rounded-xl transition font-bold"
                >
                  <Plus size={18} />
                  Add
                </button>
              )}

              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-3 rounded-xl transition font-bold"
              >
                <Download size={18} />
                Export All
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-4 mb-6">
          <SummaryCard title="Total Invoices" value={invoices.length} />
          <SummaryCard
            title="Delivered"
            value={deliveredInvoices}
            valueClass="text-emerald-400"
          />
          <SummaryCard
            title="Pending / Partial"
            value={pendingInvoices}
            valueClass="text-red-400"
          />
           <SummaryCard
            title="Approved Challan Pending"
            value={pendingApprovedChallan}
            valueClass="text-red-400"
          />
          <SummaryCard
            title="Invoice Value"
            value={`₹ ${formatAmount(totalInvoiceAmount)}`}
            valueClass="text-cyan-400"
          />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white">
            Filter Tax Invoice Records
          </h2>

          <div className="grid md:grid-cols-4 gap-4">
            <input
              type="text"
              name="invoiceNumber"
              placeholder="Invoice Number"
              value={filters.invoiceNumber}
              onChange={handleFilterChange}
              className={inputClass}
            />

            <select
              name="vendorName"
              value={filters.vendorName}
              onChange={handleFilterChange}
              className={inputClass}
            >
              <option value="">Select Vendor</option>
              {partys.map((vendor, index) => (
                <option key={index} value={vendor?.partyName}>
                  {vendor?.partyName}
                </option>
              ))}
            </select>

            <select
              name="projectSite"
              value={filters.projectSite}
              onChange={handleFilterChange}
              className={inputClass}
            >
              <option value="">Select Project Site</option>
              {projects.map((project, index) => (
                <option key={index} value={project.name}>
                  {project.name}
                </option>
              ))}
            </select>

            <select
              name="deliveryStatus"
              value={filters.deliveryStatus}
              onChange={handleFilterChange}
              className={inputClass}
            >
              <option value="">Delivery Status</option>
              <option value="delivered">Delivered</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
            </select>
              <select
              name="approvalChallanStatus"
              value={filters.approvalChallanStatus}
              onChange={handleFilterChange}
              className={inputClass}
            >
              <option value="">Approval Challan Status</option>
              <option value="delivered">Delivered</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
            </select>

            <select
              name="typeOfChallan"
              value={filters.typeOfChallan}
              onChange={handleFilterChange}
              className={inputClass}
            >
              <option value="">Type of Challan</option>
              <option value="DDC">DDC</option>
              <option value="DC">DC</option>
              <option value="LPN">LPN</option>
              <option value="MRN">MRN</option>
            </select>

            
            <input
              type="date"
              name="invoiceDate"
              value={filters.invoiceDate}
              onChange={handleFilterChange}
              className={inputClass}
              title="Invoice Date"
            />

            <input
              type="date"
              name="challanDate"
              value={filters.challanDate}
              onChange={handleFilterChange}
              className={inputClass}
              title="Challan Date"
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
              className="flex items-center justify-center gap-2 bg-cyan-500 text-slate-950 rounded-xl px-4 py-3 font-bold hover:bg-cyan-400"
            >
              <Search size={18} />
              Apply Filter
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

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          {loading ? (
            <div className="p-10 flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-cyan-400" size={36} />
              <p className="text-slate-400 mt-3">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-lg font-medium text-slate-400">
              No tax invoice records found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-950 border-b border-slate-800">
                  <tr>
                    <Th>Invoice No.</Th>
                    <Th>Invoice Date</Th>
                    <Th>Challan No.</Th>
                    <Th>Challan Date</Th>
                    <Th>Delay Days</Th>
                    <Th>Vendor</Th>
                    {canManageInvoices && <Th>Amount</Th> }
                    <Th>Project Site</Th>
                    <Th>Delivery Status</Th>
                    <Th>Verify Challan Status</Th>
                    <th className="p-4 text-center text-slate-300 font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedInvoices.map((invoice) => {
                    const delayDays = calculateDelayDays(invoice);
                  // I add later a Approval Challan Status sonow i not chage the is Delivered Varible 
                    const isDelivered =
                      invoice?.approvalChallanStatus?.toLowerCase() === "delivered";

                    return (
                      <tr
                        key={invoice._id}
                        className="border-b border-slate-800 hover:bg-slate-800/40 transition"
                      >
                        <td className="p-4 font-medium text-white">
                          {invoice.invoiceNumber}
                        </td>

                        <td className="p-4 text-slate-300">
                          {formatDate(invoice.invoiceDate)}
                        </td>

                        <td className="p-4 text-slate-300">
                          {invoice.challanNumber || "-"}
                        </td>

                        <td className="p-4 text-slate-300">
                          {formatDate(invoice.challanDate)}
                        </td>

                        <td className="p-4">
                          {isDelivered ? (
                            <span className="line-through text-slate-500 font-medium">
                              {delayDays} Days
                            </span>
                          ) : delayDays > 10 ? (
                            <span className="text-red-400 font-bold">
                              {delayDays} Days
                            </span>
                          ) : delayDays > 15 ? (
                            <span className="text-amber-400 font-semibold">
                              {delayDays} Days
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-semibold">
                              {delayDays} Days
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-slate-300">
                          {invoice.vendorName}
                        </td>

                        {canManageInvoices && <td className="p-4 text-slate-300">
                          ₹ {formatAmount(invoice.invoiceAmount)}
                        </td> }

                        <td className="p-4 text-slate-300">
                          {invoice.projectSite}
                        </td>

                        <td className="p-4">
                          <StatusBadge status={invoice.deliveryStatus} />
                        </td>
                         <td className="p-4">
                          <StatusBadge status={invoice?.approvalChallanStatus} />
                        </td>

                        <td className="p-4">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => openViewModal(invoice)}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                            >
                              <Eye size={18} />
                              View
                            </button>

                            {canManageInvoices && (
                              <button
                                onClick={() => openEditModal(invoice)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition"
                              >
                                <Pencil size={18} />
                                Edit
                              </button>
                            )}

                            {canManageInvoices && (
                              <button
                                onClick={() => handleDelete(invoice._id)}
                                disabled={deleteLoadingId === invoice._id}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
                              >
                                {deleteLoadingId === invoice._id ? (
                                  <Loader2
                                    size={18}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2 size={18} />
                                )}
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex items-center justify-between p-4 border-t border-slate-800">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-950 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>

                <div className="flex items-center gap-3 text-slate-300">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    className="px-4 py-2 border border-slate-700 rounded disabled:opacity-50 hover:bg-slate-800"
                  >
                    Previous
                  </button>

                  <span>
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className="px-4 py-2 border border-slate-700 rounded disabled:opacity-50 hover:bg-slate-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <TaxInvoiceModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        mode={mode}
        invoice={selectedInvoice}
        refreshInvoices={fetchInvoices}
      />

      <BulkTaxInvoiceUpload
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        refreshInvoices={fetchInvoices}
      />
    </div>
  );
}

function SummaryCard({ title, value, valueClass = "text-white" }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <p className="text-slate-500">{title}</p>
      <h2 className={`text-3xl font-bold mt-2 ${valueClass}`}>{value}</h2>
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

  if (currentStatus === "delivered") {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        Delivered
      </span>
    );
  }

  if (currentStatus === "partial") {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        Partial
      </span>
    );
  }

  return (
    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
      {status || "Pending"}
    </span>
  );
}