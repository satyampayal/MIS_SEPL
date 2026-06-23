import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import BASE_URL from "../../../config/api";

const CONTRACTOR_API = `${BASE_URL}/contractor`;

const emptyForm = {
  contractorName: "",
  contractorCode: "",
  contactPerson: "",
  mobile: "",
  email: "",
  gstNumber: "",
  panNumber: "",
  address: "",
  workTypesText: "",
  status: "ACTIVE",
  remarks: "",
};

export default function ContractorPage() {
  const [contractors, setContractors] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(false);

  const [modal, setModal] = useState(false);
  const [mode, setMode] = useState("add");
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchContractors = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (status !== "All") params.status = status;

      const res = await axios.get(`${CONTRACTOR_API}/all`, { params });
      setContractors(res.data.contractors || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load contractors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractors();
  }, [status]);

  const stats = useMemo(() => {
    return {
      total: contractors.length,
      active: contractors.filter((c) => c.status === "ACTIVE").length,
      inactive: contractors.filter((c) => c.status === "INACTIVE").length,
      blacklisted: contractors.filter((c) => c.status === "BLACKLISTED").length,
    };
  }, [contractors]);

  const openAdd = () => {
    setMode("add");
    setSelectedId(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (c) => {
    setMode("edit");
    setSelectedId(c._id);
    setForm({
      contractorName: c.contractorName || "",
      contractorCode: c.contractorCode || "",
      contactPerson: c.contactPerson || "",
      mobile: c.mobile || "",
      email: c.email || "",
      gstNumber: c.gstNumber || "",
      panNumber: c.panNumber || "",
      address: c.address || "",
      workTypesText: Array.isArray(c.workTypes) ? c.workTypes.join(", ") : "",
      status: c.status || "ACTIVE",
      remarks: c.remarks || "",
    });
    setModal(true);
  };

  const saveContractor = async () => {
    try {
      if (!form.contractorName.trim()) {
        return toast.error("Contractor name is required");
      }

      setSaving(true);

      const payload = {
        contractorName: form.contractorName,
        contractorCode: form.contractorCode,
        contactPerson: form.contactPerson,
        mobile: form.mobile,
        email: form.email,
        gstNumber: form.gstNumber,
        panNumber: form.panNumber,
        address: form.address,
        status: form.status,
        remarks: form.remarks,
        workTypes: form.workTypesText
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      };

      if (mode === "add") {
        await axios.post(`${CONTRACTOR_API}/create`, payload);
        toast.success("Contractor created");
      } else {
        await axios.put(`${CONTRACTOR_API}/update/${selectedId}`, payload);
        toast.success("Contractor updated");
      }

      setModal(false);
      setForm(emptyForm);
      fetchContractors();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save contractor");
    } finally {
      setSaving(false);
    }
  };

  const inactiveContractor = async (id) => {
    if (!window.confirm("Mark this contractor inactive?")) return;

    try {
      await axios.delete(`${CONTRACTOR_API}/delete/${id}`);
      toast.success("Contractor marked inactive");
      fetchContractors();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update contractor");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-300">Contractor Control</p>
          <h1 className="text-2xl font-bold">Contractors</h1>
          <p className="text-sm text-slate-400">
            Manage contractor master for BOQ, MB and future DPR billing.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950"
        >
          Add Contractor
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="Total" value={stats.total} />
        <StatCard title="Active" value={stats.active} />
        <StatCard title="Inactive" value={stats.inactive} />
        <StatCard title="Blacklisted" value={stats.blacklisted} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contractor, mobile, GST..."
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
        >
          <option>All</option>
          <option>ACTIVE</option>
          <option>INACTIVE</option>
          <option>BLACKLISTED</option>
        </select>

        <button
          onClick={fetchContractors}
          className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold text-slate-300 hover:bg-slate-800"
        >
          Search / Refresh
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-slate-950 text-slate-400">
            <tr>
              <th className="p-4 text-left">Contractor</th>
              <th className="p-4 text-left">Contact</th>
              <th className="p-4 text-left">GST / PAN</th>
              <th className="p-4 text-left">Work Types</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">
                  Loading contractors...
                </td>
              </tr>
            ) : contractors.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">
                  No contractors found
                </td>
              </tr>
            ) : (
              contractors.map((c) => (
                <tr key={c._id} className="border-t border-slate-800">
                  <td className="p-4">
                    <div className="font-semibold">{c.contractorName}</div>
                    <div className="text-xs text-cyan-300">{c.contractorCode || "-"}</div>
                    <div className="text-xs text-slate-500">{c.address || ""}</div>
                  </td>

                  <td className="p-4">
                    <div>{c.contactPerson || "-"}</div>
                    <div className="text-xs text-slate-400">{c.mobile || "-"}</div>
                    <div className="text-xs text-slate-400">{c.email || "-"}</div>
                  </td>

                  <td className="p-4 text-slate-300">
                    <div>GST: {c.gstNumber || "-"}</div>
                    <div className="text-xs text-slate-400">PAN: {c.panNumber || "-"}</div>
                  </td>

                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {(c.workTypes || []).length === 0 ? (
                        <span className="text-slate-500">-</span>
                      ) : (
                        c.workTypes.map((w) => (
                          <span
                            key={w}
                            className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300"
                          >
                            {w}
                          </span>
                        ))
                      )}
                    </div>
                  </td>

                  <td className="p-4">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(c.status)}`}>
                      {c.status}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => inactiveContractor(c._id)}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Inactive
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <ContractorModal
          form={form}
          setForm={setForm}
          mode={mode}
          saving={saving}
          onClose={() => setModal(false)}
          onSave={saveContractor}
        />
      )}
    </div>
  );
}

function ContractorModal({ form, setForm, mode, saving, onClose, onSave }) {
  const update = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h2 className="text-xl font-bold">
            {mode === "add" ? "Add Contractor" : "Edit Contractor"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
          <FieldInput label="Contractor Name *" name="contractorName" value={form.contractorName} onChange={update} />
          <FieldInput label="Contractor Code" name="contractorCode" value={form.contractorCode} onChange={update} />
          <FieldInput label="Contact Person" name="contactPerson" value={form.contactPerson} onChange={update} />
          <FieldInput label="Mobile" name="mobile" value={form.mobile} onChange={update} />
          <FieldInput label="Email" name="email" value={form.email} onChange={update} />
          <FieldInput label="GST Number" name="gstNumber" value={form.gstNumber} onChange={update} />
          <FieldInput label="PAN Number" name="panNumber" value={form.panNumber} onChange={update} />
          <FieldInput label="Work Types" name="workTypesText" value={form.workTypesText} onChange={update} placeholder="Cable Tray, Erection, Earthing" />

          <div>
            <label className="mb-2 block text-sm text-slate-300">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={update}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
            >
              <option>ACTIVE</option>
              <option>INACTIVE</option>
              <option>BLACKLISTED</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <FieldInput label="Address" name="address" value={form.address} onChange={update} />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-slate-300">Remarks</label>
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
          <button onClick={onClose} className="rounded-xl border border-slate-700 px-5 py-3 text-slate-300">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Contractor"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldInput({ label, name, value, onChange, placeholder = "" }) {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-300">{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
      />
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs text-slate-400">{title}</p>
      <h2 className="mt-2 text-lg font-bold text-cyan-300">{value}</h2>
    </div>
  );
}

function statusClass(status) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "INACTIVE":
      return "border-slate-500/30 bg-slate-500/10 text-slate-300";
    case "BLACKLISTED":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    default:
      return "border-slate-500/30 bg-slate-500/10 text-slate-300";
  }
}