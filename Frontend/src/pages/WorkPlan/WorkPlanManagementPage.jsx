
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
    CalendarDays,
    ClipboardList,
    RefreshCw,
    Plus,
    Send,
    CheckCircle2,
    XCircle,
    BarChart3,
    CalendarRange,
    Search,
    Save,
    Eye,
    Clock3,
    Printer,
    Building2,
    FileText,
    TrendingUp,
    MapPin,
    Users,
    Layers3,
} from "lucide-react";

import BASE_URL from "../../../config/api";
import WorkPlanExecutiveSummary from "./WorkPlanExecutiveSummary";

const API = `${BASE_URL}/work-plans`;
const PROJECT_API = `${BASE_URL}/project-master/all`;
const BOQ_API = `${BASE_URL}/boq`;


const authHeader = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
});

const currentMonth = () => new Date().toISOString().slice(0, 7);
const today = () => new Date().toISOString().slice(0, 10);

const emptyPlan = {
    projectRef: "",
    boqRef: "",
    planName: "",
    planStartDate: `${currentMonth()}-01`,
    planEndDate: `${currentMonth()}-${new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0
    ).getDate().toString().padStart(2, "0")}`,
    planDescription: "",
    planItemList: [],
};

const cn = (...classes) => classes.filter(Boolean).join(" ");

const formatQty = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
    });

const obliqueFormat = (items) => {
    const totalitems = items.length;

}

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })
        : "—";

const formatPercent = (value) =>
    value == null || !Number.isFinite(Number(value))
        ? "—"
        : `${Number(value).toFixed(1)}%`;

const formatReportDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const getItemMBEntries = (item) => {
    const breakup = item?.dailyBreakup || [];

    // Supports the dailyBreakup array returned by the report controller.
    if (!Array.isArray(breakup)) return [];

    return breakup.flatMap((day) =>
        (day.entries || []).map((entry) => ({
            ...entry,
            _reportDate: entry.measurementDate || day.date,
        }))
    );
};

function ReportMetric({ label, value, helper, tone = "slate" }) {
    const tones = {
        slate: "text-slate-900",
        green: "text-emerald-700",
        amber: "text-amber-700",
        blue: "text-blue-700",
        red: "text-rose-700",
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className={`mt-2 text-2xl font-bold ${tones[tone] || tones.slate}`}>
                {value}
            </p>
            {helper && (
                <p className="mt-1 text-xs text-slate-500">{helper}</p>
            )}
        </div>
    );
}

const statusStyles = {
    DRAFT: "bg-slate-700/60 text-slate-300",
    SUBMITTED: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    APPROVED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    REJECTED: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    REVISION_REQUESTED: "bg-orange-500/10 text-orange-300 border-orange-500/20",
    CLOSED: "bg-purple-500/10 text-purple-300 border-purple-500/20",
};

function StatusBadge({ status }) {
    return (
        <span
            className={cn(
                "inline-flex rounded-full border border-transparent px-3 py-1 text-xs font-semibold",
                statusStyles[status] || statusStyles.DRAFT
            )}
        >
            {(status || "DRAFT").replaceAll("_", " ")}
        </span>
    );
}

function StatCard({ icon: Icon, label, value, helper }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{label}</span>
                <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-300">
                    <Icon size={18} />
                </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-white">{value}</div>
            {helper && (
                <p className="mt-1 text-xs text-slate-500">{helper}</p>
            )}
        </div>
    );
}

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">
                {label}
            </span>
            {children}
        </label>
    );
}

const inputClass =
    "w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500";

export default function WorkPlanManagementPage() {
    const [projects, setProjects] = useState([]);
    const [boqs, setBoqs] = useState([]);
    const [boqItems, setBoqItems] = useState([]);
    const [plans, setPlans] = useState([]);

    const [selectedProject, setSelectedProject] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const [savingPlan, setSavingPlan] = useState(false);
    const [planForm, setPlanForm] = useState(emptyPlan);

    const [activeTab, setActiveTab] = useState("plans");
    const [reviewingId, setReviewingId] = useState("");
    const [reviewRemarks, setReviewRemarks] = useState("");

    const [schedulePlan, setSchedulePlan] = useState(null);
    const [scheduleMonth, setScheduleMonth] = useState(currentMonth());
    const [scheduleRows, setScheduleRows] = useState([]);
    const [scheduleLoading, setScheduleLoading] = useState(false);
    const [scheduleSaving, setScheduleSaving] = useState(false);

    const [reportMonth, setReportMonth] = useState(currentMonth());
    const [report, setReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);

    const fetchProjects = async () => {
        try {
            const res = await axios.get(PROJECT_API, authHeader());
            setProjects(res.data.data || []);
        } catch (error) {
            toast.error(
                error?.response?.data?.message || "Failed to load projects"
            );
        }
    };

    const fetchPlans = async () => {
        try {
            setLoading(true);

            const params = {};
            if (selectedProject) params.projectRef = selectedProject;
            if (statusFilter) params.status = statusFilter;

            const res = await axios.get(API, {
                ...authHeader(),
                params,
            });

            setPlans(res.data.data || []);
        } catch (error) {
            toast.error(
                error?.response?.data?.message || "Failed to load Work Plans"
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchBoqs = async (projectId) => {
        setBoqs([]);
        setBoqItems([]);
        setPlanForm((prev) => ({ ...prev, boqRef: "", planItemList: [] }));

        if (!projectId) return;

        try {
            const res = await axios.get(
                `${BOQ_API}/project/${projectId}`,
                authHeader()
            );
            setBoqs(res.data.boqs || []);
        } catch (error) {
            toast.error(
                error?.response?.data?.message || "Failed to load project BOQs"
            );
        }
    };

    const fetchBoqItems = async (boqId) => {
        setBoqItems([]);
        setPlanForm((prev) => ({ ...prev, planItemList: [] }));

        if (!boqId) return;

        try {
            const res = await axios.get(
                `${BOQ_API}/items/${boqId}`,
                authHeader()
            );
            setBoqItems(res.data.items || []);
        } catch (error) {
            toast.error(
                error?.response?.data?.message || "Failed to load BOQ items"
            );
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        fetchPlans();
    }, [selectedProject, statusFilter]);

    const filteredPlans = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return plans;

        return plans.filter((plan) =>
            [
                plan.planNumber,
                plan.planName,
                plan.status,
                plan.boqRef?.boqName,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query))
        );
    }, [plans, search]);

    const resetPlanForm = () => {
        setPlanForm({
            ...emptyPlan,
            projectRef: selectedProject || "",
        });
        setBoqs([]);
        setBoqItems([]);
    };

    const togglePlanItem = (item, checked) => {
        setPlanForm((prev) => {
            const current = prev.planItemList || [];

            if (checked) {
                if (
                    current.some(
                        (row) => String(row.boqItemRef) === String(item._id)
                    )
                ) {
                    return prev;
                }

                return {
                    ...prev,
                    planItemList: [
                        ...current,
                        {
                            boqItemRef: item._id,
                            planQty: "",
                            description:
                                item.activity || item.description || "",
                            unit: item.uom || "",
                            rate: Number(
                                item.contractorInstallationRate ||
                                item.installationRate ||
                                0
                            ),
                            remarks: "",
                        },
                    ],
                };
            }

            return {
                ...prev,
                planItemList: current.filter(
                    (row) => String(row.boqItemRef) !== String(item._id)
                ),
            };
        });
    };

    const updatePlanItem = (itemId, field, value) => {
        setPlanForm((prev) => ({
            ...prev,
            planItemList: prev.planItemList.map((item) =>
                String(item.boqItemRef) === String(itemId)
                    ? { ...item, [field]: value }
                    : item
            ),
        }));
    };

    const createPlan = async (event) => {
        event.preventDefault();

        if (!planForm.projectRef) return toast.error("Select a project");
        if (!planForm.boqRef) return toast.error("Select a BOQ");
        if (!planForm.planItemList.length) {
            return toast.error("Select at least one BOQ item");
        }

        const invalidQty = planForm.planItemList.some(
            (item) =>
                item.planQty === "" ||
                !Number.isFinite(Number(item.planQty)) ||
                Number(item.planQty) < 0
        );

        if (invalidQty) {
            return toast.error("Enter a valid planned quantity for each item");
        }

        try {
            setSavingPlan(true);

            await axios.post(
                API,
                {
                    ...planForm,
                    planItemList: planForm.planItemList.map((item) => ({
                        ...item,
                        planQty: Number(item.planQty),
                        rate: Number(item.rate || 0),
                    })),
                },
                authHeader()
            );

            toast.success("Work Plan created");
            setCreateOpen(false);
            resetPlanForm();
            await fetchPlans();
        } catch (error) {
            toast.error(
                error?.response?.data?.message || "Failed to create Work Plan"
            );
        } finally {
            setSavingPlan(false);
        }
    };

    const submitPlan = async (plan) => {
        try {
            await axios.patch(
                `${API}/${plan._id}/submit`,
                {},
                authHeader()
            );
            toast.success("Work Plan submitted for review");
            await fetchPlans();
        } catch (error) {
            toast.error(
                error?.response?.data?.message || "Could not submit Work Plan"
            );
        }
    };

    const reviewPlan = async (plan, decision) => {
        if (
            decision !== "APPROVED" &&
            !reviewRemarks.trim()
        ) {
            return toast.error("Enter review remarks before rejecting or requesting revision");
        }

        try {
            setReviewingId(plan._id);

            await axios.patch(
                `${API}/${plan._id}/review`,
                {
                    decision,
                    remarks: reviewRemarks,
                },
                authHeader()
            );

            toast.success(`Work Plan ${decision.toLowerCase().replaceAll("_", " ")}`);
            setReviewRemarks("");
            await fetchPlans();
        } catch (error) {
            toast.error(
                error?.response?.data?.message || "Work Plan review failed"
            );
        } finally {
            setReviewingId("");
        }
    };

    const openSchedule = async (plan) => {
        setSchedulePlan(plan);
        setScheduleMonth(currentMonth());
        setScheduleRows([]);
        setActiveTab("schedule");
        await loadSchedule(plan, currentMonth());
    };

    const loadSchedule = async (plan, month) => {
        if (!plan?._id || !month) return;

        try {
            setScheduleLoading(true);

            const res = await axios.get(
                `${API}/${plan._id}/daily-targets`,
                {
                    ...authHeader(),
                    params: { month },
                }
            );

            const saved = res.data.data?.targets || [];
            setScheduleRows(
                saved.map((row) => ({
                    boqItemRef:
                        row.boqItemRef?._id || row.boqItemRef || "",
                    targetDate: String(row.targetDate).slice(0, 10),
                    targetQty: row.targetQty ?? "",
                    remarks: row.remarks || "",
                    actualQty: row.actualQty || 0,
                }))
            );
        } catch (error) {
            toast.error(
                error?.response?.data?.message || "Failed to load daily targets"
            );
        } finally {
            setScheduleLoading(false);
        }
    };

    const addScheduleRow = () => {
        const firstItem = schedulePlan?.planItemList?.[0]?.boqItemRef;

        if (!firstItem) {
            return toast.error("This Work Plan has no BOQ items");
        }

        setScheduleRows((prev) => [
            ...prev,
            {
                boqItemRef: firstItem,
                targetDate: `${scheduleMonth}-01`,
                targetQty: "",
                remarks: "",
                actualQty: 0,
            },
        ]);
    };

    const updateScheduleRow = (index, field, value) => {
        setScheduleRows((prev) =>
            prev.map((row, i) =>
                i === index ? { ...row, [field]: value } : row
            )
        );
    };

    const removeScheduleRow = (index) => {
        setScheduleRows((prev) => prev.filter((_, i) => i !== index));
    };

    const saveSchedule = async () => {
        if (!schedulePlan?._id) return;

        for (const row of scheduleRows) {
            if (
                !row.boqItemRef ||
                !row.targetDate ||
                row.targetDate.slice(0, 7) !== scheduleMonth ||
                row.targetQty === "" ||
                !Number.isFinite(Number(row.targetQty)) ||
                Number(row.targetQty) < 0
            ) {
                return toast.error(
                    "Check every schedule row: item, date, and quantity are required"
                );
            }
        }

        const keys = scheduleRows.map(
            (row) => `${row.boqItemRef}_${row.targetDate}`
        );

        if (new Set(keys).size !== keys.length) {
            return toast.error(
                "Each BOQ item can have only one target per date"
            );
        }

        try {
            setScheduleSaving(true);

            await axios.put(
                `${API}/${schedulePlan._id}/daily-targets`,
                {
                    month: scheduleMonth,
                    targets: scheduleRows.map((row) => ({
                        boqItemRef: row.boqItemRef,
                        targetDate: row.targetDate,
                        targetQty: Number(row.targetQty),
                        remarks: row.remarks || "",
                    })),
                },
                authHeader()
            );

            toast.success("Daily schedule saved");
            await loadSchedule(schedulePlan, scheduleMonth);
        } catch (error) {
            toast.error(
                error?.response?.data?.message || "Failed to save schedule"
            );
        } finally {
            setScheduleSaving(false);
        }
    };

    const loadMonthlyReport = async () => {
        if (!selectedProject) {
            return toast.error("Select a project first");
        }

        try {
            setReportLoading(true);

            const res = await axios.get(`${API}/report/monthly`, {
                ...authHeader(),
                params: {
                    projectRef: selectedProject,
                    month: reportMonth,
                },
            });

            setReport(res.data.data || null);
        } catch (error) {
            toast.error(
                error?.response?.data?.message || "Failed to load monthly report"
            );
            setReport(null);
        } finally {
            setReportLoading(false);
        }
    };

    const planItemName = (item) =>
        item?.description ||
        item?.activity ||
        item?.generalName ||
        item?.boqItemCode ||
        "BOQ item";

    const getPlanItemLabel = (itemId) => {
        const item = schedulePlan?.planItemList?.find(
            (row) => String(row.boqItemRef?._id || row.boqItemRef) === String(itemId)
        );

        return item
            ? item.description || item.activity || item.boqItemRef?.boqItemCode || "BOQ item"
            : "BOQ item";
    };

    return (
        <div className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <p className="text-sm font-semibold text-cyan-300">
                        Planning & Execution
                    </p>
                    <h1 className="mt-1 text-2xl font-bold md:text-3xl">
                        Work Plan Management
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-400">
                        Plan BOQ-wise work, schedule daily targets, and compare
                        execution against approved Measurement Book entries.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={fetchPlans}
                        className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm hover:border-slate-500"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>

                    <button
                        onClick={() => {
                            resetPlanForm();
                            setCreateOpen(true);
                        }}
                        className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400"
                    >
                        <Plus size={17} />
                        Create Work Plan
                    </button>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    icon={ClipboardList}
                    label="Total Plans"
                    value={plans.length}
                    helper="Based on current filters"
                />
                <StatCard
                    icon={Clock3}
                    label="Awaiting Review"
                    value={plans.filter((p) => p.status === "SUBMITTED").length}
                    helper="Submitted by site team"
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Approved"
                    value={plans.filter((p) => p.status === "APPROVED").length}
                    helper="Ready for daily scheduling"
                />
                <StatCard
                    icon={CalendarRange}
                    label="Daily Schedules"
                    value={plans.filter((p) => p.status === "APPROVED").length}
                    helper="Plans eligible for HO scheduling"
                />
            </div>

            <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-800 pb-3">
                {[
                    { id: "plans", label: "Work Plans", icon: ClipboardList },
                    { id: "schedule", label: "Daily Targets", icon: CalendarDays },
                    { id: "report", label: "Monthly Report", icon: BarChart3 },
                ].map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={cn(
                            "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold",
                            activeTab === id
                                ? "bg-cyan-500 text-slate-950"
                                : "bg-slate-900 text-slate-400 hover:text-white"
                        )}
                    >
                        <Icon size={16} />
                        {label}
                    </button>
                ))}
            </div>

            {activeTab === "plans" && (
                <>
                    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <Field label="Project">
                            <select
                                className={inputClass}
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                            >
                                <option value="">All projects</option>
                                {projects.map((project) => (
                                    <option key={project._id} value={project._id}>
                                        {project.projectName || project.name || "Unnamed project"}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Status">
                            <select
                                className={inputClass}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All statuses</option>
                                {[
                                    "DRAFT",
                                    "SUBMITTED",
                                    "APPROVED",
                                    "REJECTED",
                                    "REVISION_REQUESTED",
                                    "CLOSED",
                                ].map((status) => (
                                    <option key={status} value={status}>
                                        {status.replaceAll("_", " ")}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Search">
                            <div className="relative">
                                <Search
                                    size={17}
                                    className="absolute left-3 top-3 text-slate-500"
                                />
                                <input
                                    className={`${inputClass} pl-10`}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Plan number, name, BOQ..."
                                />
                            </div>
                        </Field>
                    </div>

                    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-4">
                            <div>
                                <h2 className="font-semibold">Work Plan Register</h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    {filteredPlans.length} plan(s) found
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1050px] text-left text-sm">
                                <thead className="bg-slate-950 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-4 py-4">Plan</th>
                                        <th className="px-4 py-4">Project / BOQ</th>
                                        <th className="px-4 py-4">Period</th>
                                        <th className="px-4 py-4">Items</th>
                                        <th className="px-4 py-4">Status</th>
                                        <th className="px-4 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="p-10 text-center text-slate-400">
                                                Loading Work Plans...
                                            </td>
                                        </tr>
                                    ) : filteredPlans.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="p-10 text-center text-slate-500">
                                                No Work Plans found. Create one to get started.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPlans.map((plan) => (
                                            <tr
                                                key={plan._id}
                                                className="border-t border-slate-800 hover:bg-slate-800/30"
                                            >
                                                <td className="px-4 py-4">
                                                    <p className="font-semibold text-white">
                                                        {plan.planNumber}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {plan.planName || "Work Plan"}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p>{plan.projectRef?.projectName || plan.projectRef?.name || "Project"}</p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {plan.boqRef?.boqName || "BOQ"}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4 text-slate-300">
                                                    <div>{formatDate(plan.planStartDate)}</div>
                                                    <div className="mt-1 text-xs text-slate-500">
                                                        to {formatDate(plan.planEndDate)}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {plan.planItemList?.length || 0}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <StatusBadge status={plan.status} />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {["DRAFT", "REVISION_REQUESTED"].includes(plan.status) && (
                                                            <button
                                                                onClick={() => submitPlan(plan)}
                                                                className="flex items-center gap-1.5 rounded-lg bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20"
                                                            >
                                                                <Send size={14} />
                                                                Submit
                                                            </button>
                                                        )}

                                                        {plan.status === "SUBMITTED" && (
                                                            <>
                                                                <button
                                                                    disabled={reviewingId === plan._id}
                                                                    onClick={() => reviewPlan(plan, "APPROVED")}
                                                                    className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    disabled={reviewingId === plan._id}
                                                                    onClick={() => reviewPlan(plan, "REVISION_REQUESTED")}
                                                                    className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
                                                                >
                                                                    Revision
                                                                </button>
                                                                <button
                                                                    disabled={reviewingId === plan._id}
                                                                    onClick={() => reviewPlan(plan, "REJECTED")}
                                                                    className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </>
                                                        )}

                                                        {plan.status === "APPROVED" && (
                                                            <button
                                                                onClick={() => openSchedule(plan)}
                                                                className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
                                                            >
                                                                <CalendarDays size={14} />
                                                                Schedule
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => {
                                                                setSchedulePlan(plan);
                                                                setActiveTab("report");
                                                                setSelectedProject(
                                                                    plan.projectRef?._id || plan.projectRef || ""
                                                                );
                                                            }}
                                                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                                                            title="Open monthly report"
                                                        >
                                                            <Eye size={14} />
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

                    {plans.some((plan) => plan.status === "SUBMITTED") && (
                        <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                            <label className="mb-2 block text-sm font-semibold text-amber-200">
                                Review remarks
                            </label>
                            <textarea
                                rows={2}
                                value={reviewRemarks}
                                onChange={(e) => setReviewRemarks(e.target.value)}
                                className={inputClass}
                                placeholder="Add remarks before requesting revision or rejecting..."
                            />
                            <p className="mt-2 text-xs text-slate-500">
                                Remarks apply to the plan when you select a review action.
                            </p>
                        </div>
                    )}
                </>
            )}

            {activeTab === "schedule" && (
                <div className="mt-5 space-y-5">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <Field label="Approved Work Plan">
                                <select
                                    className={inputClass}
                                    value={schedulePlan?._id || ""}
                                    onChange={(e) => {
                                        const plan = plans.find((p) => p._id === e.target.value);
                                        if (plan) openSchedule(plan);
                                        else setSchedulePlan(null);
                                    }}
                                >
                                    <option value="">Select Work Plan</option>
                                    {plans
                                        .filter((plan) => plan.status === "APPROVED")
                                        .map((plan) => (
                                            <option key={plan._id} value={plan._id}>
                                                {plan.planNumber} — {plan.planName || plan.boqRef?.boqName || "Work Plan"}
                                            </option>
                                        ))}
                                </select>
                            </Field>

                            <Field label="Schedule Month">
                                <input
                                    type="month"
                                    className={inputClass}
                                    value={scheduleMonth}
                                    onChange={(e) => {
                                        setScheduleMonth(e.target.value);
                                        if (schedulePlan && e.target.value) {
                                            loadSchedule(schedulePlan, e.target.value);
                                        }
                                    }}
                                />
                            </Field>

                            <div className="flex items-end gap-2">
                                <button
                                    onClick={addScheduleRow}
                                    disabled={!schedulePlan}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2.5 text-sm hover:border-cyan-500 disabled:opacity-40"
                                >
                                    <Plus size={16} />
                                    Add Target
                                </button>
                                <button
                                    onClick={saveSchedule}
                                    disabled={!schedulePlan || scheduleSaving}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-3 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-40"
                                >
                                    <Save size={16} />
                                    {scheduleSaving ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </div>
                        {schedulePlan && (
                            <p className="mt-3 text-xs text-slate-500">
                                {schedulePlan.planNumber} · {schedulePlan.planItemList?.length || 0} BOQ item(s)
                            </p>
                        )}
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                        <div className="border-b border-slate-800 px-4 py-4">
                            <h2 className="font-semibold">Daily Target Schedule</h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Assign daily quantity targets by BOQ item. Actuals are fetched from approved MB entries.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px] text-left text-sm">
                                <thead className="bg-slate-950 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">BOQ Item</th>
                                        <th className="px-4 py-3">Target Qty</th>
                                        <th className="px-4 py-3">Actual Qty</th>
                                        <th className="px-4 py-3">Remarks</th>
                                        <th className="px-4 py-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scheduleLoading ? (
                                        <tr>
                                            <td colSpan="6" className="p-10 text-center text-slate-400">
                                                Loading daily schedule...
                                            </td>
                                        </tr>
                                    ) : !schedulePlan ? (
                                        <tr>
                                            <td colSpan="6" className="p-10 text-center text-slate-500">
                                                Select an approved Work Plan to schedule daily targets.
                                            </td>
                                        </tr>
                                    ) : scheduleRows.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="p-10 text-center text-slate-500">
                                                No daily targets saved for this month. Click Add Target.
                                            </td>
                                        </tr>
                                    ) : (
                                        scheduleRows.map((row, index) => (
                                            <tr key={`${row.boqItemRef}_${row.targetDate}_${index}`} className="border-t border-slate-800">
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="date"
                                                        className={inputClass}
                                                        value={row.targetDate}
                                                        min={`${scheduleMonth}-01`}
                                                        max={`${scheduleMonth}-${new Date(
                                                            Number(scheduleMonth.slice(0, 4)),
                                                            Number(scheduleMonth.slice(5, 7)),
                                                            0
                                                        ).getDate().toString().padStart(2, "0")}`}
                                                        onChange={(e) => updateScheduleRow(index, "targetDate", e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        className={inputClass}
                                                        value={row.boqItemRef}
                                                        onChange={(e) => updateScheduleRow(index, "boqItemRef", e.target.value)}
                                                    >
                                                        {(schedulePlan.planItemList || []).map((item) => {
                                                            const itemId = item.boqItemRef?._id || item.boqItemRef;
                                                            return (
                                                                <option key={itemId} value={itemId}>
                                                                    {item.description || item.activity || item.boqItemRef?.boqItemCode || "BOQ item"}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className={inputClass}
                                                        value={row.targetQty}
                                                        onChange={(e) => updateScheduleRow(index, "targetQty", e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-emerald-300">
                                                    {formatQty(row.actualQty)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        className={inputClass}
                                                        value={row.remarks}
                                                        onChange={(e) => updateScheduleRow(index, "remarks", e.target.value)}
                                                        placeholder="Optional"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => removeScheduleRow(index)}
                                                        className="rounded-lg border border-rose-500/20 px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/10"
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* {activeTab === "report" && (
                <div className="mt-5 space-y-5">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <Field label="Project">
                                <select
                                    className={inputClass}
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                >
                                    <option value="">Select project</option>
                                    {projects.map((project) => (
                                        <option key={project._id} value={project._id}>
                                            {project.projectName || project.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Report Month">
                                <input
                                    type="month"
                                    className={inputClass}
                                    value={reportMonth}
                                    onChange={(e) => setReportMonth(e.target.value)}
                                />
                            </Field>
                            <div className="flex items-end">
                                <button
                                    onClick={loadMonthlyReport}
                                    disabled={reportLoading}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50"
                                >
                                    <BarChart3 size={16} />
                                    {reportLoading ? "Loading..." : "Generate Report"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {report && (
                        <>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                <StatCard
                                    icon={CalendarRange}
                                    label="Planned Quantity"
                                    value={formatQty(report.totals?.plannedQty)}
                                />
                                <StatCard
                                    icon={CheckCircle2}
                                    label="Actual Quantity"
                                    value={formatQty(report.totals?.actualQty)}
                                />
                                <StatCard
                                    icon={Clock3}
                                    label="Shortfall"
                                    value={formatQty(report.totals?.shortfallQty)}
                                />
                                <StatCard
                                    icon={BarChart3}
                                    label="Achievement"
                                    value={
                                        report.totals?.achievementPercent == null
                                            ? "—"
                                            : `${report.totals.achievementPercent}%`
                                    }
                                />
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
                                <table className="w-full min-w-[950px] text-left text-sm">
                                    <thead className="bg-slate-950 text-xs uppercase text-slate-500">
                                        <tr>
                                            <th className="px-4 py-4">BOQ Item</th>
                                            <th className="px-4 py-4">Unit</th>
                                            <th className="px-4 py-4">Planned</th>
                                            <th className="px-4 py-4">Actual</th>
                                            <th className="px-4 py-4">SEPL</th>
                                            <th className="px-4 py-4">Contractor</th>
                                            <th className="px-4 py-4">Remaining</th>
                                            <th className="px-4 py-4">Achievement</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(report.items || []).map((item, index) => (
                                            <tr key={`${item.boqItemRef}_${index}`} className="border-t border-slate-800">
                                                <td className="px-4 py-4">
                                                    <p className="font-semibold text-slate-200">
                                                        {item.description || "BOQ item"}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {item.planNumber}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4 text-slate-400">{item.unit || "—"}</td>
                                                <td className="px-4 py-4">{formatQty(item.plannedQty)}</td>
                                                <td className="px-4 py-4 font-semibold text-emerald-300">{formatQty(item.actualQty)}</td>
                                                <td className="px-4 py-4">{formatQty(item.seplQty)}</td>
                                                <td className="px-4 py-4">{formatQty(item.contractorQty)}</td>
                                                <td className="px-4 py-4 text-amber-300">{formatQty(item.remainingQty)}</td>
                                                <td className="px-4 py-4">
                                                    {item.achievementPercent == null ? "—" : `${item.achievementPercent}%`}
                                                </td>
                                            </tr>
                                        ))}
                                        {(!report.items || report.items.length === 0) && (
                                            <tr>
                                                <td colSpan="8" className="p-8 text-center text-slate-500">
                                                    No approved Work Plans found for this project and month.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )} */}


            {activeTab === "report" && (
                <div className="mt-5 space-y-5">
                    <style>{`
            @page {
                size: A4 landscape;
                margin: 12mm;
            }

            @media print {
                body * {
                    visibility: hidden !important;
                }

                .work-plan-report-print,
                .work-plan-report-print * {
                    visibility: visible !important;
                }

                .work-plan-report-print {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    color: #111827 !important;
                    background: white !important;
                }

                .work-plan-report-print .report-page {
                    page-break-after: always;
                    break-after: page;
                    box-shadow: none !important;
                    border: none !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }

                .work-plan-report-print .report-page:last-child {
                    page-break-after: auto;
                    break-after: auto;
                }

                .work-plan-report-print .no-print {
                    display: none !important;
                }

                .work-plan-report-print table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .work-plan-report-print th,
                .work-plan-report-print td {
                    border: 1px solid #d1d5db !important;
                    color: #111827 !important;
                    padding: 6px !important;
                    font-size: 9px !important;
                    vertical-align: top;
                }

                .work-plan-report-print th {
                    background: #e5e7eb !important;
                }

                .work-plan-report-print .report-dark {
                    color: #111827 !important;
                    background: white !important;
                }

                .work-plan-report-print .report-muted {
                    color: #4b5563 !important;
                }

                .work-plan-report-print .report-positive {
                    color: #047857 !important;
                }

                .work-plan-report-print .report-warning {
                    color: #b45309 !important;
                }

                .work-plan-report-print .report-negative {
                    color: #be123c !important;
                }

                .work-plan-report-print tr {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
            }
        `}</style>

                    {/* Report filters */}
                    <div className="no-print rounded-2xl border border-slate-800 bg-slate-900 p-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <Field label="Project">
                                <select
                                    className={inputClass}
                                    value={selectedProject}
                                    onChange={(e) => {
                                        setSelectedProject(e.target.value);
                                        setReport(null);
                                    }}
                                >
                                    <option value="">Select project</option>
                                    {projects.map((project) => (
                                        <option key={project._id} value={project._id}>
                                            {project.projectName || project.name || "Unnamed project"}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Report Month">
                                <input
                                    type="month"
                                    className={inputClass}
                                    value={reportMonth}
                                    onChange={(e) => {
                                        setReportMonth(e.target.value);
                                        setReport(null);
                                    }}
                                />
                            </Field>

                            <div className="flex items-end">
                                <button
                                    onClick={loadMonthlyReport}
                                    disabled={reportLoading || !selectedProject || !reportMonth}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50"
                                >
                                    <BarChart3 size={16} />
                                    {reportLoading ? "Generating..." : "Generate Report"}
                                </button>
                            </div>
                        </div>

                        <p className="mt-3 text-xs text-slate-500">
                            Actual achievement is based on approved Measurement Book entries.
                            Generate the report after selecting a project and month.
                        </p>
                    </div>

                    {reportLoading && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-400">
                            <RefreshCw className="mx-auto mb-3 animate-spin" size={24} />
                            Preparing management report...
                        </div>
                    )}

                    {!reportLoading && !report && (
                        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">
                            <FileText className="mx-auto mb-3 text-slate-500" size={36} />
                            <h3 className="font-semibold text-slate-200">
                                Work Plan Report Preview
                            </h3>
                            <p className="mt-2 text-sm text-slate-500">
                                Select a project and month, then generate the report.
                            </p>
                        </div>
                    )}

                    {!reportLoading && report && (() => {
                        // console.log("Reports",report)
                        const reportItems = report.items || [];
                        const totals = report.totals || {};

                        const selectedProjectData = projects.find(
                            (project) => String(project._id) === String(selectedProject)
                        );

                        const projectName =
                            selectedProjectData?.projectName ||
                            selectedProjectData?.name ||
                            report.project?.projectName ||
                            report.projectName ||
                            "Selected Project";

                        // Use project data for branding where available; don't assume
                        // every project belongs to the same company.
                        const companyName =
                            selectedProjectData?.allotedCompany?.companyName ||
                            selectedProjectData?.allotedCompany?.name ||
                            selectedProjectData?.allotedCompanyName ||
                            report.companyName ||
                            "Project Management Report";

                        const monthLabel = reportMonth
                            ? new Date(`${reportMonth}-01T12:00:00`).toLocaleDateString(
                                "en-IN",
                                { month: "long", year: "numeric" }
                            )
                            : "Selected Period";

                        const totalSEPL = Number(totals.seplQty || 0);
                        const totalContractor = Number(totals.contractorQty || 0);
                        // const totalAmount= Number(totals.planAmount|| 0);

                        const achievement = Number(totals.achievementPercent || 0);
                        const chartWidth = Math.max(0, Math.min(achievement, 100));

                        const allMBEntries = reportItems.flatMap((item) =>
                            getItemMBEntries(item).map((entry) => ({
                                ...entry,
                                _itemDescription:
                                    item.description || item.activity || "BOQ item",
                                _itemUnit: item.unit || entry.unit || "—",
                            }))
                        ).sort((a, b) =>
                            new Date(a._reportDate || 0) - new Date(b._reportDate || 0)
                        );

                        const entryCount = allMBEntries.length;

                        const dailyTotals = new Map();
                        console.log(reportItems);
                        // const targetAmount=reportItems.reduce((a,item)=> a + item.rate*item.planQty,0);
                        // // console.log(allMBEntries);

                        // const actualAmount=allMBEntries.reduce((a,entery)=> a+ entery.rate*entery.todayQty,0);


                        const formatAmount = (value) =>
                            new Intl.NumberFormat("en-IN", {
                                style: "currency",
                                currency: "INR",
                                maximumFractionDigits: 2,
                            }).format(Number(value) || 0);

                        // Use the amount returned by your controller.
                        // Note: the controller currently sets targetAmount to the last item's
                        // planned amount, so this value may not represent the full target.
                        const targetAmount = Number(totals.targetAmount || 0);

                        // Actual SEPL amount from approved MB entries.
                        // Prefer saved amount; otherwise calculate rate x today's quantity.
                        const actualAmount = allMBEntries.reduce((sum, entry) => {
                            if (entry.executedByType !== "SEPL") return sum;

                            const rate = Number(entry.rate || 0);
                            const qty = Number(entry.todayQty || 0);
                            const amount =
                                entry.amount != null && entry.amount !== ""
                                    ? Number(entry.amount)
                                    : rate * qty;

                            return sum + amount;
                        }, 0);

                        const contractorAmount = allMBEntries.reduce((sum, entry) => {
                            if (entry.executedByType !== "CONTRACTOR") return sum;

                            const rate = Number(entry.rate || 0);
                            const qty = Number(entry.todayQty || 0);
                            const amount =
                                entry.amount != null && entry.amount !== ""
                                    ? Number(entry.amount)
                                    : rate * qty;

                            return sum + amount;
                        }, 0);

                        // Calculate the elapsed-day target dynamically.
                        const selectedMonthDate = new Date(`${reportMonth}-01T12:00:00`);
                        const daysInMonth = new Date(
                            selectedMonthDate.getFullYear(),
                            selectedMonthDate.getMonth() + 1,
                            0
                        ).getDate();

                        const today = new Date();
                        const currentMonth = `${today.getFullYear()}-${String(
                            today.getMonth() + 1
                        ).padStart(2, "0")}`;

                        const elapsedDays =
                            reportMonth < currentMonth
                                ? daysInMonth
                                : reportMonth === currentMonth
                                    ? today.getDate()
                                    : 0;

                        const expectedAmountByToday =
                            daysInMonth > 0
                                ? (targetAmount / daysInMonth) * elapsedDays
                                : 0;

                        const amountAchievementPercent =
                            targetAmount > 0
                                ? (actualAmount / targetAmount) * 100
                                : 0;

                        //  console.log(actualAmount);
                        for (const entry of allMBEntries) {
                            const dateKey = entry._reportDate
                                ? String(entry._reportDate).slice(0, 10)
                                : "Unknown";

                            const previous = dailyTotals.get(dateKey) || {
                                date: dateKey,
                                qty: 0,
                                entries: 0,
                                seplQty: 0,
                                contractorQty: 0,
                                amount: 0,
                                seplAmount: 0,
                                contractorAmount: 0,
                            };

                            const qty = Number(entry.todayQty || 0);
                            previous.qty += qty;
                            previous.entries += 1;
                            previous.amount += Number(entry._amount || 0);

                            if (entry.executedByType === "SEPL") {
                                previous.seplQty += qty;
                                previous.seplAmount += Number(entry._amount || 0);
                            } else if (entry.executedByType === "CONTRACTOR") {
                                previous.contractorQty += qty;
                                previous.contractorAmount += Number(entry._amount || 0);
                            }

                            dailyTotals.set(dateKey, previous);
                        }

                        // const dailyRows = [...dailyTotals.values()].sort((a, b) =>
                        //     a.date.localeCompare(b.date)
                        // );

                        let cumulativeAmount = 0;
                        const dailyRows = [...dailyTotals.values()]
                            .sort((a, b) => a.date.localeCompare(b.date))
                            .map((row) => {
                                cumulativeAmount += Number(row.amount || 0);
                                return { ...row, cumulativeAmount };
                            });
                        // const progressAmountMonth=totals.targetAmount/actuals*100;

                        return (
                            <>
                                <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                                    <div>
                                        <h2 className="font-semibold text-white">
                                            Report generated
                                        </h2>
                                        <p className="mt-1 text-xs text-slate-400">
                                            {projectName} · {monthLabel} · {reportItems.length} BOQ items · {entryCount} MB entries
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => window.print()}
                                        className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400"
                                    >
                                        <Printer size={17} />
                                        Print Report
                                    </button>
                                </div>

                                <div className="work-plan-report-print space-y-6 text-slate-900">
                                    {/* PAGE 1 — MANAGEMENT SUMMARY */}
                                    <section className="report-page rounded-2xl border border-slate-200 bg-white p-6 shadow-lg md:p-8">
                                        <div className="flex flex-col justify-between gap-5 border-b-2 border-slate-800 pb-5 md:flex-row md:items-start">
                                            <div>
                                                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-cyan-700">
                                                    <Building2 size={18} />
                                                    {companyName}
                                                </div>

                                                <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                                                    Work Plan & Execution Report
                                                </h1>

                                                <p className="mt-2 text-sm text-slate-500">
                                                    Monthly Management Review · {monthLabel}
                                                </p>
                                            </div>

                                            <div className="min-w-52 rounded-xl bg-slate-100 p-4">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    Project
                                                </p>
                                                <p className="mt-1 font-bold text-slate-900">
                                                    {projectName}
                                                </p>
                                                <p className="mt-3 text-xs text-slate-500">
                                                    Report generated: {formatReportDate(new Date())}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                            <ReportMetric
                                                // label="Planned Items"
                                                label="Planned Items "
                                                // value={formatQty(totals.plannedQty)}
                                                // value={formatQty(reportItems.length)}
                                                value={`${formatQty(reportItems.length)}/${formatQty(totals.idleItems)}`}
                                                helper="Approved Work Plan items/Idle Items"
                                                tone="blue"
                                            />
                                            <ReportMetric
                                                label="Target Amount"
                                                value={formatAmount(targetAmount)}
                                                helper="Planned amount for the selected month"
                                                tone="blue"
                                            />
                                            <ReportMetric
                                                label="Actual SEPL Amount"
                                                value={formatAmount(actualAmount)}
                                                helper="Approved SEPL MB entries"
                                                tone="blue"
                                            />
                                            <ReportMetric
                                                label="Amount Achievement"
                                                value={`${amountAchievementPercent.toFixed(2)}%`}
                                                helper="Actual SEPL amount against target"
                                                tone="green"
                                            />
                                            <ReportMetric
                                                label="Expected Amount by Today"
                                                value={formatAmount(expectedAmountByToday)}
                                                helper={`Expected through day ${elapsedDays} of ${daysInMonth}`}
                                                tone="green"
                                            />
                                            <ReportMetric
                                                label="Amount Shortfall"
                                                value={formatAmount(Math.max(expectedAmountByToday - actualAmount, 0))}
                                                helper="Expected-to-date amount less actual"
                                                tone="amber"
                                            />
                                            <ReportMetric
                                                label="Contractor Amount"
                                                value={formatAmount(contractorAmount)}
                                                helper="Approved contractor MB entries"
                                                tone="blue"
                                            />
                                            <ReportMetric
                                                label="Shortfall"
                                                value={formatQty(totals.shortfallQty)}
                                                helper="Planned less actual, minimum zero"
                                                tone="amber"
                                            />
                                            <ReportMetric
                                                label="Achievement"
                                                value={formatPercent(totals.achievementPercent)}
                                                helper="Actual against planned quantity"
                                                tone="green"
                                            />
                                        </div>

                                        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
                                            <div className="rounded-xl border border-slate-200 p-5">
                                                <div className="flex items-center justify-between gap-3">
                                                    <h2 className="font-bold">Overall Achievement</h2>
                                                    <TrendingUp className="text-cyan-700" size={20} />
                                                </div>

                                                <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className="h-full rounded-full bg-emerald-500"
                                                        style={{ width: `${chartWidth}%` }}
                                                    />
                                                </div>

                                                <div className="mt-2 flex justify-between text-xs text-slate-500">
                                                    <span>0%</span>
                                                    <span>{formatPercent(totals.achievementPercent)}</span>
                                                    <span>100%</span>
                                                </div>

                                                <p className="mt-4 text-sm text-slate-600">
                                                    {Number(totals.plannedQty || 0) > 0
                                                        ? `The recorded achievement is ${formatPercent(totals.achievementPercent)} of the reported planned quantity.`
                                                        : "No planned quantity is available to calculate an achievement percentage."}
                                                </p>
                                            </div>

                                            <div className="rounded-xl border border-slate-200 p-5">
                                                <h2 className="font-bold">Execution Contribution</h2>

                                                <div className="mt-5 space-y-4">
                                                    <div>
                                                        <div className="flex justify-between gap-3 text-sm">
                                                            <span className="font-medium text-slate-600">SEPL</span>
                                                            <span className="font-bold">{formatQty(totalSEPL)}</span>
                                                        </div>
                                                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                                                            <div
                                                                className="h-full rounded-full bg-blue-500"
                                                                style={{
                                                                    width: `${Number(totals.actualQty) > 0
                                                                        ? Math.min(100, totalSEPL / Number(totals.actualQty) * 100)
                                                                        : 0
                                                                        }%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="flex justify-between gap-3 text-sm">
                                                            <span className="font-medium text-slate-600">Contractor</span>
                                                            <span className="font-bold">{formatQty(totalContractor)}</span>
                                                        </div>
                                                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                                                            <div
                                                                className="h-full rounded-full bg-violet-500"
                                                                style={{
                                                                    width: `${Number(totals.actualQty) > 0
                                                                        ? Math.min(100, totalContractor / Number(totals.actualQty) * 100)
                                                                        : 0
                                                                        }%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <p className="mt-4 text-xs text-slate-500">
                                                    Based on the execution type recorded in approved MB entries.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-6 rounded-xl bg-slate-50 p-5">
                                            <h2 className="font-bold">Management Snapshot</h2>
                                            <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
                                                <div>
                                                    <p className="text-xs text-slate-500">BOQ items</p>
                                                    <p className="mt-1 text-xl font-bold">{reportItems.length}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500">MB entries</p>
                                                    <p className="mt-1 text-xl font-bold">{entryCount}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500">Days with recorded MBs</p>
                                                    <p className="mt-1 text-xl font-bold">
                                                        {dailyRows.filter((row) => row.date !== "Unknown").length}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500">Overachievement</p>
                                                    <p className="mt-1 text-xl font-bold text-emerald-700">
                                                        {formatQty(totals.overachievementQty)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="mt-8 border-t border-slate-200 pt-3 text-xs text-slate-400">
                                            Generated from Work Plan records and approved Measurement Book entries. Actuals represent daily measured quantities, not cumulative MB totals.
                                        </p>

                                    </section>
                                    {/* <WorkPlanExecutiveSummary
                                        report={report}
                                        reportMonth={reportMonth}
                                        project={projects.find(
                                            (item) => String(item._id) === String(selectedProject)
                                        )}
                                    /> */}

                                    {/* PAGE 2 — BOQ ANALYSIS */}
                                    <section className="report-page rounded-2xl border border-slate-200 bg-white p-6 shadow-lg md:p-8">
                                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">
                                                    Page 2
                                                </p>
                                                <h2 className="mt-1 text-2xl font-black">
                                                    BOQ-wise Planned vs Actual
                                                </h2>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    {projectName} · {monthLabel}
                                                </p>
                                            </div>
                                            <Layers3 size={28} className="text-slate-400" />
                                        </div>

                                        <div className="mt-5 overflow-x-auto">
                                            <table className="w-full min-w-[900px] text-left text-xs">
                                                <thead className="bg-slate-100 uppercase tracking-wide text-slate-600">
                                                    <tr>
                                                        <th className="px-3 py-3">#</th>
                                                        <th className="px-3 py-3">BOQ Item / Description</th>
                                                        <th className="px-3 py-3">Work Plan</th>
                                                        <th className="px-3 py-3">Unit</th>
                                                        <th className="px-3 py-3 text-right">Planned</th>
                                                        <th className="px-3 py-3 text-right">Actual</th>
                                                        <th className="px-3 py-3 text-right">SEPL</th>
                                                        <th className="px-3 py-3 text-right">Contractor</th>
                                                        <th className="px-3 py-3 text-right">Remaining</th>
                                                        <th className="px-3 py-3 text-right">Achievement</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reportItems.map((item, index) => (
                                                        <tr
                                                            key={`${item.boqItemRef || index}_${index}`}
                                                            className="border-b border-slate-200"
                                                        >
                                                            <td className="px-3 py-3">{index + 1}</td>
                                                            <td className="max-w-xs whitespace-normal px-3 py-3">
                                                                <p className="font-semibold">
                                                                    {item.description || "BOQ item"}
                                                                </p>
                                                                {item.boqItemCode && (
                                                                    <p className="mt-1 text-slate-500">
                                                                        {item.boqItemCode}
                                                                    </p>
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                {item.planNumbers?.join(", ") || item.planNumber || "—"}
                                                            </td>
                                                            <td className="px-3 py-3">{item.unit || "—"}</td>
                                                            <td className="px-3 py-3 text-right">{formatQty(item.plannedQty)}</td>
                                                            <td className="px-3 py-3 text-right font-bold text-emerald-700">
                                                                {formatQty(item.actualQty)}
                                                            </td>
                                                            <td className="px-3 py-3 text-right">{formatQty(item.seplQty)}</td>
                                                            <td className="px-3 py-3 text-right">{formatQty(item.contractorQty)}</td>
                                                            <td className="px-3 py-3 text-right text-amber-700">
                                                                {formatQty(item.remainingQty)}
                                                            </td>
                                                            <td className="px-3 py-3 text-right font-semibold">
                                                                {formatPercent(item.achievementPercent)}
                                                            </td>
                                                        </tr>
                                                    ))}

                                                    {reportItems.length === 0 && (
                                                        <tr>
                                                            <td colSpan={10} className="px-3 py-10 text-center text-slate-500">
                                                                No approved Work Plan items found for this reporting period.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                                            <div className="rounded-lg bg-slate-50 p-4">
                                                <p className="text-xs text-slate-500">Total planned</p>
                                                <p className="mt-1 text-xl font-bold">{formatQty(totals.plannedQty)}</p>
                                            </div>
                                            <div className="rounded-lg bg-emerald-50 p-4">
                                                <p className="text-xs text-emerald-700">Total actual</p>
                                                <p className="mt-1 text-xl font-bold text-emerald-800">{formatQty(totals.actualQty)}</p>
                                            </div>
                                            <div className="rounded-lg bg-amber-50 p-4">
                                                <p className="text-xs text-amber-700">Total shortfall</p>
                                                <p className="mt-1 text-xl font-bold text-amber-800">{formatQty(totals.shortfallQty)}</p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* PAGE 3 — DAY-WISE ACHIEVEMENT */}
                                    <section className="report-page rounded-2xl border border-slate-200 bg-white p-6 shadow-lg md:p-8">
                                        <div className="border-b border-slate-200 pb-4">
                                            <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">
                                                Page 3
                                            </p>
                                            <h2 className="mt-1 text-2xl font-black">
                                                Day-wise Execution Summary
                                            </h2>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Daily quantities are aggregated from approved MB entries.
                                            </p>
                                        </div>

                                        <div className="mt-5 overflow-x-auto">
                                            <table className="w-full min-w-[700px] text-left text-xs">
                                                <thead className="bg-slate-100 uppercase text-slate-600">
                                                    <tr>
                                                        <th className="px-3 py-3">Date</th>
                                                        <th className="px-3 py-3 text-right">Total Qty</th>
                                                        <th className="px-3 py-3 text-right">SEPL Qty</th>
                                                        <th className="px-3 py-3 text-right">Contractor Qty</th>
                                                        <th className="px-3 py-3 text-right">MB Entries</th>
                                                        <th className="px-3 py-3 text-right">Daily Amount</th>
                                                        <th className="px-3 py-3 text-right">Commulative Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {dailyRows.map((row) => (
                                                        <tr key={row.date} className="border-b border-slate-200">
                                                            <td className="px-3 py-3 font-medium">
                                                                {row.date === "Unknown" ? "Date unavailable" : formatReportDate(row.date)}
                                                            </td>
                                                            <td className="px-3 py-3 text-right font-bold">{formatQty(row.qty)}</td>
                                                            <td className="px-3 py-3 text-right">{formatQty(row.seplQty)}</td>
                                                            <td className="px-3 py-3 text-right">{formatQty(row.contractorQty)}</td>
                                                            <td className="px-3 py-3 text-right">{row.entries}</td>
                                                            <td className="px-3 py-3 text-right font-bold">{formatAmount(row.amount)}</td>
                                                            <td className="px-3 py-3 text-right font-semibold">{formatAmount(row.cumulativeAmount)}</td>
                                                        </tr>
                                                    ))}

                                                    {dailyRows.length === 0 && (
                                                        <tr>
                                                            <td colSpan={5} className="px-3 py-10 text-center text-slate-500">
                                                                No day-wise MB entries were returned for this report.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                                            <strong>Note:</strong> Daily summary quantities are based on each entry's
                                            <code className="mx-1 rounded bg-slate-200 px-1">todayQty</code>.
                                            Cumulative <code className="mx-1 rounded bg-slate-200 px-1">totalQty</code>
                                            is not added again, to avoid double counting.
                                        </div>
                                    </section>

                                    {/* MB DETAILS — CONTINUES ON ADDITIONAL PRINT PAGES */}
                                    <section className="report-page rounded-2xl border border-slate-200 bg-white p-6 shadow-lg md:p-8">
                                        <div className="border-b border-slate-200 pb-4">
                                            <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">
                                                Detailed Annexure
                                            </p>
                                            <h2 className="mt-1 text-2xl font-black">
                                                Measurement Book Entry Details
                                            </h2>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Item-wise MB records for {projectName} · {monthLabel}
                                            </p>
                                        </div>

                                        <div className="mt-5 space-y-6">
                                            {reportItems.map((item, itemIndex) => {
                                                const entries = getItemMBEntries(item);

                                                return (
                                                    <div
                                                        key={`${item.boqItemRef || itemIndex}_annexure`}
                                                        className="break-inside-avoid"
                                                    >
                                                        <div className="mb-2 flex flex-wrap items-start justify-between gap-3 rounded-lg bg-slate-100 p-3">
                                                            <div>
                                                                <p className="font-bold">
                                                                    {itemIndex + 1}. {item.description || "BOQ item"}
                                                                </p>
                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    Work Plan: {item.planNumbers?.join(", ") || item.planNumber || "—"}
                                                                    {" · "}Unit: {item.unit || "—"}
                                                                </p>
                                                            </div>
                                                            <div className="text-right text-xs">
                                                                <p>Planned: <strong>{formatQty(item.plannedQty)}</strong></p>
                                                                <p>Actual: <strong className="text-emerald-700">{formatQty(item.actualQty)}</strong></p>
                                                            </div>
                                                        </div>

                                                        <div className="overflow-x-auto">
                                                            <table className="w-full min-w-[1100px] text-left text-xs">

                                                                <thead className="bg-slate-50 text-slate-600">
                                                                    <tr>
                                                                        <th className="px-2 py-2">Date</th>
                                                                        <th className="px-2 py-2">Execution</th>
                                                                        <th className="px-2 py-2">Team</th>
                                                                        <th className="px-2 py-2 text-right">Manpower</th>
                                                                        <th className="px-2 py-2">Location / Floor / Area</th>
                                                                        <th className="px-2 py-2 text-right">Today Qty</th>
                                                                        <th className="px-2 py-2 text-right">Rate</th>
                                                                        <th className="px-2 py-2 text-right">Amount</th>
                                                                        <th className="px-2 py-2">Remarks</th>
                                                                    </tr>
                                                                </thead>

                                                                <tbody>
                                                                    {entries.map((entry, entryIndex) => (
                                                                        <tr
                                                                            key={entry.mbEntryId || entry._id || `${itemIndex}_${entryIndex}`}
                                                                            className="border-b border-slate-200"
                                                                        >
                                                                            <td className="px-2 py-2 whitespace-nowrap">
                                                                                {formatReportDate(entry._reportDate)}
                                                                            </td>
                                                                            {/* <td className="px-2 py-2">
                                                                    {entry.mbNumber || entry.mbRefNumber || entry.referenceNumber || entry.mbEntryId || entry._id || "—"}
                                                                </td> */}
                                                                            <td className="px-2 py-2">
                                                                                {entry.executedByType || "—"}
                                                                                {entry.contractorRef?.name
                                                                                    ? ` · ${entry.contractorRef.name}`
                                                                                    : ""}
                                                                            </td>
                                                                            <td className="px-2 py-2">
                                                                                {entry.teamName || "—"}
                                                                            </td>
                                                                            <td className="px-2 py-2 text-right">
                                                                                {entry.manPowerCount ?? "—"}
                                                                            </td>
                                                                            <td className="px-2 py-2">
                                                                                {[entry.location, entry.floor, entry.area]
                                                                                    .filter(Boolean)
                                                                                    .join(" / ") || "—"}
                                                                            </td>
                                                                            <td className="px-2 py-2 text-right font-bold">
                                                                                {formatQty(entry.todayQty)}
                                                                            </td>

                                                                            <td className="px-2 py-2 text-right whitespace-nowrap">
                                                                                {formatAmount(entry.rate)}
                                                                            </td>

                                                                            <td className="px-2 py-2 text-right whitespace-nowrap font-semibold">
                                                                                {formatAmount(
                                                                                    entry.amount != null && entry.amount !== ""
                                                                                        ? entry.amount
                                                                                        : Number(entry.rate || 0) * Number(entry.todayQty || 0)
                                                                                )}
                                                                            </td>

                                                                            <td className="px-2 py-2 whitespace-normal">
                                                                                {entry.remarks || "—"}
                                                                            </td>
                                                                        </tr>
                                                                    ))}

                                                                    {entries.length === 0 && (
                                                                        <tr>
                                                                            <td colSpan={8} className="px-2 py-5 text-center text-slate-500">
                                                                                No MB detail rows returned for this BOQ item.
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-400">
                                            End of report · {projectName} · {monthLabel}
                                        </div>
                                    </section>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}


            {createOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 md:p-6">
                    <form
                        onSubmit={createPlan}
                        className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl"
                    >
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-4 md:px-6">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                                    Planning
                                </p>
                                <h2 className="mt-1 text-xl font-bold">
                                    Create Work Plan
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCreateOpen(false)}
                                className="rounded-xl border border-slate-700 px-3 py-2 text-slate-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-6 p-5 md:p-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                <Field label="Project *">
                                    <select
                                        required
                                        className={inputClass}
                                        value={planForm.projectRef}
                                        onChange={(e) => {
                                            const projectId = e.target.value;
                                            setPlanForm((prev) => ({
                                                ...prev,
                                                projectRef: projectId,
                                                boqRef: "",
                                                planItemList: [],
                                            }));
                                            fetchBoqs(projectId);
                                        }}
                                    >
                                        <option value="">Select project</option>
                                        {projects.map((project) => (
                                            <option key={project._id} value={project._id}>
                                                {project.projectName || project.name}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="BOQ *">
                                    <select
                                        required
                                        className={inputClass}
                                        value={planForm.boqRef}
                                        onChange={(e) => {
                                            const boqId = e.target.value;
                                            setPlanForm((prev) => ({
                                                ...prev,
                                                boqRef: boqId,
                                                planItemList: [],
                                            }));
                                            fetchBoqItems(boqId);
                                        }}
                                    >
                                        <option value="">Select BOQ</option>
                                        {boqs.map((boq) => (
                                            <option key={boq._id} value={boq._id}>
                                                {boq.boqName || boq.name || "BOQ"}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Plan Name">
                                    <input
                                        className={inputClass}
                                        value={planForm.planName}
                                        onChange={(e) =>
                                            setPlanForm((prev) => ({
                                                ...prev,
                                                planName: e.target.value,
                                            }))
                                        }
                                        placeholder="October Installation Plan"
                                    />
                                </Field>

                                <Field label="Start Date *">
                                    <input
                                        required
                                        type="date"
                                        className={inputClass}
                                        value={planForm.planStartDate}
                                        onChange={(e) =>
                                            setPlanForm((prev) => ({
                                                ...prev,
                                                planStartDate: e.target.value,
                                            }))
                                        }
                                    />
                                </Field>

                                <Field label="End Date *">
                                    <input
                                        required
                                        type="date"
                                        min={planForm.planStartDate}
                                        className={inputClass}
                                        value={planForm.planEndDate}
                                        onChange={(e) =>
                                            setPlanForm((prev) => ({
                                                ...prev,
                                                planEndDate: e.target.value,
                                            }))
                                        }
                                    />
                                </Field>

                                <Field label="Description">
                                    <input
                                        className={inputClass}
                                        value={planForm.planDescription}
                                        onChange={(e) =>
                                            setPlanForm((prev) => ({
                                                ...prev,
                                                planDescription: e.target.value,
                                            }))
                                        }
                                        placeholder="Scope / phase details"
                                    />
                                </Field>
                            </div>

                            <div>
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <h3 className="font-semibold">Select BOQ Items</h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Select the items included in this plan and enter their planned quantities.
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                                        {planForm.planItemList.length} selected
                                    </span>
                                </div>

                                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                                    <table className="w-full min-w-[850px] text-left text-sm">
                                        <thead className="bg-slate-900 text-xs uppercase text-slate-500">
                                            <tr>
                                                <th className="px-4 py-3">Select</th>
                                                <th className="px-4 py-3">BOQ Item</th>
                                                <th className="px-4 py-3">BOQ Qty</th>
                                                <th className="px-4 py-3">Unit</th>
                                                <th className="px-4 py-3">Planned Qty</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {boqItems.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="p-8 text-center text-slate-500">
                                                        Select a project and BOQ to load BOQ items.
                                                    </td>
                                                </tr>
                                            ) : (
                                                boqItems.map((item) => {
                                                    const selected = planForm.planItemList.find(
                                                        (row) => String(row.boqItemRef) === String(item._id)
                                                    );

                                                    return (
                                                        <tr key={item._id} className="border-t border-slate-800">
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={Boolean(selected)}
                                                                    onChange={(e) => togglePlanItem(item, e.target.checked)}
                                                                    className="h-4 w-4 accent-cyan-500"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <p className="font-medium text-slate-200">
                                                                    {planItemName(item)}
                                                                </p>
                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    {item.boqItemCode || item.boqSrNo || ""}
                                                                </p>
                                                            </td>
                                                            <td className="px-4 py-3">{formatQty(item.poQty)}</td>
                                                            <td className="px-4 py-3">{item.uom || "—"}</td>
                                                            <td className="px-4 py-3">
                                                                {selected ? (
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        required
                                                                        className={`${inputClass} max-w-40`}
                                                                        value={selected.planQty}
                                                                        onChange={(e) =>
                                                                            updatePlanItem(item._id, "planQty", e.target.value)
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <span className="text-slate-600">Select item first</span>
                                                                )}
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

                        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-800 px-5 py-4 md:px-6">
                            <button
                                type="button"
                                onClick={() => setCreateOpen(false)}
                                className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300 hover:bg-slate-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={savingPlan}
                                className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
                            >
                                <Plus size={16} />
                                {savingPlan ? "Creating..." : "Create Draft"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
