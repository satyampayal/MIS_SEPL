import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X, Pin, Save, Search, CheckCircle, ClipboardCopy } from "lucide-react";
import BASE_URL from "../../../../config/api";

const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const todayDate = () => new Date().toISOString().split("T")[0];

const formatAmount = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });

export default function BOQDailyPlanModal({ boq, items, onClose }) {
  const [planDate, setPlanDate] = useState(todayDate());
  const [selectedItems, setSelectedItems] = useState([]);
  const [savedPlan, setSavedPlan] = useState(null);

  const [itemSearch, setItemSearch] = useState("");
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [saving, setSaving] = useState(false);

  const projectRef = boq?.projectRef?._id || boq?.projectRef;

  const suggestedItems = useMemo(() => {
    return [...items]
      .map((item) => {
        const poQty = Number(item.poQty || 0);
        const completedQty = Number(item.completedQty || 0);
        const balanceQty = Number(item.balanceQty ?? poQty - completedQty);
        const installationRate = Number(item.installationRate || 0);
        const balanceValue = balanceQty * installationRate;

        return {
          ...item,
          balanceQty,
          installationRate,
          balanceValue,
        };
      })
      .filter((item) => item.balanceQty > 0)
      .filter((item) => {
        const searchValue = `
          ${item.boqItemCode || ""}
          ${item.boqSrNo || ""}
          ${item.activity || ""}
          ${item.generalName || ""}
          ${item.description || ""}
          ${item.uom || ""}
          ${item.category || ""}
          ${item.subCategory || ""}
          ${item.remarks || ""}
        `.toLowerCase();

        return searchValue.includes(itemSearch.toLowerCase());
      })
      .sort((a, b) => b.balanceValue - a.balanceValue);
  }, [items, itemSearch]);

  const fetchSavedPlan = async () => {
    try {
      if (!projectRef || !boq?._id || !planDate) return;

      setLoadingPlan(true);

      const res = await axios.get(`${BASE_URL}/boq-daily-plan`, {
        ...authHeader(),
        params: {
          projectRef,
          boqRef: boq._id,
          planDate,
        },
      });

      const plan = res.data?.data?.[0] || null;
      setSavedPlan(plan);

      if (plan) {
        setSelectedItems(
          plan.items.map((item) => ({
            planItemId: item._id,
            boqItemRef: item.boqItemRef,
            boqItemCode: item.boqItemCode || "",
            generalName: item.generalName || "",
            description: item.description || "",
            uom: item.uom || "",
            balanceQtyAtPlan: Number(item.balanceQtyAtPlan || 0),
            targetQty: Number(item.targetQty || 0),
            doneQty: Number(item.doneQty || 0),
            installationRate: Number(item.installationRate || 0),
            remarks: item.remarks || "",
            status: item.status || "PENDING",
            copiedToMB: item.copiedToMB || false,
          }))
        );
      } else {
        setSelectedItems([]);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch saved plan");
    } finally {
      setLoadingPlan(false);
    }
  };

  useEffect(() => {
    fetchSavedPlan();
  }, [planDate, boq?._id]);

  const pinItem = (item) => {
    const exists = selectedItems.some(
      (x) => String(x.boqItemRef) === String(item._id)
    );

    if (exists) return toast.error("Item already pinned");

    setSelectedItems((prev) => [
      ...prev,
      {
        boqItemRef: item._id,
        boqItemCode: item.boqItemCode || "",
        generalName: item.generalName || "",
        description: item.description || "",
        uom: item.uom || "",
        balanceQtyAtPlan: Number(item.balanceQty || 0),
        targetQty: "",
        doneQty: 0,
        installationRate: Number(item.installationRate || 0),
        remarks: "",
        status: "PENDING",
        copiedToMB: false,
      },
    ]);
  };

  const updatePinnedItem = (index, field, value) => {
    setSelectedItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const removePinnedItem = async (index) => {
    try {
      const item = selectedItems[index];

      if (savedPlan?._id && item?.planItemId) {
        await axios.delete(
          `${BASE_URL}/boq-daily-plan/${savedPlan._id}/item/${item.planItemId}`,
          authHeader()
        );

        toast.success("Plan item removed");
        fetchSavedPlan();
        return;
      }

      setSelectedItems((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to remove item");
    }
  };

  const saveDailyPlan = async () => {
    try {
      if (!projectRef || !boq?._id) return toast.error("Project or BOQ missing");
      if (!selectedItems.length) return toast.error("Please pin at least one item");

      const invalid = selectedItems.some(
        (item) => !item.targetQty || Number(item.targetQty) <= 0
      );

      if (invalid) return toast.error("Enter valid target qty");

      setSaving(true);

      await axios.post(
        `${BASE_URL}/boq-daily-plan/save`,
        {
          projectRef,
          boqRef: boq._id,
          planDate,
          items: selectedItems.map((item) => ({
            boqItemRef: item.boqItemRef,
            boqItemCode: item.boqItemCode,
            generalName: item.generalName,
            description: item.description,
            uom: item.uom,
            balanceQtyAtPlan: Number(item.balanceQtyAtPlan || 0),
            targetQty: Number(item.targetQty || 0),
            doneQty: Number(item.doneQty || 0),
            installationRate: Number(item.installationRate || 0),
            remarks: item.remarks || "",
          })),
        },
        authHeader()
      );

      toast.success("Today execution plan saved");
      fetchSavedPlan();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save daily plan");
    } finally {
      setSaving(false);
    }
  };

  const updateDoneQty = async (item) => {
    try {
      if (!savedPlan?._id || !item?.planItemId) {
        return toast.error("Save plan first, then update done qty");
      }

      await axios.put(
        `${BASE_URL}/boq-daily-plan/${savedPlan._id}/item/${item.planItemId}/done`,
        {
          doneQty: Number(item.doneQty || 0),
          remarks: item.remarks || "",
        },
        authHeader()
      );

      toast.success("Done qty updated");
      fetchSavedPlan();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update done qty");
    }
  };

  const copyDoneItemsToMB = () => {
    const doneItems = selectedItems.filter((item) => Number(item.doneQty || 0) > 0);

    if (!doneItems.length) {
      return toast.error("No done item available to copy");
    }

    const payload = doneItems.map((item) => ({
      boqItemRef: item.boqItemRef,
      todayQty: Number(item.doneQty || 0),
      location: "",
      floor: "",
      area: "",
      remarks: item.remarks || "Copied from BOQ daily plan",
    }));

    localStorage.setItem(
      "mb_prefill_from_daily_plan",
      JSON.stringify({
        projectRef,
        boqRef: boq._id,
        planId: savedPlan?._id || null,
        measurementDate: planDate,
        items: payload,
      })
    );

    toast.success("Copied. Open MB page and paste/prefill from plan.");
  };

  const totalTargetQty = selectedItems.reduce(
    (sum, item) => sum + Number(item.targetQty || 0),
    0
  );

  const totalDoneQty = selectedItems.reduce(
    (sum, item) => sum + Number(item.doneQty || 0),
    0
  );

  const totalTargetValue = selectedItems.reduce(
    (sum, item) =>
      sum + Number(item.targetQty || 0) * Number(item.installationRate || 0),
    0
  );

  const totalDoneValue = selectedItems.reduce(
    (sum, item) =>
      sum + Number(item.doneQty || 0) * Number(item.installationRate || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-7xl max-h-[92vh] overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-amber-400">
              Today Execution Plan
            </p>
            <h2 className="text-xl font-bold text-white mt-1">
              {boq?.boqName || boq?.title || "BOQ"}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Search, pin target item, update done qty, then copy done items to MB.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 xl:grid-cols-2 gap-5 overflow-y-auto max-h-[calc(92vh-90px)]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h3 className="font-bold text-white">Suggested BOQ Items</h3>

              <div className="relative mt-3">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Search code, activity, general name, description, category..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="max-h-[560px] overflow-y-auto">
              {suggestedItems.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No pending BOQ item found.
                </div>
              ) : (
                suggestedItems.map((item) => (
                  <div
                    key={item._id}
                    className="p-4 border-b border-slate-800 hover:bg-slate-800/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {item.generalName || item.activity || "-"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {item.boqItemCode || "-"} | Balance:{" "}
                          {formatAmount(item.balanceQty)} {item.uom || ""}
                        </p>
                        <p className="text-xs text-slate-500 max-w-[420px] line-clamp-2 mt-1">
                          {item.description || "-"}
                        </p>
                        <p className="text-xs text-cyan-300 mt-1">
                          Balance Value: ₹ {formatAmount(item.balanceValue)}
                        </p>
                      </div>

                      <button
                        onClick={() => pinItem(item)}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
                      >
                        <Pin size={15} />
                        Pin
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="font-bold text-white">Pinned Today Target</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Target: {formatAmount(totalTargetQty)} Qty / ₹{" "}
                    {formatAmount(totalTargetValue)} | Done:{" "}
                    {formatAmount(totalDoneQty)} Qty / ₹{" "}
                    {formatAmount(totalDoneValue)}
                  </p>
                </div>

                <input
                  type="date"
                  value={planDate}
                  onChange={(e) => setPlanDate(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                />
              </div>

              {savedPlan && (
                <div className="mt-3 text-xs text-emerald-300">
                  Saved Plan Found: {savedPlan.status}
                </div>
              )}
            </div>

            <div className="max-h-[480px] overflow-y-auto">
              {loadingPlan ? (
                <div className="p-8 text-center text-slate-500">
                  Loading saved plan...
                </div>
              ) : selectedItems.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No item pinned yet.
                </div>
              ) : (
                selectedItems.map((item, index) => (
                  <div key={item.boqItemRef} className="p-4 border-b border-slate-800">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {item.generalName || item.description || "-"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {item.boqItemCode || "-"} | Balance:{" "}
                          {formatAmount(item.balanceQtyAtPlan)} {item.uom || ""}
                        </p>
                        <p className="text-xs text-slate-500 max-w-[420px] line-clamp-2 mt-1">
                          {item.description || "-"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-lg border ${
                            item.status === "DONE"
                              ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
                              : item.status === "PARTIAL"
                              ? "text-amber-300 border-amber-500/30 bg-amber-500/10"
                              : "text-slate-400 border-slate-700 bg-slate-800"
                          }`}
                        >
                          {item.status || "PENDING"}
                        </span>

                        <button
                          onClick={() => removePinnedItem(index)}
                          className="text-xs text-red-300 hover:text-red-200"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                      <input
                        type="number"
                        value={item.targetQty}
                        onChange={(e) =>
                          updatePinnedItem(index, "targetQty", e.target.value)
                        }
                        placeholder="Target Qty"
                        className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                      />

                      <input
                        type="number"
                        value={item.doneQty}
                        onChange={(e) =>
                          updatePinnedItem(index, "doneQty", e.target.value)
                        }
                        placeholder="Done Qty"
                        className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                      />

                      <input
                        value={item.remarks}
                        onChange={(e) =>
                          updatePinnedItem(index, "remarks", e.target.value)
                        }
                        placeholder="Remarks"
                        className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                      />

                      <button
                        onClick={() => updateDoneQty(item)}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20"
                      >
                        <CheckCircle size={16} />
                        Update Done
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={saveDailyPlan}
                disabled={saving}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 disabled:opacity-60"
              >
                <Save size={17} />
                {saving ? "Saving..." : "Save Today Plan"}
              </button>

              <button
                onClick={copyDoneItemsToMB}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20"
              >
                <ClipboardCopy size={17} />
                Copy Done To MB
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}