import React from "react";
import {
  ArrowLeft,
  Download,
  Users,
  Package,
  MapPin,
  FileText,
  IndianRupee,
  Activity,
  Scale
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
    challanType: ""
  });

  const [projects, setProjects] = React.useState([]);
  const [summary, setSummary] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`
  };

  const formatAmount = (amount) => {
    return `₹ ${Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 0
    })}`;
  };

  const formatQty = (qty, uom = "") => {
    return `${Number(qty || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2
    })} ${uom || ""}`.trim();
  };

  const getMaterialName = (item) => {
    if (!item?._id) return "N/A";

    if (typeof item._id === "string") return item._id;

    return item._id.itemName || "N/A";
  };

  const getMaterialUom = (item) => {
    if (!item?._id || typeof item._id === "string") return item?.uom || "";
    return item._id.uom || "";
  };

  const getChallanType = (item) => {
    if (!item?._id) return "N/A";

    if (typeof item._id === "string") return item._id;

    return item._id.typeOfTransit || "N/A";
  };

  const getChallanUom = (item) => {
    if (!item?._id || typeof item._id === "string") return item?.uom || "";
    return item._id.uom || "";
  };

  const fetchSummary = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${BASE_URL}/material-movement/analytics/summary`,
        {
          params: filters,
          headers: authHeaders
        }
      );

      setSummary(res.data.data);
    } catch (error) {
      console.error("Material summary fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${BASE_URL}/project-master/all`, {
        headers: authHeaders
      });

      const data = await res.json();

      const uniqueProjects = Array.from(
        new Set((data.data || []).map((project) => project.name))
      ).map((name) => {
        return data.data.find((project) => project.name === name);
      });

      setProjects(uniqueProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const resetFilters = () => {
    setFilters({
      fromDate: "",
      toDate: "",
      project: "",
      challanType: ""
    });
  };

  React.useEffect(() => {
    fetchSummary();
    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      {loading && <p className="mb-4 text-slate-400">Loading summary...</p>}

      <button
        onClick={() => navigate("/reports/material-analytics")}
        className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white"
      >
        <ArrowLeft size={18} />
        Back to Analytics Center
      </button>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-400">
            Material Analytics
          </p>
          <h1 className="text-3xl font-bold">
            Material Transaction Summary
          </h1>
          <p className="mt-2 text-slate-400">
            Overall transaction amount, challans, UOM-wise quantity, vendors and sites.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/reports/material-history/projects")}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 hover:bg-emerald-700"
          >
            <BarChart3 size={18} />
            Project-wise Report
          </button>

          <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 hover:bg-blue-700">
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) =>
              setFilters({ ...filters, fromDate: e.target.value })
            }
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm"
          />

          <input
            type="date"
            value={filters.toDate}
            onChange={(e) =>
              setFilters({ ...filters, toDate: e.target.value })
            }
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm"
          />

          <select
            value={filters.project}
            onChange={(e) =>
              setFilters({ ...filters, project: e.target.value })
            }
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm"
          >
            <option value="">All Projects</option>
            {projects.map((project, index) => (
              <option key={index} value={project?.name}>
                {project?.name}
              </option>
            ))}
          </select>

          <select
            value={filters.challanType}
            onChange={(e) =>
              setFilters({ ...filters, challanType: e.target.value })
            }
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm"
          >
            <option value="">All Challan Types</option>
            <option value="DDC">DDC</option>
            <option value="DC">DC</option>
            <option value="LPN">LPN</option>
            <option value="MRN">MRN</option>
            <option value="MRS">MRS</option>
            <option value="ISMN">ISMN</option>
          </select>

          <button
            onClick={fetchSummary}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            Apply Filter
          </button>

          <button
            onClick={resetFilters}
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard
          icon={IndianRupee}
          title="Total Transaction Amount"
          value={formatAmount(summary?.totalTransactionAmount)}
        />

        <SummaryCard
          icon={Activity}
          title="Total Transactions"
          value={summary?.totalTransactionCount || 0}
        />

        <SummaryCard
          icon={Package}
          title="Material Rows"
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

      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Scale size={19} className="text-blue-400" />
          Quantity Summary By UOM
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {(summary?.quantityByUom || []).map((item, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-800 bg-slate-950 p-4"
            >
              <p className="text-sm text-slate-400">UOM</p>
              <h3 className="mt-1 text-xl font-bold text-white">
                {item._id?.uom || item._id || "NA"}
              </h3>

              <div className="mt-3 text-sm text-slate-300">
                Qty:{" "}
                <span className="font-semibold text-blue-400">
                  {formatQty(item.totalQuantity)}
                </span>
              </div>

              <div className="mt-1 text-sm text-slate-300">
                Amount:{" "}
                <span className="font-semibold text-emerald-400">
                  {formatAmount(item.totalAmount)}
                </span>
              </div>

              <div className="mt-1 text-xs text-slate-500">
                {item.transactionCount || 0} transactions
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">Top Materials Used</h2>

          <div className="space-y-4">
            {(summary?.topMaterials || []).map((item, index) => (
              <div key={index}>
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span>
                    {index + 1}. {getMaterialName(item)}
                  </span>
                  <span className="text-slate-400">
                    {formatQty(item.totalQuantity, getMaterialUom(item))}
                  </span>
                </div>

                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>{item.transactionCount || 0} transactions</span>
                  <span>{formatAmount(item.totalAmount)}</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${Math.max(15, 90 - index * 8)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">Challan Type Summary</h2>

          <div className="space-y-3">
            {(summary?.challanTypeSummary || []).map((item, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">
                    {getChallanType(item)}{" "}
                    <span className="text-xs text-slate-500">
                      ({getChallanUom(item) || "NA"})
                    </span>
                  </span>

                  <span className="font-semibold text-blue-400">
                    {item.challanCount || item.count || 0} docs
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-xs text-slate-400">
                  <span>
                    Qty: {formatQty(item.totalQuantity, getChallanUom(item))}
                  </span>
                  <span>{formatAmount(item.totalAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">Top Vendors</h2>

          {(summary?.topVendors || []).map((vendor) => (
            <div
              key={vendor._id}
              className="flex justify-between border-b border-slate-800 py-3 last:border-0"
            >
              <div>
                <span>{vendor._id || "N/A"}</span>
                <p className="mt-1 text-xs text-slate-500">
                  {vendor.transactionCount || 0} transactions
                </p>
              </div>

              <span className="text-slate-400">
                {formatAmount(vendor.totalAmount)}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">Top Active Sites</h2>

          {(summary?.topSites || []).map((site) => (
            <div
              key={site._id}
              className="flex justify-between border-b border-slate-800 py-3 last:border-0"
            >
              <div>
                <span>{site._id || "N/A"}</span>
                <p className="mt-1 text-xs text-slate-500">
                  {site.transactionCount || 0} transactions
                </p>
              </div>

              <span className="text-slate-400">
                {formatAmount(site.totalAmount)}
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
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <h2 className="mt-2 text-2xl font-bold">{value}</h2>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10">
          <Icon className="text-blue-400" size={23} />
        </div>
      </div>
    </div>
  );
}