import React, { useEffect, useState } from "react";
import { Plus, Pencil, Package, ArrowLeft, Loader2 } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

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
  const [getAllStoreItems, setGetAllStoreItems] = useState([]);
  const [store, setStore] = useState(initialStore);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const handleAddStore = () => {
    setStore(initialStore);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setStore(initialStore);
  };

  const handleAddItem = (storeId) => {
    toast.success("Opening inventory");
    navigate(`/store/${storeId}`);
  };

  const handleEditStore = (storeId) => {
    toast("Edit store feature coming soon");
    console.log("Edit store:", storeId);
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
        "http://localhost:5000/store-master/create",
        store,
        {
          headers: authHeaders,
        }
      );

      toast.dismiss(loadingToast);

      if (response.data.success || response.status === 201 || response.status === 200) {
        toast.success("Store added successfully");
        await fetchmasterStores();
        closeModal();
      } else {
        toast.error(response.data.message || "Store creation failed");
      }
    } catch (error) {
      console.error("Error adding store:", error);

      toast.error(
        error.response?.data?.message || "Error while adding store"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchmasterStores = async () => {
    try {
      setPageLoading(true);

      const [storesResponse, itemsResponse] = await Promise.all([
        axios.get("http://localhost:5000/store-master/all", {
          headers: authHeaders,
        }),
        axios.get("http://localhost:5000/store/getAllItems", {
          headers: authHeaders,
        }),
      ]);

      setMasterStores(storesResponse.data.data || []);
      setGetAllStoreItems(itemsResponse.data.data || []);
    } catch (error) {
      console.log("error fetching master stores:", error);

      toast.error(
        error.response?.data?.message || "Failed to load stores"
      );
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchmasterStores();
  }, []);

  const handleStoreChange = (e) => {
    setStore({
      ...store,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-black mb-3"
            >
              <ArrowLeft size={18} /> Back
            </button>

            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Store Management
              </h1>
              <p className="text-gray-500 mt-2">
                Manage stores and track inventory by location
              </p>
            </div>

            <button
              onClick={handleAddStore}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-medium shadow-sm transition"
            >
              <Plus size={18} />
              Add Store
            </button>
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
            <div className="space-y-6">
              {masterStores.map((storeItem) => (
                <div
                  key={storeItem._id}
                  className="bg-white border border-purple-100 rounded-3xl shadow-sm overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-purple-500 flex items-center justify-center text-white">
                          <Package size={28} />
                        </div>

                        <div>
                          <h2 className="text-xl font-semibold text-gray-800">
                            {storeItem.storeName}
                          </h2>
                          <p className="text-sm text-gray-500 mt-1">
                            {storeItem.location}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleEditStore(storeItem._id)}
                        className="text-purple-500 hover:text-purple-700"
                      >
                        <Pencil size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                      <Info label="Store Code" value={storeItem.storeCode} />
                      <Info label="Store Incharge" value={storeItem.storeIncharge} />
                      <Info label="Phone" value={storeItem.contactNumber} />
                    </div>
                  </div>

                  <div className="border-t px-6 py-5 flex items-center justify-between bg-gray-50">
                    <button
                      className="flex items-center gap-2 text-gray-700 font-medium hover:text-blue-600"
                      onClick={() => navigate(`/store/${storeItem._id}`)}
                    >
                      <Package size={18} />
                      Inventory ({storeItem.inventoryCount || 0} items)
                    </button>

                    <button
                      onClick={() => handleAddItem(storeItem._id)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      + Add Item
                    </button>
                  </div>
                </div>
              ))}
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
                placeholder="e.g., New York"
              />

              <Input
                label="Phone *"
                name="contactNumber"
                value={store.contactNumber}
                onChange={handleStoreChange}
                placeholder="e.g., 1234567890"
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

function Info({ label, value }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-800 mt-1">{value || "N/A"}</p>
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