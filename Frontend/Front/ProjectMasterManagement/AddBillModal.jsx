import React, { useEffect, useState } from "react";

export default function AddBillModal({
  isOpen,
  onClose,
  bill,
  projectId,
  refreshBills,
  mode,
  refreshProject,
}) {
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const [formData, setFormData] = useState({
    billType: "RA",
    billTypeCount: 1,
    billNumber: "",
    billAmount: "",
    billDate: "",
    billFile: null,
  });

  useEffect(() => {
    if (bill) {
      setFormData({
        billType: bill.billType || "RA",
        billTypeCount: bill.billTypeCount || 1,
        billNumber: bill.billNumber || "",
        billAmount: bill.billAmount || "",
        billDate: bill.billDate || "",
        billFile: null,
      });
    } else {
      setFormData({
        billType: "RA",
        billTypeCount: 1,
        billNumber: "",
        billAmount: "",
        billDate: "",
        billFile: null,
      });
    }
  }, [bill, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async () => {
    try {
      if (isView) {
        onClose();
        return;
      }

      const form = new FormData();

      form.append("projectId", projectId);
      form.append("billType", formData.billType);
      form.append("billNumber", formData.billNumber);
      form.append("billTypeCount", formData.billTypeCount);
      form.append("billAmount", formData.billAmount);
      form.append("billDate", formData.billDate);

      if (formData.billFile) {
        form.append("billFile", formData.billFile);
      }

      const url = isEdit
        ? `http://localhost:5000/project-master/update/bill/${bill._id}`
        : `http://localhost:5000/project-master/add/bill/${projectId}`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        body: form,
      });

      const result = await res.json();
      alert(result.message);

      if (res.ok) {
        refreshBills();
        refreshProject();
        onClose();
      }
    } catch (err) {
      console.log(err);
      alert("Error saving bill");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">
          {isView ? "View Bill" : isEdit ? "Edit Bill" : "Add Bill"}
        </h2>

        <div className="grid gap-3">
          <select
            name="billType"
            value={formData.billType}
            disabled={isView}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="RA">RA</option>
            <option value="Final">Final</option>
            <option value="Credit">Credit</option>
          </select>

          <input
            type="text"
            name="billTypeCount"
            placeholder="Bill Type Count (1,2..)"
            value={formData.billTypeCount}
            disabled={isView}
            onChange={handleChange}
            className="border p-2 rounded"
          />

          <input
            name="billNumber"
            placeholder="Bill Number like SEPL247823"
            value={formData.billNumber}
            disabled={isView}
            onChange={handleChange}
            className="border p-2 rounded"
          />

          <input
            type="number"
            name="billAmount"
            placeholder="Amount"
            value={formData.billAmount}
            disabled={isView}
            onChange={handleChange}
            className="border p-2 rounded"
          />

          <input
            type="date"
            name="billDate"
            value={formData.billDate}
            disabled={isView}
            onChange={handleChange}
            className="border p-2 rounded"
          />

          {!isView && (
            <input
              type="file"
              name="billFile"
              onChange={handleChange}
              className="border p-2 rounded"
            />
          )}

          {bill?.billFile && (
            <a
              href={bill.billFile}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              View Existing Bill File
            </a>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {isView ? "Close" : isEdit ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}