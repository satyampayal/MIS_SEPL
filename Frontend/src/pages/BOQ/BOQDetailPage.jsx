import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import axios from "axios";
import {
    Upload,
    Plus,
    Download,
    RefreshCw,
    Search,
    Eye,
    Pencil,
    Trash2,
    BarChart3,
} from "lucide-react";
import toast from "react-hot-toast";
import UploadBOQExcelModal from "../BOQ/components/UploadBOQExcelModal";
import AddBOQItemModal from "../BOQ/components/AddBOQItemModal";

import BASE_URL from '../../../config/api';
import BOQDailyPlanModal from "./components/BOQDailyPlanModal";
import TargetRecoveryPlanModal from "./components/TargetRecoveryPlanModal";

const authHeader = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
});

const formatAmount = (value) => {
    return Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 0,
    });
};

export default function BOQDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    //   console.log(id)
    const emptyItemForm = {
        boqItemCode: "",
        boqSrNo: "",
        activity: "",
        generalName: "",
        description: "",
        uom: "",
        poQty: "",
        supplyRate: "",
        installationRate: "",
        contractorInstallationRate: "",
        category: "",
        subCategory: "",
        aliasesText: "",
        remarks: "",
    };
    const [itemModal, setItemModal] = useState(false);
    const [itemMode, setItemMode] = useState("add"); // add | edit | view
    const [selectedItem, setSelectedItem] = useState(null);
    const [itemForm, setItemForm] = useState(emptyItemForm);
    const [savingItem, setSavingItem] = useState(false);

    const [boq, setBoq] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [uploadModalOpen, setUploadModalOpen] = useState(false);

    const [dailyPlanModalOpen, setDailyPlanModalOpen] = useState(false);
    const [recoveryPlanOpen, setRecoveryPlanOpen] = useState(false);
    //  console.log(BASE_URL)
    const fetchBOQDetails = async () => {
        try {
            setLoading(true);

            const boqRes = await axios.get(`${BASE_URL}/boq/${id}`);

            //   const itemRes = await axios.get(
            //     `${BASE_URL}/boq/${id}/items?search=${search}`
            //   );

            setBoq(boqRes.data?.boq || []);
            setItems(boqRes.data?.items || []);
            // console.log(boqRes);

        } catch (error) {
            toast.error(
                error?.response?.data?.message || "Failed to fetch BOQ details"
            );
        } finally {
            setLoading(false);
        }
    };

    const openAddItem = () => {
        setItemMode("add");
        setSelectedItem(null);
        setItemForm(emptyItemForm);
        setItemModal(true);
    };

    const openViewItem = (item) => {
        setItemMode("view");
        setSelectedItem(item);
        fillItemForm(item);
        setItemModal(true);
    };

    const openEditItem = (item) => {
        setItemMode("edit");
        setSelectedItem(item);
        fillItemForm(item);
        setItemModal(true);
    };

    const fillItemForm = (item) => {
        setItemForm({
            boqItemCode: item.boqItemCode || "",
            boqSrNo: item.boqSrNo || "",
            activity: item.activity || "",
            generalName: item.generalName || "",
            description: item.description || "",
            uom: item.uom || "",
            poQty: item.poQty || "",
            supplyRate: item.supplyRate || "",
            installationRate: item.installationRate || "",
            contractorInstallationRate: item.contractorInstallationRate || "",
            category: item.category || "",
            subCategory: item.subCategory || "",
            aliasesText: Array.isArray(item.aliases) ? item.aliases.join(", ") : "",
            remarks: item.remarks || "",
        });
    };
    const saveBOQItem = async () => {
        try {
            if (itemMode === "view") return;

            if (!itemForm.activity.trim() && !itemForm.description.trim()) {
                return toast.error("Activity or description is required");
            }

            if (!itemForm.poQty || Number(itemForm.poQty) <= 0) {
                return toast.error("Enter valid PO qty");
            }

            setSavingItem(true);

            const payload = {
                ...itemForm,
                poQty: Number(itemForm.poQty || 0),
                supplyRate: Number(itemForm.supplyRate || 0),
                installationRate: Number(itemForm.installationRate || 0),
                contractorInstallationRate: Number(
                    itemForm.contractorInstallationRate || 0
                ),
                aliases: itemForm.aliasesText
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean),
            };

            delete payload.aliasesText;

            if (itemMode === "edit" && selectedItem?._id) {
                await axios.put(`${BASE_URL}/boq/item/${selectedItem._id}`, payload);
                toast.success("BOQ item updated");
            } else {
                await axios.post(`${BASE_URL}/boq/${id}/item`, payload);
                toast.success("BOQ item added");
            }

            setItemModal(false);
            setSelectedItem(null);
            setItemForm(emptyItemForm);
            fetchBOQDetails();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to save BOQ item");
        } finally {
            setSavingItem(false);
        }
    };

    const deleteBOQItem = async (item) => {
        try {
            if (!item?._id) {
                return toast.error("BOQ item ID missing");
            }

            const confirmDelete = window.confirm(
                `Delete BOQ item: ${item.generalName || item.description || item.boqItemCode}?`
            );

            if (!confirmDelete) return;

            await axios.delete(`${BASE_URL}/boq/item/${item._id}`);

            toast.success("BOQ item deleted");
            fetchBOQDetails();
        } catch (error) {
            toast.error(
                error?.response?.data?.message || "Failed to delete BOQ item"
            );
        }
    };



    useEffect(() => {
        fetchBOQDetails();
    }, [id]);

    const filteredItems = items.filter((item) => {
        const value = `${item.boqItemCode} ${item.activity} ${item.generalName} ${item.description}`;
        return value.toLowerCase().includes(search.toLowerCase());
    });

    const stats = {
        totalItems: filteredItems.length,
        totalPoQty: filteredItems.reduce(
            (sum, item) => sum + Number(item.poQty || 0),
            0
        ),
        completedQty: filteredItems.reduce(
            (sum, item) => sum + Number(item.completedQty || 0),
            0
        ),
        balanceQty: filteredItems.reduce(
            (sum, item) => sum + Number(item.balanceQty || 0),
            0
        ),
        supplyAmount: filteredItems.reduce(
            (sum, item) => sum + Number(item.supplyAmount || 0),
            0
        ),
        installationAmount: filteredItems.reduce(
            (sum, item) => sum + Number(item.installationAmount || 0),
            0
        ),
        contractorAmount: filteredItems.reduce(
            (sum, item) => sum + Number(item.contractorInstallationAmount || 0),
            0
        ),
        workValue: filteredItems.reduce(
            (sum, item) => sum + Number(item.completedQty * item.installationRate || 0),
            0
        ),
    };

    const exportBOQDetailExcel = () => {
        try {
            if (!filteredItems.length) {
                return toast.error("No BOQ items available to export");
            }

            const exportRows = filteredItems.map((item, index) => {
                const poQty = Number(item.poQty || 0);
                const completedQty = Number(item.completedQty || 0);
                const balanceQty = Number(item.balanceQty ?? poQty - completedQty);
                const progress = poQty > 0 ? ((completedQty / poQty) * 100).toFixed(2) : 0;

                return {
                    "Sr No": index + 1,
                    "BOQ Code": item.boqItemCode || "",
                    "BOQ Sr.NO.": item.boqSrNo || "",
                    // "General Name": item.generalName || "",
                    "Description": item.description || "",
                    "UOM": item.uom || "",
                    "PO Qty": poQty,
                    "Completed Qty": completedQty,
                    "Balance Qty": balanceQty,
                    "Progress %": Number(progress),
                    "Supply Rate": Number(item.supplyRate || 0),
                    "Supply Amount": Number(item.supplyAmount || 0),
                    "Installation Rate": Number(item.installationRate || 0),
                    "Installation Amount": Number(item.installationAmount || 0),
                    "Contractor Rate": Number(item.contractorInstallationRate || 0),
                    "Contractor Amount": Number(item.contractorInstallationAmount || 0),
                    "Remarks": item.remarks || "",
                };
            });

            const summaryRows = [
                ["BOQ Name", boq?.boqName || boq?.title || "BOQ"],
                ["Project", boq?.projectRef?.name || boq?.projectName || "-"],
                ["Contractor", boq?.contractorRef?.contractorName || boq?.contractorName || "-"],
                ["Total Items", stats.totalItems],
                ["Total PO Qty", stats.totalPoQty],
                ["Completed Qty", stats.completedQty],
                ["Balance Qty", stats.balanceQty],
                ["Supply Amount", stats.supplyAmount],
                ["Installation Amount", stats.installationAmount],
                ["Company BOQ Amount", stats.supplyAmount + stats.installationAmount],
                ["Contractor Amount", stats.contractorAmount],
                ["Installation Done Amount", stats.workValue],
            ];

            const wb = XLSX.utils.book_new();

            const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
            const itemSheet = XLSX.utils.json_to_sheet(exportRows);

            XLSX.utils.book_append_sheet(wb, summarySheet, "BOQ Summary");
            XLSX.utils.book_append_sheet(wb, itemSheet, "BOQ Items");

            const fileName = `${boq?.boqName || "BOQ"}_Detail_Report.xlsx`
                .replace(/[\\/:*?"<>|]/g, "_");

            XLSX.writeFile(wb, fileName);

            toast.success("BOQ detail exported successfully");
        } catch (error) {
            toast.error("Failed to export BOQ detail");
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6">
            {/* Header */}
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-xl mb-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">
                            BOQ Detail
                        </p>

                        <h1 className="text-2xl font-bold text-white mt-1">
                            {boq?.boqName || boq?.title || "BOQ"}
                        </h1>

                        <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-400">
                            <span>
                                Project:{" "}
                                <b className="text-slate-200">
                                    {boq?.projectRef?.name || boq?.projectName || "-"}
                                </b>
                            </span>

                            <span>
                                Contractor:{" "}
                                <b className="text-slate-200">
                                    {boq?.contractorRef?.contractorName ||
                                        boq?.contractorName ||
                                        "-"}
                                </b>
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setUploadModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400"
                        >
                            <Upload size={17} />
                            Upload Excel
                        </button>

                        <button
                            onClick={openAddItem}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20"
                        >
                            <Plus size={17} />
                            Add Item
                        </button>
                        <button
                            onClick={() => navigate(`/boq-analytics`)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20"
                        >
                            <BarChart3 size={17} />
                            Analytics
                        </button>

                        <button
                            onClick={() => setDailyPlanModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
                        >
                            Today Plan
                        </button>
                        <button
                            onClick={() => setRecoveryPlanOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20"
                        >
                            Target Recovery
                        </button>

                        <button
                            onClick={exportBOQDetailExcel}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                        >
                            <Download size={17} />
                            Export Excel
                        </button>

                        <button
                            onClick={fetchBOQDetails}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                        >
                            <RefreshCw size={17} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
                <StatCard title="Total Items" value={formatAmount(stats.totalItems)} />
                <StatCard title="Total PO Qty" value={formatAmount(stats.totalPoQty)} />
                <StatCard title="Completed Qty" value={formatAmount(stats.completedQty)} />
                <StatCard title="Balance Qty" value={formatAmount(stats.balanceQty)} />
                <StatCard title="Supply Amount" value={`₹ ${formatAmount(stats.supplyAmount)}`} />
                <StatCard
                    title="Installation Amount"
                    value={`₹ ${formatAmount(stats.installationAmount)}`}
                />
                <StatCard
                    title="Company BOQ Amount"
                    value={`₹ ${formatAmount(
                        stats.supplyAmount + stats.installationAmount
                    )}`}
                />
                <StatCard
                    title="Contractor Amount"
                    value={`₹ ${formatAmount(stats.contractorAmount)}`}
                />
                <StatCard
                    title="Installation Done Amount"
                    value={`₹ ${formatAmount(stats.workValue)}`}
                />

            </div>

            {/* Search */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 mb-5">
                <div className="relative">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search BOQ code, activity, general name, description..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1300px] text-sm">
                        <thead className="bg-slate-950 text-slate-400">
                            <tr>
                                <th className="px-4 py-3 text-left">Code</th>
                                <th className="px-4 py-3 text-left">Activity</th>
                                <th className="px-4 py-3 text-left">General Name</th>
                                <th className="px-4 py-3 text-left">Description</th>
                                <th className="px-4 py-3 text-left">UOM</th>
                                <th className="px-4 py-3 text-right">PO Qty</th>
                                <th className="px-4 py-3 text-right">Supply Rate</th>
                                <th className="px-4 py-3 text-right">Supply Amt</th>
                                <th className="px-4 py-3 text-right">Install Rate</th>
                                <th className="px-4 py-3 text-right">Install Amt</th>
                                <th className="px-4 py-3 text-right">Completed</th>
                                <th className="px-4 py-3 text-right">Balance</th>
                                <th className="px-4 py-3 text-right">Contractor Amt</th>
                                <th className="px-4 py-3 text-center">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="14" className="px-4 py-10 text-center text-slate-500">
                                        Loading BOQ items...
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan="14" className="px-4 py-10 text-center text-slate-500">
                                        No BOQ items found
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => (
                                    <tr
                                        key={item._id}
                                        className="border-t border-slate-800 hover:bg-slate-800/40"
                                    >
                                        <td className="px-4 py-3 text-cyan-300">
                                            {item.boqItemCode || "-"}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {item.activity || "-"}
                                        </td>

                                        <td className="px-4 py-3 text-white font-medium">
                                            {item.generalName || "-"}
                                        </td>

                                        <td className="px-4 py-3 text-slate-400 max-w-[350px] truncate">
                                            {item.description || "-"}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {item.uom || "-"}
                                        </td>

                                        <td className="px-4 py-3 text-right">
                                            {formatAmount(item.poQty) || 0}
                                        </td>

                                        <td className="px-4 py-3 text-right">
                                            ₹ {formatAmount(item.supplyRate)}
                                        </td>

                                        <td className="px-4 py-3 text-right text-emerald-300">
                                            ₹ {formatAmount(item.supplyAmount)}
                                        </td>

                                        <td className="px-4 py-3 text-right">
                                            ₹ {formatAmount(item.installationRate)}
                                        </td>

                                        <td className="px-4 py-3 text-right text-cyan-300">
                                            ₹ {formatAmount(item.installationAmount)}
                                        </td>

                                        <td className="px-4 py-3 text-right">
                                            {item.completedQty || 0}
                                        </td>

                                        <td className="px-4 py-3 text-right text-amber-300">
                                            {formatAmount(item.balanceQty) || 0}
                                        </td>

                                        <td className="px-4 py-3 text-right text-purple-300">
                                            ₹ {formatAmount(item.contractorInstallationAmount)}
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openViewItem(item)}
                                                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                <button
                                                    onClick={() => openEditItem(item)}
                                                    className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300"
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    onClick={() => deleteBOQItem(item)}
                                                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {uploadModalOpen && boq && (
                <UploadBOQExcelModal
                    boq={boq}
                    onClose={() => setUploadModalOpen(false)}
                    onSuccess={() => {
                        setUploadModalOpen(false);
                        fetchBOQDetails();
                    }}
                />
            )}
            {itemModal && (
                <AddBOQItemModal
                    form={itemForm}
                    setForm={setItemForm}
                    saving={savingItem}
                    onClose={() => {
                        setItemModal(false);
                        setSelectedItem(null);
                    }}
                    onSave={saveBOQItem}
                    mode={itemMode}
                />
            )}

            {dailyPlanModalOpen && (
                <BOQDailyPlanModal
                    boq={boq}
                    items={filteredItems}
                    onClose={() => setDailyPlanModalOpen(false)}
                />
            )}

            {recoveryPlanOpen && (
                <TargetRecoveryPlanModal
                    boq={boq}
                    items={filteredItems}
                    onClose={() => setRecoveryPlanOpen(false)}
                />
            )}
        </div>
    );
}

function StatCard({ title, value }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-4">
            <p className="text-sm text-slate-400">{title}</p>
            <h3 className="text-xl font-bold text-white mt-2">
                {/* {Number(value || 0).toFixed(2)} */}
                {value}
            </h3>
        </div>
    );
}