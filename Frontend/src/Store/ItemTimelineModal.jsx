import React, { useEffect, useState } from "react";
import {
  X,
  ArrowDownCircle,
  ArrowUpCircle,
  Archive,
  RotateCcw,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ItemTimelineModal({ isOpen, onClose, item }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTimeline = async () => {
    if (!item?.itemRef) return;

    try {
      setLoading(true);

      const res = await fetch(
        `${BASE_URL}/stock-transactions/item/${item.itemRef}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch item timeline");
      }

      setRecords(data.data || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchTimeline();
  }, [isOpen, item]);

  if (!isOpen) return null;

  const formatDateTime = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getIcon = (direction) => {
    if (direction === "IN") return ArrowDownCircle;
    if (direction === "OUT") return ArrowUpCircle;
    if (direction === "RESERVE") return Archive;
    if (direction === "RELEASE") return RotateCcw;
    return Clock;
  };

  const getClass = (direction) => {
    if (direction === "IN") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (direction === "OUT") return "text-red-400 bg-red-500/10 border-red-500/30";
    if (direction === "RESERVE") return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    if (direction === "RELEASE") return "text-sky-400 bg-sky-500/10 border-sky-500/30";
    return "text-slate-400 bg-slate-500/10 border-slate-500/30";
  };

  const getSign = (direction) => {
    if (direction === "IN" || direction === "RELEASE") return "+";
    if (direction === "OUT" || direction === "RESERVE") return "-";
    return "";
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">
              Item Timeline
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {item?.itemName || "-"}{" "}
              {item?.itemCode ? `• ${item.itemCode}` : ""}
            </p>
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl bg-slate-900 hover:bg-slate-800 flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[75vh]">
          {loading ? (
            <div className="text-center text-slate-400 py-10">
              Loading timeline...
            </div>
          ) : records.length === 0 ? (
            <div className="text-center text-slate-400 py-10">
              No timeline found for this item.
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-800" />

              <div className="space-y-4">
                {records.map((txn) => {
                  const Icon = getIcon(txn.direction);

                  return (
                    <div key={txn._id} className="relative pl-14">
                      <div
                        className={`absolute left-0 top-1 h-10 w-10 rounded-full border flex items-center justify-center ${getClass(
                          txn.direction
                        )}`}
                      >
                        <Icon size={18} />
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-white">
                              {txn.transactionType}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">
                              {formatDateTime(txn.createdAt)}
                            </p>
                          </div>

                          <div
                            className={`px-3 py-1 rounded-full border text-xs font-semibold w-fit ${getClass(
                              txn.direction
                            )}`}
                          >
                            {txn.direction}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 text-sm">
                          <div>
                            <p className="text-slate-500">Qty</p>
                            <p className="font-bold text-white">
                              {getSign(txn.direction)}
                              {txn.quantity}
                            </p>
                          </div>

                          <div>
                            <p className="text-slate-500">Before</p>
                            <p className="font-semibold">
                              {txn.beforeStock ?? 0}
                            </p>
                          </div>

                          <div>
                            <p className="text-slate-500">After</p>
                            <p className="font-semibold">
                              {txn.afterStock ?? 0}
                            </p>
                          </div>

                          <div>
                            <p className="text-slate-500">Reference</p>
                            <p className="font-semibold">
                              {txn.referenceNumber || "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-slate-500">Store/Site</p>
                            <p className="font-semibold">
                              {txn.mainStoreRef?.storeName ||
                                txn.siteRef?.projectName ||
                                txn.siteRef?.name ||
                                "-"}
                            </p>
                          </div>
                        </div>

                        {txn.remarks && (
                          <p className="mt-3 text-sm text-slate-400">
                            {txn.remarks}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
