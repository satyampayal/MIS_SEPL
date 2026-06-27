import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    BarChart3,
    Activity,
    AlertTriangle,
    IndianRupee,
    Search,
    RefreshCw,
    Layers,
    Clock
} from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import toast from "react-hot-toast";
import BASE_URL from "../../../config/api";

const formatAmount = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 0,
    });
const getCountdown = (dateString) => {
    if (!dateString) return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: false };

    const target = new Date(dateString).getTime();
    const now = new Date().getTime();
    const diff = target - now;
    const absDiff = Math.abs(diff);

    return {
        days: Math.floor(absDiff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((absDiff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((absDiff / (1000 * 60)) % 60),
        seconds: Math.floor((absDiff / 1000) % 60),
        isOver: diff <= 0,
    };
};

const BAR_COLORS = [
    "#22d3ee", // cyan
    "#34d399", // emerald
    "#f59e0b", // amber
    "#a855f7", // purple
    "#ef4444", // red
    "#3b82f6", // blue
    "#ec4899", // pink
    "#14b8a6", // teal
];

export default function BOQAnalyticsPage() {
    const [boqs, setBoqs] = useState([]);
    const [items, setItems] = useState([]);
    const [selectedBOQ, setSelectedBOQ] = useState(null);

    const [viewMode, setViewMode] = useState("ALL"); // ALL | PROJECT | BOQ
    const [selectedProject, setSelectedProject] = useState("");
    const [selectedBOQId, setSelectedBOQId] = useState("");

    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    const [countdown, setCountdown] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isOver: false,
    });

    const completionDate =
        viewMode === "BOQ"
            ? selectedBOQ?.projectRef?.complitionDate ||
            selectedBOQ?.complitionDate ||
            selectedBOQ?.complitionDate
            : null;


    const getDaysLeft = (dateString) => {
        if (!dateString) return null;

        const endDate = new Date(dateString);

        if (isNaN(endDate.getTime())) return null;

        const today = new Date();

        today.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        return Math.ceil(
            (endDate.getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24)
        );
    };



    // console.log(completionDate)

    const daysLeft = getDaysLeft(completionDate);

    useEffect(() => {
        if (!completionDate) {
            setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: false });
            return;
        }

        const updateCountdown = () => {
            setCountdown(getCountdown(completionDate));
        };

        updateCountdown();

        const timer = setInterval(updateCountdown, 1000);

        return () => clearInterval(timer);
    }, [completionDate]);

    const fetchBOQs = async () => {
        try {
            setLoading(true);

            const res = await axios.get(`${BASE_URL}/boq/all`);

            const list = res.data?.boqs || res.data?.data || res.data || [];

            setBoqs(Array.isArray(list) ? list : []);
            setViewMode("ALL");
            setSelectedProject("");
            setSelectedBOQId("");
            setSelectedBOQ(null);

            if (Array.isArray(list) && list.length > 0) {
                await fetchMultipleBOQItems(list);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch BOQ list");
        } finally {
            setLoading(false);
        }
    };

    const fetchSingleBOQ = async (boqId) => {
        try {
            setLoading(true);

            const res = await axios.get(`${BASE_URL}/boq/${boqId}`);

            const boq = res.data?.boq || null;
            const boqItems = res.data?.items || [];

            setSelectedBOQ(boq);
            setItems(
                boqItems.map((item) => ({
                    ...item,
                    boqName: boq?.boqName || boq?.title || "BOQ",
                    projectName: boq?.projectRef?.name || boq?.projectName || "-",
                }))
            );
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch BOQ");
        } finally {
            setLoading(false);
        }
    };

    const fetchMultipleBOQItems = async (boqList) => {
        try {
            setLoading(true);

            if (!boqList || boqList.length === 0) {
                setItems([]);
                return;
            }

            const responses = await Promise.all(
                boqList.map((boq) => axios.get(`${BASE_URL}/boq/${boq._id}`))
            );

            const combinedItems = responses.flatMap((res) => {
                const boq = res.data?.boq;
                const boqItems = res.data?.items || [];

                return boqItems.map((item) => ({
                    ...item,
                    boqName: boq?.boqName || boq?.title || "BOQ",
                    projectName: boq?.projectRef?.name || boq?.projectName || "-",
                }));
            });

            setItems(combinedItems);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to load analytics");
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        fetchBOQs();
    }, []);

    const projects = useMemo(() => {
        const map = new Map();

        boqs.forEach((boq) => {
            const projectId = boq.projectRef?._id || boq.projectRef || boq.projectId;
            const projectName =
                boq.projectRef?.name || boq.projectName || "Unknown Project";

            if (projectId) {
                map.set(String(projectId), {
                    _id: String(projectId),
                    name: projectName,
                });
            }
        });

        return Array.from(map.values());
    }, [boqs]);

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const value = `${item.boqItemCode || ""} ${item.activity || ""} ${item.generalName || ""
                } ${item.description || ""} ${item.boqName || ""} ${item.projectName || ""
                }`;

            return value.toLowerCase().includes(search.toLowerCase());
        });
    }, [items, search]);

    const analytics = useMemo(() => {
        const totalPoQty = filteredItems.reduce(
            (sum, item) => sum + Number(item.poQty || 0),
            0
        );

        const completedQty = filteredItems.reduce(
            (sum, item) => sum + Number(item.completedQty || 0),
            0
        );

        const supplyAmount = filteredItems.reduce(
            (sum, item) => sum + Number(item.supplyAmount || 0),
            0
        );

        const installationAmount = filteredItems.reduce(
            (sum, item) => sum + Number(item.installationAmount || 0),
            0
        );

        const executedValue = filteredItems.reduce((sum, item) => {
            return (
                sum +
                Number(item.completedQty || 0) * Number(item.installationRate || 0)
            );
        }, 0);

        const companyBOQValue = supplyAmount + installationAmount;
        const balanceValue = companyBOQValue - executedValue;

        const progress =
            totalPoQty > 0 ? Number(((completedQty / totalPoQty) * 100).toFixed(1)) : 0;
        const installProgress =
            executedValue > 0 ? Number(((executedValue / installationAmount) * 100).toFixed(1)) : 0;

        const riskItems = filteredItems
            .map((item) => {
                const poQty = Number(item.poQty || 0);
                const completedQty = Number(item.completedQty || 0);
                const itemProgress = poQty > 0 ? (completedQty / poQty) * 100 : 0;

                return {
                    ...item,
                    itemProgress,
                    balanceQty: poQty - completedQty,
                };
            })
            .filter((item) => Number(item.poQty || 0) > 0 && item.itemProgress < 30)
            .sort((a, b) => a.itemProgress - b.itemProgress);

        const topValueItems = [...filteredItems]
            .map((item) => ({
                ...item,
                totalValue:
                    Number(item.supplyAmount || 0) + Number(item.installationAmount || 0),
            }))
            .sort((a, b) => b.totalValue - a.totalValue)
            .slice(0, 10);

        const health =
            progress >= 75 ? "GOOD" : progress >= 40 ? "AVERAGE" : "CRITICAL";

        return {
            totalItems: filteredItems.length,
            totalPoQty,
            completedQty,
            companyBOQValue,
            executedValue,
            balanceValue,
            progress,
            riskItems,
            topValueItems,
            health,
            installProgress,
        };
    }, [filteredItems]);

    const handleAllAnalysis = async () => {
        setViewMode("ALL");
        setSelectedProject("");
        setSelectedBOQId("");
        setSelectedBOQ(null);
        await fetchMultipleBOQItems(boqs);
    };

    const handleProjectChange = async (projectId) => {
        setSelectedProject(projectId);
        setSelectedBOQId("");
        setSelectedBOQ(null);
        setViewMode("PROJECT");

        const projectBOQs = boqs.filter((boq) => {
            const boqProjectId = boq.projectRef?._id || boq.projectRef || boq.projectId;
            return String(boqProjectId) === String(projectId);
        });

        await fetchMultipleBOQItems(projectBOQs);
    };

    const handleBOQChange = async (boqId) => {
        setSelectedBOQId(boqId);
        setSelectedProject("");
        setViewMode("BOQ");

        await fetchSingleBOQ(boqId);
    };

    const totalPages = Math.ceil(filteredItems.length / rowsPerPage);

    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const chartData = analytics.topValueItems.slice(0, 8).map((item) => ({
        name: item.generalName || item.activity || item.description || item.boqSrNo || "Item",
        value: Number(item.totalValue || 0),
    }));

    const progressPieData = [
        { name: "Completed", value: analytics.completedQty },
        {
            name: "Balance",
            value: Math.max(analytics.totalPoQty - analytics.completedQty, 0),
        },
    ];

    const pageTitle =
        viewMode === "ALL"
            ? "All Project BOQ Analysis"
            : viewMode === "PROJECT"
                ? "Selected Project BOQ Analysis"
                : "Single BOQ Analysis";

    const formatDate = (date) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // const formatDate = (dateString) => {
    //   if (!dateString) return "-";

    //   const date = new Date(dateString);

    //   if (isNaN(date.getTime())) return dateString;

    //   return date.toLocaleDateString("en-IN", {
    //     day: "2-digit",
    //     month: "short",
    //     year: "numeric",
    //   });
    // };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6">
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-xl mb-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">
                            BOQ Analytics Map
                        </p>

                        <h1 className="text-2xl font-bold text-white mt-1">{pageTitle}</h1>

                        <p className="text-sm text-slate-400 mt-2">
                            MD view for BOQ value, progress, executed work, balance and risk.
                        </p>
                    </div>

                    <button
                        onClick={fetchBOQs}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                        <RefreshCw size={17} />
                        Refresh
                    </button>
                </div>
            </div>
            <div className="sticky top-0 z-30 mb-5 rounded-3xl border border-slate-800 bg-slate-950/95 backdrop-blur-xl p-4 shadow-xl">

                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-amber-400">
                            Project Completion Countdown
                        </p>

                        <h2 className="text-xl font-bold text-white mt-1">
                            {completionDate
                                ? formatDate(completionDate)
                                : "Select single BOQ to view countdown"}
                        </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div
                            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${countdown.isOver
                                ? "bg-red-500/10 text-red-300 border-red-500/30"
                                : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                }`}
                        >
                            <Clock size={17} />
                            <span className="font-semibold">
                                {countdown.isOver ? "Delayed By" : "Time Left"}
                            </span>
                        </div>

                        <TimeBox label="Days" value={countdown.days} />
                        <TimeBox label="Hours" value={countdown.hours} />
                        <TimeBox label="Minutes" value={countdown.minutes} />
                        <TimeBox label="Seconds" value={countdown.seconds} />
                    </div>
                </div>



            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 mb-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <button
                        onClick={handleAllAnalysis}
                        className={`px-4 py-3 rounded-xl border text-left ${viewMode === "ALL"
                            ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Layers size={17} />
                            <span className="font-semibold">All BOQ Analysis</span>
                        </div>
                        <p className="text-xs mt-1 opacity-70">All projects + all BOQs</p>
                    </button>

                    <select
                        value={selectedProject}
                        onChange={(e) => handleProjectChange(e.target.value)}
                        className="px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500"
                    >
                        <option value="">Select Project BOQ Analysis</option>
                        {projects.map((project) => (
                            <option key={project._id} value={project._id}>
                                {project.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedBOQId}
                        onChange={(e) => handleBOQChange(e.target.value)}
                        className="px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500"
                    >
                        <option value="">Select Single BOQ</option>
                        {boqs.map((boq) => (
                            <option key={boq._id} value={boq._id}>
                                {boq.boqName || boq.title || "BOQ"}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 mb-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-purple-400">
                            Current View
                        </p>

                        <h2 className="text-xl font-bold text-white mt-1">
                            {viewMode === "BOQ"
                                ? selectedBOQ?.boqName || selectedBOQ?.title || "Selected BOQ"
                                : pageTitle}
                        </h2>
                    </div>

                    <HealthBadge health={analytics.health} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
                    <AnalyticsCard
                        icon={<BarChart3 size={20} />}
                        title="Install Progress"
                        value={`${analytics.progress}%`}
                        sub={`${formatAmount(analytics.completedQty)} / ${formatAmount(
                            analytics.totalPoQty
                        )} Qty`}
                    />
                      <AnalyticsCard
                        icon={<BarChart3 size={20} />}
                        title="Bill Progress"
                        value={`${analytics.installProgress}%`}
                        sub={`${formatAmount(analytics.executedValue)} / ${formatAmount(
                            analytics.companyBOQValue
                        )} Install Value`}
                    />

                    <AnalyticsCard
                        icon={<IndianRupee size={20} />}
                        title="BOQ Value"
                        value={`₹ ${formatAmount(analytics.companyBOQValue)}`}
                        sub="Supply + Installation"
                    />

                    <AnalyticsCard
                        icon={<Activity size={20} />}
                        title="Executed Value"
                        value={`₹ ${formatAmount(analytics.executedValue)}`}
                        sub="Completed qty value"
                    />

                    <AnalyticsCard
                        icon={<IndianRupee size={20} />}
                        title="Balance Value"
                        value={`₹ ${formatAmount(analytics.balanceValue)}`}
                        sub="Pending value"
                    />

                    <AnalyticsCard
                        icon={<AlertTriangle size={20} />}
                        title="Risk Items"
                        value={analytics.riskItems.length}
                        sub="Below 30% progress"
                    />
                </div>

                <div className="mt-5">
                    <div className="h-4 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-cyan-400"
                            style={{ width: `${Math.min(analytics.progress, 100)}%` }}
                        />
                    </div>

                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                        <span>0%</span>
                        <span>Overall BOQ Progress</span>
                        <span>100%</span>
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 mb-5">
                <div className="relative">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search item, BOQ, project, code..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500"
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
                    <h3 className="text-base font-bold text-white mb-4">
                        Top BOQ Value Items
                    </h3>

                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                                <Tooltip
                                    formatter={(value) => [`₹ ${formatAmount(value)}`, "Value"]}
                                    contentStyle={{
                                        background: "#020617",
                                        border: "1px solid #1e293b",
                                        borderRadius: "12px",
                                        color: "#fff",
                                    }}
                                />
                                <Bar dataKey="value" fill="#22d3ee" radius={[8, 8, 0, 0]} />


                                {/* <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={BAR_COLORS[index % BAR_COLORS.length]}
                                        />
                                        
                                    ))} 
                                </Bar> */}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
                    <h3 className="text-base font-bold text-white mb-4">
                        BOQ Completion Ratio
                    </h3>

                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={progressPieData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={4}
                                >
                                    {progressPieData.map((entry, index) => (
                                        <Cell
                                            key={entry.name}
                                            fill={index === 0 ? "#34d399" : "#f59e0b"}
                                        />
                                    ))}
                                </Pie>

                                <Tooltip
                                    formatter={(value) => [formatAmount(value), "Qty"]}
                                    contentStyle={{
                                        background: "#020617",
                                        border: "1px solid #1e293b",
                                        borderRadius: "12px",
                                        color: "#fff",
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
                <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-5">
                    <h3 className="text-base font-bold text-red-300 mb-4">
                        Risk Map - Slow BOQ Items
                    </h3>

                    {analytics.riskItems.length === 0 ? (
                        <p className="text-sm text-slate-500">No risky item found.</p>
                    ) : (
                        <div className="space-y-3">
                            {analytics.riskItems.slice(0, 10).map((item) => (
                                <BOQProgressRow key={item._id} item={item} />
                            ))}
                        </div>
                    )}
                </div>



                <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5">
                    <h3 className="text-base font-bold text-cyan-300 mb-4">
                        Cost Map - Top BOQ Value Items
                    </h3>

                    {analytics.topValueItems.length === 0 ? (
                        <p className="text-sm text-slate-500">No BOQ item found.</p>
                    ) : (
                        <div className="space-y-3">
                            {analytics.topValueItems.map((item) => (
                                <div
                                    key={item._id}
                                    className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-white">
                                                {item.generalName ||
                                                    item.activity ||
                                                    item.description ||
                                                    "-"}
                                            </p>

                                            <p className="text-xs text-slate-500 mt-1">
                                                {item.projectName || "-"} | {item.boqName || "-"}
                                            </p>

                                            <p className="text-xs text-slate-500 mt-1">
                                                Code: {item.boqItemCode || "-"} | Qty:{" "}
                                                {formatAmount(item.poQty)} {item.uom || ""}
                                            </p>
                                        </div>

                                        <p className="text-sm font-bold text-cyan-300 whitespace-nowrap">
                                            ₹ {formatAmount(item.totalValue)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>


            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 mb-5">
                <div className="relative">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search item, BOQ, project, code..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500"
                    />
                </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden">


                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border-b border-slate-800">
                    <h3 className="text-base font-bold text-white">BOQ Execution Map</h3>

                    <div className="flex items-center gap-2">
                        <select
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300"
                        >
                            <option value={10}>10 Rows</option>
                            <option value={25}>25 Rows</option>
                            <option value={50}>50 Rows</option>
                            <option value={100}>100 Rows</option>
                        </select>

                        <span className="text-sm text-slate-500">
                            {filteredItems.length} Records
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px] text-sm">
                        <thead className="bg-slate-950 text-slate-400">
                            <tr>
                                <th className="px-4 py-3 text-left">Project</th>
                                <th className="px-4 py-3 text-left">BOQ</th>
                                <th className="px-4 py-3 text-left">BOQ Item</th>
                                <th className="px-4 py-3 text-right">PO Qty</th>
                                <th className="px-4 py-3 text-right">Completed</th>
                                <th className="px-4 py-3 text-right">Balance</th>
                                <th className="px-4 py-3 text-right">Progress</th>
                                <th className="px-4 py-3 text-right">Value</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-10 text-center text-slate-500">
                                        Loading analytics...
                                    </td>
                                </tr>
                            ) : paginatedItems.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-10 text-center text-slate-500">
                                        No BOQ item found
                                    </td>
                                </tr>
                            ) : (
                                paginatedItems.map((item) => {
                                    const poQty = Number(item.poQty || 0);
                                    const completedQty = Number(item.completedQty || 0);
                                    const balanceQty = poQty - completedQty;
                                    const progress = poQty > 0 ? (completedQty / poQty) * 100 : 0;
                                    const value =
                                        Number(item.supplyAmount || 0) +
                                        Number(item.installationAmount || 0);

                                    return (
                                        <tr
                                            key={`${item._id}-${item.boqName}`}
                                            className="border-t border-slate-800 hover:bg-slate-800/40"
                                        >
                                            <td className="px-4 py-3 text-slate-300">
                                                {item.projectName || "-"}
                                            </td>

                                            <td className="px-4 py-3 text-purple-300">
                                                {item.boqName || "-"}
                                            </td>

                                            <td className="px-4 py-3">
                                                <p
                                                    className="text-xs text-slate-500 max-w-[300px] break-words"
                                                    title={item.description}
                                                >
                                                    {item.description?.length > 50
                                                        ? `${item.description.substring(0, 10)}...`
                                                        : item.description || "-"}
                                                </p>

                                                <p className="text-xs text-green-500">
                                                    Code:{item.boqItemCode || "-"}
                                                </p>
                                                <p className="text-white font-medium">
                                                    {item.generalName || item.activity || "-"}
                                                </p>

                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                {formatAmount(poQty)} {item.uom || ""}
                                            </td>

                                            <td className="px-4 py-3 text-right text-emerald-300">
                                                {formatAmount(completedQty)}
                                            </td>

                                            <td className="px-4 py-3 text-right text-amber-300">
                                                {formatAmount(balanceQty)}
                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                {progress.toFixed(1)}%
                                            </td>

                                            <td className="px-4 py-3 text-right text-cyan-300">
                                                ₹ {formatAmount(value)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border-t border-slate-800">
                        <p className="text-sm text-slate-500">
                            Page {currentPage} of {totalPages || 1}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 disabled:opacity-40"
                            >
                                Prev
                            </button>

                            <button
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AnalyticsCard({ icon, title, value, sub }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{title}</p>
                <span className="text-cyan-300">{icon}</span>
            </div>

            <h3 className="text-2xl font-bold text-white mt-3">{value}</h3>
            <p className="text-xs text-slate-500 mt-1">{sub}</p>
        </div>
    );
}

function HealthBadge({ health }) {
    const cls =
        health === "GOOD"
            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
            : health === "AVERAGE"
                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                : "bg-red-500/10 text-red-300 border-red-500/30";

    return (
        <div className={`px-4 py-2 rounded-2xl border ${cls}`}>
            Project Health: <b>{health}</b>
        </div>
    );
}

function BOQProgressRow({ item }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                    <p className="text-sm font-semibold text-white">
                        {item.generalName || item.activity || item.description || "-"}
                    </p>

                    <p className="text-xs text-slate-500">
                        {item.projectName || "-"} | {item.boqName || "-"}
                    </p>

                    <p className="text-xs text-slate-500">
                        BOQ Item Code: {item.boqItemCode || "-"}
                    </p>
                </div>

                <p className="text-sm font-bold text-red-300">
                    {item.itemProgress.toFixed(1)}%
                </p>
            </div>

            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                    className="h-full rounded-full bg-red-400"
                    style={{ width: `${Math.min(item.itemProgress, 100)}%` }}
                />
            </div>
        </div>
    );
}

function TimeBox({ label, value }) {
    return (
        <div className="min-w-[82px] rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-center">
            <h3 className="text-2xl font-black text-white">
                {String(value).padStart(2, "0")}
            </h3>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 mt-1">
                {label}
            </p>
        </div>
    );
}