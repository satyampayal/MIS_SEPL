import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Building2,
    Search,
    RefreshCcw,
    Loader2,
    PackageCheck,
    AlertTriangle,
    IndianRupee,
    Boxes,
    RotateCcw,
    Hammer,
    ShieldAlert,
    X,
    Plus,
    Eye,
    Pencil
} from "lucide-react";
import BASE_URL from "../../config/api";
import * as XLSX from "xlsx";


const API_URL = `${BASE_URL}/site-store-stock`;
const PROJECT_API = `${BASE_URL}/project-master/all`;
const ITEM_API = `${BASE_URL}/item-identity`;


const emptySiteOpeningStock = {
    siteRef: "",
    itemRef: "",
    receivedTillDate: "",
    consumedTillDate: "",
    returnedTillDate: "",
    damagedTillDate: "",
    rate: "",
    location: "",
    remarks: "",
};

export default function SiteStoreLiveStockPage() {
    const [stocks, setStocks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [siteFilter, setSiteFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");

    const [items, setItems] = useState([]);
    const [openingModal, setOpeningModal] = useState(false);
    const [openingForm, setOpeningForm] = useState(emptySiteOpeningStock);
    const [savingOpening, setSavingOpening] = useState(false);

    const [modalMode, setModalMode] = useState("add"); // add | view | edit
    const [selectedStockId, setSelectedStockId] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [excelFile, setExcelFile] = useState(null);
    const [uploadingExcel, setUploadingExcel] = useState(false);
    const [exportExcel, setExportExcel] = useState(false);

    const fetchProjects = async () => {
        try {
            const res = await axios.get(PROJECT_API);
            setProjects(res.data.data || []);
        } catch {
            toast.error("Failed to load projects");
        }
    };

    const fetchStock = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/live-stock`);
            setStocks(res.data.data || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to load site stock");
        } finally {
            setLoading(false);
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

    const saveSiteOpeningStock = async (type) => {
        //type-> add or update
        // const type=type;
        if (!openingForm.siteRef) return toast.error("Select site");
        if (!openingForm.itemRef) return toast.error("Select item");

        if (Number(openingForm.receivedTillDate) <= 0) {
            return toast.error("Received till date must be greater than 0");
        }

        const received = Number(openingForm.receivedTillDate || 0);
        const consumed = Number(openingForm.consumedTillDate || 0);
        const returned = Number(openingForm.returnedTillDate || 0);
        const damaged = Number(openingForm.damagedTillDate || 0);

        if (consumed + returned + damaged > received) {
            return toast.error("Consumed + returned + damaged cannot exceed received");
        }

        try {
            setSavingOpening(true);

            await axios.post(`${API_URL}/${type}-opening-stock`, {
                ...openingForm,
                receivedTillDate: received,
                consumedTillDate: consumed,
                returnedTillDate: returned,
                damagedTillDate: damaged,
                rate: Number(openingForm.rate || 0),
            });

            toast.success("Site opening stock added");
            setOpeningModal(false);
            setOpeningForm(emptySiteOpeningStock);
            fetchStock();
        } catch (error) {
            toast.error(
                error?.response?.data?.message || "Failed to add site opening stock"
            );
        } finally {
            setSavingOpening(false);
        }
    };
    useEffect(() => {
        fetchProjects();
        fetchItems();
        fetchStock();
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
            const site = stock.siteRef || {};

            const siteId = site._id || stock.siteRef;

            const text = [
                item.itemName,
                item.itemCode,
                item.category,
                item.subCategory,
                item.hsnCode,
                item.brand,
                item.make,
                site.projectName,
                site.name,
                site.location,
                stock.location,
                stock.stockStatus,
            ]
                .join(" ")
                .toLowerCase();

            const matchSearch = text.includes(keyword);
            const matchStatus =
                statusFilter === "All" || stock.stockStatus === statusFilter;
            const matchCategory =
                categoryFilter === "All" || item.category === categoryFilter;
            const matchSite = siteFilter === "All" || siteId === siteFilter;

            return matchSearch && matchStatus && matchCategory && matchSite;
        });
    }, [stocks, search, statusFilter, categoryFilter, siteFilter]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredStocks.length / itemsPerPage)
    );

    const paginatedStocks = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredStocks.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredStocks, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, siteFilter, statusFilter, categoryFilter, itemsPerPage]);

    const stats = useMemo(() => {
        const formatValue = (qty, rate) =>
            Number(qty || 0) * Number(rate || 0);

        return filteredStocks.reduce(
            (acc, s) => {
                const rate = Number(s.averageRate || 0);

                const currentValue = formatValue(s.currentStock, rate);
                const consumedValue = formatValue(s.consumedQty, rate);
                const returnedValue = formatValue(s.returnedQty, rate);
                const damagedValue = formatValue(s.damagedQty, rate);

                acc.totalItems += 1;

                acc.currentStockValue += currentValue;
                acc.consumedValue += consumedValue;
                acc.returnedValue += returnedValue;
                acc.damagedValue += damagedValue;

                // Business main value
                acc.netInvestedValue += currentValue + consumedValue + damagedValue;

                // Only for reference
                acc.grossMaterialValue +=
                    currentValue + consumedValue + returnedValue + damagedValue;

                acc.consumedQty += Number(s.consumedQty || 0);
                acc.returnedQty += Number(s.returnedQty || 0);
                acc.damagedQty += Number(s.damagedQty || 0);

                if (s.stockStatus === "LOW_STOCK") acc.lowStock += 1;
                if (s.stockStatus === "NEGATIVE_STOCK") acc.negative += 1;

                return acc;
            },
            {
                totalItems: 0,
                currentStockValue: 0,
                consumedValue: 0,
                returnedValue: 0,
                damagedValue: 0,
                netInvestedValue: 0,
                grossMaterialValue: 0,
                consumedQty: 0,
                returnedQty: 0,
                damagedQty: 0,
                lowStock: 0,
                negative: 0,
            }
        );
    }, [filteredStocks]);

    const formatMoney = (value) =>
        `₹${Number(value || 0).toLocaleString("en-IN", {
            maximumFractionDigits: 0,
        })}`;

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

    const uploadSiteOpeningExcel = async () => {
        if (!excelFile) return toast.error("Select Excel file first");

        try {
            setUploadingExcel(true);
            // setExportExcel(true);

            const formData = new FormData();
            formData.append("excelFile", excelFile);

            const res = await axios.post(
                `${API_URL}/bulk-opening-stock`,
                formData
            );

            toast.success(
                `Created ${res.data.createdCount || 0}, Updated ${res.data.updatedCount || 0
                }, Skipped ${res.data.skippedCount || 0}`
            );

            setExcelFile(null);

            fetchStock();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Excel upload failed");
        } finally {
            setUploadingExcel(false);
            // setExportExcel(false);

        }
    };

    const openAddModal = () => {
        setModalMode("add");
        setSelectedStockId(null);
        setOpeningForm(emptySiteOpeningStock);
        setOpeningModal(true);
    };

    const fillStockForm = (stock, mode) => {
        setModalMode(mode);
        setSelectedStockId(stock._id);

        const itemObj = stock.itemRef || {};
        const siteObj = stock.siteRef || {};

        if (itemObj?._id) {
            setItems((prev) => {
                const exists = prev.some((item) => item._id === itemObj._id);
                return exists ? prev : [itemObj, ...prev];
            });
        }

        if (siteObj?._id) {
            setProjects((prev) => {
                const exists = prev.some((project) => project._id === siteObj._id);
                return exists ? prev : [siteObj, ...prev];
            });
        }


        setOpeningForm({
            siteRef: stock.siteRef?._id || stock.siteRef || "",
            itemRef: stock.itemRef?._id || stock.itemRef || "",
            receivedTillDate:
                stock.currentStock + stock.consumedQty + stock.returnedQty + stock.damagedQty || "",
            consumedTillDate: stock.consumedQty || "",
            returnedTillDate: stock.returnedQty || "",
            damagedTillDate: stock.damagedQty || "",
            rate: stock.averageRate || stock.rate || "",
            location: stock.location || "",
            remarks: stock.remarks || "",
        });

        setOpeningModal(true);
    };

    const openViewModal = (stock) => fillStockForm(stock, "view");
    const openEditModal = (stock) => fillStockForm(stock, "edit");
console.log(filteredStocks)
    // Export Repected Stock of Site
    const handleExportSiteStock = () => {
        try {
            setExportExcel(true);
            console.log("Export Excel Start")

            const exportData = filteredStocks.map((item, index) => ({
                "S.No": index + 1,
                "Site ":    item?.siteRef?.name || item?.siteRef?.projectName  || "",
                "Item Name": item?.itemRef?.itemName || "",
                "Item Code": item?.itemRef?.itemCode || "",
                "Category ": item?.itemRef?.category || "",
                "HSN Code ": item?.itemRef?.hsnCode || "",
                "UNIT ": item?.itemRef?.unit || "",
                "Total Received ": item?.returnedQty + item?.currentStock + item?.consumedQty + item?.damagedQty || "",
                "Consumed Qty": item?.consumedQty || 0,
                "Return Qty": item?.returnedQty || 0,
                "Damaged Qty": item?.damagedQty || 0,

                "Current Stock": item?.currentStock || 0,

                //   "Created At": proj?.createdAt
                //     ? new Date(proj.createdAt).toLocaleString("en-IN")
                //     : "",
                //   "Updated At": proj?.updatedAt
                //     ? new Date(proj.updatedAt).toLocaleString("en-IN")
                //     : "",
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(workbook, worksheet, "Site Stock ");

            XLSX.writeFile(workbook, "SiteStock.xlsx");
        }
        catch (error) {

            toast.error(error || "Errror in Exporting")
        } finally {
            setExportExcel(false);
            console.log("Export Excel End")

        }




    };
    //   console.log(filteredStocks);

  const StatCard = ({ title, value, icon: Icon, tone }) => (
  <div className="group rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5 shadow-lg shadow-slate-950/40 transition hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-cyan-950/20">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </p>

        <h2 className={`mt-3 text-xl font-black ${tone}`}>
          {value}
        </h2>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-3 transition group-hover:scale-110">
        <Icon size={18} className={tone} />
      </div>
    </div>
  </div>
);



    return (
        <div className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5 shadow-xl shadow-slate-950/40 md:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                                <Building2 size={14} />
                                Site Store Control
                            </div>

                            <h1 className="mt-3 text-2xl font-bold text-white md:text-3xl">
                                Site Store Live Stock
                            </h1>

                            <p className="mt-1 max-w-2xl text-sm text-slate-400">
                                Track project-wise material received, available, reserved,
                                consumed, returned and damaged at site level.
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

                            <button
                                onClick={openAddModal}
                                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400"
                            >
                                <Plus size={18} />
                                Add Site Opening Stock
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4">
                    <StatCard
                        title="Net Site Investment"
                        value={formatMoney(stats.netInvestedValue)}
                        icon={IndianRupee}
                        tone="text-emerald-300"
                    />

                    <StatCard
                        title="Current Stock Value"
                        value={formatMoney(stats.currentStockValue)}
                        icon={PackageCheck}
                        tone="text-cyan-300"
                    />

                    <StatCard
                        title="Consumed Value"
                        value={formatMoney(stats.consumedValue)}
                        icon={Hammer}
                        tone="text-blue-300"
                    />

                    <StatCard
                        title="Damaged Loss"
                        value={formatMoney(stats.damagedValue)}
                        icon={ShieldAlert}
                        tone="text-red-300"
                    />

                    <StatCard
                        title="Returned Value"
                        value={formatMoney(stats.returnedValue)}
                        icon={RotateCcw}
                        tone="text-purple-300"
                    />

                    <StatCard
                        title="Site Items"
                        value={stats.totalItems}
                        icon={Boxes}
                        tone="text-white"
                    />

                    <StatCard
                        title="Low Stock"
                        value={stats.lowStock}
                        icon={AlertTriangle}
                        tone="text-amber-300"
                    />

                    <StatCard
                        title="Negative"
                        value={stats.negative}
                        icon={AlertTriangle}
                        tone="text-red-300"
                    />
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="font-bold text-white">Bulk Site Opening Stock || This Setion Remove after all site stock Uploads</h3>
                            <p className="text-sm text-slate-400">
                                Upload old site stock using projectCode and itemCode.
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
                                onClick={uploadSiteOpeningExcel}
                                disabled={uploadingExcel || exportExcel}
                                className="rounded-xl bg-emerald-500 px-5 py-2.5 font-semibold text-slate-950 disabled:opacity-50"
                            >
                                {uploadingExcel ? "Uploading..." : "Upload Excel"}
                            </button>
                            <button
                                onClick={handleExportSiteStock}
                                disabled={uploadingExcel || exportExcel}
                                className="rounded-xl bg-emerald-500 px-5 py-2.5 font-semibold text-slate-950 disabled:opacity-50"
                            >
                                {exportExcel ? "Exporting..." : "Export Excel"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div className="relative">
                            <Search
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                            />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search site, item, category..."
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-cyan-500"
                            />
                        </div>

                        <select
                            value={siteFilter}
                            onChange={(e) => setSiteFilter(e.target.value)}
                            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                        >
                            <option value="All">All Sites</option>
                            {projects.map((project) => (
                                <option key={project._id} value={project._id}>
                                    {project.projectName || project.name}
                                </option>
                            ))}
                        </select>

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

                <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1350px] text-sm">
                            <thead className="bg-slate-950 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-5 py-4 text-left">Site</th>
                                    <th className="px-5 py-4 text-left">Item</th>
                                    <th className="px-5 py-4 text-left">Current</th>
                                    <th className="px-5 py-4 text-left">Reserved</th>
                                    <th className="px-5 py-4 text-left">Available</th>
                                    <th className="px-5 py-4 text-left">Consumed</th>
                                    <th className="px-5 py-4 text-left">Returned</th>
                                    <th className="px-5 py-4 text-left">Damaged</th>
                                    <th className="px-5 py-4 text-left">Avg Rate</th>
                                    <th className="px-5 py-4 text-left">Value</th>
                                    {/* <th className="px-5 py-4 text-left">Location</th> */}
                                    <th className="px-5 py-4 text-left">Status</th>
                                    <th className="px-5 py-4 text-center">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan="13" className="py-14 text-center text-slate-400">
                                            <Loader2 className="mx-auto mb-2 animate-spin" />
                                            Loading site stock...
                                        </td>
                                    </tr>
                                ) : filteredStocks.length === 0 ? (
                                    <tr>
                                        <td colSpan="13" className="py-14 text-center text-slate-400">
                                            No site stock found
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedStocks.map((stock) => {
                                        const item = stock.itemRef || {};
                                        const site = stock.siteRef || {};

                                        return (
                                            <tr key={stock._id} className="hover:bg-slate-800/60">
                                                <td className="px-5 py-4 text-slate-300">
                                                    <div className="font-semibold text-white">
                                                        {site.projectName || site.name || "-"}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {site.location || ""}
                                                    </div>
                                                </td>

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

                                                <td className="px-5 py-4 font-semibold text-white">
                                                    {stock.currentStock || 0}
                                                </td>

                                                <td className="px-5 py-4 text-blue-300">
                                                    {stock.reservedStock || 0}
                                                </td>

                                                <td className="px-5 py-4 text-emerald-300">
                                                    {stock.availableStock || 0}
                                                </td>

                                                <td className="px-5 py-4 text-blue-300">
                                                    {stock.consumedQty || 0}
                                                </td>

                                                <td className="px-5 py-4 text-purple-300">
                                                    {stock.returnedQty || 0}
                                                </td>

                                                <td className="px-5 py-4 text-red-300">
                                                    {stock.damagedQty || 0}
                                                </td>

                                                <td className="px-5 py-4 text-slate-300">
                                                    ₹{Number(stock.averageRate || 0).toLocaleString("en-IN")}
                                                </td>

                                                <td className="px-5 py-4 font-semibold text-cyan-300">
                                                    ₹{Number(stock.stockValue || 0).toLocaleString("en-IN")}
                                                </td>

                                                {/* <td className="px-5 py-4 text-slate-300">
                                                    {stock.location || "-"}
                                                </td> */}

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
                                                            onClick={() => openViewModal(stock)}
                                                            className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-2 text-blue-300 hover:bg-blue-500/20"
                                                            title="View"
                                                        >
                                                            <Eye size={17} />
                                                        </button>

                                                        <button
                                                            onClick={() => openEditModal(stock)}
                                                            className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-amber-300 hover:bg-amber-500/20"
                                                            title="Edit"
                                                        >
                                                            <Pencil size={17} />
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

                                <div className="flex items-center gap-3">
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
                                    </select>

                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage((p) => p - 1)}
                                        className="rounded-xl border border-slate-700 px-4 py-2 disabled:opacity-40"
                                    >
                                        Previous
                                    </button>

                                    <span className="text-sm text-slate-400">
                                        Page {currentPage} of {totalPages}
                                    </span>

                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage((p) => p + 1)}
                                        className="rounded-xl border border-slate-700 px-4 py-2 disabled:opacity-40"
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
                <SiteOpeningStockModal
                    form={openingForm}
                    setForm={setOpeningForm}
                    projects={projects}
                    items={items}
                    onClose={() => setOpeningModal(false)}
                    onSave={(type) => saveSiteOpeningStock(type)}
                    saving={savingOpening}
                    mode={modalMode}
                />
            )}
        </div>
    );
}

function SiteOpeningStockModal({
    form,
    setForm,
    projects,
    items,
    onClose,
    onSave,
    saving,
    mode,
}) {
    const update = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const received = Number(form.receivedTillDate || 0);
    const consumed = Number(form.consumedTillDate || 0);
    const returned = Number(form.returnedTillDate || 0);
    const damaged = Number(form.damagedTillDate || 0);
    const liveStock = received - consumed - returned - damaged;

    const isView = mode === "view";
    const isEdit = mode === "edit";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                            Site Store Opening
                        </p>
                        <h2 className="text-xl font-bold text-white">
                            {isView
                                ? "View Site Stock"
                                : isEdit
                                    ? "Edit Site Stock"
                                    : "Add Site Opening Stock"}
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
                    <FieldSelect
                        label="Site / Project *"
                        name="siteRef"
                        value={form.siteRef}
                        onChange={update}
                        disabled={isView || isEdit}
                    >
                        <option value="">Select Site</option>
                        {projects.map((project) => (
                            <option key={project._id} value={project._id}>
                                {project.projectName || project.name}
                            </option>
                        ))}
                    </FieldSelect>

                    <FieldSelect
                        label="Item *"
                        name="itemRef"
                        value={form.itemRef}
                        onChange={update}
                        disabled={isView || isEdit}
                    >
                        <option value="">Select Item</option>
                        {items.map((item) => (
                            <option key={item._id} value={item._id}>
                                {item.itemName} - {item.itemCode}
                            </option>
                        ))}
                    </FieldSelect>

                    <FieldInput
                        label="Received Till Date *"
                        name="receivedTillDate"
                        type="number"
                        value={form.receivedTillDate}
                        onChange={update}
                        disabled={isView}
                    />

                    <FieldInput
                        label="Consumed Till Date"
                        name="consumedTillDate"
                        type="number"
                        value={form.consumedTillDate}
                        onChange={update}
                        disabled={isView}
                    />

                    <FieldInput
                        label="Returned Till Date"
                        name="returnedTillDate"
                        type="number"
                        value={form.returnedTillDate}
                        onChange={update}
                        disabled={isView}
                    />

                    <FieldInput
                        label="Damaged Till Date"
                        name="damagedTillDate"
                        type="number"
                        value={form.damagedTillDate}
                        onChange={update}
                        disabled={isView}
                    />

                    <FieldInput
                        label="Rate"
                        name="rate"
                        type="number"
                        value={form.rate}
                        onChange={update}
                        disabled={isView}
                    />

                    <FieldInput
                        label="Location"
                        name="location"
                        value={form.location}
                        onChange={update}
                        disabled={isView}
                    />

                    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 md:col-span-2">
                        <p className="text-sm text-slate-400">Calculated Live Stock</p>
                        <h3
                            className={`mt-1 text-2xl font-bold ${liveStock < 0 ? "text-red-300" : "text-cyan-300"
                                }`}
                        >
                            {Number.isNaN(liveStock) ? 0 : liveStock}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Formula: Received - Consumed - Returned - Damaged
                        </p>
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                            Remarks
                        </label>
                        <textarea
                            name="remarks"
                            value={form.remarks}
                            onChange={update}
                            rows={2}
                            disabled={isView}
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500 disabled:bg-slate-800 disabled:text-slate-500"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-700 px-5 py-3 text-slate-300 hover:bg-slate-800"
                    >
                        {isView ? "Close" : "Cancel"}
                    </button>

                    {!isView && (
                        <button
                            onClick={isEdit ? () => onSave('update') : () => onSave('add')}
                            disabled={saving || liveStock < 0}
                            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
                        >
                            {saving && <Loader2 size={18} className="animate-spin" />}
                            {isEdit ? "Update Site Stock" : " Add Site Stock"}
                        </button>
                    )}
                    {/* {
                        isEdit &&(
                            <button 
                              onClick={()=>onSave('update')}
                               disabled={saving || liveStock < 0}
                            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
                            >
                                {saving && <Loader2 size={18} className="animate-spin" />}
                                  Update Site Stock

                            </button>
                        )
                    } */}
                </div>
            </div>
        </div>
    );
}

function FieldInput({ label, name, type = "text", value, onChange, disabled = false, }) {
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
                disabled={disabled}
                className="
    w-full rounded-xl border border-slate-700
    bg-slate-900 px-4 py-3 text-white
    outline-none focus:border-cyan-500
    disabled:bg-slate-800
    disabled:text-slate-500
    disabled:border-slate-700
    disabled:cursor-not-allowed
    disabled:opacity-80
  "
            />
        </div>
    );
}

function FieldSelect({ label, name, value, onChange, children, disabled = false, }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
                {label}
            </label>
            <select
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className="
    w-full rounded-xl border border-slate-700
    bg-slate-900 px-4 py-3 text-white
    outline-none focus:border-cyan-500
    disabled:bg-slate-800
    disabled:text-slate-500
    disabled:border-slate-700
    disabled:cursor-not-allowed
    disabled:opacity-80
  "
            >
                {children}
            </select>
        </div>
    );
}