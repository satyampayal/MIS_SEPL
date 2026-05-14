import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Package,
  ArrowLeft,
  Loader2,
  Warehouse,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import BASE_URL from "../../config/api";


const initialStore = {
  storeName: "",
  storeType: "Site Store",
  location: "",
  storeIncharge: "",
  contactNumber: "",
  storeCode: "",
  associtedSite: "",
};

const StoreManagementPage = () => {
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [masterStores, setMasterStores] = useState([]);
  const [storeItems, setStoreItems] = useState([]);
  const [store, setStore] = useState(initialStore);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const fetchMasterStores = async () => {
    try {
      setPageLoading(true);

      const [storesResponse, itemsResponse] = await Promise.all([
        axios.get(`${BASE_URL}/store-master/all`, {
          headers: authHeaders,
        }),

        axios.get(`${BASE_URL}/api/store-items/all`, {
          headers: authHeaders,
        }),
      ]);

      setMasterStores(storesResponse.data.data || []);
      setStoreItems(itemsResponse.data.data || []);
    } catch (error) {
      console.log("error fetching master stores:", error);
      toast.error(error.response?.data?.message || "Failed to load stores");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterStores();
  }, []);

  const storeStats = useMemo(() => {
    const stats = {};

    storeItems.forEach((item) => {
      const storeId =
        item.masterStoreRef?._id || item.masterStoreRef || "NO_STORE";

      if (!stats[storeId]) {
        stats[storeId] = {
          totalItems: 0,
          availableItems: 0,
          lowStockItems: 0,
          outOfStockItems: 0,
          totalStockValue: 0,
        };
      }

      stats[storeId].totalItems += 1;

      if (item.status === "Available") {
        stats[storeId].availableItems += 1;
      }

      if (item.status === "Low Stock") {
        stats[storeId].lowStockItems += 1;
      }

      if (item.status === "Out Of Stock") {
        stats[storeId].outOfStockItems += 1;
      }

      stats[storeId].totalStockValue += Number(item.totalStockValue || 0);
    });

    return stats;
  }, [storeItems]);

  const handleAddStore = () => {
    setStore(initialStore);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setStore(initialStore);
  };

  const handleStoreChange = (e) => {
    setStore({
      ...store,
      [e.target.name]: e.target.value,
    });
  };

  const validateStore = () => {
    if (!store.storeName.trim()) {
      toast.error("Store name is required");
      return false;
    }

    if (!store.storeCode.trim()) {
      toast.error("Store code is required");
      return false;
    }

    if (!store.storeIncharge.trim()) {
      toast.error("Store incharge is required");
      return false;
    }

    if (!store.location.trim()) {
      toast.error("Location is required");
      return false;
    }

    if (!store.contactNumber.trim()) {
      toast.error("Phone number is required");
      return false;
    }

    return true;
  };

  const addStore = async () => {
    if (!validateStore()) return;

    try {
      setLoading(true);

      const loadingToast = toast.loading("Creating store...");

      const response = await axios.post(
        `${BASE_URL}/store-master/create`,
        store,
        {
          headers: authHeaders,
        }
      );

      toast.dismiss(loadingToast);

      if (response.data.success) {
        toast.success("Store added successfully");
        await fetchMasterStores();
        closeModal();
      } else {
        toast.error(response.data.message || "Store creation failed");
      }
    } catch (error) {
      console.error("Error adding store:", error);
      toast.error(error.response?.data?.message || "Error while adding store");
    } finally {
      setLoading(false);
    }
  };

  const handleInventory = (storeId) => {
    navigate(`/store/${storeId}`);
  };

  const handleEditStore = (storeId) => {
    toast("Edit store feature coming soon");
    console.log("Edit store:", storeId);
  };

  const totalStores = masterStores.length;
  const totalItems = storeItems.length;
  const lowStockCount = storeItems.filter(
    (item) => item.status === "Low Stock"
  ).length;
  const outOfStockCount = storeItems.filter(
    (item) => item.status === "Out Of Stock"
  ).length;

  return (
    <>
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-600 hover:text-black mb-4"
            >
              <ArrowLeft size={18} /> Back
            </button>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Store Management
                </h1>
                <p className="text-slate-500 mt-2">
                  Manage master stores and monitor store-wise inventory.
                </p>
              </div>

              <button
                onClick={handleAddStore}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-medium shadow-sm transition"
              >
                <Plus size={18} />
                Add Store
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard title="Total Stores" value={totalStores} />
            <StatCard title="Total Items" value={totalItems} />
            <StatCard title="Low Stock" value={lowStockCount} danger />
            <StatCard title="Out Of Stock" value={outOfStockCount} danger />
          </div>

          {pageLoading ? (
            <div className="bg-white rounded-3xl p-10 shadow-sm flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={36} />
              <p className="text-gray-500 mt-4">Loading stores...</p>
            </div>
          ) : masterStores.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 shadow-sm text-center">
              <Package size={45} className="mx-auto text-gray-400" />
              <h2 className="text-xl font-semibold mt-4">No stores found</h2>
              <p className="text-gray-500 mt-2">
                Create your first store to start inventory tracking.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {masterStores.map((storeItem) => {
                const stats = storeStats[storeItem._id] || {
                  totalItems: 0,
                  availableItems: 0,
                  lowStockItems: 0,
                  outOfStockItems: 0,
                  totalStockValue: 0,
                };

                return (
                  <div
                    key={storeItem._id}
                    className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white">
                            <Warehouse size={28} />
                          </div>

                          <div>
                            <h2 className="text-xl font-bold text-slate-900">
                              {storeItem.storeName}
                            </h2>

                            <p className="text-sm text-slate-500 mt-1">
                              {storeItem.storeType || "Store"}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleEditStore(storeItem._id)}
                          className="p-2 rounded-xl text-slate-500 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Pencil size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <Info
                          icon={<Package size={16} />}
                          label="Store Code"
                          value={storeItem.storeCode}
                        />

                        <Info
                          icon={<User size={16} />}
                          label="Incharge"
                          value={storeItem.storeIncharge}
                        />

                        <Info
                          icon={<Phone size={16} />}
                          label="Phone"
                          value={storeItem.contactNumber}
                        />
                      </div>

                      <div className="mt-4">
                        <Info
                          icon={<MapPin size={16} />}
                          label="Location"
                          value={storeItem.location}
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                        <MiniStat label="Items" value={stats.totalItems} />
                        <MiniStat label="Available" value={stats.availableItems} />
                        <MiniStat label="Low" value={stats.lowStockItems} warning />
                        <MiniStat label="Out" value={stats.outOfStockItems} danger />
                      </div>
                    </div>

                    <div className="border-t px-6 py-5 flex items-center justify-between bg-slate-50">
                      <button
                        className="flex items-center gap-2 text-slate-700 font-medium hover:text-blue-600"
                        onClick={() => handleInventory(storeItem._id)}
                      >
                        <Package size={18} />
                        Inventory ({stats.totalItems} items)
                      </button>

                      <button
                        onClick={() => handleInventory(storeItem._id)}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        + Add Item
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b">
              <h2 className="text-2xl font-bold text-gray-800">
                Add New Store
              </h2>

              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-black text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block mb-2 font-medium">Store Type *</label>
                <select
                  className="w-full border rounded-xl px-4 py-3"
                  name="storeType"
                  value={store.storeType}
                  onChange={handleStoreChange}
                >
                  <option value="Site Store">Site Store</option>
                  <option value="Head Office Store">Head Office Store</option>
                  <option value="Project Store">Project Store</option>
                  <option value="Warehouse Store">Warehouse Store</option>
                </select>
              </div>

              <Input
                label="Store Name *"
                name="storeName"
                value={store.storeName}
                onChange={handleStoreChange}
                placeholder="e.g., Main Store"
              />

              <Input
                label="Store Code *"
                name="storeCode"
                value={store.storeCode}
                onChange={handleStoreChange}
                placeholder="e.g., STORE-001"
              />

              <Input
                label="Store Incharge *"
                name="storeIncharge"
                value={store.storeIncharge}
                onChange={handleStoreChange}
                placeholder="e.g., John Doe"
              />

              <Input
                label="Location *"
                name="location"
                value={store.location}
                onChange={handleStoreChange}
                placeholder="e.g., Ghaziabad"
              />

              <Input
                label="Phone *"
                name="contactNumber"
                value={store.contactNumber}
                onChange={handleStoreChange}
                placeholder="e.g., 9876543210"
              />
            </div>

            <div className="px-6 pb-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={loading}
                className="px-5 py-3 rounded-xl border hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                className="px-5 py-3 rounded-xl bg-blue-600 text-white font-medium disabled:bg-gray-400 flex items-center gap-2"
                onClick={addStore}
                disabled={loading}
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? "Adding..." : "Add Store"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

function StatCard({ title, value, danger }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <h2
        className={`text-2xl font-bold mt-1 ${
          danger ? "text-red-600" : "text-slate-900"
        }`}
      >
        {value}
      </h2>
    </div>
  );
}

function MiniStat({ label, value, warning, danger }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`font-bold text-lg ${
          danger
            ? "text-red-600"
            : warning
            ? "text-yellow-600"
            : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Info({ icon, label, value }) {
  return (
    <div>
      <p className="text-sm text-slate-500 flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="font-medium text-slate-800 mt-1">{value || "N/A"}</p>
    </div>
  );
}

function Input({ label, name, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block mb-2 font-medium">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border rounded-xl px-4 py-3"
      />
    </div>
  );
}

export default StoreManagementPage;