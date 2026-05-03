import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

export default function EditProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    location: "",
    clientName: "",
    orderNumber: "",
    orderDate: "",
    typeOfWork: "SITC",
    dlpPeriod: "1 Year",
    complitionDate: "",
    manager: "",
    phone: "",
    status: "Active",
    progress: 0,
    poFile: null,
  });

  // 🔹 Fetch project
  const fetchProject = async () => {
    try {
      const res = await fetch(`http://localhost:5000/project-master/get/${projectId}`);
      const data = await res.json();

      const p = data.data;

      setFormData({
        ...p,
        poFile: null, // important
      });

    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, []);

  // 🔹 Handle change
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  // 🔹 Submit update
  const handleUpdate = async () => {
    try {
      const formPayload = new FormData();

      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null) {
          formPayload.append(key, formData[key]);
        }
      });

      const res = await fetch(
        `http://localhost:5000/project-master/update/${projectId}`,
        {
          method: "PUT",
          body: formPayload,
        }
      );

      const result = await res.json();

      if (res.ok) {
        alert("Project updated successfully 🚀");
        navigate(-1);
      } else {
        alert(result.message);
      }

    } catch (err) {
      console.log(err);
      alert("Update failed");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow p-6">

        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-4 text-gray-600"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <h1 className="text-2xl font-bold mb-6">Edit Project</h1>

        <div className="grid md:grid-cols-2 gap-4">

          <input name="name" value={formData.name} onChange={handleChange} placeholder="Project Name" required className="border p-3 rounded-xl" />
          <input name="code" value={formData.code} onChange={handleChange} placeholder="Project Code" required className="border p-3 rounded-xl" />

          <input name="description" value={formData.description} onChange={handleChange} placeholder="Description" className="border p-3 rounded-xl" />
          <input name="location" value={formData.location} onChange={handleChange} placeholder="Location" required className="border p-3 rounded-xl" />

          <input name="clientName" value={formData.clientName} onChange={handleChange} placeholder="Client Name" required className="border p-3 rounded-xl" />
          <input name="orderNumber" value={formData.orderNumber} onChange={handleChange} placeholder="Order Number" className="border p-3 rounded-xl" />

          <input type="date" name="orderDate" value={formData.orderDate} onChange={handleChange} className="border p-3 rounded-xl" />
          <input name="typeOfWork" value={formData.typeOfWork} onChange={handleChange} placeholder="Type of Work" className="border p-3 rounded-xl" />

          <input name="dlpPeriod" value={formData.dlpPeriod} onChange={handleChange} placeholder="DLP Period" className="border p-3 rounded-xl" />
          <input type="date" name="complitionDate" value={formData.complitionDate} onChange={handleChange} className="border p-3 rounded-xl" />

          <input name="manager" value={formData.manager} onChange={handleChange} placeholder="Manager" required className="border p-3 rounded-xl" />
          <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" required className="border p-3 rounded-xl" />

          <select name="status" value={formData.status} onChange={handleChange} className="border p-3 rounded-xl">
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Hold">Hold</option>
          </select>

          <input type="number" name="progress" value={formData.progress} onChange={handleChange} placeholder="Progress %" className="border p-3 rounded-xl" />

          {/* File */}
          <input type="file" name="poFile" onChange={handleChange} className="border p-3 rounded-xl" />

        </div>

        {/* Existing PO */}
        {formData.poFile && (
          <div className="mt-4">
            <a href={formData.poFileUrl} target="_blank" className="text-blue-600 underline">
              View Existing PO
            </a>
          </div>
        )}

        <button
          onClick={handleUpdate}
          className="mt-6 bg-green-600 text-white px-6 py-3 rounded-xl flex items-center gap-2"
        >
          <Save size={18} />
          Update Project
        </button>

      </div>
    </div>
  );
}