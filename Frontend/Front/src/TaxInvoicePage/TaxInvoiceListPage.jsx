import React, { useEffect, useState } from "react";
import { Pencil, Trash2, Receipt, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { projectSiteList, vendorList } from "../Constant";

export default function TaxInvoiceListPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const totalPages = Math.ceil(invoices.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedInvoices = invoices.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const fetchInvoices = async () => {
    try {
      const response = await fetch("http://localhost:5000/tax-invoice/all");
      const result = await response.json();
      //   console.log(result)
      setInvoices(result.taxInvoiceList || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDelete = async (taxInvoiceId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this Tax Invoice?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `http://localhost:5000/tax-invoice/delete/${taxInvoiceId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();
      alert(result.message);
      fetchInvoices();
    } catch (error) {
      console.log(error);
      alert("Delete failed");
    }
  };

  const handleEdit = (id) => {
    //  console.log(id)
    navigate(`/edit-tax-invoice/${id}`);
  };
  const handleExportExcel = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/tax-invoice/export-excel"
      );

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "TaxInvoiceRegister.xlsx";
      link.click();

      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.log(error);
    }
  };

  const [filters, setFilters] = useState({
    invoiceNumber: "",
    vendorName: "",
    projectSite: "",
    deliveryStatus: "",
    invoiceDate: "",
    challanNumber: ""
  });
  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = async () => {
    try {
      const query = new URLSearchParams(filters).toString();

      const response = await fetch(
        `http://localhost:5000/tax-invoice-register?${query}`
      );

      const result = await response.json();

      setInvoices(result.data);
      setCurrentPage(1)

    } catch (error) {
      console.log(error);
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

    fetchInvoices();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">


        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-100">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="flex justify-between items-start">

            {/* Left Side */}
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

            {/* Right Side Button */}
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/add-tax-invoice')}
                className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 transition"
              >
                + Add
              </button>
              <button
                onClick={handleExportExcel}
                className="bg-green-600 text-white px-5 py-3 rounded-xl hover:bg-green-700 transition"
              >
                Export Excel
              </button>
            </div>


          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">
            Filter Tax Invoice Records
          </h2>

          <div className="grid md:grid-cols-4 gap-4">

            {/* Invoice Number */}
            <input
              type="text"
              name="invoiceNumber"
              placeholder="Invoice Number"
              value={filters.invoiceNumber}
              onChange={handleFilterChange}
              className="border rounded-xl px-4 py-3"
            />

            {/* Vendor Name */}
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

            {/* Project Site */}
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

            {/* Delivery Status */}
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

            {/* Invoice Date */}
            <input
              type="date"
              name="invoiceDate"
              value={filters.invoiceDate}
              onChange={handleFilterChange}
              className="border rounded-xl px-4 py-3"
            />

            {/* Challan Number */}
            <input
              type="text"
              name="challanNumber"
              placeholder="Challan Number"
              value={filters.challanNumber}
              onChange={handleFilterChange}
              className="border rounded-xl px-4 py-3"
            />

            {/* Buttons */}
            <button
              onClick={applyFilters}
              className="bg-blue-600 text-white rounded-xl px-4 py-3"
            >
              Apply Filter
            </button>

            <button
              onClick={resetFilters}
              className="bg-gray-500 text-white rounded-xl px-4 py-3"
            >
              Reset
            </button>

          </div>
        </div>
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
          {loading ? (
            <div className="p-8 text-center text-lg font-medium">
              Loading invoices...
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
                      <td className="p-4">{invoice.invoiceDate}</td>
                      <td className="p-4">{invoice.vendorName}</td>
                      <td className="p-4">₹ {invoice.invoiceAmount}</td>
                      <td className="p-4">{invoice.projectSite}</td>
                      <td className="p-4">{invoice.deliveryStatus || "-"}</td>

                      <td className="p-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowViewModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-200 bg-green-50 hover:shadow-md transition"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(invoice._id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:shadow-md transition"
                          >
                            <Pencil size={18} />
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(invoice._id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-red-50 hover:shadow-md transition"
                          >
                            <Trash2 size={18} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between p-4 border-t">

                <div>
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
                  </select>
                </div>

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
      {showViewModal && selectedInvoice && (
        <div className=" fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-auto p-4">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-8">

            {/* Header */}
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <h2 className="text-2xl font-bold">Tax Invoice</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 text-xl"
              >
                ✕
              </button>
            </div>

            {/* Table Style Layout */}
            <table className="w-full border text-sm">
              <tbody>

                <tr className="border">
                  <td className="p-3 font-semibold w-1/3">Invoice Number</td>
                  <td className="p-3">{selectedInvoice.invoiceNumber}</td>
                </tr>

                <tr className="border bg-gray-50">
                  <td className="p-3 font-semibold">Invoice Date</td>
                  <td className="p-3">{selectedInvoice.invoiceDate}</td>
                </tr>

                <tr className="border">
                  <td className="p-3 font-semibold">Vendor</td>
                  <td className="p-3">{selectedInvoice.vendorName}</td>
                </tr>

                <tr className="border bg-gray-50">
                  <td className="p-3 font-semibold">Project Site</td>
                  <td className="p-3">{selectedInvoice.projectSite}</td>
                </tr>

                <tr className="border">
                  <td className="p-3 font-semibold">Amount</td>
                  <td className="p-3">₹ {selectedInvoice.invoiceAmount}</td>
                </tr>

                <tr className="border bg-gray-50">
                  <td className="p-3 font-semibold">Delivery Status</td>
                  <td className="p-3">{selectedInvoice.deliveryStatus || "-"}</td>
                </tr>

                <tr className="border">
                  <td className="p-3 font-semibold">Challan Number</td>
                  <td className="p-3">{selectedInvoice.challanNumber || "-"}</td>
                </tr>
                <tr className="border">
                  <td className="p-3 font-semibold">Material Differnce </td>
                  
                  <td
                    className={`p-3 ${selectedInvoice?.materialDifference === "Difference Found"
                        ? "bg-red-100 text-red-600 font-semibold"
                        : "bg-green-100 text-green-600 font-semibold"
                      }`}
                  >
                    {selectedInvoice?.materialDifference || "-"}
                  </td>
                </tr>

              </tbody>
            </table>
            {/* Files Section */}
            <div className="mt-6 border-t pt-4">

              <h3 className="font-semibold mb-3 text-lg">Documents</h3>

              <div className="flex gap-4 flex-wrap">

                {/* Invoice File */}
                {selectedInvoice?.invoiceFile ? (
                  <button
                    onClick={() => window.open(selectedInvoice.invoiceFile, "_blank")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                  >
                    View Tax Invoice
                  </button>
                ) : (
                  <p className="text-gray-500">No Invoice File</p>
                )}

                {/* Challan File */}
                {selectedInvoice.challanFile ? (
                  <button
                    onClick={() => window.open(selectedInvoice.challanFile, "_blank")}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg"
                  >
                    View Challan
                  </button>
                ) : (
                  <p className="text-gray-500">No Challan File</p>
                )}

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
