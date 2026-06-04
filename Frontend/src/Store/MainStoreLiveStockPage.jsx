import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Warehouse,
    Search,
    RefreshCcw,
    Loader2,
    PackageCheck,
    AlertTriangle,
    IndianRupee,
    Boxes,
    Lock,
    X,
    Plus,
    Upload,
    Pencil,
    Trash2,
} from "lucide-react";
import BASE_URL from "../../config/api";
import { useNavigate } from "react-router-dom";


const API_URL = `${BASE_URL}/main-store-stock`;
const ITEM_API = `${BASE_URL}/item-identity`;
const STORE_API = `${BASE_URL}/store-master`;

const emptyOpeningStock = {
    mainStoreRef: "",
    itemRef: "",
    openingQty: "",
    rate: "",
    location: "",
    rackNumber: "",
    remarks: "",
};

export default function MainStoreLiveStockPage() {
    const navigate = useNavigate();
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");

    const [stores, setStores] = useState([]);
    const [items, setItems] = useState([]);
    const [openingModal, setOpeningModal] = useState(false);
    const [openingForm, setOpeningForm] = useState(emptyOpeningStock);
    const [savingOpening, setSavingOpening] = useState(false);

    const [excelFile, setExcelFile] = useState(null);
    const [uploadingExcel, setUploadingExcel] = useState(false);

    const [editModal, setEditModal] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [savingEdit, setSavingEdit] = useState(false);


    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStage, setUploadStage] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchStock = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/live-stock`);
            setStocks(res.data.data || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to load stock");
        } finally {
            setLoading(false);
        }
    };

    const fetchStores = async () => {
        try {
            const res = await axios.get(`${STORE_API}/all`);
            setStores(res.data.data || []);
        } catch {
            toast.error("Failed to load stores");
        }
    };

    const fetchItems = async () => {
        try {
            const res = await axios.get(`${ITEM_API}/all`);
            setItems(res.data.data || []);
        } catch {
            toast.error("Failed to load items");
        }
    };

    const saveOpeningStock = async () => {
        if (!openingForm.mainStoreRef) return toast.error("Select main store");
        if (!openingForm.itemRef) return toast.error("Select item");
        if (Number(openingForm.openingQty) <= 0) {
            return toast.error("Opening qty must be greater than 0");
        }

        try {
            setSavingOpening(true);

            await axios.post(`${API_URL}/add-opening-stock`, {
                ...openingForm,
                openingQty: Number(openingForm.openingQty),
                rate: Number(openingForm.rate || 0),
            });

            toast.success("Opening stock added");
            setOpeningModal(false);
            setOpeningForm(emptyOpeningStock);
            fetchStock();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to add opening stock");
        } finally {
            setSavingOpening(false);
        }
    };

    // Excel UploadFunction
    const uploadMainStockExcel = async () => {
        if (!excelFile) return toast.error("Select Excel file first");

        try {
            setUploadingExcel(true);
            setUploadProgress(0);
            setUploadStage("Preparing file...");

            const formData = new FormData();
            formData.append("excelFile", excelFile);

            const res = await axios.post(`${API_URL}/bulk-opening-stock`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },

                onUploadProgress: (progressEvent) => {
                    if (!progressEvent.total) return;

                    const percent = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );

                    setUploadProgress(percent);

                    if (percent < 100) {
                        setUploadStage("Uploading file...");
                    } else {
                        setUploadStage("Processing Excel on server...");
                    }
                },
            });

            toast.success(
                `Created ${res.data.createdCount || 0}, Updated ${res.data.updatedCount || 0
                }, Skipped ${res.data.skippedCount || 0}`
            );

            setExcelFile(null);
            setUploadStage("Refreshing item list...");
            await fetchStock();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Excel upload failed");
        } finally {
            setUploadingExcel(false);
            setTimeout(() => {
                setUploadProgress(0);
                setUploadStage("");
            }, 800);
        }
    };

    const openEditStock = (stock) => {
        setEditModal(stock);
        setEditForm({
            currentStock: stock.currentStock || 0,
            reservedStock: stock.reservedStock || 0,
            averageRate: stock.averageRate || 0,
            minimumStockLevel: stock.minimumStockLevel || 0,
            reorderLevel: stock.reorderLevel || 0,
            location: stock.location || "",
            rackNumber: stock.rackNumber || "",
        });
    };

    //Edit Function 
    const saveEditStock = async () => {
        try {
            setSavingEdit(true);

            await axios.put(`${API_URL}/update/${editModal._id}`, editForm);

            toast.success("Stock updated successfully");
            setEditModal(null);
            fetchStock();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to update stock");
        } finally {
            setSavingEdit(false);
        }
    };

    const deleteStock = async (id) => {
        if (!window.confirm("Delete this stock record?")) return;

        try {
            await axios.delete(`${API_URL}/delete/${id}`);
            toast.success("Stock deleted successfully");
            fetchStock();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to delete stock");
        }
    };

    useEffect(() => {
        fetchStock();
        fetchStores();
        fetchItems();
    }, []);

    const categories = useMemo(() => {
        return [
            "All",
            ...new Set(stocks.map((s) => s.itemRef?.category).filter(Boolean)),
        ];
    }, [stocks]);

    const filteredStocks = useMemo(() => {
        const keyword = search.toLowerCase();

        return stocks.filter((stock) => {
            const item = stock.itemRef || {};
            const store = stock.mainStoreRef || {};

            const text = [
                item.itemName,
                item.itemCode,
                item.category,
                item.subCategory,
                item.hsnCode,
                item.brand,
                item.make,
                store.storeName,
                stock.location,
                stock.rackNumber,
                stock.stockStatus,
            ]
                .join(" ")
                .toLowerCase();

            const matchSearch = text.includes(keyword);
            const matchStatus =
                statusFilter === "All" || stock.stockStatus === statusFilter;
            const matchCategory =
                categoryFilter === "All" || item.category === categoryFilter;

            return matchSearch && matchStatus && matchCategory;
        });
    }, [stocks, search, statusFilter, categoryFilter]);

    const stats = useMemo(() => {
        const totalValue = stocks.reduce(
            (sum, s) => sum + Number(s.stockValue || 0),
            0
        );

        const reservedQty = stocks.reduce(
            (sum, s) => sum + Number(s.reservedStock || 0),
            0
        );

        return {
            totalItems: stocks.length,
            totalValue,
            reservedQty,
            lowStock: stocks.filter((s) => s.stockStatus === "LOW_STOCK").length,
            outStock: stocks.filter((s) => s.stockStatus === "OUT_OF_STOCK").length,
            negative: stocks.filter((s) => s.stockStatus === "NEGATIVE_STOCK").length,
        };
    }, [stocks]);

    const totalPages = Math.max(1, Math.ceil(filteredStocks.length / itemsPerPage));

const paginatedStocks = useMemo(() => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  return filteredStocks.slice(startIndex, startIndex + itemsPerPage);
}, [filteredStocks, currentPage, itemsPerPage]);

useEffect(() => {
  setCurrentPage(1);
}, [search, statusFilter, categoryFilter, itemsPerPage]);

    const statusClass = (status) => {
        switch (status) {
            case "AVAILABLE":
                return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
            case "LOW_STOCK":
                return "bg-amber-500/15 text-amber-300 border-amber-500/30";
            case "OUT_OF_STOCK":
                return "bg-slate-500/15 text-slate-300 border-slate-500/30";
            case "NEGATIVE_STOCK":
                return "bg-red-500/15 text-red-300 border-red-500/30";
            default:
                return "bg-slate-500/15 text-slate-300 border-slate-500/30";
        }
    };

    const StatCard = ({ title, value, icon: Icon, tone, onClick }) => (
        <div onClick={onClick}   className={`rounded-2xl border border-slate-800 bg-slate-900/80 p-5 text-left shadow-lg shadow-slate-950/30 transition ${
      onClick ? "cursor-pointer hover:-translate-y-1 hover:border-cyan-500/40 hover:bg-slate-900" : ""
    }`}
    >
            <div className="flex items-center justify-between" >
                <div>
                    <p className="text-sm text-slate-400">{title}</p>
                    <h2 className={`mt-2 text-1xl font-bold ${tone}`}>{value}</h2>
                </div>
                <div className="rounded-2xl bg-slate-800 p-3">
                    <Icon size={16} className={tone} />
                </div>
            </div>
        </div>
    );
    function TableSkeleton({ rows = 8, columns = 9 }) {
        return (
            <>
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <tr key={rowIndex} className="animate-pulse border-b border-slate-800">
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <td key={colIndex} className="px-5 py-4">
                                <div
                                    className={`h-4 rounded bg-slate-800 ${colIndex === 0 ? "w-48" : "w-24"
                                        }`}
                                />
                            </td>
                        ))}
                    </tr>
                ))}
            </>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5 shadow-xl shadow-slate-950/40 md:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                                <Warehouse size={14} />
                                Main Store Control
                            </div>

                            <h1 className="mt-3 text-2xl font-bold text-white md:text-3xl">
                                Main Store Live Stock
                            </h1>

                            <p className="mt-1 max-w-2xl text-sm text-slate-400">
                                Track current stock, reserved stock, available quantity, stock
                                value, rack location and low-stock alerts.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={fetchStock}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white"
                            >
                                <RefreshCcw size={17} />
                                Refresh
                            </button>
                            {/* <button
                                onClick={() => navigate('/low-stock-dashboard')}
                                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400"
                            >
                                Low Stock Dashboard
                            </button> */}

                            <button
                                onClick={() => setOpeningModal(true)}
                                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400"
                            >
                                <Plus size={18} />
                                Add Opening Stock
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
                    <StatCard
                        title="Total Items"
                        value={stats.totalItems}
                        icon={Boxes}
                        tone="text-white"
                    />
                    <StatCard
                        title="Stock Value"
                        value={`₹${stats.totalValue.toLocaleString("en-IN",{maximumFractionDigits:0})}`}
                        icon={IndianRupee}
                        tone="text-cyan-300"
                    />
                    <StatCard
                        title="Reserved Qty"
                        value={stats.reservedQty}
                        icon={Lock}
                        tone="text-blue-300"
                    />
                    <StatCard
                        title="Low Stock"
                        value={stats.lowStock}
                        icon={AlertTriangle}
                        tone="text-amber-300"
                        onClick={() => navigate('/low-stock-dashboard')}

                    />
                    <StatCard
                        title="Out Stock"
                        value={stats.outStock}
                        icon={PackageCheck}
                        tone="text-slate-300"
                    />
                    <StatCard
                        title="Negative"
                        value={stats.negative}
                        icon={AlertTriangle}
                        tone="text-red-300"

                    />
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="relative">
                            <Search
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                            />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search item, store, category, rack..."
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-cyan-500"
                            />
                        </div>

                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                        >
                            {categories.map((cat) => (
                                <option key={cat}>{cat}</option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                        >
                            <option>All</option>
                            <option>AVAILABLE</option>
                            <option>LOW_STOCK</option>
                            <option>OUT_OF_STOCK</option>
                            <option>NEGATIVE_STOCK</option>
                        </select>
                    </div>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="font-bold text-white">Bulk Main Store Opening Stock</h3>
                            <p className="text-sm text-slate-400">
                                Upload stock using storeCode and itemCode.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 md:flex-row">
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300"
                            />

                            <button
                                onClick={uploadMainStockExcel}
                                disabled={uploadingExcel}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 font-semibold text-slate-950 disabled:opacity-50"
                            >
                                {uploadingExcel ? (
                                    <>
                                        <Loader2 className="animate-spin" size={17} />
                                        {uploadProgress < 100 ? `${uploadProgress}%` : "Processing..."}
                                    </>
                                ) : (
                                    <>
                                        <Upload size={17} />
                                        Upload
                                    </>
                                )}

                            </button>
                        </div>
                        {uploadingExcel && (
                            <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 md:col-span-3">
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="font-medium text-cyan-300">{uploadStage}</span>
                                    <span className="font-bold text-cyan-300">{uploadProgress}%</span>
                                </div>

                                <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                                    <div
                                        className="h-full rounded-full bg-cyan-400 transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>

                                {uploadProgress === 100 && (
                                    <p className="mt-2 text-xs text-slate-400">
                                        File uploaded. Server is reading Excel and inserting records...
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1200px] text-sm">
                            <thead className="bg-slate-950 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-5 py-4 text-left">Item</th>
                                    <th className="px-5 py-4 text-left">Store</th>
                                    <th className="px-5 py-4 text-left">Current</th>
                                    <th className="px-5 py-4 text-left">Reserved</th>
                                    <th className="px-5 py-4 text-left">Available</th>
                                    <th className="px-5 py-4 text-left">Avg Rate</th>
                                    <th className="px-5 py-4 text-left">Value</th>
                                    <th className="px-5 py-4 text-left">Min/Reorder</th>
                                    <th className="px-5 py-4 text-left">Rack</th>
                                    <th className="px-5 py-4 text-left">Status</th>
                                    <th className="px-5 py-4 text-center">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800">
                                {loading ? (
                                    <TableSkeleton rows={8} columns={9} />

                                ) : filteredStocks.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="py-14 text-center text-slate-400">
                                            No stock found
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedStocks.map((stock) => {
                                        const item = stock.itemRef || {};
                                        const store = stock.mainStoreRef || {};

                                        return (
                                            <tr key={stock._id} className="hover:bg-slate-800/60">
                                                <td className="px-5 py-4">
                                                    <div className="font-semibold text-white">
                                                        {item.itemName || "-"}
                                                    </div>
                                                    <div className="text-xs text-cyan-300">
                                                        {item.itemCode || "-"} · {item.unit || ""}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {item.category || "-"}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 text-slate-300">
                                                    {store.storeName || "-"}
                                                    <div className="text-xs text-slate-500">
                                                        {store.storeCode || ""}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 font-semibold text-white">
                                                    {stock.currentStock || 0}
                                                </td>

                                                <td className="px-5 py-4 text-blue-300">
                                                    {stock.reservedStock || 0}
                                                </td>

                                                <td className="px-5 py-4 text-emerald-300">
                                                    {stock.availableStock || 0}
                                                </td>

                                                <td className="px-5 py-4 text-slate-300">
                                                    ₹{Number(stock.averageRate || 0).toLocaleString("en-IN",{maximumFractionDigits:0})}
                                                </td>

                                                <td className="px-5 py-4 font-semibold text-cyan-300">
                                                    ₹{Number(stock.stockValue || 0).toLocaleString("en-IN",{maximumFractionDigits:0})}
                                                </td>

                                                <td className="px-5 py-4 text-slate-300">
                                                    {stock.minimumStockLevel || 0} / {stock.reorderLevel || 0}
                                                </td>

                                                <td className="px-5 py-4 text-slate-300">
                                                    {stock.location || "-"}
                                                    <div className="text-xs text-slate-500">
                                                        {stock.rackNumber || ""}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(
                                                            stock.stockStatus
                                                        )}`}
                                                    >
                                                        {stock.stockStatus || "-"}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => openEditStock(stock)}
                                                            className="rounded-lg p-2 text-cyan-400 hover:bg-cyan-500/10"
                                                        >
                                                            <Pencil size={17} />
                                                        </button>

                                                        <button
                                                            onClick={() => deleteStock(stock._id)}
                                                            className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                                                        >
                                                            <Trash2 size={17} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                        {filteredStocks.length > 0 && (
  <div className="flex flex-col gap-3 border-t border-slate-800 px-5 py-4 md:flex-row md:items-center md:justify-between">
    <div className="text-sm text-slate-400">
      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
      {Math.min(currentPage * itemsPerPage, filteredStocks.length)} of{" "}
      {filteredStocks.length} records
    </div>

    <div className="flex flex-wrap items-center gap-3">
      <select
        value={itemsPerPage}
        onChange={(e) => {
          setItemsPerPage(Number(e.target.value));
          setCurrentPage(1);
        }}
        className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
      >
        <option value={10}>10 / page</option>
        <option value={20}>20 / page</option>
        <option value={50}>50 / page</option>
        <option value={100}>100 / page</option>
      </select>

      <button
        disabled={currentPage === 1}
        onClick={() => setCurrentPage((p) => p - 1)}
        className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 disabled:opacity-40"
      >
        Previous
      </button>

      <span className="text-sm text-slate-400">
        Page <span className="text-cyan-400 font-semibold">{currentPage}</span> of {totalPages}
      </span>

      <button
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage((p) => p + 1)}
        className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  </div>
)}
                    </div>
                </div>
            </div>
            {openingModal && (
                <OpeningStockModal
                    form={openingForm}
                    setForm={setOpeningForm}
                    stores={stores}
                    items={items}
                    onClose={() => setOpeningModal(false)}
                    onSave={saveOpeningStock}
                    saving={savingOpening}
                />
            )}
            {editModal && (
                <EditMainStockModal
                    stock={editModal}
                    form={editForm}
                    setForm={setEditForm}
                    onClose={() => setEditModal(null)}
                    onSave={saveEditStock}
                    saving={savingEdit}
                />
            )}
        </div>
    );
}



function OpeningStockModal({
    form,
    setForm,
    stores,
    items,
    onClose,
    onSave,
    saving,
}) {
    const update = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-4xl rounded-3xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                            Main Store Stock
                        </p>
                        <h2 className="text-xl font-bold text-white">Add Opening Stock</h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                            Main Store *
                        </label>
                        <select
                            name="mainStoreRef"
                            value={form.mainStoreRef}
                            onChange={update}
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
                        >
                            <option value="">Select Main Store</option>
                            {stores.map((store) => (
                                <option key={store._id} value={store._id}>
                                    {store.storeName} {store.storeCode ? `- ${store.storeCode}` : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                            Item *
                        </label>
                        <select
                            name="itemRef"
                            value={form.itemRef}
                            onChange={update}
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
                        >
                            <option value="">Select Item</option>
                            {items.map((item) => (
                                <option key={item._id} value={item._id}>
                                    {item.itemName} - {item.itemCode}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="Opening Qty *"
                        name="openingQty"
                        type="number"
                        value={form.openingQty}
                        onChange={update}
                    />

                    <Input
                        label="Rate"
                        name="rate"
                        type="number"
                        value={form.rate}
                        onChange={update}
                    />

                    <Input
                        label="Location"
                        name="location"
                        value={form.location}
                        onChange={update}
                    />

                    <Input
                        label="Rack Number"
                        name="rackNumber"
                        value={form.rackNumber}
                        onChange={update}
                    />

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                            Remarks
                        </label>
                        <textarea
                            name="remarks"
                            value={form.remarks}
                            onChange={update}
                            rows={2}
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-700 px-5 py-3 text-slate-300 hover:bg-slate-800"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
                    >
                        {saving && <Loader2 size={18} className="animate-spin" />}
                        Add Stock
                    </button>
                </div>
            </div>
        </div>
    );
}

function Input({ label, name, type = "text", value, onChange }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
                {label}
            </label>
            <input
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
            />
        </div>
    );
}

function EditMainStockModal({ stock, form, setForm, onClose, onSave, saving }) {
    const update = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const item = stock.itemRef || {};

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-4xl rounded-3xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                            Edit Main Store Stock
                        </p>
                        <h2 className="text-xl font-bold text-white">
                            {item.itemName || "Stock Item"}
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                    <StockInput label="Current Stock" name="currentStock" type="number" value={form.currentStock} onChange={update} />
                    <StockInput label="Reserved Stock" name="reservedStock" type="number" value={form.reservedStock} onChange={update} />
                    <StockInput label="Average Rate" name="averageRate" type="number" value={form.averageRate} onChange={update} />
                    <StockInput label="Minimum Stock" name="minimumStockLevel" type="number" value={form.minimumStockLevel} onChange={update} />
                    <StockInput label="Reorder Level" name="reorderLevel" type="number" value={form.reorderLevel} onChange={update} />
                    <StockInput label="Location" name="location" value={form.location} onChange={update} />
                    <StockInput label="Rack Number" name="rackNumber" value={form.rackNumber} onChange={update} />
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-700 px-5 py-3 text-slate-300 hover:bg-slate-800"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
                    >
                        {saving && <Loader2 size={18} className="animate-spin" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

function StockInput({ label, name, type = "text", value, onChange }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
                {label}
            </label>
            <input
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
            />
        </div>
    );
}