import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  Eye,
  Loader2,
  Search,
  Building2,
  Package,
  Users,
  IndianRupee,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../../../config/api";

export default function ProjectWiseMaterialHistory() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchProjectWiseReport = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${BASE_URL}/material-movement/analytics/projects`
      );

      setProjects(res.data.data || []);
    } catch (error) {
      console.error("Project-wise material report error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectWiseReport();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((item) =>
      (item.projectName || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [projects, search]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <button
        onClick={() => navigate("/reports/material-summary")}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft size={18} />
        Back to Material History Summary
      </button>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-6">
        <div>
          <p className="text-sm text-blue-400 font-semibold">
            Material Analytics
          </p>
          <h1 className="text-3xl font-bold mt-1">
            Project-wise Material History
          </h1>
          <p className="text-slate-400 mt-2">
            Search projects and view inward, outward, vendor, material and value summary.
          </p>
        </div>

        <div className="relative w-full lg:w-96">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search project..."
            className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <HeaderStat
          icon={Building2}
          title="Total Projects"
          value={projects.length}
        />
        <HeaderStat
          icon={Package}
          title="Showing Projects"
          value={filteredProjects.length}
        />
        <HeaderStat
          icon={IndianRupee}
          title="Total Value"
          value={`₹ ${projects
            .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0)
            .toLocaleString("en-IN")}`}
        />
      </div>

      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">
          <Loader2 className="animate-spin inline mr-2" size={20} />
          Loading project report...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">
          No project-wise material data found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((item, index) => (
            <ProjectCard
              key={item.projectName || index}
              item={item}
              onView={() =>
                navigate(
                  `/reports/material-history/projects/${encodeURIComponent(
                    item.projectName || "unknown"
                  )}`
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ item, onView }) {
  const inQty = Number(item.inwardQty || 0);
  const outQty = Number(item.outwardQty || 0);
  const totalQty = inQty + outQty;
  const outPercent = totalQty > 0 ? Math.round((outQty / totalQty) * 100) : 0;

  return (
    <div className="group bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Building2 className="text-blue-400" size={24} />
          </div>

          <div>
            <h2 className="text-lg font-semibold leading-snug">
              {item.projectName || "N/A"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Project material movement summary
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <InfoBox
          icon={ArrowDownCircle}
          label="In Qty"
          value={inQty.toLocaleString("en-IN")}
          tone="text-emerald-400"
        />
        <InfoBox
          icon={ArrowUpCircle}
          label="Out Qty"
          value={outQty.toLocaleString("en-IN")}
          tone="text-orange-400"
        />
        <InfoBox
          icon={Package}
          label="Materials"
          value={item.totalMaterials || 0}
          tone="text-blue-400"
        />
        <InfoBox
          icon={Users}
          label="Vendors"
          value={item.totalVendors || 0}
          tone="text-purple-400"
        />
      </div>

      <div className="mt-5 bg-slate-950 border border-slate-800 rounded-xl p-4">
        <p className="text-xs text-slate-400">Total Amount</p>
        <h3 className="text-xl font-bold text-emerald-400 mt-1">
          ₹ {Number(item.totalAmount || 0).toLocaleString("en-IN")}
        </h3>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Out Movement</span>
            <span>{outPercent}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${outPercent}%` }}
            />
          </div>
        </div>
      </div>

      <button
        onClick={onView}
        className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 py-2.5 rounded-xl font-medium transition"
      >
        <Eye size={17} />
        View Details
      </button>
    </div>
  );
}

function InfoBox({ icon: Icon, label, value, tone }) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
      <div className="flex items-center gap-2 text-slate-400 text-xs">
        <Icon size={15} className={tone} />
        {label}
      </div>
      <h4 className="font-semibold mt-2">{value}</h4>
    </div>
  );
}

function HeaderStat({ icon: Icon, title, value }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <h3 className="text-xl font-bold mt-1">{value}</h3>
        </div>
        <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
          <Icon className="text-blue-400" size={22} />
        </div>
      </div>
    </div>
  );
}