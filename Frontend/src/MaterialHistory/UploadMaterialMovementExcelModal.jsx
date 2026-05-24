import React, { useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  X,
  Loader2,
  Eye,
} from "lucide-react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import BASE_URL from "../../config/api";

export default function UploadMaterialMovementExcelModal({
  isOpen,
  onClose,
  refreshData,
}) {
  const [excelFile, setExcelFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    try {
      const file = e.target.files[0];

      if (!file) return;

      setExcelFile(file);

      const data = await file.arrayBuffer();

      const workbook = XLSX.read(data);

      const sheetName = workbook.SheetNames[0];

      const sheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
      });

      setPreviewData(jsonData.slice(0, 10));
    } catch (error) {
      console.log(error);
      toast.error("Failed to preview Excel");
    }
  };

  const handleUpload = async () => {
    try {
      if (!excelFile) {
        return toast.error("Please select Excel file");
      }

      setLoading(true);

      const formData = new FormData();

      formData.append("file", excelFile);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${BASE_URL}/material-movement/bulk-upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || "Excel uploaded successfully");

        refreshData();

        onClose();

        setExcelFile(null);
        setPreviewData([]);
      } else {
        toast.error(data.message || "Upload failed");
      }
    } catch (error) {
      console.log(error);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">

      <div className="relative bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-gray-200 animate-fadeIn max-h-[95vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div>
            <h2 className="text-2xl font-bold">
              Upload Material Movement Excel
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Upload bulk material history through Excel sheet
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-6">

          <div className="border-2 border-dashed border-blue-300 rounded-3xl p-10 text-center bg-blue-50">

            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-5 rounded-full">
                <FileSpreadsheet className="text-blue-600" size={45} />
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-2">
              Select Excel File
            </h3>

            <p className="text-gray-500 mb-5">
              Supported formats: .xlsx, .xls
            </p>

            <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl cursor-pointer hover:bg-blue-700 transition">
              <Upload size={18} />

              Choose Excel File

              <input
                type="file"
                accept=".xlsx,.xls"
                hidden
                onChange={handleFileChange}
              />
            </label>

            {excelFile && (
              <div className="mt-5 text-sm text-gray-700 font-medium">
                Selected File: {excelFile.name}
              </div>
            )}
          </div>

          {previewData.length > 0 && (
            <div className="mt-8">

              <div className="flex items-center gap-2 mb-4">
                <Eye className="text-blue-600" size={20} />
                <h3 className="text-xl font-semibold">
                  Excel Preview
                </h3>
              </div>

              <div className="overflow-auto border rounded-2xl max-h-[400px]">
                <table className="w-full text-sm">

                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      {Object.keys(previewData[0]).map((key) => (
                        <th
                          key={key}
                          className="p-3 text-left whitespace-nowrap"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {previewData.map((row, index) => (
                      <tr
                        key={index}
                        className="border-b hover:bg-gray-50"
                      >
                        {Object.values(row).map((value, i) => (
                          <td
                            key={i}
                            className="p-3 whitespace-nowrap"
                          >
                            {String(value || "-")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>

              <p className="text-xs text-gray-500 mt-3">
                Showing first 10 rows preview only
              </p>
            </div>
          )}

        </div>

        <div className="flex justify-end gap-3 px-6 py-5 border-t bg-gray-50">

          <button
            onClick={onClose}
            className="px-5 py-3 rounded-2xl border hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={handleUpload}
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload Excel
              </>
            )}
          </button>

        </div>

      </div>
    </div>
  );
}