import React, { useState } from "react";
import * as XLSX from "xlsx";
import { UploadCloud, FileSpreadsheet, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import BASE_URL from "../../config/api";

export default function BulkTaxInvoiceUpload({ isOpen, onClose, refreshInvoices }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  if (!isOpen) return null;

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
      });

      const formattedData = jsonData.map((row) => ({
        invoiceNumber: row.invoiceNumber || row["Invoice Number"] || "",
        invoiceDate: row.invoiceDate || row["Invoice Date"] || "",
        vendorName: row.vendorName || row["Vendor Name"] || "",
        invoiceAmount: row.invoiceAmount || row["Invoice Amount"] || "",
        projectSite: row.projectSite || row["Project Site"] || "",
        deliveryStatus: row.deliveryStatus || row["Delivery Status"] || "",
        challanNumber: row.challanNumber || row["Challan Number"] || "",
        challanDate: row.challanDate || row["Challan Date"] || "",
        quantitySent: row.quantitySent || row["Quantity Sent"] || "",
        quantityReceived: row.quantityReceived || row["Quantity Received"] || "",
        remarks: row.remarks || row["Remarks"] || "",
      }));

      setRows(formattedData);
      toast.success(`${formattedData.length} invoices loaded from Excel`);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleBulkSubmit = async () => {
    if (rows.length === 0) {
      toast.error("Please upload Excel first");
      return;
    }

    const invalidRow = rows.find(
      (item) =>
        !item.invoiceNumber ||
        !item.invoiceDate ||
        !item.vendorName ||
        !item.invoiceAmount ||
        !item.projectSite
    );

    if (invalidRow) {
      toast.error("Some rows have missing required fields");
      return;
    }

    try {
      setLoading(true);

      const loadingToast = toast.loading("Uploading bulk invoices...");

      const res = await fetch(`${BASE_URL}/tax-invoice/bulk-entery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(rows),
      });

      const data = await res.json();

      toast.dismiss(loadingToast);

      if (res.ok) {
        toast.success(data.message || "Bulk invoices saved successfully");
        refreshInvoices();
        onClose();
        setRows([]);
      } else {
        toast.error(data.message || "Bulk upload failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Server error while bulk uploading");
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = () => {
    const sample = [
      {
        invoiceNumber: "INV-001",
        invoiceDate: "2026-05-15",
        vendorName: "ABC Electricals",
        invoiceAmount: 15000,
        projectSite: "Project A",
        deliveryStatus: "delivered",
        challanNumber: "CH-001",
        challanDate: "2026-05-15",
        quantitySent: 10,
        quantityReceived: 10,
        remarks: "Sample row",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sample);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Tax Invoice Sample");
    XLSX.writeFile(workbook, "tax-invoice-sample.xlsx");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileSpreadsheet className="text-green-600" />
              Bulk Tax Invoice Upload
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Upload Excel, preview records, then save all invoices together.
            </p>
          </div>

          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X size={22} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <label className="border-2 border-dashed border-green-300 bg-green-50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-green-100">
              <UploadCloud size={36} className="text-green-600 mb-3" />
              <p className="font-semibold">Click to upload Excel file</p>
              <p className="text-sm text-gray-500 mt-1">Only .xlsx or .xls</p>

              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                className="hidden"
              />
            </label>

            <div className="border rounded-2xl p-6 bg-gray-50">
              <h3 className="font-bold mb-2">Required Excel Columns</h3>
              <p className="text-sm text-gray-600 mb-4">
                Use these column names for best matching:
              </p>

              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  "invoiceNumber",
                  "invoiceDate",
                  "vendorName",
                  "invoiceAmount",
                  "projectSite",
                  "deliveryStatus",
                  "challanNumber",
                  "challanDate",
                  "quantitySent",
                  "quantityReceived",
                  "remarks",
                ].map((item) => (
                  <span key={item} className="px-3 py-1 bg-white border rounded-full">
                    {item}
                  </span>
                ))}
              </div>

              <button
                onClick={downloadSample}
                className="mt-5 px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700"
              >
                Download Sample Excel
              </button>
            </div>
          </div>

          <div className="mb-3 font-semibold">
            Preview Records: {rows.length}
          </div>

          {rows.length > 0 ? (
            <div className="border rounded-2xl overflow-auto max-h-[420px]">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-3 text-left">#</th>
                    <th className="p-3 text-left">Invoice No</th>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Vendor</th>
                    <th className="p-3 text-left">Amount</th>
                    <th className="p-3 text-left">Project</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">{row.invoiceNumber}</td>
                      <td className="p-3">{row.invoiceDate}</td>
                      <td className="p-3">{row.vendorName}</td>
                      <td className="p-3">₹{row.invoiceAmount}</td>
                      <td className="p-3">{row.projectSite}</td>
                      <td className="p-3">{row.deliveryStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border rounded-2xl p-10 text-center text-gray-500">
              No Excel data loaded yet.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-5 border-t">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-3 rounded-xl border hover:bg-gray-50"
          >
            Close
          </button>

          <button
            onClick={handleBulkSubmit}
            disabled={loading || rows.length === 0}
            className="px-5 py-3 rounded-xl bg-green-600 text-white font-medium disabled:bg-gray-400 flex items-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            Save Bulk Invoices
          </button>
        </div>
      </div>
    </div>
  );
}