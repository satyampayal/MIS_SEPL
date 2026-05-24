import React from "react";
import {
  IndianRupee,
  Receipt,
  Truck,
  AlertTriangle,
  Building2,
  Warehouse,
  ClipboardList,
  Plus,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useDashboard } from "../../Context/DashboardContext";


export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { dashboardData, loading, fetchDashboardAnalytics } = useDashboard();
  const {
  monthlyTrend = [],
  deliveryStatus = [],
  vendorAnalysis = [],
} = dashboardData || {};

const COLORS = ["#06B6D4", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981"];
const formatAmount = (value) => {
  if (!value) return "₹0";
  return `₹${Number(value).toLocaleString("en-IN")}`;
};

const taxSummary = dashboardData?.taxSummary || {};

useEffect(() => {
  fetchDashboardAnalytics();
}, []);

 const kpis = [
  {
    title: "Tax Invoice Value",
    value: formatAmount(taxSummary.totalAmount),
    icon: IndianRupee,
    glow: "from-cyan-500 to-blue-600",
  },
  {
    title: "Total Invoices",
    value: taxSummary.totalInvoices || 0,
    icon: Receipt,
    glow: "from-violet-500 to-fuchsia-600",
  },
  {
    title: "Pending Deliveries",
    value: taxSummary.pendingDeliveries || 0,
    icon: Truck,
    glow: "from-orange-500 to-red-600",
  },
  {
    title: "Difference Alerts",
    value: taxSummary.differenceCases || 0,
    icon: AlertTriangle,
    glow: "from-rose-500 to-pink-600",
  },
  {
    title: "This Month Billing",
    value: formatAmount(taxSummary.monthlyBilling),
    icon: IndianRupee,
    glow: "from-emerald-500 to-teal-600",
  },
  {
    title: "Challan Completion",
    value: `${taxSummary.challanPercentage || 0}%`,
    icon: Warehouse,
    glow: "from-sky-500 to-indigo-600",
  },
];
  const quickActions = [
    { title: "Add Tax Invoice", path: "/add-tax-invoice" },
    { title: "Tax Invoice Analytics", path: "/analytics/tax-invoice" },
    { title: "Create Challan", path: "/challan" },
    { title: "Material Analytics", path: "/material-movement/analytics" },
    { title: "Daily Progress Report", path: "/dpr" },
    { title: "Task Management", path: null },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl p-7 shadow-2xl">
 
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-sm text-cyan-300 font-semibold">
              Super Admin Control Center
            </p>

            <h1 className="mt-3 text-4xl lg:text-5xl font-black bg-gradient-to-r from-cyan-300 via-blue-400 to-fuchsia-400 bg-clip-text text-transparent">
              MIS Operational Dashboard
            </h1>

            <p className="mt-4 max-w-2xl text-slate-300">
              One screen for invoices, material movement, projects, stores,
              alerts and daily operations.
            </p>
                 <button
  onClick={() => fetchDashboardAnalytics(true)}
  className="rounded-2xl bg-white/10 border border-white/10 px-5 py-3 font-semibold hover:bg-white/15 transition"
>
  {loading ? "Refreshing..." : "Refresh Data"}
</button>
          </div>

          <button
            onClick={() => navigate("/add-tax-invoice")}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 font-semibold shadow-lg shadow-cyan-500/30 hover:scale-[1.02] transition"
          >
            <Plus size={19} />
            Add Invoice
          </button>
          
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {kpis.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl hover:-translate-y-1 hover:bg-white/10 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{item.title}</p>
                  <h2 className="mt-3 text-3xl font-black text-white">
                    {item.value}
                  </h2>
                </div>

                <div
                  className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${item.glow} flex items-center justify-center shadow-lg`}
                >
                  <Icon size={28} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </section>
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
  {/* Monthly Trend */}
  <div className="xl:col-span-2 rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl">
    <h2 className="text-xl font-bold text-white mb-1">
      Monthly Invoice Trend
    </h2>
    <p className="text-sm text-slate-400 mb-6">
      Billing movement month-wise
    </p>

    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={monthlyTrend}>
          <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
          <XAxis dataKey="month" stroke="#CBD5E1" />
          <YAxis stroke="#CBD5E1" />
          <Tooltip
            formatter={(value) => formatAmount(value)}
            contentStyle={{
              backgroundColor: "#0F172A",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "14px",
              color: "#fff",
            }}
            labelStyle={{ color: "#E2E8F0", fontWeight: "bold" }}
            itemStyle={{ color: "#67E8F9" }}
          />
          <Line
            type="monotone"
            dataKey="totalAmount"
            stroke="#06B6D4"
            strokeWidth={4}
            dot={{ r: 5, fill: "#22D3EE", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 8, fill: "#67E8F9" }}
            isAnimationActive
            animationDuration={1300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>

  {/* Delivery Status */}
  <div className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl">
    <h2 className="text-xl font-bold text-white mb-1">
      Delivery Status
    </h2>
    <p className="text-sm text-slate-400 mb-6">
      Delivered / pending / partial
    </p>

    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={deliveryStatus}
            dataKey="count"
            nameKey="status"
            outerRadius={105}
            label
          >
            {deliveryStatus.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#0F172A",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "14px",
              color: "#fff",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </div>
</section>
{/* Vendor Status */}
<section className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl">
  <h2 className="text-xl font-bold text-white mb-1">Top Vendors</h2>
  <p className="text-sm text-slate-400 mb-6">
    Highest invoice value vendors
  </p>

  <div className="h-80">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={vendorAnalysis}>
        <defs>
          <linearGradient id="vendorGradientDash" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>

        <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
        <XAxis dataKey="vendorName" stroke="#CBD5E1" />
        <YAxis stroke="#CBD5E1" />
        <Tooltip
          formatter={(value) => formatAmount(value)}
          cursor={{ fill: "rgba(255,255,255,0.08)" }}
          contentStyle={{
            backgroundColor: "#0F172A",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "14px",
            color: "#fff",
          }}
          labelStyle={{ color: "#E2E8F0", fontWeight: "bold" }}
          itemStyle={{ color: "#67E8F9" }}
        />

        <Bar
          dataKey="totalAmount"
          radius={[10, 10, 0, 0]}
          fill="url(#vendorGradientDash)"
          isAnimationActive
          animationDuration={1300}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
</section>

      {/* Main Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Analytics Preview */}
        <div className="xl:col-span-2 rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">
                Analytics Shortcut
              </h2>
              <p className="text-sm text-slate-400">
                Open high-value reports directly
              </p>
            </div>

            <ClipboardList className="text-cyan-300" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={() =>
                  action.path ? navigate(action.path) : alert("Coming soon")
                }
                className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left hover:bg-white/10 hover:border-cyan-400/40 transition"
              >
                <p className="font-semibold text-white">{action.title}</p>
                <p className="mt-1 text-sm text-slate-400">
                  Direct operational access
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white">Alert Center</h2>
          <p className="text-sm text-slate-400 mb-5">
            Critical pending work
          </p>

          <div className="space-y-3">
            {["Pending deliveries", "Low stock alerts", "Difference cases"].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-sm font-semibold text-white">{item}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Waiting for live API connection
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </section>
    </div>
  );
}