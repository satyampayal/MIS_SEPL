import React, { useEffect, useState } from "react";
import { X, UploadCloud, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
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
  challanFile: null,
  typeOfChallan: "DDC",
};

export default function TaxInvoiceModal({
  isOpen,
  onClose,
  mode,
  invoice,
  refreshInvoices,
}) {
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isAdd = mode === "add";

  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [partys, setPartys] = useState([]);
  const [projects, setProjects] = useState([]);

  const token = localStorage.getItem("token");

  const fetchPartys = async () => {
    try {
      const res = await fetch(`${BASE_URL}/party/search?type=Vendor&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPartys(data.data || []);
    } catch (error) {
      console.error("Error fetching parties:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${BASE_URL}/project-master/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      const uniqueProjects = Array.from(
        new Set((data.data || []).map((project) => project.name))
      ).map((name) => {
        return data.data.find((project) => project.name === name);
      });

      setProjects(uniqueProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    fetchPartys();
    fetchProjects();

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
        challanFile: null,
        typeOfChallan: invoice.typeOfChallan || "DDC",
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
      [name]: files ? files[0] : value,
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
          Authorization: `Bearer ${token}`,
        },
        body: form,
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative bg-slate-900 text-slate-100 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-700 animate-fadeIn max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex justify-between items-center border-b border-slate-800 bg-slate-900 px-6 py-5 rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {isAdd && "Add Tax Invoice"}
              {isEdit && "Edit Tax Invoice"}
              {isView && "View Tax Invoice"}
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Tax invoice register details
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Invoice Number *" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} disabled={isView} />

          <Input label="Invoice Date *" name="invoiceDate" type="date" value={formData.invoiceDate} onChange={handleChange} disabled={isView} />

          <Select label="Vendor Name *" name="vendorName" value={formData.vendorName} onChange={handleChange} disabled={isView} options={partys} placeholder="Select Vendor" />

          <Input label="Invoice Amount *" name="invoiceAmount" type="number" value={formData.invoiceAmount} onChange={handleChange} disabled={isView} />

          <Select label="Project Site *" name="projectSite" value={formData.projectSite} onChange={handleChange} disabled={isView} options={projects} placeholder="Select Project Site" />

          <Select label="Type of Challan" name="typeOfChallan" value={formData.typeOfChallan} onChange={handleChange} disabled={isView} options={["DDC", "DC", "MRN", "LPN"]} placeholder="Select Type Of Challan" />

          <Select label="Delivery Status" name="deliveryStatus" value={formData.deliveryStatus} onChange={handleChange} disabled={isView} options={["Delivered", "Pending", "Partial"]} placeholder="Select Delivery Status" />

          <Input label="Challan Number" name="challanNumber" value={formData.challanNumber} onChange={handleChange} disabled={isView} />

          <Input label="Challan Date" name="challanDate" type="date" value={formData.challanDate} onChange={handleChange} disabled={isView} />

          <Input label="Quantity Sent" name="quantitySent" type="number" value={formData.quantitySent} onChange={handleChange} disabled={isView} />

          <Input label="Quantity Received" name="quantityReceived" type="number" value={formData.quantityReceived} onChange={handleChange} disabled={isView} />

          <div>
            <label className="block mb-2 font-medium text-slate-300">
              Material Difference
            </label>

            <div
              className={`w-full rounded-xl px-4 py-3 font-semibold border ${
                materialDifference === "Difference Found"
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}
            >
              {materialDifference}
            </div>
          </div>

          <Textarea label="Remarks" name="remarks" value={formData.remarks} onChange={handleChange} disabled={isView} />

          {!isView && (
            <>
              <FileInput label="Invoice File" name="invoiceFile" onChange={handleChange} selectedFile={formData.invoiceFile} />

              <FileInput label="Challan File" name="challanFile" onChange={handleChange} selectedFile={formData.challanFile} />
            </>
          )}

          {isView && (
            <div className="md:col-span-2 border-t border-slate-800 pt-5">
              <h3 className="font-semibold mb-3 text-lg text-white">
                Documents
              </h3>

              <div className="flex gap-4 flex-wrap">
                {invoice?.invoiceFile ? (
                  <button
                    onClick={() => window.open(invoice.invoiceFile, "_blank")}
                    className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-lg hover:bg-cyan-400"
                  >
                    View Tax Invoice
                  </button>
                ) : (
                  <p className="text-slate-500">No Invoice File</p>
                )}

                {invoice?.challanFile ? (
                  <button
                    onClick={() => window.open(invoice.challanFile, "_blank")}
                    className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-400"
                  >
                    View Challan
                  </button>
                ) : (
                  <p className="text-slate-500">No Challan File</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-slate-900 flex justify-end gap-3 px-6 py-5 border-t border-slate-800 rounded-b-3xl">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300"
          >
            Close
          </button>

          {!isView && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold disabled:bg-slate-600 disabled:text-slate-300 flex items-center gap-2 hover:bg-cyan-400"
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

function Input({ label, name, value, onChange, type = "text", disabled = false }) {
  return (
    <div>
      <label className="block mb-2 font-medium text-slate-300">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-cyan-400 disabled:bg-slate-800 disabled:text-slate-500"
      />
    </div>
  );
}

function Select({ label, name, value, onChange, options, placeholder, disabled = false }) {
  return (
    <div>
      <label className="block mb-2 font-medium text-slate-300">{label}</label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-cyan-400 disabled:bg-slate-800 disabled:text-slate-500"
      >
        <option value="">{placeholder}</option>

        {options.map((item) => (
          <option key={item._id || item} value={item.partyName || item.name || item}>
            {item.partyName || item.name || item}
          </option>
        ))}
      </select>
    </div>
  );
}

function Textarea({ label, name, value, onChange, disabled = false }) {
  return (
    <div>
      <label className="block mb-2 font-medium text-slate-300">{label}</label>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows="3"
        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 resize-none"
      />
    </div>
  );
}

function FileInput({ label, name, onChange, selectedFile }) {
  return (
    <div>
      <label className="block mb-2 font-medium text-slate-300">{label}</label>

      <label className="border-2 border-dashed border-slate-700 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/60 transition">
        <UploadCloud size={28} className="text-cyan-400 mb-2" />

        <p className="text-slate-400 text-sm">Click to upload {label}</p>

        <input
          type="file"
          name={name}
          onChange={onChange}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
        />
      </label>

      {selectedFile && (
        <p className="text-sm text-emerald-400 mt-2">{selectedFile.name}</p>
      )}
    </div>
  );
}