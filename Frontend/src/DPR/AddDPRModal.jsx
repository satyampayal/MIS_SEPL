import React, { useState, useEffect } from "react";
import { X, UploadCloud } from "lucide-react";
import { projectSiteList } from '../Constant'
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
    projectId: "",
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
  const [projectBOQs, setProjectBOQs] = useState([]);
  const [selectedBOQ, setSelectedBOQ] = useState("");
  const [boqItems, setBoqItems] = useState([]);
  const [workItems, setWorkItems] = useState([]);
  const [projects, setProjects] = useState([]);

    const fetchProjects = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/project-master/all`
      );

      const data = await res.json();

      setProjects(
        data.data ||
        data.projects ||
        []
      );
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    fetchProjects();
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

      if (name === "projectName") {
        fetchProjectBOQs(value);
      }
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
      form.append(
        "workItems",
        JSON.stringify(workItems)
      );
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

  // Fetch Boq Whe i selcted Project
  const fetchProjectBOQs = async (projectName) => {
    try {
      const res = await fetch(
        `${BASE_URL}/boq/project/${projectName}`
      );

      const data = await res.json();

      if (data.success) {
        setProjectBOQs(data.boqs || []);
      }
    } catch (error) {
      console.log(error);
    }
  };
  //Boq -> Boq Items
  const fetchBOQItems = async (boqId) => {
    try {
      const res = await fetch(
        `${BASE_URL}/boq/items/${boqId}`
      );

      const data = await res.json();

      if (data.success) {
        setBoqItems(data.items || []);
      }
    } catch (error) {
      console.log(error);
    }
  };


  const addWorkItem = () => {
    setWorkItems((prev) => [
      ...prev,
      {
        boqItemRef: "",
        boqItemCode: "",
        generalName: "",
        uom: "",
        rate: "",
        todayQty: "",
        amount: 0
      }
    ]);
  };

  const updateWorkItem = (index, field, value) => {
    const updated = [...workItems];

    updated[index][field] = value;

    if (field === "todayQty") {
      const qty = Number(value) || 0;
      const rate = Number(updated[index].rate) || 0;

      updated[index].amount = qty * rate;
    }

    setWorkItems(updated);
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
            name="projectId"
            value={formData.projectId}
            onChange={(e) => {
              handleChange(e);

              fetchProjectBOQs(e.target.value);
            }}
            disabled={isView}
            className="w-full mt-1 border rounded-xl px-3 py-2"
          >
            <option value="">Select Project</option>

            {projects.map((project) => (
              <option
                key={project._id}
                value={project._id}
              >
                {project.name} -{project.code}
              </option>
            ))}
          </select>
          {/* Here we scholud be plat the boq */}
          {/* Select BOQ */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">
              Select BOQ
            </label>
            <select
              value={selectedBOQ}
              onChange={(e) => {
                setSelectedBOQ(e.target.value);
                fetchBOQItems(e.target.value);
              }}
              className="w-full mt-1 border rounded-xl px-3 py-2"
            >
              <option value="">Select BOQ</option>

              {projectBOQs.map((boq) => (
                <option key={boq._id} value={boq._id}>
                  {boq.boqName}
                </option>
              ))}
            </select>
          </div>
          {/* BoqItems */}
          <div className="md:col-span-2 border rounded-2xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">
                Work Items
              </h3>

              <button
                type="button"
                onClick={addWorkItem}
                className="bg-blue-600 text-white px-3 py-2 rounded-xl"
              >
                Add Item
              </button>
            </div>

            {workItems.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3"
              >
                <select
                  onChange={(e) => {
                    const selected = boqItems.find(
                      (b) => b._id === e.target.value
                    );

                    if (!selected) return;

                    const updated = [...workItems];

                    updated[index] = {
                      ...updated[index],
                      boqItemRef: selected._id,
                      boqItemCode: selected.boqItemCode,
                      generalName: selected.generalName,
                      uom: selected.uom,
                      rate:
                        selected.contractorInstallationRate || 0
                    };

                    setWorkItems(updated);
                  }}
                  className="border rounded-xl px-3 py-2"
                >
                  <option>Select Item</option>

                  {boqItems.map((boqItem) => (
                    <option
                      key={boqItem._id}
                      value={boqItem._id}
                    >
                      {/* {boqItem.generalName} */}
                      {boqItem.description}
                    </option>
                  ))}
                </select>

                <input
                  value={item.boqItemCode}
                  readOnly
                  placeholder="Item Code"
                  className="border rounded-xl px-3 py-2 bg-gray-100"
                />

                <input
                  value={item.rate}
                  readOnly
                  placeholder="Rate"
                  className="border rounded-xl px-3 py-2 bg-gray-100"
                />

                <input
                  type="number"
                  placeholder="Today Qty"
                  value={item.todayQty}
                  onChange={(e) =>
                    updateWorkItem(
                      index,
                      "todayQty",
                      e.target.value
                    )
                  }
                  className="border rounded-xl px-3 py-2"
                />

                <input
                  value={item.amount}
                  readOnly
                  placeholder="Amount"
                  className="border rounded-xl px-3 py-2 bg-gray-100"
                />
              </div>
            ))}
          </div>



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