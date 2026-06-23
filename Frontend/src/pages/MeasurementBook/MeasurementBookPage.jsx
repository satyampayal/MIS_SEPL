import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import BASE_URL from "../../../config/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const MB_API = `${BASE_URL}/measurement-book`;
const PROJECT_API = `${BASE_URL}/project-master/all`;
const CONTRACTOR_API = `${BASE_URL}/contractor`;

const emptyForm = {
    projectRef: "",
    // boqItemRef: null,
    contractorRef: "",
    measurementDate: new Date().toISOString().slice(0, 10),
    executedByType: "SEPL",
    // todayQty: "",


    location: "",
    floor: "",
    area: "",
    remarks: "",

    items: [],
};
export default function MeasurementBookPage() {


    const [createModal, setCreateModal] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [boqItems, setBoqItems] = useState([]);
    const [boqSearch, setBoqSearch] = useState("");
    const [saving, setSaving] = useState(false);
    const [projects, setProjects] = useState([]);
    const [entries, setEntries] = useState([]);
    const [projectRef, setProjectRef] = useState("");
    const [status, setStatus] = useState("All");
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [contractors, setContractors] = useState([]);

    const [modalMode, setModalMode] = useState("create");
    const [selectedEntry, setSelectedEntry] = useState(null);

    const fetchProjects = async () => {
        const res = await axios.get(PROJECT_API);
        setProjects(res.data.data || []);
    };

    const fetchEntries = async () => {
        try {
            setLoading(true);

            const params = {};
            if (projectRef) params.projectRef = projectRef;
            if (status !== "All") params.approvalStatus = status;

            const res = await axios.get(`${MB_API}/all`, { params });
            setEntries(res.data.entries || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch MB");
        } finally {
            setLoading(false);
        }
    };

    const fetchBoqPicker = async () => {
        if (!form.projectRef) return;

        const res = await axios.get(
            `${MB_API}/boq-picker/${form.projectRef}`,
            {
                params: { search: boqSearch },
            }
        );

        setBoqItems(res.data.items || []);
    };

    // console.log(boqItems)
    const fetchContractors = async () => {
        try {
            const res = await axios.get(`${CONTRACTOR_API}/all`);
            setContractors(res.data.contractors || res.data.data || []);
        } catch (error) {
            toast.error("Failed to load contractors");
        }
    };

    // const createMBEntry = async () => {
    //     try {
    //         if (!form.projectRef) return toast.error("Select project");
    //         if (!form.boqItemRef) return toast.error("Select BOQ item");

    //         const selectedBoq = boqItems.find((item) => item._id === form.boqItemRef);

    //         const todayQty = Number(form.todayQty || 0);

    //         const rate =
    //             form.executedByType === "CONTRACTOR"
    //                 ? Number(selectedBoq?.contractorInstallationRate || 0)
    //                 : 0;

    //         const amount = todayQty * rate;

    //         const afterTotal =
    //             Number(selectedBoq?.completedQty || 0) + todayQty;

    //         const afterBalance =
    //             Number(selectedBoq?.poQty || 0) - afterTotal;

    //         if (!selectedBoq) {
    //             return toast.error("Select valid BOQ item");
    //         }

    //         if (!form.todayQty || Number(form.todayQty) <= 0) {
    //             return toast.error("Enter valid today quantity");
    //         }

    //         if (Number(form.todayQty) > Number(selectedBoq.balanceQty || 0)) {
    //             return toast.error(
    //                 `Today qty cannot exceed balance qty (${selectedBoq.balanceQty} ${selectedBoq.uom})`
    //             );
    //         }

    //         if (form.executedByType === "CONTRACTOR" && !form.contractorRef) {
    //             return toast.error("Select contractor");
    //         }

    //         setSaving(true);

    //         await axios.post(`${MB_API}/create`, {
    //             ...form,
    //             todayQty: Number(form.todayQty),
    //         });

    //         toast.success("MB draft created");
    //         setCreateModal(false);
    //         setForm(emptyForm);
    //         setBoqSearch("");
    //         fetchEntries();
    //     } catch (error) {
    //         toast.error(error?.response?.data?.message || "Failed to create MB");
    //     } finally {
    //         setSaving(false);
    //     }
    // };

    /*
        const saveMBEntry = async () => {
            try {
                if (!form.projectRef) return toast.error("Select project");
                if (!form.boqItemRef) return toast.error("Select BOQ item");
    
                const selectedBoq = boqItems.find((item) => item._id === form.boqItemRef);
                const todayQty = Number(form.todayQty || 0);
    
                if (!selectedBoq && modalMode === "create") {
                    return toast.error("Select valid BOQ item");
                }
    
                if (!form.todayQty || todayQty <= 0) {
                    return toast.error("Enter valid today quantity");
                }
    
                if (form.executedByType === "CONTRACTOR" && !form.contractorRef) {
                    return toast.error("Select contractor");
                }
    
    
                setSaving(true);
    
                if (modalMode === "edit" && selectedEntry?._id) {
                    await axios.put(`${MB_API}/${selectedEntry._id}`, {
                        ...form,
                        todayQty,
                    });
                    toast.success("MB updated");
                } else {
                    await axios.post(`${MB_API}/create`, {
                        ...form,
                        todayQty,
                    });
                    toast.success("MB draft created");
                }
    
                setCreateModal(false);
                setSelectedEntry(null);
                setModalMode("create");
                setForm(emptyForm);
                setBoqSearch("");
                fetchEntries();
            } catch (error) {
                toast.error(error?.response?.data?.message || "Failed to save MB");
            } finally {
                setSaving(false);
            }
        };
        */
    const saveMBEntry = async () => {
        try {
            if (!form.projectRef) return toast.error("Select project");

            if (form.executedByType === "CONTRACTOR" && !form.contractorRef) {
                return toast.error("Select contractor");
            }

            setSaving(true);

            if (modalMode === "edit" && selectedEntry?._id) {

                const firstItem = form.items?.[0];

                await axios.put(`${MB_API}/${selectedEntry._id}`, {
                    projectRef: form.projectRef,

                    boqItemRef: firstItem?.boqItemRef,

                    contractorRef:
                        form.executedByType === "CONTRACTOR"
                            ? form.contractorRef
                            : null,

                    measurementDate: form.measurementDate,
                    executedByType: form.executedByType,

                    todayQty: Number(firstItem?.todayQty || 0),

                    location: form.location,
                    floor: form.floor,
                    area: form.area,

                    remarks: form.remarks,
                });

                toast.success("MB updated");
            } else {
                const validItems = form.items
                    .map((item) => ({
                        boqItemRef: item.boqItemRef,
                        todayQty: Number(item.todayQty || 0),
                        remarks: item.remarks || "",
                    }))
                    .filter((item) => item.boqItemRef && item.todayQty > 0);

                if (!validItems.length) {
                    return toast.error("Enter qty for at least one BOQ item");
                }

                await axios.post(`${MB_API}/create-bulk`, {
                    projectRef: form.projectRef,
                    contractorRef:
                        form.executedByType === "CONTRACTOR" ? form.contractorRef : null,
                    measurementDate: form.measurementDate,
                    executedByType: form.executedByType,
                    location: form.location,
                    floor: form.floor,
                    area: form.area,
                    remarks: form.remarks,
                    items: validItems,
                });

                toast.success(`${validItems.length} MB draft entries created`);
            }

            setCreateModal(false);
            setSelectedEntry(null);
            setModalMode("create");
            setForm(emptyForm);
            setBoqSearch("");
            fetchEntries();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to save MB");
        } finally {
            setSaving(false);
        }
    };
    const submitEntry = async (id) => {
        try {
            await axios.put(`${MB_API}/submit/${id}`);
            toast.success("MB submitted for approval");
            fetchEntries();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to submit MB");
        }
    };

    const approveEntry = async (id) => {
        try {
            await axios.put(`${MB_API}/approve/${id}`);
            toast.success("MB approved");
            fetchEntries();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to approve MB");
        }
    };

    const rejectEntry = async (id) => {
        const reason = window.prompt("Enter rejection reason");

        if (!reason) return;

        try {
            await axios.put(`${MB_API}/reject/${id}`, {
                rejectionReason: reason,
            });

            toast.success("MB rejected");
            fetchEntries();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to reject MB");
        }
    };

    const copyMBEntry = (entry) => {
        setModalMode("create");
        setSelectedEntry(null);

        setForm({
            projectRef: entry.projectRef?._id || entry.projectRef || null,
            contractorRef: entry.contractorRef?._id || entry.contractorRef || null,
            measurementDate: new Date().toISOString().slice(0, 10),
            executedByType: entry.executedByType || "SEPL",

            location: entry.location || "",
            floor: entry.floor || "",
            area: entry.area || "",
            remarks: entry.remarks || "",

            items: [
                {
                    boqItemRef: entry.boqItemRef?._id || entry.boqItemRef,
                    boqSrNo: entry.boqItemRef?.boqSrNo || "",
                    boqItemCode: entry.boqItemRef?.boqItemCode || "",
                    activity: entry.boqItemRef?.activity || "",
                    generalName: entry.boqItemRef?.generalName || "",
                    description: entry.boqItemRef?.description || "",
                    uom: entry.uom || entry.boqItemRef?.uom || "",
                    poQty: entry.boqItemRef?.poQty || 0,
                    completedQty: entry.boqItemRef?.completedQty || 0,
                    balanceQty: entry.boqItemRef?.balanceQty || 0,
                    installationRate: entry.boqItemRef?.installationRate || 0,
                    contractorInstallationRate:
                        entry.boqItemRef?.contractorInstallationRate || 0,
                    todayQty: "",
                    remarks: "",
                },
            ],
        });

        setCreateModal(true);
    };

    // console.log(entries)
    const filteredEntries = entries.filter((entry) => {
        const text = [
            entry.projectRef?.projectName,
            entry.projectRef?.name,
            entry.contractorRef?.contractorName,
            entry.boqItemRef?.activity,
            entry.boqItemRef?.generalName,
            entry.boqItemRef?.description,
            entry.boqItemRef?.boqSrNo,
            entry.executedByType,
            entry.approvalStatus,
            entry.location,
            entry.floor,
            entry.area,
        ]
            .join(" ")
            .toLowerCase();

        return text.includes(search.toLowerCase());
    });

    const totalPages = Math.max(
        1,
        Math.ceil(filteredEntries.length / itemsPerPage)
    );

    const paginatedEntries = filteredEntries.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Export Excel
    const exportMBExcel = () => {
        const rows = filteredEntries.map((e, index) => ({
            "S No": index + 1,
            Date: new Date(e.measurementDate).toLocaleDateString("en-IN"),
            Project: e.projectRef?.projectName || e.projectRef?.name || "",
            "BOQ Sr No": e.boqItemRef?.boqSrNo || "",
            "BOQ Code": e.boqItemRef?.boqItemCode || "",
            Activity:
                e.boqItemRef?.activity ||
                e.boqItemRef?.generalName ||
                e.boqItemRef?.description ||
                "",
            Description:
                e.boqItemRef?.description ||
                "",
            UOM: e.uom || "",
            "Executed By": e.executedByType || "",
            Contractor: e.contractorRef?.contractorName || "",
            "Previous Qty": e.previousQty || 0,
            "Today Qty": e.todayQty || 0,
            "Total Qty": e.totalQty || 0,
            "Balance Qty": e.balanceQty || 0,
            Rate: e.rate || 0,
            Amount: e.amount || 0,
            Location: e.location || "",
            Floor: e.floor || "",
            Area: e.area || "",
            Status: e.approvalStatus || "",
            Remarks: e.remarks || "",
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(wb, ws, "Measurement Book");

        const excelBuffer = XLSX.write(wb, {
            bookType: "xlsx",
            type: "array",
        });

        saveAs(
            new Blob([excelBuffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }),
            "Measurement_Book.xlsx"
        );
    };

    const stats = {
        totalEntries: filteredEntries.length,

        draft: filteredEntries.filter((e) => e.approvalStatus === "DRAFT").length,

        pending: filteredEntries.filter((e) => e.approvalStatus === "PENDING").length,

        approved: filteredEntries.filter((e) => e.approvalStatus === "APPROVED").length,

        rejected: filteredEntries.filter((e) => e.approvalStatus === "REJECTED").length,

        contractorQty: filteredEntries.reduce(
            (sum, e) =>
                e.executedByType === "CONTRACTOR"
                    ? sum + Number(e.todayQty || 0)
                    : sum,
            0
        ),

        contractorAmount: filteredEntries.reduce(
            (sum, e) =>
                e.executedByType === "CONTRACTOR"
                    ? sum + Number(e.amount || 0)
                    : sum,
            0
        ),

        seplQty: filteredEntries.reduce(
            (sum, e) =>
                e.executedByType === "SEPL"
                    ? sum + Number(e.todayQty || 0)
                    : sum,
            0
        ),
        seplAmount: filteredEntries.reduce(
            (sum, e) =>
                e.executedByType === "SEPL"
                    ? sum + Number(e.amount || 0)
                    : sum,
            0
        ),


    };

    const statusClass = (status) => {
        switch (status) {
            case "DRAFT":
                return "border-slate-500/30 bg-slate-500/10 text-slate-300";

            case "PENDING":
                return "border-amber-500/30 bg-amber-500/10 text-amber-300";

            case "APPROVED":
                return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";

            case "REJECTED":
                return "border-red-500/30 bg-red-500/10 text-red-300";

            case "CANCELLED":
                return "border-zinc-500/30 bg-zinc-500/10 text-zinc-300";

            default:
                return "border-slate-500/30 bg-slate-500/10 text-slate-300";
        }
    };

    const openViewEntry = (entry) => {
        console.log(entry)
        setModalMode("view");
        setSelectedEntry(entry);

        setForm({
            projectRef: entry.projectRef?._id || entry.projectRef || "",
            contractorRef: entry.contractorRef?._id || entry.contractorRef || "",
            measurementDate: entry.measurementDate
                ? new Date(entry.measurementDate).toISOString().slice(0, 10)
                : "",
            executedByType: entry.executedByType || "SEPL",

            location: entry.location || "",
            floor: entry.floor || "",
            area: entry.area || "",
            remarks: entry.remarks || "",

            items: [
                {
                    boqItemRef: entry.boqItemRef?._id || entry.boqItemRef || "",
                    boqSrNo: entry.boqItemRef?.boqSrNo || "",
                    boqItemCode: entry.boqItemRef?.boqItemCode || "",
                    activity: entry.boqItemRef?.activity || "",
                    generalName: entry.boqItemRef?.generalName || "",
                    description: entry.boqItemRef?.description || "",
                    uom: entry.uom || entry.boqItemRef?.uom || "",
                    poQty: entry.boqItemRef?.poQty || 0,
                    completedQty: entry.previousQty || entry.boqItemRef?.completedQty || 0,
                    balanceQty: entry.balanceQty || entry.boqItemRef?.balanceQty || 0,
                    installationRate: entry.boqItemRef?.installationRate || 0,
                    contractorInstallationRate:
                        entry.boqItemRef?.contractorInstallationRate || 0,
                    todayQty: entry.todayQty || "",
                    remarks: entry.remarks || "",
                },
            ],
        });

        setCreateModal(true);
    };

    const openEditEntry = (entry) => {
        if (!["DRAFT", "REJECTED"].includes(entry.approvalStatus)) {
            return toast.error("Only draft or rejected MB can be edited");
        }

        setModalMode("edit");
        setSelectedEntry(entry);

        setForm({
            projectRef: entry.projectRef?._id || entry.projectRef || "",
            contractorRef: entry.contractorRef?._id || entry.contractorRef || "",
            measurementDate: entry.measurementDate
                ? new Date(entry.measurementDate).toISOString().slice(0, 10)
                : "",
            executedByType: entry.executedByType || "SEPL",

            location: entry.location || "",
            floor: entry.floor || "",
            area: entry.area || "",
            remarks: entry.remarks || "",

            items: [
                {
                    boqItemRef: entry.boqItemRef?._id || entry.boqItemRef || "",
                    boqSrNo: entry.boqItemRef?.boqSrNo || "",
                    boqItemCode: entry.boqItemRef?.boqItemCode || "",
                    activity: entry.boqItemRef?.activity || "",
                    generalName: entry.boqItemRef?.generalName || "",
                    description: entry.boqItemRef?.description || "",
                    uom: entry.uom || entry.boqItemRef?.uom || "",
                    poQty: entry.boqItemRef?.poQty || 0,
                    completedQty: entry.previousQty || 0,
                    balanceQty: entry.balanceQty || 0,
                    installationRate: entry.boqItemRef?.installationRate || 0,
                    contractorInstallationRate:
                        entry.boqItemRef?.contractorInstallationRate || 0,
                    todayQty: entry.todayQty || "",
                    remarks: entry.remarks || "",
                },
            ],
        });

        setCreateModal(true);
    };


    useEffect(() => {
        fetchProjects();
        fetchContractors();
    }, []);

    useEffect(() => {
        fetchEntries();
    }, [projectRef, status]);

    useEffect(() => {
        fetchBoqPicker();
    }, [form.projectRef, boqSearch]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, projectRef, status, itemsPerPage]);



    function StatCard({ title, value }) {
        return (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg shadow-slate-950/30">
                <p className="text-xs text-slate-400">{title}</p>
                <h2 className="mt-2 text-lg font-bold text-cyan-300">{value}</h2>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-slate-950 p-6 text-white">
            <h1 className="text-2xl font-bold">Measurement Book</h1>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-5">
                <select
                    value={projectRef}
                    onChange={(e) => setProjectRef(e.target.value)}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
                >
                    <option value="">All Projects</option>
                    {projects.map((p) => (
                        <option key={p._id} value={p._id}>
                            {p.projectName || p.name}
                        </option>
                    ))}
                </select>

                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
                >
                    <option>All</option>
                    <option>DRAFT</option>
                    <option>PENDING</option>
                    <option>APPROVED</option>
                    <option>REJECTED</option>
                </select>

                <button
                    onClick={fetchEntries}
                    className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950"
                >
                    Refresh
                </button>
                <button
                    onClick={() => setCreateModal(true)}
                    className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950"
                >
                    Create MB Entry
                </button>
                <button
                    onClick={exportMBExcel}
                    className="rounded-xl bg-indigo-500 px-5 py-3 font-semibold text-white"
                >
                    Export Excel
                </button>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4 xl:grid-cols-9">
                <StatCard title="Total MB" value={stats.totalEntries} />
                <StatCard title="Draft" value={stats.draft} />
                <StatCard title="Pending" value={stats.pending} />
                <StatCard title="Approved" value={stats.approved} />
                <StatCard title="Rejected" value={stats.rejected} />
                <StatCard title="SEPL Qty" value={stats.seplQty} />
                <StatCard
                    title="SEPL Amount"
                    value={`₹${stats.seplAmount.toLocaleString("en-IN")}`}
                />
                <StatCard title="Contractor Qty" value={stats.contractorQty} />
                <StatCard
                    title="Contractor Amount"
                    value={`₹${stats.contractorAmount.toLocaleString("en-IN")}`}
                />
            </div>
            <div className="mt-6">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search BOQ item, contractor, status, area..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                />
            </div>

            <div className="mt-7 rounded-2xl border border-slate-800 bg-slate-900">
                <table className="w-full text-sm">
                    <thead className="bg-slate-950 text-slate-400">
                        <tr>
                            <th className="p-4 text-left">Date</th>
                            <th className="p-4 text-left">BOQ Item</th>
                            <th className="p-4 text-left">Executed By</th>
                            <th className="p-4 text-left">Today Qty</th>
                            <th className="p-4 text-left">Amount</th>
                            <th className="p-4 text-left">Status</th>
                            <th className="p-4 text-left">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-slate-400">
                                    Loading...
                                </td>
                            </tr>
                        ) : paginatedEntries.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-slate-400">
                                    No MB entries found
                                </td>
                            </tr>
                        ) : (
                            paginatedEntries.map((entry) => (
                                <tr key={entry._id} className="border-t border-slate-800">
                                    <td className="p-4">
                                        {new Date(entry.measurementDate).toLocaleDateString("en-IN")}
                                    </td>

                                    <td className="p-4">
                                        <div className="font-semibold">
                                            {entry.boqItemRef?.activity ||
                                                entry.boqItemRef?.generalName ||
                                                entry.boqItemRef?.description ||
                                                "-"}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {entry.boqItemRef?.boqSrNo} · {entry.uom}
                                        </div>
                                    </td>

                                    <td className="p-4">{entry.executedByType}</td>

                                    <td className="p-4">{entry.todayQty}</td>

                                    <td className="p-4">
                                        ₹{Number(entry.amount || 0).toLocaleString("en-IN")}
                                    </td>

                                    <td className="p-4">
                                        <span
                                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(
                                                entry.approvalStatus
                                            )}`}
                                        >
                                            {entry.approvalStatus}
                                        </span>
                                    </td>
                                    <td className="p-4 flex  gap-2">
                                        <button
                                            onClick={() => openViewEntry(entry)}
                                            className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => copyMBEntry(entry)}
                                            className="rounded-lg bg-purple-500 px-3 py-1.5 text-xs font-semibold text-white"
                                        >
                                            Copy
                                        </button>

                                        {["DRAFT", "REJECTED"].includes(entry.approvalStatus) && (
                                            <button
                                                onClick={() => openEditEntry(entry)}
                                                className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white"
                                            >
                                                Edit
                                            </button>
                                        )}

                                        {entry.approvalStatus === "DRAFT" && (
                                            <button
                                                onClick={() => submitEntry(entry._id)}
                                                className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white"
                                            >
                                                Submit
                                            </button>
                                        )}

                                        {entry.approvalStatus === "PENDING" && (
                                            <>
                                                <button
                                                    onClick={() => approveEntry(entry._id)}
                                                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950"
                                                >
                                                    Approve
                                                </button>

                                                <button
                                                    onClick={() => rejectEntry(entry._id)}
                                                    className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}

                                        {entry.approvalStatus === "REJECTED" && (
                                            <button
                                                onClick={() => submitEntry(entry._id)}
                                                className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950"
                                            >
                                                Re-submit
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {filteredEntries.length > 0 && (
                    <div className="flex flex-col gap-3 border-t border-slate-800 px-5 py-4 md:flex-row md:items-center md:justify-between">
                        <div className="text-sm text-slate-400">
                            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                            {Math.min(currentPage * itemsPerPage, filteredEntries.length)} of{" "}
                            {filteredEntries.length} records
                        </div>

                        <div className="flex items-center gap-3">
                            <select
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
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
            {createModal && (
                <CreateMBModal
                    form={form}
                    setForm={setForm}
                    projects={projects}
                    contractors={contractors}
                    boqItems={boqItems}
                    boqSearch={boqSearch}
                    setBoqSearch={setBoqSearch}
                    onClose={() => {
                        setCreateModal(false);
                        setSelectedEntry(null);
                        setModalMode("create");
                        setForm(emptyForm);
                    }}
                    onSave={saveMBEntry}
                    saving={saving}
                    mode={modalMode}
                />
            )}
        </div>
    );
}

function CreateMBModal({
    form,
    setForm,
    projects,
    contractors,
    boqItems,
    boqSearch,
    setBoqSearch,
    onClose,
    onSave,
    saving,
    mode,
}) {
    const isView = mode === "view";

    const selectedItems = Array.isArray(form.items) ? form.items : [];
    const update = (e) => {
        if(isView) return;
        
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
            ...(name === "projectRef" ? { boqItemRef: "" } : {}),
            ...(name === "executedByType" && value === "SEPL"
                ? { contractorRef: "" }
                : {}),
        }));
    };


    const toggleBOQItem = (item) => {
        if (isView) return;

        setForm((prev) => {
            // const exists = prev.items.some((x) => x.boqItemRef === item._id);
            const prevItems = Array.isArray(prev.items) ? prev.items : [];
            const exists = prevItems.some((x) => x.boqItemRef === item._id);

            if (exists) {
                return {
                    ...prev,
                    items: prev.items.filter((x) => x.boqItemRef !== item._id),
                };
            }

            return {
                ...prev,
                items: [
                    ...prev.items,
                    {
                        boqItemRef: item._id,
                        boqSrNo: item.boqSrNo || "",
                        boqItemCode: item.boqItemCode || "",
                        activity: item.activity || "",
                        generalName: item.generalName || "",
                        description: item.description || "",
                        uom: item.uom || "",
                        poQty: item.poQty || 0,
                        completedQty: item.completedQty || 0,
                        balanceQty: item.balanceQty || 0,
                        installationRate: item.installationRate || 0,
                        contractorInstallationRate: item.contractorInstallationRate || 0,
                        todayQty: "",
                        remarks: "",
                    },
                ],
            };
        });
    };

    const selectedBoq = boqItems.find((b) => b._id === form.boqItemRef);
    const todayQty = Number(form.todayQty || 0);
    console.log(form.items)
    // console.log(selectedBoq)

    const rate =
        form.executedByType === "CONTRACTOR"
            ? Number(selectedBoq?.contractorInstallationRate || 0)
            : Number(selectedBoq?.installationRate || 0);

    const amount = todayQty * rate;

    const afterTotal =
        Number(selectedBoq?.completedQty || 0) + todayQty;

    const afterBalance =
        Number(selectedBoq?.poQty || 0) - afterTotal;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase text-cyan-300">
                            Measurement Book
                        </p>
                        <h2 className="text-xl font-bold">
                            {mode === "view" ? "View MB Entry" : mode === "edit" ? "Edit MB Entry" : "Create MB Draft"}
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-xl px-3 py-2 text-slate-400 hover:bg-slate-800"
                    >
                        ✕
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                    <FieldSelect

                        label="Project *"
                        name="projectRef"
                        value={form.projectRef}
                        onChange={update}
                    >
                        <option value="">Select Project</option>
                        {projects.map((p) => (
                            <option key={p._id} value={p._id}>
                                {p.projectName || p.name}
                            </option>
                        ))}
                    </FieldSelect>

                    <FieldInput
                        label="Measurement Date *"
                        name="measurementDate"
                        type="date"
                        value={form.measurementDate}
                        onChange={update}

                    />

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm text-slate-300">
                            Search BOQ Item
                        </label>
                        <input

                            value={boqSearch}
                            onChange={(e) => setBoqSearch(e.target.value)}
                            placeholder="Search tray, panel, cable..."
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
                        />
                    </div>

                    {/* <FieldSelect
                        label="BOQ Item *"
                        name="boqItemRef"
                        value={form.boqItemRef}
                        onChange={update}
                    >
                        <option value="">Select BOQ Item</option>
                        {boqItems.map((item) => (
                            <option key={item._id} value={item._id}>
                                {item.boqSrNo} - {item.activity || item.generalName} | Bal:{" "}
                                {item.balanceQty} {item.uom}
                            </option>
                        ))}
                    </FieldSelect> */}

                    {!isView && <div className="md:col-span-2">
                        <label className="mb-2 block text-sm text-slate-300">
                            Select BOQ Item *
                        </label>

                        <div className="grid max-h-72 gap-3 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                            {boqItems.length === 0 ? (
                                <div className="py-8 text-center text-sm text-slate-400">
                                    No BOQ items found
                                </div>
                            ) : (
                                boqItems.map((item) => {
                                    // const active = form.items.some((x) => x.boqItemRef === item._id);
                                    const active = selectedItems.some((x) => x.boqItemRef === item._id);

                                    return (
                                        <button
                                            key={item._id}
                                            type="button"
                                            onClick={() => toggleBOQItem(item)}
                                            className={`rounded-2xl border p-4 text-left transition ${active
                                                ? "border-cyan-400 bg-cyan-500/10"
                                                : "border-slate-800 bg-slate-950 hover:border-slate-600"
                                                }`}
                                        >
                                            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                                <div>
                                                    <p className="text-xs text-cyan-300">
                                                        {item.boqSrNo || "-"} · {item.boqItemCode || "-"}
                                                    </p>

                                                    <h3 className="mt-1 font-semibold text-white">
                                                        {item.activity || item.generalName || "BOQ Activity"}
                                                    </h3>

                                                    <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                                                        {item.description || "-"}
                                                    </p>
                                                </div>

                                                <div className="text-right text-xs">
                                                    <p className="text-slate-400">Balance</p>
                                                    <p className="font-bold text-emerald-300">
                                                        {item.balanceQty} {item.uom}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                                                <div className="rounded-xl bg-slate-900 p-2">
                                                    <p className="text-slate-500">BOQ Qty</p>
                                                    <p className="font-semibold text-white">{item.poQty}</p>
                                                </div>

                                                <div className="rounded-xl bg-slate-900 p-2">
                                                    <p className="text-slate-500">Done</p>
                                                    <p className="font-semibold text-blue-300">
                                                        {item.completedQty || 0}
                                                    </p>
                                                </div>

                                                <div className="rounded-xl bg-slate-900 p-2">
                                                    <p className="text-slate-500">Rate</p>
                                                    <p className="font-semibold text-amber-300">
                                                        ₹
                                                        {Number(
                                                            item.contractorInstallationRate || item.installationRate
                                                        ).toLocaleString("en-IN")}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>}
                    {form.items.length > 0 && (
                        <div className="md:col-span-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                            <h3 className="mb-3 font-semibold text-cyan-300">
                                Selected MB Items ({form.items.length})
                            </h3>

                            <div className="space-y-3">
                                {form.items.map((row, index) => {
                                    const qty = Number(row.todayQty || 0);
                                    const rate =
                                        form.executedByType === "CONTRACTOR"
                                            ? Number(row.contractorInstallationRate || 0)
                                            : Number(row.installationRate || 0);

                                    const amount = qty * rate;
                                    const totalAfter = Number(row.completedQty || 0) + qty;
                                    const balanceAfter = Number(row.poQty || 0) - totalAfter;

                                    return (
                                        <div
                                            key={row.boqItemRef}
                                            className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4 md:grid-cols-12"
                                        >
                                            <div className="md:col-span-4">
                                                <p className="text-xs text-cyan-300">
                                                    {row.boqSrNo || "-"} · {row.boqItemCode || "-"}
                                                </p>
                                                <p className="font-semibold text-white">
                                                    {row.activity || row.generalName || row.description || "-"}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    BOQ: {row.poQty.toLocaleString("en-IN",{ maximumFractionDigits: 2})} {row.uom} | Done: {row.completedQty.toLocaleString("en-IN",{ maximumFractionDigits: 2}) || 0} | Bal:{" "}
                                                    {row.balanceQty.toLocaleString("en-IN",{ maximumFractionDigits: 2}) || 0}
                                                </p>
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="mb-1 block text-xs text-slate-400">
                                                    Today Qty
                                                </label>
                                                <input
                                                    type="number"
                                                    value={row.todayQty}
                                                    onChange={(e) => {
                                                        const value = e.target.value;

                                                        setForm((prev) => {
                                                            const copy = [...prev.items];
                                                            copy[index] = {
                                                                ...copy[index],
                                                                todayQty: value,
                                                            };
                                                            return { ...prev, items: copy };
                                                        });
                                                    }}
                                                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-cyan-500"
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <p className="text-xs text-slate-500">Rate</p>
                                                <p className="font-semibold text-amber-300">
                                                    ₹{rate.toLocaleString("en-IN",{ maximumFractionDigits: 2})}
                                                </p>
                                            </div>

                                            <div className="md:col-span-2">
                                                <p className="text-xs text-slate-500">Amount</p>
                                                <p className="font-semibold text-emerald-300">
                                                    ₹{amount.toLocaleString("en-IN",{ maximumFractionDigits: 2})}
                                                </p>
                                            </div>

                                            <div className="md:col-span-1">
                                                <p className="text-xs text-slate-500">Bal After</p>
                                                <p
                                                    className={`font-semibold ${balanceAfter < 0 ? "text-red-300" : "text-white"
                                                        }`}
                                                >
                                                    {balanceAfter.toLocaleString("en-IN",{ maximumFractionDigits: 2})}
                                                </p>
                                            </div>

                                            <div className="md:col-span-1 flex items-center justify-end">
                                                {!isView && (
                                                    <button
                                                        onClick={() =>
                                                            setForm((prev) => ({
                                                                ...prev,
                                                                items: prev.items.filter((_, i) => i !== index),
                                                            }))
                                                        }
                                                        className="rounded-xl bg-red-500/10 px-3 py-2 text-red-300"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <FieldSelect

                        label="Executed By *"
                        name="executedByType"
                        value={form.executedByType}
                        onChange={update}
                    >
                        <option value="SEPL">SEPL</option>
                        <option value="CONTRACTOR">CONTRACTOR</option>
                    </FieldSelect>

                    {form.executedByType === "CONTRACTOR" && (
                        <FieldSelect
                            label="Contractor *"
                            name="contractorRef"
                            value={form.contractorRef}
                            onChange={update}
                        >
                            <option value="">Select Contractor</option>
                            {contractors.map((c) => (
                                <option key={c._id} value={c._id}>
                                    {c.contractorName}
                                </option>
                            ))}
                        </FieldSelect>
                    )}

                    {/* <FieldInput
                        label="Today Qty *"
                        name="todayQty"
                        type="number"
                        value={form.todayQty}
                        onChange={update}
                    /> */}
                    {selectedBoq && (
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 md:col-span-2">
                            <p className="text-sm text-slate-400">MB Calculation Preview</p>

                            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
                                <PreviewBox
                                    label="Previous Qty"
                                    value={`${selectedBoq.completedQty || 0} ${selectedBoq.uom}`}
                                />

                                <PreviewBox
                                    label="Today Qty"
                                    value={`${todayQty || 0} ${selectedBoq.uom}`}
                                />

                                <PreviewBox
                                    label="Total After"
                                    value={`${afterTotal.toLocaleString("en-IN",{ maximumFractionDigits: 2})} || 0} ${selectedBoq.uom}`}
                                />

                                <PreviewBox
                                    label="Balance After"
                                    value={`${afterBalance.toLocaleString("en-IN",{ maximumFractionDigits: 2})} || 0} ${selectedBoq.uom}`}
                                />

                                <PreviewBox
                                    label="Amount"
                                    value={`₹${amount.toLocaleString("en-IN",{ maximumFractionDigits: 2})}`}
                                />
                            </div>

                            {form.executedByType === "SEPL" && (
                                <p className="mt-3 text-xs text-cyan-300">
                                    SEPL execution updates project progress only. No contractor billing.
                                </p>
                            )}

                            {form.executedByType === "CONTRACTOR" && (
                                <p className="mt-3 text-xs text-amber-300">
                                    Contractor amount = Today Qty × Contractor Rate.
                                </p>
                            )}
                        </div>
                    )}

                    <FieldInput
                        label="Location"
                        name="location"
                        value={form.location}
                        onChange={update}
                    />

                    <FieldInput
                        label="Floor"
                        name="floor"
                        value={form.floor}
                        onChange={update}
                    />

                    <FieldInput
                        label="Area"
                        name="area"
                        value={form.area}
                        onChange={update}
                    />

                    {selectedBoq && (
                        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 md:col-span-2">
                            <p className="text-sm text-slate-400">Selected BOQ</p>
                            <h3 className="mt-1 font-bold text-cyan-300">
                                {selectedBoq.activity || selectedBoq.generalName}
                            </h3>
                            <p className="mt-1 text-sm text-slate-300">
                                BOQ Qty: {selectedBoq.poQty} {selectedBoq.uom} | Completed:{" "}
                                {selectedBoq.completedQty} | Balance: {selectedBoq.balanceQty}
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                                Contractor Rate: ₹
                                {Number(
                                    selectedBoq.contractorInstallationRate || 0
                                ).toLocaleString("en-IN",{ maximumFractionDigits: 2})}
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                                Installtion Rate: ₹
                                {Number(
                                    selectedBoq.installationRate || 0
                                ).toLocaleString("en-IN",{ maximumFractionDigits: 2})}
                            </p>
                        </div>
                    )}

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm text-slate-300">Remarks</label>
                        <textarea
                            name="remarks"
                            value={form.remarks}
                            onChange={update}
                            rows={2}
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-700 px-5 py-3 text-slate-300"
                    >
                        Cancel
                    </button>

                    {!isView && (
                        <button
                            onClick={onSave}
                            disabled={saving}
                            className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
                        >
                            {saving ? "Saving..." : mode === "edit" ? "Update MB" : "Save Draft"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function FieldInput({ label, name, value, onChange, type = "text", placeholder }) {
    return (
        <div>
            <label className="mb-2 block text-sm text-slate-300">{label}</label>
            <input
                name={name}
                value={value}
                type={type}
                placeholder={placeholder}
                onChange={onChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
            />
        </div>
    );
}

function FieldSelect({ label, name, value, onChange, children }) {
    return (
        <div>
            <label className="mb-2 block text-sm text-slate-300">{label}</label>
            <select
                name={name}
                value={value}
                onChange={onChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
            >
                {children}
            </select>
        </div>
    );
}


function PreviewBox({ label, value }) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 font-bold text-white">{value}</p>
        </div>
    );
}