import React, { useEffect, useState } from "react";
import {
    ArrowLeft,
    Package,
    Truck,
    IndianRupee,
    Upload,
    Download,
    BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import BASE_URL from "../../config/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function MaterialMovementAnalyticsPage() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    const [summary, setSummary] = useState({
        totalRecords: 0,
        totalInward: 0,
        totalOutward: 0,
        totalAmount: 0,
        totalQuantity: 0,
    });

    const [trendData, setTrendData] = useState([]);
    const [topItems, setTopItems] = useState([]);
    const [topVendors, setTopVendors] = useState([]);
    const [projectWise, setProjectWise] = useState([]);
    const [monthlyAmount, setMonthlyAmount] = useState([]);

    const formatAmount = (amount) =>
        Number(amount || 0).toLocaleString("en-IN");

    const fetchAnalytics = async () => {
        try {
            setLoading(true);

            const res = await fetch(`${BASE_URL}/material-movement/analytics`);

            const data = await res.json();

            if (data.success) {
                setSummary(data.summary || {});
                setTrendData(data.trendData || []);
                setTopItems(data.topItems || []);
                setTopVendors(data.topVendors || []);
                setProjectWise(data.projectWise || []);
                setMonthlyAmount(data.monthlyAmount || []);
            } else {
                toast.error(data.message || "Failed to load analytics");
            }
        } catch (error) {
            console.log(error);
            toast.error("Analytics server error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const movementPie = [
        { name: "Inward", value: summary.totalInward || 0 },
        { name: "Outward", value: summary.totalOutward || 0 },
    ];


const downloadAnalyticsPDF = async () => {
  const loadingToast = toast.loading("Generating PDF report... Please wait");

  try {
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFontSize(18);
    pdf.setTextColor(30, 41, 59);
    pdf.text("Sachin Electrical Pvt. Ltd.", 14, 18);

    pdf.setFontSize(14);
    pdf.text("Material Movement Analytics Report", 14, 28);

    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Generated On: ${new Date().toLocaleString("en-IN")}`, 14, 36);

    pdf.line(14, 40, pageWidth - 14, 40);

    autoTable(pdf, {
      startY: 48,
      head: [["Metric", "Value"]],
      body: [
        ["Total Records", summary.totalRecords || 0],
        ["Total Inward", summary.totalInward || 0],
        ["Total Outward", summary.totalOutward || 0],
        ["Total Quantity", summary.totalQuantity || 0],
        ["Total Amount", `Rs. ${formatAmount(summary.totalAmount)}`],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: "bold",
      },
    });

    autoTable(pdf, {
      startY: pdf.lastAutoTable.finalY + 10,
      head: [["Top Item", "Quantity"]],
      body: topItems.map((item) => [
        item.itemName || "-",
        item.quantity || 0,
      ]),
      theme: "striped",
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: 255,
      },
    });

    autoTable(pdf, {
      startY: pdf.lastAutoTable.finalY + 10,
      head: [["Top Vendor", "Amount"]],
      body: topVendors.map((vendor) => [
        vendor.vendorName || "-",
        `Rs. ${formatAmount(vendor.amount)}`,
      ]),
      theme: "striped",
      headStyles: {
        fillColor: [249, 115, 22],
        textColor: 255,
      },
    });

    autoTable(pdf, {
      startY: pdf.lastAutoTable.finalY + 10,
      head: [["Project", "Quantity"]],
      body: projectWise.map((project) => [
        project.projectName || "-",
        project.quantity || 0,
      ]),
      theme: "striped",
      headStyles: {
        fillColor: [124, 58, 237],
        textColor: 255,
      },
    });

    const pageCount = pdf.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.setTextColor(120);
      pdf.text(
        `Generated from MIS System | Page ${i} of ${pageCount}`,
        14,
        pdf.internal.pageSize.getHeight() - 10
      );
    }

    pdf.save("Material-Movement-Analytics-Report.pdf");

    toast.success("PDF report downloaded successfully");
  } catch (error) {
    console.log(error);
    toast.error(error?.message || "PDF generation failed");
  } finally {
    toast.dismiss(loadingToast);
  }
};
    return (
        <div  className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-6">
            <div id="analytics-report"  className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-gray-600 hover:text-black mb-3"
                        >
                            <ArrowLeft size={18} />
                            Back
                        </button>

                        <h1 className="text-3xl font-bold text-slate-900">
                            Material Movement Analytics
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Dashboard / Material Movement Analytics
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate("/material-movement/history")}
                            className="px-5 py-3 rounded-xl bg-white border hover:bg-gray-50"
                        >
                            History
                        </button>

                        <button
                            onClick={downloadAnalyticsPDF}
                            className="bg-red-600 text-white px-5 py-3 rounded-xl"
                        >
                            Download PDF
                        </button>
                    </div>
                </div>

                {loading && (
                    <div className="bg-white rounded-3xl p-6 mb-6 border text-gray-500">
                        Loading analytics...
                    </div>
                )}

                <div  className="grid md:grid-cols-5 gap-5 mb-6">
                    <AnimatedCard delay={0.1}>
                        <AnalyticsCard
                            title="Total Records"
                            value={summary.totalRecords || 0}
                            icon={<Package />}
                            color="from-violet-500 to-indigo-600"
                        />

                    </AnimatedCard>
                    <AnimatedCard delay={0.1}>
                        <AnalyticsCard
                            title="Total Inward"
                            value={summary.totalInward || 0}
                            icon={<Download />}
                            color="from-green-500 to-emerald-600"
                        />
                    </AnimatedCard>

                    <AnimatedCard delay={0.1}>
                        <AnalyticsCard
                            title="Total Outward"
                            value={summary.totalOutward || 0}
                            icon={<Upload />}
                            color="from-orange-500 to-amber-600"
                        />
                    </AnimatedCard>
                    <AnimatedCard delay={0.1}>
                        <AnalyticsCard
                            title="Total Amount"
                            value={`₹ ${formatAmount(summary.totalAmount)}`}
                            icon={<IndianRupee />}
                            color="from-blue-500 to-blue-700"
                        />
                    </AnimatedCard>
                    <AnimatedCard delay={0.1}>

                        <AnalyticsCard
                            title="Total Quantity"
                            value={formatAmount(summary.totalQuantity || 0)}
                            icon={<Truck />}
                            color="from-pink-500 to-rose-600"
                        />
                    </AnimatedCard>





                </div>

                <div  className="grid lg:grid-cols-3 gap-6 mb-6">

                    <ChartBox title="Inward vs Outward Trend" className="lg:col-span-2 ">
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="inward"
                                    stroke="#22c55e"
                                    strokeWidth={3}
                                    name="Inward Quantity"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="outward"
                                    stroke="#ef4444"
                                    strokeWidth={3}
                                    name="Outward Quantity"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartBox>

                    <ChartBox title="Movement By Type">
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={movementPie}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={65}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    label
                                >
                                    <Cell fill="#22c55e" />
                                    <Cell fill="#ef4444" />
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartBox>
                </div>

                <div className="grid lg:grid-cols-3 gap-6 mb-6">
                    <ChartBox title="Top 5 Items By Quantity">
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={topItems}
                                    dataKey="quantity"
                                    nameKey="itemName"
                                    outerRadius={105}

                                    label
                                >
                                    {topItems.map((_, i) => (
                                        <Cell
                                            key={i}
                                            fill={["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#ec4899"][i % 5]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartBox>

                    <ChartBox title="Top 5 Vendors By Amount">
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={topVendors} layout="vertical">
                                <XAxis type="number" />
                                <YAxis dataKey="vendorName" type="category" width={120} />
                                <Tooltip />
                                <Bar dataKey="amount" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartBox>

                    <ChartBox title="Project Wise Movement">
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={projectWise} layout="vertical">
                                <XAxis type="number" />
                                <YAxis dataKey="projectName" type="category" width={130} />
                                <Tooltip />
                                <Bar dataKey="quantity" fill="#22c55e" radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartBox>
                </div>

                <div className="grid lg:grid-cols-2 gap-6 mb-6">
                    <ChartBox title="Monthly Summary Amount">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyAmount}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="amount" fill="#3b82f6" radius={[10, 10, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartBox>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl border p-6 flex items-center justify-between">
                        <div>
                            <p className="text-gray-500">Most Useful Insight</p>
                            <h2 className="text-2xl font-bold mt-2">
                                Material movement is now searchable, measurable, and report-ready.
                            </h2>
                            <p className="text-gray-500 mt-3">
                                This page can help management understand project consumption,
                                vendor movement, and inward/outward stock flow.
                            </p>
                        </div>

                        <BarChart3 size={70} className="text-blue-600" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function AnalyticsCard({ title, value, icon, color }) {
    return (
        <div className="bg-white/90 backdrop-blur-lg hover:shadow-2xl transition-all duration-300 rounded-3xl p-5 shadow-sm border">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm">{title}</p>
                    <h2 className="text-2xl text-sm font-bold mt-2">{value}</h2>
                </div>

                <div className={`p-4 rounded-2xl text-white bg-gradient-to-br ${color}`}>
                    {icon}
                </div>
            </div>

            <p className="text-green-600 text-sm mt-5">↑ Live MIS data</p>
        </div>
    );
}

function ChartBox({ title, children, className = "" }) {
    return (
        <div className={`bg-white/80 backdrop-blur-xl border border-white/30 hover:shadow-2xl transition-all duration-300 rounded-3xl shadow-sm border p-5 ${className}`}>
            <h2 className="text-lg font-semibold mb-4">{title}</h2>
            {children}
        </div>
    );
}

function AnimatedCard({ children, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay }}
            whileHover={{ y: -5, scale: 1.02 }}
        >
            {children}
        </motion.div>
    );
}