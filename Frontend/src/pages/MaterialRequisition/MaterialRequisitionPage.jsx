import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Plus,
    Search,
    X,
    Loader2,
    ClipboardList,
    CalendarDays,
    PackageCheck,
    AlertTriangle,
    CheckCircle2,
    Eye,
} from "lucide-react";
import BASE_URL from "../../../config/api";
import ChallanModal from "../../challan/ChallanModal";
import CreateMRQModal from './CreateMRQModal'
import { useNavigate } from "react-router-dom";

const MRQ_API = `${BASE_URL}/material-requisition`;
const PROJECT_API = `${BASE_URL}/project-master`;
const ITEM_API = `${BASE_URL}/item-identity`;

const authHeader = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
});

const emptyForm = {
    projectRef: "",
    requiredDate: "",
    priority: "NORMAL",
    purpose: "",
};

export default function MaterialRequisitionPage() {
    const navigate = useNavigate();
    const [mrqs, setMrqs] = useState([]);
    const [projects, setProjects] = useState([]);
    const [items, setItems] = useState([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [modalOpen, setModalOpen] = useState(false);
    const [itemPickerOpen, setItemPickerOpen] = useState(false);
    const [itemSearch, setItemSearch] = useState("");

    const [form, setForm] = useState(emptyForm);
    const [selectedRows, setSelectedRows] = useState([]);
    const [pickerSelectedItems, setPickerSelectedItems] = useState([]);

    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedMRQ, setSelectedMRQ] = useState(null);

    const [challanModalOpen, setChallanModalOpen] = useState(false);
    const [selectedChallan, setSelectedChallan] = useState(null);

    // const [planModalOpen, setPlanModalOpen] = useState(false);
    // const [selectedPlanMRQ, setSelectedPlanMRQ] = useState(null);
    const fetchMRQs = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${MRQ_API}/all`, authHeader());
            setMrqs(res.data.data || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to load MRQ");
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await axios.get(`${PROJECT_API}/all`, authHeader());
            setProjects(res.data.data || []);
        } catch {
            toast.error("Failed to load projects");
        }
    };

    const fetchItems = async () => {
        try {
            const res = await axios.get(`${ITEM_API}/all?limit=10000`, authHeader());
            setItems(res.data.data || []);
        } catch {
            toast.error("Failed to load items");
        }
    };

    useEffect(() => {
        fetchMRQs();
        fetchProjects();
        fetchItems();
    }, []);

    const filteredMRQs = useMemo(() => {
        const keyword = search.toLowerCase();

        return mrqs.filter((mrq) => {
            const projectName =
                mrq.projectRef?.projectName || mrq.projectRef?.name || "";

            const text = [
                mrq.requisitionNumber,
                projectName,
                mrq.priority,
                mrq.status,
                mrq.purpose,
            ]
                .join(" ")
                .toLowerCase();

            const matchSearch = text.includes(keyword);
            const matchStatus =
                statusFilter === "ALL" || mrq.status === statusFilter;

            return matchSearch && matchStatus;
        });
    }, [mrqs, search, statusFilter]);

    const stats = useMemo(() => {
        return {
            total: mrqs.length,
            submitted: mrqs.filter((x) => x.status === "SUBMITTED").length,
            approved: mrqs.filter((x) => x.status === "APPROVED").length,
            rejected: mrqs.filter((x) => x.status === "REJECTED").length,
        };
    }, [mrqs]);

    const resetModal = () => {
        setForm(emptyForm);
        setSelectedRows([]);
        setPickerSelectedItems([]);
        setItemSearch("");
    };

    const openCreateModal = () => {
        resetModal();
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        resetModal();
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const filteredItems = useMemo(() => {
        const keyword = itemSearch.trim().toLowerCase();

        const result = items.filter((item) => {
            const text = [
                item.itemName,
                item.itemCode,
                item.category,
                item.subCategory,
                item.hsnCode,
                item.brand,
                item.make,
            ]
                .join(" ")
                .toLowerCase();

            return text.includes(keyword);
        });

        return keyword ? result : result.slice(0, 20);
    }, [items, itemSearch]);

    const togglePickerItem = (item) => {
        setPickerSelectedItems((prev) => {
            const exists = prev.some((x) => x._id === item._id);

            if (exists) {
                return prev.filter((x) => x._id !== item._id);
            }

            return [...prev, item];
        });
    };

    const addSelectedItemsToMRQ = () => {
        if (pickerSelectedItems.length === 0) {
            toast.error("Select at least one item");
            return;
        }

        const existingIds = new Set(selectedRows.map((row) => row.itemRef));

        const rows = pickerSelectedItems
            .filter((item) => !existingIds.has(item._id))
            .map((item) => ({
                itemRef: item._id,
                itemName: item.itemName,
                itemCode: item.itemCode,
                unit: item.unit || "Nos",
                requiredQty: "",
                remarks: "",
            }));

        setSelectedRows((prev) => [...prev, ...rows]);
        setPickerSelectedItems([]);
        setItemPickerOpen(false);
    };

    const updateRow = (index, field, value) => {
        setSelectedRows((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const removeRow = (index) => {
        setSelectedRows((prev) => prev.filter((_, i) => i !== index));
    };

    const createMRQ = async () => {
        if (!form.projectRef) return toast.error("Select project");
        if (!form.requiredDate) return toast.error("Select required date");

        if (selectedRows.length === 0) {
            return toast.error("Select at least one item");
        }

        const invalidRow = selectedRows.find(
            (row) => Number(row.requiredQty) <= 0
        );

        if (invalidRow) {
            return toast.error(`Enter valid qty for ${invalidRow.itemName}`);
        }

        try {
            setSaving(true);

            await axios.post(
                `${MRQ_API}/create`,
                {
                    ...form,
                    items: selectedRows.map((row) => ({
                        itemRef: row.itemRef,
                        requiredQty: Number(row.requiredQty),
                        remarks: row.remarks || "",
                    })),
                },
                authHeader()
            );

            toast.success("Material requisition created");
            closeModal();
            fetchMRQs();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to create MRQ");
        } finally {
            setSaving(false);
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "APPROVED":
                return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
            case "REJECTED":
                return "border-red-500/30 bg-red-500/10 text-red-300";
            case "SUBMITTED":
                return "border-amber-500/30 bg-amber-500/10 text-amber-300";
            case "ISSUED":
                return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";
            default:
                return "border-slate-500/30 bg-slate-500/10 text-slate-300";
        }
    };

    const openViewMRQ = (mrq) => {
        setSelectedMRQ(mrq);
        setViewModalOpen(true);
    };

    const approveMRQ = async (id) => {
        if (!window.confirm("Approve this material requisition?")) return;

        try {
            await axios.put(`${MRQ_API}/approve/${id}`, {}, authHeader());
            toast.success("MRQ approved");
            fetchMRQs();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Approval failed");
        }
    };

    const rejectMRQ = async (id) => {
        const reason = window.prompt("Enter rejection reason:");

        if (!reason) return;

        try {
            await axios.put(
                `${MRQ_API}/reject/${id}`,
                { rejectionReason: reason },
                authHeader()
            );

            toast.success("MRQ rejected");
            fetchMRQs();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Reject failed");
        }
    };

    const createChallanFromMRQ = (mrq) => {
        //   console.log("MRQ ITEMS =>", mrq.items);

        const dcItems = (mrq.items || []).filter((item) => {
            const action = String(item.suggestedAction || "").trim().toUpperCase();
            const availableQty = Number(item.availableQty || 0);

            return (
                action === "DC" ||
                action === "DC_AND_PURCHASE" ||
                availableQty > 0
            );
        });

        if (dcItems.length === 0) {
            toast.error("No store-available items for challan");
            return;
        }

        const challanDraft = {
            fromMRQ: true,
            materialRequisitionRef: mrq._id,
            projectRef: mrq.projectRef?._id || mrq.projectRef,
            documentType: "DC",
            items: dcItems.map((item) => ({
                itemRef: item.itemRef?._id || item.itemRef,
                itemName: item.itemName,
                itemCode: item.itemCode,
                unit: item.unit,
                quantity:
                    item.suggestedAction === "DC_AND_PURCHASE"
                        ? Number(item.availableQty || 0)
                        : Number(item.requiredQty || 0),
                rate: 0,
                amount: 0,
            })),
        };

        //   console.log("CHALLAN DRAFT =>", challanDraft);



        setSelectedChallan(challanDraft);
        setChallanModalOpen(true);


    };

    // Open Plan mOdal
    // const openMaterialPlan = (mrq) => {
    //     setSelectedPlanMRQ(mrq);
    //     setPlanModalOpen(true);
    // };

    const exportMRQExcel = async (mrq) => {
  try {
    const res = await axios.get(`${MRQ_API}/export/${mrq._id}`, {
      ...authHeader(),
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));

    const link = document.createElement("a");
    link.href = url;
    link.download = `${mrq.requisitionNumber || "MRQ"}.xlsx`;

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);

    toast.success("MRQ Excel downloaded");
  } catch (error) {
    toast.error("Failed to download MRQ Excel "+error.message);
  }
};
    return (
        <div className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 shadow-xl shadow-slate-950/40">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                                <ClipboardList size={14} />
                                Material Planning
                            </div>

                            <h1 className="mt-3 text-2xl font-bold text-white md:text-3xl">
                                Material Requisition
                            </h1>

                            <p className="mt-1 text-sm text-slate-400">
                                Site material requirement with store availability and shortage
                                analysis.
                            </p>
                        </div>

                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
                        >
                            <Plus size={18} />
                            Create MRQ
                        </button>

                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <StatCard title="Total MRQ" value={stats.total} icon={ClipboardList} />
                    <StatCard title="Submitted" value={stats.submitted} icon={CalendarDays} tone="text-amber-300" />
                    <StatCard title="Approved" value={stats.approved} icon={CheckCircle2} tone="text-emerald-300" />
                    <StatCard title="Rejected" value={stats.rejected} icon={AlertTriangle} tone="text-red-300" />
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="relative">
                            <Search
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                            />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search MRQ, project, purpose..."
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-white outline-none focus:border-cyan-500"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
                        >
                            <option value="ALL">All Status</option>
                            <option value="SUBMITTED">Submitted</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="PARTIAL_ISSUED">Partial Issued</option>
                            <option value="ISSUED">Issued</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-sm">
                            <thead className="bg-slate-950 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-5 py-4 text-left">MRQ No.</th>
                                    <th className="px-5 py-4 text-left">Project</th>
                                    <th className="px-5 py-4 text-left">Required Date</th>
                                    <th className="px-5 py-4 text-left">Priority</th>
                                    <th className="px-5 py-4 text-left">Items</th>
                                    <th className="px-5 py-4 text-left">Shortage</th>
                                    <th className="px-5 py-4 text-left">Status</th>
                                    <th className="px-5 py-4 text-center">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="py-14 text-center text-slate-400">
                                            <Loader2 className="mx-auto mb-2 animate-spin" />
                                            Loading MRQs...
                                        </td>
                                    </tr>
                                ) : filteredMRQs.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="py-14 text-center text-slate-400">
                                            No MRQ found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMRQs.map((mrq) => {
                                        const shortageItems =
                                            mrq.items?.filter((x) => Number(x.shortageQty || 0) > 0)
                                                .length || 0;

                                        return (
                                            <tr key={mrq._id} className="hover:bg-slate-800/60">
                                                <td className="px-5 py-4 font-semibold text-white">
                                                    {mrq.requisitionNumber}
                                                </td>

                                                <td className="px-5 py-4 text-slate-300">
                                                    {mrq.projectRef?.projectName ||
                                                        mrq.projectRef?.name ||
                                                        "-"}
                                                </td>

                                                <td className="px-5 py-4 text-slate-300">
                                                    {mrq.requiredDate
                                                        ? new Date(mrq.requiredDate).toLocaleDateString(
                                                            "en-IN"
                                                        )
                                                        : "-"}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                                                        {mrq.priority}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4 text-slate-300">
                                                    {mrq.items?.length || 0}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`font-semibold ${shortageItems > 0
                                                            ? "text-red-300"
                                                            : "text-emerald-300"
                                                            }`}
                                                    >
                                                        {shortageItems}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                                                            mrq.status
                                                        )}`}
                                                    >
                                                        {mrq.status}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4 text-center">
                                                    <button
                                                        onClick={() => openViewMRQ(mrq)}
                                                        className="rounded-lg p-2 text-cyan-400 hover:bg-cyan-500/10"
                                                    >
                                                        <Eye size={17} />
                                                    </button>
                                                    {mrq.status === "SUBMITTED" && (
                                                        <>
                                                            <button
                                                                onClick={() => approveMRQ(mrq._id)}
                                                                className="rounded-lg p-2 text-emerald-400 hover:bg-emerald-500/10"
                                                                title="Approve"
                                                            >
                                                                ✓
                                                            </button>

                                                            <button
                                                                onClick={() => rejectMRQ(mrq._id)}
                                                                className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                                                                title="Reject"
                                                            >
                                                                ✕
                                                            </button>
                                                        </>
                                                    )}

                                                    {mrq.status === "APPROVED" && (
                                                        // <button
                                                        //     onClick={() => openMaterialPlan(mrq)}
                                                        //     className="rounded-lg bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20"
                                                        // >
                                                        //     Material Plan
                                                        // </button>

                                                        <button
                                                            onClick={() => navigate(`/material-requisition/${mrq._id}/plan`)}
                                                            className="rounded-lg bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20"
                                                        >
                                                            Material Plan
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => exportMRQExcel(mrq)}
                                                        className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950"
                                                    >
                                                        Export Excel
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {modalOpen && (
                <CreateMRQModal
                    form={form}
                    setForm={setForm}
                    projects={projects}
                    selectedRows={selectedRows}
                    updateRow={updateRow}
                    removeRow={removeRow}
                    onClose={closeModal}
                    onSave={createMRQ}
                    saving={saving}
                    itemPickerOpen={itemPickerOpen}
                    setItemPickerOpen={setItemPickerOpen}
                    itemSearch={itemSearch}
                    setItemSearch={setItemSearch}
                    filteredItems={filteredItems}
                    pickerSelectedItems={pickerSelectedItems}
                    togglePickerItem={togglePickerItem}
                    addSelectedItemsToMRQ={addSelectedItemsToMRQ}
                />
            )}

            {viewModalOpen && selectedMRQ && (
                <MRQViewModal
                    mrq={selectedMRQ}
                    onClose={() => setViewModalOpen(false)}
                />
            )}

            {challanModalOpen && (
                <ChallanModal
                    isOpen={challanModalOpen}
                    onClose={() => setChallanModalOpen(false)}
                    mode="rechallan"
                    challan={selectedChallan}
                    refreshChallans={fetchMRQs}
                />
            )}

            {/* {planModalOpen && selectedPlanMRQ && (
                <MaterialPlanModal
                    mrq={selectedPlanMRQ}
                    onClose={() => setPlanModalOpen(false)}
                />
            )} */}
        </div>
    );
}





function Input({ label, name, value, onChange, type = "text" }) {
    return (
        <div>
            <label className="mb-2 block text-sm text-slate-300">{label}</label>
            <input
                name={name}
                value={value}
                onChange={onChange}
                type={type}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
            />
        </div>
    );
}

function StatCard({ title, value, icon: Icon, tone = "text-white" }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-400">{title}</p>
                    <h2 className={`mt-2 text-2xl font-bold ${tone}`}>{value}</h2>
                </div>
                <div className="rounded-2xl bg-slate-800 p-3">
                    <Icon size={20} className={tone} />
                </div>
            </div>
        </div>
    );
}


function MRQViewModal({ mrq, onClose }) {
    const getActionClass = (action) => {
        if (action === "DC") {
            return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
        }

        if (action === "DC_AND_PURCHASE") {
            return "border-amber-500/30 bg-amber-500/10 text-amber-300";
        }

        return "border-red-500/30 bg-red-500/10 text-red-300";
    };
// console.log(mrq)
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4">
            <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                            MRQ Detail
                        </p>
                        <h2 className="text-xl font-bold text-white">
                            {mrq.requisitionNumber}
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            {mrq.projectRef?.projectName || mrq.projectRef?.name || "-"}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="grid gap-4 border-b border-slate-800 p-5 md:grid-cols-4">
                    <InfoCard title="Status" value={mrq.status} />
                    <InfoCard title="Priority" value={mrq.priority} />
                    <InfoCard
                        title="Required Date"
                        value={
                            mrq.requiredDate
                                ? new Date(mrq.requiredDate).toLocaleDateString("en-IN")
                                : "-"
                        }
                    />
                    <InfoCard title="Total Items" value={mrq.items?.length || 0} />
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {mrq.purpose && (
                        <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                            <p className="text-sm text-slate-400">Purpose</p>
                            <p className="mt-1 text-white">{mrq.purpose}</p>
                        </div>
                    )}

                    <div className="overflow-hidden rounded-2xl border border-slate-800">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px] text-sm">
                                <thead className="bg-slate-950 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="p-4 text-left">Item</th>
                                        <th className="p-4 text-left">Code</th>
                                        <th className="p-4 text-right">Required</th>
                                        <th className="p-4 text-right">Available</th>
                                        <th className="p-4 text-right">Shortage</th>
                                        <th className="p-4 text-left">Suggested Action</th>
                                        <th className="p-4 text-left">Remarks</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-800">
                                    {mrq.items?.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-900">
                                            <td className="p-4 font-semibold text-white">
                                                {item.itemName || "-"}
                                                <div className="text-xs text-slate-500">
                                                    {item.unit || ""}
                                                </div>
                                            </td>

                                            <td className="p-4 text-cyan-300">
                                                {item.itemCode || "-"}
                                            </td>

                                            <td className="p-4 text-right text-white">
                                                {item.requiredQty || 0}
                                            </td>

                                            <td className="p-4 text-right text-emerald-300">
                                                {item.availableQty || 0}
                                            </td>

                                            <td className="p-4 text-right font-semibold text-red-300">
                                                {item.shortageQty || 0}
                                            </td>

                                            <td className="p-4">
                                                <span
                                                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${getActionClass(
                                                        item.suggestedAction
                                                    )}`}
                                                >
                                                    {item.suggestedAction}
                                                </span>
                                            </td>

                                            <td className="p-4 text-slate-400">
                                                {item.remarks || "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end border-t border-slate-800 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-700 px-5 py-3 text-slate-300 hover:bg-slate-800"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function InfoCard({ title, value }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">{title}</p>
            <h3 className="mt-1 font-bold text-white">{value}</h3>
        </div>
    );
}

// Material Plan Modal


/*
function MaterialPlanModal({ mrq, onClose }) {
    const availableItems = (mrq.items || []).filter(
        (item) => Number(item.availableQty || 0) >= Number(item.requiredQty || 0)
    );

    const partialItems = (mrq.items || []).filter(
        (item) =>
            Number(item.availableQty || 0) > 0 &&
            Number(item.availableQty || 0) < Number(item.requiredQty || 0)
    );

    const purchaseItems = (mrq.items || []).filter(
        (item) => Number(item.availableQty || 0) <= 0
    );

    const createDcForAvailable = () => {
        const dcItems = [...availableItems, ...partialItems].map((item) => ({
            itemRef: item.itemRef?._id || item.itemRef,
            itemName: item.itemName,
            itemCode: item.itemCode,
            unit: item.unit,
            quantity:
                Number(item.availableQty || 0) >= Number(item.requiredQty || 0)
                    ? Number(item.requiredQty || 0)
                    : Number(item.availableQty || 0),
            rate: 0,
            amount: 0,
        }));

        if (dcItems.length === 0) {
            toast.error("No available stock item for DC");
            return;
        }

        console.log("DC ITEMS FROM MRQ =>", dcItems);

        toast.success("DC item plan ready. Next we connect Challan modal.");
    };

    const createPurchaseRequest = () => {
        const prItems = [...partialItems, ...purchaseItems].map((item) => ({
            itemRef: item.itemRef?._id || item.itemRef,
            itemName: item.itemName,
            itemCode: item.itemCode,
            unit: item.unit,
            requiredQty: Number(item.requiredQty || 0),
            availableQty: Number(item.availableQty || 0),
            shortageQty:
                Number(item.shortageQty || 0) ||
                Math.max(
                    Number(item.requiredQty || 0) - Number(item.availableQty || 0),
                    0
                ),
        }));

        if (prItems.length === 0) {
            toast.error("No shortage item for purchase");
            return;
        }

        console.log("PURCHASE ITEMS FROM MRQ =>", prItems);

        toast.success("Purchase requirement plan ready. PR module is next.");
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4">
            <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-purple-300">
                            Material Planning
                        </p>
                        <h2 className="text-xl font-bold text-white">
                            Plan for {mrq.requisitionNumber}
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            {mrq.projectRef?.projectName || mrq.projectRef?.name || "-"}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="grid gap-4 border-b border-slate-800 p-5 md:grid-cols-3">
                    <PlanSummaryCard
                        title="Available for DC"
                        value={availableItems.length}
                        tone="text-emerald-300"
                    />

                    <PlanSummaryCard
                        title="Partial DC + Purchase"
                        value={partialItems.length}
                        tone="text-amber-300"
                    />

                    <PlanSummaryCard
                        title="Need Purchase"
                        value={purchaseItems.length}
                        tone="text-red-300"
                    />
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto p-5">
                    <PlanSection
                        title="Available Items"
                        subtitle="These items can be issued from main store through DC."
                        items={availableItems}
                        badge="DC"
                        badgeClass="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    />

                    <PlanSection
                        title="Partially Available Items"
                        subtitle="Available quantity can go by DC, shortage should go to purchase."
                        items={partialItems}
                        badge="DC + PURCHASE"
                        badgeClass="border-amber-500/30 bg-amber-500/10 text-amber-300"
                    />

                    <PlanSection
                        title="Not Available Items"
                        subtitle="These items should be forwarded to purchase."
                        items={purchaseItems}
                        badge="PURCHASE"
                        badgeClass="border-red-500/30 bg-red-500/10 text-red-300"
                    />
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-800 px-6 py-4 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-slate-400">
                        This plan separates store dispatch and purchase shortage.
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={createPurchaseRequest}
                            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 font-semibold text-amber-300 hover:bg-amber-500/20"
                        >
                            Create Purchase Plan
                        </button>

                        <button
                            onClick={createDcForAvailable}
                            className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
                        >
                            Create DC Plan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PlanSummaryCard({ title, value, tone }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">{title}</p>
            <h3 className={`mt-2 text-2xl font-bold ${tone}`}>{value}</h3>
        </div>
    );
}

function PlanSection({ title, subtitle, items, badge, badgeClass }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
            <div className="border-b border-slate-800 px-5 py-4">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="font-bold text-white">{title}</h3>
                        <p className="text-sm text-slate-400">{subtitle}</p>
                    </div>

                    <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                        {badge}
                    </span>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="p-6 text-center text-slate-500">No items</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-sm">
                        <thead className="bg-slate-950 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="p-4 text-left">Item</th>
                                <th className="p-4 text-left">Code</th>
                                <th className="p-4 text-right">Required</th>
                                <th className="p-4 text-right">Available</th>
                                <th className="p-4 text-right">Shortage</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-800">
                            {items.map((item, index) => (
                                <tr key={index} className="hover:bg-slate-800/50">
                                    <td className="p-4 font-semibold text-white">
                                        {item.itemName || "-"}
                                        <div className="text-xs text-slate-500">
                                            {item.unit || ""}
                                        </div>
                                    </td>

                                    <td className="p-4 text-cyan-300">
                                        {item.itemCode || "-"}
                                    </td>

                                    <td className="p-4 text-right text-white">
                                        {item.requiredQty || 0}
                                    </td>

                                    <td className="p-4 text-right text-emerald-300">
                                        {item.availableQty || 0}
                                    </td>

                                    <td className="p-4 text-right font-semibold text-red-300">
                                        {item.shortageQty || 0}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

*/