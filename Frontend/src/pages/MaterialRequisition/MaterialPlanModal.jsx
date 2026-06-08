




// export default function MaterialPlanModal({
//   mrq,
//   onClose,
//   onCreateDC,
//   onCreatePurchase,
// }) {
//   const availableItems = (mrq.items || []).filter(
//     (item) => Number(item.availableQty || 0) >= Number(item.requiredQty || 0)
//   );

//   const partialItems = (mrq.items || []).filter(
//     (item) =>
//       Number(item.availableQty || 0) > 0 &&
//       Number(item.availableQty || 0) < Number(item.requiredQty || 0)
//   );

//   const purchaseItems = (mrq.items || []).filter(
//     (item) => Number(item.availableQty || 0) <= 0
//   );

//   const createDcForAvailable = () => {
//     const dcItems = [...availableItems, ...partialItems].map((item) => ({
//       itemRef: item.itemRef?._id || item.itemRef,
//       itemName: item.itemName,
//       itemCode: item.itemCode,
//       unit: item.unit,
//       quantity:
//         Number(item.availableQty || 0) >= Number(item.requiredQty || 0)
//           ? Number(item.requiredQty || 0)
//           : Number(item.availableQty || 0),
//       rate: 0,
//       amount: 0,
//     }));

//     if (dcItems.length === 0) {
//       toast.error("No available stock item for DC");
//       return;
//     }

//     console.log("DC ITEMS FROM MRQ =>", dcItems);

//     toast.success("DC item plan ready. Next we connect Challan modal.");
//   };

//   const createPurchaseRequest = () => {
//     const prItems = [...partialItems, ...purchaseItems].map((item) => ({
//       itemRef: item.itemRef?._id || item.itemRef,
//       itemName: item.itemName,
//       itemCode: item.itemCode,
//       unit: item.unit,
//       requiredQty: Number(item.requiredQty || 0),
//       availableQty: Number(item.availableQty || 0),
//       shortageQty:
//         Number(item.shortageQty || 0) ||
//         Math.max(
//           Number(item.requiredQty || 0) - Number(item.availableQty || 0),
//           0
//         ),
//     }));

//     if (prItems.length === 0) {
//       toast.error("No shortage item for purchase");
//       return;
//     }

//     console.log("PURCHASE ITEMS FROM MRQ =>", prItems);

//     toast.success("Purchase requirement plan ready. PR module is next.");
//   };

//   return (
//     <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4">
//       <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
//         <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
//           <div>
//             <p className="text-xs font-semibold uppercase tracking-wide text-purple-300">
//               Material Planning
//             </p>
//             <h2 className="text-xl font-bold text-white">
//               Plan for {mrq.requisitionNumber}
//             </h2>
//             <p className="mt-1 text-sm text-slate-400">
//               {mrq.projectRef?.projectName || mrq.projectRef?.name || "-"}
//             </p>
//           </div>

//           <button
//             onClick={onClose}
//             className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
//           >
//             <X size={22} />
//           </button>
//         </div>

//         <div className="grid gap-4 border-b border-slate-800 p-5 md:grid-cols-3">
//           <PlanSummaryCard
//             title="Available for DC"
//             value={availableItems.length}
//             tone="text-emerald-300"
//           />

//           <PlanSummaryCard
//             title="Partial DC + Purchase"
//             value={partialItems.length}
//             tone="text-amber-300"
//           />

//           <PlanSummaryCard
//             title="Need Purchase"
//             value={purchaseItems.length}
//             tone="text-red-300"
//           />
//         </div>

//         <div className="flex-1 space-y-5 overflow-y-auto p-5">
//           <PlanSection
//             title="Available Items"
//             subtitle="These items can be issued from main store through DC."
//             items={availableItems}
//             badge="DC"
//             badgeClass="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
//           />

//           <PlanSection
//             title="Partially Available Items"
//             subtitle="Available quantity can go by DC, shortage should go to purchase."
//             items={partialItems}
//             badge="DC + PURCHASE"
//             badgeClass="border-amber-500/30 bg-amber-500/10 text-amber-300"
//           />

//           <PlanSection
//             title="Not Available Items"
//             subtitle="These items should be forwarded to purchase."
//             items={purchaseItems}
//             badge="PURCHASE"
//             badgeClass="border-red-500/30 bg-red-500/10 text-red-300"
//           />
//         </div>

//         <div className="flex flex-col gap-3 border-t border-slate-800 px-6 py-4 md:flex-row md:items-center md:justify-between">
//           <p className="text-sm text-slate-400">
//             This plan separates store dispatch and purchase shortage.
//           </p>

//           <div className="flex gap-3">
//             <button
//               onClick={createPurchaseRequest}
//               className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 font-semibold text-amber-300 hover:bg-amber-500/20"
//             >
//               Create Purchase Plan
//             </button>

//             <button
//               onClick={createDcForAvailable}
//               className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
//             >
//               Create DC Plan
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function PlanSummaryCard({ title, value, tone }) {
//   return (
//     <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
//       <p className="text-sm text-slate-400">{title}</p>
//       <h3 className={`mt-2 text-2xl font-bold ${tone}`}>{value}</h3>
//     </div>
//   );
// }

// function PlanSection({ title, subtitle, items, badge, badgeClass }) {
//   return (
//     <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
//       <div className="border-b border-slate-800 px-5 py-4">
//         <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
//           <div>
//             <h3 className="font-bold text-white">{title}</h3>
//             <p className="text-sm text-slate-400">{subtitle}</p>
//           </div>

//           <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}>
//             {badge}
//           </span>
//         </div>
//       </div>

//       {items.length === 0 ? (
//         <div className="p-6 text-center text-slate-500">No items</div>
//       ) : (
//         <div className="overflow-x-auto">
//           <table className="w-full min-w-[850px] text-sm">
//             <thead className="bg-slate-950 text-xs uppercase text-slate-500">
//               <tr>
//                 <th className="p-4 text-left">Item</th>
//                 <th className="p-4 text-left">Code</th>
//                 <th className="p-4 text-right">Required</th>
//                 <th className="p-4 text-right">Available</th>
//                 <th className="p-4 text-right">Shortage</th>
//               </tr>
//             </thead>

//             <tbody className="divide-y divide-slate-800">
//               {items.map((item, index) => (
//                 <tr key={index} className="hover:bg-slate-800/50">
//                   <td className="p-4 font-semibold text-white">
//                     {item.itemName || "-"}
//                     <div className="text-xs text-slate-500">
//                       {item.unit || ""}
//                     </div>
//                   </td>

//                   <td className="p-4 text-cyan-300">
//                     {item.itemCode || "-"}
//                   </td>

//                   <td className="p-4 text-right text-white">
//                     {item.requiredQty || 0}
//                   </td>

//                   <td className="p-4 text-right text-emerald-300">
//                     {item.availableQty || 0}
//                   </td>

//                   <td className="p-4 text-right font-semibold text-red-300">
//                     {item.shortageQty || 0}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }