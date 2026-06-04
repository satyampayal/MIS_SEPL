import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Upload,
  Loader2,
  PackageSearch,
  RefreshCcw,
  X,
} from "lucide-react";
import BASE_URL from "../../config/api";

const API_URL = `${BASE_URL}/item-identity`;

const pageSize = 10;

const emptyForm = {
  itemName: "",
  itemCode: "",
  category: "",
  subCategory: "",
  unit: "Nos",
  hsnCode: "",
  description: "",
  specification: "",
  brand: "",
  make: "",
  gstPercentage: 0,
  minimumStockLevel: 0,
  reorderLevel: 0,
  remarks: "",
};

export default function ItemIdentityPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("add");
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [excelFile, setExcelFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  // const [totalItems,setTotalItems]=useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");


  const fetchItems = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_URL}/all`, {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search,
          category:
            categoryFilter === "All"
              ? ""
              : categoryFilter,
        },
      });

      setItems(res.data.data || []);
      setTotalRecords(res.data.pagination?.totalRecords || 0);

      // setTotalItems(res.data.data.totalItems ||0);

      setTotalPages(
        res.data.pagination?.totalPages || 1
      );
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        "Failed to load items"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [currentPage, search, categoryFilter, itemsPerPage]);

  const categories = useMemo(() => {
    return ["All", ...new Set(items.map((i) => i.category).filter(Boolean))];
  }, [items]);

  const filteredItems = useMemo(() => {
    const keyword = search.toLowerCase();

    return items.filter((item) => {
      const text = [
        item.itemName,
        item.itemCode,
        item.category,
        item.subCategory,
        item.hsnCode,
        item.brand,
        item.make,
        item.specification,
      ]
        .join(" ")
        .toLowerCase();

      const matchSearch = text.includes(keyword);
      const matchCategory =
        categoryFilter === "All" || item.category === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [items, search, categoryFilter]);

  // const totalPages = Math.max(
  //   1,
  //   Math.ceil(filteredItems.length / itemsPerPage)
  // );

  // const paginatedItems = useMemo(() => {
  //   const startIndex = (currentPage - 1) * itemsPerPage;
  //   return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  // }, [filteredItems, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter]);

  const openAdd = () => {
    setMode("add");
    setSelectedId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setMode("edit");
    setSelectedId(item._id);
    setForm({
      itemName: item.itemName || "",
      itemCode: item.itemCode || "",
      category: item.category || "",
      subCategory: item.subCategory || "",
      unit: item.unit || "Nos",
      hsnCode: item.hsnCode || "",
      description: item.description || "",
      specification: item.specification || "",
      brand: item.brand || "",
      make: item.make || "",
      gstPercentage: item.gstPercentage || 0,
      minimumStockLevel: item.minimumStockLevel || 0,
      reorderLevel: item.reorderLevel || 0,
      remarks: item.remarks || "",
    });
    setModalOpen(true);
  };

  const saveItem = async () => {
    if (!form.itemName.trim() || !form.itemCode.trim()) {
      toast.error("Item name and item code are required");
      return;
    }

    try {
      setSaving(true);

      if (mode === "edit") {
        await axios.put(`${API_URL}/update/${selectedId}`, form);
        toast.success("Item updated successfully");
      } else {
        await axios.post(`${API_URL}/add`, form);
        toast.success("Item created successfully");
      }

      setModalOpen(false);
      fetchItems();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this item identity?")) return;

    try {
      await axios.delete(`${API_URL}/delete/${id}`);
      toast.success("Item deleted successfully");
      fetchItems();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete item");
    }
  };

  const uploadExcel = async () => {
    if (!excelFile) {
      toast.error("Select Excel file first");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadStage("Preparing file...");

      const data = new FormData();
      data.append("excelFile", excelFile);

      const res = await axios.post(`${API_URL}/bulk-upload`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },

        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;

          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );

          setUploadProgress(percent);

          if (percent < 100) {
            setUploadStage("Uploading file...");
          } else {
            setUploadStage("Processing Excel on server...");
          }
        },
      });

      toast.success(
        `Uploaded: ${res.data.insertedCount || 0}, Skipped: ${res.data.skippedCount || 0
        }`
      );

      setExcelFile(null);
      setUploadStage("Refreshing item list...");
      await fetchItems();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Excel upload failed");
    } finally {
      setUploading(false);

      setTimeout(() => {
        setUploadProgress(0);
        setUploadStage("");
      }, 800);
    }
  };

  function TableSkeleton({ rows = 8, columns = 9 }) {
    return (
      <>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <tr key={rowIndex} className="animate-pulse border-b border-slate-800">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <td key={colIndex} className="px-5 py-4">
                <div
                  className={`h-4 rounded bg-slate-800 ${colIndex === 0 ? "w-48" : "w-24"
                    }`}
                />
              </td>
            ))}
          </tr>
        ))}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5 shadow-xl shadow-slate-950/40 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                <PackageSearch size={14} />
                Item Master Foundation
              </div>

              <h1 className="mt-3 text-2xl font-bold text-white md:text-3xl">
                Item Identity Master
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-slate-400">
                Create unique item identities before stock, challan, BOQ and site
                movement. One item code, one truth.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={fetchItems}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <RefreshCcw size={17} />
                Refresh
              </button>

              <button
                onClick={openAdd}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400"
              >
                <Plus size={18} />
                Add Item
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search item, code, HSN, brand..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-cyan-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
            >
              {categories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300"
              />
              <button
                onClick={uploadExcel}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin" size={17} />
                    {uploadProgress < 100 ? `${uploadProgress}%` : "Processing..."}
                  </>
                ) : (
                  <>
                    <Upload size={17} />
                    Upload
                  </>
                )}
              </button>

            </div>
            {uploading && (
              <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 md:col-span-3">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-cyan-300">{uploadStage}</span>
                  <span className="font-bold text-cyan-300">{uploadProgress}%</span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-cyan-400 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>

                {uploadProgress === 100 && (
                  <p className="mt-2 text-xs text-slate-400">
                    File uploaded. Server is reading Excel and inserting records...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-slate-950 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4 text-left">Item</th>
                  <th className="px-5 py-4 text-left">Code</th>
                  <th className="px-5 py-4 text-left">Category</th>
                  <th className="px-5 py-4 text-left">Unit</th>
                  <th className="px-5 py-4 text-left">HSN</th>
                  <th className="px-5 py-4 text-left">Brand / Make</th>
                  <th className="px-5 py-4 text-left">GST</th>
                  <th className="px-5 py-4 text-left">Min / Reorder</th>
                  <th className="px-5 py-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <TableSkeleton rows={8} columns={9} />
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-14 text-center text-slate-400">
                      No item identity found
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-800/60">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">
                          {item.itemName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.specification || item.description || "-"}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-cyan-300">
                        {item.itemCode}
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {item.category || "-"}
                        <div className="text-xs text-slate-500">
                          {item.subCategory || ""}
                        </div>
                      </td>

                      <td className="px-5 py-4">{item.unit}</td>
                      <td className="px-5 py-4">{item.hsnCode || "-"}</td>

                      <td className="px-5 py-4">
                        {item.brand || "-"}
                        <div className="text-xs text-slate-500">
                          {item.make || ""}
                        </div>
                      </td>

                      <td className="px-5 py-4">{item.gstPercentage || 0}%</td>

                      <td className="px-5 py-4">
                        {item.minimumStockLevel || 0} / {item.reorderLevel || 0}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="rounded-lg p-2 text-cyan-400 hover:bg-cyan-500/10"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            onClick={() => deleteItem(item._id)}
                            className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {filteredItems.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-slate-800 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-slate-400">
                  Showing{" "}
                  <span className="font-semibold text-slate-200">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-200">
                    {Math.min(currentPage * itemsPerPage, totalRecords)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-200">
                    {totalRecords}
                  </span>{" "}
                  items
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                  >
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                  </select>

                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="text-sm text-slate-400">
                    Page{" "}
                    <span className="font-semibold text-cyan-400">{currentPage}</span>{" "}
                    of {totalPages}
                  </span>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <ItemModal
          form={form}
          setForm={setForm}
          onClose={() => setModalOpen(false)}
          onSave={saveItem}
          saving={saving}
          mode={mode}
        />
      )}
    </div>
  );
}

function ItemModal({ form, setForm, onClose, onSave, saving, mode }) {
  const update = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const numberUpdate = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: Number(value || 0) }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-6 py-4">
          <h2 className="text-xl font-bold">
            {mode === "edit" ? "Edit Item Identity" : "Add Item Identity"}
          </h2>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
          <Input label="Item Name *" name="itemName" value={form.itemName} onChange={update} />
          <Input label="Item Code *" name="itemCode" value={form.itemCode} onChange={update} />
          <Input label="Unit" name="unit" value={form.unit} onChange={update} />

          <Input label="Category" name="category" value={form.category} onChange={update} />
          <Input label="Sub Category" name="subCategory" value={form.subCategory} onChange={update} />
          <Input label="HSN Code" name="hsnCode" value={form.hsnCode} onChange={update} />

          <Input label="Brand" name="brand" value={form.brand} onChange={update} />
          <Input label="Make" name="make" value={form.make} onChange={update} />
          <Input type="number" label="GST %" name="gstPercentage" value={form.gstPercentage} onChange={numberUpdate} />

          <Input type="number" label="Minimum Stock" name="minimumStockLevel" value={form.minimumStockLevel} onChange={numberUpdate} />
          <Input type="number" label="Reorder Level" name="reorderLevel" value={form.reorderLevel} onChange={numberUpdate} />
          <Input label="Specification" name="specification" value={form.specification} onChange={update} />

          <div className="md:col-span-3">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={update}
              rows={2}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div className="md:col-span-3">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Remarks
            </label>
            <textarea
              name="remarks"
              value={form.remarks}
              onChange={update}
              rows={2}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-800 bg-slate-950/95 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-5 py-3 text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
          >
            {saving && <Loader2 size={18} className="animate-spin" />}
            {mode === "edit" ? "Update Item" : "Create Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, type = "text", name, value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
      />
    </div>
  );
}