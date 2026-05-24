import React, { useEffect, useState } from "react";
import {
    Receipt,
    IndianRupee,
    Truck,
    AlertTriangle,
    RefreshCw,
    BarChart3,
} from "lucide-react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import BASE_URL from "../../../config/api";

export default function TaxInvoiceAnalyticsPage() {
    const [summary, setSummary] = useState(null);
    const [monthlyTrend, setMonthlyTrend] = useState([]);
    const [vendorAnalysis, setVendorAnalysis] = useState([]);
    const [projectAnalysis, setProjectAnalysis] = useState([]);
    const [deliveryStatus, setDeliveryStatus] = useState([]);
    const [differenceAlerts, setDifferenceAlerts] = useState([]);
    const [loading, setLoading] = useState(false);

    const formatAmount = (value) => {
        if (!value) return "₹0";
        return `₹${Number(value).toLocaleString("en-IN")}`;
    };

    const fetchAnalytics = async () => {
        try {
            setLoading(true);

            const [
                summaryRes,
                monthlyRes,
                vendorRes,
                projectRes,
                deliveryRes,
                alertsRes,
            ] = await Promise.all([
                fetch(`${BASE_URL}/analytics/tax-invoice/summary`),
                fetch(`${BASE_URL}/analytics/tax-invoice/monthly-trend`),
                fetch(`${BASE_URL}/analytics/tax-invoice/vendor-analysis`),
                fetch(`${BASE_URL}/analytics/tax-invoice/project-analysis`),
                fetch(`${BASE_URL}/analytics/tax-invoice/delivery-status`),
                fetch(`${BASE_URL}/analytics/tax-invoice/difference-alerts`),
            ]);

            const summaryData = await summaryRes.json();
            const monthlyData = await monthlyRes.json();
            const vendorData = await vendorRes.json();
            const projectData = await projectRes.json();
            const deliveryData = await deliveryRes.json();
            const alertsData = await alertsRes.json();

            setSummary(summaryData.data || {});
            setMonthlyTrend(monthlyData.data || []);
            setVendorAnalysis(vendorData.data || []);
            setProjectAnalysis(projectData.data || []);
            setDeliveryStatus(deliveryData.data || []);
            setDifferenceAlerts(alertsData.data || []);
        } catch (error) {
            console.error("Analytics fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const cards = [
        {
            title: "Total Invoice Amount",
            value: formatAmount(summary?.totalAmount),
            icon: IndianRupee,
        },
        {
            title: "Total Invoices",
            value: summary?.totalInvoices || 0,
            icon: Receipt,
        },
        {
            title: "Pending Deliveries",
            value: summary?.pendingDeliveries || 0,
            icon: Truck,
        },
        {
            title: "Difference Cases",
            value: summary?.differenceCases || 0,
            icon: AlertTriangle,
        },
        {
            title: "This Month Billing",
            value: formatAmount(summary?.monthlyBilling),
            icon: BarChart3,
        },
        {
            title: "Challan Completion",
            value: `${summary?.challanPercentage || 0}%`,
            icon: Receipt,
        },
    ];

    return (
        <div className="min-h-screen bg-[#0B1120] text-white p-6 relative overflow-hidden">

            {/* Background Glow Effects */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 blur-[120px] rounded-full"></div>

            <div className="absolute bottom-0 right-0 w-96 h-96 bg-fuchsia-500/20 blur-[120px] rounded-full"></div>

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        Tax Invoice Analytics
                    </h1>
                    <p className="text-white">
                        Invoice tracking, billing trends, delivery status and alerts
                    </p>
                </div>

                <button
                    onClick={fetchAnalytics}
                    className="flex items-center gap-2 rounded-xl text-white px-4 py-2 text-white hover:bg-slate-800"
                >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* KPI Cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {cards.map((card, index) => {
                    const Icon = card.icon;

                    return (
                        <div
                            key={index}
                            className=" rounded-3xl bg-white/5 backdrop-blur-xl 
                            border border-white/10 
                             p-5 shadow-[0_0_30px_rgba(0, 0, 0, 0.3)]   hover:scale-[1.02] transition-all  duration - 300 "
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-white">{card.title}</p>
                                    <h2 className="mt-2 text-2xl font-bold text-white">
                                        {card.value}
                                    </h2>
                                </div>

                                <div className="
rounded-2xl
bg-gradient-to-br
from-cyan-500
to-blue-600
p-3
shadow-lg
shadow-cyan-500/30
">
                                    <Icon className="text-white" size={26} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Monthly Trend */}
            <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm border text-white">
                <h2 className="mb-4 text-xl font-bold text-slate-800">
                    Monthly Invoice Trend
                </h2>

                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyTrend}>
                            <CartesianGrid
                                stroke="#334155"
                                strokeDasharray="3 3"
                            />
                            <XAxis
                                dataKey="month"
                                stroke="#CBD5E1"
                            />
                            <YAxis stroke="#CBD5E1" />
                            <Tooltip formatter={(value) => formatAmount(value)} />
                            <Line
                                type="monotone"
                                dataKey="totalAmount"
                                stroke="#06B6D4"
                                strokeWidth={4}
                                dot={{
                                    r: 5,
                                    fill: "#22D3EE",
                                    strokeWidth: 2,
                                    stroke: "#fff",
                                }}
                                activeDot={{
                                    r: 8,
                                    fill: "#67E8F9",
                                }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Vendor + Project */}
            <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
                    <h2 className="mb-4 text-xl font-bold text-slate-800">
                        Top Vendors
                    </h2>

                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={vendorAnalysis}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="vendorName" />
                                <YAxis />
                                <Tooltip formatter={(value) => formatAmount(value)} />
                                    <Bar
                                    dataKey="totalAmount"
                                    radius={[10, 10, 0, 0]}
                                    fill="url(#vendorGradient)"
                                />

                                <defs>
                                    <linearGradient id="vendorGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8B5CF6" />
                                        <stop offset="100%" stopColor="#06B6D4" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
                    <h2 className="mb-4 text-xl font-bold text-slate-900">
                        Project/Site Analysis
                    </h2>

                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={projectAnalysis}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="projectSite" />
                                <YAxis />
                                <Tooltip formatter={(value) => formatAmount(value)} />
                                <Bar
                                    dataKey="totalAmount"
                                    radius={[10, 10, 0, 0]}
                                    fill="url(#vendorGradient)"
                                />

                                <defs>
                                    <linearGradient id="vendorGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8B5CF6" />
                                        <stop offset="100%" stopColor="#06B6D4" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Delivery + Alerts */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
                    <h2 className="mb-4 text-xl font-bold text-slate-900">
                        Delivery Status
                    </h2>

                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={deliveryStatus}
                                    dataKey="count"
                                    nameKey="status"
                                    outerRadius={110}
                                    label
                                >
                                    {deliveryStatus.map((_, index) => (
                                        <Cell key={index}
                                            fill={["#06B6D4",
                                                "#8B5CF6",
                                                "#EC4899",
                                                "#F59E0B",
                                                "#10B981",][index % 5]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
                    <h2 className="mb-4 text-xl font-bold text-slate-900">
                        Difference Alerts
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b text-slate-500">
                                    <th className="py-3">Invoice</th>
                                    <th>Vendor</th>
                                    <th>Project</th>
                                    <th>Sent</th>
                                    <th>Received</th>
                                </tr>
                            </thead>

                            <tbody>
                                {differenceAlerts.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-6 text-center text-white">
                                            No difference alerts found
                                        </td>
                                    </tr>
                                ) : (
                                    differenceAlerts.map((item) => (
                                        <tr key={item._id} className="border-b">
                                            <td className="py-3 font-medium">{item.invoiceNumber}</td>
                                            <td>{item.vendorName}</td>
                                            <td>{item.projectSite}</td>
                                            <td>{item.quantitySent}</td>
                                            <td>{item.quantityReceived}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div >
    );
}