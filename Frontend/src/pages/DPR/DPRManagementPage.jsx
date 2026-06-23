import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Plus,
    RefreshCw,
    Search,
    Eye,
    Pencil,
    Trash2,
    CheckCircle,
    XCircle,
} from "lucide-react";
import BASE_URL from "../../../config/api";
import CreateDPRModal from "./components/CreateDPRModal";

const DPR_API = `${BASE_URL}/dpr`;
const PROJECT_API = `${BASE_URL}/project-master/all`;

const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN");
};
const emptyDPRForm = {
    projectRef: "",
    reportDate: new Date().toISOString().split("T")[0],
    siteInchargeName: "",
    weather: "CLEAR",
    workDoneToday: "",
    manpowerDetails: [{ role: "", count: "" }],
    materialReceived: [],
    materialUsed: [],
    visitors: "",
    remarks: "",
    status: "SUBMITTED",
};

export default function DPRManagementPage() {

    const [dprs, setDprs] = useState([]);
    const [projects, setProjects] = useState([]);

    const [selectedProject, setSelectedProject] = useState("");
    const [search, setSearch] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [loading, setLoading] = useState(false);

    const [dprModalOpen, setDprModalOpen] = useState(false);
    const [dprMode, setDprMode] = useState("add");
    const [selectedDPR, setSelectedDPR] = useState(null);
    const [dprForm, setDprForm] = useState(emptyDPRForm);
    const [savingDPR, setSavingDPR] = useState(false);

    const fetchProjects = async () => {
        try {
            const res = await axios.get(PROJECT_API);
            setProjects(res.data?.data || []);
        } catch (error) {
            toast.error("Failed to fetch projects");
        }
    };

    const fetchDPRs = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();

            if (selectedProject) params.append("projectRef", selectedProject);
            if (search) params.append("search", search);
            if (fromDate) params.append("fromDate", fromDate);
            if (toDate) params.append("toDate", toDate);

            const res = await axios.get(`${DPR_API}/all?${params.toString()}`);

            setDprs(res.data?.dprs || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch DPR");
        } finally {
            setLoading(false);
        }
    };

    const openAddDPR = () => {
        setDprMode("add");
        setSelectedDPR(null);
        setDprForm({
            ...emptyDPRForm,
            projectRef: selectedProject || "",
        });
        setDprModalOpen(true);
    };

    const openViewDPR = (dpr) => {
        setDprMode("view");
        setSelectedDPR(dpr);
        setDprForm({
            projectRef: dpr.projectRef?._id || dpr.projectRef || "",
            reportDate: dpr.reportDate
                ? new Date(dpr.reportDate).toISOString().split("T")[0]
                : "",
            siteInchargeName: dpr.siteInchargeName || "",
            weather: dpr.weather || "CLEAR",
            workDoneToday: dpr.workDoneToday || "",
            manpowerDetails: dpr.manpowerDetails?.length
                ? dpr.manpowerDetails
                : [{ role: "", count: "" }],
            materialReceived: dpr.materialReceived || [],
            materialUsed: dpr.materialUsed || [],
            visitors: dpr.visitors || "",
            remarks: dpr.remarks || "",
            status: dpr.status || "SUBMITTED",
        });
        setDprModalOpen(true);
    };

    const openEditDPR = (dpr) => {
        setDprMode("edit");
        setSelectedDPR(dpr);
        setDprForm({
            projectRef: dpr.projectRef?._id || dpr.projectRef || "",
            reportDate: dpr.reportDate
                ? new Date(dpr.reportDate).toISOString().split("T")[0]
                : "",
            siteInchargeName: dpr.siteInchargeName || "",
            weather: dpr.weather || "CLEAR",
            workDoneToday: dpr.workDoneToday || "",
            manpowerDetails: dpr.manpowerDetails?.length
                ? dpr.manpowerDetails
                : [{ role: "", count: "" }],
            materialReceived: dpr.materialReceived || [],
            materialUsed: dpr.materialUsed || [],
            visitors: dpr.visitors || "",
            remarks: dpr.remarks || "",
            status: dpr.status || "SUBMITTED",
        });
        setDprModalOpen(true);
    };

    const saveDPR = async () => {
        try {
            if (!dprForm.projectRef) {
                return toast.error("Select project");
            }

            if (!dprForm.reportDate) {
                return toast.error("Select report date");
            }

            if (!dprForm.workDoneToday.trim()) {
                return toast.error("Enter work done today");
            }

            setSavingDPR(true);

            const payload = {
                ...dprForm,
                manpowerDetails: dprForm.manpowerDetails
                    .map((m) => ({
                        role: m.role,
                        count: Number(m.count || 0),
                    }))
                    .filter((m) => m.role || m.count > 0),

                materialReceived: dprForm.materialReceived
                    .map((m) => ({
                        ...m,
                        quantity: Number(m.quantity || 0),
                    }))
                    .filter((m) => m.itemName && m.quantity > 0),

                materialUsed: dprForm.materialUsed
                    .map((m) => ({
                        ...m,
                        quantity: Number(m.quantity || 0),
                    }))
                    .filter((m) => m.itemName && m.quantity > 0),
            };

            if (dprMode === "edit" && selectedDPR?._id) {
                await axios.put(`${DPR_API}/${selectedDPR._id}`, payload);
                toast.success("DPR updated");
            } else {
                await axios.post(`${DPR_API}/create`, payload);
                toast.success("DPR created");
            }

            setDprModalOpen(false);
            setSelectedDPR(null);
            setDprForm(emptyDPRForm);
            fetchDPRs();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to save DPR");
        } finally {
            setSavingDPR(false);
        }
    };

    const verifyDPR = async (dpr) => {
        try {
            await axios.put(`${DPR_API}/${dpr._id}/verify`);

            toast.success("DPR verified");
            fetchDPRs();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to verify DPR");
        }
    };

    const rejectDPR = async (dpr) => {
        try {
            const reason = window.prompt("Enter rejection reason");

            if (!reason) return;

            await axios.put(`${DPR_API}/${dpr._id}/reject`, {
                rejectionReason: reason,
            });

            toast.success("DPR rejected");
            fetchDPRs();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to reject DPR");
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        fetchDPRs();
    }, [selectedProject]);

    const deleteDPR = async (dpr) => {
        try {
            const ok = window.confirm(
                `Delete DPR ${dpr.dprNumber || ""}?`
            );

            if (!ok) return;

            await axios.delete(`${DPR_API}/${dpr._id}`);

            toast.success("DPR deleted");
            fetchDPRs();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to delete DPR");
        }
    };

    const stats = {
        total: dprs.length,
        submitted: dprs.filter((d) => d.status === "SUBMITTED").length,
        verified: dprs.filter((d) => d.status === "VERIFIED").length,
        manpower: dprs.reduce(
            (sum, d) => sum + Number(d.manpowerCount || 0),
            0
        ),
    };

    return (
        <div className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm font-semibold text-cyan-300">
                        Daily Progress Report
                    </p>
                    <h1 className="text-2xl font-bold">DPR Management</h1>
                    <p className="text-sm text-slate-400">
                        Daily site work, manpower, material received and material used.
                    </p>
                </div>

                <button
                    onClick={openAddDPR}
                    className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950"
                >
                    <Plus size={18} />
                    Create DPR
                </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                <StatCard title="Total DPR" value={stats.total} />
                <StatCard title="Submitted" value={stats.submitted} />
                <StatCard title="Verified" value={stats.verified} />
                <StatCard title="Total Manpower" value={stats.manpower} />
            </div>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                    <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
                    >
                        <option value="">All Projects</option>
                        {projects.map((p) => (
                            <option key={p._id} value={p._id}>
                                {p.projectName || p.name}
                            </option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
                    />

                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
                    />

                    <div className="relative">
                        <Search
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                        />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search..."
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4"
                        />
                    </div>

                    <button
                        onClick={fetchDPRs}
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-5 py-3"
                    >
                        <RefreshCw size={17} />
                        Apply
                    </button>
                </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] text-sm">
                        <thead className="bg-slate-950 text-slate-400">
                            <tr>
                                <th className="p-4 text-left">DPR No</th>
                                <th className="p-4 text-left">Date</th>
                                <th className="p-4 text-left">Project</th>
                                <th className="p-4 text-left">Site Incharge</th>
                                <th className="p-4 text-right">Manpower</th>
                                <th className="p-4 text-left">Work Done</th>
                                <th className="p-4 text-left">Status</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-slate-400">
                                        Loading DPR...
                                    </td>
                                </tr>
                            ) : dprs.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-slate-400">
                                        No DPR found
                                    </td>
                                </tr>
                            ) : (
                                dprs.map((dpr) => (
                                    <tr key={dpr._id} className="border-t border-slate-800">
                                        <td className="p-4 font-semibold text-cyan-300">
                                            {dpr.dprNumber || "-"}
                                        </td>

                                        <td className="p-4">{formatDate(dpr.reportDate)}</td>

                                        <td className="p-4">
                                            {dpr.projectName || dpr.projectRef?.name || "-"}
                                        </td>

                                        <td className="p-4">
                                            {dpr.siteInchargeName || "-"}
                                        </td>

                                        <td className="p-4 text-right">
                                            {dpr.manpowerCount || 0}
                                        </td>

                                        <td className="max-w-[320px] truncate p-4 text-slate-300">
                                            {dpr.workDoneToday || "-"}
                                        </td>

                                        <td className="p-4">
                                            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                                                {dpr.status}
                                            </span>
                                        </td>

                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => openViewDPR(dpr)}
                                                    className="rounded-lg bg-slate-800 p-2 text-slate-300 hover:bg-slate-700"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                <button
                                                    onClick={() => openEditDPR(dpr)}
                                                    className="rounded-lg bg-blue-500/10 p-2 text-blue-300 hover:bg-blue-500/20"
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    onClick={() => deleteDPR(dpr)}
                                                    className="rounded-lg bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                {dpr.status !== "VERIFIED" && (
                                                    <button
                                                        onClick={() => verifyDPR(dpr)}
                                                        className="rounded-lg bg-emerald-500/10 p-2 text-emerald-300 hover:bg-emerald-500/20"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                )}

                                                {dpr.status !== "REJECTED" && (
                                                    <button
                                                        onClick={() => rejectDPR(dpr)}
                                                        className="rounded-lg bg-orange-500/10 p-2 text-orange-300 hover:bg-orange-500/20"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {dprModalOpen && (
                <CreateDPRModal
                    form={dprForm}
                    setForm={setDprForm}
                    projects={projects}
                    saving={savingDPR}
                    onClose={() => {
                        setDprModalOpen(false);
                        setSelectedDPR(null);
                    }}
                    onSave={saveDPR}
                    mode={dprMode}
                />
            )}
        </div>
    );
}

function StatCard({ title, value }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-4">
            <p className="text-sm text-slate-400">{title}</p>
            <h3 className="mt-2 text-xl font-bold text-white">{value}</h3>
        </div>
    );
}