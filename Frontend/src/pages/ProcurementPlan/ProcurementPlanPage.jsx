import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Search,
    Loader2,
    ShoppingCart,
    PackageCheck,
    Truck,
    MapPin,
    RefreshCcw,
} from "lucide-react";
import BASE_URL from "../../../config/api";
import ChallanModal from "../../challan/ChallanModal";

const PROCUREMENT_API = `${BASE_URL}/procurement-plan`;

const authHeader = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
});

export default function ProcurementPlanPage() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [challanModalOpen, setChallanModalOpen] = useState(false);
    const [challanDraft, setChallanDraft] = useState(null);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${PROCUREMENT_API}/all`, authHeader());
            setPlans(res.data.data || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to load procurement plans");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);
    // console.log(plans)

    const filteredPlans = useMemo(() => {
        const keyword = search.toLowerCase();

        return plans.filter((plan) => {
            const projectName = plan.projectRef?.projectName || plan.projectRef?.name || "";

            const text = [
                plan.procurementNumber,
                plan.materialRequisitionRef?.requisitionNumber,
                projectName,
                plan.status,
                ...(plan.items || []).map((item) => `${item.itemName} ${item.itemCode}`),
            ]
                .join(" ")
                .toLowerCase();

            const matchSearch = text.includes(keyword);
            const matchStatus = statusFilter === "ALL" || plan.status === statusFilter;

            return matchSearch && matchStatus;
        });
    }, [plans, search, statusFilter]);

    const stats = useMemo(() => {
        const allItems = plans.flatMap((p) => p.items || []);

        return {
            totalPlans: plans.length,
            pending: plans.filter((p) => p.status === "PENDING").length,
            mrn: allItems.filter((i) => i.procurementMode === "MRN").length,
            ddc: allItems.filter((i) => i.procurementMode === "DDC").length,
            lpn: allItems.filter((i) => i.procurementMode === "LPN").length,
            istn: allItems.filter((i) => i.procurementMode === "ISTN").length,
        };
    }, [plans]);

    const getModeClass = (mode) => {
        if (mode === "MRN") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
        if (mode === "DDC") return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";
        if (mode === "LPN") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
        if (mode === "ISTN") return "border-purple-500/30 bg-purple-500/10 text-purple-300";
        return "border-slate-500/30 bg-slate-500/10 text-slate-300";
    };

    const updateMode = async (planId, itemId, procurementMode) => {
        try {
            await axios.put(
                `${PROCUREMENT_API}/${planId}/item/${itemId}/mode`,
                { procurementMode },
                authHeader()
            );

            toast.success("Procurement mode updated");
            fetchPlans();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to update mode");
        }
    };

    const createDocumentFromProcurement = (plan, mode) => {
        const projectId = plan.projectRef?._id || plan.projectRef;

        const modeItems = getPendingItemsByMode(plan, mode);

        if (modeItems.length === 0) {
            toast.error(`No pending ${mode} item found`);
            return;
        }

        const draft = {
            procurementPlanRef: plan._id,
            procurementItemIds: modeItems.map((item) => item._id),

            materialRequisitionRef:
                plan.materialRequisitionRef?._id || plan.materialRequisitionRef,

            projectRef: projectId,
            toSiteRef: projectId,
            projectName: plan.projectRef?.projectName || plan.projectRef?.name || "",

            documentType: mode,
            vendorName: "",

            items: modeItems.map((item) => ({
                itemRef: item.itemRef?._id || item.itemRef,
                itemName: item.itemName,
                itemCode: item.itemCode,
                unit: item.unit,
                quantity: Number(item.shortageQty || 0),
                rate: Number(item.lastPurchaseRate || 0),
                amount:
                    Number(item.shortageQty || 0) *
                    Number(item.lastPurchaseRate || 0),
            })),
        };

        setChallanDraft(draft);
        setChallanModalOpen(true);
    };

    const getExecutionClass = (status) => {
        if (status === "COMPLETED") {
            return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
        }

        if (status === "CHALLAN_CREATED") {
            return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";
        }

        if (status === "CANCELLED") {
            return "border-red-500/30 bg-red-500/10 text-red-300";
        }

        return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    };

    const getPendingItemsByMode = (plan, mode) => {
        return (plan.items || []).filter(
            (item) =>
                item.procurementMode === mode &&
                !["CHALLAN_CREATED", "COMPLETED"].includes(item.executionStatus)
        );
    };
    return (
        <div className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 shadow-xl">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                                <ShoppingCart size={14} />
                                Purchase Control
                            </div>

                            <h1 className="mt-3 text-2xl font-bold text-white md:text-3xl">
                                Procurement Plan
                            </h1>

                            <p className="mt-1 text-sm text-slate-400">
                                Track shortage items created from MRQ and decide MRN, DDC, LPN or ISTN route.
                            </p>
                        </div>

                        <button
                            onClick={fetchPlans}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white"
                        >
                            <RefreshCcw size={17} />
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-6">
                    <StatCard title="Total Plans" value={stats.totalPlans} icon={ShoppingCart} />
                    <StatCard title="Pending" value={stats.pending} icon={PackageCheck} tone="text-amber-300" />
                    <StatCard title="MRN" value={stats.mrn} icon={Truck} tone="text-emerald-300" />
                    <StatCard title="DDC" value={stats.ddc} icon={Truck} tone="text-cyan-300" />
                    <StatCard title="LPN" value={stats.lpn} icon={MapPin} tone="text-amber-300" />
                    <StatCard title="ISTN" value={stats.istn} icon={Truck} tone="text-purple-300" />
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
                                placeholder="Search procurement no, MRQ, item, project..."
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-white outline-none focus:border-amber-500"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-500"
                        >
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
                        <Loader2 className="mx-auto mb-3 animate-spin" />
                        Loading procurement plans...
                    </div>
                ) : filteredPlans.length === 0 ? (
                    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
                        No procurement plan found
                    </div>
                ) : (
                    <div className="space-y-5">
                        {filteredPlans.map((plan) => (
                            <div
                                key={plan._id}
                                className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80"
                            >
                                <div className="flex flex-col gap-3 border-b border-slate-800 px-5 py-4">

                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <h2 className="text-lg font-bold text-white">
                                                {plan.procurementNumber}
                                            </h2>

                                            <p className="text-sm text-slate-400">
                                                MRQ: {plan.materialRequisitionRef?.requisitionNumber || "-"} ·
                                                Project: {plan.projectRef?.projectName || plan.projectRef?.name || "-"}
                                            </p>
                                        </div>

                                        <span className="w-fit rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                                            {plan.status}
                                        </span>
                                    </div>

                                    {/* Mode Wise Actions */}

                                    <div className="flex flex-wrap gap-2">
                                        {["MRN", "DDC", "LPN", "ISTN"].map((mode) => {
                                            const count = getPendingItemsByMode(plan, mode).length;

                                            if (count === 0) return null;

                                            return (
                                                <button
                                                    key={mode}
                                                    onClick={() => createDocumentFromProcurement(plan, mode)}
                                                    className="rounded-lg bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20"
                                                >
                                                    Create {mode} ({count})
                                                </button>
                                            );
                                        })}
                                    </div>

                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1000px] text-sm">
                                        <thead className="bg-slate-950 text-xs uppercase text-slate-500">
                                            <tr>
                                                <th className="p-4 text-left">Item</th>
                                                <th className="p-4 text-left">Code</th>
                                                <th className="p-4 text-right">Required</th>
                                                <th className="p-4 text-right">Available</th>
                                                <th className="p-4 text-right">Shortage</th>
                                                <th className="p-4 text-left">Mode</th>
                                                <th className="p-4 text-left">Remarks</th>
                                                <th className="p-4 text-left">Execution</th>
                                                <th className="p-4 text-left">Action</th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-800">
                                            {plan.items?.map((item) => (
                                                <tr key={item._id} className="hover:bg-slate-800/50">
                                                    <td className="p-4 font-semibold text-white">
                                                        {item.itemName}
                                                        <div className="text-xs text-slate-500">{item.unit}</div>
                                                    </td>

                                                    <td className="p-4 text-cyan-300">{item.itemCode}</td>

                                                    <td className="p-4 text-right text-white">{item.requiredQty}</td>
                                                    <td className="p-4 text-right text-emerald-300">{item.availableQty}</td>
                                                    <td className="p-4 text-right font-semibold text-red-300">{item.shortageQty}</td>

                                                    <td className="p-4">
                                                        <select
                                                            value={item.procurementMode}
                                                            onChange={(e) =>
                                                                updateMode(plan._id, item._id, e.target.value)
                                                            }
                                                            className={`rounded-xl border px-3 py-2 text-sm outline-none ${getModeClass(item.procurementMode)}`}
                                                        >
                                                            <option value="MRN">MRN</option>
                                                            <option value="DDC">DDC</option>
                                                            <option value="LPN">LPN</option>
                                                            <option value="ISTN">ISTN</option>
                                                        </select>
                                                    </td>

                                                    <td className="p-4 text-slate-400">
                                                        {item.remarks || "-"}
                                                    </td>
                                                    <td className="p-4">
                                                        <span
                                                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getExecutionClass(
                                                                item.executionStatus || "PENDING"
                                                            )}`}
                                                        >
                                                            {item.executionStatus || "PENDING"}
                                                        </span>

                                                        {item.challanNumber && (
                                                            <p className="mt-2 text-xs font-semibold text-cyan-300">
                                                                {item.challanNumber}
                                                            </p>
                                                        )}
                                                    </td>

                                                    <td className="p-4">
                                                        {["CHALLAN_CREATED", "COMPLETED"].includes(item.executionStatus) ? (
                                                            <button
                                                                disabled
                                                                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-500"
                                                            >
                                                                Already Created
                                                            </button>
                                                        ) : (
                                                            // <button
                                                            //     onClick={() => createDocumentFromProcurement(plan, item)}
                                                            //     className="rounded-lg bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20"
                                                            // >
                                                            //     Create {item.procurementMode}
                                                            // </button>


                                                            <>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>


            {challanModalOpen && (
                <ChallanModal
                    isOpen={challanModalOpen}
                    onClose={() => {
                        setChallanModalOpen(false);
                        setChallanDraft(null);
                        fetchPlans();
                    }}
                    mode="rechallan"
                    challan={challanDraft}
                    refreshChallans={() => {
                        fetchPlans();
                        setChallanModalOpen(false);
                        setChallanDraft(null);
                    }}
                />
            )}
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