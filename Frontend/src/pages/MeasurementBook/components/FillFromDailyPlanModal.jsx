import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X, Search, CheckCircle } from "lucide-react";
import BASE_URL from "../../../../config/api";

const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const todayDate = () => new Date().toISOString().split("T")[0];

const formatAmount = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

export default function FillFromDailyPlanModal({
  projectRef,
  onClose,
  onFillMB,
}) {
  const [planDate, setPlanDate] = useState(todayDate());
  const [plans, setPlans] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReadyPlans = async () => {
    try {
      if (!projectRef) {
        return toast.error("Please select project first");
      }

      setLoading(true);

      const res = await axios.get(`${BASE_URL}/boq-daily-plan/ready-for-mb`, {
        ...authHeader(),
        params: {
          projectRef,
          planDate,
        },
      });

      setPlans(res.data?.data || []);
      setSelectedItems([]);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch daily plans"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadyPlans();
  }, [planDate, projectRef]);

  const toggleItem = (plan, item) => {
    const key = `${plan._id}_${item._id}`;

    const exists = selectedItems.some((x) => x.key === key);

    if (exists) {
      setSelectedItems((prev) => prev.filter((x) => x.key !== key));
    } else {
      setSelectedItems((prev) => [
        ...prev,
        {
          key,
          planId: plan._id,
          planItemId: item._id,
          projectRef: plan.projectRef?._id || plan.projectRef,
          boqRef: plan.boqRef?._id || plan.boqRef,
          boqName: plan.boqRef?.boqName || "BOQ",
          boqItemRef: item.boqItemRef,
          boqItemCode: item.boqItemCode || "",
          generalName: item.generalName || "",
          description: item.description || "",
          uom: item.uom || "",
          todayQty: Number(item.doneQty || 0),
          location: "",
          floor: "",
          area: "",
          remarks: item.remarks || "Filled from BOQ Daily Plan",
        },
      ]);
    }
  };

  const updateSelectedItem = (key, field, value) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.key === key
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const fillIntoMB = () => {
    if (!selectedItems.length) {
      return toast.error("Select at least one done item");
    }

    onFillMB({
      measurementDate: planDate,
      items: selectedItems,
    });

    toast.success("Daily plan items filled into MB");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-7xl max-h-[92vh] overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">
              Fill MB From Daily Plan
            </p>
            <h2 className="text-xl font-bold text-white mt-1">
              Select completed daily plan items
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={planDate}
              onChange={(e) => setPlanDate(e.target.value)}
              className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200"
            />

            <button
              onClick={fetchReadyPlans}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20"
            >
              <Search size={17} />
              Search
            </button>
          </div>

          <div className="text-sm text-slate-400">
            Selected:{" "}
            <b className="text-white">{selectedItems.length}</b> item(s)
          </div>
        </div>

        <div className="p-5 overflow-y-auto max-h-[calc(92vh-190px)]">
          {loading ? (
            <div className="p-10 text-center text-slate-500">
              Loading daily plan...
            </div>
          ) : plans.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No completed daily plan item found for this date.
            </div>
          ) : (
            <div className="space-y-5">
              {plans.map((plan) => (
                <div
                  key={plan._id}
                  className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-800">
                    <h3 className="font-bold text-white">
                      {plan.boqRef?.boqName || "BOQ Plan"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Done Qty: {formatAmount(plan.doneQtyTotal)} | Done Value:
                      ₹ {formatAmount(plan.doneValueTotal)}
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] text-sm">
                      <thead className="bg-slate-950 text-slate-400">
                        <tr>
                          <th className="px-4 py-3 text-left">Select</th>
                          <th className="px-4 py-3 text-left">Item</th>
                          <th className="px-4 py-3 text-right">Done Qty</th>
                          <th className="px-4 py-3 text-left">Location</th>
                          <th className="px-4 py-3 text-left">Floor</th>
                          <th className="px-4 py-3 text-left">Area</th>
                          <th className="px-4 py-3 text-left">Remarks</th>
                        </tr>
                      </thead>

                      <tbody>
                        {plan.items.map((item) => {
                          const key = `${plan._id}_${item._id}`;
                          const selected = selectedItems.find(
                            (x) => x.key === key
                          );

                          return (
                            <tr
                              key={item._id}
                              className="border-t border-slate-800"
                            >
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={!!selected}
                                  onChange={() => toggleItem(plan, item)}
                                  className="w-4 h-4"
                                />
                              </td>

                              <td className="px-4 py-3">
                                <p className="text-white font-medium">
                                  {item.generalName || item.description || "-"}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {item.boqItemCode || "-"} | {item.uom || ""}
                                </p>
                              </td>

                              <td className="px-4 py-3 text-right text-emerald-300">
                                {formatAmount(item.doneQty)}
                              </td>

                              <td className="px-4 py-3">
                                <input
                                  disabled={!selected}
                                  value={selected?.location || ""}
                                  onChange={(e) =>
                                    updateSelectedItem(
                                      key,
                                      "location",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 disabled:opacity-40"
                                />
                              </td>

                              <td className="px-4 py-3">
                                <input
                                  disabled={!selected}
                                  value={selected?.floor || ""}
                                  onChange={(e) =>
                                    updateSelectedItem(
                                      key,
                                      "floor",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 disabled:opacity-40"
                                />
                              </td>

                              <td className="px-4 py-3">
                                <input
                                  disabled={!selected}
                                  value={selected?.area || ""}
                                  onChange={(e) =>
                                    updateSelectedItem(
                                      key,
                                      "area",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 disabled:opacity-40"
                                />
                              </td>

                              <td className="px-4 py-3">
                                <input
                                  disabled={!selected}
                                  value={selected?.remarks || ""}
                                  onChange={(e) =>
                                    updateSelectedItem(
                                      key,
                                      "remarks",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 disabled:opacity-40"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={fillIntoMB}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400"
          >
            <CheckCircle size={18} />
            Fill Selected Items Into MB
          </button>
        </div>
      </div>
    </div>
  );
}