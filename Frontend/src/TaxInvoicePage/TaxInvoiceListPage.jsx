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
  Search
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { projectSiteList, vendorList } from "../Constant";
import TaxInvoiceModal from "./TaxInvoiceModal";
import BASE_URL from "../../config/api";


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
    invoiceDate: "",
    challanNumber: ""
  });

  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`
  };

  const totalPages = Math.max(1, Math.ceil(invoices.length / itemsPerPage));

  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return invoices.slice(startIndex, startIndex + itemsPerPage);
  }, [invoices, currentPage, itemsPerPage]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${BASE_URL}/tax-invoice/all`, {
        headers: authHeaders
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

  useEffect(() => {
    fetchInvoices();
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
          headers: authHeaders
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

  const handleExportExcel = async () => {
    try {
      const loadingToast = toast.loading("Exporting Excel...");

      const response = await fetch(
        `${BASE_URL}/tax-invoice/export-excel`,
        {
          headers: authHeaders
        }
      );

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "TaxInvoiceRegister.xlsx";
      link.click();

      window.URL.revokeObjectURL(url);
      toast.dismiss(loadingToast);
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
      [name]: value
    }));
  };

  const applyFilters = async () => {
    try {
      const loadingToast = toast.loading("Applying filters...");

      const query = new URLSearchParams(filters).toString();

      const response = await fetch(
        `${BASE_URL}/tax-invoice-register?${query}`,
        {
          headers: authHeaders
        }
      );

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
      invoiceDate: "",
      challanNumber: ""
    });

    setCurrentPage(1);
    fetchInvoices();
    toast.success("Filters reset");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-100">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-xl mb-4"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Receipt size={30} />
                <h1 className="text-3xl font-bold">
                  Tax Invoice Register List
                </h1>
              </div>

              <p className="text-gray-500">
                View, edit and manage all tax invoice records
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 transition"
              >
                <Plus size={18} />
                Add
              </button>

              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl hover:bg-green-700 transition"
              >
                <Download size={18} />
                Export Excel
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">
            Filter Tax Invoice Records
          </h2>

          <div className="grid md:grid-cols-4 gap-4">
            <input
              type="text"
              name="invoiceNumber"
              placeholder="Invoice Number"
              value={filters.invoiceNumber}
              onChange={handleFilterChange}
              className="border rounded-xl px-4 py-3"
            />

            <select
              name="vendorName"
              value={filters.vendorName}
              onChange={handleFilterChange}
              className="border rounded-xl px-4 py-3"
            >
              <option value="">Select Vendor</option>
              {vendorList.map((vendor, index) => (
                <option key={index} value={vendor}>
                  {vendor}
                </option>
              ))}
            </select>

            <select
              name="projectSite"
              value={filters.projectSite}
              onChange={handleFilterChange}
              className="border rounded-xl px-4 py-3"
            >
              <option value="">Select Project Site</option>
              {projectSiteList.map((site, index) => (
                <option key={index} value={site}>
                  {site}
                </option>
              ))}
            </select>

            <select
              name="deliveryStatus"
              value={filters.deliveryStatus}
              onChange={handleFilterChange}
              className="border rounded-xl px-4 py-3"
            >
              <option value="">Delivery Status</option>
              <option value="delivered">Delivered</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
            </select>

            <input
              type="date"
              name="invoiceDate"
              value={filters.invoiceDate}
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
              Apply Filter
            </button>

            <button
              onClick={resetFilters}
              className="flex items-center justify-center gap-2 bg-gray-500 text-white rounded-xl px-4 py-3"
            >
              <RotateCcw size={18} />
              Reset
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
          {loading ? (
            <div className="p-10 flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={36} />
              <p className="text-gray-500 mt-3">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-lg font-medium">
              No tax invoice records found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4 text-left">Invoice No.</th>
                    <th className="p-4 text-left">Invoice Date</th>
                    <th className="p-4 text-left">Vendor</th>
                    <th className="p-4 text-left">Amount</th>
                    <th className="p-4 text-left">Project Site</th>
                    <th className="p-4 text-left">Delivery Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedInvoices.map((invoice) => (
                    <tr
                      key={invoice._id}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td className="p-4 font-medium">
                        {invoice.invoiceNumber}
                      </td>

                      <td className="p-4">
                        {invoice.invoiceDate
                          ? new Date(invoice.invoiceDate).toLocaleDateString(
                              "en-IN"
                            )
                          : "-"}
                      </td>

                      <td className="p-4">{invoice.vendorName}</td>
                      <td className="p-4">₹ {invoice.invoiceAmount}</td>
                      <td className="p-4">{invoice.projectSite}</td>
                      <td className="p-4">{invoice.deliveryStatus || "-"}</td>

                      <td className="p-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => openViewModal(invoice)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-200 bg-green-50 hover:shadow-md transition"
                          >
                            <Eye size={18} />
                            View
                          </button>

                          <button
                            onClick={() => openEditModal(invoice)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:shadow-md transition"
                          >
                            <Pencil size={18} />
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(invoice._id)}
                            disabled={deleteLoadingId === invoice._id}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-red-50 hover:shadow-md transition disabled:opacity-50"
                          >
                            {deleteLoadingId === invoice._id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center justify-between p-4 border-t">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border px-3 py-2 rounded-lg"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>

                <div className="flex items-center gap-3">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>

                  <span>
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className="px-4 py-2 border rounded disabled:opacity-50"
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
    </div>
  );
}