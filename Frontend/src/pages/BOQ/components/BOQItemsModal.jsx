import React, { useMemo, useState } from "react";

export default function BOQItemsModal({
  boq,
  items,
  loading,
  onClose,
  onAddItem,
  onUploadExcel,
}) {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    const keyword = search.toLowerCase();

    return items.filter((item) => {
      const text = [
        item.boqItemCode,
        item.boqSrNo,
        item.activity,
        item.generalName,
        item.description,
        item.uom,
        item.category,
        item.subCategory,
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(keyword);
    });
  }, [items, search]);

  const stats = useMemo(() => {
    return {
      totalItems: filteredItems.length,
      totalQty: filteredItems.reduce(
        (sum, item) => sum + Number(item.poQty || 0),
        0
      ),
      completedQty: filteredItems.reduce(
        (sum, item) => sum + Number(item.completedQty || 0),
        0
      ),
      balanceQty: filteredItems.reduce(
        (sum, item) => sum + Number(item.balanceQty || 0),
        0
      ),
      contractorAmount: filteredItems.reduce(
        (sum, item) =>
          sum + Number(item.contractorInstallationAmount || 0),
        0
      ),
    };
  }, [filteredItems]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[92vh] w-full max-w-7xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-slate-800 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-cyan-300">
              BOQ Items
            </p>
            <h2 className="text-xl font-bold">
              {boq?.boqName || "BOQ Details"}
            </h2>
            <p className="text-sm text-slate-400">
              {boq?.boqType} · {boq?.contractorRef?.contractorName || "Client BOQ"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onUploadExcel}
              className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950"
            >
              Upload Excel
            </button>

            <button
              onClick={onAddItem}
              className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950"
            >
              Add Item
            </button>

            <button
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300"
            >
              Close
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-5">
          <StatCard title="Items" value={stats.totalItems} />
          <StatCard title="BOQ Qty" value={stats.totalQty} />
          <StatCard title="Completed" value={stats.completedQty} />
          <StatCard title="Balance" value={stats.balanceQty} />
          <StatCard
            title="Contractor Amt"
            value={`₹${stats.contractorAmount.toLocaleString("en-IN")}`}
          />
        </div>

        <div className="px-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search BOQ item, activity, description..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-cyan-500"
          />
        </div>

        <div className="p-6">
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full min-w-[1300px] text-sm">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-4 text-left">Code</th>
                  <th className="p-4 text-left">Activity</th>
                  <th className="p-4 text-left">BOQ Qty</th>
                  <th className="p-4 text-left">Completed</th>
                  <th className="p-4 text-left">Balance</th>
                  <th className="p-4 text-left">Supply Rate</th>
                  <th className="p-4 text-left">Installation Rate</th>
                  <th className="p-4 text-left">Contractor Rate</th>
                  <th className="p-4 text-left">Progress</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="p-10 text-center text-slate-400">
                      Loading BOQ items...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-10 text-center text-slate-400">
                      No BOQ items found
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const progress =
                      Number(item.poQty || 0) > 0
                        ? Math.min(
                            (Number(item.completedQty || 0) /
                              Number(item.poQty || 0)) *
                              100,
                            100
                          )
                        : 0;

                    return (
                      <tr key={item._id} className="border-t border-slate-800">
                        <td className="p-4">
                          <div className="font-semibold text-cyan-300">
                            {item.boqItemCode || "-"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {item.boqSrNo || "-"}
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="font-semibold">
                            {item.activity || item.generalName || "-"}
                          </div>
                          <div className="mt-1 line-clamp-2 text-xs text-slate-400">
                            {item.description || "-"}
                          </div>
                        </td>

                        <td className="p-4">
                          {item.poQty || 0} {item.uom}
                        </td>

                        <td className="p-4 text-blue-300">
                          {item.completedQty || 0}
                        </td>

                        <td className="p-4 text-emerald-300">
                          {item.balanceQty || 0}
                        </td>

                         <td className="p-4">
                          ₹{Number(item.supplyRate || 0).toLocaleString("en-IN")}
                        </td>

                        <td className="p-4">
                          ₹{Number(item.installationRate || 0).toLocaleString("en-IN")}
                        </td>

                        <td className="p-4">
                          ₹{Number(item.contractorInstallationRate || 0).toLocaleString("en-IN")}
                        </td>

                        <td className="p-4">
                          <div className="w-32 rounded-full bg-slate-800">
                            <div
                              className="h-2 rounded-full bg-cyan-400"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            {progress.toFixed(1)}%
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs text-slate-400">{title}</p>
      <h3 className="mt-2 text-lg font-bold text-cyan-300">{value}</h3>
    </div>
  );
}