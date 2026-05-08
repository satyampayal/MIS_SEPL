import React from "react";

export default function ChallanPreview({ formData, items, totalAmount, onBack, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-xl">
        <div className="p-8 border-b">
          <h2 className="text-2xl font-bold text-center">DELIVERY CHALLAN</h2>
          <p className="text-center text-sm text-gray-500 mt-1">
            Preview before final save
          </p>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p><b>Project:</b> {formData.projectName}</p>
            <p><b>Site:</b> {formData.site || "-"}</p>
            <p><b>Dispatch From:</b> {formData.dispatchFrom}</p>
            <p><b>Dispatch To:</b> {formData.dispatchTo}</p>
            <p><b>Vendor:</b> {formData.vendorName || "-"}</p>
            <p><b>Date:</b> {formData.dispatchDate}</p>
            <p><b>Vehicle No:</b> {formData.vehicleNumber || "-"}</p>
            <p><b>Sent By:</b> {formData.sentBy || "-"}</p>
          </div>

          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Sr</th>
                <th className="border p-2">Item</th>
                <th className="border p-2">Description</th>
                <th className="border p-2">HSN</th>
                <th className="border p-2">Qty</th>
                <th className="border p-2">Unit</th>
                <th className="border p-2">Rate</th>
                <th className="border p-2">Amount</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="border p-2 text-center">{index + 1}</td>
                  <td className="border p-2">{item.itemName}</td>
                  <td className="border p-2">{item.description}</td>
                  <td className="border p-2">{item.hsnCode}</td>
                  <td className="border p-2 text-center">{item.quantity}</td>
                  <td className="border p-2 text-center">{item.unit}</td>
                  <td className="border p-2 text-right">₹{item.rate}</td>
                  <td className="border p-2 text-right">₹{item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Amount</p>
              <h3 className="text-2xl font-bold">₹{totalAmount}</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 pt-10 text-sm">
            <div>
              <div className="border-t pt-2">Authorized Signature</div>
            </div>
            <div>
              <div className="border-t pt-2">Receiver Signature</div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-3">
          <button onClick={onBack} className="px-5 py-2.5 rounded-xl border">
            Back to Edit
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