import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Eye,
  Trash2,
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  BadgeIndianRupee,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import BASE_URL from "../../config/api";

const emptyForm = {
  partyName: "",
  partyType: "Vendor",
  gstNumber: "",
  contactPerson: "",
  contactNumber: "",
  email: "",
  address: "",
  city: "",
  state: "",
};

export default function PartyListPage() {
  const [parties, setParties] = useState([]);
  const [search, setSearch] = useState("");
  const [partyType, setPartyType] = useState("");
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("add");
  const [selectedParty, setSelectedParty] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const isView = mode === "view";
  const isEdit = mode === "edit";

  const fetchParties = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (partyType) params.append("type", partyType);
      params.append("limit", "200");

      const res = await fetch(`${BASE_URL}/party/search?${params.toString()}`);
      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || "Failed to fetch parties");
        return;
      }

      setParties(data.data || []);
      setPage(1);
    } catch (error) {
      console.error(error);
      toast.error("Server error while fetching parties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(fetchParties, 400);
    return () => clearTimeout(delay);
  }, [search, partyType]);

  const totalPages = Math.ceil(parties.length / limit) || 1;

  const paginatedParties = useMemo(() => {
    const start = (page - 1) * limit;
    return parties.slice(start, start + limit);
  }, [parties, page, limit]);

  const startRecord = parties.length === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, parties.length);

  const openAddModal = () => {
    setMode("add");
    setSelectedParty(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const fillForm = (party) => ({
    partyName: party.partyName || "",
    partyType: party.partyType || "Vendor",
    gstNumber: party.gstNumber || "",
    contactPerson: party.contactPerson || "",
    contactNumber: party.contactNumber || "",
    email: party.email || "",
    address: party.address || "",
    city: party.city || "",
    state: party.state || "",
  });

  const openViewModal = (party) => {
    setMode("view");
    setSelectedParty(party);
    setFormData(fillForm(party));
    setIsModalOpen(true);
  };

  const openEditModal = (party) => {
    setMode("edit");
    setSelectedParty(party);
    setFormData(fillForm(party));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedParty(null);
    setFormData(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.partyName.trim()) {
        toast.error("Party name is required");
        return;
      }

      const url = isEdit
        ? `${BASE_URL}/party/update/${selectedParty._id}`
        : `${BASE_URL}/party/create`;

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || "Something went wrong");
        return;
      }

      toast.success(isEdit ? "Party updated successfully" : "Party created successfully");
      closeModal();
      fetchParties();
    } catch (error) {
      console.error(error);
      toast.error("Server error while saving party");
    }
  };

  const handleDelete = async (partyId) => {
    if (!window.confirm("Are you sure you want to disable this party?")) return;

    try {
      const res = await fetch(`${BASE_URL}/party/delete/${partyId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || "Failed to disable party");
        return;
      }

      toast.success("Party disabled successfully");
      fetchParties();
    } catch (error) {
      console.error(error);
      toast.error("Server error while deleting party");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5 shadow-xl shadow-slate-950/40 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                <Building2 size={14} />
                Party Control
              </div>

              <h1 className="mt-3 text-2xl font-bold text-white md:text-3xl">
                Party Master
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Manage vendors, suppliers, contractors, clients and companies.
              </p>
            </div>

            <button
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
            >
              <Plus size={18} />
              Add Party
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/30">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                placeholder="Search by party name, GST number, mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
              />
            </div>

            <select
              value={partyType}
              onChange={(e) => setPartyType(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
            >
              <option value="">All Types</option>
              <option value="Vendor">Vendor</option>
              <option value="Supplier">Supplier</option>
              <option value="Contractor">Contractor</option>
              <option value="Client">Client</option>
              <option value="Company">Company</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-400">
            Showing{" "}
            <span className="font-semibold text-white">{startRecord}</span> to{" "}
            <span className="font-semibold text-white">{endRecord}</span> of{" "}
            <span className="font-semibold text-white">{parties.length}</span>{" "}
            parties
          </p>

          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="w-fit rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
          >
            <option value={6}>6 / page</option>
            <option value={9}>9 / page</option>
            <option value={12}>12 / page</option>
            <option value={24}>24 / page</option>
          </select>
        </div>

        {loading ? (
          <PartySkeletonGrid count={limit} />
        ) : parties.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-10 text-center text-slate-400">
            No party found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {paginatedParties.map((party) => (
              <div
                key={party._id}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/30 transition hover:border-cyan-500/40 hover:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                      <Building2 size={22} />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold leading-tight text-white">
                        {party.partyName}
                      </h2>

                      <span className="mt-2 inline-block rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300">
                        {party.partyType}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-sm text-slate-300">
                  {party.gstNumber && (
                    <p className="flex items-center gap-2">
                      <BadgeIndianRupee size={15} className="text-slate-500" />
                      GST: {party.gstNumber}
                    </p>
                  )}

                  {party.contactNumber && (
                    <p className="flex items-center gap-2">
                      <Phone size={15} className="text-slate-500" />
                      {party.contactNumber}
                    </p>
                  )}

                  {party.email && (
                    <p className="flex items-center gap-2 break-all">
                      <Mail size={15} className="text-slate-500" />
                      {party.email}
                    </p>
                  )}

                  {(party.city || party.state) && (
                    <p className="flex items-center gap-2">
                      <MapPin size={15} className="text-slate-500" />
                      {[party.city, party.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
                  <button
                    onClick={() => openViewModal(party)}
                    className="rounded-lg bg-blue-500/10 p-2 text-blue-300 transition hover:bg-blue-500/20"
                    title="View"
                  >
                    <Eye size={17} />
                  </button>

                  <button
                    onClick={() => openEditModal(party)}
                    className="rounded-lg bg-amber-500/10 p-2 text-amber-300 transition hover:bg-amber-500/20"
                    title="Edit"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    onClick={() => handleDelete(party._id)}
                    className="rounded-lg bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20"
                    title="Disable"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && parties.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-400">
              Page <span className="font-semibold text-white">{page}</span> of{" "}
              <span className="font-semibold text-white">{totalPages}</span>
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                Prev
              </button>

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <h2 className="text-xl font-bold text-white">
                {mode === "add" && "Add Party"}
                {mode === "edit" && "Edit Party"}
                {mode === "view" && "View Party"}
              </h2>

              <button
                onClick={closeModal}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[68vh] overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Party Name"
                  name="partyName"
                  value={formData.partyName}
                  onChange={handleChange}
                  disabled={isView}
                  required
                />

                <div>
                  <label className="text-sm font-medium text-slate-300">
                    Party Type
                  </label>

                  <select
                    name="partyType"
                    value={formData.partyType}
                    onChange={handleChange}
                    disabled={isView}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-cyan-500 disabled:bg-slate-800 disabled:text-slate-400"
                  >
                    <option value="Vendor">Vendor</option>
                    <option value="Supplier">Supplier</option>
                    <option value="Contractor">Contractor</option>
                    <option value="Client">Client</option>
                    <option value="Company">Company</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <Input
                  label="GST Number"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  disabled={isView}
                />

                <Input
                  label="Contact Person"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  disabled={isView}
                />

                <Input
                  label="Contact Number"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  disabled={isView}
                />

                <Input
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isView}
                />

                <Input
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={isView}
                />

                <Input
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={isView}
                />

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-slate-300">
                    Address
                  </label>

                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={isView}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-cyan-500 disabled:bg-slate-800 disabled:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {!isView && (
              <div className="flex justify-end gap-3 border-t border-slate-800 px-5 py-4">
                <button
                  onClick={closeModal}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSubmit}
                  className="rounded-xl bg-cyan-500 px-5 py-2 font-semibold text-slate-950 transition hover:bg-cyan-400"
                >
                  {isEdit ? "Update Party" : "Save Party"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, name, value, onChange, disabled, required }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-300">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      <input
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-cyan-500 disabled:bg-slate-800 disabled:text-slate-400"
      />
    </div>
  );
}

function PartySkeletonGrid({ count = 9 }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900/80 p-5"
        >
          <div className="flex gap-3">
            <div className="h-11 w-11 rounded-xl bg-slate-800" />
            <div className="flex-1">
              <div className="h-5 w-40 rounded bg-slate-800" />
              <div className="mt-3 h-5 w-20 rounded-full bg-slate-800" />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="h-4 w-full rounded bg-slate-800" />
            <div className="h-4 w-4/5 rounded bg-slate-800" />
            <div className="h-4 w-3/5 rounded bg-slate-800" />
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-slate-800 pt-4">
            <div className="h-9 w-9 rounded-lg bg-slate-800" />
            <div className="h-9 w-9 rounded-lg bg-slate-800" />
            <div className="h-9 w-9 rounded-lg bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}