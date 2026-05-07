import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
  Search,
  Loader2,
  X,
  Download,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import AddDPRModal from "../DPR/AddDPRModal";

export default function DailyProgressReportPage() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);

  const [pageLoading, setPageLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [mode, setMode] = useState("add");

  const [filters, setFilters] = useState({
    search: "",
    fromDate: "",
    toDate: ""
  });

  const token = localStorage.getItem("token");

  const fetchReports = async () => {
    try {
      setPageLoading(true);

      const res = await fetch("http://localhost:5000/dpr/all", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
   console.log("All Reports",data)
      if (data.success) {
        setReports(data.reports || []);
      } else {
        toast.error(data.message || "Failed to load DPR reports");
      }
    } catch (error) {
      console.log("DPR fetch error:", error);
      toast.error("Server error while loading DPR");
    } finally {
      setPageLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("http://localhost:5000/project-master/all", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      console.log("All Projects",data)
      if (data.success) {
        setProjects(data.data || []);
      }
    } catch (error) {
      console.log("Project fetch error:", error);
      toast.error("Failed to load projects");
    }
  };

  useEffect(() => {
    fetchReports();
    fetchProjects();
  }, []);

  const openAddModal = () => {
    setSelectedReport(null);
    setMode("add");
    setIsModalOpen(true);
    toast("Opening DPR form");
  };

  const openViewModal = (report) => {
    setSelectedReport(report);
    setMode("view");
    setIsModalOpen(true);
  };

  const openEditModal = (report) => {
    setSelectedReport(report);
    setMode("edit");
    setIsModalOpen(true);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      fromDate: "",
      toDate: ""
    });

    toast.success("Filters cleared");
  };

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const searchText = filters.search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        report?.projectName?.toLowerCase().includes(searchText) ||
        report?.siteInchargeName?.toLowerCase().includes(searchText) ||
        report?.workDoneToday?.toLowerCase().includes(searchText) ||
        report?.issuesFaced?.toLowerCase().includes(searchText);

      const reportDate = report?.reportDate
        ? new Date(report.reportDate)
        : null;

      const fromDate = filters.fromDate
        ? new Date(filters.fromDate)
        : null;

      const toDate = filters.toDate ? new Date(filters.toDate) : null;

      if (toDate) {
        toDate.setHours(23, 59, 59, 999);
      }

      const matchesFromDate =
        !fromDate || (reportDate && reportDate >= fromDate);

      const matchesToDate =
        !toDate || (reportDate && reportDate <= toDate);

      return matchesSearch && matchesFromDate && matchesToDate;
    });
  }, [reports, filters]);

  const exportDPRToExcel = () => {
    if (filteredReports.length === 0) {
      toast.error("No DPR data available to export");
      return;
    }

    const exportData = filteredReports.map((r, index) => ({
      "S.No": index + 1,
      Date: new Date(r.reportDate).toLocaleDateString("en-IN"),
      Site: r.projectName || "N/A",
      "Work Done": r.workDoneToday || "",
      Manpower: r.manpowerCount || 0,
      "Site Incharge": r.siteInchargeName || "",
      "Issues Faced": r.issuesFaced || "",
      "Tomorrow Plan": r.tomorrowPlan || "",
      Remarks: r.remarks || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "DPR Reports");

    XLSX.writeFile(workbook, "Daily_Progress_Report.xlsx");

    toast.success("DPR exported successfully");
  };

  const handleDelete = async (dprId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this DPR?"
    );

    if (!confirmDelete) {
      toast("Delete cancelled");
      return;
    }

    try {
      setDeleteLoadingId(dprId);

      const loadingToast = toast.loading("Deleting DPR...");

      const res = await fetch(`http://localhost:5000/dpr/delete/${dprId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      toast.dismiss(loadingToast);

      if (data.success) {
        toast.success("DPR deleted successfully");
        fetchReports();
      } else {
        toast.error(data.message || "Failed to delete DPR");
      }
    } catch (error) {
      console.log("DPR delete error:", error);
      toast.error("Server error while deleting DPR");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const totalManpower = reports.reduce(
    (sum, r) => sum + Number(r.manpowerCount || 0),
    0
  );

  const todayReports = reports.filter(
    (r) =>
      new Date(r.reportDate).toDateString() === new Date().toDateString()
  ).length;

  const issueReports = reports.filter(
    (r) => r.issuesFaced && r.issuesFaced.trim() !== ""
  ).length;

  const today = new Date().toDateString();

  const todaySubmittedProjectNames = reports
    .filter((r) => new Date(r.reportDate).toDateString() === today)
    .map((r) => r.projectName?.toLowerCase());

  const pendingDprSites = projects.filter((project) => {
    const projectName =
      project.projectName || project.siteName || project.name || "";

      console.log("Pending Dpr Sites"+projectName)
    return !todaySubmittedProjectNames.includes(projectName.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white rounded-xl shadow hover:bg-gray-50"
          >
            <ArrowLeft size={22} />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Daily Progress Report
            </h1>
            <p className="text-gray-500 text-sm">
              Track daily work progress of all sites
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={exportDPRToExcel}
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700"
          >
            <Download size={18} />
            Export Excel
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700"
          >
            <Plus size={18} />
            Add DPR
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-6">
        <StatsCard title="Total DPR" value={reports.length} />
        <StatsCard title="Today Reports" value={todayReports} />
        <StatsCard title="Total Manpower" value={totalManpower} />
        <StatsCard title="Issues Reported" value={issueReports} />
        <StatsCard title="Pending DPR Today" value={pendingDprSites.length} />
      </div>

      {/* Pending DPR Sites */}
      <div className="bg-white rounded-2xl shadow p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="text-orange-500" size={22} />
          <h2 className="text-lg font-semibold text-gray-800">
            Today Pending DPR Sites
          </h2>
        </div>

        {pendingDprSites.length >= 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {pendingDprSites.map((project) => {
              const projectName =
                project.projectName ||
                project.siteName ||
                project.name ||
                "Unnamed Site";

              return (
                <div
                  key={project._id}
                  className="border border-orange-200 bg-orange-50 rounded-xl p-3"
                >
                  <p className="font-medium text-gray-800">{projectName}</p>
                  <p className="text-xs text-orange-600 mt-1">
                    DPR not submitted today
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-green-600 font-medium">
            All sites submitted DPR today ✅
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute top-3 left-3 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search site / work / incharge"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="w-full border rounded-xl pl-10 pr-3 py-2 outline-none"
            />
          </div>

          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) =>
              setFilters({ ...filters, fromDate: e.target.value })
            }
            className="border rounded-xl px-3 py-2 outline-none"
          />

          <input
            type="date"
            value={filters.toDate}
            onChange={(e) =>
              setFilters({ ...filters, toDate: e.target.value })
            }
            className="border rounded-xl px-3 py-2 outline-none"
          />

          <button
            onClick={clearFilters}
            className="bg-gray-800 text-white rounded-xl px-4 py-2 flex items-center justify-center gap-2"
          >
            <X size={16} />
            Clear Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {pageLoading ? (
          <div className="p-10 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={36} />
            <p className="text-gray-500 mt-3">Loading DPR reports...</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Site</th>
                <th className="p-4 text-left">Work Done</th>
                <th className="p-4 text-left">Manpower</th>
                <th className="p-4 text-left">Incharge</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <tr key={report._id} className="border-t hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-gray-400" />
                        {new Date(report.reportDate).toLocaleDateString(
                          "en-IN"
                        )}
                      </div>
                    </td>

                    <td className="p-4 font-medium">
                      {report.projectName || "N/A"}
                    </td>

                    <td className="p-4 max-w-xs truncate">
                      {report.workDoneToday}
                    </td>

                    <td className="p-4">{report.manpowerCount}</td>

                    <td className="p-4">
                      {report.siteInchargeName || "N/A"}
                    </td>

                    <td className="p-4">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => openViewModal(report)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View DPR"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          onClick={() => openEditModal(report)}
                          className="text-green-600 hover:text-green-800"
                          title="Edit DPR"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          onClick={() => handleDelete(report._id)}
                          disabled={deleteLoadingId === report._id}
                          className="text-red-600 hover:text-red-800 disabled:text-gray-400"
                          title="Delete DPR"
                        >
                          {deleteLoadingId === report._id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan="6">
                    No DPR found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <AddDPRModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={mode}
        report={selectedReport}
        refreshReports={fetchReports}
      />
    </div>
  );
}

function StatsCard({ title, value }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow">
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-2xl font-bold">{value}</h2>
    </div>
  );
}