import React, { useState, useEffect } from "react";
import { X, UploadCloud } from "lucide-react";
import {projectSiteList} from  '../Constant'
import BASE_URL from "../../config/api";

export default function AddDPRModal({
  isOpen,
  onClose,
  mode,
  report,
  refreshReports
}) {
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isAdd = mode === "add";

  const [formData, setFormData] = useState({
    projectName: "",
    reportDate: "",
    workDoneToday: "",
    manpowerCount: "",
    materialReceived: "",
    materialUsed: "",
    issuesFaced: "",
    tomorrowPlan: "",
    siteInchargeName: "",
    remarks: "",
    photos: []
  });

  useEffect(() => {
    if (report) {
      setFormData({
        projectName: report.projectName || "",
        reportDate: report.reportDate
          ? report.reportDate.substring(0, 10)
          : "",
        workDoneToday: report.workDoneToday || "",
        manpowerCount: report.manpowerCount || "",
        materialReceived: report.materialReceived || "",
        materialUsed: report.materialUsed || "",
        issuesFaced: report.issuesFaced || "",
        tomorrowPlan: report.tomorrowPlan || "",
        siteInchargeName: report.siteInchargeName || "",
        remarks: report.remarks || "",
        photos: []
      });
    } else {
      setFormData({
        projectName: "",
        reportDate: "",
        workDoneToday: "",
        manpowerCount: "",
        materialReceived: "",
        materialUsed: "",
        issuesFaced: "",
        tomorrowPlan: "",
        siteInchargeName: "",
        remarks: "",
        photos: []
      });
    }
  }, [report, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      setFormData((prev) => ({
        ...prev,
        photos: Array.from(files)
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async () => {
    if (isView) return;

    try {
      const form = new FormData();

      Object.keys(formData).forEach((key) => {
        if (key === "photos") {
          formData.photos.forEach((file) => {
            form.append("photos", file);
          });
        } else {
          form.append(key, formData[key]);
        }
      });

      const url = isEdit
        ? `${BASE_URL}/dpr/update/${report._id}`
        : `${BASE_URL}/dpr/create`;

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: form
      });

      const data = await res.json();

      if (data.success) {
        alert(isEdit ? "DPR updated successfully" : "DPR added successfully");
        refreshReports();
        onClose();
      } else {
        alert(data.message || "Something went wrong");
      }
    } catch (error) {
      console.log("DPR submit error:", error);
      alert("Server error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {isAdd && "Add Daily Progress Report"}
            {isEdit && "Edit Daily Progress Report"}
            {isView && "View Daily Progress Report"}
          </h2>

          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X size={22} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        
            <select
             label="Project / Site Name"
              name="projectName"
              value={formData.projectName}  
              onChange={handleChange}
              disabled={isView}
              className="w-full mt-1 border rounded-xl px-3 py-2 outline-none disabled:bg-gray-100" 
            >
              <option value="">Select Project</option>
              {projectSiteList.map((project) => ( 
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>

          

          <Input
            label="Report Date"
            name="reportDate"
            type="date"
            value={formData.reportDate}
            onChange={handleChange}
            disabled={isView}
          />

          <Textarea
            label="Work Done Today"
            name="workDoneToday"
            value={formData.workDoneToday}
            onChange={handleChange}
            disabled={isView}
          />

          <Input
            label="Manpower Count"
            name="manpowerCount"
            type="number"
            value={formData.manpowerCount}
            onChange={handleChange}
            disabled={isView}
          />

          <Textarea
            label="Material Received"
            name="materialReceived"
            value={formData.materialReceived}
            onChange={handleChange}
            disabled={isView}
          />

          <Textarea
            label="Material Used"
            name="materialUsed"
            value={formData.materialUsed}
            onChange={handleChange}
            disabled={isView}
          />

          <Textarea
            label="Issues / Delay Reason"
            name="issuesFaced"
            value={formData.issuesFaced}
            onChange={handleChange}
            disabled={isView}
          />

          <Textarea
            label="Tomorrow Plan"
            name="tomorrowPlan"
            value={formData.tomorrowPlan}
            onChange={handleChange}
            disabled={isView}
          />

          <Input
            label="Site Incharge Name"
            name="siteInchargeName"
            value={formData.siteInchargeName}
            onChange={handleChange}
            disabled={isView}
          />

          <Textarea
            label="Remarks"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            disabled={isView}
          />

          {!isView && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Upload Site Photos
              </label>

              <label className="mt-2 border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                <UploadCloud size={35} className="text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">
                  Click to upload site photos
                </p>

                <input
                  type="file"
                  name="photos"
                  multiple
                  accept="image/*"
                  onChange={handleChange}
                  className="hidden"
                />
              </label>

              {formData.photos.length > 0 && (
                <p className="text-sm text-green-600 mt-2">
                  {formData.photos.length} photo selected
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
          >
            Close
          </button>

          {!isView && (
            <button
              onClick={handleSubmit}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            >
              {isEdit ? "Update DPR" : "Save DPR"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Input({ label, name, value, onChange, type = "text", disabled }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full mt-1 border rounded-xl px-3 py-2 outline-none disabled:bg-gray-100"
      />
    </div>
  );
}

function Textarea({ label, name, value, onChange, disabled }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows="3"
        className="w-full mt-1 border rounded-xl px-3 py-2 outline-none disabled:bg-gray-100"
      />
    </div>
  );
}