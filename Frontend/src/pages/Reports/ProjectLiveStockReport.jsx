import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  Search,
  Package,
  Building2,
  IndianRupee,
  ArrowDownCircle,
  ArrowUpCircle,
  Eye,
  X,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../../../config/api";

export default function ProjectLiveStockReport() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState([]);
  const [itemWiseStock, setItemWiseStock] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);

  const fetchReport = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${BASE_URL}/material-movement/analytics/project-stock`
      );

      setSummary(res.data.data?.projectSummary || []);
      setItemWiseStock(res.data.data?.itemWiseStock || []);
    } catch (error) {
      console.error("Project live stock error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const filteredProjects = useMemo(() => {
    return summary.filter((item) =>
      item.projectName?.toLowerCase().includes(search.toLowerCase())
    );
  }, [summary, search]);

  const selectedProjectItems = useMemo(() => {
    if (!selectedProject) return [];

    return itemWiseStock.filter(
      (item) => item.projectName === selectedProject.projectName
    );
  }, [itemWiseStock, selectedProject]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <button
        onClick={() => navigate("/reports/material-summary")}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft size={18} />
        Back to Material Summary
      </button>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-6">
        <div>
          <p className="text-sm text-cyan-400 font-semibold">
            Live Stock Intelligence
          </p>
          <h1 className="text-3xl font-bold mt-1">
            Project / Site Live Stock
          </h1>
          <p className="text-slate-400 mt-2">
            Project stock calculated from DDC, DC, LPN inward and MRS outward.
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
            className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-sm outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">
          <Loader2 className="animate-spin inline mr-2" />
          Loading live stock...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">
          No project stock found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <ProjectStockCard
              key={project.projectName}
              project={project}
              onView={() => setSelectedProject(project)}
            />
          ))}
        </div>
      )}

      {selectedProject && (
        <ProjectStockModal
          project={selectedProject}
          items={selectedProjectItems}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}

function ProjectStockCard({ project, onView }) {

 return (
   

    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-cyan-500 transition">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold leading-snug">
            {project.projectName || "N/A"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Live project material balance
          </p>
        </div>

        <div className="h-10 w-10 bg-cyan-500/10 rounded-xl flex items-center justify-center">
          <Building2 className="text-cyan-400" size={22} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <Info icon={Package} label="Unique Items" value={project.totalUniqueItems} />
        <Info icon={ArrowDownCircle} label="In Qty" value={num(project.totalInQty)} tone="text-emerald-400" />
        <Info icon={ArrowUpCircle} label="Out Qty" value={num(project.totalOutQty)} tone="text-red-400" />
        <Info icon={Package} label="Available Qty" value={num(project.availableQty)} tone="text-cyan-400" />
      </div>

      <div className="mt-4 bg-slate-950 border border-slate-800 rounded-xl p-4">
        <p className="text-xs text-slate-500">Material Value</p>
        <h3 className="text-xl font-bold text-emerald-400 mt-1">
          ₹ {num(project.totalValue)}
        </h3>
      </div>

      <button
        onClick={onView}
        className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 py-2.5 rounded-xl font-medium"
      >
        <Eye size={17} />
        View Item Breakup
      </button>
    </div>
  );
  
 
}

function ProjectStockModal({ project, items, onClose }) {
  const [itemSearch, setItemSearch] = useState("");

  const filteredItems = items.filter((item) =>
    item.itemName?.toLowerCase().includes(itemSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm text-cyan-400 font-semibold">
              Project Stock Breakup
            </p>
            <h2 className="text-2xl font-bold">{project.projectName}</h2>
          </div>

          <button
            onClick={onClose}
            className="h-10 w-10 rounded-xl bg-slate-900 hover:bg-slate-800 flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        <input
          value={itemSearch}
          onChange={(e) => setItemSearch(e.target.value)}
          placeholder="Search item..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm mb-5 outline-none focus:border-cyan-500"
        />

        {filteredItems.length === 0 ? (
          <p className="text-slate-500">No item found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {filteredItems.map((item) => (
               <div
                key={`${item.projectName}-${item.itemName}`}
                className="bg-slate-900 border border-slate-800 rounded-xl p-3 hover:border-cyan-500 transition"
              >
                <h3 className="font-medium text-sm line-clamp-2">
                  {item.itemName || "N/A"}
                </h3>

                <span className="inline-block text-[10px] px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400 mt-2">
                  {item.uom || "-"}
                </span>

                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <Mini label="In" value={num(item.inQty)} tone="text-emerald-400" />
                  <Mini label="Out" value={num(item.outQty)} tone="text-red-400" />
                  <Mini label="Available" value={num(item.availableQty)} tone="text-cyan-400" />
                  <Mini label="Avg Rate" value={`₹ ${num(item.avgRate)}`} />
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800 text-xs flex justify-between">
                  <span className="text-slate-500">Value</span>
                  <span className="text-emerald-400 font-semibold">
                    ₹ {num(item.totalValue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value, tone = "text-slate-200" }) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Icon size={15} className={tone} />
        {label}
      </div>
      <p className={`font-semibold mt-2 ${tone}`}>{value}</p>
    </div>
  );
}

function Mini({ label, value, tone = "text-slate-200" }) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-2">
      <p className="text-slate-500">{label}</p>
      <p className={`font-semibold mt-1 ${tone}`}>{value}</p>
    </div>
  );
}

function num(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });
}