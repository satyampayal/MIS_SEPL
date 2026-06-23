import React from "react";

export default function CreateBOQModal({
  form,
  setForm,
  projects,
  contractors,
  saving,
  onClose,
  onSave,
}) {
  const update = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "boqType" && value !== "CONTRACTOR"
        ? { contractorRef: "" }
        : {}),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase text-cyan-300">
              BOQ Master
            </p>
            <h2 className="text-xl font-bold">Create BOQ</h2>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
          <FieldSelect
            label="Project *"
            name="projectRef"
            value={form.projectRef}
            onChange={update}
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.projectName || p.name}
              </option>
            ))}
          </FieldSelect>

          <FieldInput
            label="BOQ Name *"
            name="boqName"
            value={form.boqName}
            onChange={update}
            placeholder="Project Main BOQ / Contractor BOQ"
          />

          <FieldSelect
            label="BOQ Type"
            name="boqType"
            value={form.boqType}
            onChange={update}
          >
            <option value="CLIENT">CLIENT</option>
            <option value="CONTRACTOR">CONTRACTOR</option>
            <option value="REVISED">REVISED</option>
            <option value="EXTRA_WORK">EXTRA WORK</option>
          </FieldSelect>

          {form.boqType === "CONTRACTOR" && (
            <FieldSelect
              label="Contractor *"
              name="contractorRef"
              value={form.contractorRef}
              onChange={update}
            >
              <option value="">Select Contractor</option>
              {contractors.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.contractorName}
                </option>
              ))}
            </FieldSelect>
          )}

          <FieldInput
            label="Revision No"
            name="revisionNo"
            type="number"
            value={form.revisionNo}
            onChange={update}
          />

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-slate-300">
              Remarks
            </label>
            <textarea
              name="remarks"
              value={form.remarks}
              onChange={update}
              rows={2}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-5 py-3 text-slate-300"
          >
            Cancel
          </button>

          <button
            onClick={onSave}
            disabled={saving}
            className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Create BOQ"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldInput({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-300">{label}</label>
      <input
        name={name}
        value={value}
        type={type}
        placeholder={placeholder}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
      />
    </div>
  );
}

function FieldSelect({ label, name, value, onChange, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-300">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
      >
        {children}
      </select>
    </div>
  );
}