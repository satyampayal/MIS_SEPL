import React from "react";
import {
    ArrowLeft,
    Download,
    Users,
    Package,
    MapPin,
    FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../../../config/api";
import { BarChart3 } from "lucide-react";
export default function MaterialSummaryReport() {
    const navigate = useNavigate();
    const [filters, setFilters] = React.useState({
        fromDate: "",
        toDate: "",
        project: "",
        challanType: "",
    });
    const [projects, setProjects] = React.useState([]);

    const [summary, setSummary] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const token = localStorage.token;


    const fetchSummary = async () => {
        try {
            setLoading(true);

            const res = await axios.get(
                `${BASE_URL}/material-movement/analytics/summary`,
                { params: filters }
            );

            setSummary(res.data.data);
        } catch (error) {
            console.error("Material summary fetch error:", error);
        } finally {
            setLoading(false);
        }
    };
    // Fetch All Projects
    const fetchProjects = async () => {
        try {
            const res = await fetch(`${BASE_URL}/project-master/all`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            const data = await res.json();
            const uniqueProjects = Array.from(new Set((data.data || []).map(project => project.name))).map(name => {
                return data.data.find(project => project.name === name);
            });
            setProjects(uniqueProjects);
        } catch (error) {
            console.error("Error fetching projects:", error);
        }
    };
    React.useEffect(() => {
        fetchSummary();
        fetchProjects();
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6">
            {loading && (
                <p className="text-slate-400 mb-4">Loading summary...</p>
            )}
            <button
                onClick={() => navigate("/reports/material-analytics")}
                className="flex items-center gap-2 text-slate-400 hover:text-white mb-6"
            >
                <ArrowLeft size={18} />
                Back to Analytics Center
            </button>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <p className="text-sm text-blue-400 font-semibold">
                        Material Analytics
                    </p>
                    <h1 className="text-3xl font-bold">Material History Summary</h1>
                    <p className="text-slate-400 mt-2">
                        Overall material movement, vendors, sites and challan type summary.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate("/reports/material-history/projects")}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl"
                    >
                        <BarChart3 size={18} />
                        Project-wise Report
                    </button>

                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl">
                        <Download size={18} />
                        Export Report
                    </button>
                </div>



            </div>
            {/* MAtrial History  */}
            {/* Filters */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <input
                        type="date"
                        value={filters.fromDate}
                        onChange={(e) =>
                            setFilters({ ...filters, fromDate: e.target.value })
                        }
                        className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm"
                    />

                    <input
                        type="date"
                        value={filters.toDate}
                        onChange={(e) =>
                            setFilters({ ...filters, toDate: e.target.value })
                        }
                        className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm"
                    />

                    <select
                        value={filters.project}
                        onChange={(e) =>
                            setFilters({ ...filters, project: e.target.value })
                        }
                        className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm"
                    >
                        <option value="">All Projects</option>
                        {projects.map((project, index) =>
                            <option key={index} value={project?.name}>{project.name}</option>
                        )}
                        {/* <option value="Project Alpha">Project Alpha</option>
                        <option value="Project Beta">Project Beta</option> */}
                    </select>

                    <select
                        value={filters.challanType}
                        onChange={(e) =>
                            setFilters({ ...filters, challanType: e.target.value })
                        }
                        className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm"
                    >
                        <option value="">All Challan Types</option>
                        <option value="DDC">DDC</option>
                        <option value="DC">DC</option>
                        <option value="LPN">LPN</option>
                        <option value="MRS">MRS</option>
                        <option value="ISMN">ISMN</option>
                    </select>

                    <button
                        onClick={fetchSummary}
                        className="bg-blue-600 hover:bg-blue-700 rounded-xl px-4 py-2 text-sm font-medium"
                    >
                        Apply Filter
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                <SummaryCard
                    icon={Package}
                    title="Total Materials Used"
                    value={summary?.totalMaterialsUsed || 0}
                />

                <SummaryCard
                    icon={FileText}
                    title="Total Challans"
                    value={summary?.totalChallans || 0}
                />

                <SummaryCard
                    icon={MapPin}
                    title="Active Sites"
                    value={summary?.activeSites || 0}
                />

                <SummaryCard
                    icon={Users}
                    title="Total Vendors"
                    value={summary?.totalVendors || 0}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Top Materials */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <h2 className="text-lg font-semibold mb-4">Top Materials Used</h2>

                    <div className="space-y-4">
                        {(summary?.topMaterials || []).map((item, index) => (
                            <div key={item._id || index}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>{index + 1}. {item._id || "N/A"}</span>
                                    <span className="text-slate-400">
                                        {Number(item.totalQuantity || 0).toLocaleString("en-IN")}
                                    </span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full"
                                        style={{ width: `${90 - index * 8}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Challan Type */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <h2 className="text-lg font-semibold mb-4">Challan Type Summary</h2>

                    <div className="space-y-3">
                        {(summary?.challanTypeSummary || []).map((item) => (
                            <div
                                key={item._id}
                                className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-4 py-3"
                            >
                                <span className="font-medium">{item._id || "N/A"}</span>
                                <span className="text-blue-400 font-semibold">
                                    {item.count}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Vendors */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <h2 className="text-lg font-semibold mb-4">Top Vendors</h2>

                    {(summary?.topVendors || []).map((vendor) => (
                        <div
                            key={vendor._id}
                            className="flex justify-between border-b border-slate-800 py-3 last:border-0"
                        >
                            <span>{vendor._id || "N/A"}</span>
                            <span className="text-slate-400">
                                ₹ {Number(vendor.totalAmount || 0).toLocaleString("en-IN")}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Sites */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <h2 className="text-lg font-semibold mb-4">Top Active Sites</h2>
                    {(summary?.topSites || []).map((site) => (
                        <div
                            key={site._id}
                            className="flex justify-between border-b border-slate-800 py-3 last:border-0"
                        >
                            <span>{site._id || "N/A"}</span>
                            <span className="text-slate-400">
                                {Number(site.totalQuantity || 0).toLocaleString("en-IN")} Qty
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ icon: Icon, title, value }) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-slate-400 text-sm">{title}</p>
                    <h2 className="text-2xl font-bold mt-2">{value}</h2>
                </div>

                <div className="h-11 w-11 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Icon className="text-blue-400" size={23} />
                </div>
            </div>
        </div>
    );
}