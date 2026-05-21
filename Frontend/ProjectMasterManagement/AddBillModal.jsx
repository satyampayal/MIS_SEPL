import React, { useEffect, useState } from "react";
import BASE_URL from "../config/api";
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
    receivedAmount: "",
    billDate: "",
    billFile: null,
    billDescription: "",
    billGroup: "",
    billStatus: "Submitted",
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
        billDescription: bill.billDescription || "",
        billGroup: bill.billGroup || "",
        receivedAmount: bill.receivedAmount || "",
        billStatus: bill.billStatus || "Submitted",
      });
    } else {
      setFormData({
        billType: "RA",
        billTypeCount: 1,
        billNumber: "",
        billAmount: "",
        billDate: "",
        billFile: null,
        billDescription: "",
        billGroup: "",
        receivedAmount: "",
        billStatus: "Submitted",
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
      form.append("receivedAmount", formData.receivedAmount);
      form.append("billStatus", formData.billStatus);
      form.append("billDate", formData.billDate);
      form.append("billDescription", formData.billDescription);
      form.append("billGroup", formData.billGroup);

      if (formData.billFile) {
        form.append("billFile", formData.billFile);
      }

      const url = isEdit
        ? `${BASE_URL}/project-master/update/bill/${bill._id}`
        : `${BASE_URL}/project-master/add/bill/${projectId}`;

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-gray-200 max-h-[95vh] overflow-y-auto">

        <div className="sticky top-0 bg-white z-10 border-b px-6 py-5 rounded-t-3xl">
          <h2 className="text-2xl font-bold text-gray-900">
            {isView ? "View Bill" : isEdit ? "Edit Bill" : "Add New Bill"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage project billing, payment received and bill copy details
          </p>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Bill Type</label>
              <select
                name="billType"
                value={formData.billType}
                disabled={isView}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
              >
                <option value="RA">RA Bill</option>
                <option value="Final">Final Bill</option>
                <option value="Advance">Advance</option>
                <option value="Credit Note">Credit Note</option>
                <option value="Debit Note">Debit Note</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Bill Count</label>
              <input
                type="number"
                name="billTypeCount"
                placeholder="1, 2, 3..."
                value={formData.billTypeCount}
                disabled={isView}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Bill Number</label>
              <input
                name="billNumber"
                placeholder="Example: SEPL247823"
                value={formData.billNumber}
                disabled={isView}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Bill Date</label>
              <input
                type="date"
                name="billDate"
                value={formData.billDate}
                disabled={isView}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Bill Amount</label>
              <input
                type="number"
                name="billAmount"
                placeholder="Enter bill amount"
                value={formData.billAmount}
                disabled={isView}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Received Amount</label>
              <input
                type="number"
                name="receivedAmount"
                placeholder="Enter received amount"
                value={formData.receivedAmount}
                disabled={isView}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 my-6">
            <div className="rounded-2xl border bg-blue-50 p-5">
              <p className="text-sm text-gray-500">Bill Amount</p>
              <h3 className="text-2xl font-bold text-blue-700 mt-1">
                ₹ {Number(formData.billAmount || 0).toLocaleString("en-IN")}
              </h3>
            </div>

            <div className="rounded-2xl border bg-green-50 p-5">
              <p className="text-sm text-gray-500">Received</p>
              <h3 className="text-2xl font-bold text-green-700 mt-1">
                ₹ {Number(formData.receivedAmount || 0).toLocaleString("en-IN")}
              </h3>
            </div>

            <div className="rounded-2xl border bg-red-50 p-5">
              <p className="text-sm text-gray-500">Pending</p>
              <h3 className="text-2xl font-bold text-red-700 mt-1">
                ₹ {Math.max(
                  Number(formData.billAmount || 0) -
                  Number(formData.receivedAmount || 0),
                  0
                ).toLocaleString("en-IN")}
              </h3>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Type of Work</label>
              <select
                name="billGroup"
                value={formData.billGroup}
                disabled={isView}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
              >
                <option value="">Select Type Of Work</option>
                <option value="Erection">Erection</option>
                <option value="Supply">Supply</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Bill Status</label>
              <select
                name="billStatus"
                value={formData.billStatus}
                disabled={isView}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
              >
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-600">Bill Description</label>
              <textarea
                name="billDescription"
                placeholder="Write short bill description..."
                value={formData.billDescription}
                disabled={isView}
                onChange={handleChange}
                rows={3}
                className="mt-1 w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 resize-none"
              />
            </div>

            {!isView && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600">Upload Bill File</label>
                <input
                  type="file"
                  name="billFile"
                  onChange={handleChange}
                  className="mt-1 w-full border border-dashed border-gray-300 px-4 py-3 rounded-xl bg-gray-50"
                />
              </div>
            )}

            {bill?.billFile && (
              <div className="md:col-span-2 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <a
                  href={bill.billFile}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-700 font-medium underline"
                >
                  View Existing Bill File
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition font-medium"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition font-medium shadow"
          >
            {isView ? "Close" : isEdit ? "Update Bill" : "Save Bill"}
          </button>
        </div>
      </div>
    </div>
  );
}