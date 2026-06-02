import React, { useEffect, useState } from "react";
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
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import BASE_URL  from "../../config/api";

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("add"); // add | edit | view
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
      params.append("limit", "50");

      const res = await fetch(`${BASE_URL}/party/search?${params.toString()}`);
      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || "Failed to fetch parties");
        return;
      }

      setParties(data.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Server error while fetching parties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchParties();
    }, 400);

    return () => clearTimeout(delay);
  }, [search, partyType]);

  const openAddModal = () => {
    setMode("add");
    setSelectedParty(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openViewModal = (party) => {
    setMode("view");
    setSelectedParty(party);
    setFormData({
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
    setIsModalOpen(true);
  };

  const openEditModal = (party) => {
    setMode("edit");
    setSelectedParty(party);
    setFormData({
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
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedParty(null);
    setFormData(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
        headers: {
          "Content-Type": "application/json",
        },
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
    const confirmDelete = window.confirm(
      "Are you sure you want to disable this party?"
    );

    if (!confirmDelete) return;

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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Party Master
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage vendors, suppliers, contractors, clients and companies.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 transition"
          >
            <Plus size={18} />
            Add Party
          </button>
        </div>

        {/* Search Section */}
        <div className="bg-slate-950 rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search by party name, GST number, mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <select
              value={partyType}
              onChange={(e) => setPartyType(e.target.value)}
              className=" bg-slate-950 border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-900"
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

        {/* Count */}
        <div className="mb-4 text-sm text-white">
          Total Result: <span className="font-semibold">{parties.length}</span>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 className="animate-spin mr-2" />
            Loading parties...
          </div>
        ) : parties.length === 0 ? (
          <div className=" rounded-2xl border border-slate-200 p-10 text-center text-white">
            No party found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {parties.map((party) => (
              <div
                key={party._id}
                className="bg-slate-950 rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                      <Building2 size={22} />
                    </div>

                    <div>
                      <h2 className="font-bold text-white text-lg leading-tight">
                        {party.partyName}
                      </h2>
                      <span className="inline-block mt-1 text-xs bg-blue-200 text-slate-700 px-2 py-1 rounded-full">
                        {party.partyType}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-sm text-white">
                  {party.gstNumber && (
                    <p className="flex items-center gap-2">
                      <BadgeIndianRupee size={15} />
                      GST: {party.gstNumber}
                    </p>
                  )}

                  {party.contactNumber && (
                    <p className="flex items-center gap-2">
                      <Phone size={15} />
                      {party.contactNumber}
                    </p>
                  )}

                  {party.email && (
                    <p className="flex items-center gap-2">
                      <Mail size={15} />
                      {party.email}
                    </p>
                  )}

                  {(party.city || party.state) && (
                    <p className="flex items-center gap-2">
                      <MapPin size={15} />
                      {[party.city, party.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => openViewModal(party)}
                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                    title="View"
                  >
                    <Eye size={17} />
                  </button>

                  <button
                    onClick={() => openEditModal(party)}
                    className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100"
                    title="Edit"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    onClick={() => handleDelete(party._id)}
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                    title="Disable"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 w-full max-w-3xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-xl font-bold text-white">
                {mode === "add" && "Add Party"}
                {mode === "edit" && "Edit Party"}
                {mode === "view" && "View Party"}
              </h2>

              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-slate-100 hover:text-black"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Party Name"
                name="partyName"
                value={formData.partyName}
                onChange={handleChange}
                disabled={isView}
                required
              />

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Party Type
                </label>
                <select
                  name="partyType"
                  value={formData.partyType}
                  onChange={handleChange}
                  disabled={isView}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100"
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
                <label className="text-sm font-medium text-white">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={isView}
                  rows={3}
                  className=" text-slate-800 mt-1 w-full border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100"
                />
              </div>
            </div>

            {!isView && (
              <div className="flex justify-end gap-3 px-5 py-4 border-t">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSubmit}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
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
      <label className="text-sm font-medium text-white">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <input
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="mt-1 w-full border border-slate-300 text-slate-800 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100"
      />
    </div>
  );
}