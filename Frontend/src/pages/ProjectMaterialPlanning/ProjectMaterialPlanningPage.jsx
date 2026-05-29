import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Upload,
  Search,
  Package,
  Truck,
  History,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import BASE_URL from "../../../config/api";

export default function ProjectMaterialPlanningPage() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [boqItems, setBoqItems] = useState([]);
  const [search, setSearch] = useState("");
  const [boqFile, setBoqFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${BASE_URL}/project-master/all`, {
        headers: authHeaders,
      });

      const data = await res.json();
      setProjects(data.data || []);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load projects");
    }
  };

  const fetchBoqItems = async (projectId) => {
    if (!projectId) return;

    try {
      setLoading(true);

      const res = await fetch(
        `${BASE_URL}/project-material-planning/boq-item/project/${projectId}`,
        {
          headers: authHeaders,
        }
      );

      const data = await res.json();

      if (data.success) {
        setBoqItems(data.data || []);
      } else {
        toast.error(data.message || "Failed to load BOQ items");
      }
    } catch (error) {
      console.log(error);
      toast.error("Server error while loading BOQ items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    setSelectedProject(projectId);
    setBoqItems([]);

    if (projectId) {
      fetchBoqItems(projectId);
    }
  };

  const handleBoqUpload = async () => {
    if (!selectedProject) {
      toast.error("Please select project first");
      return;
    }

    if (!boqFile) {
      toast.error("Please select BOQ Excel file");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("projectRef", selectedProject);
      formData.append("boqFile", boqFile);

      const res = await fetch(
        `${BASE_URL}/project-material-planning/boq-item/bulk-upload`,
        {
          method: "POST",
          headers: authHeaders,
          body: formData,
        }
      );

      const data = await res.json();

      if (data.success) {
        toast.success(
          `Uploaded: ${data.createdCount}, Skipped: ${data.skippedCount}`
        );
        setBoqFile(null);
        fetchBoqItems(selectedProject);
      } else {
        toast.error(data.message || "BOQ upload failed");
      }
    } catch (error) {
      console.log(error);
      toast.error("Server error while uploading BOQ");
    } finally {
      setUploading(false);
    }
  };

  const filteredBoqItems = useMemo(() => {
    return boqItems.filter((item) => {
      const text = `
        ${item?.itemIdentityRef?.itemCode || ""}
        ${item?.itemIdentityRef?.itemName || ""}
        ${item?.generalName || ""}
        ${item?.description || ""}
        ${item?.activity || ""}
      `.toLowerCase();

      return text.includes(search.toLowerCase());
    });
  }, [boqItems, search]);

  const summary = useMemo(() => {
    const totalBoqQty = boqItems.reduce(
      (sum, item) => sum + Number(item.boqQty || 0),
      0
    );

    const totalDeliveredQty = boqItems.reduce(
      (sum, item) => sum + Number(item.deliveredQty || 0),
      0
    );

    const totalInstalledQty = boqItems.reduce(
      (sum, item) => sum + Number(item.installedQty || 0),
      0
    );

    const pendingItems = boqItems.filter(
      (item) => Number(item.boqQty || 0) > Number(item.deliveredQty || 0)
    ).length;

    return {
      totalBoqQty,
      totalDeliveredQty,
      totalInstalledQty,
      pendingItems,
    };
  }, [boqItems]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-6 shadow-xl">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Project Material Planning
              </h1>
              <p className="text-slate-400 mt-1">
                Track BOQ quantity, delivered material, installation and procurement pressure.
              </p>
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4 flex items-center gap-3">
              <Package className="text-cyan-400" />
              <div>
                <p className="text-xs text-slate-500">Module</p>
                <p className="font-semibold text-cyan-400">
                  BOQ Delivery Tracking
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <SummaryCard title="BOQ Qty" value={summary.totalBoqQty} />
          <SummaryCard
            title="Delivered Qty"
            value={summary.totalDeliveredQty}
            color="text-emerald-400"
          />
          <SummaryCard
            title="Installed Qty"
            value={summary.totalInstalledQty}
            color="text-cyan-400"
          />
          <SummaryCard
            title="Pending Items"
            value={summary.pendingItems}
            color="text-red-400"
          />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-6">
          <div className="grid lg:grid-cols-4 gap-4">
            <select
              value={selectedProject}
              onChange={handleProjectChange}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
            >
              <option value="">Select Project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name} - {project.code}
                </option>
              ))}
            </select>

            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setBoqFile(e.target.files[0])}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100"
            />

            <button
              onClick={handleBoqUpload}
              disabled={uploading}
              className="flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-slate-950 font-bold rounded-xl px-4 py-3"
            >
              {uploading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Upload size={18} />
              )}
              Upload BOQ
            </button>

            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                placeholder="Search item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          {loading ? (
            <div className="p-10 flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-cyan-400" size={36} />
              <p className="text-slate-400 mt-3">Loading BOQ items...</p>
            </div>
          ) : !selectedProject ? (
            <EmptyState text="Please select a project to view BOQ items." />
          ) : filteredBoqItems.length === 0 ? (
            <EmptyState text="No BOQ items found for this project." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-950 border-b border-slate-800">
                  <tr>
                    <Th>BOQ Item Code</Th>
                    <Th>General Name</Th>
                    <Th>Description</Th>
                    <Th>UOM</Th>
                    <Th>BOQ Qty</Th>
                    <Th>PO Qty</Th>
                    <Th>Delivered</Th>
                    <Th>Balance</Th>
                    <Th>Installed</Th>
                    <Th>Status</Th>
                    <Th>Priority</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBoqItems.map((item) => {
                    const boqQty = Number(item.boqQty || 0);
                    const deliveredQty = Number(item.deliveredQty || 0);
                    const installedQty = Number(item.installedQty || 0);
                    const balanceQty = boqQty - deliveredQty;

                    return (
                      <tr
                        key={item._id}
                        className="border-b border-slate-800 hover:bg-slate-800/40"
                      >
                        <td className="p-4 font-semibold text-white">
                          {item?.boqItemCode || "-"}
                        </td>

                        <td className="p-4 text-slate-300">
                          {item.generalName ||
                            item?.itemIdentityRef?.itemName ||
                            "-"}
                        </td>

                        <td className="p-4 text-slate-400 min-w-[300px]">
                          {item.description || "-"}
                        </td>

                        <td className="p-4 text-slate-300">
                          {item.uom || item?.itemIdentityRef?.uom || "-"}
                        </td>

                        <td className="p-4 text-slate-300">{boqQty}</td>
                        <td className="p-4 text-slate-300">
                          {item.poQty || 0}
                        </td>

                        <td className="p-4 text-emerald-400 font-semibold">
                          {deliveredQty}
                        </td>

                        <td
                          className={`p-4 font-semibold ${
                            balanceQty > 0 ? "text-red-400" : "text-emerald-400"
                          }`}
                        >
                          {balanceQty}
                        </td>

                        <td className="p-4 text-cyan-400 font-semibold">
                          {installedQty}
                        </td>

                        <td className="p-4">
                          <StatusBadge status={item.status} />
                        </td>

                        <td className="p-4">
                          <PriorityBadge priority={item.priority} />
                        </td>

                        <td className="p-4">
                          <div className="flex gap-2">
                            <button className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Truck size={15} />
                              Delivery
                            </button>

                            <button className="flex items-center gap-1 px-3 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              <History size={15} />
                              History
                            </button>

                            <button className="flex items-center gap-1 px-3 py-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              <CheckCircle2 size={15} />
                              Installed
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, color = "text-white" }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <p className="text-slate-500">{title}</p>
      <h2 className={`text-3xl font-bold mt-2 ${color}`}>{value}</h2>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="p-10 flex flex-col items-center justify-center text-slate-500">
      <AlertTriangle className="mb-3 text-amber-400" size={34} />
      <p>{text}</p>
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="p-4 text-left text-slate-300 font-semibold whitespace-nowrap">
      {children}
    </th>
  );
}

function StatusBadge({ status }) {
  const value = status || "Not Started";

  const cls =
    value === "Fully Delivered" || value === "Installed" || value === "Closed"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : value === "Partially Delivered" || value === "Partially Installed"
      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
      : "bg-red-500/10 text-red-400 border-red-500/20";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {value}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const value = priority || "Medium";

  const cls =
    value === "Critical"
      ? "bg-red-500/10 text-red-400 border-red-500/20"
      : value === "High"
      ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
      : value === "Medium"
      ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
      : "bg-slate-500/10 text-slate-400 border-slate-500/20";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {value}
    </span>
  );
}