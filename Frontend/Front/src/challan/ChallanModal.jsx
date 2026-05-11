import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import ChallanPreview from "./ChallanPreview";

const CHALLAN_API = "http://localhost:5000/challan";
const PROJECT_API = "http://localhost:5000/project-master/all";
const STORE_API = "http://localhost:5000/store-master/all";
const ITEM_API = "http://localhost:5000/api/store-items/challan-items";

const emptyForm = {
  challanType: "Delivery Challan",
  projectId: "",
  projectName: "",
  site: "",
  dispatchFromStoreRef: "",
  dispatchFrom: "Store",
  dispatchTo: "Project Site",
  vendorName: "",
  dispatchDate: "",
  deliveryStatus: "Pending",
  remarks: "",
};

const emptyItem = {
  itemRef: "",
  itemName: "",
  description: "",
  hsnCode: "",
  boqNo: "",
  quantity: 1,
  unit: "Nos",
  rate: 0,
  amount: 0,
  stockError: "",
};

export default function ChallanModal({
  isOpen,
  onClose,
  mode = "add",
  challan,
  refreshChallans,
}) {
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState([{ ...emptyItem }]);

  const [projects, setProjects] = useState([]);
  const [stores, setStores] = useState([]);
  const [storeItems, setStoreItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [itemLoading, setItemLoading] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      fetchStores();

      if (!challan) {
        setForm(emptyForm);
        setItems([{ ...emptyItem }]);
      }
    }
  }, [isOpen]);

 useEffect(() => {
  if (!isOpen) return;

  if (challan) {
    const storeId =
      challan.dispatchFromStoreRef?._id ||
      challan.dispatchFromStoreRef ||
      "";

    setForm({
      challanType: challan.challanType || "Delivery Challan",
      projectId: challan.projectId?._id || challan.projectId || "",
      projectName: challan.projectName || "",
      site: challan.site || "",

      dispatchFromStoreRef: storeId,

      dispatchFrom: challan.dispatchFrom || "Store",
      dispatchTo: challan.dispatchTo || "Project Site",
      vendorName: challan.vendorName || "",
      dispatchDate: challan.dispatchDate
        ? challan.dispatchDate.slice(0, 10)
        : "",
      deliveryStatus: challan.deliveryStatus || "Pending",
      remarks: challan.remarks || "",
    });

    setItems(
      challan.items?.length
        ? challan.items.map((item) => ({
            itemRef: item.itemRef?._id || item.itemRef || "",
            itemName: item.itemName || item.itemRef?.itemName || "",
            description: item.description || "",
            hsnCode: item.hsnCode || "",
            boqNo: item.boqNo || "",
            quantity: Number(item.quantity || 1),
            unit: item.unit || "Nos",
            rate: Number(item.rate || 0),
            amount: Number(item.amount || 0),
            stockError: "",
          }))
        : [{ ...emptyItem }]
    );

    if (storeId) {
      fetchItemsByStore(storeId);
    }
  } else {
    setForm(emptyForm);
    setItems([{ ...emptyItem }]);
    setStoreItems([]);
  }
}, [challan, isOpen]);

  if (!isOpen) return null;

  const fetchProjects = async () => {
    try {
      const res = await axios.get(PROJECT_API);
      setProjects(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load projects");
    }
  };

  const fetchStores = async () => {
    try {
      const res = await axios.get(STORE_API);
      setStores(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load stores");
    }
  };

  const fetchItemsByStore = async (storeId) => {
    try {
      setItemLoading(true);
      const res = await axios.get(`${ITEM_API}?storeId=${storeId}`);
      setStoreItems(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load store items");
    } finally {
      setItemLoading(false);
    }
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    if (name === "projectId") {
      const selectedProject = projects.find((p) => p._id === value);

      setForm((prev) => ({
        ...prev,
        projectId: selectedProject?._id || "",
        projectName: selectedProject?.name || "",
        site: selectedProject?.location || "",
      }));

      return;
    }

    if (name === "dispatchFromStoreRef") {
      setForm((prev) => ({
        ...prev,
        dispatchFromStoreRef: value,
      }));

      setItems([{ ...emptyItem }]);
      setStoreItems([]);

      if (value) fetchItemsByStore(value);
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    if (field === "itemRef") {
      const selectedItem = storeItems.find((item) => item._id === value);

      if (selectedItem) {
        updated[index] = {
          ...updated[index],
          itemRef: selectedItem._id,
          itemName: selectedItem.itemName || "",
          description: selectedItem.description || selectedItem.itemName || "",
          hsnCode: selectedItem.hsnCode || "",
          boqNo: selectedItem.boqNo || "",
          unit: selectedItem.unit || "Nos",
          rate: Number(selectedItem.rate || 0),
          quantity: 1,
          amount: Number(selectedItem.rate || 0),
          stockError: "",
        };
      }
    }

    if (field === "quantity" || field === "rate") {
      updated[index].amount =
        Number(updated[index].quantity || 0) * Number(updated[index].rate || 0);
    }

    if (field === "quantity") {
      const selectedItem = storeItems.find(
        (item) => item._id === updated[index].itemRef
      );

      if (
        selectedItem &&
        Number(value) > Number(selectedItem.currentStock || 0)
      ) {
        updated[index].stockError = `Only ${selectedItem.currentStock} ${selectedItem.unit} available`;
      } else {
        updated[index].stockError = "";
      }
    }

    setItems(updated);
  };

  const addItemRow = () => {
    setItems((prev) => [...prev, { ...emptyItem }]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) {
      toast.error("At least one item is required");
      return;
    }

    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    if (!form.projectId) {
      toast.error("Project is required");
      return false;
    }

    if (!form.dispatchFromStoreRef) {
      toast.error("Dispatch store is required");
      return false;
    }

    if (!form.dispatchDate) {
      toast.error("Dispatch date is required");
      return false;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].itemRef) {
        toast.error(`Select item in row ${i + 1}`);
        return false;
      }

      if (Number(items[i].quantity) <= 0) {
        toast.error(`Quantity must be greater than 0 in row ${i + 1}`);
        return false;
      }

      if (items[i].stockError) {
        toast.error(items[i].stockError);
        return false;
      }
    }

    return true;
  };

  const saveChallan = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      const payload = {
        ...form,
        items,
      };

      if (isEdit) {
        await axios.put(`${CHALLAN_API}/update/${challan._id}`, payload);
        toast.success("Challan updated successfully");
      } else {
        await axios.post(`${CHALLAN_API}/add`, payload);
        toast.success("Challan created successfully");
      }

      refreshChallans?.();
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save challan");
    } finally {
      setLoading(false);
    }
  };

  const hasError = items.some((item) => item.stockError);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-xl">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {isView ? "View Challan" : isEdit ? "Edit Challan" : "Create Challan"}
          </h2>

          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={22} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectBox
            label="Project *"
            name="projectId"
            value={form.projectId}
            onChange={handleFormChange}
            disabled={isView || isEdit}
          >
            <option value="">Select Project</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name} - {project?.code}
              </option>
            ))}
          </SelectBox>

          <Input
            label="Project Name"
            name="projectName"
            value={form.projectName}
            onChange={handleFormChange}
            disabled
          />

          <Input
            label="Site / Location"
            name="site"
            value={form.site}
            onChange={handleFormChange}
            disabled={isView}
          />

          <SelectBox
            label="Dispatch Store *"
            name="dispatchFromStoreRef"
            value={form.dispatchFromStoreRef}
            onChange={handleFormChange}
            disabled={isView || isEdit}
          >
            <option value="">Select Store</option>
            {stores.map((store) => (
              <option key={store._id} value={store._id}>
                {store.storeName} - {store.storeCode}
              </option>
            ))}
          </SelectBox>

          <Input
            label="Vendor Name"
            name="vendorName"
            value={form.vendorName}
            onChange={handleFormChange}
            disabled={isView}
          />

          <Input
            label="Dispatch Date *"
            type="date"
            name="dispatchDate"
            value={form.dispatchDate}
            onChange={handleFormChange}
            disabled={isView}
          />

          <SelectBox
            label="Dispatch From"
            name="dispatchFrom"
            value={form.dispatchFrom}
            onChange={handleFormChange}
            disabled={isView}
          >
            <option>Store</option>
            <option>Office</option>
            <option>Vendor</option>
            <option>Warehouse</option>
          </SelectBox>

          <SelectBox
            label="Dispatch To"
            name="dispatchTo"
            value={form.dispatchTo}
            onChange={handleFormChange}
            disabled={isView}
          >
            <option>Project Site</option>
            <option>Office</option>
            <option>Vendor</option>
            <option>Store</option>
          </SelectBox>

          <SelectBox
            label="Status"
            name="deliveryStatus"
            value={form.deliveryStatus}
            onChange={handleFormChange}
            disabled={isView}
          >
            <option>Pending</option>
            <option>In Transit</option>
            <option>Delivered</option>
            <option>Cancelled</option>
          </SelectBox>

          <div className="md:col-span-2">
            <label className="block mb-2 font-medium">Remarks</label>
            <textarea
              name="remarks"
              value={form.remarks}
              onChange={handleFormChange}
              disabled={isView}
              rows={2}
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">Items</h3>

            {!isView && (
              <button
                onClick={addItemRow}
                className="flex items-center gap-2 text-blue-600 font-semibold"
              >
                <Plus size={17} />
                Add Item
              </button>
            )}
          </div>

          <div className="overflow-x-auto border rounded-2xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 min-w-[220px]">Item</th>
                  <th className="text-left p-3 min-w-[220px]">Description</th>
                  <th className="text-left p-3 min-w-[100px]">HSN</th>
                  <th className="text-left p-3 min-w-[90px]">Qty</th>
                  <th className="text-left p-3 min-w-[90px]">Unit</th>
                  <th className="text-left p-3 min-w-[100px]">Rate</th>
                  <th className="text-left p-3 min-w-[110px]">Amount</th>
                  {!isView && <th className="text-center p-3">Action</th>}
                </tr>
              </thead>

              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-3">
                      <select
                        value={item.itemRef}
                        disabled={isView || !form.dispatchFromStoreRef}
                        onChange={(e) =>
                          handleItemChange(index, "itemRef", e.target.value)
                        }
                        className="w-full border rounded-lg px-3 py-2"
                      >
                        <option value="">
                          {itemLoading ? "Loading..." : "Select Item"}

                        </option>

                        {item.itemRef && item.itemName && (
                          <option value={item.itemRef}>{item.itemName}</option>
                        )}// this is update to see item name on the view and edit


                        {storeItems.map((storeItem) => (
                          <option key={storeItem._id} value={storeItem._id}>
                            {storeItem.itemName} — Avl:{" "}
                            {storeItem.currentStock} {storeItem.unit}
                          </option>
                        ))}
                      </select>
                    </td>

                    <TdInput
                      value={item.description}
                      disabled={isView}
                      onChange={(e) =>
                        handleItemChange(index, "description", e.target.value)
                      }
                    />

                    <TdInput
                      value={item.hsnCode}
                      disabled={isView}
                      onChange={(e) =>
                        handleItemChange(index, "hsnCode", e.target.value)
                      }
                    />

                    <td className="p-3">
                      <input
                        type="number"
                        value={item.quantity}
                        disabled={isView}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "quantity",
                            Number(e.target.value)
                          )
                        }
                        className={`w-full border rounded-lg px-3 py-2 ${item.stockError ? "border-red-500 bg-red-50" : ""
                          }`}
                      />

                      {item.stockError && (
                        <p className="text-xs text-red-600 mt-1">
                          {item.stockError}
                        </p>
                      )}
                    </td>

                    <TdInput
                      value={item.unit}
                      disabled={isView}
                      onChange={(e) =>
                        handleItemChange(index, "unit", e.target.value)
                      }
                    />

                    <TdInput
                      type="number"
                      value={item.rate}
                      disabled={isView}
                      onChange={(e) =>
                        handleItemChange(index, "rate", Number(e.target.value))
                      }
                    />

                    <td className="p-3 font-semibold">
                      ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                    </td>

                    {!isView && (
                      <td className="p-3 text-center">
                        <button
                          onClick={() => removeItemRow(index)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                        >
                          <Trash2 size={17} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-5">
            <div className="border rounded-xl px-5 py-3 bg-gray-50">
              <p className="text-sm text-gray-500">Total Amount</p>
              <h3 className="text-xl font-bold">
                ₹{totalAmount.toLocaleString("en-IN")}
              </h3>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl border"
            disabled={loading}
          >
            {isView ? "Close" : "Cancel"}
          </button>

          <button
            onClick={() => {
              if (!validate()) return;
              setPreviewOpen(true);
            }}
            disabled={hasError}
            className="px-5 py-3 rounded-xl bg-green-600 text-white disabled:opacity-50"
          >
            Preview Challan
          </button>

          {!isView && (
            <button
              onClick={saveChallan}
              disabled={loading || hasError}
              className="px-5 py-3 rounded-xl bg-blue-600 text-white disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {isEdit ? "Update Challan" : "Save Challan"}
            </button>
          )}
        </div>
      </div>
      {previewOpen && (
  <ChallanPreview
    formData={form}
    items={items}
    totalAmount={totalAmount}
    onBack={() => setPreviewOpen(false)}
    onConfirm={saveChallan}
  />
)}
    </div>
  );
}

function Input({ label, type = "text", name, value, onChange, disabled }) {
  return (
    <div>
      <label className="block mb-2 font-medium">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full border rounded-xl px-4 py-3 disabled:bg-gray-100"
      />
    </div>
  );
}

function SelectBox({ label, name, value, onChange, disabled, children }) {
  return (
    <div>
      <label className="block mb-2 font-medium">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full border rounded-xl px-4 py-3 disabled:bg-gray-100"
      >
        {children}
      </select>
    </div>
  );
}

function TdInput({ type = "text", value, onChange, disabled }) {
  return (
    <td className="p-3">
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full border rounded-lg px-3 py-2 disabled:bg-gray-100"
      />
    </td>
  );
}