// AddTaskModal.jsx
import React, { useState } from "react";
import { X, ClipboardList, CalendarDays, UserRound, Building2 } from "lucide-react";
import toast from "react-hot-toast";
import { useTasks } from "../../Context/TaskContext";

export default function AddTaskModal({
  isOpen,
  onClose,
  mode ,
  users,
  projects
}) {
    console.log(users)
    console.log(projects)
  const { createPersonalTask, assignTask, loading } = useTasks();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    project: "",
    department: "Other",
    priority: "medium",
    dueDate: "",
    estimatedHours: "",
    reminderDate: ""
  });

  if (!isOpen) return null;

  const isAssignMode = mode === "assign";

  const inputClass =
    "w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  const labelClass =
    "mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400";

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      assignedTo: "",
      project: "",
      department: "Other",
      priority: "medium",
      dueDate: "",
      estimatedHours: "",
      reminderDate: ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    if (!formData.dueDate) {
      toast.error("Due date is required");
      return;
    }

    if (isAssignMode && !formData.assignedTo) {
      toast.error("Please select employee");
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      project: formData.project || null,
      department: formData.department,
      priority: formData.priority,
      dueDate: formData.dueDate,
      estimatedHours: Number(formData.estimatedHours) || 0,
      reminderDate: formData.reminderDate || null
    };

    const result = isAssignMode
      ? await assignTask({ ...payload, assignedTo: formData.assignedTo })
      : await createPersonalTask(payload);

    if (result?.success) {
      resetForm();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-[0_0_45px_rgba(15,23,42,0.95)]">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/70 px-6 py-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-blue-400">
              <ClipboardList size={22} />
            </div>

            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-100">
                {isAssignMode ? "Assign New Task" : "Add Personal Task"}
              </h2>
              <p className="text-sm text-slate-400">
                Create work with project, department, priority and deadline.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-h-[75vh] space-y-5 overflow-y-auto p-6"
        >
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
            <label className={labelClass}>Task Title *</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Example: Submit tax invoice report"
              className={inputClass}
            />

            <div className="mt-4">
              <label className={labelClass}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Write task details..."
                className={inputClass}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <UserRound size={17} className="text-blue-400" />
              Work Ownership
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {isAssignMode && (
                <div>
                  <label className={labelClass}>Assign To *</label>
                  <select
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleChange}
                    className={`${inputClass} appearance-none`}
                  >
                    <option className="bg-slate-900" value="">
                      Select employee
                    </option>
                    {users.map((user) => (
                      <option
                        className="bg-slate-900"
                        key={user._id}
                        value={user._id}
                      >
                        {user.fullName || user.name} - {user.role}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={labelClass}>Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={`${inputClass} appearance-none`}
                >
                  {["Store", "Accounts", "Project", "Billing", "HR", "Admin", "Other"].map(
                    (dept) => (
                      <option className="bg-slate-900" key={dept} value={dept}>
                        {dept}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className={labelClass}>Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className={`${inputClass} appearance-none`}
                >
                  <option className="bg-slate-900" value="low">Low</option>
                  <option className="bg-slate-900" value="medium">Medium</option>
                  <option className="bg-slate-900" value="high">High</option>
                  <option className="bg-slate-900" value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Estimated Hours</label>
                <input
                  type="number"
                  name="estimatedHours"
                  value={formData.estimatedHours}
                  onChange={handleChange}
                  placeholder="Example: 4"
                  min="0"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Building2 size={17} className="text-indigo-400" />
              Project & Timeline
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Project / Site</label>
                <select
                  name="project"
                  value={formData.project}
                  onChange={handleChange}
                  className={`${inputClass} appearance-none`}
                >
                  <option className="bg-slate-900" value="">
                    No project selected
                  </option>
                  {projects.map((project) => (
                    <option
                      className="bg-slate-900"
                      key={project._id}
                      value={project._id}
                    >
                      {project.projectName || project.siteName || project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Due Date *</label>
                <div className="relative">
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className={`${inputClass} pr-11`}
                  />
                  <CalendarDays
                    size={17}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Reminder Date</label>
                <div className="relative">
                  <input
                    type="date"
                    name="reminderDate"
                    value={formData.reminderDate}
                    onChange={handleChange}
                    className={`${inputClass} pr-11`}
                  />
                  <CalendarDays
                    size={17}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:scale-[1.02] hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving..." : isAssignMode ? "Assign Task" : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}