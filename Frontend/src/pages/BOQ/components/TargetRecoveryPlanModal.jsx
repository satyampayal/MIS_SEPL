import { useMemo, useState } from "react";
import { X, AlertTriangle, Target, CalendarDays, IndianRupee } from "lucide-react";

const formatAmount = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });

const getRemainingDays = (dateString) => {
  if (!dateString) return 0;

  const today = new Date();
  const end = new Date(dateString);

  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return Math.max(Math.ceil((end - today) / (1000 * 60 * 60 * 24)), 0);
};

export default function TargetRecoveryPlanModal({ boq, items, onClose }) {
  const [customDays, setCustomDays] = useState("");

  const projectEndDate =
    boq?.projectRef?.complitionDate || boq?.complitionDate || boq?.complitionDate;

  const actualRemainingDays = getRemainingDays(projectEndDate);
  const remainingDays = Number(customDays || actualRemainingDays || 0);

  const plan = useMemo(() => {
    const pendingItems = items
      .map((item) => {
        const poQty = Number(item.poQty || 0);
        const completedQty = Number(item.completedQty || 0);
        const balanceQty = Number(item.balanceQty ?? poQty - completedQty);
        const installationRate = Number(item.installationRate || 0);
        const balanceValue = balanceQty * installationRate;

        const requiredPerDay =
          remainingDays > 0 ? balanceQty / remainingDays : 0;

        const requiredValuePerDay =
          remainingDays > 0 ? balanceValue / remainingDays : 0;

        return {
          ...item,
          balanceQty,
          installationRate,
          balanceValue,
          requiredPerDay,
          requiredValuePerDay,
        };
      })
      .filter((item) => item.balanceQty > 0)
      .sort((a, b) => b.balanceValue - a.balanceValue);

    const totalBalanceQty = pendingItems.reduce(
      (sum, item) => sum + Number(item.balanceQty || 0),
      0
    );

    const totalBalanceValue = pendingItems.reduce(
      (sum, item) => sum + Number(item.balanceValue || 0),
      0
    );

    const dailyQtyRequired =
      remainingDays > 0 ? totalBalanceQty / remainingDays : 0;

    const dailyValueRequired =
      remainingDays > 0 ? totalBalanceValue / remainingDays : 0;

    const highPriorityItems = pendingItems.slice(0, 10);

    const health =
      remainingDays <= 0
        ? "CRITICAL"
        : dailyValueRequired >= 500000
        ? "HIGH PRESSURE"
        : dailyValueRequired >= 200000
        ? "ATTENTION"
        : "MANAGEABLE";

    return {
      pendingItems,
      highPriorityItems,
      totalBalanceQty,
      totalBalanceValue,
      dailyQtyRequired,
      dailyValueRequired,
      health,
    };
  }, [items, remainingDays]);

  const healthClass =
    plan.health === "CRITICAL"
      ? "bg-red-500/10 text-red-300 border-red-500/30"
      : plan.health === "HIGH PRESSURE"
      ? "bg-orange-500/10 text-orange-300 border-orange-500/30"
      : plan.health === "ATTENTION"
      ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
      : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-7xl max-h-[92vh] overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-rose-400">
              Target Recovery Plan
            </p>

            <h2 className="text-xl font-bold text-white mt-1">
              {boq?.boqName || boq?.title || "BOQ Recovery Plan"}
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Project: {boq?.projectRef?.name || boq?.projectName || "-"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[calc(92vh-85px)] space-y-5">
          <div className={`rounded-3xl border p-5 ${healthClass}`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-black">
                  Project Condition: {plan.health}
                </h3>
                <p className="text-sm mt-1 opacity-90">
                  This plan tells how much work must be completed per day to catch the target date.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm">Override Days:</span>
                <input
                  type="number"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder={String(actualRemainingDays || 0)}
                  className="w-28 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <RecoveryCard
              icon={<CalendarDays size={22} />}
              title="Remaining Days"
              value={remainingDays}
              sub="Target date pressure"
            />

            <RecoveryCard
              icon={<Target size={22} />}
              title="Daily Qty Required"
              value={formatAmount(Math.ceil(plan.dailyQtyRequired))}
              sub="Minimum per day"
            />

            <RecoveryCard
              icon={<IndianRupee size={22} />}
              title="Daily Value Required"
              value={`₹ ${formatAmount(Math.ceil(plan.dailyValueRequired))}`}
              sub="Installation value/day"
            />

            <RecoveryCard
              icon={<AlertTriangle size={22} />}
              title="Pending Items"
              value={plan.pendingItems.length}
              sub="Balance BOQ items"
            />
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-lg font-bold text-white mb-3">
              Management Summary
            </h3>

            <p className="text-sm text-slate-300 leading-7">
              Total pending quantity is{" "}
              <b className="text-white">{formatAmount(plan.totalBalanceQty)}</b>.
              Total pending installation value is{" "}
              <b className="text-white">₹ {formatAmount(plan.totalBalanceValue)}</b>.
              To hit the target date in{" "}
              <b className="text-amber-300">{remainingDays}</b> days, site must
              complete minimum{" "}
              <b className="text-cyan-300">
                {formatAmount(Math.ceil(plan.dailyQtyRequired))}
              </b>{" "}
              quantity per day and minimum{" "}
              <b className="text-emerald-300">
                ₹ {formatAmount(Math.ceil(plan.dailyValueRequired))}
              </b>{" "}
              value per day.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                Priority BOQ Items To Recover Target
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Sorted by highest pending installation value.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] text-sm">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left">BOQ Item</th>
                    <th className="px-4 py-3 text-right">Balance Qty</th>
                    <th className="px-4 py-3 text-right">Rate</th>
                    <th className="px-4 py-3 text-right">Balance Value</th>
                    <th className="px-4 py-3 text-right">Daily Qty Target</th>
                    <th className="px-4 py-3 text-right">Daily Value Target</th>
                    <th className="px-4 py-3 text-left">Action Thinking</th>
                  </tr>
                </thead>

                <tbody>
                  {plan.highPriorityItems.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-10 text-center text-slate-500">
                        No pending item found.
                      </td>
                    </tr>
                  ) : (
                    plan.highPriorityItems.map((item) => (
                      <tr
                        key={item._id}
                        className="border-t border-slate-800 hover:bg-slate-800/40"
                      >
                        <td className="px-4 py-3">
                          <p className="text-white font-semibold">
                            {item.generalName || item.activity || "-"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.boqItemCode || "-"} | {item.uom || ""}
                          </p>
                          <p className="text-xs text-slate-500 max-w-[350px] line-clamp-2">
                            {item.description || "-"}
                          </p>
                        </td>

                        <td className="px-4 py-3 text-right text-amber-300">
                          {formatAmount(item.balanceQty)}
                        </td>

                        <td className="px-4 py-3 text-right">
                          ₹ {formatAmount(item.installationRate)}
                        </td>

                        <td className="px-4 py-3 text-right text-cyan-300">
                          ₹ {formatAmount(item.balanceValue)}
                        </td>

                        <td className="px-4 py-3 text-right text-emerald-300">
                          {formatAmount(Math.ceil(item.requiredPerDay))}
                        </td>

                        <td className="px-4 py-3 text-right text-emerald-300">
                          ₹ {formatAmount(Math.ceil(item.requiredValuePerDay))}
                        </td>

                        <td className="px-4 py-3 text-slate-300">
                          {item.requiredValuePerDay > 100000
                            ? "Increase manpower / prioritize daily"
                            : item.requiredPerDay > 100
                            ? "Track every day in Daily Plan"
                            : "Normal daily monitoring"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-lg font-bold text-white mb-3">
             Instruction
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                <p className="text-cyan-300 font-bold">Morning</p>
                <p className="text-slate-400 mt-1">
                  Select items from priority list and create Today Execution Plan.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                <p className="text-amber-300 font-bold">Evening</p>
                <p className="text-slate-400 mt-1">
                  Update done quantity. If below target, next day target increases.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                <p className="text-emerald-300 font-bold">Proof</p>
                <p className="text-slate-400 mt-1">
                  Push completed items into MB. No MB means no real progress.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecoveryCard({ icon, title, value, sub }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <span className="text-rose-300">{icon}</span>
      </div>

      <h3 className="text-2xl font-black text-white mt-3">{value}</h3>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </div>
  );
}