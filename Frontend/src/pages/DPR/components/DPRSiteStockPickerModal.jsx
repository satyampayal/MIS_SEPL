import { useEffect, useState } from "react";
import { Search, X, Check } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import BASE_URL from "../../../../config/api";

export default function DPRSiteStockPickerModal({
  projectRef,
  onClose,
  onSelect,
}) {
  const [search, setSearch] = useState("");
  const [stocks, setStocks] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSiteStock = async () => {
    try {
      if (!projectRef) {
        return toast.error("Select project first");
      }

      setLoading(true);

      const res = await axios.get(
        `${BASE_URL}/site-store-stock/live-stock?siteRef=${projectRef}&search=${search}`
      );

      setStocks(res.data?.data || res.data?.stocks || []);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch site stock"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSiteStock();
  }, [projectRef]);

  const toggleItem = (stock) => {
    const exists = selected.some((x) => x._id === stock._id);

    if (exists) {
      setSelected((prev) => prev.filter((x) => x._id !== stock._id));
    } else {
      setSelected((prev) => [...prev, stock]);
    }
  };

  const handleAdd = () => {
    const rows = selected.map((stock) => ({
      siteStockRef: stock._id,
      itemRef: stock.itemRef?._id || stock.itemRef || "",
      itemName: stock.itemRef?.itemName || stock.itemName || "",
      itemCode: stock.itemRef?.itemCode || stock.itemCode || "",
      uom: stock.itemRef?.unit || stock.itemRef?.uom || stock.uom || "",
      availableStockAtEntry: Number(stock.currentStock || 0),
      quantity: "",
      source: "SITE_STOCK",
      remarks: "",
    }));

    onSelect(rows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-5xl rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase text-cyan-300">
              Site Stock Picker
            </p>
            <h2 className="text-xl font-bold">Select Material Used</h2>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={22} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search item name / code..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-4 outline-none focus:border-cyan-500"
              />
            </div>

            <button
              onClick={fetchSiteStock}
              className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950"
            >
              Search
            </button>
          </div>

          <div className="mt-5 max-h-[55vh] overflow-y-auto rounded-2xl border border-slate-800">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="sticky top-0 bg-slate-900 text-slate-400">
                <tr>
                  <th className="p-3 text-left">Select</th>
                  <th className="p-3 text-left">Item Code</th>
                  <th className="p-3 text-left">Item Name</th>
                  <th className="p-3 text-left">UOM</th>
                  <th className="p-3 text-right">Site Stock</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400">
                      Loading site stock...
                    </td>
                  </tr>
                ) : stocks.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400">
                      No site stock found
                    </td>
                  </tr>
                ) : (
                  stocks.map((stock) => {
                    const checked = selected.some((x) => x._id === stock._id);

                    return (
                      <tr
                        key={stock._id}
                        onClick={() => toggleItem(stock)}
                        className={`cursor-pointer border-t border-slate-800 hover:bg-slate-800/60 ${
                          checked ? "bg-cyan-500/10" : ""
                        }`}
                      >
                        <td className="p-3">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-lg border ${
                              checked
                                ? "border-cyan-400 bg-cyan-500 text-slate-950"
                                : "border-slate-600"
                            }`}
                          >
                            {checked && <Check size={15} />}
                          </div>
                        </td>

                        <td className="p-3 text-cyan-300">
                          {stock.itemRef?.itemCode || stock.itemCode || "-"}
                        </td>

                        <td className="p-3 font-medium">
                          {stock.itemRef?.itemName || stock.itemName || "-"}
                        </td>

                        <td className="p-3">
                          {stock.itemRef?.unit || stock.itemRef?.uom || stock.uom || "-"}
                        </td>

                        <td className="p-3 text-right font-semibold text-emerald-300">
                          {stock.currentStock || 0}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-5 py-3 text-slate-300"
          >
            Cancel
          </button>

          <button
            onClick={handleAdd}
            disabled={selected.length === 0}
            className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
          >
            Add Selected ({selected.length})
          </button>
        </div>
      </div>
    </div>
  );
}