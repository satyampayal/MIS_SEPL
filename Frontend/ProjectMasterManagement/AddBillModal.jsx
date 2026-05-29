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

  const loggedInUser = JSON.parse(localStorage.getItem("user")) || {};
  const userRole = loggedInUser?.role;

  const canManageProject = ["Super Admin", "Admin", "Manager"].includes(
    userRole
  );

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
        receivedAmount: bill.receivedAmount || "",
        billDate: bill.billDate || "",
        billFile: null,
        billDescription: bill.billDescription || "",
        billGroup: bill.billGroup || "",
        billStatus: bill.billStatus || "Submitted",
      });
    } else {
      setFormData({
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
    }
  }, [bill, isOpen]);

  if (!isOpen) return null;

  const readOnlyMode = isView || !canManageProject;

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async () => {
    try {
      if (readOnlyMode) {
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

      const token = localStorage.getItem("token");

      const url = isEdit
        ? `${BASE_URL}/project-master/update/bill/${bill._id}`
        : `${BASE_URL}/project-master/add/bill/${projectId}`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  const inputClass =
    "mt-1 w-full bg-slate-950 border border-slate-700 px-4 py-3 rounded-xl text-slate-100 outline-none focus:border-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 placeholder:text-slate-500";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative bg-slate-900 text-slate-100 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-700 max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 z-10 border-b border-slate-800 px-6 py-5 rounded-t-3xl">
          <h2 className="text-2xl font-bold text-white">
            {readOnlyMode
              ? "View Bill"
              : isEdit
              ? "Edit Bill"
              : "Add New Bill"}
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Manage project billing, payment received and bill copy details.
          </p>

          {!canManageProject && (
            <p className="text-xs text-amber-400 mt-2">
              You have view-only access for this bill.
            </p>
          )}
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Bill Type">
              <select
                name="billType"
                value={formData.billType}
                disabled={readOnlyMode}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="RA">RA Bill</option>
                <option value="Final">Final Bill</option>
                <option value="Advance">Advance</option>
                <option value="Credit Note">Credit Note</option>
                <option value="Debit Note">Debit Note</option>
              </select>
            </Field>

            <Field label="Bill Count">
              <input
                type="number"
                name="billTypeCount"
                placeholder="1, 2, 3..."
                value={formData.billTypeCount}
                disabled={readOnlyMode}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>

            <Field label="Bill Number">
              <input
                name="billNumber"
                placeholder="Example: SEPL247823"
                value={formData.billNumber}
                disabled={readOnlyMode}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>

            <Field label="Bill Date">
              <input
                type="date"
                name="billDate"
                value={formData.billDate}
                disabled={readOnlyMode}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>

            <Field label="Bill Amount">
              <input
                type="number"
                name="billAmount"
                placeholder="Enter bill amount"
                value={formData.billAmount}
                disabled={readOnlyMode}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>

            <Field label="Received Amount">
              <input
                type="number"
                name="receivedAmount"
                placeholder="Enter received amount"
                value={formData.receivedAmount}
                disabled={readOnlyMode}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid md:grid-cols-3 gap-4 my-6">
            <AmountCard
              title="Bill Amount"
              value={formData.billAmount}
              color="text-cyan-400"
            />

            <AmountCard
              title="Received"
              value={formData.receivedAmount}
              color="text-emerald-400"
            />

            <AmountCard
              title="Pending"
              value={Math.max(
                Number(formData.billAmount || 0) -
                  Number(formData.receivedAmount || 0),
                0
              )}
              color="text-red-400"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Type of Work">
              <select
                name="billGroup"
                value={formData.billGroup}
                disabled={readOnlyMode}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select Type Of Work</option>
                <option value="Erection">Erection</option>
                <option value="Supply">Supply</option>
              </select>
            </Field>

            <Field label="Bill Status">
              <select
                name="billStatus"
                value={formData.billStatus}
                disabled={readOnlyMode}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </Field>

            <div className="md:col-span-2">
              <Field label="Bill Description">
                <textarea
                  name="billDescription"
                  placeholder="Write short bill description..."
                  value={formData.billDescription}
                  disabled={readOnlyMode}
                  onChange={handleChange}
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </div>

            {!readOnlyMode && (
              <div className="md:col-span-2">
                <Field label="Upload Bill File">
                  <input
                    type="file"
                    name="billFile"
                    onChange={handleChange}
                    className="mt-1 w-full border border-dashed border-slate-700 px-4 py-3 rounded-xl bg-slate-950 text-slate-300"
                  />
                </Field>
              </div>
            )}

            {bill?.billFile && (
              <div className="md:col-span-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                <a
                  href={bill.billFile}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 font-medium underline"
                >
                  View Existing Bill File
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 px-6 py-4 flex justify-end gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition font-medium"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition font-bold shadow"
          >
            {readOnlyMode ? "Close" : isEdit ? "Update Bill" : "Save Bill"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-400">{label}</label>
      {children}
    </div>
  );
}

function AmountCard({ title, value, color }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <h3 className={`text-2xl font-bold mt-1 ${color}`}>
        ₹ {Number(value || 0).toLocaleString("en-IN")}
      </h3>
    </div>
  );
}