import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X, Loader2 } from "lucide-react";

const STORE_API = "http://localhost:5000/store-master/all";
const ITEM_API = "http://localhost:5000/api/store-items/add";

const initialForm = {
  masterStoreRef: "",
  itemName: "",
  itemCode: "",
  category: "",
  subCategory: "",
  description: "",
  hsnCode: "",
  boqNo: "",
  unit: "Nos",
  openingStock: 0,
  currentStock: 0,
  minimumStock: 0,
  maximumStock: 0,
  reorderLevel: 0,
  rate: 0,
  location: "",
  rackNumber: "",
  brand: "",
  make: "",
  supplierName: "",
  gstPercentage: 0,
  remarks: "",
};

export default function AddStoreItemModal({
  isOpen,
  onClose,
  refreshItems,
  defaultStoreId = "",
}) {
  const [formData, setFormData] = useState(initialForm);
  const [masterStores, setMasterStores] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStores();

      setFormData({
        ...initialForm,
        masterStoreRef: defaultStoreId || "",
      });
    }
  }, [isOpen, defaultStoreId]);

  if (!isOpen) return null;

  const fetchStores = async () => {
    try {
      const res = await axios.get(STORE_API);
      setMasterStores(res.data.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load stores");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.masterStoreRef) {
      toast.error("Store is required");
      return false;
    }

    if (!formData.itemName.trim()) {
      toast.error("Item name is required");
      return false;
    }

    if (!formData.itemCode.trim()) {
      toast.error("Item code is required");
      return false;
    }

    if (!formData.unit.trim()) {
      toast.error("Unit is required");
      return false;
    }

    return true;
  };

  const saveItem = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const payload = {
        ...formData,
        openingStock: Number(formData.openingStock || 0),
        currentStock: Number(formData.currentStock || formData.openingStock || 0),
        minimumStock: Number(formData.minimumStock || 0),
        maximumStock: Number(formData.maximumStock || 0),
        reorderLevel: Number(formData.reorderLevel || 0),
        rate: Number(formData.rate || 0),
        gstPercentage: Number(formData.gstPercentage || 0),
      };

      await axios.post(ITEM_API, payload);

      toast.success("Store item added successfully");
      refreshItems?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to add item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl">
        <div className="sticky top-0 bg-white z-10 border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Add Store Item
            </h2>
            <p className="text-sm text-slate-500">
              Add item stock under selected master store.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block mb-2 font-medium">Store *</label>
            <select
              name="masterStoreRef"
              value={formData.masterStoreRef}
              onChange={handleChange}
              className="w-full border rounded-xl px-4 py-3"
            >
              <option value="">Select Store</option>
              {masterStores.map((store) => (
                <option key={store._id} value={store._id}>
                  {store.storeName} - {store.storeCode}
                </option>
              ))}
            </select>
          </div>

          <Input label="Item Name *" name="itemName" value={formData.itemName} onChange={handleChange} />
          <Input label="Item Code *" name="itemCode" value={formData.itemCode} onChange={handleChange} />

          <Input label="Category" name="category" value={formData.category} onChange={handleChange} />
          <Input label="Sub Category" name="subCategory" value={formData.subCategory} onChange={handleChange} />
          <Input label="HSN Code" name="hsnCode" value={formData.hsnCode} onChange={handleChange} />

          <Input label="BOQ No." name="boqNo" value={formData.boqNo} onChange={handleChange} />
          <Input label="Unit *" name="unit" value={formData.unit} onChange={handleChange} />
          <Input label="Rate" type="number" name="rate" value={formData.rate} onChange={handleChange} />

          <Input label="Opening Stock" type="number" name="openingStock" value={formData.openingStock} onChange={handleChange} />
          <Input label="Current Stock" type="number" name="currentStock" value={formData.currentStock} onChange={handleChange} />
          <Input label="Minimum Stock" type="number" name="minimumStock" value={formData.minimumStock} onChange={handleChange} />

          <Input label="Maximum Stock" type="number" name="maximumStock" value={formData.maximumStock} onChange={handleChange} />
          <Input label="Reorder Level" type="number" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} />
          <Input label="GST %" type="number" name="gstPercentage" value={formData.gstPercentage} onChange={handleChange} />

          <Input label="Location" name="location" value={formData.location} onChange={handleChange} />
          <Input label="Rack Number" name="rackNumber" value={formData.rackNumber} onChange={handleChange} />
          <Input label="Brand" name="brand" value={formData.brand} onChange={handleChange} />

          <Input label="Make" name="make" value={formData.make} onChange={handleChange} />
          <Input label="Supplier Name" name="supplierName" value={formData.supplierName} onChange={handleChange} />

          <div className="md:col-span-3">
            <label className="block mb-2 font-medium">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Item description..."
            />
          </div>

          <div className="md:col-span-3">
            <label className="block mb-2 font-medium">Remarks</label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows={2}
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Any remarks..."
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-3 rounded-xl border hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            onClick={saveItem}
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-blue-600 text-white disabled:opacity-60 flex items-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? "Saving..." : "Save Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, type = "text", name, value, onChange }) {
  return (
    <div>
      <label className="block mb-2 font-medium">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border rounded-xl px-4 py-3"
      />
    </div>
  );
}