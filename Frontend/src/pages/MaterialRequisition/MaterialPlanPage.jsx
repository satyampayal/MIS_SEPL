import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, PackageCheck, ShoppingCart } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import BASE_URL from "../../../config/api";

const MRQ_API = `${BASE_URL}/material-requisition`;
const PROCUREMENT_API = `${BASE_URL}/procurement-plan`;

const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

export default function MaterialPlanPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [mrq, setMrq] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchMRQ = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${MRQ_API}/${id}`, authHeader());
      setMrq(res.data.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load MRQ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMRQ();
  }, [id]);

  const groups = useMemo(() => {
    const items = mrq?.items || [];

    const available = items.filter(
      (item) => Number(item.availableQty || 0) >= Number(item.requiredQty || 0)
    );

    const partial = items.filter(
      (item) =>
        Number(item.availableQty || 0) > 0 &&
        Number(item.availableQty || 0) < Number(item.requiredQty || 0)
    );

    const purchase = items.filter(
      (item) => Number(item.availableQty || 0) <= 0
    );

    return { available, partial, purchase };
  }, [mrq]);

  const createDCPlan = () => {
    const dcItems = [...groups.available, ...groups.partial].map((item) => ({
      itemRef: item.itemRef?._id || item.itemRef,
      itemName: item.itemName,
      itemCode: item.itemCode,
      unit: item.unit,
      quantity:
        Number(item.availableQty || 0) >= Number(item.requiredQty || 0)
          ? Number(item.requiredQty || 0)
          : Number(item.availableQty || 0),
      rate: 0,
      amount: 0,
    }));

    if (dcItems.length === 0) {
      toast.error("No store available item for DC");
      return;
    }

    console.log("DC PLAN ITEMS =>", dcItems);
    toast.success("DC Plan ready. Next connect this with Challan Modal.");
  };

const createPurchasePlan = async () => {
  const purchaseItems = [...groups.partial, ...groups.purchase].map((item) => ({
    itemRef: item.itemRef?._id || item.itemRef,
    itemName: item.itemName,
    itemCode: item.itemCode,
    unit: item.unit,
    requiredQty: Number(item.requiredQty || 0),
    availableQty: Number(item.availableQty || 0),
    shortageQty:
      Number(item.shortageQty || 0) ||
      Math.max(
        Number(item.requiredQty || 0) - Number(item.availableQty || 0),
        0
      ),
    procurementMode: "MRN",
    remarks: `Created from ${mrq.requisitionNumber}`,
  }));

  if (purchaseItems.length === 0) {
    toast.error("No shortage item for purchase");
    return;
  }

  try {
    await axios.post(
      `${PROCUREMENT_API}/create`,
      {
        materialRequisitionRef: mrq._id,
        projectRef: mrq.projectRef?._id || mrq.projectRef,
        items: purchaseItems,
      },
      authHeader()
    );

    toast.success("Procurement plan created successfully");
  } catch (error) {
    toast.error(
      error?.response?.data?.message || "Failed to create procurement plan"
    );
  }
};

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <Loader2 className="mr-2 animate-spin" />
        Loading material plan...
      </div>
    );
  }

  if (!mrq) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 text-slate-300">
        MRQ not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 rounded-xl px-4 py-2 text-slate-300 hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <p className="text-xs font-semibold uppercase tracking-wide text-purple-300">
            Material Planning
          </p>

          <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">
            Plan for {mrq.requisitionNumber}
          </h1>

          <p className="mt-2 text-slate-400">
            {mrq.projectRef?.projectName || mrq.projectRef?.name || "-"}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            title="Available For DC"
            value={groups.available.length}
            tone="text-emerald-300"
          />
          <SummaryCard
            title="Partial DC + Purchase"
            value={groups.partial.length}
            tone="text-amber-300"
          />
          <SummaryCard
            title="Need Purchase"
            value={groups.purchase.length}
            tone="text-red-300"
          />
        </div>

        <PlanSection
          title="Available Items"
          subtitle="These can be issued from main store through DC."
          items={groups.available}
          badge="DC"
          badgeClass="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
        />

        <PlanSection
          title="Partially Available Items"
          subtitle="Available qty can go by DC, shortage should go to purchase."
          items={groups.partial}
          badge="DC + PURCHASE"
          badgeClass="border-amber-500/30 bg-amber-500/10 text-amber-300"
        />

        <PlanSection
          title="Not Available Items"
          subtitle="These items should be forwarded to purchase."
          items={groups.purchase}
          badge="PURCHASE"
          badgeClass="border-red-500/30 bg-red-500/10 text-red-300"
        />

        <div className="flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-900 p-5 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-400">
            Material plan separates store dispatch and purchase shortage.
          </p>

          <div className="flex gap-3">
            <button
              onClick={createPurchasePlan}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 font-semibold text-amber-300 hover:bg-amber-500/20"
            >
              <ShoppingCart size={18} />
              Create Purchase Plan
            </button>

            <button
              onClick={createDCPlan}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
            >
              <PackageCheck size={18} />
              Create DC Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, tone }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <h2 className={`mt-2 text-3xl font-bold ${tone}`}>{value}</h2>
    </div>
  );
}

function PlanSection({ title, subtitle, items, badge, badgeClass }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80">
      <div className="border-b border-slate-800 px-5 py-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-bold text-white">{title}</h2>
            <p className="text-sm text-slate-400">{subtitle}</p>
          </div>

          <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}>
            {badge}
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center text-slate-500">No items</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="bg-slate-950 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-4 text-left">Item</th>
                <th className="p-4 text-left">Code</th>
                <th className="p-4 text-right">Required</th>
                <th className="p-4 text-right">Available</th>
                <th className="p-4 text-right">Shortage</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {items.map((item, index) => (
                <tr key={index} className="hover:bg-slate-800/50">
                  <td className="p-4 font-semibold text-white">
                    {item.itemName || "-"}
                    <div className="text-xs text-slate-500">
                      {item.unit || ""}
                    </div>
                  </td>

                  <td className="p-4 text-cyan-300">{item.itemCode || "-"}</td>

                  <td className="p-4 text-right text-white">
                    {item.requiredQty || 0}
                  </td>

                  <td className="p-4 text-right text-emerald-300">
                    {item.availableQty || 0}
                  </td>

                  <td className="p-4 text-right font-semibold text-red-300">
                    {item.shortageQty || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}