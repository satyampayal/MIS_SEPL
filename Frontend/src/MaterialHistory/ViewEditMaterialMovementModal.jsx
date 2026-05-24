import React, { useEffect, useState } from "react";
import {
  X,
  Save,
  Package,
  Truck,
  FileText,
  IndianRupee,
} from "lucide-react";

import toast from "react-hot-toast";
import BASE_URL from "../../config/api";

export default function ViewEditMaterialMovementModal({
  isOpen,
  onClose,
  selectedRecord,
  refreshData,
  mode = "view",
}) {
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    itemName: "",
    quantity: "",
    uom: "",
    rate: "",
    amount: "",
    projectName: "",
    vendorName: "",
    documentNo: "",
    documentDate: "",
    invoiceNumber: "",
    invoiceDate: "",
    inOut: "",
    remarks: "",
    companyName: "",
    vehicleNumber: "",
    transportName: "",
    category: "",
    commodity: "",
    mepHead: "",
    hsnCode: "",
    boqNo: "",
  });

  useEffect(() => {
    if (selectedRecord) {
      setFormData({
        itemName: selectedRecord.itemName || "",
        quantity: selectedRecord.quantity || "",
        uom: selectedRecord.uom || "",
        rate: selectedRecord.rate || "",
        amount: selectedRecord.amount || "",
        projectName: selectedRecord.projectName || "",
        vendorName: selectedRecord.vendorName || "",
        documentNo: selectedRecord.documentNo || "",
        documentDate: selectedRecord.documentDate
          ? selectedRecord.documentDate.split("T")[0]
          : "",
        invoiceNumber: selectedRecord.invoiceNumber || "",
        invoiceDate: selectedRecord.invoiceDate
          ? selectedRecord.invoiceDate.split("T")[0]
          : "",
        inOut: selectedRecord.inOut || "",
        remarks: selectedRecord.remarks || "",
        companyName: selectedRecord.companyName || "",
        vehicleNumber: selectedRecord.vehicleNumber || "",
        transportName: selectedRecord.transportName || "",
        category: selectedRecord.category || "",
        commodity: selectedRecord.commodity || "",
        mepHead: selectedRecord.mepHead || "",
        hsnCode: selectedRecord.hsnCode || "",
        boqNo: selectedRecord.boqNo || "",
      });
    }
  }, [selectedRecord]);

  if (!isOpen || !selectedRecord) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      if (
        name === "quantity" ||
        name === "rate"
      ) {
        updated.amount =
          Number(updated.quantity || 0) *
          Number(updated.rate || 0);
      }

      return updated;
    });
  };

  const handleUpdate = async () => {
    try {
      if (!formData.itemName.trim()) {
        return toast.error("Item name is required");
      }

      if (!formData.quantity || Number(formData.quantity) <= 0) {
        return toast.error("Valid quantity is required");
      }

      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${BASE_URL}/material-movement/update/${selectedRecord._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);

        refreshData();

        onClose();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "border rounded-2xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
   <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">

      <div className="relative bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-gray-200 animate-fadeIn max-h-[95vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-5 border-b bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div>
            <h2 className="text-2xl font-bold">
              {isView
                ? "View Material Record"
                : "Edit Material Record"}
            </h2>

            <p className="text-white/80 text-sm mt-1">
              Material movement information & history
            </p>
          </div>

          <button
            onClick={onClose}
            className="hover:bg-white/10 p-2 rounded-xl"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-auto">

          <div className="grid md:grid-cols-4 gap-5 mb-8">

            <div className="bg-blue-50 rounded-3xl p-5">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-blue-700">
                    Quantity
                  </p>

                  <h2 className="text-2xl font-bold mt-2">
                    {formData.quantity || 0}
                  </h2>
                </div>

                <Package className="text-blue-600" />
              </div>
            </div>

            <div className="bg-orange-50 rounded-3xl p-5">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-orange-700">
                    In / Out
                  </p>

                  <h2 className="text-2xl font-bold mt-2">
                    {formData.inOut || "-"}
                  </h2>
                </div>

                <Truck className="text-orange-600" />
              </div>
            </div>

            <div className="bg-green-50 rounded-3xl p-5">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-green-700">
                    Amount
                  </p>

                  <h2 className="text-2xl font-bold mt-2">
                    ₹ {Number(formData.amount || 0).toLocaleString("en-IN")}
                  </h2>
                </div>

                <IndianRupee className="text-green-600" />
              </div>
            </div>

            <div className="bg-purple-50 rounded-3xl p-5">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-purple-700">
                    Document
                  </p>

                  <h2 className="text-lg font-bold mt-2">
                    {formData.documentNo || "-"}
                  </h2>
                </div>

                <FileText className="text-purple-600" />
              </div>
            </div>

          </div>

          <div className="grid md:grid-cols-3 gap-5">

            <div>
              <label className="block mb-2 font-medium">
                Item Name
              </label>

              <input
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                disabled={isView}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Quantity
              </label>

              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                disabled={isView}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                UOM
              </label>

              <input
                name="uom"
                value={formData.uom}
                onChange={handleChange}
                disabled={isView}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Rate
              </label>

              <input
                type="number"
                name="rate"
                value={formData.rate}
                onChange={handleChange}
                disabled={isView}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Amount
              </label>

              <input
                type="number"
                name="amount"
                value={formData.amount}
                disabled
                className={`${inputClass} bg-gray-100`}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Project Name
              </label>

              <input
                name="projectName"
                value={formData.projectName}
                onChange={handleChange}
                disabled={isView}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Vendor Name
              </label>

              <input
                name="vendorName"
                value={formData.vendorName}
                onChange={handleChange}
                disabled={isView}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Document No
              </label>

              <input
                name="documentNo"
                value={formData.documentNo}
                onChange={handleChange}
                disabled={isView}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                In / Out
              </label>

              <select
                name="inOut"
                value={formData.inOut}
                onChange={handleChange}
                disabled={isView}
                className={inputClass}
              >
                <option value="">Select</option>
                <option value="In">In</option>
                <option value="Out">Out</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block mb-2 font-medium">
                Remarks
              </label>

              <textarea
                rows={4}
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                disabled={isView}
                className={inputClass}
              />
            </div>

          </div>

        </div>

        <div className="flex justify-end gap-3 px-6 py-5 border-t bg-gray-50">

          <button
            onClick={onClose}
            className="px-5 py-3 rounded-2xl border hover:bg-gray-100"
          >
            Close
          </button>

          {isEdit && (
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="px-6 py-3 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
            >
              <Save size={18} />

              {loading ? "Updating..." : "Update Record"}
            </button>
          )}

        </div>

      </div>

    </div>
  );
}