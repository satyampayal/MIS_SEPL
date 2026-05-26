import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Loader2,
    Building2,
    Receipt,
    Package,
    Truck,
    IndianRupee,
    FileText,
    X,
    TrendingUp
} from "lucide-react";
import BASE_URL from "../../../config/api";

export default function ProjectMaterialDetail() {
    const navigate = useNavigate();
    const categoryRef = useRef(null);
    const { projectName } = useParams();

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [categoryData, setCategoryData] = useState(null);
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [categoryItemSearch, setCategoryItemSearch] = useState("");

    const fetchProjectReport = async () => {
        try {
            setLoading(true);

            const res = await axios.get(
                `${BASE_URL}/material-movement/analytics/project/${encodeURIComponent(
                    projectName
                )}`
            );

            setReport(res.data.data);
        } catch (error) {
            console.error("Project detail report error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjectReport();
    }, [projectName]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
                <Loader2 className="animate-spin mr-2" />
                Loading project report...
            </div>
        );
    }

    const overview = report?.projectOverview || {};
    const material = report?.materialSummary || {};
    const openCategoryModal = async (category) => {
        try {
            setCategoryItemSearch("");
            setSelectedCategory(category);
            setCategoryModalOpen(true);
            setCategoryLoading(true);

            const res = await axios.get(
                `${BASE_URL}/material-movement/analytics/project/${encodeURIComponent(
                    projectName
                )}/category/${encodeURIComponent(category)}`
            );

            setCategoryData(res.data.data);
        } catch (error) {
            console.error("Category details error:", error);
        } finally {
            setCategoryLoading(false);
        }
    };
    const filteredCategoryItems =
  categoryData?.uniqueItemCards?.filter((item) =>
    item.itemName?.toLowerCase().includes(categoryItemSearch.toLowerCase())
  ) || [];

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6">
            <button
                onClick={() => navigate("/reports/material-history/projects")}
                className="flex items-center gap-2 text-slate-400 hover:text-white mb-6"
            >
                <ArrowLeft size={18} />
                Back to Project-wise Report
            </button>

            <div className="mb-6">
                <p className="text-sm text-blue-400 font-semibold">Project Report</p>
                <h1 className="text-3xl font-bold mt-1">
                    {overview.projectName || projectName}
                </h1>
                <p className="text-slate-400 mt-2">
                    Complete project health report with work order, billing and material movement.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                <Stat icon={Building2} title="Work Order Value" value={money(overview.workOrderValue)} />
                <Stat icon={Receipt} title="Total Billed" value={money(overview.totalBilledAmount)} />
                <Stat icon={IndianRupee} title="Remaining" value={money(overview.remainingAmount)} />
                <Stat onClick={() =>
                    categoryRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    })
                }
                    icon={Package}
                    title="Material Amount"
                    value={money(material.materialAmount)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                <Stat icon={Package} title="In Qty" value={num(material.totalInQty)} />
                <Stat icon={Truck} title="Out Qty" value={num(material.totalOutQty)} />
                <Stat icon={Package} title="Total Materials" value={num(material.totalMaterials)} />
                <Stat icon={Building2} title="Total Vendors" value={num(material.totalVendors)} />
            </div>

            {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
        <Stat icon={Package} title="Main Item" value={num(material.totalInQty)} />
        <Stat icon={Truck} title="Tool" value={num(material.totalOutQty)} />
        <Stat icon={Package} title="Accessories" value={num(material.totalMaterials)} />
        <Stat icon={Building2} title="Consumable" value={num(material.totalVendors)} />
      </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
        <Stat icon={Package} title="Office Assets" value={num(material.totalInQty)} />
        <Stat icon={Truck} title="PPE" value={num(material.totalOutQty)} />
        <Stat icon={Package} title="Stationary" value={num(material.totalMaterials)} />
        <Stat icon={Building2} title="Testing Equipment" value={num(material.totalVendors)} />
      </div> */}

            {/* Bill Summary Start */}


            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <Panel title="Billing Summary">
                    {(report?.billSummary || []).length === 0 ? (
                        <Empty text="No bill data found." />
                    ) : (
                        report.billSummary.map((bill) => (
                            <Row
                                key={bill._id}
                                label={bill._id || "N/A"}
                                value={`${bill.count} Bills • ${money(bill.totalAmount)}`}
                            />
                        ))
                    )}
                </Panel>

                <Panel title="Challan Summary">
                    {(report?.challanSummary || []).length === 0 ? (
                        <Empty text="No challan data found." />
                    ) : (
                        report.challanSummary.map((item) => (
                            <Row
                                key={item._id}
                                label={item._id || "N/A"}
                                value={`${item.count} Docs • ${num(item.totalQty)} Qty`}
                            />
                        ))
                    )}
                </Panel>
            </div>
            {/* Bill Summary End */}


            {/* Category summary  start */}
            <div ref={categoryRef} className="mb-6">
                <Panel title="Material Category Summary">
                    {(report?.categorySummary || []).length === 0 ? (
                        <Empty text="No category data found." />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {report.categorySummary.map((cat) => (
                                <div
                                    key={cat.category}
                                    className="bg-slate-950 border border-slate-800 rounded-xl p-4"
                                >
                                    <p className="text-sm text-slate-400">{cat.category}</p>

                                    <h3 className="text-xl font-bold mt-2">
                                        {num(cat.totalQty)}
                                    </h3>

                                    <p className="text-xs text-slate-500 mt-1">
                                        Qty Used
                                    </p>

                                    <div className="mt-3 border-t border-slate-800 pt-3">
                                        <p className="text-xs text-slate-500">
                                            Unique Items:{" "}
                                            <span className="text-slate-300 font-medium">
                                                {num(cat.uniqueItemCount)}
                                            </span>
                                        </p>

                                        <p className="text-xs text-slate-500 mt-1">
                                            Total Amount:{" "}
                                            <span className="text-emerald-400 font-medium">
                                                {money(cat.totalAmount)}
                                            </span>
                                        </p>
                                        <button
                                            onClick={() => openCategoryModal(cat.category)}
                                            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-xl text-sm font-medium"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Panel>
            </div>
            {/* Category summary  end */}

            {/* Top Material Start */}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Panel title="Top Materials">
                    {(report?.topMaterials || []).length === 0 ? (
                        <Empty text="No material data found." />
                    ) : (
                        report.topMaterials.map((item, index) => (
                            <Row
                                key={item._id || index}
                                label={`${index + 1}. ${item._id || "N/A"}`}
                                value={`${num(item.totalQty)} ${item.uom || ""}`}
                            />
                        ))
                    )}
                </Panel>

                <Panel title="Recent Material Movements">
                    {(report?.recentMovements || []).length === 0 ? (
                        <Empty text="No recent movement found." />
                    ) : (
                        report.recentMovements.map((item) => (
                            <div
                                key={item._id}
                                className="border-b border-slate-800 py-3 last:border-0"
                            >
                                <div className="flex justify-between gap-4">
                                    <div>
                                        <p className="font-medium">{item.itemName}</p>
                                        <p className="text-xs text-slate-500">
                                            {item.documentName || "No Document"} • {item.typeOfTransit || "N/A"}
                                        </p>
                                    </div>
                                    <p className="text-slate-300">
                                        {num(item.quantity)} {item.uom || ""}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </Panel>
            </div>
            {/* Top Material End */}

            {/* Open Category Moddal */}
            {categoryModalOpen && (
  <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
    <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm text-blue-400 font-semibold">
            Category Report
          </p>
          <h2 className="text-2xl font-bold">{selectedCategory}</h2>
        </div>

        <button
          onClick={() => setCategoryModalOpen(false)}
          className="h-10 w-10 rounded-xl bg-slate-900 hover:bg-slate-800 flex items-center justify-center"
        >
          <X size={20} />
        </button>
      </div>

      {categoryLoading ? (
        <div className="text-center text-slate-400 py-10">
          <Loader2 className="animate-spin inline mr-2" />
          Loading category details...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Stat
              icon={Package}
              title="Total Records"
              value={num(categoryData?.summary?.totalRecords)}
            />

            <Stat
              icon={Package}
              title="Total Qty"
              value={num(categoryData?.summary?.totalQty)}
            />

            <Stat
              icon={IndianRupee}
              title="Total Amount"
              value={money(categoryData?.summary?.totalAmount)}
            />

            <Stat
              icon={TrendingUp}
              title="Unique Items"
              value={num(categoryData?.summary?.uniqueItemCount)}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
            <MiniInsight
              title="Highest Rate Item"
              main={categoryData?.highestRateItem?.itemName || "N/A"}
              sub={`Rate: ${money(categoryData?.highestRateItem?.rate)}`}
            />

            <MiniInsight
              title="Most Used Item"
              main={categoryData?.mostUsedItem?._id || "N/A"}
              sub={`Qty: ${num(categoryData?.mostUsedItem?.totalQty)} ${
                categoryData?.mostUsedItem?.uom || ""
              }`}
            />

            <MiniInsight
              title="Top Consumption"
              main={categoryData?.topConsumptionItems?.[0]?._id || "N/A"}
              sub={`Amount: ${money(
                categoryData?.topConsumptionItems?.[0]?.totalAmount
              )}`}
            />
          </div>
          {/* Serch */}
          <div className="mb-4">
  <input
    value={categoryItemSearch}
    onChange={(e) => setCategoryItemSearch(e.target.value)}
    placeholder="Search item in this category..."
    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
  />
</div>

          <Panel title="Item-wise Breakup">
  {(filteredCategoryItems || []).length === 0 ? (
    <Empty text="No item breakup found." />
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {filteredCategoryItems.map((item) => (
        <div
          key={item.itemName}
          className="bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-blue-500 transition"
        >
          <h3 className="font-semibold text-sm leading-5">
            {item.itemName || "N/A"}
          </h3>

          <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
            <div>
              <p className="text-slate-500">Total Qty</p>
              <p className="font-semibold text-white mt-1">
                {num(item.totalQty)} {item.uom || ""}
              </p>
            </div>

            <div>
              <p className="text-slate-500">Total Value</p>
              <p className="font-semibold text-emerald-400 mt-1">
                {money(item.totalAmount)}
              </p>
            </div>

            <div>
              <p className="text-slate-500">Avg Rate</p>
              <p className="font-semibold text-blue-400 mt-1">
                {money(item.avgRate)}
              </p>
            </div>

            <div>
              <p className="text-slate-500">Records</p>
              <p className="font-semibold text-white mt-1">
                {num(item.recordsCount)}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-xs">
            <span className="text-slate-500">
              Min: <b className="text-slate-300">{money(item.minRate)}</b>
            </span>
            <span className="text-slate-500">
              Max: <b className="text-slate-300">{money(item.maxRate)}</b>
            </span>
          </div>
        </div>
      ))}
    </div>
  )}
</Panel>

          <Panel title="Top Consumption Items">
            {(categoryData?.topConsumptionItems || []).map((item, index) => (
              <Row
                key={item._id || index}
                label={`${index + 1}. ${item._id}`}
                value={`${num(item.totalQty)} ${item.uom || ""} • ${money(
                  item.totalAmount
                )}`}
              />
            ))}
          </Panel>
        </>
      )}
    </div>
  </div>
)}

        </div>
    );
}

function Stat({ icon: Icon, title, value, onClick }) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5" onClick={onClick}>
            <div className="flex items-center justify-between" >
                <div>
                    <p className="text-slate-400 text-sm">{title}</p>
                    <h2 className="text-xl font-bold mt-2">{value}</h2>
                </div>
                <div className="h-11 w-11 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Icon className="text-blue-400" size={22} />
                </div>
            </div>
        </div>
    );
}

function Panel({ title, children }) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText size={18} className="text-blue-400" />
                {title}
            </h2>
            {children}
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex justify-between border-b border-slate-800 py-3 last:border-0">
            <span>{label}</span>
            <span className="text-slate-400">{value}</span>
        </div>
    );
}

function Empty({ text }) {
    return <p className="text-slate-500 text-sm">{text}</p>;
}

function money(value) {
    return `₹ ${Number(value || 0).toLocaleString("en-IN")}`;
}

function num(value) {
    return Number(value || 0).toLocaleString("en-IN");
}

function MiniInsight({ title, main, sub }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <p className="text-slate-400 text-sm">{title}</p>
      <h3 className="text-lg font-bold mt-2">{main}</h3>
      <p className="text-blue-400 text-sm mt-2">{sub}</p>
    </div>
  );
}