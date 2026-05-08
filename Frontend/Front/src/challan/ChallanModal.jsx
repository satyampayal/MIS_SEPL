import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus, Trash2, X, Loader2 } from "lucide-react";
import ChallanPreview from "./ChallanPreview";

const API_URL = "http://localhost:5000/challan";

const initialForm = {
  projectName: "",
  site: "",
  vendorName: "",
  dispatchFrom: "Office",
  dispatchTo: "Project Site",
  dispatchDate: "",
  deliveryStatus: "Pending",
  vehicleNumber: "",
  transporterName: "",
  sentBy: "",
  remarks: "",
};

const initialItem = {
  itemRef: "",
  itemName: "",
  description: "",
  hsnCode: "",
  quantity: 1,
  unit: "Nos",
  rate: 0,
  amount: 0,
};



export default function ChallanModal({
  isOpen,
  onClose,
  mode = "add",
  challan,
  refreshChallans,
}) {

  const [itemMaster, setItemMaster] = useState([]);
  const [itemLoading, setItemLoading] = useState(false);

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isAdd = mode === "add";

  const [formData, setFormData] = useState(initialForm);
  const [items, setItems] = useState([{ ...initialItem }]);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fetchItems = async () => {
    try {
      setItemLoading(true);

      const res = await axios.get("http://localhost:5000/store/getAllItems");

      setItemMaster(res.data.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load item list");
    } finally {
      setItemLoading(false);
    }
  };


  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }

    if (challan) {
      setFormData({
        projectName: challan.projectName || "",
        site: challan.site || "",
        vendorName: challan.vendorName || "",
        dispatchFrom: challan.dispatchFrom || "Office",
        dispatchTo: challan.dispatchTo || "Project Site",
        dispatchDate: challan.dispatchDate
          ? challan.dispatchDate.slice(0, 10)
          : "",
        deliveryStatus: challan.deliveryStatus || "Pending",
        vehicleNumber: challan.vehicleNumber || "",
        transporterName: challan.transporterName || "",
        sentBy: challan.sentBy || "",
        remarks: challan.remarks || "",
      });

      setItems(
        challan.items?.length
          ? challan.items.map((item) => ({
            itemRef: item.itemRef || "",
            itemName: item.itemName || "",
            description: item.description || "",
            hsnCode: item.hsnCode || "",
            quantity: Number(item.quantity || 1),
            unit: item.unit || "Nos",
            rate: Number(item.rate || 0),
            amount: Number(item.amount || 0),
          }))
          : [{ ...initialItem }]
      );
    } else {
      setFormData(initialForm);
      setItems([{ ...initialItem }]);
    }
  }, [challan, isOpen]);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [items]);

  if (!isOpen) return null;

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { ...initialItem }]);
  };

  const handleDeleteItem = (index) => {
    if (items.length === 1) {
      toast.error("At least one item is required");
      return;
    }

    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];

    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    if (field === "itemRef") {
      const selectedItem = itemMaster.find((item) => item._id === value);

      if (selectedItem) {
        updatedItems[index] = {
          ...updatedItems[index],
          itemRef: selectedItem._id,
          itemName: selectedItem.itemName || "",
          description: selectedItem.description || selectedItem.itemName || "",
          hsnCode: selectedItem.hsnCode || "",
          unit: selectedItem.unit || "Nos",
          rate: Number(selectedItem.rate || 0),
          amount:
            Number(updatedItems[index].quantity || 1) *
            Number(selectedItem.rate || 0),
        };
      }
    }

    if (field === "quantity" || field === "rate") {
      updatedItems[index].amount =
        Number(updatedItems[index].quantity || 0) *
        Number(updatedItems[index].rate || 0);
    }

    setItems(updatedItems);
  };

  const validateForm = () => {
    if (!formData.projectName.trim()) {
      toast.error("Project name is required");
      return false;
    }

    if (!formData.dispatchDate) {
      toast.error("Dispatch date is required");
      return false;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].itemName.trim()) {
        toast.error(`Item name is required in row ${i + 1}`);
        return false;
      }

      if (!items[i].description.trim()) {
        toast.error(`Description is required in row ${i + 1}`);
        return false;
      }

      if (Number(items[i].quantity) <= 0) {
        toast.error(`Quantity must be greater than 0 in row ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const handlePreview = () => {
    if (!validateForm()) return;
    setPreviewOpen(true);
  };

  const saveChallan = async () => {
    if (isView) return;
    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = {
        ...formData,
        totalAmount,
        items,
      };

      if (isAdd) {
        await axios.post(`${API_URL}/add`, payload);
        toast.success("Challan created successfully");
      }

      if (isEdit) {
        await axios.put(`${API_URL}/update/${challan._id}`, payload);
        toast.success("Challan updated successfully");
      }

      refreshChallans();
      setPreviewOpen(false);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to save challan");
    } finally {
      setSaving(false);
    }
  };

  const title =
    mode === "view"
      ? "View Challan"
      : mode === "edit"
        ? "Edit Challan"
        : "Create New Challan";

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl">
          <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                {title}
              </h2>
              <p className="text-sm text-slate-500">
                Create challan from project, dispatch source and item details.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
            >
              <X size={22} />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Project Name *"
              name="projectName"
              value={formData.projectName}
              onChange={handleFormChange}
              disabled={isView}
              placeholder="Enter project name"
            />

            <Input
              label="Site / Location"
              name="site"
              value={formData.site}
              onChange={handleFormChange}
              disabled={isView}
              placeholder="Optional site name"
            />

            <Input
              label="Vendor Name"
              name="vendorName"
              value={formData.vendorName}
              onChange={handleFormChange}
              disabled={isView}
              placeholder="Optional vendor name"
            />

            <div>
              <label className="block mb-2 text-sm font-semibold text-slate-700">
                Dispatch Date *
              </label>
              <input
                type="date"
                name="dispatchDate"
                value={formData.dispatchDate}
                onChange={handleFormChange}
                disabled={isView}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 disabled:bg-slate-100"
              />
            </div>

            <Select
              label="Dispatch From *"
              name="dispatchFrom"
              value={formData.dispatchFrom}
              onChange={handleFormChange}
              disabled={isView}
              options={["Office", "Vendor", "Store", "Warehouse", "Other"]}
            />

            <Select
              label="Dispatch To *"
              name="dispatchTo"
              value={formData.dispatchTo}
              onChange={handleFormChange}
              disabled={isView}
              options={["Project Site", "Office", "Vendor", "Store", "Other"]}
            />

            <Input
              label="Vehicle Number"
              name="vehicleNumber"
              value={formData.vehicleNumber}
              onChange={handleFormChange}
              disabled={isView}
              placeholder="Vehicle no."
            />

            <Input
              label="Transporter Name"
              name="transporterName"
              value={formData.transporterName}
              onChange={handleFormChange}
              disabled={isView}
              placeholder="Transporter name"
            />

            <Input
              label="Sent By"
              name="sentBy"
              value={formData.sentBy}
              onChange={handleFormChange}
              disabled={isView}
              placeholder="Person name"
            />

            <Select
              label="Status"
              name="deliveryStatus"
              value={formData.deliveryStatus}
              onChange={handleFormChange}
              disabled={isView}
              options={["Pending", "In Transit", "Delivered", "Cancelled"]}
            />

            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-semibold text-slate-700">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleFormChange}
                disabled={isView}
                rows={3}
                placeholder="Any remarks..."
                className="w-full border border-slate-300 rounded-xl px-4 py-3 disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="px-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Items *</h3>

              {!isView && (
                <button
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-800"
                >
                  <Plus size={17} />
                  Add Item
                </button>
              )}
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                  <tr>
                    <th className="text-left px-4 py-3 min-w-[180px]">Item</th>
                    <th className="text-left px-4 py-3 min-w-[260px]">
                      Description
                    </th>
                    <th className="text-left px-4 py-3 min-w-[120px]">HSN</th>
                    <th className="text-left px-4 py-3 min-w-[90px]">Qty</th>
                    <th className="text-left px-4 py-3 min-w-[100px]">Unit</th>
                    <th className="text-left px-4 py-3 min-w-[120px]">Rate</th>
                    <th className="text-left px-4 py-3 min-w-[120px]">Amount</th>
                    {!isView && (
                      <th className="text-center px-4 py-3">Action</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-3">
                        <select
                          value={item.itemRef || ""}
                          disabled={isView || itemLoading}
                          onChange={(e) =>
                            handleItemChange(index, "itemRef", e.target.value)
                          }
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 disabled:bg-slate-100"
                        >
                          <option value="">
                            {itemLoading ? "Loading items..." : "Select Item"}
                          </option>

                          {itemMaster.map((masterItem) => (
                            <option key={masterItem._id} value={masterItem._id}>
                              {masterItem.itemName}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.description}
                          disabled={isView}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 disabled:bg-slate-100"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.hsnCode}
                          disabled={isView}
                          onChange={(e) =>
                            handleItemChange(index, "hsnCode", e.target.value)
                          }
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 disabled:bg-slate-100"
                        />
                      </td>

                      <td className="px-4 py-3">
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
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 disabled:bg-slate-100"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.unit}
                          disabled={isView}
                          onChange={(e) =>
                            handleItemChange(index, "unit", e.target.value)
                          }
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 disabled:bg-slate-100"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.rate}
                          disabled={isView}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "rate",
                              Number(e.target.value)
                            )
                          }
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 disabled:bg-slate-100"
                        />
                      </td>

                      <td className="px-4 py-3 font-semibold">
                        ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                      </td>

                      {!isView && (
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteItem(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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

            <div className="flex justify-end py-5">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4">
                <p className="text-sm text-slate-500">Total Amount</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </h3>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-xl border border-slate-300"
            >
              {isView ? "Close" : "Cancel"}
            </button>

            {!isView && (
              <button
                onClick={handlePreview}
                className="px-5 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700"
              >
                Preview Challan
              </button>
            )}

            {!isView && (
              <button
                onClick={saveChallan}
                disabled={saving}
                className="px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 inline-flex items-center gap-2"
              >
                {saving && <Loader2 size={18} className="animate-spin" />}
                {isEdit ? "Update Directly" : "Save Directly"}
              </button>
            )}
          </div>
        </div>
      </div>

      {previewOpen && (
        <ChallanPreview
          formData={formData}
          items={items}
          totalAmount={totalAmount}
          onBack={() => setPreviewOpen(false)}
          onConfirm={saveChallan}
        />
      )}
    </>
  );
}

function Input({ label, name, value, onChange, disabled, placeholder }) {
  return (
    <div>
      <label className="block mb-2 text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full border border-slate-300 rounded-xl px-4 py-3 disabled:bg-slate-100"
      />
    </div>
  );
}

function Select({ label, name, value, onChange, disabled, options }) {
  return (
    <div>
      <label className="block mb-2 text-sm font-semibold text-slate-700">
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full border border-slate-300 rounded-xl px-4 py-3 disabled:bg-slate-100"
      >
        {options.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </div>
  );
}