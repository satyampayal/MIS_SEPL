import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X, Search, Loader2, PackageCheck, CheckCircle2 } from "lucide-react";
import BASE_URL from "../../config/api";

export default function ChallanItemPickerModal({
  isOpen,
  onClose,
  documentType,
  fromMainStoreRef,
  fromSiteRef,
  onSelect,
}) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const isMainStockMode = ["DC", "CN"].includes(documentType);
  const isSiteStockMode = ["ISTN", "MRS"].includes(documentType);

  const fetchItems = async () => {
    try {
      setLoading(true);

      if (["DC", "CN"].includes(documentType) && !fromMainStoreRef) {
        toast.error("Select main store first");
        return;
      }

      if (["ISTN", "MRS"].includes(documentType) && !fromSiteRef) {
        toast.error("Select source site first");
        return;
      }

      const res = await axios.get(`${BASE_URL}/challan/picker-items`, {
        params: {
          documentType,
          fromMainStoreRef,
          fromSiteRef,
          search,
          category: categoryFilter,
          page: 1,
          limit: 50,
        },
      });

      setItems(res.data.data || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(fetchItems, 400);
    return () => clearTimeout(timer);
  }, [isOpen, search, categoryFilter, documentType, fromMainStoreRef, fromSiteRef]);

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setCategoryFilter("All");
      setSelectedItems([]);
    }
  }, [isOpen]);

  const normalizedItems = useMemo(() => {
    return items.map((row) => {
      const stockMode = isMainStockMode || isSiteStockMode;
      const item = stockMode ? row.itemRef || {} : row;

      return {
        raw: row,
        stockId: stockMode ? row._id : "",
        itemId: item._id || row.itemRef || row._id,
        itemName: item.itemName || "",
        itemCode: item.itemCode || "",
        category: item.category || "",
        subCategory: item.subCategory || "",
        unit: item.unit || "Nos",
        hsnCode: item.hsnCode || "",
        specification: item.specification || item.description || "",
        brand: item.brand || "",
        make: item.make || "",
        availableStock: stockMode ? Number(row.availableStock || 0) : null,
        currentStock: stockMode ? Number(row.currentStock || 0) : null,
        averageRate: stockMode ? Number(row.averageRate || 0) : 0,
        stockStatus: stockMode ? row.stockStatus || "" : "",
      };
    });
  }, [items, isMainStockMode, isSiteStockMode]);

  const categories = useMemo(() => {
    return [
      "All",
      ...new Set(normalizedItems.map((item) => item.category).filter(Boolean)),
    ];
  }, [normalizedItems]);

  const filteredItems = useMemo(() => {
    const keyword = search.toLowerCase();

    return normalizedItems.filter((item) => {
      const text = [
        item.itemName,
        item.itemCode,
        item.category,
        item.subCategory,
        item.hsnCode,
        item.specification,
        item.brand,
        item.make,
      ]
        .join(" ")
        .toLowerCase();

      const matchSearch = text.includes(keyword);
      const matchCategory =
        categoryFilter === "All" || item.category === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [normalizedItems, search, categoryFilter]);

  const toggleSelect = (item) => {
    setSelectedItems((prev) => {
      const exists = prev.some((x) => x.itemId === item.itemId);

      if (exists) {
        return prev.filter((x) => x.itemId !== item.itemId);
      }

      return [...prev, item];
    });
  };

  const removeSelectedItem = (itemId) => {
    setSelectedItems((prev) => prev.filter((item) => item.itemId !== itemId));
  };

  const handleAddSelected = () => {
    if (selectedItems.length === 0) {
      toast.error("Select at least one item");
      return;
    }

    const rows = selectedItems.map((item) => ({
      itemRef: item.itemId,
      fromStockRef: item.stockId || "",
      itemName: item.itemName,
      itemCode: item.itemCode,
      unit: item.unit,
      hsnCode: item.hsnCode,
      description: item.specification || item.itemName,
      quantity: 1,
      rate: item.averageRate || 0,
      amount: item.averageRate || 0,
      availableStock: item.availableStock,
      stockError: "",
    }));

    onSelect(rows);
    setSelectedItems([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4">
      <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              <PackageCheck size={14} />
              Multi Select Item Picker
            </div>

            <h2 className="mt-2 text-xl font-bold text-white">
              Select Items for {documentType}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Click item cards to select multiple items, then add them into challan.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 border-b border-slate-800 p-5 md:grid-cols-2">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search item name, code, HSN, brand..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-cyan-500"
              autoFocus
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {selectedItems.length > 0 && (
          <div className="border-b border-cyan-500/20 bg-cyan-500/5 px-5 py-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-cyan-300">
                Selected Items ({selectedItems.length})
              </p>

              <button
                onClick={() => setSelectedItems([])}
                className="text-xs text-red-300 hover:text-red-200"
              >
                Clear All
              </button>
            </div>

            <div className="flex max-h-20 flex-wrap gap-2 overflow-y-auto">
              {selectedItems.map((item) => (
                <button
                  key={item.itemId}
                  type="button"
                  onClick={() => removeSelectedItem(item.itemId)}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200 hover:bg-red-500/10 hover:text-red-300"
                  title="Click to remove"
                >
                  {item.itemName}
                  <X size={12} />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
              <Loader2 className="animate-spin" size={20} />
              Loading items...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-20 text-center text-slate-400">No item found</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => {
                const isSelected = selectedItems.some(
                  (x) => x.itemId === item.itemId
                );

                return (
                  <button
                    key={`${item.itemId}-${item.stockId}`}
                    type="button"
                    onClick={() => toggleSelect(item)}
                    className={`relative rounded-2xl border p-4 text-left transition-all duration-200 ${isSelected
                        ? "scale-[1.02] border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-500/60"
                        : "border-slate-800 bg-slate-900 hover:border-cyan-500/50 hover:bg-slate-800"
                      }`}
                  >
                    {isSelected && (
                      <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-cyan-400 px-2 py-1 text-[10px] font-bold text-slate-950">
                        <CheckCircle2 size={12} />
                        Selected
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-3 pr-20">
                      <div>
                        <h3 className="font-semibold text-white">
                          {item.itemName || "-"}
                        </h3>
                        <p className="mt-1 text-xs text-cyan-300">
                          {item.itemCode || "-"} · {item.unit}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={`h-4 w-4 rounded border ${isSelected
                            ? "border-cyan-300 bg-cyan-400"
                            : "border-slate-600 bg-slate-900"
                          }`}
                      >
                        {isSelected && (
                          <CheckCircle2
                            size={14}
                            className="text-slate-950"
                          />
                        )}
                      </span>

                      {item.availableStock !== null && (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                          Avl {item.availableStock}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
                      <p>Category: {item.category || "-"}</p>
                      <p>HSN: {item.hsnCode || "-"}</p>
                      <p>Brand: {item.brand || "-"}</p>
                      <p>Rate: ₹{item.averageRate || 0}</p>
                    </div>

                    {item.specification && (
                      <p className="mt-3 line-clamp-2 text-xs text-slate-500">
                        {item.specification}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 flex items-center justify-between border-t border-slate-800 bg-slate-950 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-cyan-300">
              {selectedItems.length} Item(s) Selected
            </p>
            <p className="text-xs text-slate-500">
              Showing {filteredItems.length} of {normalizedItems.length} items
            </p>
          </div>

          <button
            onClick={handleAddSelected}
            disabled={selectedItems.length === 0}
            className="rounded-xl bg-cyan-500 px-5 py-2 font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add Selected Items
          </button>
        </div>
      </div>
    </div>
  );
}