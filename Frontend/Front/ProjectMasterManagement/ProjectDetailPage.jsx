import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Plus } from "lucide-react";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch project
  const fetchProject = async () => {
    try {
      const res = await fetch(`http://localhost:5000/project-master/get/${projectId}`);
      const data = await res.json();
      setProject(data.data);
      console.log(DataTransfer)
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  if (!project) return <div className="p-6">Project not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* 🔙 Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-4 text-gray-600 hover:text-black"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* 🧾 PROJECT SUMMARY */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6 border">
          <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
          <p className="text-gray-500 mb-4">Code: {project.code}</p>

          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <p><strong>Client:</strong> {project.clientName}</p>
            <p><strong>Location:</strong> {project.location}</p>
            <p><strong>Manager:</strong> {project.manager}</p>
            <p><strong>Phone:</strong> {project.phone}</p>
            <p><strong>Order No:</strong> {project.orderNumber}</p>
            <p><strong>Status:</strong> {project.status}</p>
          </div>

          {/* 📊 Progress */}
          <div className="mt-6">
            <div className="flex justify-between mb-1">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>

            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-3"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* 📂 PO FILE SECTION */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6 border">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText size={20} />
            PO File
          </h2>

          {project.poFile ? (
            <div className="flex gap-4">
              <a
                href={project.poFile}
                target="_blank"
                rel="noreferrer"
                className="bg-blue-600 text-white px-4 py-2 rounded-xl"
              >
                View PO
              </a>

              <a
                href={project.poFile}
                target="_blank"
                rel="noreferrer"
                className="bg-green-600 text-white px-4 py-2 rounded-xl"
              >
                Download PO
              </a>
            </div>
          ) : (
            <p className="text-gray-500">No PO uploaded</p>
          )}

          {/* Later: Add Upload Modal Button */}
        </div>

        {/* 💰 BILLING SECTION */}
        <div className="bg-white rounded-3xl shadow-sm p-6 border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Bills / Invoices</h2>

            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <Plus size={18} />
              Add Bill
            </button>
          </div>

          {/* Placeholder */}
          <div className="text-gray-500 text-sm">
            No bills added yet
          </div>
        </div>

      </div>
    </div>
  );
}