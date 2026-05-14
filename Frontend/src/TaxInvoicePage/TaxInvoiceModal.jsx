import React, { useEffect, useState } from "react";
import { X, UploadCloud, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { projectSiteList, vendorList } from "../Constant";
import BASE_URL from "../../config/api";

const initialForm = {
  invoiceNumber: "",
  invoiceDate: "",
  vendorName: "",
  invoiceAmount: "",
  projectSite: "",
  deliveryStatus: "",
  challanNumber: "",
  challanDate: "",
  quantitySent: "",
  quantityReceived: "",
  remarks: "",
  invoiceFile: null,
  challanFile: null
};

export default function TaxInvoiceModal({
  isOpen,
  onClose,
  mode,
  invoice,
  refreshInvoices
}) {
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isAdd = mode === "add";

  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (invoice) {
      setFormData({
        invoiceNumber: invoice.invoiceNumber || "",
        invoiceDate: invoice.invoiceDate
          ? invoice.invoiceDate.substring(0, 10)
          : "",
        vendorName: invoice.vendorName || "",
        invoiceAmount: invoice.invoiceAmount || "",
        projectSite: invoice.projectSite || "",
        deliveryStatus: invoice.deliveryStatus || "",
        challanNumber: invoice.challanNumber || "",
        challanDate: invoice.challanDate
          ? invoice.challanDate.substring(0, 10)
          : "",
        quantitySent: invoice.quantitySent || "",
        quantityReceived: invoice.quantityReceived || "",
        remarks: invoice.remarks || "",
        invoiceFile: null,
        challanFile: null
      });
    } else {
      setFormData(initialForm);
    }
  }, [invoice, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const validateForm = () => {
    if (!formData.invoiceNumber.trim()) {
      toast.error("Invoice number is required");
      return false;
    }

    if (!formData.invoiceDate) {
      toast.error("Invoice date is required");
      return false;
    }

    if (!formData.vendorName) {
      toast.error("Vendor name is required");
      return false;
    }

    if (!formData.invoiceAmount) {
      toast.error("Invoice amount is required");
      return false;
    }

    if (!formData.projectSite) {
      toast.error("Project site is required");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (isView) return;

    if (!validateForm()) return;

    try {
      setLoading(true);

      const loadingToast = toast.loading(
        isEdit ? "Updating invoice..." : "Adding invoice..."
      );

      const form = new FormData();

      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== "") {
          form.append(key, formData[key]);
        }
      });

      const url = isEdit
        ? `${BASE_URL}/tax-invoice/update/${invoice._id}`
        : `${BASE_URL}/tax-invoice/create`;

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: form
      });

      const data = await res.json();

      toast.dismiss(loadingToast);

      if (data.success) {
        toast.success(
          isEdit
            ? "Tax invoice updated successfully"
            : "Tax invoice added successfully"
        );

        refreshInvoices();
        onClose();
      } else {
        toast.error(data.message || "Operation failed");
      }
    } catch (error) {
      console.log(error);
      toast.error("Server error while saving invoice");
    } finally {
      setLoading(false);
    }
  };

  const materialDifference =
    Number(formData.quantitySent || 0) !==
    Number(formData.quantityReceived || 0)
      ? "Difference Found"
      : "No Difference";

  return (
<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">

  <div className="relative bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-gray-200 animate-fadeIn max-h-[95vh] overflow-y-auto">

    {/* Header */}
        <div className="flex justify-between items-center border-b px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold">
              {isAdd && "Add Tax Invoice"}
              {isEdit && "Edit Tax Invoice"}
              {isView && "View Tax Invoice"}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Tax invoice register details
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Invoice Number *"
            name="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={handleChange}
            disabled={isView}
          />

          <Input
            label="Invoice Date *"
            name="invoiceDate"
            type="date"
            value={formData.invoiceDate}
            onChange={handleChange}
            disabled={isView}
          />

          <Select
            label="Vendor Name *"
            name="vendorName"
            value={formData.vendorName}
            onChange={handleChange}
            disabled={isView}
            options={vendorList}
            placeholder="Select Vendor"
          />

          <Input
            label="Invoice Amount *"
            name="invoiceAmount"
            type="number"
            value={formData.invoiceAmount}
            onChange={handleChange}
            disabled={isView}
          />

          <Select
            label="Project Site *"
            name="projectSite"
            value={formData.projectSite}
            onChange={handleChange}
            disabled={isView}
            options={projectSiteList}
            placeholder="Select Project Site"
          />

          <Select
            label="Delivery Status"
            name="deliveryStatus"
            value={formData.deliveryStatus}
            onChange={handleChange}
            disabled={isView}
            options={["delivered", "pending", "partial"]}
            placeholder="Select Delivery Status"
          />

          <Input
            label="Challan Number"
            name="challanNumber"
            value={formData.challanNumber}
            onChange={handleChange}
            disabled={isView}
          />

          <Input
            label="Challan Date"
            name="challanDate"
            type="date"
            value={formData.challanDate}
            onChange={handleChange}
            disabled={isView}
          />

          <Input
            label="Quantity Sent"
            name="quantitySent"
            type="number"
            value={formData.quantitySent}
            onChange={handleChange}
            disabled={isView}
          />

          <Input
            label="Quantity Received"
            name="quantityReceived"
            type="number"
            value={formData.quantityReceived}
            onChange={handleChange}
            disabled={isView}
          />

          <div>
            <label className="block mb-2 font-medium">
              Material Difference
            </label>

            <div
              className={`w-full rounded-xl px-4 py-3 font-semibold ${
                materialDifference === "Difference Found"
                  ? "bg-red-100 text-red-600"
                  : "bg-green-100 text-green-600"
              }`}
            >
              {materialDifference}
            </div>
          </div>

          <Textarea
            label="Remarks"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            disabled={isView}
          />

          {!isView && (
            <>
              <FileInput
                label="Invoice File"
                name="invoiceFile"
                onChange={handleChange}
                selectedFile={formData.invoiceFile}
              />

              <FileInput
                label="Challan File"
                name="challanFile"
                onChange={handleChange}
                selectedFile={formData.challanFile}
              />
            </>
          )}

          {isView && (
            <div className="md:col-span-2 border-t pt-5">
              <h3 className="font-semibold mb-3 text-lg">Documents</h3>

              <div className="flex gap-4 flex-wrap">
                {invoice?.invoiceFile ? (
                  <button
                    onClick={() => window.open(invoice.invoiceFile, "_blank")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                  >
                    View Tax Invoice
                  </button>
                ) : (
                  <p className="text-gray-500">No Invoice File</p>
                )}

                {invoice?.challanFile ? (
                  <button
                    onClick={() => window.open(invoice.challanFile, "_blank")}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg"
                  >
                    View Challan
                  </button>
                ) : (
                  <p className="text-gray-500">No Challan File</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-5 border-t">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-3 rounded-xl border hover:bg-gray-50"
          >
            Close
          </button>

          {!isView && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-blue-600 text-white font-medium disabled:bg-gray-400 flex items-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {isEdit ? "Update Invoice" : "Save Invoice"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
  disabled = false
}) {
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

function Select({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  disabled = false
}) {
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
        <option value="">{placeholder}</option>

        {options.map((item, index) => (
          <option key={index} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}

function Textarea({ label, name, value, onChange, disabled = false }) {
  return (
    <div>
      <label className="block mb-2 font-medium">{label}</label>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows="3"
        className="w-full border rounded-xl px-4 py-3 disabled:bg-gray-100"
      />
    </div>
  );
}

function FileInput({ label, name, onChange, selectedFile }) {
  return (
    <div>
      <label className="block mb-2 font-medium">{label}</label>

      <label className="border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
        <UploadCloud size={28} className="text-gray-400 mb-2" />

        <p className="text-gray-500 text-sm">
          Click to upload {label}
        </p>

        <input
          type="file"
          name={name}
          onChange={onChange}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
        />
      </label>

      {selectedFile && (
        <p className="text-sm text-green-600 mt-2">
          {selectedFile.name}
        </p>
      )}
    </div>
  );
}