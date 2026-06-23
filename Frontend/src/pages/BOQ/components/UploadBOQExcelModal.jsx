import { useState } from "react";
import axios from "axios";
import { X, UploadCloud, FileSpreadsheet } from "lucide-react";
import toast from "react-hot-toast";

// const BASE_URL = import.meta.env.VITE_API_URL;
import BASE_URL from "../../../../config/api";


const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

export default function UploadBOQExcelModal({ boq, onClose, onSuccess }) {
  const [excelFile, setExcelFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!excelFile) {
      return toast.error("Please select BOQ Excel file");
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("excelFile", excelFile);

      const res = await axios.post(
        `${BASE_URL}/boq/${boq._id}/upload-excel`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success(res.data?.message || "BOQ Excel uploaded successfully");
      onSuccess?.();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to upload BOQ Excel"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Upload BOQ Excel
            </h2>
            <p className="text-sm text-slate-400">
              {boq?.boqName || boq?.title || "Selected BOQ"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-700 rounded-3xl p-8 cursor-pointer hover:border-cyan-500/60 hover:bg-cyan-500/5 transition">
            <UploadCloud className="text-cyan-400" size={42} />

            <div className="text-center">
              <p className="text-white font-medium">
                Click to select Excel file
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supported: .xlsx, .xls
              </p>
            </div>

            <input
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={(e) => setExcelFile(e.target.files[0])}
            />
          </label>

          {excelFile && (
            <div className="flex items-center gap-3 rounded-2xl bg-slate-900 border border-slate-800 p-4">
              <FileSpreadsheet className="text-emerald-400" />
              <div>
                <p className="text-sm text-white">{excelFile.name}</p>
                <p className="text-xs text-slate-500">
                  {(excelFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </button>

          <button
            onClick={handleUpload}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 disabled:opacity-60"
          >
            {loading ? "Uploading..." : "Upload Excel"}
          </button>
        </div>
      </div>
    </div>
  );
}