// TaskListModal.jsx
import React, { useMemo, useState } from "react";
import {
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  CalendarDays,
  User,
  Building2,
  BriefcaseBusiness,
  ClipboardList,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from "lucide-react";
import { useTasks } from "../../Context/TaskContext";

export default function TaskListModal({
  isOpen,
  onClose,
  tasks = [],
  type = "tasks",
  currentUser
}) {
  const { updateTaskStatus, loading } = useTasks();

  const [selectedTask, setSelectedTask] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState("in_progress");

  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [sortBy, setSortBy] = useState("dueDate");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);



  const inputClass =
    "w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  const smallInputClass =
    "rounded-2xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  const getTitle = () => {
    switch (type) {
      case "pending":
        return "Pending Tasks";
      case "overdue":
        return "Overdue Tasks";
      case "completed":
        return "Completed Tasks";
      case "urgent":
        return "Urgent Tasks";
      case "today":
        return "Today's Tasks";
      case "inProgress":
        return "In Progress Tasks";
      default:
        return "Task List";
    }
  };

  const getProjectName = (task) =>
    task.project?.projectName || task.project?.siteName || task.project?.name || "-";

  const getAssignedByName = (task) =>
    task.assignedBy?.fullName || task.assignedBy?.name || "Self";

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "urgent":
        return "border border-red-500/20 bg-red-500/15 text-red-400";
      case "high":
        return "border border-orange-500/20 bg-orange-500/15 text-orange-400";
      case "medium":
        return "border border-blue-500/20 bg-blue-500/15 text-blue-400";
      case "low":
        return "border border-slate-500/20 bg-slate-500/15 text-slate-300";
      default:
        return "border border-slate-500/20 bg-slate-500/15 text-slate-300";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "completed":
        return "border border-emerald-500/20 bg-emerald-500/15 text-emerald-400";
      case "in_progress":
        return "border border-purple-500/20 bg-purple-500/15 text-purple-400";
      case "hold":
        return "border border-yellow-500/20 bg-yellow-500/15 text-yellow-400";
      case "cancelled":
        return "border border-slate-500/20 bg-slate-500/15 text-slate-400";
      case "reopened":
        return "border border-pink-500/20 bg-pink-500/15 text-pink-400";
      default:
        return "border border-orange-500/20 bg-orange-500/15 text-orange-400";
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN");
  };

  const isOverdueTask = (task) => {
    if (!task?.dueDate || task.status === "completed") return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);

    return due < today;
  };

  const projectOptions = useMemo(() => {
    const projects = tasks
      .map((task) => getProjectName(task))
      .filter((name) => name && name !== "-");

    return [...new Set(projects)];
  }, [tasks]);

  const departmentOptions = useMemo(() => {
    const departments = tasks
      .map((task) => task.department || "Other")
      .filter(Boolean);

    return [...new Set(departments)];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let list = [...tasks];

    const search = searchTerm.trim().toLowerCase();

    if (search) {
      list = list.filter((task) => {
        const title = task.title?.toLowerCase() || "";
        const description = task.description?.toLowerCase() || "";
        const project = getProjectName(task).toLowerCase();
        const assignedBy = getAssignedByName(task).toLowerCase();
        const department = task.department?.toLowerCase() || "";

        return (
          title.includes(search) ||
          description.includes(search) ||
          project.includes(search) ||
          assignedBy.includes(search) ||
          department.includes(search)
        );
      });
    }

    if (priorityFilter !== "all") {
      list = list.filter((task) => task.priority === priorityFilter);
    }

    if (statusFilter !== "all") {
      list = list.filter((task) => task.status === statusFilter);
    }

    if (departmentFilter !== "all") {
      list = list.filter((task) => (task.department || "Other") === departmentFilter);
    }

    if (projectFilter !== "all") {
      list = list.filter((task) => getProjectName(task) === projectFilter);
    }

    list.sort((a, b) => {
      if (sortBy === "priority") {
        const order = { urgent: 1, high: 2, medium: 3, low: 4 };
        return (order[a.priority] || 5) - (order[b.priority] || 5);
      }

      if (sortBy === "status") {
        return String(a.status || "").localeCompare(String(b.status || ""));
      }

      if (sortBy === "createdAt") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }

      return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
    });

    return list;
  }, [
    tasks,
    searchTerm,
    priorityFilter,
    statusFilter,
    departmentFilter,
    projectFilter,
    sortBy
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / rowsPerPage));

  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredTasks.slice(start, start + rowsPerPage);
  }, [filteredTasks, currentPage, rowsPerPage]);

  const resetFilters = () => {
    setSearchTerm("");
    setPriorityFilter("all");
    setStatusFilter("all");
    setDepartmentFilter("all");
    setProjectFilter("all");
    setSortBy("dueDate");
    setCurrentPage(1);
  };

  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  const openTaskDetails = (task) => {
    setSelectedTask(task);
    setRemarks(task.remarks || "");
    setStatus(task.status || "in_progress");
  };

  const handleStatusUpdate = async () => {
    if (!selectedTask) return;

    const result = await updateTaskStatus(
      selectedTask._id,
      { status, remarks },
      currentUser?.role
    );

    if (result?.success) {
      setSelectedTask(null);
      setRemarks("");
      setStatus("in_progress");
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-7xl max-h-[90vh] overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-[0_0_45px_rgba(15,23,42,0.95)]">
        <div className="flex flex-col gap-4 border-b border-slate-800 bg-slate-900/70 px-6 py-5 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-blue-400">
              <ClipboardList size={22} />
            </div>

            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-100">
                {getTitle()}
              </h2>
              <p className="text-sm text-slate-400">
                Showing {filteredTasks.length} of {tasks.length} task
                {tasks.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="self-start rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white lg:self-auto"
          >
            <X size={22} />
          </button>
        </div>

        <div className="border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="relative xl:col-span-2">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={searchTerm}
                onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
                placeholder="Search task, project, employee..."
                className={`${inputClass} pl-11`}
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => handleFilterChange(setPriorityFilter, e.target.value)}
              className={`${smallInputClass} appearance-none`}
            >
              <option className="bg-slate-900" value="all">All Priority</option>
              <option className="bg-slate-900" value="urgent">Urgent</option>
              <option className="bg-slate-900" value="high">High</option>
              <option className="bg-slate-900" value="medium">Medium</option>
              <option className="bg-slate-900" value="low">Low</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
              className={`${smallInputClass} appearance-none`}
            >
              <option className="bg-slate-900" value="all">All Status</option>
              <option className="bg-slate-900" value="pending">Pending</option>
              <option className="bg-slate-900" value="in_progress">In Progress</option>
              <option className="bg-slate-900" value="hold">Hold</option>
              <option className="bg-slate-900" value="completed">Completed</option>
              <option className="bg-slate-900" value="cancelled">Cancelled</option>
              <option className="bg-slate-900" value="reopened">Reopened</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => handleFilterChange(setDepartmentFilter, e.target.value)}
              className={`${smallInputClass} appearance-none`}
            >
              <option className="bg-slate-900" value="all">All Department</option>
              {departmentOptions.map((dept) => (
                <option className="bg-slate-900" key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <button
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <select
              value={projectFilter}
              onChange={(e) => handleFilterChange(setProjectFilter, e.target.value)}
              className={`${smallInputClass} appearance-none`}
            >
              <option className="bg-slate-900" value="all">All Projects</option>
              {projectOptions.map((project) => (
                <option className="bg-slate-900" key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => handleFilterChange(setSortBy, e.target.value)}
              className={`${smallInputClass} appearance-none`}
            >
              <option className="bg-slate-900" value="dueDate">Sort: Due Date</option>
              <option className="bg-slate-900" value="priority">Sort: Priority</option>
              <option className="bg-slate-900" value="status">Sort: Status</option>
              <option className="bg-slate-900" value="createdAt">Sort: Latest Created</option>
            </select>

            <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-400">
              <Filter size={14} />
              Professional filters active for large task lists
            </div>
          </div>
        </div>

        <div className="max-h-[58vh] overflow-y-auto p-6">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/40 py-16 text-center">
              <CheckCircle className="mb-3 text-emerald-400" size={48} />
              <h3 className="text-lg font-semibold text-slate-100">
                No tasks found
              </h3>
              <p className="text-sm text-slate-400">
                Try changing filters or search text.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/40">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-900 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-4">Task</th>
                    <th className="px-4 py-4">Project</th>
                    <th className="px-4 py-4">Department</th>
                    <th className="px-4 py-4">Assigned By</th>
                    <th className="px-4 py-4">Priority</th>
                    <th className="px-4 py-4">Due Date</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {paginatedTasks.map((task) => {
                    const overdue = isOverdueTask(task);

                    return (
                      <tr
                        key={task._id}
                        className="text-slate-300 transition hover:bg-slate-900/70"
                      >
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-100">
                            {task.title}
                          </div>
                          <div className="line-clamp-1 text-xs text-slate-500">
                            {task.description || "No description"}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Building2 size={16} className="text-indigo-400" />
                            {getProjectName(task)}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <BriefcaseBusiness size={16} className="text-blue-400" />
                            {task.department || "Other"}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-slate-400" />
                            {getAssignedByName(task)}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getPriorityClass(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div
                            className={`flex items-center gap-2 ${
                              overdue ? "text-red-400" : "text-slate-300"
                            }`}
                          >
                            {overdue ? <AlertTriangle size={16} /> : <CalendarDays size={16} />}
                            {formatDate(task.dueDate)}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
                              task.status
                            )}`}
                          >
                            {task.status?.replace("_", " ")}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openTaskDetails(task)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                            >
                              <Eye size={15} />
                              View / Update
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

        <div className="flex flex-col gap-3 border-t border-slate-800 bg-slate-950 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500">
            Page {currentPage} of {totalPages} • {filteredTasks.length} filtered tasks
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={`${smallInputClass} appearance-none`}
            >
              <option className="bg-slate-900" value={5}>5 / page</option>
              <option className="bg-slate-900" value={10}>10 / page</option>
              <option className="bg-slate-900" value={20}>20 / page</option>
              <option className="bg-slate-900" value={50}>50 / page</option>
            </select>

            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              Prev
            </button>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {selectedTask && (
          <div className="fixed inset-0 z-[60] flex items-center justify-end bg-black/60 backdrop-blur-sm">
            <div className="h-full w-full max-w-2xl overflow-y-auto border-l border-slate-800 bg-slate-950 shadow-[0_0_45px_rgba(15,23,42,0.95)]">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-5 backdrop-blur">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    Task Details
                  </h3>
                  <p className="text-sm text-slate-400">
                    View work and update progress
                  </p>
                </div>

                <button
                  onClick={() => setSelectedTask(null)}
                  className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5 p-6">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
                  <h4 className="text-xl font-semibold text-slate-100">
                    {selectedTask.title}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {selectedTask.description || "No description added."}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoBox label="Project" value={getProjectName(selectedTask)} />
                  <InfoBox label="Department" value={selectedTask.department || "Other"} />
                  <InfoBox label="Assigned By" value={getAssignedByName(selectedTask)} />
                  <InfoBox label="Priority" value={selectedTask.priority} />
                  <InfoBox label="Due Date" value={formatDate(selectedTask.dueDate)} />
                  <InfoBox label="Estimated Hours" value={selectedTask.estimatedHours || "0"} />
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <Clock size={17} className="text-blue-400" />
                    Update Progress
                  </div>

                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Status
                  </label>

                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={`${inputClass} appearance-none`}
                  >
                    <option className="bg-slate-900" value="pending">Pending</option>
                    <option className="bg-slate-900" value="in_progress">In Progress</option>
                    <option className="bg-slate-900" value="hold">Hold</option>
                    <option className="bg-slate-900" value="completed">Completed</option>
                    <option className="bg-slate-900" value="cancelled">Cancelled</option>
                    <option className="bg-slate-900" value="reopened">Reopened</option>
                  </select>

                  <label className="mb-2 mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Work Remarks
                  </label>

                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows="4"
                    placeholder="Example: Work started, invoice matching pending..."
                    className={inputClass}
                  />

                  <div className="mt-5 flex justify-end">
                    <button
                      onClick={handleStatusUpdate}
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:scale-[1.02] hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? "Updating..." : "Update Task"}
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
                  <h4 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Progress History
                  </h4>

                  {selectedTask.progressUpdates?.length > 0 ? (
                    <div className="space-y-3">
                      {selectedTask.progressUpdates
                        .slice()
                        .reverse()
                        .map((update, index) => (
                          <div
                            key={index}
                            className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
                                  update.status
                                )}`}
                              >
                                {update.status?.replace("_", " ")}
                              </span>

                              <span className="text-xs text-slate-500">
                                {formatDate(update.createdAt)}
                              </span>
                            </div>

                            <p className="mt-3 text-sm leading-6 text-slate-300">
                              {update.remarks || "No remarks"}
                            </p>

                            <p className="mt-2 text-xs text-slate-500">
                              Updated By:{" "}
                              {update.updatedBy?.fullName ||
                                update.updatedBy?.name ||
                                "User"}
                            </p>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No progress update yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 capitalize text-slate-200">{value || "-"}</p>
    </div>
  );
}