import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Save,
  Package,
  Truck,
  FileText,
  IndianRupee,
  Building2,
  CalendarDays,
  Hash,
  Layers,
} from "lucide-react";

import toast from "react-hot-toast";
import BASE_URL from "../../config/api";

const getProjectDirection = (typeOfTransit) => {
  const type = String(typeOfTransit || "").toUpperCase();

  if (["DDC", "DC", "LPN"].includes(type)) return "In";
  if (["MRS"].includes(type)) return "Out";

  return "";
};

const directionClass = (direction) => {
  if (direction === "In") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (direction === "Out") return "bg-red-500/10 text-red-400 border-red-500/20";
  return "bg-slate-500/10 text-slate-400 border-slate-700";
};

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
    documentName: "",
    documentDate: "",
    invoiceNumber: "",
    invoiceDate: "",
    inOut: "",
    typeOfTransit: "",
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
        documentName: selectedRecord.documentName || "",
        documentDate: selectedRecord.documentDate
          ? selectedRecord.documentDate.split("T")[0]
          : "",
        invoiceNumber: selectedRecord.invoiceNumber || "",
        invoiceDate: selectedRecord.invoiceDate
          ? selectedRecord.invoiceDate.split("T")[0]
          : "",
        inOut: selectedRecord.inOut || "",
        typeOfTransit: selectedRecord.typeOfTransit || "",
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

  const projectDirection = useMemo(
    () => getProjectDirection(formData.typeOfTransit),
    [formData.typeOfTransit]
  );

  if (!isOpen || !selectedRecord) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      if (name === "quantity" || name === "rate") {
        updated.amount =
          Number(updated.quantity || 0) * Number(updated.rate || 0);
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
    "bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 w-full text-sm text-white outline-none focus:border-blue-500 disabled:opacity-70 disabled:cursor-not-allowed";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative bg-slate-950 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-800 max-h-[94vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900">
          <div>
            <p className="text-sm text-blue-400 font-semibold">
              Material Movement
            </p>
            <h2 className="text-xl font-bold text-white">
              {isView ? "View Material Record" : "Edit Material Record"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="hover:bg-slate-800 p-2 rounded-xl text-slate-300"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-5 max-h-[74vh] overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
            <Stat
              icon={Package}
              title="Quantity"
              value={`${formData.quantity || 0} ${formData.uom || ""}`}
            />

            <Stat
              icon={Truck}
              title="Project Direction"
              value={projectDirection || "-"}
              badgeClass={directionClass(projectDirection)}
            />

            <Stat
              icon={IndianRupee}
              title="Amount"
              value={`₹ ${Number(formData.amount || 0).toLocaleString("en-IN")}`}
            />

            <Stat
              icon={FileText}
              title="Document"
              value={formData.documentName || formData.documentNo || "-"}
            />

            <Stat
              icon={Layers}
              title="Transit"
              value={formData.typeOfTransit || "-"}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Input label="Item Name" name="itemName" value={formData.itemName} onChange={handleChange} disabled={isView} className={inputClass} />

            <Input type="number" label="Quantity" name="quantity" value={formData.quantity} onChange={handleChange} disabled={isView} className={inputClass} />

            <Input label="UOM" name="uom" value={formData.uom} onChange={handleChange} disabled={isView} className={inputClass} />

            <Input type="number" label="Rate" name="rate" value={formData.rate} onChange={handleChange} disabled={isView} className={inputClass} />

            <Input type="number" label="Amount" name="amount" value={formData.amount} disabled className={`${inputClass} bg-slate-900`} />

            <div>
              <label className="block mb-1.5 text-sm text-slate-300">
                Type of Transit
              </label>
              <select
                name="typeOfTransit"
                value={formData.typeOfTransit}
                onChange={handleChange}
                disabled={isView}
                className={inputClass}
              >
                <option value="">Select</option>
                <option value="DDC">DDC</option>
                <option value="DC">DC</option>
                <option value="LPN">LPN</option>
                <option value="MRS">MRS</option>
                <option value="MRN">MRN</option>
                <option value="In">In</option>
                <option value="Out">Out</option>
                <option value="Return">Return</option>
                <option value="Transfer">Transfer</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Project direction is calculated from this field.
              </p>
            </div>

            <Input label="Project Name" name="projectName" value={formData.projectName} onChange={handleChange} disabled={isView} className={inputClass} />

            <Input label="Vendor Name" name="vendorName" value={formData.vendorName} onChange={handleChange} disabled={isView} className={inputClass} />

            <Input label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} disabled={isView} className={inputClass} />

            <Input label="Document No" name="documentNo" value={formData.documentNo} onChange={handleChange} disabled={isView} className={inputClass} />

            <Input label="Document Name" name="documentName" value={formData.documentName} onChange={handleChange} disabled={isView} className={inputClass} />

            <Input type="date" label="Document Date" name="documentDate" value={formData.documentDate} onChange={handleChange} disabled={isView} className={inputClass} />

            <Input label="Invoice Number" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} disabled={isView} className={inputClass} />

            <Input type="date" label="Invoice Date" name="invoiceDate" value={formData.invoiceDate} onChange={handleChange} disabled={isView} className={inputClass} />

            <div>
              <label className="block mb-1.5 text-sm text-slate-300">
                Stored In / Out
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
              <p className="text-[11px] text-slate-500 mt-1">
                Old stored value. Reports should prefer transit logic.
              </p>
            </div>

            <Input label="Category" name="category" value={formData.category} onChange={handleChange} disabled={isView} className={inputClass} />

            <Input label="Commodity" name="commodity" value={formData.commodity} onChange={handleChange} disabled={isView} className={inputClass} />

            <Input label="MEP Head" name="mepHead" value={formData.mepHead} onChange={handleChange} disabled={isView} className={inputClass} />

            <Input label="HSN Code" name="hsnCode" value={formData.hsnCode} onChange={handleChange} disabled={isView} className={inputClass} />

            <Input label="BOQ No" name="boqNo" value={formData.boqNo} onChange={handleChange} disabled={isView} className={inputClass} />

            <Input label="Transport Name" name="transportName" value={formData.transportName} onChange={handleChange} disabled={isView} className={inputClass} />

            <Input label="Vehicle Number" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} disabled={isView} className={inputClass} />

            <div className="md:col-span-3">
              <label className="block mb-1.5 text-sm text-slate-300">
                Remarks
              </label>

              <textarea
                rows={3}
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                disabled={isView}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-800 bg-slate-900">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Close
          </button>

          {isEdit && (
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60"
            >
              <Save size={17} />
              {loading ? "Updating..." : "Update Record"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, title, value, badgeClass }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-slate-400 text-xs">{title}</p>
          {badgeClass ? (
            <span className={`inline-block mt-2 px-2 py-1 rounded-full border text-xs font-semibold ${badgeClass}`}>
              {value}
            </span>
          ) : (
            <h3 className="text-sm font-bold mt-2 line-clamp-2">{value}</h3>
          )}
        </div>
        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Icon className="text-blue-400" size={18} />
        </div>
      </div>
    </div>
  );
}

function Input({ label, className, ...props }) {
  return (
    <div>
      <label className="block mb-1.5 text-sm text-slate-300">
        {label}
      </label>
      <input {...props} className={className} />
    </div>
  );
}