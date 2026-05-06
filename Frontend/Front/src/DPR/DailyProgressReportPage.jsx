import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
  Search
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AddDPRModal from "../DPR/AddDPRModal";

export default function DailyProgressReportPage() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [mode, setMode] = useState("add");

  const [filters, setFilters] = useState({
    search: "",
    fromDate: "",
    toDate: ""
  });

  const fetchReports = async () => {
    try {
      const res = await fetch("http://localhost:5000/dpr/all");
      const data = await res.json();

      if (data.success) {
        setReports(data.reports);
      }
    } catch (error) {
      console.log("DPR fetch error:", error);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const openAddModal = () => {
    setSelectedReport(null);
    setMode("add");
    setIsModalOpen(true);
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

  const filteredReports = reports.filter((report) => {
    const searchText = filters.search.toLowerCase();

    return (
      report?.projectName?.toLowerCase().includes(searchText) ||
      report?.siteInchargeName?.toLowerCase().includes(searchText) ||
      report?.workDoneToday?.toLowerCase().includes(searchText)
    );
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
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

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700"
        >
          <Plus size={18} />
          Add DPR
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
        <div className="bg-white p-5 rounded-2xl shadow">
          <p className="text-gray-500 text-sm">Total DPR</p>
          <h2 className="text-2xl font-bold">{reports.length}</h2>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow">
          <p className="text-gray-500 text-sm">Today Reports</p>
          <h2 className="text-2xl font-bold">
            {
              reports.filter(
                (r) =>
                  new Date(r.reportDate).toDateString() ===
                  new Date().toDateString()
              ).length
            }
          </h2>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow">
          <p className="text-gray-500 text-sm">Total Manpower</p>
          <h2 className="text-2xl font-bold">
            {reports.reduce((sum, r) => sum + Number(r.manpowerCount || 0), 0)}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow">
          <p className="text-gray-500 text-sm">Issues Reported</p>
          <h2 className="text-2xl font-bold">
            {reports.filter((r) => r.issuesFaced).length}
          </h2>
        </div>
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

          <button className="bg-gray-800 text-white rounded-xl px-4 py-2">
            Apply Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
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
                      {new Date(report.reportDate).toLocaleDateString("en-IN")}
                    </div>
                  </td>

                  <td className="p-4 font-medium">
                    {report.projectName || "N/A"}
                  </td>

                  <td className="p-4 max-w-xs truncate">
                    {report.workDoneToday}
                  </td>

                  <td className="p-4">{report.manpowerCount}</td>

                  <td className="p-4">{report.siteInchargeName || "N/A"}</td>

                  <td className="p-4">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => openViewModal(report)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye size={18} />
                      </button>

                      <button
                        onClick={() => openEditModal(report)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Pencil size={18} />
                      </button>

                      <button className="text-red-600 hover:text-red-800">
                        <Trash2 size={18} />
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