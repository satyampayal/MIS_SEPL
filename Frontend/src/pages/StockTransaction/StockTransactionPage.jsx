import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  ArrowDownCircle,
  ArrowUpCircle,
  Archive,
  RotateCcw,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import BASE_URL from "../../../config/api";

export default function StockTransactionPage() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [filters, setFilters] = useState({
    search: "",
    transactionType: "",
    direction: "",
    fromDate: "",
    toDate: "",
  });

  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineData, setTimelineData] = useState([]);
  const [timelineItem, setTimelineItem] = useState(null);
  const [timelineSummary, setTimelineSummary] = useState({});

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
      setPage(1);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const totalPages = Math.ceil(records.length / limit) || 1;

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * limit;
    return records.slice(start, start + limit);
  }, [records, page, limit]);

  const startRecord = records.length === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, records.length);

  const handleChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSearch = () => {
    fetchTransactions();
  };

  useEffect(() => {
  const timer = setTimeout(() => {
    fetchTransactions();
  }, 400);

  return () => clearTimeout(timer);
}, [filters.search]);

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
    if (direction === "IN")
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    if (direction === "OUT")
      return "bg-red-500/10 text-red-400 border-red-500/30";
    if (direction === "RESERVE")
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    if (direction === "RELEASE")
      return "bg-sky-500/10 text-sky-400 border-sky-500/30";
    return "bg-slate-500/10 text-slate-400 border-slate-500/30";
  };

  const cards = [
    { title: "Total Transactions", value: summary.totalTransactions || 0, icon: FileText },
    { title: "Total In Qty", value: summary.totalInQty || 0, icon: ArrowDownCircle },
    { title: "Total Out Qty", value: summary.totalOutQty || 0, icon: ArrowUpCircle },
    { title: "Reserved Qty", value: summary.totalReservedQty || 0, icon: Archive },
    { title: "Released Qty", value: summary.totalReleasedQty || 0, icon: RotateCcw },
  ];

  const openItemTimeline = async (itemId) => {
    if (!itemId) return;

    try {
      setTimelineOpen(true);
      setTimelineLoading(true);

      const res = await fetch(
        `${BASE_URL}/stock-transactions/item-timeline/${itemId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch item timeline");
      }

      setTimelineItem(data.item);
      setTimelineSummary(data.summary || {});
      setTimelineData(data.data || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setTimelineLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            Stock Transaction History
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Complete audit trail of stock reserve, issue, receive, and release.
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 hover:bg-slate-700"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg"
            >
              {loading ? (
                <CardSkeleton />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">{card.title}</p>
                    <h2 className="mt-1 text-2xl font-bold">{card.value}</h2>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800">
                    <Icon size={22} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <div className="relative md:col-span-2">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              name="search"
              value={filters.search}
              onChange={handleChange}
              placeholder="Search Item Name, Item Code, Challan No..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-10 pr-3 outline-none focus:border-blue-500"
            />
          </div>

          <select
            name="transactionType"
            value={filters.transactionType}
            onChange={handleChange}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500"
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
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500"
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
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500"
          />

          <input
            type="date"
            name="toDate"
            value={filters.toDate}
            onChange={handleChange}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500"
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleSearch}
            className="rounded-xl bg-blue-600 px-4 py-2 hover:bg-blue-700"
          >
            Apply Filter
          </button>

          <button
            onClick={resetFilters}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 hover:bg-slate-700"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
        <div className="flex flex-col gap-3 border-b border-slate-800 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-400">
            Showing{" "}
            <span className="font-semibold text-white">{startRecord}</span> to{" "}
            <span className="font-semibold text-white">{endRecord}</span> of{" "}
            <span className="font-semibold text-white"> {records.length}</span>{" "}
            transactions
          </p>

          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="w-fit rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] text-sm">
            <thead className="bg-slate-950 text-slate-300">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Item</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Direction</th>
                <th className="p-3 text-right">Qty</th>
                <th className="p-3 text-right">Before</th>
                <th className="p-3 text-right">After</th>
                <th className="p-3 text-left">Reference</th>
                <th className="p-3 text-left">Store/Site</th>
                <th className="p-3 text-left">User</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <TableSkeleton rows={limit} />
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-slate-400">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((txn) => (
                  <tr
                    key={txn._id}
                    className="border-t border-slate-800 hover:bg-slate-800/50"
                  >
                    <td className="whitespace-nowrap p-3">
                      {formatDateTime(txn.createdAt)}
                    </td>

                    <td className="min-w-[220px] p-3">
                      <button
                        onClick={() => openItemTimeline(txn.itemRef?._id)}
                        className="font-medium text-cyan-300 hover:underline"
                      >
                        {txn.itemRef?.itemName || "-"}
                      </button>
                      <div className="text-xs text-slate-400">
                        {txn.itemRef?.itemCode || ""}
                        {txn.itemRef?.unit ? ` • ${txn.itemRef.unit}` : ""}
                      </div>
                    </td>

                    <td className="whitespace-nowrap p-3">
                      {txn.transactionType}
                    </td>

                    <td className="p-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${getDirectionClass(
                          txn.direction
                        )}`}
                      >
                        {txn.direction}
                      </span>
                    </td>

                    <td className="p-3 text-right font-semibold">
                      {txn.quantity || 0}
                    </td>

                    <td className="p-3 text-right">{txn.beforeStock ?? 0}</td>
                    <td className="p-3 text-right">{txn.afterStock ?? 0}</td>

                    <td className="whitespace-nowrap p-3">
                      <div>{txn.referenceNumber || "-"}</div>
                      <div className="text-xs text-slate-400">
                        {txn.referenceType || ""}
                      </div>
                    </td>

                    <td className="min-w-[180px] p-3">
                      {txn.mainStoreRef?.storeName ||
                        txn.siteRef?.projectName ||
                        txn.siteRef?.name ||
                        "-"}
                    </td>

                    <td className="whitespace-nowrap p-3">
                      {txn.createdBy?.fullName || txn.createdBy?.email || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-800 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-400">
            Page <span className="font-semibold text-white">{page}</span> of{" "}
            <span className="font-semibold text-white">{totalPages}</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1 || loading}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Prev
            </button>

            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages || loading}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {timelineOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div>
          <h2 className="text-xl font-bold">Item Timeline / Stock Passbook</h2>
          <p className="text-sm text-slate-400">
            {timelineItem?.itemName || "-"} • {timelineItem?.itemCode || "-"} • {timelineItem?.unit || "-"}
          </p>
        </div>

        <button
          onClick={() => setTimelineOpen(false)}
          className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 border-b border-slate-800 p-4 md:grid-cols-4">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-xs text-emerald-300">Total IN</p>
          <h3 className="text-2xl font-bold">{timelineSummary.totalIn || 0}</h3>
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-xs text-red-300">Total OUT</p>
          <h3 className="text-2xl font-bold">{timelineSummary.totalOut || 0}</h3>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
          <p className="text-xs text-amber-300">Reserved</p>
          <h3 className="text-2xl font-bold">{timelineSummary.totalReserved || 0}</h3>
        </div>

        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4">
          <p className="text-xs text-sky-300">Released</p>
          <h3 className="text-2xl font-bold">{timelineSummary.totalReleased || 0}</h3>
        </div>
      </div>

      <div className="max-h-[58vh] overflow-y-auto p-5">
        {timelineLoading ? (
          <div className="py-16 text-center text-slate-400">Loading timeline...</div>
        ) : timelineData.length === 0 ? (
          <div className="py-16 text-center text-slate-400">No timeline found</div>
        ) : (
          <div className="relative border-l border-slate-700 pl-6">
            {timelineData.map((txn) => (
              <div key={txn._id} className="relative mb-6">
                <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-cyan-400 ring-4 ring-cyan-400/20" />

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-white">
                        {txn.referenceNumber || "-"} • {txn.transactionType}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDateTime(txn.createdAt)}
                      </p>
                    </div>

                    <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${getDirectionClass(txn.direction)}`}>
                      {txn.direction} {txn.quantity}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-300 md:grid-cols-4">
                    <p>Before: {txn.beforeStock ?? 0}</p>
                    <p>After: {txn.afterStock ?? 0}</p>
                    <p>Ref: {txn.referenceType || "-"}</p>
                    <p>
                      Store/Site:{" "}
                      {txn.mainStoreRef?.storeName ||
                        txn.siteRef?.projectName ||
                        txn.siteRef?.name ||
                        "-"}
                    </p>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    User: {txn.createdBy?.fullName || txn.createdBy?.email || "-"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
)}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-3 h-4 w-28 rounded bg-slate-800" />
      <div className="h-7 w-16 rounded bg-slate-800" />
    </div>
  );
}

function TableSkeleton({ rows = 10 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index} className="border-t border-slate-800">
          {Array.from({ length: 10 }).map((__, colIndex) => (
            <td key={colIndex} className="p-3">
              <div className="h-4 animate-pulse rounded bg-slate-800" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}