import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  ArrowDownCircle,
  ArrowUpCircle,
  Archive,
  RotateCcw,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import BASE_URL from '../../../config/api'

export default function StockTransactionPage() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    transactionType: "",
    direction: "",
    fromDate: "",
    toDate: "",
  });

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await fetch(
        `${BASE_URL}/stock-transactions/all?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch stock transactions");
      }

      setRecords(data.data || []);
      setSummary(data.summary || {});
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredRecords = useMemo(() => records, [records]);

  const handleChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSearch = () => {
    fetchTransactions();
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      transactionType: "",
      direction: "",
      fromDate: "",
      toDate: "",
    });

    setTimeout(fetchTransactions, 100);
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDirectionClass = (direction) => {
    if (direction === "IN") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    if (direction === "OUT") return "bg-red-500/10 text-red-400 border-red-500/30";
    if (direction === "RESERVE") return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    if (direction === "RELEASE") return "bg-sky-500/10 text-sky-400 border-sky-500/30";
    return "bg-slate-500/10 text-slate-400 border-slate-500/30";
  };

  const cards = [
    {
      title: "Total Transactions",
      value: summary.totalTransactions || 0,
      icon: FileText,
    },
    {
      title: "Total In Qty",
      value: summary.totalInQty || 0,
      icon: ArrowDownCircle,
    },
    {
      title: "Total Out Qty",
      value: summary.totalOutQty || 0,
      icon: ArrowUpCircle,
    },
    {
      title: "Reserved Qty",
      value: summary.totalReservedQty || 0,
      icon: Archive,
    },
    {
      title: "Released Qty",
      value: summary.totalReleasedQty || 0,
      icon: RotateCcw,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Stock Transaction History
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Complete audit trail of stock reserve, issue, receive, and release.
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{card.title}</p>
                  <h2 className="text-2xl font-bold mt-1">{card.value}</h2>
                </div>

                <div className="h-11 w-11 rounded-xl bg-slate-800 flex items-center justify-center">
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2 relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              name="search"
              value={filters.search}
              onChange={handleChange}
              placeholder="Search reference / remarks"
              className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 outline-none focus:border-blue-500"
            />
          </div>

          <select
            name="transactionType"
            value={filters.transactionType}
            onChange={handleChange}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 outline-none focus:border-blue-500"
          >
            <option value="">All Types</option>
            <option value="OPENING_STOCK">Opening Stock</option>
            <option value="CHALLAN_RESERVED">Challan Reserved</option>
            <option value="CHALLAN_APPROVED_OUT">Challan Approved Out</option>
            <option value="CHALLAN_RECEIVED_SITE">Challan Received</option>
            <option value="CHALLAN_REJECT_RELEASE">Reject Release</option>
            <option value="STOCK_ADJUSTMENT">Stock Adjustment</option>
          </select>

          <select
            name="direction"
            value={filters.direction}
            onChange={handleChange}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 outline-none focus:border-blue-500"
          >
            <option value="">All Directions</option>
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
            <option value="RESERVE">RESERVE</option>
            <option value="RELEASE">RELEASE</option>
          </select>

          <input
            type="date"
            name="fromDate"
            value={filters.fromDate}
            onChange={handleChange}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 outline-none focus:border-blue-500"
          />

          <input
            type="date"
            name="toDate"
            value={filters.toDate}
            onChange={handleChange}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700"
          >
            Apply Filter
          </button>

          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-950 text-slate-300">
              <tr>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Item</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Direction</th>
                <th className="text-right p-3">Qty</th>
                <th className="text-right p-3">Before</th>
                <th className="text-right p-3">After</th>
                <th className="text-left p-3">Reference</th>
                <th className="text-left p-3">Store/Site</th>
                <th className="text-left p-3">User</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="p-6 text-center text-slate-400">
                    Loading transactions...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-6 text-center text-slate-400">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((txn) => (
                  <tr
                    key={txn._id}
                    className="border-t border-slate-800 hover:bg-slate-800/50"
                  >
                    <td className="p-3 whitespace-nowrap">
                      {formatDateTime(txn.createdAt)}
                    </td>

                    <td className="p-3 min-w-[220px]">
                      <div className="font-medium">
                        {txn.itemRef?.itemName || "-"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {txn.itemRef?.itemCode || ""}
                        {txn.itemRef?.unit ? ` • ${txn.itemRef.unit}` : ""}
                      </div>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {txn.transactionType}
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full border text-xs font-semibold ${getDirectionClass(
                          txn.direction
                        )}`}
                      >
                        {txn.direction}
                      </span>
                    </td>

                    <td className="p-3 text-right font-semibold">
                      {txn.quantity || 0}
                    </td>

                    <td className="p-3 text-right">
                      {txn.beforeStock ?? 0}
                    </td>

                    <td className="p-3 text-right">
                      {txn.afterStock ?? 0}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <div>{txn.referenceNumber || "-"}</div>
                      <div className="text-xs text-slate-400">
                        {txn.referenceType || ""}
                      </div>
                    </td>

                    <td className="p-3 min-w-[180px]">
                      {txn.mainStoreRef?.storeName ||
                        txn.siteRef?.projectName ||
                        txn.siteRef?.name ||
                        "-"}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {txn.createdBy?.name || txn.createdBy?.email || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}