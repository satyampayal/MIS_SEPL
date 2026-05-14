import React from "react";
import { toWords } from "number-to-words";

export default function ChallanPreview({
  formData,
  items,
  totalAmount,
  onBack,
  onConfirm,
}) {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });

  const amountInWords = (amount) => {
  if (!amount) return "Zero Rupees Only";

  return `${toWords(Number(amount))
    .replace(/\b\w/g, (char) => char.toUpperCase())} Rupees Only`;
};
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl max-h-[94vh] overflow-y-auto rounded-xl shadow-xl">
        <div className="p-6 text-[13px] text-black">
          <div className="border border-black p-4">
            <div className="text-center border-b border-black pb-3">
              <h1 className="text-xl font-bold uppercase text-blue-600">
                Sachin Electrical Private Limited
              </h1>
              <p>
                2B/536, Vasundhara, Sahibabad, Ghaziabad, Uttar Pradesh,
                201012 - India
              </p>
              <p>
                Phone : 0120 4155654 / Email : info@sachinelectrical.com
              </p>
              <p className="font-semibold">GSTIN:- 09AAKCS1319M1ZZ</p>
            </div>

            <div className="grid grid-cols-3 border-b border-black py-2">
              <div className="font-semibold">CONSIGNEE COPY</div>
              <div className="text-center font-bold text-lg">
                Delivery Challan
              </div>
              <div className="text-right">
                Date -: {formData.dispatchDate || today}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-black py-3">
              <div>
                <p>
                  <b>Document Number - </b>
                  {formData.challanNumber || "Auto Generated"}
                </p>
                <p>
                  <b>Place of Supply -: </b>
                  {formData.placeOfSupply || "-"}
                </p>
                <p>
                  <b>Dispatch Date: </b>
                  {formData.dispatchDate || "-"}
                </p>
              </div>

              <div>
                <p>
                  <b>Transportation Mode: </b>
                  {formData.transportationMode || "-"}
                </p>
                <p>
                  <b>Transport Details: </b>
                  {formData.transporterName || "-"}
                </p>
                <p>
                  <b>Vehicle No.: </b>
                  {formData.vehicleNumber || "-"}
                </p>
              </div>
            </div>

            <div className="border-b border-black py-3 space-y-1">
              <p>
                <b>Consignee Name : </b>
                {formData.consigneeName || formData.vendorName || "-"}
              </p>
              <p>
                <b>Consignee Address : </b>
                {formData.consigneeAddress || "-"}
              </p>
              <p>
                <b>Name of Project / Site : </b>
                {formData.projectName || "-"}
                {formData.site ? ` / ${formData.site}` : ""}
              </p>
              <p>
                <b>GSTIN : </b>
                {formData.consigneeGstin || "-"}
              </p>
            </div>

            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  <th className="border border-black p-1 w-10">Sr. No.</th>
                  <th className="border border-black p-1">
                    Material Description
                  </th>
                  <th className="border border-black p-1 w-16">UOM</th>
                  <th className="border border-black p-1 w-16">Qty</th>
                  <th className="border border-black p-1 w-24">HSN Code</th>
                  <th className="border border-black p-1 w-20">BOQ No.</th>
                  <th className="border border-black p-1 w-20">Rate</th>
                  <th className="border border-black p-1 w-24">Amount</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-black p-1 text-center">
                      {index + 1}
                    </td>
                    <td className="border border-black p-1">
                      {item.description || item.itemName}
                    </td>
                    <td className="border border-black p-1 text-center">
                      {item.unit}
                    </td>
                    <td className="border border-black p-1 text-center">
                      {item.quantity}
                    </td>
                    <td className="border border-black p-1 text-center">
                      {item.hsnCode || "-"}
                    </td>
                    <td className="border border-black p-1 text-center">
                      {item.boqNo || "-"}
                    </td>
                    <td className="border border-black p-1 text-right">
                      {Number(item.rate || 0).toFixed(2)}
                    </td>
                    <td className="border border-black p-1 text-right">
                      {Number(item.amount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}

                {Array.from({ length: Math.max(0, 12 - items.length) }).map(
                  (_, index) => (
                    <tr key={`blank-${index}`}>
                      <td className="border border-black p-1 h-7">&nbsp;</td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                    </tr>
                  )
                )}

                <tr>
                  <td
                    colSpan="7"
                    className="border border-black p-2 text-right font-bold"
                  >
                    Total
                  </td>
                  <td className="border border-black p-2 text-right font-bold">
                    ₹ {Number(totalAmount || 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="border-x border-b border-black p-3 space-y-2">
              <p>
                <b>Challan Total in Words: - </b>
              {amountInWords(totalAmount)}
              </p>

              <p>
                <b>Remarks-: </b>
                {formData.remarks || ""}
              </p>

              <p className="font-semibold">
                Certified that the above material is not for sale & is being
                sent for Job work
              </p>
            </div>

            <div className="grid grid-cols-2 border-x border-b border-black">
              <div className="p-3 min-h-[110px]">
                <p>
                  <b>Material handed over to -:</b>{" "}
                  {formData.sentBy || "___________________"}
                </p>

                <div className="mt-10">
                  <p>Received by :- ___________________</p>
                  <p className="mt-3">Received Date : ____________________</p>
                </div>
              </div>

              <div className="p-3 min-h-[110px] text-right">
                <p>
                  <b>Authorised Signatory:</b>
                </p>

                <div className="mt-16">
                  <p>For Sachin Electrical Pvt. Ltd.</p>
                </div>
              </div>
            </div>

            <div className="text-right text-xs mt-2">Page 1 of 1</div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-3">
          <button onClick={onBack} className="px-5 py-2.5 rounded-xl border">
            Back to Edit
          </button>

          <button
            onClick={() => window.print()}
            className="px-5 py-2.5 rounded-xl border border-slate-400"
          >
            Print
          </button>

          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white"
          >
            Confirm & Save
          </button>
        </div>
      </div>
    </div>
  );
}