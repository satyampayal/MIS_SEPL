import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Upload,
  Pencil,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import BASE_URL from "../../config/api";


export default function BOQDetailPage() {
  const navigate = useNavigate();
  const { boqId } = useParams();

  const [boq, setBoq] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [excelFile, setExcelFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [showItemModal, setShowItemModal] = useState(false);
  const [mode, setMode] = useState("add");
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({
    itemCode: "",
    boqSrNo: "",
    description: "",
    generalName: "",
    uom: "",
    boqQty: "",
    supplyRate: "",
    installationRate: "",
    category: "",
    subCategory: "",
    remarks: "",
  });

  const fetchBOQDetails = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/boq/${boqId}`);
      const data = await res.json();

      if (data.success) {
        setBoq(data.boq);
        setItems(data.items || []);
      } else {
        toast.error(data.message || "Failed to fetch BOQ details");
      }
    } catch (error) {
      toast.error("Server error while fetching BOQ details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBOQDetails();
  }, [boqId]);

  const resetForm = () => {
    setFormData({
      itemCode: "",
      boqSrNo: "",
      description: "",
      generalName: "",
      uom: "",
      boqQty: "",
      supplyRate: "",
      installationRate: "",
      category: "",
      subCategory: "",
      remarks: "",
    });
    setSelectedItem(null);
    setMode("add");
  };

  const openAddModal = () => {
    resetForm();
    setMode("add");
    setShowItemModal(true);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setMode("edit");

    setFormData({
      itemCode: item.itemCode || "",
      boqSrNo: item.boqSrNo || "",
      description: item.description || "",
      generalName: item.generalName || "",
      uom: item.uom || "",
      boqQty: item.boqQty || "",
      supplyRate: item.supplyRate || "",
      installationRate: item.installationRate || "",
      category: item.category || "",
      subCategory: item.subCategory || "",
      remarks: item.remarks || "",
    });

    setShowItemModal(true);
  };

  const handleSaveItem = async () => {
    try {
      if (!formData.description.trim()) {
        toast.error("Description is required");
        return;
      }

      const url =
        mode === "add"
          ? `${BASE_URL}/boq/${boqId}/item`
          : `${BASE_URL}/boq/item/${selectedItem._id}`;

      const method = mode === "add" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          mode === "add"
            ? "BOQ item added successfully"
            : "BOQ item updated successfully"
        );
        setShowItemModal(false);
        resetForm();
        fetchBOQDetails();
      } else {
        toast.error(data.message || "Failed to save BOQ item");
      }
    } catch (error) {
      toast.error("Server error while saving BOQ item");
    }
  };

  const handleDeleteItem = async (itemId) => {
    const confirmDelete = window.confirm("Delete this BOQ item?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${BASE_URL}/boq/item/${itemId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        toast.success("BOQ item deleted");
        fetchBOQDetails();
      } else {
        toast.error(data.message || "Failed to delete item");
      }
    } catch (error) {
      toast.error("Server error while deleting item");
    }
  };

  const handleUploadExcel = async () => {
    try {
      if (!excelFile) {
        toast.error("Please select BOQ Excel file");
        return;
      }

      const form = new FormData();
      form.append("excelFile", excelFile);

      setUploading(true);

      const res = await fetch(
        `${BASE_URL}/boq/${boqId}/upload-excel`,
        {
          method: "POST",
          body: form,
        }
      );

      const data = await res.json();

      if (data.success) {
        toast.success(`Excel imported: ${data.importedItems} items`);
        setExcelFile(null);
        fetchBOQDetails();
      } else {
        toast.error(data.message || "Failed to import Excel");
      }
    } catch (error) {
      toast.error("Server error while uploading Excel");
    } finally {
      setUploading(false);
    }
  };

  const totalInstallationAmount = items.reduce(
    (sum, item) => sum + (Number(item.totalInstallationAmount) || 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm border p-5 mb-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {boq?.boqName || "BOQ Details"}
              </h1>
              <p className="text-sm text-slate-500">
                Type: {boq?.boqType || "-"} | Rev-{boq?.revisionNo ?? 0}
              </p>
              <p className="text-sm text-slate-500">
                Project:{" "}
                {boq?.projectRef?.name ||
                  boq?.projectRef?.siteName ||
                  "-"}
              </p>
              <p className="text-sm text-slate-500">
                Contractor:{" "}
                {boq?.contractorRef?.contractorName ||
                  boq?.contractorRef?.name ||
                  "-"}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={openAddModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-2 hover:bg-blue-700"
              >
                <Plus size={18} />
                Add Item
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-5 mb-5">
          <h2 className="font-semibold text-slate-800 mb-3">Upload BOQ Excel</h2>

          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setExcelFile(e.target.files[0])}
              className="border rounded-xl px-3 py-2 bg-white flex-1"
            />

            <button
              onClick={handleUploadExcel}
              disabled={uploading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Upload size={18} />
              )}
              Upload Excel
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-2">
            Excel columns should be: Item Code, BOQ Sr. No, Description, General
            Name, UOM, PO Qty, Supply Rate, Contractor Installation Rate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div className="bg-white border rounded-2xl p-4">
            <p className="text-sm text-slate-500">Total Items</p>
            <h3 className="text-2xl font-bold">{items.length}</h3>
          </div>

          <div className="bg-white border rounded-2xl p-4">
            <p className="text-sm text-slate-500">Installation Amount</p>
            <h3 className="text-2xl font-bold">
              ₹{totalInstallationAmount.toLocaleString("en-IN")}
            </h3>
          </div>

          <div className="bg-white border rounded-2xl p-4">
            <p className="text-sm text-slate-500">Status</p>
            <h3 className="text-2xl font-bold">{boq?.status || "-"}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3 text-left">Sr</th>
                <th className="p-3 text-left">General Name</th>
                <th className="p-3 text-left">Original Description</th>
                <th className="p-3 text-left">UOM</th>
                <th className="p-3 text-right">Qty</th>
                <th className="p-3 text-right">Supply Rate</th>
                <th className="p-3 text-right">Inst. Rate</th>
                <th className="p-3 text-right">Inst. Amount</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-6 text-center text-slate-500">
                    Loading BOQ items...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-6 text-center text-slate-500">
                    No BOQ items found. Add manually or upload Excel.
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={item._id} className="border-t hover:bg-slate-50">
                    <td className="p-3">{item.boqSrNo || index + 1}</td>

                    <td className="p-3 font-medium text-slate-800">
                      {item.generalName || "-"}
                    </td>

                    <td className="p-3 max-w-md">
                      <div className="line-clamp-2">{item.description}</div>
                    </td>

                    <td className="p-3">{item.uom || "-"}</td>

                    <td className="p-3 text-right">
                      {item.qtyText || item.boqQty || 0}
                    </td>

                    <td className="p-3 text-right">
                      ₹{Number(item.supplyRate || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="p-3 text-right">
                      ₹
                      {Number(item.installationRate || 0).toLocaleString(
                        "en-IN"
                      )}
                    </td>

                    <td className="p-3 text-right font-semibold">
                      ₹
                      {Number(
                        item.totalInstallationAmount || 0
                      ).toLocaleString("en-IN")}
                    </td>

                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showItemModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b p-5">
              <h2 className="text-xl font-bold">
                {mode === "add" ? "Add BOQ Item" : "Edit BOQ Item"}
              </h2>

              <button
                onClick={() => setShowItemModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Item Code"
                value={formData.itemCode}
                onChange={(e) =>
                  setFormData({ ...formData, itemCode: e.target.value })
                }
                className="border rounded-xl px-3 py-2"
              />

              <input
                placeholder="BOQ Sr No"
                value={formData.boqSrNo}
                onChange={(e) =>
                  setFormData({ ...formData, boqSrNo: e.target.value })
                }
                className="border rounded-xl px-3 py-2"
              />

              <input
                placeholder="General Name"
                value={formData.generalName}
                onChange={(e) =>
                  setFormData({ ...formData, generalName: e.target.value })
                }
                className="border rounded-xl px-3 py-2 md:col-span-2"
              />

              <textarea
                placeholder="Original Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="border rounded-xl px-3 py-2 md:col-span-2"
                rows="4"
              />

              <input
                placeholder="UOM"
                value={formData.uom}
                onChange={(e) =>
                  setFormData({ ...formData, uom: e.target.value })
                }
                className="border rounded-xl px-3 py-2"
              />

              <input
                type="number"
                placeholder="BOQ Qty"
                value={formData.boqQty}
                onChange={(e) =>
                  setFormData({ ...formData, boqQty: e.target.value })
                }
                className="border rounded-xl px-3 py-2"
              />

              <input
                type="number"
                placeholder="Supply Rate"
                value={formData.supplyRate}
                onChange={(e) =>
                  setFormData({ ...formData, supplyRate: e.target.value })
                }
                className="border rounded-xl px-3 py-2"
              />

              <input
                type="number"
                placeholder="Installation Rate"
                value={formData.installationRate}
                onChange={(e) =>
                  setFormData({ ...formData, installationRate: e.target.value })
                }
                className="border rounded-xl px-3 py-2"
              />

              <input
                placeholder="Category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="border rounded-xl px-3 py-2"
              />

              <input
                placeholder="Sub Category"
                value={formData.subCategory}
                onChange={(e) =>
                  setFormData({ ...formData, subCategory: e.target.value })
                }
                className="border rounded-xl px-3 py-2"
              />

              <textarea
                placeholder="Remarks"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                className="border rounded-xl px-3 py-2 md:col-span-2"
                rows="3"
              />
            </div>

            <div className="flex justify-end gap-3 border-t p-5">
              <button
                onClick={() => setShowItemModal(false)}
                className="px-4 py-2 rounded-xl border"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveItem}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              >
                {mode === "add" ? "Add Item" : "Update Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}