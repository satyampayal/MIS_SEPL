import React, { useEffect, useState } from "react";
import { Plus, ArrowLeft, Eye, Trash2, Upload } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import BASE_URL from "../../config/api";

export default function BOQManagementPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [boqs, setBoqs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    boqName: "",
    boqType: "CLIENT",
    revisionNo: 0,
    contractorRef: "",
    remarks: "",
  });

  const fetchBOQs = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/boq/project/${projectId}`);
      const data = await res.json();

      if (data.success) {
        setBoqs(data.boqs || []);
      } else {
        toast.error(data.message || "Failed to fetch BOQ");
      }
    } catch (error) {
      toast.error("Server error while fetching BOQ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBOQs();
  }, [projectId]);

  const handleCreateBOQ = async () => {
    try {
      if (!formData.boqName.trim()) {
        toast.error("BOQ name is required");
        return;
      }

      const payload = {
        projectRef: projectId,
        boqName: formData.boqName,
        boqType: formData.boqType,
        revisionNo: Number(formData.revisionNo) || 0,
        contractorRef: formData.contractorRef || null,
        remarks: formData.remarks,
      };

      const res = await fetch(`${BASE_URL}/boq/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("BOQ created successfully");
        setShowAddModal(false);
        setFormData({
          boqName: "",
          boqType: "CLIENT",
          revisionNo: 0,
          contractorRef: "",
          remarks: "",
        });
        fetchBOQs();
      } else {
        toast.error(data.message || "Failed to create BOQ");
      }
    } catch (error) {
      toast.error("Server error while creating BOQ");
    }
  };

  const handleDeleteBOQ = async (boqId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this BOQ?"
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch(`${BASE_URL}/boq/${boqId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        toast.success("BOQ deleted successfully");
        fetchBOQs();
      } else {
        toast.error(data.message || "Failed to delete BOQ");
      }
    } catch (error) {
      toast.error("Server error while deleting BOQ");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm border p-5 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              BOQ Management
            </h1>
            <p className="text-sm text-slate-500">
              Manage project-wise client, contractor, revised and extra work BOQ.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={18} />
            Add BOQ
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3 text-left">BOQ Name</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Revision</th>
                <th className="p-3 text-left">Contractor</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-slate-500">
                    Loading BOQ...
                  </td>
                </tr>
              ) : boqs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-slate-500">
                    No BOQ found for this project.
                  </td>
                </tr>
              ) : (
                boqs.map((boq) => (
                  <tr key={boq._id} className="border-t hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-800">
                      {boq.boqName}
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-1 rounded-lg text-xs bg-indigo-100 text-indigo-700">
                        {boq.boqType}
                      </span>
                    </td>

                    <td className="p-3">Rev-{boq.revisionNo}</td>

                    <td className="p-3">
                      {boq.contractorRef?.contractorName ||
                        boq.contractorRef?.name ||
                        "-"}
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-1 rounded-lg text-xs bg-green-100 text-green-700">
                        {boq.status}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => navigate(`/boq/${boq._id}`)}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200"
                          title="View BOQ"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={() => navigate(`/boq/${boq._id}/upload`)}
                          className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                          title="Upload Excel"
                        >
                          <Upload size={16} />
                        </button>

                        <button
                          onClick={() => handleDeleteBOQ(boq._id)}
                          className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                          title="Delete BOQ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">Add New BOQ</h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="BOQ Name"
                value={formData.boqName}
                onChange={(e) =>
                  setFormData({ ...formData, boqName: e.target.value })
                }
                className="w-full border rounded-xl px-3 py-2"
              />

              <select
                value={formData.boqType}
                onChange={(e) =>
                  setFormData({ ...formData, boqType: e.target.value })
                }
                className="w-full border rounded-xl px-3 py-2"
              >
                <option value="CLIENT">Client BOQ</option>
                <option value="CONTRACTOR">Contractor BOQ</option>
                <option value="REVISED">Revised BOQ</option>
                <option value="EXTRA_WORK">Extra Work BOQ</option>
              </select>

              <input
                type="number"
                placeholder="Revision No"
                value={formData.revisionNo}
                onChange={(e) =>
                  setFormData({ ...formData, revisionNo: e.target.value })
                }
                className="w-full border rounded-xl px-3 py-2"
              />

              <input
                type="text"
                placeholder="Contractor ID optional"
                value={formData.contractorRef}
                onChange={(e) =>
                  setFormData({ ...formData, contractorRef: e.target.value })
                }
                className="w-full border rounded-xl px-3 py-2"
              />

              <textarea
                placeholder="Remarks"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                className="w-full border rounded-xl px-3 py-2"
                rows="3"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border"
              >
                Cancel
              </button>

              <button
                onClick={handleCreateBOQ}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              >
                Create BOQ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}