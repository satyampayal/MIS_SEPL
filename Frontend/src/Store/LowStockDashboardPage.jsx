import React, { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    Archive,
    CheckCircle2,
    IndianRupee,
    RefreshCw,
    Search,
    XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import ItemTimelineModal from "./ItemTimelineModal";

import BASE_URL from '../../config/api'

export default function LowStockDashboardPage() {
    const [summary, setSummary] = useState({});
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const [timelineItem, setTimelineItem] = useState(null);
    const [timelineOpen, setTimelineOpen] = useState(false);

    const [filters, setFilters] = useState({
        search: "",
        status: "",
    });

    const fetchLowStock = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();

            if (filters.search) params.append("search", filters.search);
            if (filters.status) params.append("status", filters.status);

            const res = await fetch(
                `${BASE_URL}/main-store-stock/low-stock-dashboard?${params.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const data = await res.json();

            if (!data.success) {
                throw new Error(data.message || "Failed to fetch low stock dashboard");
            }

            setSummary(data.summary || {});
            setItems(data.data || []);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLowStock();
    }, []);

    const handleChange = (e) => {
        setFilters((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const resetFilters = () => {
        setFilters({
            search: "",
            status: "",
        });

        setTimeout(fetchLowStock, 100);
    };

    const formatMoney = (value) => {
        return Number(value || 0).toLocaleString("en-IN", {
            maximumFractionDigits: 2,
        });
    };

    const getStatusClass = (status) => {
        if (status === "OUT_OF_STOCK") {
            return "bg-red-500/10 text-red-400 border-red-500/30";
        }

        if (status === "LOW_STOCK") {
            return "bg-amber-500/10 text-amber-400 border-amber-500/30";
        }

        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    };

    const cards = useMemo(
        () => [
            {
                title: "Total Items",
                value: summary.totalItems || 0,
                icon: Archive,
            },
            {
                title: "Low Stock",
                value: summary.lowStockItems || 0,
                icon: AlertTriangle,
            },
            {
                title: "Out Of Stock",
                value: summary.outOfStockItems || 0,
                icon: XCircle,
            },
            {
                title: "Reserved Items",
                value: summary.reservedStockItems || 0,
                icon: RefreshCw,
            },
            {
                title: "Healthy Items",
                value: summary.healthyItems || 0,
                icon: CheckCircle2,
            },
            {
                title: "Stock Value",
                value: `₹${formatMoney(summary.totalStockValue)}`,
                icon: IndianRupee,
            },
        ],
        [summary]
    );

    const openTimeline = (item) => {
        setTimelineItem(item);
        setTimelineOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        Low Stock Dashboard
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Track low stock, out of stock, reserved quantity and stock value.
                    </p>
                </div>

                <button
                    onClick={fetchLowStock}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700"
                >
                    <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 mb-6">
                {cards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <div
                            key={card.title}
                            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-slate-400 text-sm">{card.title}</p>
                                    <h2 className="text-xl md:text-2xl font-bold mt-1">
                                        {card.value}
                                    </h2>
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2 relative">
                        <Search
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                        />

                        <input
                            name="search"
                            value={filters.search}
                            onChange={handleChange}
                            placeholder="Search item, code, category, store..."
                            className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 outline-none focus:border-blue-500"
                        />
                    </div>

                    <select
                        name="status"
                        value={filters.status}
                        onChange={handleChange}
                        className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 outline-none focus:border-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="OUT_OF_STOCK">Out Of Stock</option>
                        <option value="LOW_STOCK">Low Stock</option>
                        <option value="HEALTHY">Healthy</option>
                    </select>

                    <div className="flex gap-2">
                        <button
                            onClick={fetchLowStock}
                            className="flex-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700"
                        >
                            Apply
                        </button>

                        <button
                            onClick={resetFilters}
                            className="flex-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <h2 className="font-semibold">Stock Alert Items</h2>
                    <p className="text-sm text-slate-400">{items.length} records</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-950 text-slate-300">
                            <tr>
                                <th className="text-left p-3">Item</th>
                                <th className="text-left p-3">Store</th>
                                <th className="text-right p-3">Current</th>
                                <th className="text-right p-3">Reserved</th>
                                <th className="text-right p-3">Available</th>
                                <th className="text-right p-3">Min</th>
                                <th className="text-right p-3">Reorder</th>
                                <th className="text-right p-3">Rate</th>
                                <th className="text-right p-3">Value</th>
                                <th className="text-left p-3">Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="10" className="p-6 text-center text-slate-400">
                                        Loading low stock data...
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="p-6 text-center text-slate-400">
                                        No stock alert found.
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr
                                        key={item._id}
                                        className="border-t border-slate-800 hover:bg-slate-800/50"
                                    >
                                        <td className="p-3 min-w-[230px]">
                                            <button
                                                onClick={() => openTimeline(item)}
                                                className="text-left hover:text-blue-400"
                                            >
                                                <div className="font-medium">{item.itemName || "-"}</div>
                                                <div className="text-xs text-slate-400">
                                                    {item.itemCode || "-"}
                                                    {item.unit ? ` • ${item.unit}` : ""}
                                                    {item.category ? ` • ${item.category}` : ""}
                                                </div>
                                            </button>
                                        </td>

                                        <td className="p-3 min-w-[170px]">
                                            <div>{item.storeName || "-"}</div>
                                            <div className="text-xs text-slate-400">
                                                {item.storeCode || ""}
                                            </div>
                                        </td>

                                        <td className="p-3 text-right">{item.currentStock}</td>
                                        <td className="p-3 text-right">{item.reservedStock}</td>
                                        <td className="p-3 text-right font-semibold">
                                            {item.availableStock}
                                        </td>
                                        <td className="p-3 text-right">{item.minimumStockLevel}</td>
                                        <td className="p-3 text-right">{item.reorderLevel}</td>
                                        <td className="p-3 text-right">
                                            ₹{formatMoney(item.averageRate)}
                                        </td>
                                        <td className="p-3 text-right">
                                            ₹{formatMoney(item.stockValue)}
                                        </td>

                                        <td className="p-3">
                                            <span
                                                className={`px-3 py-1 rounded-full border text-xs font-semibold ${getStatusClass(
                                                    item.stockStatus
                                                )}`}
                                            >
                                                {item.stockStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <ItemTimelineModal
  isOpen={timelineOpen}
  onClose={() => setTimelineOpen(false)}
  item={timelineItem}
/>
        </div>
    );
}