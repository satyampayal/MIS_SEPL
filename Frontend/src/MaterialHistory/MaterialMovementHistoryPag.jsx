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

export default function MaterialMovementHistoryPage() {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

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

      Object.entries(filters).forEach(([key, value]) => {
        if (value) query.append(key, value);
      });

      const res = await fetch(
        `${BASE_URL}/material-movement/history?${query.toString()}`
      );

      const data = await res.json();

      if (data.success) {
        setRecords(data.data || []);
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
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 p-6">
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
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-6">
          <div className="bg-white rounded-3xl p-6 shadow border">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500">Total Records</p>
                <h2 className="text-3xl font-bold mt-2">{records.length}</h2>
              </div>
              <Package className="text-blue-600" size={38} />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow border">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500">Total Quantity</p>
                <h2 className="text-3xl font-bold mt-2">{totalQty}</h2>
              </div>
              <Truck className="text-orange-600" size={38} />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow border">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500">Total Amount</p>
                <h2 className="text-3xl font-bold mt-2">
                  ₹ {formatAmount(totalAmount)}
                </h2>
              </div>
              <IndianRupee className="text-green-600" size={38} />
            </div>
          </div>
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
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            item.inOut === "In"
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